// 🅰️ 07/11 — o campinho da carreira (liga e Copa) não pode sumir só porque o save não guarda a assistência de jogador de
// mentira (regra de 19/09). A conferência do replay compara quem fez o gol e o minuto; placar errado continua reprovando.
// Rodar: npm run replay-assist
import assert from 'node:assert/strict'
import { entradaM2, resultadoM2 } from '../src/escalacao/motor2/carreira'
import { prepararReplayOficial } from '../src/escalacao/presidencia-replay-oficial'
const pos = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
const time = (p: string, fake: boolean) => pos.map((q, i) => ({ name: `${p}${i}`, pos: q, lo: fake ? 50 : 78, hi: fake ? 62 : 88, club: fake ? 'Várzea' : 'Clube', year: 2000, fame: fake ? 1 : 3 }))
let testados = 0, comAssist = 0
for (let seed = 1; seed < 400 && comAssist < 5; seed++) {
  const e = entradaM2({ seed, casa: time('C', false) as never, fora: time('F', true) as never, fCasa: '4-3-3', fFora: '4-3-3', tatica: [0, 0], bots: [false, true] })
  const r = resultadoM2(e)
  if (!r.gols.some(g => g.assist)) continue
  comAssist++; testados++
  const salvo = r.gols.map(g => ({ home: g.home, name: g.contra ? `${g.nome} (contra)` : g.nome, min: g.min })) // sem assistência (como o save guarda a de jogador de mentira)
  assert.equal(prepararReplayOficial(e, salvo).valid, true, `seed ${seed}: sem a assistência o campinho ainda vale`)
  const errado = salvo.map((g, i) => i === 0 ? { ...g, min: g.min === 93 ? 1 : g.min + 1 } : g)
  assert.equal(prepararReplayOficial(e, errado).valid, false, `seed ${seed}: minuto do gol diferente continua reprovando`)
}
assert.ok(testados >= 3, 'achou jogos com assistência pra testar')
console.log(`✅ replay oficial: ${testados} jogos — vale sem a assistência de jogador de mentira; gol fora do minuto reprova`)
process.exit(0)
