// ─── 🏟️ ESTÁDIO da carreira — dados e regras (módulo PURO, sem React) ────
// Usado pela tela (estadio.tsx) e pelo reducer (store.tsx). O estádio é do
// TÉCNICO (por id de manager no save da carreira): investe aos poucos nas
// arquibancadas, melhorias destravam em árvore, e TUDO rende moeda por
// temporada — o ralo de dinheiro que dá motivo pra seguir ganhando.

export interface StadiumSave { inv: Record<string, number>; ext: string[] }

export const STADIUM_STEP = 20 // moedas por clique de "investir" num setor

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
// renda por TEMPORADA: setores proporcionais ao construído + melhorias fixas
export function stadiumIncome(st: StadiumSave | undefined): number {
  if (!st) return 0
  let r = 0
  for (const s of STADIUM_SECTORS) r += Math.floor(s.inc * sectorPct(st, s.k) / 100)
  for (const e of STADIUM_EXTRAS) if (hasExtra(st, e.k)) r += e.inc
  return r
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
