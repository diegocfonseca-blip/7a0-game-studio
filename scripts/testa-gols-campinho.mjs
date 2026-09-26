// ─── ⚽🅰️ TRAVA: O CAMPINHO MOSTRA GOL E ASSISTÊNCIA EM TODA COMPETIÇÃO ──────
//
// Print do Diego (26/09), numa sala de Champions: *"nos jogos rápidos / minhas
// ligas online não tá aparecendo gols e assistência dos jogadores no campinho no
// modo Champions"*.
//
// A causa: o campinho lia SÓ `state.scorers`, que é a artilharia da LIGA. Na
// "⭐ Só Champions" não existe liga — a lista fica vazia e todo boneco aparece
// pelado. Os gols da Champions moram em `champions.scorers`, os da Liberta em
// `liberta.scorers`, e os do mata-mata em `quickCopa.scorers`.
//
// ⚠️ E a conta NÃO é "somar tudo": na Champions e na Liberta o `quickCopa` nasce
// com a lista da fase de tabela/grupos DENTRO dela (é cumulativa), então somar as
// duas contaria cada gol duas vezes. Na liga + Copa dos 8 as listas são separadas
// e aí sim somam. Esta trava mede os dois casos.
//
// uso: node scripts/testa-gols-campinho.mjs [--porta 5246]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5246')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
p.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const { golsNoJogo, assistsNoJogo } = await import('/src/escalacao/store.tsx')
  const EU = 3
  const g = (n) => [{ name: 'Edin Džeko', teamId: EU, goals: n }]
  const a = (n) => [{ name: 'Marcos Senna', teamId: EU, assists: n }]
  const casos = []
  const caso = (nome, st, golEsperado, assEsperada) => casos.push({
    nome,
    gol: golsNoJogo(st, 'Edin Džeko', EU), golEsperado,
    ass: assistsNoJogo(st, 'Marcos Senna', EU), assEsperada,
  })

  // 1️⃣ ⭐ SÓ CHAMPIONS (sem liga): tudo vem de champions.scorers
  caso('só Champions (fase de tabela)',
    { scorers: [], assists: [], champions: { scorers: g(2), assists: a(1) } }, 2, 1)

  // 2️⃣ ⭐ CHAMPIONS NO MATA-MATA: o quickCopa nasce com a lista da tabela dentro
  //    (mesma lista, já somada) — não pode contar duas vezes
  const listaG = g(3), listaA = a(2)
  caso('Champions no mata-mata (lista cumulativa)',
    { scorers: [], assists: [], champions: { scorers: listaG, assists: listaA }, quickCopa: { scorers: listaG, assists: listaA } }, 3, 2)

  // 3️⃣ 🌎 LIBERTA: mesma regra da Champions
  const lbG = g(4), lbA = a(3)
  caso('Libertadores no mata-mata',
    { scorers: [], assists: [], liberta: { scorers: lbG, assists: lbA }, quickCopa: { scorers: lbG, assists: lbA } }, 4, 3)

  // 4️⃣ 🏆 LIGA + COPA DOS 8: listas SEPARADAS → soma
  caso('liga + Copa dos 8 (listas separadas)',
    { scorers: g(5), assists: a(4), quickCopa: { scorers: g(2), assists: a(1) } }, 7, 5)

  // 5️⃣ 🏆 LIGA sozinha (o de sempre) — não pode ter mudado nada
  caso('liga sozinha (como sempre foi)', { scorers: g(9), assists: a(6) }, 9, 6)

  // 6️⃣ quem não fez nada continua zerado
  const zero = golsNoJogo({ scorers: [], assists: [], champions: { scorers: g(2) } }, 'Pelé', EU)
  // 7️⃣ e o gol do OUTRO time não vaza pro seu
  const outro = golsNoJogo({ scorers: [], assists: [], champions: { scorers: [{ name: 'Edin Džeko', teamId: 99, goals: 7 }] } }, 'Edin Džeko', EU)

  return { casos, zero, outro }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n⚽🅰️ GOL E ASSISTÊNCIA NO CAMPINHO — toda competição\n')
const erros = []
for (const c of r.casos) {
  const okG = c.gol === c.golEsperado, okA = c.ass === c.assEsperada
  console.log(`   ${okG && okA ? '✅' : '❌'} ${c.nome}: ⚽ ${c.gol} (esperado ${c.golEsperado}) · 🅰️ ${c.ass} (esperado ${c.assEsperada})`)
  if (!okG) erros.push(`${c.nome}: ⚽ deu ${c.gol}, esperado ${c.golEsperado}`)
  if (!okA) erros.push(`${c.nome}: 🅰️ deu ${c.ass}, esperada ${c.assEsperada}`)
}
console.log(`   ${r.zero === 0 ? '✅' : '❌'} quem não marcou fica zerado (${r.zero})`)
console.log(`   ${r.outro === 0 ? '✅' : '❌'} gol do outro time não vaza pro seu (${r.outro})`)
if (r.zero !== 0) erros.push('quem não marcou apareceu com gol')
if (r.outro !== 0) erros.push('o gol de um xará em OUTRO time entrou na conta')

if (erros.length) { console.log('\n❌ REPROVADO:'); for (const e of erros) console.log('   ·', e); process.exit(1) }
console.log('\n✅ passou: o campinho conta gol e assistência de liga, Champions, Liberta e mata-mata.\n')
