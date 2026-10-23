// ─── ⚔️ TÁTICA NA COPA DO MUNDO E NOS REGIONAIS DO ONLINE (23/10) ─────────────
//
// Diego: *"aquela tática de ofensivo, retranca e equilíbrio não está aparecendo em várias coisas como mundo, regionais…
// no online.. coloque"* → *"sim pode fazer"*.
//
// Essas duas copas são calculadas em CADA aparelho pela ficha + semente (é o que garante que a sala inteira vê a mesma
// Copa). A tática entra sem rachar a sala por três regras:
//   1. ela mora no BANCO (`esc_copa_tatica`) e só se escreve com um jogo ROLANDO; o banco carimba o passo daquele jogo;
//   2. no jogo do passo k vale a última tática escolhida num passo ANTERIOR a k (escolhe durante um jogo, vale no próximo);
//      a leitura só devolve linha CONGELADA (jogo já apitado), então todo aparelho usa as mesmas;
//   3. o jogo que tem tática de gente (≠ equilíbrio) é sorteado de novo com um DADO PRÓPRIO, DEPOIS do sorteio normal —
//      o dado do torneio anda igual, então nenhum outro jogo muda (mesma ideia do motor novo da carreira na Copa).
//      Quem fica em ⚖️ equilíbrio joga exatamente como sempre jogou.
//
// Este arquivo é PURO (não importa tela nem banco) — a trava `npm run copa-tatica` testa ele.

// 🛟 SÓ COPA QUE NASCEU DEPOIS DA PUBLICAÇÃO. Quem estava com o jogo aberto antes continua na versão velha (o deploy não
// recarrega ninguém — regra do Diego, 21/10), e a versão velha não sabe de tática: se a Copa dele já rolava e alguém da
// versão nova escolhesse tática, os dois veriam placares diferentes. Copa criada antes deste instante termina sem tática.
export const TATICA_DESDE = Date.parse('2026-10-23T11:33:00Z')
export const copaComTatica = (criadaEm?: string | null): boolean => !!criadaEm && Date.parse(criadaEm) >= TATICA_DESDE

export type TaticaCopa = 'retranca' | 'equilibrio' | 'ataque'
export const TATICAS_COPA: TaticaCopa[] = ['retranca', 'equilibrio', 'ataque']
/** uma linha congelada do banco: `passo` = o passo do JOGO que estava rolando quando a pessoa escolheu */
export type LinhaTatica = { uid: string; passo: number; tatica: TaticaCopa }
/** a tática de um time num passo (time = índice do entrant) */
export type QualTatica = (time: number, passo: number) => TaticaCopa

/** no jogo do passo `k` vale a última escolhida com passo < k; sem nenhuma, ⚖️ equilíbrio */
export function taticaNoPasso(linhas: LinhaTatica[], uid: string, k: number): TaticaCopa {
  let melhor: LinhaTatica | null = null
  for (const l of linhas) if (l.uid === uid && l.passo < k && (!melhor || l.passo > melhor.passo)) melhor = l
  return melhor?.tatica ?? 'equilibrio'
}

/** monta a consulta por time. Sem linha nenhuma devolve `undefined` (a Copa roda exatamente como antes). */
export function montaQualTatica(linhas: LinhaTatica[], uidDoTime: (string | undefined)[]): QualTatica | undefined {
  const validas = linhas.filter(l => TATICAS_COPA.includes(l.tatica) && uidDoTime.includes(l.uid))
  if (!validas.length) return undefined
  return (time, passo) => { const uid = uidDoTime[time]; return uid ? taticaNoPasso(validas, uid, passo) : 'equilibrio' }
}

export const temTatica = (h: TaticaCopa, a: TaticaCopa) => h !== 'equilibrio' || a !== 'equilibrio'

// ── o EFEITO, em multiplicador da média de gols (λ) — mesma lógica do pedra-papel-tesoura da liga ──
// 🔥 ataque: faz mais e toma mais · 🧱 retranca: faz menos e toma bem menos · ⚖️ equilíbrio: neutro.
// Contra-golpes (iguais aos da liga): retranca segura melhor o ataque · ataque castiga o equilíbrio · equilíbrio fura a retranca.
const FAZ: Record<TaticaCopa, number> = { ataque: 1.25, equilibrio: 1, retranca: 0.8 }
const TOMA: Record<TaticaCopa, number> = { ataque: 1.2, equilibrio: 1, retranca: 0.75 }
function contraFaz(eu: TaticaCopa, ele: TaticaCopa) { return eu === 'ataque' && ele === 'equilibrio' ? 1.08 : eu === 'equilibrio' && ele === 'retranca' ? 1.1 : 1 }
function contraToma(eu: TaticaCopa, ele: TaticaCopa) { return eu === 'retranca' && ele === 'ataque' ? 0.88 : 1 }
/** [multiplicador do λ do mandante, do visitante] */
export function fatoresTatica(h: TaticaCopa, a: TaticaCopa): [number, number] {
  return [
    FAZ[h] * contraFaz(h, a) * TOMA[a] * contraToma(a, h),
    FAZ[a] * contraFaz(a, h) * TOMA[h] * contraToma(h, a),
  ]
}

// ── o DADO PRÓPRIO do jogo com tática (preso na semente + chave do jogo + as duas táticas) ──
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export function dadoDaTatica(seed: number, chave: string, h: TaticaCopa, a: TaticaCopa): () => number {
  let n = (seed ^ 0x7A71CA) >>> 0
  const s = `${chave}|${h}|${a}`
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 0x01000193) >>> 0
  return mulberry(n)
}
