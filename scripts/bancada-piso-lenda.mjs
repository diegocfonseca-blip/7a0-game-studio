// ─── 🔬 BANCADA: POR QUE UMA LENDA VAI PRO LEILÃO E NINGUÉM DÁ LANCE? ───────
//
// Diego (21/09), vendo a carreira: *"tô vendo ir pro leilão Paul Scholes, lenda,
// nenhum lance. Cafu do Milan indo pro leilão, nenhum lance. E aí do nada aparece
// um jogador craque no leilão, aí vai um monte de lance. Tô achando estranho"*.
//
// A suspeita é o PISO. Da 2ª temporada em diante o baralho da carreira vem do
// elenco dos bots, e cada carta volta com um PISO (`paid`) tirado do livro de
// preços (`marketValues`). Carta nova do catálogo entra com piso ZERO.
// No motor (`cpuEnvelope`, store.tsx), a regra é:
//
//     if (wallet < floor || cap + 3 < floor) continue   ← PULA a carta inteira
//
// ou seja: se o piso passa do que o bot acha que a carta vale (`cap`), ele não dá
// lance NENHUM — nem um lance baixo. A carta fica com zero lance e cai no monte.
//
// ⚠️ ESTA BANCADA NÃO COPIA FÓRMULA NENHUMA. Ela joga o pregão de VERDADE
// (o mesmo `reducer` do jogo), com o acaso travado, e só muda UMA coisa: o piso
// da carta escolhida. Assim o número que sai é o do jogo, não o de uma imitação.
//
// uso: node scripts/bancada-piso-lenda.mjs [--porta 5262]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5262')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')
  const semente = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
  const original = Math.random

  // joga um pregão inteiro colocando PISO em toda carta de uma categoria.
  // devolve, por categoria de fama, quantas cartas receberam lance.
  const joga = (piso, semanteN, caixa = 0, rivais = 7) => {
    Math.random = semente(semanteN)
    let s = st.reducer(st.INITIAL, { type: 'START', teamName: 'Bancada', formation: '4-3-3', rivals: rivais, league: 'br' })
    // 💰 BOLSO DE CARREIRA: o jogo rápido nasce com bots pobres, e bot pobre recusa
    // por FALTA DE DINHEIRO (`wallet < floor`), não por achar caro — se a bancada
    // rodasse só assim, ela exageraria o efeito do piso. Com `caixa` a gente põe o
    // bolso das divisões da carreira (DIV_BASE_CASH: A 230 · B 190 · C 150 · D 100
    // · V 60) e mede o regime de verdade.
    if (caixa > 0) for (const m of s.managers) if (!m.isHuman) m.money = caixa
    // 🏷️ carimba o piso: MESMA regra do mercado da carreira (`paid` na carta do
    // baralho). Piso 0 = carta nova do catálogo, que é como o jogo rápido nasce.
    const alvo = new Map() // cardId → fama
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      for (const c of s.deck[pos]) {
        if (piso > 0) c.paid = piso
        alvo.set(c.id, c.fame ?? 1)
      }
    }
    // 📖 registra o que cada carta recebeu de lance, lendo o revealQueue do jogo
    const lances = new Map()
    let marca = '', parado = 0
    for (let g = 0; g < 8000; g++) {
      for (const q of (s.revealQueue ?? [])) if (!lances.has(q.card.id)) lances.set(q.card.id, (q.bids ?? []).length)
      if (s.screen !== 'auction' && s.screen !== 'monte') break
      const m = `${s.screen}|${s.phase}|${s.sectorIdx}|${s.sectorCursor}|${s.revealIdx}|${s.monteIdx}`
      if (m === marca) { if (++parado > 3) break } else parado = 0
      marca = m
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_SEAL' }); continue }
      if (s.phase === 'reveal' || s.phase === 'resq_reveal') { s = st.reducer(s, { type: 'ADVANCE_REVEAL' }); continue }
      if (s.phase === 'tiebreak') { s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.screen === 'monte') { const a = s.monteOrder[s.monteIdx]; if (a == null || !s.monte.length) break; s = st.reducer(s, { type: 'MONTE_PICK', mgrId: a, cardId: s.monte[0].id }); continue }
      break
    }
    Math.random = original
    // soma por categoria de fama
    const cat = {}
    for (const [id, fama] of alvo) {
      const n = lances.get(id)
      if (n === undefined) continue // carta que nem chegou a ser revelada nesta leva
      const k = fama >= 5 ? 'lenda' : fama === 4 ? 'craque' : fama >= 2 ? 'bom' : 'perna'
      cat[k] = cat[k] ?? { vistas: 0, semLance: 0 }
      cat[k].vistas++
      if (n === 0) cat[k].semLance++
    }
    return cat
  }

  // mesma sala, mesmo acaso — só o PISO muda. 3 sementes pra não ler sorte.
  // Dois bolsos: o do jogo rápido (bot pobre) e o da Série A da carreira (230).
  const PISOS = [0, 10, 20, 30, 40, 50, 60, 80]
  const saida = []
  for (const caixa of [0, 230]) {
    const linhas = []
    for (const piso of PISOS) {
      const soma = {}
      for (const sem of [20260921, 777001, 424242]) {
        const c = joga(piso, sem, caixa)
        for (const k in c) { soma[k] = soma[k] ?? { vistas: 0, semLance: 0 }; soma[k].vistas += c[k].vistas; soma[k].semLance += c[k].semLance }
      }
      linhas.push({ piso, soma })
    }
    saida.push({ caixa, linhas })
  }
  return saida
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🔬 O PISO DA CARTA × OS LANCES DOS BOTS\n')
console.log('   Mesmo pregão, mesmo acaso, 3 salas de 8. A ÚNICA coisa que muda é o')
console.log('   PISO que a carta carrega (é o que a carreira põe da 2ª temporada em')
console.log('   diante). Número = % das cartas que ficaram SEM NENHUM LANCE.\n')
const CATS = [['lenda', '👑 lenda'], ['craque', '⭐ craque'], ['bom', '💎 bom'], ['perna', '🪵 perna-de-pau']]
for (const { caixa, linhas } of r) {
  console.log(`   ── bolso do bot: ${caixa === 0 ? 'o do jogo rápido (pobre)' : `${caixa} 🪙 (Série A da carreira)`} ──`)
  console.log('   piso │ ' + CATS.map(([, n]) => n.padEnd(14)).join('│ '))
  console.log('   ─────┼─' + CATS.map(() => '─'.repeat(14)).join('┼─'))
  for (const { piso, soma } of linhas) {
    const cels = CATS.map(([k]) => {
      const d = soma[k]
      if (!d || !d.vistas) return '—'.padEnd(14)
      return `${String(Math.round(100 * d.semLance / d.vistas)).padStart(3)}%  (${d.semLance}/${d.vistas})`.padEnd(14)
    })
    console.log(`   ${String(piso).padStart(4)} │ ${cels.join('│ ')}`)
  }
  console.log('')
}
console.log('\n   👉 Onde a coluna vira 100%, o piso passou do que o bot aceita pagar —')
console.log('      e aí ele NÃO dá lance nenhum (regra `cap + 3 < floor` no cpuEnvelope).\n')
