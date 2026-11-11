// 📱 11/11 — Lucas Barreto 30: "jogo até a 114, salvo, e quando entro volta pro 113". Aparelho cheio deixava a cópia velha da
// partida em andamento, que o jogo abre direto ao ligar. Rodar: npx tsx scripts/testa-save-velho.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { carreiraLocalNaFrente } from '../src/escalacao/store'
const car = (seasonNo: number, round: number, seed = 7) => JSON.stringify({ seed, seasonNo, round })
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 113, round: 30 }, car(114, 0)), true, 'carreira na 114 > partida guardada na 113')
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 114, round: 2 }, car(114, 5)), true, 'mesma temporada, mais rodadas')
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 114, round: 5 }, car(114, 5)), false, 'igual: abre normal')
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 115, round: 0 }, car(114, 30)), false, 'a guardada está na frente: abre ela')
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 113, round: 0 }, car(200, 0, 9)), false, 'outra carreira: não mexe')
assert.equal(carreiraLocalNaFrente({ seed: 7, seasonNo: 113, round: 0 }, null), false, 'sem carreira no aparelho: abre normal')
const src = readFileSync(new URL('../src/escalacao/store.tsx', import.meta.url), 'utf8')
assert.ok(/catch \{[\s\S]{0,700}localStorage\.removeItem\(SOLO_RESUME_KEY\)/.test(src), 'gravação que falha tira a cópia velha')
console.log('✅ aparelho cheio não abre mais carreira velha ao ligar')
process.exit(0)
