// 22/11: revisão aprovada: agora exclusivamente a conta principal de Diego.
// Reversão global do experimento: false. Nenhuma permissão de dados depende disto.
export const FOOTBALL_MATCH_PILOT_ENABLED = true
const ACCOUNTS = new Set(['diego.c.fonseca@gmail.com'])

export function footballMatchPilotEmail(email?: string | null) {
  return FOOTBALL_MATCH_PILOT_ENABLED && ACCOUNTS.has((email ?? '').trim().toLowerCase())
}

export type FootballMatchPilotScope = {
  sport?: string; onlineMode?: string; screen?: string
  careerOnline?: boolean; careerIntent?: boolean; co2?: unknown; pokeLiga?: unknown
}
export function footballMatchPilotScope(state: FootballMatchPilotScope) {
  return state.sport !== 'basquete' && state.onlineMode === 'online'
    && !state.careerOnline && !state.careerIntent && !state.co2 && !state.pokeLiga
    && !!state.screen && ['season', 'liberta', 'champions'].includes(state.screen)
}
