// 🧪 05/11: regras da turma no draft + prêmio por colocação da Liga Draft (`npx tsx scripts/testa-liga-draft-regras.mts`)
import assert from 'node:assert/strict'
import { premioDaLiga, premiosPadraoDraft, cartaPermitidaDraft, todasAsCartas } from '../src/escalacao/liga-draft.ts'

// 💰 padrão pelo tamanho
assert.deepEqual(premiosPadraoDraft(10), [40, 32, 26, 22, 18, 16, 14, 12, 10, 8])
assert.equal(premiosPadraoDraft(20).length, 20)
assert.equal(premioDaLiga(0, 20), 40); assert.equal(premioDaLiga(19, 20), 8); assert.equal(premioDaLiga(9, 10), 8)
assert.equal(premioDaLiga(25, 20), 8, 'fora da tabela = o último')
// ✏️ editado pelo criador vale; buraco/valor ruim cai no padrão
assert.equal(premioDaLiga(0, 20, [100, 50]), 100); assert.equal(premioDaLiga(2, 20, [100, 50]), 30)
assert.equal(premioDaLiga(0, 10, [-5]), 40, 'negativo não vale')
assert.equal(premioDaLiga(0, 10, [5000]), 999, 'teto 999')
console.log('✅ prêmio por colocação (10/20 + editado)')

// 📜 regras
const todas = todasAsCartas('todos'), br = new Set(todasAsCartas('br').map(c => `${c.name}|${c.club}|${c.year}`))
const lenda = todas.find(c => c.fame === 5)!, craque = todas.find(c => c.fame === 4)!, bom = todas.find(c => c.fame <= 2)!
assert.ok(cartaPermitidaDraft(lenda, undefined) && cartaPermitidaDraft(lenda, {}), 'sem regra, tudo pode')
assert.equal(cartaPermitidaDraft(lenda, { semLendas: true }), false)
assert.equal(cartaPermitidaDraft(craque, { semLendas: true }), true)
assert.equal(cartaPermitidaDraft(craque, { semCraques: true }), false)
assert.equal(cartaPermitidaDraft(lenda, { semCraques: true }), false, 'craque pra cima inclui lenda')
assert.equal(cartaPermitidaDraft(bom, { semCraques: true }), true)
const fora = todas.find(c => !br.has(`${c.name}|${c.club}|${c.year}`))!, dentro = todas.find(c => br.has(`${c.name}|${c.club}|${c.year}`))!
assert.equal(cartaPermitidaDraft(fora, { soBrasil: true }), false); assert.equal(cartaPermitidaDraft(dentro, { soBrasil: true }), true)
console.log('✅ regras da turma (sem lendas · sem craque+ · só Brasil)')
