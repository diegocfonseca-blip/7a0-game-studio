export type Screen =
  | 'lobby'
  | 'intro'
  | 'accident'
  | 'dashboard'
  | 'scouts'
  | 'clients'
  | 'offers'
  | 'finance'
  | 'negotiate'
  | 'ranking'
  | 'album'
  | 'end'

export type Position = 'ATA' | 'MEI' | 'ZAG' | 'LAT' | 'GOL'
export type Personality = 'leal' | 'ambicioso' | 'difícil' | 'humilde'
export type Nationality =
  | 'BR' | 'AR' | 'FR' | 'IT' | 'PT' | 'ES' | 'NL' | 'DE' | 'EN'
  | 'DK' | 'SE' | 'BG' | 'HR' | 'YU' | 'RO' | 'CZ' | 'UA'
  | 'NG' | 'LR' | 'CM' | 'CO' | 'CL' | 'IE'
  | 'BE' | 'PL' | 'EG' | 'SN' | 'KR' | 'UY'
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
  repContractYears?: number // length of YOUR representation deal
  repExpiresYear?: number   // year your representation deal runs out
  happiness: number       // 0–100
  currentValue: number    // market value in R$
  signedYear: number
  signedAbsWeek?: number    // absolute week (year*52+week) when you signed — measures how long you've been caring
  contractClub: string | null
  contractSalary: number
  contractExpiresYear: number | null
  rivalOffers: number     // how many rival agents approached them
  lastDealYear?: number   // year of last transfer — clubs leave them alone for a while
  showcaseMult?: number   // value multiplier built up by playing at YOUR club (vitrine)
  loanReturnYear?: number // if on loan to your club, the year he goes back
  loanOriginClub?: string // the club he came from on loan
  injuredUntilWeek?: number  // absolute week (year*52+week) when injury ends
  injuryLevel?: 'leve' | 'moderada' | 'grave'
  injuryDescription?: string
}

export interface Bid {
  clubName: string
  clubCountry: string
  amount: number          // transfer fee this club offers
  luva: number            // kickback this club pays YOU to grease the deal
}

export interface ClubOffer {
  id: string
  clubName: string
  clubCountry: string
  clientId: string
  offerAmount: number     // transfer fee (the current top bid)
  clubLuva: number        // kickback the club pays YOU on top of your commission
  salary: number          // annual salary to player
  contractYears: number
  expiresInWeeks: number  // offer expires after X weeks
  interest: 'alto' | 'medio' | 'baixo' // market heat — hints if more may come
  isWar?: boolean         // bidding war between multiple clubs
  bidders?: Bid[]         // the competing clubs and their bids
  escalations?: number    // how many times you've pushed for a higher bid
  haggles?: number        // how many times you've haggled the fee on a single offer
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

export interface LeagueTeam {
  name: string
  points: number
  played: number
  isYou?: boolean
}

export type ClubTactic = 'retranca' | 'equilibrio' | 'ataque'

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
  table: LeagueTeam[]      // full league standings
  stadiumLevel: number    // 1–5 — bigger stadium = more fans growth + match income
  academyLevel: number    // 1–5 — base/CT = develops your placed jewels faster
  tactic: ClubTactic      // matchday posture
  trophies: string[]      // titles won (league, cup)
  cupRound: number        // current cup run (0 = out)
  rivalName: string       // your derby rival
}

export interface RivalAgent {
  id: string
  name: string
  budget: number
  reputation: number
  clients: string[]       // legend IDs they represent
  wealth: number          // net worth for the agent ranking
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

export type OnlineGameMode = 'draft' | 'leilao' | 'draft-leilao'

export interface OnlinePlayer {
  playerIndex: number
  playerName: string
  money: number
  totalDeals: number
}

export interface OnlineNewsItem {
  id: string
  playerIndex: number
  playerName: string
  text: string
  timestamp: number
}

export interface OnlineClientInfo {
  legendId: string
  nickname: string
  position: Position
  nationality: Nationality
  currentRating: number
  commissionRate: number
  repExpiresYear?: number
  contractClub: string | null
}

export interface AuctionState {
  legendId: string
  bids: Record<number, number>  // playerIndex → bid amount (0 = human, 1+ = CPU rivals)
  endsAt: number                // Date.now() ms when auction closes
  closed: boolean
  sellerIndex?: number          // set when selling a rep contract (not a market legend)
  cpuBidderRivalIndices?: number[] // indices into rivalAgents for CPU mode (parallel to bids 1, 2, 3…)
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
  suspicion: number       // 0–100 — how dirty your dealings look
  clubRelations: Record<string, number> // club name → relationship (-100..100)
  awards: number          // times you won Empresário do Ano
  challengeIndex: number  // how far you've climbed the rewards challenge ladder
  xp: number              // agent experience — drives your level
  saleStreak: number      // current combo of consecutive deals
  bestStreak: number      // your best combo ever
  lastDealAbsWeek: number // absolute week (year*52+week) of your last deal
  everSignedIds: string[] // every legend you EVER signed (for the album's gold cards)
  hotTargets: Record<string, number> // legendId → deadline (abs week) before a rival grabs them
  weeklyMissionId: string | null     // current weekly mission
  weeklyMissionBaseline: number      // metric snapshot at the start of this week
  weeklyMissionClaimed: boolean      // already claimed this week's reward?
  narrative: string[]     // log of key moments
  // ── online ──
  onlineMode: 'cpu' | 'online'
  roomCode: string
  isHost: boolean
  playerNames: string[]
  youIndex: number
  onlineGameMode: OnlineGameMode | null
  draftTurn: number         // playerIndex whose turn it is to sign
  draftPicksDone: number    // total picks done (drives snake order)
  draftWindowActive: boolean // week advance blocked while draft/leilão window is open
  currentAuction: AuctionState | null
  onlineTakenLegends: Record<string, { playerIndex: number; playerName: string }>
  onlinePlayers: OnlinePlayer[]
  onlinePresence: number[]
  onlineNews: OnlineNewsItem[]
  onlinePlayerRosters: Record<number, OnlineClientInfo[]>
}
