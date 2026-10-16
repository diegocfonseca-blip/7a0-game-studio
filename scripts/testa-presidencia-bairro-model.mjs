import assert from 'node:assert/strict'
import { quadroBairro, GEOMETRIA_BAIRRO as world, DURACAO_CICLO_BAIRRO as cycle } from '../src/escalacao/presidencia-bairro-model.ts'

const close = (actual, expected, epsilon = 1e-8) => assert(Math.abs(actual - expected) <= epsilon, `${actual} ≠ ${expected}`)
const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const phases = new Set()
let doorEntries = 0
let doorExits = 0
let wraps = 0
let distance = 0
let prior = quadroBairro(0)
const dt = .01

// Dez minutos a100Hz incluem todas as paradas, giros, entradas e vários ciclos.
for (let i = 1; i <= 60_000; i++) {
  const frame = quadroBairro(i * dt)
  const p = frame.pedestre
  const old = prior.pedestre
  const c = frame.carro
  for (const actor of [p, c]) {
    for (const field of ['x', 'z', 'y', 'heading', 'distance', 'speed']) assert(Number.isFinite(actor[field]), field)
  }
  assert.deepEqual(frame, quadroBairro(i * dt), 'pausa/repetição não altera a pose')
  close(p.y, world.calcada.y)
  close(c.y, world.rua.y)
  close(c.z, world.carro.faixaZ)
  assert(p.speed >= 0 && p.speed <= world.pedestre.velocidade)
  assert(p.distance >= old.distance - 1e-9, 'fase da passada não retrocede nem reinicia')
  const moved = Math.hypot(p.x - old.x, p.z - old.z)
  assert(moved <= world.pedestre.velocidade * dt + 1e-9, `salto do pedestre em ${i * dt}`)
  distance += moved
  close(p.distance, distance, 1e-7)
  assert(angleDiff(p.heading, old.heading) < .05, 'giro contínuo, inclusive na volta do ciclo')
  if (p.speed > 0 && old.speed > 0 && moved > 1e-10) {
    const movementHeading = Math.atan2(p.x - old.x, p.z - old.z)
    assert(angleDiff(movementHeading, p.heading) < 1e-7, 'corpo deve olhar no sentido do deslocamento')
  }
  phases.add(p.phase)
  if (p.phase === 'inside') {
    close(p.x, 0)
    close(p.z, -6)
    close(p.speed, 0)
  }
  if (p.phase === 'waiting') close(p.speed, 0)
  // Calçada e corredor interior formam o espaço caminhável. Não corta a quina.
  assert((Math.abs(p.z - 2) < 1e-8 && p.x >= -24 && p.x <= 0) ||
    (Math.abs(p.x) < 1e-8 && p.z >= -6 && p.z <= 2), 'saiu do caminho seguro')
  if (p.z <= world.loja.zMax + world.pedestre.raio) {
    assert(Math.abs(p.x) + world.pedestre.raio < world.loja.meiaPorta, 'colisão com parede/ombreira')
    assert(p.z - world.pedestre.raio > world.loja.zMin, 'colisão com fundo da loja')
    assert(Math.abs(p.x) + world.pedestre.raio < world.loja.xMax, 'colisão com lateral da loja')
  }
  if (old.z > world.loja.zMax && p.z <= world.loja.zMax) doorEntries++
  if (old.z < world.loja.zMax && p.z >= world.loja.zMax) doorExits++
  const separationZ = c.z - world.carro.largura / 2 - (p.z + world.pedestre.raio)
  assert(separationZ > 0, 'carro e pedestre compartilham volume')
  assert(c.z - world.carro.largura / 2 > world.rua.zMin)
  assert(c.z + world.carro.largura / 2 < world.rua.zMax)
  assert(Math.abs(c.x) <= world.carro.limite)
  const carMoved = c.x - prior.carro.x
  if (carMoved < 0) {
    assert(prior.carro.x > 94.9 && c.x < -94.9, 'reciclagem do carro apareceu no trecho visível')
    wraps++
  } else close(carMoved, world.carro.velocidade * dt, 1e-9)
  close(c.distance - prior.carro.distance, world.carro.velocidade * dt, 1e-9)
  prior = frame
}
assert.deepEqual([...phases].sort(), ['entering', 'inside', 'leaving', 'waiting', 'walking'])
assert(doorEntries >= 8 && doorExits >= 8 && wraps >= 15)

for (const boundary of [0, cycle, cycle * 2, cycle * 100]) {
  const at = quadroBairro(boundary).pedestre
  close(at.x, -24, 1e-7)
  close(at.z, 2)
  close(at.speed, 0, 1e-7)
  close(angleDiff(at.heading, Math.PI / 2), 0, 1e-7)
}
for (const time of [-1, NaN, Infinity, -Infinity, 1e9, Number.MAX_VALUE]) {
  const frame = quadroBairro(time)
  for (const actor of [frame.pedestre, frame.carro]) {
    assert(Object.values(actor).filter(value => typeof value === 'number').every(Number.isFinite))
  }
}
for (const time of [-1, NaN, Infinity, -Infinity]) assert.deepEqual(quadroBairro(time), quadroBairro(0))

// Velocidade informada deve ser a derivada do trajeto (para contato dos pés/rodas).
for (let t = .005; t < cycle; t += .017) {
  const halfStep = .00001
  const before = quadroBairro(t - halfStep).pedestre
  const after = quadroBairro(t + halfStep).pedestre
  const derivative = Math.hypot(after.x - before.x, after.z - before.z) / (2 * halfStep)
  close(quadroBairro(t).pedestre.speed, derivative, .0001)
}
console.log(`PASS bairro3D: 10min/100Hz; ${doorEntries} entradas/${doorExits} saídas pela porta; ${wraps} retornos do carro fora de cena; chão, colisões, velocidade e pausa consistentes.`)
