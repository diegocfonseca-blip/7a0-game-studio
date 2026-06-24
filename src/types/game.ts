export interface WeekEvent {
  text: string
  type: 'treino' | 'lenda' | 'clube' | 'suspeita' | 'mundo' | 'traço'
}

export type Country =
  | 'Brasil' | 'Argentina' | 'Portugal' | 'França'
  | 'Inglaterra' | 'Itália' | 'Espanha' | 'Alemanha' | 'Holanda'

export type Position = 'Atacante' | 'Meia' | 'Lateral' | 'Zagueiro' | 'Goleiro'

export type TraitMood = '🔥' | '😊' | '😰' | '😴' | '😤'

export type LegendStatus = 'available' | 'urgent' | 'locked' | 'closed'

export type Region = 'brasil' | 'americas' | 'europa-sul' | 'europa-norte' | 'europa-oeste'

export interface Trait {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  weeklyMaintenance: number
  conflictsWith?: string[]
}

export interface Legend {
  id: string
  name: string
  nickname: string
  birthYear: number
  country: string
  countryFlag: string
  city: string
  region: Region
  story: string
  historicalNote: string
  unlockYear: number
  closeYear: number
  traits: Trait[]
  position: Position
  colorAccent: string
}

export interface StolenTrait {
  legendId: string
  legendName: string
  legendNickname: string
  traitId: string
  traitName: string
  traitIcon: string
  maintenanceBar: number
  mood: TraitMood
  stolenYear: number
  weeklyMaintenance: number
}

export type GameScreen =
  | 'intro'
  | 'creation'
  | 'onboarding'
  | 'map'
  | 'maintenance'
  | 'steal-mission'
  | 'match'
  | 'market'

export type MatchType = 'racha' | 'amistoso' | 'decisiva'

export interface GameEvent {
  id: string
  title: string
  text: string
  type: 'positive' | 'negative' | 'neutral' | 'consequence'
  effect?: {
    coins?: number
    reputation?: number
    traitBoostId?: string
    traitDrainAmount?: number
  }
}

export interface MissionChoice {
  phase: number
  choiceIndex: number
  score: number
}

export interface ActiveMission {
  legendId: string
  traitId: string
  phase: number
  choices: MissionChoice[]
  completed: boolean
  success: boolean
}

export interface NarrationMoment {
  minute: number
  type: 'goal' | 'miss' | 'skill' | 'opponent-goal' | 'pressure'
  text: string
  isHighlight: boolean
  scoreDelta: number
  traitUsed?: string
}

export interface ActiveMatch {
  opponentName: string
  opponentFlag: string
  opponentStrength: number
  momentIndex: number
  phase: 'intro' | 'narration' | 'result'
  moments: NarrationMoment[]
  goals: number
  goalsAgainst: number
  matchType: MatchType
}

export interface LeagueTeam {
  id: string
  name: string
  strength: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export interface GameState {
  screen: GameScreen
  player: {
    name: string
    country: Country
    city: string
    faceIndex: number
    position: Position
  } | null
  currentYear: number
  coins: number
  reputation: number
  stolenTraits: StolenTrait[]
  currentClub: string
  clubLevel: 1 | 2 | 3
  selectedLegendId: string | null
  selectedTraitId: string | null
  activeMission: ActiveMission | null
  activeMatch: ActiveMatch | null
  titles: string[]
  stolenFrom: string[]
  league: LeagueTeam[] | null
  leagueRound: number
  recentForm: ('W' | 'D' | 'L')[]
  matchesPlayed: number
  seasonWins: number
  seasonDraws: number
  seasonLosses: number
  pendingEvents: GameEvent[]
  pendingMatchType: MatchType
  purchasedItems: string[]
  nextMatchMult: number
  seasonWeek: number
  weekEvents: WeekEvent[]
  matchDayActive: boolean
  seasonComplete: boolean
}
