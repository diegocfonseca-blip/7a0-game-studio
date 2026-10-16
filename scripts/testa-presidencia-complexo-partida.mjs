import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname } from 'node:path'
import * as THREE from 'three'

// Node 24 executa o TypeScript real. Só adaptamos os imports sem extensão e a
// constante do Vite; nenhum navegador, WebGL, download ou motor substituto.
const sourceRoot = new URL('../src/escalacao/', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot) && !extname(specifier)) {
      const url = new URL(specifier + '.ts', context.parentURL)
      if (existsSync(url)) return nextResolve(url.href, context)
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context)
    if (url.startsWith(sourceRoot) && loaded.source != null) {
      return { ...loaded, source: Buffer.from(loaded.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") }
    }
    return loaded
  },
})

const originalLoad = THREE.TextureLoader.prototype.load
const loadedTextures = []
THREE.TextureLoader.prototype.load = function (url, onLoad) {
  assert.equal(url, '/estadio-partida/grass-base.webp')
  const texture = new THREE.Texture()
  loadedTextures.push(texture)
  queueMicrotask(() => onLoad?.(texture))
  return texture
}

const close = (actual, expected, message) => assert(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`)
const all = root => { const result = []; root.traverse(node => result.push(node)); return result }
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const resources = root => {
  const found = new Set()
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh || node instanceof THREE.LineSegments)) return
    found.add(node.geometry)
    if (node instanceof THREE.InstancedMesh) found.add(node)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      found.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) found.add(value)
    }
  })
  return found
}
const disposal = new Map()
const watch = items => {
  for (const item of items) if (!disposal.has(item)) {
    disposal.set(item, 0)
    item.addEventListener('dispose', () => disposal.set(item, disposal.get(item) + 1))
  }
}
const released = (items, expected = 1) => {
  for (const item of items) assert.equal(disposal.get(item), expected, `${item.type ?? 'Texture'}: dispose exatamente ${expected} vez(es)`)
}

let match
let reference
try {
  const { criarPartidaComplexo, criarCampo3D } = await import('../src/escalacao/presidencia-complexo-partida.ts')
  const { quadroFutebol3D } = await import('../src/escalacao/presidencia-futebol-motor.ts')
  const { person, pose } = await import('../src/escalacao/presidencia-atleta-3d.ts')
  const { BANCO_Z, TECNICO_Z } = await import('../src/escalacao/presidencia-area-tecnica.ts')
  assert.equal(typeof criarCampo3D, 'function', 'campo pode ser reutilizado pela câmera existente')

  const roles = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
  const team = side => roles.map((pos, i) => ({ id: side + i, name: `Atleta ${side} ${i}`, pos }))
  const home = team('h'), away = team('a')
  const reserve = (id, pos = 'MEI') => ({ id, name: `Reserva ${id}`, pos })
  const stadium = freeze({ inv: { grama: 30 }, ext: [] })
  const state = freeze({
    context: {
      id: 'complexo-teste', stadium, home, away,
      homeBench: [home[0], reserve('h-reserva'), reserve('h-reserva'), { ...reserve('fake'), fake: true }, reserve(''), { id: 'sem-nome', name: '', pos: 'MEI' }, reserve('invalido', 'INVALIDA'), reserve('h-goleiro', 'GOL')],
      awayBench: [away[10], ...Array.from({ length: 9 }, (_, i) => reserve('a-reserva-' + i))],
    },
    minute: 20, homeScore: 0, awayScore: 0, paused: false, finished: false,
    homeColor: '#1B7A3D', awayColor: '#C2452F',
    visualClock: { seconds: 0, sampledAt: 1000, running: true, rate: 1 },
  })
  const originalState = structuredClone(state)
  const scene = new THREE.Scene()
  const unrelated = new THREE.Group()
  unrelated.name = 'cenário-de-outro-dono'
  const otherMaterial = new THREE.MeshStandardMaterial({ map: new THREE.Texture() })
  const otherGeometry = new THREE.BoxGeometry(2, 3, 4)
  unrelated.add(new THREE.Mesh(otherGeometry, otherMaterial), new THREE.Mesh(otherGeometry, otherMaterial))
  unrelated.position.set(70, 0, 30)
  scene.add(unrelated)
  const externalResources = resources(unrelated)
  watch(externalResources)
  const externalChildren = [...unrelated.children]
  let ready = 0
  match = criarPartidaComplexo(scene, stadium, undefined, () => ready++)
  const field = scene.getObjectByName('complexo-campo')
  assert(field, 'complexo nasce com campo real')
  const fieldNodes = all(field)
  const fieldResources = resources(field)
  watch(fieldResources)
  watch(loadedTextures)
  assert(fieldNodes.some(node => node instanceof THREE.Mesh), 'campo possui malhas')
  const emptyInspection = { players: 0, ball: { x: 0, y: .11, z: 0 } }
  const assertEmpty = () => {
    assert.deepEqual(match.inspect(), emptyInspection)
    assert.deepEqual(scene.children, [unrelated, field], 'sem partida, só permanecem campo e cenário alheio')
    assert.equal(scene.getObjectByName('match-referee'), undefined)
    assert.equal(scene.getObjectByName('match-ball'), undefined)
    assert.equal(scene.getObjectByName('home-coach'), undefined)
    assert.equal(scene.getObjectByName('away-coach'), undefined)
  }
  assertEmpty()
  await Promise.resolve()
  assert.equal(ready, 1, 'textura pronta solicita redesenho')

  const invalidTeams = [
    home.slice(1), [...home, reserve('extra')],
    home.map((p, i) => i === 1 ? { ...p, id: home[0].id } : p),
    home.map((p, i) => i === 2 ? { ...p, fake: true } : p),
    home.map((p, i) => i === 0 ? { ...p, pos: 'ZAG' } : p),
    home.map((p, i) => i === 2 ? { ...p, name: '' } : p),
  ]
  for (const invalid of invalidTeams) {
    match.update(freeze({ ...state, context: { ...state.context, home: invalid } }), 1000)
    assertEmpty()
  }

  reference = person('#ffffff', '#ffffff')
  let checkedFrames = 0
  const assertPose = (actual, p, label) => {
    assert(actual, `personagem ausente: ${label}`)
    pose(reference, p)
    reference.group.updateMatrixWorld(true)
    const observed = all(actual), expected = all(reference.group)
    assert.equal(observed.length, expected.length, `esqueleto completo: ${label}`)
    observed.forEach((node, i) => node.matrixWorld.elements.forEach((value, j) =>
      close(value, expected[i].matrixWorld.elements[j], `${label}, peça ${i}, matriz ${j}`)))
  }
  const assertFrame = (current, now) => {
    match.update(current, now)
    const expected = quadroFutebol3D(current, now)
    scene.updateMatrixWorld(true)
    assert.deepEqual(match.inspect(), { players: 22, ball: expected.ball, time: expected.time, phase: expected.phase, matchId: current.context.id })
    const root = scene.getObjectByName('complexo-partida')
    assert(root)
    const players = all(root).filter(node => /^(home|away):/.test(node.name))
    assert.deepEqual(players.map(node => node.name).sort(), expected.players.map(p => p.key).sort())
    for (const player of expected.players) assertPose(root.getObjectByName(player.key), player, player.key)
    const r = expected.referee
    assertPose(root.getObjectByName('match-referee'), { mx: r.x, mz: r.z, heading: r.heading, distance: r.distance, speed: r.speed, kick: 0, throwing: 0 }, 'árbitro')
    const ball = root.getObjectByName('match-ball')
    assert.deepEqual(ball.position.toArray(), [expected.ball.x, expected.ball.y, expected.ball.z])
    close(ball.rotation.x, expected.ball.z / .11, 'rotação X da bola')
    close(ball.rotation.z, -expected.ball.x / .11, 'rotação Z da bola')
    // Os esqueletos são ocultos: a posição realmente desenhada está no lote.
    // A geometria de cada lote pertence à sua primeira peça de origem.
    const nodes = all(root)
    const sources = nodes.filter(node => node instanceof THREE.Mesh && !(node instanceof THREE.InstancedMesh) && !node.visible)
    const batches = nodes.filter(node => node instanceof THREE.InstancedMesh)
    assert(batches.length > 0)
    assert.equal(batches.reduce((sum, batch) => sum + batch.count, 0), sources.length)
    for (const batch of batches) {
      const source = sources.find(node => node.geometry === batch.geometry)
      assert(source, 'lote desenha geometria real de um personagem')
      const rendered = new THREE.Matrix4()
      batch.getMatrixAt(0, rendered)
      rendered.premultiply(batch.matrixWorld)
      rendered.elements.forEach((value, i) => assert(Math.abs(value - source.matrixWorld.elements[i]) < 1e-5, 'lote acompanha a pose do esqueleto no mesmo quadro'))
    }
    watch(resources(root))
    checkedFrames++
    return expected
  }
  assertFrame(state, 1000)
  const firstRoot = scene.getObjectByName('complexo-partida')
  const firstNodes = all(firstRoot)
  const firstResources = resources(firstRoot)
  const benchNames = all(firstRoot).filter(node => /^(home|away)-bench:/.test(node.name)).map(node => node.name).sort()
  assert.deepEqual(benchNames, ['home-bench:h-reserva', 'home-bench:h-goleiro', ...Array.from({ length: 7 }, (_, i) => 'away-bench:a-reserva-' + i)].sort(), 'banco só recebe reservas reais, únicas, fora do XI e até sete por equipe')
  for (const side of ['home', 'away']) {
    const seat = firstRoot.getObjectByName(side + '-bench-seat')
    const coach = firstRoot.getObjectByName(side + '-coach')
    assert(seat && coach)
    close(seat.getWorldPosition(new THREE.Vector3()).z, -36.8, 'banco exclusivamente ao norte')
    close(coach.getWorldPosition(new THREE.Vector3()).z, TECNICO_Z, 'técnico diante do banco norte')
    for (const node of all(firstRoot).filter(node => node.name.startsWith(side + '-bench:'))) {
      close(node.getWorldPosition(new THREE.Vector3()).z, BANCO_Z, 'reserva sentada no banco norte')
      assert(new THREE.Vector3(0, 0, 1).applyQuaternion(node.getWorldQuaternion(new THREE.Quaternion())).z > .999, 'reservas olham para dentro do campo')
    }
  }
  for (let i = 1; i <= 120; i++) assertFrame(state, 1000 + i * 25)
  assert.deepEqual(all(firstRoot), firstNodes, 'animação reaproveita objetos e lotes')
  assert.deepEqual(resources(firstRoot), firstResources, 'animação não substitui geometria/material')
  released(firstResources, 0)

  const paused = freeze({ ...state, paused: true, visualClock: { seconds: 3, sampledAt: 4000, running: false } })
  assertFrame(paused, 4000)
  const snapshot = () => all(firstRoot).map(node => [node.id, ...node.matrixWorld.elements, ...(node instanceof THREE.InstancedMesh ? node.instanceMatrix.array : [])])
  const still = snapshot()
  for (const now of [4100, 4900, 9000]) {
    assertFrame(paused, now)
    assert.deepEqual(snapshot(), still, 'pausa congela poses, bola, árbitro, técnicos e lotes')
  }
  const inspected = match.inspect()
  inspected.ball.x = 999
  assert.notEqual(match.inspect().ball.x, 999, 'inspect devolve cópia da bola')

  for (const homeGoal of [true, false]) {
    const goal = { id: 'gol-' + homeGoal, home: homeGoal, name: homeGoal ? home[10].name : away[10].name, minute: 20, startedAt: 10000, phase: 'shot' }
    const shot = freeze({ ...state, context: { ...state.context, id: 'complexo-gol-' + homeGoal }, goal, visualClock: { seconds: 0, sampledAt: 10000, running: true } })
    assertFrame(shot, 10000)
    assertFrame(shot, 10400)
    const confirmed = freeze({ ...shot, goal: { ...goal, phase: 'confirmed' }, homeScore: +homeGoal, awayScore: +!homeGoal, visualClock: { seconds: .9, sampledAt: 10900, running: false }, paused: true })
    const goalFrame = assertFrame(confirmed, 10900)
    assert.equal(goalFrame.phase, 'gol')
    assert(homeGoal ? goalFrame.ball.x > 52.5 : goalFrame.ball.x < -52.5, 'só gol confirmado cruza a linha')
    assertFrame(confirmed, 20000)
  }
  released(firstResources)

  const sub = reserve('h-reserva', 'ATA')
  const secondHalf = freeze({ ...state, minute: 46, context: { ...state.context, id: 'complexo-segundo-tempo', homeSecondHalf: [...home.slice(0, 10), sub], homeBench: [...state.context.homeBench, home[10]] }, visualClock: { seconds: 0, sampledAt: 21000, running: false } })
  assertFrame(secondHalf, 21000)
  assert(scene.getObjectByName('home:h-reserva'))
  assert.equal(scene.getObjectByName('home:h10'), undefined)
  assert.equal(scene.getObjectByName('home-bench:h-reserva'), undefined, 'substituto não aparece simultaneamente no banco')
  assert(scene.getObjectByName('home-bench:h10'), 'titular substituído ocupa banco quando fornecido no estado')
  assert.deepEqual(state, originalState, 'composição/animação não alteram estado, escalação ou placar')

  const removedResources = resources(scene.getObjectByName('complexo-partida'))
  match.update(undefined, 22000)
  assertEmpty()
  released(removedResources)
  assert.deepEqual(all(field), fieldNodes, 'retirar partida preserva o mesmo campo')
  released(fieldResources, 0)
  assertFrame(state, 23000)
  match.update(freeze({ ...state, context: { ...state.context, away: [] } }), 23000)
  assertEmpty()
  assertFrame(state, 23000)

  match.dispose()
  assert.deepEqual(scene.children, [unrelated])
  assert.deepEqual(match.inspect(), emptyInspection)
  match.dispose()
  match.update(state, 99999)
  assert.deepEqual(scene.children, [unrelated], 'update depois de dispose não recria objetos')
  assert.deepEqual(unrelated.children, externalChildren, 'objetos de outros donos permanecem inteiros')
  released(externalResources, 0)
  for (const [resource, count] of disposal) if (!externalResources.has(resource)) assert.equal(count, 1, `dispose completo e único: ${resource.type ?? 'Texture'}`)

  const initialScene = new THREE.Scene()
  const initialState = freeze({ ...state, context: { ...state.context, id: 'complexo-estado-inicial' }, visualClock: { seconds: 2, sampledAt: 24000, running: false } })
  const initial = criarPartidaComplexo(initialScene, undefined, initialState)
  const initialFrame = quadroFutebol3D(initialState, 24000)
  assert.deepEqual(initial.inspect(), { players: 22, ball: initialFrame.ball, time: initialFrame.time, phase: initialFrame.phase, matchId: initialState.context.id }, 'construtor aplica o estado fornecido no instante compartilhado')
  const initialResources = resources(initialScene)
  watch(initialResources)
  initial.dispose()
  released(initialResources)
  assert.equal(initialScene.children.length, 0)

  const invalidScene = new THREE.Scene()
  const invalidInitial = criarPartidaComplexo(invalidScene, stadium, { ...state, context: { ...state.context, home: invalidTeams[0] } })
  assert.deepEqual(invalidInitial.inspect(), emptyInspection)
  assert.deepEqual(invalidScene.children.map(node => node.name), ['complexo-campo'], 'construtor com escalação inválida não cria personagens')
  invalidInitial.dispose()

  // Uma imagem que termina depois da desmontagem não deve reativar a cena.
  let lateReady = 0
  const lateScene = new THREE.Scene()
  const late = criarPartidaComplexo(lateScene, undefined, undefined, () => lateReady++)
  const lateTexture = loadedTextures.at(-1)
  watch([lateTexture])
  late.dispose()
  await Promise.resolve()
  assert.equal(lateReady, 0)
  assert.equal(lateScene.children.length, 0)
  released([lateTexture])
  console.log(`PASS complexo partida3D: ${checkedFrames} quadros sincronizados, 22 atletas reais e poses, árbitro, técnicos/bancos ao norte, reservas válidas, pausa, gols dos dois lados, substituição, estado intacto, campo preservado e dispose completo/idempotente. Sem DOM, WebGL ou rede.`)
} finally {
  match?.dispose()
  if (reference) for (const item of resources(reference.group)) item.dispose()
  THREE.TextureLoader.prototype.load = originalLoad
  hooks.deregister()
}
