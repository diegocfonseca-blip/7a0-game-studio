import type { Position, Nationality } from '../empresario/types'

export type DraftScreen = 'intro' | 'pickClub' | 'hub' | 'draft' | 'lineup' | 'table' | 'match'
export type Tactic = 'retranca' | 'equilibrio' | 'ataque'
export type GameMode = 'draft' | 'leilao' | 'draft_leilao'

export interface DraftPlayer {
  id: string
  name: string
  pos: Position
  rating: number
  legendId?: string
  nationality?: Nationality
  potential?: number      // truePotential — only humans (you + friends) can see it
  devBonus?: number       // permanent growth from getting minutes
}

// Every club in the pyramid — humans and CPU alike — has a league row.
export interface LeagueTeam {
  id: string
  name: string
  city: string
  division: number        // 1 (elite) … 4 (bottom)
  isHuman: boolean
  humanIndex?: number     // index into humans[] when isHuman
  strength: number        // CPU: fixed-ish; human: recomputed from the fielded XI
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  lastResult: string
}

// A human manager (you or an AI "friend").
export interface Manager {
  id: string
  name: string
  isYou: boolean
  teamId: string
  squad: DraftPlayer[]
  lineupIds: string[]
  tactic: Tactic
  money: number
}

// A live (Elifoot-style) match in progress — only YOUR matches are played out.
export interface LiveMatch {
  oppName: string
  oppStrength: number
  minute: number
  gf: number
  ga: number
  events: string[]        // minute-by-minute commentary
  half: 1 | 2 | 'ht' | 'ft'
  division: number
}

export interface DraftState {
  screen: DraftScreen
  started: boolean
  mode: GameMode
  year: number
  season: number
  round: number             // matchday within the season
  roundsPerSeason: number
  windowEvery: number       // a draft/auction opens every N rounds
  teams: LeagueTeam[]       // the whole 4×10 world
  humans: Manager[]
  youIndex: number
  ownedLegendIds: string[]
  rosterMax: number
  live: LiveMatch | null    // your match being played out
  // ── draft window ──
  inDraft: boolean
  draftOrder: number[]      // human indices, worst-first
  draftPos: number
  pendingDrop: boolean
  lastPickText: string[]
  narrative: string[]
}
