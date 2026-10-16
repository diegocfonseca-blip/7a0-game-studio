import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { carteiraPresidenciaValida, type PresidenciaCarteira } from './presidencia-economia'
import { PLANTA_COMPLEXO, type EstadoComplexo } from './presidencia-complexo-model'

const FURNITURE = ['cadeira-simples', 'mesa-simples', 'estante-simples', 'cadeira-couro', 'mesa-madeira', 'estante-madeira', 'tapete', 'sofa', 'luminaria', 'lustre', 'quadro', 'aquario', 'planta'] as const
type FurnitureId = typeof FURNITURE[number]
type WalletStatus = 'missing' | 'invalid' | 'valid'
type Bounds = { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }
type Placement = { id: FurnitureId; support: 'floor' | 'ceiling' | 'wall'; bounds: Bounds }
const UP = new THREE.Vector3(0, 1, 0)
const isFurniture = (id: string): id is FurnitureId => (FURNITURE as readonly string[]).includes(id)

/** Read-only presentation of the existing wallet. No default furniture, trophy,
 * identity or substitute president is granted. The room stays usable before
 * this physical box is built through the existing SalaMontagem presentation. */
export function criarMobiliaComplexo(scene: THREE.Scene, state: EstadoComplexo, wallet?: PresidenciaCarteira | null) {
  const root = new THREE.Group(); root.name = 'complexo-mobilia-presidencia'; scene.add(root)
  const { floor, ceiling } = PLANTA_COMPLEXO.presidentBox
  const available = state.valid && state.lowerComplete && state.progress.camarote > 0
  const materials: THREE.MeshStandardMaterial[] = []
  const material = (name: string, color: string, roughness = .7, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ name: `mobilia-${name}`, color, roughness, metalness }); materials.push(m); return m
  }
  const walnut = material('nogueira', '#65452e', .57), edge = material('madeira-bordas', '#392a20', .6)
  const plastic = material('plastico-marfim', '#ddd6c3', .72), steel = material('aco-grafite', '#424845', .39, .65)
  const brass = material('metal-lustre', '#b19a62', .34, .65), leather = material('couro-verde', '#233d33', .85)
  const stitching = material('costura-couro', '#6d7460', .85), rug = material('tapete-vinho', '#722e32', .98)
  const rugBorder = material('tapete-borda', '#bba97e', .98), leaves = material('folhas', '#3d653b', .94)
  const pot = material('ceramica', '#a28462', .81), soil = material('terra', '#393327', 1)
  const shade = material('cupula-tecido', '#d8c39b', .87), light = material('luz-quente', '#ffdeb0', .5)
  light.emissive.set('#ffd18d'); light.emissiveIntensity = .75
  const glass = material('vidro-aquario', '#bfd5cf', .12, .02)
  glass.transparent = true; glass.opacity = .18; glass.depthWrite = false; glass.side = THREE.DoubleSide
  const water = material('agua-aquario', '#668f83', .23)
  water.transparent = true; water.opacity = .35; water.depthWrite = false
  const backing = material('fundo-moldura', '#bcb39c', .94)
  let disposed = false, signature = '', rebuilds = 0, walletStatus: WalletStatus = 'missing'
  let ownedFurniture: FurnitureId[] = [], placements: Placement[] = []

  function clear() {
    root.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose() })
    root.clear(); placements = []
  }
  function item(id: FurnitureId, x: number, z: number, support: Placement['support'], build: (add: Add) => void, yaw = 0) {
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
    // A purchased rug is a physical surface beneath the desk and chair.
    const onRug = ownedFurniture.includes('tapete') && (id.startsWith('mesa-') || id.startsWith('cadeira-'))
    const transform = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, floor + (onRug ? .026 : 0), z)
    const add: Add = (m, geometry, px, py, pz, rotate) => {
      if (rotate) geometry.applyQuaternion(rotate)
      geometry.translate(px, py, pz).applyMatrix4(transform)
      const flat = geometry.index ? geometry.toNonIndexed() : geometry
      if (flat !== geometry) geometry.dispose()
      const list = batches.get(m) ?? []; list.push(flat); batches.set(m, list)
    }
    build(add)
    const bounds = new THREE.Box3(), group = new THREE.Group(); group.name = id; root.add(group)
    for (const [m, parts] of batches) {
      const geometry = mergeGeometries(parts, false)!
      parts.forEach(part => part.dispose()); geometry.computeBoundingBox(); geometry.computeBoundingSphere()
      bounds.union(geometry.boundingBox!)
      const mesh = new THREE.Mesh(geometry, m); mesh.castShadow = m !== glass && m !== water && m !== light
      mesh.receiveShadow = m !== glass && m !== water && m !== light; group.add(mesh)
    }
    placements.push({ id, support, bounds: { min: { ...bounds.min }, max: { ...bounds.max } } })
  }
  type Add = (material: THREE.Material, geometry: THREE.BufferGeometry, x: number, y: number, z: number, rotate?: THREE.Quaternion) => void
  const box = (add: Add, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, radius = .015) =>
    add(m, radius ? new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w / 3, h / 3, d / 3)) : new THREE.BoxGeometry(w, h, d), x, y, z)
  const cylinder = (add: Add, m: THREE.Material, x: number, y: number, z: number, rt: number, rb: number, h: number, segments = 12) =>
    add(m, new THREE.CylinderGeometry(rt, rb, h, segments), x, y, z)
  function rod(add: Add, m: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius: number) {
    const delta = b.clone().sub(a), center = a.clone().add(b).multiplyScalar(.5)
    add(m, new THREE.CylinderGeometry(radius, radius, delta.length(), 8), center.x, center.y, center.z,
      new THREE.Quaternion().setFromUnitVectors(UP, delta.normalize()))
  }
  function furniture(id: FurnitureId) {
    if (id === 'mesa-simples' || id === 'mesa-madeira') item(id, -6.4, 70.6, 'floor', add => {
      const basic = id === 'mesa-simples', w = basic ? 1.7 : 2.4, d = basic ? .84 : 1.15, top = basic ? plastic : walnut
      box(add, top, 0, .745, 0, w, .07, d, .025)
      if (basic) {
        for (const x of [-w / 2 + .13, w / 2 - .13]) for (const z of [-d / 2 + .11, d / 2 - .11])
          cylinder(add, steel, x, .355, z, .022, .028, .71, 8)
        for (const x of [-.5, .5]) box(add, steel, x, .47, 0, .035, .035, d - .12)
      } else {
        for (const x of [-.89, .89]) {
          box(add, edge, x, .025, 0, .47, .05, .96)
          box(add, walnut, x, .385, 0, .46, .67, .91)
          for (const y of [.20, .40, .59]) {
            box(add, edge, x, y, .464, .39, .012, .015, 0)
            box(add, brass, x, y + .035, .49, .13, .018, .022, .005)
          }
        }
        box(add, walnut, 0, .43, -.40, 1.38, .52, .045)
        box(add, leather, 0, .785, 0, .96, .013, .56, .008)
        box(add, brass, 0, .815, -.31, .24, .045, .05, .006)
      }
    })
    else if (id === 'cadeira-simples' || id === 'cadeira-couro') item(id, -6.4, 71.7, 'floor', add => {
      const basic = id === 'cadeira-simples', cover = basic ? plastic : leather
      box(add, cover, 0, .45, 0, .49, .075, .48, .027)
      box(add, cover, 0, basic ? .74 : .83, .215, .48, basic ? .45 : .66, .09, .034)
      if (basic) for (const x of [-.19, .19]) for (const z of [-.18, .18])
        box(add, plastic, x, .21, z, .042, .42, .042, .01)
      else {
        cylinder(add, steel, 0, .2625, 0, .032, .045, .325)
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5, x = Math.sin(a) * .28, z = Math.cos(a) * .28
          rod(add, steel, new THREE.Vector3(0, .11, 0), new THREE.Vector3(x, .065, z), .027)
          cylinder(add, steel, x, .03, z, .037, .037, .06, 8)
        }
        for (const x of [-.28, .28]) {
          box(add, steel, x, .53, .12, .025, .25, .025)
          box(add, leather, x, .66, .015, .075, .055, .41, .02)
        }
        for (const x of [-.175, .175]) box(add, stitching, x, .83, .162, .007, .49, .006, 0)
      }
    })
    else if (id === 'estante-simples' || id === 'estante-madeira') item(id, -12.5, 78.25, 'floor', add => {
      const basic = id === 'estante-simples', w = basic ? 1.8 : 3.1, h = basic ? 1.85 : 2.35
      const m = basic ? steel : walnut, d = basic ? .38 : .5
      for (const x of [-w / 2 + .035, w / 2 - .035]) box(add, m, x, h / 2, 0, .07, h, d)
      for (const y of [.06, h * .33, h * .66, h - .035]) box(add, m, 0, y, 0, w, .065, d)
      if (!basic) {
        box(add, edge, 0, h / 2, d / 2 - .018, w - .12, h - .06, .035, 0)
        box(add, walnut, 0, h / 2, 0, .055, h, d)
        for (const x of [-.76, .76]) box(add, walnut, x, .25, -.013, 1.43, .40, d, .02)
      }
    })
    else if (id === 'tapete') item(id, -6.4, 70.85, 'floor', add => {
      const outer = new THREE.CylinderGeometry(1, 1, .016, 64); outer.scale(2.40, 1, 1.92); add(rugBorder, outer, 0, .008, 0)
      const inner = new THREE.CylinderGeometry(1, 1, .010, 64); inner.scale(2.28, 1, 1.8); add(rug, inner, 0, .021, 0)
    })
    else if (id === 'sofa') item(id, 8, 72.5, 'floor', add => {
      for (const x of [-1.21, 1.21]) for (const z of [-.31, .31]) cylinder(add, edge, x, .075, z, .04, .035, .15, 8)
      box(add, leather, 0, .24, 0, 2.9, .22, .91, .06)
      box(add, leather, 0, .65, .36, 2.87, .64, .2, .07)
      for (const x of [-1.37, 1.37]) box(add, leather, x, .51, -.02, .24, .55, .91, .06)
      for (const x of [-.84, 0, .84]) {
        box(add, leather, x, .41, -.05, .81, .16, .70, .05)
        box(add, leather, x, .66, .21, .81, .44, .16, .06)
        box(add, stitching, x, .438, -.406, .72, .008, .007, 0)
      }
    })
    else if (id === 'luminaria') item(id, 10.15, 73.25, 'floor', add => {
      cylinder(add, steel, 0, .025, 0, .24, .25, .05, 24)
      cylinder(add, brass, 0, .80, 0, .016, .022, 1.52)
      cylinder(add, shade, 0, 1.66, 0, .21, .34, .42, 24)
      cylinder(add, light, 0, 1.444, 0, .285, .285, .018, 24)
    })
    else if (id === 'lustre') item(id, -6.4, 70.85, 'ceiling', add => {
      const roof = ceiling - floor, drop = 2.05, bodyY = roof - drop
      cylinder(add, brass, 0, roof - .035, 0, .18, .18, .07, 24)
      cylinder(add, brass, 0, roof - .96, 0, .017, .017, 1.85)
      cylinder(add, brass, 0, bodyY + .1, 0, .09, .12, .35)
      const ring = new THREE.TorusGeometry(.58, .022, 6, 32); ring.rotateX(Math.PI / 2); add(brass, ring, 0, bodyY, 0)
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, x = Math.sin(a) * .58, z = Math.cos(a) * .58
        rod(add, brass, new THREE.Vector3(0, bodyY, 0), new THREE.Vector3(x, bodyY, z), .018)
        cylinder(add, brass, x, bodyY + .10, z, .013, .013, .2, 8)
        const globe = new THREE.SphereGeometry(.085, 12, 8); globe.scale(1, 1.5, 1); add(light, globe, x, bodyY + .24, z)
      }
    })
    else if (id === 'quadro') item(id, 20.7975, 71.1, 'wall', add => {
      box(add, backing, 0, 2.05, 0, 1.10, 1.27, .055, 0)
      for (const x of [-.58, .58]) box(add, walnut, x, 2.05, -.04, .065, 1.4, .085)
      for (const y of [1.37, 2.73]) box(add, walnut, 0, y, -.04, 1.22, .065, .085)
    }, Math.PI / 2)
    else if (id === 'aquario') item(id, 13, 78.1, 'floor', add => {
      for (const x of [-.58, .58]) for (const z of [-.22, .22]) box(add, steel, x, .045, z, .07, .09, .07)
      box(add, walnut, 0, .465, 0, 1.43, .78, .59, .02)
      box(add, edge, 0, .455, -.302, .012, .65, .008, 0)
      for (const x of [-.09, .09]) box(add, brass, x, .53, -.32, .015, .12, .021, .005)
      box(add, steel, 0, .882, 0, 1.52, .055, .66)
      box(add, soil, 0, .941, 0, 1.40, .045, .55)
      box(add, water, 0, 1.50, 0, 1.4, .012, .54, 0)
      for (const z of [-.30, .30]) box(add, glass, 0, 1.25, z, 1.45, .69, .014, 0)
      for (const x of [-.732, .732]) box(add, glass, x, 1.25, 0, .014, .69, .61, 0)
      box(add, steel, 0, 1.60, 0, 1.52, .055, .66)
      for (const x of [-.45, .42]) for (const spread of [-.07, .05]) {
        const leaf = new THREE.SphereGeometry(1, 8, 6); leaf.scale(.033, .17, .022); leaf.rotateZ(spread * 4)
        add(leaves, leaf, x + spread, 1.11, .06)
      }
    })
    else if (id === 'planta') item(id, -12.2, 67.3, 'floor', add => {
      cylinder(add, pot, 0, .24, 0, .27, .21, .48, 24)
      cylinder(add, soil, 0, .465, 0, .248, .248, .018, 24)
      cylinder(add, edge, 0, .86, 0, .025, .04, .79)
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, x = Math.sin(a) * .28, z = Math.cos(a) * .28, y = .83 + i * .065
        rod(add, leaves, new THREE.Vector3(0, y - .13, 0), new THREE.Vector3(x, y, z), .009)
        const leaf = new THREE.SphereGeometry(1, 10, 6); leaf.scale(.13, .035, .30); leaf.rotateY(a)
        add(leaves, leaf, x * 1.4, y, z * 1.4)
      }
    })
  }
  function update(next?: PresidenciaCarteira | null) {
    if (disposed) return false
    walletStatus = next == null ? 'missing' : carteiraPresidenciaValida(next) ? 'valid' : 'invalid'
    ownedFurniture = walletStatus === 'valid' ? next!.owned.map(b => b.id).filter(isFurniture).sort() : []
    const ids = available ? ownedFurniture : [], key = JSON.stringify(ids)
    if (signature === key) return false
    clear(); ids.forEach(furniture); signature = key; rebuilds++; return true
  }
  const inspect = () => {
    let meshes = 0, triangles = 0
    root.traverse(object => { if (object instanceof THREE.Mesh) { meshes++; triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3 } })
    return { available, walletStatus, ownedFurniture: [...ownedFurniture], renderedFurniture: placements.map(p => p.id),
      placements: placements.map(p => ({ ...p, bounds: { min: { ...p.bounds.min }, max: { ...p.bounds.max } } })),
      meshes, triangles, rebuilds, president: false, trophies: 0, identity: false }
  }
  update(wallet)
  return { root, update, inspect, dispose() { if (disposed) return; disposed = true; clear(); root.removeFromParent(); materials.forEach(m => m.dispose()) } }
}
