// 🎨 MOCKUP · COR ADICIONAL À VENDA (02/11). Ideia do Diego: *"cobrarmos valor pra pessoa ter cor de tier diferente…
// serve pra qualquer um até mesmo fundadores… acima de 9,90"*. Regras dele no mesmo dia: dourado = SÓ Lenda/Batismo/Fundador ·
// prata = SÓ Craque · bege = quem não tem plano · PRETO reservado (futuro, do Fundador) · as outras sempre BRILHANTES ·
// só compra quem JÁ TEM PLANO. Preço proposto: R$ 14,90, pra sempre.
// uso: node scripts/mockup-cor-adicional.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C'
// as cores à venda — todas com brilho (o mesmo "holo" do ouro)
const CORES = [
  ['💜 Roxo', 'linear-gradient(160deg,#D9C2FF,#8B5CF6 45%,#5B2FB0 75%,#C9A9FF)'],
  ['💚 Verde', 'linear-gradient(160deg,#8FF0AE,#22C55E 40%,#0E9B45 70%,#6FE39A)'],
  ['🩷 Rosa', 'linear-gradient(160deg,#FFC2E2,#EC4899 45%,#B0246E 75%,#FF9ECF)'],
  ['💙 Azul', 'linear-gradient(160deg,#B9DBFF,#3B82F6 45%,#1D4FB8 75%,#8EC2FF)'],
  ['❤️ Vermelho', 'linear-gradient(160deg,#FFB3A8,#E8503A 45%,#A8261A 75%,#FF8C7A)'],
  ['🧡 Laranja', 'linear-gradient(160deg,#FFD6A0,#F97316 45%,#B9500B 75%,#FFB46B)'],
  ['🩵 Turquesa', 'linear-gradient(160deg,#B5FFF4,#14B8A6 45%,#0B7C70 75%,#7DEEDD)'],
]
const RESERV = [
  ['👑 Dourado', 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', 'Lenda · Batismo · Fundador'],
  ['⭐ Prata', 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', 'Craque'],
  ['Bege', 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', 'quem não tem plano'],
  ['🖤 Preto', 'linear-gradient(160deg,#5a5a5a,#141414 50%,#000 80%,#3a3a3a)', 'em breve · Fundador'],
]
const brilho = `<span class="sheen"></span>`
const chip = (g, txt, sel) => `<div class="chip${sel ? ' sel' : ''}" style="background:${g}">${brilho}<b>${txt}</b>${sel ? '<i>✓</i>' : ''}</div>`
const res = ([n, g, quem]) => `<div class="chip lock" style="background:${g}"><b>${n}</b><small>🔒 ${quem}</small></div>`
const nome = (g, txt) => `<span class="nome" style="background:${g}">${brilho}<b>${txt}</b></span>`
const ROSA = CORES[2][1]
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:26px;width:1100px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:15px;line-height:1.4}
.grid{display:grid;grid-template-columns:1.15fr 1fr;gap:22px}
.box{background:#fff;border:4px solid ${INK};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:16px}
.tag{display:inline-block;font:700 15px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:3px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:10px;background:#FFC400}
h2{font:700 24px Oswald;margin:0 0 4px;text-transform:uppercase}.preco{font:700 44px Oswald;color:#1B7A3D;line-height:1}.preco small{font:600 16px system-ui;color:#555}
.cores{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}
.chip{position:relative;overflow:hidden;border:3px solid ${INK};border-radius:14px;height:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:3px 3px 0 ${INK}}
.chip b{position:relative;z-index:2;font:700 16px Oswald;color:#fff;text-shadow:1px 1px 0 ${INK}}
.chip small{position:relative;z-index:2;font-weight:800;font-size:10.5px;color:#fff;text-shadow:1px 1px 0 ${INK};text-align:center;padding:0 4px}
.chip.sel{outline:4px solid #FFC400;outline-offset:2px}.chip i{position:absolute;top:4px;right:6px;z-index:3;font-style:normal;font-weight:900;color:#fff;background:${INK};border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center}
.chip.lock{opacity:.55;filter:grayscale(.15)}
.sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.65) 45%,transparent 60%);z-index:1}
.btn{display:block;text-align:center;font:700 22px Oswald;border:4px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px;background:#1B7A3D;color:#fff;margin-top:6px}
.regra{font-size:13.5px;font-weight:700;line-height:1.5;margin:10px 0 0}
.nome{position:relative;overflow:hidden;display:inline-flex;align-items:center;border:3px solid ${INK};border-radius:999px;padding:4px 14px}
.nome b{position:relative;z-index:2;font:700 18px Oswald;color:#fff;text-shadow:1px 1px 0 ${INK}}
.row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:2px dashed rgba(12,12,12,.15);font-weight:700}
.bal{background:#F4ECD6;border:2px solid ${INK};border-radius:12px;padding:6px 10px;font-size:14px}
.sem{background:#efe7d2;border:3px dashed ${INK};border-radius:14px;padding:12px;margin-top:14px;font-weight:800;font-size:14px;line-height:1.45}
</style></head><body>
<h1>🎨 Cor adicional · brilhante</h1>
<p class="sub">Só pra quem JÁ TEM PLANO (Craque, Lenda, Batismo, Fundador). Dourado, prata e bege continuam sendo a marca do plano; o preto fica guardado.</p>
<div class="grid">
  <div class="box"><span class="tag">🛒 LOJA DO CLUBE</span>
    <h2>🎨 Sua cor brilhante</h2>
    <div class="preco">R$ 14,90 <small>· uma vez só · fica pra sempre na conta</small></div>
    <div class="cores">${CORES.map(([n, g], i) => chip(g, n, i === 2)).join('')}</div>
    <div style="font:700 13px Oswald;letter-spacing:1px;color:#777;margin:6px 0">🔒 RESERVADAS</div>
    <div class="cores">${RESERV.map(res).join('')}</div>
    <span class="btn">💳 Comprar a 🩷 Rosa · R$ 14,90 no Pix</span>
    <p class="regra">✨ Todas brilham igual ao dourado.<br>🔁 A cor vale em todo canto: nome na sala, chat, ranking, crachá.<br>👑 Fundador também pode comprar.</p>
    <div class="sem">🔒 <b>Conta sem plano</b> vê a vitrine, mas o botão vira:<br><span style="color:#C2452F">“Cor adicional é pra quem tem plano · ⭐ VER OS PLANOS”</span></div>
  </div>
  <div class="box"><span class="tag" style="background:#fff">ONDE APARECE · EXEMPLO COM ROSA</span>
    <div class="row">🧑‍💼 Lista da sala: ${nome(ROSA, 'Pirlo FC')}</div>
    <div class="row">💬 Chat: ${nome(ROSA, 'Pirlo FC')}<span class="bal">esse Zico é meu 😤</span></div>
    <div class="row">🏆 Ranking da semana: <b>1º</b> ${nome(ROSA, 'Pirlo FC')} <span style="margin-left:auto">56 🏆</span></div>
    <div class="row">🔨 Martelo: ${nome(ROSA, 'Pirlo FC')} levou o Zico</div>
    <div class="row" style="border:none">🪪 Crachá do perfil: ${nome(ROSA, 'Pirlo FC · 👑 Lenda')}</div>
    <p class="regra" style="margin-top:14px">ℹ️ O selo do plano (👑 ⭐) continua do lado do nome — a cor muda, o plano continua dizendo quem ele é.</p>
  </div>
</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 1100, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/cor-adicional.png', fullPage: true }); await br.close()
console.log('scripts/mockups/cor-adicional.png')
