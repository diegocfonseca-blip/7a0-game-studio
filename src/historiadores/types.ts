export type Raridade = 'comum' | 'epica' | 'mitica'
export type QuestionKey = 'gols' | 'titulos' | 'altura' | 'assists' | 'jogos'
export type HScreen = 'menu' | 'game' | 'results' | 'museu'

export interface AtributosOcultos {
  gols?: number
  titulos?: number
  altura?: number
  assists?: number
  jogos?: number
}

export interface HistCardData {
  id: string
  nome: string
  apelido: string
  ano: number
  nascimento: number
  flag: string
  raridade: Raridade
  posicao: string
  clube: string
  cor: string
  atributos: AtributosOcultos
  perguntas: QuestionKey[]
}

export interface HPlayer {
  id: string
  nome: string
  isCPU: boolean
  money: number
  cartasIds: string[]
}

// Phase 1: guess
export interface HGuess {
  playerId: string
  value: number
  timestamp: number
}

// Phase 2: blind bet on a specific guess
export interface HBet {
  playerId: string    // who is betting
  onPlayerId: string  // whose guess they are backing
  amount: number
  timestamp: number   // submission time — tiebreaker (earlier = wins)
}

// Resolved guess ranking
export interface HGuesserRank {
  playerId: string
  value: number
  over: boolean       // went over the real value
  distance: number    // absolute distance from real value
  rank: number        // 1 = best
  bonus: number       // $M bonus for this rank (0 if went over)
}

// Full round result after reveal
export interface HRoundResult {
  realValue: number
  winningGuessPlayerId: string | null
  guessRanks: HGuesserRank[]
  bets: HBet[]
  cardWinnerId: string | null
  hadTiebreak: boolean   // true when card winner decided by ms
  tiebreakMs: number     // milliseconds ahead of second place
}

export interface HState {
  screen: HScreen
  players: HPlayer[]
  youIdx: number
  deck: string[]
  currentCardId: string | null
  currentQuestion: QuestionKey | null
  phase: 'guessing' | 'betting' | 'revealing'
  guesses: HGuess[]
  bets: HBet[]
  roundResult: HRoundResult | null
  round: number
  totalRounds: number
  museuCards: string[]
}
