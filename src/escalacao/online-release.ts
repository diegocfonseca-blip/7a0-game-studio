// Liberação aprovada: somente futebol online, nunca carreira ou leilão.
// Chave de apresentação; não concede permissões de host nem acesso a dados.
export const ONLINE_VISUAL_RELEASED = true
// 🔁 26/10 (Diego: *"troque no partida rápida também, óbvio"*): a Partida Rápida OFFLINE ganha o MESMO placar das salas
// (rádio com os jogadores, pisca do gol, controle de ritmo e tela final) — é o que a conta dele já via offline. Antes isto
// exigia `onlineMode === 'online'`. A carreira continua de fora (tem a chave dela).
export function publicOnlineVisual(state: { onlineMode?: string; careerOnline?: boolean; sport?: string }) {
  return ONLINE_VISUAL_RELEASED && !state.careerOnline && state.sport !== 'basquete'
}
