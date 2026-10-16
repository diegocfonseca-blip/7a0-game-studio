import { STADIUM_SECTORS, STADIUM_EXTRAS, type StadiumSave } from './estadiodata'
import { progressoVisualSetor } from './presidencia-estadio-camadas'
import { estadioVisualValido } from './presidencia-estadio-validacao'
import { primeiroAndarConcluido, segundoAndarConcluido, extraLiberadoNoProjeto, PAVIMENTACAO_ESTADIO } from './presidencia-estadio-projeto'
import { CAMPO_MAPA } from './presidencia-partida-geometria'
import { MAPA_ESTADIO, ROTAS_ESTADIO } from './presidencia-estadio-mapa-model'
import { obstaculosDoEstadio, type PontoSolo } from './presidencia-estadio-navegacao'
import { PORTA_LOJA, PORTA_HOTEL, PORTA_BAR, type PortaEstadio } from './presidencia-estadio-portas'
import { estacionamentoDoSave, type EstadoEstacionamento } from './presidencia-estacionamento'

export type PontoComplexo = { x: number; z: number }
export type LimitesComplexo = { minX: number; maxX: number; minZ: number; maxZ: number }
export type PortaComplexo = {
  id: string
  approach: PontoComplexo
  threshold: PontoComplexo
  inside: PontoComplexo
  stay: number
  /** Convenção THREE.rotation.y: +Z local olha para fora da entrada. */
  heading: number
  x: number
  z: number
}
export type LoteComplexo = {
  id: string
  x: number
  z: number
  center: PontoComplexo
  width: number
  depth: number
  /** Caixa orientada do bloqueio registrado; não é levantamento arquitetônico. */
  rotation: number
  heading: number
  footprint: readonly PontoComplexo[]
  footprintSource: 'registered-navigation'
  door?: PortaComplexo
  elevated: boolean
}
export type EstadoComplexo = {
  valid: boolean
  parking: EstadoEstacionamento
  progress: Record<string, number>
  extras: Record<string, boolean>
  lowerComplete: boolean
  upperComplete: boolean
  roofBuilt: boolean
  roofClosed: boolean
  floodlit: boolean
  screenVisible: boolean
}

const extraCatalog = [...STADIUM_EXTRAS, PAVIMENTACAO_ESTADIO]
/** O catálogo continua sendo o do jogo: não há preços ou compras paralelas. */
export const OBRAS_COMPLEXO = [
  ...STADIUM_SECTORS.map(s => ({ id: s.k, kind: 'sector' as const })),
  ...extraCatalog.map(e => ({ id: e.k, kind: 'extra' as const })),
] as const

export function complexoDoEstadio(st?: StadiumSave): EstadoComplexo {
  const valid = st === undefined || estadioVisualValido(st)
  const save = valid && st ? st : { inv: {}, ext: [] }
  const progress = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, progressoVisualSetor(save, s.k)]))
  // Posse é preservada mesmo num save legado fora da ordem atual de compra.
  const extras = Object.fromEntries(extraCatalog.map(e => [e.k, save.ext.includes(e.k)]))
  const parking = estacionamentoDoSave(save)
  // A completed lot is visible after each paid instalment. The existing
  // economic extra remains untouched until the full parking purchase closes.
  extras.estac = parking.valid && parking.stage > 0
  const lowerComplete = primeiroAndarConcluido(save)
  const upperComplete = segundoAndarConcluido(save)
  const roofBuilt = extras.cober && extraLiberadoNoProjeto(save, 'cober')
  return {
    valid, parking, progress, extras, lowerComplete, upperComplete, roofBuilt,
    roofClosed: roofBuilt && extras.retratil && save.roofClosed === true,
    floodlit: extras.refl && progress.geral === 1 && progress.grama > 0,
    screenVisible: extras.telao && progress.cadeiras === 1,
  }
}

type Matriz3 = readonly [number, number, number, number, number, number, number, number, number]
/** Quadrado unitário → quadrilátero. A homografia preserva retas, não interpola um raster. */
function homografiaCampo(): Matriz3 {
  const [tl, tr, bl, br] = CAMPO_MAPA
  const dx1 = tr[0] - br[0], dx2 = bl[0] - br[0], sx = tl[0] - tr[0] + br[0] - bl[0]
  const dy1 = tr[1] - br[1], dy2 = bl[1] - br[1], sy = tl[1] - tr[1] + br[1] - bl[1]
  const determinant = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / determinant
  const h = (dx1 * sy - sx * dy1) / determinant
  const a = tr[0] - tl[0] + g * tr[0], b = bl[0] - tl[0] + h * bl[0]
  const d = tr[1] - tl[1] + g * tr[1], e = bl[1] - tl[1] + h * bl[1]
  return [a / 105, b / 68, tl[0] + .5 * (a + b), d / 105, e / 68, tl[1] + .5 * (d + e), g / 105, h / 68, 1 + .5 * (g + h)]
}
function inversa(m: Matriz3): Matriz3 {
  const [a, b, c, d, e, f, g, h, i] = m
  const cof = [e * i - f * h, c * h - b * i, b * f - c * e, f * g - d * i, a * i - c * g, c * d - a * f,
    d * h - e * g, b * g - a * h, a * e - b * d] as const
  const determinant = a * cof[0] + b * cof[3] + c * cof[6]
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) throw new RangeError('Planta do campo sem homografia invertível')
  return cof.map(v => v / determinant) as unknown as Matriz3
}
const worldToMap = homografiaCampo()
const mapToWorld = inversa(worldToMap)
function transformar(m: Matriz3, a: number, b: number) {
  const denominator = m[6] * a + m[7] * b + m[8]
  if (![a, b, denominator].every(Number.isFinite) || Math.abs(denominator) < 1e-12) throw new RangeError('Ponto fora da projeção finita do complexo')
  return [(m[0] * a + m[1] * b + m[2]) / denominator, (m[3] * a + m[4] * b + m[5]) / denominator] as const
}
/** Pixels da referência 1536×1024 → metros no chão, origem no centro do campo. */
export function mapaParaMundo(p: PontoSolo): PontoComplexo {
  const [x, z] = transformar(mapToWorld, p.x, p.y)
  return { x, z }
}
export function mundoParaMapa(p: PontoComplexo): PontoSolo {
  const [x, y] = transformar(worldToMap, p.x, p.z)
  return { x, y }
}
function limites(points: readonly PontoComplexo[]): LimitesComplexo {
  return { minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
    minZ: Math.min(...points.map(p => p.z)), maxZ: Math.max(...points.map(p => p.z)) }
}
function portaNoMundo(porta: PortaEstadio): PortaComplexo {
  const approach = mapaParaMundo(porta.approach), threshold = mapaParaMundo(porta.threshold), inside = mapaParaMundo(porta.inside)
  const heading = Math.atan2(approach.x - inside.x, approach.z - inside.z)
  return { id: porta.id, approach, threshold, inside, stay: porta.stay, heading, x: threshold.x, z: threshold.z }
}
const doors = Object.fromEntries([PORTA_LOJA, PORTA_HOTEL, PORTA_BAR].map(porta => [porta.id, portaNoMundo(porta)]))
const routes = Object.fromEntries(Object.entries(ROTAS_ESTADIO).map(([id, route]) => [id,
  { id, points: route.points.map(mapaParaMundo), loop: route.loop }]))
const full: StadiumSave = {
  inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])),
  ext: extraCatalog.map(e => e.k),
}
/** Registro de chão já usado pelos NPCs. Recortes visuais AREAS_MUNDO não são pegadas. */
const footprints = Object.fromEntries(obstaculosDoEstadio(full).map(o => [o.id, o.polygon.map(mapaParaMundo)]))

function caixaOrientada(footprint: readonly PontoComplexo[], heading: number) {
  const cos = Math.cos(heading), sin = Math.sin(heading)
  const local = footprint.map(p => ({ x: p.x * cos - p.z * sin, z: p.x * sin + p.z * cos }))
  const box = limites(local), localX = (box.minX + box.maxX) / 2, localZ = (box.minZ + box.maxZ) / 2
  return { x: localX * cos + localZ * sin, z: -localX * sin + localZ * cos,
    width: box.maxX - box.minX, depth: box.maxZ - box.minZ, heading }
}
function lote(id: string): LoteComplexo {
  const footprint = footprints[id], door = doors[id]
  let oriented = caixaOrientada(footprint, door?.heading ?? 0)
  if (!door) for (let i = 0; i < footprint.length; i++) {
    const a = footprint[i], b = footprint[(i + 1) % footprint.length]
    const candidate = caixaOrientada(footprint, -Math.atan2(b.z - a.z, b.x - a.x))
    if (candidate.width * candidate.depth < oriented.width * oriented.depth) oriented = candidate
  }
  const { x, z, width, depth, heading } = oriented
  return { id, x, z, center: { x, z }, width, depth, heading, rotation: heading, footprint,
    footprintSource: 'registered-navigation', door, elevated: id === 'estacao' }
}
const lots = Object.fromEntries(['hotel', 'loja', 'chopp', 'praca', 'estacao'].map(id => [id, lote(id)]))
const mapCorners = [{ x: 0, y: 0 }, { x: MAPA_ESTADIO.width, y: 0 },
  { x: MAPA_ESTADIO.width, y: MAPA_ESTADIO.height }, { x: 0, y: MAPA_ESTADIO.height }].map(mapaParaMundo)

/** Portais térreos compartilhados pela estrutura, piso, câmera e torcedores. */
const gates = {
  home: { id: 'mandantes', approach: { x: 0, z: 116 }, threshold: { x: 0, z: 82 }, inside: { x: 0, z: 74 },
    width: 10, height: 4.2, floor: .16, heading: 0 },
  away: { id: 'visitantes', approach: { x: 120, z: 6 }, threshold: { x: 105, z: 6 }, inside: { x: 98, z: 6 },
    width: 8, height: 4.2, floor: .16, heading: Math.PI / 2 },
} as const

/** Planta registrada; medidas da estrutura da arena ficam separadas de seu bloqueio conservador. */
export const PLANTA_COMPLEXO = {
  pitch: { length: 105, width: 68, bounds: { minX: -52.5, maxX: 52.5, minZ: -34, maxZ: 34 } },
  bounds: limites([...mapCorners, ...Object.values(routes).flatMap(r => r.points)]),
  mapFootprint: mapCorners,
  arena: {
    collision: footprints.arena,
    collisionBounds: limites(footprints.arena),
    // Cotas de reconstrução inferidas da referência, ainda ajustáveis na revisão
    // visual. O polígono de bloqueio inclui a portaria e NÃO mede a arquibancada.
    structure: { minX: -105, maxX: 105, minZ: -70, maxZ: 82, centerZ: 6, shape: 'ellipse', roofY: 24 },
    inner: { minX: -76, maxX: 76, minZ: -55, maxZ: 55, shape: 'ellipse' },
    frontAnnex: { minX: -48, maxX: 48, minZ: 82, maxZ: 112 },
    dimensionSource: 'inferred-reference' as const,
  },
  gates,
  presidentBox: { minX: -21, maxX: 21, minZ: 65, maxZ: 79, floor: 9.1, ceiling: 16.5,
    camera: [0, 12.8, 74.5] as const, target: [0, 1, 0] as const },
  lots, doors, routes, footprints,
} as const

/** Estado ativo sem mutação: a compra controla quais colisores existem. */
export function obstaculosComplexo(st?: StadiumSave) {
  if (!estadioVisualValido(st)) return []
  return obstaculosDoEstadio(st).map(o => ({ id: o.id, footprint: o.polygon.map(mapaParaMundo) }))
}

/** A praça contorna fonte/canteiros; visitantes chegam pelo passeio leste. */
export function caminhosTorcidaComplexo(state: EstadoComplexo) {
  return {
    home: [...PLANTA_COMPLEXO.routes[state.extras.asfalto ? 'entrance' : 'entranceBare'].points,
      gates.home.approach, gates.home.threshold, gates.home.inside],
    away: [{ x: 118, z: 49 }, { x: 117, z: 35 }, { x: 117, z: 17 },
      gates.away.approach, gates.away.threshold, gates.away.inside],
  }
}

/** Faixas e piso usam o mesmo encontro de paralelas nas curvas. */
export function deslocarCaminhoComplexo(points: readonly PontoComplexo[], offset: number): PontoComplexo[] {
  return points.map((p, i) => {
    const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)]
    const normal = (a: PontoComplexo, b: PontoComplexo) => {
      const length = Math.hypot(b.x - a.x, b.z - a.z) || 1
      return { x: -(b.z - a.z) / length, z: (b.x - a.x) / length }
    }
    const a = i ? normal(before, p) : normal(p, after), b = i < points.length - 1 ? normal(p, after) : a
    const factor = offset / Math.max(.25, 1 + a.x * b.x + a.z * b.z)
    return { x: p.x + (a.x + b.x) * factor, z: p.z + (a.z + b.z) * factor }
  })
}
