import type { Position, Nationality } from '../empresario/types'

export type DraftScreen = 'lobby' | 'intro' | 'pickClub' | 'hub' | 'draft' | 'lineup' | 'table' | 'match' | 'leilao' | 'ranking' | 'ending'
export type Tactic = 'retranca' | 'equilibrio' | 'ataque'
export type GameMode = 'draft' | 'leilao' | 'draft_leilao'
export type OnlineMode = 'cpu' | 'online'
export type Formation = '4-4-2' | '4-3-3' | '4-2-3-1' | '4-5-1' | '3-5-2'

export interface OtherMatchGoal {
  min: number
  isHome: boolean
}

export interface OtherMatchLive {
  homeId: string
  homeName: string
  awayId: string
  awayName: string
  division: number
  goals: OtherMatchGoal[]
  gf: number
  ga: number
}

export interface DraftPlayer {
  id: string
  name: string
  pos: Position
  rating: number
  legendId?: string
  nationality?: Nationality
  potential?: number
  devBonus?: number
  age?: number
  injury?: number      // rounds remaining injured (0 / undefined = healthy)
  yellowCards?: number // accumulated yellows this season (3 = suspended next match)
  suspended?: boolean  // serving 1-match suspension
}

export interface LeagueTeam {
  id: string
  name: string
  city: string
  division: number
  isHuman: boolean
  humanIndex?: number
  strength: number
  squad?: DraftPlayer[]
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
  formation?: Formation
  money: number
}

export interface MatchEvent {
  min: number
  text: string
  gfAfter: number
  gaAfter: number
  injuredId?: string   // player id who got injured in this event
  yellowId?: string    // player id who got a yellow in this event
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
  subsUsed: number        // substitutions used so far (max 3)
  isHome: boolean         // human team is playing at home
  injuredIds: string[]    // player ids injured this match (revealed so far)
  yellowedIds: string[]   // player ids carded this match (revealed so far)
  otherMatches: OtherMatchLive[]
}

export interface CupGame {
  homeId: string
  homeName: string
  awayId: string
  awayName: string
  homeGoals: number
  awayGoals: number
  winnerId: string
  winnerName: string
}

export interface DraftCup {
  phase: 'QF' | 'SF' | 'F' | 'done'
  entrants: string[]      // teamIds of all 8 teams
  entrantNames: Record<string, string>
  alive: string[]         // teamIds still in
  qf: CupGame[]
  sf: CupGame[]
  final?: CupGame
  humanTeamId: string
  humanOut: boolean
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
  // ── copa ──
  cup?: DraftCup
  // ── online ──
  onlinePresence?: number[]  // player indices currently connected
}
