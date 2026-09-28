// ─── 🛡️ MOCKUP · "ESCUDO PARECIDO" DO LEILÃO DE CLUBES (exemplo: Flamengo) ─────
// Diego (28/09) quis escudo OFICIAL no Leilão de Clubes; avisei do risco de marca
// registrada e ofereci o caminho 2 — desenho PRÓPRIO copiando forma, cores e
// disposição do escudo real, sem o logo. Ele pediu: *"dá um exemplo do 2 no
// Flamengo"*. Aqui: o selo de hoje (estilo B, a peça real do jogo) × o parecido.
// uso: node scripts/mockup-escudo-parecido.mjs [--porta 5297] [--saida arquivo.png]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5297'), SAIDA = arg('saida', 'mockups/escudo-parecido-flamengo.png')
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const fim = c => { try { process.kill(-vite.pid) } catch {} ; process.exit(c) }
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORTA}/`)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }

// 🛡️ o "parecido" do Flamengo: escudo de ponta, faixas horizontais rubro-negras,
// faixa preta em cima com o nome, estrela e o ano — sem o monograma oficial.
const FLA = (s) => `<svg width="${s}" height="${Math.round(s * 1.18)}" viewBox="0 0 200 236" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="corpo"><path d="M20 58 H180 V150 C180 196 140 220 100 232 C60 220 20 196 20 150 Z"/></clipPath></defs>
  <path d="M100 4 l6.5 13.2 14.6 2.1 -10.6 10.3 2.5 14.5 -13 -6.9 -13 6.9 2.5 -14.5 -10.6 -10.3 14.6 -2.1 z" fill="#FFC400" stroke="#0C0C0C" stroke-width="3" stroke-linejoin="round"/>
  <g clip-path="url(#corpo)">
    ${[0,1,2,3,4,5,6].map(i => `<rect x="20" y="${92 + i*20}" width="160" height="20" fill="${i%2===0?'#C8102E':'#111'}"/>`).join('')}
    <rect x="20" y="58" width="160" height="34" fill="#111"/>
  </g>
  <path d="M20 58 H180 V150 C180 196 140 220 100 232 C60 220 20 196 20 150 Z" fill="none" stroke="#0C0C0C" stroke-width="7"/>
  <path d="M20 58 H180 V150 C180 196 140 220 100 232 C60 220 20 196 20 150 Z" fill="none" stroke="#fff" stroke-width="2.5" transform="translate(100 145) scale(.94) translate(-100 -145)"/>
  <text x="100" y="85" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="21" letter-spacing="2" fill="#fff">FLAMENGO</text>
  <text x="100" y="${92+20*3+15}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="17" letter-spacing="3" fill="#fff" opacity=".9">1895</text>
</svg>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 620 }, deviceScaleFactor: 2 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(async (svgs) => {
  const fla = n => svgs[n]
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const S = await import('/src/escalacao/selo-clube.tsx')
  document.getElementById('root')?.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;color:#0C0C0C;font-family:system-ui'
  const w = document.createElement('div'); document.body.appendChild(w)
  w.innerHTML = `<div style="padding:26px 30px">
    <div style="display:inline-block;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;box-shadow:3px 3px 0 #0C0C0C;padding:5px 14px;font:700 13px Oswald;letter-spacing:1.2px">🧱 LEILÃO DE CLUBES · EXEMPLO</div>
    <h1 style="font:700 40px Oswald;text-transform:uppercase;margin:12px 0 18px">Flamengo: hoje × parecido com o oficial</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
      <div style="background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #0C0C0C;padding:18px;text-align:center">
        <p style="font:700 16px Oswald;margin:0 0 12px">HOJE · SELO (estilo B)</p><div id="hoje" style="display:flex;justify-content:center;height:250px;align-items:center"></div>
        <div id="hoje-mini" style="display:flex;justify-content:center;gap:12px;align-items:center;margin-top:10px"></div></div>
      <div style="background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #0C0C0C;padding:18px;text-align:center">
        <p style="font:700 16px Oswald;margin:0 0 12px">PROPOSTA · ESCUDO PARECIDO</p><div style="display:flex;justify-content:center;height:250px;align-items:center">${fla(200)}</div>
        <div style="display:flex;justify-content:center;gap:12px;align-items:center;margin-top:10px">${fla(40)}${fla(28)}<span style="font-size:12px;font-weight:700;opacity:.6">tamanhos da lista</span></div></div>
    </div>
    <p style="font-size:13px;font-weight:700;opacity:.65;margin:16px 0 0">Forma, cores e faixas do escudo de verdade — mas o desenho é nosso: sem o monograma oficial.</p></div>`
  createRoot(document.getElementById('hoje')).render(React.createElement(S.SeloClube, { clube: 'Flamengo', size: 220 }))
  createRoot(document.getElementById('hoje-mini')).render(React.createElement(React.Fragment, null, React.createElement(S.SeloClube, { clube: 'Flamengo', size: 40 }), React.createElement(S.SeloClube, { clube: 'Flamengo', size: 28 }), React.createElement('span', { style: { fontSize: 12, fontWeight: 700, opacity: .6 } }, 'tamanhos da lista')))
  await document.fonts.ready; await new Promise(r => setTimeout(r, 500))
}, { 200: FLA(200), 40: FLA(40), 28: FLA(28) })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close(); console.log('✅', SAIDA); fim(0)
