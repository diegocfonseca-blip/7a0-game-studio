// 📺 trava do CAMPO 2D (20/10): o motor das jogadas tem que entregar EXATAMENTE os gols do jogo (mesmo lado, mesma
// quantidade), no minuto certo (no máx. ~5' de atraso quando dois gols vêm colados), sem travar e igual em todo aparelho.
//   npx tsx scripts/testa-campo2d.mts
import assert from 'node:assert/strict'
import { Jogo2D, eventosDoJogo, SEG_POR_MIN } from '../src/escalacao/campo2d-motor'
import { chancesDoJogo } from '../src/escalacao/chances'

const casa = [
  { name: 'Taffarel', pos: 'GOL', fame: 5 }, { name: 'Cafu', pos: 'LAT', fame: 5 }, { name: 'Lúcio', pos: 'ZAG', fame: 5 }, { name: 'Aldair', pos: 'ZAG', fame: 4 }, { name: 'Roberto Carlos', pos: 'LAT', fame: 5 },
  { name: 'Dunga', pos: 'MEI', fame: 5 }, { name: 'Zico', pos: 'MEI', fame: 5 }, { name: 'Kaká', pos: 'MEI', fame: 5 }, { name: 'Neymar', pos: 'ATA', fame: 5 }, { name: 'Romário', pos: 'ATA', fame: 5 }, { name: 'Bebeto', pos: 'ATA', fame: 5 },
]
const fora = [
  { name: 'Alex Muralha', pos: 'GOL', fame: 1 }, { name: 'Cicinho', pos: 'LAT', fame: 2 }, { name: 'Índio', pos: 'ZAG', fame: 2 }, { name: 'Thiago Silva', pos: 'ZAG', fame: 4 }, { name: 'Athirson', pos: 'LAT', fame: 2 },
  { name: 'Léo Lima', pos: 'MEI', fame: 1 }, { name: 'Mineiro', pos: 'MEI', fame: 3 }, { name: 'Adryan', pos: 'MEI', fame: 1 }, { name: 'Luciano', pos: 'ATA', fame: 3 }, { name: 'Dentinho', pos: 'ATA', fame: 2 },
]
let jogos = 0, atrasoMax = 0; const atrasos: number[] = []
for (let s = 1; s <= 300; s++) {
  const rnd = (k: number) => ((s * 9301 + k * 49297) % 233280) / 233280
  const n = Math.floor(rnd(1) * 6)
  const gols = Array.from({ length: n }, (_, i) => ({ min: 1 + Math.floor(rnd(i + 2) * 92), home: rnd(i + 20) < 0.55, name: rnd(i + 30) < 0.5 ? 'Romário' : 'Luciano', assist: rnd(i + 40) < 0.5 ? 'Kaká' : undefined }))
    .map(g => ({ ...g, name: g.home ? (g.name === 'Luciano' ? 'Neymar' : g.name) : (g.name === 'Romário' ? 'Dentinho' : g.name), assist: g.assist && !g.home ? 'Mineiro' : g.assist }))
  const chances = chancesDoJogo(s * 77, gols, 109_756)
  const evs = eventosDoJogo(gols, chances)
  const j = new Jogo2D(s, casa, fora, evs)
  const golsVistos: { min: number; lado: number }[] = []
  let antes = 0
  for (let m = 0; m <= 99; m += 0.25) {
    j.avancaAte(m)
    const tot = j.placar[0] + j.placar[1]
    if (tot > antes) { golsVistos.push({ min: j.t / SEG_POR_MIN, lado: j.placar[0] > golsVistos.filter(g => g.lado === 0).length ? 0 : 1 }); antes = tot }
  }
  const esperado = [gols.filter(g => g.home).length, gols.filter(g => !g.home).length]
  assert.deepEqual(j.placar, esperado, `semente ${s}: placar do campinho ${j.placar} ≠ do jogo ${esperado} (gols ${JSON.stringify(gols.map(g => g.min + (g.home ? 'c' : 'f')))})`)
  const ord = [...gols].sort((a, b) => a.min - b.min)
  golsVistos.forEach((g, i) => { const a = g.min - ord[i].min; atrasoMax = Math.max(atrasoMax, a); atrasos.push(a) })
  // igual em dois aparelhos
  const k = new Jogo2D(s, casa, fora, evs); k.avancaAte(47.3); const k2 = new Jogo2D(s, casa, fora, evs); for (let m = 0; m <= 47.3; m += 0.7) k2.avancaAte(m); k2.avancaAte(47.3)
  assert.deepEqual(k.atl.map(a => [a.x.toFixed(3), a.y.toFixed(3)]), k2.atl.map(a => [a.x.toFixed(3), a.y.toFixed(3)]), `semente ${s}: dois aparelhos viram jogos diferentes`)
  jogos++
}
atrasos.sort((a, b) => a - b); console.log('atraso dos gols (min): mediana', atrasos[atrasos.length >> 1].toFixed(1), '· 90%', atrasos[Math.floor(atrasos.length * 0.9)].toFixed(1), '· >3min:', atrasos.filter(a => a > 3).length, 'de', atrasos.length)
console.log(`✅ ${jogos} jogos: o placar do campinho bate com o do jogo em todos · maior atraso de gol ${atrasoMax.toFixed(1)}'`)
assert.ok(atrasoMax <= 6, 'gol atrasado demais no campinho')
console.log('📺 Campo 2D: tudo certo')
process.exit(0)
