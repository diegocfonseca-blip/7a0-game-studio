import type { Position, Nationality } from '../empresario/types'

export type DraftScreen = 'intro' | 'pickClub' | 'hub' | 'draft' | 'squad'

// A roster player — either a generated "unknown" or a real legend from the DB.
export interface DraftPlayer {
  id: string
  name: string
  pos: Position
  rating: number          // for legends this is recomputed each year from the curve
  legendId?: string       // set when this is a legend from the shared DB
  nationality?: Nationality
  potential?: number      // truePotential — only YOU and your friends can see it
}

export interface Manager {
  id: string
  name: string
  isYou: boolean
  clubName: string
  clubCity: string
  squad: DraftPlayer[]
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
  draftOrder: number[]      // manager indices, worst-first
  draftPos: number          // pointer into draftOrder
  pendingDrop: boolean      // your squad is full — you must drop before picking
  lastPickText: string[]    // feed of who picked whom this draft
  narrative: string[]
}
