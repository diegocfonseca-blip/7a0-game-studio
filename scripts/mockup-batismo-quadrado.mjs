// ─── 🟪 BATISMO EM 1:1 — a versão QUADRADA pro FEED (Diego 24/08) ──────────
//
// Pedido: *"deixe essa arte de forma quadrada p eu postar no feed"*.
//
// ⚠️ NÃO substitui o `mockup-batismo.mjs` (o formato vertical que ele aprovou no
// Nata de SP). É um COMPANHEIRO: mesma identidade (creme, borda preta grossa,
// sombra dura, Oswald), mesmos dados, só que arrumado em 1:1.
//
// 🧠 O que MUDA no quadrado, e por quê: no feed a arte é o herói e o texto some
// no tamanho pequeno. Então a seção "onde a mascote aparece" (que é OBRIGATÓRIA
// no post vertical, cobrança dele de 17/08) sai daqui — ela é longa e ilegível
// em 1:1. O quadrado é a CAPA; o vertical continua sendo o post completo.
//
//   node scripts/mockup-batismo-quadrado.mjs \
//     --clube "Neymarzetti" --serie C --antigo "Paixandu" \
//     --escudo src/escalacao/img/neymarzetti-escudo.webp \
//     --mascote src/escalacao/img/neymarzetti-mascote.webp \
//     --camisa scripts/kits/neymarzetti.webp \
//     --mascote-nome "O Mascarado" --c1 "#141416" --c1-nome "preto" \
//     --c2 "#B6B7B8" --c2-nome "prata" --dono "Diego" --fundador 1 \
//     --saida neymarzetti-quadrado.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const o = {
  clube: arg('clube'), serie: arg('serie', 'D'), antigo: arg('antigo'),
  escudo: arg('escudo'), mascote: arg('mascote'), camisa: arg('camisa'),
  mascoteNome: arg('mascote-nome', 'a mascote'),
  c1: arg('c1', '#FFC400'), c1nome: arg('c1-nome', ''),
  c2: arg('c2', '#0C0C0C'), c2nome: arg('c2-nome', ''),
  dono: arg('dono', ''), fundador: arg('fundador', ''),
  saida: arg('saida', 'batismo-quadrado.png'),
  escala: Number(arg('escala', '1')), // 🔍 2 = renderiza em 2880x2880 (pro Instagram)
}
if (!o.clube || !o.escudo || !o.mascote) { console.error('faltou --clube, --escudo ou --mascote'); process.exit(1) }

const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(${fonte(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// mesma quebra do nome do post vertical: última palavra embaixo, em vermelho
const partes = o.clube.trim().split(/\s+/)
const linha1 = partes.length > 1 ? partes.slice(0, -1).join(' ') : ''
const linha2 = partes.length > 1 ? partes[partes.length - 1] : partes[0]

const cartao = (rotulo, emoji, corpo, legenda) => `
  <div style="flex:1;min-width:0;border:7px solid ${INK};border-radius:26px;background:${INK};
    box-shadow:11px 11px 0 ${INK};overflow:hidden;display:flex;flex-direction:column">
    <div style="padding:13px 18px;color:#fff;${OSW};font-size:25px;letter-spacing:.1em;text-transform:uppercase">${emoji} ${rotulo}</div>
    <div style="flex:1;background:#fff;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
      ${corpo}
      <p style="font-family:system-ui;font-size:20px;font-weight:700;color:rgba(0,0,0,.55);margin:0;text-align:center;line-height:1.3">${legenda}</p>
    </div>
  </div>`

const mantoDesenho = o.camisa
  ? `<img src="${img(o.camisa)}" style="height:290px;object-fit:contain">`
  : `<div style="width:150px;height:250px;border:6px solid ${INK};border-radius:14px;
       background:repeating-linear-gradient(90deg,${o.c1} 0 26px,${o.c2} 26px 52px)"></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1440px;height:1440px;background:${CREME};font-family:system-ui;padding:56px 58px;display:flex;flex-direction:column;overflow:hidden}
</style>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px">
    <div style="min-width:0">
      <span style="display:inline-block;background:${GOLD};border:5px solid ${INK};border-radius:999px;
        box-shadow:7px 7px 0 ${INK};padding:8px 26px;${OSW};font-size:26px;letter-spacing:.12em;text-transform:uppercase">🦇 Batismo de Lenda</span>
      <h1 style="${OSW};font-size:104px;line-height:.9;text-transform:uppercase;margin:22px 0 0">
        ${linha1 ? `Nasceu o ${linha1}<br>` : 'Nasceu o<br>'}<span style="color:${RED}">${linha2}</span></h1>
      <p style="font-family:system-ui;font-size:26px;font-weight:600;color:rgba(12,12,12,.68);margin:18px 0 0;line-height:1.35;max-width:820px">
        O clube do <b style="color:${INK}">${o.dono || 'dono'}</b> chega na <b style="color:${INK}">Série ${o.serie}</b>${o.antigo ? ` no lugar do ${o.antigo}` : ''} —
        ${o.c1nome} e ${o.c2nome}, com ${o.mascoteNome} de mascote.</p>
    </div>
  </div>

  <div style="flex:1;display:flex;gap:22px;margin-top:34px;min-height:0">
    ${cartao('Escudo', '🛡️', `<img src="${img(o.escudo)}" style="height:300px;object-fit:contain">`,
      `<b style="color:${INK};font-size:24px">${o.clube}</b>`)}
    ${cartao('Mascote', '🦇', `<img src="${img(o.mascote)}" style="height:300px;object-fit:contain">`,
      `<b style="color:${INK};font-size:24px">${o.mascoteNome}</b><br>carimba a tela no gol`)}
    ${cartao('Manto', '🎽', mantoDesenho, `${o.c1nome} e ${o.c2nome}`)}
  </div>

  <div style="margin-top:26px;display:flex;align-items:center;gap:18px;background:${GOLD};
    border:7px solid ${INK};border-radius:26px;box-shadow:11px 11px 0 ${INK};padding:20px 28px">
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:rgba(12,12,12,.6);margin:0">Batizado por</p>
      <p style="${OSW};font-size:46px;line-height:1;margin:2px 0 0">${o.dono || '—'}</p>
    </div>
    <span style="${OSW};font-size:24px;background:${INK};color:#fff;border-radius:14px;padding:12px 22px;text-transform:uppercase">👑 Lenda</span>
    ${o.fundador ? `<span style="${OSW};font-size:24px;background:${INK};color:#fff;border-radius:14px;padding:12px 22px;text-transform:uppercase">🏛️ Fundador nº${o.fundador}</span>` : ''}
  </div>

  <p style="${OSW};font-size:28px;margin-top:22px;display:flex;justify-content:space-between;align-items:center">
    <span>⚽ Leilão <span style="color:${RED}">Legends</span></span>
    <span style="font-weight:600;font-size:23px;opacity:.5">leilaolegends.com</span></p>
</body>`

const tmp = `/tmp/batismo-quad-${process.pid}.html`
fs.writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 1440 }, deviceScaleFactor: o.escala })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: o.saida })
await b.close()
console.log(`${o.saida} · ${(fs.statSync(o.saida).size / 1024).toFixed(0)} KB · ${1440 * o.escala}x${1440 * o.escala}`)
