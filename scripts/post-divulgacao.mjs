// ─── 📣 KIT DE DIVULGAÇÃO do Leilão Legends (28/08) ──────────────────────────
// Pedido do Diego: "um amigo quer divulgar o Leilão Legends e perguntou se tenho
// alguma imagem". Esta é a peça de APRESENTAÇÃO — pra quem NUNCA ouviu falar do
// jogo (diferente dos posts de novidade, que falam com quem já joga).
//
// Gera duas artes na identidade do jogo (creme/bordas pretas/Oswald):
//   • feed  1080×1080  → post no Instagram/Facebook, foto de grupo do WhatsApp
//   • story 1080×1920  → stories/status, tela cheia no celular
//
//   node scripts/post-divulgacao.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// carta de leilão em miniatura (a cara do jogo)
const carta = (nome, clube, ano, cor, giro) => `
  <div style="width:180px;flex:none;transform:rotate(${giro}deg)">
    <div style="background:${cor};border:5px solid ${INK};border-radius:16px;box-shadow:7px 7px 0 ${INK};padding:14px 12px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;border:4px solid ${INK};background:rgba(255,255,255,.5);margin:0 auto 9px;display:flex;align-items:center;justify-content:center;font-size:30px">⚽</div>
      <p style="${OSW};font-size:19px;margin:0;line-height:1.05;text-transform:uppercase">${nome}</p>
      <p style="font-family:system-ui;font-size:11px;font-weight:700;color:rgba(0,0,0,.6);margin:4px 0 0">${clube} · ${ano}</p>
      <div style="margin-top:9px;border:3px solid ${INK};border-radius:999px;background:#fff;${OSW};font-size:13px;padding:2px 0">✉️ lance secreto</div>
    </div>
  </div>`

const selo = (ico, txt) => `
  <div style="display:flex;gap:10px;align-items:center;background:#fff;border:4px solid ${INK};border-radius:14px;box-shadow:5px 5px 0 ${INK};padding:11px 15px">
    <span style="font-size:27px;line-height:1">${ico}</span>
    <p style="margin:0;font-family:system-ui;font-size:16px;font-weight:800;color:#3a3730;line-height:1.3">${txt}</p>
  </div>`

const pagina = (w, h, story) => `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${w}px;height:${h}px;background:${CREME};font-family:system-ui;overflow:hidden;
  display:flex;flex-direction:column;justify-content:center;align-items:center;padding:${story ? '90px 70px' : '60px 62px'};text-align:center}</style>
<body>
  <div style="display:inline-block;background:${RED};color:#fff;border:5px solid ${INK};border-radius:999px;box-shadow:6px 6px 0 ${INK};padding:${story ? '12px 34px' : '9px 28px'};${OSW};font-size:${story ? 26 : 22}px;letter-spacing:.1em;text-transform:uppercase">⚽ leilaolegends.com</div>

  <h1 style="${OSW};font-weight:700;font-size:${story ? 96 : 84}px;line-height:.95;text-transform:uppercase;margin:${story ? '30px 0 8px' : '24px 0 6px'};color:${INK}">Leilão<br><span style="color:${RED}">Legends</span></h1>
  <p style="font-family:system-ui;font-size:${story ? 27 : 24}px;font-weight:800;color:#4a4740;line-height:1.35;max-width:${story ? 840 : 880}px;margin-bottom:${story ? 34 : 26}px">
    O leilão <b>às cegas</b> de lendas do futebol.<br>Todo mundo tem <b>100 moedas</b> — quem der o maior lance <b>leva o craque</b>. 🔨</p>

  <div style="display:flex;gap:${story ? 26 : 22}px;justify-content:center;margin-bottom:${story ? 38 : 30}px">
    ${carta('CRAQUE', 'seu time', 'auge', GOLD, -4)}
    ${carta('LENDA', 'o sonho', 'eterno', '#E7D9FF', 3)}
    ${carta('PROMESSA', 'aposta', 'futuro', '#BFE3C7', -2)}
  </div>

  <div style="display:flex;flex-direction:column;gap:${story ? 15 : 12}px;width:100%;max-width:${story ? 900 : 940}px">
    ${selo('👥', 'Chame a galera: <b>sala online</b> com seus amigos, todos no mesmo pregão')}
    ${selo('🪜', '<b>Modo Carreira</b>: comece na várzea e suba até a Série A')}
    ${selo('🧢', '<b>NOVO:</b> contrate seu <b>técnico</b> e escolha entre <b>15 formações</b>')}
  </div>

  <div style="margin-top:${story ? 44 : 34}px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:${story ? '20px 42px' : '16px 36px'}">
    <p style="${OSW};font-size:${story ? 34 : 30}px;text-transform:uppercase;margin:0;line-height:1.1">Grátis, direto no navegador</p>
    <p style="font-family:system-ui;font-size:${story ? 20 : 18}px;font-weight:800;margin:6px 0 0;color:rgba(255,255,255,.9)">não precisa baixar nada · <b>leilaolegends.com</b></p>
  </div>
</body>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [nome, w, h, story] of [['divulgacao-feed.png', 1080, 1080, false], ['divulgacao-stories.png', 1080, 1920, true]]) {
  const tmp = `/tmp/div-${story ? 's' : 'f'}-${process.pid}.html`
  writeFileSync(tmp, pagina(w, h, story))
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await p.goto('file://' + tmp)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  await p.screenshot({ path: nome })
  await p.close()
  console.log(nome)
}
await b.close()
