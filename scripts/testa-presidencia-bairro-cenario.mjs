import assert from 'node:assert/strict'
import * as THREE from 'three'
import { criarCenarioBairro, PISO_BAIRRO_3D } from '../src/escalacao/presidencia-bairro-cenario-3d.ts'
import { quadroBairro, GEOMETRIA_BAIRRO as world, DURACAO_CICLO_BAIRRO as cycle } from '../src/escalacao/presidencia-bairro-model.ts'

// Só geometria: executa em Node, sem DOM, WebGL, servidor, autenticação ou conta.
const scene = new THREE.Scene()
const unrelated = new THREE.Group()
scene.add(unrelated)
const cenario = criarCenarioBairro(scene)
scene.updateMatrixWorld(true)
assert.equal(cenario.floorY, PISO_BAIRRO_3D)
assert.equal(cenario.floorY, world.calcada.y)
assert(cenario.solids.length > 0, 'cenário precisa fornecer os volumes reais de colisão')

const meshes = []
const geometries = new Set()
const materials = new Set()
const textures = new Set()
let triangles = 0
cenario.root.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return
  meshes.push(object)
  geometries.add(object.geometry)
  triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3
  for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
    materials.add(material)
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    assert.equal(material.depthTest, true, 'oclusão precisa usar a profundidade do cenário')
    if (!material.transparent) assert.equal(material.depthWrite, true, 'arquitetura opaca escreve profundidade')
  }
})
assert(meshes.length > 0, 'cenário não pode ser somente um fundo')

const down = new THREE.Vector3(0, -1, 0)
const ray = new THREE.Raycaster()
let groundSamples = 0
function groundAt(x, z, feet, label) {
  ray.set(new THREE.Vector3(x, feet + .3, z), down)
  ray.near = 0
  ray.far = .35
  const first = ray.intersectObjects(meshes, false)[0]
  assert(first, `falta chão real abaixo de ${label} em (${x}, ${z})`)
  // Pintura da rua e juntas têm até 1 cm, sem degrau que deixe o ator flutuando.
  assert(Math.abs(first.point.y - feet) <= .012, `piso diferente dos pés em ${label}: ${first.point.y} / ${feet}`)
  assert(first.face && first.face.normal.y > .9, `contato de ${label} deve estar na face superior do piso`)
  groundSamples++
}

const radius = Math.max(.28, world.pedestre.raio)
const height = 1.8
function pedestrianClear(p, label) {
  assert.equal(p.y, cenario.floorY, `altura do ator em ${label}`)
  for (const s of cenario.solids) {
    if (s.top <= p.y + 1e-8 || s.base >= p.y + height) continue
    const overlap = p.x + radius > s.minX && p.x - radius < s.maxX &&
      p.z + radius > s.minZ && p.z - radius < s.maxZ
    assert(!overlap, `pedestre colidiu com ${s.id} em ${label}: (${p.x}, ${p.z})`)
  }
  groundAt(p.x, p.z, p.y, label)
}

// Corredor inteiro, a cada 10 cm: pega também trechos entre amostras do relógio.
let corridorSamples = 0
for (let i = 0; i <= 240; i++) {
  pedestrianClear({ x: -24 + i / 10, z: 2, y: cenario.floorY }, `calçada ${i}`)
  corridorSamples++
}
for (let i = 1; i <= 80; i++) {
  pedestrianClear({ x: 0, z: 2 - i / 10, y: cenario.floorY }, `entrada ${i}`)
  corridorSamples++
}
assert.equal(corridorSamples, 321)

const phases = new Set()
let poseSamples = 0
for (let t = 0; t <= cycle * 3; t += .25) {
  const frame = quadroBairro(t)
  pedestrianClear(frame.pedestre, `pose ${t.toFixed(2)}s`)
  phases.add(frame.pedestre.phase)
  poseSamples++
}
assert.deepEqual([...phases].sort(), ['entering', 'inside', 'leaving', 'waiting', 'walking'])

function hitsBetween(start, end) {
  const direction = end.clone().sub(start)
  ray.near = 0
  ray.far = direction.length()
  ray.set(start, direction.normalize())
  return ray.intersectObjects(meshes, false)
}

// A porta é um vão físico, e não um truque de esconder o personagem na fachada.
for (const x of [-.8, 0, .8]) for (const y of [.5, 1.5, 2.4]) {
  const hits = hitsBetween(new THREE.Vector3(x, y, 2), new THREE.Vector3(x, y, -6))
  assert.equal(hits.length, 0, `porta obstruída em x=${x}, y=${y}`)
}
const leftJamb = hitsBetween(new THREE.Vector3(-1.49, 1.5, 2), new THREE.Vector3(-1.49, 1.5, -4))
assert(leftJamb.some(hit => !hit.object.material.transparent), 'ombreira precisa ocultar quem passar atrás')
const rightWindow = hitsBetween(new THREE.Vector3(4.5, 1.5, 2), new THREE.Vector3(4.5, 1.5, -4))
assert(rightWindow.some(hit => hit.object.material.transparent), 'vitrine lateral precisa existir fora do vão')
const roof = hitsBetween(new THREE.Vector3(0, 7, -6), new THREE.Vector3(0, 2.5, -6))
assert(roof.some(hit => !hit.object.material.transparent && hit.point.y > 4), 'interior precisa de laje física')
const backWall = hitsBetween(new THREE.Vector3(0, 1.5, -14), new THREE.Vector3(0, 1.5, -6))
assert(backWall.some(hit => !hit.object.material.transparent), 'fundos precisam ter parede física')

const car = world.carro
function carClear(c, label) {
  const halfLength = car.comprimento / 2
  const halfWidth = car.largura / 2
  const bounds = { minX: c.x - halfLength, maxX: c.x + halfLength, minZ: c.z - halfWidth, maxZ: c.z + halfWidth }
  assert(bounds.minX >= world.rua.xMin && bounds.maxX <= world.rua.xMax, `carro saiu do asfalto em ${label}`)
  assert(bounds.minZ >= world.rua.zMin && bounds.maxZ <= world.rua.zMax, `carro invadiu calçada em ${label}`)
  for (const s of cenario.solids) {
    if (s.top <= c.y + 1e-8 || s.base >= c.y + 1.6) continue
    assert(!(bounds.maxX > s.minX && bounds.minX < s.maxX && bounds.maxZ > s.minZ && bounds.minZ < s.maxZ),
      `carro atravessou ${s.id} em ${label}`)
  }
  // Quatro extremos da caixa, além do centro: não basta o centro ter chão.
  for (const dx of [-halfLength, halfLength]) for (const dz of [-halfWidth, halfWidth])
    groundAt(c.x + dx, c.z + dz, c.y, `${label} extremidade`)
  groundAt(c.x, c.z, c.y, `${label} centro`)
}
assert.equal(car.comprimento, 4.2)
assert.equal(car.largura, 1.8)
for (const x of [-95, 95]) carClear({ x, z: car.faixaZ, y: world.rua.y }, `limite ${x}`)
const carCycle = 2 * car.limite / car.velocidade
for (let t = 0; t < carCycle * 2; t += .5) carClear(quadroBairro(t).carro, `carro ${t}s`)

// A limpeza precisa liberar os recursos e preservar objetos de outros donos.
const disposed = { geometries: new Set(), materials: new Set(), textures: new Set() }
for (const [key, resources] of Object.entries({ geometries, materials, textures })) {
  for (const resource of resources) resource.addEventListener('dispose', () => disposed[key].add(resource))
}
cenario.dispose()
assert.equal(cenario.root.parent, null)
assert.equal(cenario.root.children.length, 0)
assert.deepEqual(scene.children, [unrelated], 'limpeza não pode remover o restante da cena')
for (const [key, resources] of Object.entries({ geometries, materials, textures }))
  assert.equal(disposed[key].size, resources.size, `recursos ${key} ficaram sem dispose`)

console.log(`PASS cenário bairro3D: ${corridorSamples} pontos do corredor + ${poseSamples} poses reais; ${groundSamples} contatos por raycast; porta livre, paredes/laje com oclusão, carro 4,2×1,8 m sobre asfalto até ±95 m; ${meshes.length} malhas/${triangles} triângulos; dispose completo.`)
