export type Raridade = 'comum' | 'epica' | 'mitica'
export type QuestionKey = 'gols' | 'titulos' | 'altura' | 'assists' | 'jogos'
export type HScreen = 'menu' | 'game' | 'reveal' | 'results' | 'museu'

export interface AtributosOcultos {
  gols?: number       // gols na temporada/copa do ano
  titulos?: number    // títulos na carreira até o ano
  altura?: number     // altura em cm
  assists?: number    // assistências no ano
  jogos?: number      // jogos no ano
}

export interface HistCardData {
  id: string
  nome: string
  apelido: string
  ano: number
  nascimento: number  // ano de nascimento
  flag: string        // emoji de bandeira
  raridade: Raridade
  posicao: string
  clube: string       // clube em destaque no ano
  cor: string         // cor de destaque da carta
  atributos: AtributosOcultos
  perguntas: QuestionKey[]  // quais perguntas essa carta usa
}

export interface HPlayer {
  id: string
  nome: string
  isCPU: boolean
  money: number
  cartasIds: string[]
}

export interface HBid {
  playerId: string
  palpite: number
  lance: number
  timestamp: number
}

export interface HBidResult extends HBid {
  erro: number        // distância absoluta do valor real (999 = passou do valor)
  rank: number        // 1 = melhor, 4 = pior
  bonus: number       // dinheiro recebido como bônus
  ganhou: boolean     // ganhou a carta?
}

export interface HState {
  screen: HScreen
  players: HPlayer[]
  youIdx: number
  deck: string[]           // ids restantes (embaralhados)
  currentCardId: string | null
  currentQuestion: QuestionKey | null
  phase: 'bidding' | 'revealing'
  bids: HBid[]
  results: HBidResult[]
  round: number
  totalRounds: number
  museuCards: string[]     // cartas já coletadas pelo jogador (persistência leve)
}
