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
  | 'map'
  | 'maintenance'
  | 'steal-mission'

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
  selectedLegendId: string | null
  selectedTraitId: string | null
  activeMission: ActiveMission | null
  titles: string[]
  stolenFrom: string[]
}
