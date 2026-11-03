// 🎨 MOCKUP · COR ADICIONAL À VENDA (02/11). Ideia do Diego: *"cobrarmos valor pra pessoa ter cor de tier diferente…
// serve pra qualquer um até mesmo fundadores… acima de 9,90"*. Regras dele no mesmo dia:
//  · dourado = SÓ Lenda/Batismo/Fundador · prata = SÓ Craque · bege = quem não tem plano · PRETO não aparece pra ninguém (futuro).
//  · 2ª rodada: em "SUAS CORES" cada um só vê a cor do PRÓPRIO plano (sem plano → bege · Craque → prata · Lenda/Batismo/
//    Fundador → dourado) — nada de mostrar as reservadas dos outros.
//  · compra QUANTAS quiser; cada uma fica dela pra sempre e ela ESCOLHE qual usar. Só compra quem JÁ TEM PLANO.
// Preço proposto: R$ 14,90 cada, pra sempre.   uso: node scripts/mockup-cor-adicional.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C'
const C = {
  roxo: ['💜 Roxo', 'linear-gradient(160deg,#D9C2FF,#8B5CF6 45%,#5B2FB0 75%,#C9A9FF)'],
  verde: ['💚 Verde', 'linear-gradient(160deg,#8FF0AE,#22C55E 40%,#0E9B45 70%,#6FE39A)'],
  rosa: ['🩷 Rosa', 'linear-gradient(160deg,#FFC2E2,#EC4899 45%,#B0246E 75%,#FF9ECF)'],
  azul: ['💙 Azul', 'linear-gradient(160deg,#B9DBFF,#3B82F6 45%,#1D4FB8 75%,#8EC2FF)'],
  vermelho: ['❤️ Vermelho', 'linear-gradient(160deg,#FFB3A8,#E8503A 45%,#A8261A 75%,#FF8C7A)'],
  laranja: ['🧡 Laranja', 'linear-gradient(160deg,#FFD6A0,#F97316 45%,#B9500B 75%,#FFB46B)'],
  turquesa: ['🩵 Turquesa', 'linear-gradient(160deg,#B5FFF4,#14B8A6 45%,#0B7C70 75%,#7DEEDD)'],
}
const PLANO = {
  bege: ['Bege', 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'],
  prata: ['⭐ Prata', 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'],
  ouro: ['👑 Dourado', 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'],
}
const sheen = `<span class="sheen"></span>`
const chip = ([n, g], { usando = false, plano = false, preco = false, trava = false } = {}) => `
  <div class="chip${usando ? ' sel' : ''}${trava ? ' trava' : ''}" style="background:${g}">${plano && n === 'Bege' ? '' : sheen}<b>${n}</b>
    ${usando ? '<i>EM USO</i>' : plano ? '<small>do seu plano</small>' : preco ? '<small>R$ 14,90</small>' : '<small>tocar pra usar</small>'}</div>`
const col = (titulo, cor, suas, loja, rodape) => `<div class="box"><span class="tag" style="background:${cor}">${titulo}</span>
  <div class="sec">✅ SUAS CORES <span>· toque pra escolher qual usar</span></div><div class="cores">${suas}</div>
  <div class="sec">🛒 COMPRAR MAIS <span>· R$ 14,90 cada · fica sua pra sempre</span></div><div class="cores">${loja}</div>${rodape}</div>`
const loja = (exceto = [], trava = false) => Object.entries(C).filter(([k]) => !exceto.includes(k)).map(([, v]) => chip(v, { preco: true, trava })).join('')

const semPlano = col('🙂 SEM PLANO', '#e6dcbf', chip(PLANO.bege, { usando: true, plano: true }), loja([], true),
  `<div class="aviso">🔒 Cor nova é pra quem tem plano.<span class="btn" style="background:#FFC400;color:${INK}">⭐ VER OS PLANOS</span></div>`)
const craque = col('⭐ CRAQUE (com 1 cor comprada)', '#E9EDF2', chip(PLANO.prata, { plano: true }) + chip(C.rosa, { usando: true }), loja(['rosa']),
  `<span class="btn">💳 Comprar 💙 Azul · R$ 14,90 no Pix</span>`)
const lenda = col('👑 LENDA · BATISMO · FUNDADOR', '#FFC400', chip(PLANO.ouro, { usando: true, plano: true }) + chip(C.roxo) + chip(C.verde), loja(['roxo', 'verde']),
  `<span class="btn">💳 Comprar 🩵 Turquesa · R$ 14,90 no Pix</span>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:26px;width:1400px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.7;font-size:15px;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}
.box{background:#fff;border:4px solid ${INK};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:16px}
.tag{display:inline-block;font:700 16px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:3px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:6px}
.sec{font:700 15px Oswald;letter-spacing:.5px;margin:12px 0 6px}.sec span{font:600 12px system-ui;color:#777}
.cores{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.chip{position:relative;overflow:hidden;border:3px solid ${INK};border-radius:13px;height:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:3px 3px 0 ${INK}}
.chip b{position:relative;z-index:2;font:700 15px Oswald;color:#fff;text-shadow:1px 1px 0 ${INK}}
.chip small{position:relative;z-index:2;font-weight:800;font-size:10.5px;color:#fff;text-shadow:1px 1px 0 ${INK}}
.chip.sel{outline:4px solid ${INK};outline-offset:2px}.chip i{position:relative;z-index:2;font-style:normal;font:700 10px Oswald;letter-spacing:1px;background:${INK};color:#fff;border-radius:6px;padding:1px 6px;margin-top:2px}
.chip.trava{opacity:.45}
.sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.65) 45%,transparent 60%);z-index:1}
.btn{display:block;text-align:center;font:700 19px Oswald;border:4px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:10px;background:#1B7A3D;color:#fff;margin-top:14px}
.aviso{margin-top:14px;font-weight:800;font-size:14px;text-align:center}
</style></head><body>
<h1>🎨 Cor adicional · o que cada um vê</h1>
<p class="sub">Em "SUAS CORES" cada um só vê a cor do PRÓPRIO plano + as que comprou. Compra quantas quiser (R$ 14,90 cada, pra sempre) e escolhe qual usar.<br>
Só compra quem tem plano. Dourado/prata/bege nunca aparecem pra venda, e o preto não aparece pra ninguém.</p>
<div class="grid">${semPlano}${craque}${lenda}</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/cor-adicional.png', fullPage: true }); await br.close()
console.log('scripts/mockups/cor-adicional.png')
