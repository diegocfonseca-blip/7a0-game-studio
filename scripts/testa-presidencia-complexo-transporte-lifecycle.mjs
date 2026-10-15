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
const close = (a, b, message, epsilon = 1e-5) => assert(Math.abs(a - b) < epsilon, `${message}: ${a} / ${b}`)
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const vehiclePose = vehicle => ({ id: vehicle.id, rigId: vehicle.rigId, position: vehicle.position, heading: vehicle.heading, phase: vehicle.phase, speed: vehicle.speed, doorsOpen: vehicle.doorsOpen })
try {
  const { criarTransporteComplexo } = await import('../src/escalacao/presidencia-complexo-transporte.ts')
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { publicoDoEstadio } = await import('../src/escalacao/presidencia-estadio-publico.ts')
  const { distribuirFluxoComplexo } = await import('../src/escalacao/presidencia-complexo-fluxo.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
  const lowerSave = { inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.k === 'camarote' ? 0 : sector.cost])), ext: ['loja', 'estac'] }
  const lower = complexoDoEstadio(lowerSave)
  const demand = match => {
    const home = publicoDoEstadio(lowerSave, { division: 'V', support: 10, match })
    return { mode: 'career', enabled: true, home, visits: { home: Number(home.inside > 0), away: 0 }, station: false, parking: true, destinations: 1 }
  }
  const idle = demand('idle'), playing = demand('playing'), idleFlow = distribuirFluxoComplexo(idle), playingFlow = distribuirFluxoComplexo(playing)
  assert.equal(idleFlow.transport.parkingPassengers, 1); assert.equal(playingFlow.transport.parkingPassengers, 0)
  const options = flow => ({ ...flow.transport, transit: true, source: 'career', homeColor: '#1b7a3d', awayColor: '#c2452f' })
  const scene = new THREE.Scene(), actors = criarTransporteComplexo(scene, lower, options(idleFlow))
  actors.update(180)
  const before = actors.inspect(), passenger = before.passengers.find(p => p.transport === 'car'), car = before.vehicles.find(v => v.kind === 'car')
  assert(passenger && car); assert.notEqual(passenger.phase, 'riding', 'regressão começa com passageiro fora do carro')
  close(distance(car.position, { x: 54, y: .035, z: 163 }), 0, 'carro estava parado na vaga aos180s')
  const callerOptions = options(playingFlow), optionsCopy = structuredClone(callerOptions)
  actors.configure(callerOptions)
  assert.deepEqual(callerOptions, optionsCopy, 'configure não muda dados do chamador')
  const configured = actors.inspect()
  assert.equal(configured.seconds, 180)
  assert.deepEqual(configured.vehicles.map(vehiclePose), before.vehicles.map(vehiclePose), 'demanda muda sem trocar UUID, posição, portas ou fase de veículos')
  assert.deepEqual(configured.passengers.map(p => ({ id: p.id, rigId: p.rigId, pose: p.pose })), before.passengers.map(p => ({ id: p.id, rigId: p.rigId, pose: p.pose })), 'não apaga passageiro que ainda está caminhando')
  const allocation = actors.allocation()
  assert.equal(allocation.requested.parkingPassengers, 0); assert.equal(allocation.effective.parkingPassengers, 1)
  assert.equal(allocation.draining.parkingPassengers, 1)
  const effectiveFlow = distribuirFluxoComplexo({ ...playing, retainedTransport: allocation.effective })
  assert.equal(effectiveFlow.visits.home, 0, 'visita nova aguarda liberação da vaga ocupada pelo passageiro antigo')
  assert.equal(effectiveFlow.used.home, playing.home.outside)
  const pending = allocation.pending.find(change => change.vehicleId === car.id)
  assert(pending && pending.at > 180, 'retirada é agendada na origem física futura')
  actors.configure(callerOptions)
  assert.deepEqual(actors.allocation().pending, allocation.pending, 'mesmo pedido não adia a retirada a cada render')
  const frozen = actors.inspect(); actors.update(180); assert.deepEqual(actors.inspect(), frozen, 'relógio repetido mantém quadro')
  let frames = 0
  for (let seconds = 180; seconds < pending.at; seconds += .5) {
    actors.update(seconds)
    const frame = actors.inspect(), retained = frame.passengers.find(p => p.id === passenger.id)
    assert.equal(retained?.rigId, passenger.rigId, 'mesmo passageiro permanece até chegar à origem fechada')
    assert.equal(frame.vehicles.find(v => v.id === car.id)?.rigId, car.rigId)
    const flow = distribuirFluxoComplexo({ ...playing, retainedTransport: actors.allocation().effective })
    for (const side of ['home', 'away', 'cars']) assert(flow.used[side] <= flow.budget[side] + flow.draining[side])
    frames++
  }
  actors.update(pending.at - .00001)
  const arrivingAtOrigin = actors.inspect().vehicles.find(v => v.id === car.id)
  assert(arrivingAtOrigin.speed < .001, 'troca aguarda a parada completa')
  assert.equal(actors.update(pending.at + .00001), true, 'update avisa ao renderer que uma vaga foi liberada')
  const retired = actors.inspect(), sameCar = retired.vehicles.find(v => v.id === car.id)
  assert.equal(sameCar.rigId, car.rigId); close(distance(sameCar.position, arrivingAtOrigin.position), 0, 'timetable novo começa na mesma posição física', .001)
  assert.equal(sameCar.speed, 0); assert.equal(sameCar.doorsOpen, 0)
  assert(!retired.passengers.some(p => p.id === passenger.id))
  const retainedBody = scene.getObjectByProperty('uuid', passenger.rigId)
  assert(retainedBody && !retainedBody.visible, 'corpo fica guardado e pode ser usado na próxima viagem')
  assert.equal(actors.allocation().effective.parkingPassengers, 0)
  const released = distribuirFluxoComplexo({ ...playing, retainedTransport: actors.allocation().effective })
  assert.equal(released.visits.home, 1, 'vaga liberada pode atender visita sem aumentar amostra')
  // A new request at the stopped origin uses that same body, not a replacement.
  actors.configure(options(idleFlow))
  const restored = actors.inspect().passengers.find(p => p.id === passenger.id)
  assert.equal(restored?.rigId, passenger.rigId); assert.equal(restored.phase, 'riding')
  actors.dispose(); actors.dispose(); assert.equal(scene.children.length, 0)

  // Away demand can disappear while its passenger is walking. Retained bodies
  // are an explicit draining allowance; no new people use those occupied slots.
  const fullSave = { inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost])), ext: STADIUM_EXTRAS.map(extra => extra.k) }
  const full = complexoDoEstadio(fullSave), scene2 = new THREE.Scene()
  const originalDemand = { mode: 'career', enabled: true, home: { outside: 6, cars: 3, playing: true }, away: { outside: 2, cars: 1, playing: true }, visits: { home: 1, away: 1 }, station: true, parking: true, destinations: 3 }
  const moving = criarTransporteComplexo(scene2, full, options(distribuirFluxoComplexo(originalDemand)))
  const allResources = new Set(), disposed = new Map()
  moving.root.traverse(object => { if (object instanceof THREE.Mesh) { allResources.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) allResources.add(material) } })
  for (const resource of allResources) { disposed.set(resource, 0); resource.addEventListener('dispose', () => disposed.set(resource, disposed.get(resource) + 1)) }
  const metroInitial = moving.inspect().vehicles.find(v => v.kind === 'metro'), outsideTime = metroInitial.markers.exitClear + 5
  moving.update(outsideTime)
  const metroPassenger = moving.inspect().passengers.find(p => p.transport === 'metro')
  assert(metroPassenger && metroPassenger.phase !== 'riding')
  const absentAway = { ...originalDemand, away: undefined, visits: { home: 1, away: 0 } }
  moving.configure(options(distribuirFluxoComplexo(absentAway)))
  const drainingFlow = distribuirFluxoComplexo({ ...absentAway, retainedTransport: moving.allocation().effective })
  assert.equal(drainingFlow.budget.away, 0); assert.equal(drainingFlow.draining.away, 1); assert.equal(drainingFlow.used.away, 1)
  assert.equal(drainingFlow.visits.away, 0); assert.equal(drainingFlow.fans.away, 0)
  const metroPending = moving.allocation().pending.find(p => p.vehicleId === metroPassenger.vehicleId)
  assert(metroPending && metroPending.at > outsideTime)
  moving.update(metroPending.at - .001)
  assert.equal(moving.inspect().passengers.find(p => p.id === metroPassenger.id)?.rigId, metroPassenger.rigId)
  moving.update(metroPending.at + .001)
  assert(!moving.inspect().passengers.some(p => p.id === metroPassenger.id))
  assert.equal(moving.inspect().vehicles.find(v => v.id === metroPassenger.vehicleId).rigId, metroInitial.rigId, 'serviço urbano segue vazio com o mesmo veículo')
  const drained = distribuirFluxoComplexo({ ...absentAway, retainedTransport: moving.allocation().effective })
  assert.equal(drained.draining.away, 0); assert.equal(drained.used.away, 0)
  moving.dispose(); moving.dispose(); assert.equal(scene2.children.length, 0)
  for (const count of disposed.values()) assert.equal(count, 1, 'recursos preservados em configure são descartados exatamente uma vez')
  console.log(JSON.stringify({ status: 'PASS', frames, idleToPlaying: true, sameVehicleAndPassenger: true, noTeleport: true, drainingBudget: true, safeOriginRetirement: true }))
} finally { hooks.deregister() }
