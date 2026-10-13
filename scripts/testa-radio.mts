// 📻 trava da Rádio Legends (13/10): `npm run radio`
import { radioDoJogo, narraRadio, frasesPorJogo, BANCOS_RADIO, ACERVO_RADIO } from '../src/escalacao/radio.ts'
import { chancesDoJogo, sementeDasChances } from '../src/escalacao/chances.ts'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }
const PROIBIDO = /p[eê]nalt|\bgol\b|\bgoal\b|golaço|placar|score|vencendo|perdendo|winning|losing|empat|\bdraw\b/i
let limpo = true
for (const [nome, banco] of Object.entries(BANCOS_RADIO)) for (const [pt, en] of banco) {
  if (PROIBIDO.test(pt) || PROIBIDO.test(en)) { limpo = false; console.log('   proibido em', nome, '→', pt, '|', en) }
  const vp = (pt.match(/\{[to]\}/g) ?? []).sort().join(), ve = (en.match(/\{[to]\}/g) ?? []).sort().join()
  if (vp !== ve) { limpo = false; console.log('   PT/EN com clubes diferentes →', pt, '|', en) }
}
ok(limpo, 'nenhuma frase fala de gol, pênalti ou placar, e PT/EN citam os mesmos clubes')
const combos = ACERVO_RADIO.lances * ACERVO_RADIO.abre * ACERVO_RADIO.fecha
ok(combos >= 20000, `frases possíveis no meio do jogo: ${combos.toLocaleString('pt-BR')} (lances ${ACERVO_RADIO.lances} × aberturas ${ACERVO_RADIO.abre} × fechos ${ACERVO_RADIO.fecha})`)
ok(frasesPorJogo(16000) >= 4 && frasesPorJogo(300) === 0, `cabem ${frasesPorJogo(16000)} frases num jogo de 16s, nenhuma em rodada instantânea`)
const T = ['K9 FC', 'Fabulous EC', 'Real Madruga', 'Inter Vale', 'Manfré FC', 'Leão da Estradinha', 'Julia Barranquila', 'Al Takhadao FC']
let perto = 0, repetido = 0, total = 0
const vistas = new Set<string>()
for (let r = 0; r < 2000; r++) {
  const h = T[r % T.length], a = T[(r * 3 + 1) % T.length]; if (h === a) continue
  const gols = Array.from({ length: r % 5 }, (_, i) => ({ min: 5 + ((r * 17 + i * 29) % 85), home: i % 2 === 0 }))
  const seed = sementeDasChances(r, h, a)
  const ch = chancesDoJogo(seed, gols, 16000)
  const ocup = [...gols.map(g => g.min), ...ch.map(c => c.min)]
  const rad = radioDoJogo(seed, ocup, 16000)
  if (rad.some(l => ocup.some(o => Math.abs(o - l.min) < 3))) perto++
  const idx = rad.map(l => l.i); if (new Set(idx).size !== idx.length) repetido++
  for (const l of rad) { total++; vistas.add(narraRadio(l, h, a, false)) }
}
ok(perto === 0, 'a rádio nunca fala a menos de 3′ de um gol ou de uma chance (2000 jogos)')
ok(repetido === 0, 'nenhum lance se repete dentro do mesmo jogo')
ok(vistas.size / total > 0.9, `em 2000 jogos: ${total} frases, ${vistas.size} diferentes (${Math.round(vistas.size / total * 100)}%)`)
const s1 = radioDoJogo(sementeDasChances(7, 'K9 FC', 'Fabulous EC'), [23, 44], 16000), s2 = radioDoJogo(sementeDasChances(7, 'K9 FC', 'Fabulous EC'), [23, 44], 16000)
ok(JSON.stringify(s1) === JSON.stringify(s2), 'mesma rodada e mesmos clubes = mesma rádio em todo aparelho da sala')
const ex = s1.map(l => `${l.min}′ ${narraRadio(l, 'K9 FC', 'Fabulous EC', false)}`)
console.log('\n  exemplo (K9 FC × Fabulous EC):\n   ' + ex.join('\n   '))
console.log('   EN: ' + narraRadio(s1[0], 'K9 FC', 'Fabulous EC', true))
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ rádio ok — variada, sem gol, sem pênalti, sem placar')
process.exit(falhas ? 1 : 0)
