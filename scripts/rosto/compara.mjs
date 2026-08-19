#!/usr/bin/env node
// ─── ⚖️ ANTES × DEPOIS do rosto ─────────────────────────────────────────────
//
// O Diego aprovou o boneco cheio do v1 ("adorei o gaúcho valderrama") e depois
// REPROVOU o v2, que tinha proporção realista ("nossa piorou MT"). Lição: a
// base é o v1. Este arquivo mostra o v1 PURO ao lado do v1 COM CAPRICHO
// (mecha no cabelo, sombra no queixo/pescoço, gola e manga) — mesmo boneco,
// mesmo traço, só mais bem acabado. Pro Diego escolher sem risco.
//
//   node scripts/rosto/compara.mjs --saida /tmp/compara.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { rosto } from './rosto.mjs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'compara.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const PRETO = '#241A12', CASTANHO = '#4A3018', LOIRO = '#E0A83C'
const OXIGENADO = '#EBC66A'

const AMOSTRA = [
  { n: 'Ronaldinho Gaúcho', sub: 'Barcelona · 2005', pele: 'd', cabelo: 'cachos',   cc: PRETO,    barba: 'nao',    c1: '#A50044', c2: '#143A87', tipo: 'listras' },
  { n: 'Carlos Valderrama', sub: 'Deportivo Cali · 1988', pele: 'c', cabelo: 'afro', cc: LOIRO,   barba: 'bigode', c1: '#FFFFFF', c2: '#1B7A3D', tipo: 'faixa' },
  { n: 'Lamine Yamal',      sub: 'Barcelona · 2025', pele: 'c', cabelo: 'cacheado', cc: PRETO, pint: OXIGENADO, barba: 'nao', c1: '#A50044', c2: '#143A87', tipo: 'listras' },
  { n: 'Diego Maradona',    sub: 'Napoli · 1987', pele: 'b', cabelo: 'mullet',      cc: PRETO,    barba: 'nao',    c1: '#1E9BD6', c2: '#FFFFFF', tipo: 'lisa' },
  { n: 'Paolo Maldini',     sub: 'Milan · 1994', pele: 'a', cabelo: 'risca',        cc: PRETO,    barba: 'nao',    c1: '#B3132A', c2: '#0C0C0C', tipo: 'listras' },
  { n: 'Gabriel Batistuta', sub: 'Fiorentina · 1998', pele: 'a', cabelo: 'longo',   cc: CASTANHO, barba: 'nao',    c1: '#7C3AED', c2: '#FFFFFF', tipo: 'lisa' },
]

const carta = (j, i, capricho) => `
<div class="carta">
  <div class="janela">${rosto({ ...j, corCabelo: j.cc, pintado: j.pint, id: (capricho ? 'c' : 'p') + i, capricho })}</div>
  <div class="pe"><div class="nome">${j.n}</div><div class="clube">${j.sub}</div></div>
</div>`

const col = (titulo, sel, capricho) => `
<div class="col">
  <div class="rot">${titulo}</div>
  <div class="grade">${AMOSTRA.map((j, i) => carta(j, i, capricho)).join('')}</div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:60px;line-height:.98;margin:20px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:18px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:14px;max-width:900px}
.lead b{color:#0C0C0C}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}
.col{border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.rot{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:14px;letter-spacing:.08em;padding:11px 14px}
.grade{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px}
.carta{background:#fff;border:3.5px solid #0C0C0C;border-radius:13px;box-shadow:3px 3px 0 #0C0C0C;overflow:hidden}
.janela{background:#FFF6DF;border-bottom:3.5px solid #0C0C0C;padding:6px 6px 0}
.pe{padding:5px 5px 7px;text-align:center}
.nome{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:11.5px;line-height:1.2;min-height:28px;
  display:flex;align-items:center;justify-content:center}
.clube{font-size:8.5px;font-weight:700;color:rgba(12,12,12,.45);text-transform:uppercase;letter-spacing:.03em}
.nota{margin-top:24px;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.nota .tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:15px;letter-spacing:.14em;padding:10px 16px}
.nota .corpo{padding:14px 18px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}
.nota h4{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:13px;letter-spacing:.12em;opacity:.55;font-weight:600}
.nota p{font-size:15px;line-height:1.4;margin-top:5px;font-weight:600;color:rgba(12,12,12,.8)}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:21px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">🧑 Rosto de jogador · antes × depois</div>
<h1>Voltei pro que <span class="r">você gostou</span></h1>
<p class="lead">Eu tinha errado: pra copiar o acabamento do outro jogo, joguei fora o boneco cheio que você aprovou.
Aqui está o <b>mesmo boneco de antes</b> — só que do lado direito com o capricho que faltava:
<b>mecha no cabelo</b>, <b>sombra</b> no queixo e no pescoço, e <b>gola e manga</b> na camisa.
Nada de proporção nova, nada de cara nova.</p>

<div class="duas">
  ${col('◀️ Como estava (o que você viu)', 0, false)}
  ${col('▶️ Com o capricho', 0, true)}
</div>

<div class="nota">
  <div class="tit">O que eu preciso que você diga</div>
  <div class="corpo">
    <div><h4>1 · Fica o da esquerda ou o da direita?</h4><p>São o mesmo desenho. A direita só tem mecha, sombra e gola. Se achar carregado, fico com a esquerda.</p></div>
    <div><h4>2 · Quais cabelos ainda estão errados</h4><p>Fala o nome do jogador. Cada corte é independente — mexer num não estraga os outros.</p></div>
    <div><h4>❓ Vozinha</h4><p>Continua com <b>rosto neutro</b>: eu não sei como ele é e não vou inventar. Me manda uma foto que eu monto.</p></div>
    <div><h4>↩️ Reverter</h4><p>Nada disso entrou no jogo. Está tudo em <b>scripts/</b>, que nem vai pro site.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
