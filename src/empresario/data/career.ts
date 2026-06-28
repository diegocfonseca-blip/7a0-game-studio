import type { GameState } from '../types'

export const WORLD_CUP_YEARS = [1994, 1998, 2002, 2006, 2010]

// ─── TRANSFER WINDOW ───────────────────────────────────────────
// Offers arrive all year — but during the window the market HEATS UP:
// more clubs come knocking and the bids fly. It's an opportunity, not a gate.
export function isTransferWindow(week: number): boolean {
  return (week >= 1 && week <= 10) || (week >= 27 && week <= 34)
}
export function windowInfo(week: number): { open: boolean; weeks: number } {
  if (isTransferWindow(week)) {
    const end = week <= 10 ? 10 : 34
    return { open: true, weeks: end - week + 1 }
  }
  if (week < 27) return { open: false, weeks: 27 - week }
  return { open: false, weeks: (52 - week) + 1 }
}

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

// ─── DESAFIOS COM RECOMPENSA ───────────────────────────────────
// A ladder of bite-sized goals. Each one you complete pays out cash + a
// reputation bump when you claim it. No punishment — pure upside that keeps
// pulling you toward the next milestone.
export interface Challenge {
  id: string
  title: string
  desc: string
  reward: number          // R$ paid on claim
  repReward: number       // reputation gained on claim
  done: (s: GameState) => boolean
}

export const CHALLENGES: Challenge[] = [
  { id: 'c-sign', title: 'O primeiro aperto de mão', desc: 'Agencie seu primeiro jogador.', reward: 6_000, repReward: 4,
    done: s => s.clients.length >= 1 },
  { id: 'c-deal', title: 'Primeira comissão', desc: 'Feche sua primeira transferência.', reward: 12_000, repReward: 5,
    done: s => s.totalDeals >= 1 },
  { id: 'c-gem', title: 'Olho clínico', desc: 'Tenha um jogador de potencial 90+ na sua carteira.', reward: 18_000, repReward: 6,
    done: s => s.clients.some(c => c.truePotential >= 90) },
  { id: 'c-three', title: 'Montando o casting', desc: 'Tenha 3 jogadores ao mesmo tempo.', reward: 25_000, repReward: 6,
    done: s => s.clients.length >= 3 },
  { id: 'c-deal5', title: 'Faro pra negócio', desc: 'Feche 5 transferências.', reward: 45_000, repReward: 7,
    done: s => s.totalDeals >= 5 },
  { id: 'c-m1', title: 'O primeiro milhão', desc: 'Acumule R$ 1 milhão em caixa.', reward: 80_000, repReward: 8,
    done: s => s.money >= 1_000_000 },
  { id: 'c-five', title: 'Império de talentos', desc: 'Tenha 5 jogadores na carteira ao mesmo tempo.', reward: 100_000, repReward: 8,
    done: s => s.clients.length >= 5 },
  { id: 'c-deal15', title: 'Tubarão do mercado', desc: 'Feche 15 transferências.', reward: 150_000, repReward: 9,
    done: s => s.totalDeals >= 15 },
  { id: 'c-club', title: 'Dono da bola', desc: 'Compre seu próprio clube de futebol.', reward: 200_000, repReward: 10,
    done: s => !!s.ownedClub },
  { id: 'c-gems', title: 'Coleção de fenômenos', desc: 'Tenha 3 fenômenos (potencial 95+) na carteira.', reward: 300_000, repReward: 12,
    done: s => s.clients.filter(c => c.truePotential >= 95).length >= 3 },
  { id: 'c-m10', title: 'Magnata do futebol', desc: 'Acumule R$ 10 milhões em caixa.', reward: 500_000, repReward: 12,
    done: s => s.money >= 10_000_000 },
  { id: 'c-award', title: 'O melhor do mundo', desc: 'Seja eleito Empresário do Ano.', reward: 750_000, repReward: 15,
    done: s => s.awards >= 1 },
  { id: 'c-m100', title: 'Lenda dos bastidores', desc: 'Construa um patrimônio de R$ 100 milhões.', reward: 2_000_000, repReward: 20,
    done: s => s.money >= 100_000_000 },
]

// your net worth for the ranking = cash + your stake in the players' values
export function yourNetWorth(s: GameState): number {
  const stake = s.clients.reduce((sum, c) => sum + c.currentValue * (c.commissionRate / 100), 0)
  const club = s.ownedClub ? s.ownedClub.fans * 200 : 0
  return Math.round(s.money + stake + club)
}
