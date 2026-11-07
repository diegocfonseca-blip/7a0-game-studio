// ✨ EFEITOS DE LANCE NO CAMPO 2D (07/11, Diego escolheu da lista: *"chute forte… bola na trave… cavadinha e chapéu… bola
// longa: uma sombra no gramado mostra onde ela vai cair — pode fazer"*). SÓ DESENHO: nada aqui decide lance, placar ou
// motor — lê a bola e os jogadores do quadro e diz o que pintar por cima. Vale pros DOIS motores (o de sempre tem `voo`;
// o novo tem velocidade vx/vy/vh). Nenhum efeito para o jogo: tudo acontece com a bola rolando.
// Trava: `npm run efeitos-2d`.

export const G_EFEITO = 9.8
/** chute "forte": a bola andando acima disto (m/s) em direção a um gol */
export const BOMBA_MS = 24
/** gol "de longe": o chute saiu a mais disto (m) da linha do gol — a rede balança mais */
export const LONGE_M = 18
const L = 105

type P = { x: number; y: number }
export type AtletaVisto = { lado: 0 | 1; x: number; y: number; grupo?: string }
export type BolaVista = {
  x: number; y: number; h: number
  dono?: AtletaVisto | null
  voo?: { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; alt: number } | null
  vx?: number; vy?: number; vh?: number
}

/** 🎯 onde a bola ALTA vai cair (null = não está no alto, ou já está chegando). Motor de sempre: o fim do voo. Motor novo:
 *  a conta do arremesso (sem o arrasto do ar — por isso ela é refeita a cada quadro e vai acertando o lugar). */
export function pousoDaBola(b: BolaVista): (P & { falta: number }) | null {
  if (b.dono) return null
  const v = b.voo
  if (v) {
    if (v.alt < 1.6) return null
    const falta = v.dur - v.t
    if (falta < 0.1 || Math.hypot(v.x1 - v.x0, v.y1 - v.y0) < 12) return null
    return { x: v.x1, y: v.y1, falta }
  }
  if (b.vh == null || b.vx == null || b.vy == null) return null
  if (b.h < 0.5 && b.vh < 2) return null
  const tq = (b.vh + Math.sqrt(Math.max(0, b.vh * b.vh + 2 * G_EFEITO * b.h))) / G_EFEITO
  if (tq < 0.12) return null
  const x = b.x + b.vx * tq, y = b.y + b.vy * tq
  if (Math.hypot(x - b.x, y - b.y) < 6) return null
  return { x, y, falta: tq }
}

/** quanto a bola está andando (m/s) entre dois quadros DE JOGO (tempo do motor, não da tela: no 4× não vira bomba à toa) */
export function velocidadeBola(a: P, b: P, dtJogo: number): number {
  return dtJogo > 1e-4 ? Math.hypot(b.x - a.x, b.y - a.y) / dtJogo : 0
}

/** 💥 é chute forte? tem que ser CHUTE (passe longo também voa rápido), rápido, e indo pro gol da metade de ataque */
export function ehBomba(de: P, para: P, vel: number, chute = true): boolean {
  if (!chute || vel < BOMBA_MS) return false
  const dy = para.y - de.y
  return (dy < 0 && para.y < L / 2) || (dy > 0 && para.y > L / 2)
}

/** 🥅 o gol saiu de longe? (distância do ponto do chute até a linha do gol que ele atacava) */
export function golDeLonge(saiu: P | null, golY: number): boolean {
  return !!saiu && Math.abs(saiu.y - golY) > LONGE_M
}

/** a rede: o de sempre (0,9 por 1 s) e, no gol de longe, mais forte e mais demorada */
export function balancoRede(idade: number, longe: boolean): number {
  const dura = longe ? 1.8 : 1, forca = longe ? 2.1 : 0.9
  return idade < 0 || idade > dura ? 0 : Math.sin(idade * 30) * forca * (1 - idade / dura)
}

/** 🔔 a trave treme: deslocamento (m) do gol inteiro por 0,7 s depois da batida */
export function tremorTrave(idade: number): number {
  return idade < 0 || idade > 0.7 ? 0 : Math.sin(idade * 70) * 0.28 * (1 - idade / 0.7)
}

/** 🎩 CHAPÉU / CAVADINHA: a bola sobe e passa POR CIMA de um adversário. Quem levou fica olhando pra cima.
 *  Régua pra não marcar qualquer lançamento: a bola está entre 1,1 e 3,8 m, passa a menos de 1,6 m (no chão) do cara, e
 *  ou ele estava colado em quem tocou (≤ 4,5 m do ponto do toque — o chapéu de verdade), ou é o GOLEIRO (cavadinha/cobertura). */
export function vitimaDoChapeu(b: BolaVista, saida: (P & { lado: 0 | 1 }) | null, atletas: readonly AtletaVisto[]): AtletaVisto | null {
  if (!saida || b.dono || b.h < 1.1 || b.h > 3.8) return null
  if (Math.hypot(b.x - saida.x, b.y - saida.y) > 26) return null
  let melhor: AtletaVisto | null = null, md = 1.6
  for (const a of atletas) {
    if (a.lado === saida.lado) continue
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (d >= md) continue
    const colado = Math.hypot(a.x - saida.x, a.y - saida.y) <= 4.5
    if (!colado && a.grupo !== 'GOL') continue
    melhor = a; md = d
  }
  return melhor
}
