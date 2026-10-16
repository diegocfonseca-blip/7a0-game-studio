// 💼 MOCKUP 2 · DIA DA MARCA + VITRINE DOS PATROCINADORES (16/10)
// Diego aprovou os 3 espaços (scripts/mockup-patrocinio.mjs) e pediu: "Dia da marca" (pontual, 24h dominando os 3 espaços)
// e a Vitrine com bio de cada marca, em ordem de quem mais apoiou — SEM ouro/prata/bronze.
// Marcas fictícias (nunca empresa real no mockup).
// uso: node scripts/mockup-patrocinio-2.mjs → scripts/mockups/patrocinio-2.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${b64(`src/escalacao/img/${f}`)}`
const MARCAS = [
  { n: 'Resenha Camisas', e: '👕', c: '#1B7A3D', bio: 'Camisas retrô de futebol feitas no Brasil. Do Zico ao Romário, a gente veste quem viveu a bola.', ig: '@resenhacamisas', cup: 'LEGENDS10', desde: 'out/2026', meses: 6 },
  { n: 'Golaço Pizzaria', e: '🍕', c: '#C2452F', bio: 'A pizza oficial do pós-jogo. Pediu durante o pregão, chega antes do martelo bater.', ig: '@golacopizza', cup: 'MARTELO15', desde: 'nov/2026', meses: 4 },
  { n: 'Bola Murcha Podcast', e: '🎙️', c: '#7C3AED', bio: 'Resenha de futebol sem filtro, toda segunda. Os perna-de-pau também merecem homenagem.', ig: '@bolamurchapod', cup: null, desde: 'dez/2026', meses: 2 },
]
const cartao = (m, i) => `<div class="mc"><div class="pos">${i + 1}º</div><div class="lg" style="background:${m.c}">${m.e}</div>
 <div class="mi"><b>${m.n}</b><p>${m.bio}</p>
 <div class="chips"><span class="ch">📷 ${m.ig}</span>${m.cup ? `<span class="ch cup">🎟️ cupom ${m.cup}</span>` : ''}</div>
 <small>apoia o jogo desde ${m.desde} · ${m.meses} meses</small></div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:22px}
h1{margin:0;font-size:30px;text-transform:uppercase;font-weight:700}.sub{margin:2px 0 18px;font-weight:500;font-size:15px}
.cols{display:flex;gap:24px;align-items:flex-start}.col{width:380px}
.tag{display:inline-block;font-weight:700;text-transform:uppercase;border:3px solid #000;border-radius:10px;padding:2px 10px;box-shadow:3px 3px 0 #000;background:#FFC400;margin-bottom:10px;font-size:15px}
.cel{border:4px solid #000;border-radius:22px;box-shadow:4px 4px 0 #000;overflow:hidden;background:#F4ECD6}
.nota{font-weight:500;font-size:14px;margin:10px 2px 0;line-height:1.3}
.preco{display:inline-block;margin-top:6px;font-weight:700;background:#0C0C0C;color:#FFC400;border-radius:8px;padding:2px 9px;font-size:13px}
.marca{display:inline-flex;align-items:center;gap:5px;background:#1B7A3D;color:#fff;font-weight:700;border:2px solid #000;border-radius:8px;padding:1px 8px;font-size:13px;white-space:nowrap}
/* dia da marca */
.hd{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff;border-bottom:3px solid #000;font-weight:700;font-size:18px}
.take{margin:12px;border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;background:linear-gradient(135deg,#1B7A3D,#0f4d26);color:#fff;padding:14px;position:relative;overflow:hidden}
.take::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.25),transparent);transform:skewX(-20deg)}
.take small{font-weight:500;letter-spacing:.12em;font-size:11px;text-transform:uppercase;opacity:.9}
.take h2{margin:2px 0 4px;font-size:26px;line-height:1;text-transform:uppercase}
.take p{margin:0 0 10px;font-weight:500;font-size:13px}
.take .row{display:flex;gap:8px;align-items:center}
.btn{background:#FFC400;color:#0C0C0C;border:3px solid #000;border-radius:10px;box-shadow:3px 3px 0 #000;font-weight:700;padding:4px 12px;font-size:14px;text-transform:uppercase}
.relo{background:rgba(0,0,0,.35);border:2px solid #000;border-radius:8px;padding:3px 8px;font-weight:700;font-size:13px}
.onde{margin:0 12px 12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.onde div{background:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:7px 6px;text-align:center;font-weight:700;font-size:12px;text-transform:uppercase;line-height:1.15}
.onde i{font-style:normal;display:block;font-size:20px}
.estadio{position:relative;height:120px;margin:0 12px 12px;border:3px solid #000;border-radius:14px;overflow:hidden;background:url(${img('online-estadio-v25.webp')}) center/cover}
.led{position:absolute;left:0;right:0;bottom:10px;height:24px;background:#0C0C0C;display:flex;align-items:center;gap:22px;padding-left:10px;white-space:nowrap}
.led span{color:#7CFF9B;font-weight:700;font-size:12px;letter-spacing:.12em;text-shadow:0 0 6px #3f3}
.quem{margin:0 12px 12px;background:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:4px 10px}
.ql{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:2px solid #eee;font-weight:500;font-size:13px}.ql:last-child{border:0}
.ql b{font-size:12px;border:2px solid #000;border-radius:7px;padding:0 6px}.ql .dia{background:#FFD3CA}.ql .mes{background:#CDEBD6}.ql .div{background:#FFC400}
/* vitrine */
.vt{padding:12px}.vt h3{margin:0;font-size:22px;text-transform:uppercase}.vt .s{margin:0 0 10px;font-weight:500;font-size:13px}
.mc{display:flex;gap:10px;align-items:flex-start;background:#fff;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px;margin-bottom:10px;position:relative}
.pos{position:absolute;top:-9px;left:-6px;background:#0C0C0C;color:#fff;font-weight:700;font-size:12px;border-radius:7px;padding:0 6px;border:2px solid #000}
.lg{flex:none;width:56px;height:56px;border:3px solid #000;border-radius:12px;display:grid;place-items:center;font-size:28px}
.mi b{font-size:17px;text-transform:uppercase}.mi p{margin:2px 0 6px;font-family:Georgia,serif;font-size:12px;line-height:1.35;color:#333}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}.ch{font-weight:700;font-size:11px;border:2px solid #000;border-radius:7px;padding:0 6px;background:#F4ECD6}
.ch.cup{background:#FFC400}.mi small{font-weight:500;font-size:11px;color:#555}
.quero{display:block;text-align:center;margin-top:4px;background:#fff;border:3px dashed #000;border-radius:12px;padding:8px;font-weight:700;font-size:13px;text-transform:uppercase}
</style></head><body>
<h1>💼 Dia da marca + Vitrine dos patrocinadores</h1>
<p class="sub">Marcas fictícias, só de exemplo. No Dia da marca, quem paga o mês NÃO perde espaço.</p>
<div class="cols">
 <div class="col"><span class="tag">4 · ⚡ Dia da marca (24h)</span>
  <div class="cel"><div class="hd"><span>🔨 LEILÃO LEGENDS</span><span style="font-size:13px">BR | EN</span></div>
   <div class="take" style="background:linear-gradient(135deg,#C2452F,#7d2414)"><small>Hoje o jogo é oferecido por</small><h2>🍕 Golaço Pizzaria</h2>
    <p>A pizza oficial do pós-jogo. Cupom de hoje pra quem joga:</p>
    <div class="row"><span class="btn">🎟️ MARTELO15</span><span class="relo">⏳ acaba em 13:42:10</span></div></div>
   <div class="estadio"><div class="led"><span style="color:#FF8A75;text-shadow:0 0 6px #f53">🍕 GOLAÇO PIZZARIA</span><span>👕 RESENHA CAMISAS</span><span style="color:#FF8A75;text-shadow:0 0 6px #f53">🍕 GOLAÇO PIZZARIA</span><span>👕 RESENHA CAMISAS</span></div></div>
   <div class="quem"><div class="ql"><span>🏠 Cartão da home</span><b class="dia">🍕 só a do dia</b></div>
    <div class="ql"><span>🏟️ LED do estádio</span><b class="div">🍕 + 👕 alternando</b></div>
    <div class="ql"><span>🏆 Nome da competição</span><b class="mes">👕 continua a do mês</b></div>
    <div class="ql"><span>📰 O MARTELO</span><b class="mes">👕 continua a do mês</b></div></div></div>
  <p class="nota">A marca do mês (👕 Resenha Camisas) nunca perde o espaço dela. A do dia (🍕 Golaço Pizzaria) ganha o destaque da home só pra ela e divide o LED, alternando. No dia seguinte o LED volta a ser só da marca do mês.</p>
  <span class="preco">⚡ pontual · paga uma vez</span></div>
 <div class="col"><span class="tag">5 · 🏪 Vitrine dos patrocinadores</span>
  <div class="cel"><div class="vt"><h3>🤝 Quem faz o jogo acontecer</h3><p class="s">Em ordem de quem mais apoiou o Leilão Legends.</p>
   ${MARCAS.map(cartao).join('')}
   <span class="quero">💼 Sua marca aqui? Fale com a gente</span></div></div>
  <p class="nota">Cada marca tem logo, bio, Instagram e cupom. A ordem é de quem mais apoiou no total, só com o número da posição, sem medalha. Clicar na marca do LED, do placar ou do jornal abre o cartão dela aqui.</p>
  <span class="preco">✅ vem junto com qualquer patrocínio</span></div>
</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 860, height: 700 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/mockups/patrocinio-2.png', fullPage: true }); await b.close()
console.log('scripts/mockups/patrocinio-2.png')
