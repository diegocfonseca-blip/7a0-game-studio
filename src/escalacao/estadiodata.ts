// ─── 🏟️ ESTÁDIO da carreira — dados e regras (módulo PURO, sem React) ────
// Usado pela tela (estadio.tsx) e pelo reducer (store.tsx). O estádio é do
// TÉCNICO (por id de manager no save da carreira): investe aos poucos nas
// arquibancadas, melhorias destravam em árvore, e TUDO rende moeda por
// temporada — o ralo de dinheiro que dá motivo pra seguir ganhando.

export interface StadiumSave { inv: Record<string, number>; ext: string[] }

export const STADIUM_STEP = 20 // moedas por clique de "investir" num setor
// 🎟️ BILHETERIA-BASE: todo clube tem um estádio que já vende ingresso — mesmo
// sem investir nada, rende isto por temporada (desde a 1ª). O que você constrói
// (setores + melhorias) SOMA em cima. Dá oxigênio pro meio de tabela sem inventar
// uma "renda solta": a grana vem do estádio, claro na tela. Máximo = 20 + 56 = 76.
export const STADIUM_BASE = 20

export interface StadiumSector { k: string; n: string; cost: number; inc: number; seats: number }
// 🌱 GRAMADO é o PRIMEIRO setor da árvore (Diego 05/08): TODO estádio nasce
// terra batida com buraco — mesmo carreira que já estava rolando (save antigo:
// sectorPct lê inv['grama'] ⁇ 0, então começa em 0% igual todo mundo). Vai
// enchendo de verde igual qualquer setor (clica, investe 20 em 20, % sobe) —
// e quando fica 100% é o MESMO gramado bonito de sempre, sem mudar nada nele.
export const STADIUM_SECTORS: StadiumSector[] = [
  { k: 'grama',     n: '🌱 Gramado',  cost: 60,  inc: 4,  seats: 0 },
  { k: 'geral',     n: 'Geral',     cost: 60,  inc: 4,  seats: 21500 },
  { k: 'cadeiras',  n: 'Cadeiras',  cost: 90,  inc: 6,  seats: 18500 },
  { k: 'visitante', n: 'Visitante', cost: 120, inc: 8,  seats: 22838 },
  { k: 'camarote',  n: 'Camarote',  cost: 150, inc: 10, seats: 16000 },
]

export interface StadiumExtra { k: string; n: string; cost: number; inc: number; reqTxt: string; perk?: string }
export const STADIUM_EXTRAS: StadiumExtra[] = [
  { k: 'refl',  n: '💡 Refletores',       cost: 50,  inc: 2, reqTxt: 'Geral 100%' },
  { k: 'telao', n: '📺 Telão',            cost: 60,  inc: 3, reqTxt: 'Cadeiras 100%' },
  { k: 'loja',  n: '🛍️ Loja do Clube',    cost: 80,  inc: 6, reqTxt: '2 setores prontos' },
  { k: 'estac', n: '🅿️ Estacionamento',   cost: 70,  inc: 4, reqTxt: 'Loja do Clube' },
  { k: 'cober', n: '☂️ Cobertura',        cost: 130, inc: 8, reqTxt: '4 setores prontos' },
  // 🏥 não rende moeda: o "lucro" dele é acabar com as LESÕES pra sempre (eventos
  // de jogador). Última obra antes da SAF (a SAF exige TODAS as melhorias).
  { k: 'medico', n: '🏥 Departamento Médico', cost: 1000, inc: 0, reqTxt: 'Cobertura', perk: 'acaba com as lesões PRA SEMPRE' },
]

export const emptyStadium = (): StadiumSave => ({ inv: {}, ext: [] })

// ─── 🤝 PATROCÍNIO POR APOSTA (carreira, 05/08) ────────────────────────────
// Modelo novo (substitui o antigo "escolhe a marca, ganha fixo por divisão"):
// toda temporada, ANTES de começar, o técnico aposta num dos 3 níveis de meta.
// Bate a meta → ganha o valor do nível escolhido. Ficou AQUÉM da meta (ex.:
// apostou "não cair" e caiu) → NÃO ganha nada. Superou a meta (ex.: apostou
// "não cair" e foi campeão) → ganha só o valor apostado, nunca o do nível
// maior — quem mirou baixo "deu mole" e perde o resto do prêmio.
export type SponsorBetTier = 1 | 2 | 3
export const SPONSOR_BET_META: Record<SponsorBetTier, { label: string; emoji: string; desc: string }> = {
  1: { label: 'Não cair de divisão', emoji: '🛡️', desc: 'Aposta segura: termine fora da zona de rebaixamento (fora do Z4).' },
  2: { label: 'Acesso (top 4)', emoji: '📈', desc: 'Termine entre os 4 primeiros da sua divisão.' },
  3: { label: 'Campeão (liga ou copa)', emoji: '👑', desc: 'Seja CAMPEÃO — da liga ou da Copa Legends. Ganhar as duas não dobra o prêmio.' },
}
// 💰 quanto paga cada nível, por divisão — dobra a cada divisão (Diego 05/08):
// Várzea 1/2/3 · D 2/4/6 · C 4/8/12 · B 8/16/24 · A 16/32/48.
export const SPONSOR_BET_PAY: Record<string, [number, number, number]> = {
  V: [1, 2, 3], D: [2, 4, 6], C: [4, 8, 12], B: [8, 16, 24], A: [16, 32, 48],
}
export interface SponsorBrand { id: string; name: string; emoji: string; color: string; tier: SponsorBetTier; logo?: 'vadico' | 'ero' }
// 3 marcas por nível — a marca é só IDENTIDADE (todas do mesmo nível pagam igual).
export const SPONSOR_BRANDS: SponsorBrand[] = [
  { id: 'padaria',     name: 'Padaria do Zé',        emoji: '🥖', color: '#B5651D', tier: 1 },
  { id: 'acougue',     name: 'Açougue Bom Corte',    emoji: '🥩', color: '#8A1E1E', tier: 1 },
  { id: 'paredao',     name: 'Paredão Materiais',     emoji: '🔧', color: '#C1571F', tier: 1 },
  { id: 'espetinho',   name: 'Espetinho do Baixinho', emoji: '🍗', color: '#8A1E1E', tier: 2 },
  { id: 'borracharia', name: 'Borracharia do Gordo',  emoji: '🛞', color: '#1C1C1C', tier: 2 },
  { id: 'guarana',     name: 'Guaraná Craque',        emoji: '🥤', color: '#127A33', tier: 2 },
  { id: 'vadico',      name: 'Vadico Veículos',       emoji: '🚗', color: '#0E3E86', tier: 3, logo: 'vadico' },
  { id: 'ero',         name: 'ERO Odontologia',       emoji: '🦷', color: '#2E6C9E', tier: 3, logo: 'ero' }, // amigo do Diego (05/08)
  { id: 'diamante',    name: 'Diamante Joias',        emoji: '💎', color: '#7C3AED', tier: 3 },
]
export function sponsorBrandsOfTier(tier: SponsorBetTier): SponsorBrand[] { return SPONSOR_BRANDS.filter(b => b.tier === tier) }
export function sponsorBrandOf(id?: string): SponsorBrand | undefined { return SPONSOR_BRANDS.find(b => b.id === id) }
// valor da aposta pro nível+divisão (0 se divisão desconhecida)
export function sponsorBetValue(div: string, tier: SponsorBetTier): number { return (SPONSOR_BET_PAY[div] ?? [0, 0, 0])[tier - 1] }
// bateu a meta escolhida? pos = colocação final (1 = campeão) na divisão `div`.
export function sponsorBetHit(tier: SponsorBetTier, pos: number, champDiv: boolean, champCopa: boolean): boolean {
  if (tier === 3) return champDiv || champCopa
  if (tier === 2) return pos <= 4
  return pos <= 16 // 🛡️ não cair: fora da zona de rebaixamento (Z4 de 20 times)
}

// % construído de um setor (0–100), a partir das moedas investidas
export function sectorPct(st: StadiumSave | undefined, k: string): number {
  // 🌱 MIGRAÇÃO: quem já tinha comprado "Gramado de Elite" (a melhoria antiga,
  // hoje virou este setor) fica com o gramado PRONTO — ninguém perde o que já
  // pagou. Só quem nunca comprou nasce (ou continua) na terra batida.
  if (k === 'grama' && st?.ext.includes('grama')) return 100
  const sec = STADIUM_SECTORS.find(s => s.k === k)
  if (!sec) return 0
  return Math.min(100, Math.round(((st?.inv[k] ?? 0) / sec.cost) * 100))
}
export function sectorsDone(st: StadiumSave | undefined): number {
  return STADIUM_SECTORS.filter(s => sectorPct(st, s.k) >= 100).length
}
export function hasExtra(st: StadiumSave | undefined, k: string): boolean {
  return !!st?.ext.includes(k)
}
// melhoria destravada? (árvore de requisitos)
export function extraUnlocked(st: StadiumSave | undefined, k: string): boolean {
  switch (k) {
    case 'refl':  return sectorPct(st, 'geral') >= 100
    case 'telao': return sectorPct(st, 'cadeiras') >= 100
    case 'loja':  return sectorsDone(st) >= 2
    case 'estac': return hasExtra(st, 'loja')
    case 'cober': return sectorsDone(st) >= 4
    case 'medico': return hasExtra(st, 'cober') // 🏥 a última obra da árvore (depois vem a SAF)
    default: return false
  }
}
// renda por TEMPORADA: BILHETERIA-BASE + setores proporcionais ao construído +
// melhorias fixas. A base vale mesmo com o estádio zerado (st indefinido).
export function stadiumIncome(st: StadiumSave | undefined): number {
  let r = STADIUM_BASE
  if (st) {
    for (const s of STADIUM_SECTORS) r += Math.floor(s.inc * sectorPct(st, s.k) / 100)
    for (const e of STADIUM_EXTRAS) if (hasExtra(st, e.k)) r += e.inc
  }
  return r
}
// só a parte CONSTRUÍDA (sem a base) — pra mostrar a conta separada na tela.
export function stadiumBuiltIncome(st: StadiumSave | undefined): number {
  return stadiumIncome(st) - STADIUM_BASE
}
export function stadiumSeats(st: StadiumSave | undefined): { now: number; max: number } {
  let now = 0, max = 0
  for (const s of STADIUM_SECTORS) { now += Math.round(s.seats * sectorPct(st, s.k) / 100); max += s.seats }
  return { now, max }
}
// nível/apelido do estádio pelo total de peças prontas (setores + melhorias)
export function stadiumLevel(st: StadiumSave | undefined): { n: number; name: string } {
  const n = sectorsDone(st) + STADIUM_EXTRAS.filter(e => hasExtra(st, e.k)).length
  const name = n >= 9 ? '👑 Templo Legends' : n >= 6 ? '🏟️ Arena Legends' : n >= 4 ? '🏛️ Estádio Municipal' : n >= 2 ? '🪵 Estádio de Bairro' : n >= 1 ? '🚧 Canteiro de Obras' : '🌱 Campo de Várzea'
  return { n, name }
}
export function stadiumComplete(st: StadiumSave | undefined): boolean {
  return sectorsDone(st) >= STADIUM_SECTORS.length && STADIUM_EXTRAS.every(e => hasExtra(st, e.k))
}

// ─── 💼 EMPRESÁRIO — renda das cartas ganhas NA carreira (por raridade) ─────
// Cada carta que o técnico ganha no pacote de campeão entra na "agência" do save
// (começa vazia pra todo mundo). Cada categoria rende um fixo por temporada e só
// conta quando DESBLOQUEADA — puxando o estádio e a SAF. Só a base é livre.
export type EmpCat = 'prof' | 'bom' | 'promessa' | 'craque' | 'lenda'
export const EMP_ORDER: EmpCat[] = ['lenda', 'craque', 'promessa', 'bom', 'prof']
export const EMP_META: Record<EmpCat, { label: string; emoji: string; value: number; req: string }> = {
  lenda:    { label: 'Lenda',            emoji: '👑', value: 6, req: 'comprar a SAF' },
  craque:   { label: 'Craque',           emoji: '⭐', value: 4, req: 'estádio 100% completo' },
  promessa: { label: 'Promessa',         emoji: '💎', value: 3, req: '3 setores prontos' },
  bom:      { label: 'Bom Jogador',      emoji: '📇', value: 2, req: '1 setor do estádio pronto' },
  prof:     { label: 'Foi Profissional', emoji: '💼', value: 1, req: 'livre' },
}
// categoria de uma carta pela raridade (promessa manda; senão pela fama)
export function empCat(c: { fame?: number; promessa?: boolean }): EmpCat {
  if (c.promessa) return 'promessa'
  const f = c.fame ?? 1
  return f >= 5 ? 'lenda' : f === 4 ? 'craque' : f >= 2 ? 'bom' : 'prof'
}
// categoria desbloqueada? (gates ligados ao estádio/SAF — grandfather automático:
// quem já completou/comprou já entra destravado)
export function empCatUnlocked(cat: EmpCat, st: StadiumSave | undefined, hasFilial: boolean): boolean {
  switch (cat) {
    case 'prof': return true
    case 'bom': return sectorsDone(st) >= 1
    case 'promessa': return sectorsDone(st) >= 3
    // ⚠️ NÃO usa stadiumComplete(): quando o 🏥 Dep. Médico entrou na lista de
    // melhorias, quem JÁ tinha o estádio 100% não pode PERDER a renda de Craque
    // até construir o médico (grandfather). O gate segue sendo o estádio "clássico".
    case 'craque': return sectorsDone(st) >= STADIUM_SECTORS.length && STADIUM_EXTRAS.every(e => e.k === 'medico' || hasExtra(st, e.k))
    case 'lenda': return hasFilial
    default: return false
  }
}
// ─── 🕴️ AGÊNCIA 2.0 (carreira solo NOVA) — os 22 "na ativa" ─────────────────
// Valores por categoria decididos pelo Diego: lenda vale 5 AQUI (o empresário
// clássico dos saves antigos segue com 6) + carta FOLCLÓRICA ganha +1 por cima.
// Os desbloqueios são os MESMOS do empresário clássico (estádio/SAF).
export const AG_VALUES: Record<EmpCat, number> = { lenda: 5, craque: 4, promessa: 3, bom: 2, prof: 1 }
export const AG_FOLK_BONUS = 1
export function agenciaRenda(cards: { fame?: number; promessa?: boolean; folk?: boolean }[] | undefined, st: StadiumSave | undefined, hasFilial: boolean): { total: number; by: Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }>; folkCount: number; folkIncome: number } {
  const by = {} as Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }>
  for (const k of EMP_ORDER) by[k] = { count: 0, unlocked: empCatUnlocked(k, st, hasFilial), value: AG_VALUES[k], income: 0 }
  let folkCount = 0, folkIncome = 0
  for (const c of cards ?? []) {
    const k = empCat(c)
    by[k].count++
    // bônus folclórico só rende junto com a categoria destravada (anda colado nela)
    if (c.folk) { folkCount++; if (by[k].unlocked) folkIncome += AG_FOLK_BONUS }
  }
  let total = folkIncome
  for (const k of EMP_ORDER) { const b = by[k]; b.income = b.unlocked ? b.count * b.value : 0; total += b.income }
  return { total, by, folkCount, folkIncome }
}

// renda por temporada + detalhamento por categoria (só as desbloqueadas rendem)
export function empresarioIncome(cards: { fame?: number; promessa?: boolean }[] | undefined, st: StadiumSave | undefined, hasFilial: boolean): { total: number; by: Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }> } {
  const by = {} as Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }>
  for (const k of EMP_ORDER) by[k] = { count: 0, unlocked: empCatUnlocked(k, st, hasFilial), value: EMP_META[k].value, income: 0 }
  for (const c of cards ?? []) by[empCat(c)].count++
  let total = 0
  for (const k of EMP_ORDER) { const b = by[k]; b.income = b.unlocked ? b.count * b.value : 0; total += b.income }
  return { total, by }
}
