import type { Position, Nationality } from '../empresario/types'

export type DraftScreen = 'intro' | 'pickClub' | 'hub' | 'draft' | 'lineup'
export type Tactic = 'retranca' | 'equilibrio' | 'ataque'

// A roster player — either a generated "unknown" or a real legend from the DB.
export interface DraftPlayer {
  id: string
  name: string
  pos: Position
  rating: number          // for legends: getCurrentRating(year) + devBonus
  legendId?: string       // set when this is a legend from the shared DB
  nationality?: Nationality
  potential?: number      // truePotential — only YOU and your friends can see it
  devBonus?: number       // permanent growth earned by getting minutes (jovem que joga cresce)
}

export interface Manager {
  id: string
  name: string
  isYou: boolean
  clubName: string
  clubCity: string
  squad: DraftPlayer[]
  lineupIds: string[]     // the 11 starters you picked
  tactic: Tactic
  // standings
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  lastResult: string
}

export interface DraftState {
  screen: DraftScreen
  started: boolean
  year: number
  week: number
  season: number
  division: number          // 4 = start, 1 = elite
  round: number             // matchday within the season
  roundsPerSeason: number
  managers: Manager[]
  youIndex: number
  ownedLegendIds: string[]  // a legend, once drafted, is gone for everyone (unique!)
  rosterMax: number
  // ── draft phase ──
  inDraft: boolean
  draftKind: 'initial' | 'season'
  draftOrder: number[]      // manager indices for the current pass
  draftPos: number          // pointer into draftOrder
  draftRoundsLeft: number   // how many full passes remain in this draft
  pendingDrop: boolean      // your squad is full — you must drop before picking
  lastPickText: string[]
  narrative: string[]
}
