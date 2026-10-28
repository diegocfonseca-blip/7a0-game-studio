import { acelerarRaios } from './presidencia-raio-rapido'
import * as THREE from 'three'
import { criarRelogioJornadaComplexo, type JornadaMovimentoComplexo } from './presidencia-complexo-jornada-relogio'
import { criarAtoresBairro } from './presidencia-bairro-atores-3d'
import type { QuadroBairro } from './presidencia-bairro-model'
import { PLANTA_COMPLEXO, caminhosTorcidaComplexo, deslocarCaminhoComplexo, mundoParaMapa, type EstadoComplexo, type PontoComplexo } from './presidencia-complexo-model'
import type { StadiumSave } from './estadiodata'
import { publicoDoEstadio, type DiaEstadio } from './presidencia-estadio-publico'
import type { SolidoEntorno } from './presidencia-complexo-entorno'
import { segmentoLivre } from './presidencia-estadio-navegacao'

export type PopulacaoTesteComplexo = {
  pedestrians?: number; cars?: number; homeFans?: number; awayFans?: number
  journey?: JornadaMovimentoComplexo
  stadium?: StadiumSave; day?: DiaEstadio; awayStadium?: StadiumSave; awayDay?: DiaEstadio
}
type Pose = { x: number; y: number; z: number; heading: number; distance: number; speed: number; phase: QuadroBairro['pedestre']['phase']; visible: boolean }
type Destination = 'loja' | 'hotel' | 'chopp'
type PedestrianFrame = { id: string; destination: Destination; source: 'career' | 'qa-sample'; pose: Pose | undefined; period: number; route: readonly PontoComplexo[]; stages: readonly { at: number; duration: number; phase: Pose['phase'] }[] }
type SurfacePoint = PontoComplexo & { y: number }
type Leg = { a: SurfacePoint; b: SurfacePoint; length: number; portal: boolean }
type Step = { at: number; duration: number; distance: number; from: number; to: number; phase: Pose['phase']; leg?: Leg; point: SurfacePoint }
const PEDESTRIAN_RADIUS = .35
const PEDESTRIAN_HEIGHT = 1.8
const CAR_RADIUS = Math.hypot(4.2, 1.8) / 2
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const angleBetween = (a: PontoComplexo, b: PontoComplexo) => Math.atan2(b.x - a.x, b.z - a.z)
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const smooth = (t: number) => t * t * (3 - 2 * t)
const to2D = (p: PontoComplexo) => ({ x: p.x, y: p.z })

/** População visual limitada; fixtures sem dados da carreira ficam identificadas como QA. */
export function criarCirculacaoComplexo(scene: THREE.Scene, state: EstadoComplexo,
  solids: readonly SolidoEntorno[] = [], population: PopulacaoTesteComplexo = {}) {
  const requested = (value: number | undefined, max: number) => clamp(Math.floor(Number.isFinite(value) ? value! : 1), 0, max)
  const attendance = population.stadium ? publicoDoEstadio(population.stadium, population.day) : undefined
  const destinationBudget = state.valid ? Math.min(requested(population.pedestrians ?? attendance?.outside, 3), attendance?.outside ?? 3) : 0
  const awayAttendance = population.awayStadium ? publicoDoEstadio(population.awayStadium, population.awayDay) : undefined
  // 🚗🚶 28/10 (Diego: "muito pouco NPC rondando, muito pouco carro… tem que ter ligação com o número de torcedores"): os
  // torcedores a pé e os carros crescem com a torcida do clube (dobrou a torcida, mais um ou dois), com teto pra não pesar
  const porTorcida = (base: number, cada: number, teto: number) => attendance ? clamp(Math.round(base + Math.log2(1 + attendance.supporters / 4000) * cada), base, teto) : undefined
  const fanCounts = {
    home: state.valid ? requested(population.homeFans ?? (attendance ? Math.max(attendance.outside * 2, porTorcida(2, 1.2, 10)!) : undefined), population.journey ? 1 : 10) : 0,
    away: state.valid ? requested(population.awayFans ?? (awayAttendance ? awayAttendance.playing ? awayAttendance.outside * 2 : 0 : attendance ? 0 : 1), population.journey ? 1 : 5) : 0,
  }
  const carCount = state.valid ? requested(population.cars ?? (attendance ? Math.max(attendance.cars, porTorcida(3, 1.2, 10)!) : undefined), 10) : 0
  const root = new THREE.Group()
  root.name = 'complexo-circulacao'
  const surfaceRoot = scene.getObjectByName('complexo-entorno') ?? scene
  const surfaces: THREE.Mesh[] = []
  surfaceRoot.updateMatrixWorld(true)
  surfaceRoot.traverse(object => { if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh)) surfaces.push(object) })
  const structure = scene.getObjectByName('estadio-arquitetura-volumetrica')
  structure?.updateMatrixWorld(true)
  structure?.traverse(object => { if (object instanceof THREE.Mesh) surfaces.push(object) })
  acelerarRaios(surfaces) // ⚡ 25/10: mesmos raios, mesmo resultado — só mais rápido (índice espacial)
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
  const problems: { id: string; reason: string; point?: PontoComplexo; height?: number }[] = []
  const activeRegistered = Object.entries(PLANTA_COMPLEXO.footprints).filter(([id]) => {
    if (id === 'arena') return ['geral', 'cadeiras', 'visitante', 'camarote'].some(k => state.progress[k] > 0)
    if (['hotel', 'loja', 'chopp', 'praca', 'estacao'].includes(id)) return state.extras[id]
    return state.extras.asfalto
  })
  const physical = solids.map(solid => ({ ...solid, polygon: solid.footprint.map(to2D) }))

  function ground(p: PontoComplexo): SurfacePoint | undefined {
    ray.set(new THREE.Vector3(p.x, .66, p.z), down)
    ray.near = 0; ray.far = 1
    const hit = ray.intersectObjects(surfaces, false).find(h => h.face && h.face.normal.y > .9)
    if (!hit || hit.point.y < -.05 || hit.point.y > .25) return undefined
    return { ...p, y: hit.point.y }
  }
  function clear(a: SurfacePoint, b: SurfacePoint, radius: number, height: number, destination?: string) {
    const feet = Math.min(a.y, b.y), top = Math.max(a.y, b.y) + height
    for (const solid of physical) {
      if (solid.top <= feet + .025 || solid.base >= top) continue
      if (!segmentoLivre(to2D(a), to2D(b), [{ id: solid.id, polygon: solid.polygon }], radius)) return solid.id
    }
    const gateCorridor = Object.values(PLANTA_COMPLEXO.gates).some(gate => {
      const within = (p: PontoComplexo) => gate.heading === 0
        ? Math.abs(p.x) + radius <= gate.width / 2 && p.z >= gate.inside.z - .1 && p.z <= gate.approach.z + 1.5
        : Math.abs(p.z - gate.threshold.z) + radius <= gate.width / 2 && p.x >= gate.inside.x - .1 && p.x <= gate.approach.x + 1.5
      return within(a) && within(b)
    })
    const registered = activeRegistered.filter(([id]) => id !== destination || destination === 'arena' && !gateCorridor)
      .map(([id, polygon]) => ({ id, polygon: polygon.map(to2D) }))
    if (!segmentoLivre(to2D(a), to2D(b), registered, radius)) return 'registro-do-mapa'
    return undefined
  }
  function prepare(id: string, points: readonly PontoComplexo[], radius: number, height: number, portalAt = Infinity, destination = 'loja', wholeBody = false) {
    const legs: Leg[] = []
    let previous: SurfacePoint | undefined
    for (let i = 0; i < points.length; i++) {
      const measured = ground(points[i])
      if (!measured) { problems.push({ id, reason: 'piso-ausente', point: { ...points[i] } }); return [] }
      if (previous) {
        const length = Math.hypot(measured.x - previous.x, measured.z - previous.z)
        if (length < 1e-6) continue
        const portal = i >= portalAt
        const blocked = clear(previous, measured, radius, height, portal ? destination : undefined)
        if (blocked) { problems.push({ id, reason: blocked }); return [] }
        // Valida chão entre os vértices, sem raycast no loop de animação.
        const samples = Math.ceil(length / (radius === PEDESTRIAN_RADIUS ? 1.5 : 15))
        for (let n = 1; n < samples; n++) {
          const fraction = n / samples
          const p = ground({ x: previous.x + (measured.x - previous.x) * fraction, z: previous.z + (measured.z - previous.z) * fraction })
          if (!p || Math.abs(p.y - (previous.y + (measured.y - previous.y) * fraction)) > .025) {
            problems.push({ id, reason: 'piso-descontinuo', point: p ?? { x: previous.x + (measured.x - previous.x) * fraction, z: previous.z + (measured.z - previous.z) * fraction }, height: p?.y }); return []
          }
        }
        if (portal || wholeBody) {
          const direction = new THREE.Vector3(measured.x - previous.x, 0, measured.z - previous.z)
          const offset = new THREE.Vector3(-direction.z, 0, direction.x).normalize()
          for (const lateral of [-radius, 0, radius]) for (const y of [.35, .95, 1.72]) {
            const start = new THREE.Vector3(previous.x, previous.y + y, previous.z).addScaledVector(offset, lateral)
            ray.set(start, direction.clone().normalize()); ray.near = .001; ray.far = length
            if (ray.intersectObjects(surfaces, false).length) {
              problems.push({ id, reason: 'porta-obstruida-na-geometria' }); return []
            }
          }
        }
        legs.push({ a: previous, b: measured, length, portal })
      }
      previous = measured
    }
    return legs
  }

  const destinationRoutes = { loja: 'shop', hotel: 'hotel', chopp: 'beer' } as const
  const preparedDestinations = (Object.keys(destinationRoutes) as Destination[]).filter(id => state.extras[id]).slice(0, destinationBudget).map(destination => {
    const door = PLANTA_COMPLEXO.doors[destination], registered = PLANTA_COMPLEXO.routes[destinationRoutes[destination]].points
    // The southern beer path crosses the visiting gate's two lanes. This local
    // sample starts on its existing northern branch, clear of either fan clock.
    const approach = destination === 'chopp' ? registered.slice(4) : registered
    const route = [...approach, door.threshold, door.inside]
    return { id: `pedestre-${destination}`, destination, route, door,
      legs: prepare(`pedestre-${destination}`, route, PEDESTRIAN_RADIUS, PEDESTRIAN_HEIGHT, approach.length, destination, true) }
  })
  const carLegs = Array.from({ length: carCount }, (_, i) => {
    const id = i % 2 ? 'roadBack' : 'roadOut'
    return { id, legs: prepare(id, PLANTA_COMPLEXO.routes[id].points, CAR_RADIUS, 1.5) }
  })

  function walker(pedestrianLegs: Leg[], stay: number, returningLegs?: Leg[]) {
    const walkSpeed = 1.15
    const steps: Step[] = []
    let period = 0, walkDistance = 0
    function stop(point: SurfacePoint, from: number, to: number, duration: number, phase: Pose['phase']) {
      steps.push({ at: period, duration, distance: walkDistance, from, to, phase, point })
      period += duration
    }
    function travel(leg: Leg, phase: Pose['phase']) {
      const heading = angleBetween(leg.a, leg.b), ramp = Math.min(.4, leg.length / walkSpeed)
      const duration = leg.length / walkSpeed + ramp
      steps.push({ at: period, duration, distance: walkDistance, from: heading, to: heading, phase, leg, point: leg.a })
      walkDistance += leg.length; period += duration
    }
    if (pedestrianLegs.length) {
      const outward = pedestrianLegs
      const returning = returningLegs ?? [...outward].reverse().map(leg => ({ ...leg, a: leg.b, b: leg.a }))
      for (const [pass, legs] of [outward, returning].entries()) {
        for (let i = 0; i < legs.length; i++) {
          const leg = legs[i]
          travel(leg, leg.portal ? pass ? 'leaving' : 'entering' : 'walking')
          const next = legs[i + 1]
          if (next) stop(leg.b, angleBetween(leg.a, leg.b), angleBetween(next.a, next.b), .5, 'waiting')
        }
        const last = legs.at(-1)!, next = pass ? outward[0] : returning[0]
        stop(last.b, angleBetween(last.a, last.b), angleBetween(next.a, next.b), pass ? 3 : stay, pass ? 'waiting' : 'inside')
      }
    }
    function pedestrianAt(seconds: number): Pose | undefined {
      if (!steps.length) return undefined
      const turns = Math.floor(seconds / period), time = seconds - turns * period
      const step = steps.find(step => time < step.at + step.duration) ?? steps[steps.length - 1]
      const elapsed = clamp(time - step.at, 0, step.duration)
      if (!step.leg) {
        const turnTime = Math.min(.8, step.duration)
        const progress = clamp((elapsed - step.duration + turnTime) / turnTime, 0, 1)
        return { ...step.point, heading: step.from + angleDelta(step.from, step.to) * smooth(progress),
          distance: turns * walkDistance + step.distance, speed: 0, phase: step.phase, visible: true }
      }
      const leg = step.leg, ramp = Math.min(.4, leg.length / walkSpeed)
      let distance: number, speed: number
      if (elapsed < ramp) { distance = walkSpeed * elapsed * elapsed / (2 * ramp); speed = walkSpeed * elapsed / ramp }
      else if (elapsed > step.duration - ramp) {
        const remain = step.duration - elapsed
        distance = leg.length - walkSpeed * remain * remain / (2 * ramp); speed = walkSpeed * remain / ramp
      } else { distance = walkSpeed * (elapsed - ramp / 2); speed = walkSpeed }
      const fraction = distance / leg.length
      return { x: leg.a.x + (leg.b.x - leg.a.x) * fraction, z: leg.a.z + (leg.b.z - leg.a.z) * fraction,
        y: leg.a.y + (leg.b.y - leg.a.y) * fraction, heading: step.from,
        distance: turns * walkDistance + step.distance + distance, speed, phase: step.phase, visible: true }
    }
    return { at: pedestrianAt, period, stages: steps.map(({ at, duration, phase }) => ({ at, duration, phase })) }
  }
  const safeSeconds = (seconds: number) => Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 1e10)) : 0
  const pedestrians = preparedDestinations.filter(entry => entry.legs.length).map(entry => ({ ...entry, timeline: walker(entry.legs, entry.door.stay) }))
  const shopIndex = pedestrians.findIndex(entry => entry.destination === 'loja')
  const paths = caminhosTorcidaComplexo(state)
  // Two separate lanes: arrivals and departures do not pass through each other.
  const fans = (['home', 'away'] as const).flatMap(side => {
    if (!fanCounts[side]) return []
    const points = paths[side], inbound = deslocarCaminhoComplexo(points, .72), outbound = deslocarCaminhoComplexo(points, -.72).reverse()
    const gateIndex = points.length - 3
    // Only the contracted gate corridor can cross the old conservative arena mask.
    const inboundLegs = prepare('torcida-' + side, inbound, PEDESTRIAN_RADIUS, PEDESTRIAN_HEIGHT, gateIndex + 1, 'arena', true)
    const outgoingLegs = prepare('saida-' + side, outbound, PEDESTRIAN_RADIUS, PEDESTRIAN_HEIGHT, 1, 'arena', true)
    if (!inboundLegs.length || !outgoingLegs.length) return []
    const connect = (a: SurfacePoint, b: SurfacePoint): Leg => ({ a, b, length: Math.hypot(b.x - a.x, b.z - a.z), portal: true })
    // Real U-turns at both ends, with no teleport or disappearance in the tunnel.
    const inward = [...inboundLegs, connect(inboundLegs.at(-1)!.b, outgoingLegs[0].a)]
    const outward = [...outgoingLegs, connect(outgoingLegs.at(-1)!.b, inboundLegs[0].a)]
    const timeline = walker(inward, 9, outward)
    return Array.from({ length: fanCounts[side] }, (_, i) => ({ side, id: `${side}-${i}`, timeline,
      offset: timeline.period * i / fanCounts[side], route: points,
      journeyClock: criarRelogioJornadaComplexo({ id: `torcida-${side}-${i}`, period: timeline.period, initialOffset: timeline.period * i / fanCounts[side],
        holdAt: timeline.stages.find(stage => stage.phase === 'inside')?.at ?? 0, journey: population.journey }),
      source: (side === 'home' ? attendance : awayAttendance) ? 'career' as const : 'qa-sample' as const }))
  })
  function carAt(legs: Leg[], seconds: number, index: number): Pose | undefined {
    const length = legs.reduce((sum, leg) => sum + leg.length, 0)
    if (!length) return undefined
    // (vários carros na mesma pista: cada um num ponto da volta, espaçados)
    const speed = 6, progress = ((seconds * speed + length * (((index % 2 ? .65 : .15) + Math.floor(index / 2) * .27) % 1)) % length + length) % length
    let distance = progress
    const leg = legs.find(candidate => { if (distance <= candidate.length) return true; distance -= candidate.length; return false }) ?? legs.at(-1)!
    const legIndex = legs.indexOf(leg), blend = Math.min(2, leg.length / 3)
    let heading = angleBetween(leg.a, leg.b)
    if (distance < blend && legIndex > 0) {
      const previous = legs[legIndex - 1], oldHeading = angleBetween(previous.a, previous.b)
      heading = oldHeading + angleDelta(oldHeading, heading) * (.5 + .5 * smooth(distance / blend))
    } else if (distance > leg.length - blend && legIndex + 1 < legs.length) {
      const next = legs[legIndex + 1]
      heading += angleDelta(heading, angleBetween(next.a, next.b)) * .5 * smooth((distance - leg.length + blend) / blend)
    }
    const fraction = clamp(distance / leg.length, 0, 1)
    const position = { x: leg.a.x + (leg.b.x - leg.a.x) * fraction, z: leg.a.z + (leg.b.z - leg.a.z) * fraction }
    const pixel = mundoParaMapa(position)
    return { ...position, y: leg.a.y + (leg.b.y - leg.a.y) * fraction, heading,
      distance: seconds * speed, speed, phase: 'walking', visible: pixel.x >= 0 && pixel.x <= 1536 && pixel.y >= 0 && pixel.y <= 1024 }
  }

  scene.add(root)
  const ordinaryRigCount = Math.max(pedestrians.length, carLegs.length)
  const rigCount = ordinaryRigCount + fans.length
  const rigs = Array.from({ length: rigCount }, (_, i) => {
    const rig = criarAtoresBairro(scene,{id:`circulacao-${i}`})
    rig.pedestre.name = `complexo-pedestre-${i}`; rig.carro.name = `complexo-carro-${i}`
    root.add(rig.pedestre, rig.carro)
    const pedestrian = pedestrians[i]
    if (pedestrian) { rig.pedestre.name = `complexo-${pedestrian.id}`; rig.pedestre.userData = { destination: pedestrian.destination } }
    const fan = fans[i - ordinaryRigCount]
    if (fan) {
      rig.pedestre.name = `complexo-torcedor-${fan.id}`
      rig.pedestre.userData = { side: fan.side, gate: PLANTA_COMPLEXO.gates[fan.side].id }
      rig.pedestre.traverse(object => { if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial && object.material.color.getHexString() === '1b7a3d') object.material.color.set(fan.side === 'home' ? '#1B7A3D' : '#C2452F') })
    }
    rig.pedestre.visible = rig.carro.visible = false
    return rig
  })
  let disposed = false
  let journey = population.journey
  let hasFrame = false
  let last = { seconds: 0, pedestrian: undefined as Pose | undefined, pedestrians: [] as PedestrianFrame[], cars: [] as (Pose | undefined)[], fans: [] as { id: string; side: 'home' | 'away'; source: string; pose: Pose | undefined; period: number; route: readonly PontoComplexo[] }[] }
  const empty = { x: 0, y: 0, z: 0, heading: 0, distance: 0, speed: 0, phase: 'waiting' as const, visible: false }
  function update(seconds: number) {
    if (disposed) return
    const time = safeSeconds(seconds)
    if (hasFrame && time === last.seconds) return
    const pedestrianFrames = pedestrians.map(entry => ({ id: entry.id, destination: entry.destination, source: attendance ? 'career' as const : 'qa-sample' as const,
      pose: entry.timeline.at(time), period: entry.timeline.period, route: entry.route, stages: entry.timeline.stages }))
    const pedestrian = pedestrianFrames[shopIndex]?.pose, cars = carLegs.map((entry, i) => carAt(entry.legs, time, i))
    const fanFrames = fans.map(fan => ({ id: fan.id, side: fan.side, source: fan.source, pose: fan.timeline.at(fan.journeyClock.update(time)), period: fan.timeline.period, route: fan.route }))
    last = { seconds: time, pedestrian, pedestrians: pedestrianFrames, cars, fans: fanFrames }
    hasFrame = true
    rigs.forEach((rig, i) => {
      const p = i >= ordinaryRigCount ? fanFrames[i - ordinaryRigCount]?.pose : pedestrianFrames[i]?.pose, c = i < ordinaryRigCount ? cars[i] : undefined
      rig.update({ seconds: time, pedestre: p ?? empty, carro: c ?? empty })
      rig.pedestre.visible = !!p?.visible; rig.carro.visible = !!c?.visible
    })
  }
  update(0)
  return {
    root, update, configureJourney(value: JornadaMovimentoComplexo | undefined) {
      journey = value; fans.forEach(fan => fan.journeyClock.configure(value)); hasFrame = false; update(last.seconds)
    }, feet: rigs[shopIndex]?.feet ?? [],
    pedestrianFeet: pedestrians.map((entry, i) => ({ id: entry.id, destination: entry.destination, feet: rigs[i].feet })),
    wheels: rigs.slice(0, carLegs.length).flatMap(rig => rig.wheels),
    fanFeet: rigs.slice(ordinaryRigCount).map(rig => rig.feet),
    inspect() {
      return { ...last, mode: attendance ? 'career' as const : 'qa-sample' as const, attendance, awayAttendance, civilians:rigs.map(rig=>rig.inspectCivilian()), problems: problems.map(p => ({ ...p })),
        journey: journey ? { ...journey } : undefined, fanJourneys: fans.map(fan => ({ id: fan.id, ...fan.journeyClock.inspect() })),
        period: pedestrians[shopIndex]?.timeline.period ?? 0, destinationBudget, pedestrianRadius: PEDESTRIAN_RADIUS, carRadius: CAR_RADIUS }
    },
    dispose() {
      if (disposed) return
      disposed = true
      rigs.forEach(rig => rig.dispose())
      root.removeFromParent(); root.clear()
    },
  }
}
