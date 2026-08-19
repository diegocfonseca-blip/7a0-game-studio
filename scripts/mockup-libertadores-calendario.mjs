#!/usr/bin/env node
// ─── 📅 MOCKUP: DE QUE TAMANHO VAI SER A LIBERTADORES ──────────────────────
//
// O Diego viu a proposta e falou: *"13 rodadas ficou mt rápido… E agora"*.
// Ele tem razão: copa continental é curta POR NATUREZA — na vida real ela não
// substitui o campeonato, ela roda JUNTO com ele, no meio de semana.
//
// Esta folha existe pra ele ESCOLHER o tamanho, com o número na frente e sem
// regra inventada. Os três caminhos são todos reais:
//   A) só o torneio                        → 13 jogos
//   B) + pré-Libertadores e Sul-Americana  → 19 jogos (e ninguém fica sem jogo)
//   C) temporada completa (liga + Liberta) → 51 jogos ← a vida real
//
// Números medidos no código (não chutados): a liga do rápido tem `LEAGUE_SIZE
// = 20` e `oneDoubleRR` gera turno e returno = **38 rodadas**. O mata-mata da
// Copa dos 8 (`seedQuickCopa`) já é ida e volta com pênalti no empate.
//
//   node scripts/mockup-libertadores-calendario.mjs --saida /tmp/lib-cal.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'libertadores-calendario.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const VERDE = '#1B7A3D', OURO = '#FFC400', VERM = '#C2452F', ROXO = '#7C3AED'

// cada opção: barras do calendário (rótulo, jogos, cor)
const OPCOES = [
  {
    tag: 'A', nome: 'Só o torneio', jogos: 13, sel: false,
    resumo: 'O que eu te mandei: grupos, mata-mata e final única.',
    barras: [['Grupos', 6, VERDE], ['Mata-mata', 6, OURO], ['Final', 1, VERM]],
    pros: ['Rápido de fazer.', 'Uma sala inteira em pouco tempo.'],
    contras: ['Curto: um terço da liga de hoje.', 'Quem cai no grupo fica 7 rodadas só assistindo.'],
  },
  {
    tag: 'B', nome: 'Libertadores completa', jogos: 19, sel: false,
    resumo: 'Com a pré-Libertadores na frente e a Sul-Americana pra quem cai.',
    barras: [['Pré-Liberta', 6, ROXO], ['Grupos', 6, VERDE], ['Mata-mata', 6, OURO], ['Final', 1, VERM]],
    pros: ['Metade da liga de hoje.', 'Ninguém fica sem jogo: quem cai vai pra Sul-Americana.'],
    contras: ['Ainda é bem mais curto que uma temporada.'],
  },
  {
    tag: 'C', nome: 'Temporada completa', jogos: 51, sel: true,
    resumo: 'A liga do jeito que já é + a Libertadores no meio de semana. É a vida real.',
    barras: [['Liga · 38 rodadas', 38, VERDE], ['Libertadores', 13, OURO]],
    pros: ['A temporada mais longa que o jogo já teve.', 'Quem cai na Libertadores CONTINUA jogando a liga — o problema some sozinho.', 'Dá pra ser campeão da liga e perder a Liberta (e vice-versa): dois títulos em jogo.'],
    contras: ['É a que dá mais trabalho pra fazer.'],
  },
]

const MAX = 51
const barra = ([rot, n, cor], jogos) => `
  <div class="bar" style="width:${(n / MAX) * 100}%;background:${cor}">
    <span>${n <= 3 ? n : `${rot} · ${n}`}</span>
  </div>`

const cardOpcao = o => `
<div class="op ${o.sel ? 'sel' : ''}">
  <div class="ophead">
    <span class="optag">${o.tag}</span>
    <div>
      <p class="opnome">${o.nome}</p>
      <p class="opres">${o.resumo}</p>
    </div>
    <div class="opnum"><b>${o.jogos}</b><span>jogos</span></div>
  </div>
  <div class="barras">${o.barras.map(b => barra(b, o.jogos)).join('')}</div>
  <div class="listas">
    <div>${o.pros.map(p => `<p class="ok">✅ ${p}</p>`).join('')}</div>
    <div>${o.contras.map(p => `<p class="no">⚠️ ${p}</p>`).join('')}</div>
  </div>
  ${o.sel ? '<p class="recom">👍 É a que eu recomendo — e é a única que resolve o "ficou rápido" e o "quem cai fica sem jogo" de uma vez só.</p>' : ''}
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;gap:10px;background:${OURO};border:3px solid #0C0C0C;border-radius:999px;padding:8px 20px;
  font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;box-shadow:4px 4px 0 #0C0C0C}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:60px;line-height:.97;margin:18px 0 0}
h1 .r{color:${VERM}}
.lead{font-size:17px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:940px}
.lead b{color:#0C0C0C}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:23px;margin:30px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}

.op{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:15px 17px;margin-bottom:15px}
.op.sel{background:#FFF7DC;box-shadow:7px 7px 0 #0C0C0C}
.ophead{display:flex;align-items:center;gap:13px}
.optag{font-family:D,sans-serif;font-weight:700;font-size:23px;background:#0C0C0C;color:#fff;border-radius:11px;
  width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:0 0 44px}
.op.sel .optag{background:${VERDE}}
.ophead>div:nth-child(2){flex:1}
.opnome{font-family:D,sans-serif;font-weight:700;font-size:24px;text-transform:uppercase;line-height:1.05}
.opres{font-size:13.5px;font-weight:600;color:rgba(12,12,12,.65);margin-top:2px;line-height:1.35}
.opnum{text-align:right;flex:0 0 auto}
.opnum b{display:block;font-family:D,sans-serif;font-weight:700;font-size:40px;line-height:1}
.opnum span{font-family:D,sans-serif;font-weight:700;font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.barras{display:flex;gap:4px;margin-top:12px}
.bar{height:34px;border:2.5px solid #0C0C0C;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.bar span{font-family:D,sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;color:#fff;
  text-shadow:1.5px 1.5px 0 rgba(0,0,0,.55);white-space:nowrap}
.listas{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-top:12px}
.listas p{font-size:13.5px;font-weight:600;line-height:1.4;color:rgba(12,12,12,.8);margin-bottom:3px}
.recom{margin-top:11px;border:3px solid #0C0C0C;border-radius:12px;background:#E7F5EC;padding:9px 13px;
  font-size:14px;font-weight:700;line-height:1.4}
.cx{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:16px 18px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}
.it{display:flex;gap:11px;align-items:flex-start}
.it .n{font-family:D,sans-serif;font-weight:700;font-size:19px;color:${VERM};line-height:1.05;width:26px;flex:0 0 26px}
.it p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.it p b{color:#0C0C0C}
.telas{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:4px}
.tela{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#1C1A17;padding:14px 15px}
.rotulo{font-family:D,sans-serif;font-weight:700;font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px}
.seg{display:flex;border:2.5px solid #0C0C0C;border-radius:12px;overflow:hidden}
.seg b{flex:1;text-align:center;font-family:D,sans-serif;font-weight:700;font-size:12.5px;padding:9px 3px;background:#fff;color:#000}
.seg b.on{background:${OURO}}
.aj{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);line-height:1.4;margin-top:7px}
.aj b{color:${OURO}}
.sumiu{margin-top:13px;border:2.5px dashed rgba(255,255,255,.35);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.05)}
.sumiu p{font-family:D,sans-serif;font-weight:700;font-size:12.5px;color:${OURO}}
.sumiu span{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,.5);line-height:1.4;margin-top:4px}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>

<div class="pill">📅 Mockup · de que tamanho vai ser a Libertadores</div>
<h1>Você tem razão:<br>13 jogos é <span class="r">pouco</span>.</h1>
<p class="lead">Copa continental é curta <b>por natureza</b> — nem na vida real ela dura uma temporada. O que a vida real faz
é outra coisa: a Libertadores <b>não substitui o campeonato</b>, ela roda <b>junto</b> com ele, no meio de semana.
Três caminhos, todos com regra de verdade. Escolhe um e eu começo.</p>

<h2>Os três tamanhos <small>o número é quantos jogos você joga até a taça</small></h2>
${OPCOES.map(cardOpcao).join('')}

<h2>Como fica a tela de criar sala na opção C</h2>
<div class="telas">
  <div class="tela">
    <p class="rotulo">Competição</p>
    <div class="seg"><b class="on">🏁 Liga</b><b>🌎 Libertadores</b></div>
    <p class="aj">🏁 <b>Liga</b>: 20 clubes, turno e returno — <b>38 rodadas</b>. É a sala de hoje, intocada.</p>
    <div style="margin-top:13px">
      <p class="rotulo">Depois da liga</p>
      <div class="seg"><b class="on">🏆 Liga + Copa</b><b>📊 Só liga</b></div>
    </div>
  </div>
  <div class="tela">
    <p class="rotulo">Competição</p>
    <div class="seg"><b>🏁 Liga</b><b class="on">🌎 Libertadores</b></div>
    <p class="aj">🌎 <b>Temporada completa</b>: a liga de 38 rodadas <b>+ a Libertadores no meio de semana</b> — 51 jogos, dois títulos.</p>
    <div class="sumiu">
      <p>Sem escolher liga nem copa</p>
      <span>Como você pediu: o seletor de Copa <b>some da tela</b>. Na temporada completa a liga vem junto de fábrica — não é uma escolha, é o calendário.</span>
    </div>
  </div>
</div>

<h2>Por que a C resolve tudo</h2>
<div class="cx">
  <div class="grid2">
    <div class="it"><span class="n">1</span><p><b>Acabou o "ficou rápido"</b>: 51 jogos é a temporada mais longa que o jogo já teve — 13 a mais que a liga de hoje.</p></div>
    <div class="it"><span class="n">2</span><p><b>Acabou o "quem cai fica sem jogo"</b>: você foi eliminado na Libertadores? A <b>liga continua</b>. Nunca sobra ninguém olhando.</p></div>
    <div class="it"><span class="n">3</span><p><b>Dois títulos na mesma sala</b>: dá pra ser campeão da liga e perder a Libertadores — e a zoeira disso é o melhor do jogo.</p></div>
    <div class="it"><span class="n">4</span><p><b>Jogo de meio de semana</b> é exatamente o que acontece de verdade com clube brasileiro na Liberta. Ninguém precisa aprender regra nova.</p></div>
    <div class="it"><span class="n">5</span><p><b>A liga de hoje não muda uma vírgula</b>: quem não ligar a Libertadores joga a mesma sala de sempre, com as mesmas 38 rodadas.</p></div>
    <div class="it"><span class="n">↩️</span><p><b>Reverter é desligar a opção.</b> Nenhuma carreira, álbum ou ranking é afetado — a Libertadores só existe dentro da sala que a ligou.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
