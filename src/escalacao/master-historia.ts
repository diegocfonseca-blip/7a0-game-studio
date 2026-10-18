// 🏆📞 PATROCINADOR MASTER COM HISTÓRIA (17/10, mockup `scripts/mockups/master-historia.png`, Diego: "aprovo, pode fazer os 3").
// Motivo: *"não tá fazendo sentido… todo mundo sempre escolhe a Vadico, que rende mais em 5 anos"*. O valor por temporada
// continua o de sempre (`masterPorTemporada`); o que muda a escolha são três coisas:
//   1. 🎯 META: cada contrato vem com uma meta da marca, sorteada (presa na semente + temporada + clube + marca, então a tela
//      e o motor sempre veem a MESMA). Bateu a meta no ano → bônus no fecho da temporada. Não dá pra decorar.
//   2. 📞 LIGAÇÃO: o contrato acabou e o clube FOI BEM durante ele (bateu a meta ou terminou no top 4 alguma vez)? A própria
//      marca liga oferecendo renovar por +25% (`RENOVA_MULT`) e uma meta nova. Renova ou ouve o mercado — e quem recusa, a
//      marca vai embora (não aparece nos papéis daquela virada).
//   3. 💔 RESCISÃO: caiu de divisão com contrato ainda correndo? Em 1 de cada 2 casos (sorteio preso na semente) a marca
//      rasga o contrato, paga UMA temporada de multa e o clube volta pro mercado na virada. Também sai daquela virada.
// Tudo puro aqui; o dinheiro e o estado moram no `store.tsx` (`applyMasterHistoria`, `MASTER_RENOVAR`, `MASTER_MERCADO`).
import { MASTER_BASE, masterPorTemporada, type MasterContrato } from './estadiodata'

export type MasterMetaId = 'campeao' | 'acesso' | 'g4' | 'artilheiro' | 'metade' | 'nao_cair'
export const MASTER_METAS: Record<MasterMetaId, { emoji: string; pt: string; en: string; mult: number }> = {
  campeao: { emoji: '👑', pt: 'Ser campeão da divisão', en: 'Win the division', mult: 3 },
  acesso: { emoji: '🚀', pt: 'Subir de divisão', en: 'Get promoted', mult: 2 },
  g4: { emoji: '🏅', pt: 'Terminar no G4', en: 'Finish in the top 4', mult: 2 },
  artilheiro: { emoji: '⚽', pt: 'Ter o artilheiro da divisão', en: 'Have the division top scorer', mult: 1.25 },
  metade: { emoji: '📈', pt: 'Terminar na metade de cima', en: 'Finish in the top half', mult: 1 },
  nao_cair: { emoji: '🛡️', pt: 'Não cair', en: 'Avoid relegation', mult: 0.5 },
}
/** a renovação paga 25% acima da régua da divisão de hoje */
export const RENOVA_MULT = 1.25

export interface MasterMeta { meta: MasterMetaId; bonus: number }
/** os campos novos que o contrato ganha (todos opcionais: contrato antigo continua valendo como era) */
export type MasterContratoHist = MasterContrato & {
  meta?: MasterMetaId; bonus?: number
  foiBem?: boolean          // bateu a meta ou terminou no top 4 em alguma temporada → a marca liga no fim
  recusouRenovar?: boolean  // ouviu o mercado → a marca saiu
  rescindido?: number       // temporada em que a marca rasgou o contrato (caiu)
  multa?: number
  renovado?: boolean
}

// hash simples e estável (mesma entrada → mesmo número, em qualquer aparelho)
function hash(txt: string): number {
  let h = 2166136261
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
/** as metas que FAZEM SENTIDO em cada divisão: na Várzea não dá pra cair; na A não dá pra subir */
export function metasDaDivisao(div: string): MasterMetaId[] {
  if (div === 'V') return ['campeao', 'acesso', 'artilheiro', 'metade']
  if (div === 'A') return ['campeao', 'g4', 'artilheiro', 'metade', 'nao_cair']
  return ['campeao', 'acesso', 'artilheiro', 'metade', 'nao_cair']
}
export function masterMetaBonus(div: string, meta: MasterMetaId): number {
  return Math.max(1, Math.round((MASTER_BASE[div] ?? 0) * MASTER_METAS[meta].mult))
}
/** a meta que a marca traz NESTA virada, pra ESTE clube. Presa na semente: a tela mostra e o motor assina a mesma. */
export function masterMetaOferta(seed: number, season: number, mgrId: number, brandId: string, div: string): MasterMeta {
  const lista = metasDaDivisao(div)
  const meta = lista[hash(`${seed}|${season}|${mgrId}|${brandId}|meta`) % lista.length]
  return { meta, bonus: masterMetaBonus(div, meta) }
}
/** a meta foi batida? `pos` = colocação final na divisão jogada (1–20) · `artilheiroLiga` = o artilheiro da divisão é seu */
export function masterMetaBatida(meta: MasterMetaId, pos: number, div: string, artilheiroLiga: boolean): boolean {
  switch (meta) {
    case 'campeao': return pos === 1
    case 'acesso': return div !== 'A' && pos <= 4
    case 'g4': return pos <= 4
    case 'artilheiro': return artilheiroLiga
    case 'metade': return pos <= 10
    case 'nao_cair': return pos <= 16
  }
}
/** caiu de divisão? (17º ao 20º; na Várzea não existe queda) */
export function masterCaiu(pos: number, div: string): boolean { return div !== 'V' && pos >= 17 }
/** a marca rasga o contrato de quem caiu? 1 em 2, preso na semente */
export function masterRescinde(seed: number, season: number, mgrId: number, brandId: string): boolean {
  return hash(`${seed}|${season}|${mgrId}|${brandId}|rescisao`) % 2 === 0
}
/** o contrato que acabou de terminar (termina exatamente NESTA temporada nova) — é ele que gera ligação/aviso */
function acabouAgora(c: MasterContratoHist | undefined, season: number): c is MasterContratoHist {
  return !!c && c.desde + c.anos === season
}
/** 📞 a proposta de renovação desta virada (ou null). `div` = a divisão de AGORA. */
export function masterOfertaRenovacao(c: MasterContratoHist | undefined, season: number, div: string, seed: number, mgrId: number):
  { brandId: string; anos: number; div: string; porTemporada: number } & MasterMeta | null {
  if (!acabouAgora(c, season) || !c.foiBem || c.recusouRenovar || c.rescindido != null) return null
  const m = masterMetaOferta(seed, season, mgrId, `${c.brandId}-renova`, div)
  return { brandId: c.brandId, anos: c.anos, div, porTemporada: Math.round(masterPorTemporada(div, c.anos) * RENOVA_MULT), ...m }
}
/** a marca que NÃO entra nos papéis desta virada: a que você recusou ou a que rescindiu */
export function masterMarcaFora(c: MasterContratoHist | undefined, season: number): string | null {
  if (!acabouAgora(c, season)) return null
  return c.recusouRenovar || c.rescindido != null ? c.brandId : null
}
