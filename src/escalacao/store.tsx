import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
  EscState, Manager, Card, WonCard, Sector, FormationKey, Tactic, Bid,
  ResolvedCard, LeagueTeam, MatchResult, MatchHighlight, ScorerRow,
} from './types'
import { SECTORS, FORMATIONS } from './types'
import { CATALOG, makeIncognita, CPU_MANAGERS, CLASSIC_CLUBS } from './data'
import { supabase } from '../lib/supabase'

export const START_MONEY = 100
const LEAGUE_SIZE = 20
const TOTAL_ROUNDS = 38

// ─── RNG com seed (reprodutível dentro da partida) ───────────────────
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}

// ─── helpers de elenco ───────────────────────────────────────────────
export function slotsOf(m: Manager, pos: Sector): number {
  return FORMATIONS[m.formation][pos]
}
export function filled(m: Manager, pos: Sector): number {
  return m.squad.filter(c => c.pos === pos).length
}
export function openSlots(m: Manager, pos: Sector): number {
  return Math.max(0, slotsOf(m, pos) - filled(m, pos))
}
export function totalHoles(m: Manager): number {
  return SECTORS.reduce((s, pos) => s + openSlots(m, pos), 0)
}

// ─── montagem do baralho: demanda da sala × 1,3 por setor ────────────
function buildDeck(managers: Manager[], rng: () => number): Record<Sector, Card[]> {
  const deck = {} as Record<Sector, Card[]>
  for (const pos of SECTORS) {
    const demand = managers.reduce((s, m) => s + slotsOf(m, pos), 0)
    const count = Math.ceil(demand * 1.3)
    const catalog = [...CATALOG[pos]].sort(() => rng() - 0.5)
    const cards: Card[] = []
    const legendCap = Math.max(1, Math.ceil(managers.length / 2))
    let legends = 0
    for (const c of catalog) {
      if (cards.length >= Math.floor(count * 0.72)) break
      if (c.fame === 5) {
        if (legends >= legendCap) continue
        legends++
      }
      cards.push({ ...c, id: `cat-${pos}-${cards.length}`, pos })
    }
    const gems = Math.max(1, Math.ceil(managers.length / 3))
    let gi = 0
    while (cards.length < count) {
      cards.push(makeIncognita(pos, cards.length, gi < gems, rng))
      gi++
    }
    deck[pos] = cards
  }
  return deck
}

// ─── CPU: envelopes de lance ─────────────────────────────────────────
function perceived(card: Card, rng: () => number): number {
  const mid = (card.lo + card.hi) / 2
  const noise = card.fame === 1 ? 14 : card.fame === 2 ? 7 : 3
  return mid + (rng() * 2 - 1) * noise
}

const SECTOR_WEIGHT: Record<Sector, number> = { GOL: 0.12, LAT: 0.15, ZAG: 0.19, MEI: 0.25, ATA: 0.29 }

function cpuEnvelope(m: Manager, cards: Card[], sectorIdx: number, rng: () => number, rescue: boolean): (Bid & { cardId: string })[] {
  const pos = SECTORS[sectorIdx]
  const need = openSlots(m, pos)
  if (need === 0 || m.money <= 0) return []
  const remaining = SECTORS.slice(sectorIdx).reduce((s, p) => s + SECTOR_WEIGHT[p], 0)
  const shape = 0.65 + m.aggression * 0.8
  let budget = rescue
    ? Math.min(m.money, 4 + Math.floor(rng() * 6))
    : Math.max(1, Math.floor(m.money * (SECTOR_WEIGHT[pos] / remaining) * shape * (0.85 + rng() * 0.4)))
  budget = Math.min(budget, m.money)

  const ranked = cards.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  const targets = ranked.slice(0, Math.min(cards.length, need + (rng() < 0.6 ? 1 : 0)))
  const result: (Bid & { cardId: string })[] = []
  let left = budget
  targets.forEach((t, i) => {
    if (left <= 0) return
    const share = m.starHunger > 0.5 ? (i === 0 ? 0.7 : 0.3 / Math.max(1, targets.length - 1)) : 1 / targets.length
    let amt = Math.max(1, Math.round(budget * share * (0.75 + rng() * 0.5)))
    amt = Math.min(amt, left)
    if (amt > 0) { result.push({ mgr: m.id, amount: amt, cardId: t.c.id }); left -= amt }
  })
  if (!rescue && left >= 1 && rng() < 0.45) {
    const cheap = ranked.slice(need + 1)
    if (cheap.length > 0) {
      const pick = cheap[Math.floor(rng() * cheap.length)]
      result.push({ mgr: m.id, amount: 1, cardId: pick.c.id })
    }
  }
  return result
}

type BidMap = Map<string, Bid[]>

function pushBid(map: BidMap, cardId: string, bid: Bid) {
  const list = map.get(cardId) ?? []
  list.push(bid)
  map.set(cardId, list)
}

// ─── resolução: pote crescente, maior lance leva, anulação por setor cheio ──
function resolve(cards: Card[], bidMap: BidMap, managers: Manager[], via: 'leilao' | 'repescagem', rng: () => number): { queue: ResolvedCard[]; unsold: Card[] } {
  const byPot = [...cards].sort((a, b) => {
    const pa = (bidMap.get(a.id) ?? []).reduce((s, x) => s + x.amount, 0)
    const pb = (bidMap.get(b.id) ?? []).reduce((s, x) => s + x.amount, 0)
    return pa - pb
  })
  const queue: ResolvedCard[] = []
  const unsold: Card[] = []
  for (const card of byPot) {
    const bids = (bidMap.get(card.id) ?? []).sort((a, b) => b.amount - a.amount)
    if (bids.length === 0) {
      unsold.push(card)
      queue.push({ card, bids: [], winner: null, paid: 0, voided: [] })
      continue
    }
    const voided: number[] = []
    let winner: number | null = null
    let paid = 0
    const sorted = [...bids].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount
      const ma = managers.find(x => x.id === a.mgr)!, mb = managers.find(x => x.id === b.mgr)!
      if (ma.squad.length !== mb.squad.length) return ma.squad.length - mb.squad.length
      return rng() - 0.5
    })
    for (const b of sorted) {
      const m = managers.find(x => x.id === b.mgr)!
      if (openSlots(m, card.pos) <= 0) { voided.push(b.mgr); continue }
      if (m.money < b.amount) { voided.push(b.mgr); continue }
      winner = b.mgr; paid = b.amount
      m.money -= b.amount
      m.squad.push({ ...card, paid: b.amount, via } as WonCard)
      break
    }
    if (winner === null) unsold.push(card)
    queue.push({ card, bids: sorted, winner, paid, voided })
  }
  return { queue, unsold }
}

// ─── temporada ───────────────────────────────────────────────────────
function buildLeague(managers: Manager[]): LeagueTeam[] {
  const teams: LeagueTeam[] = managers.map(m => ({
    id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0,
    pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
  }))
  const fill = LEAGUE_SIZE - teams.length
  for (let i = 0; i < fill; i++) {
    const c = CLASSIC_CLUBS[i % CLASSIC_CLUBS.length]
    teams.push({
      id: 100 + i, name: c.name, isManager: false, baseAtk: c.atk, baseDef: c.def,
      pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
    })
  }
  return teams
}

function buildFixtures(teams: LeagueTeam[]): [number, number][][] {
  const ids = teams.map(t => t.id)
  const n = ids.length
  const rounds: [number, number][][] = []
  const rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) {
      round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    }
    rounds.push(round)
    rot.unshift(rot.pop()!)
  }
  const volta: [number, number][][] = rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))
  return [...rounds, ...volta]
}

interface TeamForm { atk: number; def: number; inspired: string | null }

function rollManagerForm(m: Manager, tactic: Tactic, oppTactic: Tactic, rng: () => number): TeamForm {
  const rolls = m.squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  let inspired: string | null = null
  for (const r of rolls) {
    if (r.c.hi - r.c.lo >= 14 && r.lvl >= r.c.hi - 2.5) inspired = r.c.name
  }
  const sector = (pos: Sector): number => {
    const s = rolls.filter(r => r.c.pos === pos)
    if (s.length === 0) return 40
    const avg = s.reduce((x, r) => x + r.lvl, 0) / s.length
    const min = Math.min(...s.map(r => r.lvl))
    return avg - (avg - min) * 0.35
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tactic === 'retranca') { def += 4; atk -= 3 }
  if (tactic === 'ataque') { atk += 4; def -= 3 }
  if (tactic === 'equilibrio') { atk += 1; def += 1 }
  if (tactic === 'retranca' && oppTactic === 'ataque') def += 2.5
  if (tactic === 'ataque' && oppTactic === 'equilibrio') atk += 2.5
  if (tactic === 'equilibrio' && oppTactic === 'retranca') atk += 2.5
  if (inspired) atk += 2
  return { atk, def, inspired }
}

function poisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= rng() } while (p > L)
  return k - 1
}

const CPU_TACTICS: Tactic[] = ['retranca', 'equilibrio', 'ataque']

function simMatch(state: EscState, homeId: number, awayId: number, rng: () => number): MatchResult {
  const isHuman = (id: number) => state.managers.some(m => m.id === id && m.isHuman)
  const involveHuman = isHuman(homeId) || isHuman(awayId)
  const tacticOf = (id: number): Tactic => {
    const m = state.managers.find(x => x.id === id)
    if (!m) return 'equilibrio'
    if (m.isHuman) return state.tactics[id] ?? 'equilibrio'
    return CPU_TACTICS[Math.floor(rng() * 3)]
  }
  const homeTactic = tacticOf(homeId)
  const awayTactic = tacticOf(awayId)
  const form = (id: number, opp: Tactic, own: Tactic): TeamForm => {
    const team = state.league.find(t => t.id === id)!
    if (!team.isManager) return { atk: team.baseAtk + (rng() * 6 - 3), def: team.baseDef + (rng() * 6 - 3), inspired: null }
    const m = state.managers.find(x => x.id === id)!
    return rollManagerForm(m, own, opp, rng)
  }
  const fh = form(homeId, awayTactic, homeTactic)
  const fa = form(awayId, homeTactic, awayTactic)
  const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25)
  const la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
  const hg = poisson(lh, rng), ag = poisson(la, rng)

  const highlights: MatchHighlight[] = []
  // atribui os gols a um jogador real e credita na artilharia da temporada
  const creditGoals = (id: number, goals: number, prefix: string) => {
    const m = state.managers.find(x => x.id === id)
    for (let g = 0; g < goals; g++) {
      const min = 3 + Math.floor(rng() * 88)
      let scorerName: string | null = null
      if (m && m.squad.length > 0) {
        const pool: { name: string; w: number }[] = []
        for (const c of m.squad) {
          const w = c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05
          pool.push({ name: c.name, w })
        }
        const total = pool.reduce((s, p) => s + p.w, 0)
        let r = rng() * total
        for (const p of pool) { r -= p.w; if (r <= 0) { scorerName = p.name; break } }
        if (!scorerName) scorerName = pool[0].name
      }
      if (scorerName) {
        // credita no ranking
        const row = state.scorers.find(s => s.name === scorerName && s.teamId === id)
        if (row) row.goals++
        else state.scorers.push({ name: scorerName, teamId: id, teamName: prefix, goals: 1 })
        if (involveHuman) highlights.push({ min, text: `⚽ ${scorerName} marca para ${prefix}!` })
      } else if (involveHuman) {
        highlights.push({ min, text: `⚽ Gol de ${prefix}.` })
      }
    }
  }
  const hName = state.league.find(t => t.id === homeId)!.name
  const aName = state.league.find(t => t.id === awayId)!.name
  creditGoals(homeId, hg, hName)
  creditGoals(awayId, ag, aName)
  if (involveHuman) {
    highlights.sort((a, b) => a.min - b.min)
    for (const [id, f] of [[homeId, fh], [awayId, fa]] as [number, TeamForm][]) {
      if (f.inspired && isHuman(id)) {
        const tn = state.league.find(t => t.id === id)!.name
        state.news.unshift(`🔥 DIA INSPIRADO: ${f.inspired} (${tn}) acordou craque na rodada ${state.round + 1}!`)
      }
    }
  }
  return { homeId, awayId, hg, ag, highlights }
}

export function topScorers(state: EscState, limit = 10): ScorerRow[] {
  return [...state.scorers].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, limit)
}

function applyResult(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId)!, a = league.find(t => t.id === r.awayId)!
  h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg
  if (r.hg > r.ag) { h.pts += 3; h.w++; a.l++ }
  else if (r.hg < r.ag) { a.pts += 3; a.w++; h.l++ }
  else { h.pts++; a.pts++; h.d++; a.d++ }
}

export function sortedTable(league: LeagueTeam[]): LeagueTeam[] {
  return [...league].sort((a, b) =>
    b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name))
}

// ─── monte final: ordem serpente por buracos ─────────────────────────
function buildMonteOrder(managers: Manager[], rng: () => number): number[] {
  const withHoles = managers.filter(m => totalHoles(m) > 0)
  if (withHoles.length === 0) return []
  const base = [...withHoles].sort((a, b) => totalHoles(b) - totalHoles(a) || rng() - 0.5).map(m => m.id)
  const maxHoles = Math.max(...withHoles.map(m => totalHoles(m)))
  const order: number[] = []
  for (let pass = 0; pass < maxHoles; pass++) {
    const seq = pass % 2 === 0 ? base : [...base].reverse()
    order.push(...seq)
  }
  return order
}

function monteAutoPick(m: Manager, monte: Card[], rng: () => number): Card | null {
  const valid = monte.filter(c => openSlots(m, c.pos) > 0)
  if (valid.length === 0) return null
  const ranked = valid.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  return ranked[0].c
}

function takeFromMonte(state: EscState, cardId: string) {
  const idx = state.monte.findIndex(c => c.id === cardId)
  if (idx < 0) return
  const card = state.monte[idx]
  const mgrId = state.monteOrder[state.monteIdx]
  const m = state.managers.find(x => x.id === mgrId)!
  state.monte.splice(idx, 1)
  m.squad.push({ ...card, paid: 0, via: 'monte' })
}

// avança o ponteiro do monte, deixando CPUs escolherem sozinhas.
// Para em técnico humano (aguarda a escolha dele).
function advanceMonte(state: EscState, rng: () => number) {
  while (state.monteIdx < state.monteOrder.length) {
    const mgrId = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === mgrId)!
    if (totalHoles(m) === 0) { state.monteIdx++; continue }
    if (m.isHuman) return
    const pick = monteAutoPick(m, state.monte, rng)
    if (pick) takeFromMonte(state, pick.id)
    state.monteIdx++
  }
}

// ─── setup de técnicos ───────────────────────────────────────────────
function makeManagers(humanNames: string[], formation: FormationKey, targetTotal: number, rng: () => number): Manager[] {
  const forms: FormationKey[] = ['4-3-3', '4-4-2', '3-5-2', '4-5-1']
  const humans: Manager[] = humanNames.map((name, i) => ({
    id: i, name, teamName: name, isHuman: true,
    formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5,
  }))
  const cpuCount = Math.max(0, targetTotal - humans.length)
  const cpus: Manager[] = CPU_MANAGERS.slice(0, cpuCount).map((c, i) => ({
    id: humans.length + i, name: c.name, teamName: c.team, isHuman: false,
    formation: forms[Math.floor(rng() * forms.length)],
    money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng(),
  }))
  return [...humans, ...cpus]
}

// ─── estado inicial ──────────────────────────────────────────────────
const INITIAL: EscState = {
  screen: 'intro', seed: 1,
  onlineMode: 'cpu', roomId: '', roomCode: '', isHost: true,
  humanCount: 1, submitted: [], pendingEnvelopes: {}, presence: [],
  managers: [], youIdx: 0,
  sectorIdx: 0, deck: { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] },
  phase: 'envelope', currentCards: [], revealQueue: [], revealIdx: 0,
  stock: { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 },
  monte: [], monteOrder: [], monteIdx: 0,
  league: [], fixtures: [], round: 0, tactics: {},
  lastResults: [], news: [], champion: null,
  phaseDeadline: null, scorers: [],
}

// ─── ações ───────────────────────────────────────────────────────────
type Action =
  | { type: 'GO_LOBBY' }
  | { type: 'GO_LOBBY_ONLINE' }
  | { type: 'GO_SETUP' }
  | { type: 'START'; teamName: string; formation: FormationKey; rivals: number }
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; isHost: boolean; playerIndex: number; playerNames: string[] }
  | { type: 'SYNC_STATE'; newState: EscState }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'SUBMIT_ENVELOPE'; mgrId: number; bids: { cardId: string; amount: number }[] }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'MONTE_PICK'; mgrId: number; cardId: string }
  | { type: 'SET_TACTIC'; mgrId: number; tactic: Tactic }
  | { type: 'PLAY_ROUND' }
  | { type: 'SIM_MANY'; count: number }
  | { type: 'FINISH_CEREMONY' }
  | { type: 'NEW_GAME' }

function rngOf(state: EscState): () => number {
  return mulberry(state.seed + state.sectorIdx * 977 + state.round * 131 + state.revealIdx * 7 + state.monteIdx * 13 + state.submitted.length * 101)
}

const ENVELOPE_MS = 45_000

function startAuctionPhase(state: EscState, rescue: boolean) {
  const pos = SECTORS[state.sectorIdx]
  state.phase = rescue ? 'resq_envelope' : 'envelope'
  state.currentCards = rescue ? state.currentCards : state.deck[pos]
  state.revealQueue = []
  state.revealIdx = 0
  state.submitted = []
  state.pendingEnvelopes = {}
  state.phaseDeadline = Date.now() + ENVELOPE_MS
}

// resolve o setor a partir dos envelopes coletados (humanos) + CPUs
function sealAndResolve(state: EscState) {
  const rng = rngOf(state)
  const rescue = state.phase === 'resq_envelope'
  const bidMap: BidMap = new Map()
  // CPUs
  for (const m of state.managers) {
    if (m.isHuman) continue
    for (const b of cpuEnvelope(m, state.currentCards, state.sectorIdx, rng, rescue)) {
      pushBid(bidMap, b.cardId, { mgr: b.mgr, amount: b.amount })
    }
  }
  // humanos (envelopes coletados)
  for (const [mgrIdStr, env] of Object.entries(state.pendingEnvelopes)) {
    const mgrId = Number(mgrIdStr)
    for (const hb of env) {
      if (hb.amount > 0) pushBid(bidMap, hb.cardId, { mgr: mgrId, amount: hb.amount })
    }
  }
  const { queue, unsold } = resolve(state.currentCards, bidMap, state.managers, rescue ? 'repescagem' : 'leilao', rng)
  state.revealQueue = queue
  state.revealIdx = 0
  state.phase = rescue ? 'resq_reveal' : 'reveal'
  state.currentCards = unsold
  state.submitted = []
  state.pendingEnvelopes = {}
}

// só humanos "presentes" precisam enviar; ausentes passam
function humansToSubmit(state: EscState, pos: Sector): number[] {
  return state.managers
    .filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
    .filter(m => state.onlineMode !== 'online' || state.presence.length === 0 || state.presence.includes(m.id))
    .map(m => m.id)
}

function afterReveal(state: EscState) {
  const rng = rngOf(state)
  const pos = SECTORS[state.sectorIdx]
  const unsold = state.currentCards
  if (state.phase === 'reveal') {
    const anyHole = state.managers.some(m => openSlots(m, pos) > 0)
    if (unsold.length > 0 && anyHole) {
      startAuctionPhase(state, true)
      return
    }
  }
  state.monte.push(...unsold)
  state.currentCards = []
  if (state.sectorIdx < SECTORS.length - 1) {
    state.sectorIdx++
    startAuctionPhase(state, false)
  } else {
    state.monteOrder = buildMonteOrder(state.managers, rng)
    state.monteIdx = 0
    state.screen = 'monte'
    advanceMonte(state, rng)
    if (state.monteIdx >= state.monteOrder.length) state.screen = 'cerimonia'
  }
}

export function reducer(state: EscState, action: Action): EscState {
  if (action.type === 'SYNC_STATE') return action.newState
  if (action.type === 'NEW_GAME') return { ...INITIAL }
  const s: EscState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'GO_LOBBY': { s.screen = 'intro'; s.onlineMode = 'cpu'; return s }
    case 'GO_LOBBY_ONLINE': { s.screen = 'lobby'; return s }
    case 'GO_SETUP': { s.screen = 'setup'; return s }
    case 'SET_PRESENCE': { s.presence = action.indices; return s }
    case 'START': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'
      s.isHost = true
      s.humanCount = 1
      s.managers = makeManagers([action.teamName || 'Meu Time'], action.formation, 1 + action.rivals, rng)
      s.youIdx = 0
      s.deck = buildDeck(s.managers, rng)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'START_ONLINE': {
      s.onlineMode = 'online'
      s.roomId = action.roomId
      s.roomCode = action.roomCode
      s.isHost = action.isHost
      s.youIdx = action.playerIndex
      s.humanCount = action.playerNames.length
      s.seed = hashCode(action.roomCode)
      const rng = mulberry(s.seed)
      const total = Math.max(4, action.playerNames.length)
      s.managers = makeManagers(action.playerNames, '4-3-3', total, rng)
      s.deck = buildDeck(s.managers, rng)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'SUBMIT_ENVELOPE': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      if (s.submitted.includes(action.mgrId)) return s
      s.pendingEnvelopes[action.mgrId] = action.bids
      s.submitted.push(action.mgrId)
      const pos = SECTORS[s.sectorIdx]
      const need = humansToSubmit(s, pos)
      const allIn = need.every(id => s.submitted.includes(id))
      if (allIn) sealAndResolve(s)
      return s
    }
    case 'ADVANCE_REVEAL': {
      if (s.phase !== 'reveal' && s.phase !== 'resq_reveal') return s
      if (s.revealIdx < s.revealQueue.length - 1) s.revealIdx++
      else afterReveal(s)
      return s
    }
    case 'MONTE_PICK': {
      if (s.screen !== 'monte') return s
      if (s.monteOrder[s.monteIdx] !== action.mgrId) return s
      const rng = rngOf(s)
      takeFromMonte(s, action.cardId)
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(m => totalHoles(m) === 0)) {
        s.screen = 'cerimonia'
      }
      return s
    }
    case 'FINISH_CEREMONY': {
      if (s.screen !== 'cerimonia') return s
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.round = 0
      s.screen = 'season'
      return s
    }
    case 'SET_TACTIC': {
      s.tactics[action.mgrId] = action.tactic
      return s
    }
    case 'PLAY_ROUND':
    case 'SIM_MANY': {
      const times = action.type === 'PLAY_ROUND' ? 1 : action.count
      for (let i = 0; i < times && s.round < TOTAL_ROUNDS; i++) {
        const rng = mulberry(s.seed + 5000 + s.round * 37)
        const results = s.fixtures[s.round].map(([h, a]) => simMatch(s, h, a, rng))
        results.forEach(r => applyResult(s.league, r))
        s.lastResults = results
        s.round++
      }
      s.news = s.news.slice(0, 12)
      if (s.round >= TOTAL_ROUNDS) {
        s.champion = sortedTable(s.league)[0].id
        s.screen = 'end'
      }
      return s
    }
    default:
      return s
  }
}

// ─── contexto + provider (host-autoritativo, espelha o modo Draft) ───
const Ctx = createContext<{ state: EscState; dispatch: (a: Action) => void } | null>(null)

export function EscProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isHostRef = useRef(state.isHost)
  const onlineRef = useRef(state.onlineMode)
  const stateRef = useRef(state)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { isHostRef.current = state.isHost }, [state.isHost])
  useEffect(() => { onlineRef.current = state.onlineMode }, [state.onlineMode])
  useEffect(() => { stateRef.current = state }, [state])

  // convidado roteia ações pro host; host aplica local
  const dispatch = useCallback((action: Action) => {
    if (onlineRef.current === 'online' && !isHostRef.current && action.type !== 'GO_LOBBY' && action.type !== 'NEW_GAME') {
      channelRef.current?.send({ type: 'broadcast', event: 'action', payload: action })
    } else {
      rawDispatch(action)
    }
  }, [])

  // canal realtime quando online
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    const ch = supabase.channel(`escalacao:${state.roomId}`, { config: { broadcast: { self: false, ack: false } } })

    if (state.isHost) {
      ch.on('broadcast', { event: 'action' }, ({ payload }: { payload: Action }) => rawDispatch(payload))
      ch.on('broadcast', { event: 'request_state' }, () => {
        channelRef.current?.send({ type: 'broadcast', event: 'state', payload: sanitize(stateRef.current) })
      })
    } else {
      ch.on('broadcast', { event: 'state' }, ({ payload }: { payload: EscState }) => rawDispatch({ type: 'SYNC_STATE', newState: payload }))
    }
    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState()
      const indices = Object.values(pState).flat().map((p: unknown) => (p as { playerIndex: number }).playerIndex)
      rawDispatch({ type: 'SET_PRESENCE', indices })
    })
    ch.subscribe(async () => {
      await ch.track({ playerIndex: state.youIdx })
      if (!state.isHost) channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
    })
    channelRef.current = ch
    return () => { ch.unsubscribe(); channelRef.current = null }
  }, [state.roomId, state.onlineMode, state.isHost]) // eslint-disable-line react-hooks/exhaustive-deps

  // host retransmite estado (sanitizado: envelopes pendentes não vazam)
  const prevRef = useRef<EscState | null>(null)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    if (prevRef.current === state) return
    prevRef.current = state
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: sanitize(state) })
  }, [state])

  // host persiste no banco a cada 3s
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId || state.screen === 'intro') return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      supabase.from('game_rooms').update({ game_state: sanitize(state) }).eq('id', state.roomId)
    }, 3000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [state])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

// mantém o leilão cego: convidados nunca recebem os envelopes pendentes,
// só quem já lacrou (contador) — os valores só aparecem na revelação.
function sanitize(state: EscState): EscState {
  return { ...state, pendingEnvelopes: {} }
}

export function useEsc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEsc fora do EscProvider')
  return ctx
}

export type { Action as EscAction }
