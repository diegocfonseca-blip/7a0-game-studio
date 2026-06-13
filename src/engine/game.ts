import type { Squad } from '../data/squads'
import type { Formation, FormationSlot } from '../data/formations'

export type GameMode = 'classic' | 'almanac'
export type GameStyle = 'defensive' | 'balanced' | 'offensive'

export interface PickedPlayer {
  player: import('../data/squads').Player
  squad: Squad
  slot: FormationSlot
  slotIndex: number
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'conceded'
  playerName?: string
  assistName?: string
}

export interface MatchResult {
  opponent: string
  opponentFlag: string
  opponentBadge: string
  opponentYear: number
  goalsFor: number
  goalsAgainst: number
  events: MatchEvent[]
  phase: string
  won: boolean
  penalties?: { goalsFor: number; goalsAgainst: number }
}

export interface GameState {
  seed: string
  formation: Formation
  mode: GameMode
  style: GameStyle
  picks: PickedPlayer[]
  currentRoll: { squad: Squad; rerollsLeft: number } | null
  phase: 'setup' | 'rolling' | 'picking' | 'simulating' | 'halftime' | 'results'
  matches: MatchResult[]
  eliminated: boolean
  overall: number
  subsUsed: number
}

// ─── Seeded random ────────────────────────────────────────────────────────────

function sr(seed: string, matchIdx: number, offset: number): number {
  let h = 0
  const str = `${seed}|${matchIdx}|${offset}`
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return (h >>> 0) / 4294967296
}

// Poisson-distributed goal count
function poissonGoals(lambda: number, seed: string, matchIdx: number, offset: number): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-Math.min(lambda, 5))
  let k = 0, p = 1
  do {
    k++
    p *= sr(seed, matchIdx, offset + k)
  } while (p > L && k < 8)
  return Math.min(k - 1, 5)
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function rollSquad(seed: string, rollIndex: number, exclude?: string[], pool?: Squad[]): Squad {
  const available = pool!.filter(s => !exclude?.includes(s.id))
  const idx = Math.floor(sr(seed, rollIndex, 0) * available.length)
  return available[idx]
}

export function computeOverall(picks: PickedPlayer[], style: GameStyle): number {
  if (picks.length === 0) return 0
  const avg = picks.reduce((sum, p) => sum + p.player.rating, 0) / picks.length
  const bonus = style === 'offensive' ? 1 : style === 'defensive' ? -1 : 0
  return Math.round(avg + bonus)
}

export function computeAtaque(picks: PickedPlayer[]): number | null {
  const atk = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.slot.position))
  if (atk.length === 0) return null
  return Math.round(atk.reduce((s, p) => s + p.player.rating, 0) / atk.length)
}

export function computeDefesa(picks: PickedPlayer[]): number | null {
  const def = picks.filter(p => ['GOL', 'ZAG', 'LD', 'LE', 'VOL'].includes(p.slot.position))
  if (def.length === 0) return null
  return Math.round(def.reduce((s, p) => s + p.player.rating, 0) / def.length)
}

// ─── Opponent generation from pool ───────────────────────────────────────────

type OpponentDef = { name: string; flag: string; badge: string; year: number; phase: string; rating: number; squad: Squad }

function generateOpponents(pool: Squad[], pickedSquadIds: string[], seed: string): OpponentDef[] {
  const available = pool.filter(s => !pickedSquadIds.includes(s.id))

  // Seeded Fisher-Yates shuffle
  const shuffled = [...available]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(sr(seed, 997, i) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Pick up to 7, sort weakest→strongest by average player rating
  const selected = shuffled.slice(0, Math.min(7, shuffled.length))
  selected.sort((a, b) => {
    const avgA = a.players.reduce((s, p) => s + p.rating, 0) / a.players.length
    const avgB = b.players.reduce((s, p) => s + p.rating, 0) / b.players.length
    return avgA - avgB
  })

  // Pad if fewer than 7 available (repeat last)
  while (selected.length < 7 && selected.length > 0) {
    selected.push(selected[selected.length - 1])
  }

  const phases = ['Grupos', 'Grupos', 'Grupos', 'Oitavas', 'Quartas', 'Semifinal', 'Final']
  const baseRatings = [76, 78, 80, 84, 87, 90, 93]

  return selected.map((squad, i) => ({
    name: squad.clubName ?? squad.countryNamePt,
    flag: squad.flagEmoji,
    badge: squad.badgeEmoji ?? squad.countryCode,
    year: squad.year,
    phase: phases[i],
    rating: baseRatings[i],
    squad,
  }))
}

// ─── Match simulation ─────────────────────────────────────────────────────────

function simulateMatch(
  teamOverall: number,
  opponentRating: number,
  picks: PickedPlayer[],
  seed: string,
  matchIdx: number,
  style: GameStyle = 'balanced',
  opponentPlayers: string[] = [],
  prevScorers: Map<string, number> = new Map()
): { goalsFor: number; goalsAgainst: number; events: MatchEvent[] } {
  const attackers = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.slot.position))
  const defenders = picks.filter(p => ['GOL', 'ZAG', 'LD', 'LE', 'VOL'].includes(p.slot.position))

  const atkAvg = attackers.length
    ? attackers.reduce((s, p) => s + p.player.rating, 0) / attackers.length
    : teamOverall
  const defAvg = defenders.length
    ? defenders.reduce((s, p) => s + p.player.rating, 0) / defenders.length
    : teamOverall

  const diff = teamOverall - opponentRating
  const adjFor = Math.max(-0.6, Math.min(0.6, diff / 40))
  const adjAgainst = -adjFor * 0.8

  const atkBonus = (atkAvg - 80) / 100
  const defBonus = (defAvg - 80) / 120
  const legendCount = picks.filter(p => p.player.isLegend).length
  const legendBonus = Math.min(0.2, legendCount * 0.03)

  const styleAtkMod = style === 'offensive' ? 0.2 : style === 'defensive' ? -0.15 : 0
  const styleDefMod = style === 'defensive' ? -0.2 : style === 'offensive' ? 0.1 : 0

  const lambdaFor = Math.max(0.3, 1.35 + adjFor + atkBonus + legendBonus + styleAtkMod)
  const lambdaAgainst = Math.max(0.1, 1.05 + adjAgainst - defBonus + styleDefMod)

  const goalsFor = poissonGoals(lambdaFor, seed, matchIdx, 1)
  const goalsAgainst = poissonGoals(lambdaAgainst, seed, matchIdx, 30)

  const events: MatchEvent[] = []
  const scorerPool = attackers.length ? attackers : picks
  const assistPool = picks.filter(p => !['GOL'].includes(p.slot.position))

  // Within-match decay: each goal lowers that player's weight for the next goal
  const scoredCount = new Map<string, number>()

  for (let i = 0; i < goalsFor; i++) {
    const minute = Math.min(90, Math.floor(sr(seed, matchIdx, 50 + i) * 90) + 1)
    const weights = scorerPool.map(p => {
      const timesThis = scoredCount.get(p.player.id) ?? 0
      const timesPrev = prevScorers.get(p.player.name) ?? 0
      // Compressed rating scale so lower-rated players still have meaningful chances
      const base = Math.pow(Math.max(0.1, (p.player.rating - 65) / 30), 1.5) * (p.player.isLegend ? 1.3 : 1)
      return Math.max(0.05, base * Math.pow(0.18, timesThis) * Math.pow(0.52, timesPrev))
    })
    const ratingSum = weights.reduce((s, w) => s + w, 0)
    let pick = sr(seed, matchIdx, 60 + i) * ratingSum
    let scorer = scorerPool[scorerPool.length - 1]
    for (let j = 0; j < scorerPool.length; j++) {
      pick -= weights[j]
      if (pick <= 0) { scorer = scorerPool[j]; break }
    }
    scoredCount.set(scorer.player.id, (scoredCount.get(scorer.player.id) ?? 0) + 1)

    const assistIdx = Math.floor(sr(seed, matchIdx, 70 + i) * assistPool.length)
    const assister = assistPool[assistIdx]
    events.push({
      minute, type: 'goal',
      playerName: scorer.player.name,
      assistName: assister && assister.player.name !== scorer.player.name ? assister.player.name : undefined,
    })
  }

  // Opponent scorers: equal weight with heavy decay to spread goals across players
  const oppScoredCount = new Map<string, number>()
  for (let i = 0; i < goalsAgainst; i++) {
    const minute = Math.min(90, Math.floor(sr(seed, matchIdx, 80 + i) * 90) + 1)
    const oppPool = opponentPlayers.length ? opponentPlayers : []
    let scorerName: string | undefined
    if (oppPool.length) {
      const weights = oppPool.map(n => 1 / (1 + (oppScoredCount.get(n) ?? 0) * 4))
      const total = weights.reduce((a, b) => a + b, 0)
      let pick = sr(seed, matchIdx, 90 + i) * total
      scorerName = oppPool[oppPool.length - 1]
      for (let j = 0; j < oppPool.length; j++) {
        pick -= weights[j]
        if (pick <= 0) { scorerName = oppPool[j]; break }
      }
      oppScoredCount.set(scorerName, (oppScoredCount.get(scorerName) ?? 0) + 1)
    }
    events.push({ minute, type: 'conceded', playerName: scorerName })
  }

  events.sort((a, b) => a.minute - b.minute)
  return { goalsFor, goalsAgainst, events }
}

function simulatePenalties(seed: string, matchIdx: number): { goalsFor: number; goalsAgainst: number } {
  let gf = 0, ga = 0
  for (let i = 0; i < 5; i++) {
    if (sr(seed, matchIdx, 200 + i) > 0.22) gf++
    if (sr(seed, matchIdx, 210 + i) > 0.22) ga++
  }
  if (gf === ga) {
    if (sr(seed, matchIdx, 220) > 0.5) gf++
    else ga++
  }
  return { goalsFor: gf, goalsAgainst: ga }
}

// ─── Copa simulation ──────────────────────────────────────────────────────────

function runMatches(
  picks: PickedPlayer[],
  style: GameStyle,
  seed: string,
  opponents: OpponentDef[],
  startIdx: number,
  prevScorers: Map<string, number> = new Map()
): MatchResult[] {
  const overall = computeOverall(picks, style)
  const results: MatchResult[] = []
  let groupLosses = 0
  const crossMatchScorers = new Map<string, number>(prevScorers)

  for (let i = 0; i < opponents.length; i++) {
    const opp = opponents[i]
    const isKnockout = startIdx + i >= 3
    const matchIdx = startIdx + i

    const oppPlayers = opp.squad.players
      .filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME', 'VOL'].includes(p.primaryPosition))
      .map(p => p.name)
    const match = simulateMatch(overall, opp.rating, picks, seed, matchIdx, style, oppPlayers, crossMatchScorers)
    for (const ev of match.events) {
      if (ev.type === 'goal' && ev.playerName) {
        crossMatchScorers.set(ev.playerName, (crossMatchScorers.get(ev.playerName) ?? 0) + 1)
      }
    }

    let won = match.goalsFor > match.goalsAgainst
    let penalties: { goalsFor: number; goalsAgainst: number } | undefined

    if (match.goalsFor === match.goalsAgainst) {
      if (!isKnockout) {
        won = true
      } else {
        penalties = simulatePenalties(seed, matchIdx + 100)
        won = penalties.goalsFor > penalties.goalsAgainst
      }
    }

    if (!isKnockout && match.goalsFor < match.goalsAgainst) groupLosses++

    results.push({
      opponent: opp.name,
      opponentFlag: opp.flag,
      opponentBadge: opp.badge,
      opponentYear: opp.year,
      goalsFor: match.goalsFor,
      goalsAgainst: match.goalsAgainst,
      events: match.events,
      phase: opp.phase,
      won,
      penalties,
    })

    if (!isKnockout && groupLosses >= 2) break
    if (isKnockout && !won) break
  }

  return results
}

export function simulateGroupStage(state: GameState, pool: Squad[]): MatchResult[] {
  const pickedIds = state.picks.map(p => p.squad.id)
  const opponents = generateOpponents(pool, pickedIds, state.seed)
  return runMatches(state.picks, state.style, state.seed, opponents.slice(0, 3), 0)
}

export function simulateKnockouts(state: GameState, groupMatches: MatchResult[], pool: Squad[]): MatchResult[] {
  const groupLosses = groupMatches.filter(m => !m.won && m.phase === 'Grupos').length
  if (groupLosses >= 2) return []
  const pickedIds = state.picks.map(p => p.squad.id)
  const opponents = generateOpponents(pool, pickedIds, state.seed)
  // Carry scorer memory from group stage into knockouts
  const groupScorers = new Map<string, number>()
  for (const m of groupMatches) {
    for (const ev of m.events) {
      if (ev.type === 'goal' && ev.playerName) {
        groupScorers.set(ev.playerName, (groupScorers.get(ev.playerName) ?? 0) + 1)
      }
    }
  }
  return runMatches(state.picks, state.style, state.seed, opponents.slice(3), 3, groupScorers)
}

export function simulateCopa(state: GameState, pool: Squad[]): MatchResult[] {
  const groups = simulateGroupStage(state, pool)
  const knockouts = simulateKnockouts(state, groups, pool)
  return [...groups, ...knockouts]
}
