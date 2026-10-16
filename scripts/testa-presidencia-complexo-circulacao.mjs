import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import * as THREE from 'three'
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
const { criarCirculacaoComplexo } = await import('../src/escalacao/presidencia-complexo-circulacao.ts')
const { complexoDoEstadio, PLANTA_COMPLEXO, mundoParaMapa, caminhosTorcidaComplexo, deslocarCaminhoComplexo } = await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
const { segmentoLivre } = await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const full = { inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])), ext: [...STADIUM_EXTRAS.map(e => e.k), 'asfalto'] }
const scene = new THREE.Scene(), state = complexoDoEstadio(full)
const environment = criarEntornoComplexo(scene, state)
const movement = criarCirculacaoComplexo(scene, state, environment.solids, { pedestrians: 50, cars: 50 })
assert.deepEqual(movement.inspect().problems, [], 'percursos registrados devem encaixar na construção física')
assert(movement.inspect().pedestrian, 'loja comprada precisa ter visitante')
assert.equal(movement.inspect().destinationBudget, 3)
assert.deepEqual(movement.inspect().pedestrians.map(entry => entry.destination), ['loja', 'hotel', 'chopp'])
assert.equal(movement.inspect().cars.length, 2, 'amostra deve ficar limitada a dois carros')
assert.equal(movement.wheels.length, 8, 'lista física só inclui rodas dos carros habilitados')
assert.equal(movement.inspect().mode, 'qa-sample')
const solids = environment.solids.map(s => ({ ...s, polygon: s.footprint.map(p => ({ x: p.x, y: p.z })) }))
const solidCheck = (actor, radius, height) => {
  for (const s of solids) {
    if (s.base >= actor.y + height || s.top <= actor.y + .025) continue
    assert(segmentoLivre({ x: actor.x, y: actor.z }, { x: actor.x, y: actor.z }, [s], radius), `atravessou ${s.id}`)
  }
}
const meshes = []
environment.root.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o) })
const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), bounds = new THREE.Box3()
const floorAt = (x, z) => {
  ray.set(new THREE.Vector3(x, .66, z), down); ray.near = 0; ray.far = 1
  const first = ray.intersectObjects(meshes, false).find(hit => hit.face?.normal.y > .9)
  assert(first, 'falta piso real'); return first.point.y
}
const carOutline = c => [-1, 1].flatMap(x => [-1, 1].map(z => ({
  x: c.x + x * .9 * Math.cos(c.heading) + z * 2.1 * Math.sin(c.heading),
  z: c.z - x * .9 * Math.sin(c.heading) + z * 2.1 * Math.cos(c.heading),
})))
const separateCars = (a, b) => {
  const first = carOutline(a), second = carOutline(b)
  return [a.heading, b.heading].flatMap(angle => [{ x: Math.cos(angle), z: -Math.sin(angle) },
    { x: Math.sin(angle), z: Math.cos(angle) }]).some(axis => {
    const pa = first.map(p => p.x * axis.x + p.z * axis.z), pb = second.map(p => p.x * axis.x + p.z * axis.z)
    return Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)
  })
}
// Disjoint route envelopes prove separation for every phase, rather than only
// for a particular sample of independently repeating actor clocks. Fan lanes
// are the same external paths used by the articulated stadium visitors.
const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dz = b.z - a.z, denominator = dx * dx + dz * dz
  const t = denominator ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / denominator)) : 0
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t)
}
const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
const segmentDistance = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0 ? 0 :
  Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b))
const routeDistance = (first, second) => Math.min(...first.slice(1).flatMap((b, i) => second.slice(1).map((d, j) =>
  segmentDistance(first[i], b, second[j], d))))
const peerRoutes = [
  ...movement.inspect().pedestrians.map(entry => ({ id: entry.id, points: entry.route, radius: .35 })),
  ...['roadOut', 'roadBack'].map(id => ({ id, points: PLANTA_COMPLEXO.routes[id].points, radius: movement.inspect().carRadius })),
  ...Object.entries(caminhosTorcidaComplexo(state)).flatMap(([side, points]) => [-.72, .72].map(lane =>
    ({ id: `${side}-${lane}`, points: deslocarCaminhoComplexo(points, lane), radius: .35 }))),
]
for (const destination of peerRoutes.slice(0, 3)) for (const peer of peerRoutes.filter(entry => entry.id !== destination.id)) {
  assert(routeDistance(destination.points, peer.points) > destination.radius + peer.radius,
    `${destination.id} cruza o envelope de ${peer.id}`)
}
const stagesSeen = new Map(movement.inspect().pedestrians.map(entry => [entry.id, new Set()]))
let entered = false, left = false, footSamples = 0, previous = movement.inspect()
for (let i = 0; i <= 6000; i++) {
  const seconds = i / 20
  movement.update(seconds)
  const frame = movement.inspect(), p = frame.pedestrian
  entered ||= p.phase === 'inside'; left ||= p.phase === 'leaving'
  solidCheck(p, frame.pedestrianRadius, 1.8)
  assert(p.visible, 'visita usa profundidade real, não esconde o ator com opacity')
  if (i) assert(Math.hypot(p.x - previous.pedestrian.x, p.z - previous.pedestrian.z) < .06, 'pedestre teleportou')
  for (const entry of frame.pedestrians) {
    const actor = entry.pose, old = previous.pedestrians.find(peer => peer.id === entry.id)?.pose
    stagesSeen.get(entry.id).add(actor.phase)
    solidCheck(actor, frame.pedestrianRadius, 1.8)
    assert(actor.visible, `${entry.id} desapareceu em vez de entrar fisicamente`)
    if (i) assert(Math.hypot(actor.x - old.x, actor.z - old.z) < .06, `${entry.id} teleportou`)
    assert.equal(entry.source, 'qa-sample')
    for (const peer of frame.pedestrians.filter(peer => peer.id !== entry.id))
      assert(Math.hypot(actor.x - peer.pose.x, actor.z - peer.pose.z) > 2 * frame.pedestrianRadius, 'pedestres se atravessaram')
    for (const peer of frame.fans)
      assert(Math.hypot(actor.x - peer.pose.x, actor.z - peer.pose.z) > 2 * frame.pedestrianRadius, 'pedestre atravessou torcida')
    for (const peer of frame.cars)
      assert(Math.hypot(actor.x - peer.x, actor.z - peer.z) > frame.pedestrianRadius + frame.carRadius, 'pedestre atravessou carro')
  }
  for (const c of frame.cars) {
    assert(c, 'via preparada não pode perder seu carro')
    solidCheck(c, frame.carRadius, 1.5)
    const pixel = mundoParaMapa(c)
    assert.equal(c.visible, pixel.x >= 0 && pixel.x <= 1536 && pixel.y >= 0 && pixel.y <= 1024)
  }
  assert(separateCars(frame.cars[0], frame.cars[1]), 'carros invadiram a faixa um do outro')
  // Integração física dos rigs: sola apoiada no chão e pés não afundam.
  if (i % 100 === 0) {
    scene.updateMatrixWorld(true)
    for (const entry of movement.pedestrianFeet) {
      let supported = 0
      for (const sole of entry.feet) {
        bounds.setFromObject(sole, true)
        const center = bounds.getCenter(new THREE.Vector3()), floor = floorAt(center.x, center.z)
        assert(bounds.min.y >= floor - .012, `${entry.id}: pé afundou no piso`)
        if (Math.abs(bounds.min.y - floor) <= .012) supported++
        // All corners of the real animated sole, not merely the body centre.
        sole.geometry.computeBoundingBox()
        const local = sole.geometry.boundingBox
        for (const x of [local.min.x, local.max.x]) for (const z of [local.min.z, local.max.z]) {
          const corner = new THREE.Vector3(x, local.min.y, z).applyMatrix4(sole.matrixWorld)
          assert(corner.y >= floorAt(corner.x, corner.z) - .012, `${entry.id}: quina da sola entrou no piso`)
          footSamples++
        }
      }
      assert(supported >= 1, `${entry.id}: personagem flutuando sem pé apoiado`)
    }
    for (const c of frame.cars) assert(Math.abs(c.y - floorAt(c.x, c.z)) < .026, 'carro fora do piso')
    for (const [index, wheel] of movement.wheels.entries()) {
      if (!frame.cars[Math.floor(index / 4)]?.visible) continue
      bounds.setFromObject(wheel, true)
      const center = bounds.getCenter(new THREE.Vector3()), floor = floorAt(center.x, center.z)
      assert(Math.abs(bounds.min.y - floor) < .026, `roda ${index} fora do asfalto: ${bounds.min.y}/${floor}`)
    }
  }
  const before = JSON.stringify(frame)
  const wheelsBefore = movement.wheels.map(wheel => [...wheel.parent.quaternion.toArray(), ...wheel.parent.parent.quaternion.toArray()])
  movement.update(seconds)
  assert.equal(JSON.stringify(movement.inspect()), before, 'tempo pausado não muda o quadro')
  assert.deepEqual(movement.wheels.map(wheel => [...wheel.parent.quaternion.toArray(), ...wheel.parent.parent.quaternion.toArray()]), wheelsBefore,
    'pausar não deve girar nem endireitar rodas')
  previous = frame
}
assert(entered && left, 'visita precisa entrar, permanecer e voltar')
for (const [id, seen] of stagesSeen) for (const phase of ['walking', 'entering', 'inside', 'leaving'])
  assert(seen.has(phase), `${id} não completou ${phase}`)
for (const entry of movement.inspect().pedestrians) {
  assert(entry.stages.some(stage => stage.phase === 'inside'), 'inspection precisa expor chegada/espera/retorno para QA')
  movement.update(entry.period)
  const returned = movement.inspect().pedestrians.find(peer => peer.id === entry.id).pose
  assert(Math.hypot(returned.x - entry.route[0].x, returned.z - entry.route[0].z) < 1e-8, `${entry.id} não voltou à sua origem`)
}
const period = movement.inspect().period
movement.update(period)
assert(Math.hypot(movement.inspect().pedestrian.x - PLANTA_COMPLEXO.routes.shop.points[0].x,
  movement.inspect().pedestrian.z - PLANTA_COMPLEXO.routes.shop.points[0].z) < 1e-8)

// Um obstáculo novo bloqueia o percurso; nunca força passagem pelo prédio.
const entry = PLANTA_COMPLEXO.doors.loja.approach
const blocker = { id: 'obra-temporaria', minX: entry.x - 1, maxX: entry.x + 1, minZ: entry.z - 1, maxZ: entry.z + 1,
  base: .16, top: 3, footprint: [{ x: entry.x - 1, z: entry.z - 1 }, { x: entry.x + 1, z: entry.z - 1 },
    { x: entry.x + 1, z: entry.z + 1 }, { x: entry.x - 1, z: entry.z + 1 }] }
const blocked = criarCirculacaoComplexo(scene, state, [...environment.solids, blocker], { pedestrians: 3, cars: 0, homeFans: 0, awayFans: 0 })
assert.equal(blocked.inspect().pedestrian, undefined)
assert(blocked.inspect().problems.some(problem => problem.reason === blocker.id))
assert.deepEqual(blocked.inspect().pedestrians.map(entry => entry.destination), ['hotel', 'chopp'], 'obra na loja não bloqueia destinos livres')
blocked.dispose()
const career = criarCirculacaoComplexo(scene, state, environment.solids,
  { stadium: full, day: { division: 'A', support: 100, match: 'playing' }, pedestrians: 999, cars: 0, homeFans: 0, awayFans: 0 })
assert.equal(career.inspect().mode, 'career')
assert.equal(career.inspect().pedestrians.length, 3)
assert(career.inspect().pedestrians.every(entry => entry.source === 'career'))
assert(career.inspect().pedestrians.length <= career.inspect().attendance.outside, 'amostra maior que demanda do dia')
assert.equal(career.inspect().pedestrian, career.inspect().pedestrians.find(entry => entry.destination === 'loja').pose, 'API legada ainda representa loja')
career.dispose()
const quiet = criarCirculacaoComplexo(scene, state, environment.solids,
  { stadium: { inv: {}, ext: ['loja', 'hotel', 'chopp'] }, day: { division: 'V', support: 0, rain: true, match: 'idle' }, pedestrians: 999, cars: 0, homeFans: 0, awayFans: 0 })
assert(quiet.inspect().pedestrians.length < 3, 'torcida pequena em dia comum precisa diminuir a amostra')
assert.equal(quiet.inspect().destinationBudget, Math.min(3, quiet.inspect().attendance.outside))
quiet.dispose()
const hotelOnly = criarCirculacaoComplexo(scene, complexoDoEstadio({ inv: {}, ext: ['hotel'] }), environment.solids,
  { pedestrians: 3, cars: 0, homeFans: 0, awayFans: 0 })
assert.deepEqual(hotelOnly.inspect().pedestrians.map(entry => entry.destination), ['hotel'])
assert.equal(hotelOnly.inspect().pedestrian, undefined, 'não representa hotel como se fosse loja na API legada')
assert.deepEqual(hotelOnly.feet, [])
assert.equal(hotelOnly.pedestrianFeet.length, 1)
hotelOnly.dispose()
const disabled = criarCirculacaoComplexo(scene, state, environment.solids, { pedestrians: 0, cars: 0, homeFans: 0, awayFans: 0 })
assert.deepEqual(disabled.inspect().pedestrians, [])
assert.equal(disabled.root.children.length, 0, 'orçamento zero não cria rigs ocultos')
disabled.dispose()
const missing = criarCirculacaoComplexo(scene, complexoDoEstadio({ inv: {}, ext: [] }), environment.solids, { cars: 0 })
assert.equal(missing.inspect().pedestrian, undefined, 'não visita loja não adquirida')
assert.deepEqual(missing.inspect().pedestrians, [], 'não inventa estabelecimentos não comprados')
missing.dispose()

movement.dispose()
movement.dispose()
assert.equal(movement.root.parent, null)
assert.equal(movement.root.children.length, 0)
assert.equal(environment.root.parent, scene, 'dispose não remove o cenário')
environment.dispose()
assert.equal(scene.children.length, 0)
const early = complexoDoEstadio({ inv: { grama: STADIUM_SECTORS.find(s => s.k === 'grama').cost }, ext: ['loja', 'hotel', 'chopp'] })
const earlyEnvironment = criarEntornoComplexo(scene, early)
const earlyMovement = criarCirculacaoComplexo(scene, early, earlyEnvironment.solids, { pedestrians: 3, cars: 0, homeFans: 0, awayFans: 0 })
assert.deepEqual(earlyMovement.inspect().problems, [], 'destinos também funcionam antes do asfalto e da arena completa')
assert(earlyMovement.inspect().pedestrian)
assert.deepEqual(earlyMovement.inspect().pedestrians.map(entry => entry.destination), ['loja', 'hotel', 'chopp'])
let earlyInside = false
for (let t = 0; t < earlyMovement.inspect().period; t += .5) {
  earlyMovement.update(t)
  earlyInside ||= earlyMovement.inspect().pedestrian.phase === 'inside'
}
assert(earlyInside)
earlyMovement.dispose(); earlyEnvironment.dispose()
const noGround = criarCirculacaoComplexo(scene, early, [], { cars: 0 })
assert.equal(noGround.inspect().pedestrian, undefined, 'não cria personagem flutuando quando falta chão')
assert(noGround.inspect().problems.some(problem => problem.reason === 'piso-ausente'))
noGround.dispose()
assert.equal(scene.children.length, 0)
console.log(`PASS circulação complexo: 5min/20Hz; entrada/espera/saída por loja, hotel e chopp reais; separação geométrica de todos os percursos de torcida/carros; ${footSamples} quinas de solas por raycast, pausa, orçamento QA/carreira/dia, compras, bloqueio e dispose.`)
