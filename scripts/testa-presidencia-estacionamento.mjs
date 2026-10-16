import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'

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

const { estacionamentoDoSave, investirEstacionamento, ESTACIONAMENTO_CUSTO_TOTAL } = await import('../src/escalacao/presidencia-estacionamento.ts')
const { hasExtra, extraUnlocked, stadiumIncome } = await import('../src/escalacao/estadiodata.ts')
const freeze = value => {
 if (value && typeof value === 'object') {
  Object.values(value).forEach(freeze)
  Object.freeze(value)
 }
 return value
}
const saved = freeze({ inv: { grama: 30, geral: 40 }, ext: ['loja', 'legado-desconhecido'], roofClosed: true })
const original = structuredClone(saved)
let stadium = saved, cash = 70
const invoices = [], capacities = []
assert.equal(ESTACIONAMENTO_CUSTO_TOTAL, 70, 'as novas etapas preservam o preço integral existente')
assert.deepEqual(estacionamentoDoSave(), estacionamentoDoSave({ inv: {}, ext: [] }))

for (let stage = 0; stage < 4; stage++) {
 const before = structuredClone(stadium), oldCash = cash
 const request = freeze({ stadium, cash, expectedStage: stage })
 const purchase = investirEstacionamento(request)
 assert(purchase.ok, JSON.stringify(purchase))
 const { parking } = purchase.value
 assert.equal(parking.valid, true)
 assert.equal(parking.legacy, false)
 assert.equal(parking.stage, stage + 1)
 assert.equal(parking.complete, stage === 3)
 assert.equal(parking.lots.length, stage + 1)
 assert.equal(parking.investment, 70 - purchase.value.cash)
 assert.equal(parking.progress, parking.investment / 70)
 assert.equal(purchase.charged, oldCash - purchase.value.cash)
 assert.deepEqual(stadium, before, 'cada transação mantém o save de entrada intacto')
 assert.notStrictEqual(purchase.value.stadium, stadium)
 assert.notStrictEqual(purchase.value.stadium.inv, stadium.inv)
 assert.notStrictEqual(purchase.value.stadium.ext, stadium.ext)
 assert.deepEqual(purchase.value.stadium.inv, original.inv)
 assert.equal(purchase.value.stadium.roofClosed, true)
 assert(purchase.value.stadium.ext.includes('legado-desconhecido'))
 assert.equal(hasExtra(purchase.value.stadium, 'estac'), stage === 3)
 assert.equal(extraUnlocked(purchase.value.stadium, 'estacao'), stage === 3,
  'a compatibilidade antiga só libera a estação após a compra integral')
 assert.equal(stadiumIncome(purchase.value.stadium), stadiumIncome(saved) + (stage === 3 ? 4 : 0),
  'o protótipo não altera a renda global das carreiras antes da integração explícita')
 invoices.push(purchase.charged)
 capacities.push(parking.capacity)
 stadium = purchase.value.stadium
 cash = purchase.value.cash
 const duplicate = investirEstacionamento({ stadium, cash, expectedStage: stage })
 assert.deepEqual(duplicate, { ok: false, error: 'stale-stage' }, 'repetição do mesmo clique não compra a próxima etapa')
}
assert.deepEqual(invoices, [20, 20, 20, 10])
assert.deepEqual(capacities, [9, 16, 46, 79], 'cada etapa informa somente as vagas físicas que construiu')
assert.equal(cash, 0)
assert.equal(stadium.ext.filter(key => key === 'estac').length, 1)
assert.deepEqual(stadium.ext.slice(0, -1), original.ext)
assert.deepEqual(saved, original)
assert.deepEqual(investirEstacionamento({ stadium, cash, expectedStage: 4 }), { ok: false, error: 'completed' })
assert.equal(estacionamentoDoSave(stadium).nextCost, 0)

// Compra antiga é integral, mesmo sem loja ou investimentos nos setores.
for (const legacy of [
 { inv: {}, ext: ['estac'] },
 { inv: { geral: 10 }, ext: ['estac', 'estacao'], roofClosed: false },
 { inv: {}, ext: ['estac'], estacionamentoInvestido: undefined },
]) {
 const before = structuredClone(legacy)
 const status = estacionamentoDoSave(freeze(legacy))
 assert.equal(status.valid, true); assert.equal(status.legacy, true)
 assert.equal(status.stage, 4); assert.equal(status.investment, 70); assert.equal(status.progress, 1)
 assert.equal(status.capacity, 79, 'a compra antiga preserva os quatro lotes completos')
 assert.deepEqual(status.lots, ['sudeste', 'sudoeste', 'leste', 'noroeste'])
 assert.deepEqual(investirEstacionamento({ stadium: legacy, cash: 0, expectedStage: 4 }), { ok: false, error: 'completed' })
 assert.deepEqual(legacy, before, 'ler o save antigo não grava migração nem cobra outra vez')
}

const fails = [
 ...[NaN, Infinity, -1, 1.5, '70', null, undefined, Number.MAX_SAFE_INTEGER + 1].map(cash => [
  { stadium: saved, cash, expectedStage: 0 }, 'invalid-cash',
 ]),
 ...[NaN, Infinity, -1, .5, 1, 4, '0', null, undefined].map(expectedStage => [
  { stadium: saved, cash: 70, expectedStage }, 'stale-stage',
 ]),
 ...[null, false, [], {}, { inv: [], ext: [] }, { inv: {}, ext: null }, { inv: { geral: NaN }, ext: [] },
  { inv: {}, ext: [], roofClosed: 0 },
  ...[NaN, Infinity, -1, 1, 10, 30, 69, 70, 71, .5, '20', null, false].map(estacionamentoInvestido => ({ ...saved, estacionamentoInvestido })),
  ...[0, 20, 40, 60].map(estacionamentoInvestido => ({ ...saved, ext: [...saved.ext, 'estac'], estacionamentoInvestido })),
 ].map(stadium => [{ stadium, cash: 70, expectedStage: 0 }, 'invalid-state']),
 [{ stadium: undefined, cash: 70, expectedStage: 0 }, 'locked'],
 [{ stadium: { inv: {}, ext: [] }, cash: 70, expectedStage: 0 }, 'locked'],
 [{ stadium: saved, cash: 19, expectedStage: 0 }, 'insufficient-funds'],
 [{ stadium: { ...saved, estacionamentoInvestido: 60 }, cash: 9, expectedStage: 3 }, 'insufficient-funds'],
]
for (const [request, error] of fails) {
 const before = structuredClone(request)
 assert.deepEqual(investirEstacionamento(freeze(request)), { ok: false, error }, `recusa atômica: ${error}`)
 assert.deepEqual(request, before, 'falha nunca altera saldo ou construção')
}
assert.deepEqual(investirEstacionamento(undefined), { ok: false, error: 'invalid-state' })
assert.deepEqual(investirEstacionamento(null), { ok: false, error: 'invalid-state' })
assert.equal(investirEstacionamento({ stadium: saved, cash: Number.MAX_SAFE_INTEGER, expectedStage: 0 }).value.cash,
 Number.MAX_SAFE_INTEGER - 20, 'não perde precisão em saldos inteiros válidos')

// A resposta não permite ao chamador alterar os arrays ou setores do save anterior.
const detached = investirEstacionamento({ stadium: saved, cash: 20, expectedStage: 0 })
assert(detached.ok)
detached.value.stadium.inv.geral = 0
detached.value.stadium.ext.push('hotel')
detached.value.parking.lots.length = 0
assert.deepEqual(saved, original)
assert.equal(estacionamentoDoSave(detached.value.stadium).lots.length, 1)

console.log(JSON.stringify({ ok: true, stages: 4, invoices, total: invoices.reduce((a, b) => a + b, 0),
 capacities, atomicRefusals: fails.length, legacyPreserved: true, noProductionEconomyChange: true }))
