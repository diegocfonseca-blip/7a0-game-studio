// 💼 MOCKUP · ONDE O PATROCINADOR DE VERDADE APARECE (16/10)
// Pedido do Diego: vender patrocínio (mensal ou pontual). Os 3 espaços fixos:
//   1) nome da competição · 2) placa de LED no estádio/placar · 3) anúncio no jornal O MARTELO.
// Marca fictícia "SUA MARCA" — nunca uma empresa real no mockup.
// uso: node scripts/mockup-patrocinio.mjs → scripts/mockups/patrocinio.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${b64(`src/escalacao/img/${f}`)}`
const MARCA = `<span class="marca"><i>🛒</i>SUA MARCA</span>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:22px}
h1{margin:0;font-size:30px;text-transform:uppercase;font-weight:700}.sub{margin:2px 0 18px;font-weight:500;font-size:15px}
.cols{display:flex;gap:20px;align-items:flex-start}.col{width:340px}
.tag{display:inline-block;font-weight:700;text-transform:uppercase;border:3px solid #000;border-radius:10px;padding:2px 10px;box-shadow:3px 3px 0 #000;background:#FFC400;margin-bottom:10px;font-size:15px}
.cel{border:4px solid #000;border-radius:22px;box-shadow:4px 4px 0 #000;overflow:hidden;background:#fff}
.marca{display:inline-flex;align-items:center;gap:5px;background:#1B7A3D;color:#fff;font-weight:700;border:2px solid #000;border-radius:8px;padding:1px 8px;font-size:13px;letter-spacing:.04em;white-space:nowrap}
.marca i{font-style:normal}
.nota{font-weight:500;font-size:14px;margin:10px 2px 0;line-height:1.3}
.preco{display:inline-block;margin-top:6px;font-weight:700;background:#0C0C0C;color:#FFC400;border-radius:8px;padding:2px 9px;font-size:13px}
/* 1 */
.banner{position:relative;height:190px;background:url(${img('online-champions-v25.webp')}) center/cover}
.banner::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.75))}
.banner .t{position:absolute;left:14px;right:14px;bottom:12px;z-index:1;color:#fff}
.banner h2{margin:0;font-size:28px;line-height:1;text-transform:uppercase;text-shadow:2px 2px 0 #000}
.apres{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.06em}
.lista{padding:10px 12px}.lin{display:flex;justify-content:space-between;border-bottom:2px solid #eee;padding:5px 0;font-weight:500;font-size:14px}
.lin b{font-weight:700}
/* 2 */
.estadio{position:relative;height:170px;background:url(${img('online-estadio-v25.webp')}) center/cover}
.led{position:absolute;left:0;right:0;bottom:16px;height:26px;background:#0C0C0C;border-top:2px solid #333;border-bottom:2px solid #333;overflow:hidden;display:flex;align-items:center;gap:26px;padding-left:10px;white-space:nowrap}
.led span{color:#7CFF9B;font-weight:700;font-size:13px;letter-spacing:.12em;text-shadow:0 0 6px #3f3}
.placar{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:4px solid #000;background:#F4ECD6}
.time{font-weight:700;font-size:15px;text-transform:uppercase;width:100px}.time:last-child{text-align:right}
.gols{font-size:36px;font-weight:700;border:3px solid #000;border-radius:10px;padding:0 12px;background:#fff;box-shadow:3px 3px 0 #000}
.rodape{display:flex;justify-content:center;align-items:center;gap:6px;padding:6px;font-size:12px;font-weight:500;background:#fff;border-top:2px solid #000}
/* 3 */
.jornal{background:#FBF7EC;padding:12px 14px;font-family:Georgia,serif}
.jornal .cab{text-align:center;border-bottom:3px double #000;padding-bottom:6px}
.jornal .cab b{font-family:Oswald;font-size:32px;letter-spacing:.06em}
.jornal .cab small{display:block;font-family:Oswald;font-weight:500;font-size:11px;letter-spacing:.12em}
.manch{font-family:Oswald;font-weight:700;font-size:23px;line-height:1.05;text-transform:uppercase;margin:10px 0 6px}
.foto{height:96px;background:url(${img('jornal-copa-v22.webp')}) center/cover;border:2px solid #000}
.txt{font-size:12px;line-height:1.35;margin:6px 0 10px;color:#333}
.anuncio{border:3px solid #000;border-radius:10px;box-shadow:3px 3px 0 #000;background:#fff;padding:9px 10px;display:flex;gap:10px;align-items:center}
.anuncio .lg{width:54px;height:54px;border-radius:10px;background:#1B7A3D;border:2px solid #000;display:grid;place-items:center;font-size:28px}
.anuncio b{font-family:Oswald;font-size:16px;text-transform:uppercase}.anuncio p{margin:2px 0 0;font-size:12px}
.pub{font-family:Oswald;font-size:10px;letter-spacing:.14em;color:#777;text-align:right;margin-top:3px}
</style></head><body>
<h1>💼 Patrocínio de verdade: os 3 espaços</h1>
<p class="sub">Uma marca por espaço. "SUA MARCA" é só exemplo: entra a logo de quem comprar.</p>
<div class="cols">
 <div class="col"><span class="tag">1 · Nome da competição</span>
  <div class="cel"><div class="banner"><div class="t"><h2>⭐ Champions Legends</h2>
   <div class="apres">apresentada por ${MARCA}</div></div></div>
   <div class="lista"><div class="lin"><span>1º Coringas do Diniz</span><b>12 pts</b></div><div class="lin"><span>2º Stocco FC</span><b>10 pts</b></div><div class="lin"><span>3º ComVerissimo FC</span><b>9 pts</b></div></div></div>
  <p class="nota">A marca vai no banner da competição, na tela de criar sala e no jornal do campeão. É o espaço mais forte.</p>
  <span class="preco">📅 mensal · o mais caro</span></div>
 <div class="col"><span class="tag">2 · Placa no estádio</span>
  <div class="cel"><div class="estadio"><div class="led"><span>🛒 SUA MARCA</span><span>LEILÃO LEGENDS</span><span>🛒 SUA MARCA</span><span>LEILÃO LEGENDS</span><span>🛒 SUA MARCA</span></div></div>
   <div class="placar"><span class="time">Stocco FC</span><span class="gols">2 x 1</span><span class="time">Manfré FC</span></div>
   <div class="rodape">placar oferecido por ${MARCA}</div></div>
  <p class="nota">A logo aparece no LED do estádio e numa linha fina embaixo do placar, nos jogos do online e da carreira. Não cobre nada do jogo.</p>
  <span class="preco">📅 mensal</span></div>
 <div class="col"><span class="tag">3 · Anúncio no O MARTELO</span>
  <div class="cel"><div class="jornal"><div class="cab"><b>O MARTELO</b><small>EDIÇÃO DO CAMPEÃO · 16 DE OUTUBRO</small></div>
   <div class="manch">Stocco FC levanta a taça e cala a sala!</div><div class="foto"></div>
   <div class="txt">Depois de um pregão de nervos, o Stocco FC bateu o martelo no último setor e foi campeão com dois gols no fim…</div>
   <div class="anuncio"><span class="lg">🛒</span><div><b>Sua Marca</b><p>Frase do anunciante aqui. Cupom LEGENDS10 no site.</p></div></div>
   <div class="pub">PUBLICIDADE</div></div></div>
  <p class="nota">Um quadro no pé do jornal de fim de partida e de temporada. Quem posta o jornal leva a marca junto.</p>
  <span class="preco">📅 mensal ou ⚡ pontual</span></div>
</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1110, height: 700 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/mockups/patrocinio.png', fullPage: true }); await b.close()
console.log('scripts/mockups/patrocinio.png')
