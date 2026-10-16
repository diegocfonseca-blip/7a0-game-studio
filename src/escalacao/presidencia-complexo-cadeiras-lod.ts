import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { AssentoComplexo } from './presidencia-complexo-arquitetura'

export const LIMITE_CADEIRAS_DETALHADAS_COMPLEXO = 96
export type LoteCadeirasComplexo = { mesh: THREE.InstancedMesh; ids: readonly string[] }

/** Closed molded back, a solid seat and two physical floor brackets. The
 * canonical seat plane, footprint and facing remain those of the real chair. */
function chairGeometry() {
  const seat = new THREE.BoxGeometry(.45, .045, .38)
  seat.translate(0, .4075, -.01)
  const vertices: number[] = [], indices: number[] = []
  const xs = [-.225, -.105, .105, .225]
  for (const back of [false, true]) for (let column = 0; column < xs.length; column++) {
    const edge = column === 0 || column === 3
    vertices.push(xs[column], .425, -.195 - (back ? .025 : 0))
    vertices.push(xs[column], edge ? .865 : .91, (edge ? -.255 : -.265) - (back ? .025 : 0))
  }
  for (let column = 0; column < 3; column++) {
    const a = column * 2, b = a + 2
    indices.push(a, b, b + 1, a, b + 1, a + 1)
    indices.push(a + 8, b + 9, b + 8, a + 8, a + 9, b + 9)
    indices.push(a + 1, b + 1, b + 9, a + 1, b + 9, a + 9)
    indices.push(a, a + 8, b + 8, a, b + 8, b)
  }
  indices.push(0, 1, 9, 0, 9, 8, 6, 14, 15, 6, 15, 7)
  const back = new THREE.BufferGeometry()
  back.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  back.setIndex(indices); back.computeVertexNormals()
  // Share normals along the shallow curve for a molded surface at close range.
  // A microscopic edge thickness is geometry, not an opacity trick.
  const flatSeat = seat.toNonIndexed(), flatBack = back.toNonIndexed()
  flatSeat.deleteAttribute('uv')
  const shell = mergeGeometries([flatSeat, flatBack], false)!
  seat.dispose(); back.dispose(); flatSeat.dispose(); flatBack.dispose()
  shell.computeBoundingSphere()

  const supportPositions: number[] = [], supportIndices: number[] = []
  for (const centerX of [-.13, .13]) {
    const first = supportPositions.length / 3
    for (const x of [centerX - .0275, centerX + .0275])
      supportPositions.push(x, 0, -.09, x, 0, .07, x, .385, -.02)
    // Two triangular prisms: finite sole on the floor and a bracket under the
    // seat, kept behind the spectator's shins and outside every aisle.
    supportIndices.push(first, first + 2, first + 1, first + 3, first + 4, first + 5,
      first, first + 1, first + 4, first, first + 4, first + 3,
      first + 1, first + 2, first + 5, first + 1, first + 5, first + 4,
      first + 2, first, first + 3, first + 2, first + 3, first + 5)
  }
  const supports = new THREE.BufferGeometry()
  supports.setAttribute('position', new THREE.Float32BufferAttribute(supportPositions, 3))
  for (let i = 0; i < supportIndices.length; i += 3) [supportIndices[i + 1], supportIndices[i + 2]] = [supportIndices[i + 2], supportIndices[i + 1]]
  supports.setIndex(supportIndices); supports.computeVertexNormals(); supports.computeBoundingSphere()
  return { shell, supports }
}

/** One representation per seat. Far instance arrays are compacted (swap with
 * last) and restored from the immutable architecture contract when zooming out.
 * Two bounded meshes are allocated once; the camera never creates new meshes. */
export function criarDetalheCadeirasComplexo(root: THREE.Group, seats: readonly AssentoComplexo[], lots: readonly LoteCadeirasComplexo[]) {
  if (!seats.length) return { update: (_camera: THREE.Camera) => false,
    inspect: () => ({ selected: [] as string[], count: 0, limit: LIMITE_CADEIRAS_DETALHADAS_COMPLEXO, trianglesPerChair: 56, far: 0, meshCount: 0, updates: 0, scans: 0 }), dispose() {} }
  const geometry = chairGeometry(), materials = [
    new THREE.MeshStandardMaterial({ name: 'cadeiras-plastico-moldado', color: '#ffffff', roughness: .66 }),
    new THREE.MeshStandardMaterial({ name: 'cadeiras-suportes-metal', color: '#37434b', roughness: .62, metalness: .25 }),
  ]
  const shell = new THREE.InstancedMesh(geometry.shell, materials[0], LIMITE_CADEIRAS_DETALHADAS_COMPLEXO)
  const supports = new THREE.InstancedMesh(geometry.supports, materials[1], LIMITE_CADEIRAS_DETALHADAS_COMPLEXO)
  for (const [mesh, role] of [[shell, 'detail-shell'], [supports, 'detail-support']] as const) {
    mesh.name = role === 'detail-shell' ? 'cadeiras-proximas-moldadas' : 'cadeiras-proximas-suportes'
    mesh.count = 0; mesh.visible = false; mesh.castShadow = mesh.receiveShadow = true
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.userData = { chairRole: role, seatIds: [] as string[] }
    root.add(mesh)
  }
  const seatById = new Map(seats.map(seat => [seat.id, seat]))
  const batchIds = lots.map(lot => [...lot.ids])
  const location = new Map<string, { batch: number; slot: number }>()
  const originalBatch = new Map<string, number>()
  lots.forEach((lot, batch) => {
    lot.mesh.userData.chairRole = 'far'; lot.mesh.userData.seatIds = batchIds[batch]
    lot.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    lot.ids.forEach((id, slot) => { location.set(id, { batch, slot }); originalBatch.set(id, batch) })
  })
  const grid = new Map<string, AssentoComplexo[]>()
  for (const seat of seats) {
    const key = `${Math.floor(seat.position.x / 8)},${Math.floor(seat.position.z / 8)}`
    const values = grid.get(key) ?? []; values.push(seat); grid.set(key, values)
  }
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), scale = new THREE.Vector3(1, 1, 1)
  const position = new THREE.Vector3(), cameraPosition = new THREE.Vector3(), projection = new THREE.Matrix4(), frustum = new THREE.Frustum(), sphere = new THREE.Sphere(new THREE.Vector3(), .65)
  const compose = (id: string) => {
    const seat = seatById.get(id)!
    quaternion.setFromAxisAngle(up, seat.heading); position.set(seat.position.x, seat.position.y, seat.position.z)
    return matrix.compose(position, quaternion, scale)
  }
  let selected = new Set<string>(), lastCamera: number[] | undefined, disposed = false, updates = 0, scans = 0
  function restore(id: string) {
    const batch = originalBatch.get(id)!, mesh = lots[batch].mesh, slot = mesh.count
    mesh.setMatrixAt(slot, compose(id)); mesh.count++
    batchIds[batch].push(id); location.set(id, { batch, slot }); mesh.instanceMatrix.needsUpdate = true
  }
  function hide(id: string) {
    const { batch, slot } = location.get(id)!, mesh = lots[batch].mesh, ids = batchIds[batch], last = mesh.count - 1
    if (slot !== last) {
      mesh.getMatrixAt(last, matrix); mesh.setMatrixAt(slot, matrix)
      ids[slot] = ids[last]; location.set(ids[slot], { batch, slot })
    }
    ids.pop(); mesh.count--; location.delete(id); mesh.instanceMatrix.needsUpdate = true
  }
  function update(camera: THREE.Camera) {
    if (disposed) return false
    camera.updateMatrixWorld(true)
    const signature = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements]
    if (lastCamera?.every((value, index) => value === signature[index])) return false
    lastCamera = signature; scans++
    camera.getWorldPosition(cameraPosition)
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projection)
    const candidates: { id: string; distance: number }[] = []
    for (let x = Math.floor((cameraPosition.x - 22) / 8); x <= Math.floor((cameraPosition.x + 22) / 8); x++)
      for (let z = Math.floor((cameraPosition.z - 22) / 8); z <= Math.floor((cameraPosition.z + 22) / 8); z++)
        for (const seat of grid.get(`${x},${z}`) ?? []) {
          sphere.center.set(seat.position.x, seat.position.y + .46, seat.position.z)
          const distance = cameraPosition.distanceToSquared(sphere.center)
          if (distance > (selected.has(seat.id) ? 22 ** 2 : 18 ** 2) || !frustum.intersectsSphere(sphere)) continue
          candidates.push({ id: seat.id, distance })
        }
    candidates.sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
    const ids = candidates.slice(0, LIMITE_CADEIRAS_DETALHADAS_COMPLEXO).map(candidate => candidate.id).sort()
    if (ids.length === selected.size && ids.every(id => selected.has(id))) return false
    const next = new Set(ids)
    for (const id of selected) if (!next.has(id)) restore(id)
    for (const id of next) if (!selected.has(id)) hide(id)
    ids.forEach((id, index) => {
      compose(id); shell.setMatrixAt(index, matrix); supports.setMatrixAt(index, matrix)
      const farMaterial = lots[originalBatch.get(id)!].mesh.material as THREE.MeshStandardMaterial
      shell.setColorAt(index, farMaterial.color)
    })
    for (const mesh of [shell, supports]) {
      mesh.count = ids.length; mesh.visible = ids.length > 0; mesh.userData.seatIds = [...ids]
      mesh.instanceMatrix.needsUpdate = true
      if (ids.length) { mesh.computeBoundingBox(); mesh.computeBoundingSphere() }
    }
    if (shell.instanceColor) shell.instanceColor.needsUpdate = true
    selected = next; updates++
    return true
  }
  return {
    update,
    inspect: () => ({ selected: [...selected], count: selected.size, limit: LIMITE_CADEIRAS_DETALHADAS_COMPLEXO,
      trianglesPerChair: 56, far: lots.reduce((sum, lot) => sum + lot.mesh.count, 0), meshCount: 2, updates, scans }),
    dispose() {
      if (disposed) return
      disposed = true
      for (const id of selected) restore(id)
      selected.clear()
      for (const mesh of [shell, supports]) { mesh.removeFromParent(); mesh.dispose() }
      geometry.shell.dispose(); geometry.supports.dispose(); materials.forEach(material => material.dispose())
      location.clear(); originalBatch.clear(); seatById.clear(); grid.clear()
    },
  }
}
