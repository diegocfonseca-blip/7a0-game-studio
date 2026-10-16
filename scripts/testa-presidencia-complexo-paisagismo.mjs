import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire, registerHooks } from 'node:module'

// This suite is CPU-only: inspect the rendered triangles, including decorations
// which deliberately have no gameplay collider. No browser, save or network.
const besideScript = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const project = fs.existsSync(path.join(besideScript, 'package.json')) ? besideScript : process.cwd()
const require = createRequire(path.join(project, 'package.json'))
const THREE = await import(pathToFileURL(path.join(path.dirname(require.resolve('three')), 'three.module.js')))
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL))
      if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
    return next(url, context)
  },
})
const source = name => import(pathToFileURL(path.join(project, 'src/escalacao', name + '.ts')))
const { criarEntornoComplexo } = await source('presidencia-complexo-entorno')
const { complexoDoEstadio, PLANTA_COMPLEXO, mapaParaMundo, caminhosTorcidaComplexo, deslocarCaminhoComplexo } = await source('presidencia-complexo-model')
const { STADIUM_EXTRAS, STADIUM_SECTORS } = await source('estadiodata')
const full = { inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])), ext: [...STADIUM_EXTRAS.map(s => s.k), 'asfalto'] }
const scenarios = { vazio: { inv: {}, ext: [] }, asfalto: { inv: {}, ext: ['asfalto'] }, estacionamento: { inv: {}, ext: ['estac'] }, completo: full }
// These are independently registered parking boundaries from the reference map;
// none belongs to PLANTA_COMPLEXO.lots, which only holds the five buildings.
const parking = [
  [[331, 683], [491, 721], [564, 826], [446, 780]],
  [[930, 695], [1088, 667], [1156, 779], [956, 837]],
  [[1253, 494], [1394, 524], [1350, 660], [1212, 652]],
  [[312, 189], [438, 170], [412, 282], [205, 344]],
].map(points => points.map(([x, y]) => mapaParaMundo({ x, y })))
const close = (a, b, message, epsilon = .025) => assert(Math.abs(a - b) <= epsilon, `${message}: ${a.toFixed(4)} / ${b.toFixed(4)}`)
const at = p => `(${p.x.toFixed(2)}, ${p.z.toFixed(2)})`
const inside = (p, polygon) => {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) result = !result
  }
  return result
}
function polygonSamples(polygon, spacing = 3) {
  const points = []
  // Some registered lots are concave. Inset along each edge's interior normal,
  // never toward the average of vertices (which can lie outside the lot).
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length]
    const length = Math.hypot(b.x - a.x, b.z - a.z), count = Math.ceil(length / spacing)
    if (!length) continue
    for (let j = 0; j < count; j++) {
      const t = (j + .5) / count, p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
      const candidate = [-1, 1].map(side => ({ x: p.x - (b.z - a.z) / length * .02 * side, z: p.z + (b.x - a.x) / length * .02 * side }))
        .find(q => inside(q, polygon))
      if (candidate) points.push(candidate)
    }
  }
  for (let x = Math.min(...polygon.map(p => p.x)); x <= Math.max(...polygon.map(p => p.x)); x += spacing)
    for (let z = Math.min(...polygon.map(p => p.z)); z <= Math.max(...polygon.map(p => p.z)); z += spacing)
      if (inside({ x, z }, polygon)) points.push({ x, z })
  assert(points.length && points.every(p => inside(p, polygon)), 'probes precisam permanecer dentro do lote real')
  return points
}

// Batching gives a tree and the entire district the same mesh bounds. A small
// spatial index keeps dense probes practical without relying on object names.
// Each triangle belongs to every tile its XZ bounds touch, retaining its real
// material, winding, normals and vertices for Three's own raycaster.
function spatialRays(root) {
  const tiles = new Map(), proxies = [], originals = [], size = 24, ray = new THREE.Raycaster()
  root.updateMatrixWorld(true)
  root.traverse(object => { if (object.isMesh) originals.push(object) })
  for (const mesh of originals) {
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), position = geometry.getAttribute('position'), index = geometry.getIndex(), groups = new Map()
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const ids = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j)
      const xs = ids.map(j => position.getX(j)), zs = ids.map(j => position.getZ(j))
      for (let x = Math.floor(Math.min(...xs) / size); x <= Math.floor(Math.max(...xs) / size); x++)
        for (let z = Math.floor(Math.min(...zs) / size); z <= Math.floor(Math.max(...zs) / size); z++) {
          const key = `${x}:${z}`, indices = groups.get(key) ?? []
          indices.push(...ids); groups.set(key, indices)
        }
    }
    geometry.computeBoundingSphere(); geometry.computeBoundingBox()
    for (const [key, indices] of groups) {
      const part = new THREE.BufferGeometry()
      for (const [name, attribute] of Object.entries(geometry.attributes)) part.setAttribute(name, attribute)
      part.setIndex(indices); part.boundingSphere = geometry.boundingSphere.clone(); part.boundingBox = geometry.boundingBox.clone()
      const proxy = new THREE.Mesh(part, mesh.material), tile = tiles.get(key) ?? []
      tile.push(proxy); tiles.set(key, tile); proxies.push(proxy)
    }
    geometry.dispose()
  }
  const intersect = (from, to) => {
    const direction = to.clone().sub(from), selected = new Set()
    for (let x = Math.floor(Math.min(from.x, to.x) / size); x <= Math.floor(Math.max(from.x, to.x) / size); x++)
      for (let z = Math.floor(Math.min(from.z, to.z) / size); z <= Math.floor(Math.max(from.z, to.z) / size); z++)
        for (const mesh of tiles.get(`${x}:${z}`) ?? []) selected.add(mesh)
    ray.set(from, direction.clone().normalize()); ray.near = .001; ray.far = direction.length()
    return ray.intersectObjects([...selected], false)
  }
  return {
    originals, intersect,
    below(p, y = 35, bottom = -.6) { return intersect(new THREE.Vector3(p.x, y, p.z), new THREE.Vector3(p.x, bottom, p.z))[0] },
    floor(p) { return intersect(new THREE.Vector3(p.x, .65, p.z), new THREE.Vector3(p.x, -.5, p.z)).find(hit => hit.face?.normal.y > .9) },
    dispose() { for (const proxy of proxies) proxy.geometry.dispose() },
  }
}

function clearCorridor(probes, name, points, lateralOffsets, floorHeight, heights = [.35, .95, 1.72], floorLateralLimit = Infinity) {
  let samples = 0
  const surfaceAt = typeof floorHeight === 'function' ? floorHeight : () => floorHeight
  for (const offset of lateralOffsets) {
    const lane = deslocarCaminhoComplexo(points, offset)
    for (let i = 1; i < lane.length; i++) {
      const a = lane[i - 1], b = lane[i], length = Math.hypot(b.x - a.x, b.z - a.z)
      if (length < 1e-7) continue
      // Reverse rays also catch back-facing leaves and a ray starting inside a
      // trunk. Terrain raycasts start low enough not to confuse a canopy with a road.
      for (const y of heights) {
        const start = new THREE.Vector3(a.x, surfaceAt(a) + y, a.z), end = new THREE.Vector3(b.x, surfaceAt(b) + y, b.z)
        for (const [from, to] of [[start, end], [end, start]]) {
          const hit = probes.intersect(from, to)[0]
          assert(!hit, `${name}, faixa ${offset}: obstáculo a ${y} m ${hit ? at({ x: hit.point.x, z: hit.point.z }) : ''}`)
        }
      }
      if (Math.abs(offset) > floorLateralLimit) continue
      const count = Math.ceil(length / 1)
      for (let j = 0; j <= count; j++) {
        const p = { x: a.x + (b.x - a.x) * j / count, z: a.z + (b.z - a.z) * j / count }, floor = probes.floor(p)
        assert(floor, `${name}: sem apoio em ${at(p)}`)
        close(floor.point.y, surfaceAt(p), `${name}, faixa ${offset}, piso ${at(p)}`)
        samples++
      }
    }
  }
  return samples
}

// Registered polygons run through wall centres. Bought façades include wall
// thickness and mullions up to 33 cm outside that line; they are legitimate
// construction, not new landscaping. Keep this small band out of parking probes.
function purchasedEnvelope(polygon) {
  const margin = .36, shapes = [polygon]
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length], length = Math.hypot(b.x - a.x, b.z - a.z)
    if (!length) continue
    const x = (b.z - a.z) / length * margin, z = -(b.x - a.x) / length * margin
    shapes.push([{ x: a.x + x, z: a.z + z }, { x: b.x + x, z: b.z + z }, { x: b.x - x, z: b.z - z }, { x: a.x - x, z: a.z - z }])
    shapes.push([{ x: a.x - margin, z: a.z - margin }, { x: a.x + margin, z: a.z - margin }, { x: a.x + margin, z: a.z + margin }, { x: a.x - margin, z: a.z + margin }])
  }
  return shapes
}

function chords(polygon, z) {
  const xs = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length]
    if ((a.z > z) !== (b.z > z)) xs.push(a.x + (b.x - a.x) * (z - a.z) / (b.z - a.z))
  }
  xs.sort((a, b) => a - b)
  return xs.flatMap((x, i) => i % 2 ? [] : [[x, xs[i + 1]]])
}
function clearParking(probes, name, polygon, purchasedPlots) {
  let rays = 0
  // Tree crowns can shade the asphalt; trunks, shrubs and benches must leave
  // the full vehicle volume free. Dense horizontal sections find narrow trunks
  // which a vertical ray starting inside an open cylinder would miss.
  for (let z = Math.min(...polygon.map(p => p.z)) + .125; z < Math.max(...polygon.map(p => p.z)); z += .25) {
    const occupied = purchasedPlots.flatMap(plot => chords(plot, z))
    for (const [left, right] of chords(polygon, z)) {
      const cuts = [left + .02, right - .02, ...occupied.flat().filter(x => x > left + .02 && x < right - .02)].sort((a, b) => a - b)
      for (let i = 1; i < cuts.length; i++) {
        const a = cuts[i - 1], b = cuts[i], middle = (a + b) / 2
        if (b - a < .04 || occupied.some(([low, high]) => middle > low && middle < high)) continue
        for (const y of [.4, .95, 1.6, 2.1]) {
          const start = new THREE.Vector3(a + .005, y, z), end = new THREE.Vector3(b - .005, y, z)
          for (const [from, to] of [[start, end], [end, start]]) {
            const hit = probes.intersect(from, to)[0]
            assert(!hit, `${name}: tronco/volume ocupa vaga a ${y} m ${hit ? at({ x: hit.point.x, z: hit.point.z }) : ''}`)
            rays++
          }
        }
      }
    }
  }
  return rays
}

// A decoration without a logical collider must still fail the body probe.
// This also checks the index against an actual Three raycast, not metadata.
{
  const root = new THREE.Group(), geometry = new THREE.CylinderGeometry(.3, .3, 2, 6), material = new THREE.MeshStandardMaterial()
  const trunk = new THREE.Mesh(geometry, material)
  trunk.position.y = 1.16; root.add(trunk)
  const probe = spatialRays(root)
  assert.throws(() => clearCorridor(probe, 'tronco-negativo', [{ x: -2, z: 0 }, { x: 2, z: 0 }], [0], .16), /obstáculo/)
  assert.throws(() => clearParking(probe, 'vaga-negativa', [{ x: -2, z: -2 }, { x: 2, z: -2 }, { x: 2, z: 2 }, { x: -2, z: 2 }], []), /tronco\/volume/)
  const direct = new THREE.Raycaster(new THREE.Vector3(0, 3, 0), new THREE.Vector3(0, -1, 0)).intersectObject(trunk)[0]
  close(probe.below({ x: 0, z: 0 }).point.y, direct.point.y, 'índice versus raycast direto', 1e-6)
  probe.dispose(); geometry.dispose(); material.dispose()
}

const reports = [], stableLandscape = new Map()
for (const [name, save] of Object.entries(scenarios)) {
  const before = JSON.stringify(save), scene = new THREE.Scene(), foreign = new THREE.Group()
  scene.add(foreign)
  const state = complexoDoEstadio(save), environment = criarEntornoComplexo(scene, state), probes = spatialRays(environment.root)
  let floorSamples = 0, reservationSamples = 0, parkingRays = 0, triangles = 0
  try {
    for (const mesh of probes.originals) {
      triangles += (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        assert(material.depthTest && material.depthWrite, `${name}: paisagismo sem profundidade real`)
        assert.equal(material.opacity, 1, `${name}: decoração não deve ocultar colisões usando transparência`)
      }
    }
    assert(triangles <= 300_000, `${name}: ${triangles} triângulos excedem o orçamento do entorno`)

    // Newly planted public land is visible in both previously empty areas,
    // before any purchase. Check useful geometry, not the generator's counts.
    for (const [region, p] of Object.entries({ noroeste: { x: -171, z: -329 }, sul: { x: 3, z: 309 } })) {
      const heights = []
      for (const [part, dx, dz, min, max] of [
        ['passeio', 0, 0, .025, .2], ['banco', 4, 2.5, .4, 1.3],
        ['gramado', 7, -7, -.15, 0], ['copa', -6.7, -6.7, 3, 12],
      ]) {
        const point = { x: p.x + dx, z: p.z + dz }, hit = probes.below(point)
        assert(hit && hit.point.y >= min && hit.point.y <= max, `${name}/${region}: falta ${part} físico em ${at(point)} (y=${hit?.point.y})`)
        heights.push(hit.point.y)
      }
      if (stableLandscape.has(region)) assert.deepEqual(heights, stableLandscape.get(region), `${region}: compras alteraram a praça pública`)
      else stableLandscape.set(region, heights)
    }

    for (const id of ['roadOut', 'roadBack'])
      floorSamples += clearCorridor(probes, `${name}/${id}`, PLANTA_COMPLEXO.routes[id].points, [-Math.hypot(4.2, 1.8) / 2, -.9, 0, .9, Math.hypot(4.2, 1.8) / 2], 0, [.2, .8, 1.45], .9)
    for (const [side, points] of Object.entries(caminhosTorcidaComplexo(state)))
      floorSamples += clearCorridor(probes, `${name}/torcida-${side}`, points, [-1.07, -.72, -.37, .37, .72, 1.07], .16)
    // The regional park joins the neighbourhood at pavement height and reaches
    // its lower paths through a continuous gentle slope. Include half a metre
    // beyond both ends so an isolated ramp with a gap at either join fails too.
    for (const [side, startZ, endZ] of [['norte', -551, -585.2], ['sul', 560, 598.5]]) {
      const direction = Math.sign(endZ - startZ)
      const access = [startZ - direction * .5, startZ, endZ, endZ + direction * .5].map(z => ({ x: 17.5, z }))
      const elevation = p => .16 - .13 * Math.max(0, Math.min(1, (p.z - startZ) / (endZ - startZ)))
      floorSamples += clearCorridor(probes, `${name}/acesso-parque-${side}`, access, [-1.4, -1.05, -.35, 0, .35, 1.05, 1.4], elevation)
    }
    for (const [route, purchase] of Object.entries({ hotel: 'hotel', beer: 'chopp', food: 'praca', station: 'estacao' }))
      if (!state.extras[purchase]) clearCorridor(probes, `${name}/acesso-futuro-${route}`, PLANTA_COMPLEXO.routes[route].points, [-.35, 0, .35], .16, [.35, .95, 1.72], -1)
    clearCorridor(probes, `${name}/calcada`, PLANTA_COMPLEXO.routes.sidewalk.points, [-.35, 0, .35], .16, [.35, .95, 1.72], -1)
    if (state.extras.loja) floorSamples += clearCorridor(probes, `${name}/loja`, PLANTA_COMPLEXO.routes.shop.points, [-.35, 0, .35], .16)
    for (const id of ['loja', 'hotel', 'chopp']) if (state.extras[id]) {
      const door = PLANTA_COMPLEXO.doors[id]
      floorSamples += clearCorridor(probes, `${name}/porta-${id}`, [door.approach, door.threshold, door.inside], [-.35, 0, .35], .16)
    }

    // Full future plots, not only their centres, must remain constructible.
    const reservations = [
      ...Object.entries(PLANTA_COMPLEXO.lots).filter(([id]) => !state.extras[id]).map(([id, lot]) => [id, lot.footprint]),
      ...parking.map((polygon, i) => [`estacionamento-${i}`, polygon]),
    ]
    const purchasedPlots = Object.entries(PLANTA_COMPLEXO.lots).filter(([id]) => state.extras[id]).flatMap(([, lot]) => purchasedEnvelope(lot.footprint))
    for (const [id, polygon] of reservations) for (const p of polygonSamples(polygon)) {
      // The reference parking area 2 overlaps the registered food court. Its
      // bought building is legitimate; this overlap is still checked when bare.
      if (id.startsWith('estacionamento-') && purchasedPlots.some(plot => inside(p, plot))) continue
      const hit = probes.below(p, id.startsWith('estacionamento-') ? 2.2 : 35)
      assert(hit && hit.point.y < .3, `${name}/${id}: paisagismo ocupou a reserva ${at(p)} (y=${hit?.point.y})`)
      reservationSamples++
    }
    for (const [i, polygon] of parking.entries()) parkingRays += clearParking(probes, `${name}/estacionamento-${i}`, polygon, purchasedPlots)
    // The entourage reserves the whole playing rectangle, goals and north
    // technical strip; the match module supplies their actual geometry.
    const protectedAreas = [
      ['campo', -52.5, 52.5, -34, 34], ['gol-oeste', -54.6, -52.4, -3.8, 3.8], ['gol-leste', 52.4, 54.6, -3.8, 3.8],
      ['banco-casa', -24.1, -11.9, -37.5, -34.1], ['banco-fora', 11.9, 24.1, -37.5, -34.1],
    ]
    for (const [id, left, right, north, south] of protectedAreas) {
      const polygon = [{ x: left, z: north }, { x: right, z: north }, { x: right, z: south }, { x: left, z: south }]
      for (const p of polygonSamples(polygon, id === 'campo' ? 4 : 1)) {
        const hit = probes.below(p)
        assert(hit && hit.point.y < 0, `${name}/${id}: entorno invadiu a partida em ${at(p)} (y=${hit?.point.y})`)
        reservationSamples++
      }
    }
    assert.equal(JSON.stringify(save), before, `${name}: teste visual alterou o save`)
    reports.push({ name, triangles, floorSamples, reservationSamples, parkingRays })
  } finally {
    probes.dispose(); environment.dispose(); environment.dispose()
    assert.deepEqual(scene.children, [foreign], 'dispose removeu outro dono da cena')
  }
}
console.log('PASS paisagismo: praças NW/Sul, acessos inclinados do parque, reservas futuras/estacionamentos, campo/bancos/redes, corpos e piso nas rotas/portas, materiais e orçamento.', reports)
