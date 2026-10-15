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
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
try {
  const { roteiroPasseioComplexo, criarCorpoVisitaComplexo } = await import('../src/escalacao/presidencia-complexo-visita.ts')
  const station = [{ x: 0, y: -2, z: 0 }]
  const stationEdges = []
  for (let index = 0; index < 12; index++) {
    const z = 1 + index * .45, before = -2 + index * .18, after = before + .18
    station.push({ x: 0, y: before, z }, { x: 0, y: after, z }); stationEdges.push({ z, y: after })
  }
  station.push({ x: 0, y: .16, z: 8 }, { x: 3, y: .16, z: 8 }, { x: 3, y: .16, z: 12 })
  const cases = [
    { id: 'estacao', inbound: station, floor: z => stationEdges.findLast(edge => edge.z <= z)?.y ?? -2 },
    { id: 'onibus', inbound: [{ x: 0, y: .56, z: 0 }, { x: 0, y: .56, z: 1 }, { x: 0, y: .36, z: 1 }, { x: 0, y: .36, z: 1.45 }, { x: 0, y: .16, z: 1.45 }, { x: 0, y: .16, z: 3 }, { x: 2, y: .16, z: 3 }, { x: 2, y: .16, z: 6 }], floor: z => z < 1 ? .56 : z < 1.45 ? .36 : .16 },
  ]
  let frames = 0, soleCorners = 0, boneProbes = 0
  for (const item of cases) {
    const options = { inbound: item.inbound, staySeconds: 9 }, saved = structuredClone(options)
    const timeline = roteiroPasseioComplexo(options)
    assert.deepEqual(timeline.problems, [], item.id)
    assert(timeline.arrivalAt > 0 && timeline.returnAt < timeline.period)
    close(timeline.returnAt - timeline.arrivalAt, 9, 'espera ocorre de pé no destino')
    assert.equal(timeline.inspect().arrivalAt, timeline.arrivalAt)
    assert.equal(timeline.inspect().returnAt, timeline.returnAt)
    const phases = new Set(timeline.inspect().stages.map(stage => stage.phase))
    for (const phase of ['walking', 'climbing', 'descending', 'turning', 'waiting']) assert(phases.has(phase), `${item.id}: ${phase}`)
    for (const phase of ['sitting', 'seated', 'standing']) assert(!phases.has(phase), `${item.id}: passeio livre não simula cadeira`)
    const waiting = timeline.at(timeline.arrivalAt + 4)
    assert.equal(waiting.phase, 'waiting'); assert.equal(waiting.seated, 0)
    const destination = item.inbound.at(-1)
    close(waiting.hip.x, destination.x, 'espera no destino x'); close(waiting.hip.z, destination.z, 'espera no destino z')
    close(waiting.hip.y, destination.y + .86, 'corpo espera de pé sobre o piso')
    assert.deepEqual(timeline.at(timeline.arrivalAt + 1), waiting, 'espera não escorrega nem anima sozinha')
    const scene = new THREE.Scene(), body = criarCorpoVisitaComplexo(scene, { id: item.id, side: 'home' }), rigId = body.root.uuid
    assert.equal(body.root.visible, false, 'rig só aparece depois de receber uma pose')
    const resources = new Set(), disposals = new Map()
    body.root.traverse(object => {
      assert(!/olho|nariz|boca|eye|nose|mouth/i.test(object.name), 'corpo mantém padrão sem feições')
      if (object instanceof THREE.Mesh) { resources.add(object.geometry); resources.add(object.material) }
    })
    for (const resource of resources) { disposals.set(resource, 0); resource.addEventListener('dispose', () => disposals.set(resource, disposals.get(resource) + 1)) }
    let previous
    for (let frame = 0; frame <= Math.ceil(timeline.period * 60); frame++) {
      const pose = timeline.at(frame / 60)
      assert(pose?.visible); assert.equal(pose.seated, 0); assert(pose.feet.some(foot => foot.supported))
      if (previous) assert(length(pose.hip, previous.hip) < .07, 'passeio fecha ciclo e transfere peso sem teleporte')
      for (const [index, foot] of pose.feet.entries()) {
        if (foot.supported && previous?.feet[index].supported) close(length(foot.position, previous.feet[index].position), 0, 'apoio não desliza', .003)
        for (const x of [-.073, .073]) for (const z of [-.1425, .1425]) {
          const worldZ = foot.position.z - Math.sin(foot.heading) * x + Math.cos(foot.heading) * z, floor = item.floor(worldZ)
          assert(foot.position.y >= floor - .0001, `${item.id}: sola invade degrau`)
          if (foot.supported) close(foot.position.y, floor, 'sola inteira apoiada no piso')
          soleCorners++
        }
      }
      if (frame % 3 === 0) {
        body.updatePose(pose); assert.equal(body.root.uuid, rigId); assert(body.root.visible)
        for (const index of [0, 1]) {
          close(body.root.getObjectByName(`visita-coxa-${index}`).scale.y, .44, 'coxa mantém comprimento')
          close(body.root.getObjectByName(`visita-canela-${index}`).scale.y, .43, 'canela mantém comprimento')
          boneProbes += 2
        }
        const matrix = body.root.matrixWorld.clone(); body.updatePose(pose); assert.deepEqual(body.root.matrixWorld, matrix, 'pose repetida respeita pausa')
      }
      previous = pose; frames++
    }
    close(length(timeline.at(0).hip, timeline.at(timeline.period - 1e-7).hip), 0, 'ciclo fecha na origem')
    assert.deepEqual(options, saved, 'roteiro não altera dados de entrada')
    const colors = new Map([...resources].filter(resource => resource instanceof THREE.MeshStandardMaterial).map(material => [material, material.color.getHexString()]))
    body.setColor('#c2452f'); assert.equal(body.root.uuid, rigId, 'troca de camisa preserva o mesmo corpo')
    for (const [material, previous] of colors) assert.equal(material.color.getHexString(), previous === '1b7a3d' ? 'c2452f' : previous, 'troca de camisa não muda pele/calça/solas nem cria material')
    body.updatePose(undefined); assert.equal(body.root.visible, false)
    body.updatePose({ ...waiting, visible: false }); assert.equal(body.root.visible, false)
    body.updatePose({ ...waiting, hip: { x: NaN, y: 0, z: 0 } }); assert.equal(body.root.visible, false, 'pose inválida não gera geometria com NaN')
    body.dispose(); body.dispose(); assert.equal(scene.children.length, 0)
    for (const count of disposals.values()) assert.equal(count, 1)
    body.updatePose(waiting); assert.equal(scene.children.length, 0, 'pose após dispose não recria corpo')
  }
  // One rig can be carried in vehicle-local coordinates, then walk in world
  // coordinates after the caller transfers its parent at a stopped doorway.
  const scene = new THREE.Scene(), vehicle = new THREE.Group(); scene.add(vehicle)
  vehicle.position.set(12, 2, -3); vehicle.rotation.y = Math.PI / 3
  const timeline = roteiroPasseioComplexo({ inbound: cases[1].inbound }), initial = timeline.at(0)
  const body = criarCorpoVisitaComplexo(vehicle, { id: 'mesmo-passageiro', side: 'away' }), id = body.root.uuid
  body.updatePose(initial); scene.updateMatrixWorld(true)
  const first = new THREE.Vector3(); body.feet[0].getWorldPosition(first)
  vehicle.position.x += 10; scene.updateMatrixWorld(true)
  const carried = new THREE.Vector3(); body.feet[0].getWorldPosition(carried)
  close(carried.x - first.x, 10, 'passageiro acompanha veículo'); close(carried.y, first.y, 'veículo mantém apoio local')
  const transform = point => { const p = new THREE.Vector3(point.x, point.y, point.z).applyMatrix4(vehicle.matrixWorld); return { x: p.x, y: p.y, z: p.z } }
  const worldPose = { ...initial, hip: transform(initial.hip), heading: initial.heading + vehicle.rotation.y,
    feet: initial.feet.map(foot => ({ ...foot, position: transform(foot.position), heading: foot.heading + vehicle.rotation.y })) }
  scene.attach(body.root); body.updatePose(worldPose); scene.updateMatrixWorld(true)
  const outside = new THREE.Vector3(); body.feet[0].getWorldPosition(outside)
  close(outside.distanceTo(carried), 0, 'desembarque preserva posição do mesmo corpo'); assert.equal(body.root.uuid, id)
  body.dispose(); vehicle.removeFromParent(); assert.equal(scene.children.length, 0)
  assert.deepEqual(roteiroPasseioComplexo({ inbound: [] }).problems, ['percurso-invalido'])
  assert(roteiroPasseioComplexo({ inbound: cases[1].inbound, outbound: [{ x: 99, y: .16, z: 0 }, cases[1].inbound[0]] }).problems.includes('percurso-sem-continuidade'))
  const immediate = roteiroPasseioComplexo({ inbound: cases[1].inbound, staySeconds: 0 })
  close(immediate.arrivalAt, immediate.returnAt, 'espera zero inicia retorno sem duração artificial')
  console.log(JSON.stringify({ status: 'PASS', cases: cases.map(item => item.id), frames, soleCorners, boneProbes, carriedRig: true, waitingWithoutChair: true }))
} finally { hooks.deregister() }
