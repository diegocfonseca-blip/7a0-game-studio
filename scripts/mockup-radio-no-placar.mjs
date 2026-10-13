#!/usr/bin/env node
// ─── 📻 MOCKUP — UMA FRASE DA RÁDIO DENTRO DO PLACAR (13/10) ─────────────────
// Diego achou rádio + termômetro informação demais (*"tem a tática, a tabela, os jogos… tô na dúvida das informações"*).
// Proposta enxuta: nada de caixa nova — UMA linha dentro do placar real, entre a faixa da bola e os autores dos gols,
// trocando sozinha a cada lance. Termômetro fora. Fotos: HOJE · COM A FRASE (52′) · COM A FRASE (61′).
// uso: node scripts/mockup-radio-no-placar.mjs [--porta 5254]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5254')
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const MONTA = `
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;padding:16px;font-family:Inter,system-ui;color:#0C0C0C'
  const OSW = { fontFamily: 'Oswald, sans-serif' }
  const goals = [{ name: 'Romário', min: 23, home: true }, { name: 'Cristiano Ronaldo', min: 44, home: false }]
  const placar = min => h(P.LiveScoreCard, { homeName: 'K9 FC', awayName: 'Fabulous EC', homeColor: '#1B3A6B', awayColor: '#C2452F', youIsHome: true, goals, roundKey: 7, roundMs: 30000, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Kelvin', awayOwner: 'Fabulous', displayMinute: min })
  const TELAS = [
    { id: 't0', min: 61, rot: 'HOJE', sub: 'Como está no ar.', frase: null },
    { id: 't1', min: 52, rot: 'COM A FRASE · 52′', sub: 'Uma linha só, dentro do placar.', frase: ['52′', '🪵', 'NA TRAVE! Edmundo bate de fora e o poste do Fabulous treme até agora.'] },
    { id: 't2', min: 61, rot: 'COM A FRASE · 61′', sub: 'No lance seguinte, ela troca sozinha.', frase: ['61′', '🧤', 'Defesaça! O goleiro do Fabulous voa no ângulo.'] },
  ]
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h('div', null,
    h('h1', { style: { ...OSW, fontWeight: 700, fontSize: 30, textTransform: 'uppercase', margin: '0 0 4px' } }, '📻 Uma frase da rádio ', h('span', { style: { color: '#C2452F' } }, 'dentro do placar')),
    h('p', { style: { font: '600 13px Inter', color: '#53534b', margin: '0 0 16px' } }, 'Sem caixa nova e sem termômetro. A tela fica do tamanho de hoje: tática, tabela e jogos continuam onde estão.'),
    h('div', { style: { display: 'flex', gap: 20, alignItems: 'flex-start' } }, ...TELAS.map(t => h('div', { key: t.id, style: { width: 380 } },
      h('b', { style: { ...OSW, fontSize: 20, display: 'block' } }, t.rot), h('p', { style: { font: '600 12px Inter', color: '#53534b', margin: '2px 0 8px' } }, t.sub),
      h('div', { id: t.id, 'data-frase': t.frase ? JSON.stringify(t.frase) : '', style: { border: '4px solid #000', borderRadius: 28, boxShadow: '6px 6px 0 #000', padding: 10, background: '#F4ECD6' } }, placar(t.min)))))))
  await new Promise(r => setTimeout(r, 9000))
  document.fonts && await document.fonts.ready
  // injeta a linha da rádio antes da faixa dos autores dos gols (a que contém "Romário")
  for (const el of document.querySelectorAll('[data-frase]')) {
    const f = el.getAttribute('data-frase'); if (!f) continue
    const [m, ic, txt] = JSON.parse(f)
    // a faixa dos autores dos gols: o MENOR elemento que contém os dois nomes
    const cands = [...el.querySelectorAll('div,section,footer')].filter(n => (n.textContent||'').includes('Romário') && (n.textContent||'').includes('Cristiano') && !(n.textContent||'').includes('Kelvin'))
    const row = cands.sort((a,b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0]
    if (!row || !row.parentElement) { console.log('sem alvo'); continue }
    const d = document.createElement('div')
    d.style.cssText = 'display:flex;align-items:center;gap:8px;padding:9px 14px;border-top:1px solid rgba(255,255,255,.12);background:rgba(255,196,0,.08);color:#fff;font:600 12.5px/1.3 Inter,sans-serif'
    d.innerHTML = '<span style="font:700 9px Oswald,sans-serif;letter-spacing:.12em;color:#0C0C0C;background:#FFC400;border-radius:5px;padding:2px 5px;flex:none">📻 RÁDIO</span><b style="font:700 13px Oswald,sans-serif;color:#FFC400;flex:none">' + m + '</b><span style="flex:none">' + ic + '</span><span>' + txt + '</span>'
    row.parentElement.insertBefore(d, row)
  }
`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1250, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
await p.screenshot({ path: 'scripts/mockups/radio-no-placar.png', fullPage: true })
console.log('📸 scripts/mockups/radio-no-placar.png')
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
