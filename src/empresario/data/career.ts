import type { GameState } from '../types'

export const WORLD_CUP_YEARS = [1994, 1998, 2002, 2006, 2010]

// ─── DIFFICULTY ────────────────────────────────────────────────
// Tax on official commission (the luva/kickback stays off the books).
export const DEAL_TAX = 0.27

// The market only moves during transfer windows. Outside them it's quiet —
// you can't dump a declining player whenever you want, so timing matters.
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

// Running the agency costs money — and it grows with your portfolio. Big rosters
// and star clients drain your cash every week, so you can't just hoard forever.
export function agencyOverhead(clientCount: number, starCount: number): number {
  return 800 + clientCount * 250 + starCount * 600
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

// your net worth for the ranking = cash + your stake in the players' values
export function yourNetWorth(s: GameState): number {
  const stake = s.clients.reduce((sum, c) => sum + c.currentValue * (c.commissionRate / 100), 0)
  const club = s.ownedClub ? s.ownedClub.fans * 200 : 0
  return Math.round(s.money + stake + club)
}
