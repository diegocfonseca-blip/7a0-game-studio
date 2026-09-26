// ─── 🎤 TRAVA DO GIRO DA GALERA — manchetes sobre as pessoas da sala ──────────
//
// Pedido do Diego (26/09): *"nos modos rápido online e minhas ligas você poderia
// pôr mais textos em relação aos usuários que estão jogando"*.
//
// O que esta trava protege:
//   1. 🥊 humano × humano SEMPRE vira manchete (é o que a sala quer ler), com o
//      placar certo e o vencedor certo — inclusive quando o mandante perde.
//   2. 🤖 humano × bot só rende quando dói (bot venceu) ou quando humilha (4+).
//   3. 🤖 × 🤖 nunca aparece — ninguém liga.
//   4. 🎲 a frase é PRESA NA SEMENTE: mesma rodada, mesma frase no host e em todo
//      convidado (online é host-autoritativo; a escolha não pode ser Math.random).
//   5. 🌐 TODA frase que nasce tem tradução — o inglês não pode ficar torto.
//   6. 🙈 toda frase abre com um emoji da lista que a tela usa pra segurar até o
//      apito (`ehMancheteGalera`), senão o placar vaza antes da animação.
//   7. 📏 respeita o teto (`max`) e nunca inventa: sem tabela, sem "melhor da sala".
//
// uso: npx tsx scripts/testa-giro-galera.mjs
import { narraGalera, traduzGalera, ehMancheteGalera } from '../src/escalacao/giro-galera.ts'

const nomes = { 1: 'Neymarzetti 👑', 2: 'Cr7 Leilão ⭐', 3: 'Rei da Bola', 10: 'Bagres 1993', 11: 'Sapekeiros', 12: 'Só Deus Sabe FC' }
const humanos = new Set([1, 2, 3])
const base = { nomeDe: id => nomes[id] ?? `T${id}`, ehHumano: id => humanos.has(id), seed: 4242 }
const erros = []
const ok = (cond, msg) => { console.log(`   ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros.push(msg) }

console.log('\n🎤 GIRO DA GALERA\n')

// 1️⃣ humano × humano, visitante venceu
let h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 2, hg: 1, ag: 3 }] })
ok(h.length === 1 && h[0].startsWith('🥊 CLÁSSICO DA SALA: Cr7 Leilão ⭐ 3 × 1 Neymarzetti 👑'), `clássico com o vencedor na frente: ${h[0]}`)

// empate com gol e 0×0
h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 2, hg: 2, ag: 2 }] })
ok(h[0]?.startsWith('🤝 Neymarzetti 👑 2 × 2 Cr7 Leilão ⭐'), `empate: ${h[0]}`)
h = narraGalera({ ...base, jogos: [{ homeId: 3, awayId: 1, hg: 0, ag: 0 }] })
ok(h[0]?.startsWith('😴 Rei da Bola 0 × 0 Neymarzetti 👑'), `0×0: ${h[0]}`)

// retrospecto entra quando tem histórico
h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 2, hg: 2, ag: 0 }], h2h: (a) => a === 1 ? { w: 3, l: 1, d: 0 } : { w: 1, l: 3, d: 0 } })
ok(/No confronto: 3 a 1 pro Neymarzetti 👑\.$/.test(h[0] ?? ''), `retrospecto: ${h[0]}`)

// 2️⃣ humano × bot
h = narraGalera({ ...base, jogos: [{ homeId: 10, awayId: 1, hg: 4, ag: 1 }] })
ok(h.length === 1 && h[0].startsWith('🤡'), `tomou 3+ de bot vira 🤡: ${h[0]}`)
h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 10, hg: 5, ag: 0 }] })
ok(h.length === 1 && h[0].startsWith('🧨'), `goleou bot por 4+ vira 🧨: ${h[0]}`)
h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 10, hg: 0, ag: 1 }] })
ok(h.length === 1 && h[0].startsWith('🤖'), `perdeu apertado pra bot vira 🤖: ${h[0]}`)
h = narraGalera({ ...base, jogos: [{ homeId: 1, awayId: 10, hg: 2, ag: 1 }] })
ok(h.length === 0, 'vitória apertada sobre bot NÃO vira manchete (não rende)')

// 3️⃣ bot × bot
h = narraGalera({ ...base, jogos: [{ homeId: 10, awayId: 11, hg: 7, ag: 0 }] })
ok(h.length === 0, 'bot × bot nunca aparece')

// 4️⃣ semente: mesma entrada → mesma saída; semente diferente varia a frase
const jogos = [{ homeId: 1, awayId: 2, hg: 2, ag: 1 }]
const a1 = narraGalera({ ...base, jogos })[0], a2 = narraGalera({ ...base, jogos })[0]
ok(a1 === a2, 'mesma semente, mesma frase (host = convidado)')
const frases = new Set(Array.from({ length: 40 }, (_, i) => narraGalera({ ...base, seed: i * 7919, jogos })[0]))
ok(frases.size >= 3, `sementes diferentes variam o fecho (${frases.size} variações em 40)`)

// 🎩 melhor da sala mudou · 🐌 pior perdeu
const pos = { 1: 3, 2: 1, 3: 18 }, posAntes = { 1: 1, 2: 4, 3: 17 }
h = narraGalera({ ...base, max: 4, jogos: [{ homeId: 2, awayId: 10, hg: 1, ag: 0 }, { homeId: 3, awayId: 11, hg: 0, ag: 2 }, { homeId: 1, awayId: 12, hg: 0, ag: 3 }], posDe: id => pos[id], posAntes: id => posAntes[id] })
ok(h.some(x => x.startsWith('🎩') && x.includes('Cr7 Leilão ⭐')), `melhor da sala mudou: ${h.find(x => x.startsWith('🎩'))}`)
ok(h.some(x => x.startsWith('🐌') && x.includes('Rei da Bola')), `pior da sala perdeu: ${h.find(x => x.startsWith('🐌'))}`)

// 7️⃣ teto e "sem tabela"
h = narraGalera({ ...base, max: 2, jogos: [{ homeId: 1, awayId: 2, hg: 1, ag: 0 }, { homeId: 3, awayId: 10, hg: 0, ag: 4 }, { homeId: 2, awayId: 11, hg: 0, ag: 1 }] })
ok(h.length === 2, `respeita o teto (${h.length} de 3 possíveis)`)
h = narraGalera({ ...base, max: 4, jogos: [{ homeId: 2, awayId: 10, hg: 1, ag: 0 }], posDe: id => pos[id] })
ok(!h.some(x => x.startsWith('🎩')), 'sem posição de antes não diz que o melhor mudou (não inventa)')

// 5️⃣ + 6️⃣ tradução e abertura de TODAS as frases possíveis
const tudo = []
for (let seed = 0; seed < 60; seed++) {
  tudo.push(...narraGalera({ ...base, seed, max: 6, h2h: () => ({ w: 2, l: 1, d: 0 }), posDe: id => pos[id], posAntes: id => posAntes[id],
    jogos: [{ homeId: 1, awayId: 2, hg: 2, ag: 1 }, { homeId: 3, awayId: 1, hg: 0, ag: 0 }, { homeId: 2, awayId: 3, hg: 1, ag: 1 }, { homeId: 3, awayId: 10, hg: 0, ag: 3 }, { homeId: 2, awayId: 11, hg: 6, ag: 1 }, { homeId: 1, awayId: 12, hg: 0, ag: 1 }] }))
  tudo.push(...narraGalera({ ...base, seed, max: 6, h2h: () => ({ w: 1, l: 1, d: 0 }), jogos: [{ homeId: 2, awayId: 1, hg: 0, ag: 2 }] }))
}
const semTraducao = [...new Set(tudo)].filter(f => !traduzGalera(f))
ok(semTraducao.length === 0, `toda frase tem inglês (${new Set(tudo).size} frases distintas)${semTraducao.length ? ' — sem tradução: ' + semTraducao.join(' | ') : ''}`)
const semAbertura = [...new Set(tudo)].filter(f => !ehMancheteGalera(f))
ok(semAbertura.length === 0, 'toda frase abre com um emoji que a tela segura até o apito')
// ⚠️ só PALAVRAS do texto — nome de clube (ex.: "Cr7 Leilão") tem acento e NUNCA se traduz
const enComPt = [...new Set(tudo)].map(traduzGalera).filter(e => /\b(tomou|passou|sala|confronto|moral|castigo|juiz|empate|abraço|guerreiro|trator|máquina|melhor|pior)\b/i.test(e ?? ''))
ok(enComPt.length === 0, `o inglês não deixa português no meio${enComPt.length ? ': ' + enComPt[0] : ''}`)

if (erros.length) { console.log('\n❌ REPROVADO:'); for (const e of erros) console.log('   ·', e); process.exit(1) }
console.log('\n✅ tudo certo — a galera aparece no giro, sem inventar e com inglês.\n')
