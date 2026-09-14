// 🧮 A TABELA TEM QUE SER SEMPRE A MESMA HISTÓRIA (14/09).
// Dois usuários: *"minha carreira tá bugada, até o último jogo tava em terceiro
// lugar com 68 pontos, aí acabou o último jogo e apareceu que eu caí com 44"*.
//
// Causa: a tela desenha a tabela por DUAS simulações — `live` (rodada atual) e
// `shown` (a rodada já revelada, usada enquanto a partida anima). A `shown` estava
// sendo chamada SEM o gás (`condMods`), então, enquanto a rodada animava, a tela
// mostrava uma temporada INTEIRA que nunca existiu — a que teria acontecido se
// ninguém cansasse. No apito, ela trocava pela verdadeira, e os pontos despencavam.
//
// Este teste mede a diferença entre as duas histórias, com os números REAIS do
// gás (😓 −1 · 🥵 −2 · 🚑 −3), pra provar que a tabela muda de verdade quando o
// gás é esquecido — e que as duas chamadas têm que receber os mesmos argumentos.
// Elenco DESCANSADO (gás 100) não muda nada; quem sente é a carreira LONGA, com o
// elenco já cansado — que é justamente quem reclamou.
//   npx tsx scripts/testa-tabela-gas.mjs
//   GAS_INICIAL=40 npx tsx scripts/testa-tabela-gas.mjs   (elenco menos cansado)
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const pyr = await server.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const cond = await server.ssrLoadModule('/src/escalacao/condicao.ts')
const { buildPyramid, simulatePyramid } = pyr

const SEED = 20260914
const carta = (id, pos, n, lo, hi) => ({ id, name: `${pos}-${n}`, club: 'Clube', year: 2000, pos, fame: 3, lo, hi, paid: 1, buyPrice: 1 })
// elenco de 22 (11 titulares + 11 reservas), forte o bastante pra brigar em cima
const elenco = () => {
  const out = []
  const receita = [['GOL', 2], ['LAT', 4], ['ZAG', 4], ['MEI', 6], ['ATA', 6]]
  for (const [pos, n] of receita) for (let i = 0; i < n; i++) out.push(carta(`h-${pos}-${i}`, pos, i, 78 - i * 2, 88 - i * 2))
  return out
}
const humano = {
  id: 1, name: 'Você', teamName: 'Time do Teste', isHuman: true, mine: true,
  formation: '4-3-3', money: 500, squad: elenco(),
}
const world = buildPyramid([humano], 1, SEED, 'br', { m1: 'C' }, undefined)

// o XI do humano (o que o motor escala sozinho) — é nele que o gás bate
const meuTime = world.C.find(t => t.you)
const xi = meuTime.xi.map(c => c.id)

// 😓 O GÁS DE VERDADE, com as contas do próprio jogo (`condicao.ts`): cada jogo
// como titular tira GAS_JOGO do gás, e o desconto de força sai do modGas
// (😓 −1 · 🥵 −2 · 🚑 −3). Começo com o elenco em GAS_INICIAL, como um time de
// carreira LONGA, que é onde o cansaço aparece (o gás atravessa temporadas).
const GAS_INICIAL = Number(process.env.GAS_INICIAL ?? 25) // 25 = elenco de carreira longa, já no 🥵/🚑 (é lá que o cansaço pesa)
const condMods = { 1: {} }
for (let r = 1; r <= 38; r++) {
  const g = GAS_INICIAL - cond.GAS_JOGO * (r - 1)
  const tira = cond.modGas(g)
  if (tira) condMods[1][r] = Object.fromEntries(xi.map(id => [id, tira]))
}
console.log(`elenco começa com ${GAS_INICIAL} de gás · desconto de força na última rodada: ${cond.modGas(GAS_INICIAL - cond.GAS_JOGO * 37)}`)

const linha = (tabela) => { const i = tabela.findIndex(t => t.you); return { pos: i + 1, pts: tabela[i].pts, time: tabela[i].name } }
const comGas = (r) => linha(simulatePyramid(world, SEED, r, {}, {}, 1.12, true, true, {}, {}, {}, undefined, condMods).tables.C)
const semGas = (r) => linha(simulatePyramid(world, SEED, r, {}, {}, 1.12, true, true, {}, {}, {}, undefined, {}).tables.C)

let falhas = 0
const ok = (c, t) => { console.log(`${c ? '✅' : '❌'} ${t}`); if (!c) falhas++ }

console.log('\nO QUE A TELA MOSTRAVA (sem gás) × O QUE VALIA (com gás)')
console.log('rodada │ sem gás      │ com gás      │ diferença')
let maiorDif = 0, maiorPulo = 0
for (const r of [10, 20, 30, 36, 37, 38]) {
  const a = semGas(r), b = comGas(r)
  const dif = a.pts - b.pts, pulo = b.pos - a.pos
  maiorDif = Math.max(maiorDif, Math.abs(dif)); maiorPulo = Math.max(maiorPulo, Math.abs(pulo))
  console.log(`  ${String(r).padStart(2)}   │ ${String(a.pos).padStart(2)}º ${String(a.pts).padStart(3)} pts │ ${String(b.pos).padStart(2)}º ${String(b.pts).padStart(3)} pts │ ${dif >= 0 ? '−' : '+'}${Math.abs(dif)} pts, ${pulo >= 0 ? '↓' : '↑'}${Math.abs(pulo)} lugar(es)`)
}

console.log('')
ok(maiorDif > 0, `as duas histórias REALMENTE dão tabelas diferentes (maior diferença: ${maiorDif} pontos)`)
ok(maiorPulo > 0, `e diferentes a ponto de mudar de posição (maior pulo: ${maiorPulo} lugares)`)
console.log('\n👉 Por isso as duas chamadas de simulatePyramid da tela (live e shown)')
console.log('   TÊM que receber os mesmos argumentos — hoje elas dividem a mesma função.')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ medido')
await server.close()
process.exit(falhas ? 1 : 0)
