#!/usr/bin/env node
// ─── 🌎 MOCKUP: AS TELAS DE JOGO DA LIBERTADORES ───────────────────────────
//
// Pedido do Diego (20/08): *"E o mockup visuais dos jogos? Das tabelas do placar
// grande dos placares dos outros jogos?"*
//
// ⚠️ NADA DE ARTE NOVA. Tudo aqui é o que JÁ EXISTE no jogo, copiado do código:
//   · o placar grande é o `LiveScoreCard` (`pyramidseason.tsx:1907`) — faixa de
//     narração preta em cima, relógio em pílula no meio, times coloridos nas
//     laterais, número grande no creme e os goleadores embaixo.
//   · a faixa dos goleadores muda de cor por competição (`footTint`) — a família
//     hoje é 🟢 Copa do Brasil · 🔵 Supercopa · 🟣 Copa dos 8. A Libertadores
//     entra como **azul-noite**. É a ÚNICA coisa nova de visual nesta folha, e
//     está marcada pro Diego aprovar (§5 do docs/conceito-libertadores.md).
//   · a tabela e os outros jogos usam as caixas de sempre (borda preta grossa,
//     sombra dura, Oswald).
//
//   node scripts/mockup-liberta-jogo.mjs --saida /tmp/liberta-jogo.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'liberta-jogo.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const INK = '#0C0C0C', OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'
// 🌑 a cor da Libertadores (proposta): azul-noite. Entra no rodapé do placar,
// no chip do topo e na barra do grupo — a mesma ideia do verde da Copa do Brasil.
const NOITE = '#1B2A5B', NOITE_BORDA = '#3C57A8', NOITE_CLARO = '#E7ECFA'

// placar grande, igual ao LiveScoreCard
const placar = ({ narra, narraCor, narraTxt, min, casa, casaCor, fora, foraCor, hg, ag, golsCasa, golsFora, vc }) => `
<div class="card">
  <div class="narra" style="background:${narraCor}">
    <p style="color:${narra === 'gol' ? INK : '#fff'}">${narraTxt}</p>
  </div>
  <div class="corpo">
    <span class="relogio"><i class="${min === 'FIM' ? 'off' : ''}"></i>${min}</span>
    <div class="times">
      <div class="time" style="background:${casaCor}">
        <p>${casa}</p>${vc === 'casa' ? '<span class="vc">VOCÊ</span>' : ''}
      </div>
      <div class="pl"><b>${hg}</b><i>×</i><b>${ag}</b></div>
      <div class="time" style="background:${foraCor}">
        <p>${fora}</p>${vc === 'fora' ? '<span class="vc">VOCÊ</span>' : ''}
      </div>
    </div>
  </div>
  <div class="pe">
    <div class="pec dir">${golsCasa.map(g => `<p>${g}</p>`).join('')}</div>
    <div></div>
    <div class="pec esq">${golsFora.map(g => `<p>${g}</p>`).join('')}</div>
  </div>
</div>`

const OUTROS = [
  ['🇦🇷 Independente da Grana', 2, 1, '🇻🇪 Deportivo Tá Xiro'],
  ['🇨🇱 Universidade do Chilique', 0, 0, '🇦🇷 River Preite'],
  ['🇺🇾 Penhalol', 3, 1, '🇧🇴 Bolívar 3.600'],
  ['🇵🇾 Serro Portenho', 1, 2, '🇨🇴 Milionários FC'],
]
const TABELA = [
  ['🏆', 'SEU TIME', 4, 3, 1, 0, '+7', 10, 1],
  ['🇦🇷', 'Independente da Grana', 4, 2, 1, 1, '+4', 7, 2],
  ['🇨🇱', 'Universidade do Chilique', 4, 1, 1, 2, '-1', 4, 3],
  ['🇻🇪', 'Deportivo Tá Xiro', 4, 0, 1, 3, '-10', 1, 4],
]

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:${INK};font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;gap:10px;background:${OURO};border:3px solid ${INK};border-radius:999px;padding:8px 20px;
  font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;box-shadow:4px 4px 0 ${INK}}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:56px;line-height:.97;margin:18px 0 0}
h1 .a{color:${NOITE}}
.lead{font-size:16.5px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:950px}
.lead b{color:${INK}}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:22px;margin:30px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}

/* chip da competição no topo da tela do jogo */
.chip{display:inline-flex;align-items:center;gap:8px;background:${NOITE};color:#fff;border:3px solid ${INK};
  border-radius:12px;padding:7px 14px;font-family:D,sans-serif;font-weight:700;font-size:13.5px;letter-spacing:.08em;
  text-transform:uppercase;box-shadow:3px 3px 0 ${INK}}

/* ── o placar grande (LiveScoreCard) ── */
.telas{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.card{border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};background:#fff;overflow:hidden}
.narra{text-align:center}
.narra p{margin:0;padding:8px 10px;font-family:D,sans-serif;font-weight:700;font-size:13.5px;letter-spacing:.04em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.corpo{position:relative}
.relogio{position:absolute;top:9px;left:50%;transform:translateX(-50%);background:${INK};color:#fff;font-family:D,sans-serif;
  font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px;display:flex;align-items:center;gap:7px;z-index:2;white-space:nowrap}
.relogio i{width:8px;height:8px;border-radius:999px;background:#ff5b4d;display:block}
.relogio i.off{background:${VERDE}}
.times{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch}
.time{padding:30px 10px 14px;text-align:center;position:relative}
.time p{font-family:D,sans-serif;font-weight:700;font-size:16px;text-transform:uppercase;color:#fff;line-height:1.1;
  text-shadow:1.5px 1.5px 0 rgba(0,0,0,.45)}
.time .vc{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:${OURO};color:${INK};
  font-family:D,sans-serif;font-weight:700;font-size:9px;padding:1px 7px;border-radius:5px;letter-spacing:.06em}
.pl{display:flex;align-items:center;justify-content:center;padding:26px 8px 10px;min-width:96px;
  font-family:D,sans-serif;font-weight:700;font-size:36px;color:${INK};line-height:1}
.pl b{padding:0 8px}
.pl i{color:#b8b0a0;font-size:17px;font-style:normal}
.pe{display:grid;grid-template-columns:1fr 96px 1fr;border-top:2px solid ${NOITE_BORDA};background:${NOITE_CLARO};min-height:34px}
.pec{padding:6px 10px}
.pec.dir{text-align:right}
.pec p{font-family:D,sans-serif;font-weight:700;font-size:11.5px;color:${NOITE};line-height:1.5}

/* outros jogos */
.jogo{display:flex;align-items:center;gap:10px;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:7px 11px;margin-bottom:7px}
.jogo .t{flex:1;font-family:D,sans-serif;font-weight:700;font-size:13.5px;text-transform:uppercase;line-height:1.15}
.jogo .t.d{text-align:right}
.jogo .p{font-family:D,sans-serif;font-weight:700;font-size:16px;background:${INK};color:#fff;border-radius:7px;padding:2px 10px;white-space:nowrap}

/* tabela */
.tb{width:100%;border-collapse:collapse}
.tb th{font-family:D,sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(12,12,12,.45);padding:0 4px 6px;text-align:center}
.tb th.l{text-align:left}
.tb td{padding:6px 4px;text-align:center;font-weight:700;font-size:13px;border-top:2px solid rgba(0,0,0,.08)}
.tb td.l{text-align:left;font-family:D,sans-serif;font-size:14px;text-transform:uppercase}
.tb tr.passa td{background:#E7F5EC}
.tb tr.eu td{background:#FFF2C4}
.tb td.pt{font-family:D,sans-serif;font-size:17px}
.cx{border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};background:#fff;padding:15px 17px}
.cxt{font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:10px}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}
.it{display:flex;gap:11px;align-items:flex-start}
.it .n{font-family:D,sans-serif;font-weight:700;font-size:19px;color:${VERM};line-height:1.05;width:26px;flex:0 0 26px}
.it p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.it p b{color:${INK}}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
</style>

<div class="pill">🌎 Mockup · as telas de jogo</div>
<h1>O placar é o mesmo.<br>Muda a <span class="a">cor da competição</span>.</h1>
<p class="lead">Nada de tela nova: é o <b>mesmo placar ao vivo</b> que já roda na liga, na Copa do Brasil e na Copa dos 8 —
relógio correndo, narração em cima, goleadores embaixo. A única coisa nova é a <b>cor da Libertadores</b> na faixa de
baixo: hoje a família é 🟢 Copa do Brasil · 🔵 Supercopa · 🟣 Copa dos 8, e a Liberta entra em <b>azul-noite</b>.</p>

<h2>1 · O jogo, ao vivo <small>fase de grupos e mata-mata</small></h2>
<div style="margin-bottom:12px"><span class="chip">🌎 Libertadores · Grupo A · Rodada 4 de 6</span></div>
<div class="telas">
  <div>
    ${placar({ narra: 'gol', narraCor: OURO, narraTxt: '⚽ GOOOL! Neymar 67\'', min: "71'",
      casa: 'SEU TIME', casaCor: '#1B7A3D', fora: 'River Preite', foraCor: '#C2452F',
      hg: 2, ag: 1, golsCasa: ["Neymar 23'", "Neymar 67'"], golsFora: ["Bochini 52'"], vc: 'casa' })}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);margin-top:8px">
      ⚽ <b>Gol</b>: a faixa de cima acende dourada com o autor e o minuto — igual hoje.</p>
  </div>
  <div>
    <div style="margin-bottom:12px"><span class="chip" style="background:${VERM}">🏆 Libertadores · Oitavas · Volta</span></div>
    ${placar({ narra: 'fim', narraCor: INK, narraTxt: '🔔 FIM DE JOGO — agregado 3 × 3, vai pra pênaltis', min: 'FIM',
      casa: 'Boca Xuniors', casaCor: '#1B2A5B', fora: 'SEU TIME', foraCor: '#1B7A3D',
      hg: 2, ag: 1, golsCasa: ["Bochini 12'", "Cubillas 80'"], golsFora: ["Neymar 55'"], vc: 'fora' })}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);margin-top:8px">
      🔔 <b>Mata-mata</b>: a narração passa a somar a ida e a volta e avisa quando vai pra pênaltis.</p>
  </div>
</div>

<h2>2 · Os outros jogos e a tabela <small>o que rola no seu grupo ao mesmo tempo</small></h2>
<div class="telas">
  <div class="cx">
    <p class="cxt">⚽ Outros jogos da rodada</p>
    ${OUTROS.map(([a, x, y, b]) => `
      <div class="jogo"><span class="t d">${a}</span><span class="p">${x} × ${y}</span><span class="t">${b}</span></div>`).join('')}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);margin-top:8px;line-height:1.4">
      Aparecem <b>só os jogos do SEU grupo</b> — os outros 7 grupos ficam na tela dos grupos, pra não virar paredão.</p>
  </div>
  <div class="cx">
    <p class="cxt">📊 Como está o Grupo A</p>
    <table class="tb">
      <tr><th class="l">Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>P</th></tr>
      ${TABELA.map(([f, n, j, v, e, d, sg, p, pos]) => `
      <tr class="${pos === 1 ? 'eu' : pos === 2 ? 'passa' : ''}">
        <td class="l">${f} ${n}</td><td>${j}</td><td>${v}</td><td>${e}</td><td>${d}</td><td>${sg}</td><td class="pt">${p}</td>
      </tr>`).join('')}
    </table>
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);margin-top:9px;line-height:1.4">
      🟡 você · 🟢 zona de classificação (passam 2) · desempate igual ao resto do jogo: <b>pontos → vitórias → saldo → gols</b>.</p>
  </div>
</div>

<h2>3 · O que é novo e o que é reaproveitado</h2>
<div class="cx">
  <div class="grid2">
    <div class="it"><span class="n">♻️</span><p><b>O placar grande é o mesmo</b> componente da liga e da Copa. Relógio, narração, carimbo do clube batizado no gol, festão — tudo continua funcionando igual.</p></div>
    <div class="it"><span class="n">♻️</span><p><b>Os outros jogos e a tabela</b> usam as caixas de sempre: borda preta grossa, sombra dura, letra da casa.</p></div>
    <div class="it"><span class="n">🌑</span><p><b>Novo</b>: a cor azul-noite da Libertadores na faixa dos goleadores e no chip do topo. Se você achar que fica perto demais do azul da Supercopa, eu troco por vermelho-terra ou verde-escuro.</p></div>
    <div class="it"><span class="n">🆕</span><p><b>Novo</b>: a tela dos <b>8 grupos</b> e a <b>chave</b> do mata-mata — já desenhadas na folha da Libertadores de 32.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div style="font-size:13px;color:rgba(12,12,12,.42)">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
