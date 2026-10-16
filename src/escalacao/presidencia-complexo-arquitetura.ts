import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { PLANTA_COMPLEXO, type EstadoComplexo } from './presidencia-complexo-model'
import { criarDetalheCadeirasComplexo, type LoteCadeirasComplexo } from './presidencia-complexo-cadeiras-lod'
import type { AncoraLuzComplexo } from './presidencia-complexo-iluminacao'

type Outline = { x: number; z: number; centerZ: number }
type Range = { from: number; to: number }
export type AssentoComplexo = {
  id: string
  sector: 'geral' | 'cadeiras' | 'visitante' | 'camarote'
  tier: 'lower' | 'upper'
  /** O segundo anel pertence à obra camarote, mas separa as duas torcidas. */
  supporterSide?: 'home' | 'away'
  row: number
  column: number
  position: { x: number; y: number; z: number }
  /** +Z local aponta para o campo; posição Y é o degrau, não o assento. */
  heading: number
  seatHeight: number
}
export type PisoAcessoComplexo = { polygon: readonly { x: number; z: number }[]; y: number }
export type AcessoAssentoComplexo = {
  id: string
  side: 'home' | 'away'
  seatId: string
  seat: AssentoComplexo
  width: number
  /** As arestas repetem XZ com as duas cotas: um degrau nunca vira rampa. */
  points: readonly { x: number; y: number; z: number }[]
  standing: { x: number; y: number; z: number }
  surfaces: readonly PisoAcessoComplexo[]
}
const AISLE_WIDTH = 1.8
const AISLES = 32
const INNER: Outline = { x: PLANTA_COMPLEXO.arena.inner.maxX, z: PLANTA_COMPLEXO.arena.inner.maxZ, centerZ: 0 }
const UPPER: Outline = { x: 87.8, z: 64.5, centerZ: 4 }
const OUTER: Outline = { x: PLANTA_COMPLEXO.arena.structure.maxX, z: (PLANTA_COMPLEXO.arena.structure.maxZ - PLANTA_COMPLEXO.arena.structure.minZ) / 2, centerZ: PLANTA_COMPLEXO.arena.structure.centerZ }
const SECTORS = [
  { id: 'geral', from: .875, to: 1.125 },
  { id: 'cadeiras', from: .5, to: .875 },
  { id: 'visitante', from: .125, to: .5 },
] as const
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0))
const perimeter = (o: Outline) => Math.PI * (3 * (o.x + o.z) - Math.sqrt((3 * o.x + o.z) * (o.x + 3 * o.z)))

/** Contorno oval contínuo, centro norte → leste → sul → oeste. */
function outline(t: number, shape: Outline): THREE.Vector3 {
  const angle = t * Math.PI * 2
  return new THREE.Vector3(Math.sin(angle) * shape.x, 0, shape.centerZ - Math.cos(angle) * shape.z)
}
function tangent(t: number, shape: Outline) {
  return outline(t + .0001, shape).sub(outline(t - .0001, shape)).normalize()
}
function normal(t: number, shape: Outline) {
  const v = tangent(t, shape)
  return new THREE.Vector3(v.z, 0, -v.x)
}
function expanded(o: Outline, amount: number, centerZ = o.centerZ): Outline {
  return { x: o.x + amount, z: o.z + amount,  centerZ }
}

/**
 * Reconstrução volumétrica inferida da referência aprovada, em uma planta fixa.
 * A mesma arena completa é retirada por módulos para apresentar cada compra.
 * A imagem única não fornece medidas de projeto; o registro dessa inferência
 * está separado das pegadas conservadoras que os NPCs já usam.
 */
export function criarArquiteturaComplexo(scene: THREE.Scene, state: EstadoComplexo, options:{interior?:boolean}={}) {
  const root = new THREE.Group()
  root.name = 'estadio-arquitetura-volumetrica'
  scene.add(root)
  const materials: THREE.MeshStandardMaterial[] = []
  const textures: THREE.Texture[] = []
  const geometryBatches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const seatMatrices: THREE.Matrix4[][] = [[], [], []]
  const seatIds: string[][] = [[], [], []]
  const seatPositions: AssentoComplexo[] = []
  const accessSpecs = [
    { side: 'home' as const, portal: .5, aisle: .53125, sector: 'cadeiras' as const, enabled: state.valid && state.lowerComplete },
    { side: 'away' as const, portal: .25, aisle: .21875, sector: 'visitante' as const, enabled: state.valid && state.progress.visitante > .34 },
  ]
  const upperProgress = state.valid && state.lowerComplete ? clamp(state.progress.camarote ?? 0) : 0
  // Caixas internas, fora do camarote. A abertura só nasce quando todo seu
  // trecho de arquibancada existe; uma compra parcial nunca deixa meia escada.
  const upperAccessSpecs = [
    { side: 'home' as const, aisle: .5625, enabled: upperProgress >= .1 },
    { side: 'away' as const, aisle: .21875, enabled: upperProgress >= .75 },
  ].filter(spec => spec.enabled).map(spec => ({ ...spec,
    origin: outline(spec.aisle, UPPER), along: tangent(spec.aisle, UPPER), outward: normal(spec.aisle, UPPER),
    minX: -5.4, maxX: 3.1, minZ: -.65, maxZ: 4.3, minY: 5.74, maxY: 11.2,
  }))
  const seatAccess: AcessoAssentoComplexo[] = []
  const lightAnchors: AncoraLuzComplexo[] = []
  const lowerWalkSurfaces: PisoAcessoComplexo[] = []
  const angularWidth = (t: number, shape: Outline, metres: number) => metres / Math.hypot(Math.cos(t * Math.PI * 2) * shape.x, Math.sin(t * Math.PI * 2) * shape.z) / (Math.PI * 2)
  const portalCuts = accessSpecs.filter(a => a.enabled).map(a => ({
    from: a.portal - angularWidth(a.portal, INNER, 2.2), to: a.portal + angularWidth(a.portal, INNER, 2.2),
  }))
  function openRanges(range: Range) {
    let ranges = [range]
    for (const cut of portalCuts) for (const shift of [-1, 0, 1]) {
      const from = cut.from + shift, to = cut.to + shift
      ranges = ranges.flatMap(r => to <= r.from || from >= r.to ? [r] : [
        ...(from > r.from ? [{ from: r.from, to: from }] : []),
        ...(to < r.to ? [{ from: to, to: r.to }] : []),
      ])
    }
    return ranges
  }
  const inPortalCut = (t: number) => portalCuts.some(c => [t - 1, t, t + 1].some(a => a >= c.from && a <= c.to))
  const counts = { lowerRows: 0, upperRows: 0, facadeModules: 0, seats: 0, roof: false, retractable: false, floodlights: 0, presidentBox: false, gates: [] as string[] }
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0)

  function mat(name: string, color: string, roughness = .82, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ name, color, roughness, metalness })
    materials.push(m)
    return m
  }
  // O concreto permanece claro. Dourado aparece na iluminação e nas cadeiras.
  const concrete = mat('estrutura-concreto-claro', '#c4c2b9')
  const riser = mat('espelhos-concreto', '#969991')
  const paving = mat('passeios-e-lajes', '#d0c9bd', .9)
  const frame = mat('caixilhos-grafite', '#37434b', .44, .35)
  const roof = mat('cobertura-cinza-curva', '#7e8d99', .6, .16)
  const roofSeam = mat('juntas-cobertura', '#526370', .52, .35)
  const warmWall = mat('interior-fachada', '#c3b598', .88)
  warmWall.emissive.set('#bb7937'); warmWall.emissiveIntensity = .07
  const limestone = mat('acabamento-pedra-clara', '#d2cfc2', .76)
  const wood = mat('madeira-camarote', '#856039', .64)
  const glass = mat('fachada-vidros', '#d3c5ac', .12, .04)
  glass.transparent = true; glass.opacity = .22; glass.depthWrite = false; glass.side = THREE.DoubleSide
  glass.envMapIntensity = .85
  // O vidro da janela não deve pintar todo o campo de marrom visto de dentro.
  const boxGlass = mat('janela-panoramica-camarote', '#dde6e6', .1, .01)
  boxGlass.transparent = true; boxGlass.opacity = .085; boxGlass.depthWrite = false; boxGlass.side = THREE.DoubleSide
  boxGlass.envMapIntensity = .55
  const light = mat('luz-interior', '#ffe2a2', .42)
  light.emissive.set('#ffbe62'); light.emissiveIntensity = 1.65
  light.userData.complexoNightEmission = {color:'#ffcf8b',intensity:1.8,dayIntensity:.15}
  const floodlight = mat('lente-refletor', '#e0e6df', .22, .08)
  floodlight.userData.complexoNightEmission = {color:'#edf4ff',intensity:3,dayIntensity:0,stadium:true}
  glass.userData.complexoNightEmission = {color:'#e8bd76',intensity:.23}
  const screen = mat('tela-placar-sem-texto', '#1d302c', .54)
  screen.emissive.set('#28413a'); screen.emissiveIntensity = .2
  const soil = mat('canteiros-terra', '#4d4634', 1)
  const foliage = mat('jardim-terraços', '#42602c', .96)
  const leaves = mat('jardim-folhas', '#5b7938', .91)
  const groundCover = mat('jardim-forracao', '#2b482a', .99)
  const seats = [mat('cadeiras-creme', '#c2b9a3'), mat('cadeiras-grafite', '#677078'), mat('cadeiras-vermelho', '#953e2b')]
  for (const m of seats) { m.side = THREE.DoubleSide; m.roughness = .66 }

  // Microgranulação de material apenas; nenhuma fotografia vira chão ou parede.
  const pixels = new Uint8Array(64 * 64 * 4)
  let seed = 39217
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const v = 224 + (seed >>> 27)
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v; pixels[i + 3] = 255
  }
  const grain = new THREE.DataTexture(pixels, 64, 64)
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(.7, .7)
  grain.colorSpace = THREE.SRGBColorSpace; grain.needsUpdate = true
  grain.magFilter = THREE.LinearFilter; grain.minFilter = THREE.LinearMipmapLinearFilter; grain.generateMipmaps = true
  textures.push(grain)
  limestone.map = grain
  // Concrete pores are millimetres wide, not the previous two-centimetre
  // speckles. Keep their mean albedo, with much less contrast; limestone and
  // every non-concrete finish retain their existing texture and mapping.
  const concretePixels = new Uint8Array(256 * 256 * 4)
  seed = 39217
  for (let i = 0; i < concretePixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const value = 238 + (seed >>> 30)
    concretePixels[i] = concretePixels[i + 1] = concretePixels[i + 2] = value; concretePixels[i + 3] = 255
  }
  const concreteGrain = new THREE.DataTexture(concretePixels, 256, 256)
  concreteGrain.wrapS = concreteGrain.wrapT = THREE.RepeatWrapping; concreteGrain.repeat.set(4, 4)
  concreteGrain.colorSpace = THREE.SRGBColorSpace; concreteGrain.needsUpdate = true
  concreteGrain.magFilter = THREE.LinearFilter; concreteGrain.minFilter = THREE.LinearMipmapLinearFilter; concreteGrain.generateMipmaps = true
  textures.push(concreteGrain)
  concrete.map = concreteGrain; paving.map = concreteGrain; riser.map = concreteGrain
  // Veio de acabamento arquitetônico, sem imagem de sala nem móveis embutidos.
  const woodPixels = new Uint8Array(128 * 128 * 4)
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const vein = Math.sin(x * .34 + Math.sin(y * .035) * 3.2) * .045 + Math.sin(x * 1.8 + y * .06) * .025
    const value = Math.round(255 * (.88 + vein) * (y % 16 === 0 ? .76 : 1))
    const index = (y * 128 + x) * 4
    woodPixels[index] = woodPixels[index + 1] = woodPixels[index + 2] = value
    woodPixels[index + 3] = 255
  }
  const woodTexture = new THREE.DataTexture(woodPixels, 128, 128)
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping
  woodTexture.repeat.set(.5, .5); woodTexture.colorSpace = THREE.SRGBColorSpace
  woodTexture.magFilter = THREE.LinearFilter; woodTexture.minFilter = THREE.LinearMipmapLinearFilter
  woodTexture.generateMipmaps = true; woodTexture.needsUpdate = true
  textures.push(woodTexture); wood.map = woodTexture

  let carveOpenings = true, carveFacadeRoom = false
  type Opening = Pick<(typeof upperAccessSpecs)[number], 'origin' | 'along' | 'outward' | 'minX' | 'maxX' | 'minZ' | 'maxZ' | 'minY' | 'maxY'>
  const room = PLANTA_COMPLEXO.presidentBox
  const officeEnvelope: Opening = {
    origin: new THREE.Vector3(), along: new THREE.Vector3(1, 0, 0), outward: new THREE.Vector3(0, 0, 1),
    minX: room.minX - .175, maxX: room.maxX + .175, minZ: room.minZ - .1, maxZ: room.maxZ + .125,
    minY: room.floor - .3, maxY: room.ceiling + .32,
  }
  // Subtração convexa exata dos vãos físicos. As faces de piso, viga,
  // espelho e fachada recebem o mesmo vão; câmera e NPC não escondem lajes.
  // Conserva UV e normais interpoladas, inclusive nos triângulos recortados.
  function carve(g: THREE.BufferGeometry, openings: readonly Opening[] = upperAccessSpecs) {
    type Vertex = { p: THREE.Vector3; n: THREE.Vector3; uv: THREE.Vector2 }
    for (const opening of openings) {
      const position = g.getAttribute('position'), normalAttribute = g.getAttribute('normal'), uv = g.getAttribute('uv'), index = g.index
      const vertices: Vertex[] = []
      for (let i = 0; i < position.count; i++) vertices.push({
        p: new THREE.Vector3().fromBufferAttribute(position, i), n: new THREE.Vector3().fromBufferAttribute(normalAttribute, i), uv: new THREE.Vector2(uv.getX(i), uv.getY(i)),
      })
      const local = (p: THREE.Vector3, axis: THREE.Vector3) => p.clone().sub(opening.origin).dot(axis)
      if (Math.max(...vertices.map(v => v.p.y)) < opening.minY || Math.min(...vertices.map(v => v.p.y)) > opening.maxY ||
        Math.max(...vertices.map(v => local(v.p, opening.along))) < opening.minX || Math.min(...vertices.map(v => local(v.p, opening.along))) > opening.maxX ||
        Math.max(...vertices.map(v => local(v.p, opening.outward))) < opening.minZ || Math.min(...vertices.map(v => local(v.p, opening.outward))) > opening.maxZ) continue
      const planes = [
        (p: THREE.Vector3) => local(p, opening.along) - opening.minX,
        (p: THREE.Vector3) => opening.maxX - local(p, opening.along),
        (p: THREE.Vector3) => local(p, opening.outward) - opening.minZ,
        (p: THREE.Vector3) => opening.maxZ - local(p, opening.outward),
        (p: THREE.Vector3) => p.y - opening.minY,
        (p: THREE.Vector3) => opening.maxY - p.y,
      ]
      const positions: number[] = [], normals: number[] = [], uvs: number[] = []
      const emit = (polygon: Vertex[]) => { for (let i = 1; i + 1 < polygon.length; i++) for (const v of [polygon[0], polygon[i], polygon[i + 1]]) {
        positions.push(...v.p.toArray()); normals.push(...v.n.toArray()); uvs.push(...v.uv.toArray())
      } }
      for (let i = 0; i < (index?.count ?? position.count); i += 3) {
        let inside = [0, 1, 2].map(k => vertices[index ? index.getX(i + k) : i + k])
        for (const plane of planes) {
          if (!inside.length) break
          const next: Vertex[] = [], outside: Vertex[] = []
          for (let j = 0; j < inside.length; j++) {
            const a = inside[j], b = inside[(j + 1) % inside.length], da = plane(a.p), db = plane(b.p)
            ;(da >= 0 ? next : outside).push(a)
            if ((da >= 0) !== (db >= 0)) {
              const t = da / (da - db), edge = { p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t), uv: a.uv.clone().lerp(b.uv, t) }
              next.push(edge); outside.push(edge)
            }
          }
          emit(outside); inside = next
        }
      }
      const clipped = new THREE.BufferGeometry()
      clipped.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      clipped.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
      clipped.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
      g.dispose(); g = clipped
    }
    return g
  }
  const uvA = new THREE.Vector3(), uvB = new THREE.Vector3(), uvC = new THREE.Vector3()
  const uvAB = new THREE.Vector3(), uvAC = new THREE.Vector3(), uvNormal = new THREE.Vector3()
  const uvU = new THREE.Vector3(), uvV = new THREE.Vector3()
  function concreteUV(g: THREE.BufferGeometry) {
    const positions = g.getAttribute('position'), uv = g.getAttribute('uv')
    if (!uv) return
    // Every face gets an orthonormal metric basis after the physical cuts.
    // Unlike x+z, this keeps one UV unit equal to one metre even on diagonal
    // walls, stair flights and bevels. Only UVs change, never normals/vertices.
    for (let i = 0; i < positions.count; i += 3) {
      uvA.fromBufferAttribute(positions, i); uvB.fromBufferAttribute(positions, i + 1); uvC.fromBufferAttribute(positions, i + 2)
      uvAB.subVectors(uvB, uvA); uvAC.subVectors(uvC, uvA); uvNormal.crossVectors(uvAB, uvAC)
      if (uvNormal.lengthSq() < 1e-20) continue
      uvNormal.normalize()
      if (Math.abs(uvNormal.y) < .9) uvU.set(uvNormal.z, 0, -uvNormal.x).normalize()
      else uvU.set(1, 0, 0).addScaledVector(uvNormal, -uvNormal.x).normalize()
      uvV.crossVectors(uvNormal, uvU)
      uv.setXY(i, uvA.dot(uvU), uvA.dot(uvV))
      uv.setXY(i + 1, uvB.dot(uvU), uvB.dot(uvV))
      uv.setXY(i + 2, uvC.dot(uvU), uvC.dot(uvV))
    }
  }
  function add(g: THREE.BufferGeometry, material: THREE.Material) {
    if (carveOpenings && upperAccessSpecs.length) g = carve(g)
    if (carveFacadeRoom) g = carve(g, [officeEnvelope])
    if (!g.getAttribute('position').count) { g.dispose(); return }

    const uv = g.getAttribute('uv'), p = g.getAttribute('position'), n = g.getAttribute('normal')
    if (uv && n) for (let i = 0; i < p.count; i++) {
      if (Math.abs(n.getY(i)) > .5) uv.setXY(i, p.getX(i), p.getZ(i))
      else uv.setXY(i, p.getX(i) + p.getZ(i), p.getY(i))
    }
    const flat = g.index ? g.toNonIndexed() : g
    if (flat !== g) g.dispose()
    if (material === concrete || material === riser || material === paving) concreteUV(flat)
    const bucket = geometryBatches.get(material) ?? []; bucket.push(flat); geometryBatches.set(material, bucket)
  }
  function box(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, angle = 0) {
    const g = new THREE.BoxGeometry(w, h, d); g.rotateY(angle); g.translate(x, y, z); add(g, material)
  }
  function bevel(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, angle = 0, radius = .035) {
    const g = new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w * .2, h * .2, d * .2))
    g.rotateY(angle); g.translate(x, y, z); add(g, material)
  }
  function beam(material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, width: number, depth = width) {
    const direction = b.clone().sub(a)
    const g = new THREE.BoxGeometry(width, direction.length(), depth)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()))
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
    add(g, material)
  }
  function quad(material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, double = false) {
    const g = new THREE.BufferGeometry()
    const positions = [...a.toArray(), ...b.toArray(), ...c.toArray(), ...d.toArray()], uv = [0, 0, 1, 0, 1, 1, 0, 1]
    // Opposite faces need distinct vertices: shared vertices would average
    // their normals to zero, flattening the lighting on walls and the roof.
    g.setAttribute('position', new THREE.Float32BufferAttribute(double ? [...positions, ...positions] : positions, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(double ? [...uv, ...uv] : uv, 2))
    g.setIndex(double ? [0, 1, 2, 0, 2, 3, 6, 5, 4, 7, 6, 4] : [0, 1, 2, 0, 2, 3])
    g.computeVertexNormals(); add(g, material)
  }
  function strip(material: THREE.Material, range: Range, inside: Outline, outside: Outline, innerY: number, outerY: number, walking = false) {
    const steps = Math.max(1, Math.ceil((range.to - range.from) * 128))
    for (let i = 0; i < steps; i++) {
      const t0 = range.from + (range.to - range.from) * i / steps, t1 = range.from + (range.to - range.from) * (i + 1) / steps
      const vertices = [outline(t0, inside).setY(innerY), outline(t1, inside).setY(innerY),
        outline(t1, outside).setY(outerY), outline(t0, outside).setY(outerY)]
      quad(material, vertices[0], vertices[1], vertices[2], vertices[3])
      if (walking) lowerWalkSurfaces.push({ polygon: vertices.map(p => ({ x: p.x, z: p.z })), y: innerY })
    }
  }
  function ringWall(material: THREE.Material, range: Range, shape: Outline, bottom: number, top: number) {
    const steps = Math.max(1, Math.ceil((range.to - range.from) * 128))
    for (let i = 0; i < steps; i++) {
      const t0 = range.from + (range.to - range.from) * i / steps, t1 = range.from + (range.to - range.from) * (i + 1) / steps
      quad(material, outline(t0, shape).setY(bottom), outline(t0, shape).setY(top),
        outline(t1, shape).setY(top), outline(t1, shape).setY(bottom), true)
    }
  }
  function tier(range: Range, upper: boolean, sector: AssentoComplexo['sector']) {
    if (upper) {
      // The president's box replaces this sector of the upper tier; it is not
      // another building, nor a glass room with seats intersecting its floor.
      const cuts = [.458, .542, 1.458, 1.542].filter(t => t > range.from && t < range.to)
      const points = [range.from, ...cuts, range.to]
      for (let i = 1; i < points.length; i++) {
        const middle = ((points[i] + points[i - 1]) / 2) % 1
        if (middle > .458 && middle < .542) continue
        tierBlock({ from: points[i - 1], to: points[i] }, true, sector)
      }
    } else tierBlock(range, false, sector)
  }
  function tierBlock(range: Range, upper: boolean, sector: AssentoComplexo['sector']) {
    const rows = upper ? 10 : 12, rise = upper ? .66 : .48, depth = upper ? .85 : .9
    const initial = upper ? UPPER : INNER
    const baseY = upper ? 9.1 : .45
    for (let row = 0; row < rows; row++) {
      const inner = expanded(initial, row * depth, upper ? 4 + row / rows * 2 : row / rows * 1.5)
      const outer = expanded(initial, (row + 1) * depth, upper ? 4 + (row + 1) / rows * 2 : (row + 1) / rows * 1.5)
      const y = baseY + row * rise
      // O acesso térreo é um vão de verdade: piso, espelho e viga da
      // arquibancada são recortados juntos, não apenas as cadeiras.
      for (const section of upper ? [range] : openRanges(range)) {
        strip(concrete, section, inner, outer, y, y, !upper)
        ringWall(riser, section, inner, y - rise, y)
      }
      // Ângulos fixos mantêm o mesmo corredor em todas as filas. Cada espelho
      // de .48/.66 m recebe dois/três degraus, com subida máxima de .24 m.
      if (row > 0) for (let aisle = Math.ceil(range.from * AISLES); aisle / AISLES < range.to; aisle++) {
        const t = aisle / AISLES, half = angularWidth(t, inner, AISLE_WIDTH / 2)
        if (t - half < range.from || t + half > range.to || !upper && inPortalCut(t)) continue
        const subdivisions = Math.ceil(rise / .240001)
        for (let step = 1; step < subdivisions; step++) {
          const before = row - 1 + step / subdivisions, after = row - 1 + (step + 1) / subdivisions
          const a = expanded(initial, before * depth, upper ? 4 + before / rows * 2 : before / rows * 1.5)
          const b = expanded(initial, after * depth, upper ? 4 + after / rows * 2 : after / rows * 1.5)
          const top = y - rise + rise * step / subdivisions
          strip(paving, { from: t - half, to: t + half }, a, b, top, top, !upper)
          ringWall(riser, { from: t - half, to: t + half }, a, top - rise / subdivisions, top)
        }
      }
      const line = expanded(inner, .56), length = perimeter(line)
      const n = Math.ceil(length / .59)
      for (let column = Math.ceil(range.from * n); column / n < range.to; column++) {
        const t = (column + .5) / n
        const nearestAisle = Math.round(t * AISLES) / AISLES
        // Inclui a meia largura da cadeira para manter 1.8 m realmente livres.
        if (Math.abs(t - nearestAisle) < angularWidth(nearestAisle, line, AISLE_WIDTH / 2 + .27)) continue
        if (!upper && inPortalCut(t)) continue
        const p = outline(t, line).setY(y), outward = normal(t, line)
        if (upper && upperAccessSpecs.some(opening => {
          const delta = p.clone().sub(opening.origin), x = delta.dot(opening.along), z = delta.dot(opening.outward)
          return x > opening.minX - .35 && x < opening.maxX + .35 && z > opening.minZ - .35 && z < opening.maxZ + .35 && y < opening.maxY + .1
        })) continue
        const angle = Math.atan2(-outward.x, -outward.z)
        quaternion.setFromAxisAngle(up, angle); matrix.compose(p, quaternion, new THREE.Vector3(1, 1, 1))
        const color = (Math.floor(column / 19) + row * 7) % 13 === 0 ? 2 : row % 5 === 0 ? 1 : 0
        const id = `${sector}:${upper ? 'upper' : 'lower'}:${row}:${column}`
        seatMatrices[color].push(matrix.clone()); seatIds[color].push(id); counts.seats++
        seatPositions.push({ id,
          sector, tier: upper ? 'upper' : 'lower', ...(upper ? { supporterSide: ((t % 1 + 1) % 1 >= .125 && (t % 1 + 1) % 1 < .5 ? 'away' : 'home') as 'home' | 'away' } : {}), row, column,
          position: { x: p.x, y: p.y, z: p.z }, heading: angle, seatHeight: .43 })
      }
      if (upper) counts.upperRows++; else counts.lowerRows++
    }
    const rear = expanded(initial, rows * depth, upper ? 6 : 1.5)
    const topY = baseY + (rows - 1) * rise
    for (const section of upper ? [range] : openRanges(range)) {
      strip(paving, section, rear, upper ? OUTER : { x: 99, z: 70, centerZ: 6 }, topY, topY, !upper)
      const guardCuts = upper ? [] : accessSpecs.filter(spec => upperAccessSpecs.some(upper => upper.side === spec.side)).map(spec => {
        const half = angularWidth(spec.aisle, rear, 1.25)
        return { from: spec.aisle - half, to: spec.aisle + half }
      })
      let guardRanges = [section]
      for (const cut of guardCuts) guardRanges = guardRanges.flatMap(r => cut.to <= r.from || cut.from >= r.to ? [r] : [
        ...(cut.from > r.from ? [{ from: r.from, to: cut.from }] : []),
        ...(cut.to < r.to ? [{ from: cut.to, to: r.to }] : []),
      ])
      for (const guardRange of guardRanges) ringWall(concrete, guardRange, rear, topY, topY + .9)
      // Viga sob a arquibancada acompanha o mesmo recorte do corredor térreo.
      strip(riser, section, initial, rear, baseY - .35, topY - .35)
    }
  }
  function buildSeatAccess() {
    for (const spec of accessSpecs) {
      if (!spec.enabled) continue
      const gate = PLANTA_COMPLEXO.gates[spec.side]
      const first = seatPositions.find(seat => seat.sector === spec.sector && seat.tier === 'lower' && seat.row === 0)
      if (!first) continue
      const surfaces: PisoAcessoComplexo[] = []
      const points: { x: number; y: number; z: number }[] = []
      const record = (p: THREE.Vector3) => ({ x: p.x, y: p.y, z: p.z })
      const push = (t: number, radius: number, y: number) => points.push(record(outline(t, expanded(INNER, radius)).setY(y)))
      const floorStrip = (range: Range, inner: Outline, outer: Outline, y: number) => {
        const steps = Math.max(1, Math.ceil((range.to - range.from) * 256))
        for (let i = 0; i < steps; i++) {
          const a = range.from + (range.to - range.from) * i / steps, b = range.from + (range.to - range.from) * (i + 1) / steps
          const vertices = [outline(a, inner), outline(b, inner), outline(b, outer), outline(a, outer)].map(p => p.setY(y))
          quad(paving, vertices[0], vertices[1], vertices[2], vertices[3])
          surfaces.push({ polygon: vertices.map(p => ({ x: p.x, z: p.z })), y })
        }
      }
      const entrance = outline(spec.portal, expanded(INNER, -1.65))
      const corridor = [{ ...gate.inside, y: .16 },
        ...(spec.side === 'away' ? [{ x: 96, y: .16, z: 6 }, { x: 96, y: .16, z: 0 }] : []),
        record(entrance.clone().setY(.16))]
      for (let i = 1; i < corridor.length; i++) {
        const a = corridor[i - 1], b = corridor[i]
        const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2
        const heading = Math.atan2(b.x - a.x, b.z - a.z)
        const depth = Math.hypot(b.x - a.x, b.z - a.z) + .5
        box(paving, cx, .08, cz, 4.4, .16, depth, heading)
        const rectangle = [new THREE.Vector3(-2.2, 0, -depth / 2), new THREE.Vector3(2.2, 0, -depth / 2), new THREE.Vector3(2.2, 0, depth / 2), new THREE.Vector3(-2.2, 0, depth / 2)]
          .map(p => p.applyAxisAngle(up, heading).add(new THREE.Vector3(cx, .16, cz)))
        surfaces.push({ polygon: rectangle.map(p => ({ x: p.x, z: p.z })), y: .16 })
      }
      const walkRange = { from: Math.min(spec.portal, spec.aisle) - .003, to: Math.max(spec.portal, spec.aisle) + .003 }
      floorStrip(walkRange, expanded(INNER, -2.6), expanded(INNER, -.55), .16)
      points.push(...corridor)
      const count = Math.ceil(Math.abs(spec.portal - spec.aisle) * 256)
      for (let i = 1; i <= count; i++) push(spec.portal + (spec.aisle - spec.portal) * i / count, -1.65, .16)
      const half = angularWidth(spec.aisle, INNER, AISLE_WIDTH / 2)
      const stairs = { from: spec.aisle - half, to: spec.aisle + half }
      // Dois espelhos de 14.5 cm entre o térreo .16 e a primeira fila .45.
      floorStrip(stairs, expanded(INNER, -1.05), expanded(INNER, -.55), .305)
      ringWall(riser, stairs, expanded(INNER, -1.05), .16, .305)
      floorStrip(stairs, expanded(INNER, -.55), expanded(INNER, .3), .45)
      ringWall(riser, stairs, expanded(INNER, -.55), .305, .45)
      push(spec.aisle, -1.05, .16); push(spec.aisle, -1.05, .305)
      push(spec.aisle, -.55, .305); push(spec.aisle, -.55, .45)
      push(spec.aisle, .16, .45)
      const commonPoints = [...points], commonSurfaces = [...surfaces]
      const rowShape = (row: number, offset = 0) => expanded(INNER, row * .9 + offset, row * .125)
      // Cada destino é a primeira cadeira ao lado da mesma escada. As opções
      // compartilham piso e degraus reais; uma só é ocupada pelo visitante ativo.
      for (const row of [0, 5, 10]) {
        const inner = rowShape(row), aislePoint = outline(spec.aisle, expanded(inner, .56))
        const candidates = seatPositions.filter(seat => seat.sector === spec.sector && seat.tier === 'lower' && seat.row === row)
        candidates.sort((a, b) => Math.hypot(a.position.x - aislePoint.x, a.position.z - aislePoint.z) - Math.hypot(b.position.x - aislePoint.x, b.position.z - aislePoint.z))
        const seat = candidates[0]
        if (!seat || Math.hypot(seat.position.x - aislePoint.x, seat.position.z - aislePoint.z) > 2.2) continue
        const route = [...commonPoints], floors = [...commonSurfaces]
        for (let level = 1; level <= row; level++) {
          const edge = rowShape(level - .5), after = rowShape(level)
          const floor = .45 + (level - 1) * .48
          const e = outline(spec.aisle, edge), p = outline(spec.aisle, after)
          route.push(record(e.clone().setY(floor)), record(e.setY(floor + .24)),
            record(p.clone().setY(floor + .24)), record(p.setY(floor + .48)))
        }
        const front = row === 0 ? .4 : .31
        const standing = { x: seat.position.x + Math.sin(seat.heading) * front, y: seat.position.y, z: seat.position.z + Math.cos(seat.heading) * front }
        const angle = Math.atan2(seat.position.x / (inner.x + .56), -(seat.position.z - inner.centerZ) / (inner.z + .56)) / (Math.PI * 2)
        const normalized = angle < 0 ? angle + 1 : angle
        const rowRange = { from: Math.min(spec.aisle, normalized) - .0015, to: Math.max(spec.aisle, normalized) + .0015 }
        if (row === 0) {
          // Mantém o pequeno avanço já construído da primeira fila. Nas filas
          // seguintes o giro fica inteiramente no patamar, longe dos encostos.
          floorStrip(rowRange, expanded(INNER, -.18), INNER, .45)
          ringWall(riser, rowRange, expanded(INNER, -.18), .16, .45)
          floors.push(...surfaces.slice(commonSurfaces.length))
        } else route.push(record(outline(spec.aisle, expanded(inner, .25)).setY(seat.position.y)))
        route.push(standing)
        const minX = Math.min(...route.map(p => p.x)) - 1.5, maxX = Math.max(...route.map(p => p.x)) + 1.5
        const minZ = Math.min(...route.map(p => p.z)) - 1.5, maxZ = Math.max(...route.map(p => p.z)) + 1.5
        // As mesmas faces que chegaram ao mesh: não aproximar uma curva por
        // outro quadrilátero, o que abriria pequenas frestas só no contrato.
        floors.push(...lowerWalkSurfaces.filter(surface => surface.y <= seat.position.y + .001 &&
          Math.max(...surface.polygon.map(p => p.x)) >= minX && Math.min(...surface.polygon.map(p => p.x)) <= maxX &&
          Math.max(...surface.polygon.map(p => p.z)) >= minZ && Math.min(...surface.polygon.map(p => p.z)) <= maxZ))
        seatAccess.push({ id: `acesso-${spec.side}-${seat.id}`, side: spec.side, seatId: seat.id, seat, width: AISLE_WIDTH,
          points: route, standing, surfaces: floors })
      }
      const upperSpec = upperAccessSpecs.find(upper => upper.side === spec.side)
      if (upperSpec) buildUpperSeatAccess(spec, upperSpec, commonPoints, commonSurfaces)
    }
  }
  function buildUpperSeatAccess(spec: typeof accessSpecs[number], opening: typeof upperAccessSpecs[number], commonPoints: { x: number; y: number; z: number }[], commonSurfaces: PisoAcessoComplexo[]) {
    const record = (p: THREE.Vector3) => ({ x: p.x, y: p.y, z: p.z })
    const at = (x: number, z: number, y: number) => opening.origin.clone().addScaledVector(opening.along, x).addScaledVector(opening.outward, z).setY(y)
    const route = [...commonPoints], floors = [...commonSurfaces]
    const rowShape = (row: number, offset = 0) => expanded(INNER, row * .9 + offset, row * .125)
    for (let row = 1; row <= 11; row++) {
      const floor = .45 + (row - 1) * .48, edge = outline(spec.aisle, rowShape(row - .5)), after = outline(spec.aisle, rowShape(row))
      route.push(record(edge.clone().setY(floor)), record(edge.setY(floor + .24)), record(after.clone().setY(floor + .24)), record(after.setY(floor + .48)))
    }
    const galleryY = .45 + 11 * .48, galleryShape = expanded(INNER, 11.25, 1.5)
    if (opening.aisle !== spec.aisle) route.push(record(outline(spec.aisle, galleryShape).setY(galleryY)))
    const arcs = Math.ceil(Math.abs(opening.aisle - spec.aisle) * 512)
    for (let step = 1; step <= arcs; step++) route.push(record(outline(spec.aisle + (opening.aisle - spec.aisle) * step / arcs, galleryShape).setY(galleryY)))
    const append = (x: number, z: number, y: number) => route.push(record(at(x, z, y)))
    const platform = (minX: number, maxX: number, minZ: number, maxZ: number, y: number, thickness = .18) => {
      const vertices = [at(minX, minZ, y), at(maxX, minZ, y), at(maxX, maxZ, y), at(minX, maxZ, y)]
      const center = at((minX + maxX) / 2, (minZ + maxZ) / 2, y - thickness / 2)
      const heading = Math.atan2(-opening.along.z, opening.along.x)
      box(paving, center.x, center.y, center.z, maxX - minX, thickness, maxZ - minZ, heading)
      floors.push({ polygon: vertices.map(p => ({ x: p.x, z: p.z })), y })
    }
    // Piso inferior da caixa prolonga a galeria. O patamar superior é laje
    // com pé-direito livre, sustentada fora da circulação, nunca bloco sólido.
    platform(-5.45, 3.05, -.65, 4.25, galleryY)
    platform(-5.45, -2.35, -.65, 3.8, 9.1)
    const rise = (9.1 - galleryY) / 15
    platform(.8, 2.4, -.1, 3.8, galleryY + 8 * rise)
    for (const [x, z] of [[-5.2, 3.55], [-2.6, 1.9], [2.15, 3.55], [2.15, .1]]) {
      const top = x < 0 ? 9.1 : galleryY + 8 * rise, p = at(x, z, (galleryY + top) / 2)
      box(concrete, p.x, p.y, p.z, .22, top - galleryY, .22)
    }
    // Dois lances de 1.8 m (1.6 m entre corrimãos) e pisos de 45 cm. As cotas são
    // as faces exatas das caixas, inclusive no retorno do mesmo personagem.
    append(-3.5, -.42, galleryY); append(-3.5, .8, galleryY)
    for (let step = 0; step < 8; step++) {
      const x = -2.8 + step * .45, before = galleryY + step * rise, y = before + rise
      platform(x, x + .45, -.1, 1.7, y, y - galleryY)
      append(x, .8, before); append(x, .8, y)
    }
    append(1.55, .8, galleryY + 8 * rise); append(1.55, 2.8, galleryY + 8 * rise)
    for (let step = 0; step < 7; step++) {
      const x = .8 - step * .45, before = galleryY + (8 + step) * rise, y = before + rise
      platform(x - .45, x, 1.9, 3.7, y, y - galleryY)
      append(x, 2.8, before); append(x, 2.8, y)
    }
    // Corrimãos estão sobre os próprios pisos e deixam o eixo dos dois
    // lances e os giros dos patamares livres para o corpo inteiro.
    for (const flight of [
      { steps: 8, start: -2.8, direction: 1, low: 0, edges: [-.04, 1.64] },
      { steps: 7, start: .8, direction: -1, low: 8, edges: [1.96, 3.64] },
    ]) for (const z of flight.edges) {
      const rail: THREE.Vector3[] = []
      for (const step of [0, 3, flight.steps - 1]) {
        const x = flight.start + flight.direction * (step + .5) * .45, floor = galleryY + (flight.low + step + 1) * rise
        beam(frame, at(x, z, floor), at(x, z, floor + 1.03), .045)
        rail.push(at(x, z, floor + 1.03))
      }
      beam(frame, rail[0], rail[2], .06)
    }
    for (const [x, z0, z1, floor] of [[2.31, -.02, 3.7, galleryY + 8 * rise], [-5.33, 1, 3.65, 9.1]]) {
      for (const z of [z0, (z0 + z1) / 2, z1]) beam(frame, at(x, z, floor), at(x, z, floor + 1.03), .045)
      beam(frame, at(x, z0, floor + 1.03), at(x, z1, floor + 1.03), .06)
    }
    append(-3.5, 2.8, 9.1); append(-3.5, .25, 9.1)
    const candidates = seatPositions.filter(seat => seat.tier === 'upper' && seat.row === 0).map(seat => {
      const delta = new THREE.Vector3(seat.position.x, 0, seat.position.z).sub(opening.origin)
      return { seat, x: delta.dot(opening.along), z: delta.dot(opening.outward) }
    }).filter(candidate => candidate.x < opening.minX - .25 && candidate.x > opening.minX - 2 && Math.abs(candidate.z - .56) < .75)
    candidates.sort((a, b) => b.x - a.x)
    const seat = candidates[0]?.seat
    if (!seat) return
    const standing = { x: seat.position.x + Math.sin(seat.heading) * .31, y: seat.position.y, z: seat.position.z + Math.cos(seat.heading) * .31 }
    // Pequena ponte de chegada acompanha a curva da primeira fila; o apoio
    // é um piso renderizado e não uma coordenada projetada no vazio da caixa.
    const target = new THREE.Vector3(standing.x, 0, standing.z).sub(opening.origin), targetX = target.dot(opening.along), targetZ = target.dot(opening.outward)
    platform(targetX - .35, -2.35, Math.min(-.1, targetZ - .35), Math.max(.65, targetZ + .35), 9.1)
    route.push(standing)
    const minX = Math.min(...route.map(p => p.x)) - 1.5, maxX = Math.max(...route.map(p => p.x)) + 1.5
    const minZ = Math.min(...route.map(p => p.z)) - 1.5, maxZ = Math.max(...route.map(p => p.z)) + 1.5
    floors.push(...lowerWalkSurfaces.filter(surface => surface.y <= 9.101 &&
      Math.max(...surface.polygon.map(p => p.x)) >= minX && Math.min(...surface.polygon.map(p => p.x)) <= maxX &&
      Math.max(...surface.polygon.map(p => p.z)) >= minZ && Math.min(...surface.polygon.map(p => p.z)) <= maxZ))
    seatAccess.push({ id: `acesso-${spec.side}-${seat.id}`, side: spec.side, seatId: seat.id, seat, width: 1.6,
      points: route, standing, surfaces: floors })
  }
  function inGate(p: THREE.Vector3) {
    return Math.abs(p.x) < 6.5 && p.z > 73 || p.x > 97 && Math.abs(p.z - 6) < 5.5
  }
  function facade(range: Range, upper: boolean) {
    // The oval skin remains outside the box. Its former apartment walls,
    // slabs and diagonal braces must stop at the office envelope, instead of
    // crossing the bought cabinet and its trophies. The room supplies its own
    // floor, ceiling and walls later; this cut never moves or hides furniture.
    const previousCarve = carveFacadeRoom
    carveFacadeRoom = upper
    const start = upper ? 8.3 : .2, height = upper ? 8.4 : 7.8
    const moduleCount = 64
    for (let module = Math.floor(range.from * moduleCount); module / moduleCount < range.to; module++) {
      const t0 = Math.max(range.from, module / moduleCount), t1 = Math.min(range.to, (module + 1) / moduleCount)
      if (t1 <= t0) continue
      const t = (t0 + t1) / 2, a = outline(t0, OUTER), b = outline(t1, OUTER), p = outline(t, OUTER), outward = normal(t, OUTER)
      const direction = b.clone().sub(a), angle = -Math.atan2(direction.z, direction.x), width = direction.length()
      // Lajes e pilares modelados deixam profundidade entre a pele de vidro e o interior.
      box(concrete, p.x, start + height - .15, p.z, width + .1, .45, 2.1, angle)
      if (upper || !inGate(a)) {
        if (p.z > 20) bevel(concrete, a.x, start + height / 2, a.z, .64, height, 1.15, angle)
        else box(concrete, a.x, start + height / 2, a.z, .64, height, 1.15, angle)
      }
      const frontPortal = inGate(p) || inGate(a) || inGate(b)
      for (const level of [0, 1]) {
        const y = start + 1.85 + level * 3.8
        if (!upper && frontPortal && level === 0) continue
        const behind = p.clone().addScaledVector(outward, -3.4)
        box(warmWall, behind.x, y, behind.z, Math.max(.12, width - .75), 3.3, .18, angle)
        const room = p.clone().addScaledVector(outward, -1.75)
        box(paving, room.x, y - 1.62, room.z, Math.max(.12, width - .72), .12, 3.5, angle)
        box(concrete, room.x, y + 1.6, room.z, Math.max(.12, width - .72), .13, 3.5, angle)
        const lateral = direction.clone().normalize()
        for (const sign of [-1, 1]) {
          const jamb = room.clone().addScaledVector(lateral, sign * Math.max(.1, width / 2 - .42))
          box(warmWall, jamb.x, y, jamb.z, .14, 3.15, 3.4, angle)
        }
        box(glass, p.x, y, p.z, Math.max(.12, width - .75), 3.15, .055, angle)
        for (const offset of [-.28, .28]) {
          const post = p.clone().addScaledVector(direction.clone().normalize(), width * offset)
          box(frame, post.x, y, post.z, .075, 3.25, .14, angle)
        }
        box(frame, p.x, y - 1.56, p.z, Math.max(.12, width - .3), .08, .15, angle)
        // Peitoril e pingadeira estreitos amarram os vidros aos pilares reais.
        const sill = p.clone().addScaledVector(outward, .08)
        box(limestone, sill.x, y - 1.48, sill.z, Math.max(.12, width - .56), .11, .38, angle)
        if (p.z > 20) {
          if (module % 2 === 0) bevel(limestone, sill.x, y + 1.52, sill.z, Math.max(.12, width - .48), .12, .34, angle, .012)
          else box(limestone, sill.x, y + 1.52, sill.z, Math.max(.12, width - .48), .12, .34, angle)
        }
        const lighting = p.clone().addScaledVector(outward, -.65)
        box(light, lighting.x, y + 1.36, lighting.z, width * .74, .08, .13, angle)
        // Nichos e vasos recuados aparecem atrás do vidro como na fachada da arte.
        if (module % 4 === 1 && width > 4) garden(room.x, room.z, y - 1.56, 1.5, .82, angle)
      }
      if (module % 2 === 0 && p.z > 20 && (upper || !frontPortal)) {
        const sconce = a.clone().addScaledVector(outward, .61)
        box(frame, sconce.x, start + 2.25, sconce.z, .16, .5, .18, angle)
        sconce.addScaledVector(outward, .11)
        box(light, sconce.x, start + 2.25, sconce.z, .09, .28, .035, angle)
      }
      if (module % 2 === 0 && !frontPortal) {
        const inner = outline(t, upper ? { x: 88, z: 67, centerZ: 6 } : { x: 75, z: 56, centerZ: 1.5 })
        beam(concrete, a.clone().setY(.2), inner.setY(upper ? 13.7 : 5.7), .62, .9)
      }
      counts.facadeModules++
    }
    carveFacadeRoom = previousCarve
  }
  function garden(x: number, z: number, y: number, width: number, depth: number, angle = 0) {
    box(concrete, x, y + .35, z, width, .7, depth, angle)
    box(soil, x, y + .72, z, width - .35, .04, depth - .35, angle)
    const n = Math.max(1, Math.ceil(width / 1.7))
    for (let i = 0; i < n; i++) {
      const dx = -width / 2 + .8 + i * (width - 1.6) / Math.max(1, n - 1)
      const px = x + Math.cos(angle) * dx, pz = z - Math.sin(angle) * dx
      // Forração compacta junto à terra, arbustos em alturas variadas e uma
      // borda de folhas pequenas; evita a antiga fileira de poliedros grandes.
      const cover = new THREE.SphereGeometry(.55, 6, 4)
      cover.scale(1.2, .26, Math.min(.82, depth * .65))
      cover.translate(px, y + .78, pz); add(cover, groundCover)
      const h = .39 + (i % 3) * .11
      const shrub = new THREE.SphereGeometry(1, 7, 5)
      const vertices = shrub.getAttribute('position')
      for (let v = 0; v < vertices.count; v++) {
        const vx = vertices.getX(v), vy = vertices.getY(v), vz = vertices.getZ(v)
        const wave = 1 + .11 * Math.sin(vx * 9 + i) * Math.cos(vz * 13 - vy * 7)
        vertices.setXYZ(v, vx * .43 * wave, vy * h * wave, vz * Math.min(.38, depth * .36) * wave)
      }
      shrub.computeVertexNormals(); shrub.translate(px, y + .97 + h * .3, pz)
      add(shrub, foliage)
      for (let leaf = 0; leaf < 8; leaf++) {
        const theta = leaf * 2.399 + i * .9
        const blade = new THREE.OctahedronGeometry(1)
        blade.scale(.075, .017, .15)
        blade.rotateX(.2 + (leaf % 4) * .47); blade.rotateY(theta)
        blade.translate(px + Math.sin(theta) * .4, y + .93 + (leaf % 3) * h * .5,
          pz + Math.cos(theta) * Math.min(.36, depth * .33))
        add(blade, leaf % 3 === 0 ? foliage : leaves)
      }
    }
  }
  function frontAnnex() {
    // Public pedestrian forecourt at ground level. No road, car bay or ramp
    // climbs to the presidential box; that room belongs inside the stadium.
    box(paving, 0, .08, 97, 96, .16, 30)
    for (const x of [-32, 32]) garden(x, 100, .16, 20, 3)
  }
  function entranceGates() {
    for (const [side, gate] of Object.entries(PLANTA_COMPLEXO.gates)) {
      const built = side === 'home' ? state.lowerComplete : state.progress.visitante > .34
      if (!built) continue
      const { threshold: p, inside, width, heading, height, floor } = gate
      const depth = Math.hypot(p.x - inside.x, p.z - inside.z) + 2
      const cx = (p.x + inside.x) / 2, cz = (p.z + inside.z) / 2
      box(paving, cx, floor / 2, cz, width, floor, depth, heading)
      for (const sign of [-1, 1]) {
        const dx = Math.cos(heading) * sign * (width / 2 + .3), dz = -Math.sin(heading) * sign * (width / 2 + .3)
        bevel(concrete, cx + dx, floor + height / 2, cz + dz, .6, height, depth, heading)
        box(frame, p.x + dx, floor + height / 2, p.z + dz, .12, height, .14, heading)
        box(limestone, p.x + dx, floor + height / 2, p.z + dz, .34, height, .2, heading)
      }
      bevel(concrete, cx, floor + height + .15, cz, width + 1.2, .3, depth, heading)
      box(limestone, p.x, floor + height + .055, p.z, width + 1.2, .11, .24, heading)
      box(light, p.x, floor + height - .12, p.z, width - .4, .07, .16, heading)
      // Luminárias de forro acompanham o corredor sem pôr poste na passagem.
      for (const t of [.3, .7]) {
        const lx = p.x + (inside.x - p.x) * t, lz = p.z + (inside.z - p.z) * t
        box(frame, lx, floor + height - .04, lz, width * .66, .055, .23, heading)
        box(light, lx, floor + height - .074, lz, width * .62, .022, .15, heading)
      }
      counts.gates.push(side)
    }
  }
  function presidentialBox() {
    const { minX, maxX, minZ, maxZ, floor, ceiling } = PLANTA_COMPLEXO.presidentBox
    const width = maxX - minX, depth = maxZ - minZ, centerZ = (minZ + maxZ) / 2
    box(wood, 0, floor - .15, centerZ, width, .3, depth)
    box(concrete, 0, ceiling + .16, centerZ, width, .32, depth)
    for (const x of [minX, maxX]) box(warmWall, x, (floor + ceiling) / 2, centerZ, .35, ceiling - floor, depth)
    // Rear wall has its internal concourse doorway. No exterior vehicle access.
    for (const x of [-12, 12]) box(warmWall, x, (floor + ceiling) / 2, maxZ, 18, ceiling - floor, .25)
    box(warmWall, 0, ceiling - 1.7, maxZ, 6, 3.4, .25)
    box(boxGlass, 0, (floor + ceiling) / 2, minZ, width - .5, ceiling - floor - .3, .045)
    for (const x of [minX, -14, -7, 7, 14, maxX]) bevel(frame, x, (floor + ceiling) / 2, minZ, .09, ceiling - floor, .12, 0, .008)
    for (const y of [floor + .1, ceiling - .1]) bevel(frame, 0, y, minZ, width, .12, .16, 0, .008)
    // Acabamentos fixos da sala: nada ocupa o eixo entre câmera e janela, e
    // nenhum móvel de compra aparece embutido nesta arquitetura.
    for (const side of [-1, 1]) {
      const x = side < 0 ? minX + .21 : maxX - .21
      box(wood, x, floor + .55, centerZ, .065, 1.0, depth - .25)
      box(frame, x, floor + .08, centerZ, .075, .12, depth - .25)
      box(wood, side * 12, floor + 2.05, maxZ - .16, 17.7, 4.05, .065)
      box(limestone, side * 12, floor + 4.12, maxZ - .18, 17.7, .12, .1)
      for (let panel = 0; panel < 6; panel++)
        box(frame, side * (3.3 + panel * 2.95), floor + 2.05, maxZ - .2, .022, 4.05, .025)
      box(wood, x - side * .32, ceiling - .11, centerZ, .8, .22, depth - .2)
      box(light, x - side * .76, ceiling - .18, centerZ, .055, .035, depth - .8)
      for (const z of [minZ + 3.2, maxZ - 3.2]) {
        box(frame, x - side * .3, ceiling - .25, z, .42, .035, .42)
        box(light, x - side * .3, ceiling - .275, z, .28, .018, .28)
      }
    }
    for (const z of [minZ + .4, maxZ - .4]) {
      box(wood, 0, ceiling - .11, z, width - .2, .22, .8)
      box(light, 0, ceiling - .18, z + (z < centerZ ? .45 : -.45), width - 1.5, .035, .055)
    }
    // Fixed recessed downlights: the light source touches the actual ceiling.
    for (const [x, z] of [[-6.4, 72.4], [8, 74.1]]) {
      box(frame, x, ceiling - .015, z, .42, .035, .42)
      box(light, x, ceiling - .042, z, .28, .018, .28)
    }
    counts.presidentBox = true
  }
  function roofShell() {
    const shapes = [
      { x: 64, z: 66, centerZ: 6 },
      { x: 79, z: 69, centerZ: 6 },
      { x: 94, z: 72, centerZ: 6 }, OUTER,
    ]
    const height = (t: number, band: number) => {
      const raw = Math.max(0, Math.min(1, (Math.abs(Math.sin(t * Math.PI * 2)) - .35) / .4))
      const side = raw * raw * (3 - 2 * raw)
      return [18.2, 18.5, 18.7, 18.2][band] + [5, 6.7, 6.8, 4][band] * side
    }
    // Grandes abas laterais altas; testeiras estreitas e mais baixas deixam
    // campo e arquibancadas expostos como na referência, sem formar um donut.
    for (let i = 0; i < 128; i++) {
      const t0 = i / 128, t1 = (i + 1) / 128
      for (let band = 0; band < shapes.length - 1; band++) {
        quad(roof, outline(t0, shapes[band]).setY(height(t0, band)), outline(t1, shapes[band]).setY(height(t1, band)),
          outline(t1, shapes[band + 1]).setY(height(t1, band + 1)), outline(t0, shapes[band + 1]).setY(height(t0, band + 1)))
        quad(roofSeam, outline(t0, shapes[band + 1]).setY(height(t0, band + 1) - .22), outline(t1, shapes[band + 1]).setY(height(t1, band + 1) - .22),
          outline(t1, shapes[band]).setY(height(t1, band) - .22), outline(t0, shapes[band]).setY(height(t0, band) - .22))
      }
      for (const band of [0, 3]) quad(roofSeam,
        outline(t0, shapes[band]).setY(height(t0, band) - .38), outline(t0, shapes[band]).setY(height(t0, band) + .06),
        outline(t1, shapes[band]).setY(height(t1, band) + .06), outline(t1, shapes[band]).setY(height(t1, band) - .38), true)
    }
    for (let i = 0; i < 64; i++) {
      const t = i / 64
      for (let band = 0; band < shapes.length - 1; band++) {
        const a = outline(t, shapes[band]).setY(height(t, band) + .03), b = outline(t, shapes[band + 1]).setY(height(t, band + 1) + .03)
        beam(roofSeam, a, b, .065, .065)
        if (i % 4 === 0) {
          beam(concrete, a.clone().add(new THREE.Vector3(0, -.5, 0)), b.clone().add(new THREE.Vector3(0, -.5, 0)), .25, .3)
          const c = outline(t, OUTER).setY(16.7)
          if (band === 2) beam(concrete, c, b, .55, .7)
        }
      }
    }
    counts.roof = true
    if (state.floodlit) for (const t of [.125,.375,.625,.875]) {
      // Lamps are attached below the real inner roof edge. The closed leaves
      // cannot be lit from an external tower through their opaque geometry.
      const p=outline(t,shapes[0]),y=height(t,0)-.65,angle=-t*Math.PI*2
      box(frame,p.x,y+.25,p.z,.12,.5,.12)
      box(frame,p.x,y-.05,p.z,2.8,.25,.9,angle)
      box(floodlight,p.x,y-.19,p.z,2.55,.035,.73,angle)
      lightAnchors.push({id:`cobertura-refletor-${t}`,kind:'roof',position:[p.x,y-.24,p.z],
        target:[p.x*.3,.2,(p.z-6)*.2],color:'#edf4ff',intensity:11000,distance:125,angle:.96})
    }
    if (state.extras.retratil) {
      // Guides follow the same oval opening. Rectangular tracks and leaves
      // would project beyond the curved shell near its north/south corners.
      for (let i = 0; i < 128; i++) {
        const t0 = i / 128, t1 = (i + 1) / 128
        beam(roofSeam, outline(t0, shapes[0]).setY(height(t0, 0) + .15),
          outline(t1, shapes[0]).setY(height(t1, 0) + .15), .14, .18)
      }
      if (!state.roofClosed) for (const range of [{ from: .125, to: .375 }, { from: .625, to: .875 }]) {
        strip(roof, range, expanded(shapes[0], .4), expanded(shapes[0], 3.2), 23.55, 23.8)
      }
    }
    if (state.roofClosed) {
      // Two leaves meet on the longitudinal seam and seal the actual opening.
      // Their edge heights match the shell, without a floating rectangular lid.
      for (let side = 0; side < 2; side++) for (let i = 0; i < 64; i++) {
        const t0 = side / 2 + i / 128, t1 = side / 2 + (i + 1) / 128
        const p0 = outline(t0, shapes[0]).setY(height(t0, 0)), p1 = outline(t1, shapes[0]).setY(height(t1, 0))
        const c0 = p0.clone().setX(0), c1 = p1.clone().setX(0)
        quad(roof, c0, p0, p1, c1, true)
        if (i % 8 === 4) beam(roofSeam, c0.clone().add(new THREE.Vector3(0, .04, 0)), p0.clone().add(new THREE.Vector3(0, .04, 0)), .065)
        if (side === 0) beam(roofSeam, c0.clone().add(new THREE.Vector3(0, .08, 0)), c1.clone().add(new THREE.Vector3(0, .08, 0)), .10)
      }
      counts.retractable = true
    }
  }

  if (state.valid) {
    for (const sector of SECTORS) {
      const progress = clamp(state.progress[sector.id] ?? 0)
      if (!progress) continue
      const range = { from: sector.from, to: sector.from + (sector.to - sector.from) * progress }
      tier(range, false, sector.id); facade(range, false)
    }
    const upperProgress = state.lowerComplete ? clamp(state.progress.camarote ?? 0) : 0
    if (upperProgress > 0) {
      const range = { from: .5, to: .5 + upperProgress }
      tier(range, true, 'camarote'); facade(range, true)
    }
    if (state.lowerComplete) frontAnnex()
    entranceGates()
    // The office screen has always been available before buying the upper tier.
    // Its interior uses the same room mesh, without granting an exterior tier.
    if (upperProgress > 0 || options.interior===true) presidentialBox()
    if (state.roofBuilt && state.upperComplete && (state.progress.grama ?? 0) > 0) roofShell()
    // A obra física acompanha a compra válida; acender continua seguindo o
    // estado de iluminação do jogo, que também considera o avanço do gramado.
    if (state.extras.refl && state.progress.geral === 1) for (const x of [-72, 72]) for (const z of [-52, 57]) {
      box(frame, x, 15, z, .65, 30, .65)
      box(concrete, x, .45, z, 2.2, .9, 2.2)
      box(frame, x, 29.8, z, 5.4, 2.1, .4)
      for (let i = 0; i < 5; i++) for (const y of [29.3, 30.3]) box(state.floodlit ? floodlight : concrete, x - 2.1 + i * 1.05, y, z + (z < 0 ? .25 : -.25), .76, .55, .16)
      lightAnchors.push({id:`torre-refletor-${x}-${z}`,kind:'tower',position:[x,29.8,z+(z<0?.4:-.4)],
        target:[x*.28,.2,z*.16],color:'#edf4ff',intensity:22000,distance:180,angle:.70})
      counts.floodlights++
    }
    if (state.screenVisible) {
      box(frame, 0, 17.2, -66, 15.8, 8.2, .85)
      box(screen, 0, 17.2, -65.55, 14.6, 6.9, .07)
      for (const x of [-6.7, 6.7]) box(concrete, x, 9.2, -66, .7, 18, .7)
    }
  }

  carveOpenings = false
  buildSeatAccess()

  for (const [material, pieces] of geometryBatches) {
    const geometry = mergeGeometries(pieces, false)
    for (const piece of pieces) piece.dispose()
    if (!geometry) continue
    geometry.computeBoundingSphere()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = material.name
    mesh.castShadow = material !== glass && material !== boxGlass && material !== light
    mesh.receiveShadow = material !== glass && material !== boxGlass && material !== light
    root.add(mesh)
  }
  geometryBatches.clear()
  // Assento curvo simples com bordo frontal real. Compartilhado por todas as cópias.
  const seat = new THREE.BufferGeometry()
  seat.setAttribute('position', new THREE.Float32BufferAttribute([
    -.225, .43, .18, .225, .43, .18, .225, .43, -.2, -.225, .43, -.2,
    -.225, .91, -.29, .225, .91, -.29,
    -.225, .38, .18, .225, .38, .18,
  ], 3))
  seat.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4, 6, 7, 1, 6, 1, 0]); seat.computeVertexNormals()
  const distantSeats: LoteCadeirasComplexo[] = []
  seatMatrices.forEach((positions, i) => {
    if (!positions.length) return
    const mesh = new THREE.InstancedMesh(seat, seats[i], positions.length)
    mesh.name = seats[i].name
    positions.forEach((m, index) => mesh.setMatrixAt(index, m))
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere()
    mesh.castShadow = true; mesh.receiveShadow = true
    root.add(mesh); distantSeats.push({ mesh, ids: seatIds[i] })
  })
  const chairDetail = criarDetalheCadeirasComplexo(root, seatPositions, distantSeats)
  root.userData = { ...counts, complexoLights: lightAnchors, plant: 'reference-inferred-oval', structure: PLANTA_COMPLEXO.arena.structure, portals: PLANTA_COMPLEXO.gates, box: counts.presidentBox ? PLANTA_COMPLEXO.presidentBox : null, presidentialDriveway: false, accessibleSeats: seatAccess.map(a => ({ side: a.side, seatId: a.seatId, tier: a.seat.tier, row: a.seat.row })) }
  return {
    root, counts, bounds: PLANTA_COMPLEXO.arena.structure, seats: seatPositions as readonly AssentoComplexo[], seatAccess: seatAccess as readonly AcessoAssentoComplexo[],
    updateSeats: chairDetail.update, inspectSeatDetail: chairDetail.inspect,
    dispose() {
      chairDetail.dispose()
      root.removeFromParent()
      const geometries = new Set<THREE.BufferGeometry>([seat])
      root.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry) })
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
      root.clear()
    },
  }
}
