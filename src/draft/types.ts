import type { Position, Nationality } from '../empresario/types'

export type DraftScreen = 'lobby' | 'intro' | 'pickClub' | 'hub' | 'draft' | 'lineup' | 'table' | 'match' | 'leilao'
export type Tactic = 'retranca' | 'equilibrio' | 'ataque'
export type GameMode = 'draft' | 'leilao' | 'draft_leilao'
export type OnlineMode = 'cpu' | 'online'

export interface DraftPlayer {
  id: string
  name: string
  pos: Position
  rating: number
  legendId?: string
  nationality?: Nationality
  potential?: number
  devBonus?: number
}

export interface LeagueTeam {
  id: string
  name: string
  city: string
  division: number
  isHuman: boolean
  humanIndex?: number
  strength: number
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  lastResult: string
}

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

export interface MatchEvent {
  min: number
  text: string
  gfAfter: number
  gaAfter: number
}

export interface LiveMatch {
  oppTeamId: string
  oppName: string
  oppStrength: number
  minute: number
  gf: number
  ga: number
  events: string[]
  allEvents: MatchEvent[]
  half: 1 | 2 | 'ht' | 'ft'
  division: number
  subDone: boolean
}

export interface DraftState {
  screen: DraftScreen
  started: boolean
  mode: GameMode
  onlineMode: OnlineMode
  roomId: string
  roomCode: string
  isHost: boolean
  totalPlayers: number
  playerNames: string[]
  year: number
  season: number
  round: number
  roundsPerSeason: number
  windowEvery: number
  teams: LeagueTeam[]
  humans: Manager[]
  youIndex: number
  ownedLegendIds: string[]
  rosterMax: number
  live: LiveMatch | null
  // ── draft window ──
  inDraft: boolean
  draftOrder: number[]
  draftPos: number
  pendingDrop: boolean
  lastPickText: string[]
  narrative: string[]
  // ── leilão window ──
  leilaoItems: string[]
  leilaoIndex: number
  leilaoBids: number[]
  leilaoPhase: 'bid' | 'reveal' | 'done'
}
