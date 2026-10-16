import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname } from 'node:path'
import * as THREE from 'three'

const sourceRoot = new URL('../src/escalacao/', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot) && !extname(specifier)) {
      const url = new URL(specifier + '.ts', context.parentURL)
      if (existsSync(url)) return next(url.href, context)
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    const result = next(url, context)
    return url.startsWith(sourceRoot) && result.source != null
      ? { ...result, source: Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") } : result
  },
})
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const inside = (p, polygon) => {
  let contains = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) contains = !contains
  }
  return contains
}
try {
  const { criarSaidaTorcidaComplexo, LIMITE_SAIDA_TORCIDA_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-torcida-saida.ts')
  const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
  const { criarEntornoComplexo } = await import('../src/escalacao/presidencia-complexo-entorno.ts')
  const { criarTorcidaComplexo } = await import('../src/escalacao/presidencia-complexo-torcida.ts')
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')
  const state = complexoDoEstadio({ inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost])), ext: [] })
  const scene = new THREE.Scene(), architecture = criarArquiteturaComplexo(scene, state)
  const environment = criarEntornoComplexo(scene, state), renderedFloors = []
  scene.updateMatrixWorld(true)
  environment.root.traverse(object => { if (object instanceof THREE.Mesh) renderedFloors.push({ mesh: object, bounds: new THREE.Box3().setFromObject(object) }) })
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
  const floorCache = new Map()
  const exteriorFloor = (point, footY) => {
    const key = [point.x, footY, point.z].map(value => value.toFixed(6)).join(':')
    if (floorCache.has(key)) return floorCache.get(key)
    const origin = new THREE.Vector3(point.x, footY + .1, point.z), extent = new THREE.Box3().setFromPoints([origin, origin.clone().addScaledVector(down, 1)]).expandByScalar(.001)
    ray.set(origin, down); ray.near = .001; ray.far = 1
    const floor = ray.intersectObjects(renderedFloors.filter(surface => surface.bounds.intersectsBox(extent)).map(surface => surface.mesh), false).find(hit => hit.face?.normal.y > .9)?.point.y
    floorCache.set(key, floor)
    return floor
  }
  const accesses = architecture.seatAccess, exclude = accesses.filter(a => a.seat.tier === 'lower' && a.seat.row === 0).map(a => a.seatId)
  const crowd = criarTorcidaComplexo(scene, architecture.seats, { mode: 'qa-sample', homeOccupancy: 1, awayOccupancy: 1 })
  const originalTotal = crowd.inspect().total
  const first = { key: 'quarta-21h', variantSeed: 1, phase: 'playing' }, next = { key: 'domingo-16h', variantSeed: 2, phase: 'playing' }
  const config = { journey: first, homeColor: '#1B7A3D', awayColor: '#C2452F' }
  const cohort = criarSaidaTorcidaComplexo(scene, { state, accesses, excludedSeatIds: exclude, budget: { home: 999, away: 999 }, ...config })
  assert.equal(cohort.inspect().total, 6)
  assert.equal(LIMITE_SAIDA_TORCIDA_COMPLEXO, 6)
  assert(cohort.reserveSeatIds().every(id => !exclude.includes(id)))
  crowd.reserve([...exclude, ...cohort.reserveSeatIds()])
  assert.equal(crowd.inspect().total + cohort.inspect().total + exclude.length, originalTotal, 'coorte usa mesma quota; não acrescenta torcedores')
  const reservations = cohort.reserveSeatIds(), ids = cohort.inspect().actors.map(actor => actor.rigId)
  assert.equal(cohort.inspect().seated, 6)
  const resources = new Set()
  cohort.root.traverse(object => {
    assert(!/olho|nariz|boca|eye|mouth|nose/i.test(object.name))
    if (object instanceof THREE.Mesh) { resources.add(object.geometry); resources.add(object.material) }
  })
  const disposed = new Map([...resources].map(resource => [resource, 0]))
  resources.forEach(resource => resource.addEventListener('dispose', () => disposed.set(resource, disposed.get(resource) + 1)))
  cohort.update(0); cohort.update(1000)
  const seated = cohort.inspect()
  assert.equal(seated.seated, 6, 'jogo mantém todos sentados')
  cohort.configure({ ...config, journey: { ...first, phase: 'departure' } })
  cohort.update(1010, { blockedSides: { home: true, away: true } })
  assert.deepEqual(cohort.inspect().actors, seated.actors, 'passageiro existente tem prioridade; fila não se move em corredor ocupado')
  let time = 1010, probes = 0, supportProbes = 0, clearanceProbes = 0, previous = cohort.inspect(), previousSeated = 6
  const sample = () => {
    const snapshot = cohort.inspect()
    assert.deepEqual(snapshot.actors.map(actor => actor.rigId), ids, 'nenhum corpo é recriado')
    assert.deepEqual(cohort.reserveSeatIds(), reservations, 'reserva não repõe corpo após sair')
    for (const side of ['home', 'away']) assert(snapshot.actors.filter(actor => actor.side === side && ['leaving', 'entering'].includes(actor.state)).length <= 1, 'um corpo por corredor')
    snapshot.actors.forEach((actor, index) => {
      const pose = actor.pose, old = previous.actors[index]
      assert(pose.visible, 'corpo permanece visível até no destino externo')
      assert(pose.feet.some(foot => foot.supported), 'apoio físico em todos os quadros')
      assert(distance(pose.hip, old.pose.hip) < .45, `sem teleporte ${actor.side}/${actor.state}`)
      const access = accesses.find(access => access.seatId === actor.seatId)
      // Continuity/identity are sampled at 10 Hz. Geometry probes are spaced
      // one second apart; the existing complete-visit suite covers every gait
      // frame on these same stairways, while we verify both new endpoints.
      for (const foot of pose.feet) if (Math.round(time * 10) % 10 === 0) for (const x of [-.073, .073]) for (const z of [-.1425, .1425]) {
        const point = { x: foot.position.x + Math.cos(foot.heading) * x + Math.sin(foot.heading) * z, z: foot.position.z - Math.sin(foot.heading) * x + Math.cos(foot.heading) * z }
        const floors = access.surfaces.filter(surface => surface.y <= foot.position.y + 1.8 && inside(point, surface.polygon)).map(surface => surface.y)
        // The full-route visit suite already casts every street segment. Here
        // cast exterior support every ten seconds, plus each final foot below.
        if (!floors.length && Math.round(time * 10) % 100 !== 0) continue
        const floor = floors.length ? Math.max(...floors) : exteriorFloor(point, foot.position.y)
        assert(Number.isFinite(floor), `sola sobre piso construído ${actor.id}/${pose.phase}`)
        assert(foot.position.y >= floor - .001, 'sola não atravessa degrau')
        if (foot.supported) assert(Math.abs(foot.position.y - floor) < .001, 'pé plantado no patamar real')
        supportProbes++
      }
      for (let other = index + 1; other < snapshot.actors.length; other++) {
        assert(distance(pose.hip, snapshot.actors[other].pose.hip) > .48, `corpos não atravessam outro torcedor: ${actor.id}/${snapshot.actors[other].id}`)
        clearanceProbes++
      }
      probes++
    })
    previous = snapshot
    return snapshot
  }
  for (let frame = 0; frame < 20000 && previous.outside < 6; frame++) {
    time += .1; cohort.update(time); const snapshot = sample()
    assert(snapshot.seated <= previousSeated, 'ocupação decresce sem repor torcedores')
    previousSeated = snapshot.seated
    if (frame === 10) { const paused = cohort.inspect(); cohort.update(time); assert.deepEqual(cohort.inspect(), paused, 'mesmo relógio mantém pose') }
  }
  assert.equal(previous.outside, 6, 'todos os seis percorrem a saída')
  assert.equal(previous.seated, 0)
  for (const actor of previous.actors) for (const foot of actor.pose.feet) {
    const floor = exteriorFloor(foot.position, foot.position.y)
    assert(Math.abs(floor - foot.position.y) < .001, 'cada destino novo permanece sobre calçada renderizada')
  }
  assert(previous.actors.every(actor => actor.departures === 1 && actor.arrivals === 0))
  for (const side of ['home', 'away']) {
    const members = previous.actors.filter(actor => actor.side === side)
    for (let i = 1; i < members.length; i++) assert(distance(members[i - 1].endpoint, members[i].endpoint) > 2.15, 'destinos separados na calçada')
  }
  const outside = previous.actors.map(actor => actor.pose)
  cohort.update(time += 10); assert.deepEqual(cohort.inspect().actors.map(actor => actor.pose), outside, 'não reinicia ciclo depois da saída')
  cohort.configure({ journey: next, homeColor: '#2154A5', awayColor: '#F4ECD6' })
  assert.deepEqual(cohort.inspect().returnPendingSides, { home: true, away: true }, 'novo desembarque espera retorno da coorte')
  assert(cohort.inspect().actors.every(actor => actor.color === (actor.side === 'home' ? config.homeColor : config.awayColor)), 'partida nova não recolore corpos antigos fora')
  cohort.update(time += 5, { blockedSides: { home: true, away: true } })
  assert.deepEqual(cohort.inspect().actors.map(actor => actor.pose), outside)
  previous = cohort.inspect()
  for (let frame = 0; frame < 20000 && (previous.seated < 6 || previous.actors.some(actor => actor.journeyKey !== next.key)); frame++) {
    time += .1; cohort.update(time); sample()
  }
  assert.equal(previous.seated, 6, 'nova jornada retorna andando até mesma cadeira')
  assert.deepEqual(previous.returnPendingSides, { home: false, away: false })
  assert(previous.actors.every(actor => actor.departures === 1 && actor.arrivals === 1 && actor.journeyKey === next.key))
  assert(previous.actors.every(actor => actor.color === (actor.side === 'home' ? '#2154A5' : '#F4ECD6')))
  assert.equal(crowd.inspect().total + cohort.inspect().total + exclude.length, originalTotal)
  const current = cohort.inspect(); cohort.update(time - 100); assert.deepEqual(cohort.inspect(), current, 'horário atrasado não teleporta o grupo')
  cohort.dispose(); cohort.dispose()
  assert.equal(cohort.root.parent, null)
  for (const count of disposed.values()) assert.equal(count, 1, 'descarte único de recursos')
  const empty = criarSaidaTorcidaComplexo(scene, { state, accesses, budget: { home: 0, away: NaN }, journey: first })
  assert.equal(empty.inspect().total, 0, 'sem quota não há corpo nem assento inventado'); empty.dispose()
  const bare = criarSaidaTorcidaComplexo(scene, { state: complexoDoEstadio({ inv: {}, ext: [] }), accesses: [], budget: { home: 10, away: 10 }, journey: first })
  assert.equal(bare.inspect().total, 0, 'várzea sem cadeiras não ganha coorte'); bare.dispose()
  crowd.dispose(); architecture.dispose(); environment.dispose()
  assert.equal(scene.children.length, 0)
  console.log(JSON.stringify({ status: 'PASS', actors: ids.length, probes, supportProbes, clearanceProbes, elapsedVisualSeconds: time - 1010, limitation: 'Only six accessible seats leave; the remaining crowd has no measured exit routes yet.' }))
} finally { hooks.deregister() }
