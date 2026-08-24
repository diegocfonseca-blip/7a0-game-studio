// ─── 📲 STORY 9:16 · ASSISTÊNCIAS (24/08) ────────────────────────────────────
// Arte vertical (1080×1920) pro Diego postar quando as assistências subirem.
//   node scripts/story-assistencias.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'story-assistencias.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', AZUL = '#2F6BAE'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// gols REAIS de uma partida da simulação
const GOLS = [['Amoroso', "7'", null], ['Amoroso', "54'", 'Jardel'], ['França', "90+2'", 'Casemiro'], ['Bismarck', "90+3'", 'Jardel']]

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;width:1080px;height:1920px;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};overflow:hidden}
.wrap{position:relative;height:100%;padding:74px 66px;display:flex;flex-direction:column}
.marca{${OSW};font-size:38px;text-align:center}
.marca b{color:#C2452F}
.tag{display:block;width:fit-content;margin:44px auto 0;background:${AZUL};color:#fff;${OSW};font-size:28px;letter-spacing:.12em;padding:12px 30px;border-radius:999px;border:5px solid ${INK};box-shadow:8px 8px 0 ${INK};text-transform:uppercase}
h1{${OSW};font-size:112px;line-height:.94;text-transform:uppercase;text-align:center;margin:40px 0 0}
h1 span{color:#C2452F}
.sub{font-weight:700;font-size:33px;line-height:1.4;text-align:center;color:rgba(12,12,12,.75);margin:34px auto 0;max-width:840px}
.placar{background:#fff;border:7px solid ${INK};border-radius:34px;box-shadow:12px 12px 0 ${INK};overflow:hidden;margin-top:52px}
.pl-top{display:flex;align-items:center;justify-content:center;gap:26px;padding:26px;background:#F7F1DD;border-bottom:5px solid ${INK}}
.pl-top b{${OSW};font-size:34px}
.pl-top .n{${OSW};font-size:56px}
.gol{display:flex;align-items:center;gap:14px;padding:18px 28px;font-size:29px;font-weight:800;border-top:3px solid rgba(0,0,0,.1)}
.gol .as{color:${AZUL};font-weight:800}
.gol .ind{margin-left:auto;font-size:22px;font-weight:700;color:rgba(12,12,12,.42)}
.chips{display:flex;gap:20px;margin-top:44px}
.chips div{flex:1;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:22px 18px;text-align:center}
.chips b{display:block;${OSW};font-size:52px;line-height:1}
.chips span{font-weight:700;font-size:22px;line-height:1.3;color:rgba(12,12,12,.7)}
.rod{margin-top:auto;text-align:center}
.rod .cta{background:${GOLD};border:7px solid ${INK};border-radius:28px;box-shadow:10px 10px 0 ${INK};${OSW};font-size:44px;text-transform:uppercase;padding:30px}
.rod .site{font-weight:800;font-size:28px;color:rgba(12,12,12,.6);margin-top:26px}
</style>
<div class="wrap">
  <div class="marca">⚽ Leilão <b>Legends</b></div>
  <span class="tag">🅰️ novidade na carreira</span>
  <h1>O gol tem pai.<br><span>Agora tem<br>padrinho.</span></h1>
  <p class="sub">Chegaram as <b>assistências</b>. O meião que ganha campeonato sem fazer gol finalmente tem número.</p>

  <div class="placar">
    <div class="pl-top"><b>Prestígio FC</b><span class="n">3 × 1</span><b>Aurora Suprema</b></div>
    ${GOLS.map(([n, m, a]) => `<div class="gol"><span>⚽</span><b>${n}</b><span style="opacity:.55;font-weight:700">${m}</span>${a ? `<span class="as">🅰️ ${a}</span>` : '<span class="ind">jogada individual</span>'}</div>`).join('')}
  </div>

  <div class="chips">
    <div><b style="color:${AZUL}">75%</b><span>dos gols saem de um passe — igual no futebol de verdade</span></div>
    <div><b style="color:${GREEN}">TOP 5</b><span>tabela de garçons em cada série</span></div>
  </div>

  <div class="rod">
    <div class="cta">⚽ leilaolegends.com</div>
    <p class="site">grátis, direto do navegador · @leilaolegendscom</p>
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
