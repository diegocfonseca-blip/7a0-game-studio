// ─── 🛡️ PROVA DE QUE O LEILÃO ÀS CEGAS NÃO FOI TOCADO ─────────────────────
//
// Ordem do Diego (20/09): *"tudo q estamos fazendo aqui, não mexa em nada o que
// já funciona no modo às cegas, pelo amor de Deus"*.
//
// Ler o diff e dizer "não mexi" não vale — é justamente assim que bug entra. Esta
// prova é diferente: ela **joga um pregão às cegas inteiro** com o acaso TRAVADO
// (o `Math.random` é substituído por um gerador de semente fixa, então o baralho,
// os bots, os lances e o sorteio saem sempre iguais) e imprime uma **impressão
// digital** do resultado — caixa, elenco e ordem de cada técnico no fim.
//
// Como usar a prova:
//   1. rode aqui, no código novo, e guarde o número;
//   2. rode no código ANTIGO (`git worktree add … <commit da main>`);
//   3. os dois números TÊM que ser idênticos.
// Se mudou um dígito, alguma coisa do modo às cegas mudou — e aí é pra parar.
//
// uso: node scripts/prova-as-cegas.mjs [--porta 5244]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5244')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')

  // 🎲 TRAVA O ACASO. O `START` sorteia a semente com `Math.random`, e daí saem o
  // baralho, a formação dos bots e tudo o mais. Trocando o `Math.random` por um
  // gerador de semente fixa, o pregão inteiro vira repetível — é isso que permite
  // comparar duas versões do código.
  const semente = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
  const original = Math.random

  const joga = (rivais, formacao, liga) => {
    Math.random = semente(20260920)
    let s = st.reducer(st.INITIAL, { type: 'START', teamName: 'Prova', formation: formacao, rivals: rivais, league: liga })
    let marca = '', parado = 0
    for (let g = 0; g < 6000; g++) {
      if (s.screen !== 'auction' && s.screen !== 'monte') break
      const m = `${s.screen}|${s.phase}|${s.sectorIdx}|${s.sectorCursor}|${s.revealIdx}|${s.monteIdx}`
      if (m === marca) { if (++parado > 3) break } else parado = 0
      marca = m
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_SEAL' }); continue }
      if (s.phase === 'reveal' || s.phase === 'resq_reveal') { s = st.reducer(s, { type: 'ADVANCE_REVEAL' }); continue }
      if (s.phase === 'tiebreak') { s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.screen === 'monte') { const alvo = s.monteOrder[s.monteIdx]; if (alvo == null || !s.monte.length) break; s = st.reducer(s, { type: 'MONTE_PICK', mgrId: alvo, cardId: s.monte[0].id }); continue }
      break
    }
    Math.random = original
    // 🖐️ A IMPRESSÃO DIGITAL: tudo que o pregão decidiu, na ordem, em texto.
    // Caixa, e o elenco de cada um com nome/clube/ano/posição/preço pago.
    const linhas = s.managers.map(m => [
      // ⚠️ O NOME DO TIME ENTRA NA DIGITAL — e isso faz a digital mudar quando um
      // BATISMO toma o assento de outro clube na Série A, sem que o jogo tenha
      // mudado nada. Aconteceu em 21/09 (Grêmio FBPA no assento do SC Ferrari).
      // NÃO é motivo pra pânico, mas também não se aceita de olho fechado: o
      // jeito de provar é rodar esta mesma prova com o nome FORA da conta, no
      // código de antes e no de agora — se as duas baterem, o pregão fechou
      // igualzinho e só a plaquinha mudou. Em 21/09 bateu (2256464b · aca7a932
      // · 83793089 nos dois lados).
      m.teamName, m.money,
      m.squad.map(c => `${c.name}|${c.club}|${c.year}|${c.pos}|${c.buyPrice ?? 0}|${c.via ?? ''}`).join(','),
    ].join('§'))
    return { texto: linhas.join('\n'), tela: s.screen, cartas: s.managers.reduce((t, m) => t + m.squad.length, 0) }
  }

  // três pregões diferentes: sala pequena, sala grande e baralho europeu.
  const casos = [
    ['sala de 6 · 4-3-3 · BR', joga(5, '4-3-3', 'br')],
    ['sala de 8 · 4-4-2 · BR', joga(7, '4-4-2', 'br')],
    ['sala de 12 · 4-3-3 · Europa', joga(11, '4-3-3', 'eu')],
  ]

  // 🔢 número curto pra comparar a olho (FNV-1a sobre a impressão digital)
  const digital = (txt) => { let h = 0x811c9dc5; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 0x01000193) } return (h >>> 0).toString(16).padStart(8, '0') }

  return casos.map(([nome, res]) => ({ nome, hash: digital(res.texto), tela: res.tela, cartas: res.cartas, bytes: res.texto.length }))
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🛡️ PROVA: O LEILÃO ÀS CEGAS NÃO MUDOU\n')
console.log('   Cada linha é um pregão às cegas INTEIRO, jogado com o acaso travado.')
console.log('   A "digital" resume caixa + elenco + preço pago de todos os técnicos.\n')
console.log('   pregão                        │ digital  │ cartas │ terminou em')
console.log('   ──────────────────────────────┼──────────┼────────┼────────────')
for (const c of r) {
  console.log(`   ${c.nome.padEnd(29)} │ ${c.hash} │ ${String(c.cartas).padStart(6)} │ ${c.tela}`)
}
console.log('\n   👉 Rode isto no código ANTIGO também. As três digitais têm que bater.')
console.log('      git worktree add /tmp/antes <commit>  &&  cd /tmp/antes && npm i && node scripts/prova-as-cegas.mjs\n')
