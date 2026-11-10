// 👕 CAMISAS DO CAMPO 2D (06/11, pedido aprovado pelo Diego) — as regras PURAS (sem import de nada: a trava
// `npm run camisas-2d` roda isto no node, e o mesmo dado de entrada dá a MESMA camisa em qualquer aparelho).
//
// De onde vem o "kit" de cada time (quem monta é `camisas-2d-dados.ts`):
//   1. 🖋️ clube de BATISMO → as cores do MANTO (2 cores; 3 com `MANTO_TRI`), sempre — pelo NOME do clube (lista
//      pública `batismos.ts`) ou pelo que o servidor disse do assento na sala (`esc_mantos_sala`).
//   2. 🟫 gente SEM plano → bege (`APOIO_PERKS.bege`) · 3. ⭐ Craque = prata · 👑 Lenda = dourado · 🎨 cor adicional
//      escolhida = ela. Isso já chega pronto na cor do placar (`homeColor`/`awayColor`), lida do SELO no nome — o
//      mesmo dado que pinta o crachá na sala inteira.
//   5. 🤖 bot → a cor de hoje.
// E aqui mora a regra 4, o CHOQUE: a casa fica com a principal; o visitante parecido troca pra 2ª cor do manto (com 3
// cores, a que menos choca) e, se ainda parecer ou não tiver 2ª, veste a reserva BRANCA (PRETA se a casa for clara — dourado/prata/bege contam como claras).

/** a camisa que vai pro campinho: `cor` = a principal (o corpo do boneco, o chip do placar), `listras` = os detalhes:
 *  [0] = as duas listras LARGAS, [1] = o FILETE fino ('' = não tem aquela) */
export interface Camisa2D { cor: string; listras: string[]; reserva?: boolean }

export const RESERVA_BRANCA = '#F4F4F4'
export const RESERVA_PRETA = '#1B1B1B'
/** ΔE (CIE76) abaixo disto = "parecido" no campinho (bolinha de ~14px em cima da grama, de longe) */
export const PARECIDO_DE = 28

const hex = (c: string): [number, number, number] => {
  const n = parseInt((c || '#888888').replace('#', '').slice(0, 6).padEnd(6, '8'), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const lin = (v: number) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
/** sRGB → CIE Lab (D65) */
export function lab(c: string): [number, number, number] {
  const [r, g, b] = hex(c).map(lin)
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fx = f(X), fy = f(Y), fz = f(Z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
/** distância de cor (ΔE CIE76) */
export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = lab(a), [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
export const parecido = (a: string, b: string): boolean => deltaE(a, b) < PARECIDO_DE
/** cor clara (a letra do número vai preta; a reserva do rival vai PRETA) — a mesma régua de luminância do marcador */
export const clara = (c: string): boolean => { const [r, g, b] = hex(c); return 0.299 * r + 0.587 * g + 0.114 * b > 160 }

const valida = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)
/** limpa o kit: só #rrggbb, sem repetida, no máximo 3 */
export function kitLimpo(cores: (string | null | undefined)[], reserva = '#888888'): string[] {
  const out: string[] = []
  for (const c of cores) if (valida(c) && !out.some(o => o.toLowerCase() === c.toLowerCase())) out.push(c)
  return out.length ? out.slice(0, 3) : [reserva]
}

/**
 * ⚔️ as duas camisas do jogo. `casa`/`fora` = o kit de cada um ([principal, 2ª?, 3ª?]).
 * Pura e determinística: mesmo kit → mesma camisa, em qualquer aparelho.
 */
export function camisasDoJogo(casaKit: string[], foraKit: string[], foraKit2?: string[] | null): [Camisa2D, Camisa2D] {
  const casa = kitLimpo(casaKit, '#C2452F'), fora = kitLimpo(foraKit, '#2B6CFF')
  const principal = casa[0]
  const camCasa: Camisa2D = { cor: principal, listras: casa.slice(1) }
  if (!parecido(principal, fora[0])) return [camCasa, { cor: fora[0], listras: fora.slice(1) }]
  // 🎽 09/11: o visitante tem 2ª CAMISA (Loja) e ela não bate com a casa → joga com ela, antes de inverter ou ir de branco
  const segunda = foraKit2 && foraKit2.length ? kitLimpo(foraKit2) : null
  if (segunda && !parecido(principal, segunda[0])) return [camCasa, { cor: segunda[0], listras: segunda.slice(1) }]
  // 🔄 camisa invertida: a 2ª (ou a 3ª, a que menos choca) vira a principal, e a principal vira detalhe
  const outras = fora.slice(1).map(c => ({ c, d: deltaE(principal, c) })).sort((a, b) => b.d - a.d)
  const melhor = outras[0]
  // as listras LARGAS ficam com a cor que sobrou e NÃO choca; a que choca (a principal de antes) vira só o FILETE fino
  if (melhor && melhor.d >= PARECIDO_DE) {
    const sobra = fora.slice(1).filter(c => c !== melhor.c && !parecido(principal, c))
    return [camCasa, { cor: melhor.c, listras: [sobra[0] ?? '', fora[0]] }]
  }
  // 🤍🖤 reserva: branca; PRETA se a casa for clara — "clara" medido pelo contraste de verdade (ΔE): dourado, prata e bege são
  // claros pro olho e o branco quase some neles, então dourado × dourado e prata × prata = o visitante de PRETO (Diego, 06/11)
  const res = deltaE(principal, RESERVA_BRANCA) > deltaE(principal, RESERVA_PRETA) ? RESERVA_BRANCA : RESERVA_PRETA
  return [camCasa, { cor: res, listras: [], reserva: true }]
}
