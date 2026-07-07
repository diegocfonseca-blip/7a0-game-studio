// ─── A ESCALAÇÃO — leilão cego por setor + temporada de 38 rodadas ───

export type Sector = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
export const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
export const SECTOR_LABEL: Record<Sector, string> = {
  GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque',
}

// fama é interna: guia a CPU e a curadoria do baralho. Nunca é exibida.
// 5=lenda eterna · 4=craque · 3=bom de bola · 2=quase lenda (clutch) · 1=incógnita
export type Fame = 1 | 2 | 3 | 4 | 5

export interface Card {
  id: string
  name: string
  club: string
  year: number
  pos: Sector
  fame: Fame
  lo: number // faixa de nível — oculta até a Cerimônia da Revelação
  hi: number
}

export type Acquisition = 'leilao' | 'repescagem' | 'monte'

export interface WonCard extends Card {
  paid: number
  via: Acquisition
}

export type FormationKey = '4-3-3' | '4-4-2' | '3-5-2' | '4-5-1'

export const FORMATIONS: Record<FormationKey, Record<Sector, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
  '3-5-2': { GOL: 1, LAT: 2, ZAG: 3, MEI: 3, ATA: 2 },
  '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
}

export type Tactic = 'retranca' | 'equilibrio' | 'ataque'

export interface Manager {
  id: number
  name: string
  teamName: string
  isHuman: boolean
  formation: FormationKey
  money: number
  squad: WonCard[]
  // arquétipo da CPU
  aggression: number // 0..1 — quanto gasta cedo
  starHunger: number // 0..1 — quanto concentra em figurões
}

export interface Bid {
  mgr: number
  amount: number
}

// resultado da disputa de uma carta, pronto pra revelação dramática
export interface ResolvedCard {
  card: Card
  bids: Bid[] // ordenado desc
  winner: number | null // manager id ou null (sem lance → Monte)
  paid: number
  voided: number[] // managers cujo lance foi anulado (setor já cheio)
}

export type AuctionPhase = 'envelope' | 'reveal' | 'resq_envelope' | 'resq_reveal'

export interface LeagueTeam {
  id: number // 0..19 — managers usam o mesmo id; clubes clássicos vêm depois
  name: string
  isManager: boolean
  // clubes clássicos têm força fixa por setor; managers calculam por partida
  baseAtk: number
  baseDef: number
  pts: number; w: number; d: number; l: number; gf: number; ga: number
}

export interface MatchHighlight {
  min: number
  text: string
}

export interface MatchResult {
  homeId: number
  awayId: number
  hg: number
  ag: number
  highlights: MatchHighlight[] // só preenchido no jogo do humano
}

export interface ScorerRow {
  name: string
  teamId: number
  teamName: string
  goals: number
}

export type Screen =
  | 'intro'
  | 'lobby'
  | 'setup'
  | 'auction'
  | 'monte'
  | 'cerimonia'
  | 'season'
  | 'end'

export type OnlineMode = 'cpu' | 'online'

export interface EscState {
  screen: Screen
  seed: number
  // online
  onlineMode: OnlineMode
  roomId: string
  roomCode: string
  isHost: boolean
  humanCount: number
  submitted: number[]          // ids de técnicos que lacraram o envelope nesta fase
  pendingEnvelopes: Record<number, { cardId: string; amount: number }[]> // host-only (não vaza no broadcast)
  presence: number[]           // ids online (presence do canal)
  // sala
  managers: Manager[]
  youIdx: number
  // leilão
  sectorIdx: number // 0..4 dentro de SECTORS
  deck: Record<Sector, Card[]>
  phase: AuctionPhase
  currentCards: Card[] // cartas em disputa nesta fase
  revealQueue: ResolvedCard[] // ordenado por pote crescente
  revealIdx: number
  stock: Record<Sector, number> // estoque restante no baralho (contador vivo)
  // monte final
  monte: Card[]
  monteOrder: number[] // sequência serpente de manager ids
  monteIdx: number
  // temporada
  league: LeagueTeam[]
  fixtures: [number, number][][] // 38 rodadas de pares [home, away]
  round: number // 0-based; 38 = fim
  tactics: Record<number, Tactic> // tática por técnico (cada humano define a sua)
  lastResults: MatchResult[] // resultados da última rodada simulada
  news: string[] // manchetes (dias inspirados etc.)
  champion: number | null
  phaseDeadline: number | null // timestamp (ms) do fim do envelope
  monteDeadline: number | null // timestamp (ms) do fim da vez atual no Monte (online)
  scorers: ScorerRow[] // artilharia acumulada da temporada
}
