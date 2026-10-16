// Lê módulos reais sem React, autenticação, navegador ou contas do usuário.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {registerHooks, stripTypeScriptTypes} from 'node:module'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL))
      if (fs.existsSync(candidate + '.ts')) return {url: pathToFileURL(candidate + '.ts').href, shortCircuit: true}
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/lang.ts')) return {format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true}
    if (url.endsWith('.ts')) return {format: 'module', source: stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url), 'utf8')), shortCircuit: true}
    return next(url, context)
  },
})
const {STADIUM_SECTORS, STADIUM_EXTRAS} = await import('../src/escalacao/estadiodata.ts')
const {camadasEstadio} = await import('../src/escalacao/presidencia-estadio-camadas.ts')
const {etapaBaseEstadio} = await import('../src/escalacao/presidencia-vista-estadio.ts')

// São os três recortes existentes e conferidos nas artes. Camarote não tem
// recorte próprio desta câmera: não fabricar um usando o raster Visitante.
const approved = {
  geral: {src: 'estadio-v112/geral-janela.webp', clip: 'polygon(0% 24%, 77% 24%, 77% 33%, 0% 41%)'},
  cadeiras: {src: 'estadio-v223/cadeiras-janela.webp', clip: 'polygon(0% 24%, 77% 24%, 77% 33%, 0% 41%)'},
  visitante: {src: 'estadio-v225/visitante-janela.webp', clip: 'polygon(77% 24%, 100% 29%, 100% 44%, 77% 35%)'},
}
const keys = STADIUM_SECTORS.map(sector => sector.k)
const cost = Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost]))
let checked = 0

// Todas as combinações zerado/parcial/completo, incluindo obras fora de ordem
// e percentuais que a etiqueta arredonda a100% antes do pagamento integral.
for (let combination = 0; combination < 4 ** keys.length; combination++) {
  let code = combination
  const inv = Object.fromEntries(keys.map(key => {
    const fraction = [0, .5, .9999, 1][code % 4]
    code = Math.floor(code / 4)
    return [key, cost[key] * fraction]
  }))
  for (const legacyGrass of [false, true]) {
    const st = {inv, ext: legacyGrass ? ['grama', 'medico'] : []}
    const before = JSON.stringify(st)
    const stage = etapaBaseEstadio(st)
    const included = keys.indexOf(stage)
    const layers = camadasEstadio(st, 'window')
    for (const [key, expected] of Object.entries(approved)) {
      const built = inv[key] > 0
      const alreadyVisible = keys.indexOf(key) <= included
      const layer = layers.find(item => item.id === key)
      assert.equal(!!layer, built && !alreadyVisible, `${key}: obra perdida/duplicada ${JSON.stringify(st)}`)
      if (layer) {
        assert.equal(layer.progress, inv[key] / cost[key], `${key}: progresso precisa ser exato`)
        assert.equal(layer.src, expected.src)
        assert.equal(layer.clip, expected.clip, `${key}: recorte aprovado alterado`)
        assert(fs.existsSync(path.join(root, 'public', layer.src)))
      }
    }
    assert(!layers.some(layer => layer.id === 'camarote'), 'não inventar arte de camarote fora do enquadramento')
    const aerial = camadasEstadio(st, 'aerial')
    for (const key of keys.filter(key => key !== 'grama')) {
      assert.equal(aerial.some(layer => layer.id === key), inv[key] > 0, `${key}: preservar camadas aéreas`)
    }
    assert.equal(JSON.stringify(st), before, 'leitura visual não altera o save')
    checked++
  }
}

for (const key of Object.keys(approved)) {
  const isolated = {inv: {[key]: cost[key]}, ext: []}
  const layers = camadasEstadio(isolated, 'window')
  assert.deepEqual(layers.map(layer => layer.id), [key], `${key}: setor completo isolado deve permanecer visível`)
  assert.equal(layers[0].progress, 1)
}
const fullInv = {...cost}
const fullWindow = {inv: fullInv, ext: ['refl', 'telao', 'cober', 'retratil']}
for (const roofClosed of [false, true]) {
  assert.deepEqual(camadasEstadio({...fullWindow, roofClosed}, 'window'), [], 'raster completo já representa obras e teto')
  assert.deepEqual(camadasEstadio({...fullWindow, ext: STADIUM_EXTRAS.map(extra => extra.k), roofClosed}, 'window'), [], 'negócios não duplicam a imagem completa da janela')
}
const legacy = {inv: {geral: 40, cadeiras: 90, visitante: 120, camarote: 150}, ext: ['grama', 'medico']}
assert.equal(etapaBaseEstadio(legacy), 'camarote')
assert.deepEqual(camadasEstadio(legacy, 'window'), [], 'rasters legados sequenciais continuam sem sobreposição')
const partialUpper = {inv: {...fullInv, camarote: 75}, ext: []}
assert.deepEqual(camadasEstadio(partialUpper, 'window'), [], 'limitação de camarote parcial permanece explícita; não inventar arte')
const legacyEarlyRoof = {inv: {geral: 40}, ext: ['cober', 'retratil'], roofClosed: true}
assert.deepEqual(camadasEstadio(legacyEarlyRoof, 'window').map(layer => layer.id), ['geral'], 'teto legado não concede estrutura nem esconde setor comprado')
assert.deepEqual(camadasEstadio({inv: {cadeiras: Infinity}, ext: []}, 'window'), [])
assert.deepEqual(camadasEstadio(undefined, 'window'), [])
console.log(`PASS janela: ${checked} combinações parciais/completas/desordenadas/legadas; recortes preservados, raster completo sem duplicação e nenhuma arte inventada de camarote.`)
