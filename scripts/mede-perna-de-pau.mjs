// ─── 🧮 DE ONDE VEM TANTO PERNA-DE-PAU? (pergunta do Diego, 19/09) ──────────
//
// *"Se eu tenho 1466 cartas, por que essas cartas todas não estão preenchidas no
// baralho? Por que está aparecendo um monte de jogador fake?"*
//
// Esta medição responde com NÚMERO, rodando o código de verdade (`seedCpuSquads`,
// o mesmo que monta os times de fundo da carreira). Ela mostra:
//   · quantas cartas o baralho tem POR POSIÇÃO;
//   · quantas a pirâmide PRECISA por posição (é aí que a conta estoura);
//   · quantos tapa-buraco nascem, em que divisão e em que posição.
//
// uso: node scripts/mede-perna-de-pau.mjs [--porta 5238]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5238')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const ps = await import('/src/escalacao/pyramidseason.tsx')
  const st = await import('/src/escalacao/store.tsx')
  const f = await import('/src/escalacao/fake.ts')
  const SECTORS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  const NEED = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const cat = st.catalogTodos()
  const temPorPos = Object.fromEntries(SECTORS.map(p => [p, cat[p].length]))

  // a carreira com Várzea: 4 divisões de CPU (A/B/C/D) × 20 times
  const squads = ps.seedCpuSquads([], 12345, 'todos', true)
  const times = Object.keys(squads)
  const fakePorPos = Object.fromEntries(SECTORS.map(p => [p, 0]))
  const realPorPos = Object.fromEntries(SECTORS.map(p => [p, 0]))
  const fakePorTime = {}
  for (const nome of times) {
    let n = 0
    for (const c of squads[nome]) {
      if (f.ehCartaFake(c)) { fakePorPos[c.pos]++; n++ } else realPorPos[c.pos]++
    }
    if (n) fakePorTime[nome] = n
  }
  const totalCartas = SECTORS.reduce((s, p) => s + cat[p].length, 0)
  const totalFake = SECTORS.reduce((s, p) => s + fakePorPos[p], 0)
  const totalVagas = times.length * 11

  // 🔬 POR FAIXA DE FORÇA: o pool é ordenado do mais forte pro mais fraco e
  // cortado em 4 (A/B/C/D). Cada faixa tem que ter, SOZINHA, 20 GOL · 40 LAT ·
  // 40 ZAG · 60 MEI · 60 ATA. É aqui que a conta estoura mesmo sobrando carta.
  const pool = SECTORS.flatMap(pos => cat[pos].map((c, i) => ({ ...c, pos, id: `${pos}-${i}` })))
  const rest = ps.shuffle(pool, ps.mulberry((12345 ^ 0x9E3779B1) >>> 0)).sort((a, b) => ps.mid(b) - ps.mid(a))
  const q = Math.ceil(rest.length / 4)
  const faixas = [['A', rest.slice(0, q)], ['B', rest.slice(q, q * 2)], ['C', rest.slice(q * 2, q * 3)], ['D', rest.slice(q * 3)]]
  const porFaixa = faixas.map(([nome, lista]) => ({
    nome,
    tem: Object.fromEntries(SECTORS.map(p => [p, lista.filter(c => c.pos === p).length])),
  }))

  // 🧑‍🤝‍🧑 E COM OS TÉCNICOS EM CAMPO: as cartas do usuário e dos rivais saem do
  // pool ANTES de montar os times de fundo. Simula 20 elencos de 15 cartas.
  const comDonos = (quantos, porElenco) => {
    const usados = []
    const fila = Object.fromEntries(SECTORS.map(p => [p, cat[p].slice()]))
    for (let t = 0; t < quantos; t++) {
      const squad = []
      for (let i = 0; i < porElenco; i++) {
        const pos = SECTORS[i % SECTORS.length]
        const c = fila[pos].shift()
        if (c) squad.push({ ...c, pos, id: `u-${t}-${i}` })
      }
      usados.push({ id: t, teamName: `T${t}`, isHuman: t === 0, squad })
    }
    const sq = ps.seedCpuSquads(usados, 12345, 'todos', true)
    let n = 0
    for (const nome of Object.keys(sq)) for (const c of sq[nome]) if (f.ehCartaFake(c)) n++
    return n
  }
  const cenarios = [[20, 11], [20, 15], [20, 20], [20, 27]].map(([q2, k]) => ({ tecnicos: q2, cartas: k, fake: comDonos(q2, k) }))

  return { temPorPos, fakePorPos, realPorPos, totalCartas, totalFake, totalVagas, nTimes: times.length, NEED, porFaixa, cenarios, piores: Object.entries(fakePorTime).sort((a, b) => b[1] - a[1]).slice(0, 5) }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

const SECTORS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
console.log(`\n🧮 DE ONDE VEM O PERNA-DE-PAU · baralho "todos juntos" (BR + Europa + Mundo)\n`)
console.log(`   baralho: ${r.totalCartas} cartas · pirâmide de CPU: ${r.nTimes} times × 11 = ${r.totalVagas} vagas\n`)
console.log('   posição │ tem no baralho │ a pirâmide precisa │ entrou de verdade │ tapa-buraco')
console.log('   ────────┼────────────────┼────────────────────┼───────────────────┼────────────')
for (const p of SECTORS) {
  const precisa = r.NEED[p] * r.nTimes
  const falta = r.fakePorPos[p]
  console.log(`   ${p.padEnd(7)} │ ${String(r.temPorPos[p]).padStart(14)} │ ${String(precisa).padStart(18)} │ ${String(r.realPorPos[p]).padStart(17)} │ ${falta ? `${falta}  🔴` : '0'}`)
}
console.log(`\n   TOTAL de tapa-buraco na pirâmide: ${r.totalFake} de ${r.totalVagas} vagas (${(100 * r.totalFake / r.totalVagas).toFixed(1)}%)`)
if (r.piores.length) {
  console.log('\n   times com mais tapa-buraco:')
  for (const [nome, n] of r.piores) console.log(`     · ${nome}: ${n} de 11`)
}
console.log('\n🔬 E POR FAIXA DE FORÇA (o pool é cortado em 4, uma faixa por divisão).')
console.log('   Cada faixa precisa, SOZINHA: 20 GOL · 40 LAT · 40 ZAG · 60 MEI · 60 ATA.\n')
console.log('   faixa │  GOL  │  LAT  │  ZAG  │  MEI  │  ATA')
console.log('   ──────┼───────┼───────┼───────┼───────┼──────')
const PRECISA = { GOL: 20, LAT: 40, ZAG: 40, MEI: 60, ATA: 60 }
for (const fx of r.porFaixa) {
  const cel = SECTORS.map(p => { const v = fx.tem[p]; const falta = v < PRECISA[p]; return `${String(v).padStart(4)}${falta ? '🔴' : '  '}` })
  console.log(`   ${fx.nome}     │ ${cel.join(' │ ')}`)
}
console.log('\n🧑‍🤝‍🧑 E QUANDO OS TÉCNICOS ESTÃO EM CAMPO (as cartas deles saem do pool antes):\n')
for (const c of r.cenarios) console.log(`   ${c.tecnicos} técnicos × ${String(c.cartas).padStart(2)} cartas = ${String(c.tecnicos * c.cartas).padStart(3)} cartas fora do pool → ${String(c.fake).padStart(3)} tapa-buraco na pirâmide`)
console.log('\n💡 A conta que importa é COLUNA A COLUNA, não o total: o sorteio distribui')
console.log('   POR POSIÇÃO e POR FAIXA — sobrar atacante não tapa buraco de lateral.\n')
