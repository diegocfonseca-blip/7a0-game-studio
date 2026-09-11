#!/usr/bin/env node
// ─── 🏛️ MOCKUP: SALÃO DOS BATISMOS (30/08 · refeito 08/09) ──────────────────
//
// Pedido original do Diego (30/08): *"algo c todos batismos, algo c times de
// coração... que a pessoa vê os times criados... vê tb quais maiores torcidas"*.
//
// 🔄 08/09 — SEM RANKING. Palavras dele: *"N quero ranking não"*.
//
// 🔄 11/09 — E SEM DIVISÃO NENHUMA. Palavras dele: *"me mande sem mostrar qm
// tá na série A ou B. E a torcida atualize e coloque com % e N quantidade. E a
// torcida é só de qm tem batismo msm"*. Então agora é UMA PAREDE SÓ, na ordem
// de quem chegou antes, e a torcida vem em PORCENTAGEM.
//
// 👉 A partir daqui o print que vale é o da TELA DE VERDADE (`salao.tsx` com a
// trava aberta na máquina). Este arquivo fica como desenho de apoio, com os
// mesmos dados — se um dia os dois brigarem, quem manda é a tela.
//
// 🔢 TUDO AQUI É REAL (batismos.ts + esc_salao_torcidas em 11/09).
//
//   node scripts/mockup-salao-batismos.mjs --saida /tmp/salao.png [--escudos pasta-com-pngs]
//
// ⚠️ É MOCKUP: nenhuma linha daqui é código do jogo (o jogo é `salao.tsx`).
// Mora no repo pra não se perder com o scratchpad da sessão (lição do Coringas).

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'mockup-salao-batismos.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const esc = n => n ? `data:image/webp;base64,${b64(`src/escalacao/img/${n}-escudo.webp`)}` : null
// 🛡️ escudos feitos em CÓDIGO (SVG do escudos.tsx) não têm arquivo. Pra eles
// entrarem no mockup, passe `--escudos <pasta>` com PNGs tirados do jogo
// (nome do arquivo = nome do clube em minúsculo, sem acento, hífen no lugar de
// espaço: `bicho-da-seda.png`). Sem a pasta, sai um 🛡️ cinza no lugar.
const pastaEsc = arg('escudos', '')
const slug = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const escPng = nome => {
  const f = pastaEsc && `${pastaEsc}/${slug(nome)}.png`
  return f && fs.existsSync(f) ? `data:image/png;base64,${b64(f)}` : null
}

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400', ROXO = '#7C3AED', VERDE = '#1B7A3D'

// ── 🛡️ TODOS OS CLUBES, sem divisão nenhuma, por nº de fundador ────────────
// [arquivo webp ou null (escudo feito em código — aparece normal no jogo), nome, nº fundador]
const CLUBES = [
  ['neymarzetti', 'Neymarzetti', 1],
  ['al-takahdao', 'Al Takhadao FC', 53],
  [null, 'Bicho da Seda', 11],
  [null, 'Xurupitas FC', 13],
  ['toka10', 'Tôka10', 23],
  ['leao-estradinha', 'Leão da Estradinha', 28],
  [null, 'Barcenite FC', 31],
  ['manfre', 'Manfré FC', 34],
  [null, 'Marolados FC', 38],
  ['papao', 'Papão United Madrid', 39],
  ['sapek', 'Sapekeiros FC', 41],
  ['nata', 'Nata de SP', 45],
  ['saoluiz', 'São Luiz FC', 48],
  [null, 'La Bestia Negra', 51],
  ['ferrari', 'SC Ferrari', 52],
  ['vidraceiro', 'Vidraceiro FC', 58],
  ['bagres', 'Bagres 1993', 59],
  ['brigadegalo', 'Briga de Galo FC', 62],
  [null, 'Fala D10', 64],
  ['sodeussabe', 'Só Deus Sabe FC', 65],
]

// (continuação da MESMA lista — não existe mais grupo separado)
const CLUBES_2 = [
  [null, 'White Thigs do GuGu', 'primeiro'], // 🥋 1º batismo da história, dono desconhecido — sem nº
  [null, 'Vasco da Grana', 'batismo'], // pedido do Diego (03/08), sem dono — sem nº; desceu pra Série D em 08/09
  [null, 'Nightfull FC', 18], // desceu pra Série B em 09/09 (abriu o assento do Só Deus Sabe FC)
  [null, 'Murriz FC', 21],
  ['skyy', 'Skyy FC', 24], // desceu pra Série D em 09/09 (abriu o assento do Fala D10)
  [null, 'Marreco FC', 29],
  [null, 'Alfacehh', 30],
  [null, 'Remoçada', 35],
  [null, 'Scorporila FC', 36],
  [null, 'Deportivo Montreal', 37],
  [null, 'Seven City', 42],
  ['arruda', 'Tricolor do Arruda FC', 43],
  ['coringas', 'Coringas do Diniz', 44],
  ['bigao', 'Crias do Bigão', 46],
  ['theuzudo', 'Theuzudo FC', 47],
  ['milhaca', 'Milhaça FC', 49],
  ['lluch', 'Esqueceram do Lluch', 50],
  ['jurubeba', 'Jurubeba FC', 54],
  ['capsule', 'Corporação Capsule FC', 55],
  ['stocco', 'Stocco FC', 56],
  ['finalboss', 'Final Boss FC', 57],
  ['novaeclipse', 'Nova Eclipse FC', 60],
  ['sistematizados', 'Sistematizados FC', 61],
  ['eros', 'Eros FC', 'socio'],
  ['futpoint', 'Futpoint FC', 'socio'],
  [null, 'Marinheiros AS', 'socio'],
]

// ── ❤️ torcidas — SÓ DONO DE BATISMO (esc_salao_torcidas, 11/09) ───────────
// Sócio de assinatura saiu da conta (pedido do Diego): a função no banco filtra
// `origem = 'batismo'`. O que aparece é a % do total de donos que declararam
// time de coração — nunca a quantidade de gente.
const TORCIDAS = [
  { nome: 'Corinthians', n: 5, c1: '#0C0C0C', c2: '#FFFFFF', clubes: 'Coringas do Diniz · Fala D10 · Nata de SP · Nova Eclipse FC · SC Ferrari' },
  { nome: 'Santos', n: 4, c1: '#FFFFFF', c2: '#0C0C0C', clubes: 'Sapekeiros FC · Scorporila FC · Sistematizados FC · Tôka10' },
  { nome: 'Flamengo', n: 3, c1: '#C2001E', c2: '#0C0C0C', clubes: 'Barcenite FC · Murriz FC · Neymarzetti' },
  { nome: 'Atlético Mineiro', n: 2, c1: '#0C0C0C', c2: '#FFFFFF', clubes: 'Nightfull FC · Só Deus Sabe FC' },
  { nome: 'Internacional', n: 2, c1: '#C2001E', c2: '#FFFFFF', clubes: 'Al Takhadao FC · Deportivo Montreal' },
  { nome: 'Palmeiras', n: 2, c1: '#1B7A3D', c2: '#FFFFFF', clubes: 'Marolados FC · Xurupitas FC' },
  { nome: 'Botafogo', n: 1, c1: '#0C0C0C', c2: '#FFFFFF', clubes: 'Bicho da Seda' },
  { nome: 'Cruzeiro', n: 1, c1: '#0E3E86', c2: '#FFFFFF', clubes: 'La Bestia Negra' },
  { nome: 'Grêmio', n: 1, c1: '#0A72B8', c2: '#0C0C0C', clubes: 'Vidraceiro FC' },
  { nome: 'Paraná Clube', n: 1, c1: '#C2001E', c2: '#0E3E86', clubes: 'Manfré FC' },
  { nome: 'Paysandu', n: 1, c1: '#0E3E86', c2: '#FFFFFF', clubes: 'Papão United Madrid' },
  { nome: 'Remo', n: 1, c1: '#0E3E86', c2: '#FFFFFF', clubes: 'Remoçada' },
  { nome: 'Rio Branco', n: 1, c1: '#C2001E', c2: '#FFFFFF', clubes: 'Leão da Estradinha' },
  { nome: 'Santa Cruz', n: 1, c1: '#0C0C0C', c2: '#C2001E', clubes: 'Tricolor do Arruda FC' },
  { nome: 'São Paulo', n: 1, c1: '#C2001E', c2: '#0C0C0C', clubes: 'Bagres de Wall Street FC' },
]
const maiorT = TORCIDAS[0].n
const totalT = TORCIDAS.reduce((s, t) => s + t.n, 0)
const pct = n => { const v = 100 * n / totalT; return v >= 10 ? `${Math.round(v)}%` : `${v.toFixed(1).replace('.', ',')}%` }

const selo = f => f === 'socio' ? `<span class="pc-sel branco">🎫 sócio</span>`
  : f === 'primeiro' ? `<span class="pc-sel">🥇 1º da história</span>`
  : f === 'batismo' ? `<span class="pc-sel">🖋️ batismo</span>`
  : `<span class="pc-sel">🏛️ nº${f}</span>`
const card = ([img, nome, f]) => {
  const src = img ? esc(img) : escPng(nome)
  return `
  <div class="pc">
    ${src ? `<img src="${src}" alt="${nome}">` : `<div class="pc-sem">🛡️</div>`}
    <p class="pc-nome">${nome}</p>
    ${selo(f)}
  </div>`
}

const faixa = (t, s) => `<div class="faixa"><b>${t}</b><span>${s}</span></div>`

const barraTorcida = t => `
  <div class="tor">
    <div class="tor-linha">
      <span class="tor-listra" style="background:repeating-linear-gradient(90deg,${t.c1} 0 7px,${t.c2} 7px 14px)"></span>
      <span class="tor-nome">${t.nome}</span>
      <span class="tor-barra"><i style="width:${Math.round(100 * t.n / maiorT)}%"></i></span>
      <span class="tor-n">${pct(t.n)}</span>
    </div>
    <p class="tor-clubes">❤️ ${t.clubes}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url('${fonte(400)}') format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url('${fonte(600)}') format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url('${fonte(700)}') format('woff2');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};font-family:Inter,system-ui,sans-serif;color:${TINTA};width:940px;padding:26px 24px 34px}
h1{font-family:Oswald;font-weight:700;font-size:38px;text-transform:uppercase;line-height:1}
.pil{display:inline-block;font-family:Oswald;font-weight:700;font-size:11.5px;text-transform:uppercase;letter-spacing:1.4px;
  background:${OURO};border:2.5px solid ${TINTA};border-radius:99px;padding:3px 13px;box-shadow:3px 3px 0 ${TINTA};margin-bottom:10px}
.lead{font-size:13.5px;font-weight:700;color:rgba(12,12,12,.6);margin-top:7px;line-height:1.45}
.abas{display:flex;gap:7px;margin:18px 0 16px}
.abas div{font-family:Oswald;font-weight:700;font-size:14px;border:3px solid ${TINTA};border-radius:11px;padding:7px 15px;background:#fff}
.abas .on{background:${OURO}}
.bloco{border:4px solid ${TINTA};border-radius:18px;background:#fff;box-shadow:6px 6px 0 ${TINTA};margin-bottom:22px;overflow:hidden}
.cab{background:${TINTA};color:#fff;padding:9px 15px;display:flex;justify-content:space-between;align-items:center}
.cab b{font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.6px}
.cab span{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.6)}
.corpo{padding:14px 15px 16px}
/* faixas de grupo */
.faixa{display:flex;justify-content:space-between;align-items:baseline;border:3px solid ${TINTA};border-radius:11px;background:${TINTA};color:#fff;padding:7px 13px;margin:4px 0 11px}
.faixa b{font-family:Oswald;font-weight:700;font-size:17px;text-transform:uppercase;letter-spacing:.8px}
.faixa span{font-size:11px;font-weight:700;color:rgba(255,255,255,.6)}
.faixa.varzea{margin-top:20px}
/* parede */
.parede{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}
.pc{border:3px solid ${TINTA};border-radius:13px;background:${CREME};box-shadow:3px 3px 0 ${TINTA};padding:13px 9px 11px;text-align:center;position:relative}
.pc img{height:66px;width:auto;display:block;margin:0 auto 7px;max-width:100%}
.pc-sem{height:66px;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.28;margin-bottom:7px}
.pc-nome{font-family:Oswald;font-weight:700;font-size:13px;line-height:1.1}
.pc-sel{position:absolute;top:6px;right:6px;font-size:9px;font-weight:800;background:${OURO};border:2px solid ${TINTA};border-radius:99px;padding:0 5px}
.pc-sel.branco{background:#fff}
/* torcidas */
.tor{margin-bottom:9px}
.tor-linha{display:flex;align-items:center;gap:9px}
.tor-listra{width:24px;height:22px;border:2.5px solid ${TINTA};border-radius:5px;flex:none}
.tor-nome{font-family:Oswald;font-weight:700;font-size:14px;width:120px;flex:none}
.tor-barra{flex:1;height:15px;background:rgba(12,12,12,.08);border-radius:99px;overflow:hidden}
.tor-barra i{display:block;height:100%;background:${ROXO};border-radius:99px}
.tor-n{font-family:Oswald;font-weight:700;font-size:15px;width:52px;text-align:right}
.tor-clubes{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.5);margin:2px 0 0 33px}
.nota{border:3px solid ${TINTA};border-radius:12px;background:#FFF4CF;padding:10px 13px;margin-top:12px;font-size:12px;font-weight:700;line-height:1.45}
.cta{border:4px solid ${TINTA};border-radius:16px;background:${VERDE};color:#fff;box-shadow:5px 5px 0 ${TINTA};padding:14px 16px;text-align:center}
.cta b{font-family:Oswald;font-weight:700;font-size:20px;display:block}
.cta span{font-size:12.5px;font-weight:700;color:rgba(255,255,255,.85);display:block;margin-top:3px}
.rod{text-align:center;font-size:12px;font-weight:700;color:rgba(12,12,12,.45);margin-top:16px}
</style></head><body>

<span class="pil">🏛️ dentro da aba Ranking</span>
<h1>Salão dos Batismos</h1>
<p class="lead">Todo clube que virou de alguém está aqui, com o escudo que aparece no jogo.
<b>${CLUBES.length + CLUBES_2.length} clubes</b> · 54 vagas ainda livres.</p>

<div class="abas"><div class="on">🛡️ Clubes</div><div>❤️ Torcidas</div></div>

<div class="bloco">
  <div class="cab"><b>🛡️ Os clubes</b><span>sem divisão, sem ranking, sem título — a ordem é quem chegou antes (nº de fundador)</span></div>
  <div class="corpo">
    <div class="parede">${[...CLUBES, ...CLUBES_2].map(card).join('')}</div>
    <div class="nota"><b>Nenhum clube diz em que série está</b> — nem Série A, nem B, nem várzea. É uma parede só,
    na ordem de quem chegou antes.</div>
  </div>
</div>

<div class="bloco">
  <div class="cab"><b>❤️ Torcidas</b><span>de cada 100 donos de clube batizado, quantos torcem por cada time</span></div>
  <div class="corpo">
    ${TORCIDAS.map(barraTorcida).join('')}
  </div>
</div>

<div class="cta"><b>🔨 Sua vaga está livre</b><span>54 clubes ainda esperam dono — vire Lenda e batize o seu</span></div>
<p class="rod">⚽ Leilão Legends · mockup pra aprovação — no ar só pra conta do Diego</p>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.waitForTimeout(400)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${Math.round(fs.statSync(saida).size / 1024)} KB`)
