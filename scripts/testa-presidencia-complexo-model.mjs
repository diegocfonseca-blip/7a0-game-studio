import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'

// Resolve os imports TypeScript do jogo sem abrir navegador, conta ou serviço.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL))
      if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
    return next(url, context)
  },
})

const { complexoDoEstadio, OBRAS_COMPLEXO, PLANTA_COMPLEXO, mapaParaMundo, mundoParaMapa, obstaculosComplexo } =
  await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
const { PAVIMENTACAO_ESTADIO, primeiroAndarConcluido, segundoAndarConcluido, extraLiberadoNoProjeto } =
  await import('../src/escalacao/presidencia-estadio-projeto.ts')
const { progressoVisualSetor } = await import('../src/escalacao/presidencia-estadio-camadas.ts')
const { camadasMundo } = await import('../src/escalacao/presidencia-estadio-mundo.ts')
const { CAMPO_MAPA } = await import('../src/escalacao/presidencia-partida-geometria.ts')
const { ROTAS_ESTADIO } = await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
const { PORTA_LOJA, PORTA_HOTEL, PORTA_BAR } = await import('../src/escalacao/presidencia-estadio-portas.ts')
const { obstaculosDoEstadio } = await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const extras = [...STADIUM_EXTRAS, PAVIMENTACAO_ESTADIO]
const close = (a, b, message, epsilon = 1e-8) => assert(Math.abs(a - b) < epsilon, `${message}: ${a} / ${b}`)
const fullInv = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost]))
const allExtras = extras.map(e => e.k)
assert.equal(OBRAS_COMPLEXO.length, STADIUM_SECTORS.length + extras.length)
assert.equal(OBRAS_COMPLEXO.length, 16)
assert.equal(new Set(OBRAS_COMPLEXO.map(w => w.id)).size, 16)

// Todas as combinações de cinco setores e onze compras, com teto aberto/fechado.
let states = 0
for (let sectorMask = 0; sectorMask < 1 << STADIUM_SECTORS.length; sectorMask++) {
  const inv = Object.freeze(Object.fromEntries(STADIUM_SECTORS.map((s, i) => [s.k, sectorMask & 1 << i ? s.cost : 0])))
  for (let extraMask = 0; extraMask < 1 << extras.length; extraMask++) {
    const ext = Object.freeze(extras.filter((_, i) => extraMask & 1 << i).map(e => e.k))
    for (const roofClosed of [false, true]) {
      const save = Object.freeze({ inv, ext, roofClosed })
      const state = complexoDoEstadio(save)
      assert.equal(state.valid, true)
      assert.equal(state.lowerComplete, primeiroAndarConcluido(save))
      assert.equal(state.upperComplete, segundoAndarConcluido(save))
      assert.equal(state.roofBuilt, ext.includes('cober') && extraLiberadoNoProjeto(save, 'cober'))
      assert.equal(state.roofClosed, state.roofBuilt && ext.includes('retratil') && roofClosed)
      assert.equal(state.floodlit, ext.includes('refl') && state.progress.geral === 1 && state.progress.grama > 0)
      assert.equal(state.screenVisible, ext.includes('telao') && state.progress.cadeiras === 1)
      for (const s of STADIUM_SECTORS) assert.equal(state.progress[s.k], progressoVisualSetor(save, s.k))
      for (const e of extras) assert.equal(state.extras[e.k], ext.includes(e.k), `posse de ${e.k}`)
      states++
    }
  }
}

for (const sector of STADIUM_SECTORS) for (const portion of [.001, .25, .5, .999999, 1, 2]) {
  const save = { inv: { ...fullInv, [sector.k]: sector.cost * portion }, ext: [...allExtras], roofClosed: true }
  const before = JSON.stringify(save), state = complexoDoEstadio(save)
  close(state.progress[sector.k], Math.min(1, portion), `progresso sem arredondar de ${sector.k}`)
  const actualLayers = camadasMundo(save)
  assert.equal(state.roofBuilt, actualLayers.some(layer => layer.id === 'cober'), 'mesma cobertura da visualização existente')
  assert.equal(state.roofClosed, actualLayers.some(layer => layer.id === 'retratil'), 'mesmo retrátil da visualização existente')
  assert.equal(JSON.stringify(save), before, 'estado derivado não altera o save')
}
const legacy = { inv: { ...fullInv, grama: 0 }, ext: [...allExtras, 'grama', 'medico', 'compra-futura'], roofClosed: true }
const beforeLegacy = JSON.stringify(legacy)
assert.equal(complexoDoEstadio(legacy).progress.grama, 1, 'gramado legado conserva investimento')
assert.equal(complexoDoEstadio(legacy).roofClosed, true)
assert.equal(JSON.stringify(legacy), beforeLegacy)
assert.equal(complexoDoEstadio({ inv: {}, ext: ['cober', 'retratil'], roofClosed: true }).extras.retratil, true, 'bem legado não some')
assert.equal(complexoDoEstadio({ inv: {}, ext: ['cober', 'retratil'], roofClosed: true }).roofBuilt, false, 'teto não flutua sem estrutura')
assert.equal(complexoDoEstadio(undefined).valid, true)
for (const broken of [null, {}, { inv: { geral: NaN }, ext: [] }, { inv: { grama: -1 }, ext: [] }, { inv: {}, ext: 'loja' }]) {
  const state = complexoDoEstadio(broken)
  assert.equal(state.valid, false)
  assert(Object.values(state.progress).every(value => value === 0))
  assert(Object.values(state.extras).every(value => value === false))
  assert.deepEqual(obstaculosComplexo(broken), [])
}

const corners = [{ x: -52.5, z: -34 }, { x: 52.5, z: -34 }, { x: -52.5, z: 34 }, { x: 52.5, z: 34 }]
for (let i = 0; i < corners.length; i++) {
  const p = mundoParaMapa(corners[i]), m = mapaParaMundo({ x: CAMPO_MAPA[i][0], y: CAMPO_MAPA[i][1] })
  close(p.x, CAMPO_MAPA[i][0], `canto ${i} pixel x`)
  close(p.y, CAMPO_MAPA[i][1], `canto ${i} pixel y`)
  close(m.x, corners[i].x, `canto ${i} metro x`)
  close(m.z, corners[i].z, `canto ${i} metro z`)
}
let projectedPoints = 0
for (let x = -48; x <= 1570; x += 17) for (let y = 0; y <= 1024; y += 19) {
  const m = mapaParaMundo({ x, y }), p = mundoParaMapa(m)
  close(p.x, x, 'ida/volta pixel x')
  close(p.y, y, 'ida/volta pixel y')
  if (x >= 0 && x <= 1536) {
    assert(m.x >= PLANTA_COMPLEXO.bounds.minX - 1e-8 && m.x <= PLANTA_COMPLEXO.bounds.maxX + 1e-8)
    assert(m.z >= PLANTA_COMPLEXO.bounds.minZ - 1e-8 && m.z <= PLANTA_COMPLEXO.bounds.maxZ + 1e-8)
  }
  projectedPoints++
}
// Retas continuam retas mesmo longe do centro: não aceitar interpolação bilinear.
for (const line of [[{ x: -100, z: -80 }, { x: 80, z: 120 }], [{ x: -52.5, z: -34 }, { x: 52.5, z: 34 }]]) {
  const [a, b] = line.map(mundoParaMapa)
  const middle = mundoParaMapa({ x: (line[0].x + line[1].x) / 2, z: (line[0].z + line[1].z) / 2 })
  close((middle.x - a.x) * (b.y - a.y) - (middle.y - a.y) * (b.x - a.x), 0, 'homografia preserva linha', 1e-7)
}
for (const invalid of [{ x: NaN, y: 1 }, { x: 1, y: Infinity }]) assert.throws(() => mapaParaMundo(invalid), RangeError)
assert.throws(() => mundoParaMapa({ x: Infinity, z: 0 }), RangeError)

const full = { inv: fullInv, ext: allExtras }
const originalObstacles = obstaculosDoEstadio(full)
for (const obstacle of originalObstacles) {
  const registered = PLANTA_COMPLEXO.footprints[obstacle.id]
  assert.equal(registered.length, obstacle.polygon.length)
  for (let i = 0; i < registered.length; i++) {
    const p = mundoParaMapa(registered[i])
    close(p.x, obstacle.polygon[i].x, `${obstacle.id} registro x`)
    close(p.y, obstacle.polygon[i].y, `${obstacle.id} registro y`)
  }
}
assert.equal(PLANTA_COMPLEXO.arena.dimensionSource, 'inferred-reference')
assert.notDeepEqual(PLANTA_COMPLEXO.arena.structure, PLANTA_COMPLEXO.arena.collisionBounds,
  'bloqueio conservador não deve virar pegada inventada da arquibancada')
for (const lot of Object.values(PLANTA_COMPLEXO.lots)) {
  assert.equal(lot.footprintSource, 'registered-navigation')
  assert(lot.width > 0 && lot.depth > 0)
  const cos = Math.cos(lot.rotation), sin = Math.sin(lot.rotation)
  for (const p of lot.footprint) {
    const x = (p.x - lot.x) * cos - (p.z - lot.z) * sin
    const z = (p.x - lot.x) * sin + (p.z - lot.z) * cos
    assert(Math.abs(x) <= lot.width / 2 + 1e-8 && Math.abs(z) <= lot.depth / 2 + 1e-8, 'caixa orientada envolve seu registro')
  }
}
for (const portal of [PORTA_LOJA, PORTA_HOTEL, PORTA_BAR]) {
  const door = PLANTA_COMPLEXO.doors[portal.id]
  for (const key of ['approach', 'threshold', 'inside']) {
    const p = mundoParaMapa(door[key])
    close(p.x, portal[key].x, `${portal.id} ${key} x`)
    close(p.y, portal[key].y, `${portal.id} ${key} y`)
  }
  assert.equal(door.stay, portal.stay)
  const outside = { x: door.approach.x - door.inside.x, z: door.approach.z - door.inside.z }
  assert(outside.x * Math.sin(door.heading) + outside.z * Math.cos(door.heading) > 0, 'fachada olha para fora')
}
for (const route of Object.values(ROTAS_ESTADIO)) {
  const mapped = PLANTA_COMPLEXO.routes[route.id]
  assert.equal(mapped.points.length, route.points.length)
  assert.equal(mapped.loop, route.loop)
  for (let i = 0; i < route.points.length; i++) {
    const p = mundoParaMapa(mapped.points[i])
    close(p.x, route.points[i].x, `${route.id} caminho x`)
    close(p.y, route.points[i].y, `${route.id} caminho y`)
  }
}
assert.deepEqual(obstaculosComplexo({ inv: {}, ext: [] }), [])
for (const key of ['hotel', 'loja', 'chopp', 'praca', 'estacao']) {
  const active = obstaculosComplexo({ inv: {}, ext: [key] })
  assert.deepEqual(active.map(o => o.id), [key], 'não cria estabelecimento antes da compra')
}
console.log(`PASS complexo: ${states} combinações de obras/teto; 16 obras do catálogo real; progressos parciais e legado; ${projectedPoints} projeções exatas; campo105×68, portas/rotas/registros preservados e colisores condicionais, sem mutar saves.`)
