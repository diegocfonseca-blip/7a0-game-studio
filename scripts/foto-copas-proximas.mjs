#!/usr/bin/env node
// ─── 📸 AS 3 PEÇAS NOVAS DAS COPAS DO ONLINE, DE VERDADE (13/10) ─────────────
// Depois do mockup aprovado (`scripts/mockups/copas-proximos.png`): aqui são os componentes REAIS de
// `online-match-visual.tsx` — chaveamento desenhado, resumo da fase, campeão + artilheiro — montados com
// dados de exemplo e fotografados em largura de celular. Serve pra conferir o visual antes de publicar.
// uso: node scripts/foto-copas-proximas.mjs [--porta 5251] [--saida scripts/mockups]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5251'), SAIDA = arg('saida', 'scripts/mockups')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const MONTA = `
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const V = await import('/src/escalacao/online-match-visual.tsx')
  const E = await import('/src/escalacao/escudos.tsx')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;padding:12px;font-family:Inter,system-ui;color:#0C0C0C'
  const esc = (n, s) => h(E.Escudo, { nome: n, size: s })
  const T = ['Fabulous EC', 'Arrogantchi FC', 'K9 FC', 'Grêmio FBPA', 'Fala D10', 'Julia Barranquila', 'Real Madruga', 'La Bestia Negra', 'Leite de Verdade FC', 'Guimarães', 'Briga de Galo', 'Al Takhadao FC', 'Leão da Estradinha', 'Inter Vale', 'Marolados', 'Manfré FC']
  const lado = (n, gols, venceu, meu) => ({ nome: n, crest: esc(n, 16), gols, venceu, meu: !!meu })
  const oit = [[0,1,2,1],[2,3,1,1],[4,5,0,2],[6,7,3,0],[8,9,1,0],[10,11,0,2],[12,13,1,3],[14,15,0,1]].map(([a,b,ga,gb],i) => ({ key: 'o'+i, jogado: true, pens: i===1 ? 'pên. 4×3' : undefined, a: lado(T[a], ga, ga>gb || i===1, a===2), b: lado(T[b], gb, gb>ga && i!==1, b===2) }))
  const qua = [[0,2,0,1],[5,6,2,0],[8,11,1,0],[13,15,2,0]].map(([a,b,ga,gb],i) => ({ key: 'q'+i, jogado: true, a: lado(T[a], ga, ga>gb, a===2), b: lado(T[b], gb, gb>ga, b===2) }))
  const semi = [{ key: 's0', jogado: false, a: { nome: T[2], crest: esc(T[2],16), meu: true }, b: { nome: T[5], crest: esc(T[5],16) } }, { key: 's1', jogado: false, a: { nome: T[8], crest: esc(T[8],16) }, b: { nome: T[13], crest: esc(T[13],16) } }]
  const fases = [{ label: 'OITAVAS', estado: 'ok', jogos: oit }, { label: 'QUARTAS', estado: 'ok', jogos: qua }, { label: 'SEMI', estado: 'on', jogos: semi }, { label: 'FINAL', estado: '', jogos: [{ key: 'f', jogado: false, a: null, b: null }] }]
  const detalhe = (fi, ji) => h(V.CompetitionMatch, { home: 'K9 FC', away: 'Grêmio FBPA', homeCrest: esc('K9 FC', 26), awayCrest: esc('Grêmio FBPA', 26), homeScore: 1, awayScore: 1, mine: true, status: 'AGREGADO FINAL', detail: 'Pênaltis 4 × 3 · K9 FC avançou' })
  const chip = (n, meu) => ({ nome: n, crest: esc(n, 18), meu: !!meu })
  const resumo = h(V.ResumoFase, { titulo: 'OITAVAS ENCERRADAS', passaram: [0,2,5,6,8,11,13,15].map(i => chip(T[i], i===2)), cairam: [1,3,4,7,9,10,12,14].map(i => chip(T[i])), proxima: 'QUARTAS', seg: 3, total: 10, cor: '#2F6FDB' })
  const campeao = h(V.CampeaoCopaCard, { titulo: 'CAMPEÃO DA LIBERTADORES', nome: 'K9 FC', crest: esc('K9 FC', 64), meu: true, sub: '🎉 É VOCÊ! A taça é sua.', final: 'final: K9 FC 2 × 1 Leite de Verdade FC' })
  const art = h(V.ArtilheiroCopaCard, { titulo: 'ARTILHEIRO DA LIBERTADORES', linhas: [{ nome: 'Romário', clube: 'K9 FC', carta: 'Vasco 1997', gols: 7, crest: esc('K9 FC', 40), meu: true }, { nome: 'Luis Suárez', clube: 'Leite de Verdade FC', gols: 5, crest: esc('Leite de Verdade FC', 16) }, { nome: 'Reus', clube: 'Inter Vale', gols: 4, crest: esc('Inter Vale', 16) }] })
  const stage = (kids) => h('section', { className: 'll26-competition ll25-liberta-art', style: { borderRadius: 16, overflow: 'hidden' } }, h('div', { className: 'll26-competition-copy' }, h('small', null, 'LIBERTADORES'), h('h2', null, 'Quartas de final')), kids)
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h('div', { style: { width: 396 } },
    h('p', { style: { font: '700 12px Oswald', letterSpacing: '.12em', margin: '0 0 6px', color: '#53534b' } }, '1 · CHAVEAMENTO (abre o detalhe no toque)'),
    h(V.ChaveCopa, { fases, detalhe }),
    h('p', { style: { font: '700 12px Oswald', letterSpacing: '.12em', margin: '14px 0 6px', color: '#53534b' } }, '2 · RESUMO DA FASE (dentro do palco)'),
    stage(resumo),
    h('p', { style: { font: '700 12px Oswald', letterSpacing: '.12em', margin: '14px 0 6px', color: '#53534b' } }, '3 · FIM DA COPA'),
    campeao, art))
  await new Promise(r => setTimeout(r, 600))
  document.fonts && await document.fonts.ready
  const b = document.querySelector('.ll41-jogo.jogado.meu'); if (b) b.click()
  await new Promise(r => setTimeout(r, 300))
`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
await p.screenshot({ path: `${SAIDA}/copas-proximos-real.png`, fullPage: true })
console.log(`📸 ${SAIDA}/copas-proximos-real.png`)
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
