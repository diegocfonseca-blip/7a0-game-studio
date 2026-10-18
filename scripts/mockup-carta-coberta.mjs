// 🃏 MOCKUP · CARTA COBERTA NO PREGÃO ABERTO (16/10)
// Diego: "aparecer o jogador mas sem mostrar a categoria da carta… apenas mostrar quando sair o resultado… após sair o
// resultado aparece o rostinho e cor dourada". Durante o lance: carta neutra, sem cor/estrela/selo/rosto, abre em 1 pra todas.
// uso: node scripts/mockup-carta-coberta.mjs → scripts/mockups/carta-coberta.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const rosto = `data:image/webp;base64,${b64('public/avatars/lendas-v2/diego-maradona-boca-juniors-1981.webp')}`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:20px}
h1{margin:0;font-size:28px;text-transform:uppercase}.sub{margin:2px 0 16px;font-weight:500}
.cols{display:flex;gap:26px;align-items:center}.col{width:300px;text-align:center}
.tag{display:inline-block;font-weight:700;text-transform:uppercase;border:3px solid #000;border-radius:10px;padding:2px 10px;box-shadow:3px 3px 0 #000;background:#FFC400;margin-bottom:12px;font-size:14px}
.card{position:relative;width:240px;height:330px;margin:0 auto;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;overflow:hidden;text-align:left}
.pos{position:absolute;top:12px;left:12px;background:#000;color:#fff;border-radius:8px;padding:1px 8px;font-weight:700;font-size:15px;z-index:3}
.nm{position:absolute;left:14px;bottom:42px;font-size:24px;font-weight:700;z-index:3}.cl{position:absolute;left:14px;bottom:22px;font-size:13px;font-weight:500;z-index:3}
.coberta{background:repeating-linear-gradient(135deg,#E7DEC6 0 14px,#DED3B6 14px 28px)}
.coberta .sil{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:120px;height:120px;border-radius:50%;background:#C9BD9C;border:3px dashed #8a7d59;display:grid;place-items:center;font-size:58px;font-weight:700;color:#8a7d59}
.coberta .q{position:absolute;top:12px;right:12px;background:#fff;border:2px solid #000;border-radius:8px;padding:0 8px;font-weight:700;font-size:13px}
.lenda{background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)}
.lenda::after{content:'';position:absolute;top:0;left:-30%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);z-index:2}
.lenda img{position:absolute;top:44px;left:50%;transform:translateX(-50%);width:170px;height:170px;object-fit:cover;object-position:top;border-radius:50%;border:3px solid #000;background:#fff6d0;z-index:1}
.lenda .sel{position:absolute;top:12px;right:12px;background:#0C0C0C;color:#FFC400;border-radius:8px;padding:1px 8px;font-weight:700;font-size:13px;z-index:3}
.st{position:absolute;left:14px;bottom:6px;font-size:14px;z-index:3}
.lance{margin:14px auto 0;width:240px;background:#FFC400;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:6px 10px;display:flex;align-items:center;gap:10px;font-weight:700}
.lance b{font-size:30px}.seta{font-size:46px;font-weight:700}
.nota{font-weight:500;font-size:13.5px;margin:12px 0 0;line-height:1.3;text-align:left}
.vend{margin:14px auto 0;width:240px;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:12px;padding:6px 10px;font-weight:700;font-size:14px}
</style></head><body>
<h1>🃏 Carta coberta no pregão aberto</h1><p class="sub">A categoria e o rosto só aparecem quando bate o martelo.</p>
<div class="cols">
 <div class="col"><span class="tag">Durante o lance</span>
  <div class="card coberta"><span class="pos">MEI</span><span class="q">❓ categoria</span><div class="sil">?</div><span class="nm">Maradona</span><span class="cl">Boca Juniors · 1981</span></div>
  <div class="lance"><b>1</b><span>ABRE EM 1 🪙<br><small style="font-weight:500">igual pra toda carta</small></span></div>
  <p class="nota">Sem cor, sem estrela, sem selo e sem rosto. Só nome, clube, ano e posição. O lance abre em 1 pra todas, senão o preço entregava a categoria.</p></div>
 <div class="seta">➜</div>
 <div class="col"><span class="tag">Bateu o martelo: vira a carta</span>
  <div class="card lenda"><span class="pos">MEI</span><span class="sel">👑 LENDA</span><img src="${rosto}"><span class="nm">Maradona</span><span class="cl">Boca Juniors · 1981</span><span class="st">⭐⭐⭐⭐⭐</span></div>
  <div class="vend">🔨 VENDIDO pro Arrogantchi FC por 27!</div>
  <p class="nota">A carta gira e aparece tudo de uma vez: rosto, cor do nível, estrelas, selo e o brilho dourado se for lenda. Vale a mesma virada pra carta que ninguém quis.</p></div>
</div></body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 760, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/mockups/carta-coberta.png', fullPage: true }); await b.close()
console.log('scripts/mockups/carta-coberta.png')
