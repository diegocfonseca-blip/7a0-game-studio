#!/usr/bin/env node
// ─── 🧑 FOLHA DE ROSTOS v2 — o acabamento novo, nos dois estilos ─────────────
//
//   node scripts/rosto/folha2.mjs --saida /tmp/rostos2.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { rosto2 } from './rosto2.mjs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'rostos2.png')

const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const PRETO = '#241A12', CASTANHO = '#4A3018', LOIRO = '#D9A83C', GRISALHO = '#6E6659'
const OXIGENADO = '#EBC66A'

export const JOGADORES = [
  { n: 'Pelé',              club: 'Santos',         ano: 1962, f: 5, pele: 'd', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'lisa' },
  { n: 'Ronaldo Fenômeno',  club: 'Inter',          ano: 1998, f: 5, pele: 'c', cabelo: 'topete',   cc: PRETO,    barba: 'nao',    c1: '#0B1560', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Lamine Yamal',      club: 'Barcelona',      ano: 2025, f: 4, pele: 'c', cabelo: 'cacheado', cc: PRETO, pint: OXIGENADO, barba: 'nao', c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Neymar',            club: 'Santos',         ano: 2011, f: 5, pele: 'b', cabelo: 'moicano',  cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'lisa' },
  { n: 'Vinícius Júnior',   club: 'Real Madrid',    ano: 2024, f: 5, pele: 'd', cabelo: 'tranca',   cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#C9A227', gola: '#C9A227', tipo: 'lisa' },
  { n: 'Lionel Messi',      club: 'Barcelona',      ano: 2012, f: 5, pele: 'a', cabelo: 'topete',   cc: CASTANHO, barba: 'nao',    c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Ronaldinho Gaúcho', club: 'Barcelona',      ano: 2005, f: 5, pele: 'd', cabelo: 'cachos',   cc: PRETO,    barba: 'nao',    c1: '#A50044', c2: '#143A87', gola: '#F5C542', tipo: 'listras' },
  { n: 'Kaká',              club: 'Milan',          ano: 2007, f: 5, pele: 'a', cabelo: 'risca',    cc: CASTANHO, barba: 'nao',    c1: '#B3132A', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Zinedine Zidane',   club: 'Real Madrid',    ano: 2002, f: 5, pele: 'b', cabelo: 'coroa',    cc: GRISALHO, barba: 'nao',    c1: '#FFFFFF', c2: '#C9A227', gola: '#C9A227', tipo: 'lisa' },
  { n: 'Paolo Maldini',     club: 'Milan',          ano: 1994, f: 5, pele: 'a', cabelo: 'risca',    cc: PRETO,    barba: 'nao',    c1: '#B3132A', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Kylian Mbappé',     club: 'PSG',            ano: 2022, f: 5, pele: 'd', cabelo: 'raspado',  cc: PRETO,    barba: 'nao',    c1: '#0A1A44', c2: '#C2452F', gola: '#C2452F', tipo: 'meio' },
  { n: 'Carlos Valderrama', club: 'Deportivo Cali', ano: 1988, f: 5, pele: 'c', cabelo: 'afro',     cc: LOIRO,    barba: 'bigode', c1: '#FFFFFF', c2: '#1B7A3D', gola: '#1B7A3D', tipo: 'faixa' },
  { n: 'Diego Maradona',    club: 'Napoli',         ano: 1987, f: 5, pele: 'b', cabelo: 'mullet',   cc: PRETO,    barba: 'nao',    c1: '#1E9BD6', c2: '#FFFFFF', gola: '#FFFFFF', tipo: 'lisa' },
  { n: 'Adriano Imperador', club: 'Inter',          ano: 2005, f: 5, pele: 'e', cabelo: 'raspado',  cc: PRETO,    barba: 'cavan',  c1: '#0B1560', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'listras' },
  { n: 'Romário',           club: 'Vasco',          ano: 2000, f: 5, pele: 'd', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#FFFFFF', c2: '#0C0C0C', gola: '#0C0C0C', tipo: 'faixa' },
  { n: 'Gabriel Batistuta', club: 'Fiorentina',     ano: 1998, f: 4, pele: 'a', cabelo: 'longo',    cc: CASTANHO, barba: 'nao',    c1: '#7C3AED', c2: '#FFFFFF', gola: '#FFFFFF', tipo: 'lisa' },
  // ❓ sem referência do rosto — rosto neutro, não chute (regra do Diego 18/08)
  { n: 'Vozinha',           club: 'Cabo Verde',     ano: 2026, f: 5, pele: 'c', cabelo: 'curto',    cc: PRETO,    barba: 'nao',    c1: '#143A87', c2: '#C2452F', gola: '#C2452F', tipo: 'banda', semRef: true },
]

const estrelas = f => '★'.repeat(f) + '<span class="off">' + '★'.repeat(5 - f) + '</span>'
const svg = (j, i, estilo) => rosto2({ ...j, corCabelo: j.cc, pintado: j.pint, id: estilo + i, estilo })

const carta = (j, i, estilo) => `
<div class="carta${j.semRef ? ' duvida' : ''}">
  <div class="janela">${svg(j, i, estilo)}${j.semRef ? '<div class="tag">❓ rosto neutro</div>' : ''}</div>
  <div class="pe">
    <div class="nome">${j.n}</div>
    <div class="clube">${j.club} · ${j.ano}</div>
    <div class="fama">${estrelas(j.f)}</div>
  </div>
</div>`

// os 3 do topo saem nos DOIS acabamentos, lado a lado, pro Diego escolher
const AMOSTRA = [2, 6, 11].map(i => JOGADORES[i])
const compara = ['casa', 'suave'].map(e => `
<div class="col">
  <div class="rot">${e === 'casa' ? '🅰️ Com contorno preto (nossa identidade)' : '🅱️ Sem contorno, só sombra'}</div>
  <div class="tri">${AMOSTRA.map((j, k) => carta(j, 100 + k, e)).join('')}</div>
</div>`).join('')

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1060px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:62px;line-height:.98;margin:20px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:18px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:14px;max-width:960px}
.lead b{color:#0C0C0C}
.escolha{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}
.col{border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.rot{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:14px;letter-spacing:.10em;padding:10px 14px}
.tri{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px}
.grade{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:22px}
.carta{background:#fff;border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden}
.tri .carta{box-shadow:3px 3px 0 #0C0C0C}
.janela{background:#FFF6DF;border-bottom:4px solid #0C0C0C;position:relative;overflow:hidden}
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
h2{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:26px;margin-top:30px;
  letter-spacing:.03em;display:flex;align-items:center;gap:10px}
h2 small{font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-transform:none;letter-spacing:0;
  color:rgba(12,12,12,.5)}
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
<div class="pill">🧑 Mockup 4 · rosto de jogador</div>
<h1>Agora com <span class="r">acabamento</span></h1>
<p class="lead">O que faltava não era estilo, era acabamento: <b>proporção de gente</b> (cabeça oval, pescoço, ombro),
<b>camisa com gola e manga</b>, <b>mecha no cabelo</b> e <b>sombra</b>. Continua sendo peça — o desenho entra uma vez
e serve pros 1.414.</p>

<h2>Escolha o acabamento <small>é a única coisa que preciso que você decida agora</small></h2>
<div class="escolha">${compara}</div>

<h2>Os 17 no acabamento 🅰️</h2>
<div class="grade">${JOGADORES.map((j, i) => carta(j, i, 'casa')).join('')}</div>

<div class="nota">
  <div class="tit">Como isso funciona</div>
  <div class="corpo">
    <div><h4>Peso</h4><p>Figura pronta = 1.414 arquivos pra baixar. Peça = 4 letrinhas por jogador. <b>Zero KB novo.</b></p></div>
    <div><h4>O que mudou do mockup anterior</h4><p>Cabeça oval em vez de bola, pescoço e ombro de verdade, gola e manga na camisa, mecha e sombra.</p></div>
    <div><h4>❓ Quando eu não sei quem é</h4><p>Entra o <b>rosto neutro</b> e a carta fica marcada, como o Vozinha aqui. <b>Nada de inventar</b> cabelo e barba de quem eu nunca vi.</p></div>
    <div><h4>Reversível</h4><p>É um arquivo só e um campo no baralho. Não gostou? Tira e o jogo volta como estava.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1060, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
