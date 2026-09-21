#!/usr/bin/env node
// ─── 🧩 MOCKUP: "Depois da liga" apertado × arrumado ────────────────────────
//
// Diego (21/09): *"colocar lá juntos das ligas e organize melhor no modo de criar
// sala pois estão apertadas demais"*.
//
// Ele estava certo: o `Seg` punha TODAS as opções numa linha só, com `nowrap`.
// Com 4 já espremia o texto; com a Champions viraria 5. Agora, de 4 opções em
// diante, ele quebra em GRADE DE 2 COLUNAS — até 3 continua na linha, então nada
// do que já estava bom muda.
//
// Rodar:  node scripts/mockup-criar-sala.mjs /tmp/criar-sala.png

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTS = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400'

const botao = (label, { escolhido = false, selo = null, travado = false, grade = false, borda = '', span = false } = {}) => `
  <button class="${grade ? 'g' : 'l'} ${borda} ${span ? 'span2' : ''}" style="background:${escolhido ? GOLD : '#fff'};opacity:${travado ? 0.5 : 1};${grade ? '' : 'white-space:nowrap'}">
    ${selo ? `<span class="selo" style="background:${escolhido ? INK : GOLD};color:${escolhido ? GOLD : INK}">${selo}</span>` : ''}
    ${label}
  </button>`

// ── ANTES: 4 opções numa linha só (o que estava no ar) ──────────────────────
const antes = `<div class="seg linha">
  ${botao('🏆 Liga + Copa', { escolhido: true })}
  ${botao('🌎 Liga + Liberta', { borda: 'bl' })}
  ${botao('🌐 Liga + Mundo', { borda: 'bl', selo: 'novo' })}
  ${botao('📊 Só liga', { borda: 'bl' })}
</div>`

// ── DEPOIS: 5 opções em grade de 2 (com a Champions apagada e o selo EM BREVE) ─
const depois = `<div class="seg grade">
  ${botao('🏆 Liga + Copa', { escolhido: true, grade: true })}
  ${botao('🌎 Liga + Liberta', { grade: true, borda: 'bl' })}
  ${botao('⭐ Liga + Champions', { grade: true, borda: 'bt', selo: 'em breve', travado: true })}
  ${botao('🌐 Liga + Mundo', { grade: true, borda: 'bl bt', selo: 'novo' })}
  ${botao('📊 Só liga', { grade: true, borda: 'bt', span: true })}
</div>`

const fone = (titulo, sub, seg, explica) => `
<div class="fone">
  <p class="lbl">Depois da liga</p>
  ${seg}
  <p class="exp">${explica}</p>
</div>
<p class="cap"><b>${titulo}</b><br>${sub}</p>`

const css = `${FONTS}
*{box-sizing:border-box}
body{margin:0;background:#EFE9DA;font-family:Oswald,sans-serif;color:${INK};padding:26px}
.wrap{display:flex;gap:26px;align-items:flex-start;justify-content:center;flex-wrap:wrap;max-width:1080px;margin:0 auto}
.col{width:340px}
h1{font-size:15px;font-weight:700;text-transform:uppercase;margin:0 0 10px;letter-spacing:.4px}
h1 span{display:block;font-size:11px;font-weight:500;text-transform:none;opacity:.55;letter-spacing:0}
.fone{background:#18181B;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:13px}
.lbl{color:rgba(255,255,255,.5);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;margin:0 0 7px}
.seg{border:2.5px solid #000;border-radius:12px;overflow:hidden}
.seg.linha{display:flex}
.seg.grade{display:grid;grid-template-columns:1fr 1fr}
button.span2{grid-column:span 2}
button{font-family:Oswald;font-weight:700;color:#000;border:0;padding:9px 2px;font-size:12.5px;line-height:1.25;cursor:pointer}
button.l{flex:1}
button.bl{border-left:2.5px solid #000}
button.bt{border-top:2.5px solid #000}
.selo{display:block;margin:0 auto 3px;width:fit-content;font-size:8px;line-height:1.35;letter-spacing:1px;text-transform:uppercase;padding:1px 7px;border-radius:999px;border:1.5px solid ${INK}}
.exp{color:rgba(255,255,255,.45);font-size:10.5px;font-weight:700;line-height:1.45;margin:7px 0 0}
.cap{font-size:12px;font-weight:500;line-height:1.5;margin:11px 2px 0;color:#3d3a30}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:11px 13px;font-size:12px;font-weight:500;line-height:1.55;color:#3d3a30;margin-top:14px}
.nota b{font-weight:700}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<div class="col">
  <h1>Antes<span>4 opções numa linha só</span></h1>
  ${fone('Apertado', 'Com <b>nowrap</b> numa linha só, o texto ia sendo espremido — e a Champions seria a 5ª.', antes,
    '🏆 Acabou a liga, os 8 primeiros disputam a Copa dos 8 — ida e volta até a final única.')}
</div>
<div class="col">
  <h1>Depois<span>5 opções, grade de 2 colunas</span></h1>
  ${fone('Arrumado', 'De 4 opções em diante vira grade, e no número ímpar a última ocupa a linha toda. Até 3 continua na linha — nada do que já estava bom muda.', depois,
    '🏆 Acabou a liga, os 8 primeiros disputam a Copa dos 8 — ida e volta até a final única.')}
  <div class="nota">⭐ A <b>Champions</b> entra junto das ligas, com a tarja <b>EM BREVE</b>, <b>meio apagada</b> e <b>sem deixar marcar</b> — só a sua conta joga, como você pediu. Pra abrir pra todo mundo é uma linha só de código.</div>
</div>
</div></body></html>`

const out = process.argv[2] ?? 'mockup-criar-sala.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-criar-sala.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 520 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
