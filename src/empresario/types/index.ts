export type Screen =
  | 'intro'
  | 'accident'
  | 'dashboard'
  | 'scouts'
  | 'clients'
  | 'offers'
  | 'finance'
  | 'negotiate'
  | 'club'

export type Position = 'ATA' | 'MEI' | 'ZAG' | 'LAT' | 'GOL'
export type Personality = 'leal' | 'ambicioso' | 'difícil' | 'humilde'
export type Nationality = 'BR' | 'AR' | 'FR' | 'IT' | 'PT' | 'ES' | 'NL' | 'DE'
export type PlayerStatus = 'pelada' | 'base' | 'pro' | 'estrela'

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
  status: PlayerStatus     // pelada / base / pro / estrela
  signingFee: number      // cost to sign representation contract
  luva: number            // signing bonus you must pay upfront (varies a LOT)
  luvaReason: string      // creative narrative for what the luva pays for
  monthlyFee: number      // what you pay them to be their agent
  futureKnowledge: string // a fact only you know from the future
  discoveryStory: string  // where/how you find them
  club: string            // current club in that year
}

export type SigningResult = 'accept' | 'counter' | 'reject'

export interface SigningEvaluation {
  result: SigningResult
  maxAcceptable: number   // the highest commission they'd take
  reason: string
  lost?: boolean          // true when this rejection means the legend is gone forever
  fameDrible?: boolean    // rejected despite an acceptable rate, due to fame/ego
}

export interface Client {
  legendId: string
  name: string
  nickname: string
  position: Position
  nationality: Nationality
  status: PlayerStatus
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

export interface Bid {
  clubName: string
  clubCountry: string
  amount: number
}

export interface ClubOffer {
  id: string
  clubName: string
  clubCountry: string
  clientId: string
  offerAmount: number     // transfer fee (the current top bid)
  salary: number          // annual salary to player
  contractYears: number
  expiresInWeeks: number  // offer expires after X weeks
  isWar?: boolean         // bidding war between multiple clubs
  bidders?: Bid[]         // the competing clubs and their bids
  escalations?: number    // how many times you've pushed for a higher bid
}

export interface NemesisAlert {
  legendId: string
  legendNickname: string
  story: string
  isFirst: boolean
}

export interface NegotiationLogEntry {
  who: 'voce' | 'rival'
  text: string
  year: number
}

export interface OwnedClub {
  id: string
  name: string
  division: number        // 4 = worst, 1 = elite
  fans: number
  leaguePosition: number
  cashPerWeek: number
  placedClientIds: string[]
  lastResult: string      // narrative of last match
  seasonWins: number
  seasonLosses: number
  seasonDraws: number
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
  rejectionCounts: Record<string, number> // how many times each legend said no to you
  lostLegends: string[]   // legends who rejected twice — gone forever
  nemesisTaken: string[]  // legends the rival agent snatched
  nemesisShown: boolean   // whether the nemesis backstory was shown
  nemesisAlert: NemesisAlert | null // pending alert to show the player
  negotiationLog: NegotiationLogEntry[] // deals — yours and the rival's
  ownedClub: OwnedClub | null
  narrative: string[]     // log of key moments
}
