#!/usr/bin/env node
// ─── 📱 LANÇAMENTO DA LIBERTADORES (story 1080×1920) ────────────────────────
//
// Pedido do Diego (20/08): *"me mande mockup do lançamento da libertadores"*.
// Formato de STORY, que é como ele posta (mesmo padrão de
// `mockup-campinho-stories.mjs`): vertical, tela cheia, sem falar de fonte nem
// de coisa de programador.
//
// A peça fala com QUEM JOGA, não com quem faz: o que muda pra ele, em uma
// frase por linha. Nada de "motor", "filtro", "commit".
//
//   node scripts/mockup-liberta-lancamento.mjs --saida /tmp/liberta-lanca.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'liberta-lancamento.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const INK = '#0C0C0C', OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F', NOITE = '#1B2A5B'

const CLUBES = ['🇦🇷 River Pratão', '🇦🇷 Bocazudo', '🇺🇾 Penhalol', '🇺🇾 Nassional', '🇨🇱 Colo do Colo',
  '🇨🇴 Atlético Cafezal', '🇵🇾 Serro Portenho', '🇧🇴 The Fortão', '🇵🇪 Aliança Limão', '🇨🇱 Cobra Loka',
  '🇪🇨 Liga de Quitanda', '🇻🇪 Deportivo Tá Xiro']

const PASSOS = [
  ['1', 'Jogue a liga de sempre', 'Mesma sala, mesmos 20 clubes, mesmas 38 rodadas.'],
  ['2', 'Termine entre os 8', 'Aí você pega a vaga — e entra como <b>cabeça de chave</b>.'],
  ['3', 'Caia num grupo de 4', '8 grupos, 32 clubes. Passam os <b>2 primeiros</b>.'],
  ['4', 'Vá até a final única', 'Oitavas, quartas e semi em ida e volta. A final é <b>um jogo só</b>.'],
]

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:#F4ECD6;color:${INK};padding:66px 48px 52px;
  font-family:system-ui,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column}
.pill{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:${NOITE};color:#fff;
  border:4px solid ${INK};border-radius:999px;padding:12px 30px;font-family:D,sans-serif;font-weight:700;
  font-size:24px;letter-spacing:.10em;text-transform:uppercase;box-shadow:6px 6px 0 ${INK}}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:104px;line-height:.92;margin:26px 0 0}
h1 .a{color:${NOITE}}
.lead{font-size:30px;line-height:1.36;font-weight:600;color:rgba(12,12,12,.76);margin-top:20px}
.lead b{color:${INK}}

.passos{margin-top:34px;display:flex;flex-direction:column;gap:14px}
.passo{display:flex;align-items:center;gap:18px;border:4px solid ${INK};border-radius:20px;background:#fff;
  padding:16px 20px;box-shadow:6px 6px 0 ${INK}}
.passo .n{font-family:D,sans-serif;font-weight:700;font-size:34px;background:${VERDE};color:#fff;border:3px solid ${INK};
  border-radius:14px;width:62px;height:62px;display:flex;align-items:center;justify-content:center;flex:0 0 62px}
.passo .tx b{display:block;font-family:D,sans-serif;font-weight:700;font-size:31px;text-transform:uppercase;line-height:1.05}
.passo .tx span{display:block;font-size:23px;font-weight:600;color:rgba(12,12,12,.68);margin-top:3px;line-height:1.3}
.passo .tx span b{display:inline;font-family:inherit;font-size:inherit;text-transform:none;color:${INK}}

.clubes{margin-top:26px;border:4px solid ${INK};border-radius:22px;background:${NOITE};padding:20px 22px;box-shadow:6px 6px 0 ${INK}}
.clubes p.t{font-family:D,sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;color:${OURO};letter-spacing:.05em}
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
.chip{border:3px solid ${INK};border-radius:999px;background:#fff;padding:6px 15px;
  font-family:D,sans-serif;font-weight:700;font-size:21px;text-transform:uppercase}

.chave{margin-top:26px;border:4px solid ${INK};border-radius:22px;background:#fff;padding:20px 22px;box-shadow:6px 6px 0 ${INK}}
.chave .ct{font-family:D,sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;letter-spacing:.04em}
.cf{display:flex;align-items:center;gap:6px;margin-top:15px;flex-wrap:wrap}
.cf .f{border:3px solid ${INK};border-radius:12px;background:#F4ECD6;padding:9px 13px;
  font-family:D,sans-serif;font-weight:700;font-size:21px;text-transform:uppercase;white-space:nowrap}
.cf .f.ouro{background:${OURO};box-shadow:3px 3px 0 ${INK}}
.cf i{font-family:D,sans-serif;font-style:normal;font-weight:700;font-size:24px;color:rgba(12,12,12,.35)}
.cd{font-size:22px;font-weight:600;color:rgba(12,12,12,.66);margin-top:14px;line-height:1.3}
.cd b{color:${INK}}
.nota{margin-top:auto;border:5px solid ${INK};border-radius:24px;background:#E7F5EC;padding:20px 24px;box-shadow:7px 7px 0 ${INK}}
.nota p{font-size:27px;font-weight:600;line-height:1.34;color:rgba(12,12,12,.84)}
.nota p b{color:${INK}}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 6px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:38px;display:flex;align-items:center;gap:12px}
.marca span{color:${VERM}}
.site{font-family:D,sans-serif;font-weight:600;font-size:24px;color:rgba(12,12,12,.45)}
</style>

<div class="pill">🌎 Novidade no online</div>
<h1>Chegou a<br><span class="a">Libertadores</span>.</h1>
<p class="lead">Agora a sua liga <b>vale vaga</b>. Terminou entre os 8? Você está na Libertadores — com
<b>32 clubes</b> e os grandes do continente.</p>

<div class="passos">
  ${PASSOS.map(([n, t, d]) => `
  <div class="passo">
    <span class="n">${n}</span>
    <div class="tx"><b>${t}</b><span>${d}</span></div>
  </div>`).join('')}
</div>

<div class="clubes">
  <p class="t">🏟️ Quem te espera do outro lado</p>
  <div class="chips">${CLUBES.map(c => `<span class="chip">${c}</span>`).join('')}<span class="chip">+12</span></div>
</div>

<div class="chave">
  <p class="ct">🏆 O caminho até a taça</p>
  <div class="cf">
    ${['🥅 Grupos', '⚔️ Oitavas', '⚔️ Quartas', '⚔️ Semi', '🏆 FINAL'].map((f, i) => `
      <span class="f ${i === 4 ? 'ouro' : ''}">${f}</span>${i < 4 ? '<i>›</i>' : ''}`).join('')}
  </div>
  <p class="cd">6 jogos de grupo · ida e volta no mata-mata · <b>final em jogo único</b></p>
</div>

<div class="nota">
  <p>🛡️ <b>E o que você já joga não muda nada.</b> Quem não quiser a Libertadores segue com Liga + Copa
  ou Só liga, do mesmo jeito de sempre. O host escolhe na hora de criar a sala.</p>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
