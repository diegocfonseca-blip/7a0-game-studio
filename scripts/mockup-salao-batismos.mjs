#!/usr/bin/env node
// ─── 🏛️ MOCKUP: SALÃO DOS BATISMOS (30/08) ──────────────────────────────────
//
// Pedido do Diego: *"precisamos criar algum ranking sei lá algo c todos
// batismos, algo c times de coração sei lá... que a pessoa vê o mockup dos
// times criados... vê tb quais maiores torcidas"*.
//
// 🔢 TUDO AQUI É NÚMERO REAL, medido no banco em 30/08 — nada inventado:
//   8.470 contas · 32 donos de batismo · 30 sócios · 235 com time de coração
//   e o palmarés de cada clube saiu de `esc_results` (227.755 linhas), somando
//   nome VELHO + nome NOVO pelo e-mail do dono (senão o Xurupitas apareceria
//   duas vezes, uma como "Tokyo City Esperion").
//
//   node scripts/mockup-salao-batismos.mjs --saida /tmp/salao.png
//
// ⚠️ É MOCKUP: nenhuma linha daqui é código do jogo. Mora no repo pra não se
// perder com o scratchpad da sessão (lição do Coringas).

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'mockup-salao-batismos.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const esc = n => `data:image/webp;base64,${b64(`src/escalacao/img/${n}-escudo.webp`)}`

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400', ROXO = '#7C3AED', VERDE = '#1B7A3D'

// ── palmarés REAL (esc_results, somado por dono) ─────────────────────────────
const RANK = [
  { p: 1, clube: 'Xurupitas FC',          dono: 'Denilson',  img: null,               t: 794, s: 1866, f: 13, div: 'D' },
  { p: 2, clube: 'Alfacehh',              dono: 'Matheus',   img: null,               t: 396, s: 850,  f: 30, div: 'B' },
  { p: 3, clube: 'Leão da Estradinha',    dono: 'Jorge',     img: esc('leao-estradinha'), t: 186, s: 669, f: 28, div: 'A' },
  { p: 4, clube: 'Deportivo Montreal',    dono: 'Gabriel',   img: null,               t: 172, s: 603,  f: null, div: 'A' },
  { p: 5, clube: 'La Bestia Negra',       dono: 'Elton',     img: null,               t: 121, s: 363,  f: 36, div: 'D' },
  { p: 6, clube: 'Tôka10',                dono: 'Toka',      img: esc('toka10'),      t: 99,  s: 515,  f: 23, div: 'D' },
  { p: 7, clube: 'Seven City',            dono: 'Gláucio',   img: null,               t: 95,  s: 532,  f: null, div: 'A' },
  { p: 8, clube: 'Marinheiros AS',        dono: 'Felipe',    img: null,               t: 86,  s: 273,  f: 27, div: '—' },
  { p: 9, clube: 'Manfré FC',             dono: 'Daniel',    img: esc('manfre'),      t: 83,  s: 491,  f: 34, div: 'D' },
  { p: 10, clube: 'Scorporila FC',        dono: 'Lucas',     img: null,               t: 80,  s: 363,  f: null, div: 'A' },
]

// ── as maiores torcidas (auth.users → time_coracao) ─────────────────────────
const TORCIDAS = [
  { nome: 'Flamengo', n: 43, c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Corinthians', n: 33, c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'São Paulo', n: 28, c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'Palmeiras', n: 23, c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Vasco', n: 22, c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Santos', n: 16, c1: '#FFFFFF', c2: '#0C0C0C' },
  { nome: 'Grêmio', n: 11, c1: '#0A72B8', c2: '#0C0C0C' },
  { nome: 'Internacional', n: 10, c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'Cruzeiro', n: 9, c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'Fluminense', n: 8, c1: '#8B1A3A', c2: '#1B7A3D' },
]
const maiorT = TORCIDAS[0].n

// ── a parede (só quem tem arte própria entra com escudo de verdade) ─────────
const PAREDE = [
  ['manfre', 'Manfré FC', 'Daniel', 'D', 34],
  ['leao-estradinha', 'Leão da Estradinha', 'Jorge', 'A', 28],
  ['toka10', 'Tôka10', 'Toka', 'D', 23],
  ['papao', 'Papão United Madrid', 'Leandro', 'D', 39],
  ['theuzudo', 'Theuzudo FC', 'Matheus', 'B', null],
  ['milhaca', 'Milhaça FC', 'Igor', 'C', null],
  ['skyy', 'Skyy FC', 'Matheus', 'D', 24],
  ['saoluiz', 'São Luiz FC', 'Gabriel', 'D', null],
  ['bigao', 'Crias do Bigão', 'Giovanne', 'B', null],
  ['nata', 'Nata de SP', 'Pedro', 'D', null],
  ['lluch', 'Esqueceram do Lluch', 'Marcel', 'D', null],
  ['neymarzetti', 'Neymarzetti', 'Diego', 'D', 1],
]

const linhaRank = r => `
  <div class="rk ${r.p <= 3 ? 'top' : ''}">
    <span class="rk-pos">${r.p}º</span>
    <span class="rk-escudo">${r.img ? `<img src="${r.img}">` : `<i class="sem">🛡️</i>`}</span>
    <div class="rk-nome">
      <p class="rk-clube">${r.clube}</p>
      <p class="rk-dono">${r.dono} · Série ${r.div}${r.f ? ` · 🏛️ fundador nº${r.f}` : ''}</p>
    </div>
    <div class="rk-num"><b>${r.t}</b><span>títulos</span></div>
    <div class="rk-num fraco"><b>${r.s}</b><span>temporadas</span></div>
  </div>`

const cardParede = ([img, nome, dono, div, f]) => `
  <div class="pc">
    <img src="${esc(img)}" alt="${nome}">
    <p class="pc-nome">${nome}</p>
    <p class="pc-dono">${dono} · Série ${div}</p>
    ${f ? `<span class="pc-sel">🏛️ nº${f}</span>` : ''}
  </div>`

const barraTorcida = t => `
  <div class="tor">
    <span class="tor-listra" style="background:repeating-linear-gradient(90deg,${t.c1} 0 7px,${t.c2} 7px 14px)"></span>
    <span class="tor-nome">${t.nome}</span>
    <span class="tor-barra"><i style="width:${Math.round(100 * t.n / maiorT)}%"></i></span>
    <span class="tor-n">${t.n}</span>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url('${fonte(400)}') format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url('${fonte(600)}') format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url('${fonte(700)}') format('woff2');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};font-family:Inter,system-ui,sans-serif;color:${TINTA};width:940px;padding:26px 24px 34px}
.osw{font-family:Oswald;font-weight:700}
h1{font-family:Oswald;font-weight:700;font-size:38px;text-transform:uppercase;line-height:1}
.pil{display:inline-block;font-family:Oswald;font-weight:700;font-size:11.5px;text-transform:uppercase;letter-spacing:1.4px;
  background:${OURO};border:2.5px solid ${TINTA};border-radius:99px;padding:3px 13px;box-shadow:3px 3px 0 ${TINTA};margin-bottom:10px}
.lead{font-size:13.5px;font-weight:700;color:rgba(12,12,12,.6);margin-top:7px;line-height:1.45}
.abas{display:flex;gap:7px;margin:18px 0 16px}
.abas div{font-family:Oswald;font-weight:700;font-size:14px;border:3px solid ${TINTA};border-radius:11px;padding:7px 15px;background:#fff}
.abas .on{background:${TINTA};color:#fff}
.bloco{border:4px solid ${TINTA};border-radius:18px;background:#fff;box-shadow:6px 6px 0 ${TINTA};margin-bottom:22px;overflow:hidden}
.cab{background:${TINTA};color:#fff;padding:9px 15px;display:flex;justify-content:space-between;align-items:center}
.cab b{font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.6px}
.cab span{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.6)}
.corpo{padding:14px 15px 16px}
/* ranking */
.rk{display:flex;align-items:center;gap:11px;border:2.5px solid ${TINTA};border-radius:11px;background:#fff;padding:7px 11px;margin-bottom:7px}
.rk.top{background:#FFF7DE}
.rk-pos{font-family:Oswald;font-weight:700;font-size:17px;width:32px;color:rgba(12,12,12,.45)}
.rk.top .rk-pos{color:${TINTA}}
.rk-escudo{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex:none}
.rk-escudo img{height:40px;width:auto;display:block}
.rk-escudo .sem{font-size:24px;font-style:normal;opacity:.35}
.rk-nome{flex:1;min-width:0}
.rk-clube{font-family:Oswald;font-weight:700;font-size:16px;line-height:1.1}
.rk-dono{font-size:11px;font-weight:700;color:rgba(12,12,12,.5);margin-top:1px}
.rk-num{text-align:center;width:78px;flex:none}
.rk-num b{display:block;font-family:Oswald;font-weight:700;font-size:19px;line-height:1}
.rk-num span{display:block;font-size:9.5px;font-weight:700;color:rgba(12,12,12,.45);text-transform:uppercase;letter-spacing:.6px;margin-top:1px}
.rk-num.fraco b{color:rgba(12,12,12,.45);font-size:16px}
/* parede */
.parede{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}
.pc{border:3px solid ${TINTA};border-radius:13px;background:${CREME};box-shadow:3px 3px 0 ${TINTA};padding:11px 9px 10px;text-align:center;position:relative}
.pc img{height:66px;width:auto;display:block;margin:0 auto 7px}
.pc-nome{font-family:Oswald;font-weight:700;font-size:13px;line-height:1.1}
.pc-dono{font-size:10px;font-weight:700;color:rgba(12,12,12,.5);margin-top:2px}
.pc-sel{position:absolute;top:6px;right:6px;font-size:9px;font-weight:800;background:${OURO};border:2px solid ${TINTA};border-radius:99px;padding:0 5px}
.mais{border:3px dashed rgba(12,12,12,.3);border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:11px 9px;background:rgba(255,255,255,.5)}
.mais b{font-family:Oswald;font-weight:700;font-size:15px}
.mais span{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.5);margin-top:3px;line-height:1.3}
/* torcidas */
.tor{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.tor-listra{width:24px;height:22px;border:2.5px solid ${TINTA};border-radius:5px;flex:none}
.tor-nome{font-family:Oswald;font-weight:700;font-size:14px;width:118px;flex:none}
.tor-barra{flex:1;height:15px;background:rgba(12,12,12,.08);border-radius:99px;overflow:hidden}
.tor-barra i{display:block;height:100%;background:${ROXO};border-radius:99px}
.tor-n{font-family:Oswald;font-weight:700;font-size:15px;width:34px;text-align:right}
.aviso{border:3px solid ${TINTA};border-radius:12px;background:#FFF4CF;padding:10px 13px;margin-top:12px;font-size:12px;font-weight:700;line-height:1.45}
.cta{border:4px solid ${TINTA};border-radius:16px;background:${VERDE};color:#fff;box-shadow:5px 5px 0 ${TINTA};padding:14px 16px;text-align:center}
.cta b{font-family:Oswald;font-weight:700;font-size:20px;display:block}
.cta span{font-size:12.5px;font-weight:700;color:rgba(255,255,255,.85);display:block;margin-top:3px}
.rod{text-align:center;font-size:12px;font-weight:700;color:rgba(12,12,12,.45);margin-top:16px}
</style></head><body>

<span class="pil">🏛️ novo · dentro do Álbum</span>
<h1>Salão dos Batismos</h1>
<p class="lead">Todo clube que virou de alguém está aqui: escudo, dono, divisão e o que já ganhou.
<b>32 clubes batizados</b> · 68 vagas ainda livres.</p>

<div class="abas"><div class="on">🏆 Ranking</div><div>🖼️ A Parede</div><div>❤️ Torcidas</div></div>

<div class="bloco">
  <div class="cab"><b>🏆 O ranking dos batismos</b><span>títulos de todas as carreiras · números reais do banco</span></div>
  <div class="corpo">
    ${RANK.map(linhaRank).join('')}
    <div class="aviso">📊 <b>De onde sai:</b> cada temporada terminada já é gravada hoje (227 mil linhas). O ranking só SOMA o que
    o clube fez — nome velho e nome novo entram juntos (o Xurupitas era Tokyo City Esperion; o Leão era Império Samambaia).
    Nada de novo precisa ser guardado.</div>
  </div>
</div>

<div class="bloco">
  <div class="cab"><b>🖼️ A parede dos clubes</b><span>toque num escudo pra abrir a ficha do clube</span></div>
  <div class="corpo">
    <div class="parede">
      ${PAREDE.map(cardParede).join('')}
      <div class="pc mais"><b>+20</b><span>clubes batizados</span></div>
      <div class="pc mais"><b>68</b><span>vagas ainda livres</span></div>
    </div>
  </div>
</div>

<div class="bloco">
  <div class="cab"><b>❤️ As maiores torcidas</b><span>235 pessoas já disseram de qual time torcem</span></div>
  <div class="corpo">
    ${TORCIDAS.map(barraTorcida).join('')}
    <div class="aviso">⚠️ <b>Diego, esta parte é decisão sua.</b> Sua regra, escrita em <b>coracao.ts</b> e <b>manto.ts</b>, diz:
    <i>"nome de clube real NUNCA aparece dentro do jogo — só as CORES"</i>. Escrever "Flamengo — 43" quebra essa regra.
    Duas saídas: <b>(A)</b> só a listra e o número, sem nome — respeita a regra, mas quase ninguém adivinha qual é;
    <b>(B)</b> com o nome, como está aqui — é texto, não é escudo nem marca, e o post do batismo já escreve
    "❤️ Coração: Paraná Clube". <b>Eu recomendo a B</b>, mas a regra é sua e só você muda.</div>
  </div>
</div>

<div class="cta"><b>🔨 Sua vaga está livre</b><span>68 clubes ainda esperam dono — vire Lenda e batize o seu</span></div>
<p class="rod">⚽ Leilão Legends · mockup pra decisão — nada disso está no ar</p>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.waitForTimeout(400)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${Math.round(fs.statSync(saida).size / 1024)} KB`)
