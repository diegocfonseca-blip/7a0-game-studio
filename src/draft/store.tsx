import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { DraftState, DraftScreen, Manager, DraftPlayer, LeagueTeam, Tactic, GameMode, MatchEvent, LiveMatch, Formation, OtherMatchLive, OtherMatchGoal, DraftCup, CupGame } from './types'
import { supabase } from '../lib/supabase'
import { AI_MANAGERS, CPU_POOLS, squadStrength, bestEleven } from './data'
import { getCpuSquad } from './rosters'
import { LEGENDS, getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'

const ROUNDS_PER_SEASON = 12
const WINDOW_EVERY = 5
const ROSTER_MAX = 30
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
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; isHost: boolean; playerIndex: number; mode: GameMode; playerNames: string[]; gameState?: DraftState }
  | { type: 'SYNC_STATE'; newState: DraftState }
  | { type: 'START' }
  | { type: 'PICK_CLUB'; clubId: string; managerName: string; mode: GameMode }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'TICK_MATCH' }
  | { type: 'START_HALF2' }
  | { type: 'MAKE_SUB'; outId: string; inId: string }
  | { type: 'CHANGE_TACTIC_MATCH'; tactic: Tactic }
  | { type: 'END_MATCH' }
  | { type: 'DRAFT_PICK'; legendId: string; playerIndex?: number }
  | { type: 'DROP_PLAYER'; playerId: string }
  | { type: 'SKIP_PICK'; playerIndex?: number }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'SET_LINEUP'; playerId: string }
  | { type: 'SET_TACTIC'; tactic: Tactic }
  | { type: 'BID_LEILAO'; amount: number }
  | { type: 'NEXT_LEILAO' }
  | { type: 'SET_FORMATION'; formation: Formation }
  | { type: 'NEW_GAME' }

// ── helpers ──
export function availableLegends(state: DraftState): Legend[] {
  return LEGENDS
    .filter(l =>
      !state.ownedLegendIds.includes(l.id) &&
      l.status !== 'estrela' &&
      state.year >= l.emergenceYear - 2 &&
      state.year <= l.emergenceYear &&
      l.birthYear <= state.year - 10
    )
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

// ── prize money ──
const LEAGUE_PRIZE: Record<number, number[]> = {
  1: [2_000_000, 800_000, 300_000, 150_000],
  2: [1_000_000, 400_000, 150_000, 80_000],
  3: [500_000, 200_000, 80_000, 40_000],
  4: [300_000, 100_000, 50_000, 20_000],
}
const CUP_PRIZE = { winner: 1_500_000, runner: 500_000, sf: 150_000, qf: 50_000 }
const PROMOTION_BONUS = 500_000
const RELEGATION_PENALTY = -200_000

// ── copa dos viajantes ──
function cupGame(homeId: string, homeName: string, homeStr: number, awayId: string, awayName: string, awayStr: number): CupGame {
  let [hg, ag] = matchGoals(homeStr, 'equilibrio', awayStr, 'equilibrio')
  if (hg === ag) { // penalty: slight edge to stronger team
    if (Math.random() < 0.5 + (homeStr - awayStr) / 200) hg++; else ag++
  }
  const winnerId = hg > ag ? homeId : awayId
  return { homeId, homeName, awayId, awayName, homeGoals: hg, awayGoals: ag, winnerId, winnerName: hg > ag ? homeName : awayName }
}

function initCup(state: DraftState): DraftCup {
  const humanTeams = state.teams.filter(t => t.isHuman)
  // Fill to 8 with best CPU teams (2 per division that have no human)
  const cpuSlots = 8 - humanTeams.length
  const cpuTeams = state.teams.filter(t => !t.isHuman)
    .sort(() => Math.random() - 0.5)
    .slice(0, cpuSlots)
  const entrants = [...humanTeams, ...cpuTeams]
  const entrantNames: Record<string, string> = {}
  entrants.forEach(t => { entrantNames[t.id] = t.name })
  return {
    phase: 'QF',
    entrants: entrants.map(t => t.id),
    entrantNames,
    alive: entrants.map(t => t.id),
    qf: [], sf: [], final: undefined,
    humanTeamId: state.teams.find(t => t.humanIndex === state.youIndex)!.id,
    humanOut: false,
  }
}

function simulateCupPhase(state: DraftState): DraftState {
  const cup = state.cup
  if (!cup || cup.phase === 'done') return state
  const getStr = (id: string) => state.teams.find(t => t.id === id)?.strength ?? 50
  const getName = (id: string) => cup.entrantNames[id] ?? id
  const narrative = [...state.narrative]
  let newCup = { ...cup }

  if (cup.phase === 'QF') {
    const shuffled = [...cup.alive].sort(() => Math.random() - 0.5)
    const qf = []
    for (let i = 0; i < shuffled.length; i += 2)
      qf.push(cupGame(shuffled[i], getName(shuffled[i]), getStr(shuffled[i]), shuffled[i+1], getName(shuffled[i+1]), getStr(shuffled[i+1])))
    const alive = qf.map(g => g.winnerId)
    newCup = { ...newCup, phase: 'SF', qf, alive, humanOut: !alive.includes(cup.humanTeamId) }
    narrative.push(`🏆 Copa dos Viajantes — Quartas de Final:`)
    qf.forEach(g => {
      const isH = g.homeId === cup.humanTeamId || g.awayId === cup.humanTeamId
      narrative.push(`${isH ? '⭐' : '  '} ${g.homeName} ${g.homeGoals}–${g.awayGoals} ${g.awayName}`)
    })
    if (newCup.humanOut) narrative.push(`😞 Eliminado nas quartas. Foco na liga!`)

  } else if (cup.phase === 'SF') {
    const shuffled = [...cup.alive].sort(() => Math.random() - 0.5)
    const sf = []
    for (let i = 0; i < shuffled.length; i += 2)
      sf.push(cupGame(shuffled[i], getName(shuffled[i]), getStr(shuffled[i]), shuffled[i+1], getName(shuffled[i+1]), getStr(shuffled[i+1])))
    const alive = sf.map(g => g.winnerId)
    newCup = { ...newCup, phase: 'F', sf, alive, humanOut: !alive.includes(cup.humanTeamId) }
    narrative.push(`🏆 Copa dos Viajantes — Semifinais:`)
    sf.forEach(g => {
      const isH = g.homeId === cup.humanTeamId || g.awayId === cup.humanTeamId
      narrative.push(`${isH ? '⭐' : '  '} ${g.homeName} ${g.homeGoals}–${g.awayGoals} ${g.awayName}`)
    })
    if (newCup.humanOut) narrative.push(`😞 Semifinalista da Copa. Prêmio: R$150.000.`)
    else narrative.push(`🔥 VOCÊ está na FINAL DA COPA! Vai encarar ${alive.filter(id => id !== cup.humanTeamId).map(getName).join(', ')}.`)

  } else if (cup.phase === 'F') {
    const [h, a] = cup.alive
    const final = cupGame(h, getName(h), getStr(h), a, getName(a), getStr(a))
    const humanWon = final.winnerId === cup.humanTeamId
    newCup = { ...newCup, phase: 'done', final, alive: [final.winnerId], humanOut: !humanWon }
    narrative.push(`🏆 FINAL DA COPA DOS VIAJANTES: ${final.homeName} ${final.homeGoals}–${final.awayGoals} ${final.awayName}`)
    if (humanWon) narrative.push(`👑 CAMPEÃO DA COPA! Prêmio: R$1.500.000!`)
    else if (!cup.humanOut) narrative.push(`🥈 Vice-campeão da Copa. Prêmio: R$500.000.`)
    else narrative.push(`🏆 ${final.winnerName} é campeão da Copa dos Viajantes.`)
  }

  return { ...state, cup: newCup, narrative }
}
function recomputeHumanStrength(teams: LeagueTeam[], humans: Manager[]): LeagueTeam[] {
  return teams.map(t => t.isHuman && t.humanIndex !== undefined
    ? { ...t, strength: Math.round(squadStrength(humans[t.humanIndex].squad, humans[t.humanIndex].lineupIds)) }
    : t)
}

// When a player leaves a human squad, route them appropriately and return narration.
function releasePlayer(
  player: DraftPlayer,
  teamName: string,
  mode: DraftState['mode'],
  ownedLegendIds: string[],
  teams: LeagueTeam[]
): { ownedLegendIds: string[]; teams: LeagueTeam[]; narrativeLine: string } {
  if (player.legendId) {
    const newOwned = ownedLegendIds.filter(id => id !== player.legendId)
    const dest = mode === 'draft'
      ? 'livre no mercado — disponível no próximo draft'
      : 'volta ao mercado — vai a leilão na próxima janela'
    return { ownedLegendIds: newOwned, teams, narrativeLine: `🔓 ${teamName} dispensou ${player.name} — ${dest}.` }
  }
  const cpuTeams = teams.filter(t => !t.isHuman)
  if (cpuTeams.length === 0) return { ownedLegendIds, teams, narrativeLine: `📋 ${player.name} foi dispensado por ${teamName}.` }
  const dest = cpuTeams[Math.floor(Math.random() * cpuTeams.length)]
  const newTeams = teams.map(t => t.id === dest.id ? { ...t, squad: [...(t.squad ?? []), player] } : t)
  return { ownedLegendIds, teams: newTeams, narrativeLine: `📋 ${player.name} saiu de ${teamName} e foi para o ${dest.name}.` }
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
  half: 1 | 2, startGf = 0, startGa = 0, isHome = false
): MatchEvent[] {
  const minutes = half === 1 ? H1_MINS : H2_MINS
  const adj = isHome ? 3 : 0  // home advantage ~3 rating points
  const xgYou = Math.max(0.4, 1.4 + (rYou + adj - rOpp) / 12 + ATK[tacYou] - DEF[tacOpp])
  const xgOpp = Math.max(0.4, 1.4 + (rOpp - rYou - adj) / 12 + ATK[tacOpp] - DEF[tacYou])
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

  // Injury: ~18% chance per half — one non-GOL player leaves injured
  const injCandidates = xi.filter(p => p.pos !== 'GOL' && !(p.injury && p.injury > 0))
  if (injCandidates.length > 0 && Math.random() < 0.18) {
    const victim = pick(injCandidates)
    const min = pick(minutes)
    const prev = events.filter(e => e.min <= min)
    const snap = prev.at(-1)
    events.push({ min, text: `🚑 ${victim.name.split(' ')[0]} se machucou! Saindo de campo.`, gfAfter: snap?.gfAfter ?? gf, gaAfter: snap?.gaAfter ?? ga, injuredId: victim.id })
  }

  // Yellow card: ~22% chance per half — one random XI player
  if (xi.length > 0 && Math.random() < 0.22) {
    const victim = pick(xi)
    const min = pick(minutes)
    const prev = events.filter(e => e.min <= min)
    const snap = prev.at(-1)
    events.push({ min, text: `🟡 Cartão amarelo para ${victim.name.split(' ')[0]}.`, gfAfter: snap?.gfAfter ?? gf, gaAfter: snap?.gaAfter ?? ga, yellowId: victim.id })
  }

  events.sort((a, b) => a.min - b.min)
  return events
}

// ── formation helpers ──
const FORMATION_SLOTS: Record<Formation, Record<string, number>> = {
  '4-4-2':   { GOL: 1, ZAG: 2, LAT: 2, MEI: 4, ATA: 2 },
  '4-3-3':   { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3 },
  '4-2-3-1': { GOL: 1, ZAG: 2, LAT: 2, MEI: 5, ATA: 1 },
  '4-5-1':   { GOL: 1, ZAG: 2, LAT: 2, MEI: 5, ATA: 1 },
  '3-5-2':   { GOL: 1, ZAG: 3, LAT: 2, MEI: 3, ATA: 2 },
}
function autoLineup(squad: DraftPlayer[], formation: Formation): string[] {
  const slots = FORMATION_SLOTS[formation]
  const used = new Set<string>()
  const result: string[] = []
  for (const pos of ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']) {
    const need = slots[pos] ?? 0
    squad.filter(p => p.pos === pos && !used.has(p.id)).sort((a, b) => b.rating - a.rating).slice(0, need).forEach(p => { used.add(p.id); result.push(p.id) })
  }
  if (result.length < 11) squad.filter(p => !used.has(p.id)).sort((a, b) => b.rating - a.rating).slice(0, 11 - result.length).forEach(p => result.push(p.id))
  return result.slice(0, 11)
}

// ── other-match live data ──
function makeOtherMatchLive(home: LeagueTeam, away: LeagueTeam): OtherMatchLive {
  const diff = (home.strength - away.strength) / 14
  const xgH = Math.max(0.3, 1.2 + diff), xgA = Math.max(0.3, 1.2 - diff)
  const hg = Math.max(0, Math.round(xgH + (Math.random() - 0.5) * 2.5))
  const ag = Math.max(0, Math.round(xgA + (Math.random() - 0.5) * 2.5))
  const goals: OtherMatchGoal[] = []
  for (let i = 0; i < hg; i++) goals.push({ min: 1 + Math.floor(Math.random() * 89), isHome: true })
  for (let i = 0; i < ag; i++) goals.push({ min: 1 + Math.floor(Math.random() * 89), isHome: false })
  goals.sort((a, b) => a.min - b.min)
  return { homeId: home.id, homeName: home.name, awayId: away.id, awayName: away.name, division: home.division, goals, gf: 0, ga: 0 }
}
function buildOtherMatchesLive(teams: LeagueTeam[], skipIds: string[]): OtherMatchLive[] {
  const skip = new Set(skipIds)
  const result: OtherMatchLive[] = []
  for (let d = 1; d <= 4; d++) {
    const pool = teams.filter(t => t.division === d && !skip.has(t.id)).sort(() => Math.random() - 0.5)
    for (let i = 0; i + 1 < pool.length; i += 2) result.push(makeOtherMatchLive(pool[i], pool[i + 1]))
  }
  return result
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
  let ownedLegendIds = [...state.ownedLegendIds, target.id]
  let teams = state.teams
  const extraNarrative: string[] = []
  if (squad.length >= state.rosterMax) {
    const w = [...squad].sort((a, b) => a.rating - b.rating)[0]
    squad = squad.filter(p => p.id !== w.id)
    const aiTeam = teams.find(t => t.humanIndex === hi)
    const rel = releasePlayer(w, aiTeam?.name ?? humans[hi].name, state.mode, ownedLegendIds, teams)
    ownedLegendIds = rel.ownedLegendIds
    teams = rel.teams
    extraNarrative.push(rel.narrativeLine)
  }
  squad.push(player)
  humans[hi] = { ...humans[hi], squad }
  return { ...state, humans, ownedLegendIds, teams, lastPickText: [...state.lastPickText, `${humans[hi].name} escolheu ${target.nickname} (nota ${player.rating})`], narrative: [...state.narrative, ...extraNarrative].slice(-60) }
}
function runDraft(state: DraftState): DraftState {
  let s = { ...state }
  for (let g = 0; g < 100; g++) {
    if (s.draftPos >= s.draftOrder.length) return finishDraft(s)
    const hi = s.draftOrder[s.draftPos]
    const isLocal = hi === s.youIndex
    // Online mode: stop for every player's turn so each picks for themselves
    if (isLocal || s.onlineMode === 'online') {
      if (isLocal) s.pendingDrop = s.humans[hi].squad.length >= s.rosterMax
      return s
    }
    s = aiPick(s, hi); s.draftPos += 1
  }
  return finishDraft(s)
}
function finishDraft(state: DraftState): DraftState {
  // Keep human player's existing lineup — only auto-fill AI squads
  const humans = state.humans.map((h, i) =>
    i === state.youIndex ? h : { ...h, lineupIds: bestEleven(h.squad) }
  )
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
  // Run cup final if still pending
  let s = state
  if (s.cup && s.cup.phase === 'F') s = simulateCupPhase(s)

  const newYear = s.year + 1
  const extra: string[] = []
  let teams = s.teams.map(t => ({ ...t }))
  const moved = new Map<string, number>()
  // Compute final standings per division and apply promotion/relegation
  const divStandings: Record<number, LeagueTeam[]> = {}
  for (let d = 1; d <= 4; d++) {
    const order = teams.filter(t => t.division === d).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
    divStandings[d] = order
    if (d > 1) order.slice(0, 2).forEach(t => moved.set(t.id, d - 1))
    if (d < 4) order.slice(-2).forEach(t => moved.set(t.id, d + 1))
    const champ = order[0]
    if (champ?.humanIndex !== undefined) {
      if (champ.humanIndex === s.youIndex) extra.push(`🥇 VOCÊ foi campeão da ${d}ª divisão!`)
    }
  }
  teams = teams.map(t => moved.has(t.id) ? { ...t, division: moved.get(t.id)! } : t)
  const youTeam = teams.find(t => t.humanIndex === s.youIndex)!
  const youOld = s.teams.find(t => t.id === youTeam.id)!
  const promoted = youTeam.division < youOld.division
  const relegated = youTeam.division > youOld.division
  if (promoted) extra.push(`⬆️ ${youTeam.name} SUBIU para a ${youTeam.division}ª divisão!`)
  else if (relegated) extra.push(`⬇️ ${youTeam.name} caiu para a ${youTeam.division}ª divisão.`)

  // Prize money — award to ALL human managers
  extra.push(`💰 Prêmios da temporada ${s.season}:`)
  const humanPrizes: number[] = s.humans.map((_, hi) => {
    const ht = s.teams.find(t => t.humanIndex === hi)!
    const standing = divStandings[ht.division] ?? []
    const pos = standing.findIndex(t => t.id === ht.id)
    const leaguePrize = (LEAGUE_PRIZE[ht.division] ?? [])[pos] ?? 0
    const movePrize = moved.get(ht.id) !== undefined
      ? (moved.get(ht.id)! < ht.division ? PROMOTION_BONUS : RELEGATION_PENALTY)
      : 0
    const cup = s.cup
    let cupPrize = 0
    if (cup) {
      if (cup.phase === 'done') {
        const myTid = s.teams.find(t => t.humanIndex === hi)?.id ?? ''
        if (cup.final?.winnerId === myTid) cupPrize = CUP_PRIZE.winner
        else if (cup.sf.some(g => g.homeId === myTid || g.awayId === myTid) && cup.alive.length <= 2 && cup.alive.some(id => id !== myTid)) cupPrize = CUP_PRIZE.runner
        else if (cup.sf.some(g => g.homeId === myTid || g.awayId === myTid)) cupPrize = CUP_PRIZE.sf
        else if (cup.qf.some(g => g.homeId === myTid || g.awayId === myTid)) cupPrize = CUP_PRIZE.qf
      }
    }
    return leaguePrize + movePrize + cupPrize
  })
  // Announce human prizes (all managers, not just you)
  s.humans.forEach((_h, hi) => {
    const ht = s.teams.find(t => t.humanIndex === hi)!
    const standing = divStandings[ht.division] ?? []
    const pos = standing.findIndex(t => t.id === ht.id) + 1
    const prize = humanPrizes[hi]
    if (hi === s.youIndex) {
      extra.push(`  ⭐ ${ht.name}: ${pos}º lugar na ${ht.division}ª div → +R$${(prize / 1000).toFixed(0)}k`)
    }
  })
  const promoNames = [...moved.entries()].filter(([id, d]) => { const t = s.teams.find(t => t.id === id); return t && d < t.division && !t.isHuman }).slice(0,3).map(([id]) => s.teams.find(t => t.id === id)?.name ?? '').filter(Boolean)
  if (promoNames.length) extra.push(`⬆️ Também sobem: ${promoNames.join(', ')}`)
  const humans = s.humans.map((m, hi) => {
    const started = new Set(m.lineupIds ?? [])
    const squad = m.squad.map(p => {
      let upd = { ...p }
      // Age up
      if (upd.age !== undefined) upd = { ...upd, age: upd.age + 1 }
      // Reset yellows each season
      upd = { ...upd, yellowCards: 0, suspended: false }
      // Clear injuries at season end
      upd = { ...upd, injury: 0 }

      if (p.legendId) {
        // Legends: curve-based rating + devBonus for played legends
        const lg = LEGENDS.find(l => l.id === p.legendId)!
        let dev = p.devBonus ?? 0
        const base = getCurrentRating(lg, newYear)
        if (started.has(p.id) && base + dev < lg.truePotential) dev = Math.min(lg.truePotential - base, dev + 2)
        upd = { ...upd, devBonus: dev, rating: Math.min(lg.truePotential, base + dev) }
      } else if (upd.age !== undefined) {
        // Non-legends: young players grow, veterans decline
        if (upd.age < 27) {
          upd = { ...upd, rating: Math.min((p.potential ?? 90), p.rating + 1) }
        } else if (upd.age > 30) {
          upd = { ...upd, rating: Math.max(30, p.rating - 1) }
        }
      }
      return upd
    })
    const prize = humanPrizes[hi] ?? 0
    return { ...m, squad, money: m.money + prize }
  })
  teams = teams.map(t => ({ ...t, points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—', strength: t.isHuman ? t.strength : (t.squad ? Math.round(squadStrength(t.squad)) : t.strength) }))
  // Re-init cup for next season
  const nextCupBase = { ...s, teams, humans }
  const nextCup = initCup(nextCupBase)
  return { ...s, teams: recomputeHumanStrength(teams, humans), humans, season: s.season + 1, round: 0, year: newYear, screen: newYear >= 2026 ? 'ending' : 'hub', narrative: [...s.narrative, `🏁 Fim da temporada ${s.season}.`, ...extra], cup: nextCup }
}

// ── after match, check if window should open ──
function afterMatch(state: DraftState): DraftState {
  let s = state
  // Cup rounds: QF at round 4, SF at round 8, Final at end of season (in seasonEnd)
  if (s.cup && s.cup.phase !== 'done') {
    if (s.round === 4 && s.cup.phase === 'QF') s = simulateCupPhase(s)
    if (s.round === 8 && s.cup?.phase === 'SF') s = simulateCupPhase(s)
  }
  if (s.round >= s.roundsPerSeason) return seasonEnd(s)
  if (s.round % s.windowEvery === 0) {
    const wnum = Math.floor(s.round / s.windowEvery)
    if (s.mode === 'leilao') return openLeilao(s)
    if (s.mode === 'draft_leilao') return wnum % 2 === 0 ? openDraft(s) : openLeilao(s)
    return openDraft(s)
  }
  return s
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
    case 'START_ONLINE': {
      const base = {
        onlineMode: 'online' as const, roomId: action.roomId, roomCode: action.roomCode,
        isHost: action.isHost, youIndex: action.playerIndex,
        totalPlayers: action.playerNames.length, playerNames: action.playerNames, mode: action.mode,
      }
      if (action.gameState) {
        // Reconnect: restore saved state, keep online identity
        return { ...action.gameState, ...base }
      }
      return { ...state, ...base, screen: 'intro' }
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
      // Build ALL 40 CPU teams first
      const allTeams: LeagueTeam[] = []
      let cpuId = 0
      CPU_POOLS.forEach((pool, di) => {
        const division = di + 1
        pool.forEach(c => {
          const squad = getCpuSquad(cpuId, division)
          const strength = Math.round(squadStrength(squad))
          allTeams.push({ id: `c${cpuId++}`, name: c.name, city: c.city, division, isHuman: false, strength, squad, points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, lastResult: '—' })
        })
      })

      // Human picks one of the div-4 teams (c30–c39)
      const chosenTeam = allTeams.find(t => t.id === action.clubId)!
      const div4Remaining = allTeams.filter(t => t.division === 4 && t.id !== action.clubId)
      const aiNames = [...AI_MANAGERS].sort(() => Math.random() - 0.5)
      const friendCount = state.onlineMode === 'online' ? state.totalPlayers - 1 : 3
      const friendTeams = [...div4Remaining].sort(() => Math.random() - 0.5).slice(0, friendCount)

      const humans: Manager[] = []
      const youSquad = chosenTeam.squad ?? []
      humans.push({ id: 'h0', name: action.managerName || 'Você', isYou: true, teamId: action.clubId, squad: youSquad, lineupIds: bestEleven(youSquad), tactic: 'equilibrio', formation: '4-4-2' as Formation, money: START_MONEY })
      friendTeams.forEach((ft, i) => {
        const friendSquad = ft.squad ?? []
        humans.push({ id: `h${i + 1}`, name: state.playerNames[i + 1] ?? aiNames[i] ?? `Técnico ${i + 2}`, isYou: false, teamId: ft.id, squad: friendSquad, lineupIds: bestEleven(friendSquad), tactic: 'equilibrio', formation: '4-4-2' as Formation, money: START_MONEY })
      })

      // Mark human-controlled teams in the full 40-team array
      const teams = allTeams.map(t => {
        if (t.id === action.clubId) return { ...t, isHuman: true, humanIndex: 0 }
        const fi = friendTeams.findIndex(ft => ft.id === t.id)
        if (fi >= 0) return { ...t, isHuman: true, humanIndex: fi + 1 }
        return t
      })

      const modeLabel = action.mode === 'draft' ? 'DRAFT' : action.mode === 'leilao' ? 'LEILÃO' : 'DRAFT + LEILÃO'
      const partialState = {
        ...state, started: true, screen: 'hub' as const, mode: action.mode, teams, humans, youIndex: 0,
        narrative: [
          `⚡ O raio caiu na pelada dos casados e jogou a galera de volta pra 1992.`,
          `Só vocês lembram quem vai virar lenda. Modo: ${modeLabel}.`,
          `Você assumiu o ${chosenTeam.name} na 4ª divisão (R$1 milhão no caixa). A cada ${WINDOW_EVERY} jogos abre a janela pra fisgar um craque — pior colocado escolhe primeiro.`,
          `🏆 Copa dos Viajantes começou! 8 times, 3 fases. Quartas na rodada 4.`,
        ],
      }
      return { ...partialState, cup: initCup(partialState) }
    }

    case 'ADVANCE_ROUND': {
      if (state.inDraft || state.live) return state
      const round = state.round + 1
      const isHome = round % 2 === 1  // odd rounds = home, even = away
      const { teams, humans, oppTeam } = simulateOtherMatches({ ...state, round })
      const you = humans[state.youIndex]
      const myTeam = teams.find(t => t.humanIndex === state.youIndex)!
      // Only field healthy, non-suspended players
      const xi = you.squad.filter(p => you.lineupIds.includes(p.id) && !(p.injury && p.injury > 0) && !p.suspended)
      const h1Events = pregenHalfEvents(myTeam.strength, you.tactic, oppTeam.strength, 'equilibrio', xi, oppTeam.name, 1, 0, 0, isHome)
      const homeLabel = isHome ? `${myTeam.city} (casa)` : `${oppTeam.name} (fora)`
      const live: LiveMatch = {
        oppTeamId: oppTeam.id,
        oppName: oppTeam.name,
        oppStrength: oppTeam.strength,
        minute: 0, gf: 0, ga: 0,
        events: [`0' · Bola rolando! ${isHome ? '🏠' : '✈️'} ${homeLabel}`],
        allEvents: h1Events,
        half: 1, division: myTeam.division,
        subsUsed: 0, isHome, injuredIds: [], yellowedIds: [],
        otherMatches: buildOtherMatchesLive(teams, [myTeam.id, oppTeam.id]),
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
      const updOtherMatches = (live.otherMatches ?? []).map(m => {
        const visible = m.goals.filter(g => g.min <= newMin)
        return { ...m, gf: visible.filter(g => g.isHome).length, ga: visible.filter(g => !g.isHome).length }
      })
      const newInjuredIds = newlyRevealed.filter(e => e.injuredId).map(e => e.injuredId!)
      const newYellowedIds = newlyRevealed.filter(e => e.yellowId).map(e => e.yellowId!)
      const updLive: LiveMatch = {
        ...live, minute: newMin, gf: updGf, ga: updGa, events: [...live.events, ...newTexts], half,
        injuredIds: [...(live.injuredIds ?? []), ...newInjuredIds],
        yellowedIds: [...(live.yellowedIds ?? []), ...newYellowedIds],
        otherMatches: updOtherMatches,
      }
      if (half === 'ht') updLive.events = [...updLive.events, `45' · ⏸ Intervalo — ${updGf}–${updGa}`]
      if (half === 'ft') updLive.events = [...updLive.events, `90' · 🏁 Apito final! ${updGf}–${updGa}`]
      return { ...state, live: updLive }
    }

    case 'START_HALF2': {
      if (!state.live || state.live.half !== 'ht') return state
      const you = state.humans[state.youIndex]
      const xi = you.squad.filter(p => you.lineupIds.includes(p.id) && !(p.injury && p.injury > 0) && !p.suspended)
      const myTeam = state.teams.find(t => t.humanIndex === state.youIndex)!
      const h2Events = pregenHalfEvents(
        myTeam.strength, you.tactic, state.live.oppStrength, 'equilibrio',
        xi, state.live.oppName, 2, state.live.gf, state.live.ga, state.live.isHome
      )
      return { ...state, live: { ...state.live, half: 2, minute: 45, allEvents: [...state.live.allEvents, ...h2Events] } }
    }

    case 'MAKE_SUB': {
      if (!state.live || (state.live.subsUsed ?? 0) >= 3) return state
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      const lineup = you.lineupIds.map(id => id === action.outId ? action.inId : id)
      humans[state.youIndex] = { ...you, lineupIds: lineup }
      return { ...state, humans, live: { ...state.live, subsUsed: (state.live.subsUsed ?? 0) + 1 } }
    }

    case 'CHANGE_TACTIC_MATCH': {
      const humans = [...state.humans]
      humans[state.youIndex] = { ...humans[state.youIndex], tactic: action.tactic }
      return { ...state, humans }
    }

    case 'END_MATCH': {
      if (!state.live) return { ...state, screen: 'hub' }
      const { gf, ga, oppTeamId, division, injuredIds = [], yellowedIds = [] } = state.live
      const myTeam = state.teams.find(t => t.humanIndex === state.youIndex)!
      let teams = state.teams.map(t => {
        if (t.id === myTeam.id) return applyRow(t, gf, ga)
        if (t.id === oppTeamId) return applyRow(t, ga, gf)
        return t
      })
      const receipt = Math.round(gate(division) * (gf > ga ? 1.5 : gf === ga ? 1 : 0.6))
      const extraNarrative: string[] = []

      // Apply post-match effects to the human player's squad
      const humans = state.humans.map((h, hi) => {
        if (hi !== state.youIndex) return h
        let squad = h.squad.map(p => {
          let upd = { ...p }
          // Decrement pre-existing injury countdown
          if ((upd.injury ?? 0) > 0) upd = { ...upd, injury: upd.injury! - 1 }
          // Clear served suspension
          if (upd.suspended) upd = { ...upd, suspended: false, yellowCards: 0 }
          // New injury from this match
          if (injuredIds.includes(p.id)) {
            const rounds = 2 + Math.floor(Math.random() * 3)  // 2–4 rounds out
            upd = { ...upd, injury: rounds }
            extraNarrative.push(`🚑 ${p.name} lesionado — fora por ${rounds} rodadas.`)
          }
          // New yellow card from this match
          if (yellowedIds.includes(p.id)) {
            const yellows = ((p.yellowCards ?? 0)) + 1
            if (yellows >= 3) {
              upd = { ...upd, suspended: true, yellowCards: 0 }
              extraNarrative.push(`🟥 ${p.name} com 3 amarelos — suspenso na próxima rodada.`)
            } else {
              upd = { ...upd, yellowCards: yellows }
            }
          }
          return upd
        })
        // Auto-remove unavailable players from lineup
        const lineupIds = h.lineupIds.filter(id => {
          const p = squad.find(p => p.id === id)
          return p && !(p.injury && p.injury > 0) && !p.suspended
        })
        return { ...h, squad, lineupIds, money: h.money + receipt }
      })

      teams = recomputeHumanStrength(teams, humans)
      const oppTeam = state.teams.find(t => t.id === oppTeamId)!
      const resultIcon = gf > ga ? '🟢' : gf === ga ? '🟡' : '🔴'
      const line = `${resultIcon} ${myTeam.name} ${gf}–${ga} ${oppTeam.name} · rodada ${state.round}`
      const mid: DraftState = {
        ...state, teams, humans, live: null, screen: 'hub',
        narrative: [...state.narrative, line, ...extraNarrative].slice(-60),
      }
      return afterMatch(mid)
    }

    case 'DRAFT_PICK': {
      if (!state.inDraft) return state
      const pickerIdx = action.playerIndex ?? state.youIndex
      // Verify it's this player's turn
      if (state.draftOrder[state.draftPos] !== pickerIdx) return state
      // Local player roster full: must drop first
      if (pickerIdx === state.youIndex && state.pendingDrop) return state
      const legend = LEGENDS.find(l => l.id === action.legendId)
      if (!legend || state.ownedLegendIds.includes(legend.id)) return state
      const humans = [...state.humans]
      const picker = humans[pickerIdx]
      if (picker.squad.length >= state.rosterMax) {
        if (pickerIdx === state.youIndex) return { ...state, pendingDrop: true }
        return state  // online players over limit: skip
      }
      const player = legendToPlayer(legend, state.year)
      humans[pickerIdx] = { ...picker, squad: [...picker.squad, player] }
      const pickLabel = pickerIdx === state.youIndex
        ? `⭐ VOCÊ fisgou ${legend.nickname} (nota ${player.rating} · pot ${legend.truePotential})`
        : `${picker.name} fisgou ${legend.nickname} (nota ${player.rating})`
      const r = runDraft({ ...state, humans, ownedLegendIds: [...state.ownedLegendIds, legend.id], lastPickText: [...state.lastPickText, pickLabel], draftPos: state.draftPos + 1 })
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'SKIP_PICK': {
      if (!state.inDraft) return state
      const pickerIdx = action.playerIndex ?? state.youIndex
      if (state.draftOrder[state.draftPos] !== pickerIdx) return state
      const skipName = pickerIdx === state.youIndex ? 'Você' : state.humans[pickerIdx].name
      const r = runDraft({ ...state, draftPos: state.draftPos + 1, pendingDrop: false, lastPickText: [...state.lastPickText, `${skipName} passou a vez.`] })
      return { ...r, screen: r.inDraft ? 'draft' : r.screen }
    }

    case 'SET_PRESENCE':
      return { ...state, onlinePresence: action.indices }

    case 'DROP_PLAYER': {
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      const player = you.squad.find(p => p.id === action.playerId)
      if (!player) return state
      humans[state.youIndex] = { ...you, squad: you.squad.filter(p => p.id !== action.playerId), lineupIds: (you.lineupIds ?? []).filter(id => id !== action.playerId) }
      const myTeam = state.teams.find(t => t.humanIndex === state.youIndex)
      const { ownedLegendIds, teams, narrativeLine } = releasePlayer(player, myTeam?.name ?? 'Você', state.mode, state.ownedLegendIds, state.teams)
      return { ...state, humans, pendingDrop: false, ownedLegendIds, teams: recomputeHumanStrength(teams, humans), narrative: [...state.narrative, narrativeLine].slice(-60) }
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
      let leilaoTeams = state.teams
      let leilaoOwned = [...state.ownedLegendIds, legendId]
      const leilaoNarrative: string[] = []
      let newHumans = humans.map((h, i) => {
        if (i !== winnerIdx) return h
        let squad = [...h.squad]
        if (squad.length >= state.rosterMax) {
          const weakest = [...squad].sort((a, b) => a.rating - b.rating)[0]
          squad = squad.filter(p => p.id !== weakest.id)
          const winTeam = leilaoTeams.find(t => t.humanIndex === i)
          const rel = releasePlayer(weakest, winTeam?.name ?? h.name, state.mode, leilaoOwned, leilaoTeams)
          leilaoOwned = rel.ownedLegendIds
          leilaoTeams = rel.teams
          leilaoNarrative.push(rel.narrativeLine)
        }
        squad.push(legendToPlayer(legend, state.year))
        return { ...h, squad, money: h.money - bids[i], lineupIds: bestEleven(squad) }
      })
      const winner = newHumans[winnerIdx]
      return {
        ...state,
        humans: newHumans,
        ownedLegendIds: leilaoOwned,
        leilaoBids: bids,
        leilaoPhase: 'reveal',
        narrative: [...state.narrative, `💰 ${winner.name} arrematou ${legend.nickname} por R$${bids[winnerIdx].toLocaleString('pt-BR')}!`, ...leilaoNarrative].slice(-60),
        teams: recomputeHumanStrength(leilaoTeams, newHumans),
      }
    }

    case 'NEXT_LEILAO': {
      const next = state.leilaoIndex + 1
      if (next >= state.leilaoItems.length) return { ...state, screen: 'hub', leilaoPhase: 'done' }
      return { ...state, leilaoIndex: next, leilaoBids: new Array(state.humans.length).fill(0), leilaoPhase: 'bid' }
    }

    case 'SET_FORMATION': {
      const humans = [...state.humans]
      const you = humans[state.youIndex]
      const newLineup = autoLineup(you.squad, action.formation)
      humans[state.youIndex] = { ...you, formation: action.formation, lineupIds: newLineup }
      return { ...state, humans, teams: recomputeHumanStrength(state.teams, humans) }
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

    // Presence: announce self and track others
    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState()
      const indices = Object.values(pState).flat().map((p: unknown) => (p as { playerIndex: number }).playerIndex)
      rawDispatch({ type: 'SET_PRESENCE', indices })
    })

    // Guests can request a full state snapshot from host when joining mid-game
    ch.on('broadcast', { event: 'request_state' }, () => {
      if (isHostRef.current) {
        // We capture state via closure at subscribe time; host re-sends on demand
        channelRef.current?.send({ type: 'broadcast', event: 'state', payload: state })
      }
    })

    ch.subscribe(async () => {
      await ch.track({ playerIndex: state.youIndex, name: state.humans[state.youIndex]?.name ?? '' })
      // Guests request the current state snapshot from host after subscribing
      if (!state.isHost) {
        channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
      }
    })
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

  // Debounced DB persistence: host saves game_state every 3s after changes
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId || !state.started) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      supabase.from('game_rooms').update({ game_state: state }).eq('id', state.roomId)
    }, 3000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [state])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}
export function useDraft() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDraft must be used within DraftProvider')
  return ctx
}
