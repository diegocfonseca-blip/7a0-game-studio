import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type {
  EscState, Manager, Card, WonCard, Sector, FormationKey, Tactic, Bid,
  ResolvedCard, LeagueTeam, MatchResult, MatchHighlight,
} from './types'
import { SECTORS, FORMATIONS } from './types'
import { CATALOG, makeIncognita, CPU_MANAGERS, CLASSIC_CLUBS } from './data'

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
    // fama alta é escassa de propósito: ~1 lenda pra cada 2 técnicos
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
    // completa com incógnitas — garantindo joias escondidas (1 pra cada 3 técnicos)
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
// percepção: a CPU "conhece futebol" — vê o meio da faixa com ruído.
// Incógnitas têm ruído grande: às vezes a CPU também pesca joia. Ou mico.
function perceived(card: Card, rng: () => number): number {
  const mid = (card.lo + card.hi) / 2
  const noise = card.fame === 1 ? 14 : card.fame === 2 ? 7 : 3
  return mid + (rng() * 2 - 1) * noise
}

const SECTOR_WEIGHT: Record<Sector, number> = { GOL: 0.12, LAT: 0.15, ZAG: 0.19, MEI: 0.25, ATA: 0.29 }

function cpuEnvelope(m: Manager, cards: Card[], sectorIdx: number, rng: () => number, rescue: boolean): Bid[] {
  const pos = SECTORS[sectorIdx]
  const need = openSlots(m, pos)
  if (need === 0 || m.money <= 0) return []
  // orçamento do setor: peso do setor ÷ pesos restantes, temperado pelo arquétipo
  const remaining = SECTORS.slice(sectorIdx).reduce((s, p) => s + SECTOR_WEIGHT[p], 0)
  const shape = 0.65 + m.aggression * 0.8 // agressivo gasta já; frio segura pro ataque
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
    // caçador de estrela concentra no topo; frio espalha
    const share = m.starHunger > 0.5 ? (i === 0 ? 0.7 : 0.3 / Math.max(1, targets.length - 1)) : 1 / targets.length
    let amt = Math.max(1, Math.round(budget * share * (0.75 + rng() * 0.5)))
    amt = Math.min(amt, left)
    if (amt > 0) { result.push({ mgr: m.id, amount: amt, cardId: t.c.id }); left -= amt }
  })
  // sniper de 1 real: de vez em quando pinga 1 numa carta esquecida
  if (!rescue && left >= 1 && rng() < 0.45) {
    const cheap = ranked.slice(need + 1)
    if (cheap.length > 0) {
      const pick = cheap[Math.floor(rng() * cheap.length)]
      result.push({ mgr: m.id, amount: 1, cardId: pick.c.id })
    }
  }
  return result as unknown as Bid[]
}

// mapa cardId → lances (usado internamente na resolução)
type BidMap = Map<string, Bid[]>

function collectCpuBids(state: EscState, cards: Card[], rescue: boolean, rng: () => number): BidMap {
  const map: BidMap = new Map()
  for (const m of state.managers) {
    if (m.isHuman) continue
    const bids = cpuEnvelope(m, cards, state.sectorIdx, rng, rescue) as unknown as (Bid & { cardId: string })[]
    for (const b of bids) {
      const list = map.get(b.cardId) ?? []
      list.push({ mgr: b.mgr, amount: b.amount })
      map.set(b.cardId, list)
    }
  }
  return map
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
    // desempate: menos jogadores no elenco; persistindo, sorteio
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

// método do círculo: 20 times → 19 rodadas × 2 (turno e returno) = 38
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

// força da rodada: rola o nível de cada carta na faixa; elo fraco pesa
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
    return avg - (avg - min) * 0.35 // corrente vale pelo elo mais fraco
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  // tática
  if (tactic === 'retranca') { def += 4; atk -= 3 }
  if (tactic === 'ataque') { atk += 4; def -= 3 }
  if (tactic === 'equilibrio') { atk += 1; def += 1 }
  // pedra-papel-tesoura: retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca
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
  const youId = state.managers[state.youIdx].id
  const involveYou = homeId === youId || awayId === youId
  const form = (id: number, opp: Tactic, own: Tactic): TeamForm => {
    const team = state.league.find(t => t.id === id)!
    if (!team.isManager) return { atk: team.baseAtk + (rng() * 6 - 3), def: team.baseDef + (rng() * 6 - 3), inspired: null }
    const m = state.managers.find(x => x.id === id)!
    return rollManagerForm(m, own, opp, rng)
  }
  const homeTactic: Tactic = homeId === youId ? state.tactic : CPU_TACTICS[Math.floor(rng() * 3)]
  const awayTactic: Tactic = awayId === youId ? state.tactic : CPU_TACTICS[Math.floor(rng() * 3)]
  const fh = form(homeId, awayTactic, homeTactic)
  const fa = form(awayId, homeTactic, awayTactic)
  const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25) // mando de campo
  const la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
  const hg = poisson(lh, rng), ag = poisson(la, rng)

  const highlights: MatchHighlight[] = []
  if (involveYou) {
    const mkScorers = (id: number, goals: number, prefix: string) => {
      const m = state.managers.find(x => x.id === id)
      for (let g = 0; g < goals; g++) {
        const min = 3 + Math.floor(rng() * 88)
        if (m) {
          const shooters = m.squad.filter(c => c.pos === 'ATA' || c.pos === 'MEI')
          const s = shooters[Math.floor(rng() * shooters.length)] ?? m.squad[0]
          highlights.push({ min, text: `⚽ ${s.name} marca para ${prefix}!` })
        } else {
          highlights.push({ min, text: `⚽ Gol de ${prefix}.` })
        }
      }
    }
    const hName = state.league.find(t => t.id === homeId)!.name
    const aName = state.league.find(t => t.id === awayId)!.name
    mkScorers(homeId, hg, hName)
    mkScorers(awayId, ag, aName)
    highlights.sort((a, b) => a.min - b.min)
    for (const f of [fh, fa]) {
      if (f.inspired) state.news.unshift(`🔥 DIA INSPIRADO: ${f.inspired} acordou craque na rodada ${state.round + 1}!`)
    }
  }
  return { homeId, awayId, hg, ag, highlights }
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

// avança o ponteiro do monte, deixando CPUs escolherem sozinhas
function advanceMonte(state: EscState, rng: () => number) {
  while (state.monteIdx < state.monteOrder.length) {
    const mgrId = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === mgrId)!
    if (totalHoles(m) === 0) { state.monteIdx++; continue }
    if (m.isHuman) return // espera o humano escolher
    const pick = monteAutoPick(m, state.monte, rng)
    if (pick) takeFromMonte(state, pick.id)
    state.monteIdx++
  }
}

// ─── estado inicial ──────────────────────────────────────────────────
const INITIAL: EscState = {
  screen: 'intro', seed: 1,
  managers: [], youIdx: 0,
  sectorIdx: 0, deck: { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] },
  phase: 'envelope', currentCards: [], revealQueue: [], revealIdx: 0,
  stock: { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 },
  monte: [], monteOrder: [], monteIdx: 0,
  league: [], fixtures: [], round: 0, tactic: 'equilibrio',
  lastResults: [], news: [], champion: null,
}

// ─── ações ───────────────────────────────────────────────────────────
type Action =
  | { type: 'GO_SETUP' }
  | { type: 'START'; teamName: string; formation: FormationKey; rivals: number }
  | { type: 'SUBMIT_ENVELOPE'; bids: { cardId: string; amount: number }[] }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'MONTE_PICK'; cardId: string }
  | { type: 'SET_TACTIC'; tactic: Tactic }
  | { type: 'PLAY_ROUND' }
  | { type: 'SIM_MANY'; count: number }
  | { type: 'FINISH_CEREMONY' }
  | { type: 'NEW_GAME' }

function rngOf(state: EscState): () => number {
  // seed evolui com o progresso pra não repetir sequências
  return mulberry(state.seed + state.sectorIdx * 977 + state.round * 131 + state.revealIdx * 7 + state.monteIdx * 13)
}

function startAuctionPhase(state: EscState, rescue: boolean) {
  const pos = SECTORS[state.sectorIdx]
  state.phase = rescue ? 'resq_envelope' : 'envelope'
  state.currentCards = rescue ? state.currentCards : state.deck[pos]
  state.revealQueue = []
  state.revealIdx = 0
}

// fecha o envelope (humano + CPUs), resolve e prepara a revelação
function sealAndResolve(state: EscState, humanBids: { cardId: string; amount: number }[]) {
  const rng = rngOf(state)
  const rescue = state.phase === 'resq_envelope'
  const bidMap = collectCpuBids(state, state.currentCards, rescue, rng)
  const you = state.managers[state.youIdx]
  for (const hb of humanBids) {
    if (hb.amount <= 0) continue
    const list = bidMap.get(hb.cardId) ?? []
    list.push({ mgr: you.id, amount: hb.amount })
    bidMap.set(hb.cardId, list)
  }
  const { queue, unsold } = resolve(state.currentCards, bidMap, state.managers, rescue ? 'repescagem' : 'leilao', rng)
  state.revealQueue = queue
  state.revealIdx = 0
  state.phase = rescue ? 'resq_reveal' : 'reveal'
  state.currentCards = unsold
  const pos = SECTORS[state.sectorIdx]
  state.stock[pos] = 0
}

// terminou a revelação de um setor: repescagem, próximo setor ou monte
function afterReveal(state: EscState) {
  const rng = rngOf(state)
  const pos = SECTORS[state.sectorIdx]
  const unsold = state.currentCards
  if (state.phase === 'reveal') {
    const anyHole = state.managers.some(m => openSlots(m, pos) > 0)
    if (unsold.length > 0 && anyHole) {
      startAuctionPhase(state, true) // repescagem relâmpago
      return
    }
  }
  // manda sobras pro monte e segue
  state.monte.push(...unsold)
  state.currentCards = []
  if (state.sectorIdx < SECTORS.length - 1) {
    state.sectorIdx++
    startAuctionPhase(state, false)
  } else {
    // fim do leilão → monte final
    state.monteOrder = buildMonteOrder(state.managers, rng)
    state.monteIdx = 0
    state.screen = 'monte'
    advanceMonte(state, rng)
    if (state.monteIdx >= state.monteOrder.length) state.screen = 'cerimonia'
  }
}

function reducer(state: EscState, action: Action): EscState {
  const s: EscState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'GO_SETUP': {
      s.screen = 'setup'
      return s
    }
    case 'START': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      const you: Manager = {
        id: 0, name: 'Você', teamName: action.teamName || 'Meu Time', isHuman: true,
        formation: action.formation, money: START_MONEY, squad: [],
        aggression: 0.5, starHunger: 0.5,
      }
      const forms: FormationKey[] = ['4-3-3', '4-4-2', '3-5-2', '4-5-1']
      const cpus: Manager[] = CPU_MANAGERS.slice(0, action.rivals).map((c, i) => ({
        id: i + 1, name: c.name, teamName: c.team, isHuman: false,
        formation: forms[Math.floor(rng() * forms.length)],
        money: START_MONEY, squad: [],
        aggression: 0.25 + rng() * 0.7, starHunger: rng(),
      }))
      s.managers = [you, ...cpus]
      s.youIdx = 0
      s.deck = buildDeck(s.managers, rng)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0
      s.monte = []
      s.news = []
      s.round = 0
      s.champion = null
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'SUBMIT_ENVELOPE': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      sealAndResolve(s, action.bids)
      return s
    }
    case 'ADVANCE_REVEAL': {
      if (s.phase !== 'reveal' && s.phase !== 'resq_reveal') return s
      if (s.revealIdx < s.revealQueue.length - 1) {
        s.revealIdx++
      } else {
        afterReveal(s)
      }
      return s
    }
    case 'MONTE_PICK': {
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
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.round = 0
      s.screen = 'season'
      return s
    }
    case 'SET_TACTIC': {
      s.tactic = action.tactic
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
    case 'NEW_GAME':
      return { ...INITIAL }
    default:
      return s
  }
}

// ─── contexto ────────────────────────────────────────────────────────
const Ctx = createContext<{ state: EscState; dispatch: (a: Action) => void } | null>(null)

export function EscProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useEsc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEsc fora do EscProvider')
  return ctx
}

export type { Action as EscAction }
