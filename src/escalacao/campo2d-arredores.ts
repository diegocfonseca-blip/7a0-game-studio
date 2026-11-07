// 🚩📸 OS ARREDORES DO CAMPO 2D (07/11, Diego escolheu da lista de ideias: bandeirinhas correndo na lateral, bandeira pro
// lateral/escanteio/tiro de meta, e fotógrafos atrás dos gols com flash no gol). SÓ DESENHO: nada aqui mexe no motor, no placar
// ou no relógio — lê a cena e desenha por cima. Serve pros dois motores (o de sempre e o v2 da carreira).
import { W, L } from './campo2d-motor'

type Pt = [number, number]
type Tr = (x: number, y: number) => Pt
type Bola = { x: number; y: number; voo?: unknown }
type Atl = { lado: 0 | 1; grupo: string; x: number; y: number }
/** o motor de sempre guarda `parada` como o LADO; o v2 guarda um objeto com o tipo */
type ParadaCena = number | { tipo: string; lado: 0 | 1 } | null | undefined
export type CenaArredores = { atl: Atl[]; bola: Bola; festa?: { lado: 0 | 1 } | null; parada?: ParadaCena; semReinicio?: string | null; t: number }

export type Sinal = { tipo: 'lateral' | 'escanteio' | 'tiro_de_meta' | 'saiu'; lado: 0 | 1 | null; alvo: [number, number] | null }

/** 🚩 o que a bandeira tem que mostrar agora (null = abaixada). O mandante (lado 0) ataca pra y→0. */
export function sinalDaBandeira(c: CenaArredores): Sinal | null {
  const b = c.bola, pr = c.parada
  const lado = typeof pr === 'number' ? (pr as 0 | 1) : pr ? pr.lado : null
  const tipoV2 = pr && typeof pr === 'object' ? pr.tipo : null
  if (lado != null) {
    const fundo = b.y < 7 || b.y > L - 7, canto = (b.x < 2.5 || b.x > W - 2.5) && (b.y < 2 || b.y > L - 2)
    const tipo = tipoV2 ?? (canto ? 'escanteio' : (b.x <= 0.7 || b.x >= W - 0.7) ? 'lateral' : fundo && b.x > 23 && b.x < 45 ? 'tiro_de_meta' : null)
    const fimY = b.y < L / 2 ? 0 : L
    if (tipo === 'lateral') return { tipo, lado, alvo: [b.x, b.y + (lado === 0 ? -12 : 12)] }
    if (tipo === 'escanteio') return { tipo, lado, alvo: [b.x < W / 2 ? 0 : W, fimY] }
    if (tipo === 'tiro_de_meta') return { tipo, lado, alvo: [34, fimY === 0 ? 5.5 : L - 5.5] }
    return null
  }
  // a bola acabou de sair e ainda não foi posta no lugar: bandeira pra cima (o "saiu!")
  if (c.semReinicio && (b.x < 0 || b.x > W || b.y < 0 || b.y > L)) return { tipo: 'saiu', lado: null, alvo: null }
  return null
}

/** 🏃 onde cada bandeirinha deve estar: na linha do PENÚLTIMO defensor da metade dele (ou da bola, se ela passou),
 *  cada um numa lateral (diagonal, como na regra): [0] = lateral da direita, metade de baixo (o mandante defende y=L) ·
 *  [1] = lateral da esquerda, metade de cima (o visitante defende y=0) */
export function alvoBandeirinhas(c: CenaArredores): [Pt, Pt] {
  const ys0 = c.atl.filter(p => p.lado === 0 && p.grupo !== 'GOL').map(p => p.y).sort((a, b) => b - a)
  const ys1 = c.atl.filter(p => p.lado === 1 && p.grupo !== 'GOL').map(p => p.y).sort((a, b) => a - b)
  const lin0 = Math.max(ys0[0] ?? L * 0.75, c.bola.y), lin1 = Math.min(ys1[0] ?? L * 0.25, c.bola.y)
  const cl = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  return [[W + 0.6, cl(lin0, L / 2, L - 0.5)], [-0.6, cl(lin1, 0.5, L / 2)]]
}

/** 📸 os fotógrafos: 4 atrás de cada gol, agachados entre a linha de fundo e as placas (nunca atrás da rede) */
export const FOTOGRAFOS: Pt[] = [16, 21.5, 46.5, 52].flatMap(x => [[x, -1.7], [x, L + 1.7]] as Pt[])

const hash = (a: number, b: number) => ((Math.imul(a + 11, 0x9E3779B1) ^ Math.imul(b + 5, 0x85EBCA6B)) >>> 0) % 1000

/** 📸 quem está disparando o flash AGORA (o MESMO no campinho da aba Jogos e no do mapa): no gol, os do gol onde a bola
 *  entrou disparam sem parar; num chute voando perto do gol, um flash ou outro */
export function flashesFotografos(c: CenaArredores): boolean[] {
  const fimGol = c.festa ? (c.festa.lado === 0 ? 0 : L) : null
  const chuteEm = c.bola.voo && (c.bola.y < 22 || c.bola.y > L - 22) ? (c.bola.y < L / 2 ? 0 : L) : null
  const quadro = Math.floor(c.t * 14)
  return FOTOGRAFOS.map(([, fy], i) => { const fim = fy < 0 ? 0 : L; return (fimGol === fim && hash(quadro, i) < 170) || (chuteEm === fim && hash(quadro, i + 40) < 45) })
}

/** 📸 desenha os fotógrafos (com o flash de quem está disparando) */
export function desenhaFotografos(cx: CanvasRenderingContext2D, tr: Tr, R: number, c: CenaArredores) {
  const fl = flashesFotografos(c)
  FOTOGRAFOS.forEach(([fx, fy], i) => {
    const [X, Y] = tr(fx, fy), r = R * 0.5
    const [cxL, cyL] = tr(fx + (34 - fx) * 0.04, fy < 0 ? 0.6 : L - 0.6) // a câmera aponta pro campo
    const ang = Math.atan2(cyL - Y, cxL - X)
    cx.beginPath(); cx.ellipse(X, Y + r * 0.9, r * 0.9, r * 0.35, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.28)'; cx.fill()
    cx.beginPath(); cx.arc(X, Y, r, 0, 7); cx.fillStyle = '#FF7A1A'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#0C0C0C'; cx.stroke() // o colete
    cx.beginPath(); cx.arc(X, Y, r * 0.5, 0, 7); cx.fillStyle = '#2a2a2a'; cx.fill() // a cabeça (de cima)
    cx.save(); cx.translate(X, Y); cx.rotate(ang)
    cx.fillStyle = '#111'; cx.fillRect(r * 0.6, -r * 0.45, r * 0.9, r * 0.9) // o corpo da câmera
    cx.fillRect(r * 1.4, -r * 0.28, r * 0.9, r * 0.56) // a lente
    cx.restore()
    if (fl[i]) {
      const [lx, ly] = [X + Math.cos(ang) * r * 2.2, Y + Math.sin(ang) * r * 2.2]
      const g = cx.createRadialGradient(lx, ly, 0, lx, ly, R * 2.6)
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.25, 'rgba(255,255,240,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)')
      cx.fillStyle = g; cx.beginPath(); cx.arc(lx, ly, R * 2.6, 0, 7); cx.fill()
      // a estrelinha do flash
      cx.strokeStyle = '#fff'; cx.lineWidth = 1.5; cx.beginPath()
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; cx.moveTo(lx - Math.cos(a) * R, ly - Math.sin(a) * R); cx.lineTo(lx + Math.cos(a) * R, ly + Math.sin(a) * R) }
      cx.stroke()
    }
  })
}

/** 🚩 a bandeira do auxiliar: abaixada (junto do corpo) ou levantada apontando pro `alvo` (em coordenadas do campo) */
export function desenhaBandeira(cx: CanvasRenderingContext2D, tr: Tr, X: number, Y: number, RJ: number, fora: Pt, alvo: Pt | null, levantada: boolean) {
  let ang: number
  if (alvo) { const [ax, ay] = tr(...alvo); ang = Math.atan2(ay - Y, ax - X) }
  else { const [ox, oy] = tr(...fora); ang = Math.atan2(oy - Y, ox - X) } // "saiu!": pra fora do campo, pro alto
  const comp = levantada ? RJ * 2.6 : RJ * 1.3
  if (!levantada) ang = Math.atan2(1, 0.25) // abaixada: caída do lado do corpo
  const px = X + Math.cos(ang) * comp, py = Y + Math.sin(ang) * comp
  cx.strokeStyle = '#111'; cx.lineWidth = Math.max(1.5, RJ * 0.18); cx.lineCap = 'round'
  cx.beginPath(); cx.moveTo(X + Math.cos(ang) * RJ * 0.7, Y + Math.sin(ang) * RJ * 0.7); cx.lineTo(px, py); cx.stroke()
  // o pano xadrez vermelho e amarelo, preso na ponta do cabo
  const tam = levantada ? RJ * 1.15 : RJ * 0.7
  cx.save(); cx.translate(px, py); cx.rotate(ang + Math.PI / 2)
  cx.fillStyle = '#FFE600'; cx.fillRect(0, 0, tam, tam)
  cx.fillStyle = '#C2452F'; cx.fillRect(0, 0, tam / 2, tam / 2); cx.fillRect(tam / 2, tam / 2, tam / 2, tam / 2)
  cx.strokeStyle = '#111'; cx.lineWidth = 1; cx.strokeRect(0, 0, tam, tam)
  cx.restore()
}

/** 🗺️ o que o campo do MAPA precisa pra desenhar o mesmo (coordenadas do campo; o mapa converte) */
export type ArredoresMapa = { aux: { x: number; y: number; alvo: [number, number] | null; levantada: boolean }[]; fotos: { x: number; y: number; flash: boolean }[] }
export function arredoresParaMapa(c: CenaArredores, auxs: [number, number][]): ArredoresMapa {
  const sinal = sinalDaBandeira(c), fl = flashesFotografos(c)
  return {
    aux: auxs.map((a, i) => { const meu = sinal != null && (c.bola.y >= L / 2 ? i === 0 : i === 1); return { x: a[0], y: a[1], levantada: meu, alvo: meu ? (sinal!.alvo ?? [i === 0 ? W + 6 : -6, a[1]]) : null } }),
    fotos: FOTOGRAFOS.map(([x, y], i) => ({ x, y, flash: fl[i] })),
  }
}
