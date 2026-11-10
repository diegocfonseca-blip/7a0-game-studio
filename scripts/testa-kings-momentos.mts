// 🎬 10/11 — Diego: *"cada situação diferenciada como 1x1, 2x2, gol em dobro e outros deve ter uma jogada pra cada momento"*.
// Confere que o campinho da Kings desenha pelo menos uma jogada (gol ou chance) dentro de CADA momento especial.
// Rodar: npx tsx scripts/testa-kings-momentos.mts
import assert from 'node:assert/strict'
import { chancesKings2D } from '../src/escalacao/kings-liga'
import { kings2DDe, PLACAR_DOBRO_INI, PLACAR_DADO, PLACAR_MB } from '../src/escalacao/kings-liga'
let falhas = 0, jogos = 0
for (let s = 1; s <= 300; s++) {
  const r = (n: number) => ((s * 2654435761 + n * 40503) >>> 0) % 1000 / 1000
  const empate = r(1) < 0.3
  const info = { dado: (1 + Math.floor(r(2) * 3)) as 1 | 2 | 3, cartas: [{ teamId: 0, min: 10 + Math.floor(r(3) * 20), sorteada: 'gol_dobro', vale: 'gol_dobro' }, { teamId: 1, min: 50 + Math.floor(r(4) * 20), sorteada: 'suspensao', vale: 'suspensao', suspenso: 'X' }],
    mb: empate ? { empate: true, fim: PLACAR_MB } : { empate: false, alvo: 5, fim: Math.min(93, PLACAR_MB + 3 + Math.floor(r(5) * 10)) } } as never
  const k = kings2DDe(info)!
  const gols = Array.from({ length: Math.floor(r(6) * 7) }, (_, i) => ({ min: Math.floor(r(10 + i) * 90), home: r(20 + i) < 0.5 }))
  const ch = chancesKings2D(s, gols, [], k.momentos)
  jogos++
  for (const [a, b] of k.momentos!) {
    if (b <= a) continue
    const tem = ch.some(c => c.min >= a && c.min < b) || gols.some(g => g.min >= a && g.min < b)
    if (!tem) { falhas++; if (falhas < 5) console.log('sem jogada', s, a, b) }
  }
  assert.ok(k.momentos!.some(([a]) => a === PLACAR_DOBRO_INI) && k.momentos!.some(([a]) => a === PLACAR_DADO), 'gol em dobro e dado entram')
}
assert.equal(falhas, 0, 'todo momento especial tem jogada')
console.log(`✅ Kings 2D: ${jogos} jogos, cada momento (1×1…6×6, ✖️2, dado, cartas, match ball) com pelo menos uma jogada`)
process.exit(0)
