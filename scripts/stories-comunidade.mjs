// 📲 STORIES · CHAMADA PRA COMUNIDADE DO WHATSAPP (19/10, pedido do Diego: *"arte maneira p eu postar nos stories p chamar o
// pessoal pro grupo da comunidade"*). 1080×1920, cara do jogo (creme, borda preta, sombra dura, Oswald), três cartas REAIS do
// jogo (renderizadas pelo `CollectibleCard`, em scripts/avisos/carta-*.png) e o QR do grupo. Deixa um espaço livre pra
// figurinha de LINK do Instagram.
//   node scripts/stories-comunidade.mjs → scripts/posts/stories-comunidade.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const img = f => `data:image/png;base64,${b64(f)}`
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const LINK = 'chat.whatsapp.com/KfSkVvbjjdiHptHfJE5hQN'

const item = (ic, txt, cor) => `<div class="it"><span class="ic" style="background:${cor}">${ic}</span><span>${txt}</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:system-ui,sans-serif;color:#0C0C0C;
 background:radial-gradient(circle at 50% 30%,#FFF6DD 0,#F4ECD6 55%,#E9DDB9 100%)}
.wrap{position:relative;width:1080px;height:1920px;padding:70px 64px}
.topo{display:flex;justify-content:space-between;align-items:center}
.marca{font:700 44px Oswald;letter-spacing:.5px}.marca b{color:#C2452F}
.zap{font:700 30px Oswald;background:#1B7A3D;color:#fff;border:4px solid #0C0C0C;border-radius:16px;padding:8px 20px;box-shadow:5px 5px 0 #000}
h1{font:700 112px/0.95 Oswald;text-transform:uppercase;margin:34px 0 0;letter-spacing:-1px}
h1 em{font-style:normal;color:#1B7A3D}
.sub{font-size:34px;font-weight:700;margin:18px 0 0;line-height:1.3;opacity:.8}
.cartas{position:relative;height:480px;margin-top:30px}
.cartas img{position:absolute;filter:drop-shadow(0 18px 24px rgba(0,0,0,.25))}
.c1{width:290px;left:40px;top:60px}.c3{width:290px;right:40px;top:60px}.c2{width:340px;left:50%;margin-left:-170px;top:0;z-index:2}
.lista{display:flex;flex-direction:column;gap:14px;margin-top:22px}
.it{display:flex;align-items:center;gap:22px;background:#fff;border:4px solid #0C0C0C;border-radius:22px;padding:12px 22px;box-shadow:6px 6px 0 #000;font-size:31px;font-weight:800;line-height:1.2}
.ic{flex:none;display:grid;place-items:center;width:62px;height:62px;border:3px solid #0C0C0C;border-radius:14px;font-size:34px}
.cta{position:absolute;left:64px;right:64px;bottom:76px;display:flex;gap:28px;align-items:center;background:#1B7A3D;color:#fff;border:5px solid #0C0C0C;border-radius:30px;padding:28px;box-shadow:8px 8px 0 #000}
.qr{flex:none;width:230px;height:230px;background:#fff;border:4px solid #0C0C0C;border-radius:18px;padding:10px}.qr img{width:100%;height:100%;image-rendering:pixelated}
.cta b{display:block;font:700 66px/1 Oswald;text-transform:uppercase}
.cta p{margin:14px 0 0;font-size:30px;font-weight:700;line-height:1.3}
.cta small{display:block;margin-top:12px;font-size:22px;font-weight:700;opacity:.8;word-break:break-all}
.site{position:absolute;left:0;right:0;bottom:22px;text-align:center;font:700 26px Oswald;letter-spacing:2px;opacity:.55}
</style></head><body><div class="wrap">
  <div class="topo"><div class="marca">⚽ LEILÃO <b>LEGENDS</b></div><div class="zap">💬 COMUNIDADE</div></div>
  <h1>Bora pro <em>grupo</em><br>da galera!</h1>
  <p class="sub">A comunidade do Leilão Legends no WhatsApp. É lá que a resenha acontece. 🔨</p>
  <div class="cartas">
    <img class="c1" src="${img('scripts/avisos/carta-zico.png')}">
    <img class="c2" src="${img('scripts/avisos/carta-pele.png')}">
    <img class="c3" src="${img('scripts/avisos/carta-maradona.png')}">
  </div>
  <div class="lista">
    ${item('📢', 'Novidade do jogo antes de todo mundo', '#FFC400')}
    ${item('📣', 'Galera pra fechar sala na hora', '#E9DDFE')}
    ${item('😈', 'Zoeira, provocação e "QUASE!" no martelo', '#FFD6CC')}
    ${item('🖋️', 'Desafios valendo time de batismo', '#CBEFD7')}
  </div>
  <div class="cta">
    <div class="qr"><img src="${img('scripts/avisos/qr-comunidade.png')}"></div>
    <div><b>Entra aí 👇</b><p>Toca no link ou aponta a câmera pro QR.</p><small>${LINK}</small></div>
  </div>
  <div class="site">LEILAOLEGENDS.COM</div>
</div></body></html>`
mkdirSync('scripts/posts', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(html); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/posts/stories-comunidade.png' })
await b.close(); console.log('📲 scripts/posts/stories-comunidade.png')
