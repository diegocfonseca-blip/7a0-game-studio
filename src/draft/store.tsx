import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { DraftState, DraftScreen, Manager, DraftPlayer, Tactic } from './types'
import { START_CLUBS, AI_MANAGERS, generateFillerSquad, squadStrength, bestEleven } from './data'
import { LEGENDS, getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'

const ROUNDS_PER_SEASON = 6
const ROSTER_MAX = 23
const INITIAL_DRAFT_ROUNDS = 5
const SEASON_DRAFT_ROUNDS = 2

const INITIAL: DraftState = {
  screen: 'intro', started: false, year: 1992, week: 1, season: 1, division: 4,
  round: 0, roundsPerSeason: ROUNDS_PER_SEASON, managers: [], youIndex: 0,
  ownedLegendIds: [], rosterMax: ROSTER_MAX,
  inDraft: false, draftKind: 'initial', draftOrder: [], draftPos: 0, draftRoundsLeft: 0,
  pendingDrop: false, lastPickText: [], narrative: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: DraftScreen }
  | { type: 'START' }
  | { type: 'PICK_CLUB'; clubId: string; managerName: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'DRAFT_PICK'; legendId: string }
  | { type: 'DROP_PLAYER'; playerId: string }
  | { type: 'SKIP_PICK' }
  | { type: 'SET_LINEUP'; playerId: string }
  | { type: 'SET_TACTIC'; tactic: Tactic }
  | { type: 'NEW_GAME' }

// ── helpers ──
export function availableLegends(state: DraftState): Legend[] {
  return LEGENDS
    .filter(l => !state.ownedLegendIds.includes(l.id) && state.year >= l.emergenceYear - 3)
    .sort((a, b) => getCurrentRating(b, state.year) - getCurrentRating(a, state.year))
}

function legendToPlayer(l: Legend, year: number): DraftPlayer {
  return {
    id: `lg-${l.id}`, name: l.nickname, pos: l.position,
    rating: getCurrentRating(l, year), legendId: l.id, nationality: l.nationality,
    potential: l.truePotential, devBonus: 0,
  }
}

function standingsOrder(managers: Manager[]): number[] {
  return managers
    .map((m, i) => ({ i, pts: m.points, gd: m.gf - m.ga }))
    .sort((a, b) => a.pts - b.pts || a.gd - b.gd) // worst first
    .map(x => x.i)
}

const PAIRINGS_4 = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]
const ATK: Record<Tactic, number> = { retranca: -0.8, equilibrio: 0, ataque: 1.0 }
const DEF: Record<Tactic, number> = { retranca: 1.0, equilibrio: 0, ataque: -0.6 } // how much you smother the opponent

function matchGoals(rA: number, tA: Tactic, rB: number, tB: Tactic): [number, number] {
  const xgA = Math.max(0.2, 1.2 + (rA - rB) / 14 + ATK[tA] - DEF[tB])
  const xgB = Math.max(0.2, 1.2 + (rB - rA) / 14 + ATK[tB] - DEF[tA])
  return [
    Math.max(0, Math.round(xgA + (Math.random() - 0.5) * 2.2)),
    Math.max(0, Math.round(xgB + (Math.random() - 0.5) * 2.2)),
  ]
}

function applyResult(m: Manager, gf: number, ga: number): Manager {
  const win = gf > ga, draw = gf === ga
  return {
    ...m,
    played: m.played + 1,
    wins: m.wins + (win ? 1 : 0), draws: m.draws + (draw ? 1 : 0), losses: m.losses + (!win && !draw ? 1 : 0),
    points: m.points + (win ? 3 : draw ? 1 : 0), gf: m.gf + gf, ga: m.ga + ga,
    lastResult: `${win ? '🟢' : draw ? '🟡' : '🔴'} ${gf}–${ga}`,
  }
}

function tacticOf(m: Manager): Tactic {
  return m.isYou ? m.tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
}

function simulateMatchday(state: DraftState): Manager[] {
  let mgrs = [...state.managers]
  const n = mgrs.length
  let pairs: number[][]
  if (n === 4) pairs = PAIRINGS_4[state.round % 3]
  else {
    const idx = [...Array(n).keys()].sort(() => Math.random() - 0.5)
    pairs = []
    for (let i = 0; i + 1 < idx.length; i += 2) pairs.push([idx[i], idx[i + 1]])
  }
  for (const [a, b] of pairs) {
    const [ga, gb] = matchGoals(
      squadStrength(mgrs[a].squad, mgrs[a].lineupIds), tacticOf(mgrs[a]),
      squadStrength(mgrs[b].squad, mgrs[b].lineupIds), tacticOf(mgrs[b]),
    )
    mgrs[a] = applyResult(mgrs[a], ga, gb)
    mgrs[b] = applyResult(mgrs[b], gb, ga)
  }
  return mgrs
}

// AI grabs the best CURRENT-rated legend it can see — it can't read the future.
function aiPick(state: DraftState, mgrIndex: number): DraftState {
  const pool = availableLegends(state)
  if (pool.length === 0) return state
  const target = pool[0]
  const player = legendToPlayer(target, state.year)
  const mgrs = [...state.managers]
  let squad = [...mgrs[mgrIndex].squad]
  if (squad.length >= state.rosterMax) {
    const weakest = [...squad].sort((a, b) => a.rating - b.rating)[0]
    squad = squad.filter(p => p.id !== weakest.id)
  }
  squad.push(player)
  mgrs[mgrIndex] = { ...mgrs[mgrIndex], squad }
  return {
    ...state, managers: mgrs,
    ownedLegendIds: [...state.ownedLegendIds, target.id],
    lastPickText: [...state.lastPickText, `${mgrs[mgrIndex].name} escolheu ${target.nickname} (nota ${player.rating})`],
  }
}

// Snake draft: resolve AI picks until it's YOUR turn (stop) or the draft ends.
function runDraft(state: DraftState): DraftState {
  let s = { ...state }
  for (let guard = 0; guard < 200; guard++) {
    if (s.draftPos >= s.draftOrder.length) {
      s.draftRoundsLeft -= 1
      if (s.draftRoundsLeft <= 0) return finishDraft(s)
      s.draftOrder = [...s.draftOrder].reverse() // snake back
      s.draftPos = 0
    }
    const mgr = s.draftOrder[s.draftPos]
    if (mgr === s.youIndex) {
      s.pendingDrop = s.managers[s.youIndex].squad.length >= s.rosterMax
      return s
    }
    s = aiPick(s, mgr)
    s.draftPos += 1
  }
  return finishDraft(s)
}

function finishDraft(state: DraftState): DraftState {
  const opening = state.draftKind === 'initial'
  // after a draft the optimal XI changed — auto-field everyone's best 11
  // (you can then bench a star to give a young gem minutes in the Escalação screen)
  const managers = state.managers.map(m => ({ ...m, lineupIds: bestEleven(m.squad) }))
  return {
    ...state, inDraft: false, draftOrder: [], draftPos: 0, draftRoundsLeft: 0, pendingDrop: false,
    managers,
    screen: 'hub',
    narrative: opening ? [...state.narrative, `✅ Draft inicial fechado! Seus craques já entram no time — ajuste a escalação quando quiser.`] : state.narrative,
  }
}

function startDraft(state: DraftState, kind: 'initial' | 'season', order: number[], rounds: number): DraftState {
  const r = runDraft({ ...state, inDraft: true, draftKind: kind, draftOrder: order, draftPos: 0, draftRoundsLeft: rounds, lastPickText: [] })
  return { ...r, screen: r.inDraft ? 'draft' : r.screen }
}

function seasonEnd(state: DraftState): DraftState {
  const table = [...state.managers].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
  const champ = table[0]
  const youWon = champ.id === state.managers[state.youIndex].id
  const promoted = state.division > 1
  const newYear = state.year + 1
  const extra: string[] = [`🏁 FIM DA TEMPORADA ${state.season}! Campeão: ${champ.name} — ${champ.clubName} (${champ.points} pts).`]
  if (youWon) extra.push(`🏆 VOCÊ FOI CAMPEÃO!${promoted ? ` Seu clube SOBE para a ${state.division - 1}ª divisão.` : ' Já estão na elite — agora é dominar.'}`)

  // recompute legend ratings for the new year + reward MINUTES (starters develop)
  const managers = state.managers.map(m => {
    const started = new Set(m.lineupIds ?? [])
    const squad = m.squad.map(p => {
      if (!p.legendId) return p
      const lg = LEGENDS.find(l => l.id === p.legendId)!
      let dev = p.devBonus ?? 0
      const base = getCurrentRating(lg, newYear)
      // a young gem who got minutes grows faster toward his ceiling
      if (started.has(p.id) && base + dev < lg.truePotential) dev = Math.min(lg.truePotential - base, dev + 2)
      return { ...p, devBonus: dev, rating: Math.min(lg.truePotential, base + dev) }
    })
    return {
      ...m, squad,
      points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—',
    }
  })

  // open the season draft: worst-first, a couple picks each
  const order = standingsOrder(managers)
  const base: DraftState = {
    ...state,
    managers,
    season: state.season + 1, round: 0, year: newYear, week: 1,
    division: youWon && promoted ? state.division - 1 : state.division,
    narrative: [...state.narrative, ...extra, `🎟️ Abriu o draft da pré-temporada — pior colocado escolhe primeiro.`],
  }
  return startDraft(base, 'season', order, SEASON_DRAFT_ROUNDS)
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
      const mk = (id: string, name: string, isYou: boolean, club: { name: string; city: string }): Manager => {
        const squad = generateFillerSquad()
        return {
          id, name, isYou, clubName: club.name, clubCity: club.city, squad,
          lineupIds: bestEleven(squad), tactic: 'equilibrio',
          points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—',
        }
      }
      const managers = [
        mk('you', action.managerName || 'Você', true, chosen),
        ...others.map((c, i) => mk(`ai${i}`, aiNames[i], false, c)),
      ]
      const base: DraftState = {
        ...state, started: true, managers, youIndex: 0,
        narrative: [
          `⚡ O raio caiu na pelada dos casados e jogou todo mundo de volta pra 1992.`,
          `Só você e a galera lembram quem vai virar lenda. Bora fisgar esses craques antes dos outros.`,
          `Você assumiu o ${chosen.name} (${chosen.city}) na 4ª divisão. Monte seu elenco no draft inicial.`,
        ],
      }
      // initial draft: random order, several rounds (snake)
      const order = [...managers.keys()].sort(() => Math.random() - 0.5)
      return startDraft(base, 'initial', order, INITIAL_DRAFT_ROUNDS)
    }

    case 'ADVANCE_ROUND': {
      if (state.inDraft) return state
      const isFinal = state.round + 1 >= state.roundsPerSeason
      const managers = simulateMatchday(state)
      const youM = managers[state.youIndex]
      const afterMatch: DraftState = {
        ...state, managers,
        round: state.round + 1, week: Math.min(50, (state.round + 1) * 8),
        narrative: [...state.narrative, `📅 Rodada ${state.round + 1}: ${youM.clubName} fez ${youM.lastResult}.`],
      }
      return isFinal ? seasonEnd(afterMatch) : afterMatch
    }

    case 'DRAFT_PICK': {
      if (!state.inDraft || state.pendingDrop) return state
      const legend = LEGENDS.find(l => l.id === action.legendId)
      if (!legend || state.ownedLegendIds.includes(legend.id)) return state
      const mgrs = [...state.managers]
      const you = mgrs[state.youIndex]
      if (you.squad.length >= state.rosterMax) return { ...state, pendingDrop: true }
      const player = legendToPlayer(legend, state.year)
      mgrs[state.youIndex] = { ...you, squad: [...you.squad, player] }
      const s: DraftState = {
        ...state, managers: mgrs,
        ownedLegendIds: [...state.ownedLegendIds, legend.id],
        lastPickText: [...state.lastPickText, `⭐ VOCÊ fisgou ${legend.nickname} (nota ${player.rating} · potencial ${legend.truePotential})`],
        draftPos: state.draftPos + 1,
      }
      const r = runDraft(s)
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'SKIP_PICK': {
      if (!state.inDraft) return state
      const s = { ...state, draftPos: state.draftPos + 1, pendingDrop: false, lastPickText: [...state.lastPickText, `VOCÊ passou a vez.`] }
      const r = runDraft(s)
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'DROP_PLAYER': {
      const mgrs = [...state.managers]
      const you = mgrs[state.youIndex]
      mgrs[state.youIndex] = {
        ...you,
        squad: you.squad.filter(p => p.id !== action.playerId),
        lineupIds: (you.lineupIds ?? []).filter(id => id !== action.playerId),
      }
      return { ...state, managers: mgrs, pendingDrop: false }
    }

    case 'SET_LINEUP': {
      const mgrs = [...state.managers]
      const you = mgrs[state.youIndex]
      const inXI = (you.lineupIds ?? []).includes(action.playerId)
      let lineup: string[]
      if (inXI) lineup = you.lineupIds.filter(id => id !== action.playerId)
      else { if ((you.lineupIds ?? []).length >= 11) return state; lineup = [...you.lineupIds, action.playerId] }
      mgrs[state.youIndex] = { ...you, lineupIds: lineup }
      return { ...state, managers: mgrs }
    }

    case 'SET_TACTIC': {
      const mgrs = [...state.managers]
      mgrs[state.youIndex] = { ...mgrs[state.youIndex], tactic: action.tactic }
      return { ...state, managers: mgrs }
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
