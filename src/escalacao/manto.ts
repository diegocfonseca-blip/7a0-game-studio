// 🎽 MANTO DO CORAÇÃO (beta em produção, entrega manual — aprovado pelo Diego
// 09/08, arte manto-real.png): a fichinha branca do campinho FICA como é (nome
// legível) — o coração entra como FAIXINHA LISTRADA no topo de cada fichinha e
// na barrinha de título do campinho, nas cores do clube que o dono torce.
// ⚠️ Nome/escudo de clube REAL nunca aparece (marca registrada): só as CORES.
// Por enquanto a lista vive aqui no código (contas liberadas à mão); depois
// migra pro painel admin junto dos outros mimos do sócio.
import { loggedEmail } from './apoio'

// conta → [cor1, cor2] das listras do coração
export const MANTO_CONTAS: Record<string, [string, string]> = {
  'diego.c.fonseca@gmail.com': ['#C2452F', '#141414'], // ❤️🖤 vermelho e preto
}

// manto da conta logada NESTE aparelho — null pra quem não tem (99,9% hoje).
// Só decora o PRÓPRIO time de quem vê: nunca sincroniza, nunca muda o online
// dos outros (cada um vê o manto que É seu).
export function meuManto(): [string, string] | null {
  const em = loggedEmail()
  return em ? (MANTO_CONTAS[em] ?? null) : null
}

// listras verticais (padrão camisa) pra usar como background
export const mantoStripes = (c: [string, string], w = 9) =>
  `repeating-linear-gradient(90deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px)`
