// 22/11: revisão aprovada para Diego principal e Futpoint, por pedido explícito.
// Reversão global do experimento: false. Nenhuma permissão de dados depende disto.
export const FOOTBALL_MATCH_PILOT_ENABLED = true
const ACCOUNTS = new Set(['diego.c.fonseca@gmail.com','gfpicolo13@gmail.com'])

export function footballMatchPilotEmail(email?: string | null) {
  return FOOTBALL_MATCH_PILOT_ENABLED && ACCOUNTS.has((email ?? '').trim().toLowerCase())
}

export type FootballMatchPilotScope = {
  sport?: string; onlineMode?: string; screen?: string
  careerOnline?: boolean; careerIntent?: boolean; co2?: unknown; pokeLiga?: unknown
  ligaDraft?:boolean;minhaLigaDraft?:boolean
}
export function footballMatchPilotScope(state: FootballMatchPilotScope) {
  return state.sport !== 'basquete' && state.onlineMode === 'online'
    && !state.careerOnline && !state.careerIntent && !state.co2 && !state.pokeLiga
    && !state.ligaDraft&&!state.minhaLigaDraft
    && !!state.screen && ['season', 'liberta', 'champions','end'].includes(state.screen)
}

/** Includes the World Cup/regional/Libertadores broadcasts opened after a league. */
export function footballMatchAdScope(state:FootballMatchPilotScope){
 return state.sport!=='basquete'&&state.onlineMode==='online'&&!state.careerOnline&&!state.careerIntent&&!state.co2&&!state.pokeLiga
  &&!!state.screen&&['season','liberta','champions','end'].includes(state.screen)
}
