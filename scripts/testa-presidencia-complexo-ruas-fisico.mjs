import assert from 'node:assert/strict'
import fs from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as THREE from 'three'

// CPU only. Topology comes from the published street coordinates; support and
// obstructions come from the rendered triangles, never the planner's verdict.
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
const { criarEntornoComplexo } = await import('../src/escalacao/presidencia-complexo-entorno.ts')
const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_EXTRAS, STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')
const { PLANTAS_ESTACIONAMENTO_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const EPS = 1e-7, TILE = 32
const at = p => `(${p.x.toFixed(3)}, ${p.z.toFixed(3)})`
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const cross = (a, b) => a.x * b.z - a.z * b.x
const sub = (a, b) => ({ x: a.x - b.x, z: a.z - b.z })
const along = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
function nearest(p, a, b) {
  const d = sub(b, a), length2 = d.x * d.x + d.z * d.z
  return along(a, b, length2 ? Math.max(0, Math.min(1, ((p.x - a.x) * d.x + (p.z - a.z) * d.z) / length2)) : 0)
}
function closest(a, b, c, d) {
  const ab = sub(b, a), cd = sub(d, c), denominator = cross(ab, cd)
  if (Math.abs(denominator) > EPS) {
    const ac = sub(c, a), t = cross(ac, cd) / denominator, u = cross(ac, ab) / denominator
    if (t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS) {
      const p = along(a, b, Math.max(0, Math.min(1, t)))
      return { a: p, b: p, distance: 0 }
    }
  }
  return [[a, nearest(a, c, d)], [b, nearest(b, c, d)], [nearest(c, a, b), c], [nearest(d, a, b), d]]
    .map(([p, q]) => ({ a: p, b: q, distance: distance(p, q) })).sort((p, q) => p.distance - q.distance)[0]
}
function cells(points, padding = 0) {
  const keys = []
  for (let x = Math.floor((Math.min(...points.map(p => p.x)) - padding) / TILE); x <= Math.floor((Math.max(...points.map(p => p.x)) + padding) / TILE); x++)
    for (let z = Math.floor((Math.min(...points.map(p => p.z)) - padding) / TILE); z <= Math.floor((Math.max(...points.map(p => p.z)) + padding) / TILE); z++) keys.push(`${x}:${z}`)
  return keys
}
function inside(p, polygon) {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) result = !result
  }
  return result
}
function clipHeight(polygon, height, keepAbove) {
  const output = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length]
    const da = (a.y - height) * (keepAbove ? 1 : -1), db = (b.y - height) * (keepAbove ? 1 : -1)
    if (da >= 0) output.push(a)
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      output.push({ x: a.x + (b.x - a.x) * t, y: height, z: a.z + (b.z - a.z) * t })
    }
  }
  return output
}
function blocksSegment(polygon, a, b) {
  if (inside(a, polygon) || inside(b, polygon)) return true
  return polygon.some((p, i) => closest(a, b, p, polygon[(i + 1) % polygon.length]).distance < 1e-5)
}
function surfaceProfile(crossings = []) {
  return p => {
    let found
    for (const crossing of crossings) {
      if (!inside(p, crossing.polygon) && !crossing.polygon.some((a, i) => distance(p, nearest(p, a, crossing.polygon[(i + 1) % crossing.polygon.length])) < 1e-5)) continue
      const first = crossing.points[0], last = crossing.points.at(-1), length = distance(first, last)
      const d = ((p.x - first.x) * (last.x - first.x) + (p.z - first.z) * (last.z - first.z)) / length
      for (let i = 1; i < crossing.points.length; i++) {
        const a = crossing.points[i - 1], b = crossing.points[i], start = distance(first, a), end = distance(first, b)
        if (d < start - 1e-5 || d > end + 1e-5) continue
        const t = Math.max(0, Math.min(1, (d - start) / (end - start || 1))), y = a.y + (b.y - a.y) * t
        if (!found || y > found.y) found = { y, crossing }
        break
      }
    }
    return found
  }
}
function coincidesWithProfile(polygon, a, b, profile, floorAt) {
  const hits = []
  if (inside(a, polygon)) hits.push(a)
  if (inside(b, polygon)) hits.push(b)
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], hit = closest(a, b, p, q)
    if (hit.distance < 1e-5) hits.push(hit.a)
    if (distance(p, nearest(p, a, b)) < 1e-5) hits.push(p)
  }
  if (!hits.length) return false
  hits.sort((p, q) => distance(a, p) - distance(a, q))
  const first = hits[0], last = hits.at(-1), count = Math.max(1, Math.ceil(distance(first, last) / .15))
  const [p, q, r] = polygon.triangle, u = { x: q.x - p.x, y: q.y - p.y, z: q.z - p.z }, v = { x: r.x - p.x, y: r.y - p.y, z: r.z - p.z }
  const normal = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x }
  for (let i = 0; i <= count; i++) {
    const sample = along(first, last, i / count), expected = profile(sample)
    if (!expected) return false
    const heights = Math.abs(normal.y) > 1e-8
      ? [p.y - (normal.x * (sample.x - p.x) + normal.z * (sample.z - p.z)) / normal.y]
      : polygon.map(point => point.y)
    if (heights.some(y => y > expected.y + .0121)) return false
    // Another declared crossing may cover this triangle. Ignore the buried
    // surface only when the real top surface also proves the expected profile.
    if (heights.some(y => y < expected.y - .0121)) {
      const top = floorAt(sample)
      if (!top || Math.abs(top.point.y - expected.y) > .0121) return false
    }
  }
  return true
}

// Batch bounds cover the whole district. Index the actual low triangles rather
// than casting against every distant house/tree for every road probe.
function inspectGeometry(root, crossings = []) {
  const buckets = new Map(), proxies = [], ray = new THREE.Raycaster(), blockerBuckets = new Map()
  const profile = surfaceProfile(crossings)
  root.updateMatrixWorld(true)
  root.traverse(mesh => {
    if (!mesh.isMesh) return
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), position = geometry.getAttribute('position'), index = geometry.index, groups = new Map()
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const ids = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j)
      const points = ids.map(j => ({ x: position.getX(j), y: position.getY(j), z: position.getZ(j) }))
      if (Math.min(...points.map(p => p.y)) > .65 || Math.max(...points.map(p => p.y)) < -.4) continue
      for (const key of cells(points)) { const values = groups.get(key) ?? []; values.push(...ids); groups.set(key, values) }
      // A paper-thin horizontal pavement at 16 cm is a barrier too. A horizontal
      // ray at wheel height would miss it, so sweep the entire low vertical band.
      const blocked = clipHeight(clipHeight(points, .075, true), .45, false)
      blocked.triangle = points
      if (blocked.length >= 2) for (const key of cells(blocked)) {
        const entries = blockerBuckets.get(key) ?? []; entries.push(blocked); blockerBuckets.set(key, entries)
      }
    }
    geometry.computeBoundingSphere(); geometry.computeBoundingBox()
    for (const [key, ids] of groups) {
      const part = new THREE.BufferGeometry()
      for (const [name, attribute] of Object.entries(geometry.attributes)) part.setAttribute(name, attribute)
      part.setIndex(ids); part.boundingSphere = geometry.boundingSphere.clone(); part.boundingBox = geometry.boundingBox.clone()
      const proxy = new THREE.Mesh(part, mesh.material), entries = buckets.get(key) ?? []
      entries.push(proxy); buckets.set(key, entries); proxies.push(proxy)
    }
    geometry.dispose()
  })
  const floorAt = p => {
    ray.set(new THREE.Vector3(p.x, .65, p.z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = 1.05
    return ray.intersectObjects(buckets.get(`${Math.floor(p.x / TILE)}:${Math.floor(p.z / TILE)}`) ?? [], false)
      .find(hit => hit.face?.normal.y > .8)
  }
  return {
    profile, crossings, floor: floorAt,
    blocker(a, b) {
      const candidates = new Set(cells([a, b]).flatMap(key => blockerBuckets.get(key) ?? []))
      for (const polygon of candidates) if (blocksSegment(polygon, a, b) && !coincidesWithProfile(polygon, a, b, profile, floorAt)) return polygon
    },
    dispose() { for (const proxy of proxies) proxy.geometry.dispose() },
  }
}
function roadGraph(streets, physicalContact) {
  const parent = streets.map((_, i) => i), segments = [], buckets = new Map(), joins = new Map()
  const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]))
  streets.forEach((street, streetIndex) => street.points.slice(1).forEach((b, i) => {
    const entry = { a: street.points[i], b, streetIndex, width: street.width }, segmentIndex = segments.length
    segments.push(entry)
    for (const key of cells([entry.a, b], street.width / 2 + 3)) { const values = buckets.get(key) ?? []; values.push(segmentIndex); buckets.set(key, values) }
  }))
  for (let i = 0; i < segments.length; i++) {
    const a = segments[i], candidates = new Set(cells([a.a, a.b], a.width / 2 + 3).flatMap(key => buckets.get(key) ?? []))
    for (const j of candidates) {
      const b = segments[j]
      if (j <= i || a.streetIndex === b.streetIndex) continue
      const contact = closest(a.a, a.b, b.a, b.b)
      // Endpoint caps are physical pavement too. The broad phase allows their
      // reach, but only rendered flat support can actually join the components.
      if (contact.distance > (a.width + b.width) / 2 + (physicalContact ? 6 : -.4)) continue
      if (physicalContact && !physicalContact(contact.a, contact.b)) continue
      parent[find(a.streetIndex)] = find(b.streetIndex)
      const key = [a.streetIndex, b.streetIndex].sort((x, y) => x - y).join(':')
      const previous = joins.get(key)
      if (!previous || previous.distance > contact.distance) joins.set(key, { ...contact, from: streets[a.streetIndex].id, to: streets[b.streetIndex].id })
    }
  }
  const components = new Map()
  streets.forEach((street, i) => { const key = find(i), group = components.get(key) ?? []; group.push(street.id); components.set(key, group) })
  return { components: [...components.values()], joins: [...joins.values()], segments }
}
function assertFloor(probes, p, label) {
  const hit = probes.floor(p)
  assert(hit, `${label}: pista sem apoio em ${at(p)}`)
  // Thin paint and a 3.5 cm parking surface are fine; soil (-19/-24 cm),
  // pavements (16 cm) and kerbs must not become the driving surface.
  const expected = probes.profile(p)
  assert(expected ? Math.abs(hit.point.y - expected.y) <= .0121 : hit.point.y >= -.012 && hit.point.y <= .06,
    `${label}: pista em y=${hit.point.y.toFixed(4)}, esperado ${expected?.y.toFixed(4) ?? '0..0.06'} em ${at(p)}`)
}
function hasFlatContact(probes, a, b) {
  if (probes.blocker(a, b)) return false
  const count = Math.max(1, Math.ceil(distance(a, b) / .35))
  for (let j = 0; j <= count; j++) {
    const hit = probes.floor(along(a, b, j / count))
    const expected = probes.profile(along(a, b, j / count))
    if (!hit || (expected ? Math.abs(hit.point.y - expected.y) > .0121 : hit.point.y < -.012 || hit.point.y > .06)) return false
  }
  return true
}
function assertPassage(probes, a, b, label, spacing = 3) {
  const blocked = probes.blocker(a, b)
  assert(!blocked, `${label}: obstáculo/meio-fio entre 7,5 e 45 cm cruza a pista ${at(a)} → ${at(b)}; face ${blocked?.map(at).join(' / ')}`)
  const count = Math.max(1, Math.ceil(distance(a, b) / spacing))
  for (let j = 0; j <= count; j++) assertFloor(probes, along(a, b, j / count), label)
  const length = distance(a, b)
  if (length > .05) for (const crossing of probes.crossings) {
    for (let i = 0; i < crossing.polygon.length; i++) {
      const p = crossing.polygon[i], q = crossing.polygon[(i + 1) % crossing.polygon.length], contact = closest(a, b, p, q)
      if (contact.distance > 1e-5) continue
      const delta = { x: (b.x - a.x) / length * .02, z: (b.z - a.z) / length * .02 }
      const before = probes.floor({ x: contact.a.x - delta.x, z: contact.a.z - delta.z }), after = probes.floor({ x: contact.a.x + delta.x, z: contact.a.z + delta.z })
      assert(before && after, `${label}/${crossing.id}: borda da travessia sem apoio`)
      assert(Math.abs(before.point.y - after.point.y) <= .0201, `${label}/${crossing.id}: degrau acima de 2 cm na borda ${at(contact.a)} (${before.point.y} → ${after.point.y})`)
    }
  }
  return count + 1
}
function assertNorthwestPavement(probes, network, label) {
  const avenue = network.streets.find(street => street.id === 'avenida-norte')
  assert(avenue, `${label}: avenida da esquina noroeste ausente`)
  const origin = avenue.points[0], length = distance(origin, avenue.points[1])
  const alongAvenue = { x: (avenue.points[1].x - origin.x) / length, z: (avenue.points[1].z - origin.z) / length }
  const branches = network.streets.filter(street => street !== avenue).flatMap(street => [[0, 1], [street.points.length - 1, street.points.length - 2]].flatMap(([index, adjacent]) => {
    if (distance(street.points[index], origin) > .035) return []
    const next = street.points[adjacent], span = distance(next, origin)
    if (span < .1) return []
    const direction = { x: (next.x - origin.x) / span, z: (next.z - origin.z) / span }
    return Math.abs(cross(alongAvenue, direction)) > .7 ? [{ street, direction }] : []
  }))
  assert(branches.length, `${label}: ligação transversal da esquina noroeste ausente`)
  const { street: branch, direction: alongBranch } = branches[0]
  const outerNormal = (direction, other) => {
    const n = { x: -direction.z, z: direction.x }
    return n.x * other.x + n.z * other.z > 0 ? { x: -n.x, z: -n.z } : n
  }
  const sideAvenue = outerNormal(alongAvenue, alongBranch), sideBranch = outerNormal(alongBranch, alongAvenue)
  const offset = (normal, amount) => ({ x: origin.x + normal.x * amount, z: origin.z + normal.z * amount })
  const a = offset(sideAvenue, avenue.width / 2 + avenue.walk / 2), b = offset(sideBranch, branch.width / 2 + branch.walk / 2)
  const t = cross(sub(b, a), alongBranch) / cross(alongAvenue, alongBranch)
  const corner = { x: a.x + alongAvenue.x * t, z: a.z + alongAvenue.z * t }

  // Locate the actual asphalt end on the unobstructed outer lane. This prevents
  // the regression from passing merely because metadata says a cap exists.
  let asphaltEnd
  for (let step = 0; step <= 96; step++) {
    const d = step / 8, p = {
      x: origin.x - alongAvenue.x * d + sideAvenue.x * avenue.width / 4,
      z: origin.z - alongAvenue.z * d + sideAvenue.z * avenue.width / 4,
    }, hit = probes.floor(p)
    if (!hit || hit.point.y < -.012 || hit.point.y > .06) { asphaltEnd = d - 1 / 16; break }
  }
  assert(asphaltEnd > 0, `${label}: não foi possível localizar a borda física do asfalto`)
  const cornerDepth = -(corner.x - origin.x) * alongAvenue.x - (corner.z - origin.z) * alongAvenue.z
  assert(cornerDepth > asphaltEnd + .1 && cornerDepth < asphaltEnd + avenue.walk,
    `${label}: amostras da esquina não contornam a extremidade física da pista`)

  // Walk around the exterior corner from the avenue pavement into the branch
  // pavement. The old missing six-metre strip fails these real floor raycasts.
  const route = [
    { x: a.x + alongAvenue.x * 5, z: a.z + alongAvenue.z * 5 }, corner,
    { x: b.x + alongBranch.x * 6, z: b.z + alongBranch.z * 6 },
  ]
  let samples = 0
  const footMargin = Math.min(.28, avenue.walk * .22, branch.walk * .22)
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1], end = route[i], span = distance(start, end), count = Math.ceil(span / .2)
    const nx = -(end.z - start.z) / span, nz = (end.x - start.x) / span
    for (const lane of [-footMargin, 0, footMargin]) for (let j = 0; j <= count; j++) {
      const p = along(start, end, j / count); p.x += nx * lane; p.z += nz * lane
      const hit = probes.floor(p)
      assert(hit && Math.abs(hit.point.y - .16) <= .0121, `${label}: calçada da esquina noroeste interrompida em ${at(p)} (piso ${hit?.point.y})`)
      samples++
    }
  }
  return samples
}
function assertNorthwestParkingEntry(probes, network, state, label) {
  const parking = PLANTAS_ESTACIONAMENTO_COMPLEXO.find(lot => lot.id === 'noroeste')
  if (!state.extras.asfalto || state.parking.stage < parking.stage) return 0
  const road = network.streets.find(street => street.id === 'rua-interna-oeste')
  assert(road, `${label}: acesso oeste ao estacionamento ausente`)
  const end = road.points.at(-1), previous = road.points.at(-2), length = distance(previous, end)
  // The terminal axis points outside the parcel. The usable entry turns left,
  // behind the last row of bays, before reaching its western aisle. These
  // surveyed waypoints exercise the real lateral opening, not the planner's
  // "destination" label or the invalid shortcut through the parking bays.
  const route = [
    along(end, previous, 6 / length), end,
    { x: -116.109946779, z: -52.171126509 },
    { x: -130.889514997, z: -46.034811388 },
    { x: -134.916298106, z: -56.271266721 },
  ]
  const radius = 1.2
  let samples = 0
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i], span = distance(a, b), nx = -(b.z - a.z) / span, nz = (b.x - a.x) / span
    for (const slot of parking.slots) {
      const gap = inside(a, slot.polygon) || inside(b, slot.polygon) ? 0 : Math.min(...slot.polygon.map((p, j) => closest(a, b, p, slot.polygon[(j + 1) % slot.polygon.length]).distance))
      assert(gap >= radius + .05, `${label}: entrada do estacionamento invade ${slot.id} (folga do eixo ${gap.toFixed(3)} m)`)
    }
    for (let lane = -4; lane <= 4; lane++) {
      const offset = lane * radius / 4
      const start = { x: a.x + nx * offset, z: a.z + nz * offset }, finish = { x: b.x + nx * offset, z: b.z + nz * offset }
      samples += assertPassage(probes, start, finish, `${label}/entrada estacionamento noroeste/${i}/${lane}`, .15)
    }
  }
  // Round caps cover the complete 2.4 m envelope at each bend, including the
  // area between offset legs. A pavement remaining inside the lot fails here.
  for (const point of route) for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2, p = { x: point.x + Math.cos(angle) * radius, z: point.z + Math.sin(angle) * radius }
    assertFloor(probes, p, `${label}/envelope entrada estacionamento noroeste`); samples++
  }
  const destination = route.at(-1), hit = probes.floor(destination)
  assert(inside(destination, parking.polygon), `${label}: entrada não alcança o interior do estacionamento`)
  assert(hit && Math.abs(hit.point.y - .035) <= .0181, `${label}: chegada não está apoiada no piso comprado do estacionamento`)
  return samples
}

// Regression proof: no discrete floor-probe spacing or horizontal ray can
// accidentally make the suite blind to a thin raised sheet across a street.
{
  const fixture = new THREE.Group(), material = new THREE.MeshBasicMaterial()
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), material)
  asphalt.rotation.x = -Math.PI / 2; fixture.add(asphalt)
  let probes = inspectGeometry(fixture)
  assertPassage(probes, { x: 0, z: -5 }, { x: 0, z: 5 }, 'fixture plana'); probes.dispose()
  const kerb = new THREE.Mesh(new THREE.PlaneGeometry(8, .018), material)
  kerb.rotation.x = -Math.PI / 2; kerb.position.set(0, .17, .371); fixture.add(kerb)
  probes = inspectGeometry(fixture)
  assert.throws(() => assertPassage(probes, { x: 0, z: -5 }, { x: 0, z: 5 }, 'fixture com meio-fio'), /obstáculo\/meio-fio/)
  probes.dispose(); asphalt.geometry.dispose(); kerb.geometry.dispose(); material.dispose()
  const disjoint = [{ id: 'a', width: 6, points: [{ x: 0, z: 0 }, { x: 0, z: 10 }] }, { id: 'b', width: 6, points: [{ x: 0, z: 30 }, { x: 0, z: 40 }] }]
  assert.equal(roadGraph(disjoint).components.length, 2, 'grafo independente precisa detectar rua isolada')
}
{
  const fixture = new THREE.Group(), material = new THREE.MeshBasicMaterial(), geometries = []
  const approach = new THREE.PlaneGeometry(12, 12); approach.rotateX(-Math.PI / 2)
  geometries.push(approach); fixture.add(new THREE.Mesh(approach, material))
  const points = [{ x: 0, y: 0, z: -3 }, { x: 0, y: .16, z: -.8 }, { x: 0, y: .16, z: .8 }, { x: 0, y: 0, z: 3 }]
  const crossing = { id: 'fixture-rampa', points, width: 8, polygon: [{ x: -4, z: -3 }, { x: 4, z: -3 }, { x: 4, z: 3 }, { x: -4, z: 3 }] }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-4, a.y, a.z, 4, a.y, a.z, 4, b.y, b.z, -4, b.y, b.z], 3))
    geometry.setIndex([0, 2, 1, 0, 3, 2]); geometry.computeVertexNormals(); geometries.push(geometry); fixture.add(new THREE.Mesh(geometry, material))
  }
  let probes = inspectGeometry(fixture, [crossing])
  assertPassage(probes, points[0], points.at(-1), 'fixture rampa suave declarada', .15); probes.dispose()
  const extra = new THREE.PlaneGeometry(8, .018); extra.rotateX(-Math.PI / 2); extra.translate(0, .29, .371); geometries.push(extra); fixture.add(new THREE.Mesh(extra, material))
  probes = inspectGeometry(fixture, [crossing])
  assert.throws(() => assertPassage(probes, points[0], points.at(-1), 'fixture obstáculo dentro da rampa'), /obstáculo\/meio-fio/)
  probes.dispose(); geometries.forEach(geometry => geometry.dispose()); material.dispose()
}

const fullInv = Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost]))
const fullExt = [...new Set([...STADIUM_EXTRAS.map(extra => extra.k), 'asfalto'])].filter(id => id !== 'estac')
const scenarios = [
  { name: 'vazio', save: { inv: {}, ext: [] } },
  { name: 'asfalto', save: { inv: {}, ext: ['asfalto'] } },
  ...[0, 20, 40, 60, 70].map((investment, stage) => ({ name: `completo-estacionamento-${stage}`, save: { inv: fullInv, ext: [...fullExt, ...(stage === 4 ? ['estac'] : [])], estacionamentoInvestido: investment } })),
]
const requested = new Set(process.argv.slice(2))
for (const name of requested) assert(scenarios.some(scenario => scenario.name === name), `cenário desconhecido: ${name}`)
const summary = []
for (const { name, save } of scenarios.filter(scenario => !requested.size || requested.has(scenario.name))) {
  const before = JSON.stringify(save), state = complexoDoEstadio(save), beforeState = JSON.stringify(state), scene = new THREE.Scene()
  const environment = criarEntornoComplexo(scene, state), network = environment.root.userData.roadNetwork
  let probes
  try {
    assert(network && Array.isArray(network.streets) && Array.isArray(network.connections), `${name}: falta contrato roadNetwork`)
    const streets = network.streets, byId = new Map(streets.map(street => [street.id, street]))
    assert(streets.length > 0 && byId.size === streets.length, `${name}: IDs de ruas precisam ser únicos`)
    for (const street of streets) {
      assert(street.points.length >= 2 && street.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.z)), `${name}/${street.id}: traçado inválido`)
      assert(Number.isFinite(street.width) && street.width > 1, `${name}/${street.id}: largura inválida`)
      assert(Number.isFinite(street.walk) && street.walk >= 0, `${name}/${street.id}: passeio inválido`)
    }
    const crossings = network.crossings ?? []
    for (const crossing of crossings) {
      assert(byId.has(crossing.roadId), `${name}/${crossing.id}: rua da travessia inexistente`)
      assert.equal(crossing.points.length, 4, `${name}/${crossing.id}: perfil precisa de entrada, patamar e saída`)
      assert(crossing.polygon.length >= 4 && crossing.width > 0 && crossing.pedestrianIds.length > 0, `${name}/${crossing.id}: travessia sem planta/destino pedonal`)
      for (let i = 0; i < 4; i++) {
        const p = crossing.points[i]
        assert([p.x, p.y, p.z].every(Number.isFinite), `${name}/${crossing.id}: perfil não finito`)
        assert(Math.abs(p.y - [0, .16, .16, 0][i]) < 1e-6, `${name}/${crossing.id}: patamar fora de 16 cm`)
        if (i) assert(Math.abs(p.y - crossing.points[i - 1].y) / distance(p, crossing.points[i - 1]) <= 1 / 12 + 1e-6, `${name}/${crossing.id}: rampa excede 8,33%`)
      }
    }
    probes = inspectGeometry(environment.root, crossings)
    const northwestPavementSamples = assertNorthwestPavement(probes, network, name)
    const northwestParkingSamples = assertNorthwestParkingEntry(probes, network, state, name)
    let floorSamples = northwestPavementSamples + northwestParkingSamples
    for (const crossing of crossings) {
      const first = crossing.points[0], last = crossing.points.at(-1), length = distance(first, last), nx = -(last.z - first.z) / length, nz = (last.x - first.x) / length
      for (const side of [-.28, 0, .28]) for (let i = 1; i < crossing.points.length; i++) {
        const a = crossing.points[i - 1], b = crossing.points[i], count = Math.max(1, Math.ceil(distance(a, b) / .2))
        for (let j = 0; j <= count; j++) {
          const p = along(a, b, j / count); p.x += nx * side * crossing.width; p.z += nz * side * crossing.width
          const hit = probes.floor(p), expected = Math.max(a.y + (b.y - a.y) * j / count, probes.profile(p)?.y ?? 0)
          const overlapping = probes.profile(p)
          assert(hit && Math.abs(hit.point.y - expected) <= .0121, `${name}/${crossing.id}: perfil físico divergente em ${at(p)} (${hit?.point.y} / ${expected}); perfil dominante ${overlapping?.crossing.id}:${overlapping?.y}`)
          floorSamples++
        }
      }
    }
    // Diagnose newly built junctions first, before an unrelated old kerb can
    // obscure whether a connector was actually rendered at street level.
    for (const connection of network.connections) {
      assert(byId.has(connection.id), `${name}: conector ${connection.id} não foi publicado como rua`)
      for (let i = 1; i < connection.points.length; i++) floorSamples += assertPassage(probes, connection.points[i - 1], connection.points[i], `${name}/${connection.id}`, .5)
      for (const [id, p] of [[connection.fromId, connection.points[0]], [connection.toId, connection.points.at(-1)]]) {
        const street = byId.get(id)
        assert(street, `${name}/${connection.id}: destino ${id} inexistente`)
        const gap = Math.min(...street.points.slice(1).map((b, i) => distance(p, nearest(p, street.points[i], b))))
        assert(gap <= .035, `${name}/${connection.id}: encontro com ${id} deixa ${gap.toFixed(3)} m até o eixo`)
        assertFloor(probes, p, `${name}/${connection.id}/encontro`)
      }
    }
    const graph = roadGraph(streets, (a, b) => hasFlatContact(probes, a, b))
    assert.equal(graph.components.length, 1, `${name}: ruas desconectadas no piso real: ${graph.components.map(group => group.slice(0, 8).join(',')).join(' | ')}`)
    assert.deepEqual(network.diagnostics?.unresolved ?? [], [], `${name}: plano ainda contém pontas/conexões sem solução`)
    // A connected component alone can still contain a dangling stub. Guard the
    // three confirmed broken ends; purchased parking entries are not dead ends.
    for (const [id, ends] of [['avenida-norte', [0]], ['rua-interna-leste', [0, -1]]]) {
      const street = byId.get(id)
      if (!street) continue
      for (const end of ends) {
        const p = street.points.at(end)
        const connected = streets.some(other => other !== street && other.points.slice(1).some((b, i) => {
          const q = nearest(p, other.points[i], b)
          return distance(p, q) <= other.width / 2 + 3 && hasFlatContact(probes, p, q)
        }))
        assert(connected, `${name}/${id}: ponta ${end} termina sem encontro viário físico em ${at(p)}`)
      }
    }
    for (const { a, b, streetIndex, width } of graph.segments) {
      const length = distance(a, b)
      if (length < EPS) continue
      const normal = { x: -(b.z - a.z) / length, z: (b.x - a.x) / length }
      for (const side of [-1, 0, 1]) {
        // At a bend the centre line stays exact; inset the offset probes to
        // avoid testing a square outside the physical mitred road corner.
        const inset = side ? Math.min(2, width / 4, length * .2) / length : 0, offset = side * width * .28
        const start = along(a, b, inset), end = along(a, b, 1 - inset)
        start.x += normal.x * offset; start.z += normal.z * offset; end.x += normal.x * offset; end.z += normal.z * offset
        floorSamples += assertPassage(probes, start, end, `${name}/${streets[streetIndex].id}/faixa${side}`)
      }
    }
    for (const join of graph.joins) floorSamples += assertPassage(probes, join.a, join.b, `${name}/encontro ${join.from} → ${join.to}`, .5)
    const establishments = ['loja', 'hotel', 'chopp', 'praca', 'estacao', 'estac'].filter(id => state.extras[id])
    assert.deepEqual([...environment.establishments].sort(), establishments.sort(), `${name}: rede alterou estabelecimentos comprados`)
    assert.equal(JSON.stringify(save), before, `${name}: rede alterou save`)
    assert.equal(JSON.stringify(state), beforeState, `${name}: rede alterou estado visual`)
    summary.push({ scenario: name, streets: streets.length, connections: network.connections.length, crossings: crossings.length, joins: graph.joins.length, floorSamples, northwestPavementSamples, northwestParkingSamples, parkingStage: state.parking.stage })
  } finally { probes?.dispose(); environment.dispose() }
}
console.log('PASS ruas físicas: rede conectada, pistas/encontros apoiados, faixas sem meios-fios transversais, compra e save preservados.', summary)
