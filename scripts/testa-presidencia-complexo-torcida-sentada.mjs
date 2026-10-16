import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname } from 'node:path'
import * as THREE from 'three'

// Executa os módulos reais no Node 24, sem navegador, WebGL ou rede.
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
    if (url.startsWith(sourceRoot) && result.source != null) {
      return { ...result, source: Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") }
    }
    return result
  },
})

const close = (actual, expected, message, epsilon = 2e-5) =>
  assert(Math.abs(actual - expected) <= epsilon, `${message}: ${actual} ≠ ${expected}`)
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const meshes = root => { const result = []; root.traverse(node => { if (node instanceof THREE.Mesh) result.push(node) }); return result }
const materials = node => Array.isArray(node.material) ? node.material : [node.material]
const resources = root => {
  const result = new Set()
  for (const mesh of meshes(root)) {
    result.add(mesh.geometry)
    if (mesh instanceof THREE.InstancedMesh) result.add(mesh)
    for (const material of materials(mesh)) {
      result.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) result.add(value)
    }
  }
  return result
}
const watch = collection => {
  const counts = new Map()
  for (const resource of collection) {
    counts.set(resource, 0)
    resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1))
  }
  return expected => {
    for (const [resource, count] of counts) assert.equal(count, expected, `${resource.type}: descarte exatamente ${expected} vez(es)`)
  }
}
const withoutClock = callback => {
  const forbidden = () => { throw new Error('torcida estática não consulta relógio nem agenda animação') }
  const keys = ['requestAnimationFrame', 'setTimeout', 'setInterval']
  const descriptors = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key))
  const performanceDescriptor = Object.getOwnPropertyDescriptor(performance, 'now')
  const originalDateNow = Date.now
  try {
    for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: forbidden })
    Object.defineProperty(performance, 'now', { configurable: true, value: forbidden })
    Date.now = forbidden
    return callback()
  } finally {
    keys.forEach((key, index) => descriptors[index] ? Object.defineProperty(globalThis, key, descriptors[index]) : delete globalThis[key])
    if (performanceDescriptor) Object.defineProperty(performance, 'now', performanceDescriptor)
    else delete performance.now
    Date.now = originalDateNow
  }
}
const sideOf = seat => seat.supporterSide ?? (seat.sector === 'visitante' ? 'away' : 'home')
const ids = (inspection, side) => new Set(inspection.seats.filter(seat => seat.side === side).map(seat => seat.id))
const contains = (larger, smaller, message) => { for (const id of smaller) assert(larger.has(id), `${message}: perdeu ${id}`) }
const snapshot = root => meshes(root).map(mesh => ({ mesh, geometry: mesh.geometry, material: mesh.material }))
const matrices = root => meshes(root).map(mesh => [mesh.uuid, mesh.count, ...(mesh.instanceMatrix?.array ?? [])])
const sameResources = (root, previous) => {
  const current = snapshot(root)
  assert.equal(current.length, previous.length, 'update não aumenta o número de malhas')
  current.forEach((entry, index) => {
    assert.equal(entry.mesh, previous[index].mesh, 'update conserva malhas')
    assert.equal(entry.geometry, previous[index].geometry, 'update conserva geometrias')
    assert.equal(entry.material, previous[index].material, 'update conserva materiais')
  })
}

try {
  const { criarTorcidaComplexo, LIMITE_TORCIDA_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-torcida.ts')
  const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { publicoDoEstadio } = await import('../src/escalacao/presidencia-estadio-publico.ts')
  const { STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')
  const fullInv = Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost]))
  const full = freeze({ inv: fullInv, ext: [] })
  const qa = freeze({ mode: 'qa-sample', homeOccupancy: 1, awayOccupancy: 1 })
  const reports = []
  let physicalProbes = 0, renderedSeats = 0
  assert(LIMITE_TORCIDA_COMPLEXO > 0 && LIMITE_TORCIDA_COMPLEXO <= 1200, 'orçamento global permanece limitado')

  const check = (crowd, availableSeats) => {
    const inspection = crowd.inspect(), available = new Map(availableSeats.map(seat => [seat.id, seat]))
    assert.equal(inspection.total, inspection.seats.length)
    assert.equal(inspection.total, inspection.home + inspection.away)
    assert.equal(inspection.sampleLimit, LIMITE_TORCIDA_COMPLEXO)
    assert(inspection.total <= inspection.sampleLimit)
    assert.deepEqual(inspection.available, {
      home: availableSeats.filter(seat => sideOf(seat) === 'home').length,
      away: availableSeats.filter(seat => sideOf(seat) === 'away').length,
    })
    assert.equal(new Set(inspection.seats.map(seat => seat.id)).size, inspection.total, 'um ocupante por assento')
    for (const side of ['home', 'away']) assert.equal(ids(inspection, side).size, inspection[side])
    for (const seat of inspection.seats) {
      const original = available.get(seat.id)
      assert(original, `assento ${seat.id} existe na obra atual`)
      assert.equal(seat.side, sideOf(original))
      for (const key of ['sector', 'tier', 'heading', 'seatHeight']) assert.equal(seat[key], original[key])
      assert.deepEqual(seat.position, original.position, 'ocupante usa a posição da cadeira construída')
      assert(Math.abs(seat.position.x) > 54 || Math.abs(seat.position.z) > 38, 'torcida fora do jogo e da área técnica')
    }
    return inspection
  }

  const stages = [
    ['sem-save', undefined],
    ['vazio', { inv: {}, ext: [] }],
    ['gramado', { inv: { grama: fullInv.grama }, ext: [] }],
    ['inválido', { inv: { geral: NaN }, ext: [] }],
    ['camarote-antecipado', { inv: { grama: fullInv.grama, camarote: fullInv.camarote }, ext: [] }],
    ['parcial', { inv: { grama: fullInv.grama, geral: fullInv.geral / 2, visitante: fullInv.visitante / 3 }, ext: [] }],
    ['primeiro-andar', { inv: { ...fullInv, camarote: 0 }, ext: [] }],
    ['segundo-parcial', { inv: { ...fullInv, camarote: fullInv.camarote * .4 }, ext: [] }],
    ['completo', full],
  ]

  for (const [name, save] of stages) {
    const scene = new THREE.Scene(), architecture = criarArquiteturaComplexo(scene, complexoDoEstadio(save))
    const seats = freeze(architecture.seats), originalSeats = structuredClone(seats)
    const crowd = withoutClock(() => criarTorcidaComplexo(scene, seats))
    assert.equal(check(crowd, seats).mode, 'off')
    assert.equal(crowd.inspect().total, 0, `${name}: não cria amostra implícita`)
    withoutClock(() => crowd.update({ mode: 'qa-sample' }))
    assert.equal(check(crowd, seats).total, 0, 'QA sem ocupação explícita permanece vazio')
    withoutClock(() => crowd.update(qa))
    const inspection = check(crowd, seats)
    assert.equal(inspection.mode, 'qa-sample')
    if (['sem-save', 'vazio', 'gramado', 'inválido', 'camarote-antecipado'].includes(name)) {
      assert.equal(seats.length, 0, `${name}: sem arquibancada antecipada`)
      assert.equal(inspection.total, 0, `${name}: nem QA cria cadeira fictícia`)
    } else {
      assert(inspection.home > 0 && inspection.away > 0, `${name}: ocupa os dois setores existentes`)
      if (!['completo', 'segundo-parcial'].includes(name)) assert(inspection.seats.every(seat => seat.tier === 'lower'))
      else assert(inspection.seats.some(seat => seat.tier === 'upper'), 'obra completa admite o andar superior')
    }
    assert.deepEqual(seats, originalSeats, 'entrada de assentos não é alterada')
    reports.push({ stage: name, available: seats.length, sample: inspection.total })
    const verifyArchitecture = watch(resources(architecture.root))
    const verifyCrowd = watch(resources(crowd.root))
    withoutClock(() => crowd.dispose()); withoutClock(() => crowd.dispose())
    assert.equal(crowd.root.parent, null)
    assert.equal(crowd.root.children.length, 0)
    assert.equal(crowd.inspect().total, 0)
    verifyCrowd(1); verifyArchitecture(0)
    assert.equal(architecture.root.parent, scene)
    architecture.dispose()
    assert.equal(scene.children.length, 0)
  }

  // Uma única arena permite comparar updates reais sem trocar câmera ou cena.
  const scene = new THREE.Scene(), architecture = criarArquiteturaComplexo(scene, complexoDoEstadio(full))
  const seats = freeze(architecture.seats), savedSeats = structuredClone(seats)
  const foreign = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 4), new THREE.MeshStandardMaterial({ map: new THREE.Texture() }))
  foreign.position.set(180, 2, 0); scene.add(foreign)
  const verifyForeign = watch(resources(foreign)), verifyArchitecture = watch(resources(architecture.root))
  const crowd = withoutClock(() => criarTorcidaComplexo(scene, seats, qa))
  const fixedResources = snapshot(crowd.root), verifyCrowd = watch(resources(crowd.root))
  const update = population => {
    const input = freeze(population), before = structuredClone(input)
    withoutClock(() => crowd.update(input))
    assert.deepEqual(input, before, 'dia, estádio e opções permanecem imutáveis')
    sameResources(crowd.root, fixedResources)
    verifyCrowd(0); verifyForeign(0); verifyArchitecture(0)
    return check(crowd, seats)
  }

  // Seleção estável por lado, incluindo o teto global e mudanças no outro clube.
  for (const side of ['home', 'away']) {
    let previous = new Set()
    for (const occupancy of [0, .05, .25, .5, .75, 1]) {
      const result = update({ mode: 'qa-sample', homeOccupancy: 0, awayOccupancy: 0, [side + 'Occupancy']: occupancy })
      assert.equal(result[side === 'home' ? 'away' : 'home'], 0)
      const current = ids(result, side)
      contains(current, previous, `aumentar lotação ${side} mantém assentos ocupados`)
      if (occupancy) assert(current.size > 0)
      previous = current
    }
  }
  const balanced = update(qa), balancedIds = { home: ids(balanced, 'home'), away: ids(balanced, 'away') }
  // Both upper routes share the investment sector, but never a supporter quota
  // or a shirt batch. Reservations debit the side that physically uses the seat.
  const upperAccess = architecture.seatAccess.filter(access => access.seat.tier === 'upper')
  assert.equal(upperAccess.length, 2)
  for (const access of upperAccess) {
    assert.equal(access.seat.supporterSide, access.side)
    assert(balanced.seats.some(seat => seat.tier === 'upper' && seat.side === access.side))
    crowd.reserve([access.seatId])
    const reserved = check(crowd, seats)
    for (const side of ['home', 'away']) {
      assert.equal(reserved[side], balanced[side] - Number(side === access.side))
      assert.equal(reserved.reserved[side], Number(side === access.side))
    }
    assert(!reserved.seats.some(seat => seat.id === access.seatId))
    crowd.reserve([])
  }
  for (const mesh of meshes(crowd.root)) for (const id of mesh.userData.seatIds) {
    assert.equal(sideOf(seats.find(seat => seat.id === id)), mesh.userData.side, 'nenhuma malha mistura cores das duas torcidas')
  }
  for (const side of ['home', 'away']) {
    const alone = update({ mode: 'qa-sample', homeOccupancy: 0, awayOccupancy: 0, [side + 'Occupancy']: 1 })
    contains(ids(alone, side), balancedIds[side], 'outro clube não redistribui os primeiros assentos')
  }
  assert.deepEqual(update(qa).seats, balanced.seats, 'repetir opções reproduz a seleção')
  const clone = withoutClock(() => criarTorcidaComplexo(scene, seats, qa))
  assert.deepEqual(clone.inspect().seats, balanced.seats, 'nova montagem seleciona os mesmos assentos')
  clone.dispose()
  const qaBudget = update({ mode: 'qa-sample', homeOccupancy: .7, awayOccupancy: .5 })
  const budgets = {
    maximum: { home: balanced.home, away: balanced.away, total: balanced.total, triangles: balanced.triangles },
    qa70_50: { home: qaBudget.home, away: qaBudget.away, total: qaBudget.total, triangles: qaBudget.triangles },
  }

  const playing = { division: 'A', support: 76, rain: false, match: 'playing' }
  for (const match of ['idle', 'playing', 'interval']) {
    const day = { ...playing, match }, result = update({ mode: 'career', stadium: full, day })
    assert.equal(result.mode, 'career')
    assert.deepEqual(result.attendance, publicoDoEstadio(full, day), 'consome o cálculo de público existente')
    assert.equal(result.away, 0, 'não inventa visitantes sem dados do clube')
    if (match === 'idle') assert.equal(result.total, 0)
    else assert(result.home > 0, 'partida e intervalo mantêm público')
  }
  const game = update({ mode: 'career', stadium: full, day: playing })
  const interval = update({ mode: 'career', stadium: full, day: { ...playing, match: 'interval' } })
  assert.deepEqual(interval.seats, game.seats, 'intervalo não esvazia nem redistribui as arquibancadas')
  const zero = update({ mode: 'career', stadium: full, day: { support: 0, rain: false, match: 'playing' } })
  assert.equal(zero.attendance.attendance, 0)
  assert.equal(zero.total, 0, 'lotação zero não ganha ocupante mínimo')
  for (const stadium of [{ inv: {}, ext: [] }, { inv: { geral: NaN }, ext: [] }]) {
    assert.equal(update({ mode: 'career', stadium, day: playing }).total, 0, 'dados de carreira sem capacidade válida não ganham público')
  }
  const away = { stadium: full, day: { ...playing, support: 53 } }
  const both = update({ mode: 'career', stadium: full, day: playing, away })
  assert(both.home > 0 && both.away > 0)
  assert.deepEqual(both.awayAttendance, publicoDoEstadio(away.stadium, away.day))
  assert(update({ mode: 'career', stadium: full, day: playing, away: { ...away, stadium: { inv: {}, ext: [] } } }).away > 0,
    'torcida visitante usa assentos do anfitrião, mesmo sem arquibancada no estádio próprio')
  assert.equal(update({ mode: 'career', stadium: full, day: playing, away: { ...away, day: { ...away.day, match: 'idle' } } }).away, 0)
  assert.equal(update({ mode: 'career', stadium: full, day: { ...playing, match: 'idle' }, away }).total, 0, 'partida anfitriã encerrada não recebe visitantes')

  // Percentual exibido, chuva e estação vêm do helper; não existe outra fórmula.
  for (const [stadium, day] of [
    [{ inv: { geral: fullInv.geral }, ext: [] }, { ...playing, support: 80, rain: true }],
    [full, { ...playing, support: 80, rain: true }],
    [{ ...full, ext: ['estacao'] }, { ...playing, support: 80 }],
  ]) assert.deepEqual(update({ mode: 'career', stadium, day }).attendance, publicoDoEstadio(stadium, day))

  update({ mode: 'qa-sample', homeOccupancy: .6, awayOccupancy: .5, homeColor: '#1b7a3d', awayColor: '#c2452f' })
  const staticMatrices = matrices(crowd.root), staticSeats = crowd.inspect().seats
  for (let i = 0; i < 3; i++) {
    update({ mode: 'qa-sample', homeOccupancy: .6, awayOccupancy: .5, homeColor: '#1b7a3d', awayColor: '#c2452f' })
    assert.deepEqual(matrices(crowd.root), staticMatrices, 'update idêntico não anima os espectadores')
  }
  update({ mode: 'qa-sample', homeOccupancy: .6, awayOccupancy: .5, homeColor: '#224488', awayColor: '#dddddd' })
  assert.deepEqual(crowd.inspect().seats, staticSeats, 'trocar cores não move pessoas')
  assert.deepEqual(matrices(crowd.root), staticMatrices)

  // Animated arrivals reserve actual chairs and consume the same population
  // budget, even when the selected chair was not in the static sample before.
  update(qa)
  const beforeReservation = crowd.inspect()
  const reserved = ['home', 'away'].map(side => seats.find(seat => sideOf(seat) === side).id)
  crowd.reserve([...reserved, reserved[0], 'cadeira-inexistente'])
  const afterReservation = crowd.inspect()
  assert.equal(afterReservation.total + reserved.length, beforeReservation.total, 'visitas não aumentam o orçamento de público')
  assert.equal(afterReservation.reservations.length, 2, 'reserva deduplicada e validada na arquitetura')
  for (const id of reserved) {
    assert(!afterReservation.seats.some(seat => seat.id === id), 'cadeira animada sem pessoa estática')
    for (const mesh of meshes(crowd.root)) assert(!mesh.userData.seatIds.includes(id), 'geometria real não duplica a pessoa reservada')
  }
  const reservationMatrices = matrices(crowd.root)
  crowd.reserve(reserved)
  assert.deepEqual(matrices(crowd.root), reservationMatrices, 'reservar novamente conserva instâncias e posições')
  update({ mode: 'off' })
  assert.equal(crowd.inspect().total, 0, 'reservas não criam público quando desligado')
  crowd.reserve([])
  update(qa)
  assert.deepEqual(crowd.inspect().seats, beforeReservation.seats, 'liberar cadeiras restaura amostra determinística')

  // Os testes físicos são feitos nas malhas reais, não em dimensões declaradas.
  update(qa)
  scene.updateMatrixWorld(true)
  const crowdMeshes = meshes(crowd.root)
  assert(crowdMeshes.length > 0)
  assert(crowdMeshes.every(mesh => mesh instanceof THREE.InstancedMesh), 'multidão usa instancing')
  for (const mesh of crowdMeshes) {
    for (const attribute of Object.values(mesh.geometry.attributes)) {
      for (const value of attribute.array) assert(Number.isFinite(value), 'geometria finita')
    }
    for (const material of materials(mesh)) {
      assert(material instanceof THREE.MeshStandardMaterial, 'volume recebe luz real')
      assert.equal(material.transparent, false, 'pessoas não desaparecem por transparência')
      assert.equal(material.opacity, 1)
      assert.equal(material.depthTest, true)
      assert.equal(material.depthWrite, true)
      assert.equal(material.map, null, 'torcida sem retratos/texturas de rosto')
      assert.equal(material.alphaMap, null)
    }
  }
  const instance = new THREE.Matrix4(), expected = new THREE.Matrix4(), rotation = new THREE.Quaternion(), unit = new THREE.Vector3(1, 1, 1)
  const occupied = new Map(crowd.inspect().seats.map(seat => [seat.id, seat])), seen = new Map(), bodyBounds = new THREE.Box3()
  for (const mesh of crowdMeshes) {
    const seatIds = mesh.userData.seatIds
    assert(Array.isArray(seatIds), 'batch expõe a correspondência entre instância e assento')
    assert.equal(seatIds.length, mesh.count)
    mesh.geometry.computeBoundingBox(); bodyBounds.union(mesh.geometry.boundingBox)
    for (let index = 0; index < mesh.count; index++) {
      const seat = occupied.get(seatIds[index]); assert(seat, 'instância renderizada corresponde à inspeção')
      mesh.getMatrixAt(index, instance)
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), seat.heading)
      expected.compose(new THREE.Vector3(seat.position.x, seat.position.y, seat.position.z), rotation, unit)
      instance.premultiply(mesh.matrixWorld)
      instance.elements.forEach((value, i) => close(value, expected.elements[i], 'transformação real do ocupante'))
      const parts = seen.get(seat.id) ?? new Set()
      assert(!parts.has(mesh.userData.part), 'parte do corpo não é renderizada duas vezes')
      parts.add(mesh.userData.part); seen.set(seat.id, parts)
    }
  }
  assert.equal(seen.size, occupied.size, 'cada ocupante inspecionado tem geometria renderizada')
  for (const parts of seen.values()) assert.deepEqual(parts, new Set(['skin', 'shirt', 'lower']), 'cada ocupante tem corpo completo')
  renderedSeats += seen.size
  const size = bodyBounds.getSize(new THREE.Vector3())
  assert(size.x >= .25 && size.x <= .7, `largura humana: ${size.x}`)
  assert(size.y >= 1 && size.y <= 1.65, `altura humana sentada: ${size.y}`)
  assert(size.z >= .3 && size.z <= .9, `profundidade humana sentada: ${size.z}`)
  close(bodyBounds.min.y, 0, 'sola apoia no degrau', .015)
  assert(bodyBounds.max.z > .2, 'pernas dobradas ficam à frente do assento')
  const actualTriangles = crowdMeshes.reduce((total, mesh) => total + (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3 * mesh.count, 0)
  assert.equal(crowd.inspect().triangles, actualTriangles, 'orçamento conta a geometria renderizada')
  assert.equal(crowd.inspect().batches, crowdMeshes.length, 'inspeção conta todos os batches alocados')
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), up = down.clone().negate()
  const lowerParts = new Map(crowdMeshes.filter(mesh => mesh.userData.part === 'lower').map(mesh => [mesh.geometry, mesh.material]))
  assert(lowerParts.size > 0, 'protótipo tem pernas e pelve identificáveis')
  for (const [geometry, material] of lowerParts) {
    const proxy = new THREE.Mesh(geometry, material)
    proxy.updateMatrixWorld(true)
    for (const x of [-.11, .11]) {
      ray.set(new THREE.Vector3(x, -.03, .365), up); ray.near = 0; ray.far = .07
      const sole = ray.intersectObject(proxy, false)[0]
      assert(sole, 'sola física presente no pé do protótipo')
      close(sole.point.y, 0, 'sola do protótipo no chão', .006)
    }
    ray.set(new THREE.Vector3(0, .38, -.055), up); ray.near = 0; ray.far = .09
    const pelvis = ray.intersectObject(proxy, false)[0]
    assert(pelvis, 'pelve horizontal do protótipo sentada sobre a cadeira')
    close(pelvis.point.y, .43, 'quadril apoiado na altura do assento', .006)
  }

  // Confere as mesmas transformações nas cadeiras e concreto abaixo delas.
  const chairMeshes = meshes(architecture.root).filter(mesh => mesh instanceof THREE.InstancedMesh)
  const chairPositions = new Map()
  const positionKey = p => [p.x, p.y, p.z].map(Math.fround).join(':')
  const position = new THREE.Vector3()
  for (const mesh of chairMeshes) for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, instance); instance.premultiply(mesh.matrixWorld)
    position.setFromMatrixPosition(instance)
    chairPositions.set(positionKey(position), { matrix: instance.clone(), mesh })
  }
  for (const seat of occupied.values()) {
    const chair = chairPositions.get(positionKey(seat.position))
    assert(chair, `ocupante ${seat.id} tem cadeira física`)
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), seat.heading)
    expected.compose(new THREE.Vector3(seat.position.x, seat.position.y, seat.position.z), rotation, unit)
    chair.matrix.elements.forEach((value, i) => close(value, expected.elements[i], 'cadeira e pessoa coincidem'))
  }
  const concrete = meshes(architecture.root).filter(mesh => materials(mesh).some(material => material.name === 'estrutura-concreto-claro'))
  const categories = new Map()
  for (const seat of occupied.values()) {
    const key = seat.sector + ':' + seat.tier
    const list = categories.get(key) ?? []; list.push(seat); categories.set(key, list)
  }
  for (const list of categories.values()) for (const fraction of [0, .25, .5, .75, 1]) {
    const seat = list[Math.floor((list.length - 1) * fraction)]
    const physicalChair = chairPositions.get(positionKey(seat.position))
    const chairProxy = new THREE.Mesh(physicalChair.mesh.geometry, physicalChair.mesh.material)
    chairProxy.matrixAutoUpdate = false; chairProxy.matrix.copy(physicalChair.matrix); chairProxy.updateMatrixWorld(true)
    for (const x of [-.1, .1]) {
      const start = new THREE.Vector3(x, .65, 0).applyMatrix4(physicalChair.matrix)
      ray.set(start, down); ray.near = 0; ray.far = .3
      const surface = ray.intersectObject(chairProxy, false)[0]
      assert(surface, `${seat.id}: superfície real da cadeira ausente`)
      close(surface.point.y, seat.position.y + seat.seatHeight, 'altura da cadeira', .0001)
      physicalProbes++
    }
    for (const [x, z] of [[0, 0], [-.11, .365], [.11, .365]]) {
      const start = new THREE.Vector3(x, .06, z).applyMatrix4(physicalChair.matrix)
      ray.set(start, down); ray.near = 0; ray.far = .12
      const hit = ray.intersectObjects(concrete, false).find(item => item.face?.normal.y > .99)
      assert(hit, `${seat.id}: falta concreto sob ${x === 0 ? 'cadeira' : 'pé'}`)
      close(hit.point.y, seat.position.y, 'altura do degrau', .0001)
      physicalProbes++
    }
  }

  update({ mode: 'off' })
  assert.equal(crowd.inspect().total, 0)
  assert(meshes(crowd.root).every(mesh => mesh.count === 0 || !mesh.visible), 'off não deixa instâncias visíveis antigas')
  assert.deepEqual(seats, savedSeats)
  withoutClock(() => crowd.dispose()); withoutClock(() => crowd.dispose())
  assert.equal(crowd.root.parent, null)
  assert.equal(crowd.root.children.length, 0)
  verifyCrowd(1); verifyArchitecture(0); verifyForeign(0)
  assert.equal(architecture.root.parent, scene); assert.equal(foreign.parent, scene)
  assert.deepEqual(scene.children, [architecture.root, foreign], 'descarte conserva todo cenário alheio')
  architecture.dispose(); foreign.removeFromParent(); foreign.geometry.dispose(); foreign.material.map.dispose(); foreign.material.dispose()
  console.log('PASS torcida sentada: carreira/QA explícitos, obras parciais, seleção estável, orçamento limitado, matrizes reais, escala humana, concreto e descarte.', { sampleLimit: LIMITE_TORCIDA_COMPLEXO, reports, budgets, renderedSeats, physicalProbes })
} finally {
  hooks.deregister()
}
