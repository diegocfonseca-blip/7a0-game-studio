// 🏀📺 A CENA DA QUADRA 2D (18/11) — pura (sem React, sem imagem): onde está cada jogador e a bola no instante `t`, a partir do
// ROTEIRO (`quadra2d-plano.ts`). Separada da tela pra poder ser MEDIDA quadro a quadro (trava `npm run quadra2d`).
//
// 🔁 18/11, 2ª versão (Diego: *"movimentação… passes, rebotes, assistências, arremesso… estão bons?"* — medido: NÃO estavam:
// cada jogada ficava 0,4 s na tela e o time inteiro TELEPORTAVA a cada troca de posse). Agora:
//   • a quadra encena só as jogadas em DESTAQUE do roteiro (~20 por jogo, ~2 s cada); as outras cestas sobem no placar como
//     "cesta rápida" (a tela mostra o nome numa faixa) — o placar é o MESMO em qualquer tela;
//   • tudo em coordenada ABSOLUTA da quadra (pés, 94 × 50): entre uma jogada e outra todo mundo CORRE de onde estava até onde a
//     próxima começa (ninguém some e aparece), e a bola vai junto de quem a leva;
//   • o passe sai de quem deu a ASSISTÊNCIA de verdade, o rebote é de quem pegou o rebote de verdade (os números do jogo).
import { QUADRA, QUARTOS, MIN_POR_QUARTO, type Lance, type PlanoQuadra } from './quadra2d-plano'
const quartoDe = (t: number) => QUARTOS.findIndex(([a, b]) => t >= a && t < b)
import { getLang } from './lang'

export type P = [number, number]
// 🏀 as vagas do quinteto no ataque (pés, atacando pra DIREITA): PG no topo, SG e SF nas alas, PF e C perto do garrafão
const SET: P[] = [[66, 25], [80, 6], [76, 45], [73, 35], [85, 17]]
// alinhamento do lance livre: o batedor na linha, o resto no corredor do garrafão
export const LL_ATQ: P[] = [[62, 25], [80, 16], [80, 34], [84, 15.5], [84, 34.5]]
const LL_DEF: P[] = [[66, 30], [87, 15.5], [87, 34.5], [82, 15.5], [82, 34.5]]
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const lerpP = (a: P, b: P, u: number): P => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]
const ARO: P = [QUADRA.aroX - 0.6, QUADRA.aroY]

/** a direção do ataque de quem tem a bola: casa ataca a direita no 1º tempo e a esquerda no 2º (igual à NBA) */
export const atacaDireita = (of: 'casa' | 'fora', t: number) => (of === 'casa') === (t < 46.5)
/** pés "atacando pra direita" → pés ABSOLUTOS da quadra */
const abs = (p: P, dir: boolean): P => (dir ? p : [QUADRA.comp - p[0], QUADRA.larg - p[1]])

export type Cena = {
  /** posições ABSOLUTAS (pés) de cada um: casa[0..4] e fora[0..4] (PG..C) */
  casa: P[]; fora: P[]
  bola: P; bolaNoAr: boolean
  /** quem está com a bola (lado + índice) */
  comBola: { lado: 'casa' | 'fora'; i: number } | null
  selo: string | null; seloEm: P | null
  /** quem ataca agora e pra que lado (pra pintar o garrafão e mirar a câmera) */
  of: 'casa' | 'fora'; dir: boolean
  relogio24: number
  /** a jogada em destaque que está na tela (pra a rádio) */
  lance?: Lance
}

const DUR = 2.5   // minutos do relógio que uma jogada em destaque ocupa antes da bola chegar
const POS = 0.55  // depois da bola chegar: rede balançando, rebote na mão

type Pose = { casa: P[]; fora: P[]; bola: P; bolaNoAr: boolean; comBola: Cena['comBola']; selo: string | null; seloEm: P | null }

/** a pose da jogada `l` no instante u (0 = começo da jogada, 1 = bola chega, até 1 + POS/DUR) — tudo absoluto */
function poseDaJogada(l: Lance, u: number, t: number): Pose {
  const dir = atacaDireita(l.lado, l.t1)
  const mex = (i: number, k: number) => Math.sin(t * 2.1 + i * 1.7 + k) * 0.7
  const ll = l.tipo === 'lance'
  // ataque (atacando pra direita)
  const atq: P[] = (ll ? LL_ATQ : SET).map((p, i) => [p[0] + mex(i, 0), p[1] + mex(i, 2) * 0.8] as P)
  // o arremessador já chega da corrida meio caminho andado até o ponto do arremesso, e termina de se mexer na jogada
  if (!ll) { const meio = lerpP(atq[l.quem], [l.x, l.y], 0.55); atq[l.quem] = lerpP(meio, [l.x, l.y], ease((u - 0.1) / 0.62)) }
  else atq[l.quem] = [QUADRA.linhaLL, QUADRA.aroY]
  // defesa: entre o seu homem e o aro, ~6 pés na frente dele, meio de lado
  // quem vai dar o TOCO/ROUBO marca o arremessador desde o começo da jogada (troca de marcação) — senão ele atravessava a quadra
  const homem = atq.map((_, i) => i)
  if (l.defensor != null && (l.tipo === 'toco' || l.tipo === 'roubo') && l.defensor !== l.quem) { homem[l.defensor] = l.quem; homem[l.quem] = l.defensor }
  const def: P[] = homem.map((h, i) => {
    const a = atq[h]
    if (ll) return LL_DEF[i]
    const dx = ARO[0] - a[0], dy = ARO[1] - a[1], dd = Math.hypot(dx, dy) || 1, k = Math.min(5, dd * 0.5)
    return [a[0] + dx / dd * k - dy / dd * 3, a[1] + dy / dd * k + dx / dd * 3]
  })
  if (l.defensor != null && (l.tipo === 'toco' || l.tipo === 'roubo')) def[l.defensor] = lerpP(def[l.defensor], [atq[l.quem][0] + 1.4, atq[l.quem][1] + 0.8], ease((u - 0.35) / 0.4))
  // 🏀 rebote: quem pegou vai buscar embaixo do aro
  if (l.tipo === 'erro' && l.reb != null) def[l.reb] = lerpP(def[l.reb], [QUADRA.aroX - 4, QUADRA.aroY + (l.y > 25 ? -3 : 3)], ease((u - 0.6) / 0.45))
  // a bola
  const dono0 = l.passe >= 0 ? l.passe : l.quem
  let bola: P = atq[dono0], bolaNoAr = false
  let com: Cena['comBola'] = { lado: l.lado, i: dono0 }
  let selo: string | null = null
  const outro = l.lado === 'casa' ? 'fora' : 'casa'
  const iniTiro = ll ? 0.45 : 0.76
  if (l.passe >= 0 && u >= 0.48 && u < 0.62) {
    if (l.tipo === 'roubo' && l.defensor != null) { bola = lerpP(atq[l.passe], def[l.defensor], ease((u - 0.48) / 0.14)); com = null; bolaNoAr = true }
    else { bola = lerpP(atq[l.passe], atq[l.quem], ease((u - 0.48) / 0.14)); com = null; bolaNoAr = true }
  } else if (u >= 0.62 || l.passe < 0) { bola = atq[l.quem]; com = { lado: l.lado, i: l.quem } }
  if (l.tipo === 'roubo' && l.defensor != null && u >= 0.6) { bola = def[l.defensor]; com = { lado: outro, i: l.defensor }; if (u >= 0.75) selo = getLang() === 'en' ? 'STEAL!' : 'ROUBOU!' }
  else if (u >= iniTiro) {
    const v = ease((u - iniTiro) / (1 - iniTiro))
    com = null; bolaNoAr = true
    if (l.tipo === 'toco') { bola = lerpP(atq[l.quem], [atq[l.quem][0] - 9, atq[l.quem][1] + 7], v); if (u >= 0.82) selo = getLang() === 'en' ? 'BLOCK!' : 'TOCO!' }
    else bola = lerpP(atq[l.quem], ARO, v)
    if (u >= 1) {
      const w = ease((u - 1) / (POS / DUR))
      if (l.pts > 0) { bola = lerpP(ARO, [ARO[0] + 0.6, ARO[1]], w); selo = `+${l.pts}${l.pts === 3 ? ' 🔥' : ''}`; bolaNoAr = false }
      else if (l.tipo === 'erro' && l.reb != null) { bola = lerpP(ARO, def[l.reb], w); if (w >= 0.95) { com = { lado: outro, i: l.reb }; bolaNoAr = false } if (u >= 1.1) selo = getLang() === 'en' ? 'REBOUND!' : 'REBOTE!' }
      else if (l.tipo === 'toco') { bola = [atq[l.quem][0] - 9, atq[l.quem][1] + 7]; bolaNoAr = false }
    }
  }
  const casa = (l.lado === 'casa' ? atq : def).map(p => abs(p, dir))
  const fora = (l.lado === 'casa' ? def : atq).map(p => abs(p, dir))
  return { casa, fora, bola: abs(bola, dir), bolaNoAr, comBola: com, selo, seloEm: selo ? abs(ARO, dir) : null }
}

/** a pose do APITO INICIAL: todo mundo em volta do círculo do meio, bola ao alto */
function poseInicial(t: number): Pose {
  const cx = QUADRA.comp / 2, cy = QUADRA.larg / 2
  const lado = (s: 1 | -1): P[] => [[cx - s * 2.5, cy], [cx - s * 9, cy - 12], [cx - s * 9, cy + 12], [cx - s * 15, cy - 6], [cx - s * 15, cy + 6]]
  const salto = Math.abs(Math.sin(t * 3)) * 1.5
  return { casa: lado(1), fora: lado(-1), bola: [cx, cy - salto], bolaNoAr: true, comBola: null, selo: null, seloEm: null }
}

const mistura = (a: Pose, b: Pose, u: number, bolaJunto: { lado: 'casa' | 'fora'; i: number } | null): Pose => {
  const casa = a.casa.map((p, i) => lerpP(p, b.casa[i], u)), fora = a.fora.map((p, i) => lerpP(p, b.fora[i], u))
  // a bola sai de onde estava e logo vai pra mão de quem vai começar a próxima jogada (e corre junto com ele)
  const dono = bolaJunto ? (bolaJunto.lado === 'casa' ? casa : fora)[bolaJunto.i] : lerpP(a.bola, b.bola, u)
  const bola = lerpP(a.bola, dono, ease(u / 0.35))
  return { casa, fora, bola, bolaNoAr: u < 0.35, comBola: u >= 0.35 ? bolaJunto : null, selo: null, seloEm: null }
}

export type IndiceCena = { destaques: Lance[]; ini: number[] }
/** velocidade máxima de corrida na tela, em pés por MINUTO DO RELÓGIO (≈ 45 pés/s no jogo de 1 min — uma arrancada, nunca teleporte) */
export const VEL_MAX = 22
/** pré-cálculo por roteiro (a tela guarda num useMemo): as jogadas em destaque e quando cada uma começa na tela.
 *  A corrida entre uma jogada e outra ganha o TEMPO QUE A DISTÂNCIA PEDE (ninguém passa de VEL_MAX); a jogada fica com o resto. */
export function indiceDaCena(plano: PlanoQuadra): IndiceCena {
  const todos = plano.lances.filter(l => l.destaque).sort((a, b) => a.t1 - b.t1)
  const destaques: Lance[] = [], ini: number[] = []
  const dist = (a: Pose, b: Pose) => Math.max(...[...a.casa, ...a.fora].map((p, i) => Math.hypot(p[0] - [...b.casa, ...b.fora][i][0], p[1] - [...b.casa, ...b.fora][i][1])))
  for (const l of todos) {
    for (;;) {
      const ant = destaques[destaques.length - 1]
      const antFim = ant ? ant.t1 + POS : 0.4
      const a = ant ? poseDaJogada(ant, 1 + POS / DUR, antFim) : poseInicial(antFim)
      const b = poseDaJogada(l, 0, l.t1 - DUR)
      const precisa = dist(a, b) / VEL_MAX + 0.15
      const s = Math.max(antFim + precisa, l.t1 - DUR)
      if (l.t1 - s >= 1.4) { destaques.push(l); ini.push(s); break }
      // sem tempo pra correr E mostrar a jogada (≥ 1,4 minuto): uma das duas vira cesta rápida (a faixa mostra o nome).
      // 🕐 a GARANTIDA do quarto (mínimo do Diego) nunca sai: se a nova é garantida e a anterior não, sai a anterior
      if (l.garantida && ant && !ant.garantida) { ant.destaque = false; destaques.pop(); ini.pop(); continue }
      if (l.garantida && ant?.garantida) {
        // duas garantidas brigando pelo mesmo tempo: sai a do quarto que tem SOBRANDO (o mínimo é por quarto)
        const doQuarto = (x: Lance) => todos.filter(y => y.destaque && quartoDe(y.t1) === quartoDe(x.t1)).length
        if (doQuarto(l) <= MIN_POR_QUARTO && doQuarto(ant) > MIN_POR_QUARTO) { ant.destaque = false; destaques.pop(); ini.pop(); continue }
      }
      l.destaque = false; break
    }
  }
  return { destaques, ini }
}

/** 🎬 a CENA do instante `t` (minuto do relógio, contínuo) — pura, a mesma em todo aparelho */
export function cenaEm(plano: PlanoQuadra, t: number, idx: IndiceCena = indiceDaCena(plano)): Cena {
  const { destaques: D, ini } = idx
  const relogio24 = (() => { const l = plano.lances.find(x => t < x.t1); return l ? Math.max(0, Math.round(24 * (1 - (t - l.t0) / Math.max(0.01, l.t1 - l.t0)))) : 24 })()
  const fim = (p: Pose, l: Lance | undefined, of: 'casa' | 'fora'): Cena => ({ ...p, of, dir: atacaDireita(of, t), relogio24, lance: l })
  if (!D.length) return fim(poseInicial(t), undefined, 'casa')
  // qual a próxima jogada (a primeira que ainda não terminou)
  let k = D.findIndex(l => t < l.t1 + POS)
  if (k < 0) { const l = D[D.length - 1]; return fim(poseDaJogada(l, 1 + POS / DUR, t), l, l.lado) }
  const l = D[k], s = ini[k]
  const durJ = Math.max(0.5, l.t1 - s) // a jogada vai de s até a bola chegar (t1)
  if (t >= s) {
    const u = t <= l.t1 ? (t - s) / durJ : 1 + (t - l.t1) / DUR
    return fim(poseDaJogada(l, u, t), l, l.lado)
  }
  // ⏩ TRANSIÇÃO: todo mundo corre do fim da jogada anterior (ou do apito inicial) até o começo desta
  const antFim = k > 0 ? D[k - 1].t1 + POS : 0.4
  const a = k > 0 ? poseDaJogada(D[k - 1], 1 + POS / DUR, antFim) : poseInicial(antFim)
  const b = poseDaJogada(l, 0, s)
  const u = ease((t - antFim) / Math.max(0.01, s - antFim))
  const dono0 = l.passe >= 0 ? l.passe : l.quem
  return fim(mistura(a, b, u, { lado: l.lado, i: dono0 }), k > 0 ? D[k - 1] : undefined, l.lado)
}

/** a "CESTA RÁPIDA" mais recente (cesta que NÃO foi encenada) nos últimos `janela` minutos — a faixa da quadra mostra o nome */
export function cestaRapidaEm(plano: PlanoQuadra, t: number, janela = 2.2): Lance | undefined {
  let r: Lance | undefined
  for (const l of plano.lances) { if (l.t1 > t) break; if (!l.destaque && l.pts > 0 && t - l.t1 <= janela) r = l }
  return r
}
