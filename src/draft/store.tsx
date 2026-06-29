import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { DraftState, DraftScreen, Manager, DraftPlayer, LeagueTeam, Tactic, GameMode } from './types'
import { START_CLUBS, AI_MANAGERS, CPU_POOLS, divisionStrength, generateFillerSquad, squadStrength, bestEleven } from './data'
import { LEGENDS, getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'

const ROUNDS_PER_SEASON = 12
const WINDOW_EVERY = 5
const ROSTER_MAX = 23
const START_MONEY = 1_000_000

const INITIAL: DraftState = {
  screen: 'intro', started: false, mode: 'draft', year: 1992, season: 1,
  round: 0, roundsPerSeason: ROUNDS_PER_SEASON, windowEvery: WINDOW_EVERY,
  teams: [], humans: [], youIndex: 0, ownedLegendIds: [], rosterMax: ROSTER_MAX, live: null,
  inDraft: false, draftOrder: [], draftPos: 0, pendingDrop: false, lastPickText: [], narrative: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: DraftScreen }
  | { type: 'START' }
  | { type: 'PICK_CLUB'; clubId: string; managerName: string; mode: GameMode }
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
  return { id: `lg-${l.id}`, name: l.nickname, pos: l.position, rating: getCurrentRating(l, year), legendId: l.id, nationality: l.nationality, potential: l.truePotential, devBonus: 0 }
}
export function teamOf(state: DraftState, m: Manager): LeagueTeam {
  return state.teams.find(t => t.id === m.teamId)!
}
export function divTeams(state: DraftState, division: number): LeagueTeam[] {
  return state.teams.filter(t => t.division === division)
    .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
}

const ATK: Record<Tactic, number> = { retranca: -0.8, equilibrio: 0, ataque: 1.0 }
const DEF: Record<Tactic, number> = { retranca: 1.0, equilibrio: 0, ataque: -0.6 }
function matchGoals(rA: number, tA: Tactic, rB: number, tB: Tactic): [number, number] {
  const xgA = Math.max(0.2, 1.2 + (rA - rB) / 14 + ATK[tA] - DEF[tB])
  const xgB = Math.max(0.2, 1.2 + (rB - rA) / 14 + ATK[tB] - DEF[tA])
  return [Math.max(0, Math.round(xgA + (Math.random() - 0.5) * 2.2)), Math.max(0, Math.round(xgB + (Math.random() - 0.5) * 2.2))]
}
function applyRow(t: LeagueTeam, gf: number, ga: number): LeagueTeam {
  const win = gf > ga, draw = gf === ga
  return { ...t, played: t.played + 1, wins: t.wins + (win ? 1 : 0), draws: t.draws + (draw ? 1 : 0), losses: t.losses + (!win && !draw ? 1 : 0), points: t.points + (win ? 3 : draw ? 1 : 0), gf: t.gf + gf, ga: t.ga + ga, lastResult: `${win ? '🟢' : draw ? '🟡' : '🔴'} ${gf}–${ga}` }
}
function gate(division: number): number {
  return ({ 1: 600_000, 2: 300_000, 3: 150_000, 4: 80_000 }[division] ?? 80_000)
}
function recomputeHumanStrength(teams: LeagueTeam[], humans: Manager[]): LeagueTeam[] {
  return teams.map(t => t.isHuman && t.humanIndex !== undefined
    ? { ...t, strength: Math.round(squadStrength(humans[t.humanIndex].squad, humans[t.humanIndex].lineupIds)) }
    : t)
}

function simulateRound(state: DraftState): { teams: LeagueTeam[]; humans: Manager[]; lines: string[] } {
  let teams = recomputeHumanStrength(state.teams, state.humans)
  const humans = state.humans.map(h => ({ ...h }))
  const lines: string[] = []
  const byId = new Map(teams.map(t => [t.id, t]))
  for (let d = 1; d <= 4; d++) {
    const ids = teams.filter(t => t.division === d).map(t => t.id).sort(() => Math.random() - 0.5)
    for (let i = 0; i + 1 < ids.length; i += 2) {
      const A = byId.get(ids[i])!, B = byId.get(ids[i + 1])!
      const tacA: Tactic = A.isHuman ? humans[A.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
      const tacB: Tactic = B.isHuman ? humans[B.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
      const [ga, gb] = matchGoals(A.strength, tacA, B.strength, tacB)
      byId.set(A.id, applyRow(A, ga, gb)); byId.set(B.id, applyRow(B, gb, ga))
      if (A.isHuman) humans[A.humanIndex!].money += Math.round(gate(d) * (ga > gb ? 1.5 : ga === gb ? 1 : 0.6))
      if (B.isHuman) humans[B.humanIndex!].money += Math.round(gate(d) * (gb > ga ? 1.5 : gb === ga ? 1 : 0.6))
      if (A.humanIndex === state.youIndex) lines.push(`⚽ ${A.name} ${ga}–${gb} ${B.name}`)
      if (B.humanIndex === state.youIndex) lines.push(`⚽ ${B.name} ${gb}–${ga} ${A.name}`)
    }
  }
  return { teams: [...byId.values()], humans, lines }
}

// worst-first among the HUMANS: lower division first, then fewer points
function humanDraftOrder(state: DraftState): number[] {
  return state.humans
    .map((h, i) => ({ i, t: state.teams.find(t => t.id === h.teamId)! }))
    .sort((a, b) => b.t.division - a.t.division || a.t.points - b.t.points)
    .map(x => x.i)
}
function aiPick(state: DraftState, hi: number): DraftState {
  const pool = availableLegends(state)
  if (pool.length === 0) return state
  const target = pool[0]
  const player = legendToPlayer(target, state.year)
  const humans = [...state.humans]
  let squad = [...humans[hi].squad]
  if (squad.length >= state.rosterMax) { const w = [...squad].sort((a, b) => a.rating - b.rating)[0]; squad = squad.filter(p => p.id !== w.id) }
  squad.push(player)
  humans[hi] = { ...humans[hi], squad }
  return { ...state, humans, ownedLegendIds: [...state.ownedLegendIds, target.id], lastPickText: [...state.lastPickText, `${humans[hi].name} escolheu ${target.nickname} (nota ${player.rating})`] }
}
function runDraft(state: DraftState): DraftState {
  let s = { ...state }
  for (let g = 0; g < 100; g++) {
    if (s.draftPos >= s.draftOrder.length) return finishDraft(s)
    const hi = s.draftOrder[s.draftPos]
    if (hi === s.youIndex) { s.pendingDrop = s.humans[s.youIndex].squad.length >= s.rosterMax; return s }
    s = aiPick(s, hi); s.draftPos += 1
  }
  return finishDraft(s)
}
function finishDraft(state: DraftState): DraftState {
  const humans = state.humans.map(h => ({ ...h, lineupIds: bestEleven(h.squad) }))
  return { ...state, inDraft: false, draftOrder: [], draftPos: 0, pendingDrop: false, humans, teams: recomputeHumanStrength(state.teams, humans), screen: 'hub' }
}
function openDraft(state: DraftState): DraftState {
  const order = humanDraftOrder(state)
  const r = runDraft({ ...state, inDraft: true, draftOrder: order, draftPos: 0, lastPickText: [], narrative: [...state.narrative, `🎟️ Janela de draft (a cada ${state.windowEvery} jogos) — pior colocado escolhe primeiro.`] })
  return { ...r, screen: r.inDraft ? 'draft' : r.screen }
}

function seasonEnd(state: DraftState): DraftState {
  const newYear = state.year + 1
  const extra: string[] = []
  let teams = state.teams.map(t => ({ ...t }))
  const moved = new Map<string, number>()
  for (let d = 1; d <= 4; d++) {
    const order = teams.filter(t => t.division === d).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
    if (d > 1) order.slice(0, 2).forEach(t => moved.set(t.id, d - 1))
    if (d < 4) order.slice(-2).forEach(t => moved.set(t.id, d + 1))
    const champ = order[0]
    if (champ?.humanIndex === state.youIndex) extra.push(`🥇 VOCÊ foi campeão da ${d}ª divisão!`)
  }
  teams = teams.map(t => moved.has(t.id) ? { ...t, division: moved.get(t.id)! } : t)
  const youTeam = teams.find(t => t.humanIndex === state.youIndex)!
  const youOld = state.teams.find(t => t.id === youTeam.id)!
  if (youTeam.division < youOld.division) extra.push(`⬆️ ${youTeam.name} SUBIU para a ${youTeam.division}ª divisão!`)
  else if (youTeam.division > youOld.division) extra.push(`⬇️ ${youTeam.name} caiu para a ${youTeam.division}ª divisão.`)
  const humans = state.humans.map(m => {
    const started = new Set(m.lineupIds ?? [])
    const squad = m.squad.map(p => {
      if (!p.legendId) return p
      const lg = LEGENDS.find(l => l.id === p.legendId)!
      let dev = p.devBonus ?? 0
      const base = getCurrentRating(lg, newYear)
      if (started.has(p.id) && base + dev < lg.truePotential) dev = Math.min(lg.truePotential - base, dev + 2)
      return { ...p, devBonus: dev, rating: Math.min(lg.truePotential, base + dev) }
    })
    return { ...m, squad }
  })
  teams = teams.map(t => ({ ...t, points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—', strength: t.isHuman ? t.strength : divisionStrength(t.division) }))
  return { ...state, teams: recomputeHumanStrength(teams, humans), humans, season: state.season + 1, round: 0, year: newYear, narrative: [...state.narrative, `🏁 Fim da temporada ${state.season}.`, ...extra] }
}

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'START': return { ...state, screen: 'pickClub' }

    case 'PICK_CLUB': {
      const chosen = START_CLUBS.find(c => c.id === action.clubId)!
      const others = START_CLUBS.filter(c => c.id !== action.clubId).sort(() => Math.random() - 0.5).slice(0, 3)
      const aiNames = [...AI_MANAGERS].sort(() => Math.random() - 0.5)
      const humanClubs = [
        { club: chosen, mgr: action.managerName || 'Você', you: true },
        ...others.map((c, i) => ({ club: c, mgr: aiNames[i], you: false })),
      ]
      const humans: Manager[] = []
      const teams: LeagueTeam[] = []
      humanClubs.forEach((hc, i) => {
        const squad = generateFillerSquad()
        humans.push({ id: `h${i}`, name: hc.mgr, isYou: hc.you, teamId: `t-${hc.club.id}`, squad, lineupIds: bestEleven(squad), tactic: 'equilibrio', money: START_MONEY })
        teams.push({ id: `t-${hc.club.id}`, name: hc.club.name, city: hc.club.city, division: 4, isHuman: true, humanIndex: i, strength: Math.round(squadStrength(squad)), points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—' })
      })
      let cpuId = 0
      CPU_POOLS.forEach((pool, di) => {
        const division = di + 1
        pool.forEach(c => teams.push({ id: `c${cpuId++}`, name: c.name, city: c.city, division, isHuman: false, strength: divisionStrength(division), points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—' }))
      })
      const modeLabel = action.mode === 'draft' ? 'DRAFT' : action.mode === 'leilao' ? 'LEILÃO' : 'DRAFT + LEILÃO'
      return {
        ...state, started: true, screen: 'hub', mode: action.mode, teams, humans, youIndex: 0,
        narrative: [
          `⚡ O raio caiu na pelada dos casados e jogou a galera de volta pra 1992.`,
          `Só vocês lembram quem vai virar lenda. Modo: ${modeLabel}.`,
          `Você assumiu o ${chosen.name} na 4ª divisão (R$1 milhão no caixa). A cada ${WINDOW_EVERY} jogos abre a janela pra fisgar um craque — pior colocado escolhe primeiro.`,
        ],
      }
    }

    case 'ADVANCE_ROUND': {
      if (state.inDraft) return state
      const { teams, humans, lines } = simulateRound(state)
      const round = state.round + 1
      const mid: DraftState = { ...state, teams, humans, round, narrative: [...state.narrative, ...lines].slice(-60) }
      if (round >= state.roundsPerSeason) return seasonEnd(mid)
      if (round % state.windowEvery === 0 && state.mode !== 'leilao') return openDraft(mid)
      return mid
    }

    case 'DRAFT_PICK': {
      if (!state.inDraft || state.pendingDrop) return state
      const legend = LEGENDS.find(l => l.id === action.legendId)
      if (!legend || state.ownedLegendIds.includes(legend.id)) return state
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      if (you.squad.length >= state.rosterMax) return { ...state, pendingDrop: true }
      const player = legendToPlayer(legend, state.year)
      humans[state.youIndex] = { ...you, squad: [...you.squad, player] }
      const r = runDraft({ ...state, humans, ownedLegendIds: [...state.ownedLegendIds, legend.id], lastPickText: [...state.lastPickText, `⭐ VOCÊ fisgou ${legend.nickname} (nota ${player.rating} · pot ${legend.truePotential})`], draftPos: state.draftPos + 1 })
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'SKIP_PICK': {
      if (!state.inDraft) return state
      const r = runDraft({ ...state, draftPos: state.draftPos + 1, pendingDrop: false, lastPickText: [...state.lastPickText, `VOCÊ passou a vez.`] })
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'DROP_PLAYER': {
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      humans[state.youIndex] = { ...you, squad: you.squad.filter(p => p.id !== action.playerId), lineupIds: (you.lineupIds ?? []).filter(id => id !== action.playerId) }
      return { ...state, humans, pendingDrop: false }
    }

    case 'SET_LINEUP': {
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      const inXI = (you.lineupIds ?? []).includes(action.playerId)
      let lineup: string[]
      if (inXI) lineup = you.lineupIds.filter(id => id !== action.playerId)
      else { if ((you.lineupIds ?? []).length >= 11) return state; lineup = [...you.lineupIds, action.playerId] }
      humans[state.youIndex] = { ...you, lineupIds: lineup }
      return { ...state, humans, teams: recomputeHumanStrength(state.teams, humans) }
    }

    case 'SET_TACTIC': {
      const humans = [...state.humans]
      humans[state.youIndex] = { ...humans[state.youIndex], tactic: action.tactic }
      return { ...state, humans }
    }

    case 'NEW_GAME':
      localStorage.removeItem('draft-v2')
      return { ...INITIAL }

    default: return state
  }
}

const Ctx = createContext<{ state: DraftState; dispatch: React.Dispatch<Action> } | null>(null)
export function DraftProvider({ children }: { children: ReactNode }) {
  const saved = localStorage.getItem('draft-v2')
  let initial = INITIAL
  if (saved) { try { const p = JSON.parse(saved); if (p.started) initial = { ...INITIAL, ...p } } catch { initial = INITIAL } }
  const [state, dispatch] = useReducer(reducer, initial)
  if (state.started) localStorage.setItem('draft-v2', JSON.stringify(state))
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}
export function useDraft() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDraft must be used within DraftProvider')
  return ctx
}
