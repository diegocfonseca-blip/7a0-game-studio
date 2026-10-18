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

// 🎯 17/10 (2ª conversa): *"vareie sempre os tipos de bônus… artilheiros de outras competições, campeão de outras copas,
// Supercopa, Mundial, Libertadores, Champions, Série A…"* — o catálogo cresceu. Cada meta diz QUANDO é conferida:
//   'fecho' = no fecho da temporada (liga + Copa do Brasil/Legends + Supercopa) · 'intl' = no fim da campanha internacional.
export type MasterMetaId =
  | 'campeao' | 'acesso' | 'g4' | 'metade' | 'nao_cair' | 'artilheiro'
  | 'copa_campeao' | 'copa_final' | 'art_copa' | 'super_campeao'
  | 'continental' | 'mundial' | 'art_intl'
export const MASTER_METAS: Record<MasterMetaId, { emoji: string; pt: string; en: string; mult: number; quando: 'fecho' | 'intl' }> = {
  campeao: { emoji: '👑', pt: 'Ser campeão da divisão', en: 'Win the division', mult: 3, quando: 'fecho' },
  acesso: { emoji: '🚀', pt: 'Subir de divisão', en: 'Get promoted', mult: 2, quando: 'fecho' },
  g4: { emoji: '🏅', pt: 'Terminar no G4', en: 'Finish in the top 4', mult: 2, quando: 'fecho' },
  metade: { emoji: '📈', pt: 'Terminar na metade de cima', en: 'Finish in the top half', mult: 1, quando: 'fecho' },
  nao_cair: { emoji: '🛡️', pt: 'Não cair', en: 'Avoid relegation', mult: 0.5, quando: 'fecho' },
  artilheiro: { emoji: '⚽', pt: 'Ter o artilheiro da divisão', en: 'Have the division top scorer', mult: 1.25, quando: 'fecho' },
  copa_campeao: { emoji: '🏆', pt: 'Ganhar a Copa', en: 'Win the Cup', mult: 2.5, quando: 'fecho' },
  copa_final: { emoji: '🥈', pt: 'Chegar na final da Copa', en: 'Reach the Cup final', mult: 1.5, quando: 'fecho' },
  art_copa: { emoji: '⚽', pt: 'Ter o artilheiro da Copa', en: 'Have the Cup top scorer', mult: 1.25, quando: 'fecho' },
  super_campeao: { emoji: '🔵', pt: 'Ganhar a Supercopa', en: 'Win the Supercopa', mult: 2.5, quando: 'fecho' },
  continental: { emoji: '🌎', pt: 'Ganhar a Libertadores ou a Champions', en: 'Win the Libertadores or the Champions', mult: 4, quando: 'intl' },
  mundial: { emoji: '🌐', pt: 'Ganhar o Mundial de Clubes', en: 'Win the Club World Cup', mult: 5, quando: 'intl' },
  art_intl: { emoji: '⚽', pt: 'Ter o artilheiro da Liberta, Champions ou Mundial', en: 'Have the top scorer of the Libertadores, Champions or Club World Cup', mult: 2, quando: 'intl' },
}
/** o que aconteceu na temporada, pra conferir as metas do fecho. `tags` vem da tela (copas), o resto do motor. */
export interface MasterFecho { pos: number; div: string; artLiga: boolean; tags: string[] }
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
/** as metas que FAZEM SENTIDO pra este clube: na Várzea não dá pra cair; na A não dá pra subir; as internacionais só a
 *  partir da temporada 40, na carreira solo (`intl`). */
export function metasDaDivisao(div: string, intl = false): MasterMetaId[] {
  const out: MasterMetaId[] = ['campeao', 'metade', 'artilheiro', 'copa_campeao', 'copa_final', 'art_copa', 'super_campeao']
  out.push(div === 'A' ? 'g4' : 'acesso')
  if (div !== 'V') out.push('nao_cair')
  // as internacionais só pra quem está perto de ser convidado (Série A e B) — meta impossível só frustra
  if (intl && (div === 'A' || div === 'B')) out.push('continental', 'mundial', 'art_intl')
  return out
}
/** a carreira tem campanha internacional nesta temporada? (mesma régua da tela: solo, temporada 40+) */
export function masterIntlAberto(season: number, online: boolean): boolean { return !online && season >= 40 }
export function masterMetaBonus(div: string, meta: MasterMetaId): number {
  return Math.max(1, Math.round((MASTER_BASE[div] ?? 0) * MASTER_METAS[meta].mult))
}
/** a meta que a marca traz NESTA virada, pra ESTE clube. Presa na semente: a tela mostra e o motor assina a mesma. */
export function masterMetaOferta(seed: number, season: number, mgrId: number, brandId: string, div: string, intl = false): MasterMeta {
  const lista = metasDaDivisao(div, intl)
  const meta = lista[hash(`${seed}|${season}|${mgrId}|${brandId}|meta`) % lista.length]
  return { meta, bonus: masterMetaBonus(div, meta) }
}
/** meta do FECHO batida? (as internacionais nunca batem aqui — são conferidas no fim da campanha) */
export function masterMetaBatidaFecho(meta: MasterMetaId, f: MasterFecho): boolean {
  const t = new Set(f.tags)
  switch (meta) {
    case 'campeao': return f.pos === 1
    case 'acesso': return f.div !== 'A' && f.pos <= 4
    case 'g4': return f.pos <= 4
    case 'metade': return f.pos <= 10
    case 'nao_cair': return f.pos <= 16
    case 'artilheiro': return f.artLiga
    case 'copa_campeao': return t.has('copa_campeao')
    case 'copa_final': return t.has('copa_campeao') || t.has('copa_final')
    case 'art_copa': return t.has('art_copa')
    case 'super_campeao': return t.has('super_campeao')
    default: return false
  }
}
/** meta INTERNACIONAL batida? (conferida em FINISH_INTERNATIONAL_CAMPAIGN) */
export function masterMetaBatidaIntl(meta: MasterMetaId, r: { continental: boolean; mundial: boolean; artilheiro: boolean }): boolean {
  if (meta === 'continental') return r.continental
  if (meta === 'mundial') return r.mundial
  if (meta === 'art_intl') return r.artilheiro
  return false
}
/** compatível com a trava antiga: meta batida só pela colocação/artilharia da liga */
export function masterMetaBatida(meta: MasterMetaId, pos: number, div: string, artilheiroLiga: boolean): boolean {
  return masterMetaBatidaFecho(meta, { pos, div, artLiga: artilheiroLiga, tags: [] })
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
export function masterOfertaRenovacao(c: MasterContratoHist | undefined, season: number, div: string, seed: number, mgrId: number, intl = false):
  { brandId: string; anos: number; div: string; porTemporada: number } & MasterMeta | null {
  if (!acabouAgora(c, season) || !c.foiBem || c.recusouRenovar || c.rescindido != null) return null
  const m = masterMetaOferta(seed, season, mgrId, `${c.brandId}-renova`, div, intl)
  return { brandId: c.brandId, anos: c.anos, div, porTemporada: Math.round(masterPorTemporada(div, c.anos) * RENOVA_MULT), ...m }
}
/** a marca que NÃO entra nos papéis desta virada: a que você recusou ou a que rescindiu */
export function masterMarcaFora(c: MasterContratoHist | undefined, season: number): string | null {
  if (!acabouAgora(c, season)) return null
  return c.recusouRenovar || c.rescindido != null ? c.brandId : null
}
