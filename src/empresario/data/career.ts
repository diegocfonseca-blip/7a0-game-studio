import type { GameState } from '../types'

export const WORLD_CUP_YEARS = [1994, 1998, 2002, 2006, 2010]

export interface Objective {
  id: string
  label: string
  done: (s: GameState, rank: number) => boolean
}

// rank = your position in the agent ranking (1 = best)
export const OBJECTIVES: Objective[] = [
  { id: 'first', label: 'Agenciar seu primeiro craque', done: s => s.clients.length > 0 || s.negotiationLog.some(e => e.who === 'voce') },
  { id: 'deal1', label: 'Fechar sua primeira transferência', done: s => s.totalDeals >= 1 },
  { id: 'm1', label: 'Acumular R$ 1 milhão', done: s => s.money >= 1_000_000 || s.totalEarned >= 1_000_000 },
  { id: 'five', label: 'Ter 5 clientes ao mesmo tempo', done: s => s.clients.length >= 5 },
  { id: 'deal10', label: 'Fechar 10 transferências', done: s => s.totalDeals >= 10 },
  { id: 'club', label: 'Comprar um clube de futebol', done: s => !!s.ownedClub },
  { id: 'm10', label: 'Acumular R$ 10 milhões', done: s => s.money >= 10_000_000 },
  { id: 'gems', label: 'Ter 3 fenômenos (potencial 95+) na carteira', done: s => s.clients.filter(c => c.truePotential >= 95).length >= 3 },
  { id: 'award', label: 'Ser eleito Empresário do Ano', done: s => s.awards >= 1 },
  { id: 'top', label: 'Ser o nº 1 do ranking de empresários', done: (_s, rank) => rank === 1 },
  { id: 'm100', label: 'Construir um império de R$ 100 milhões', done: s => s.money >= 100_000_000 },
]

// your net worth for the ranking = cash + your stake in the players' values
export function yourNetWorth(s: GameState): number {
  const stake = s.clients.reduce((sum, c) => sum + c.currentValue * (c.commissionRate / 100), 0)
  const club = s.ownedClub ? s.ownedClub.fans * 200 : 0
  return Math.round(s.money + stake + club)
}
