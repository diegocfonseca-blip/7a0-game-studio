// 23/11: visual aprovado para todos nas competições online compatíveis.
// Reversão da apresentação: false. Mantém a leitura dos planos já confirmados.
export const FOOTBALL_MATCH_PILOT_ENABLED = true

export function footballMatchPilotEmail(_email?: string | null) {
  return FOOTBALL_MATCH_PILOT_ENABLED
}

export type FootballMatchPilotScope = {
  sport?: string; onlineMode?: string; screen?: string
  careerOnline?: boolean; careerIntent?: boolean; co2?: unknown; pokeLiga?: unknown
  ligaDraft?:boolean;minhaLigaDraft?:boolean
  copaSala?:boolean // 🌍 28/11: sala criada SÓ pra Copa do Mundo (convocando) — a transmissão dela também ganha o visual novo
}
export function footballMatchPilotScope(state: FootballMatchPilotScope) {
  if (state.copaSala) return state.sport !== 'basquete'
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
