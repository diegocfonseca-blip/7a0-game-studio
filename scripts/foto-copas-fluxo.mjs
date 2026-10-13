#!/usr/bin/env node
// ─── 📸 O FLUXO DA COPA NA SALA, COM AS PEÇAS REAIS (13/10) ──────────────────
// Diego: *"mostre aí as telas como seria pra eu ver"* — a pergunta era se faz sentido ter chave desenhada E resumo da
// fase. Três telas de celular, lado a lado, montadas com os componentes de verdade (abertura, chave, resumo, placar):
//   1. virada de fase SÓ com a abertura (proposta: sem resumo) · 2. bola rolando · 3. virada de fase COM o resumo (hoje)
// uso: node scripts/foto-copas-fluxo.mjs [--porta 5252] [--saida scripts/mockups]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5252'), SAIDA = arg('saida', 'scripts/mockups')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const MONTA = `
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const V = await import('/src/escalacao/online-match-visual.tsx')
  const E = await import('/src/escalacao/escudos.tsx')
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;padding:16px;font-family:Inter,system-ui;color:#0C0C0C'
  const esc = (n, s) => h(E.Escudo, { nome: n, size: s })
  const T = ['Fabulous EC', 'Arrogantchi FC', 'K9 FC', 'Grêmio FBPA', 'Fala D10', 'Julia Barranquila', 'Real Madruga', 'La Bestia Negra', 'Leite de Verdade FC', 'Guimarães', 'Briga de Galo', 'Al Takhadao FC', 'Leão da Estradinha', 'Inter Vale', 'Marolados', 'Manfré FC']
  const lado = (n, gols, venceu, meu) => ({ nome: n, crest: esc(n, 14), gols, venceu, meu: !!meu })
  const oit = [[0,1,2,1],[2,3,1,1],[4,5,0,2],[6,7,3,0],[8,9,1,0],[10,11,0,2],[12,13,1,3],[14,15,0,1]].map(([a,b,ga,gb],i) => ({ key: 'o'+i, jogado: true, pens: i===1 ? 'pên. 4×3' : undefined, a: lado(T[a], ga, ga>gb || i===1, a===2), b: lado(T[b], gb, gb>ga && i!==1, b===2) }))
  const quaPares = [[0,2],[5,6],[8,11],[13,15]]
  const qua = quaPares.map(([a,b],i) => ({ key: 'q'+i, jogado: false, a: { nome: T[a], crest: esc(T[a],14), meu: a===2 }, b: { nome: T[b], crest: esc(T[b],14), meu: b===2 } }))
  const vazios = n => Array.from({ length: n }, (_, i) => ({ key: 'v'+i, jogado: false, a: null, b: null }))
  const fases = [{ label: 'OITAVAS', estado: 'ok', jogos: oit }, { label: 'QUARTAS', estado: 'on', jogos: qua }, { label: 'SEMI', estado: '', jogos: vazios(2) }, { label: 'FINAL', estado: '', jogos: vazios(1) }]
  const chave = h(V.ChaveCopa, { fases })
  const caminho = [{ label: 'GRUPOS', estado: 'ok', meu: true }, { label: 'OITAVAS', estado: 'ok', meu: true }, { label: 'QUARTAS', estado: 'on', meu: true }, { label: 'SEMI', estado: '', meu: false }, { label: 'FINAL', estado: '', meu: false }]
  const confrontos = quaPares.map(([a,b]) => ({ home: T[a], away: T[b], mine: a===2 || b===2, homeCrest: esc(T[a], 30), awayCrest: esc(T[b], 30) }))
  const abertura = (seg, total) => h(V.AberturaCopa, { fases: caminho, confrontos, seg, total, cor: '#2F6FDB' })
  const chip = (n, meu) => ({ nome: n, crest: esc(n, 18), meu: !!meu })
  const resumo = h(V.ResumoFase, { titulo: 'OITAVAS ENCERRADAS', passaram: [0,2,5,6,8,11,13,15].map(i => chip(T[i], i===2)), cairam: [1,3,4,7,9,10,12,14].map(i => chip(T[i])), proxima: 'QUARTAS', seg: 7, total: 10, cor: '#2F6FDB' })
  const stage = (status, kids) => h(V.CompetitionStage, { kind: 'liberta', title: 'LIBERTADORES', phase: 'Quartas de Final', detail: 'Jogo de ida · 4 confrontos na fase', status }, kids)
  const goals = [{ name: 'Romário', min: 23, home: true }, { name: 'Cristiano Ronaldo', min: 44, home: false }]
  const placar = h(P.LiveScoreCard, { homeName: 'K9 FC', awayName: 'Fabulous EC', homeColor: '#1B3A6B', awayColor: '#C2452F', youIsHome: true, goals, roundKey: 7, roundMs: 30000, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Kelvin', awayOwner: 'Fabulous', displayMinute: 61 })
  const outros = quaPares.slice(1).map(([a,b], i) => h(V.CompetitionMatch, { key: i, home: T[a], away: T[b], homeCrest: esc(T[a], 26), awayCrest: esc(T[b], 26), homeScore: [1,0,2][i], awayScore: [0,0,1][i], status: "61′ · AO VIVO" }))
  const phone = (rotulo, sub, kids) => h('div', { style: { width: 380, flex: 'none' } },
    h('p', { style: { font: '700 20px Oswald', textTransform: 'uppercase', margin: '0 0 2px' } }, rotulo),
    h('p', { style: { font: '600 12px Inter', color: '#53534b', margin: '0 0 10px', minHeight: 32 } }, sub),
    h('div', { style: { border: '4px solid #000', borderRadius: 28, boxShadow: '6px 6px 0 #000', background: '#F4ECD6', padding: 10, overflow: 'hidden' } }, kids))
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h('div', null,
    h('h1', { style: { font: '700 34px Oswald', textTransform: 'uppercase', margin: '0 0 14px' } }, '🏆 A copa na sala, tela por tela ', h('span', { style: { color: '#C2452F' } }, '(Libertadores, quartas de final)')),
    h('div', { style: { display: 'flex', gap: 22, alignItems: 'flex-start' } },
      phone('1 · Virada de fase', 'PROPOSTA: só a abertura (caminho + confrontos + contagem) e a chave embaixo. A chave já conta quem passou e quem caiu.', h('div', null, stage('Próxima fase começa em 4s', abertura(4, 5)), chave)),
      phone('2 · Bola rolando', 'Como sempre: o seu placar grande ao vivo, os jogos dos outros rolando junto, e a chave embaixo pra consultar.', h('div', null, stage('Bola rolando · acompanhe os confrontos abaixo'), h('div', { style: { margin: '10px 0' } }, placar), h('div', { style: { display: 'grid', gap: 6 } }, outros), chave)),
      phone('3 · Virada de fase', 'HOJE: 5s de RESUMO (quem passou / quem caiu) antes da abertura — repete o que a chave logo abaixo já mostra.', h('div', null, stage('Próxima fase começa em 7s', resumo), chave)))))
  await new Promise(r => setTimeout(r, 900))
  document.fonts && await document.fonts.ready
`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1260, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
await p.screenshot({ path: `${SAIDA}/copas-fluxo.png`, fullPage: true })
console.log(`📸 ${SAIDA}/copas-fluxo.png`)
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
