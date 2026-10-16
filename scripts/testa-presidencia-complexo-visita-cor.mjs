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
try {
 const { criarVisitaComplexo } = await import('../src/escalacao/presidencia-complexo-visita.ts')
 const journey = (key, phase = 'playing') => ({ key, phase, variantSeed: 9 })
 const options = { id: 'teste-cor', side: 'home', color: '#123456', journey: journey('quarta'),
  seat: { id: 'assento', tier: 'lower', sector: 'cadeiras', row: 0, column: 1, position: { x: 0, y: .16, z: 5 }, heading: Math.PI, seatHeight: .43 },
  inbound: [{ x: 0, y: .16, z: 0 }, { x: 0, y: .16, z: 4.6 }], staySeconds: 9 }
 const original = structuredClone(options), scene = new THREE.Scene(), visitor = criarVisitaComplexo(scene, options)
 assert.deepEqual(visitor.inspect().problems, [])
 const rigId = visitor.inspect().rigId, materials = new Set(), geometry = new Set()
 visitor.root.traverse(object => { if (object instanceof THREE.Mesh) { materials.add(object.material); geometry.add(object.geometry) } })
 const shirt = [...materials].find(material => material.color.getHexString() === '123456')
 assert(shirt)
 visitor.update(visitor.period + 30)
 assert(visitor.inspect().pose.seated > .999, 'personagem chegou à pose sentada')
 const atSeat = structuredClone(visitor.inspect().pose), seconds = visitor.inspect().seconds
 visitor.configureJourney(journey('domingo', 'arrival')); visitor.configureColor('#abcdef')
 assert.equal(visitor.inspect().rigId, rigId)
 assert.equal(visitor.inspect().color, '#123456')
 assert.equal(shirt.color.getHexString(), '123456')
 assert.deepEqual(visitor.inspect().pendingColor, { key: 'domingo', color: '#abcdef' })
 assert.deepEqual(visitor.inspect().pose, atSeat, 'troca de uniforme e jornada não reinicia pose')
 // A newer request replaces the pending uniform without touching the old rig.
 visitor.configureColor('#fedcba')
 assert.deepEqual(visitor.inspect().pendingColor, { key: 'domingo', color: '#fedcba' })
 const leaked = visitor.inspect().pendingColor; leaked.color = '#000000'
 assert.equal(visitor.inspect().pendingColor.color, '#fedcba', 'inspect não expõe estado mutável')
 let changedAt
 for (let time = seconds + .05; time < seconds + 2 * visitor.period; time += .05) {
  visitor.update(time)
  const snapshot = visitor.inspect()
  assert.equal(snapshot.rigId, rigId)
  if (snapshot.journey.key === 'quarta') assert.equal(shirt.color.getHexString(), '123456')
  else {
   assert.equal(snapshot.journey.key, 'domingo')
   assert.equal(snapshot.color, '#fedcba'); assert.equal(shirt.color.getHexString(), 'fedcba')
   assert.equal(snapshot.pendingColor, undefined)
   assert(snapshot.journey.localSeconds < .051, 'uniforme muda na origem, antes da nova caminhada')
   changedAt = time; break
  }
 }
 assert(changedAt)
 visitor.update(changedAt + visitor.period)
 const currentPose = structuredClone(visitor.inspect().pose)
 visitor.configureColor('#112233')
 assert.equal(shirt.color.getHexString(), '112233', 'correção no mesmo jogo só altera material')
 assert.deepEqual(visitor.inspect().pose, currentPose)
 assert.equal(visitor.inspect().rigId, rigId)
 visitor.configureColor()
 assert.equal(visitor.inspect().color, '#1B7A3D')
 assert.deepEqual(visitor.inspect().pose, currentPose)
 const nowMaterials = new Set(), nowGeometry = new Set()
 visitor.root.traverse(object => { if (object instanceof THREE.Mesh) { nowMaterials.add(object.material); nowGeometry.add(object.geometry) } })
 assert.deepEqual(nowMaterials, materials); assert.deepEqual(nowGeometry, geometry)
 assert.deepEqual(options, original)
 const disposed = new Map([...materials, ...geometry].map(resource => [resource, 0]))
 for (const resource of disposed.keys()) resource.addEventListener('dispose', () => disposed.set(resource, disposed.get(resource) + 1))
 visitor.dispose(); visitor.dispose(); visitor.configureColor('#000000')
 assert.equal(scene.children.length, 0)
 for (const count of disposed.values()) assert.equal(count, 1)
 const legacy = criarVisitaComplexo(scene, { ...options, journey: undefined })
 legacy.update(3)
 const legacyPose = legacy.inspect().pose
 legacy.configureColor('#c0ffee')
 assert.equal(legacy.inspect().color, '#c0ffee')
 assert.equal(legacy.inspect().pendingColor, undefined)
 assert.deepEqual(legacy.inspect().pose, legacyPose)
 legacy.dispose()
 const later = criarVisitaComplexo(scene, { ...options, startSeconds: 12000 })
 const origin = structuredClone(later.inspect().pose)
 assert.equal(later.inspect().seconds,12000)
 assert.equal(later.inspect().journey.localSeconds,0,'uma visita criada depois começa na origem, não recupera o tempo anterior da cena')
 later.update(12000);assert.deepEqual(later.inspect().pose,origin)
 later.update(12000.1);assert(later.inspect().journey.localSeconds<=.101)
 later.finishAtOrigin();later.update(12000+later.period+20);assert(later.inspect().journey.completed)
 assert.equal(later.inspect().color,options.color)
 later.dispose()
 console.log(JSON.stringify({ status: 'PASS', sameRig: true, sameResources: true, uniformChangesAtOrigin: true, sameFixtureCorrectionKeepsPose: true, legacyDirectColor: true }))
} finally { hooks.deregister() }
