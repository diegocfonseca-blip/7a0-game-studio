// 📱 STORY DA EUROCOPA (31/10, Diego: "um post no Instagram também de stories"). 1080×1920, a cara do jogo (creme · borda
// preta · sombra dura · Oswald) com as telas DE VERDADE do túnel e da festa (scripts/mockups/eurocopa-*.png, tiradas da bancada).
//   node scripts/mockup-story-eurocopa.mjs   → scripts/posts/story-eurocopa.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/png;base64,${readFileSync(f).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFE14D', AZUL = '#0b2a7a', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const BAND = { Inglaterra: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', França: '🇫🇷', Espanha: '🇪🇸', Itália: '🇮🇹', Holanda: '🇳🇱', Alemanha: '🇩🇪', Portugal: '🇵🇹', Bélgica: '🇧🇪', Croácia: '🇭🇷', Dinamarca: '🇩🇰',
  Escócia: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Turquia: '🇹🇷', Suécia: '🇸🇪', Sérvia: '🇷🇸', Irlanda: '🇮🇪', Polônia: '🇵🇱', Rússia: '🇷🇺', Romênia: '🇷🇴', Noruega: '🇳🇴', Ucrânia: '🇺🇦',
  'Rep. Tcheca': '🇨🇿', Suíça: '🇨🇭', Áustria: '🇦🇹', Grécia: '🇬🇷' }
const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${CREME};font-family:Oswald,sans-serif;color:${INK};padding:70px 56px;display:flex;flex-direction:column}
.sel{align-self:flex-start;background:${AZUL};color:${GOLD};font-weight:700;font-size:30px;letter-spacing:3px;padding:10px 24px;border:5px solid ${INK};border-radius:14px;box-shadow:7px 7px 0 ${INK}}
h1{font-size:108px;font-weight:700;text-transform:uppercase;line-height:.9;margin:26px 0 10px;letter-spacing:-2px}h1 b{color:#1f4fd1}
.lead{font-size:34px;font-weight:500;line-height:1.3;color:#333}
.telas{display:flex;gap:22px;margin:34px 0 26px;justify-content:center}.telas img{width:440px;border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK}}
.fmt{display:flex;gap:14px;justify-content:center;margin-bottom:24px}.fmt div{background:#fff;border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:14px 18px;text-align:center;font-weight:700;font-size:32px;line-height:1.1}.fmt span{display:block;font-size:22px;font-weight:500;color:#555}
.band{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;font-size:54px;text-align:center;margin-bottom:10px}
.pe{margin-top:auto;text-align:center}.pe .l{font-size:52px;font-weight:700;text-transform:uppercase}.pe .l span{color:#C2452F}
.pe .s{display:inline-block;margin-top:14px;font-weight:700;font-size:34px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:16px;padding:12px 36px;box-shadow:7px 7px 0 ${INK}}
</style><body>
<div class="sel">🇪🇺 NOVO NAS SALAS</div>
<h1>Liga +<br><b>Eurocopa</b></h1>
<div class="lead">Acabou a liga? Escolhe uma <b>seleção da Europa</b>, convoca os 11 e disputa a Euro com a galera.</div>
<div class="telas"><img src="${img('scripts/mockups/eurocopa-tunel.png')}"><img src="${img('scripts/mockups/eurocopa-festa.png')}"></div>
<div class="fmt"><div>24<span>seleções</span></div><div>6 grupos<span>de 4</span></div><div>oitavas<span>até a final</span></div><div>jogo único<span>empate = pênaltis</span></div></div>
<div class="band">${Object.values(BAND).map(e => `<div>${e}</div>`).join('')}</div>
<div class="pe"><div class="l">⚽ Leilão <span>Legends</span></div><div class="s">leilaolegends.com</div></div>
</body>`
const tmp = `/tmp/story-euro-${process.pid}.html`; writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/posts/story-eurocopa.png' }); await b.close(); console.log('scripts/posts/story-eurocopa.png')
