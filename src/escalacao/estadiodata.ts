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
export const STADIUM_SECTORS: StadiumSector[] = [
  { k: 'geral',     n: 'Geral',     cost: 60,  inc: 4,  seats: 21500 },
  { k: 'cadeiras',  n: 'Cadeiras',  cost: 90,  inc: 6,  seats: 18500 },
  { k: 'visitante', n: 'Visitante', cost: 120, inc: 8,  seats: 22838 },
  { k: 'camarote',  n: 'Camarote',  cost: 150, inc: 10, seats: 16000 },
]

export interface StadiumExtra { k: string; n: string; cost: number; inc: number; reqTxt: string }
export const STADIUM_EXTRAS: StadiumExtra[] = [
  { k: 'refl',  n: '💡 Refletores',       cost: 50,  inc: 2, reqTxt: 'Geral 100%' },
  { k: 'telao', n: '📺 Telão',            cost: 60,  inc: 3, reqTxt: 'Cadeiras 100%' },
  { k: 'loja',  n: '🛍️ Loja do Clube',    cost: 80,  inc: 6, reqTxt: '2 setores prontos' },
  { k: 'estac', n: '🅿️ Estacionamento',   cost: 70,  inc: 4, reqTxt: 'Loja do Clube' },
  { k: 'grama', n: '🌿 Gramado de Elite', cost: 90,  inc: 5, reqTxt: '3 setores prontos' },
  { k: 'cober', n: '☂️ Cobertura',        cost: 130, inc: 8, reqTxt: '4 setores prontos' },
]

export const emptyStadium = (): StadiumSave => ({ inv: {}, ext: [] })

// ─── 👕 PATROCÍNIO (carreira) ─────────────────────────────────────────────
// Renda por temporada que CRESCE com a divisão (Série D não atrai marca).
// A escolha entre as marcas da sua divisão é só de IDENTIDADE — todas pagam o
// mesmo valor da divisão. Marcas maiores só destravam ao subir.
export const SPONSOR_PAY: Record<string, number> = { D: 0, C: 5, B: 10, A: 20 }
export interface Sponsor { id: string; name: string; emoji: string; color: string; div: 'C' | 'B' | 'A'; logo?: boolean }
export const SPONSORS: Sponsor[] = [
  { id: 'paredao',     name: 'Paredão Materiais',     emoji: '🔧', color: '#C1571F', div: 'C' },
  { id: 'espetinho',   name: 'Espetinho do Baixinho', emoji: '🍗', color: '#8A1E1E', div: 'C' },
  { id: 'borracharia', name: 'Borracharia do Gordo',  emoji: '🛞', color: '#1C1C1C', div: 'B' },
  { id: 'guarana',     name: 'Guaraná Craque',        emoji: '🥤', color: '#127A33', div: 'B' },
  { id: 'vadico',      name: 'Vadico Veículos',       emoji: '🚗', color: '#0E3E86', div: 'A', logo: true },
]
const DIV_RANK_SP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 } // menor = melhor
// marcas que dá pra ESCOLHER na divisão atual (as da própria divisão)
export function sponsorsForDiv(div: string): Sponsor[] { return SPONSORS.filter(s => s.div === div) }
// marcas de divisões ACIMA (melhores) — mostradas bloqueadas, como meta
export function sponsorsLocked(div: string): Sponsor[] { return SPONSORS.filter(s => DIV_RANK_SP[s.div] < (DIV_RANK_SP[div] ?? 3)) }
// a marca válida pra divisão atual (a escolhida, se serve; senão a 1ª da divisão)
export function currentSponsor(div: string, chosenId?: string): Sponsor | undefined {
  const opts = sponsorsForDiv(div)
  return opts.find(s => s.id === chosenId) ?? opts[0]
}

// % construído de um setor (0–100), a partir das moedas investidas
export function sectorPct(st: StadiumSave | undefined, k: string): number {
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
    case 'grama': return sectorsDone(st) >= 3
    case 'cober': return sectorsDone(st) >= 4
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
export function stadiumLevel(st: StadiumSave | undefined, bb = false, en = false): { n: number; name: string } {
  const n = sectorsDone(st) + STADIUM_EXTRAS.filter(e => hasExtra(st, e.k)).length
  // 🏀 basquete = nomes de QUADRA/ARENA (bilíngue); ⚽ futebol = estádio (PT, idêntico).
  const name = bb
    ? (n >= 9 ? (en ? '👑 Basketball Temple' : '👑 Templo do Basquete') : n >= 6 ? (en ? '🏟️ Arena' : '🏟️ Arena') : n >= 4 ? (en ? '🏛️ City Arena' : '🏛️ Ginásio Municipal') : n >= 2 ? (en ? '🏫 Community Gym' : '🏫 Ginásio de Bairro') : n >= 1 ? (en ? '🚧 Under Construction' : '🚧 Em Obras') : (en ? '🏀 Street Court' : '🏀 Quadra de Rua'))
    : (n >= 9 ? '👑 Templo Legends' : n >= 6 ? '🏟️ Arena Legends' : n >= 4 ? '🏛️ Estádio Municipal' : n >= 2 ? '🪵 Estádio de Bairro' : n >= 1 ? '🚧 Canteiro de Obras' : '🌱 Campo de Várzea')
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
export function empCatUnlocked(cat: EmpCat, st: StadiumSave | undefined, hasFilial: boolean, bb = false): boolean {
  switch (cat) {
    case 'prof': return true
    case 'bom': return sectorsDone(st) >= 1
    case 'promessa': return sectorsDone(st) >= 3
    case 'craque': return stadiumComplete(st)
    // 🏀 basquete NÃO tem SAF: a categoria LENDA destrava pela ARENA 100% completa
    // (o teto do basquete). Futebol segue exigindo a SAF (hasFilial), idêntico.
    case 'lenda': return bb ? stadiumComplete(st) : hasFilial
    default: return false
  }
}
// renda por temporada + detalhamento por categoria (só as desbloqueadas rendem)
export function empresarioIncome(cards: { fame?: number; promessa?: boolean }[] | undefined, st: StadiumSave | undefined, hasFilial: boolean, bb = false): { total: number; by: Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }> } {
  const by = {} as Record<EmpCat, { count: number; unlocked: boolean; value: number; income: number }>
  for (const k of EMP_ORDER) by[k] = { count: 0, unlocked: empCatUnlocked(k, st, hasFilial, bb), value: EMP_META[k].value, income: 0 }
  for (const c of cards ?? []) by[empCat(c)].count++
  let total = 0
  for (const k of EMP_ORDER) { const b = by[k]; b.income = b.unlocked ? b.count * b.value : 0; total += b.income }
  return { total, by }
}
