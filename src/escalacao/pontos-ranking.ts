// 🏅 RANKING POR PONTOS (04/11, Diego: *"campeão da liga e da copa nesse modo [10 times] ganhará apenas 1 ponto… com 20
// times na liga ganha 2 pontos… mata-mata Relâmpago também vale 1 ponto"*). Antes o ranking (semana, clã, medalhas, perfil,
// amigos) somava TÍTULOS; agora soma o PESO de cada título. A régua mora no BANCO (`game_champions.peso`, preenchido por
// gatilho lendo a sala na hora de gravar — migration 20261104120000_ranking_pontos.sql); aqui é só o espelho pra tela/testes.
// Títulos antigos = 2 (todos foram em liga de 20). O PERFIL continua mostrando a coleção de TAÇAS (contagem, não pontos).
export const PESO_TITULO_PADRAO = 2
export const PESO_TITULO_LEVE = 1 // liga de 10 times (e o que vem depois dela na mesma sala) · ⚡ Relâmpago

/** o peso de um título pela sala onde foi ganho (mesma regra do gatilho `esc_titulo_peso_`) */
export function pesoDoTitulo(sala: { tamanhoLiga?: number | string | null; copaMode?: string | null } | null | undefined): 1 | 2 {
  if (!sala) return PESO_TITULO_PADRAO
  return String(sala.tamanhoLiga) === '10' || sala.copaMode === 'relampago' ? PESO_TITULO_LEVE : PESO_TITULO_PADRAO
}

/** "1 pt" / "5 pts" — igual em PT e EN */
export const ptsTxt = (n: number): string => `${n} ${n === 1 ? 'pt' : 'pts'}`
