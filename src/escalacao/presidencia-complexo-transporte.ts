import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { EstadoComplexo } from './presidencia-complexo-model'
import type { JornadaComplexo } from './presidencia-complexo-jornada'
import type { AcessoAssentoComplexo } from './presidencia-complexo-arquitetura'
import { gerarPlantaTransporte, type ServicoTransporteComplexo } from './presidencia-complexo-transporte-model'
import { criarCorpoVisitaComplexo, roteiroPasseioComplexo, roteiroVisitaComplexo, type PontoVisitaComplexo, type QuadroVisitaComplexo } from './presidencia-complexo-visita'

export type OpcoesTransporteComplexo = {
  transit?: boolean
  metroPassengers?: number
  busPassengers?: number
  parkingPassengers?: number
  cars?: number
  source?: 'career' | 'qa-sample'
  homeColor?: string
  awayColor?: string
  /** A single existing train changes its passenger route at its origin. */
  metroSide?: 'home' | 'away'
  /** Real seats allocated by the caller; no duplicate visit body is created. */
  seatAccess?: Partial<Record<'home' | 'away', AcessoAssentoComplexo>>
  journey?: Pick<JornadaComplexo, 'key' | 'phase' | 'variantSeed'>
}
type ContagensTransporteComplexo = { metroPassengers: number; busPassengers: number; parkingPassengers: number; cars: number }
export type AlocacaoTransporteComplexo = {
  requested: ContagensTransporteComplexo
  effective: ContagensTransporteComplexo
  draining: ContagensTransporteComplexo
  metroSide: 'home' | 'away'
  pending: { vehicleId: string; at: number; passengers: number; active: boolean }[]
}
type VehiclePhase = 'origin' | 'arriving' | 'opening' | 'unloading' | 'closing' | 'departing' | 'terminal' | 'returning' | 'boarding' | 'parked'
type PassengerPhase = 'riding' | 'alighting' | 'walking' | 'at-gate' | 'sitting' | 'seated' | 'standing' | 'boarding'
type Point = PontoVisitaComplexo
type VehiclePose = { position: Point; heading: number; speed: number; distance: number; phase: VehiclePhase; doorsOpen: number }
type Motion = ReturnType<typeof motionAlong>
type Stage = { at: number; duration: number; phase: VehiclePhase; motion?: Motion; openingFrom?: number; openingTo?: number; position: Point; heading: number; wheelFrom: number; wheelDirection?: number }
const clamp = (n: number, low = 0, high = 1) => Math.max(low, Math.min(high, n))
const smooth = (n: number) => n * n * (3 - 2 * n)
const delta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
const lerpPoint = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t })
const requested = (n: number | undefined) => Number.isFinite(n) ? clamp(Math.floor(n!), 0, 1) : 0
const cleanSeconds = (n: number) => Number.isFinite(n) ? clamp(n, 0, 1e10) : 0
const finite = (p: Point) => p && [p.x, p.y, p.z].every(Number.isFinite)

/** The measured plant already rounds road corners. Motion follows that exact
 * centreline, with a finite acceleration/braking ramp and no corner teleport. */
function motionAlong(points: readonly Point[], speed: number, fixedHeading?: number, endpointHeadings?: [number, number]) {
  const legs: { a: Point; b: Point; length: number; at: number; heading: number }[] = []
  let length = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], run = distance(a, b)
    if (run < 1e-7) continue
    legs.push({ a, b, length: run, at: length, heading: Math.atan2(b.x - a.x, b.z - a.z) }); length += run
  }
  const ramp = Math.min(2, Math.sqrt(length / speed)), duration = length / speed + ramp
  function at(seconds: number) {
    const t = clamp(seconds, 0, duration)
    let travelled = 0, velocity = 0
    if (t < ramp) { travelled = speed * t * t / (2 * ramp); velocity = speed * t / ramp }
    else if (t > duration - ramp) { const left = duration - t; travelled = length - speed * left * left / (2 * ramp); velocity = speed * left / ramp }
    else { travelled = speed * (t - ramp / 2); velocity = speed }
    const index = Math.max(0, legs.findIndex(leg => travelled < leg.at + leg.length - 1e-8))
    const leg = travelled >= length - 1e-8 ? legs.at(-1) : legs[index]
    if (!leg) return { position: { ...points[0] }, heading: fixedHeading ?? 0, speed: 0, distance: 0 }
    const fraction = clamp((travelled - leg.at) / leg.length)
    const previous = legs[Math.max(0, legs.indexOf(leg) - 1)] ?? leg, next = legs[Math.min(legs.length - 1, legs.indexOf(leg) + 1)] ?? leg
    // Dense measured bends interpolate their tangent; straight legs stay exact.
    const start = leg === legs[0] && endpointHeadings ? endpointHeadings[0] : previous.heading + delta(previous.heading, leg.heading) * previous.length / (previous.length + leg.length)
    const end = leg === legs.at(-1) && endpointHeadings ? endpointHeadings[1] : leg.heading + delta(leg.heading, next.heading) * leg.length / (leg.length + next.length)
    return { position: lerpPoint(leg.a, leg.b, fraction), heading: fixedHeading ?? start + delta(start, end) * fraction,
      speed: velocity, distance: travelled }
  }
  return { at, duration, length, points }
}

function movePose(pose: QuadroVisitaComplexo, stop: ServicoTransporteComplexo['stop'], vehicle: VehiclePose): QuadroVisitaComplexo {
  const turn = delta(stop.heading, vehicle.heading), cos = Math.cos(turn), sin = Math.sin(turn)
  const transform = (p: Point): Point => {
    const x = p.x - stop.position.x, z = p.z - stop.position.z
    return { x: vehicle.position.x + x * cos + z * sin, y: vehicle.position.y + p.y - stop.position.y, z: vehicle.position.z - x * sin + z * cos }
  }
  return { ...pose, heading: pose.heading + turn, hip: transform(pose.hip),
    feet: pose.feet.map(foot => ({ ...foot, heading: foot.heading + turn, position: transform(foot.position) })) as QuadroVisitaComplexo['feet'] }
}

/** A passenger's complete body has cleared the vehicle before a door closes.
 * The return service is at the same stop before either sole enters its body. */
function clearOfVehicle(pose: QuadroVisitaComplexo, service: ServicoTransporteComplexo) {
  const h = service.stop.heading, cos = Math.cos(h), sin = Math.sin(h)
  return [pose.hip, ...pose.feet.map(foot => foot.position)].every(p => {
    const dx = p.x - service.stop.position.x, dz = p.z - service.stop.position.z
    const x = dx * cos - dz * sin, z = dx * sin + dz * cos
    return Math.abs(x) > service.width / 2 + .42 || Math.abs(z) > service.length / 2 + .42
  })
}

function prepareService(service: ServicoTransporteComplexo, passenger: boolean, originDelay = 0, seatAccess?: AcessoAssentoComplexo) {
  const problems: string[] = [], stages: Stage[] = []
  const routes = [service.inbound, service.outbound]
  if (routes.some(route => route.length < 2 || !route.every(finite))) problems.push('rota-veiculo-invalida')
  if (!problems.length && (distance(service.inbound.at(-1)!, service.stop.position) > .001 || distance(service.outbound[0], service.stop.position) > .001 || distance(service.inbound[0], service.outbound.at(-1)!) > .001)) problems.push('rota-veiculo-descontinua')
  if (passenger && service.passengerRoute.length < 2) problems.push('rota-passageiro-ausente')
  const access = passenger && seatAccess?.side === service.side ? seatAccess : undefined
  // One gait owns the whole route, including door thresholds, the gate,
  // architecture's actual risers and chair. Joining separate body poses here
  // would reset the feet and heading at the gate.
  const uniqueRoute = (points: readonly Point[]) => points.filter((p, index) => !index || distance(p, points[index - 1]) > 1e-7).map(p => ({ ...p }))
  const inbound = access ? uniqueRoute([...service.passengerRoute, ...access.points]) : service.passengerRoute
  const outbound = access ? uniqueRoute([...access.points].reverse().concat(service.passengerReturnRoute ?? [...service.passengerRoute].reverse())) : service.passengerReturnRoute
  const walking = passenger ? access
    ? roteiroVisitaComplexo({ id: `${service.id}-passageiro`, side: service.side, seat: access.seat, inbound, outbound, staySeconds: 12 })
    : roteiroPasseioComplexo({ inbound, outbound, staySeconds: 12 }) : undefined
  const walkingStages = walking?.inspect().stages ?? []
  if (walking?.problems.length) problems.push(...walking.problems)
  const fixedHeading = service.kind === 'metro' ? service.stop.heading : undefined
  const heading = (a: Point, b: Point) => Math.atan2(b.x - a.x, b.z - a.z)
  const originIn = heading(service.inbound[0], service.inbound[1]), originOut = heading(service.outbound.at(-2)!, service.outbound.at(-1)!)
  const originHeading = originOut + delta(originOut, originIn) / 2
  if (fixedHeading === undefined && Math.abs(delta(originIn, originOut)) > .4) problems.push('curva-da-origem-ausente')
  const arriving = motionAlong(service.inbound, service.kind === 'metro' ? 10 : service.kind === 'bus' ? 4.2 : 3.2, fixedHeading, [originHeading, service.stop.heading])
  const departing = motionAlong(service.outbound, service.kind === 'metro' ? 10 : service.kind === 'bus' ? 4.2 : 3.2, fixedHeading, [service.stop.heading, originHeading])
  const start = arriving.at(0), stop = arriving.at(arriving.duration), end = departing.at(departing.duration)
  if (Math.abs(delta(stop.heading, service.stop.heading)) > .08) problems.push('orientacao-da-parada-diverge')
  if (Math.abs(delta(start.heading, end.heading)) > .08) problems.push('orientacao-do-ciclo-diverge')
  if (Math.abs(delta(departing.at(0).heading, stop.heading)) > .08) problems.push('orientacao-da-saida-diverge')
  let period = 0, walkingAt = 0, exitAt = 0, boardingAt = 0, wheelDistance = 0
  function stationary(duration: number, phase: VehiclePhase, position: Point, heading: number, openingFrom = 0, openingTo = openingFrom) {
    if (duration <= 1e-8) return
    stages.push({ at: period, duration, phase, position, heading, openingFrom, openingTo, wheelFrom: wheelDistance }); period += duration
  }
  function drive(motion: Motion, phase: VehiclePhase) {
    const pose = motion.at(0)
    const wheelDirection = service.kind === 'metro' && motion === departing ? -1 : 1
    stages.push({ at: period, duration: motion.duration, phase, motion, position: pose.position, heading: pose.heading, wheelFrom: wheelDistance, wheelDirection })
    period += motion.duration; wheelDistance += motion.length * wheelDirection
  }
  stationary(3 + originDelay, 'origin', start.position, start.heading)
  drive(arriving, 'arriving')
  if (walking && !problems.length) {
    stationary(1.2, 'opening', stop.position, stop.heading, 0, 1)
    walkingAt = period
    const samples = Math.ceil(walking.period / .12)
    let firstClear = -1, lastClear = -1
    for (let i = 0; i <= samples; i++) {
      const t = Math.min(walking.period - 1e-7, i * .12), pose = walking.at(t)
      if (pose && clearOfVehicle(pose, service)) { firstClear = t; break }
    }
    for (let i = samples; i >= 0; i--) {
      const t = Math.min(walking.period - 1e-7, i * .12), pose = walking.at(t)
      if (pose && clearOfVehicle(pose, service)) { lastClear = t; break }
    }
    if (firstClear < 0 || lastClear <= firstClear) problems.push('passageiro-nao-sai-do-veiculo')
    exitAt = walkingAt + Math.max(0, firstClear) + .3
    boardingAt = walkingAt + Math.max(0, lastClear) - .3
    const roundTrip = 2.4 + departing.duration + arriving.duration
    // Very short visits keep the vehicle parked; otherwise it leaves and
    // waits at the physical terminus, returning before the passenger boards.
    if (service.kind !== 'car' && boardingAt - exitAt > roundTrip + 3) {
      stationary(exitAt - period, 'unloading', stop.position, stop.heading, 1)
      stationary(1.2, 'closing', stop.position, stop.heading, 1, 0)
      drive(departing, 'departing')
      const returnStart = boardingAt - 1.2 - arriving.duration - 2
      stationary(Math.max(0, returnStart - period), 'terminal', end.position, end.heading)
      drive(arriving, 'returning')
      stationary(1.2, 'opening', stop.position, stop.heading, 0, 1)
      stationary(walkingAt + walking.period - period, 'boarding', stop.position, stop.heading, 1)
    } else if (service.kind === 'car' && boardingAt - exitAt > 4) {
      stationary(exitAt - period, 'unloading', stop.position, stop.heading, 1)
      stationary(1.2, 'closing', stop.position, stop.heading, 1, 0)
      stationary(boardingAt - 1.2 - period, 'parked', stop.position, stop.heading)
      stationary(1.2, 'opening', stop.position, stop.heading, 0, 1)
      stationary(walkingAt + walking.period - period, 'boarding', stop.position, stop.heading, 1)
    } else stationary(walking.period, 'boarding', stop.position, stop.heading, 1)
    stationary(1.2, 'closing', stop.position, stop.heading, 1, 0)
  } else stationary(9, 'parked', stop.position, stop.heading)
  drive(departing, 'departing')
  stationary(3, 'origin', end.position, end.heading)
  const unique = [...new Set(problems)]
  function at(seconds: number) {
    if (unique.length) return undefined
    const safe = cleanSeconds(seconds), cycles = Math.floor(safe / period), time = safe % period, stage = stages.find(s => time < s.at + s.duration) ?? stages.at(-1)!
    const elapsed = clamp(time - stage.at, 0, stage.duration), motion = stage.motion?.at(elapsed)
    const vehicle: VehiclePose = { position: motion?.position ?? { ...stage.position }, heading: motion?.heading ?? stage.heading,
      speed: motion?.speed ?? 0, distance: cycles * wheelDistance + stage.wheelFrom + (motion?.distance ?? 0) * (stage.wheelDirection ?? 0), phase: stage.phase,
      doorsOpen: stage.motion ? 0 : (stage.openingFrom ?? 0) + ((stage.openingTo ?? 0) - (stage.openingFrom ?? 0)) * smooth(elapsed / stage.duration) }
    const walkingTime = time - walkingAt, outside = walking && walkingTime >= 0 && walkingTime < walking.period
    const initial = walking?.at(0), pose = outside ? walking.at(walkingTime) : initial ? movePose(initial, service.stop, vehicle) : undefined
    const chairPhase = pose && ['sitting', 'seated', 'standing'].includes(pose.phase) ? pose.phase as 'sitting' | 'seated' | 'standing' : undefined
    const phase: PassengerPhase = !outside ? 'riding' : time < exitAt ? 'alighting' : time >= boardingAt ? 'boarding' : chairPhase ?? (walkingTime >= walking.arrivalAt && walkingTime < walking.returnAt ? 'at-gate' : 'walking')
    return { vehicle, passenger: pose ? { pose, phase } : undefined }
  }
  const seatedAt = walkingStages.find(stage => stage.phase === 'seated')?.at
  // Stay just inside the constant seated stage: subtracting a large clock
  // offset must not round back into the last microsecond of sitting down.
  const holdAt = walkingAt + (seatedAt === undefined ? (walking?.arrivalAt ?? 0) + 1 : seatedAt + .001)
  return { service, walking, walkingStages, passenger, seatAccess: access, inbound, outbound, holdAt, period, problems: unique, at,
    markers: { arrival: 3 + originDelay + arriving.duration, doorsOpen: walkingAt, exitClear: exitAt, atGate: walkingAt + (walking?.arrivalAt ?? 0),
      seated: seatedAt === undefined ? walkingAt + (walking?.arrivalAt ?? 0) : walkingAt + seatedAt,
      hold: holdAt, leaveGate: walkingAt + (walking?.returnAt ?? 0), boarding: boardingAt, boarded: walkingAt + (walking?.period ?? 0) },
    stages: stages.map(({ at, duration, phase }) => ({ at, duration, phase })) }
}

/** Pure, seekable service timetables. Population is an explicit allocation by
 * the caller; missing demand never manufactures a passenger or a car. */
const originDelayFor = (service: ServicoTransporteComplexo, options: OpcoesTransporteComplexo) => {
  if (!options.journey) return 0
  let seed = options.journey.variantSeed >>> 0
  for (const character of service.id) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
  return 2 + (seed % 2100) / 100
}
const welcomesPassenger = (options: OpcoesTransporteComplexo) => !options.journey || ['arrival', 'playing', 'interval'].includes(options.journey.phase)
const passengerBudget = (kind: ServicoTransporteComplexo['kind'], value: OpcoesTransporteComplexo) => requested(kind === 'metro' ? value.metroPassengers : kind === 'bus' ? value.busPassengers : value.parkingPassengers)
/** The caller reserves one seat per side. If several services are enabled,
 * only one of their actual passengers can occupy that seat. */
function seatForService(service: ServicoTransporteComplexo, value: OpcoesTransporteComplexo, services: readonly ServicoTransporteComplexo[]) {
  const selected = services.find(candidate => candidate.side === service.side && passengerBudget(candidate.kind, value) > 0 && (candidate.kind !== 'car' || requested(value.cars) > 0))
  return selected?.id === service.id ? value.seatAccess?.[service.side] : undefined
}
export function roteiroTransporteComplexo(state: EstadoComplexo, options: OpcoesTransporteComplexo = {}) {
  const plant = gerarPlantaTransporte(state, { metroSide: options.metroSide })
  const accepting = welcomesPassenger(options)
  const budgets = { metro: accepting ? requested(options.metroPassengers) : 0, bus: accepting ? requested(options.busPassengers) : 0, car: accepting ? requested(options.parkingPassengers) : 0 }
  const cars = requested(options.cars), source = options.source ?? 'career'
  const services = state.valid ? plant.services.filter(service => service.kind === 'car' ? cars > 0 : options.transit === true || budgets[service.kind] > 0)
    .map(service => prepareService(service, budgets[service.kind] > 0, originDelayFor(service, options), seatForService(service, options, plant.services))) : []
  function at(seconds: number) {
    const safe = cleanSeconds(seconds)
    const sampleAt = (entry: ReturnType<typeof prepareService>) => entry.at(options.journey && welcomesPassenger(options) && entry.passenger ? Math.min(safe, entry.holdAt) : safe)
    return { seconds: safe,
      vehicles: services.flatMap(entry => { const pose = sampleAt(entry)?.vehicle; return pose ? [{ id: entry.service.id, kind: entry.service.kind, ...pose,
        width: entry.service.width, length: entry.service.length, wheelRadius: entry.service.wheelRadius, floorHeight: entry.service.floorHeight,
        period: entry.period, route: { inbound: entry.service.inbound, outbound: entry.service.outbound }, stages: entry.stages,
        stop: entry.service.stop, door: entry.service.door, markers: entry.markers }] : [] }),
      passengers: services.flatMap(entry => { const frame = sampleAt(entry)?.passenger; return frame ? [{ id: `${entry.service.id}-passageiro`, vehicleId: entry.service.id,
        transport: entry.service.kind, side: entry.service.side, seatId: entry.seatAccess?.seatId, source, ...frame, period: entry.period, route: entry.inbound,
        returnRoute: entry.outbound,
        stages: entry.walkingStages, markers: entry.markers }] : [] }),
      problems: services.flatMap(entry => entry.problems.map(reason => ({ id: entry.service.id, reason }))),
      budgets: { metroPassengers: budgets.metro, busPassengers: budgets.bus, parkingPassengers: budgets.car, cars }, source }
  }
  return { at, services, plant, source }
}

/** Vehicles and faceless bodies share exactly the renderer's decorative
 * seconds. There is no timer, random phase or simulation-clock mutation here. */
export function criarTransporteComplexo(scene: THREE.Scene, state: EstadoComplexo, options: OpcoesTransporteComplexo = {}) {
  const timeline = roteiroTransporteComplexo(state, options), root = new THREE.Group()
  type Entry = ReturnType<typeof prepareService>
  type Pending = { at: number; entry: Entry | undefined; source: 'career' | 'qa-sample'; color: string; journeyKey: string | undefined }
  const colorFor = (side: 'home' | 'away', value: OpcoesTransporteComplexo) => side === 'home' ? value.homeColor ?? '#1B7A3D' : value.awayColor ?? '#C2452F'
  const plants = new Map([[(options.metroSide ?? 'away'), timeline.plant]])
  const plantFor = (value: OpcoesTransporteComplexo) => {
    const side = value.metroSide ?? 'away'
    if (!plants.has(side)) plants.set(side, gerarPlantaTransporte(state, { metroSide: side }))
    return plants.get(side)!
  }
  const entryKey = (service: ServicoTransporteComplexo, passenger: boolean, delay: number, access?: AcessoAssentoComplexo) => `${service.id}:${service.side}:${passenger}:${delay}:${access?.seatId ?? 'gate'}`
  const entryCache = new Map<string, Entry>()
  const cachedEntry = (service: ServicoTransporteComplexo, passenger: boolean, value = options) => {
    const access = passenger ? seatForService(service, value, plantFor(value).services) : undefined
    const delay = originDelayFor(service, value), key = entryKey(service, passenger, delay, access)
    if (!entryCache.has(key)) {
      entryCache.set(key, prepareService(service, passenger, delay, access))
      // A season may contain hundreds of fixtures. Active/pending entries keep
      // their own reference; the lookup cache must not retain every old walk.
      while (entryCache.size > 12) entryCache.delete(entryCache.keys().next().value!)
    }
    return entryCache.get(key)!
  }
  timeline.services.forEach(entry => entryCache.set(entryKey(entry.service, entry.passenger, originDelayFor(entry.service, options), entry.seatAccess), entry))
  root.name = 'complexo-transporte'; scene.add(root)
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  const mat = (color: string, metalness = 0, roughness = .8) => { const m = new THREE.MeshStandardMaterial({ color, metalness, roughness }); materials.add(m); return m }
  const metal = mat('#5a605e', .55, .45), rubber = mat('#202523'), glass = mat('#728d91', .15, .2), warm = mat('#ede2c8'), dark = mat('#33433e'), light = mat('#f8e8b4')
  light.userData.complexoNightEmission = {color:'#fff0cf',intensity:2.2}
  glass.userData.complexoNightEmission = {color:'#e0c895',intensity:.14}
  glass.transparent = true; glass.opacity = .66; glass.depthWrite = false
  // There are at most three vehicle rigs. Keep their bounded resources and the
  // passenger body for the world lifetime, including while a service is empty.
  const vehicles = timeline.plant.services.map(service => {
    const desired = timeline.services.find(entry => entry.service.id === service.id)
    return { entry: desired ?? cachedEntry(service, false), active: !!desired && !desired.problems.length }
  }).map(({ entry, active }) => {
    const service = entry.service, group = new THREE.Group(); group.name = `transporte-${service.id}`; root.add(group)
    const shell = mat(service.kind === 'metro' ? '#235b83' : service.kind === 'bus' ? '#d5b24c' : '#d8d6cb', .25, .52)
    const floor = service.floorHeight, height = service.kind === 'car' ? 1.95 : 2.52, width = service.width, length = service.length
    group.userData.complexoLights = (service.kind==='metro'?[-1,1]:[1]).flatMap(direction=>[-1,1].map(side=>({id:`${service.id}-farol-${direction}-${side}`,kind:'headlight',direction,enabled:direction===1,
      position:[side*(width/2-.3),floor+.38,direction*(length/2+.075)],target:[side*(width/2-.3),.05,direction*(length/2+20)],
      color:'#fff0cf',intensity:service.kind==='metro'?130:85,distance:service.kind==='metro'?40:30,angle:.3})))
    const cabLamps=[mat('#c0382d'),mat('#f8e8b4')]
    cabLamps[0].userData.complexoNightEmission={color:'#ef3325',intensity:1.2}
    cabLamps[1].userData.complexoNightEmission={color:'#fff0cf',intensity:2.2}
    group.userData.complexoCabLamps=cabLamps
    const parts = new Map<THREE.Material, THREE.BufferGeometry[]>(), doors: { mesh: THREE.Mesh; z: number; direction: number }[] = []
    const box = (material: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      if (w <= 0 || h <= 0 || d <= 0) return
      const geometry = new THREE.BoxGeometry(w, h, d); geometry.translate(x, y, z)
      if (!parts.has(material)) parts.set(material, []); parts.get(material)!.push(geometry)
    }
    const metro = service.kind === 'metro', gap = .6, carLength = metro ? (length - 4 * gap) / 5 : length
    const carriageCenters = metro ? Array.from({ length: 5 }, (_, i) => (i - 2) * (carLength + gap)) : [0]
    group.userData.carriages = carriageCenters.length
    const trainRoof = metro ? mat('#2f84b7', .3, .42) : warm
    const trim = metro ? mat('#d7e0df', .2, .58) : shell
    const glazing = metro ? mat('#b6a175', .12, .25) : glass
    if (metro) {
      glazing.transparent = true; glazing.opacity = .66; glazing.depthWrite = false
      glazing.emissive.set('#d89c41'); glazing.emissiveIntensity = .18
      glazing.userData.complexoNightEmission = { color: '#e9bb65', intensity: .14 }
    }
    const cabinLamp = mat('#eee4cf', .1, .35)
    cabinLamp.userData.complexoNightEmission = { color: '#ffe9bc', intensity: 1.8 }
    for (const [carriage, center] of carriageCenters.entries()) {
      box(dark, width - .08, .1, carLength - .08, 0, floor - .05, center)
      // The full-resolution reference has blue roofs, a pale window band and
      // amber interiors. Roof and cabin keep the measured vertical envelope.
      box(trainRoof, width + .04, .13, carLength + .02, 0, floor + height, center)
      const doorCenter = center + service.door.longitudinal
      if (service.kind !== 'car') {
        // Both fixtures attach to the actual underside of this carriage roof.
        // The portal beam is enabled only while the physical door is open.
        const ceiling = floor + height - .12, side = service.door.side
        box(cabinLamp, .45, .035, 1.4, 0, ceiling, center)
        box(cabinLamp, .42, .035, .7, side * (width / 2 - .22), ceiling, doorCenter)
        group.userData.complexoLights.push({
          id: `${service.id}-cabine-${carriage}`, kind: 'cabin', enabled: true,
          position: [0, ceiling - .025, center], target: [0, floor, center],
          color: '#ffe9bc', intensity: 38, distance: 6, angle: .95,
        }, {
          id: `${service.id}-porta-${carriage}`, kind: 'cabin', doorOnly: true, enabled: false,
          position: [side * (width / 2 - .22), ceiling - .025, doorCenter],
          target: [side * (width / 2 + .25), floor, doorCenter],
          color: '#ffe9bc', intensity: 42, distance: 6, angle: 1.02,
        })
      }
      const doorStart = doorCenter - service.door.width / 2, doorEnd = doorCenter + service.door.width / 2
      for (const side of [-1, 1]) {
        const runs = side === service.door.side ? [[center - carLength / 2, doorStart], [doorEnd, center + carLength / 2]] : [[center - carLength / 2, center + carLength / 2]]
        for (const [a, b] of runs) {
          const z = (a + b) / 2, run = b - a
          box(shell, .09, .68, run, side * width / 2, floor + .34, z)
          box(glazing, .07, height - 1.02, run, side * width / 2, floor + (height - 1.02) / 2 + .72, z)
          box(trim, .09, .30, run, side * width / 2, floor + height - .15, z)
          if (metro) box(trim, .105, .075, run, side * width / 2, floor + .70, z)
          for (let p = a + .06; p < b; p += 1.8) box(shell, .10, height - .45, .08, side * width / 2, floor + height / 2, p)
        }
      }
      for (const side of [-1, 1]) {
        const end = center + side * carLength / 2
        const cab = !metro || (carriage === 0 && side < 0) || (carriage === carriageCenters.length - 1 && side > 0)
        if (cab) {
          box(shell, width, .65, .11, 0, floor + .325, end)
          box(glass, width - .16, height - 1, .08, 0, floor + (height - 1) / 2 + .69, end)
          box(shell, width, .27, .11, 0, floor + height - .135, end)
          for (const x of [-1, 1]) box(cabLamps[side<0?0:1], .22, .12, .03, x * (width / 2 - .3), floor + .38, end + side * .065)
        } else {
          // A genuine central gangway joins adjacent cabins; neither a solid
          // end wall nor a full-length floor hides the gap between carriages.
          for (const x of [-1, 1]) box(shell, (width - 1.1) / 2, height, .11, x * (width + 1.1) / 4, floor + height / 2, end)
          box(shell, 1.1, height - 1.95, .11, 0, floor + (height + 1.95) / 2, end)
        }
      }
      box(shell, .10, Math.max(.12, height - 1.9), service.door.width, service.door.side * width / 2, floor + 1.9 + Math.max(.12, height - 1.9) / 2, doorCenter)
      // Each measured portal is a real opening. Only the platform side opens;
      // the central carriage retains the passenger's unchanged local z=0 door.
      for (const direction of [-1, 1]) {
        const geometry = new THREE.BoxGeometry(.075, 1.85, service.door.width / 2); geometries.add(geometry)
        const door = new THREE.Mesh(geometry, glazing), z = doorCenter + direction * service.door.width / 4
        door.position.set(service.door.side * (width / 2 + .075), floor + .925, z)
        door.castShadow = door.receiveShadow = true; door.name = `porta-${service.id}-${direction}${metro && carriage !== 2 ? `-vagao-${carriage}` : ''}`
        group.add(door); doors.push({ mesh: door, z, direction })
        const frameParts = [[.09, 1.85, .045, 0, 0, -service.door.width / 4], [.09, 1.85, .045, 0, 0, service.door.width / 4],
          [.09, .055, service.door.width / 2, 0, -.8975, 0], [.09, .055, service.door.width / 2, 0, .8975, 0]].map(([w, h, d, x, y, p]) => {
          const part = new THREE.BoxGeometry(w, h, d); part.translate(x, y, p); return part
        })
        const frameGeometry = mergeGeometries(frameParts, false); frameParts.forEach(part => part.dispose())
        if (frameGeometry) { geometries.add(frameGeometry); const frame = new THREE.Mesh(frameGeometry, metal); frame.castShadow = true; door.add(frame) }
      }
      if (metro) {
        for (const side of [-1, 1]) {
          const bogie = center + side * carLength * .33
          box(metal, 1.52, .17, 2.15, 0, floor - .205, bogie)
          for (const lateral of [-1, 1]) {
            box(warm, .42, .12, carLength * .35, lateral * (width / 2 - .3), floor + .42, center + side * carLength * .28)
            box(warm, .08, .43, carLength * .35, lateral * (width / 2 - .14), floor + .705, center + side * carLength * .28)
          }
        }
      }
    }
    if (metro) for (let carriage = 1; carriage < carriageCenters.length; carriage++) {
      const joint = (carriageCenters[carriage - 1] + carriageCenters[carriage]) / 2
      box(metal, .24, .18, gap + .4, 0, floor - .23, joint)
      box(dark, 1.3, .1, gap + .16, 0, floor - .05, joint)
      for (const side of [-1, 1]) box(dark, .1, 1.95, gap + .08, side * .6, floor + .975, joint)
      box(dark, 1.3, .08, gap + .08, 0, floor + 1.99, joint)
    }
    for (const [material, pieces] of parts) {
      const merged = mergeGeometries(pieces, false); pieces.forEach(piece => piece.dispose())
      if (!merged) continue
      geometries.add(merged); const mesh = new THREE.Mesh(merged, material); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh)
    }
    const wheels: THREE.Mesh[] = [], radius = service.wheelRadius
    const axles = metro ? carriageCenters.flatMap(center => [-1, 1].flatMap(side => [-.65, .65].map(offset => center + side * carLength * .33 + offset))) : [-length * .32, length * .32]
    const wheelGeometry = new THREE.CylinderGeometry(radius, radius, .17, 16); wheelGeometry.rotateZ(Math.PI / 2)
    const hubGeometry = new THREE.CylinderGeometry(radius * .48, radius * .48, .185, 12); hubGeometry.rotateZ(Math.PI / 2)
    // Steel railway wheels include the raised hub in one mesh/material. The
    // longer consist adds axles without adding a second draw for every wheel.
    const rollingGeometry = metro ? mergeGeometries([wheelGeometry, hubGeometry], false)! : wheelGeometry
    if (metro) { wheelGeometry.dispose(); hubGeometry.dispose(); geometries.add(rollingGeometry) }
    else { geometries.add(wheelGeometry); geometries.add(hubGeometry) }
    for (const x of [-1, 1]) for (const z of axles) {
      const offset = metro ? .7 : width * .46
      const wheel = new THREE.Mesh(rollingGeometry, metro ? metal : rubber); wheel.position.set(x * offset, radius, z); wheel.castShadow = wheel.receiveShadow = true
      wheel.name = `roda-${service.id}`; group.add(wheel); wheels.push(wheel)
      if (!metro) { const hub = new THREE.Mesh(hubGeometry, metal); wheel.add(hub) }
    }
    const color = colorFor(service.side, options)
    const body = criarCorpoVisitaComplexo(root, { id: `${service.id}-passageiro`, side: service.side, color })
    body.root.userData.seatId = entry.seatAccess?.seatId
    return { entry, active, journeyKey: options.journey?.key, heldAtGate: false, heldAtAccess: false, offset: 0, wheelOffset: 0, wheelDistance: 0, source: timeline.source, color, pending: undefined as Pending | undefined, root: group, doors, wheels, body }
  })
  let seconds = 0, disposed = false
  let requestedOptions = { ...options }
  let accessBlocked: Partial<Record<'home' | 'away', boolean>> = {}
  // A Set used by the static crowd cannot arbitrate two live services. Keep
  // the physical owner until that same passenger has boarded and reached the
  // origin; another service may reserve the future seat, but cannot open its
  // doors and walk into the occupied access yet.
  const seatOwners = new Map<string, typeof vehicles[number]>()
  function updateSeatOwner(actor: typeof vehicles[number]) {
    const seatId = actor.active && actor.entry.passenger ? actor.entry.seatAccess?.seatId : undefined
    for (const [id, owner] of seatOwners) if (owner === actor && id !== seatId) seatOwners.delete(id)
    if (seatId && !seatOwners.has(seatId)) seatOwners.set(seatId, actor)
  }
  const seatBlocked = (actor: typeof vehicles[number]) => {
    const seatId = actor.entry.seatAccess?.seatId
    return !!seatId && seatOwners.get(seatId) !== actor
  }
  vehicles.forEach(updateSeatOwner)
  const emptyCounts = (): ContagensTransporteComplexo => ({ metroPassengers: 0, busPassengers: 0, parkingPassengers: 0, cars: 0 })
  const passengerKey = (service: ServicoTransporteComplexo): keyof ContagensTransporteComplexo => service.kind === 'metro' ? 'metroPassengers' : service.kind === 'bus' ? 'busPassengers' : 'parkingPassengers'
  function desiredEntry(service: ServicoTransporteComplexo, value: OpcoesTransporteComplexo) {
    if (!state.valid) return undefined
    const selectedService = plantFor(value).services.find(candidate => candidate.kind === service.kind)
    if (!selectedService) return undefined
    const passenger = welcomesPassenger(value) && requested(value[passengerKey(selectedService)]) > 0
    const active = selectedService.kind === 'car' ? requested(value.cars) > 0 : value.transit === true || passenger
    return active ? cachedEntry(selectedService, passenger, value) : undefined
  }
  let allocation: AlocacaoTransporteComplexo
  function refreshAllocation() {
    const desired = emptyCounts(), effective = emptyCounts(), draining = emptyCounts()
    for (const actor of vehicles) {
      const entry = desiredEntry(actor.entry.service, requestedOptions), key = passengerKey(actor.entry.service)
      if (entry && !entry.problems.length) { desired[key] += +entry.passenger; if (entry.service.kind === 'car') desired.cars++ }
      if (actor.active) { effective[key] += +actor.entry.passenger; if (actor.entry.service.kind === 'car') effective.cars++ }
    }
    for (const key of Object.keys(desired) as (keyof ContagensTransporteComplexo)[]) draining[key] = Math.max(0, effective[key] - desired[key])
    allocation = { requested: desired, effective, draining, metroSide: vehicles.find(actor => actor.active && actor.entry.service.kind === 'metro')?.entry.service.side ?? requestedOptions.metroSide ?? 'away',
      pending: vehicles.flatMap(actor => actor.pending ? [{ vehicleId: actor.entry.service.id, at: actor.pending.at,
        passengers: actor.pending.entry?.passenger ? 1 : 0, active: !!actor.pending.entry }] : []) }
  }
  function nextOrigin(actor: typeof vehicles[number]) {
    if (!actor.active) return seconds
    const local = cleanSeconds(seconds - actor.offset), phase = local % actor.entry.period
    const origin = actor.entry.stages.find(stage => stage.phase === 'origin' && phase < stage.at + stage.duration)
    return origin ? seconds + Math.max(0, origin.at - phase) : seconds + actor.entry.period - phase
  }
  /** Changing demand never replaces an actor or restarts it in the street.
   * Deferred changes activate at a measured origin stop, after the current
   * passenger has boarded. A seek over that boundary uses its exact time. */
  function configure(value: OpcoesTransporteComplexo = {}) {
    if (disposed) return false
    requestedOptions = { ...value }
    const source = value.source ?? 'career'
    for (const actor of vehicles) {
      const candidate = desiredEntry(actor.entry.service, value), entry = candidate && !candidate.problems.length ? candidate : undefined
      const color = colorFor(entry?.service.side ?? actor.entry.service.side, value)
      const journeyKey = value.journey?.key
      const unchanged = actor.active === !!entry && (!entry || actor.entry === entry) && actor.journeyKey === journeyKey && actor.source === source && actor.color === color
      if (unchanged) { actor.pending = undefined; continue }
      const old = actor.pending
      if (old && old.entry === entry && old.source === source && old.color === color && old.journeyKey === journeyKey) continue
      actor.pending = { at: old?.at ?? nextOrigin(actor), entry, source, color, journeyKey }
    }
    refreshAllocation()
    return update(seconds)
  }
  function update(time: number) {
    if (disposed) return false
    const previousSeconds = seconds
    seconds = cleanSeconds(time)
    if (seconds < previousSeconds && requestedOptions.journey) seatOwners.clear()
    let changed = false
    for (const actor of vehicles) {
      // Only an explicit backwards QA seek resets a timetable. Live fixture
      // and phase changes always wait for the measured origin instead.
      if (seconds < previousSeconds && requestedOptions.journey) {
        const entry = desiredEntry(actor.entry.service, requestedOptions)
        actor.active = !!entry && !entry.problems.length
        if (entry) actor.entry = entry
        actor.offset = 0; actor.wheelOffset = 0; actor.wheelDistance = 0
        actor.journeyKey = requestedOptions.journey.key; actor.pending = undefined; changed = true
        actor.color = colorFor(actor.entry.service.side, requestedOptions); actor.body.setColor(actor.color)
        actor.body.root.userData.side = actor.entry.service.side; actor.body.root.userData.seatId = actor.entry.seatAccess?.seatId
      }
      actor.heldAtGate = false
      actor.heldAtAccess = false
      updateSeatOwner(actor)
      // The shared aisle may still be draining. A new arrival waits inside
      // its stopped vehicle with closed doors; people already outside keep
      // their physical return route and can never be frozen mid-flight.
      if (seconds >= previousSeconds && actor.active && actor.entry.passenger && (accessBlocked[actor.entry.service.side] || seatBlocked(actor))) {
        const before = Math.max(0, previousSeconds - actor.offset), after = seconds - actor.offset
        const hold = Math.floor(before / actor.entry.period) * actor.entry.period + actor.entry.markers.arrival
        if (before <= hold + 1e-7 && after >= hold) {
          const pause = Math.max(0, after - Math.max(before, hold))
          actor.offset += pause
          if (actor.pending) actor.pending.at += pause
          actor.heldAtAccess = true
        }
      }
      // The destination is the allocated chair, or a level gate landing when
      // no seat exists yet. The car/urban service waits at its physical
      // parking bay/terminus. Holding this single shared timetable preserves
      // doors, wheel phase and the return service's boarding appointment.
      const journey = requestedOptions.journey
      if ((seconds >= previousSeconds || requestedOptions.journey) && actor.active && actor.entry.passenger && journey && actor.journeyKey === journey.key && welcomesPassenger(requestedOptions)) {
        const hold = actor.entry.holdAt, before = (seconds < previousSeconds ? 0 : previousSeconds) - actor.offset, after = seconds - actor.offset
        if (before <= hold + 1e-7 && after >= hold) {
          const pause = Math.max(0, after - Math.max(before, hold))
          actor.offset += pause
          if (actor.pending) actor.pending.at += pause
          actor.heldAtGate = true
        }
      }
      const pending = actor.pending
      if (pending && seconds >= pending.at) {
        const replacing = !!pending.entry && (pending.entry !== actor.entry || !actor.active || actor.journeyKey !== pending.journeyKey)
        const priorDistance = actor.active ? (actor.entry.at(pending.at - actor.offset)?.vehicle.distance ?? 0) + actor.wheelOffset : actor.wheelDistance
        if (pending.entry && replacing) { actor.entry = pending.entry; actor.offset = pending.at; actor.wheelOffset = priorDistance }
        actor.journeyKey = pending.journeyKey
        actor.wheelDistance = priorDistance
        actor.active = !!pending.entry; actor.source = pending.source; actor.color = pending.color; actor.body.setColor(pending.color)
        actor.body.root.userData.side = actor.entry.service.side; actor.body.root.userData.seatId = actor.entry.seatAccess?.seatId
        updateSeatOwner(actor)
        actor.pending = undefined; changed = true
        // A large seek may cross the origin and the next destination in one
        // update. Apply that new trip's hold now, before rendering its pose.
        if (replacing && actor.active && actor.entry.passenger) {
          const blocked = !!accessBlocked[actor.entry.service.side] || seatBlocked(actor)
          const hold = blocked ? actor.entry.markers.arrival : journey && actor.journeyKey === journey.key && welcomesPassenger(requestedOptions) ? actor.entry.holdAt : undefined
          if (hold !== undefined && seconds - actor.offset >= hold) {
            actor.offset = seconds - hold; actor.heldAtAccess = blocked; actor.heldAtGate = !blocked
          }
        }
      }
      const frame = actor.active ? actor.entry.at(seconds - actor.offset) : undefined; actor.root.visible = !!frame
      if (!frame) { actor.body.updatePose(undefined); continue }
      const vehicle = frame.vehicle; actor.root.position.set(vehicle.position.x, vehicle.position.y, vehicle.position.z); actor.root.rotation.y = vehicle.heading
      if(actor.entry.service.kind==='metro'){
        const direction=vehicle.phase==='departing'||vehicle.phase==='terminal'?-1:vehicle.phase==='arriving'||vehicle.phase==='returning'||vehicle.phase==='origin'?1:actor.root.userData.travelDirection??1
        actor.root.userData.travelDirection=direction
        actor.root.userData.complexoLights.forEach((lamp:{kind:string;direction:number;enabled:boolean})=>{if(lamp.kind==='headlight')lamp.enabled=lamp.direction===direction})
        ;(actor.root.userData.complexoCabLamps as THREE.MeshStandardMaterial[]).forEach((lamp,index)=>{const front=(index===0?-1:1)===direction;lamp.color.set(front?'#f8e8b4':'#c0382d');lamp.userData.complexoNightEmission.color=front?'#fff0cf':'#ef3325';lamp.userData.complexoNightEmission.intensity=front?2.2:1.2})
      }
      actor.root.userData.complexoLights.forEach((lamp: { doorOnly?: boolean; enabled: boolean }) => {
        if (lamp.doorOnly) lamp.enabled = vehicle.doorsOpen > .05
      })
      for (const door of actor.doors) door.mesh.position.z = door.z + door.direction * actor.entry.service.door.width / 2 * vehicle.doorsOpen
      actor.wheelDistance = vehicle.distance + actor.wheelOffset
      for (const wheel of actor.wheels) wheel.rotation.x = actor.wheelDistance / actor.entry.service.wheelRadius
      actor.body.updatePose(frame.passenger?.pose)
    }
    if (changed || requestedOptions.journey) refreshAllocation()
    root.updateMatrixWorld(true)
    return changed
  }
  function snapshotAt(time: number) {
    const safe = cleanSeconds(time)
    const frames = vehicles.flatMap(actor => {
      const frame = actor.active ? actor.entry.at(safe - actor.offset) : undefined
      return frame ? [{ actor, frame }] : []
    })
    const markersFor = (actor: typeof vehicles[number]) => Object.fromEntries(Object.entries(actor.entry.markers).map(([key, value]) => [key, value + actor.offset])) as typeof actor.entry.markers
    return { seconds: safe,
      vehicles: frames.map(({ actor, frame }) => { const entry = actor.entry; return { id: entry.service.id, rigId: actor.root.uuid, kind: entry.service.kind, ...frame.vehicle,
        carriages: actor.root.userData.carriages ?? 1, journeyKey: actor.journeyKey, heldAtGate: actor.heldAtGate, heldAtAccess: actor.heldAtAccess,
        waitingForSeat: seatBlocked(actor) ? actor.entry.seatAccess?.seatId : undefined,
        distance: frame.vehicle.distance + actor.wheelOffset,
        width: entry.service.width, length: entry.service.length, wheelRadius: entry.service.wheelRadius, floorHeight: entry.service.floorHeight,
        period: entry.period, offset: actor.offset, route: { inbound: entry.service.inbound, outbound: entry.service.outbound }, stages: entry.stages,
        stop: entry.service.stop, door: entry.service.door, markers: markersFor(actor) } }),
      passengers: frames.flatMap(({ actor, frame }) => { const entry = actor.entry; return frame.passenger ? [{ id: `${entry.service.id}-passageiro`, rigId: actor.body.root.uuid,
        vehicleId: entry.service.id, transport: entry.service.kind, side: entry.service.side, seatId: entry.seatAccess?.seatId, ownsSeat: !!entry.seatAccess && seatOwners.get(entry.seatAccess.seatId) === actor, color: actor.color, source: actor.source, ...frame.passenger,
        period: entry.period, offset: actor.offset, route: entry.inbound, returnRoute: entry.outbound,
        stages: entry.walkingStages, markers: markersFor(actor) }] : [] }),
      problems: vehicles.flatMap(actor => actor.entry.problems.map(reason => ({ id: actor.entry.service.id, reason }))),
      budgets: allocation.requested, source: requestedOptions.source ?? 'career', journey: requestedOptions.journey ? { ...requestedOptions.journey } : undefined, allocation }
  }
  refreshAllocation()
  update(0)
  return { root, at: snapshotAt, update, configure, allocation: () => allocation,
    setAccessBlocked: (value: Partial<Record<'home' | 'away', boolean>>) => { accessBlocked = { ...value } },
    actor: (side: 'home' | 'away') => vehicles.find(actor => actor.active && actor.entry.passenger && actor.entry.service.side === side && actor.entry.seatAccess)?.body,
    reservedSeatIds: () => [...new Set(vehicles.flatMap(actor => [actor.active && actor.entry.passenger ? actor.entry.seatAccess?.seatId : undefined, actor.pending?.entry?.seatAccess?.seatId]).filter((id): id is string => !!id))],
    get passengerFeet() { return vehicles.filter(actor => actor.active && actor.entry.passenger).map(actor => ({ id: `${actor.entry.service.id}-passageiro`, feet: actor.body.feet })) },
    get wheels() { return vehicles.filter(actor => actor.active).map(actor => ({ vehicleId: actor.entry.service.id, meshes: actor.wheels })) },
    inspect: () => snapshotAt(seconds),
    dispose() { if (disposed) return; disposed = true; vehicles.forEach(actor => actor.body.dispose()); root.removeFromParent(); root.clear(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) },
  }
}
