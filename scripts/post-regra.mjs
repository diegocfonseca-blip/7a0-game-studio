#!/usr/bin/env node
// ─── 📢 POST DE REGRA/NOVIDADE — o formato pra anunciar mudança de regra ─────
//
// Irmão do `mockup-batismo.mjs`, mesma identidade da casa (creme, tinta preta,
// borda grossa, sombra dura, Oswald de `scripts/fonts/`). O de batismo anuncia
// um CLUBE; este anuncia uma REGRA — pontuação, mudança de formato, etc.
//
// Existe pelo mesmo motivo do outro: pra ninguém montar arte à mão de novo e
// perder quando a máquina trocar. Toda mudança de regra que o Diego quiser
// postar sai daqui, com a mesma cara.
//
// ── COMO USAR ───────────────────────────────────────────────────────────────
//   node scripts/post-regra.mjs --config scripts/posts/rank-pontos.json --saida /tmp/post.png
//
// O JSON manda em tudo (ver `scripts/posts/rank-pontos.json` de exemplo):
//   pill · titulo · destaque (sai em vermelho) · titulo2 · lead
//   tabela: [{ emoji, nome, valor, bg, cor }]   ← os selos, na ordem do post
//   antesDepois: { antes, depois }              ← a caixa "era assim / é assim"
//   nota                                        ← a linha de rodapé explicando

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const cfgPath = arg('config')
const saida = arg('saida', 'post-regra.png')
if (!cfgPath) { console.error('faltou --config (veja o cabeçalho do arquivo)'); process.exit(1) }
const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))

const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:890px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 22px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:17px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:72px;line-height:.98;margin:22px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:19px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:16px;max-width:810px}
.lead b{color:#0C0C0C}
.card{border:4px solid #0C0C0C;border-radius:22px;box-shadow:6px 6px 0 #0C0C0C;overflow:hidden;background:#fff;margin-top:22px}
.tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:17px;letter-spacing:.14em;padding:11px 18px;display:flex;align-items:center;gap:9px}
.linha{display:flex;align-items:center;gap:14px;padding:13px 20px;border-bottom:2px solid rgba(12,12,12,.09)}
.linha:last-child{border-bottom:0}
.selo{flex:none;min-width:132px;display:inline-flex;align-items:center;gap:7px;border:3px solid #0C0C0C;border-radius:10px;
  padding:6px 12px;font-family:Oswald,sans-serif;font-weight:700;font-size:17px;text-transform:uppercase;
  box-shadow:2.5px 2.5px 0 #0C0C0C}
.nome{flex:1;font-size:18px;font-weight:700;color:rgba(12,12,12,.75)}
.val{font-family:Oswald,sans-serif;font-weight:700;font-size:34px;min-width:112px;text-align:right}
.val small{font-size:16px;font-weight:600;opacity:.5;margin-left:4px}
.ad{display:grid;grid-template-columns:1fr 1fr;gap:0}
.ad>div{padding:18px 20px}
.ad .a{background:#FFF1E8;border-right:3px solid #0C0C0C}
.ad .d{background:#EFF9F2}
.ad h4{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:14px;letter-spacing:.14em;font-weight:600;opacity:.55}
.ad p{font-size:17px;line-height:1.42;font-weight:700;margin-top:7px}
.ad .a p{color:#8E2A1B}
.ad .d p{color:#14683A}
.nota{margin-top:18px;font-size:15.5px;line-height:1.45;color:rgba(12,12,12,.6);text-align:center}
.nota b{color:#0C0C0C}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:24px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:22px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:14px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">${c.pill}</div>
<h1>${c.titulo}<br><span class="r">${c.destaque}</span>${c.titulo2 ? `<br>${c.titulo2}` : ''}</h1>
<p class="lead">${c.lead}</p>

<div class="card">
  <div class="tit">${c.tabelaTitulo}</div>
  ${c.tabela.map(t => `
  <div class="linha">
    <span class="selo" style="background:${t.bg};color:${t.cor}">${t.emoji} ${t.selo}</span>
    <span class="nome">${t.nome}</span>
    <span class="val">${t.valor}<small>pts</small></span>
  </div>`).join('')}
</div>

${c.antesDepois ? `<div class="card"><div class="ad">
  <div class="a"><h4>Era assim</h4><p>${c.antesDepois.antes}</p></div>
  <div class="d"><h4>Agora é assim</h4><p>${c.antesDepois.depois}</p></div>
</div></div>` : ''}

${c.nota ? `<p class="nota">${c.nota}</p>` : ''}

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 890, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
