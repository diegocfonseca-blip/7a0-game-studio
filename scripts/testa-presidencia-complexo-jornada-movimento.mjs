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
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const visiblePoses = snapshot => ({
 vehicles: snapshot.vehicles.map(({ id, rigId, position, heading, speed, doorsOpen }) => ({ id, rigId, position, heading, speed, doorsOpen })),
 passengers: snapshot.passengers.map(({ id, rigId, pose }) => ({ id, rigId, pose })),
})
try {
 const { criarRelogioJornadaComplexo } = await import('../src/escalacao/presidencia-complexo-jornada-relogio.ts')
 const { criarTransporteComplexo, roteiroTransporteComplexo } = await import('../src/escalacao/presidencia-complexo-transporte.ts')
 const { criarVisitaComplexo, opcoesVisitaComplexo } = await import('../src/escalacao/presidencia-complexo-visita.ts')
 const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
 const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
 const { distribuirFluxoComplexo } = await import('../src/escalacao/presidencia-complexo-fluxo.ts')
 const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
 const jornada = (phase, key = 'temporada-4/rodada-1', variantSeed = 9) => ({ key, phase, variantSeed })
 const save = { inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost])), ext: STADIUM_EXTRAS.map(extra => extra.k) }
 const state = complexoDoEstadio(save), scene = new THREE.Scene()
 const input = { metroPassengers: 1, busPassengers: 1, parkingPassengers: 1, cars: 1, transit: true, source: 'career', journey: jornada('arrival') }
 for (const sample of [{ inv: {}, ext: [] }, { inv: {}, ext: ['estac', 'estacao'] }, { ...save, ext: ['estac', 'estacao'] }, save]) {
  for (const seed of [0, 9, 41]) {
   const plan = roteiroTransporteComplexo(complexoDoEstadio(sample), { ...input, journey: jornada('playing', 'qa-stage', seed) })
   const held = plan.at(10000)
   assert.deepEqual(held.problems, [])
   assert(held.vehicles.every(vehicle => vehicle.speed === 0 && ['terminal', 'parked'].includes(vehicle.phase)), 'da várzea ao completo, espera só ocorre no terminal/vaga')
   assert(held.passengers.every(passenger => passenger.phase === 'at-gate'))
  }
 }
 const beforeInput = structuredClone(input), actors = criarTransporteComplexo(scene, state, input)
 assert.deepEqual(input, beforeInput)
 const start = actors.inspect(), holdAfter = Math.max(...start.vehicles.map(v => v.markers.atGate)) + 40
 actors.update(holdAfter)
 const atGate = actors.inspect()
 assert.equal(atGate.passengers.length, 3)
 assert(atGate.passengers.every(p => p.phase === 'at-gate'))
 assert(atGate.vehicles.every(v => v.heldAtGate && v.speed === 0 && ['terminal', 'parked'].includes(v.phase)), 'nenhum veículo congela rodando ou na pista')
 const budgetInput = { mode: 'career', enabled: true, home: { outside: 6, cars: 4, playing: true }, away: { outside: 2, cars: 1, playing: true }, visits: { home: 1, away: 1 }, station: true, parking: true, destinations: 3, journey: input.journey }
 for (const phase of ['playing', 'interval', 'playing']) {
  const before = visiblePoses(actors.inspect())
  actors.configure({ ...input, journey: jornada(phase) })
  assert.deepEqual(visiblePoses(actors.inspect()), before, `${phase}: mesmo rig, pose, rodas e portas ao mudar fase`)
  actors.update(actors.inspect().seconds + 200)
  assert.deepEqual(visiblePoses(actors.inspect()), before, `${phase}: passageiro permanece no destino durante partida`)
 }
 const departureTime = actors.inspect().seconds, departurePose = visiblePoses(actors.inspect())
 actors.configure({ ...input, journey: jornada('departure') })
 assert.deepEqual(visiblePoses(actors.inspect()), departurePose, 'apito final não teleporta passageiros nem veículos')
 assert.deepEqual(actors.allocation().requested, { metroPassengers: 0, busPassengers: 0, parkingPassengers: 0, cars: 1 })
 assert.equal(actors.allocation().effective.metroPassengers, 1, 'contagem retém corpo a caminho do embarque')
 const finishAt = Math.max(...actors.allocation().pending.map(p => p.at)) + 1
 let previous = actors.inspect(), frames = 0
 for (let t = departureTime + .25; t <= finishAt; t += .25) {
  actors.update(t)
  const now = actors.inspect()
  for (const car of now.vehicles) {
   const old = previous.vehicles.find(v => v.id === car.id)
   assert.equal(car.rigId, old.rigId)
   assert(distance(car.position, old.position) <= 2.51, `${car.kind}: continuidade da saída`)
   if (car.speed > .001) assert.equal(car.doorsOpen, 0, 'veículo só anda de portas fechadas')
  }
  for (const passenger of now.passengers) {
   const old = previous.passengers.find(p => p.id === passenger.id)
   assert.equal(passenger.rigId, old.rigId)
   const limit = passenger.phase === 'riding' ? 2.6 : .7
   assert(distance(passenger.pose.hip, old.pose.hip) <= limit, `${passenger.transport}: passageiro não salta no retorno`)
  }
  const flow = distribuirFluxoComplexo({ ...budgetInput, journey: jornada('departure'), retainedTransport: actors.allocation().effective })
  for (const side of ['home', 'away', 'cars']) assert(flow.used[side] <= flow.budget[side] + flow.draining[side])
  previous = now; frames++
 }
 actors.update(finishAt)
 const allocationBeforeReturn = distribuirFluxoComplexo({ ...budgetInput, journey: jornada('departure'), retainedTransport: { metroPassengers: 1, busPassengers: 1, parkingPassengers: 1, cars: 1 } })
 const allocationAfterReturn = distribuirFluxoComplexo({ ...budgetInput, journey: jornada('departure'), retainedTransport: actors.allocation().effective })
 for (const key of ['used', 'visits', 'pedestrians', 'fans', 'streetCars', 'transport']) assert.deepEqual(allocationAfterReturn[key], allocationBeforeReturn[key], `${key}: passageiros retornados não viram corpos novos na rua`)
 assert.deepEqual(allocationAfterReturn.reservedTransport, { metroPassengers: 1, busPassengers: 1, parkingPassengers: 1, cars: 0 })
 assert.equal(actors.inspect().passengers.length, 0, 'todos voltaram ao transporte antes da amostra ser liberada')
 assert.equal(actors.inspect().vehicles.length, 3, 'serviço urbano continua no cotidiano')
 const oldRigs = actors.inspect().vehicles.map(v => v.rigId)
 actors.configure({ ...input, journey: jornada('arrival', 'temporada-4/rodada-2', 41) })
 const pendingNewDay = Math.max(...actors.allocation().pending.map(p => p.at), finishAt)
 actors.update(pendingNewDay + 1)
 assert.deepEqual(actors.inspect().vehicles.map(v => v.rigId), oldRigs, 'mesmos veículos recebem nova partida na origem')
 assert(actors.inspect().passengers.length > 0)
 const other = criarTransporteComplexo(new THREE.Scene(), state, { ...input, journey: jornada('arrival', 'temporada-4/rodada-2', 41) })
 assert.notDeepEqual(start.vehicles.map(v => v.markers.arrival), other.inspect().vehicles.map(v => v.markers.arrival), 'partidas diferentes têm chegadas distribuídas diferentes')
 const same = criarTransporteComplexo(new THREE.Scene(), state, input)
 assert.deepEqual(start.vehicles.map(v => v.markers.arrival), same.inspect().vehicles.map(v => v.markers.arrival), 'mesma partida mantém chegada determinística')
 other.dispose(); same.dispose()

 // A destination can be a real stadium seat instead of the transport's gate.
 const architecture = criarArquiteturaComplexo(scene, state)
 const access = architecture.seatAccess.find(access => access.side === 'home' && access.seat.tier === 'lower')
 assert(access)
 const visit = criarVisitaComplexo(scene, { ...opcoesVisitaComplexo(state, access), journey: jornada('arrival') })
 assert.deepEqual(visit.inspect().problems, [])
 visit.update(visit.period + 20)
 assert.equal(visit.inspect().pose.phase, 'seated')
 assert(visit.inspect().journey.holding)
 const seated = structuredClone(visit.inspect().pose), rigId = visit.inspect().rigId, visitTime = visit.inspect().seconds
 visit.configureJourney(jornada('playing')); visit.update(visitTime + 1200)
 assert.deepEqual(visit.inspect().pose, seated, 'visita não abandona cadeira porque passaram 90 s')
 visit.configureJourney(jornada('departure'))
 assert.deepEqual(visit.inspect().pose, seated)
 visit.update(visitTime + 1200 + visit.period + 20)
 assert(visit.inspect().journey.completed)
 assert.equal(visit.inspect().rigId, rigId)
 const atOrigin = structuredClone(visit.inspect().pose)
 visit.update(visitTime + 1200 + 3 * visit.period)
 assert.deepEqual(visit.inspect().pose, atOrigin, 'após saída não volta a entrar em passeio infinito')
 visit.dispose(); architecture.dispose(); actors.dispose()

 // Changing match while someone is walking finishes their old route first.
 const clock = criarRelogioJornadaComplexo({ id: 'pedestre', period: 100, holdAt: 45, journey: jornada('arrival') })
 clock.update(20)
 const localBefore = clock.inspect().localSeconds
 clock.configure(jornada('arrival', 'next', 30)); clock.update(20)
 assert.equal(clock.inspect().localSeconds, localBefore)
 assert.equal(clock.inspect().key, input.journey.key)
 clock.update(120)
 assert.equal(clock.inspect().key, 'next')
 assert(clock.inspect().localSeconds < 45)
 clock.update(500)
 assert.equal(clock.inspect().localSeconds, 45)
 assert(clock.inspect().holding)
 const legacy = criarRelogioJornadaComplexo({ id: 'qa', period: 100, holdAt: 45 })
 assert.equal(legacy.update(1234), 1234)
 legacy.configure(jornada('arrival')); assert.equal(legacy.update(1234), 34, 'calendário anexado mantém pose no ciclo já visível')
 legacy.update(2000); assert.equal(legacy.inspect().localSeconds, 45)
 const lateLegacy = criarRelogioJornadaComplexo({ id: 'qa-late', period: 100, holdAt: 45, initialOffset: 10 })
 assert.equal(lateLegacy.update(60), 70)
 lateLegacy.configure(jornada('arrival')); assert.equal(lateLegacy.update(60), 70)
 lateLegacy.update(100); assert.equal(lateLegacy.inspect().key, input.journey.key)
 assert(lateLegacy.inspect().localSeconds < 45)
 const gated = criarRelogioJornadaComplexo({id:'acesso-compartilhado',period:100,holdAt:45,journey:jornada('arrival')})
 assert.equal(gated.update(100,true),0,'novo pedestre aguarda na origem enquanto o corredor está ocupado')
 gated.update(101);assert(gated.inspect().localSeconds>0&&gated.inspect().localSeconds<=1)
 gated.update(200,true);assert.equal(gated.inspect().localSeconds,45,'quem já entrou continua até o assento')
 gated.configure(jornada('arrival','novo-jogo',42));gated.update(400,true)
 assert(gated.inspect().completed);assert.equal(gated.inspect().key,input.journey.key,'a jornada seguinte aguarda na origem após retorno')
 const waiting=gated.inspect().localSeconds;gated.update(800,true);assert.equal(gated.inspect().localSeconds,waiting)
 gated.update(801);assert.equal(gated.inspect().key,'novo-jogo');assert(gated.inspect().localSeconds<1,'a liberação não recupera o tempo que ficou esperando')
 const retiring = criarRelogioJornadaComplexo({id:'visita-antiga',period:100,holdAt:45,journey:jornada('playing')})
 retiring.update(200);assert.equal(retiring.inspect().localSeconds,45)
 retiring.configure(jornada('arrival','outro-transporte',99));retiring.update(400,false,true)
 assert(retiring.inspect().completed);assert.equal(retiring.inspect().key,input.journey.key,'visita transferida termina na origem, sem iniciar outro passeio')
 const end=retiring.inspect().localSeconds;retiring.update(700,false,true);assert.equal(retiring.inspect().localSeconds,end)
 console.log(JSON.stringify({ status: 'PASS', phases: ['arrival','playing','interval','departure','idle'], frames, noTeleport: true, retainedBudget: true, seededArrivals: true, sameSeatRig: true, routeGeometryChanged: false }))
} finally { hooks.deregister() }
