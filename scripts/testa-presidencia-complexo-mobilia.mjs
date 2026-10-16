import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import * as THREE from 'three'
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
const { criarMobiliaComplexo } = await import('../src/escalacao/presidencia-complexo-mobilia.ts')
const { complexoDoEstadio, PLANTA_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')
const { PRESIDENCIA_CATALOGO, carteiraPresidenciaValida, orcarPresidencia, confirmarPresidencia } = await import('../src/escalacao/presidencia-economia.ts')
const inv = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost]))
const full = { inv, ext: [] }, box = PLANTA_COMPLEXO.presidentBox, epsilon = 2e-5
const furniture = PRESIDENCIA_CATALOGO.filter(p => p.slot !== 'carro' && p.slot !== 'duas-rodas')
assert.equal(furniture.length, 13)
const wallet = ids => ({ cash: 1000, revision: 1, owned: ids.map(id => ({ id, paid: PRESIDENCIA_CATALOGO.find(p => p.id === id).price })) })
const basic = furniture.filter(p => !['cadeira-couro', 'mesa-madeira', 'estante-madeira'].includes(p.id)).map(p => p.id)
const premium = furniture.filter(p => !['cadeira-simples', 'mesa-simples', 'estante-simples'].includes(p.id)).map(p => p.id)
const samples = [
 { name: 'sem-carteira', save: full, wallet: undefined, status: 'missing', ids: [] },
 { name: 'carteira-nula', save: full, wallet: null, status: 'missing', ids: [] },
 { name: 'sem-bens', save: full, wallet: wallet([]), status: 'valid', ids: [] },
 { name: 'varzea-com-bens', save: { inv: {}, ext: [] }, wallet: wallet(premium), status: 'valid', ids: [] },
 { name: 'primeiro-anel', save: { inv: { ...inv, camarote: 0 }, ext: [] }, wallet: wallet(premium), status: 'valid', ids: [] },
 { name: 'camarote-sem-primeiro-anel', save: { inv: { camarote: inv.camarote }, ext: [] }, wallet: wallet(premium), status: 'valid', ids: [] },
 { name: 'estadio-invalido', save: { inv: { geral: NaN }, ext: [] }, wallet: wallet(premium), status: 'valid', ids: [] },
 { name: 'saldo-invalido', save: full, wallet: { ...wallet(premium), cash: -1 }, status: 'invalid', ids: [] },
 { name: 'revisao-invalida', save: full, wallet: { ...wallet(premium), revision: 1.5 }, status: 'invalid', ids: [] },
 { name: 'id-inexistente', save: full, wallet: { ...wallet([]), owned: [{ id: 'mesa-gratis', paid: 0 }] }, status: 'invalid', ids: [] },
 { name: 'duas-mesas', save: full, wallet: wallet(['mesa-simples', 'mesa-madeira']), status: 'invalid', ids: [] },
 { name: 'duplicado', save: full, wallet: wallet(['planta', 'planta']), status: 'invalid', ids: [] },
 { name: 'apenas-garagem', save: full, wallet: wallet(['fusca', 'chevette', 'fat-boy']), status: 'valid', ids: [] },
 ...furniture.map(p => ({ name: p.id, save: full, wallet: wallet([p.id]), status: 'valid', ids: [p.id] })),
 { name: 'conjunto-basico', save: full, wallet: wallet(basic), status: 'valid', ids: [...basic].sort() },
 { name: 'conjunto-madeira', save: full, wallet: wallet(premium), status: 'valid', ids: [...premium].sort() },
 { name: 'camarote-parcial', save: { inv: { ...inv, camarote: inv.camarote / 2 }, ext: [] }, wallet: wallet(premium), status: 'valid', ids: [...premium].sort() },
]
const report = []
for (const sample of samples) {
 const scene = new THREE.Scene(), unrelated = new THREE.Group(); scene.add(unrelated)
 const original = JSON.stringify([sample.save, sample.wallet]), room = criarMobiliaComplexo(scene, complexoDoEstadio(sample.save), sample.wallet)
 const info = room.inspect(), meshes = [], geometries = new Set(), materials = new Set()
 assert.equal(info.walletStatus, sample.status, sample.name)
 assert.deepEqual(info.renderedFurniture, sample.ids, sample.name)
 assert.equal(info.president, false); assert.equal(info.identity, false); assert.equal(info.trophies, 0)
 assert.equal(JSON.stringify([sample.save, sample.wallet]), original, sample.name + ': mutação do save ou da carteira')
 scene.updateMatrixWorld(true)
 room.root.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return
  meshes.push(object); geometries.add(object.geometry); materials.add(object.material)
  for (const attribute of Object.values(object.geometry.attributes)) for (const value of attribute.array)
   assert(Number.isFinite(value), sample.name + ': geometria não finita')
 })
 assert(info.meshes <= 40, sample.name + ': excesso de malhas ' + info.meshes)
 assert(info.triangles <= 25000, sample.name + ': excesso de triângulos ' + info.triangles)
 for (const item of info.placements) {
  const min = item.bounds.min, max = item.bounds.max
  assert(min.x >= box.minX + .175 - epsilon && max.x <= box.maxX - .175 + epsilon, sample.name + ': invade parede lateral')
  assert(min.z > box.minZ + .8 && max.z < box.maxZ - .125, sample.name + ': invade janela ou parede traseira')
  assert(min.y >= box.floor - epsilon && max.y <= box.ceiling + epsilon, sample.name + ': ultrapassa piso/teto')
  assert(max.x < -3 || min.x > 3, sample.name + ': ocupa corredor central')
  if (item.support === 'floor') {
   const rugSupport = sample.ids.includes('tapete') && /^(mesa|cadeira)-/.test(item.id) ? .026 : 0
   assert(Math.abs(min.y - box.floor - rugSupport) < epsilon, sample.name + ': móvel flutua ou atravessa apoio')
  }
  if (item.support === 'ceiling') assert(Math.abs(max.y - box.ceiling) < epsilon, sample.name + ': lustre desligado do teto')
  if (item.support === 'wall') assert(Math.abs(max.x - (box.maxX - .175)) < epsilon, sample.name + ': quadro flutua diante da parede')
 }
 // Rays cover a body-width entrance corridor and the existing view of the field.
 const ray = new THREE.Raycaster()
 for (const x of [-2.5, 0, 2.5]) for (const h of [.1, .8, 1.7, 2.2]) {
  ray.set(new THREE.Vector3(x, box.floor + h, box.maxZ), new THREE.Vector3(0, 0, -1)); ray.far = box.maxZ - box.minZ
  assert.equal(ray.intersectObjects(meshes, false).length, 0, sample.name + ': porta/caminho bloqueado')
 }
 const camera = new THREE.Vector3(...box.camera), direction = new THREE.Vector3(...box.target).sub(camera)
 ray.set(camera, direction.clone().normalize()); ray.far = direction.length()
 assert.equal(ray.intersectObjects(meshes, false).length, 0, sample.name + ': vista do estádio bloqueada')
 // Every desk leg and chair foot has a physical sole, not merely a matching AABB.
 const basicDesk = sample.ids.includes('mesa-simples'), premiumDesk = sample.ids.includes('mesa-madeira')
 const rugY = sample.ids.includes('tapete') ? .026 : 0
 const contactPoints = []
 if (basicDesk) for (const dx of [-.72, .72]) for (const dz of [-.31, .31]) contactPoints.push(['mesa-simples', -6.4 + dx, 70.6 + dz])
 if (premiumDesk) for (const dx of [-.89, .89]) contactPoints.push(['mesa-madeira', -6.4 + dx, 70.6])
 if (sample.ids.includes('cadeira-simples')) for (const dx of [-.19, .19]) for (const dz of [-.18, .18]) contactPoints.push(['cadeira-simples', -6.4 + dx, 71.7 + dz])
 if (sample.ids.includes('cadeira-couro')) for (let i = 0; i < 5; i++) contactPoints.push(['cadeira-couro', -6.4 + Math.sin(i * Math.PI * 2 / 5) * .28, 71.7 + Math.cos(i * Math.PI * 2 / 5) * .28])
 for (const [id, x, z] of contactPoints) {
  const itemMeshes = room.root.getObjectByName(id).children
  ray.set(new THREE.Vector3(x, box.floor + rugY - .02, z), new THREE.Vector3(0, 1, 0)); ray.far = .04
  const hit = ray.intersectObjects(itemMeshes, false)[0]
  assert(hit && Math.abs(hit.point.y - box.floor - rugY) < epsilon, sample.name + ': pé sem contato físico no apoio')
 }
 const disposedGeometry = new Set(), disposedMaterial = new Set()
 geometries.forEach(g => g.addEventListener('dispose', () => disposedGeometry.add(g)))
 materials.forEach(m => m.addEventListener('dispose', () => disposedMaterial.add(m)))
 room.dispose(); room.dispose()
 assert.equal(disposedGeometry.size, geometries.size); assert.equal(disposedMaterial.size, materials.size)
 assert.deepEqual(scene.children, [unrelated]); assert.equal(room.update(wallet(premium)), false)
 report.push({ name: sample.name, items: info.renderedFurniture.length, meshes: info.meshes, triangles: info.triangles })
}

// Use actual buy/sell/replacement transactions; the renderer may never adjust them.
const scene = new THREE.Scene(), room = criarMobiliaComplexo(scene, complexoDoEstadio(full))
let funds = { cash: 1000, revision: 0, owned: [] }
for (const pedido of [
 { kind: 'buy', id: 'mesa-simples' }, { kind: 'buy', id: 'cadeira-simples' },
 { kind: 'buy', id: 'mesa-madeira', replaceId: 'mesa-simples' },
 { kind: 'sell', id: 'cadeira-simples' },
]) {
 const quote = orcarPresidencia(funds, pedido); assert(quote.ok)
 const result = confirmarPresidencia(funds, quote.value, true); assert(result.ok); funds = result.value
 const snapshot = JSON.stringify(funds); assert(carteiraPresidenciaValida(funds)); assert.equal(room.update(funds), true)
 assert.deepEqual(room.inspect().renderedFurniture, funds.owned.map(b => b.id).sort())
 assert.equal(JSON.stringify(funds), snapshot)
}
const oldMeshes = [...room.root.children], rebuilds = room.inspect().rebuilds
assert.equal(room.update({ ...funds, cash: funds.cash + 7, revision: funds.revision + 1 }), false)
assert.equal(room.inspect().rebuilds, rebuilds); assert.deepEqual(room.root.children, oldMeshes)
const inspection = room.inspect(); inspection.placements[0].bounds.min.x = 10000; inspection.renderedFurniture.push('planta')
assert(room.inspect().placements[0].bounds.min.x < 0); assert(!room.inspect().renderedFurniture.includes('planta'))
const removed = new Set(), oldGeometry = []
room.root.traverse(object => { if (object instanceof THREE.Mesh) { oldGeometry.push(object.geometry); object.geometry.addEventListener('dispose', () => removed.add(object.geometry)) } })
assert.equal(room.update({ ...funds, owned: [{ id: 'mesa-inventada', paid: 0 }] }), true)
assert.equal(room.inspect().walletStatus, 'invalid'); assert.equal(room.inspect().meshes, 0); assert.equal(removed.size, oldGeometry.length)
room.dispose(); assert.equal(scene.children.length, 0)
console.log('PASS mobília: 13 compras reais, carteira ausente/inválida sem bens, camarote obrigatório, substituição/revenda preservadas, apoio físico, porta/janela/corredor livres, orçamento e descarte.', report)
