export type Atributo = 'velocidade' | 'drible' | 'finalizacao' | 'titulos' | 'lendario'

export interface STCard {
  id: string
  nome: string
  apelido: string
  pais: string   // flag emoji
  icon: string   // personality emoji
  tier: 'deus' | 'lenda' | 'craque'
  atributos: Record<Atributo, number>
}

export interface STPlayer {
  id: string
  nome: string
  deck: string[]      // card IDs, index 0 = top
  isCPU: boolean
  isEliminated: boolean
}

export type STPhase = 'choose' | 'cpu_thinking' | 'revealing' | 'gameover'

export interface STState {
  screen: 'menu' | 'setup' | 'playing'
  players: STPlayer[]
  activePlayerIdx: number
  phase: STPhase
  chosenAttr: Atributo | null
  roundCards: Array<{ playerId: string; cardId: string }>
  warPile: string[]       // card IDs accumulated during ties
  roundWinnerId: string | null
  isWar: boolean
  gameWinnerId: string | null
  roundNum: number
}

export type STAction =
  | { type: 'START_GAME'; humanName: string; cpuCount: number }
  | { type: 'PICK_ATTR'; attr: Atributo }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESTART' }
