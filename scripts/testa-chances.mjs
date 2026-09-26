// ─── ⚽🥅 TRAVA DAS CHANCES — o golzinho com lances ─────────────────────────
//
// Diego (26/09): *"não mudaria a dinâmica dos gols, mas teria coisas acontecendo
// enquanto não sai gol… o placar só mostra o gol quando a bola entrar"*.
//
// O que esta trava protege:
//   1. 🎲 mesma semente → mesmas chances (host = convidado no online).
//   2. 🙈 chance NUNCA cai perto (±3') de um gol de verdade, nem no intervalo.
//   3. ⏱️ a quantidade cabe no tempo real da rodada: 11 s (online) = 1 por lado;
//      rodada lenta cabe mais; rodada instantânea = nenhuma.
//   4. 📍 minuto sempre entre 4' e 88' — nada nos acréscimos, nada no apito.
//   5. 🌐 toda frase tem PT e EN, mesma quantidade por final.
//   6. 🚫 nenhuma frase narra COBRANÇA de pênalti (ordem de 19/09).
//   7. 🧍 a narração fala do CLUBE, nunca inventa nome de jogador.
//
// uso: npx tsx scripts/testa-chances.mjs
import { chancesDoJogo, chancesPorLado, sementeDasChances, narraChance, vereditoDaChance, ACERVO_CHANCES, CHANCE_MS } from '../src/escalacao/chances.ts'

const erros = []
const ok = (cond, msg) => { console.log(`   ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros.push(msg) }
console.log('\n⚽🥅 CHANCES DO JOGO\n')

const gols = [{ min: 33, home: true }, { min: 58, home: true }, { min: 59, home: false }, { min: 81, home: false }]
const seed = sementeDasChances(5, 'The Wolf', 'Manfré FC')

// 1️⃣ determinismo
const a = chancesDoJogo(seed, gols, 30000), b = chancesDoJogo(seed, gols, 30000)
ok(JSON.stringify(a) === JSON.stringify(b), `mesma semente, mesmas chances (${a.length} chances em rodada de 30 s)`)
ok(JSON.stringify(chancesDoJogo(sementeDasChances(6, 'The Wolf', 'Manfré FC'), gols, 30000)) !== JSON.stringify(a), 'rodada diferente, chances diferentes')

// 2️⃣ longe dos gols e do intervalo — em 300 jogos aleatórios
let perto = 0, intervalo = 0, foraDaJanela = 0, total = 0
for (let r = 0; r < 300; r++) {
  const gs = Array.from({ length: r % 5 }, (_, i) => ({ min: 5 + ((r * 37 + i * 23) % 84), home: (r + i) % 2 === 0 }))
  for (const c of chancesDoJogo(sementeDasChances(r, 'A', 'B'), gs, 30000)) {
    total++
    if (gs.some(g => Math.abs(g.min - c.min) < 3)) perto++
    if (c.min >= 43 && c.min <= 47) intervalo++
    if (c.min < 4 || c.min > 88) foraDaJanela++
  }
}
ok(perto === 0, `nenhuma chance a menos de 3' de um gol (${total} chances conferidas)`)
ok(intervalo === 0, 'nenhuma chance no intervalo (43′–47′)')
ok(foraDaJanela === 0, 'toda chance entre 4′ e 88′')

// 3️⃣ quantidade por ritmo
ok(chancesPorLado(400) === 0, `rodada instantânea (400 ms): ${chancesPorLado(400)} por lado`)
ok(chancesPorLado(11000) === 1, `online (11 s): ${chancesPorLado(11000)} por lado`)
ok(chancesPorLado(30000) >= 2, `carreira (30 s): ${chancesPorLado(30000)} por lado`)
ok(chancesPorLado(120000) <= 4, `rodada bem lenta (120 s): ${chancesPorLado(120000)} por lado (teto 4)`)
// e as chances não se atropelam na tela: distância em ms ≥ CHANCE_MS
const lenta = chancesDoJogo(seed, gols, 30000).map(c => c.min).sort((x, y) => x - y)
const msPorMin = (30000 * 0.82) / 93
const atropela = lenta.some((m, i) => i > 0 && (m - lenta[i - 1]) * msPorMin < CHANCE_MS)
ok(!atropela, 'duas chances nunca ficam na tela ao mesmo tempo')

// 5️⃣ 6️⃣ 7️⃣ os textos
const fins = ['defendeu', 'trave', 'fora', 'isolou']
const frases = []
for (const fim of fins) for (let m = 1; m < 200; m++) for (const en of [false, true]) frases.push(narraChance({ min: m, home: true, fim }, 'Bagres 1993', en))
const distintas = new Set(frases)
ok(distintas.size >= 40, `banco variado: ${distintas.size} frases distintas`)
ok(Object.values(ACERVO_CHANCES).every(n => n >= 5), `pelo menos 5 frases por final (${JSON.stringify(ACERVO_CHANCES)})`)
const cobranca = [...distintas].filter(f => /cobr\w* (de |o )?pênalti|bateu o pênalti|penalty kick|from the spot|pênalti (marcado|para)/i.test(f))
ok(cobranca.length === 0, `nenhuma frase narra cobrança de pênalti${cobranca.length ? ': ' + cobranca[0] : ''}`)
ok([...distintas].every(f => f.includes('Bagres 1993')), 'toda frase cita o CLUBE (nunca inventa jogador)')
const ptEmEn = [...distintas].filter(f => /\b(goleiro|trave|chute|fora|sobe|área)\b/.test(f) && /\b(keeper|post|shot|wide|rises|box)\b/.test(f))
ok(ptEmEn.length === 0, 'nenhuma frase mistura os dois idiomas')
ok(vereditoDaChance('gol', false) === '⚽ GOOOL!' && vereditoDaChance('trave', true) === '🥅 OFF THE POST!', 'vereditos nos dois idiomas')

if (erros.length) { console.log('\n❌ REPROVADO:'); for (const e of erros) console.log('   ·', e); process.exit(1) }
console.log('\n✅ tudo certo — as chances são teatro: nunca mexem nos gols, nunca entregam o futuro.\n')
