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
    return url.startsWith(sourceRoot) && result.source != null
      ? { ...result, source: Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") } : result
  },
})
try {
  const { criarSaidaTorcidaComplexo } = await import('../src/escalacao/presidencia-complexo-torcida-saida.ts')
  const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')
  const state = complexoDoEstadio({ inv: Object.fromEntries(STADIUM_SECTORS.map(sector => [sector.k, sector.cost])), ext: [] })
  const scene = new THREE.Scene(), architecture = criarArquiteturaComplexo(scene, state)
  const accesses = architecture.seatAccess, excludedSeatIds = accesses.filter(access => access.seat.tier === 'lower' && access.seat.row === 0).map(access => access.seatId)
  const first = { key: 'jogo-1', variantSeed: 1, phase: 'playing' }, next = { key: 'jogo-2', variantSeed: 2, phase: 'playing' }
  const base = { state, accesses, excludedSeatIds, budget: { home: 3, away: 3 }, journey: first, homeColor: '#1B7A3D', awayColor: '#C2452F' }
  const cohort = criarSaidaTorcidaComplexo(scene, base)
  cohort.update(0)
  const before = cohort.inspect(), ids = before.actors.map(actor => actor.rigId), seats = cohort.reserveSeatIds()
  const request = { journey: next, budget: { home: 0, away: 3 }, homeColor: '#2154A5', awayColor: '#F4ECD6' }
  const input = structuredClone(request)
  cohort.configure(request)
  assert.deepEqual(request, input, 'configure não altera agenda nem orçamento recebido')
  assert.deepEqual(cohort.inspect().actors.map(actor => actor.pose), before.actors.map(actor => actor.pose), 'quota nova não substitui nem move corpos no mesmo horário')
  assert.deepEqual(cohort.inspect().returnPendingSides, { home: false, away: true }, 'lado sem quota não reserva desembarque para retorno')
  cohort.update(.1)
  let snapshot = cohort.inspect()
  for (const side of ['home', 'away']) {
    const members = snapshot.actors.filter(actor => actor.side === side)
    assert.equal(members.filter(actor => actor.state === 'leaving').length, 1, 'cada lado sai fisicamente um de cada vez')
    assert(members.every(actor => actor.color === (side === 'home' ? '#1B7A3D' : '#C2452F')), 'uniforme antigo permanece durante a saída')
  }
  snapshot.actors.forEach((actor, index) => assert(Math.hypot(actor.pose.hip.x - before.actors[index].pose.hip.x, actor.pose.hip.y - before.actors[index].pose.hip.y, actor.pose.hip.z - before.actors[index].pose.hip.z) < .1, 'primeiro passo contínuo'))
  cohort.update(5000)
  snapshot = cohort.inspect()
  assert.deepEqual(snapshot.actors.map(actor => actor.rigId), ids)
  assert.deepEqual(cohort.reserveSeatIds(), seats, 'reserva não gera reposição estática ao sair')
  const home = snapshot.actors.filter(actor => actor.side === 'home'), away = snapshot.actors.filter(actor => actor.side === 'away')
  assert(home.every(actor => actor.state === 'outside' && !actor.eligible && actor.pose.visible && actor.journeyKey === first.key && actor.color === '#1B7A3D' && actor.departures === 1 && actor.arrivals === 0), 'mandantes sem quota ficam visíveis fora com identidade/uniforme antigos')
  assert(away.every(actor => actor.state === 'seated' && actor.eligible && actor.journeyKey === next.key && actor.color === '#F4ECD6' && actor.arrivals === 1), 'visitantes autorizados voltam ao assento')
  assert.deepEqual(snapshot.returnPendingSides, { home: false, away: false })

  const outsidePoses = home.map(actor => actor.pose)
  cohort.configure({ ...request, budget: { home: 3, away: 3 } })
  assert.deepEqual(cohort.inspect().actors.filter(actor => actor.side === 'home').map(actor => actor.pose), outsidePoses)
  assert.equal(cohort.inspect().returnPendingSides.home, true, 'quota restaurada solicita retorno físico')
  cohort.update(5000.1)
  assert.equal(cohort.inspect().actors.filter(actor => actor.side === 'home' && actor.state === 'entering').length, 1)
  cohort.update(10000)
  assert.equal(cohort.inspect().seated, 6)
  assert(cohort.inspect().actors.filter(actor => actor.side === 'home').every(actor => actor.arrivals === 1 && actor.journeyKey === next.key && actor.color === '#2154A5'))

  // A smaller quota in the same fixture preserves an admitted seat and drains
  // only the excess. A later return reuses the exact existing body.
  cohort.configure({ ...request, budget: { home: 1, away: 3 } })
  cohort.update(15000)
  snapshot = cohort.inspect()
  assert.equal(snapshot.actors.filter(actor => actor.side === 'home' && actor.state === 'seated').length, 1)
  assert.equal(snapshot.actors.filter(actor => actor.side === 'home' && actor.state === 'outside').length, 2)
  assert.deepEqual(snapshot.actors.map(actor => actor.rigId), ids)
  cohort.configure({ ...request, budget: { home: 3, away: 3 } })
  cohort.update(20000)
  assert.equal(cohort.inspect().seated, 6, 'quota volta na mesma jornada: retorno andando, não recriação')
  assert.deepEqual(cohort.inspect().actors.map(actor => actor.rigId), ids)
  cohort.configure({ ...request, budget: { home: 999, away: 999 } })
  assert(cohort.inspect().actors.every(actor => actor.eligible), 'quota acima do tamanho do grupo mantém todos elegíveis')
  assert.equal(cohort.inspect().total, 6, 'quota maior nunca cria corpos além do grupo existente')
  cohort.dispose()

  // All three people are already outside when the next game admits only one.
  // The returning body must be the nearest to the stadium, otherwise it walks
  // through the ineligible people waiting along the same narrow sidewalk.
  const partial = criarSaidaTorcidaComplexo(scene, { ...base, budget: { home: 3, away: 0 } })
  partial.update(0)
  partial.configure({ journey: { ...first, phase: 'departure' }, budget: { home: 3, away: 0 } })
  partial.update(5000)
  assert.equal(partial.inspect().outside, 3)
  const partialIds = partial.inspect().actors.map(actor => actor.rigId)
  partial.configure({ journey: next, budget: { home: 1, away: 0 } })
  let partialTime = 5000, partialSnapshot = partial.inspect(), clearanceProbes = 0, minimumClearance = Infinity
  for (let frame = 0; frame < 10000 && partialSnapshot.seated < 1; frame++) {
    partialTime += .1; partial.update(partialTime); partialSnapshot = partial.inspect()
    assert.deepEqual(partialSnapshot.actors.map(actor => actor.rigId), partialIds)
    for (let a = 0; a < partialSnapshot.actors.length; a++) for (let b = a + 1; b < partialSnapshot.actors.length; b++) {
      const firstActor = partialSnapshot.actors[a], secondActor = partialSnapshot.actors[b]
      const separation = Math.hypot(firstActor.pose.hip.x - secondActor.pose.hip.x, firstActor.pose.hip.y - secondActor.pose.hip.y, firstActor.pose.hip.z - secondActor.pose.hip.z)
      minimumClearance = Math.min(minimumClearance, separation); clearanceProbes++
      assert(separation >= .58, `quota 3→1: ${firstActor.id}/${firstActor.state} atravessa ${secondActor.id}/${secondActor.state}: ${separation.toFixed(3)} m após ${(partialTime - 5000).toFixed(1)} s`)
    }
  }
  assert.equal(partialSnapshot.seated, 1)
  assert.equal(partialSnapshot.outside, 2)
  partial.dispose()

  const zero = criarSaidaTorcidaComplexo(scene, { ...base, budget: { home: 0, away: 0 } })
  zero.update(0); zero.configure({ ...request, budget: { home: 3, away: 3 } }); zero.update(10000)
  assert.equal(zero.inspect().total, 0, 'nenhum corpo nasce na cadeira quando a cena começou sem quota')
  zero.dispose(); architecture.dispose(); assert.equal(scene.children.length, 0)
  console.log(JSON.stringify({ status: 'PASS', scenarios: ['new-fixture-home-0-away-3', 'same-fixture-restore', 'same-fixture-partial-reduction', 'same-fixture-second-restore', 'quota-above-existing-group', 'outside-three-to-one-clearance', 'initial-zero-no-spawn'], retainedBodies: ids.length, clearanceProbes, minimumClearance, geometryChanged: false }))
} finally { hooks.deregister() }
