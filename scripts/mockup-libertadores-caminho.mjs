#!/usr/bin/env node
// ─── 🛣️ MOCKUP: LIGA-PRIMEIRO ou LIBERTADORES-DIRETO ───────────────────────
//
// Dúvida do Diego (20/08): *"Tô na dúvida se faço jogando liga normal e dps os
// 8 melhores jogam a libertadores e sendo baralho temático ou começa direto
// libertadores"*.
//
// A folha existe pra ele ver o que já está PRONTO e o que é obra nova. O achado
// que decide: o **caminho A já existe inteiro** — a Copa dos 8 do rápido
// (`seedQuickCopa` em store.tsx:2232) é exatamente "os 8 melhores da liga jogam
// mata-mata de ida e volta com pênalti no empate". Virar Libertadores é trocar
// o nome, a cor e usar o baralho temático. O caminho B é motor novo (sorteio de
// grupos, 32 clubes, classificação de grupo).
//
// Tempos medidos: `SEASON_TOTAL_MS/38` = 4,7s por rodada de liga ·
// `QUICK_COPA_LEG_MS` = 15s por jogo de mata-mata (screens.tsx:3901-3905).
//
//   node scripts/mockup-libertadores-caminho.mjs --saida /tmp/caminho.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'libertadores-caminho.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

const CAMINHOS = [
  {
    tag: 'A', top: true,
    nome: 'Liga primeiro, Libertadores no fim',
    frase: 'Você se classifica jogando — igual à vida real.',
    etapas: [['🏁 Liga · 38 jogos', 38, VERDE], ['🌎 Libertadores · 6 jogos', 6, OURO]],
    jogos: 44, tempo: '4min30',
    pontos: [
      ['✅', '<b>O motor já existe.</b> A Copa dos 8 de hoje É isso: os 8 melhores, ida e volta, pênalti no empate. Muda o nome, a cor e o baralho.'],
      ['✅', '<b>Nenhum jogo a menos.</b> 44 jogos — o mesmo tamanho da temporada que a galera já joga.'],
      ['✅', '<b>Dois títulos</b>: dá pra ganhar a liga e perder a Libertadores. Zoeira garantida.'],
      ['✅', '<b>Risco baixíssimo</b>: é a sala de hoje com outro nome no fim.'],
      ['⚠️', 'A Libertadores fica com <b>8 clubes</b>, sem fase de grupos e sem as vagas do Brasil pros clubes batizados.'],
    ],
  },
  {
    tag: 'B',
    nome: 'Começa direto na Libertadores',
    frase: 'O torneio inteiro, do sorteio dos grupos até a taça.',
    etapas: [['🎟️ Pré · 6', 6, ROXO], ['🥅 Grupos · 6', 6, VERDE], ['🏆 Mata-mata · 7', 7, OURO]],
    jogos: 19, tempo: '4min09',
    pontos: [
      ['✅', '<b>É a Libertadores de verdade</b>: 32 clubes, 8 grupos, oitavas, final única.'],
      ['✅', '<b>Todo jogo vale</b> — nenhuma rodada de meio de tabela.'],
      ['✅', 'Entram as <b>8 vagas do Brasil</b>, com clube batizado sorteado.'],
      ['⚠️', '<b>Motor novo</b>: sorteio de grupos, 8 tabelas, classificação. É a parte que dá trabalho de verdade.'],
      ['⚠️', 'Quem cai no grupo <b>fica sem jogo</b> (não tem liga rolando pra segurar).'],
    ],
  },
]

const MAX = 44
const etapa = ([rot, n, cor]) => `<div class="et" style="width:${(n / MAX) * 100}%;background:${cor}"><span>${rot}</span></div>`

const card = c => `
<div class="cm ${c.top ? 'top' : ''}">
  <div class="cmh">
    <span class="cmt">${c.tag}</span>
    <div class="cmi"><p class="cmn">${c.nome}</p><p class="cmf">${c.frase}</p></div>
    <div class="cmnum"><b>${c.jogos}</b><span>jogos</span></div>
    <div class="cmnum t"><b>${c.tempo}</b><span>de tela</span></div>
  </div>
  <div class="etapas">${c.etapas.map(etapa).join('')}</div>
  <div class="pts">${c.pontos.map(([i, t]) => `<p><span class="ic">${i}</span><span class="tx">${t}</span></p>`).join('')}</div>
  ${c.top ? '<p class="rec">👍 <b>É por onde eu começaria</b> — quase tudo já está pronto, então dá pra você JOGAR isso essa semana e ver se gosta. Se gostar, o B vira o passo seguinte, sem jogar fora nada do A.</p>' : ''}
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;gap:10px;background:${OURO};border:3px solid #0C0C0C;border-radius:999px;padding:8px 20px;
  font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;box-shadow:4px 4px 0 #0C0C0C}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:58px;line-height:.97;margin:18px 0 0}
h1 .v{color:${VERDE}}
.lead{font-size:17px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:950px}
.lead b{color:#0C0C0C}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:23px;margin:30px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}
.cx{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:16px 18px}

.cm{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:15px 17px;margin-bottom:15px}
.cm.top{background:#FFF7DC;box-shadow:7px 7px 0 #0C0C0C}
.cmh{display:flex;align-items:center;gap:13px}
.cmt{font-family:D,sans-serif;font-weight:700;font-size:23px;background:#0C0C0C;color:#fff;border-radius:11px;
  width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:0 0 44px}
.cm.top .cmt{background:${VERDE}}
.cmi{flex:1}
.cmn{font-family:D,sans-serif;font-weight:700;font-size:25px;text-transform:uppercase;line-height:1.05}
.cmf{font-size:13.5px;font-weight:600;color:rgba(12,12,12,.65);margin-top:2px}
.cmnum{text-align:right;flex:0 0 auto;padding-left:13px}
.cmnum b{display:block;font-family:D,sans-serif;font-weight:700;font-size:32px;line-height:1}
.cmnum span{font-family:D,sans-serif;font-weight:700;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.cmnum.t b{color:${VERM};font-size:26px}
.etapas{display:flex;gap:4px;margin-top:12px}
.et{height:34px;border:2.5px solid #0C0C0C;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.et span{font-family:D,sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;color:#fff;
  text-shadow:1.5px 1.5px 0 rgba(0,0,0,.55);white-space:nowrap}
.pts{margin-top:12px}
.pts p{font-size:13.5px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8);margin-bottom:4px;display:flex;gap:9px}
.pts p .ic{flex:0 0 18px}
.pts p .tx{flex:1}
.pts p b{color:#0C0C0C}
.rec{margin-top:11px;border:3px solid #0C0C0C;border-radius:12px;background:#E7F5EC;padding:10px 13px;font-size:14px;font-weight:600;line-height:1.42}

.pronto{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.pr{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;padding:15px 17px}
.pr.ok{background:#E7F5EC}
.pr.obra{background:#FDECE8}
.prt{font-family:D,sans-serif;font-weight:700;font-size:20px;text-transform:uppercase}
.pr ul{list-style:none;margin-top:9px}
.pr li{font-size:13.5px;font-weight:600;line-height:1.4;color:rgba(12,12,12,.8);margin-bottom:5px;display:flex;gap:8px}
.pr li b{color:#0C0C0C}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>

<div class="pill">🛣️ Mockup · qual caminho seguir</div>
<h1>Liga primeiro, ou<br><span class="v">Libertadores direto?</span></h1>
<p class="lead">Os dois usam o <b>mesmo baralho temático</b> (só quem jogou a Libertadores pelo clube daquele ano) — isso
não muda. O que muda é o <b>caminho até a taça</b>. E tem um detalhe que decide sozinho: <b>o caminho A já está
praticamente pronto no jogo</b>.</p>

<h2>Os dois caminhos</h2>
${CAMINHOS.map(card).join('')}

<h2>Por que o A já está pronto <small>e o B é obra</small></h2>
<div class="pronto">
  <div class="pr ok">
    <p class="prt">✅ Caminho A · o que falta</p>
    <ul>
      <li><span>1.</span><span>O <b>filtro do baralho</b> (a lista de quem jogou a Libertadores).</span></li>
      <li><span>2.</span><span>Trocar o <b>nome e a cor</b> da Copa dos 8 quando a categoria for Libertadores.</span></li>
    </ul>
    <p style="font-size:13px;font-weight:600;line-height:1.4;color:rgba(12,12,12,.72);margin-top:10px">
      A <b>Copa dos 8 que já existe É isso</b>: pega os 8 melhores da liga e joga mata-mata de ida e volta, com pênalti
      no empate. Está no ar há meses, testada por todo mundo. Não tem motor novo nenhum.</p>
  </div>
  <div class="pr obra">
    <p class="prt">🔨 Caminho B · o que falta</p>
    <ul>
      <li><span>1.</span><span>O <b>filtro do baralho</b> (a mesma lista — vale pros dois).</span></li>
      <li><span>2.</span><span><b>Sorteio de grupos</b> por potes, com quem joga separado.</span></li>
      <li><span>3.</span><span><b>8 tabelas</b> ao mesmo tempo e a classificação de cada uma.</span></li>
      <li><span>4.</span><span><b>Chave de 16</b> (hoje o mata-mata só sabe começar com 8).</span></li>
      <li><span>5.</span><span>Os <b>32 clubes</b> e a tela dos grupos.</span></li>
    </ul>
  </div>
</div>

<h2>A saída que eu recomendo</h2>
<div class="cx">
  <p style="font-size:15.5px;font-weight:600;line-height:1.5;color:rgba(12,12,12,.82)">
    <b>Faz o A agora e o B depois — um não joga o outro fora.</b> No A você já joga a Libertadores essa semana,
    com o baralho temático, e sente na prática se é isso mesmo que você quer. A <b>lista de quem jogou a
    Libertadores é a mesma nos dois</b>, então o trabalho maior (que é ela) não se perde.<br><br>
    E se o A te agradar, o B deixa de ser urgente: você já vai ter a Libertadores no jogo, com 44 partidas e
    dois títulos por sala. Se não agradar, a gente descobriu isso <b>gastando pouco</b>, em vez de construir o
    torneio inteiro pra depois ver que não era.</p>
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
