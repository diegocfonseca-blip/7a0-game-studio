// Liberação aprovada: somente futebol online, nunca carreira ou leilão.
// Chave de apresentação; não concede permissões de host nem acesso a dados.
export const ONLINE_VISUAL_RELEASED = true
export function publicOnlineVisual(state: { onlineMode?: string; careerOnline?: boolean; sport?: string }) {
  return ONLINE_VISUAL_RELEASED && state.onlineMode === 'online' && !state.careerOnline && state.sport !== 'basquete'
}
