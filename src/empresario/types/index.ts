export type Screen =
  | 'intro'
  | 'accident'
  | 'dashboard'
  | 'scouts'
  | 'clients'
  | 'offers'
  | 'finance'
  | 'negotiate'

export type Position = 'ATA' | 'MEI' | 'ZAG' | 'LAT' | 'GOL'
export type Personality = 'leal' | 'ambicioso' | 'difícil' | 'humilde'
export type Nationality = 'BR' | 'AR' | 'FR' | 'IT' | 'PT' | 'ES' | 'NL' | 'DE'

export interface Legend {
  id: string
  name: string
  nickname: string
  position: Position
  nationality: Nationality
  birthYear: number
  emergenceYear: number   // when they turn pro / become signable
  peakYearStart: number
  peakYearEnd: number
  truePotential: number   // 85–99, only YOU see this
  currentRating: number   // starts low, grows each year
  personality: Personality
  signingFee: number      // cost to sign representation contract
  monthlyFee: number      // what you pay them to be their agent
  futureKnowledge: string // a fact only you know from the future
  club: string            // current club in that year
}

export interface Client {
  legendId: string
  name: string
  nickname: string
  position: Position
  nationality: Nationality
  birthYear: number
  peakYearStart: number
  peakYearEnd: number
  truePotential: number
  currentRating: number
  personality: Personality
  monthlyFee: number
  futureKnowledge: string
  commissionRate: number  // % you negotiated (5–30)
  happiness: number       // 0–100
  currentValue: number    // market value in R$
  signedYear: number
  contractClub: string | null
  contractSalary: number
  contractExpiresYear: number | null
  rivalOffers: number     // how many rival agents approached them
}

export interface ClubOffer {
  id: string
  clubName: string
  clubCountry: string
  clientId: string
  offerAmount: number     // transfer fee
  salary: number          // annual salary to player
  contractYears: number
  expiresInWeeks: number  // offer expires after X weeks
}

export interface RivalAgent {
  id: string
  name: string
  budget: number
  reputation: number
  clients: string[]       // legend IDs they represent
}

export interface GameEvent {
  id: string
  week: number
  year: number
  type: 'injury' | 'scandal' | 'breakout' | 'offer' | 'rival' | 'press' | 'personal'
  title: string
  description: string
  clientId?: string
  choices?: [
    { label: string; effect: EventEffect },
    { label: string; effect: EventEffect }
  ]
  resolved?: boolean
  chosenIndex?: 0 | 1
}

export interface EventEffect {
  money?: number
  happiness?: number
  reputation?: number
  clientValue?: number
  narrative?: string
}

export interface OfficeUpgrade {
  id: string
  name: string
  description: string
  cost: number
  effect: string
  purchased: boolean
}

export interface GameState {
  screen: Screen
  year: number
  week: number            // 1–52
  money: number
  reputation: number      // 0–100, affects ability to sign players
  clients: Client[]
  pendingOffers: ClubOffer[]
  events: GameEvent[]
  officeLevel: number     // 1–5
  scoutSlots: number      // how many players you can investigate per week
  actionSlots: number     // actions per week (sign, negotiate, meet)
  actionsUsed: number
  weeklyExpenses: number  // sum of client monthly fees
  totalEarned: number
  totalDeals: number
  rivalAgents: RivalAgent[]
  seenLegendIds: string[] // legends you've already scouted
  purchasedUpgrades: string[]
  narrative: string[]     // log of key moments
}
