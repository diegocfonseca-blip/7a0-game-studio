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
    if (url.startsWith(sourceRoot) && result.source != null) return { ...result, source: Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") }
    return result
  },
})
const close = (a, b, why, epsilon = 1e-5) => assert(Math.abs(a - b) <= epsilon, `${why}: ${a} / ${b}`)
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dz = b.z - a.z, denominator = dx * dx + dz * dz
  const t = denominator ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / denominator)) : 0
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t)
}
const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
const segmentDistance = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0 ? 0 :
  Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b))
const routeDistance = (first, second) => {
  let distance = Infinity
  for (let i = 1; i < first.length; i++) for (let j = 1; j < second.length; j++) {
    const a = first[i - 1], b = first[i], c = second[j - 1], d = second[j]
    // Tracks may pass over a street; independent clocks are safe only when the
    // occupied height intervals are disjoint, not merely because IDs differ.
    if (Math.min(a.y ?? .16, b.y ?? .16) > Math.max(c.y ?? .16, d.y ?? .16) + 2 || Math.min(c.y ?? .16, d.y ?? .16) > Math.max(a.y ?? .16, b.y ?? .16) + 2) continue
    distance = Math.min(distance, segmentDistance(a, b, c, d))
  }
  return distance
}
const localPoint = (p, vehicle) => {
  const dx = p.x - vehicle.position.x, dz = p.z - vehicle.position.z, cos = Math.cos(vehicle.heading), sin = Math.sin(vehicle.heading)
  return { x: dx * cos - dz * sin, z: dx * sin + dz * cos, y: p.y - vehicle.position.y }
}
const passengerRoutes = service => [
  { id: 'ida', points: service.passengerRoute },
  { id: 'volta', points: service.passengerReturnRoute ?? [...service.passengerRoute].reverse() },
]
const pointRouteDistance3D = (point, route) => Math.min(...route.slice(1).map((b, index) => {
  const a = route[index], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
  const squared = dx * dx + dy * dy + dz * dz
  const t = squared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy + (point.z - a.z) * dz) / squared)) : 0
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy, point.z - a.z - t * dz)
}))
try {
  const { complexoDoEstadio, PLANTA_COMPLEXO, caminhosTorcidaComplexo, deslocarCaminhoComplexo, mapaParaMundo } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
  const { criarTransporteComplexo, roteiroTransporteComplexo } = await import('../src/escalacao/presidencia-complexo-transporte.ts')
  const { gerarPlantaTransporte, PLANTAS_ESTACIONAMENTO_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
  const { segmentoLivre } = await import('../src/escalacao/presidencia-estadio-navegacao.ts')
  const full = { inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])), ext: [...STADIUM_EXTRAS.map(e => e.k), 'asfalto'] }
  const state = complexoDoEstadio(full), options = { metroPassengers: 1, busPassengers: 1, parkingPassengers: 1, cars: 1, source: 'qa-sample' }
  const timetable = roteiroTransporteComplexo(state, options), initial = timetable.at(0), plant = gerarPlantaTransporte(state)
  assert.deepEqual(initial.problems, [], 'rotas e soleiras precisam produzir ciclos físicos válidos')
  assert.equal(initial.vehicles.length, 3)
  assert.equal(initial.passengers.length, 3)
  assert.deepEqual(new Set(initial.vehicles.map(vehicle => vehicle.kind)), new Set(['metro', 'bus', 'car']))
  assert(initial.passengers.every(passenger => passenger.source === 'qa-sample'))
  assert.deepEqual(roteiroTransporteComplexo(state).at(0).vehicles, [], 'demanda ausente não cria serviços/atores')
  const emptyService = roteiroTransporteComplexo(state, { transit: true, source: 'career' }).at(0)
  assert.deepEqual(new Set(emptyService.vehicles.map(vehicle => vehicle.kind)), new Set(['metro', 'bus']), 'serviço urbano explicitamente habilitado pode circular vazio')
  assert.deepEqual(emptyService.passengers, [], 'serviço vazio não inventa público')
  for (const time of [NaN, Infinity, -Infinity, -1]) assert.deepEqual(timetable.at(time), initial, 'relógio inválido/negativo usa início finito')

  const capped = roteiroTransporteComplexo(state, { ...options, metroPassengers: 999, busPassengers: 999, parkingPassengers: 999, cars: 999 }).at(0)
  assert.equal(capped.passengers.length, 3, 'limite de um passageiro por serviço')
  for (const ext of [[], ['estac'], ['estacao'], ['estac', 'estacao']]) {
    const sample = roteiroTransporteComplexo(complexoDoEstadio({ inv: {}, ext }), options).at(0)
    assert.deepEqual(sample.problems, [], `compras isoladas/legadas precisam funcionar: ${ext}`)
    assert.equal(sample.vehicles.some(vehicle => vehicle.kind === 'metro'), ext.includes('estacao'))
    assert.equal(sample.vehicles.some(vehicle => vehicle.kind === 'car'), ext.includes('estac'))
    assert.equal(sample.vehicles.filter(vehicle => vehicle.kind === 'bus').length, 1)
  }
  assert.deepEqual(roteiroTransporteComplexo({ ...state, valid: false }, options).at(0).vehicles, [], 'estado inválido não cria movimento')
  const { estacionamentoDoSave, ESTACIONAMENTO_VAGAS_POR_LOTE } = await import('../src/escalacao/presidencia-estacionamento.ts')
  for (const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO) assert.equal(lot.slots.length, ESTACIONAMENTO_VAGAS_POR_LOTE[lot.id], `${lot.id}: capacidade tem de representar vagas físicas`)
  for (const [stage, investment] of [0, 20, 40, 60, 70].entries()) {
    const save = { ...full, ext: full.ext.filter(id => id !== 'estac').concat(stage === 4 ? ['estac'] : []), estacionamentoInvestido: investment }
    const domain = estacionamentoDoSave(save), actual = gerarPlantaTransporte(complexoDoEstadio(save))
    assert.equal(domain.stage, stage)
    assert.equal(actual.parking.enabled, stage > 0)
    assert.equal(domain.capacity, PLANTAS_ESTACIONAMENTO_COMPLEXO.filter(lot => lot.stage <= stage).reduce((total, lot) => total + lot.slots.length, 0), 'etapa cobra somente lotes presentes')
  }

  const roads = ['roadOut', 'roadBack'].map(id => ({ id, points: PLANTA_COMPLEXO.routes[id].points, radius: Math.hypot(4.2, 1.8) / 2 }))
  const fans = Object.entries(caminhosTorcidaComplexo(state)).flatMap(([side, points]) => [-.72, .72].map(lane => ({
    id: `${side}-${lane}`, points: deslocarCaminhoComplexo(points, lane), radius: .35,
  })))
  const destinations = Object.entries({ loja: 'shop', hotel: 'hotel', chopp: 'beer' }).map(([id, route]) => ({ id, radius: .35,
    points: [...(id === 'chopp' ? PLANTA_COMPLEXO.routes[route].points.slice(4) : PLANTA_COMPLEXO.routes[route].points),
      PLANTA_COMPLEXO.doors[id].approach, PLANTA_COMPLEXO.doors[id].threshold, PLANTA_COMPLEXO.doors[id].inside],
  }))
  const peers = [...roads, ...fans, ...destinations]
  // The station plan registers the same north avenue that is built by the
  // district, keeping both pedestrian overpasses aligned with its carriageway.
  const mapped = points => points.map(([x, y]) => mapaParaMundo({ x, y }))
  const back = [...PLANTA_COMPLEXO.routes.roadBack.points].reverse()
  const streets = [
    { id: 'via-publica', width: 10, points: PLANTA_COMPLEXO.routes.roadOut.points.map((p, i) => ({ x: (p.x + back[i].x) / 2, z: (p.z + back[i].z) / 2 })) },
    { id: 'avenida-norte', width: plant.station.avenueWidth, points: plant.station.avenue },
    { id: 'via-leste', width: 11, points: mapped([[1640, 331], [1521, 451], [1475, 592], [1410, 720]]) },
    { id: 'via-oeste', width: 11, points: mapped([[-65, 269], [150, 119], [295, 48], [354, -65]]) },
  ]
  const metro = plant.services.find(service => service.kind === 'metro')
  assert(metro.passengerReturnRoute?.length > 1, 'metrô precisa de volta explícita pelo segundo acesso')
  assert.equal(plant.station.accesses.length, 2, 'estação precisa de duas passarelas completas')
  assert.deepEqual(new Set(plant.station.accesses.map(access => access.id)), new Set(['oeste', 'leste']))
  assert.equal(plant.station.stair, plant.station.accesses[0].stair, 'alias da escada preserva consumidores existentes')
  assert.notDeepEqual(metro.passengerReturnRoute, [...metro.passengerRoute].reverse(), 'volta precisa percorrer o outro acesso físico')
  const bridgeSamples = [], groundSamples = []
  for (const access of plant.station.accesses) {
    const route = access.id === 'oeste' ? metro.passengerRoute : metro.passengerReturnRoute
    const { bridge, stair, walk } = access
    assert(bridge.points.length >= 2 && stair.points.length >= 2 && walk.length >= 2, `${access.id}: acesso completo até o portão`)
    assert(bridge.width >= 3.6, `${access.id}: largura útil comporta a escada e o corpo`)
    assert.equal(stair.count, 36)
    close(bridge.floor, plant.station.floor, `${access.id}: passarela conecta à plataforma sem degrau inventado`)
    close(stair.count * stair.rise, plant.station.floor - .16, `${access.id}: escada alcança o passeio`)
    close(length(bridge.points.at(-1), stair.points[0]), 0, `${access.id}: ponte termina no começo da escada`)
    close(length(stair.points.at(-1), walk[0]), 0, `${access.id}: escada termina no passeio de acesso`)
    for (const p of [...access.points, ...walk]) close(pointRouteDistance3D(p, route), 0, `${access.id}: itinerário usa todo o acesso construído`)
    for (const p of bridge.points) close(p.y, bridge.floor, `${access.id}: travessia permanece elevada`)
    for (let index = 1; index < bridge.points.length; index++) {
      const a = bridge.points[index - 1], b = bridge.points[index], distance = length(a, b)
      if (distance < 1e-7) continue
      const steps = Math.max(2, Math.ceil(distance)), dx = (b.x - a.x) / distance, dz = (b.z - a.z) / distance
      for (let sample = 0; sample <= steps; sample++) {
        const t = sample / steps
        for (const lateral of [-bridge.width / 2 + .35, 0, bridge.width / 2 - .35]) bridgeSamples.push({
          id: access.id, x: a.x + (b.x - a.x) * t - dz * lateral, y: bridge.floor, z: a.z + (b.z - a.z) * t + dx * lateral,
        })
      }
    }
    for (let index = 1; index < walk.length; index++) {
      const a = walk[index - 1], b = walk[index]
      close(a.y, .16, `${access.id}: passeio fica no piso físico`)
      close(b.y, .16, `${access.id}: passeio termina no piso físico`)
      for (const street of streets) for (let segment = 1; segment < street.points.length; segment++) {
        const clearance = segmentDistance(a, b, street.points[segment - 1], street.points[segment])
        assert(clearance > street.width / 2 + .35, `${access.id}: saída/passeio invade asfalto ${street.id}; folga ${clearance}`)
      }
      const steps = Math.max(2, Math.ceil(length(a, b) / 2))
      for (let sample = 0; sample <= steps; sample++) {
        const t = sample / steps
        groundSamples.push({ id: access.id, x: a.x + (b.x - a.x) * t, y: .16, z: a.z + (b.z - a.z) * t })
      }
    }
    const avenue = streets.find(street => street.id === 'avenida-norte')
    assert(bridge.points.some((b, index) => index > 0 && avenue.points.some((d, segment) => segment > 0 && segmentDistance(bridge.points[index - 1], b, avenue.points[segment - 1], d) < 1e-6)), `${access.id}: passarela precisa atravessar a avenida, sem término sobre ela`)
    assert(bridge.floor > 5, `${access.id}: passarela mantém gabarito livre para trânsito sob a avenida`)
  }
  let envelopeProbes = 0
  for (const service of plant.services) {
    const routes = passengerRoutes(service)
    for (const route of routes) assert(route.points.length >= 2 && route.points.every(p => [p.x, p.y, p.z].every(Number.isFinite)), `${service.id}/${route.id}: rota física finita`)
    close(length(routes[0].points.at(-1), routes[1].points[0]), 0, `${service.id}: ida e volta conectam no mesmo portão`)
    close(length(routes[1].points.at(-1), routes[0].points[0]), 0, `${service.id}: volta chega à mesma porta física`)
    for (const peer of peers) {
      for (const route of routes) {
        const gap = routeDistance(route.points, peer.points)
        assert(gap > .35 + peer.radius, `${service.id}/${route.id}: passageiro cruza ${peer.id}; folga ${gap}`)
        envelopeProbes++
      }
      for (const route of [service.inbound, service.outbound]) {
        const vehicleGap = routeDistance(route, peer.points), radius = Math.hypot(service.width, service.length) / 2
        assert(vehicleGap > radius + peer.radius, `${service.id}: carroceria cruza ${peer.id}; folga ${vehicleGap}`)
        envelopeProbes++
      }
    }
    for (const other of plant.services.filter(peer => peer.id !== service.id)) {
      for (const otherRoute of passengerRoutes(other)) {
        for (const route of routes) {
          assert(routeDistance(route.points, otherRoute.points) > .7, `${service.id}/${route.id}: passageiro cruza passageiro ${other.id}/${otherRoute.id}`)
          envelopeProbes++
        }
        for (const route of [service.inbound, service.outbound]) {
          assert(routeDistance(route, otherRoute.points) > Math.hypot(service.width, service.length) / 2 + .35, `${service.id}: veículo cruza passageiro ${other.id}/${otherRoute.id}`)
          envelopeProbes++
        }
      }
    }
    for (const [id, footprint] of Object.entries(PLANTA_COMPLEXO.footprints)) {
      if (id === 'arena' || id === 'estacao') continue // portals/stacked station are tested against real geometry below
      const blocker = { id, polygon: footprint.map(p => ({ x: p.x, y: p.z })) }
      for (const route of routes) for (let index = 1; index < route.points.length; index++) {
        const a = route.points[index - 1], b = route.points[index]
        if (Math.min(a.y, b.y) > 2) continue
        assert(segmentoLivre({ x: a.x, y: a.z }, { x: b.x, y: b.z }, [blocker], .35), `${service.id}/${route.id}: caminho atravessa ${id}`)
        envelopeProbes++
      }
    }
  }
  let temporalProbes = 0, doorProbes = 0
  const minimumTurnRadius = { bus: Infinity, car: Infinity }
  for (const entry of timetable.services) {
    const period = entry.period, service = entry.service
    const checks = new Set(entry.stages.flatMap(stage => [stage.at, stage.at + 1e-6, stage.at + stage.duration / 2, stage.at + stage.duration - 1e-6]))
    for (let seconds = 0; seconds < period; seconds += 1 / 30) checks.add(seconds)
    let previous, previousSeconds = -1
    const seen = new Set()
    for (const seconds of [...checks].sort((a, b) => a - b)) {
      const frame = entry.at(seconds), { vehicle, passenger } = frame
      assert(passenger.pose.visible, 'passageiro permanece um corpo físico dentro/fora do veículo')
      assert([vehicle.position.x, vehicle.position.y, vehicle.position.z, vehicle.heading, vehicle.speed, vehicle.doorsOpen].every(Number.isFinite))
      assert(passenger.pose.feet.some(foot => foot.supported), 'passageiro sem apoio')
      assert.equal(passenger.pose.seated, 0, 'trajeto não usa cadeira fictícia para fingir espera')
      seen.add(passenger.phase)
      if (previous) {
        const dt = seconds - previousSeconds
        assert(length(vehicle.position, previous.vehicle.position) <= 11 * dt + 1e-4, `${service.id}: veículo teleportou`)
        const travelled = length(vehicle.position, previous.vehicle.position)
        close(Math.abs(vehicle.distance - previous.vehicle.distance), travelled, `${service.id}: rodas giram conforme deslocamento e conservam ângulo nas paradas`, travelled < 1e-6 ? 1e-6 : .002)

        const turn = Math.abs(Math.atan2(Math.sin(vehicle.heading - previous.vehicle.heading), Math.cos(vehicle.heading - previous.vehicle.heading)))
        const requiredRadius = service.kind === 'bus' ? 6 : service.kind === 'car' ? 3.5 : Infinity
        assert(turn <= travelled / (requiredRadius - .012) + 1e-8, `${service.id}: giro incompatível com a carroceria em ${seconds}; raio=${travelled / turn}, mínimo=${requiredRadius}m`)
        if (service.kind !== 'metro' && turn > .0001 && travelled > .001) minimumTurnRadius[service.kind] = Math.min(minimumTurnRadius[service.kind], travelled / turn)

        assert(length(passenger.pose.hip, previous.passenger.pose.hip) <= 12 * dt + .005, `${service.id}: passageiro teleportou`)
      }
      const passengerLocal = localPoint(passenger.pose.hip, vehicle)
      const opening = service.door.side * passengerLocal.x - service.width / 2
      if (Math.abs(opening) < .38 && Math.abs(passengerLocal.z - service.door.longitudinal) < service.door.width / 2 + .35) {
        close(vehicle.speed, 0, 'cruza soleira somente com veículo parado')
        close(vehicle.doorsOpen, 1, 'corpo só cruza soleira com porta completamente aberta')
        doorProbes++
      }
      if (vehicle.speed > .001) close(vehicle.doorsOpen, 0, 'veículo fecha portas antes de partir')
      previous = frame; previousSeconds = seconds; temporalProbes++
    }
    for (const phase of ['riding', 'alighting', 'walking', 'at-gate', 'boarding']) assert(seen.has(phase), `${service.id}: falta ${phase}`)
    const start = entry.at(0), end = entry.at(period - 1e-6)
    close(length(start.vehicle.position, end.vehicle.position), 0, `${service.id}: ciclo do veículo fecha sem teleporte`)
    close(entry.at(period + 1e-6).vehicle.distance, end.vehicle.distance, `${service.id}: rodas fecham o ciclo sem reiniciar ângulo`, .0001)

    close(length(start.passenger.pose.hip, end.passenger.pose.hip), 0, `${service.id}: ciclo do passageiro fecha sem teleporte`)
    assert.deepEqual(entry.at(-10), entry.at(0))
  }
  assert(doorProbes > 20)
  if (process.argv.includes('--routes')) {
    console.log(JSON.stringify({ status: 'PASS', mode: 'routes', envelopeProbes, temporalProbes, doorProbes, minimumTurnRadius }))
  } else {
    const { criarEntornoComplexo } = await import('../src/escalacao/presidencia-complexo-entorno.ts')
    const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
    const scene = new THREE.Scene(), environment = criarEntornoComplexo(scene, state), architecture = criarArquiteturaComplexo(scene, state)
    for (const service of plant.services) for (const route of passengerRoutes(service)) for (const access of architecture.seatAccess) {
      assert(routeDistance(route.points, access.points) > .7, `${service.id}/${route.id}: passageiro cruza acesso físico ${access.id}`)
      envelopeProbes++
    }
    const actors = criarTransporteComplexo(scene, state, options), statics = [], resources = new Set()
    for (const group of [environment.root, architecture.root]) group.traverse(object => { if (object instanceof THREE.Mesh) statics.push(object) })
    actors.root.traverse(object => { if (object instanceof THREE.Mesh) { resources.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) resources.add(material) } assert(!/olho|nariz|boca|eye|mouth|nose/i.test(object.name)) })
    const disposed = new Map([...resources].map(resource => [resource, 0]))
    for (const resource of resources) resource.addEventListener('dispose', () => disposed.set(resource, disposed.get(resource) + 1))
    const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
    scene.updateMatrixWorld(true)
    let bridgeProbes = 0, groundAccessProbes = 0
    for (const [samples, kind] of [[bridgeSamples, 'passarela'], [groundSamples, 'passeio']]) for (const point of samples) {
      ray.set(new THREE.Vector3(point.x, point.y + .35, point.z), down); ray.near = 0; ray.far = .7
      const hit = ray.intersectObjects(statics, false).find(hit => hit.face && hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y > .9)
      assert(hit, `${point.id}: ${kind} sem piso físico ${point.x},${point.z}`)
      close(hit.point.y, point.y, `${point.id}: ${kind} possui piso contínuo, sem queda/asfalto no desembarque`, .012)
      if (kind === 'passarela') bridgeProbes++; else groundAccessProbes++
    }
    const identities = new Map([...actors.inspect().vehicles, ...actors.inspect().passengers].map(actor => [actor.id, actor.rigId]))
    let footProbes = 0, bodyProbes = 0, wheelProbes = 0
    for (const entry of timetable.services) {
      const requestedVehicle = process.argv.find(argument => argument.startsWith('--vehicle='))?.slice(10)
      if (requestedVehicle && requestedVehicle !== entry.service.kind) continue
      const samples = new Set(entry.stages.flatMap(stage => [stage.at, stage.at + stage.duration / 2, stage.at + stage.duration - 1e-6]))
      for (const stage of entry.stages.filter(stage => ['arriving', 'departing', 'returning'].includes(stage.phase))) for (let sample = 1; sample < 9; sample++) samples.add(stage.at + stage.duration * sample / 9)
      for (const seconds of samples) {
        actors.update(seconds); scene.updateMatrixWorld(true)
        const vehicle = actors.inspect().vehicles.find(vehicle => vehicle.id === entry.service.id)
        for (const wheel of actors.wheels.find(actor => actor.vehicleId === entry.service.id).meshes) {
          const box = new THREE.Box3().setFromObject(wheel, true), p = box.getCenter(new THREE.Vector3())
          ray.set(new THREE.Vector3(p.x, box.min.y + .4, p.z), down); ray.near = 0; ray.far = .8
          const hit = ray.intersectObjects(statics, false).find(hit => hit.face && hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y > .9)
          assert(hit, `${entry.service.id}: roda sem pista física em ${seconds}: ${p.toArray()}`)
          close(box.min.y, hit.point.y, `${entry.service.id}: roda não encosta na pista em ${seconds} (${p.toArray()} / ${hit.object.name})`, .026)
          wheelProbes++
        }
        const outline = [-1, 1].flatMap(x => [-1, 1].map(z => ({
          x: vehicle.position.x + x * vehicle.width / 2 * Math.cos(vehicle.heading) + z * vehicle.length / 2 * Math.sin(vehicle.heading),
          z: vehicle.position.z - x * vehicle.width / 2 * Math.sin(vehicle.heading) + z * vehicle.length / 2 * Math.cos(vehicle.heading),
        })))
        const edges = [[0, 1], [1, 3], [3, 2], [2, 0]]
        if (vehicle.kind === 'car') for (const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO) for (const slot of lot.slots) {
          if (Math.hypot(slot.center.x - vehicle.stop.position.x, slot.center.z - vehicle.stop.position.z) < .01) continue
          const reservedBay = { id: slot.id, polygon: slot.polygon.map(p => ({ x: p.x, y: p.z })) }
          for (const [a, b] of edges) assert(segmentoLivre({ x: outline[a].x, y: outline[a].z }, { x: outline[b].x, y: outline[b].z }, [reservedBay], 0), `${vehicle.id}: manobra invade vaga ${slot.id} em ${seconds}`)
        }
        const floor = vehicle.position.y + vehicle.floorHeight
        for (const solid of environment.solids) {
          if (solid.top <= floor + .025 || solid.base >= floor + (vehicle.kind === 'car' ? 1.95 : 2.52)) continue
          const blocker = { id: solid.id, polygon: solid.footprint.map(p => ({ x: p.x, y: p.z })) }
          for (const [a, b] of edges) assert(segmentoLivre({ x: outline[a].x, y: outline[a].z }, { x: outline[b].x, y: outline[b].z }, [blocker], 0), `${entry.service.id}: carroceria atravessa ${solid.id} em ${seconds}`)
          bodyProbes++
        }
      }
    }
    if (!process.argv.includes('--wheels')) for (const entry of timetable.services) {
      const probes = new Set([0, entry.markers.arrival, entry.markers.doorsOpen, entry.markers.exitClear, entry.markers.atGate + 1, entry.markers.boarding, entry.markers.boarded])
      for (const stage of entry.walking.inspect().stages) if (stage.phase === 'climbing' || stage.phase === 'descending' || stage.phase === 'turning') {
        for (const phase of [.02, .5, .98]) probes.add(entry.markers.doorsOpen + stage.at + stage.duration * phase)
      }
      for (let seconds = entry.markers.doorsOpen; seconds < entry.markers.boarded; seconds += 5) probes.add(seconds)
      for (const seconds of probes) {
        actors.update(seconds); scene.updateMatrixWorld(true)
        const frame = actors.inspect(), passenger = frame.passengers.find(passenger => passenger.vehicleId === entry.service.id)
        for (const actor of [...frame.vehicles, ...frame.passengers]) assert.equal(actor.rigId, identities.get(actor.id), 'mesmo corpo/veículo em todas as fases')
        const feet = actors.passengerFeet.find(actor => actor.id === passenger.id).feet
        const vehicleMeshes = []
        actors.root.getObjectByName(`transporte-${entry.service.id}`).traverse(object => { if (object instanceof THREE.Mesh) vehicleMeshes.push(object) })
        const surfaces = [...statics, ...vehicleMeshes]
        for (const [index, sole] of feet.entries()) {
          sole.geometry.computeBoundingBox(); const local = sole.geometry.boundingBox, contact = passenger.pose.feet[index]
          for (const x of [local.min.x, local.max.x]) for (const z of [local.min.z, local.max.z]) {
            const p = new THREE.Vector3(x, local.min.y, z).applyMatrix4(sole.matrixWorld)
            ray.set(new THREE.Vector3(p.x, p.y + .4, p.z), down); ray.near = 0; ray.far = 1.2
            const hit = ray.intersectObjects(surfaces, false).find(hit => hit.face && hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y > .9)
            assert(hit, `${entry.service.id}: sola sem piso físico em ${seconds}: ${p.toArray()}`)
            assert(p.y >= hit.point.y - .012, `${entry.service.id}: sola entrou no piso em ${seconds}: ${p.y}/${hit.point.y}`)
            if (contact.supported) close(p.y, hit.point.y, `${entry.service.id}: sola apoiada flutua em ${seconds}`, .012)
            footProbes++
          }
        }
        const hip = passenger.pose.hip, floor = Math.min(...passenger.pose.feet.map(foot => foot.position.y))
        for (const solid of environment.solids) {
          if (solid.top <= floor + .025 || solid.base >= floor + 1.8) continue
          // Riser fronts are below the pelvis; the foot tests cover each tread.
          if (solid.top <= hip.y - .12) continue
          const blocker = { id: solid.id, polygon: solid.footprint.map(p => ({ x: p.x, y: p.z })) }
          assert(segmentoLivre({ x: hip.x, y: hip.z }, { x: hip.x, y: hip.z }, [blocker], .30), `${entry.service.id}: corpo atravessa ${solid.id} em ${seconds}`)
          bodyProbes++
        }
        const before = JSON.stringify(actors.inspect()), transforms = []
        actors.root.traverse(object => transforms.push([...object.position.toArray(), ...object.quaternion.toArray()]))
        actors.update(seconds)
        assert.equal(JSON.stringify(actors.inspect()), before, 'mesmo relógio mantém quadro idêntico')
        const after = []; actors.root.traverse(object => after.push([...object.position.toArray(), ...object.quaternion.toArray()]))
        assert.deepEqual(after, transforms, 'pausa não muda portas/rodas/corpo')
      }
    }

    actors.dispose(); actors.dispose()
    assert.equal(actors.root.parent, null)
    for (const count of disposed.values()) assert.equal(count, 1, 'recursos próprios descartados uma vez')
    environment.dispose(); architecture.dispose()
    console.log(JSON.stringify({ status: 'PASS', envelopeProbes, temporalProbes, doorProbes, bridgeProbes, groundAccessProbes, footProbes, bodyProbes, wheelProbes, minimumTurnRadius }))
  }
} finally { hooks.deregister() }
