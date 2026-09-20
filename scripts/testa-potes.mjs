// ─── 🏺 TRAVA: OS 4 POTES DA COPA DO MUNDO ──────────────────────────────────
//
// Diego (20/09): *"a Copa do Mundo deveria sempre ter os países mais fortes
// sendo cabeça de chave, seja em qualquer modo. Não acha não?"*
//
// Achava. O sorteio era um EMBARALHAMENTO CRU das 24 seleções, cortado em 6
// grupos de 4 — sem pote nenhum. Medido em 20 mil Copas do jeito velho:
//   · 63,8% tinham DUAS das 4 mais fortes no mesmo grupo
//   · 4,4% tinham TRÊS juntas
//   · 6,6% das vezes um time do meio pegava 2 gigantes de uma vez
//
// Agora são **4 potes de 6** (o formato de Copa de 24 de verdade): o pote 1 é
// uma por grupo, e dois cabeças de chave nunca se cruzam antes do mata-mata.
//
// Esta trava confere as DUAS coisas que importam:
//   1. o sorteio novo cumpre o que promete (e continua sendo SORTEIO, não fila);
//   2. 🔒 a Copa que já estava ROLANDO não muda — é o estrago de 04/08 ("mudou
//      o resultado da Copa"), e aqui ele seria pior: o chaveamento inteiro.
//
// uso: node scripts/testa-potes.mjs [--porta 5256]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5256')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const cm = await import('/src/escalacao/copa-mundo.tsx')
  const on = await import('/src/escalacao/copa-mundo-online.tsx')
  const f = []
  const ok = (c, m) => { if (!c) f.push(m) }

  // 24 seleções de mentira, com força DECRESCENTE (a 0 é a mais forte)
  const mesa = (n = 24) => Array.from({ length: n }, (_, i) => ({
    club: `T${i}`, you: false, pais: `P${i}`, str: 100 - i * 2,
    xi: Array.from({ length: 11 }, (_, k) => ({ name: `J${i}-${k}`, club: `T${i}`, year: 2000, pos: 'MEI', fame: 2, lo: 60, hi: 70 })),
  }))

  const grupoDe = (mundo, t) => mundo.groups.findIndex(g => g.teams.includes(t))
  const medir = (potes, voltas = 400) => {
    let doisGigantes = 0, tresGigantes = 0, poteUmJunto = 0
    for (let s = 0; s < voltas; s++) {
      const w = cm.simulaCopaMundo(mesa(), s * 7919 + 13, 1, potes)
      const gig = [0, 1, 2, 3].map(t => grupoDe(w, t))
      const p1 = Array.from({ length: 6 }, (_, t) => grupoDe(w, t))
      const conta = a => { const m = {}; for (const g of a) m[g] = (m[g] ?? 0) + 1; return Object.values(m) }
      const c = conta(gig)
      if (c.some(v => v >= 2)) doisGigantes++
      if (c.some(v => v >= 3)) tresGigantes++
      if (conta(p1).some(v => v >= 2)) poteUmJunto++
    }
    return { doisGigantes: doisGigantes / voltas, tresGigantes: tresGigantes / voltas, poteUmJunto: poteUmJunto / voltas }
  }

  // 1️⃣ O JEITO VELHO continua existindo e continua ruim (é a régua da medida)
  const velho = medir(false)
  ok(velho.doisGigantes > 0.4, `o sorteio velho devia juntar gigantes com frequência e deu ${(100 * velho.doisGigantes).toFixed(1)}% — a medida não está medindo`)

  // 2️⃣ O JEITO NOVO: os 6 do POTE 1 NUNCA caem no mesmo grupo
  const novo = medir(true)
  ok(novo.poteUmJunto === 0, `⚠️ dois cabeças de chave caíram no mesmo grupo em ${(100 * novo.poteUmJunto).toFixed(1)}% das Copas — o pote 1 tem que ser UM por grupo`)
  ok(novo.tresGigantes === 0, 'três das 4 mais fortes ainda caem juntas no sorteio novo')
  ok(novo.doisGigantes < velho.doisGigantes, `o sorteio novo não melhorou nada (velho ${(100 * velho.doisGigantes).toFixed(1)}% × novo ${(100 * novo.doisGigantes).toFixed(1)}%)`)

  // 3️⃣ E CONTINUA SENDO SORTEIO: o mesmo cabeça de chave não mora sempre no
  //    mesmo grupo (senão vira fila, e a Copa fica igual todo ano)
  const ondeCaiu = new Set()
  for (let s = 0; s < 60; s++) ondeCaiu.add(grupoDe(cm.simulaCopaMundo(mesa(), s * 104729 + 3, 1, true), 0))
  ok(ondeCaiu.size >= 5, `a seleção mais forte caiu em só ${ondeCaiu.size} grupo(s) diferentes em 60 Copas — virou fila, não sorteio`)

  // 4️⃣ TODO MUNDO JOGA: 6 grupos de 4, ninguém de fora, ninguém repetido
  {
    const w = cm.simulaCopaMundo(mesa(), 12345, 1, true)
    const todos = w.groups.flatMap(g => g.teams)
    ok(w.groups.length === 6, `saíram ${w.groups.length} grupos em vez de 6`)
    ok(w.groups.every(g => g.teams.length === 4), 'tem grupo que não ficou com 4')
    ok(new Set(todos).size === 24, `${new Set(todos).size} seleções no chaveamento em vez de 24 — alguém sumiu ou repetiu`)
  }

  // 5️⃣ 🔒 A COPA QUE JÁ ESTAVA ROLANDO NÃO MUDA.
  //    O padrão da função é SEM potes, e a bandeira só liga por quem chama.
  {
    const a = cm.simulaCopaMundo(mesa(), 777, 2)          // como era antes da mudança
    const b2 = cm.simulaCopaMundo(mesa(), 777, 2, false)  // idem, explícito
    ok(JSON.stringify(a.groups.map(g => g.teams)) === JSON.stringify(b2.groups.map(g => g.teams)),
      '⚠️ o sorteio VELHO mudou — Copa em andamento trocaria de chaveamento no meio do caminho (o estrago de 04/08)')
    const c = cm.simulaCopaMundo(mesa(), 777, 2, true)
    ok(JSON.stringify(a.groups.map(g => g.teams)) !== JSON.stringify(c.groups.map(g => g.teams)),
      'ligar os potes não mudou nada — a bandeira não está chegando no sorteio')
  }

  // 6️⃣ QUEM DECIDE É A DATA DE NASCIMENTO DA COPA (online)
  {
    ok(on.copaTemPotes(new Date(on.POTES_DESDE + 60_000).toISOString()) === true, 'Copa criada DEPOIS da mudança não pegou os potes')
    ok(on.copaTemPotes(new Date(on.POTES_DESDE - 60_000).toISOString()) === false, '⚠️ Copa criada ANTES da mudança pegou os potes — ela trocaria de chaveamento no meio')
    ok(on.copaTemPotes(null) === false, 'sala sem data de criação tem que cair no sorteio velho (é o seguro)')
    ok(on.copaTemPotes(undefined) === false, 'leitura sem `criada_em` tem que cair no sorteio velho')
  }

  return { falhas: f, velho, novo }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

const pc = v => `${(100 * v).toFixed(1)}%`
console.log('\n🏺 OS 4 POTES DA COPA DO MUNDO · cabeça de chave em qualquer modo\n')
console.log('   o que acontecia × o que acontece agora (400 Copas de cada):\n')
console.log('                                        │ antes   │ agora')
console.log('   ─────────────────────────────────────┼─────────┼────────')
console.log(`   2 das 4 mais fortes no mesmo grupo   │ ${pc(r.velho.doisGigantes).padStart(7)} │ ${pc(r.novo.doisGigantes).padStart(6)}`)
console.log(`   3 das 4 mais fortes juntas           │ ${pc(r.velho.tresGigantes).padStart(7)} │ ${pc(r.novo.tresGigantes).padStart(6)}`)
console.log(`   2 cabeças de chave no mesmo grupo    │ ${pc(r.velho.poteUmJunto).padStart(7)} │ ${pc(r.novo.poteUmJunto).padStart(6)}\n`)
if (r.falhas.length) {
  for (const x of r.falhas) console.log(`   🔴 ${x}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ pote 1 é um por grupo · continua sendo sorteio (não vira fila) ·')
console.log('   as 24 entram, ninguém some nem repete ·')
console.log('   e a Copa que já estava rolando termina com o sorteio velho.\n')
