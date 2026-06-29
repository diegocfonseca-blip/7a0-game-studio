import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { DraftState, DraftScreen, Manager, DraftPlayer, LeagueTeam, Tactic, GameMode, MatchEvent, LiveMatch } from './types'
import { supabase } from '../lib/supabase'
import { START_CLUBS, AI_MANAGERS, CPU_POOLS, divisionStrength, generateFillerSquad, squadStrength, bestEleven } from './data'
import { LEGENDS, getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'

const ROUNDS_PER_SEASON = 12
const WINDOW_EVERY = 5
const ROSTER_MAX = 23
const START_MONEY = 1_000_000

const INITIAL: DraftState = {
  screen: 'lobby', started: false, mode: 'draft',
  onlineMode: 'cpu', roomId: '', roomCode: '', isHost: true, totalPlayers: 1, playerNames: [],
  year: 1992, season: 1,
  round: 0, roundsPerSeason: ROUNDS_PER_SEASON, windowEvery: WINDOW_EVERY,
  teams: [], humans: [], youIndex: 0, ownedLegendIds: [], rosterMax: ROSTER_MAX, live: null,
  inDraft: false, draftOrder: [], draftPos: 0, pendingDrop: false, lastPickText: [], narrative: [],
  leilaoItems: [], leilaoIndex: 0, leilaoBids: [], leilaoPhase: 'done',
}

type Action =
  | { type: 'SET_SCREEN'; screen: DraftScreen }
  | { type: 'GO_CPU' }
  | { type: 'RESTORE_SCREEN' }
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; isHost: boolean; playerIndex: number; mode: GameMode; playerNames: string[] }
  | { type: 'SYNC_STATE'; newState: DraftState }
  | { type: 'START' }
  | { type: 'PICK_CLUB'; clubId: string; managerName: string; mode: GameMode }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'TICK_MATCH' }
  | { type: 'START_HALF2' }
  | { type: 'MAKE_SUB'; outId: string; inId: string }
  | { type: 'CHANGE_TACTIC_MATCH'; tactic: Tactic }
  | { type: 'END_MATCH' }
  | { type: 'DRAFT_PICK'; legendId: string }
  | { type: 'DROP_PLAYER'; playerId: string }
  | { type: 'SKIP_PICK' }
  | { type: 'SET_LINEUP'; playerId: string }
  | { type: 'SET_TACTIC'; tactic: Tactic }
  | { type: 'BID_LEILAO'; amount: number }
  | { type: 'NEXT_LEILAO' }
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

// ── pre-generated match events (Elifoot style) ──
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const GOL_YOUR = [
  (p: string, s: string) => `⚽ GOL! ${p} chuta cruzado! ${s}`,
  (p: string, s: string) => `⚽ ${p} de cabeça — GOOOOOL! ${s}`,
  (p: string, s: string) => `⚽ GOOOL! ${p} na gaveta! Que golaço! ${s}`,
  (p: string, s: string) => `⚽ Falta cobrada por ${p}! Goleiro sem chance. ${s}`,
  (p: string, s: string) => `⚽ ${p} aproveita rebote e empurra pra rede! ${s}`,
]
const GOL_OPP = [
  (o: string, s: string) => `🔴 Gol de ${o}. ${s}`,
  (o: string, s: string) => `🔴 ${o} marca de contra-ataque. ${s}`,
  (o: string, s: string) => `🔴 Cabeceio certeiro do ${o}. ${s}`,
  (o: string, s: string) => `🔴 Chutão de longe, goleiro falhou. ${o} ${s}`,
]
const CHANCE_YOUR = [
  '⚪ Chute na trave! Quase!',
  '⚪ Goleiro adversário salvou no último segundo.',
  '⚪ Cara a cara, chute fraco. Goleiro pegou.',
  '⚪ Cruzamento na área — ninguém chegou.',
  '⚪ Bola na trave! A torcida gritou!',
]
const CHANCE_OPP = [
  '🟡 Susto! A bola bateu na trave deles.',
  '🟡 Defesaça do nosso goleiro! Manteve o placar.',
  '🟡 Escanteio perigoso — zagueiro salvou na linha!',
  '🟡 Chute de meia distância, nosso goleiro tranquilo.',
]
const H1_MINS = [6, 12, 18, 24, 30, 36, 42]
const H2_MINS = [48, 54, 60, 66, 72, 78, 84, 89]

function pickScorer(xi: DraftPlayer[]): string {
  const att = xi.filter(p => p.pos === 'ATA')
  const mei = xi.filter(p => p.pos === 'MEI')
  const pool = att.length ? att : mei.length ? mei : xi
  return pool.length ? pick(pool).name : 'um jogador'
}

function pregenHalfEvents(
  rYou: number, tacYou: Tactic, rOpp: number, tacOpp: Tactic,
  xi: DraftPlayer[], oppName: string,
  half: 1 | 2, startGf = 0, startGa = 0
): MatchEvent[] {
  const minutes = half === 1 ? H1_MINS : H2_MINS
  const xgYou = Math.max(0.4, 1.4 + (rYou - rOpp) / 12 + ATK[tacYou] - DEF[tacOpp])
  const xgOpp = Math.max(0.4, 1.4 + (rOpp - rYou) / 12 + ATK[tacOpp] - DEF[tacYou])
  let gf = startGf, ga = startGa
  const events: MatchEvent[] = []
  for (const minute of minutes) {
    const r = Math.random()
    const pGY = 0.12 * Math.min(2, xgYou)
    const pGO = 0.12 * Math.min(2, xgOpp)
    if (r < pGY) {
      gf++
      events.push({ min: minute, text: pick(GOL_YOUR)(pickScorer(xi), `${gf}–${ga}`), gfAfter: gf, gaAfter: ga })
    } else if (r < pGY + pGO) {
      ga++
      events.push({ min: minute, text: pick(GOL_OPP)(oppName, `${gf}–${ga}`), gfAfter: gf, gaAfter: ga })
    } else if (r < pGY + pGO + 0.14) {
      events.push({ min: minute, text: pick(CHANCE_YOUR), gfAfter: gf, gaAfter: ga })
    } else if (r < pGY + pGO + 0.26) {
      events.push({ min: minute, text: pick(CHANCE_OPP), gfAfter: gf, gaAfter: ga })
    }
  }
  return events
}

// ── simulate round for all teams EXCEPT the player's match ──
function simulateOtherMatches(state: DraftState): {
  teams: LeagueTeam[];
  humans: Manager[];
  narrative: string[];
  oppTeam: LeagueTeam;
} {
  let teams = recomputeHumanStrength(state.teams, state.humans)
  const humans = state.humans.map(h => ({ ...h }))
  const narrative: string[] = []
  const byId = new Map(teams.map(t => [t.id, t]))
  const youTeamId = humans[state.youIndex].teamId

  let oppTeam: LeagueTeam = teams[0] // placeholder

  for (let d = 1; d <= 4; d++) {
    const divIds = teams.filter(t => t.division === d).map(t => t.id).sort(() => Math.random() - 0.5)
    const youIdx = divIds.findIndex(id => id === youTeamId)
    // If player is in this division, pull them out and find their opponent
    if (youIdx !== -1) {
      const oppIdx = youIdx % 2 === 0 ? youIdx + 1 : youIdx - 1
      if (oppIdx >= 0 && oppIdx < divIds.length) {
        oppTeam = byId.get(divIds[oppIdx])!
      } else {
        // Edge case: odd team out, player gets a bye — pick last available
        oppTeam = byId.get(divIds.find(id => id !== youTeamId)!)!
      }
      // Remove both from the pairing list
      const skipPair = new Set([youTeamId, oppTeam.id])
      for (let i = 0; i + 1 < divIds.length; i += 2) {
        const A = byId.get(divIds[i])!, B = byId.get(divIds[i + 1])!
        if (skipPair.has(A.id) || skipPair.has(B.id)) continue
        const tacA: Tactic = A.isHuman ? humans[A.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
        const tacB: Tactic = B.isHuman ? humans[B.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
        const [ga, gb] = matchGoals(A.strength, tacA, B.strength, tacB)
        byId.set(A.id, applyRow(A, ga, gb)); byId.set(B.id, applyRow(B, gb, ga))
        if (A.isHuman) humans[A.humanIndex!].money += Math.round(gate(d) * (ga > gb ? 1.5 : ga === gb ? 1 : 0.6))
        if (B.isHuman) humans[B.humanIndex!].money += Math.round(gate(d) * (gb > ga ? 1.5 : gb === ga ? 1 : 0.6))
      }
    } else {
      for (let i = 0; i + 1 < divIds.length; i += 2) {
        const A = byId.get(divIds[i])!, B = byId.get(divIds[i + 1])!
        const tacA: Tactic = A.isHuman ? humans[A.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
        const tacB: Tactic = B.isHuman ? humans[B.humanIndex!].tactic : (Math.random() < 0.3 ? 'ataque' : 'equilibrio')
        const [ga, gb] = matchGoals(A.strength, tacA, B.strength, tacB)
        byId.set(A.id, applyRow(A, ga, gb)); byId.set(B.id, applyRow(B, gb, ga))
        if (A.isHuman) humans[A.humanIndex!].money += Math.round(gate(d) * (ga > gb ? 1.5 : ga === gb ? 1 : 0.6))
        if (B.isHuman) humans[B.humanIndex!].money += Math.round(gate(d) * (gb > ga ? 1.5 : gb === ga ? 1 : 0.6))
      }
    }
  }
  return { teams: [...byId.values()], humans, narrative, oppTeam }
}

// ── draft logic ──
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
  const r = runDraft({ ...state, inDraft: true, draftOrder: order, draftPos: 0, lastPickText: [], narrative: [...state.narrative, `🎟️ Janela de draft — pior colocado escolhe primeiro.`] })
  return { ...r, screen: r.inDraft ? 'draft' : r.screen }
}

// ── leilão logic ──
function openLeilao(state: DraftState): DraftState {
  const pool = availableLegends(state).slice(0, 10)
  if (pool.length === 0) return { ...state, screen: 'hub' }
  // Pick 3 random from the top-10 available
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3)
  return {
    ...state,
    screen: 'leilao',
    leilaoItems: shuffled.map(l => l.id),
    leilaoIndex: 0,
    leilaoBids: new Array(state.humans.length).fill(0),
    leilaoPhase: 'bid',
    narrative: [...state.narrative, `💰 Janela de leilão! Três craques em disputa — lance cego, quem pagar mais leva.`],
  }
}

// ── season end ──
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
  return { ...state, teams: recomputeHumanStrength(teams, humans), humans, season: state.season + 1, round: 0, year: newYear, screen: 'hub', narrative: [...state.narrative, `🏁 Fim da temporada ${state.season}.`, ...extra] }
}

// ── after match, check if window should open ──
function afterMatch(state: DraftState): DraftState {
  if (state.round >= state.roundsPerSeason) return seasonEnd(state)
  if (state.round % state.windowEvery === 0) {
    const wnum = Math.floor(state.round / state.windowEvery)
    if (state.mode === 'leilao') return openLeilao(state)
    if (state.mode === 'draft_leilao') return wnum % 2 === 0 ? openDraft(state) : openLeilao(state)
    return openDraft(state)
  }
  return state
}

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'GO_CPU': return { ...INITIAL, screen: 'intro', onlineMode: 'cpu', isHost: true }
    case 'RESTORE_SCREEN': {
      const saved = localStorage.getItem('draft-v2')
      if (!saved) return { ...state, screen: 'hub' }
      try { return { ...state, screen: (JSON.parse(saved).screen as DraftScreen) ?? 'hub' } }
      catch { return { ...state, screen: 'hub' } }
    }
    case 'START_ONLINE':
      return {
        ...state,
        screen: 'intro',
        onlineMode: 'online',
        roomId: action.roomId,
        roomCode: action.roomCode,
        isHost: action.isHost,
        youIndex: action.playerIndex,
        totalPlayers: action.playerNames.length,
        playerNames: action.playerNames,
        mode: action.mode,
      }
    case 'SYNC_STATE':
      return {
        ...action.newState,
        isHost: state.isHost,
        youIndex: state.youIndex,
        onlineMode: state.onlineMode,
        roomId: state.roomId,
        roomCode: state.roomCode,
        totalPlayers: state.totalPlayers,
        playerNames: state.playerNames,
      }
    case 'START': return { ...state, screen: 'pickClub' }

    case 'PICK_CLUB': {
      const chosen = START_CLUBS.find(c => c.id === action.clubId)!
      const others = START_CLUBS.filter(c => c.id !== action.clubId).sort(() => Math.random() - 0.5).slice(0, 3)
      const aiNames = [...AI_MANAGERS].sort(() => Math.random() - 0.5)
      const humanClubs = [
        { club: chosen, mgr: action.managerName || 'Você', you: true },
        ...others.map((c, i) => ({ club: c, mgr: state.playerNames[i + 1] ?? aiNames[i], you: false })),
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
      if (state.inDraft || state.live) return state
      const round = state.round + 1
      const { teams, humans, oppTeam } = simulateOtherMatches({ ...state, round })
      const you = humans[state.youIndex]
      const myTeam = teams.find(t => t.humanIndex === state.youIndex)!
      const xi = you.squad.filter(p => you.lineupIds.includes(p.id))
      const h1Events = pregenHalfEvents(myTeam.strength, you.tactic, oppTeam.strength, 'equilibrio', xi, oppTeam.name, 1)
      const live: LiveMatch = {
        oppTeamId: oppTeam.id,
        oppName: oppTeam.name,
        oppStrength: oppTeam.strength,
        minute: 0, gf: 0, ga: 0,
        events: [`0' · Bola rolando em ${myTeam.city}!`],
        allEvents: h1Events,
        half: 1, division: myTeam.division, subDone: false,
      }
      return { ...state, teams, humans, round, narrative: [...state.narrative].slice(-60), live, screen: 'match' }
    }

    case 'TICK_MATCH': {
      if (!state.live) return state
      const live = state.live
      if (live.half === 'ht' || live.half === 'ft') return state
      const cap = live.half === 1 ? 45 : 90
      const advance = 7 + Math.floor(Math.random() * 7) // 7–13 min per tick
      const newMin = Math.min(cap, live.minute + advance)
      const newlyRevealed = live.allEvents.filter(e => e.min > live.minute && e.min <= newMin)
      const newTexts = newlyRevealed.map(e => `${e.min}' ${e.text}`)
      const lastScored = newlyRevealed.at(-1)
      const updGf = lastScored ? lastScored.gfAfter : live.gf
      const updGa = lastScored ? lastScored.gaAfter : live.ga
      let half: LiveMatch['half'] = live.half
      if (live.half === 1 && newMin >= 45) half = 'ht'
      else if (live.half === 2 && newMin >= 90) half = 'ft'
      const updLive: LiveMatch = { ...live, minute: newMin, gf: updGf, ga: updGa, events: [...live.events, ...newTexts], half }
      if (half === 'ht') updLive.events = [...updLive.events, `45' · ⏸ Intervalo — ${updGf}–${updGa}`]
      if (half === 'ft') updLive.events = [...updLive.events, `90' · 🏁 Apito final! ${updGf}–${updGa}`]
      return { ...state, live: updLive }
    }

    case 'START_HALF2': {
      if (!state.live || state.live.half !== 'ht') return state
      const you = state.humans[state.youIndex]
      const xi = you.squad.filter(p => you.lineupIds.includes(p.id))
      const myTeam = state.teams.find(t => t.humanIndex === state.youIndex)!
      const h2Events = pregenHalfEvents(
        myTeam.strength, you.tactic, state.live.oppStrength, 'equilibrio',
        xi, state.live.oppName, 2, state.live.gf, state.live.ga
      )
      return { ...state, live: { ...state.live, half: 2, minute: 45, allEvents: [...state.live.allEvents, ...h2Events] } }
    }

    case 'MAKE_SUB': {
      if (!state.live || state.live.subDone) return state
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      const lineup = you.lineupIds.map(id => id === action.outId ? action.inId : id)
      humans[state.youIndex] = { ...you, lineupIds: lineup }
      return { ...state, humans, live: { ...state.live, subDone: true } }
    }

    case 'CHANGE_TACTIC_MATCH': {
      const humans = [...state.humans]
      humans[state.youIndex] = { ...humans[state.youIndex], tactic: action.tactic }
      return { ...state, humans }
    }

    case 'END_MATCH': {
      if (!state.live) return { ...state, screen: 'hub' }
      const { gf, ga, oppTeamId, division } = state.live
      const myTeam = state.teams.find(t => t.humanIndex === state.youIndex)!
      let teams = state.teams.map(t => {
        if (t.id === myTeam.id) return applyRow(t, gf, ga)
        if (t.id === oppTeamId) return applyRow(t, ga, gf)
        return t
      })
      const receipt = Math.round(gate(division) * (gf > ga ? 1.5 : gf === ga ? 1 : 0.6))
      const humans = state.humans.map((h, i) => i === state.youIndex ? { ...h, money: h.money + receipt } : h)
      teams = recomputeHumanStrength(teams, humans)
      const oppTeam = state.teams.find(t => t.id === oppTeamId)!
      const resultIcon = gf > ga ? '🟢' : gf === ga ? '🟡' : '🔴'
      const line = `${resultIcon} ${myTeam.name} ${gf}–${ga} ${oppTeam.name} · rodada ${state.round}`
      const mid: DraftState = {
        ...state, teams, humans, live: null, screen: 'hub',
        narrative: [...state.narrative, line].slice(-60),
      }
      return afterMatch(mid)
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
      const r = runDraft({ ...state, draftPos: state.draftPos + 1, pendingDrop: false, lastPickText: [...state.lastPickText, `Você passou a vez.`] })
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

    case 'BID_LEILAO': {
      const { leilaoItems, leilaoIndex, humans, youIndex } = state
      const legendId = leilaoItems[leilaoIndex]
      if (!legendId) return state
      const legend = LEGENDS.find(l => l.id === legendId)
      if (!legend) return state
      const player = legendToPlayer(legend, state.year)
      const you = humans[youIndex]
      const yourBid = Math.min(Math.max(0, action.amount), you.money)
      // AI bids
      const bids = humans.map((h, i) => {
        if (i === youIndex) return yourBid
        if (h.squad.length >= state.rosterMax) return 0
        const baseVal = player.rating * 12_000
        const maxBid = Math.min(h.money * 0.35, baseVal * 1.6)
        return Math.max(0, Math.floor(maxBid * (0.3 + Math.random() * 0.7)))
      })
      const maxBid = Math.max(...bids)
      if (maxBid === 0) {
        // Nobody bid — item passes
        return { ...state, leilaoBids: bids, leilaoPhase: 'reveal' }
      }
      const winnerIdx = bids.indexOf(maxBid)
      let newHumans = humans.map((h, i) => {
        if (i !== winnerIdx) return h
        let squad = [...h.squad]
        if (squad.length >= state.rosterMax) {
          const weakest = [...squad].sort((a, b) => a.rating - b.rating)[0]
          squad = squad.filter(p => p.id !== weakest.id)
        }
        squad.push(legendToPlayer(legend, state.year))
        return { ...h, squad, money: h.money - bids[i], lineupIds: bestEleven(squad) }
      })
      const ownedLegendIds = [...state.ownedLegendIds, legendId]
      const winner = newHumans[winnerIdx]
      const narrative = [...state.narrative,
        `💰 ${winner.name} arrematou ${legend.nickname} por R$${bids[winnerIdx].toLocaleString('pt-BR')}!`
      ].slice(-60)
      return {
        ...state,
        humans: newHumans,
        ownedLegendIds,
        leilaoBids: bids,
        leilaoPhase: 'reveal',
        narrative,
        teams: recomputeHumanStrength(state.teams, newHumans),
      }
    }

    case 'NEXT_LEILAO': {
      const next = state.leilaoIndex + 1
      if (next >= state.leilaoItems.length) return { ...state, screen: 'hub', leilaoPhase: 'done' }
      return { ...state, leilaoIndex: next, leilaoBids: new Array(state.humans.length).fill(0), leilaoPhase: 'bid' }
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
  if (saved) {
    try {
      const p = JSON.parse(saved)
      // Always start at lobby (auth wall), but restore the rest of the saved state
      if (p.started && p.onlineMode !== 'online') initial = { ...INITIAL, ...p, screen: 'lobby' }
    } catch { /* ignore */ }
  }
  const [state, rawDispatch] = useReducer(reducer, initial)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isHostRef = useRef(state.isHost)
  const onlineModeRef = useRef(state.onlineMode)
  useEffect(() => { isHostRef.current = state.isHost }, [state.isHost])
  useEffect(() => { onlineModeRef.current = state.onlineMode }, [state.onlineMode])

  // Smart dispatch: guests route actions through channel; host dispatches locally
  const dispatch = useCallback((action: Action) => {
    if (onlineModeRef.current === 'online' && !isHostRef.current) {
      channelRef.current?.send({ type: 'broadcast', event: 'action', payload: action })
    } else {
      rawDispatch(action)
    }
  }, [])

  // Persist CPU games only
  if (state.started && state.onlineMode !== 'online') {
    localStorage.setItem('draft-v2', JSON.stringify(state))
  }

  // Set up Supabase Realtime channel when online game starts
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return

    const ch = supabase.channel(`eleitos92:${state.roomId}`, {
      config: { broadcast: { self: false, ack: false } },
    })

    if (state.isHost) {
      // Host receives guest actions and applies them
      ch.on('broadcast', { event: 'action' }, ({ payload }: { payload: Action }) => {
        rawDispatch(payload)
      })
    } else {
      // Guests receive host state and sync
      ch.on('broadcast', { event: 'state' }, ({ payload }: { payload: DraftState }) => {
        rawDispatch({ type: 'SYNC_STATE', newState: payload })
      })
    }

    ch.subscribe()
    channelRef.current = ch
    return () => { ch.unsubscribe(); channelRef.current = null }
  }, [state.roomId, state.onlineMode, state.isHost])

  // Host broadcasts state after every change
  const prevStateRef = useRef<DraftState | null>(null)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    if (prevStateRef.current === state) return
    prevStateRef.current = state
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: state })
  }, [state])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}
export function useDraft() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDraft must be used within DraftProvider')
  return ctx
}
