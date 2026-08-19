#!/usr/bin/env node
// ─── 🏆 MOCKUP: CATEGORIA "SÓ CAMPEÕES" (o modo temático da Libertadores) ───
//
// O Diego ficou na dúvida (20/08): *"N sei oq fazer pq são poucos jogos né…
// N sei se misturamos libertadores C liga dos campeões… Mas aí Tb teriam mts
// times no jogo… E demoraria MT"*.
//
// Esta folha existe pra desembolar DUAS coisas que estavam juntas na cabeça
// dele — e a conta que resolve:
//   🃏 BARALHO temático  = filtro de cartas. Igual à várzea. NÃO cria time, NÃO
//      alonga jogo. A sala é a MESMA de hoje.
//   🏆 FORMATO (grupos, 32 clubes) = outro projeto, grande, e que o modo
//      temático NÃO precisa. É de lá que vinha o medo do "demoraria muito".
//
// Todos os números foram MEDIDOS, não chutados:
//   · contagem de cartas: `src/escalacao/data.ts`
//   · teto de gente na sala: `buildDeck` (store.tsx:1018) — quando a demanda
//     passa das cartas reais, o motor completa com incógnito/perna-de-pau, que
//     é o que o Diego proíbe. demanda = vagas × técnicos (`FORMATIONS`).
//   · tamanho real das salas: `select count(*) from room_players group by
//     room_id` no Supabase — 465 salas, MAIOR de todas = 9 pessoas.
//
//   node scripts/mockup-campeoes.mjs --saida /tmp/campeoes.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'campeoes.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

// medido no data.ts + FORMATIONS
const OPCOES = [
  { baralho: '🇧🇷 Brasil', nome: 'Campeões da Libertadores', cartas: 91,
    pos: [11, 12, 13, 25, 30], teto: 6, cor: VERDE,
    exemplos: 'Pelé (Santos 62) · Zico (Flamengo 81) · Neymar (Santos 2011) · Cássio (Corinthians 2012) · Gabigol (Flamengo 2019)' },
  { baralho: '🌍 Europa', nome: 'Campeões da Champions', cartas: 116,
    pos: [13, 18, 21, 29, 35], teto: 7, cor: ROXO,
    exemplos: 'Bobby Charlton (United 68) · Maldini (Milan 89) · Zidane (Real 2002) · Iniesta (Barça 2015) · Alisson (Liverpool 2019)' },
  { baralho: '🌎 Todos', nome: 'Campeões dos dois lados do mundo', cartas: 207,
    pos: [24, 30, 34, 54, 65], teto: 13, cor: OURO, top: true,
    exemplos: 'A mistura que você falou: quem levantou a Libertadores OU a Champions pelo clube daquele ano.' },
]

const SALAS = [[1, 210], [2, 132], [3, 73], [4, 28], [5, 10], [6, 8], [7, 3], [9, 1]]
const MAXS = 210

const card = o => `
<div class="op ${o.top ? 'top' : ''}">
  <div class="ophead">
    <span class="bar" style="background:${o.cor}"></span>
    <div class="opid">
      <p class="opbar">Baralho ${o.baralho} + categoria 🏆 Só campeões</p>
      <p class="opnome">${o.nome}</p>
    </div>
    <div class="opnum"><b>${o.cartas}</b><span>cartas</span></div>
    <div class="opnum teto"><b>${o.teto}</b><span>cabe até</span></div>
  </div>
  <div class="pos">${['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].map((p, i) => `<span><i>${p}</i>${o.pos[i]}</span>`).join('')}</div>
  <p class="ex">${o.exemplos}</p>
  ${o.top ? '<p class="recom">👍 É a sua ideia — e é a que eu recomendo: cabe em <b>todas</b> as salas que já rolaram, com sobra.</p>' : ''}
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

/* duas coisas diferentes */
.dois{display:grid;grid-template-columns:1fr 60px 1fr;gap:0;align-items:center}
.lado{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;padding:15px 17px}
.lado.sim{background:#E7F5EC}
.lado.nao{background:#FDECE8}
.ltag{font-family:D,sans-serif;font-weight:700;font-size:12px;letter-spacing:.10em;text-transform:uppercase;
  display:inline-block;border:2.5px solid #0C0C0C;border-radius:999px;padding:2px 11px;background:#fff}
.ltit{font-family:D,sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;margin-top:8px;line-height:1.05}
.ldesc{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8);margin-top:7px}
.ldesc b{color:#0C0C0C}
.vs{font-family:D,sans-serif;font-weight:700;font-size:15px;text-align:center;color:rgba(12,12,12,.45);text-transform:uppercase;line-height:1.2}

/* opções */
.op{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:14px 16px;margin-bottom:13px}
.op.top{background:#FFF7DC;box-shadow:7px 7px 0 #0C0C0C}
.ophead{display:flex;align-items:center;gap:13px}
.bar{width:9px;height:46px;border:2.5px solid #0C0C0C;border-radius:5px;flex:0 0 9px}
.opid{flex:1}
.opbar{font-family:D,sans-serif;font-weight:700;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.opnome{font-family:D,sans-serif;font-weight:700;font-size:24px;text-transform:uppercase;line-height:1.05}
.opnum{text-align:right;flex:0 0 auto;padding-left:14px}
.opnum b{display:block;font-family:D,sans-serif;font-weight:700;font-size:34px;line-height:1}
.opnum span{font-family:D,sans-serif;font-weight:700;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.opnum.teto b{color:${VERM}}
.pos{display:flex;gap:7px;margin-top:11px}
.pos span{flex:1;border:2.5px solid #0C0C0C;border-radius:9px;background:#F4ECD6;text-align:center;padding:5px 2px;
  font-family:D,sans-serif;font-weight:700;font-size:19px}
.pos i{display:block;font-style:normal;font-size:10px;letter-spacing:.08em;color:rgba(12,12,12,.5)}
.ex{font-size:13px;font-weight:600;line-height:1.4;color:rgba(12,12,12,.7);margin-top:9px}
.recom{margin-top:10px;border:3px solid #0C0C0C;border-radius:12px;background:#E7F5EC;padding:9px 13px;font-size:14px;font-weight:700;line-height:1.4}

/* salas reais */
.salas{display:flex;align-items:flex-end;gap:9px;height:150px;margin-top:4px}
.sc{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.sb{width:100%;border:3px solid #0C0C0C;border-radius:9px 9px 0 0;background:${VERDE}}
.sl{font-family:D,sans-serif;font-weight:700;font-size:14px;margin-top:5px}
.sn{font-size:11.5px;font-weight:700;color:rgba(12,12,12,.5)}

/* tela */
.tela{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#1C1A17;padding:14px 15px}
.rotulo{font-family:D,sans-serif;font-weight:700;font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px}
.seg{display:flex;border:2.5px solid #0C0C0C;border-radius:12px;overflow:hidden}
.seg b{flex:1;text-align:center;font-family:D,sans-serif;font-weight:700;font-size:12px;padding:9px 3px;background:#fff;color:#000}
.seg b.on{background:${OURO}}
.aj{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);line-height:1.4;margin-top:7px}
.aj b{color:${OURO}}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}
.it{display:flex;gap:11px;align-items:flex-start}
.it .n{font-family:D,sans-serif;font-weight:700;font-size:19px;color:${VERM};line-height:1.05;width:26px;flex:0 0 26px}
.it p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.it p b{color:#0C0C0C}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>

<div class="pill">🏆 Mockup · categoria "só campeões"</div>
<h1>Sua ideia de misturar<br><span class="v">é a certa</span>. E cabe.</h1>
<p class="lead">Duas coisas estavam emboladas. O <b>baralho temático</b> não cria time nenhum e não deixa o jogo mais
longo — é a MESMA sala de hoje, só com outras cartas, igual à várzea. O medo do "demoraria muito" vinha do
<b>formato de competição</b>, que é outro projeto e que a gente simplesmente não faz agora.</p>

<h2>Primeiro: são duas coisas diferentes</h2>
<div class="dois">
  <div class="lado sim">
    <span class="ltag">✅ O que você quer</span>
    <p class="ltit">🃏 Baralho temático</p>
    <p class="ldesc">Um <b>filtro de cartas</b>, igual à várzea. A sala continua com <b>20 times e as mesmas rodadas</b>.
      Não entra clube novo, não demora um minuto a mais. É <b>uma linha de código</b> + a lista de quem foi campeão.</p>
  </div>
  <p class="vs">não<br>precisa<br>do outro</p>
  <div class="lado nao">
    <span class="ltag">⛔ Fica pra depois</span>
    <p class="ltit">🏆 Formato de copa</p>
    <p class="ldesc">32 clubes, grupos, mata-mata. <b>É daqui que vinha o "muitos times" e o "demora muito".</b>
      Projeto grande e separado — o modo temático funciona sem ele.</p>
  </div>
</div>

<h2>Os três baralhos possíveis <small>a categoria "🏆 Só campeões" segue o baralho que o host escolheu</small></h2>
${OPCOES.map(card).join('')}

<h2>"Cabe até" é o número que importa <small>e a boa notícia está aqui embaixo</small></h2>
<div class="cx">
  <p style="font-size:14.5px;font-weight:600;line-height:1.45;color:rgba(12,12,12,.8);margin-bottom:14px">
    Cada técnico precisa de 1 goleiro, 2 laterais, 2 zagueiros, 3 meias e 3 atacantes <b>de verdade</b>. Se faltar carta
    real, o motor completaria com perna-de-pau — e isso <b>não pode</b>. Por isso cada baralho tem um teto de gente.
    <b>Agora olha o tamanho REAL das salas que já rolaram no jogo</b> (465 salas, contadas no banco):</p>
  <div class="salas">
    ${SALAS.map(([n, q]) => `
      <div class="sc">
        <span class="sn">${q}</span>
        <span class="sb" style="height:${Math.max(6, (q / MAXS) * 100)}%"></span>
        <span class="sl">${n}</span>
      </div>`).join('')}
  </div>
  <p style="font-size:14.5px;font-weight:600;line-height:1.45;color:rgba(12,12,12,.8);margin-top:14px">
    <b>A maior sala da história do jogo teve 9 pessoas</b> — e foi uma só. Só 4 salas em 465 passaram de 6.
    Ou seja: até o baralho menor (só Libertadores, teto 6) atenderia <b>99%</b> das salas. E a <b>mistura, com teto 13,
    atende 100% com folga</b>.</p>
</div>

<h2>Como fica na tela de criar sala</h2>
<div class="tela">
  <p class="rotulo">Baralho de craques</p>
  <div class="seg"><b>🇧🇷 Brasil</b><b>🌍 Europa</b><b class="on">🌎 Todos (BR+EU+Mundo)</b></div>
  <div style="margin-top:13px">
    <p class="rotulo">Categoria</p>
    <div class="seg"><b>Todos</b><b>🥅 Várzea</b><b class="on">🏆 Só campeões</b></div>
    <p class="aj">🏆 <b>Só campeões</b>: no leilão só entra quem <b>levantou a Libertadores ou a Champions pelo clube daquele ano</b> — 207 cartas. Pelé no Santos de 62, Zico no Flamengo de 81, Neymar no Santos de 2011.</p>
  </div>
</div>

<h2>O caminho seguro, em 3 passos</h2>
<div class="cx">
  <div class="grid2">
    <div class="it"><span class="n">1</span><p>Eu escrevo a <b>lista de campeões</b> (clube + ano) e te mando pra conferir. <b>Onde eu não tiver certeza, a carta fica de fora</b> — nada de chute.</p></div>
    <div class="it"><span class="n">2</span><p>Ligo a categoria <b>invisível, só na sua conta</b>, você joga uma sala e aprova.</p></div>
    <div class="it"><span class="n">3</span><p>Solto pra todo mundo. A <b>trava</b> por tamanho de sala vem junto, com aviso escrito do porquê e do caminho.</p></div>
    <div class="it"><span class="n">↩️</span><p><b>Reverter é apagar a opção.</b> Nada de carreira, álbum, ranking ou sala existente é tocado — é só um filtro de leilão.</p></div>
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
