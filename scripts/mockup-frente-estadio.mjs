// 🚌 MOCKUP · FRENTE DO ESTÁDIO COM PISTA PARALELA DE DESEMBARQUE (04/11). Diego: *"ponto de ônibus não deveria tá dentro do terreno…
// tipo uma rua duplicada pra ônibus parar na lateral, ou carro desembarcar pessoas tipo táxi, ou descargas… mas a rua continuar sem
// travar trânsito… depois quando seguisse ia pra frente e se juntava de volta à rua principal"* (foto da Av. das Américas).
// uso: node scripts/mockup-frente-estadio.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C'
const estadio = `<ellipse cx="450" cy="120" rx="250" ry="95" fill="#cfc6b2" stroke="${INK}" stroke-width="4"/><rect x="340" y="75" width="220" height="90" rx="8" fill="#3f8f43" stroke="#fff" stroke-width="3"/><line x1="450" y1="75" x2="450" y2="165" stroke="#fff" stroke-width="2"/><circle cx="450" cy="120" r="16" fill="none" stroke="#fff" stroke-width="2"/>`
const terreno = `<rect x="40" y="20" width="820" height="330" fill="#b39b6b"/>`
const rua = (y) => `<rect x="0" y="${y}" width="900" height="70" fill="#4a4d52"/><line x1="0" y1="${y + 35}" x2="900" y2="${y + 35}" stroke="#f4ecd6" stroke-width="3" stroke-dasharray="22 16"/>`
const seta = (x, y, dir = 1) => `<path d="M${x} ${y} l${30 * dir} 0 m${-10 * dir} -7 l${10 * dir} 7 l${-10 * dir} 7" stroke="#fff" stroke-width="3" fill="none"/>`
const onibus = (x, y, c = '#1B7A3D') => `<rect x="${x}" y="${y}" width="56" height="20" rx="4" fill="${c}" stroke="${INK}" stroke-width="2.5"/><rect x="${x + 6}" y="${y + 4}" width="40" height="6" fill="#d8eef0"/>`
const carro = (x, y, c) => `<rect x="${x}" y="${y}" width="26" height="15" rx="4" fill="${c}" stroke="${INK}" stroke-width="2"/>`
const antes = `<svg viewBox="0 0 900 470" width="100%">${terreno}${estadio}
 <path d="M150 370 C 120 330, 90 300, 140 280 S 260 300, 230 250 S 120 220, 160 200" fill="none" stroke="#4a4d52" stroke-width="22"/>
 ${onibus(150, 255)}<rect x="135" y="190" width="40" height="14" fill="#e8e1cf" stroke="${INK}" stroke-width="2"/>
 <rect x="600" y="230" width="210" height="110" fill="#a38a59" stroke="${INK}" stroke-width="2" stroke-dasharray="6 4"/><text x="705" y="290" text-anchor="middle" font="700 15px Oswald" style="font:700 15px Oswald" fill="${INK}">ESTACIONAMENTO</text>
 <path d="M450 215 L450 360" stroke="#96815f" stroke-width="14"/><path d="M450 300 L300 250 M450 300 L600 260" stroke="#96815f" stroke-width="8"/>
 ${rua(370)}${seta(700, 388)}${seta(200, 423, -1)}
 <text x="160" y="345" style="font:700 14px system-ui" fill="#C2452F">ônibus entra no terreno e dá a volta</text></svg>`
const depois = `<svg viewBox="0 0 900 470" width="100%">${terreno}${estadio}
 <rect x="600" y="175" width="210" height="100" fill="#a38a59" stroke="${INK}" stroke-width="2" stroke-dasharray="6 4"/><text x="705" y="230" text-anchor="middle" style="font:700 15px Oswald" fill="${INK}">ESTACIONAMENTO</text>
 <path d="M450 215 L450 330" stroke="#96815f" stroke-width="14"/>
 <rect x="60" y="328" width="780" height="14" fill="#e8e1cf" stroke="${INK}" stroke-width="2"/>
 <path d="M70 370 C 150 370, 160 342, 230 342 L 690 342 C 760 342, 770 370, 850 370 L 850 380 L 70 380 Z" fill="#5a5d62"/>
 <path d="M240 361 L 680 361" stroke="#FFC400" stroke-width="2.5" stroke-dasharray="10 8"/>
 <path d="M160 368 L 760 368" stroke="#e8e1cf" stroke-width="4"/>
 ${rua(380)}${seta(720, 398)}${seta(200, 433, -1)}
 ${onibus(270, 344)}${onibus(345, 344, '#2E6FB5')}
 <rect x="275" y="318" width="120" height="10" fill="#6b6b6b" stroke="${INK}" stroke-width="2"/>
 ${carro(470, 346, '#FFC400')}${carro(505, 346, '#FFC400')}${carro(560, 346, '#e8e1cf')}
 <rect x="600" y="343" width="44" height="17" rx="3" fill="#8a5a3a" stroke="${INK}" stroke-width="2"/>
 ${seta(100, 360)}${seta(780, 360)}
 <path d="M720 342 L720 275" stroke="#5a5d62" stroke-width="20"/><rect x="706" y="300" width="28" height="5" fill="#C2452F"/>
 <path d="M720 336 L720 330" stroke="#fff" stroke-width="3"/><path d="M713 333 l7 -9 l7 9" stroke="#fff" stroke-width="3" fill="none"/>
 <path d="M622 342 C 622 300, 560 250, 470 232" fill="none" stroke="#5a5d62" stroke-width="9" stroke-dasharray="2 0"/><path d="M622 342 C 622 300, 560 250, 470 232" fill="none" stroke="#FFC400" stroke-width="2" stroke-dasharray="8 6"/>
 <rect x="460" y="222" width="70" height="24" fill="#e8e1cf" stroke="${INK}" stroke-width="2"/><text x="495" y="238" text-anchor="middle" style="font:700 10px system-ui" fill="${INK}">BARRACAS</text>
 <g style="font:700 12px system-ui" fill="${INK}"><text x="736" y="300">🅿️ entrada do</text><text x="736" y="314">estacionamento</text><text x="440" y="292">🚐 portão de serviço</text><text x="440" y="306">(Kombi dos ambulantes)</text></g>
 <g style="font:700 13px system-ui" fill="${INK}"><text x="282" y="312">🚌 PONTO DE ÔNIBUS</text><text x="462" y="312">🚕 TÁXI / APP</text><text x="596" y="312">📦 CARGA</text></g>
 <text x="70" y="465" style="font:700 14px system-ui" fill="#1B7A3D">a pista paralela abre antes do estádio e volta pra avenida depois — a avenida segue sem parar</text></svg>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:24px;width:1000px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.75;font-size:14px;line-height:1.5}
.box{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:12px;margin-bottom:18px}
.tag{display:inline-block;font:700 15px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:2px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:8px}
ul{margin:8px 0 0;padding-left:20px;font-weight:700;font-size:13.5px;line-height:1.6}</style></head><body>
<h1>🚌 Frente do estádio · pista paralela de desembarque</h1>
<p class="sub">Inspirado na Av. das Américas: a avenida segue reta e uma pista colada no terreno recebe ônibus, táxi e carga, e devolve pra avenida depois.</p>
<div class="box"><span class="tag" style="background:#e6dcbf">HOJE</span>${antes}</div>
<div class="box"><span class="tag" style="background:#FFC400">PROPOSTA</span>${depois}
<ul><li>A avenida não muda: o trânsito passa direto, sem parar.</li><li>A pista paralela abre um pouco antes, corre colada na calçada do estádio e volta pra avenida depois.</li>
<li>Nela param: 🚌 ônibus (com abrigo na calçada) · 🚕 táxi e carro de aplicativo desembarcando · 📦 carga e descarga.</li>
<li>O caminho em curva do ônibus dentro do terreno SAI; a torcida desce na calçada e vai a pé direto pro portão.</li><li>🅿️ <b>Carro de torcedor</b>: segue a pista paralela até o fim e entra no estacionamento por uma entrada própria, com cancela; na saída volta pela mesma pista pra avenida.</li><li>🚐 <b>Kombi dos ambulantes</b>: para na vaga de carga, entra por um portão de serviço estreito até a praça das barracas, monta e sai pelo mesmo portão (que fecha na hora do jogo).</li></ul></div>
</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/frente-estadio-pista-paralela.png', fullPage: true }); await br.close()
console.log('scripts/mockups/frente-estadio-pista-paralela.png')
