// 🏟️💳 MOCKUP · A HORA DO LIMITE DA SALA VIRA TELA DE VENDA (03/11). Números de 7 dias: 1.182 pessoas bateram no limite (7.184
// vezes), só ~54 abriram os planos e ~22 clicaram no Craque Salas. Diego: *"algo precisa ser feito o chegar até o plano e pagar"* e
// *"tem que ser outro site porque o Vendria faz Pix automático recorrente"* → o ⭐ Craque Salas continua indo pro Vendria (mensal),
// o 🎟️ 3 salas continua no Pix do jogo. Muda a CARA e a ordem: uma oferta grande, o resto pequeno, sem o "mesmo e-mail" (o
// checkout já liga a conta sozinho). uso: node scripts/mockup-limite-sala-venda.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'

const hoje = `<div class="tel"><span class="tag" style="background:#e6dcbf">HOJE</span>
  <div class="old"><b class="ot">🏟️ HOJE VOCÊ JÁ CRIOU A SUA SALA</b>
  <p>Dá pra criar 1 sala por dia — amanhã libera outra. Mas <b>entrar em qualquer sala aberta é sempre de graça</b>: é só escolher uma em "Salas abertas".</p>
  <span class="ob" style="background:#fff">🎟️ OU 3 SALAS EXTRAS · R$ 4,90</span>
  <span class="ob" style="background:${GOLD}">⭐ CRAQUE SALAS · R$ 9,90/MÊS</span>
  <small>Craque Salas: crie quantas salas e ligas quiser. Assine com o MESMO e-mail da sua conta do jogo.</small>
  <span class="ob" style="background:${GOLD}">VER TODOS OS PLANOS</span></div>
  <p class="nota">3 botões do mesmo tamanho, texto miúdo, o "mesmo e-mail" assusta. ~2% clicam.</p></div>`

const nova = `<div class="tel"><span class="tag" style="background:#FFC400">PROPOSTA</span>
  <div class="mod">
    <div class="top"><span style="font-size:30px">🏟️</span><div><b>HOJE VOCÊ JÁ CRIOU A SUA SALA</b><small>Dá pra criar 1 sala por dia — amanhã libera outra. Mas <u>entrar em qualquer sala aberta é sempre de graça</u>: é só escolher uma em "Salas abertas".</small></div></div>
    <p class="cmp">QUAL É A SUA?</p>
    <div class="duo">
      <div class="c4"><span style="font-size:28px">🎟️</span><b class="ct">3 SALAS EXTRAS</b><div class="p4"><span>R$</span><b>4,90</b></div><span class="b4">PIX AQUI</span></div>
      <div class="c9"><span style="font-size:28px">⭐</span><b class="ct">CRAQUE SALAS</b><div class="p9"><span>R$</span><b>9,90</b><span>/mês</span></div><small><b>salas À VONTADE</b>, todo dia</small><span class="b9">QUERO ESSE</span></div>
    </div>
    <ul style="margin-top:12px"><li>✅ <b>Salas à vontade</b> todo dia</li><li>✅ <b>Minhas Ligas</b> com os amigos</li><li>✅ <b>Nome único</b> + nome <b>prata</b> ⭐ · presidente e clã</li></ul>
    <p class="pix">⚡ Craque Salas: Pix automático todo mês · <b>cancela quando quiser</b> · já cai na sua conta</p>
    <p class="todos">ver todos os planos ›</p>
  </div>
  <p class="nota">O 4,90 do lado do 9,90: a pessoa compara sozinha. O 9,90 é maior e brilha.</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#1d1510;font-family:system-ui,sans-serif;color:${INK};padding:24px;width:900px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px;color:#FFC400}.sub{margin:0 0 18px;font-weight:700;color:#e9dcc0;font-size:14px;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}
.tag{display:inline-block;font:700 15px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:3px 12px;box-shadow:3px 3px 0 #000;margin-bottom:8px}
.nota{color:#e9dcc0;font-size:12.5px;font-weight:700;margin:10px 2px 0;line-height:1.4}
.old{background:#FFF3C4;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px}
.ot{font:700 15px Oswald}.old p{font-size:13px;font-weight:700;margin:4px 0 8px;line-height:1.4}.old small{display:block;font-size:11px;font-weight:700;color:#5a5040;margin:-2px 2px 8px}
.ob{display:block;text-align:center;border:3px solid ${INK};border-radius:12px;padding:9px;font:700 15px Oswald;box-shadow:3px 3px 0 #000;margin-bottom:8px}
.mod{background:#F4ECD6;border:4px solid ${INK};border-radius:20px;box-shadow:5px 5px 0 #000;padding:14px}
.top{display:flex;align-items:center;gap:10px;background:${INK};color:#fff;border-radius:14px;padding:10px 12px}.top b{font:700 18px Oswald;display:block}.top small{display:block;font-size:12.5px;font-weight:700;color:#ddd;line-height:1.4;margin-top:3px}.top u{color:#FFC400;text-decoration:none;font-weight:900}
.hero{position:relative;margin-top:14px;background:${PRATA};border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px 14px 12px;text-align:center}
.selo{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#1B7A3D;color:#fff;font:700 11px Oswald;letter-spacing:1px;border:2px solid ${INK};border-radius:8px;padding:2px 8px;white-space:nowrap}
.ht{font:700 24px Oswald;display:block}.pr{display:flex;justify-content:center;align-items:baseline;gap:3px;margin:2px 0}.pr b{font:700 50px Oswald;line-height:1}.pr span{font:700 16px Oswald}
.dia{margin:0 0 8px;font-size:13px;font-weight:700}
ul{list-style:none;margin:0 0 12px;padding:10px;text-align:left;background:#fff;border:3px solid ${INK};border-radius:12px;font-size:13.5px;line-height:1.7}
.cta{display:block;background:${GOLD};border:4px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #000;padding:12px;font:700 20px Oswald}
.pix{font-size:11.5px;font-weight:700;margin:9px 0 0;color:#333}
.sec{display:flex;align-items:center;gap:10px;margin-top:14px;background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:9px 11px}.sec>span:first-child{font-size:24px}.sec div{flex:1}.sec b{font:700 15px Oswald;display:block}.sec small{font-size:11.5px;font-weight:700;color:#666}
.mini{background:#1B7A3D;color:#fff;font:700 13px Oswald;border:2px solid ${INK};border-radius:9px;padding:5px 10px}
.cmp{text-align:center;font:700 16px Oswald;letter-spacing:1px;margin:14px 0 8px}
.duo{display:grid;grid-template-columns:1fr 1.25fr;gap:10px;align-items:end}
.c4,.c9{position:relative;text-align:center;border:3px solid ${INK};border-radius:16px;box-shadow:3px 3px 0 #000;padding:12px 8px 10px;display:flex;flex-direction:column;align-items:center;gap:2px}
.c4{background:#fff}.c9{background:${PRATA};border-width:4px;box-shadow:5px 5px 0 #000}
.ct{font:700 17px Oswald}.p4,.p9{display:flex;align-items:baseline;gap:2px}.p4 b{font:700 34px Oswald;line-height:1}.p9 b{font:700 46px Oswald;line-height:1}.p4 span,.p9 span{font:700 14px Oswald}.p4{margin-bottom:8px}
.c4 small,.c9 small{font-size:12px;font-weight:700;margin-bottom:6px}
.b4{background:#1B7A3D;color:#fff;font:700 14px Oswald;border:3px solid ${INK};border-radius:10px;padding:6px 10px;width:100%}
.b9{background:${GOLD};font:700 18px Oswald;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px;width:100%}
.vs{margin:12px 0 8px;background:${INK};color:#fff;border-radius:12px;padding:9px 12px;text-align:center;font-size:14px;font-weight:700}.vs b{color:#FFC400}
.free{font-size:12.5px;font-weight:800;margin:12px 2px 2px}.free u{color:#1B7A3D}.todos{text-align:center;font-size:12px;font-weight:800;color:#666;margin:6px 0 0}
</style></head><body>
<h1>🏟️ Bateu no limite da sala → tela de venda</h1>
<p class="sub">1.182 pessoas bateram no limite em 7 dias (7.184 vezes) e só ~2% foram pros planos. O ⭐ Craque Salas continua no Vendria (Pix automático todo mês).<br>Muda a cara: o 🎟️ 4,90 fica DO LADO do ⭐ 9,90, e a pessoa compara sozinha.</p>
<div class="grid">${hoje}${nova}</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 900, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/limite-sala-venda.png', fullPage: true }); await br.close()
console.log('scripts/mockups/limite-sala-venda.png')
