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
const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const { complexoDoEstadio, PLANTA_COMPLEXO } = await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
const full = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost]))
const samples = [
 { name: 'vazio-interior', save: { inv: {}, ext: [] }, interior: true },
 { name: 'primeiro-anel-interior', save: { inv: { ...full, camarote: 0 }, ext: [] }, interior: true },
 ...[.01, .11, .5, .99, 1].map(progress => ({ name: 'camarote-' + progress, save: { inv: { ...full, camarote: full.camarote * progress }, ext: [] } })),
 ...[false, true].map(roofClosed => ({ name: 'cobertura-' + roofClosed, save: { inv: full, ext: STADIUM_EXTRAS.map(s => s.k), roofClosed } })),
]
const b = PLANTA_COMPLEXO.presidentBox
let trophyRays = 0, interiorRays = 0, exteriorRays = 0
for (const { name, save, interior = false } of samples) {
 const state = complexoDoEstadio(save), scene = new THREE.Scene()
 const architecture = criarArquiteturaComplexo(scene, state, { interior })
 scene.updateMatrixWorld(true)
 assert(architecture.counts.presidentBox, name + ': camarote ausente')
 const meshes = []
 architecture.root.traverse(node => { if (node instanceof THREE.Mesh && !(node instanceof THREE.InstancedMesh)) meshes.push(node) })
 const opaque = meshes.filter(mesh => !mesh.material.transparent)
 const ray = new THREE.Raycaster()
 const free = (from, to, label) => {
  const direction = to.clone().sub(from)
  ray.set(from, direction.clone().normalize()); ray.near = .001; ray.far = direction.length() - .015
  const hit = ray.intersectObjects(opaque, false)[0]
  assert(!hit, `${name}/${label}: ${hit?.object.name} atravessa sala em ${hit?.point.toArray()}`)
 }
 // The exact two purchased shelf layouts. The source is the actual shelf
 // preset; the target is each trophy's front, before the cabinet's own back.
 for (const basic of [true, false]) for (let i = 0; i < 9; i++) {
  const x = -12.5 + (basic ? (i % 3 - 1) * .52 : [-1.20, -.76, -.32, .32, .76, 1.20][i % 6])
  const height = basic ? 1.85 : 2.35
  const y = b.floor + (basic ? [.06, height * .33, height * .66][Math.floor(i / 3)] : [height * .33, height * .66][Math.floor(i / 6)]) + .0325 + .22
  const z = (basic ? 78.19 : 78.14) - .12
  free(new THREE.Vector3(-10.7, 11.4, 73.5), new THREE.Vector3(x, y, z), `estante-${basic ? 'simples' : 'madeira'}-${i}`)
  trophyRays++
 }
 // Interior walking/view lines stop before the room's own rear cladding.
 for (const x of [-19, -14, -7, 0, 7, 14, 19]) for (const height of [.3, 1.1, 1.9, 3.3, 5]) {
  free(new THREE.Vector3(x, b.floor + height, 70), new THREE.Vector3(x, b.floor + height, 78.5), 'volume-interno')
  interiorRays++
 }
 // Keep the curved exterior skin. Removing the whole angular sector would
 // make these rays hit the flat rear office wall instead of the oval facade.
 if (state.upperComplete) for (const x of [-20, -14, -7, 0, 7, 14, 20]) {
  ray.set(new THREE.Vector3(x, 10.5, 90), new THREE.Vector3(0, 0, -1)); ray.far = 15
  const hit = ray.intersectObjects(meshes, false)[0]
  assert(hit && hit.point.z > 79.5, `${name}: perdeu pele exterior oval em x=${x}`)
  exteriorRays++
 }
 assert.equal(architecture.counts.roof, state.roofBuilt && state.upperComplete && state.progress.grama > 0)
 assert.equal(architecture.counts.retractable, state.roofClosed)
 if (!state.lowerComplete) assert.equal(architecture.counts.upperRows, 0, 'vista interior não concede arquibancada')
 architecture.dispose()
 assert.equal(scene.children.length, 0)
}
console.log(`PASS camarote/fachada: ${samples.length} etapas, ${trophyRays} vistas de taças, ${interiorRays} percursos internos, ${exteriorRays} amostras de fachada oval; cobertura e compras preservadas.`)
