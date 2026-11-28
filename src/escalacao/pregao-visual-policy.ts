import type { EscState } from './types'

/** Liberação visual aprovada em 28/11; reversão não altera o estado do leilão. */
export const PREGAO_VISUAL_PUBLICO = true

export function usaPregaoVisualPublico(state: EscState, basquete = false): boolean {
  const pa = state.pa
  const formation = state.managers[state.youIdx]?.formation
  return PREGAO_VISUAL_PUBLICO && !!pa && !basquete && state.sport !== 'basquete'
    && !pa.vice && !state.leilaoClubes
    && formation !== 'kings' && formation !== 'pokemon'
    && !state.currentCards[0]?.pacote && !pa.m2?.card?.pacote
}
