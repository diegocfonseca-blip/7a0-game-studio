#!/usr/bin/env node
// ─── 🧑 FOLHA v3 — os 17 SEM olho, boca e nariz (direção do Diego 19/08) ─────
//   node scripts/rosto/folha3.mjs --saida /tmp/rostos3.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { rosto3 } from './rosto3.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'rostos3.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const PRETO = '#241A12', CASTANHO = '#4A3018', LOIRO = '#D9A83C', GRISALHO = '#6E6659', OXI = '#EBC66A'

const J = [
  { n: 'Pelé',              c: 'Santos · 1962',         f: 5, pele: 'd', cab: 'curto',    cc: PRETO,    b: 'nao',    fundo: '#0C0C0C', c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'lisa' },
  { n: 'Ronaldo Fenômeno',  c: 'Inter · 1998',          f: 5, pele: 'c', cab: 'topete',   cc: PRETO,    b: 'nao',    fundo: '#0B1560', c1: '#0B1560', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Lamine Yamal',      c: 'Barcelona · 2025',      f: 4, pele: 'c', cab: 'cacheado', cc: PRETO, pint: OXI, b: 'nao', fundo: '#A50044', c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Neymar',            c: 'Santos · 2011',         f: 5, pele: 'b', cab: 'moicano',  cc: PRETO,    b: 'nao',    fundo: '#1B7A3D', c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'lisa' },
  { n: 'Vinícius Júnior',   c: 'Real Madrid · 2024',    f: 5, pele: 'd', cab: 'tranca',   cc: PRETO,    b: 'nao',    fundo: '#4C2E86', c1: '#FFFFFF', c2: '#C9A227', gola: '#C9A227', tipo: 'lisa' },
  { n: 'Lionel Messi',      c: 'Barcelona · 2012',      f: 5, pele: 'a', cab: 'topete',   cc: CASTANHO, b: 'nao',    fundo: '#143A87', c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Ronaldinho Gaúcho', c: 'Barcelona · 2005',      f: 5, pele: 'd', cab: 'cachos',   cc: PRETO,    b: 'nao',    fundo: '#E8503A', c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Kaká',              c: 'Milan · 2007',          f: 5, pele: 'a', cab: 'risca',    cc: CASTANHO, b: 'nao',    fundo: '#8E1B2A', c1: '#B3132A', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Zinedine Zidane',   c: 'Real Madrid · 2002',    f: 5, pele: 'b', cab: 'coroa',    cc: GRISALHO, b: 'nao',    fundo: '#1E4C8A', c1: '#FFFFFF', c2: '#C9A227', gola: '#C9A227', tipo: 'lisa' },
  { n: 'Paolo Maldini',     c: 'Milan · 1994',          f: 5, pele: 'a', cab: 'risca',    cc: PRETO,    b: 'nao',    fundo: '#0C0C0C', c1: '#B3132A', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Kylian Mbappé',     c: 'PSG · 2022',            f: 5, pele: 'd', cab: 'raspado',  cc: PRETO,    b: 'nao',    fundo: '#0A1A44', c1: '#0A1A44', c2: '#C2452F', gola: '#C2452F', tipo: 'meio' },
  { n: 'Carlos Valderrama', c: 'Deportivo Cali · 1988', f: 5, pele: 'c', cab: 'afro',     cc: LOIRO,    b: 'bigode', fundo: '#1B7A3D', c1: '#FFFFFF', c2: '#1B7A3D', gola: '#1B7A3D', tipo: 'faixa' },
  { n: 'Diego Maradona',    c: 'Napoli · 1987',         f: 5, pele: 'b', cab: 'mullet',   cc: PRETO,    b: 'nao',    fundo: '#1E9BD6', c1: '#1E9BD6', c2: '#FFFFFF', gola: '#FFFFFF', tipo: 'lisa' },
  { n: 'Adriano Imperador', c: 'Inter · 2005',          f: 5, pele: 'e', cab: 'raspado',  cc: PRETO,    b: 'cavan',  fundo: '#0B1560', c1: '#0B1560', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Romário',           c: 'Vasco · 2000',          f: 5, pele: 'd', cab: 'curto',    cc: PRETO,    b: 'nao',    fundo: '#0C0C0C', c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'faixa' },
  { n: 'Gabriel Batistuta', c: 'Fiorentina · 1998',     f: 4, pele: 'a', cab: 'longo',    cc: CASTANHO, b: 'nao',    fundo: '#7C3AED', c1: '#7C3AED', c2: '#FFFFFF', gola: '#FFFFFF', tipo: 'lisa' },
  // ❓ sem referência do rosto — peça neutra, não chute (regra do Diego 18/08)
  { n: 'Vozinha',           c: 'Cabo Verde · 2026',     f: 5, pele: 'c', cab: 'curto',    cc: PRETO,    b: 'nao',    fundo: '#143A87', c1: '#143A87', c2: '#C2452F', gola: '#C2452F', tipo: 'banda', semRef: true },
]

const estrelas = f => '★'.repeat(f) + '<span class="off">' + '★'.repeat(5 - f) + '</span>'
const carta = (j, i) => `
<div class="carta${j.semRef ? ' duvida' : ''}">
  <div class="janela">${rosto3({ pele: j.pele, cabelo: j.cab, corCabelo: j.cc, pintado: j.pint, barba: j.b,
    fundo: j.fundo, c1: j.c1, c2: j.c2, gola: j.gola, tipo: j.tipo, id: 'x' + i })}${j.semRef ? '<div class="tag">❓ peça neutra</div>' : ''}</div>
  <div class="pe"><div class="nome">${j.n}</div><div class="clube">${j.c}</div><div class="fama">${estrelas(j.f)}</div></div>
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
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:62px;line-height:.98;margin:20px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:18px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:14px;max-width:900px}
.lead b{color:#0C0C0C}
.grade{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:26px}
.carta{background:#fff;border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden}
.janela{border-bottom:4px solid #0C0C0C;position:relative;line-height:0}
.tag{position:absolute;left:6px;right:6px;bottom:6px;background:#FFC400;border:2.5px solid #0C0C0C;border-radius:8px;
  font-family:Oswald,sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;
  text-align:center;padding:3px 2px;box-shadow:2px 2px 0 #0C0C0C;line-height:1.2}
.pe{padding:7px 8px 9px;text-align:center}
.nome{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;line-height:1.22;
  min-height:34px;display:flex;align-items:center;justify-content:center}
.clube{font-size:10px;font-weight:700;color:rgba(12,12,12,.5);text-transform:uppercase;letter-spacing:.03em;margin-top:2px}
.fama{color:#FFC400;font-size:13px;letter-spacing:1px;margin-top:3px;-webkit-text-stroke:.7px #0C0C0C}
.fama .off{color:rgba(12,12,12,.14);-webkit-text-stroke:0}
.nota{margin-top:26px;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
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
<div class="pill">🧑 Rosto de jogador · sem olho, boca e nariz</div>
<h1>Agora do <span class="r">jeito certo</span></h1>
<p class="lead">Sem olho, sem boca, sem nariz — como você mandou. O que identifica o jogador é o
<b>cabelo</b>, a <b>barba</b> e as <b>cores do clube</b> (o fundo é a cor do time). Some a cara de emoji,
e some também o risco de eu inventar o traço de alguém.</p>

<div class="grade">${J.map(carta).join('')}</div>

<div class="nota">
  <div class="tit">Como isso funciona</div>
  <div class="corpo">
    <div><h4>Peso</h4><p>Figura pronta = 1.414 arquivos pra baixar. Peça = 5 letrinhas por jogador. <b>Zero KB novo.</b></p></div>
    <div><h4>Por que sem rosto ajuda</h4><p>Sem olho e boca não tem chute de traço — o que vale é o cabelo, que todo mundo lembra.</p></div>
    <div><h4>❓ Quando eu não sei quem é</h4><p>Entra a <b>peça neutra</b> e a carta fica marcada, como o Vozinha aqui.</p></div>
    <div><h4>↩️ Reverter</h4><p>Nada entrou no jogo. Está tudo em <b>scripts/</b>, que nem vai pro site.</p></div>
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
