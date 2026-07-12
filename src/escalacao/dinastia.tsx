// ─── MODO DINASTIA (teste — só criador) ──────────────────────────────
// Modo econômico à la Brasfoot/Elifoot num MUNDO FIXO: cada jogador vive
// num clube ano após ano. Comece duro na Série D, monte time no PREGÃO
// (leilão cego, com os rivais que você escolhe), suba de divisão e
// ENRIQUEÇA. Duas carteiras: Caixa do Clube e Fortuna Pessoal (ostentação).
//
// Contratar craque de outro clube = LEILÃO DE CONTRATAÇÃO: você clica no
// jogador e o põe em leilão; o CLUBE DONO entra junto pra segurá-lo e
// outros clubes podem brigar. Maior lance leva (ou o dono mantém). Vender
// = leilão com risco.
//
// ISOLADO DE PROPÓSITO: estado próprio, localStorage próprio, overlay via
// hash #dinastia + trava no login do criador. NÃO toca em online / rápido /
// carreira — reusa só dados e matemática pura do jogo.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Card, EscState, FormationKey, Sector, WonCard } from './types'
import { CATALOG, DIVISION_TEAMS } from './data'
import { useEsc } from './store'
import { useIsAdmin } from './admin'
import { supabase } from '../lib/supabase'

// ─── visual (mesmos valores do resto do jogo — neubrutalista) ────────
const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const PURPLE = '#7C3AED'
const RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

type Division = 'A' | 'B' | 'C' | 'D'
const DIVS: Division[] = ['D', 'C', 'B', 'A']
const DIV_LABEL: Record<Division, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
// vagas por posição conforme a formação (só o SEU time varia; o mundo é 4-3-3)
const FORM_NEED: Record<FormationKey, Record<Sector, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const SECTOR_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque' }
const START_COINS = 50

// ─── RNG ──────────────────────────────────────────────────────────────
function mulberry(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ─── pool ──────────────────────────────────────────────────────────────
type PoolCard = Card
function buildPool(): PoolCard[] {
  const out: PoolCard[] = []
  ;(Object.keys(CATALOG) as Sector[]).forEach(pos => { CATALOG[pos].forEach((c, i) => out.push({ ...c, pos, id: `${pos}-${i}` })) })
  return out
}
const POOL = buildPool()
const mid = (c: PoolCard) => (c.lo + c.hi) / 2

let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Café com Leite', 'Pastelão', 'Meia-Boca']
function filler(pos: Sector, rng: () => number): PoolCard {
  const lo = 44 + Math.floor(rng() * 8)
  return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 12 + Math.floor(rng() * 6) }
}

// ─── valor ──────────────────────────────────────────────────────────────
function baseValue(c: PoolCard): number { return Math.max(1, Math.round(Math.pow(Math.max(0, mid(c) - 44) / 8, 1.8))) }
function dynValue(c: PoolCard, goals: number, wonTitle: boolean): number {
  const gw = c.pos === 'ATA' ? 0.8 : c.pos === 'MEI' ? 0.6 : c.pos === 'LAT' ? 0.35 : 0.25
  return Math.max(1, Math.round(baseValue(c) + goals * gw + (wonTitle ? 4 : 0)))
}

// ─── simulação ──────────────────────────────────────────────────────────
function poisson(l: number, rng: () => number): number { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
function sectorPow(rolls: number[]): number { if (rolls.length === 0) return 40; const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length; const min = Math.min(...rolls); return avg - (avg - min) * 0.35 }
type Tac = 'retranca' | 'equilibrio' | 'ataque'
const TACS: Tac[] = ['retranca', 'equilibrio', 'ataque']
function rollForm(squad: PoolCard[], tac: Tac, opp: Tac, rng: () => number) {
  const rolls = squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  let insp = false
  for (const r of rolls) if (r.c.hi - r.c.lo >= 14 && r.lvl >= r.c.hi - 2.5) insp = true
  const by = (p: Sector) => sectorPow(rolls.filter(r => r.c.pos === p).map(r => r.lvl))
  const gol = by('GOL'), lat = by('LAT'), zag = by('ZAG'), mei = by('MEI'), ata = by('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tac === 'retranca') { def += 4; atk -= 3 } if (tac === 'ataque') { atk += 4; def -= 3 } if (tac === 'equilibrio') { atk += 1; def += 1 }
  if (tac === 'retranca' && opp === 'ataque') def += 2.5
  if (tac === 'ataque' && opp === 'equilibrio') atk += 2.5
  if (tac === 'equilibrio' && opp === 'retranca') atk += 2.5
  if (insp) atk += 2
  return { atk, def }
}
interface SimTeam { name: string; you: boolean; wt: WTeam | null; squad: PoolCard[]; pts: number; w: number; d: number; l: number; gf: number; ga: number }
interface Scorer { id: string; name: string; teamName: string; div: Division; goals: number }
function buildFixtures(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i), rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}
// simula um conjunto de rodadas (fatia do calendário), acumulando na tabela e
// na artilharia passadas — permite jogar em dois turnos (janela no meio).
function simFixtures(teams: SimTeam[], div: Division, rng: () => number, scorers: Map<string, Scorer>, rounds: [number, number][][]): void {
  const credit = (t: SimTeam, goals: number) => {
    for (let g = 0; g < goals; g++) {
      const pool = t.squad.map(c => ({ c, w: c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05 }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { id: pick.id, name: pick.name, teamName: t.name, div, goals: 1 })
    }
  }
  for (const round of rounds) for (const [hi, ai] of round) {
    const H = teams[hi], A = teams[ai]
    const th = H.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const ta = A.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.squad, th, ta, rng), fa = rollForm(A.squad, ta, th, rng)
    const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25), la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg; credit(H, hg); credit(A, ag)
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
  }
}
const sortTable = (t: SimTeam[], rng: () => number) => t.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || rng() - 0.5)

// ─── ostentação ──────────────────────────────────────────────────────
interface Lux { id: string; emoji: string; name: string; cost: number }
const LUXURY: Lux[] = [
  { id: 'rolex', emoji: '⌚', name: 'Relógio Rolex', cost: 12 },
  { id: 'corrente', emoji: '📿', name: 'Corrente de ouro', cost: 20 },
  { id: 'carro', emoji: '🏎️', name: 'Ferrari', cost: 45 },
  { id: 'lancha', emoji: '🛥️', name: 'Lancha', cost: 80 },
  { id: 'mansao', emoji: '🏰', name: 'Mansão', cost: 140 },
  { id: 'jatinho', emoji: '🛩️', name: 'Jatinho particular', cost: 300 },
  { id: 'ilha', emoji: '🏝️', name: 'Ilha particular', cost: 650 },
]

// ─── mundo fixo ──────────────────────────────────────────────────────
interface WTeam { name: string; div: Division; squad: PoolCard[]; rival?: boolean }
// ciclo da temporada: janela pré (só da 2ª temporada) → 1º turno → janela do
// meio → returno → resultado. 's1FirstHalf' = pós-pregão da 1ª temporada (sem
// janela pré). canTrade só nas janelas 'preWindow' e 'midWindow'.
type Stage = 's1FirstHalf' | 'preWindow' | 'midWindow'
interface TeamStand { name: string; pts: number; w: number; d: number; l: number; gf: number; ga: number }
interface PartialSeason { standings: Record<Division, TeamStand[]>; scorers: Scorer[] }
const SAVE_KEY = 'esc_dinastia_v2'
interface Save {
  seed: number; clubName: string; formation: FormationKey; division: Division; seasonNo: number
  coins: number; fortune: number; luxury: string[]; titles: number
  squad: WonCard[]; world: WTeam[]
  stage: Stage; partial?: PartialSeason // meio de temporada guarda o 1º turno
  worldGoals: Record<string, number> // gols da última temporada (mundo todo) p/ valorização
  goalsLast: Record<string, number>; championLast: boolean
  contracts?: Record<string, { until: number; floor: number }> // até que temporada + piso (último preço pago)
  requested?: string[] // jogadores que você pediu pro leilão desta janela
  lastResult?: { pos: number; move: 'up' | 'down' | 'stay'; prevDiv: Division; champion: boolean }
}
const CONTRACT = 5 // temporadas de contrato de todo jogador comprado no leilão
// sem reservas por enquanto — todo time tem 11; ao contratar, o pior da posição sai
// piso = último preço pago (vira o mínimo do próximo leilão / da renovação)
const floorOf = (save: Save, c: PoolCard) => save.contracts?.[c.id]?.floor ?? baseValue(c)
const contractUntil = (save: Save, id: string) => save.contracts?.[id]?.until ?? -1
const underContract = (save: Save, id: string) => contractUntil(save, id) >= save.seasonNo
const setContract = (save: Save, id: string, price: number): Record<string, { until: number; floor: number }> =>
  ({ ...(save.contracts ?? {}), [id]: { until: save.seasonNo + CONTRACT, floor: price } })
function loadSave(): Save | null { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function writeSave(s: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* cheio */ } }
const valueOf = (save: Save, c: PoolCard) => dynValue(c, save.worldGoals[c.id] ?? 0, false)
const myValue = (save: Save, c: WonCard) => dynValue(c, save.goalsLast[c.id] ?? 0, save.championLast)

// dá um jogador a um time mantendo 11 (bancando o pior do setor)
function giveToTeam(squad: PoolCard[], card: PoolCard): PoolCard[] {
  const next = [...squad, card]
  const atPos = next.filter(c => c.pos === card.pos).sort((a, b) => mid(b) - mid(a))
  if (atPos.length > NEED[card.pos]) { const drop = atPos[atPos.length - 1]; return next.filter(c => c.id !== drop.id) }
  return next
}
// distribui cartas em N times respeitando a formação
function dealSquads(bucket: PoolCard[], nTeams: number, rng: () => number): PoolCard[][] {
  const squads: PoolCard[][] = Array.from({ length: nTeams }, () => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of bucket) byPos[c.pos].push(c)
  for (const p of SECTORS) { const list = shuffle(byPos[p], rng); for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < nTeams; t++) squads[t].push(list.shift() ?? filler(p, rng)) }
  return squads
}

// joga a temporada no mundo FIXO: simula as 4 divisões, resolve sobe/desce de
// TODA a pirâmide, devolve tabela da sua divisão + artilharias + prêmios.
interface SeasonOut {
  yourTable: SimTeam[]; yourPos: number; youChampion: boolean
  divScorers: Scorer[]; globalScorers: Scorer[]; worldGoals: Record<string, number>
  prize: number; fortuneBonus: number; newWorld: WTeam[]; newDivision: Division; move: 'up' | 'down' | 'stay'
}
const mkSim = (name: string, squad: PoolCard[], you: boolean, wt: WTeam | null): SimTeam => ({ name, you, wt, squad, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
// escala o MELHOR XI (reservas ficam no banco e não distorcem a força/artilharia)
function bestXI(squad: PoolCard[], need: Record<Sector, number> = NEED): PoolCard[] {
  const out: PoolCard[] = []
  for (const p of SECTORS) { const cands = squad.filter(c => c.pos === p).sort((a, b) => mid(b) - mid(a)); for (let i = 0; i < need[p] && i < cands.length; i++) out.push(cands[i]) }
  return out
}
function assembleDiv(save: Save, div: Division): SimTeam[] {
  const teams = save.world.filter(w => w.div === div).map(w => mkSim(w.name, bestXI(w.squad), false, w))
  if (div === save.division) teams.push(mkSim(save.clubName, bestXI(save.squad as PoolCard[], FORM_NEED[save.formation]), true, null))
  return teams
}
// 1º turno: simula as n-1 primeiras rodadas de cada divisão e guarda o parcial.
function playFirstHalf(save: Save): PartialSeason {
  const rng = mulberry((save.seed ^ (save.seasonNo * 0x100 + 1)) >>> 0)
  const scorers = new Map<string, Scorer>()
  const standings = {} as Record<Division, TeamStand[]>
  for (const div of DIVS) {
    const teams = assembleDiv(save, div)
    const fx = buildFixtures(teams.length)
    simFixtures(teams, div, rng, scorers, fx.slice(0, teams.length - 1))
    standings[div] = teams.map(t => ({ name: t.name, pts: t.pts, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga }))
  }
  return { standings, scorers: [...scorers.values()] }
}
// returno: continua da tabela do 1º turno (com o elenco JÁ mexido na janela) e
// fecha a temporada — tabela final, artilharias, sobe/desce e prêmios.
function playSecondHalf(save: Save, partial: PartialSeason): SeasonOut {
  const rng = mulberry((save.seed ^ (save.seasonNo * 0x100 + 2)) >>> 0)
  const scorers = new Map<string, Scorer>()
  for (const s of partial.scorers) scorers.set(`${s.teamName}:${s.id}`, { ...s })
  const tables: Record<Division, SimTeam[]> = { A: [], B: [], C: [], D: [] }
  let yourTable: SimTeam[] = []
  for (const div of DIVS) {
    const teams = assembleDiv(save, div)
    const byName = new Map(partial.standings[div].map(s => [s.name, s]))
    for (const t of teams) { const s = byName.get(t.name); if (s) { t.pts = s.pts; t.w = s.w; t.d = s.d; t.l = s.l; t.gf = s.gf; t.ga = s.ga } }
    const fx = buildFixtures(teams.length)
    simFixtures(teams, div, rng, scorers, fx.slice(teams.length - 1))
    const sorted = sortTable(teams, rng)
    tables[div] = sorted
    if (div === save.division) yourTable = sorted
  }
  const yourPos = yourTable.findIndex(t => t.you) + 1
  const youChampion = yourTable[0]?.you ?? false
  // sobe/desce toda a pirâmide (top4 sobe, Z4 cai) usando as tabelas pré-promoção
  const newDivOf = new Map<WTeam, Division>()
  for (const w of save.world) newDivOf.set(w, w.div)
  let newDivision = save.division
  for (let i = 0; i < DIVS.length - 1; i++) {
    const L = DIVS[i], U = DIVS[i + 1]
    for (const t of tables[L].slice(0, 4)) { if (t.wt) newDivOf.set(t.wt, U); else newDivision = U }
    for (const t of tables[U].slice(16)) { if (t.wt) newDivOf.set(t.wt, L); else newDivision = L }
  }
  const newWorld = save.world.map(w => ({ ...w, div: newDivOf.get(w) ?? w.div }))
  const allScorers = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  const worldGoals: Record<string, number> = {}
  for (const s of allScorers) worldGoals[s.id] = Math.max(worldGoals[s.id] ?? 0, s.goals)
  const base: Record<Division, number> = { D: 20, C: 35, B: 60, A: 110 }
  const posF = yourPos === 1 ? 1 : yourPos <= 4 ? 0.7 : yourPos <= 12 ? 0.4 : 0.2
  const prize = Math.round(base[save.division] * posF)
  const fortuneBonus = Math.round(base[save.division] * 0.12) + (youChampion ? Math.round(base[save.division] * 0.3) : 0)
  const move: 'up' | 'down' | 'stay' = newDivision === save.division ? 'stay' : DIVS.indexOf(newDivision) > DIVS.indexOf(save.division) ? 'up' : 'down'
  return { yourTable, yourPos, youChampion, divScorers: allScorers.filter(s => s.div === save.division).slice(0, 12), globalScorers: allScorers.slice(0, 20), worldGoals, prize, fortuneBonus, newWorld, newDivision, move }
}

// ─── UI helpers (espelham Box/Btn/CardFace do jogo) ──────────────────
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
function Btn({ children, onClick, bg = GOLD, color = INK, disabled }: { children: React.ReactNode; onClick?: () => void; bg?: string; color?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="active:translate-x-[2px] active:translate-y-[2px]" style={{ width: '100%', boxSizing: 'border-box', background: bg, color, opacity: disabled ? 0.4 : 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '12px 16px', fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.03em', cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : `4px 4px 0 0 ${INK}`, ...OSWALD }}>{children}</button>
}
// chip de posição igual ao CardFace do jogo
const Pos = ({ p }: { p: Sector }) => <span style={{ fontSize: 10, fontWeight: 900, background: INK, color: '#fff', borderRadius: 99, padding: '1px 7px', border: `2px solid ${INK}` }}>{p}</span>

// mundo fixo a partir do resultado do LEILÃO REAL: você + os RIVAIS que você
// escolheu ficam na Série D com os elencos montados no pregão. O resto do
// catálogo (por nome, tirando o que vocês pegaram) é distribuído por FORÇA nas
// divisões — A mais forte, D mais fraca — mantendo a pirâmide certa. O que
// sobrou de moedas no leilão fica no Caixa do clube.
function buildSaveFromAuction(state: EscState): Save {
  const seed = state.seed
  const rng = mulberry((seed ^ 0x1234) >>> 0)
  const you = state.managers[state.youIdx]
  const yourSquad: WonCard[] = you.squad.map(c => ({ ...c }))
  const rivals = state.managers.filter(m => !m.isHuman && m.auctionRival)
  const rivalTeams = new Set(rivals.map(m => m.teamName))
  const excl = new Set<string>()
  for (const c of yourSquad) excl.add(c.name)
  for (const r of rivals) for (const c of r.squad) excl.add(c.name)
  const rest = shuffle(POOL.filter(c => !excl.has(c.name)), rng).sort((a, b) => mid(b) - mid(a))
  const q = Math.ceil(rest.length / 4)
  const bucket: Record<Division, PoolCard[]> = { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2, q * 3), D: rest.slice(q * 3) }
  const world: WTeam[] = rivals.map(r => ({ name: r.teamName, div: 'D' as Division, squad: r.squad.map(c => ({ ...c })) as PoolCard[], rival: true }))
  for (const div of DIVS) {
    const names = DIVISION_TEAMS[div].map(t => t.team).filter(n => !rivalTeams.has(n))
    const count = div === 'D' ? (20 - 1 - rivals.length) : 20
    const fillerNames = names.slice(0, count)
    const dealt = dealSquads(bucket[div], fillerNames.length, rng)
    fillerNames.forEach((nm, i) => world.push({ name: nm, div, squad: dealt[i] }))
  }
  const contracts: Record<string, { until: number; floor: number }> = {}
  for (const c of yourSquad) contracts[c.id] = { until: 1 + 2 + Math.floor(rng() * 4), floor: Math.max(1, c.paid) }
  return { seed, clubName: you.teamName, formation: you.formation, division: 'D', seasonNo: 1, coins: you.money, fortune: 0, luxury: [], titles: 0, squad: yourSquad, world, stage: 's1FirstHalf', worldGoals: {}, goalsLast: {}, championLast: false, contracts, requested: [] }
}

// ─── raiz (overlay) ──────────────────────────────────────────────────
export function DinastiaGame() {
  const isAdmin = useIsAdmin()
  const { state, dispatch } = useEsc()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#dinastia')
  useEffect(() => { const f = () => setOpen(window.location.hash === '#dinastia'); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  // HANDOFF: o leilão real terminou (cerimônia → temporada) num jogo Dinastia →
  // a economia assume: monta o save a partir do elenco montado e reabre o modo.
  const handled = useRef(false)
  useEffect(() => {
    if (state.dinastia && state.screen === 'season' && !handled.current) {
      handled.current = true
      writeSave(buildSaveFromAuction(state))
      dispatch({ type: 'GO_LOBBY' }) // reseta o motor (limpa o flag dinastia)
      window.location.hash = 'dinastia'
    }
    if (!state.dinastia) handled.current = false
  }, [state.dinastia, state.screen]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null
  if (!isAdmin) return (
    <Overlay><div style={{ ...box(), padding: 24, textAlign: 'center' }}>
      <p style={{ fontWeight: 900, ...OSWALD, fontSize: 18 }}>🔒 Modo em teste</p>
      <p style={{ marginTop: 8, color: '#555', fontWeight: 700 }}>Disponível só pro criador por enquanto.</p>
      <div style={{ marginTop: 16 }}><Btn onClick={() => { window.location.hash = '' }} bg="#fff">Voltar</Btn></div>
    </div></Overlay>
  )
  return <Overlay><Dinastia /></Overlay>
}
export function DinastiaButton() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return (
    <button onClick={() => { window.location.hash = 'dinastia' }} style={{ width: '100%', boxSizing: 'border-box', background: PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 2, ...OSWALD }}>
      🏰 Modo Dinastia <span style={{ color: GOLD }}>(teste — só você)</span>
    </button>
  )
}
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: CREAM, color: INK, zIndex: 9000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 64px' }}>{children}</div>
    </div>
  )
}

type Phase = 'home' | 'firsthalf' | 'result' | 'transfer' | 'sell' | 'store' | 'squad' | 'scorers'

function Dinastia() {
  const { dispatch } = useEsc()
  const [save, setSave] = useState<Save | null>(() => loadSave())
  const [phase, setPhase] = useState<Phase>('home')
  const [out, setOut] = useState<SeasonOut | null>(null) // resultado do returno
  const persist = (s: Save) => { writeSave(s); setSave(s) }
  const close = () => { window.location.hash = '' }
  const reset = () => { if (confirm('Recomeçar a Dinastia do zero? Perde tudo.')) { localStorage.removeItem(SAVE_KEY); setSave(null) } }
  // abrir o pregão = disparar o LEILÃO REAL (mesmo motor da carreira) e fechar o
  // overlay pra ele aparecer. A cerimônia devolve o controle pra economia.
  const startAuction = (b: { name: string; rivals: string[]; formation: FormationKey }) => {
    dispatch({ type: 'START', teamName: b.name, formation: b.formation, rivals: b.rivals.length, career: true, rivalTeams: b.rivals, dinastia: true, budget: START_COINS })
    window.location.hash = ''
  }
  const playFirst = () => {
    if (!save) return
    // contratos vencidos não renovados são liberados na hora de jogar
    const kept = save.squad.filter(c => { const k = save.contracts?.[c.id]; return !k || k.until >= save.seasonNo })
    const s2: Save = { ...save, squad: kept, requested: [] }
    const partial = playFirstHalf(s2)
    persist({ ...s2, stage: 'midWindow', partial })
    setPhase('firsthalf')
  }
  const playReturn = () => { if (!save?.partial) return; setOut(playSecondHalf(save, save.partial)); setPhase('result') }

  if (!save) return <Intro onStart={startAuction} onClose={close} />


  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 22 }}>
      {phase !== 'home'
        ? <button onClick={() => setPhase('home')} className="flex items-center gap-1 text-black/60 font-black text-sm active:opacity-60" style={OSWALD}><span className="text-lg leading-none">←</span> Voltar</button>
        : <span style={{ width: 60 }} />}
      <span style={{ fontWeight: 900, ...OSWALD }}>🏰 DINASTIA</span>
      <span style={{ width: 60 }} />
    </div>
  )
  return (
    <div>
      {header}
      {phase === 'home' && <Home save={save} go={setPhase} playFirst={playFirst} playReturn={playReturn} />}
      {phase === 'firsthalf' && <FirstHalfScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'result' && out && <ResultScreen save={save} out={out} persist={persist} onHome={() => { setOut(null); setPhase('home') }} />}
      {phase === 'squad' && <SquadScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'scorers' && <ScorersScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'store' && <Store save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'transfer' && <Transfer save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'sell' && <SellRoom save={save} persist={persist} onBack={() => setPhase('home')} />}
      {/* sair do jogo lá embaixo, igual aos outros modos */}
      <div className="pt-8 pb-4 text-center space-y-2">
        <button onClick={close} className="block mx-auto text-black/35 text-xs font-semibold underline active:opacity-60" style={OSWALD}>sair do jogo</button>
        <button onClick={reset} className="block mx-auto text-black/25 text-[11px] font-semibold underline active:opacity-60" style={OSWALD}>recomeçar dinastia do zero</button>
      </div>
    </div>
  )
}

// ─── INTRO / SETUP: mesmo padrão do setup da Carreira ────────────────
function Intro({ onStart, onClose }: { onStart: (b: { name: string; rivals: string[]; formation: FormationKey }) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [count, setCount] = useState(5)
  const pool = DIVISION_TEAMS['D'].map(t => t.team)
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (t: string) => setPicked(prev => { if (prev.includes(t)) return prev.filter(x => x !== t); const next = [...prev, t]; return next.length > count ? next.slice(next.length - count) : next })
  // nome vem da CONTA (mesmo do CPU/carreira/online) e é editável; ao começar,
  // sincroniza de volta — trocar aqui troca em todos os lugares.
  const [accountName, setAccountName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const apply = (u: { user_metadata?: Record<string, unknown> } | null | undefined) => {
      if (!alive) return
      if (!u) { setAccountName(null); return }
      const dn = ((u.user_metadata?.display_name as string) ?? '').trim()
      setAccountName(dn); if (dn) setName(prev => prev.trim() ? prev : dn)
    }
    supabase.auth.getUser().then(({ data }) => apply(data?.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => apply(s?.user))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  const start = async () => {
    const clean = name.trim()
    if (accountName !== null && clean && clean !== accountName) {
      try { await supabase.auth.updateUser({ data: { display_name: clean } }) } catch { /* não trava o jogo */ }
    }
    const picks = [...picked, ...pool.filter(t => !picked.includes(t))].slice(0, count)
    onStart({ name: clean || 'Meu Clube', rivals: picks, formation })
  }
  const label = { fontWeight: 900, textTransform: 'uppercase' as const, fontSize: 12, marginBottom: 4, ...OSWALD }
  return (
    <div className="space-y-5">
      <button onClick={onClose} className="flex items-center gap-1 text-black/60 font-black text-sm active:opacity-60" style={OSWALD}><span className="text-lg leading-none">←</span> Home</button>
      <h2 className="font-black text-3xl" style={OSWALD}>🏰 DINASTIA · SÉRIE D</h2>
      <p className="text-sm font-bold text-black/60 -mt-3">Comece duro com 50 moedas, monte o time no pregão e construa uma dinastia: suba de divisão, contrate craques e fique rico. Mundo fixo — cada jogador vive num clube.</p>
      <div style={{ ...box(), padding: 16 }} className="space-y-4">
        <div>
          <p style={label}>Nome do seu clube</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Bagres do Asfalto" maxLength={22}
            className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold bg-white" />
          {accountName !== null && <p className="text-[11px] font-semibold text-black/55 mt-1">🔗 É o nome da sua conta — vale no CPU, na carreira e no online. Se editar aqui, troca em todos os lugares (e nas estatísticas).</p>}
        </div>
        <div>
          <p style={label}>Formação (travada antes do pregão)</p>
          <div className="grid grid-cols-4 gap-2">
            {(['4-3-3', '4-4-2'] as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)} className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: formation === f ? GOLD : '#fff', boxShadow: formation === f ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>{f}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={label}>Rivais no pregão</p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7].map(n => (
              <button key={n} onClick={() => setCount(n)} className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: count === n ? PURPLE : '#fff', color: count === n ? '#fff' : INK, boxShadow: count === n ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={label}>🔥 Escolha seus rivais <span className="text-black/50">({picked.length}/{count})</span></p>
          <p className="text-[11px] font-semibold text-black/55 mb-1.5">Eles serão seus rivais pra vida toda — brigam no pregão, nos seus leilões e na pirâmide.</p>
          <div className="flex flex-wrap gap-1.5">
            {pool.map(t => {
              const on = picked.includes(t)
              return <button key={t} onClick={() => toggle(t)} className="border-2 border-black rounded-lg px-2 py-1 font-black text-[11px] active:translate-y-0.5" style={{ backgroundColor: on ? RED : '#fff', color: on ? '#fff' : INK }}>{on ? '🔥 ' : ''}{t}</button>
            })}
          </div>
          <button onClick={() => setPicked([])} className="mt-2 border-2 border-black rounded-lg px-2.5 py-1 font-black text-[11px] bg-white active:translate-y-0.5" style={OSWALD}>🎲 Não escolher — usar rivais padrão</button>
        </div>
        <p className="text-xs font-semibold text-black/70">🏟️ A liga completa 20 times; o catálogo inteiro é distribuído pelas 4 divisões (mundo fixo).</p>
        <p className="text-xs font-semibold text-black/70">💰 Você começa com <b>{START_COINS} moedas</b> na Série D. Sem reservas — todo time tem 11.</p>
      </div>
      <Btn onClick={start} bg={GREEN} color="#fff">🔨 ABRIR O PREGÃO</Btn>
    </div>
  )
}

const stepBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: `2px solid ${INK}`, background: '#fff', fontWeight: 900, fontSize: 18, cursor: 'pointer', lineHeight: 1 }

// ─── HOME ─────────────────────────────────────────────────────────────
function Home({ save, go, playFirst, playReturn }: { save: Save; go: (p: Phase) => void; playFirst: () => void; playReturn: () => void }) {
  const luxOwned = LUXURY.filter(l => save.luxury.includes(l.id))
  const canTrade = save.stage === 'preWindow' || save.stage === 'midWindow'
  // posição parcial (no meio da temporada)
  let midPos = 0
  if (save.stage === 'midWindow' && save.partial) {
    const tbl = save.partial.standings[save.division].slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
    midPos = tbl.findIndex(t => t.name === save.clubName) + 1
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 16, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{save.clubName}</span>
          <span style={{ fontWeight: 800, color: GOLD }}>{DIV_LABEL[save.division]}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700, marginTop: 2 }}>Temporada {save.seasonNo} · {save.titles} 🏆 {luxOwned.map(l => l.emoji).join(' ')}</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ ...box('#fff'), flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>🏦 CAIXA DO CLUBE</div>
          <div style={{ fontSize: 24, fontWeight: 900, ...OSWALD }}>💰 {save.coins}</div>
        </div>
        <div style={{ ...box(GOLD), flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#7a5c00' }}>💎 FORTUNA</div>
          <div style={{ fontSize: 24, fontWeight: 900, ...OSWALD }}>💰 {save.fortune}</div>
        </div>
      </div>

      {/* seção da temporada — muda conforme a etapa */}
      {canTrade && (
        <div style={{ ...box('#FFF6DE'), padding: 12 }}>
          <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🔓 Janela de transferências aberta {save.stage === 'preWindow' ? '(pré-temporada)' : '(meio da temporada)'}</p>
          {save.stage === 'midWindow' && midPos > 0 && <p style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>Você está em <b>{midPos}º</b> no 1º turno. Reforce ou venda antes do returno.</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1 }}><Btn onClick={() => go('transfer')} bg="#fff">🔎 Contratar</Btn></div>
            <div style={{ flex: 1 }}><Btn onClick={() => go('sell')} bg="#fff">🔨 Vender</Btn></div>
          </div>
        </div>
      )}
      {save.stage === 'midWindow'
        ? <Btn onClick={playReturn} bg={GREEN} color="#fff">▶️ Fechar janela e jogar o RETURNO (20–38)</Btn>
        : <Btn onClick={playFirst} bg={GREEN} color="#fff">{save.stage === 'preWindow' ? '▶️ Fechar janela e jogar o 1º TURNO' : `▶️ JOGAR 1º TURNO (Temporada ${save.seasonNo})`}</Btn>}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('scorers')} bg="#fff">🥇 Artilharia</Btn></div>
      </div>
      <Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🏰 Loja da Ostentação</Btn>
      {save.lastResult && (
        <div style={{ ...box('#fff'), padding: 12, fontSize: 13, fontWeight: 700 }}>
          Última: {save.lastResult.pos}º na {DIV_LABEL[save.lastResult.prevDiv]}{save.lastResult.champion ? ' 🏆 CAMPEÃO!' : ''} · {save.lastResult.move === 'up' ? '⬆️ subiu' : save.lastResult.move === 'down' ? '⬇️ caiu' : '➡️ ficou'}
        </div>
      )}
    </div>
  )
}

// resumo do 1º turno (parcial), antes da janela do meio
function FirstHalfScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const part = save.partial
  const table = useMemo(() => {
    if (!part) return [] as TeamStand[]
    return part.standings[save.division].slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  }, [part, save.division])
  const pos = table.findIndex(t => t.name === save.clubName) + 1
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(GOLD), padding: 16, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>Fim do 1º turno · {DIV_LABEL[save.division]}</p>
        <p style={{ fontWeight: 900, fontSize: 28, ...OSWALD, marginTop: 4 }}>{pos}º lugar (parcial)</p>
        <p style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>Janela aberta: reforce ou venda antes do returno.</p>
      </div>
      <div style={{ ...box('#fff'), padding: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...OSWALD }}>
          <thead><tr style={{ fontWeight: 900, textAlign: 'left', color: '#888' }}><th>#</th><th>Time</th><th>P</th><th>V</th><th>SG</th></tr></thead>
          <tbody>{table.map((t, i) => (
            <tr key={t.name} style={{ background: t.name === save.clubName ? GOLD : i < 4 ? '#DFF5E1' : i >= 16 ? '#FBE0DA' : 'transparent', fontWeight: t.name === save.clubName ? 900 : 700 }}>
              <td style={{ padding: '4px 6px' }}>{i + 1}</td><td>{t.name}{t.name === save.clubName ? ' 👑' : ''}</td><td>{t.pts}</td><td>{t.w}</td><td>{t.gf - t.ga}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Btn onClick={onBack} bg={GREEN} color="#fff">🔓 Ir pra janela de transferências</Btn>
    </div>
  )
}

// ─── RESULTADO ────────────────────────────────────────────────────────
function ResultScreen({ save, out: res, persist, onHome }: { save: Save; out: SeasonOut; persist: (s: Save) => void; onHome: () => void }) {
  const [applied, setApplied] = useState(false)
  const [tab, setTab] = useState<'tabela' | 'artil' | 'geral'>('tabela')
  const mine = new Set(save.squad.map(c => c.id))
  const apply = () => {
    if (applied) return
    const goalsLast: Record<string, number> = {}
    for (const [id, g] of Object.entries(res.worldGoals)) if (mine.has(id)) goalsLast[id] = g
    persist({
      ...save, world: res.newWorld, division: res.newDivision, seasonNo: save.seasonNo + 1,
      stage: 'preWindow', partial: undefined, requested: [],
      coins: save.coins + res.prize, fortune: save.fortune + res.fortuneBonus,
      titles: save.titles + (res.youChampion ? 1 : 0), worldGoals: res.worldGoals, goalsLast, championLast: res.youChampion,
      lastResult: { pos: res.yourPos, move: res.move, prevDiv: save.division, champion: res.youChampion },
    })
    setApplied(true); onHome()
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(res.youChampion ? GOLD : '#fff'), padding: 16, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>{DIV_LABEL[save.division]} · Temporada {save.seasonNo}</p>
        <p style={{ fontWeight: 900, fontSize: 30, ...OSWALD, marginTop: 4 }}>{res.youChampion ? '🏆 CAMPEÃO!' : `${res.yourPos}º lugar`}</p>
        <p style={{ fontWeight: 800, marginTop: 6 }}>💰 +{res.prize} Caixa · 💎 +{res.fortuneBonus} Fortuna</p>
        <p style={{ fontWeight: 800, marginTop: 2, color: res.move === 'up' ? GREEN : res.move === 'down' ? RED : '#555' }}>
          {res.move === 'up' ? `⬆️ SUBIU pra ${DIV_LABEL[res.newDivision]}!` : res.move === 'down' ? `⬇️ Caiu pra ${DIV_LABEL[res.newDivision]}` : '➡️ Segue na divisão'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {([['tabela', '📊 Tabela'], ['artil', '🥇 Sua divisão'], ['geral', '🌎 Geral']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 800, fontSize: 12, background: tab === k ? INK : '#fff', color: tab === k ? '#fff' : INK, cursor: 'pointer', ...OSWALD }}>{l}</button>
        ))}
      </div>
      {tab === 'tabela' && <TableView table={res.yourTable} />}
      {tab === 'artil' && <ScorerList rows={res.divScorers} showDiv={false} mine={mine} />}
      {tab === 'geral' && <ScorerList rows={res.globalScorers} showDiv mine={mine} />}
      <Btn onClick={apply} disabled={applied} bg={GREEN} color="#fff">{applied ? '✔️ Salvo!' : '➡️ Continuar (salvar e avançar)'}</Btn>
    </div>
  )
}
function TableView({ table }: { table: SimTeam[] }) {
  return (
    <div style={{ ...box('#fff'), padding: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...OSWALD }}>
        <thead><tr style={{ fontWeight: 900, textAlign: 'left', color: '#888' }}><th>#</th><th>Time</th><th>P</th><th>V</th><th>SG</th></tr></thead>
        <tbody>{table.map((t, i) => (
          <tr key={t.name} style={{ background: t.you ? GOLD : i < 4 ? '#DFF5E1' : i >= 16 ? '#FBE0DA' : 'transparent', fontWeight: t.you ? 900 : 700 }}>
            <td style={{ padding: '4px 6px' }}>{i + 1}</td><td>{t.name}{t.you ? ' 👑' : t.wt?.rival ? ' ⚔️' : ''}</td><td>{t.pts}</td><td>{t.w}</td><td>{t.gf - t.ga}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
function ScorerList({ rows, showDiv, mine }: { rows: Scorer[]; showDiv: boolean; mine: Set<string> }) {
  return (
    <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 4 }}>
      {rows.length === 0 && <p style={{ fontWeight: 700, color: '#888', textAlign: 'center', padding: 8 }}>Sem gols ainda — jogue uma temporada.</p>}
      {rows.map((s, i) => (
        <div key={s.teamName + s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: mine.has(s.id) ? GOLD : 'transparent', fontWeight: mine.has(s.id) ? 900 : 700 }}>
          <span style={{ fontSize: 13 }}>{i + 1}. {s.name} <span style={{ color: '#999', fontSize: 11 }}>{s.teamName}{showDiv ? ` · ${DIV_LABEL[s.div]}` : ''}</span></span>
          <span style={{ fontWeight: 900, ...OSWALD }}>⚽ {s.goals}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ELENCO ───────────────────────────────────────────────────────────
function SquadScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const byPos = SECTORS.map(p => ({ p, cards: save.squad.filter(c => c.pos === p) }))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>👥 Elenco ({save.squad.length})</p>
      {byPos.map(({ p, cards }) => cards.length > 0 && (
        <div key={p}>
          <p style={{ fontWeight: 800, fontSize: 12, color: '#888', marginBottom: 4 }}>{SECTOR_LABEL[p]}</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {cards.map(c => (
              <div key={c.id} style={{ ...box('#fff'), padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 900, ...OSWALD }}>{c.name}</div><div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{c.club} · {c.year}{save.goalsLast[c.id] ? ` · ⚽ ${save.goalsLast[c.id]}` : ''} · {contractUntil(save, c.id) >= save.seasonNo ? `📄 até temp. ${contractUntil(save, c.id)}` : '⚠️ vencido'} · piso {floorOf(save, c)}</div></div>
                <span style={{ fontWeight: 900, ...OSWALD, color: GREEN }}>💰 {myValue(save, c)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── ARTILHARIA (última temporada jogada) ────────────────────────────
function ScorersScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const rows = useMemo(() => Object.entries(save.worldGoals).map(([id, g]) => {
    const c = POOL.find(x => x.id === id); const owner = save.world.find(w => w.squad.some(s => s.id === id)); const you = save.squad.some(s => s.id === id)
    return { id, name: c?.name ?? '—', teamName: you ? save.clubName : owner?.name ?? '—', div: you ? save.division : owner?.div ?? 'D', goals: g } as Scorer
  }).sort((a, b) => b.goals - a.goals).slice(0, 25), [save])
  const mine = new Set(save.squad.map(c => c.id))
  if (rows.length === 0) return <div style={{ display: 'grid', gap: 10 }}><p style={{ fontWeight: 700, color: '#888' }}>Jogue uma temporada pra ver a artilharia geral.</p><Btn onClick={onBack} bg="#fff">← Voltar</Btn></div>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🥇 Artilharia geral (4 divisões)</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Última temporada. Seus jogadores destacados. É por aqui que um Obina goleador vira alvo caro.</p>
      <ScorerList rows={rows} showDiv mine={mine} />
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── LOJA DA OSTENTAÇÃO ──────────────────────────────────────────────
function Store({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const buy = (l: Lux) => { if (save.fortune < l.cost || save.luxury.includes(l.id)) return; persist({ ...save, fortune: save.fortune - l.cost, luxury: [...save.luxury, l.id] }) }
  const withdraw = (amt: number) => { if (save.coins < amt) return; persist({ ...save, coins: save.coins - amt, fortune: save.fortune + amt }) }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🏰 Loja da Ostentação</p>
      <div style={{ ...box(GOLD), padding: 10, textAlign: 'center' }}><b style={{ ...OSWALD }}>💎 Fortuna Pessoal: {save.fortune}</b></div>
      <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Sacar do clube pro bolso (enriquece você, mas enfraquece o Caixa):</p>
      <div style={{ display: 'flex', gap: 8 }}>{[5, 10, 25].map(a => <div key={a} style={{ flex: 1 }}><Btn onClick={() => withdraw(a)} disabled={save.coins < a} bg="#fff">💸 Sacar {a}</Btn></div>)}</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
        {LUXURY.map(l => {
          const owned = save.luxury.includes(l.id)
          return (
            <div key={l.id} style={{ ...box(owned ? '#DFF5E1' : '#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, ...OSWALD, fontSize: 15 }}>{l.emoji} {l.name}</span>
              {owned ? <span style={{ fontWeight: 900, color: GREEN }}>✓ seu</span>
                : <button onClick={() => buy(l)} disabled={save.fortune < l.cost} style={{ background: save.fortune < l.cost ? '#ccc' : PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '8px 12px', fontWeight: 900, cursor: save.fortune < l.cost ? 'default' : 'pointer', ...OSWALD }}>💎 {l.cost}</button>}
            </div>
          )
        })}
      </div>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── LOTES do leilão da janela ───────────────────────────────────────
// Início da temporada = leilão "normal" (2 por posição). Meio = 1 por posição.
// Os lotes são jogadores de clubes do mundo (não travados), com uma mistura
// de bons e baratos pra dar escolha. Cada lote vira um leilão (você × rivais ×
// dono). Assim a contratação é um EVENTO limitado, não algo à toda hora.
interface Lot { card: PoolCard; owner: WTeam }
const MAX_REQUESTS = 3
function auctionLots(save: Save, kind: 'start' | 'mid'): Lot[] {
  const rng = mulberry((save.seed ^ (save.seasonNo * 977) ^ (kind === 'mid' ? 0x5151 : 0x2727)) >>> 0)
  const perPos = kind === 'mid' ? 1 : 2
  const lots: Lot[] = []
  const used = new Set<string>()
  // pedidos manuais entram primeiro (você bancou jogá-los no bloco aberto)
  for (const id of (save.requested ?? [])) {
    if (used.has(id) || underContract(save, id)) continue
    const w = save.world.find(t => t.squad.some(c => c.id === id))
    const c = w?.squad.find(x => x.id === id)
    if (w && c) { lots.push({ card: c, owner: w }); used.add(id) }
  }
  // auto: perPos por posição, só de quem NÃO está sob contrato (5 temporadas)
  for (const p of SECTORS) {
    const cands: Lot[] = []
    for (const w of save.world) for (const c of w.squad) {
      if (c.pos !== p || used.has(c.id) || underContract(save, c.id)) continue
      cands.push({ card: c, owner: w })
    }
    const ranked = cands.map(l => ({ l, k: (valueOf(save, l.card) + 2) * (0.4 + rng()) })).sort((a, b) => b.k - a.k)
    for (let i = 0; i < perPos && i < ranked.length; i++) { lots.push(ranked[i].l); used.add(ranked[i].l.card.id) }
  }
  return lots
}

// ─── CONTRATAR: renovações + leilão da janela (lotes + pedidos) ──────
function Transfer({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const kind = save.stage === 'midWindow' ? 'mid' : 'start'
  const lots = useMemo(() => auctionLots(save, kind), [save.seasonNo, kind, (save.requested ?? []).length]) // eslint-disable-line
  const [target, setTarget] = useState<Lot | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'block' | 'browse'>('block')
  const [browseTeam, setBrowseTeam] = useState<string | null>(null)

  if (target) return <SigningAuction save={save} card={target.card} owner={target.owner} persist={persist} onDone={() => { setDone(d => new Set(d).add(target.card.id)); setTarget(null) }} onBack={() => setTarget(null)} />

  const requested = save.requested ?? []
  const request = (card: PoolCard) => { if (requested.length >= MAX_REQUESTS || requested.includes(card.id)) return; persist({ ...save, requested: [...requested, card.id] }) }

  // ── pedir jogador (fuça clubes) ──
  if (view === 'browse') {
    const team = save.world.find(w => w.name === browseTeam) ?? null
    if (team) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>{team.name} <span style={{ fontSize: 12, color: '#888' }}>· {DIV_LABEL[team.div]}</span></p>
          <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Pedir joga o cara no bloco aberto — seus rivais também podem levá-lo. ({requested.length}/{MAX_REQUESTS} pedidos)</p>
          {SECTORS.map(p => team.squad.filter(c => c.pos === p).map(c => {
            const under = underContract(save, c.id)
            const req = requested.includes(c.id)
            return (
              <button key={c.id} disabled={under || req || requested.length >= MAX_REQUESTS} onClick={() => request(c)} style={{ ...box(req ? '#DFF5E1' : under ? '#eee' : '#fff'), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: under || req ? 'default' : 'pointer', textAlign: 'left', opacity: under ? 0.5 : 1 }}>
                <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
                {req ? <span style={{ fontWeight: 800, color: GREEN, fontSize: 12 }}>✓ pedido</span> : under ? <span style={{ fontWeight: 800, color: RED, fontSize: 12 }}>🔒 contrato (temp. {contractUntil(save, c.id)})</span> : <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>piso {floorOf(save, c)} 💰</span>}
              </button>
            )
          }))}
          <Btn onClick={() => setBrowseTeam(null)} bg="#fff">← Outros clubes</Btn>
        </div>
      )
    }
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>➕ Pedir jogador ao mercado</p>
        <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Escolha um clube. Quem você pedir entra no bloco do leilão — cuidado, os rivais brigam por ele também.</p>
        {DIVS.slice().reverse().map(div => (
          <div key={div}>
            <p style={{ fontWeight: 900, fontSize: 13, color: '#888', margin: '4px 0' }}>{DIV_LABEL[div]}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {save.world.filter(w => w.div === div).map(w => (
                <button key={w.name} onClick={() => setBrowseTeam(w.name)} style={{ padding: '8px 6px', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 800, fontSize: 12, background: w.rival ? '#FFE9A8' : '#fff', cursor: 'pointer', textAlign: 'left', ...OSWALD }}>{w.rival ? '⚔️ ' : ''}{w.name}</button>
              ))}
            </div>
          </div>
        ))}
        <Btn onClick={() => setView('block')} bg="#fff">← Voltar ao leilão</Btn>
      </div>
    )
  }

  // um lote continua válido só se o dono ainda tiver a carta e não estiver sob contrato
  const live = lots.filter(l => !done.has(l.card.id) && save.world.find(w => w.name === l.owner.name)?.squad.some(c => c.id === l.card.id) && !underContract(save, l.card.id))
  // renovações (só na janela do início): seus jogadores com contrato vencido
  const expiring = kind === 'start' ? save.squad.filter(c => contractUntil(save, c.id) < save.seasonNo) : []
  const renew = (c: WonCard) => { const cost = floorOf(save, c); if (save.coins < cost) return; persist({ ...save, coins: save.coins - cost, contracts: setContract(save, c.id, cost) }) }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 {kind === 'mid' ? 'Leilão do meio (1 por posição)' : 'Leilão de contratações'} · 💰 {save.coins}</p>

      {expiring.length > 0 && (
        <div style={{ ...box('#FFF6DE'), padding: 10, display: 'grid', gap: 6 }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>📄 Contratos vencidos — renove ou perde na hora de jogar</p>
          {expiring.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}><Pos p={c.pos} /> {c.name}</span>
              <button onClick={() => renew(c)} disabled={save.coins < floorOf(save, c)} style={{ background: save.coins < floorOf(save, c) ? '#ccc' : GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 10px', fontWeight: 900, fontSize: 13, cursor: save.coins < floorOf(save, c) ? 'default' : 'pointer', ...OSWALD }}>Renovar 💰 {floorOf(save, c)}</button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Bloco desta janela. Toque pra dar lance — você × seus rivais × o dono. Lance começa no <b>piso</b> (último preço). Quem compra assina <b>5 temporadas</b>. Ao vencer, seu pior da posição sai (fica 11).</p>
      <Btn onClick={() => setView('browse')} bg="#fff">➕ Pedir jogador ao mercado ({requested.length}/{MAX_REQUESTS})</Btn>

      {SECTORS.map(p => {
        const rows = live.filter(l => l.card.pos === p)
        if (rows.length === 0) return null
        return (
          <div key={p}>
            <p style={{ fontWeight: 800, fontSize: 12, color: '#888', margin: '2px 0' }}>{SECTOR_LABEL[p]}</p>
            <div style={{ display: 'grid', gap: 6 }}>
              {rows.map(l => {
                const req = requested.includes(l.card.id)
                return (
                  <button key={l.card.id} onClick={() => setTarget(l)} style={{ ...box(req ? '#EAF3FF' : '#fff'), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 900, ...OSWALD }}>{req ? '📌 ' : ''}<Pos p={l.card.pos} /> {l.card.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: '#888', fontWeight: 700 }}>{l.owner.name} · {DIV_LABEL[l.owner.div]}{l.owner.rival ? ' ⚔️' : ''}</span>
                    </span>
                    <span style={{ fontWeight: 800, color: '#888', fontSize: 13, whiteSpace: 'nowrap' }}>piso {floorOf(save, l.card)} 💰</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {live.length === 0 && <div style={{ ...box('#fff'), padding: 14, textAlign: 'center', fontWeight: 700, color: '#888' }}>Bloco encerrado nesta janela.</div>}
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

function SigningAuction({ save, card, owner, persist, onDone, onBack }: { save: Save; card: PoolCard; owner: WTeam; persist: (s: Save) => void; onDone: () => void; onBack: () => void }) {
  const val = valueOf(save, card)
  const floor = floorOf(save, card) // lance começa aqui (último preço pago)
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ (save.seasonNo * 131)) >>> 0), []) // eslint-disable-line
  // "resolve" do dono: quanto ele banca pra segurar. Craque em clube grande = alto. Nunca abaixo do piso.
  const divW = { D: 0.2, C: 0.5, B: 0.9, A: 1.4 }[owner.div]
  const importance = Math.min(2.4, 0.9 + divW + (val > 15 ? 0.6 : 0))
  const ownerBid = useMemo(() => Math.max(floor, Math.round(val * importance * (0.9 + rng() * 0.4))), [rng, val, importance, floor])
  // seus rivais fixos entram no leilão (não o dono). Cada um com "cofre" próprio.
  const rivalsIn = useMemo(() => {
    return save.world.filter(w => w.rival && w.name !== owner.name).map(w => {
      const cofre = 25 + save.seasonNo * 4 + ({ D: 0, C: 6, B: 14, A: 24 }[w.div])
      const wants = val > 6 && cofre >= floor && rng() < (val > 14 ? 0.85 : 0.5)
      const bid = wants ? Math.min(cofre, Math.max(floor, Math.round(val * (0.8 + rng() * 0.8)))) : 0
      return { name: w.name, bid }
    }).filter(r => r.bid >= floor)
  }, [rng, val, floor]) // eslint-disable-line
  const [bid, setBid] = useState(Math.min(save.coins, Math.max(floor, Math.round(val))))
  const [done, setDone] = useState<{ result: 'you' | 'owner' | 'other'; by: string; price: number; dropped?: string } | null>(null)

  const go = () => {
    const entrants = [{ name: save.clubName, bid, mine: true }, { name: owner.name, bid: ownerBid, mine: false }, ...rivalsIn.map(r => ({ name: r.name, bid: r.bid, mine: false }))]
    entrants.sort((a, b) => b.bid - a.bid || (a.mine ? -1 : 1)) // empate: você leva
    const win = entrants[0]
    if (win.mine) {
      // você levou: paga, tira do dono (repõe com filler). Mantém 11: se lotar a
      // posição, o seu pior dela sai (dispensado) pra abrir vaga. Contrato de 5.
      const withNew: WonCard[] = [...save.squad, { ...card, paid: bid, via: 'leilao' }]
      const atPos = withNew.filter(c => c.pos === card.pos).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
      const drop = atPos.length > FORM_NEED[save.formation][card.pos] ? atPos[atPos.length - 1] : null
      const newSquad = drop ? withNew.filter(c => c.id !== drop.id) : withNew
      const newWorld = save.world.map(w => w.name === owner.name ? { ...w, squad: w.squad.filter(c => c.id !== card.id).concat(filler(card.pos, rng)) } : w)
      persist({ ...save, coins: save.coins - bid, squad: newSquad, world: newWorld, contracts: setContract(save, card.id, bid) })
      setDone({ result: 'you', by: save.clubName, price: bid, dropped: drop?.name })
    } else if (win.name === owner.name) {
      // dono renovou: contrato de 5 temporadas, piso = o que ele pagou
      persist({ ...save, contracts: setContract(save, card.id, win.bid) })
      setDone({ result: 'owner', by: owner.name, price: win.bid })
    } else {
      // um rival seu levou: sai do dono (filler), entra no rival; contrato de 5
      const newWorld = save.world.map(w => {
        if (w.name === owner.name) return { ...w, squad: w.squad.filter(c => c.id !== card.id).concat(filler(card.pos, rng)) }
        if (w.name === win.name) return { ...w, squad: giveToTeam(w.squad, card) }
        return w
      })
      persist({ ...save, world: newWorld, contracts: setContract(save, card.id, win.bid) })
      setDone({ result: 'other', by: win.name, price: win.bid })
    }
  }

  if (done) {
    const c = done.result === 'you' ? GOLD : done.result === 'other' ? '#FBE0DA' : '#fff'
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...box(c), padding: 20, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{done.result === 'you' ? '✅ CONTRATADO!' : done.result === 'owner' ? '🛡️ Renovou contrato!' : '😤 Rival levou!'}</p>
          <p style={{ fontWeight: 800, marginTop: 6 }}>{done.result === 'you' ? `${card.name} é seu por 💰 ${done.price}${done.dropped ? ` — ${done.dropped} saiu pra abrir vaga` : ''}` : done.result === 'owner' ? `${owner.name} cobriu (💰 ${done.price}) e renovou com ${card.name}. Travado por 5 temporadas.` : `${done.by} (seu rival) levou ${card.name} por 💰 ${done.price} na sua frente.`}</p>
        </div>
        <Btn onClick={onDone} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Leilão por {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>{owner.name} · {DIV_LABEL[owner.div]} · vale ~{val} · piso {floor} 💰</p>
      </div>
      <div style={{ ...box('#fff'), padding: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Seu lance (dono + seus rivais brigam às cegas):</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '4px 0' }}>💰 {bid}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          {[-5, -1].map(d => <button key={d} onClick={() => setBid(b => Math.max(floor, b + d))} style={stepBtn}>{d}</button>)}
          {[+1, +5].map(d => <button key={d} onClick={() => setBid(b => Math.min(save.coins, b + d))} style={stepBtn}>+{d}</button>)}
        </div>
        <p style={{ fontSize: 12, color: '#999', fontWeight: 700, marginTop: 8 }}>Caixa: 💰 {save.coins} · lance mínimo (piso): 💰 {floor}. Chutou baixo, o dono segura.</p>
      </div>
      <Btn onClick={go} bg={GREEN} color="#fff" disabled={bid < floor || bid > save.coins}>🔨 Dar o lance</Btn>
      <Btn onClick={onBack} bg="#fff">← Desistir</Btn>
    </div>
  )
}

// ─── VENDER (leilão com risco) ───────────────────────────────────────
function SellRoom({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const [selId, setSelId] = useState<string | null>(null)
  const sel = save.squad.find(c => c.id === selId) ?? null
  if (!sel) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Vender jogador</p>
        <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Leilão COM RISCO: as ofertas chegam uma a uma. Pode dar bolada… ou vexame. Escolha quem pôr no mercado:</p>
        {save.squad.map(c => (
          <button key={c.id} onClick={() => setSelId(c.id)} style={{ ...box('#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
            <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>vale ~{myValue(save, c)} 💰</span>
          </button>
        ))}
        <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
      </div>
    )
  }
  return <SellAuction save={save} card={sel} persist={persist} onBack={() => setSelId(null)} onExit={onBack} />
}
function SellAuction({ save, card, persist, onBack, onExit }: { save: Save; card: WonCard; persist: (s: Save) => void; onBack: () => void; onExit: () => void }) {
  const value = myValue(save, card)
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ Date.now()) >>> 0), []) // eslint-disable-line
  const offers = useMemo(() => {
    const buyers = shuffle(save.world.map(w => w.name), rng)
    return Array.from({ length: 4 }, (_, i) => {
      const roll = rng(); let f = 0.4 + rng() * 1.3
      if (roll > 0.9) f = 1.9 + rng() * 1.1; else if (roll < 0.18) f = 0.2 + rng() * 0.2
      return { by: buyers[i % buyers.length], amount: Math.max(1, Math.round(value * f)) }
    })
  }, [rng, value])
  const floor = Math.max(1, Math.round(value * 0.35))
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<{ amount: number; by: string } | null>(null)
  const cur = offers[idx]
  const finish = (amount: number, by: string) => {
    setDone({ amount, by })
    const newWorld = save.world.map(w => w.name === by ? { ...w, squad: giveToTeam(w.squad, card) } : w)
    persist({ ...save, coins: save.coins + amount, squad: save.squad.filter(c => c.id !== card.id), world: newWorld })
  }
  if (done) {
    const bolada = done.amount >= value * 1.5, vexame = done.amount < value * 0.5
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...box(bolada ? GOLD : vexame ? '#FBE0DA' : '#fff'), padding: 20, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{bolada ? '🤑 BOLADA!' : vexame ? '😰 VEXAME…' : '🤝 Vendido'}</p>
          <p style={{ fontWeight: 800, marginTop: 6 }}>{card.name} saiu por <b>💰 {done.amount}</b></p>
          <p style={{ fontSize: 13, color: '#666', fontWeight: 700, marginTop: 4 }}>{done.by} · (você achava ~{value})</p>
        </div>
        <Btn onClick={onExit} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Vendendo {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Você achava que valia ~{value} 💰</p>
      </div>
      <div style={{ ...box('#fff'), padding: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Oferta {idx + 1} de {offers.length} — {cur.by}</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '6px 0' }}>💰 {cur.amount}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>{idx < offers.length - 1 ? 'Recusar = espera a próxima (pode ser melhor… ou pior).' : `Última. Recusar = vende no piso (💰 ${floor}).`}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => finish(cur.amount, cur.by)} bg={GREEN} color="#fff">✅ Aceitar {cur.amount}</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => { if (idx < offers.length - 1) setIdx(idx + 1); else finish(floor, 'Comprador de piso') }} bg={RED} color="#fff">🎲 Recusar</Btn></div>
      </div>
      <Btn onClick={onBack} bg="#fff">← Desistir da venda</Btn>
    </div>
  )
}
