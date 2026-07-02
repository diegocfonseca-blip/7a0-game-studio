export type Raridade = 'comum' | 'epica' | 'mitica'
export type QuestionKey =
  | 'copa_gols'      // WC goals across career
  | 'copa_jogos'     // WC matches across career
  | 'selecao_gols'   // national team goals career total
  | 'selecao_jogos'  // national team appearances career total
  | 'ballon_dor'     // Ballon d'Or wins
  | 'cl_titulos'     // Champions League / Copa dos Campeões titles
  | 'gols_carreira'  // career professional goals
  | 'titulos'        // total career titles
  | 'copas'          // World Cups participated in
  | 'altura'         // height in cm

export type HScreen = 'menu' | 'game' | 'results' | 'museu'

export interface AtributosOcultos {
  copa_gols?: number
  copa_jogos?: number
  selecao_gols?: number
  selecao_jogos?: number
  ballon_dor?: number
  cl_titulos?: number
  gols_carreira?: number
  titulos?: number
  copas?: number
  altura?: number
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
  wikiTitle?: string
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
