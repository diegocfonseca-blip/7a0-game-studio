#!/usr/bin/env node
// ─── 🖼️ MOCKUP: como o rosto ficaria NOS CAMPINHOS ──────────────────────────
//
// Pedido do Diego (19/08): *"me mande mockup como apareceria nos campinhos seja
// do leilão ou seja em elenco do carreira"* — e, importante, *"N pedi p por no
// jogo ainda.. calma"*. Então isto é SÓ desenho: nada aqui toca no jogo.
//
// ⚠️ As medidas NÃO são chutadas — são as do código de verdade:
//   · campinho do LEILÃO   → `Campinho` em `src/escalacao/screens.tsx`
//     slot: borda 2px, canto 8px, min-width 76px (56 no small), nome 11px,
//     faixa do manto 16px, gramado listrado de 34px.
//   · campinho do ELENCO   → `pyramidseason.tsx`
//     ficha: borda 2px, canto 8px, MAX-width 96px, nome 10.5px,
//     faixa do manto 14px, gramado listrado de 38px.
//
//   node scripts/rosto/mockup-campinho.mjs --fotos /tmp/faces --saida /tmp/campinho.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'campinho.png')
const dir = arg('fotos', '')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`

const INK = '#0C0C0C', RED = '#E8503A', GREEN = '#1B7A3D'
// manto de exemplo: preto e dourado (o do Futpoint FC), pra mostrar a faixa
const MANTO = `repeating-linear-gradient(90deg,#181818 0 9px,#B89040 9px 18px)`

// os 4 que o GPT gerou. `f` = arquivo; sem `f`, a ficha fica como está hoje.
const F = k => (dir ? img(path.join(dir, k)) : '')
const XI = {
  ATA: [{ n: 'Neymar', f: F('face-a.png'), g: 2 }, { n: 'Mbappé', f: F('face-d.png'), g: 1 }, { n: 'Bebeto' }],
  MEI: [{ n: 'Messi', f: F('face-c.png'), g: 3 }, { n: 'Ronaldinho', f: F('face-b.png') }, { n: 'Falcão' }],
  DEF: [{ n: 'Roberto Carlos' }, { n: 'Lúcio' }, { n: 'Aldair' }, { n: 'Cafu' }],
  GOL: [{ n: 'Taffarel' }],
}
const POS = { ATA: 'ATA', MEI: 'MEI', DEF: 'DEF', GOL: 'GOL' }
const POS_REAL = { ATA: 'ATA', MEI: 'MEI', DEF: 'ZAG', GOL: 'GOL' }

// ── campinho do LEILÃO (Campinho de screens.tsx) ───────────────────────────
const leilao = (comFoto, alturaFoto) => `
<div class="pitch leilao">
  <div class="tituloManto"><span>⭐ Titulares</span></div>
  <div class="grama" style="background:repeating-linear-gradient(180deg,#1B7A3D 0 34px,#166332 34px 68px)">
    ${['ATA', 'MEI', 'DEF', 'GOL'].map(k => `
    <div class="linha" style="gap:10px">
      ${XI[k].map(j => `
      <div class="slot" style="min-width:76px">
        <span class="faixa" style="height:16px;background:${MANTO}"><b>${k === 'DEF' ? 'ZAG' : POS[k]}</b></span>
        ${comFoto && j.f ? `<img class="foto" src="${j.f}" style="height:${alturaFoto}px">` : ''}
        <p class="nome" style="font-size:11px">${j.n}</p>
        ${j.g ? `<p class="gol">⚽ ${j.g}</p>` : ''}
      </div>`).join('')}
    </div>`).join('')}
  </div>
</div>`

// ── campinho do ELENCO (pyramidseason.tsx) ─────────────────────────────────
const elenco = (comFoto, alturaFoto) => `
<div class="pitch">
  <div class="grama" style="background:repeating-linear-gradient(180deg,#1B7A3D 0 38px,#166332 38px 76px);padding:14px 5px;gap:9px">
    ${['ATA', 'MEI', 'DEF', 'GOL'].map(k => `
    <div class="linha" style="gap:5px">
      ${XI[k].map(j => `
      <div class="ficha">
        <span class="faixa" style="height:14px;background:${MANTO}"><b>${k === 'DEF' ? 'ZAG' : POS[k]}</b></span>
        ${comFoto && j.f ? `<img class="foto" src="${j.f}" style="height:${alturaFoto}px">` : ''}
        <p class="nome" style="font-size:10.5px">${j.n}</p>
        ${j.g ? `<p class="gol">⚽ ${j.g}</p>` : ''}
      </div>`).join('')}
    </div>`).join('')}
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1100px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:58px;line-height:.98;margin:18px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:17.5px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:13px;max-width:1000px}
.lead b{color:#0C0C0C}
h2{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:22px;margin:28px 0 12px;
  letter-spacing:.03em;display:flex;align-items:baseline;gap:10px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.48)}
.tres{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start}
.col .rot{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:13px;letter-spacing:.08em;
  background:#0C0C0C;color:#fff;padding:8px 12px;border-radius:10px 10px 0 0;border:3px solid #0C0C0C;border-bottom:0}
.col .cx{border:3px solid #0C0C0C;border-radius:0 0 12px 12px;box-shadow:4px 4px 0 #0C0C0C;background:#fff;padding:10px}
.pitch{border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;box-shadow:3px 3px 0 #0C0C0C}
.tituloManto{background:${MANTO};border-bottom:3px solid #0C0C0C;height:22px;display:flex;align-items:center;justify-content:center}
.tituloManto span{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:10px;color:#fff;
  letter-spacing:.06em;text-shadow:1px 1px 0 rgba(0,0,0,.85)}
.grama{padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.linha{display:flex;justify-content:center;flex-wrap:nowrap}
.slot,.ficha{position:relative;border:2px solid #0C0C0C;border-radius:8px;background:#fff;text-align:center;
  overflow:hidden;font-family:Oswald,sans-serif;flex:1 1 0;min-width:0}
.slot{padding:20px 6px 4px}
.ficha{padding:17px 6px 3px;max-width:96px}
.faixa{position:absolute;top:0;left:0;right:0;border-bottom:2px solid #0C0C0C;display:flex;align-items:center;justify-content:center}
.faixa b{font-family:Oswald,sans-serif;font-size:7px;font-weight:700;color:#fff;background:rgba(0,0,0,.42);
  border-radius:6px;padding:0 5px;letter-spacing:.5px;line-height:1.6}
.foto{display:block;margin:1px auto 1px;width:auto;object-fit:contain}
.nome{font-weight:800;color:#0C0C0C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
.gol{font-size:8.5px;font-weight:800;color:#1B7A3D;line-height:1.2}
.nota{margin-top:26px;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.nota .tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:14.5px;letter-spacing:.12em;padding:10px 16px}
.nota .corpo{padding:14px 18px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px 22px}
.nota h4{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:13px;letter-spacing:.10em;opacity:.55;font-weight:600}
.nota p{font-size:14.5px;line-height:1.42;margin-top:5px;font-weight:600;color:rgba(12,12,12,.8)}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:21px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">🖼️ Mockup · rosto no campinho</div>
<h1>Como ficaria <span class="r">em campo</span></h1>
<p class="lead">Só desenho — <b>nada disso está no jogo</b>. As medidas são as de verdade, tiradas do código:
o campinho do leilão e o do elenco têm tamanhos diferentes, então os dois estão aqui.
Repare: <b>só quem já tem foto muda</b>. Os outros 7 continuam exatamente como hoje.</p>

<h2>1 · Campinho do LEILÃO <small>o que aparece embaixo, enquanto você dá lance</small></h2>
<div class="tres">
  <div class="col"><div class="rot">Como está hoje</div><div class="cx">${leilao(false, 0)}</div></div>
  <div class="col"><div class="rot">Com foto pequena (34px)</div><div class="cx">${leilao(true, 34)}</div></div>
  <div class="col"><div class="rot">Com foto grande (52px)</div><div class="cx">${leilao(true, 52)}</div></div>
</div>

<h2>2 · Campinho do ELENCO da carreira <small>a ficha é um pouco menor aqui (máx. 96px)</small></h2>
<div class="tres">
  <div class="col"><div class="rot">Como está hoje</div><div class="cx">${elenco(false, 0)}</div></div>
  <div class="col"><div class="rot">Com foto pequena (32px)</div><div class="cx">${elenco(true, 32)}</div></div>
  <div class="col"><div class="rot">Com foto grande (48px)</div><div class="cx">${elenco(true, 48)}</div></div>
</div>

<div class="nota">
  <div class="tit">Duas coisas que você perguntou</div>
  <div class="corpo">
    <div><h4>👕 A camisa muda quando ele vem pro meu time?</h4>
      <p><b>Não — e é assim de propósito.</b> A carta do Messi é do <b>Barcelona · 2012</b>: ela é uma figurinha
      daquele jogador naquele ano. Se a camisa mudasse, a figurinha perdia o sentido.
      <b>A SUA cor já aparece</b>: é a faixa listrada no topo de cada ficha (aqui, preto e dourado) — é o seu manto,
      e ele pinta o time inteiro.</p></div>
    <div><h4>📦 Escala pra 4.000?</h4>
      <p><b>Escala.</b> Medi nas 4 artes que o GPT fez de verdade: <b>6 a 8,7 KB</b> cada a 256px — mais leve que
      os 14 KB que eu tinha estimado. 4.000 × 8 KB = <b>32 MB no servidor</b>, e o celular só baixa o que vê:
      <b>11 rostos no campinho ≈ 90 KB</b>, e depois fica no cache.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
