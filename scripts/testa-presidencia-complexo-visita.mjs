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
const close = (a, b, text, epsilon = 1e-5) => assert(Math.abs(a - b) < epsilon, `${text}: ${a} / ${b}`)
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const floor = z => z < 1 ? .16 : z < 1.5 ? .305 : .45
try {
  const { criarVisitaComplexo, roteiroVisitaComplexo, opcoesVisitaComplexo } = await import('../src/escalacao/presidencia-complexo-visita.ts')
  const seat = { id: 'real', tier: 'lower', sector: 'cadeiras', row: 0, column: 1, position: { x: 0, y: .45, z: 5 }, heading: Math.PI, seatHeight: .43 }
  const inbound = [
    { x: 0, y: .16, z: 0 }, { x: 0, y: .16, z: 1 }, { x: 0, y: .305, z: 1 },
    { x: 0, y: .305, z: 1.5 }, { x: 0, y: .45, z: 1.5 }, { x: 0, y: .45, z: 4.6 },
  ]
  const options = { id: 'teste', side: 'home', seat, inbound, staySeconds: 9 }
  const timeline = roteiroVisitaComplexo(options)
  assert.deepEqual(timeline.problems, [])
  const phases = new Set(timeline.inspect().stages.map(stage => stage.phase))
  for (const phase of ['walking', 'climbing', 'descending', 'turning', 'sitting', 'seated', 'standing', 'waiting']) assert(phases.has(phase), phase)
  for (const stage of timeline.inspect().stages) {
    close(stage.floorFrom, Math.min(...timeline.at(stage.at).feet.map(foot => foot.position.y)), 'metadado de piso inicial corresponde à pose')
    close(stage.floorTo, Math.min(...timeline.at(stage.at + stage.duration - 1e-7).feet.map(foot => foot.position.y)), 'metadado de piso final corresponde à pose')
  }
  const scene = new THREE.Scene(), visit = criarVisitaComplexo(scene, options), resources = new Set()
  visit.root.traverse(object => {
    if (object instanceof THREE.Mesh) { resources.add(object.geometry); resources.add(object.material) }
    assert(!/olho|nariz|boca|eye|mouth|nose/i.test(object.name))
  })
  const disposed = new Map([...resources].map(resource => [resource, 0]))
  resources.forEach(resource => resource.addEventListener('dispose', () => disposed.set(resource, disposed.get(resource) + 1)))
  let probes = 0, previous
  for (let frame = 0; frame <= Math.ceil(timeline.period * 120); frame++) {
    const seconds = frame / 120, pose = timeline.at(seconds)
    assert(pose?.visible)
    assert([pose.heading, pose.hip.x, pose.hip.y, pose.hip.z, pose.seated].every(Number.isFinite))
    assert(pose.feet.some(foot => foot.supported), 'há sempre pelo menos um pé apoiado')
    for (const [index, foot] of pose.feet.entries()) {
      assert(foot.position.y >= floor(foot.position.z) - .001, `sola não atravessa piso: fase=${pose.phase} z=${foot.position.z} y=${foot.position.y}`)
      if (foot.supported) {
        close(foot.position.y, floor(foot.position.z), 'pé apoiado no patamar real')
        if (previous?.feet[index].supported && pose.phase !== 'waiting') close(length(foot.position, previous.feet[index].position), 0, 'pé plantado não escorrega', .003)
      }
      const hip = { x: pose.hip.x + Math.cos(pose.heading) * (index ? .119 : -.119), y: pose.hip.y, z: pose.hip.z - Math.sin(pose.heading) * (index ? .119 : -.119) }
      assert(length(hip, { ...foot.position, y: foot.position.y + .095 }) <= .872, 'perna alcança a sola sem esticar os ossos')
      probes++
    }
    if (previous) assert(length(pose.hip, previous.hip) < .05, 'quadril sem saltos/teleporte no ciclo')
    previous = pose
    if (frame % 7 === 0) {
      visit.update(seconds)
      const same = visit.inspect(); visit.update(seconds); assert.deepEqual(visit.inspect(), same, 'pausa e mesmo horário dão exatamente a mesma pose')
      for (const [index, sole] of visit.feet.entries()) {
        const box = new THREE.Box3().setFromObject(sole)
        close(box.min.y, pose.feet[index].position.y, 'geometria da sola na altura contratada')
      }
    }
  }
  const seated = timeline.inspect().stages.find(stage => stage.phase === 'seated'), frame = timeline.at(seated.at + seated.duration / 2)
  close(frame.hip.y, seat.position.y + seat.seatHeight + .08, 'quadril sobre a cadeira')
  assert(frame.feet.every(foot => foot.supported))
  assert(length(timeline.at(0).hip, timeline.at(timeline.period - 1e-6).hip) < .00001, 'fecho contínuo do ciclo')
  assert.deepEqual(roteiroVisitaComplexo({ ...options, outbound: [{ x: 50, y: .16, z: 0 }, { x: 0, y: .16, z: 0 }] }).problems, ['percurso-sem-continuidade'])
  assert(roteiroVisitaComplexo({ ...options, inbound: inbound.map((p, i) => i === 2 ? { ...p, y: 2 } : p) }).problems.includes('espelho-alto-demais'))
  assert(roteiroVisitaComplexo({ ...options, inbound: inbound.map((p, i) => i === 3 || i === 4 ? { ...p, z: 1.3 } : p) }).problems.includes('patamar-curto-demais'), 'patamar menor que a sola e margem precisa rejeitar a rota')
  visit.dispose(); visit.dispose(); assert.equal(scene.children.length, 0)
  for (const count of disposed.values()) assert.equal(count, 1, 'recurso descartado uma única vez')
  // Every .48 m row rise is physically split into two .24 m risers. Exercise
  // long staircases and different approach phases so landing cannot depend on
  // where the walk's .30 m stride happened to meet the first step.
  let stairProbes = 0, upperStairProbes = 0
  const staircases = [
    ...[0, .07, .16, .27].map(offset => ({ id: `lower-${offset}`, offset, risers: 22, rise: .24, landingEvery: 0, tier: 'lower', row: 11 })),
    // Forty risers reach the upper entrance exactly. Extra flights exercise
    // the same gait at the higher rows, with actual level landings in between.
    ...[.07, .27].map(offset => ({ id: `upper-${offset}`, offset, risers: 64, rise: (9.1 - .16) / 40, landingEvery: 20, tier: 'upper', row: 8 })),
  ]
  for (const config of staircases) {
    const { offset, risers, rise, landingEvery } = config
    const stairPoints = [{ x: 0, y: .16, z: 0 }], edgeStart = 1 + offset, tread = .45, edges = []
    let level = .16
    for (let index = 0; index < risers; index++) {
      const z = edgeStart + index * tread + (landingEvery ? Math.floor(index / landingEvery) * 2 : 0)
      stairPoints.push({ x: 0, y: level, z }); level += config.tier === 'upper' && index >= 40 ? .22 : rise
      edges.push({ z, y: level }); stairPoints.push({ x: 0, y: level, z })
    }
    const end = edges.at(-1).z + tread + .5
    stairPoints.push({ x: 0, y: level, z: end })
    const highSeat = { ...seat, id: `ultima-fila-${config.id}`, tier: config.tier, row: config.row, position: { x: 0, y: level, z: end + .4 } }
    const staircase = criarVisitaComplexo(scene, { ...options, id: highSeat.id, seat: highSeat, inbound: stairPoints, staySeconds: 5 })
    assert.deepEqual(staircase.inspect().problems, [], `escadaria ${config.id}`)
    const stairFloor = z => edges.findLast(edge => edge.z <= z)?.y ?? .16
    let lastPose
    for (let sample = 0; sample < Math.ceil(staircase.period * 60); sample++) {
      staircase.update(sample / 60); const pose = staircase.inspect().pose
      assert(pose.feet.some(foot => foot.supported), 'escada mantém ao menos uma sola plantada')
      if (lastPose) assert(length(pose.hip, lastPose.hip) < .07, 'quadril acompanha transferência de peso sem saltar')
      for (const [index, foot] of pose.feet.entries()) {
        if (foot.supported && lastPose?.feet[index].supported) close(length(foot.position, lastPose.feet[index].position), 0, 'pé apoiado na escada não desliza', .003)
        for (const localZ of [-.1425, .1425]) {
          const floorY = stairFloor(foot.position.z + Math.cos(foot.heading) * localZ)
          assert(foot.position.y >= floorY - .0001, 'sola inteira passa acima do espelho')
          if (foot.supported) close(foot.position.y, floorY, 'sola inteira cabe no patamar')
          stairProbes++
          if (config.tier === 'upper') upperStairProbes++
        }
        close(staircase.root.getObjectByName(`visita-coxa-${index}`).scale.y, .44, 'coxa conserva comprimento na subida/descida')
        close(staircase.root.getObjectByName(`visita-canela-${index}`).scale.y, .43, 'canela conserva comprimento na subida/descida')
      }
      lastPose = pose
    }
    staircase.dispose()
  }
  const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
  const state = complexoDoEstadio({ inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost])), ext: [...STADIUM_EXTRAS.map(extra => extra.k), 'asfalto'] })
  const architecture = criarArquiteturaComplexo(scene, state)
  const inside = (p, polygon) => {
    let contains = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j]
      if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) contains = !contains
    }
    return contains
  }
  let architectureProbes = 0, upperArchitectureProbes = 0, physicalBoneProbes = 0
  for (const access of architecture.seatAccess) {
    const physicalOptions = { id: access.id, side: access.side, seat: access.seat, inbound: access.points, staySeconds: 5 }
    const actual = roteiroVisitaComplexo(physicalOptions), physicalRig = criarVisitaComplexo(scene, physicalOptions)
    assert.deepEqual(actual.problems, [], access.id)
    close(Math.max(...actual.inspect().stages.flatMap(stage => [stage.floorFrom, stage.floorTo])), Math.max(...access.points.map(point => point.y)), `${access.id}: metadados alcançam o piso real da galeria`)
    let previousHip, previousPose
    for (let frame = 0; frame < Math.ceil(actual.period * 24); frame++) {
      const pose = actual.at(frame / 24)
      assert(pose.feet.some(foot => foot.supported), `${access.id}: pelo menos um pé no piso`)
      if (previousHip) assert(length(pose.hip, previousHip) < .13, `${access.id}: quadril sem saltos entre patamares`)
      previousHip = pose.hip
      for (const [index, foot] of pose.feet.entries()) {
        const side = index ? 1 : -1
        const hip = { x: pose.hip.x + Math.cos(pose.heading) * side * .119, y: pose.hip.y, z: pose.hip.z - Math.sin(pose.heading) * side * .119 }
        assert(length(hip, { ...foot.position, y: foot.position.y + .095 }) <= .85201, `${access.id}: pernas alcançam patamares sem alongamento`)
        if (foot.supported && previousPose?.feet[index].supported) close(length(foot.position, previousPose.feet[index].position), 0, `${access.id}: apoio plantado não escorrega`, .003)
      }
      for (const foot of pose.feet) for (const x of [-.073, .073]) for (const z of [-.1425, .1425]) {
        const p = { x: foot.position.x + Math.cos(foot.heading) * x + Math.sin(foot.heading) * z, z: foot.position.z - Math.sin(foot.heading) * x + Math.cos(foot.heading) * z }
        // A gallery may cross below another floor. Only exclude a genuine
        // overhead surface: a floor within body height still blocks this route.
        const floors = access.surfaces.filter(surface => surface.y <= foot.position.y + 1.8 && inside(p, surface.polygon)).map(surface => surface.y)
        assert(floors.length, `${access.id}/${pose.phase}@${frame / 24}: sola fora de piso físico ${JSON.stringify({ p, foot, hip: pose.hip })}`)
        const height = Math.max(...floors)
        assert(foot.position.y >= height - .001, `${access.id}/${pose.phase}@${frame / 24}: pé dentro do degrau ${JSON.stringify({ p, foot, height, hip: pose.hip })}`)
        if (foot.supported) close(foot.position.y, height, `${access.side}/${pose.phase}: sola apoiada na superfície construída`)
        architectureProbes++
        if (access.seat.tier === 'upper') upperArchitectureProbes++
      }
      if (frame % 8 === 0) {
        physicalRig.update(frame / 24)
        for (const index of [0, 1]) {
          close(physicalRig.root.getObjectByName(`visita-coxa-${index}`).scale.y, .44, `${access.id}: coxa física preservada`)
          close(physicalRig.root.getObjectByName(`visita-canela-${index}`).scale.y, .43, `${access.id}: canela física preservada`)
          physicalBoneProbes += 2
        }
      }
      previousPose = pose
    }
    assert(length(actual.at(0).hip, actual.at(actual.period - 1e-6).hip) < .00001, `${access.id}: ciclo físico fecha sem teleporte`)
    physicalRig.dispose()
  }
  for (const side of ['home', 'away']) for (const [tier, rows] of [['lower', [0, 5, 10]], ['upper', [0]]]) {
    assert.deepEqual(architecture.seatAccess.filter(access => access.side === side && access.seat.tier === tier).map(access => access.seat.row).sort((a, b) => a - b), rows, `acessos reais ${side}/${tier}, sem prometer filas superiores sem circulação física`)
  }
  const { criarEntornoComplexo } = await import('../src/escalacao/presidencia-complexo-entorno.ts')
  const environment = criarEntornoComplexo(scene, state), surfaces = []
  scene.updateMatrixWorld(true)
  for (const group of [architecture.root, environment.root]) group.traverse(object => {
    if (object instanceof THREE.Mesh) surfaces.push({ mesh: object, bounds: new THREE.Box3().setFromObject(object) })
  })
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
  const cast = (origin, direction, length) => {
    const limit = new THREE.Box3().setFromPoints([origin, origin.clone().addScaledVector(direction, length)]).expandByScalar(.002)
    ray.set(origin, direction); ray.near = .001; ray.far = length
    return ray.intersectObjects(surfaces.filter(surface => surface.bounds.intersectsBox(limit)).map(surface => surface.mesh), false)
  }
  let exteriorProbes = 0
  const checkedSides = new Set()
  for (const access of architecture.seatAccess) {
    const composed = opcoesVisitaComplexo(state, access), actual = roteiroVisitaComplexo(composed)
    assert.deepEqual(actual.problems, [], `${access.side}: rota completa sem saltos`)
    assert.deepEqual(composed.inbound.slice(-access.points.length), access.points, 'mantém cada aresta física da arquitetura')
    assert.deepEqual(composed.outbound.slice(0, access.points.length), [...access.points].reverse(), 'retorno usa os mesmos degraus')
    assert.deepEqual(composed.outbound.at(-1), composed.inbound[0], 'ciclo fecha no mesmo ponto da rua')
    assert(length(actual.at(0).hip, actual.at(actual.period - 1e-6).hip) < .00001, 'ciclo da visita à fila termina na origem sem teleporte')
    if (checkedSides.has(access.side)) continue
    checkedSides.add(access.side)
    // Include both lateral portal connections and the final turn across the street lane.
    const exterior = [composed.inbound.slice(0, composed.inbound.length - access.points.length + 1), composed.outbound.slice(access.points.length - 1)]
    for (const path of exterior) for (let index = 1; index < path.length; index++) {
      const a = path[index - 1], b = path[index], delta = new THREE.Vector3(b.x - a.x, 0, b.z - a.z), length = delta.length()
      if (length < 1e-6) continue
      const direction = delta.multiplyScalar(1 / length), side = new THREE.Vector3(direction.z, 0, -direction.x)
      for (const lateral of [-.33, 0, .33]) for (const y of [.35, .95, 1.72]) {
        const start = new THREE.Vector3(a.x, a.y + y, a.z).addScaledVector(side, lateral)
        assert.equal(cast(start, direction, length).length, 0, `${access.side}: corpo atravessa objeto na rua/portão`)
        exteriorProbes++
      }
      for (let n = 0; n <= Math.ceil(length / 3); n++) for (const lateral of [-.26, 0, .26]) {
        const t = n / Math.ceil(length / 3), start = new THREE.Vector3(a.x + (b.x - a.x) * t, .66, a.z + (b.z - a.z) * t).addScaledVector(side, lateral)
        const hit = cast(start, down, 1).find(hit => hit.face?.normal.y > .9)
        assert(hit, `${access.side}: chão físico ausente no caminho de visita`)
        close(hit.point.y, .16, `${access.side}: piso físico externo na mesma cota da sola`)
        exteriorProbes++
      }
    }
  }
  environment.dispose()
  architecture.dispose()
  console.log(JSON.stringify({ status: 'PASS', period: timeline.period, footProbes: probes, stairProbes, upperStairProbes, architectureProbes, upperArchitectureProbes, physicalBoneProbes, exteriorProbes,
    routes: architecture.seatAccess.map(access => ({ side: access.side, tier: access.seat.tier, row: access.seat.row })), phases: [...phases] }))
} finally { hooks.deregister() }
