import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import { criarRelogioJornadaComplexo, type JornadaMovimentoComplexo } from './presidencia-complexo-jornada-relogio'
import type { AcessoAssentoComplexo, AssentoComplexo } from './presidencia-complexo-arquitetura'
import { caminhosTorcidaComplexo, deslocarCaminhoComplexo, type EstadoComplexo } from './presidencia-complexo-model'
import { geometriaHumana, materialHumano } from './presidencia-humano-acabamento.ts'

export type PontoVisitaComplexo = { x: number; y: number; z: number }
export type OpcoesPasseioComplexo = {
  /** Measured floor route; a stair edge repeats X/Z with the old/new Y. */
  inbound: readonly PontoVisitaComplexo[]
  /** Must start at the inbound destination and finish at its origin. */
  outbound?: readonly PontoVisitaComplexo[]
  staySeconds?: number
}
export type OpcoesVisitaComplexo = OpcoesPasseioComplexo & {
  id: string
  side: 'home' | 'away'
  seat: AssentoComplexo
  color?: string
  journey?: JornadaMovimentoComplexo
  /** Shared decorative time at creation, so a later visitor starts at origin. */
  startSeconds?: number
}
export type FaseVisitaComplexo = 'walking' | 'climbing' | 'descending' | 'turning' | 'sitting' | 'seated' | 'standing' | 'waiting'
type Foot = { position: PontoVisitaComplexo; heading: number; supported: boolean }
export type QuadroVisitaComplexo = {
  phase: FaseVisitaComplexo; heading: number; hip: PontoVisitaComplexo
  feet: [Foot, Foot]; seated: number; visible: boolean
}
type Rest = { feet: [Foot, Foot]; heading: number; hip: PontoVisitaComplexo; seated: number }
type Stage = { at: number; duration: number; from: Rest; to: Rest; phase: FaseVisitaComplexo; movingFoot?: number }
const HIP = .86, THIGH = .44, SHIN = .43, ANKLE = .095, HALF_WIDTH = .119
// Curved risers meet the route obliquely. Clearance includes sole width and
// the foot's lateral offset, not only half of its .285 m length.
const MAX_RISER = .24001, SOLE_MARGIN = .205, MAX_LEG_REACH = THIGH + SHIN - .018
const UP = new THREE.Vector3(0, 1, 0)
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))
const smooth = (t: number) => t * t * (3 - 2 * t)
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const point = (a: PontoVisitaComplexo, b: PontoVisitaComplexo, t: number): PontoVisitaComplexo => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) })
const distance = (a: PontoVisitaComplexo, b: PontoVisitaComplexo) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
const copyFoot = (foot: Foot): Foot => ({ ...foot, position: { ...foot.position } })
const finite = (p: PontoVisitaComplexo | undefined): p is PontoVisitaComplexo => !!p && [p.x, p.y, p.z].every(Number.isFinite)
const headingBetween = (a: PontoVisitaComplexo, b: PontoVisitaComplexo) => Math.atan2(b.x - a.x, b.z - a.z)

/** Join the registered exterior lanes and the architecture's actual access.
 * Connections are physical walks across the ends of the same pedestrian lane;
 * repeated X/Z with different Y at stair edges are intentionally preserved. */
export function opcoesVisitaComplexo(state: EstadoComplexo, access: AcessoAssentoComplexo): OpcoesVisitaComplexo {
  const path = caminhosTorcidaComplexo(state)[access.side]
  const entering = deslocarCaminhoComplexo(path, .72).map(p => ({ ...p, y: .16 }))
  const leaving = deslocarCaminhoComplexo(path, -.72).reverse().map(p => ({ ...p, y: .16 }))
  const unique = (points: PontoVisitaComplexo[]) => points.filter((p, index) => !index || distance(p, points[index - 1]) > 1e-7)
  return { id: access.id, side: access.side, seat: access.seat,
    inbound: unique([...entering, ...access.points.map(p => ({ ...p }))]),
    outbound: unique([...access.points].reverse().map(p => ({ ...p })).concat(leaving, entering.length ? [{ ...entering[0] }] : [])),
  }
}

/** Pure timeline. Every footfall is placed on a horizontal tread, and the
 * planted sole stays fixed while the other foot clears the next riser. */
function roteiroMovimentoComplexo(options: OpcoesPasseioComplexo, visit?: { seat: AssentoComplexo }) {
  const problems: string[] = [], stages: Stage[] = []
  let period = 0, arrivalAt = 0, returnAt = 0
  const seat = visit?.seat
  const inbound = options.inbound.map(p => ({ ...p }))
  const outbound = (options.outbound ?? [...inbound].reverse()).map(p => ({ ...p }))
  if (inbound.length < 2 || outbound.length < 2 || !inbound.every(finite) || !outbound.every(finite)) problems.push('percurso-invalido')
  if (visit && (!finite(seat?.position) || !Number.isFinite(seat?.heading) || !Number.isFinite(seat?.seatHeight))) problems.push('assento-invalido')
  if (!problems.length && (distance(inbound.at(-1)!, outbound[0]) > .001 || distance(outbound.at(-1)!, inbound[0]) > .001)) problems.push('percurso-sem-continuidade')
  const standing = inbound.at(-1)
  if (standing && seat && finite(seat.position)) {
    const dx = standing.x - seat.position.x, dz = standing.z - seat.position.z
    const forward = dx * Math.sin(seat.heading) + dz * Math.cos(seat.heading)
    const lateral = dx * Math.cos(seat.heading) - dz * Math.sin(seat.heading)
    if (Math.abs(standing.y - seat.position.y) > .035 || Math.abs(lateral) > .035 || forward < .28 || forward > .435) problems.push('destino-fora-da-cadeira')
  }
  const makeRest = (p: PontoVisitaComplexo, heading: number): Rest => ({
    heading, seated: 0, hip: { ...p, y: p.y + HIP },
    feet: [-1, 1].map(side => ({ position: { x: p.x + Math.cos(heading) * side * HALF_WIDTH, y: p.y, z: p.z - Math.sin(heading) * side * HALF_WIDTH }, heading, supported: true })) as [Foot, Foot],
  })
  let rest: Rest | undefined
  function add(to: Rest, duration: number, phase: FaseVisitaComplexo, movingFoot?: number) {
    if (!rest) { rest = to; return }
    stages.push({ at: period, duration, from: rest, to, phase, movingFoot }); period += duration; rest = to
  }
  function turn(heading: number) {
    if (!rest) return
    const center = point(rest.feet[0].position, rest.feet[1].position, .5)
    const rotation = angleDelta(rest.heading, heading)
    if (Math.abs(rotation) < .001) return
    const target = makeRest(center, heading), startHeading = rest.heading
    // A turn is two small steps. Both soles must not slide around the body.
    for (let index = 0; index < 2; index++) {
      const feet = rest.feet.map(copyFoot) as [Foot, Foot]
      feet[index] = target.feet[index]
      add({ ...target, feet, heading: startHeading + rotation * (index + 1) / 2 }, Math.max(.34, Math.abs(rotation) / 4.8), 'turning', index)
    }
  }
  function walk(path: readonly PontoVisitaComplexo[]) {
    const segments: { a: PontoVisitaComplexo; b: PontoVisitaComplexo; at: number; length: number; heading: number }[] = []
    const edges: { at: number; before: number; after: number }[] = []
    let length = 0
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], run = Math.hypot(b.x - a.x, b.z - a.z)
      if (run < 1e-6) {
        if (Math.abs(b.y - a.y) > .001) {
          if (Math.abs(b.y - a.y) > MAX_RISER) problems.push('espelho-alto-demais')
          edges.push({ at: length, before: a.y, after: b.y })
        }
        continue
      }
      if (Math.abs(b.y - a.y) > .001) problems.push('piso-inclinado-sem-apoio')
      segments.push({ a, b, at: length, length: run, heading: headingBetween(a, b) }); length += run
    }
    if (!segments.length) { problems.push('percurso-sem-extensao'); return }
    for (let index = 1; index < edges.length; index++) {
      if (edges[index].at - edges[index - 1].at < SOLE_MARGIN * 2 + .005) problems.push('patamar-curto-demais')
    }
    const contacts: number[] = []
    for (let index = 0; index < edges.length; index++) {
      const edge = edges[index], previous = edges[index - 1], next = edges[index + 1]
      // Align the approach before starting a flight, then plant a foot in the
      // middle of every tread. World stride phase cannot make a fan skip one.
      if (!previous || edge.at - previous.at > .56) contacts.push(Math.max(0, edge.at - .245))
      contacts.push(next && next.at - edge.at <= .56 ? (edge.at + next.at) / 2 : Math.min(length, edge.at + .245))
    }
    const at = (progress: number) => {
      const s = clamp(progress, 0, length)
      const segment = segments.find(segment => s < segment.at + segment.length - 1e-7) ?? segments.at(-1)!
      return { position: point(segment.a, segment.b, clamp((s - segment.at) / segment.length)), heading: segment.heading }
    }
    const initial = at(0)
    if (!rest) rest = makeRest(initial.position, initial.heading)
    else turn(initial.heading)
    let progress = 0, nextFoot = 0, guard = 0
    while (progress < length - 1e-6 && guard++ < 10000) {
      const contact = contacts.find(value => value > progress + 1e-6)
      let target = contact !== undefined && contact - progress <= .60 ? contact : Math.min(length, progress + .30)
      // A sole is .285 m long. Do not place it astride a stair edge.
      for (const edge of edges) if (Math.abs(target - edge.at) < SOLE_MARGIN) target = Math.min(length, edge.at + SOLE_MARGIN + .005)
      const sample = at(target), side = nextFoot ? 1 : -1
      const destination: Foot = { position: { x: sample.position.x + Math.cos(sample.heading) * side * HALF_WIDTH, y: sample.position.y, z: sample.position.z - Math.sin(sample.heading) * side * HALF_WIDTH }, heading: sample.heading, supported: true }
      const feet = rest!.feet.map(copyFoot) as [Foot, Foot]
      const previous = feet[nextFoot]
      if (distance(previous.position, destination.position) > 1.2) problems.push('passada-longa-demais')
      feet[nextFoot] = destination
      if (Math.abs(feet[0].position.y - feet[1].position.y) > MAX_RISER) problems.push('patamar-saltado')
      const center = point(feet[0].position, feet[1].position, .5)
      const phase = destination.position.y > previous.position.y + .01 ? 'climbing' : destination.position.y < previous.position.y - .01 ? 'descending' : 'walking'
      add({ feet, heading: sample.heading, hip: { ...center, y: center.y + HIP }, seated: 0 }, phase === 'walking' ? .38 : .66, phase, nextFoot)
      progress = target; nextFoot = 1 - nextFoot
    }
    const end = at(length), target = makeRest(end.position, end.heading)
    const feet = rest!.feet.map(copyFoot) as [Foot, Foot]
    feet[nextFoot] = target.feet[nextFoot]
    const center = point(feet[0].position, feet[1].position, .5)
    add({ feet, heading: end.heading, hip: { ...center, y: center.y + HIP }, seated: 0 }, .5, 'walking', nextFoot)
  }
  if (!problems.length) {
    walk(inbound)
    arrivalAt = period
    if (seat) {
      turn(seat.heading)
      const beforeSitting = rest!
      const seated: Rest = { ...beforeSitting, seated: 1,
        hip: { x: seat.position.x - Math.sin(seat.heading) * .055, y: seat.position.y + seat.seatHeight + .08, z: seat.position.z - Math.cos(seat.heading) * .055 } }
      add(seated, 1.4, 'sitting')
      add(seated, clamp(Number.isFinite(options.staySeconds) ? options.staySeconds! : 90, 5, 3600), 'seated')
      add(beforeSitting, 1.4, 'standing')
    } else {
      const stay = clamp(Number.isFinite(options.staySeconds) ? options.staySeconds! : 9, 0, 3600)
      if (stay > 0) add(rest!, stay, 'waiting')
    }
    returnAt = period
    walk(outbound)
    const first = stages[0]?.from
    if (first) { turn(first.heading); add(first, 2, 'waiting') }
  }
  const uniqueProblems = [...new Set(problems)]
  function at(seconds: number): QuadroVisitaComplexo | undefined {
    if (uniqueProblems.length || !stages.length || !Number.isFinite(seconds)) return undefined
    const time = ((Math.max(0, seconds) % period) + period) % period
    const stage = stages.find(candidate => time < candidate.at + candidate.duration) ?? stages.at(-1)!
    const t = clamp((time - stage.at) / stage.duration), eased = smooth(t)
    const feet = stage.from.feet.map((foot, index) => {
      const end = stage.to.feet[index]
      if (stage.movingFoot === undefined) return { position: point(foot.position, end.position, eased), heading: foot.heading + angleDelta(foot.heading, end.heading) * eased, supported: true }
      if (index !== stage.movingFoot) return copyFoot(foot)
      const transfer = smooth(clamp((t - .18) / .64))
      const p = point(foot.position, end.position, transfer), top = Math.max(foot.position.y, end.position.y) + .13
      p.y = t < .2 ? lerp(foot.position.y, top, smooth(t / .2)) : t > .8 ? lerp(top, end.position.y, smooth((t - .8) / .2)) : top
      return { position: p, heading: foot.heading + angleDelta(foot.heading, end.heading) * transfer, supported: t < 1e-8 || t > 1 - 1e-8 }
    }) as [Foot, Foot]
    const heading = stage.from.heading + angleDelta(stage.from.heading, stage.to.heading) * eased
    const hip = point(stage.from.hip, stage.to.hip, eased)
    // The pelvis follows reachable support heights, not an artificial slope
    // through the staircase. Bend the supporting knee before transferring weight.
    for (let index = 0; index < feet.length; index++) {
      const side = index ? 1 : -1, foot = feet[index].position
      const dx = hip.x + Math.cos(heading) * side * HALF_WIDTH - foot.x
      const dz = hip.z - Math.sin(heading) * side * HALF_WIDTH - foot.z
      const reach = Math.sqrt(Math.max(0, MAX_LEG_REACH ** 2 - dx * dx - dz * dz))
      hip.y = Math.min(hip.y, foot.y + ANKLE + reach)
    }
    return { phase: stage.phase, heading, hip, feet, seated: lerp(stage.from.seated, stage.to.seated, eased), visible: true }
  }
  return { at, period: uniqueProblems.length ? 0 : period, problems: uniqueProblems,
    arrivalAt: uniqueProblems.length ? 0 : arrivalAt, returnAt: uniqueProblems.length ? 0 : returnAt,
    inspect: () => ({ period: uniqueProblems.length ? 0 : period, problems: [...uniqueProblems], stages: stages.map(stage => ({
      at: stage.at, duration: stage.duration, phase: stage.phase,
      // Measured support levels let QA inspect a particular flight without
      // changing the route, sampling another clock or guessing by screen height.
      floorFrom: Math.min(...stage.from.feet.map(foot => foot.position.y)),
      floorTo: Math.min(...stage.to.feet.map(foot => foot.position.y)),
    })) }) }
}

/** Existing seat visit contract; the shared planner keeps its exact poses. */
export function roteiroVisitaComplexo(options: OpcoesVisitaComplexo) {
  const { at, period, problems, inspect, arrivalAt, returnAt } = roteiroMovimentoComplexo(options, { seat: options.seat })
  return { at, period, problems, inspect, arrivalAt, returnAt }
}

/** A passenger walks, waits standing at the destination and returns on foot.
 * No dummy chair or sitting phase is introduced. Times use the caller's clock. */
export function roteiroPasseioComplexo(options: OpcoesPasseioComplexo) {
  const timeline = roteiroMovimentoComplexo(options)
  return { ...timeline, inspect: () => ({ ...timeline.inspect(), arrivalAt: timeline.arrivalAt, returnAt: timeline.returnAt }) }
}

/** One faceless articulated body. Poses use its parent's coordinate system,
 * so the same body can stand inside a moving vehicle and then walk outside. */
export function criarCorpoVisitaComplexo(parent: THREE.Object3D, options: { id: string; side: 'home' | 'away'; color?: string }) {
  const root = new THREE.Group()
  root.name = `complexo-corpo-${options.id}`; root.userData = { side: options.side }; root.visible = false; parent.add(root)
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  const shape = <T extends THREE.BufferGeometry>(geometry: T) => { geometries.add(geometry); return geometry }
  const material = (color: string, kind: Parameters<typeof materialHumano>[1]) => { const value = materialHumano(color, kind); materials.add(value); return value }
  const skin = material('#a56f4c', 'skin'), shirt = material(options.color ?? (options.side === 'home' ? '#1B7A3D' : '#C2452F'), 'fabric')
  const lower = material('#29312f', 'fabric'), sole = material('#a9a592', 'sole'), shoe = material('#252a28', 'shoe'), hair = material('#24211e', 'hair')
  const humanShapes = new Map<Parameters<typeof geometriaHumana>[0], THREE.BufferGeometry>()
  const humanShape = (part: Parameters<typeof geometriaHumana>[0]) => {
    let value = humanShapes.get(part)
    if (!value) {
      value = shape(geometriaHumana(part))
      // These bone meshes point +Y from shoulder/hip towards hand/foot.
      if (['upperArm', 'forearm', 'thigh', 'shin'].includes(part)) {
        value.rotateZ(Math.PI); value.userData.humanoShape += ':flip'
      }
      humanShapes.set(part, value)
    }
    return value
  }
  const sphere = shape(new THREE.SphereGeometry(1, 12, 8)), cylinder = shape(new THREE.CylinderGeometry(1, 1, 1, 8))
  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, size: number[], position: number[] = [0, 0, 0], parent: THREE.Object3D = root) {
    if ((mat as THREE.MeshStandardMaterial).vertexColors && !geometry.hasAttribute('color')) {
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3).fill(1), 3))
    }
    const value = new THREE.Mesh(geometry, mat); value.scale.set(size[0], size[1], size[2]); value.position.set(position[0], position[1], position[2]); value.castShadow = value.receiveShadow = true; parent.add(value); return value
  }
  const upper = new THREE.Group(); root.add(upper)
  mesh(humanShape('torso'), shirt, [.41, .44, .28], [0, HIP + .30, 0], upper).name = 'visita-camisa-modelada'
  mesh(cylinder, skin, [.06, .10, .06], [0, HIP + .565, 0], upper)
  mesh(humanShape('head'), skin, [.29, .334, .29], [0, HIP + .74, 0], upper).name = 'visita-cabeca-sem-rosto'
  mesh(humanShape('hair'), hair, [.29, .334, .29], [0, HIP + .74, 0], upper).name = 'visita-cabelo'
  mesh(humanShape('pelvis'), lower, [.33, .18, .24], [0, HIP, 0]).name = 'visita-calca-cintura'
  const collar = mesh(shape(new THREE.TorusGeometry(.064, .005, 6, 20)), shirt, [1, 1, 1], [0, HIP + .52, 0], upper)
  collar.rotation.x = Math.PI / 2; collar.name = 'visita-gola'
  const arms = [-1, 1].map(side => ({ side,
    shoulder: mesh(sphere, shirt, [.063, .05, .066]),
    upper: mesh(humanShape('upperArm'), shirt, [.142, 1, .142]),
    forearm: mesh(humanShape('forearm'), skin, [.096, 1, .096]), hand: mesh(sphere, skin, [.055, .066, .055]) }))
  const legs = [-1, 1].map((side, index) => {
    const foot = new THREE.Group(); root.add(foot)
    const soleMesh = mesh(humanShape('shoe'), sole, [.146, .028, .285], [0, .014, 0], foot); soleMesh.name = `visita-sola-${index}`
    mesh(humanShape('shoe'), shoe, [.14, .065, .26], [0, .058, -.005], foot).name = 'visita-tenis'
    const thigh = mesh(humanShape('thigh'), lower, [.15, 1, .15]), shin = mesh(humanShape('shin'), lower, [.106, 1, .106])
    thigh.name = `visita-coxa-${index}`; shin.name = `visita-canela-${index}`
    return { side, thigh, shin, knee: mesh(sphere, lower, [.067, .068, .067]), foot, sole: soleMesh }
  })
  const a = new THREE.Vector3(), b = new THREE.Vector3(), joint = new THREE.Vector3(), direction = new THREE.Vector3(), inverse = new THREE.Quaternion()
  const bone = (value: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) => {
    direction.copy(end).sub(start); const length = direction.length()
    value.position.copy(start).add(end).multiplyScalar(.5); value.scale.y = length
    if (length > 1e-8) value.quaternion.setFromUnitVectors(UP, direction.multiplyScalar(1 / length))
  }
  const legacyParts=[...root.children];legacyParts.forEach(p=>p.visible=false)
  const civilian=createCivilian(root,{id:options.id})
  let civilTime=0,civilDistance=0,civilSpeed=0,previousHip:THREE.Vector3|undefined
  let disposed = false
  function updatePose(last: QuadroVisitaComplexo | undefined, seconds=0) {
    if (disposed) return
    root.visible = !!last && last.visible && finite(last.hip) && [last.heading, last.seated].every(Number.isFinite) && Array.isArray(last.feet) && last.feet.length === 2 && last.feet.every(foot => finite(foot?.position) && Number.isFinite(foot?.heading))
    if (!last || !root.visible) return
    root.position.set(last.hip.x, last.hip.y - HIP, last.hip.z); root.rotation.y = last.heading; inverse.copy(root.quaternion).invert()
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i], target = last.feet[i]
      b.set(target.position.x, target.position.y, target.position.z).sub(root.position).applyQuaternion(inverse)
      leg.foot.position.copy(b); leg.foot.rotation.y = angleDelta(last.heading, target.heading)
      b.y += ANKLE; a.set(leg.side * HALF_WIDTH, HIP, 0)
      const delta = b.clone().sub(a), length = Math.max(1e-6, delta.length()), along = clamp((THIGH * THIGH - SHIN * SHIN + length * length) / (2 * length), 0, THIGH)
      const bend = Math.sqrt(Math.max(0, THIGH * THIGH - along * along)), unit = delta.multiplyScalar(1 / length)
      const forward = new THREE.Vector3(0, 0, 1).addScaledVector(unit, -unit.z).normalize()
      joint.copy(a).addScaledVector(unit, along).addScaledVector(forward, bend)
      bone(leg.thigh, a, joint); bone(leg.shin, joint, b); leg.knee.position.copy(joint)
      const arm = arms[i], lean = .06 * Math.sin(last.seated * Math.PI)
      const swing = clamp(-leg.foot.position.z * .48, -.16, .16) * (1 - last.seated)
      // The shoulder cover joins the tapered shirt and sleeve without moving
      // either articulated arm anchor or widening the pedestrian corridor.
      arm.shoulder.position.set(arm.side * .205, HIP + .465, lean * .6)
      a.set(arm.side * .235, HIP + .49, lean); joint.set(arm.side * .24, HIP + .235, .07 + last.seated * .07 + swing * .65)
      b.set(arm.side * .16, HIP + .03, .04 + last.seated * .27 + swing)
      bone(arm.upper, a, joint); bone(arm.forearm, joint, b); arm.hand.position.copy(b)
    }
    upper.rotation.x = .06 * Math.sin(last.seated * Math.PI)
    const position=new THREE.Vector3(last.hip.x,last.hip.y,last.hip.z)
    const dt=seconds-civilTime
    if(dt<0){civilDistance=0;civilSpeed=0;previousHip=undefined}
    if(previousHip&&dt>0){const step=position.distanceTo(previousHip);civilDistance+=step;civilSpeed=step/dt}
    if(['seated','waiting','standing','sitting','turning'].includes(last.phase))civilSpeed=0
    previousHip=position;civilTime=seconds
    civilian.root.position.y=Math.min(...last.feet.map(f=>f.position.y))-root.position.y
    civilian.update({seconds,distance:civilDistance,speed:civilSpeed,seated:last.seated,transition:last.phase})
    root.updateMatrixWorld(true)
  }
  return { root, inspectCivilian:()=>civilian.inspect(), feet: legs.map(leg => leg.sole), updatePose,
    setColor(color: string) { if (!disposed) shirt.color.set(color) },
    dispose() {
      if (disposed) return
      disposed = true; civilian.dispose(); root.removeFromParent(); root.clear(); geometries.forEach(value => value.dispose())
      const textures = new Set<THREE.Texture>()
      materials.forEach(value => Object.values(value).forEach(property => { if (property instanceof THREE.Texture) textures.add(property) }))
      textures.forEach(value => value.dispose()); materials.forEach(value => value.dispose())
    },
  }
}

/** One character for the complete seat visit, without an autonomous clock. */
export function criarVisitaComplexo(scene: THREE.Scene, options: OpcoesVisitaComplexo) {
  const timeline = roteiroVisitaComplexo(options), body = criarCorpoVisitaComplexo(scene, options)
  body.root.name = `complexo-visita-${options.id}`; body.root.userData = { seatId: options.seat.id, side: options.side }
  const journeyClock = criarRelogioJornadaComplexo({ id: options.id, period: timeline.period,
    holdAt: timeline.inspect().stages.find(stage => stage.phase === 'seated')?.at ?? 0, journey: options.journey })
  let disposed = false, seconds = 0, accessBlocked = false, retiring = false, last: QuadroVisitaComplexo | undefined
  const startedAt=Number.isFinite(options.startSeconds)?Math.max(0,options.startSeconds!):0
  const defaultColor = options.side === 'home' ? '#1B7A3D' : '#C2452F'
  let color = options.color ?? defaultColor, pendingColor: { key: string; color: string } | undefined
  const applyColor = (next: string) => { if (color !== next) { color = next; body.setColor(next) } }
  function configureColor(value?: string) {
    if (disposed) return
    const next = value ?? defaultColor, journey = journeyClock.inspect()
    // The caller configures the fixture before its uniform. The old visitor
    // keeps its shirt until its measured return route reaches the origin.
    if (journey.requestedKey && journey.requestedKey !== journey.key) {
      pendingColor = { key: journey.requestedKey, color: next }
    } else { pendingColor = undefined; applyColor(next) }
  }
  function update(time: number) {
    if (disposed) return
    seconds = Number.isFinite(time) ? Math.max(0, time) : 0; last = timeline.at(journeyClock.update(Math.max(0,seconds-startedAt),accessBlocked,retiring)); body.updatePose(last,seconds)
    const journey = journeyClock.inspect()
    if (pendingColor && journey.key === pendingColor.key && journey.requestedKey === pendingColor.key) { applyColor(pendingColor.color); pendingColor = undefined }
  }
  update(startedAt)
  return { root: body.root, feet: body.feet, period: timeline.period, at: timeline.at, update, configureColor,
    setAccessBlocked(value:boolean){accessBlocked=value},
    finishAtOrigin(){retiring=true;const current=journeyClock.inspect();journeyClock.configure({key:current.key??'retiring-'+options.id,variantSeed:0,phase:'departure'})},
    configureJourney(journey: JornadaMovimentoComplexo | undefined) { if (disposed) return; journeyClock.configure(journey); update(seconds) },
    inspect: () => ({ id: options.id, rigId: body.root.uuid, civilian:body.inspectCivilian(), side: options.side, seatId: options.seat.id, seconds, color, pendingColor: pendingColor ? { ...pendingColor } : undefined, ...timeline.inspect(), journey: journeyClock.inspect(), pose: last ? structuredClone(last) : undefined }),
    dispose() { if (disposed) return; disposed = true; body.dispose() },
  }
}
