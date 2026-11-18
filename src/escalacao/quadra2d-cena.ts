// 🏀📺 A CENA DA QUADRA 2D (18/11) — pura (sem React, sem imagem): onde está cada jogador e a bola no instante `t`, a partir do
// ROTEIRO (`quadra2d-plano.ts`). Separada da tela pra poder ser MEDIDA quadro a quadro (trava `npm run quadra2d`): ninguém
// teleporta, ninguém corre mais rápido que gente, a bola não pula.
import { QUADRA, posseEm, type PlanoQuadra } from './quadra2d-plano'
import { getLang } from './lang'

// 🏀 as vagas do quinteto no ataque (pés, atacando pra DIREITA): PG no topo, SG e SF nas alas, PF e C perto do garrafão
const SET: [number, number][] = [[66, 25], [80, 6], [76, 45], [73, 35], [85, 17]]
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const lerpP = (a: [number, number], b: [number, number], u: number): [number, number] => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]

export type Cena = {
  of: 'casa' | 'fora'
  /** posições em pés, atacando pra DIREITA (o desenho espelha quando o ataque é pra esquerda) */
  ataque: [number, number][]; defesa: [number, number][]
  bola: [number, number]; comBola: number | null; bolaNoAr: boolean
  selo: string | null; seloEm: [number, number] | null
  relogio24: number
}

/** 🎬 a CENA do instante `t` (minuto do relógio, contínuo) — pura, a mesma em todo aparelho */
export function cenaEm(plano: PlanoQuadra, t: number): Cena {
  const { atual: l } = posseEm(plano, t)
  if (!l) return { of: 'casa', ataque: SET.map(p => [p[0] - 40, p[1]]), defesa: SET.map(p => [p[0] - 30, p[1]]), bola: [47, 25], comBola: null, bolaNoAr: false, selo: null, seloEm: null, relogio24: 24 }
  const u = Math.max(0, Math.min(1, (t - l.t0) / Math.max(0.001, l.t1 - l.t0)))
  const mex = (i: number, k: number) => Math.sin(t * 2.3 + i * 1.7 + k) * 0.9 // ginga, pra ninguém ficar estátua
  const chegada = ease(u / 0.28)
  const ataque: [number, number][] = SET.map((p, i) => {
    const longe: [number, number] = [Math.max(50, p[0] - 26), p[1]] // vem do meio da quadra, já espalhado na largura
    let pos = lerpP(longe, p, chegada)
    if (l.tipo === 'lance') pos = lerpP(longe, LL_ATQ[i], chegada)
    else if (i === l.quem) pos = lerpP(pos, [l.x, l.y], ease((u - 0.3) / 0.35))
    return [pos[0] + mex(i, 0) * (1 - chegada * 0.4), pos[1] + mex(i, 2) * 0.7]
  })
  if (l.tipo === 'lance') ataque[l.quem] = [QUADRA.linhaLL, QUADRA.aroY]
  const defesa: [number, number][] = ataque.map((a, i) => {
    if (l.tipo === 'lance') return LL_DEF[i]
    // entre o seu homem e o aro: ~5 pés na frente dele, meio de lado (senão as fichas ficam uma em cima da outra)
    const dx = QUADRA.aroX - a[0], dy = QUADRA.aroY - a[1], dd = Math.hypot(dx, dy) || 1
    const k = Math.min(6.5, dd * 0.6)
    return [a[0] + dx / dd * k - dy / dd * 1.6 + mex(i, 4) * 0.4, a[1] + dy / dd * k + dx / dd * 1.6 + mex(i, 6) * 0.4]
  })
  // quem defende o lance (toco/roubo) cola no arremessador
  if (l.defensor != null) defesa[l.defensor] = lerpP(defesa[l.defensor], [ataque[l.quem][0] + 1.5, ataque[l.quem][1] + 0.8], ease((u - 0.5) / 0.25))
  // 🏀 a bola: com o armador (ou o passador) → passe → arremesso → aro
  const dono0 = l.passe >= 0 ? l.passe : l.quem
  let bola: [number, number] = ataque[dono0], comBola: number | null = dono0, bolaNoAr = false
  if (l.passe >= 0 && u >= 0.58 && u < 0.7) { bola = lerpP(ataque[l.passe], ataque[l.quem], ease((u - 0.58) / 0.12)); comBola = null; bolaNoAr = true }
  else if (u >= 0.7 || l.passe < 0) { bola = ataque[l.quem]; comBola = l.quem }
  const aro: [number, number] = [QUADRA.aroX - 0.6, QUADRA.aroY]
  const iniTiro = l.tipo === 'lance' ? 0.45 : 0.78
  if (l.tipo === 'roubo' && u >= 0.62) { bola = lerpP(ataque[dono0], [ataque[dono0][0] - 30, ataque[dono0][1]], ease((u - 0.62) / 0.38)); comBola = null; bolaNoAr = false }
  else if (u >= iniTiro) {
    const v = ease((u - iniTiro) / (0.95 - iniTiro))
    if (l.tipo === 'toco') bola = lerpP(ataque[l.quem], [ataque[l.quem][0] - 8, ataque[l.quem][1] + 6], v)
    else if (l.pts === 0 && u > 0.93) bola = lerpP(aro, [QUADRA.aroX - 7, QUADRA.aroY + (l.y > 25 ? -5 : 5)], ease((u - 0.93) / 0.07)) // aro e rebote
    else bola = lerpP(ataque[l.quem], aro, v)
    comBola = null; bolaNoAr = true
  }
  const caiu = l.pts > 0 && u >= 0.95
  const selo = caiu ? `+${l.pts}${l.pts === 3 ? ' 🔥' : ''}` : u >= 0.85 && l.tipo === 'toco' ? (getLang() === 'en' ? 'BLOCK!' : 'TOCO!') : u >= 0.66 && l.tipo === 'roubo' ? (getLang() === 'en' ? 'STEAL!' : 'ROUBOU!') : null
  return { of: l.lado, ataque, defesa, bola, comBola, bolaNoAr, selo, seloEm: selo ? [QUADRA.aroX, QUADRA.aroY] : null, relogio24: Math.max(0, Math.round(24 * (1 - u))) }
}
// alinhamento do lance livre: o batedor na linha, o resto no corredor do garrafão
export const LL_ATQ: [number, number][] = [[62, 25], [80, 16], [80, 34], [84, 15.5], [84, 34.5]]
const LL_DEF: [number, number][] = [[66, 30], [87, 15.5], [87, 34.5], [82, 15.5], [82, 34.5]]

/** a direção do ataque de quem tem a bola: casa ataca a direita no 1º tempo e a esquerda no 2º (igual à NBA) */
export const atacaDireita = (of: 'casa' | 'fora', t: number) => (of === 'casa') === (t < 46.5)

