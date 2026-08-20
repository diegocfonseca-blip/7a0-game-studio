#!/usr/bin/env node
// ─── 🌎 MOCKUP: LIBERTADORES DE 32 (liga classifica 8 + 24 do continente) ───
//
// Desenho fechado com o Diego em 20/08:
//   *"a libertadores tem q ter 32 times pow! Deveria se classificar os primeiros
//   8 e dps se juntar numa tabela c outros times formando 32 c grupos.. Se
//   classificando 2 primeiros e etc..."*
//   *"Faça times tipo river prato. Boca zudo, Penhalol coisas assim"*
//   *"ideal que os 8 classificados fossem cabeças de chave"*
//
// 🏷️ Os 24 clubes do continente são QUASE-NOMES, o estilo que a casa já usa
// (Vasco da Grana, Livre-pool, Cuiabagre, Paris São Geraldo). Todos conferidos
// contra `data.ts` e `escudos.tsx`: nenhum bate com clube existente, com nome
// velho de batismo (`OLD_NAME`) nem com chave de escudo.
// ⚠️ "River Prato" NÃO deu: é o nome velho do La Bestia Negra (batismo do
// eltonfrossard45) — quem carregasse um save veria virar La Bestia Negra e ainda
// pegaria o escudo dele. Virou **River Pratão**.
//
//   node scripts/mockup-liberta-32.mjs --saida /tmp/liberta32.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'liberta32.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

// os 24 do continente — quase-nome + força (mesma escala dos CLASSIC_CLUBS)
// os 24 do continente — quase-nome + força (mesma escala dos CLASSIC_CLUBS).
// 🎱 POTES: o pote 1 é dos 8 da liga (regra do Diego: eles são cabeça de chave),
// então os 24 se dividem 8 · 8 · 8 nos potes 2, 3 e 4 — do mais forte pro mais
// fraco. 8 grupos × 4 = 32, um de cada pote por grupo.
const CONTINENTE = [
  ['🇦🇷', 'River Pratão', 78, 76, 2], ['🇦🇷', 'Bocazudo', 77, 77, 2],
  ['🇺🇾', 'Penhalol', 75, 74, 2], ['🇺🇾', 'Nassional', 74, 73, 2],
  ['🇨🇱', 'Colo do Colo', 73, 72, 2], ['🇨🇴', 'Atlético Cafezal', 73, 71, 2],
  ['🇦🇷', 'Independente da Grana', 72, 73, 2], ['🇵🇾', 'Serro Portenho', 71, 72, 2],

  ['🇦🇷', 'Estudantes da Prata', 70, 72, 3], ['🇵🇾', 'Olímpia do Tereré', 70, 70, 3],
  ['🇧🇴', 'The Fortão', 69, 69, 3], ['🇪🇨', 'Barcelona da Linha', 69, 68, 3],
  ['🇦🇷', 'Rachando Club', 68, 69, 3], ['🇨🇱', 'Universidade do Chilique', 67, 68, 3],
  ['🇨🇴', 'Milionários FC', 67, 66, 3], ['🇵🇪', 'Aliança Limão', 66, 66, 3],

  ['🇵🇾', 'Liberdade FC', 65, 67, 4], ['🇪🇨', 'Liga de Quitanda', 65, 65, 4],
  ['🇺🇾', 'Defensor Suplente', 63, 65, 4], ['🇨🇱', 'Cobra Loka', 63, 63, 4],
  ['🇨🇴', 'América do Calil', 62, 62, 4], ['🇵🇪', 'Sporting Cristaleira', 61, 62, 4],
  ['🇧🇴', 'Bolívar 3.600', 60, 60, 4], ['🇻🇪', 'Deportivo Tá Xiro', 58, 59, 4],
]

// exemplo de grupo: 1 cabeça (da liga) + 1 de cada pote
const GRUPO_A = [
  ['🏆', 'SEU TIME', 'cabeça · 1º da liga', 12, '+7', 1],
  ['🇦🇷', 'Independente da Grana', 'pote 2', 10, '+4', 2],
  ['🇨🇱', 'Universidade do Chilique', 'pote 3', 6, '-1', 3],
  ['🇻🇪', 'Deportivo Tá Xiro', 'pote 4', 2, '-10', 4],
]

const linha = ([fl, nm, pote, pts, sg, pos]) => `
  <div class="gl ${pos <= 2 ? 'passa' : ''} ${nm === 'SEU TIME' ? 'eu' : ''}">
    <span class="gp">${pos}</span><span class="gf">${fl}</span>
    <div class="gn"><b>${nm}</b><i>${pote}</i></div>
    <span class="gs">${sg}</span><span class="gt">${pts}</span>
  </div>`

const mini = (l, on) => `
  <div class="mg ${on ? 'on' : ''}">
    <p class="mgt">GRUPO ${l}</p>
    ${[0, 1, 2, 3].map(i => `<span class="mgb ${i < 2 ? 'ok' : ''}"></span>`).join('')}
  </div>`

const fase = (nome, jogos, nota, ouro) => `
  <div class="fase ${ouro ? 'ouro' : ''}"><p class="fn">${nome}</p><p class="fj">${jogos}</p><p class="ft">${nota}</p></div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;gap:10px;background:${OURO};border:3px solid #0C0C0C;border-radius:999px;padding:8px 20px;
  font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;box-shadow:4px 4px 0 #0C0C0C}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:60px;line-height:.97;margin:18px 0 0}
h1 .v{color:${VERDE}}
.lead{font-size:17px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:950px}
.lead b{color:#0C0C0C}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:23px;margin:30px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}
.cx{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:16px 18px}

/* caminho */
.cam{display:flex;align-items:stretch;gap:10px}
.et{flex:1;border:3px solid #0C0C0C;border-radius:13px;background:#fff;padding:11px 12px;box-shadow:3px 3px 0 #0C0C0C}
.et.ok{background:#E7F5EC}
.et.big{flex:1.5}
.etn{font-family:D,sans-serif;font-weight:700;font-size:17px;text-transform:uppercase;line-height:1.05}
.etd{font-size:12.5px;font-weight:600;color:rgba(12,12,12,.65);margin-top:4px;line-height:1.35}
.seta{display:flex;align-items:center;font-family:D,sans-serif;font-weight:700;font-size:26px;color:rgba(12,12,12,.35)}

/* potes */
.potes{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.pote{border:3px solid #0C0C0C;border-radius:14px;background:#fff;overflow:hidden;box-shadow:4px 4px 0 #0C0C0C}
.pote.p1{background:#FFF7DC}
.ph{font-family:D,sans-serif;font-weight:700;font-size:13px;letter-spacing:.07em;text-transform:uppercase;
  background:#0C0C0C;color:#fff;padding:8px 11px}
.pote.p1 .ph{background:${VERDE}}
.pl{display:flex;align-items:center;gap:7px;padding:6px 10px;border-top:2px solid rgba(0,0,0,.12)}
.pl span{font-size:14px}
.pl p{font-family:D,sans-serif;font-weight:700;font-size:13px;text-transform:uppercase;line-height:1.15;flex:1}
.pl i{font-style:normal;font-size:11px;font-weight:700;color:rgba(12,12,12,.42)}

/* grupo */
.grupos{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:start}
.gl{display:flex;align-items:center;gap:9px;border:2.5px solid #0C0C0C;border-radius:11px;padding:6px 10px;background:#fff;margin-bottom:6px}
.gl.passa{background:#E7F5EC}
.gl.eu{background:#FFF2C4;box-shadow:3px 3px 0 #0C0C0C}
.gp{font-family:D,sans-serif;font-weight:700;font-size:14px;width:16px;color:rgba(12,12,12,.4)}
.gl.passa .gp{color:${VERDE}}
.gf{font-size:16px}
.gn{flex:1;min-width:0}
.gn b{display:block;font-family:D,sans-serif;font-weight:700;font-size:14.5px;text-transform:uppercase;line-height:1.1}
.gn i{font-style:normal;font-size:10.5px;font-weight:700;color:rgba(12,12,12,.45)}
.gs{font-size:12px;font-weight:700;color:rgba(12,12,12,.5);width:38px;text-align:right}
.gt{font-family:D,sans-serif;font-weight:700;font-size:17px;width:30px;text-align:right}
.mgs{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.mg{border:2.5px solid #0C0C0C;border-radius:11px;background:#fff;padding:7px 8px}
.mg.on{background:#FFF2C4;box-shadow:3px 3px 0 #0C0C0C}
.mgt{font-family:D,sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.06em;margin-bottom:5px}
.mgb{display:block;height:7px;border-radius:4px;background:rgba(12,12,12,.16);margin-bottom:3px}
.mgb.ok{background:${VERDE}}

/* chave */
.chave{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}
.fase{border:3px solid #0C0C0C;border-radius:13px;background:#fff;padding:11px 10px;text-align:center;box-shadow:3px 3px 0 #0C0C0C}
.fase.ouro{background:${OURO}}
.fn{font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase}
.fj{font-size:12px;font-weight:700;color:rgba(12,12,12,.62);margin-top:3px}
.ft{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.45);margin-top:5px;line-height:1.3}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}
.it{display:flex;gap:11px;align-items:flex-start}
.it .n{font-family:D,sans-serif;font-weight:700;font-size:19px;color:${VERM};line-height:1.05;width:26px;flex:0 0 26px}
.it p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.it p b{color:#0C0C0C}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
</style>

<div class="pill">🌎 Mockup · Libertadores de 32</div>
<h1>A liga classifica 8.<br>O continente traz <span class="v">os outros 24</span>.</h1>
<p class="lead">A sala continua igual: <b>20 clubes, 38 rodadas</b>. No fim, os <b>8 melhores</b> ganham a vaga e caem
numa Libertadores de <b>32 times</b>, com 8 grupos de 4. E como você pediu: <b>os 8 da liga entram como cabeça de
chave</b> — um em cada grupo, então dois deles só se cruzam no mata-mata.</p>

<h2>1 · O caminho</h2>
<div class="cam">
  <div class="et big ok"><p class="etn">🏁 Liga</p><p class="etd">20 clubes · 38 rodadas · <b>igual hoje</b></p></div>
  <div class="seta">→</div>
  <div class="et"><p class="etn">🎟️ Os 8</p><p class="etd">os 8 primeiros da tabela pegam a vaga</p></div>
  <div class="seta">→</div>
  <div class="et"><p class="etn">🥅 Grupos</p><p class="etd">8 × 4 · ida e volta · passam 2</p></div>
  <div class="seta">→</div>
  <div class="et"><p class="etn">🏆 Mata-mata</p><p class="etd">oitavas · quartas · semi · <b>final única</b></p></div>
</div>

<h2>2 · Os 24 do continente <small>quase-nome, o estilo da casa — nenhum clube real</small></h2>
<div class="potes">
  ${[1, 2, 3, 4].map(p => `
  <div class="pote ${p === 1 ? 'p1' : ''}">
    <p class="ph">${p === 1 ? '🏆 Pote 1 · os 8 da liga' : 'Pote ' + p}</p>
    ${p === 1
      ? [1, 2, 3, 4, 5, 6, 7, 8].map(i => `<div class="pl"><span>🏆</span><p>${i}º da liga</p></div>`).join('')
      : CONTINENTE.filter(c => c[4] === p).map(c => `<div class="pl"><span>${c[0]}</span><p>${c[1]}</p><i>${c[2]}</i></div>`).join('')}
  </div>`).join('')}
</div>
<p style="font-size:13.5px;font-weight:600;line-height:1.45;color:rgba(12,12,12,.72);margin-top:12px">
  ⚠️ <b>"River Prato" não deu</b>: esse nome já existe no jogo como o nome VELHO do <b>La Bestia Negra</b> (batismo do
  eltonfrossard45). Se eu usasse, quem abrisse um save antigo veria virar La Bestia Negra e ainda pegaria o escudo dele.
  Virou <b>River Pratão</b>. Os outros 23 eu conferi um por um — nenhum bate com clube do jogo, nome velho de batismo
  ou chave de escudo.</p>

<h2>3 · A fase de grupos</h2>
<div class="grupos">
  <div class="cx">
    <p style="font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px">Grupo A · última rodada</p>
    ${GRUPO_A.map(linha).join('')}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);margin-top:8px">Passam os <b>2 primeiros</b> · 6 jogos por clube</p>
  </div>
  <div class="cx">
    <p style="font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px">Os 8 grupos numa tela só</p>
    <div class="mgs">${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => mini(l, l === 'A')).join('')}</div>
    <p style="font-size:12.5px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.72);margin-top:11px">
      <b>Um cabeça de chave por grupo.</b> Ou seja: quem se classificou na sua liga nunca cai no mesmo grupo que
      outro classificado — vocês só se cruzam <b>no mata-mata</b>, e aí é decisão.</p>
  </div>
</div>

<h2>4 · O mata-mata</h2>
<div class="chave">
  ${fase('Oitavas', '16 clubes', 'ida e volta')}
  ${fase('Quartas', '8 clubes', 'ida e volta')}
  ${fase('Semis', '4 clubes', 'ida e volta')}
  ${fase('FINAL', '2 clubes', 'jogo único')}
  ${fase('🏆 TAÇA', 'campeão', 'empatou? pênalti', true)}
</div>

<h2>5 · O que isso custa e o que não muda</h2>
<div class="cx">
  <div class="grid2">
    <div class="it"><span class="n">⏱️</span><p><b>51 jogos, 5min39 de tela</b> — contra 44 jogos e 4min30 da liga + Copa dos 8. É a temporada mais longa que o jogo já teve.</p></div>
    <div class="it"><span class="n">🃏</span><p><b>Baralho normal.</b> O baralho temático (só quem jogou a Libertadores) fica pausado, como você decidiu.</p></div>
    <div class="it"><span class="n">✓</span><p><b>Quem não escolher a Libertadores não sente nada</b>: a sala segue com Liga + Copa ou Só liga, igualzinha.</p></div>
    <div class="it"><span class="n">↩️</span><p><b>Reverter é apagar a opção.</b> Nenhuma carreira, álbum ou ranking é tocado.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div style="font-size:13px;color:rgba(12,12,12,.42)">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
