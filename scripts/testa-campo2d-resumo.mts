// 📊😱 trava do RESUMO DO APITO e do QUASE do Campo 2D (04/11). Confere, nos DOIS motores, que:
//   · contar o resumo/QUASE NÃO muda o jogo (mesmo placar e mesma bola com e sem o coletor);
//   · posse soma 100, chute no gol ≤ chute, gol entra como chute no gol, e o ⭐ melhor em campo nunca é jogador de mentira;
//   · o QUASE aparece de vez em quando (nem todo lance, nem nunca) e tem frase PT e EN.
//   npx tsx scripts/testa-campo2d-resumo.mts
import assert from 'node:assert/strict'
import { Jogo2D, eventosDoJogo } from '../src/escalacao/campo2d-motor'
import { chancesDoJogo } from '../src/escalacao/chances'
import { Motor2 } from '../src/escalacao/motor2/motor'
import { criaColetorCampo2D, fraseQuase } from '../src/escalacao/campo2d-resumo'
import { ACERVO_NARRA } from '../src/escalacao/campo2d-narracao'

for (const k of ['quase_trave', 'quase_defesa'] as const) { const [pt, en] = ACERVO_NARRA[k]; assert.equal(pt, en); assert.ok(pt >= 3, `${k} precisa de 3+ frases`) }

const casa = [
  { name: 'Taffarel', pos: 'GOL', fame: 5 }, { name: 'Cafu', pos: 'LAT', fame: 5 }, { name: 'Lúcio', pos: 'ZAG', fame: 5 }, { name: 'Aldair', pos: 'ZAG', fame: 4 }, { name: 'Roberto Carlos', pos: 'LAT', fame: 5 },
  { name: 'Dunga', pos: 'MEI', fame: 5 }, { name: 'Zico', pos: 'MEI', fame: 5 }, { name: 'Kaká', pos: 'MEI', fame: 5 }, { name: 'Neymar', pos: 'ATA', fame: 5 }, { name: 'Romário', pos: 'ATA', fame: 5 }, { name: 'Bebeto', pos: 'ATA', fame: 5 },
]
const fora = [
  { name: 'Alex Muralha', pos: 'GOL', fame: 1 }, { name: 'Cicinho', pos: 'LAT', fame: 2 }, { name: 'Índio', pos: 'ZAG', fame: 2 }, { name: 'Thiago Silva', pos: 'ZAG', fame: 4 }, { name: 'Athirson', pos: 'LAT', fame: 2 },
  { name: 'Léo Lima', pos: 'MEI', fame: 1 }, { name: 'Mineiro', pos: 'MEI', fame: 3 }, { name: 'Zé Ninguém', pos: 'MEI', fame: 1, club: 'Várzea', fake: true }, { name: 'Luciano', pos: 'ATA', fame: 3 }, { name: 'Dentinho', pos: 'ATA', fame: 2 },
]
type JogoT = { avancaAte: (m: number) => void; placar: number[]; bola: { x: number; y: number } }
let quases = 0, traves = 0, defesas = 0, jogos = 0, craques = 0
const roda = (j: JogoT, comColetor: boolean) => {
  const c = criaColetorCampo2D(); let n = 0
  for (let m = 0; m <= 108; m += 1 / 30) {
    j.avancaAte(m)
    if (!comColetor) continue
    c.passo(j as never)
    const q = c.novoQuase()
    if (q) { n++; assert.ok(/QUASE/.test(fraseQuase(q, false))); assert.ok(/SO CLO+SE/.test(fraseQuase(q, true))); if (q.tipo === 'trave') traves++; else defesas++ }
  }
  return { c, n, fim: `${j.placar.join('x')}|${j.bola.x.toFixed(3)}|${j.bola.y.toFixed(3)}` }
}
const confere = (r: ReturnType<ReturnType<typeof criaColetorCampo2D>['resumo']>) => {
  assert.equal(r.posse[0] + r.posse[1], 100)
  for (const l of [0, 1]) assert.ok(r.noAlvo[l] <= r.chutes[l], 'no gol > chutes')
  if (r.craque) { craques++; assert.notEqual(r.craque.nome, 'Zé Ninguém', 'jogador de mentira virou melhor em campo') }
}
for (let s = 1; s <= 30; s++) {
  // v1 (o teatro das salas)
  const gols = Array.from({ length: s % 5 }, (_, i) => ({ min: 5 + ((s * 17 + i * 23) % 85), home: (s + i) % 3 !== 0, name: (s + i) % 3 !== 0 ? 'Romário' : 'Luciano', assist: i % 2 ? undefined : (s + i) % 3 !== 0 ? 'Kaká' : 'Mineiro' }))
  const evs = () => eventosDoJogo(gols, chancesDoJogo(s * 77, gols, 109_756))
  const j1 = new Jogo2D(s, casa, fora, evs())
  const a = roda(j1, true), b = roda(new Jogo2D(s, casa, fora, evs()), false)
  assert.equal(a.fim, b.fim, `v1 seed ${s}: o coletor mudou o jogo`)
  const r1 = a.c.resumo(j1 as never, [casa, fora]); confere(r1)
  assert.ok(r1.noAlvo[0] >= j1.placar[0] && r1.noAlvo[1] >= j1.placar[1], `v1 seed ${s}: gol tem que contar como chute no gol`)
  // v2 (o motor da carreira)
  const m1 = new Motor2(s, casa, fora, false, [], [0, 0], 'sol', [false, false]), m2 = new Motor2(s, casa, fora, false, [], [0, 0], 'sol', [false, false])
  const x = roda(m1 as unknown as JogoT, true), y = roda(m2 as unknown as JogoT, false)
  assert.equal(x.fim, y.fim, `v2 seed ${s}: o coletor mudou o jogo`)
  confere(x.c.resumo(m1 as never, [casa, fora]))
  quases += a.n + x.n; jogos += 2
  if (s === 1) console.log('📊 exemplo v1:', JSON.stringify(r1), '· v2:', JSON.stringify(x.c.resumo(m1 as never, [casa, fora])))
}
// 🚪 quem abre o campinho no meio do jogo (o motor pula do 0 ao 80') não ganha um QUASE velho na cara
for (let s = 1; s <= 30; s++) {
  const m = new Motor2(s, casa, fora, false, [], [0, 0], 'sol', [false, false]), c = criaColetorCampo2D()
  m.avancaAte(80); c.passo(m as never)
  const q = c.novoQuase(), ult = m.eventos.filter(e => e.tipo === 'trave' || e.tipo === 'espalma').pop()
  assert.ok(!q || (ult && m.t - ult.t < 1.5), `seed ${s}: QUASE velho apareceu ao abrir no meio do jogo`)
}
const porJogo = quases / jogos
console.log(`😱 ${quases} QUASE em ${jogos} jogos (${porJogo.toFixed(2)}/jogo · ${traves} trave · ${defesas} defesa difícil) · ⭐ craque em ${craques}/${jogos}`)
assert.ok(porJogo > 0.3 && porJogo < 6, `QUASE fora da medida: ${porJogo.toFixed(2)} por jogo`)
console.log('✅ resumo do apito e QUASE: não mexem no jogo, as contas fecham, jogador de mentira fora')
