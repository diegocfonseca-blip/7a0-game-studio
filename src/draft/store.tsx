import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { DraftState, DraftScreen, Manager, DraftPlayer } from './types'
import { START_CLUBS, AI_MANAGERS, generateFillerSquad, squadStrength } from './data'
import { LEGENDS, getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'

const ROUNDS_PER_SEASON = 6
const ROSTER_MAX = 23

const INITIAL: DraftState = {
  screen: 'intro',
  started: false,
  year: 1992,
  week: 1,
  season: 1,
  division: 4,
  round: 0,
  roundsPerSeason: ROUNDS_PER_SEASON,
  managers: [],
  youIndex: 0,
  ownedLegendIds: [],
  rosterMax: ROSTER_MAX,
  inDraft: false,
  draftOrder: [],
  draftPos: 0,
  pendingDrop: false,
  lastPickText: [],
  narrative: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: DraftScreen }
  | { type: 'START' }
  | { type: 'PICK_CLUB'; clubId: string; managerName: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'DRAFT_PICK'; legendId: string }
  | { type: 'DROP_PLAYER'; playerId: string }
  | { type: 'SKIP_PICK' }
  | { type: 'NEW_GAME' }

// ── helpers ──
export function availableLegends(state: DraftState): Legend[] {
  return LEGENDS
    .filter(l => !state.ownedLegendIds.includes(l.id) && state.year >= l.emergenceYear - 3)
    .sort((a, b) => getCurrentRating(b, state.year) - getCurrentRating(a, state.year))
}

function legendToPlayer(l: Legend, year: number): DraftPlayer {
  return {
    id: `lg-${l.id}`,
    name: l.nickname,
    pos: l.position,
    rating: getCurrentRating(l, year),
    legendId: l.id,
    nationality: l.nationality,
    potential: l.truePotential,
  }
}

function standingsOrder(managers: Manager[]): number[] {
  // worst-first: fewest points, then worst goal difference
  return managers
    .map((m, i) => ({ i, pts: m.points, gd: m.gf - m.ga }))
    .sort((a, b) => a.pts - b.pts || a.gd - b.gd)
    .map(x => x.i)
}

const PAIRINGS_4 = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]

function playMatch(sA: number, sB: number): [number, number] {
  // expected goals tilt by strength gap; some randomness keeps upsets alive
  const gap = (sA - sB) / 12
  const gA = Math.max(0, Math.round(1.1 + gap + (Math.random() - 0.5) * 2.4))
  const gB = Math.max(0, Math.round(1.1 - gap + (Math.random() - 0.5) * 2.4))
  return [gA, gB]
}

function applyResult(m: Manager, gf: number, ga: number): Manager {
  const win = gf > ga, draw = gf === ga
  return {
    ...m,
    played: m.played + 1,
    wins: m.wins + (win ? 1 : 0),
    draws: m.draws + (draw ? 1 : 0),
    losses: m.losses + (!win && !draw ? 1 : 0),
    points: m.points + (win ? 3 : draw ? 1 : 0),
    gf: m.gf + gf,
    ga: m.ga + ga,
    lastResult: `${win ? '🟢' : draw ? '🟡' : '🔴'} ${gf}–${ga}`,
  }
}

function simulateMatchday(state: DraftState): Manager[] {
  let mgrs = [...state.managers]
  const n = mgrs.length
  let pairs: number[][]
  if (n === 4) pairs = PAIRINGS_4[(state.round) % 3]
  else {
    const idx = [...Array(n).keys()].sort(() => Math.random() - 0.5)
    pairs = []
    for (let i = 0; i + 1 < idx.length; i += 2) pairs.push([idx[i], idx[i + 1]])
  }
  for (const [a, b] of pairs) {
    const [ga, gb] = playMatch(squadStrength(mgrs[a].squad), squadStrength(mgrs[b].squad))
    mgrs[a] = applyResult(mgrs[a], ga, gb)
    mgrs[b] = applyResult(mgrs[b], gb, ga)
  }
  return mgrs
}

// AI grabs the best CURRENT-rated legend it can see — it can't read the future.
function aiPick(state: DraftState, mgrIndex: number): DraftState {
  const pool = availableLegends(state)
  if (pool.length === 0) return state
  const target = pool[0] // highest current rating
  const player = legendToPlayer(target, state.year)
  let mgrs = [...state.managers]
  let squad = [...mgrs[mgrIndex].squad]
  if (squad.length >= state.rosterMax) {
    // drop the weakest filler to make room
    const weakest = [...squad].sort((a, b) => a.rating - b.rating)[0]
    squad = squad.filter(p => p.id !== weakest.id)
  }
  squad.push(player)
  mgrs[mgrIndex] = { ...mgrs[mgrIndex], squad }
  return {
    ...state,
    managers: mgrs,
    ownedLegendIds: [...state.ownedLegendIds, target.id],
    lastPickText: [...state.lastPickText, `${mgrs[mgrIndex].name} escolheu ${target.nickname} (nota ${player.rating})`],
  }
}

// Run the draft from the current pointer: AI picks auto-resolve until it's
// YOUR turn (stop for input) or the draft ends.
function runDraft(state: DraftState): DraftState {
  let s = { ...state }
  while (s.draftPos < s.draftOrder.length) {
    const mgr = s.draftOrder[s.draftPos]
    if (mgr === s.youIndex) {
      // your turn — if your squad is full you must drop first
      s.pendingDrop = s.managers[s.youIndex].squad.length >= s.rosterMax
      return s
    }
    s = aiPick(s, mgr)
    s.draftPos += 1
  }
  // draft finished
  return finishDraft(s)
}

function finishDraft(state: DraftState): DraftState {
  return { ...state, inDraft: false, draftOrder: [], draftPos: 0, pendingDrop: false }
}

function seasonEnd(state: DraftState): DraftState {
  const table = [...state.managers].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
  const champ = table[0]
  const youWon = champ.id === state.managers[state.youIndex].id
  const promoted = state.division > 1
  const newYear = state.year + 1
  const extra: string[] = [
    `🏁 FIM DA TEMPORADA ${state.season}! Campeão: ${champ.name} (${champ.points} pts).`,
  ]
  if (youWon) extra.push(`🏆 VOCÊ FOI CAMPEÃO!${promoted ? ` Seu clube SOBE para a ${state.division - 1}ª divisão.` : ' Vocês já estão na elite — agora é dominar.'}`)
  // recompute legend ratings for the new year (your young gems grow)
  const managers = state.managers.map(m => ({
    ...m,
    points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—',
    squad: m.squad.map(p => p.legendId
      ? { ...p, rating: getCurrentRating(LEGENDS.find(l => l.id === p.legendId)!, newYear) }
      : p),
  }))
  return {
    ...state,
    managers,
    season: state.season + 1,
    round: 0,
    year: newYear,
    week: 1,
    division: youWon && promoted ? state.division - 1 : state.division,
    narrative: [...state.narrative, ...extra],
  }
}

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'START':
      return { ...state, screen: 'pickClub' }

    case 'PICK_CLUB': {
      const chosen = START_CLUBS.find(c => c.id === action.clubId)!
      const others = START_CLUBS.filter(c => c.id !== action.clubId).sort(() => Math.random() - 0.5).slice(0, 3)
      const aiNames = [...AI_MANAGERS].sort(() => Math.random() - 0.5)
      const you: Manager = {
        id: 'you', name: action.managerName || 'Você', isYou: true,
        clubName: chosen.name, clubCity: chosen.city, squad: generateFillerSquad(),
        points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—',
      }
      const ais: Manager[] = others.map((c, i) => ({
        id: `ai${i}`, name: aiNames[i], isYou: false,
        clubName: c.name, clubCity: c.city, squad: generateFillerSquad(),
        points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—',
      }))
      return {
        ...state,
        started: true,
        screen: 'hub',
        managers: [you, ...ais],
        youIndex: 0,
        narrative: [
          `⚡ O raio caiu na pelada dos casados e jogou todo mundo de volta pra 1992.`,
          `Só você e a galera lembram quem vai virar lenda. Agora é correr pra fisgar esses craques antes dos outros.`,
          `Você assumiu o ${chosen.name} (${chosen.city}), um time da 4ª divisão cheio de pernas-de-pau. Bora montar uma dinastia.`,
        ],
      }
    }

    case 'ADVANCE_ROUND': {
      if (state.inDraft) return state
      // final round of the season → play it then close the season
      const isFinal = state.round + 1 >= state.roundsPerSeason
      const managers = simulateMatchday(state)
      const youM = managers[state.youIndex]
      const afterMatch: DraftState = {
        ...state,
        managers,
        round: state.round + 1,
        week: Math.min(50, (state.round + 1) * 8),
        narrative: [...state.narrative, `📅 Rodada ${state.round + 1}: ${youM.clubName} fez ${youM.lastResult}.`],
      }
      if (isFinal) return seasonEnd(afterMatch)
      // open a draft, worst-first
      const draftOrder = standingsOrder(managers)
      const r = runDraft({ ...afterMatch, inDraft: true, draftOrder, draftPos: 0, lastPickText: [] })
      return { ...r, screen: r.inDraft ? 'draft' : 'hub' }
    }

    case 'DRAFT_PICK': {
      if (!state.inDraft || state.pendingDrop) return state
      const legend = LEGENDS.find(l => l.id === action.legendId)
      if (!legend || state.ownedLegendIds.includes(legend.id)) return state
      const player = legendToPlayer(legend, state.year)
      const mgrs = [...state.managers]
      const you = mgrs[state.youIndex]
      if (you.squad.length >= state.rosterMax) return { ...state, pendingDrop: true }
      mgrs[state.youIndex] = { ...you, squad: [...you.squad, player] }
      const s: DraftState = {
        ...state,
        managers: mgrs,
        ownedLegendIds: [...state.ownedLegendIds, legend.id],
        lastPickText: [...state.lastPickText, `⭐ VOCÊ escolheu ${legend.nickname} (nota ${player.rating} · potencial ${legend.truePotential})`],
        draftPos: state.draftPos + 1,
      }
      const r = runDraft(s)
      return { ...r, screen: r.inDraft ? 'draft' : 'hub' }
    }

    case 'SKIP_PICK': {
      if (!state.inDraft) return state
      const s = { ...state, draftPos: state.draftPos + 1, pendingDrop: false,
        lastPickText: [...state.lastPickText, `VOCÊ passou a vez.`] }
      const r = runDraft(s)
      return { ...r, screen: r.inDraft ? 'draft' : 'hub' }
    }

    case 'DROP_PLAYER': {
      const mgrs = [...state.managers]
      const you = mgrs[state.youIndex]
      mgrs[state.youIndex] = { ...you, squad: you.squad.filter(p => p.id !== action.playerId) }
      return { ...state, managers: mgrs, pendingDrop: false }
    }

    case 'NEW_GAME':
      localStorage.removeItem('draft-v1')
      return { ...INITIAL }

    default:
      return state
  }
}

const Ctx = createContext<{ state: DraftState; dispatch: React.Dispatch<Action> } | null>(null)

export function DraftProvider({ children }: { children: ReactNode }) {
  const saved = localStorage.getItem('draft-v1')
  let initial = INITIAL
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.started) initial = { ...INITIAL, ...parsed }
    } catch { initial = INITIAL }
  }
  const [state, dispatch] = useReducer(reducer, initial)
  if (state.started) localStorage.setItem('draft-v1', JSON.stringify(state))
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useDraft() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDraft must be used within DraftProvider')
  return ctx
}
