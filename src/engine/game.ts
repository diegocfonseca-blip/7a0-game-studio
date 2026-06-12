import squads from '../data/squads'
import type { Squad, Position } from '../data/squads'
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
  phase: 'setup' | 'rolling' | 'picking' | 'simulating' | 'results'
  matches: MatchResult[]
  eliminated: boolean
  overall: number
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

// Poisson-distributed goal count (realistic World Cup scores: 0–4 per team)
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

export function rollSquad(seed: string, rollIndex: number, exclude?: string[]): Squad {
  const available = squads.filter(s => !exclude?.includes(s.id))
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

// ─── Match simulation ─────────────────────────────────────────────────────────

function simulateMatch(
  teamOverall: number,
  opponentRating: number,
  picks: PickedPlayer[],
  seed: string,
  matchIdx: number
): { goalsFor: number; goalsAgainst: number; events: MatchEvent[] } {
  const attackers = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.slot.position))
  const defenders = picks.filter(p => ['GOL', 'ZAG', 'LD', 'LE', 'VOL'].includes(p.slot.position))
  const legends = picks.filter(p => p.player.isLegend)

  const atkAvg = attackers.length
    ? attackers.reduce((s, p) => s + p.player.rating, 0) / attackers.length
    : teamOverall
  const defAvg = defenders.length
    ? defenders.reduce((s, p) => s + p.player.rating, 0) / defenders.length
    : teamOverall

  // Rating differential drives lambda adjustment (capped so it stays realistic)
  const diff = teamOverall - opponentRating
  const adjFor = Math.max(-0.5, Math.min(0.5, diff / 50))
  const adjAgainst = -adjFor

  // Attack strength: base 1.3 goals/game, adjusted by attack rating above/below 80
  const atkBonus = (atkAvg - 80) / 120
  // Defense strength: base 1.0 goals conceded/game, adjusted by defense rating
  const defBonus = (defAvg - 80) / 150

  const lambdaFor = Math.max(0.25, 1.3 + adjFor + atkBonus)
  const lambdaAgainst = Math.max(0.15, 1.0 + adjAgainst - defBonus)

  const goalsFor = poissonGoals(lambdaFor, seed, matchIdx, 1)
  const goalsAgainst = poissonGoals(lambdaAgainst, seed, matchIdx, 30)

  // Build events — goal scorers weighted by rating + legend bonus
  const events: MatchEvent[] = []
  const scorerPool = attackers.length ? attackers : picks
  const assistPool = picks.filter(p => !['GOL'].includes(p.slot.position))

  for (let i = 0; i < goalsFor; i++) {
    const minute = Math.min(90, Math.floor(sr(seed, matchIdx, 50 + i) * 90) + 1)
    // Weight by rating so legends score more
    const ratingSum = scorerPool.reduce((s, p) => s + p.player.rating + (p.player.isLegend ? 10 : 0), 0)
    let pick = sr(seed, matchIdx, 60 + i) * ratingSum
    let scorer = scorerPool[scorerPool.length - 1]
    for (const p of scorerPool) {
      pick -= p.player.rating + (p.player.isLegend ? 10 : 0)
      if (pick <= 0) { scorer = p; break }
    }
    const assistIdx = Math.floor(sr(seed, matchIdx, 70 + i) * assistPool.length)
    const assister = assistPool[assistIdx]
    events.push({
      minute,
      type: 'goal',
      playerName: scorer.player.name,
      assistName: assister && assister.player.name !== scorer.player.name
        ? assister.player.name
        : undefined,
    })
  }

  for (let i = 0; i < goalsAgainst; i++) {
    const minute = Math.min(90, Math.floor(sr(seed, matchIdx, 80 + i) * 90) + 1)
    events.push({ minute, type: 'conceded' })
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
  // Sudden death if tied
  if (gf === ga) {
    if (sr(seed, matchIdx, 220) > 0.5) gf++
    else ga++
  }
  return { goalsFor: gf, goalsAgainst: ga }
}

// ─── Opponents ────────────────────────────────────────────────────────────────

const OPPONENTS = [
  { name: 'Polônia',    flag: '🇵🇱', year: 1974, phase: 'Grupos',    rating: 76 },
  { name: 'Camarões',   flag: '🇨🇲', year: 1990, phase: 'Grupos',    rating: 78 },
  { name: 'Bélgica',    flag: '🇧🇪', year: 2018, phase: 'Grupos',    rating: 80 },
  { name: 'Uruguai',    flag: '🇺🇾', year: 1970, phase: 'Oitavas',   rating: 84 },
  { name: 'Argentina',  flag: '🇦🇷', year: 1978, phase: 'Quartas',   rating: 87 },
  { name: 'Holanda',    flag: '🇳🇱', year: 1974, phase: 'Semifinal', rating: 90 },
  { name: 'Brasil',     flag: '🇧🇷', year: 1970, phase: 'Final',     rating: 93 },
]

// ─── Copa simulation ──────────────────────────────────────────────────────────

export function simulateCopa(state: GameState): MatchResult[] {
  const overall = computeOverall(state.picks, state.style)
  const results: MatchResult[] = []
  let groupLosses = 0

  for (let i = 0; i < OPPONENTS.length; i++) {
    const opp = OPPONENTS[i]
    const isKnockout = i >= 3
    const isGroup = !isKnockout

    const match = simulateMatch(overall, opp.rating, state.picks, state.seed, i)

    let won = match.goalsFor > match.goalsAgainst
    let penalties: { goalsFor: number; goalsAgainst: number } | undefined

    if (match.goalsFor === match.goalsAgainst) {
      if (isGroup) {
        // Draw in groups = 1 point, not a loss
        won = true
      } else {
        // Knockout draw → penalty shootout
        penalties = simulatePenalties(state.seed, i + 100)
        won = penalties.goalsFor > penalties.goalsAgainst
      }
    }

    if (isGroup && match.goalsFor < match.goalsAgainst) groupLosses++

    results.push({
      opponent: opp.name,
      opponentFlag: opp.flag,
      opponentYear: opp.year,
      goalsFor: match.goalsFor,
      goalsAgainst: match.goalsAgainst,
      events: match.events,
      phase: opp.phase,
      won,
      penalties,
    })

    // Eliminated: 2+ group losses OR knockout loss
    if (isGroup && groupLosses >= 2) break
    if (isKnockout && !won) break
  }

  return results
}
