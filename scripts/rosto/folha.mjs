#!/usr/bin/env node
// ─── 🧑 FOLHA DE ROSTOS — mockup pro Diego aprovar ───────────────────────────
//
// Mostra o sistema de peças (`rosto.mjs`) aplicado nos 17 jogadores que o Diego
// pediu. NÃO é arte pronta baixada: é o MESMO desenho pra todos, trocando só
// pele / cabelo / barba / cores da camisa. Por isso 1.414 jogadores custam o
// mesmo que 17 — cada um guarda 4 letrinhas no baralho, não um arquivo.
//
// Sem escudo na camisa de propósito (só as cores e o padrão do clube), como o
// Diego pediu: "camisa de time Tb parecida mas sem escudo".
//
//   node scripts/rosto/folha.mjs --saida /tmp/rostos.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { rosto } from './rosto.mjs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'rostos.png')

const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// cores de cabelo
const PRETO = '#241A12', CASTANHO = '#4A3018', LOIRO = '#E0A83C', GRISALHO = '#6B6357'
const OXIGENADO = '#EBC66A' // cabelo pintado/descolorido

// ── os 17, com clube/ano/fama REAIS do data.ts ──────────────────────────────
const JOGADORES = [
  { n: 'Pelé',                club: 'Santos',         ano: 1962, f: 5, pele: 'd', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', tipo: 'lisa' },
  { n: 'Ronaldo Fenômeno',    club: 'Inter',          ano: 1998, f: 5, pele: 'c', cabelo: 'topete',    cc: PRETO,    barba: 'nao',    c1: '#0B1560', c2: '#0C0C0C', tipo: 'listras' },
  { n: 'Lamine Yamal',        club: 'Barcelona',      ano: 2025, f: 4, pele: 'c', cabelo: 'cacheado', cc: PRETO,    pint: OXIGENADO, barba: 'nao',    c1: '#A50044', c2: '#143A87', tipo: 'listras' },
  { n: 'Neymar',              club: 'Santos',         ano: 2011, f: 5, pele: 'b', cabelo: 'moicano',  cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', tipo: 'lisa' },
  { n: 'Vinícius Júnior',     club: 'Real Madrid',    ano: 2024, f: 5, pele: 'd', cabelo: 'tranca',   cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#C9A227', tipo: 'lisa' },
  { n: 'Lionel Messi',        club: 'Barcelona',      ano: 2012, f: 5, pele: 'a', cabelo: 'topete',    cc: CASTANHO, barba: 'nao',    c1: '#A50044', c2: '#143A87', tipo: 'listras' },
  { n: 'Ronaldinho Gaúcho',   club: 'Barcelona',      ano: 2005, f: 5, pele: 'd', cabelo: 'cachos',   cc: PRETO,    barba: 'nao',    c1: '#A50044', c2: '#143A87', tipo: 'listras' },
  { n: 'Kaká',                club: 'Milan',          ano: 2007, f: 5, pele: 'a', cabelo: 'risca',     cc: CASTANHO, barba: 'nao',    c1: '#B3132A', c2: '#0C0C0C', tipo: 'listras' },
  { n: 'Zinedine Zidane',     club: 'Real Madrid',    ano: 2002, f: 5, pele: 'b', cabelo: 'coroa',    cc: GRISALHO, barba: 'nao',    c1: '#FFFFFF', c2: '#C9A227', tipo: 'lisa' },
  { n: 'Paolo Maldini',       club: 'Milan',          ano: 1994, f: 5, pele: 'a', cabelo: 'risca',     cc: PRETO,    barba: 'nao',    c1: '#B3132A', c2: '#0C0C0C', tipo: 'listras' },
  { n: 'Kylian Mbappé',       club: 'PSG',            ano: 2022, f: 5, pele: 'd', cabelo: 'raspado',  cc: PRETO,    barba: 'nao',    c1: '#0A1A44', c2: '#C2452F', tipo: 'meio' },
  { n: 'Carlos Valderrama',   club: 'Deportivo Cali', ano: 1988, f: 5, pele: 'c', cabelo: 'afro',     cc: LOIRO,    barba: 'bigode', c1: '#FFFFFF', c2: '#1B7A3D', tipo: 'faixa' },
  { n: 'Diego Maradona',      club: 'Napoli',         ano: 1987, f: 5, pele: 'b', cabelo: 'mullet',   cc: PRETO,    barba: 'nao',    c1: '#1E9BD6', c2: '#FFFFFF', tipo: 'lisa' },
  { n: 'Adriano Imperador',   club: 'Inter',          ano: 2005, f: 5, pele: 'e', cabelo: 'raspado',  cc: PRETO,    barba: 'cavan',  c1: '#0B1560', c2: '#0C0C0C', tipo: 'listras' },
  { n: 'Romário',             club: 'Vasco',          ano: 2000, f: 5, pele: 'd', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', tipo: 'faixa' },
  { n: 'Gabriel Batistuta',   club: 'Fiorentina',     ano: 1998, f: 4, pele: 'a', cabelo: 'longo',    cc: CASTANHO, barba: 'nao',    c1: '#7C3AED', c2: '#FFFFFF', tipo: 'lisa' },
  // ❓ NÃO SEI COMO ELE É. Goleiro de Cabo Verde, não tenho referência do rosto.
  // O que está aqui é o rosto NEUTRO (a peça padrão), não um chute de como ele
  // seria — regra do Diego (18/08): quando não souber, FALAR, não inventar.
  { n: 'Vozinha',             club: 'Cabo Verde',     ano: 2026, f: 5, pele: 'c', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#143A87', c2: '#C2452F', tipo: 'banda', semRef: true },
]

const estrelas = f => '★'.repeat(f) + '<span class="off">' + '★'.repeat(5 - f) + '</span>'

const cartas = JOGADORES.map((j, i) => `
<div class="carta${j.semRef ? ' duvida' : ''}">
  <div class="janela">${rosto({ pele: j.pele, cabelo: j.cabelo, corCabelo: j.cc, pintado: j.pint, barba: j.barba, c1: j.c1, c2: j.c2, tipo: j.tipo, id: 'j' + i })}
    ${j.semRef ? '<div class="tag">❓ rosto neutro</div>' : ''}</div>
  <div class="pe">
    <div class="nome">${j.n}</div>
    <div class="clube">${j.club} · ${j.ano}</div>
    <div class="fama">${estrelas(j.f)}</div>
  </div>
</div>`).join('')

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:64px;line-height:.98;margin:20px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:18px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:14px;max-width:900px}
.lead b{color:#0C0C0C}
.grade{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-top:26px}
.carta{background:#fff;border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden}
.janela{background:#FFF6DF;border-bottom:4px solid #0C0C0C;padding:8px 8px 0;position:relative}
.carta.duvida .janela{background:#F1EDE2}
.tag{position:absolute;left:6px;right:6px;bottom:6px;background:#FFC400;border:2.5px solid #0C0C0C;border-radius:8px;
  font-family:Oswald,sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;
  text-align:center;padding:3px 2px;box-shadow:2px 2px 0 #0C0C0C}
.pe{padding:7px 8px 9px;text-align:center}
.nome{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;line-height:1.22;
  letter-spacing:.01em;min-height:34px;display:flex;align-items:center;justify-content:center}
.clube{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.5);text-transform:uppercase;letter-spacing:.03em;margin-top:2px}
.fama{color:#FFC400;font-size:13px;letter-spacing:1px;margin-top:3px;-webkit-text-stroke:.7px #0C0C0C}
.fama .off{color:rgba(12,12,12,.14);-webkit-text-stroke:0}
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
<div class="pill">🧑 Mockup · rosto de jogador</div>
<h1>Cada lenda com <span class="r">a cara dela</span></h1>
<p class="lead">Um boneco só, no traço da casa — e as <b>peças</b> mudam: pele, cabelo, barba e as cores do clube.
Cabelo parecido com o do jogador, camisa parecida com a do time, <b>sem escudo</b>. Não é figura baixada:
é desenho do jogo, então <b>1.414 jogadores pesam o mesmo que estes 17</b>.</p>

<div class="grade">${cartas}</div>

<div class="nota">
  <div class="tit">Como isso funciona</div>
  <div class="corpo">
    <div><h4>Peso</h4><p>Figura pronta = 1.414 arquivos pra baixar. Peça = 4 letrinhas por jogador. <b>Zero KB novo.</b></p></div>
    <div><h4>Cara do jogo</h4><p>Mesmo traço preto grosso, creme e sombra dura das cartas — não parece de outro jogo.</p></div>
    <div><h4>❓ Quando eu não sei quem é</h4><p>Entra o <b>rosto neutro</b> e a carta fica marcada, como o Vozinha aqui. <b>Nada de inventar</b> cabelo e barba de quem eu nunca vi.</p></div>
    <div><h4>Reversível</h4><p>É um arquivo só e um campo no baralho. Não gostou? Tira e o jogo volta como estava.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
