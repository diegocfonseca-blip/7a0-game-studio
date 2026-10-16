import assert from 'node:assert/strict'
import * as THREE from 'three'
import { criarAtoresBairro } from '../src/escalacao/presidencia-bairro-atores-3d.ts'
import { quadroBairro, GEOMETRIA_BAIRRO as world } from '../src/escalacao/presidencia-bairro-model.ts'

// Geometria e animação reais, executadas com o suporte TS do Node; sem navegador,
// autenticação, WebGL ou alteração do relógio da partida.
const scene = new THREE.Scene()
const unrelated = new THREE.Group()
scene.add(unrelated)
const actors = criarAtoresBairro(scene)
const bounds = new THREE.Box3()
const close = (actual, expected, epsilon = 1e-8) =>
  assert(Math.abs(actual - expected) <= epsilon, `${actual} ≠ ${expected} (tolerância ${epsilon})`)
assert.equal(actors.feet.length, 2)
assert.equal(actors.wheels.length, 4)

const geometries = new Set()
const materials = new Set()
let meshes = 0
let triangles = 0
for (const root of [actors.pedestre, actors.carro]) root.traverse(object => {
  assert(!(object instanceof THREE.Sprite), 'atores devem ser volumes que participam da cena')
  if (!(object instanceof THREE.Mesh)) return
  meshes++
  triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3
  geometries.add(object.geometry)
  assert(object.castShadow && object.receiveShadow, 'atores compartilham a iluminação do chão')
  for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
    materials.add(material)
    assert(material.depthTest, 'a arquitetura deve ocultar os atores pela profundidade real')
    assert(material.depthWrite, 'atores devem escrever sua profundidade')
  }
})
assert(meshes > 0)

actors.update(quadroBairro(0))
scene.updateMatrixWorld(true)
bounds.setFromObject(actors.pedestre, true)
const height = bounds.max.y - bounds.min.y
close(height, world.pedestre.altura, .01)
close(bounds.min.y, world.calcada.y)

let previous
let supportSamples = 0
let maxSupportDrift = 0
let minimumSole = Infinity
let maximumSupportedSole = -Infinity
let maximumWheelGap = 0
const phases = new Set()
const samples = 15_600
for (let i = 0; i < samples; i++) {
  const frame = quadroBairro(i / 120)
  const p = frame.pedestre
  actors.update(frame)
  scene.updateMatrixWorld(true)
  phases.add(p.phase)
  const feet = actors.feet.map(foot => {
    // precise=true usa vértices reais. Rodar a caixa aproximada do pneu produz
    // um falso ponto abaixo do asfalto, mesmo com a roda apoiada corretamente.
    bounds.setFromObject(foot, true)
    return { y: bounds.min.y - p.y, center: bounds.getCenter(new THREE.Vector3()) }
  })
  const support = Math.min(...feet.map(foot => foot.y))
  minimumSole = Math.min(minimumSole, support)
  maximumSupportedSole = Math.max(maximumSupportedSole, support)
  close(support, 0)
  for (const foot of feet) assert(foot.y >= -1e-8, `sola atravessou o piso em ${frame.seconds}s`)
  for (const wheel of actors.wheels) {
    bounds.setFromObject(wheel, true)
    const gap = bounds.min.y - frame.carro.y
    assert(gap >= -1e-8, `pneu atravessou o asfalto em ${frame.seconds}s`)
    // A aproximação circular de24lados tem erro máximo geométrico de2,74mm.
    assert(gap < .003, `pneu flutua em ${frame.seconds}s: ${gap}m`)
    maximumWheelGap = Math.max(maximumWheelGap, gap)
  }

  // O pé de apoio deve ficar no mesmo lugar do mundo enquanto o corpo avança.
  // Arranque, desaceleração e giros usam transições de pose e são checados acima
  // pelo contato; aqui medimos o trajeto reto em velocidade constante.
  if (previous && frame.seconds > 2 && p.speed === world.pedestre.velocidade &&
    previous.speed === world.pedestre.velocidade && Math.abs(p.heading - previous.heading) < 1e-8) {
    feet.forEach((foot, index) => {
      if (Math.abs(foot.y) > 1e-8 || Math.abs(previous.feet[index].y) > 1e-8) return
      maxSupportDrift = Math.max(maxSupportDrift, foot.center.distanceTo(previous.feet[index].center))
      supportSamples++
    })
  }
  previous = { feet, speed: p.speed, heading: p.heading }
}
assert(supportSamples > 5_000, 'amostra insuficiente da fase de apoio')
assert(maxSupportDrift < .0001, `pé de apoio desliza: ${maxSupportDrift}m/quadro`)
assert.deepEqual([...phases].sort(), ['entering', 'inside', 'leaving', 'waiting', 'walking'])

// Pausar não deixa as pernas nem as rodas continuarem sozinhas.
const paused = quadroBairro((samples - 1) / 120)
const snapshot = () => {
  scene.updateMatrixWorld(true)
  const values = []
  for (const root of [actors.pedestre, actors.carro]) root.traverse(object => values.push(...object.matrixWorld.elements))
  return values
}
const beforePause = snapshot()
for (let i = 0; i < 20; i++) actors.update(paused)
assert.deepEqual(snapshot(), beforePause)

// Cada recurso renderizado precisa receber dispose exatamente uma vez, sem
// remover objetos de outros donos nem voltar a animar depois da limpeza.
const disposed = { geometries: new Map(), materials: new Map() }
for (const [key, resources] of Object.entries({ geometries, materials })) {
  for (const resource of resources) resource.addEventListener('dispose', () =>
    disposed[key].set(resource, (disposed[key].get(resource) ?? 0) + 1))
}
const lastPedestrian = actors.pedestre.position.clone()
const lastCar = actors.carro.position.clone()
actors.dispose()
assert.equal(actors.pedestre.parent, null)
assert.equal(actors.carro.parent, null)
assert.deepEqual(scene.children, [unrelated])
actors.dispose()
actors.update(quadroBairro(0))
assert(actors.pedestre.position.equals(lastPedestrian))
assert(actors.carro.position.equals(lastCar))
for (const [key, resources] of Object.entries({ geometries, materials })) {
  assert.equal(disposed[key].size, resources.size, `recurso ${key} ficou sem dispose`)
  for (const count of disposed[key].values()) assert.equal(count, 1, `dispose duplicado de ${key}`)
}

console.log(`PASS atores bairro3D: ${samples.toLocaleString('pt-BR')} quadros/120Hz; altura ${height.toFixed(3)}m; apoio ${minimumSole}…${maximumSupportedSole}m; deslizamento máximo ${(maxSupportDrift * 1000).toFixed(3)}mm/quadro em ${supportSamples} apoios; folga dos pneus ≤${(maximumWheelGap * 1000).toFixed(3)}mm; pausa e dispose completos; ${meshes} malhas/${triangles} triângulos.`)
