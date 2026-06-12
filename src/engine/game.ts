import squads from '../data/squads'
import type { Squad, Player, Position } from '../data/squads'
import type { Formation, FormationSlot } from '../data/formations'

export type GameMode = 'classic' | 'almanac'
export type GameStyle = 'defensive' | 'balanced' | 'offensive'

export interface PickedPlayer {
  player: Player
  squad: Squad
  slot: FormationSlot
  slotIndex: number
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'conceded'
  playerName?: string
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

function seededRandom(seed: string, index: number): number {
  let h = 0
  const str = seed + index
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h) / 2147483647
}

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function rollSquad(seed: string, rollIndex: number, exclude?: string[]): Squad {
  const available = squads.filter(s => !exclude?.includes(s.id))
  const idx = Math.floor(seededRandom(seed, rollIndex) * available.length)
  return available[idx]
}

export function computeOverall(picks: PickedPlayer[], style: GameStyle): number {
  if (picks.length === 0) return 0
  const avg = picks.reduce((sum, p) => sum + p.player.rating, 0) / picks.length
  const bonus = style === 'offensive' ? 2 : style === 'defensive' ? 0 : 1
  return Math.round(avg + bonus)
}

function simulateMatch(
  teamOverall: number,
  opponentOverall: number,
  picks: PickedPlayer[],
  seed: string,
  matchIdx: number
): { goalsFor: number; goalsAgainst: number; events: MatchEvent[] } {
  const r = (offset: number) => seededRandom(seed, matchIdx * 100 + offset)

  const diff = (teamOverall - opponentOverall) / 10
  const winProb = 0.5 + diff * 0.08

  const attackers = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.player.primaryPosition))
  const defenders = picks.filter(p => ['GOL', 'ZAG', 'LD', 'LE', 'VOL'].includes(p.player.primaryPosition))

  const atkAvg = attackers.length ? attackers.reduce((s, p) => s + p.player.rating, 0) / attackers.length : 75
  const defAvg = defenders.length ? defenders.reduce((s, p) => s + p.player.rating, 0) / defenders.length : 75

  const goalsFor = Math.round(Math.max(0, (atkAvg / 25) * r(1) * 3 * (winProb + 0.2)))
  const goalsAgainst = Math.round(Math.max(0, ((100 - defAvg) / 40) * r(2) * 3 * (1 - winProb + 0.2)))

  const events: MatchEvent[] = []
  const scorers = [...attackers, ...picks.filter(p => p.player.isLegend)]

  for (let i = 0; i < goalsFor; i++) {
    const minute = Math.floor(r(10 + i) * 90) + 1
    const scorer = scorers[Math.floor(r(20 + i) * scorers.length)]
    events.push({ minute, type: 'goal', playerName: scorer?.player.name || 'Jogador' })
  }
  for (let i = 0; i < goalsAgainst; i++) {
    const minute = Math.floor(r(30 + i) * 90) + 1
    events.push({ minute, type: 'conceded' })
  }
  events.sort((a, b) => a.minute - b.minute)

  return { goalsFor, goalsAgainst, events }
}

const OPPONENTS: { name: string; flag: string; year: number; phase: string; rating: number }[] = [
  { name: 'Itália', flag: '🇮🇹', year: 1938, phase: 'Grupos', rating: 78 },
  { name: 'Alemanha', flag: '🇩🇪', year: 1966, phase: 'Grupos', rating: 80 },
  { name: 'França', flag: '🇫🇷', year: 1958, phase: 'Grupos', rating: 77 },
  { name: 'Uruguai', flag: '🇺🇾', year: 1970, phase: 'Oitavas', rating: 84 },
  { name: 'Argentina', flag: '🇦🇷', year: 1978, phase: 'Oitavas', rating: 86 },
  { name: 'Holanda', flag: '🇳🇱', year: 1978, phase: 'Quartas', rating: 88 },
  { name: 'Brasil', flag: '🇧🇷', year: 1958, phase: 'Quartas', rating: 89 },
  { name: 'Espanha', flag: '🇪🇸', year: 1982, phase: 'Semifinal', rating: 91 },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', year: 1990, phase: 'Final', rating: 93 },
]

export function simulateCopa(state: GameState): MatchResult[] {
  const overall = computeOverall(state.picks, state.style)
  const phases = ['Grupos', 'Grupos', 'Grupos', 'Oitavas', 'Quartas', 'Semifinal', 'Final']
  const phaseRatings = [78, 80, 77, 84, 87, 90, 93]
  const results: MatchResult[] = []

  for (let i = 0; i < phases.length; i++) {
    const opp = OPPONENTS[i]
    const oppRating = phaseRatings[i]
    const match = simulateMatch(overall, oppRating, state.picks, state.seed, i)
    const won = match.goalsFor > match.goalsAgainst ||
      (match.goalsFor === match.goalsAgainst && i < 3)

    results.push({
      opponent: opp.name,
      opponentFlag: opp.flag,
      opponentYear: opp.year,
      goalsFor: match.goalsFor,
      goalsAgainst: match.goalsAgainst,
      events: match.events,
      phase: phases[i],
      won,
    })

    if (!won && i >= 3) break
  }

  return results
}
