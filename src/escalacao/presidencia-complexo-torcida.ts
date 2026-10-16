import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { AssentoComplexo } from './presidencia-complexo-arquitetura'
import type { StadiumSave } from './estadiodata'
import { publicoDoEstadio, type DiaEstadio } from './presidencia-estadio-publico'
import { estadioVisualValido } from './presidencia-estadio-validacao'

type Colors = { homeColor?: string; awayColor?: string }
export type PublicoTorcidaComplexo = Colors & (
  | { mode: 'off' }
  | { mode: 'qa-sample'; /** Frações de 0 a 1, sem público implícito. */ homeOccupancy?: number; awayOccupancy?: number }
  | { mode: 'career'; stadium: StadiumSave; day: DiaEstadio; away?: { stadium: StadiumSave; day: DiaEstadio } }
)
type Side = 'home' | 'away'
type Part = 'skin' | 'shirt' | 'lower'
type Place = AssentoComplexo & { side: Side; rank: number }
export const LIMITE_TORCIDA_COMPLEXO = 800
const UP = new THREE.Vector3(0, 1, 0)
const fraction = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0
const hash = (key: string) => {
  let value = 2166136261
  for (let i = 0; i < key.length; i++) value = Math.imul(value ^ key.charCodeAt(i), 16777619)
  return value >>> 0
}
const color = (value: unknown, fallback: string) => typeof value === 'string' && (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value) || Object.prototype.hasOwnProperty.call(THREE.Color.NAMES, value.toLowerCase()))
  ? new THREE.Color(value).getHexString() : new THREE.Color(fallback).getHexString()

/** Static seated figures, measured from the step, with no facial features.
 * The seat supports the pelvis; bent knees clear its front edge, and both
 * soles remain on the same step instead of scaling a standing character. */
function seatedGeometry(seatHeight: number): Record<Part, THREE.BufferGeometry> {
  const pieces: Record<Part, THREE.BufferGeometry[]> = { skin: [], shirt: [], lower: [] }
  const add = (part: Part, geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
    geometry.translate(x, y, z)
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    pieces[part].push(flat)
  }
  const box = (part: Part, w: number, h: number, d: number, x: number, y: number, z: number) => add(part, new THREE.BoxGeometry(w, h, d), x, y, z)
  const limb = (part: Part, a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
    const direction = b.clone().sub(a), geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 6, 1, true)
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()))
    add(part, geometry, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
  }
  box('lower', .29, .15, .21, 0, seatHeight + .075, -.055)
  const torso = new THREE.CylinderGeometry(.215, .17, .43, 8)
  torso.scale(1, 1, .68); add('shirt', torso, 0, seatHeight + .355, -.055)
  limb('skin', new THREE.Vector3(0, seatHeight + .57, -.055), new THREE.Vector3(0, seatHeight + .65, -.055), .06)
  const head = new THREE.SphereGeometry(.145, 8, 5)
  head.scale(1, 1.16, 1); add('skin', head, 0, seatHeight + .805, -.055)
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * .21, seatHeight + .535, -.055)
    const elbow = new THREE.Vector3(side * .225, seatHeight + .27, .13)
    const sleeveEnd = shoulder.clone().lerp(elbow, .42)
    const hand = new THREE.Vector3(side * .15, seatHeight + .17, .27)
    limb('shirt', shoulder, sleeveEnd, .071)
    limb('skin', sleeveEnd, elbow, .051); limb('skin', elbow, hand, .045)
    add('skin', new THREE.IcosahedronGeometry(.055, 0), hand.x, hand.y, hand.z)
    const hip = new THREE.Vector3(side * .105, seatHeight + .08, -.055)
    const knee = new THREE.Vector3(side * .11, seatHeight + .065, .27)
    limb('lower', hip, knee, .07)
    limb('lower', knee, new THREE.Vector3(side * .11, .095, .29), .052)
    box('lower', .14, .095, .24, side * .11, .0475, .365)
  }
  return Object.fromEntries((['skin', 'shirt', 'lower'] as const).map(part => {
    const geometry = mergeGeometries(pieces[part], false)!
    pieces[part].forEach(piece => piece.dispose())
    geometry.computeBoundingBox(); geometry.computeBoundingSphere()
    return [part, geometry]
  })) as Record<Part, THREE.BufferGeometry>
}

/** Visual sample only. Seats come from the actual architecture; attendance
 * never buys a stand, creates a visitor, changes income or runs another clock. */
export function criarTorcidaComplexo(scene: THREE.Scene, seats: readonly AssentoComplexo[], population: PublicoTorcidaComplexo = { mode: 'off' }) {
  const root = new THREE.Group(); root.name = 'complexo-torcida-sentada'; scene.add(root)
  const seen = new Set<string>(), places: Place[] = []
  let invalidSeats = 0
  for (const seat of seats) {
    if (!seat || typeof seat.id !== 'string' || !seat.id || seen.has(seat.id)
      || !['geral', 'cadeiras', 'visitante', 'camarote'].includes(seat.sector)
      || !['lower', 'upper'].includes(seat.tier)
      || (seat.supporterSide !== undefined && !['home', 'away'].includes(seat.supporterSide))
      || ![seat.position?.x, seat.position?.y, seat.position?.z, seat.heading, seat.seatHeight, seat.row, seat.column].every(Number.isFinite)
      || seat.seatHeight < .25 || seat.seatHeight > .75) { invalidSeats++; continue }
    seen.add(seat.id)
    places.push({ ...seat, position: { ...seat.position }, side: seat.supporterSide ?? (seat.sector === 'visitante' ? 'away' : 'home'), rank: hash(seat.id) })
  }
  const ranked = {
    home: places.filter(p => p.side === 'home').sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id)),
    away: places.filter(p => p.side === 'away').sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id)),
  }
  const available = { home: ranked.home.length, away: ranked.away.length }
  const budget = Math.min(LIMITE_TORCIDA_COMPLEXO, places.length)
  // Fixed side quotas keep increases monotonic and avoid moving home fans when
  // an independently supplied away attendance changes. Unused seats stay empty.
  const quota = { home: places.length ? Math.round(budget * available.home / places.length) : 0, away: 0 }
  quota.away = budget - quota.home
  const prototypes = new Map<number, Record<Part, THREE.BufferGeometry>>()
  const materials = (['skin', 'shirt', 'lower'] as const).map(part => new THREE.MeshStandardMaterial({ name: `torcida-${part}`, color: '#ffffff', roughness: .88 }))
  const groups = new Map<string, Place[]>()
  for (const side of ['home', 'away'] as const) for (const place of ranked[side]) {
    const key = `${place.side}:${place.sector}:${place.tier}:${place.seatHeight}`
    const group = groups.get(key) ?? []; group.push(place); groups.set(key, group)
  }
  const batches = [...groups.entries()].map(([key, group]) => {
    let geometry = prototypes.get(group[0].seatHeight)
    if (!geometry) { geometry = seatedGeometry(group[0].seatHeight); prototypes.set(group[0].seatHeight, geometry) }
    const capacity = Math.min(budget, group.length)
    const meshes = (['skin', 'shirt', 'lower'] as const).map((part, index) => {
      const mesh = new THREE.InstancedMesh(geometry![part], materials[index], capacity)
      mesh.name = `torcida-${key}-${part}`; mesh.castShadow = mesh.receiveShadow = true
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
      mesh.count = 0; mesh.visible = false
      mesh.userData = { part, side: group[0].side, sector: group[0].sector, tier: group[0].tier, seatIds: [] as string[] }
      root.add(mesh); return mesh
    })
    return { places: group, occupied: [] as Place[], meshes, count: 0, color: '' }
  })
  const transform = new THREE.Matrix4(), rotation = new THREE.Quaternion(), position = new THREE.Vector3(), unit = new THREE.Vector3(1, 1, 1)
  const skinTones = ['#754b35', '#a56f4c', '#c58d65', '#dda57e'].map(value => new THREE.Color(value))
  const neutral = new THREE.Color('#d5ceba'), lower = new THREE.Color('#29312f'), tint = new THREE.Color()
  let disposed = false, updates = 0, matrixUpdates = 0
  let mode: PublicoTorcidaComplexo['mode'] = 'off', selected: Place[] = []
  let attendance: ReturnType<typeof publicoDoEstadio> | undefined, awayAttendance: ReturnType<typeof publicoDoEstadio> | undefined
  let occupancy = { home: 0, away: 0 }
  const counts = { home: 0, away: 0 }
  let reservations = new Set<string>(), selectionKey = '', lastPopulation = population
  const seatById = new Map(places.map(place => [place.id, place]))
  const reservedCounts = { home: 0, away: 0 }

  function update(input: PublicoTorcidaComplexo = { mode: 'off' }) {
    if (disposed) return
    lastPopulation = input
    mode = input?.mode === 'career' || input?.mode === 'qa-sample' ? input.mode : 'off'
    attendance = awayAttendance = undefined
    occupancy = { home: 0, away: 0 }
    if (input?.mode === 'qa-sample') occupancy = { home: fraction(input.homeOccupancy), away: fraction(input.awayOccupancy) }
    if (input?.mode === 'career' && input.day && estadioVisualValido(input.stadium)) {
      attendance = publicoDoEstadio(input.stadium, input.day)
      occupancy.home = attendance.playing && attendance.inside > 0 ? fraction(attendance.attendance / 100) : 0
      if (input.away?.day && estadioVisualValido(input.away.stadium)) {
        awayAttendance = publicoDoEstadio(input.away.stadium, input.away.day)
        // Visitors use the host's seats, not their own stadium's capacity.
        if (attendance.playing && awayAttendance.playing) occupancy.away = fraction(awayAttendance.attendance / 100)
      }
    }
    const target = { home: Math.round(quota.home * occupancy.home), away: Math.round(quota.away * occupancy.away) }
    // The animated visitor occupies its own chair throughout the visit. Remove
    // that chair AND its share of the sample, rather than drawing a second body.
    for (const side of ['home', 'away'] as const) target[side] = Math.max(0, target[side] - reservedCounts[side])
    const colors = { home: color(input?.homeColor, '#1B7A3D'), away: color(input?.awayColor, '#C2452F') }
    const nextSelection = `${target.home}:${target.away}:${[...reservations].sort().join('|')}`
    const changedSelection = nextSelection !== selectionKey
    if (changedSelection) {
      selectionKey = nextSelection
      counts.home = target.home; counts.away = target.away
      selected = [...ranked.home.filter(p => !reservations.has(p.id)).slice(0, counts.home), ...ranked.away.filter(p => !reservations.has(p.id)).slice(0, counts.away)]
    }
    const chosen = changedSelection ? new Set(selected.map(p => p.id)) : undefined
    let changed = false
    for (const batch of batches) {
      const side = batch.places[0].side
      const occupied = chosen ? batch.places.filter(p => chosen.has(p.id)) : batch.occupied
      const count = occupied.length
      const moved = count !== batch.count || occupied.some((p, i) => p.id !== batch.occupied[i]?.id), recolored = batch.color !== colors[side]
      if (!moved && !recolored) continue
      changed = true
      batch.count = count; batch.color = colors[side]; batch.occupied = occupied
      const shirt = new THREE.Color('#' + colors[side]), ids = occupied.map(p => p.id)
      batch.meshes.forEach(mesh => { mesh.count = count; mesh.visible = count > 0; if (moved) mesh.userData.seatIds = ids })
      for (let i = 0; i < count; i++) {
        const seat = occupied[i]
        if (moved) {
          position.set(seat.position.x, seat.position.y, seat.position.z); rotation.setFromAxisAngle(UP, seat.heading)
          transform.compose(position, rotation, unit)
          batch.meshes.forEach(mesh => mesh.setMatrixAt(i, transform))
        }
        batch.meshes[0].setColorAt(i, skinTones[seat.rank % skinTones.length])
        tint.copy(seat.rank % 5 === 0 ? neutral : shirt).multiplyScalar(.88 + (seat.rank % 7) * .02)
        batch.meshes[1].setColorAt(i, tint); batch.meshes[2].setColorAt(i, lower)
      }
      for (const mesh of batch.meshes) {
        if (moved) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere() }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      }
      if (moved) matrixUpdates++
    }
    if (changed) updates++
  }
  update(population)
  return {
    root, update,
    reserve(ids: readonly string[] = []) {
      if (disposed) return
      reservations = new Set(ids.filter(id => seatById.has(id)))
      reservedCounts.home = reservedCounts.away = 0
      for (const id of reservations) reservedCounts[seatById.get(id)!.side]++
      update(lastPopulation)
    },
    inspect() {
      return { mode, total: counts.home + counts.away, home: counts.home, away: counts.away, available: { ...available }, sampleLimit: LIMITE_TORCIDA_COMPLEXO,
        attendance: attendance ? { ...attendance } : undefined, awayAttendance: awayAttendance ? { ...awayAttendance } : undefined,
        occupancy: { ...occupancy }, quota: { ...quota }, reservations: [...reservations], reserved: { ...reservedCounts }, invalidSeats, updates, matrixUpdates, instanceRebuilds: 0,
        batches: batches.reduce((total, batch) => total + batch.meshes.length, 0),
        triangles: batches.reduce((total, batch) => total + batch.meshes.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3 * mesh.count, 0), 0),
        seats: selected.map(({ rank: _rank, ...seat }) => ({ ...seat, position: { ...seat.position } })),
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      root.removeFromParent(); root.clear()
      for (const batch of batches) for (const mesh of batch.meshes) { mesh.count = 0; mesh.visible = false; mesh.userData.seatIds = []; mesh.dispose() }
      for (const geometry of prototypes.values()) for (const part of Object.values(geometry)) part.dispose()
      materials.forEach(material => material.dispose())
      selected = []; counts.home = counts.away = 0
    },
  }
}
