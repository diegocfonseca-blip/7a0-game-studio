#!/usr/bin/env node
// ─── 🌎 MOCKUP: O BANNERZÃO DE ABERTURA DA LIBERTADORES ────────────────────
//
// Pedido do Diego (20/08): *"precisamos de um banner grande também qd acaba a
// liga igual a copa dos 8, q entraria o banner grande da libertadores c visual
// bonito e brilhante e c as regras... E dps de 30s de contagem se inicia ou o
// host aperta o avançar tb"*.
//
// ♻️ TUDO ISSO JÁ EXISTE — é o banner da Copa dos 8 com outra cor:
//   · `screens.tsx:4372` — a caixa `PURPLE_HOLO` + `<ApoioSheen holo={1}>`, que
//     é o MESMO brilho da carta 💎 Promessa (mecanismo reaproveitado, 0 KB).
//   · `screens.tsx:4385` — *"⚽ A primeira partida começa em {copaFirstLeft}s"*,
//     a contagem que hoje é de **10s** (`COPA_INTRO_SECONDS`). A Libertadores
//     entra com **30s**, porque tem mais regra pra ler.
//   · `screens.tsx:4387` — na sala com host mandando, o texto vira *"o host
//     começa quando quiser"* e o botão ▶️ Avançar aparece pra ele.
// Ou seja: nada de motor novo aqui. Muda a COR, o TEXTO e o número da contagem.
//
//   node scripts/mockup-liberta-banner.mjs --saida /tmp/liberta-banner.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'liberta-banner.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const INK = '#0C0C0C', OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'
// 🌑 azul-noite holo — espelha o PURPLE_HOLO da Copa dos 8
// (`linear-gradient(150deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)`), na cor da Liberta.
const NOITE_HOLO = 'linear-gradient(150deg,#8FAEF0,#2E4A8F 52%,#0F1A38)'
const ROXO_HOLO = 'linear-gradient(150deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)'

const REGRAS = [
  ['🎟️', 'Os 8 primeiros da liga estão dentro', 'e entram como <b>cabeça de chave</b> — um por grupo.'],
  ['🥅', '8 grupos de 4, ida e volta', 'passam os <b>2 primeiros</b> de cada grupo.'],
  ['⚔️', 'Oitavas, quartas e semi', 'ida e volta, soma dos dois jogos. Empatou, <b>pênalti</b>.'],
  ['🏆', 'A final é jogo único', 'e o campeão leva <b>outra carta</b> pro álbum, além da carta da liga.'],
]

const banner = ({ fundo, titulo, rodape, brilho }) => `
<div class="bn" style="background:${fundo}">
  ${brilho ? '<span class="sheen"></span>' : ''}
  <div class="bnc">
    <p class="bt">${titulo}</p>
    <div class="regras">
      ${REGRAS.map(([i, t, d]) => `
        <div class="r"><span>${i}</span><p><b>${t}</b> — ${d}</p></div>`).join('')}
    </div>
    ${rodape}
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:${INK};font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;gap:10px;background:${OURO};border:3px solid ${INK};border-radius:999px;padding:8px 20px;
  font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;box-shadow:4px 4px 0 ${INK}}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:56px;line-height:.97;margin:18px 0 0}
h1 .a{color:#2E4A8F}
.lead{font-size:16.5px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:950px}
.lead b{color:${INK}}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:22px;margin:30px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}

/* ── o bannerzão ── */
.bn{position:relative;overflow:hidden;border:4px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:20px 22px}
.sheen{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 34%,rgba(255,255,255,.55) 50%,transparent 64%)}
.bnc{position:relative;z-index:2}
.bt{font-family:D,sans-serif;font-weight:700;font-size:30px;text-align:center;color:${OURO};text-transform:uppercase;
  letter-spacing:.02em;text-shadow:2px 2px 0 rgba(0,0,0,.35)}
.regras{margin-top:15px;display:flex;flex-direction:column;gap:9px}
.r{display:flex;gap:11px;align-items:flex-start}
.r span{font-size:19px;line-height:1.15;flex:0 0 26px}
.r p{font-size:15px;font-weight:600;line-height:1.4;color:rgba(255,255,255,.9)}
.r p b{color:#fff;font-family:D,sans-serif;font-weight:700;font-size:16px;text-transform:uppercase}
.cont{margin-top:16px;text-align:center;font-family:D,sans-serif;font-weight:700;font-size:20px;color:#fff}
.cont b{color:${OURO};font-size:26px}
.btn{margin-top:14px;display:block;width:100%;border:3px solid ${INK};border-radius:14px;background:${OURO};
  font-family:D,sans-serif;font-weight:700;font-size:19px;text-transform:uppercase;padding:13px;text-align:center;
  box-shadow:4px 4px 0 ${INK}}
.espera{margin-top:16px;text-align:center;font-family:D,sans-serif;font-weight:700;font-size:18px;color:rgba(255,255,255,.9)}

.par{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.rot{font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.06em;
  background:${INK};color:#fff;border-radius:10px;padding:7px 13px;display:inline-block;margin-bottom:10px}
.rot.g{background:${VERDE}}
.cx{border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};background:#fff;padding:15px 17px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}
.it{display:flex;gap:11px;align-items:flex-start}
.it .n{font-family:D,sans-serif;font-weight:700;font-size:19px;color:${VERM};line-height:1.05;width:26px;flex:0 0 26px}
.it p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.it p b{color:${INK}}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:${VERM}}
</style>

<div class="pill">🌎 Mockup · o banner de abertura</div>
<h1>A liga acabou.<br>Entra a <span class="a">Libertadores</span>.</h1>
<p class="lead">Do mesmo jeito que a Copa dos 8 faz hoje: quando a 38ª rodada apita, <b>o bannerzão toma a tela</b>,
brilhando, com as regras escritas. Depois de <b>30 segundos</b> a primeira partida começa sozinha — ou o host aperta
o botão e começa na hora.</p>

<h2>1 · O banner <small>com o brilho passando, igual à Copa dos 8</small></h2>
<div class="par">
  <div>
    <span class="rot g">▶ Sala normal · a contagem corre</span>
    ${banner({
      fundo: NOITE_HOLO, brilho: true,
      titulo: '🌎 Chegou a Libertadores!',
      rodape: '<p class="cont">⚽ O sorteio dos grupos começa em <b>30s</b></p>',
    })}
  </div>
  <div>
    <span class="rot">👑 Sala com host mandando</span>
    ${banner({
      fundo: NOITE_HOLO, brilho: true,
      titulo: '🌎 Chegou a Libertadores!',
      rodape: '<p class="espera">⏳ O host começa a Libertadores quando quiser…</p>'
        + '<div class="btn">▶️ Começar a Libertadores</div>',
    })}
  </div>
</div>

<h2>2 · Do lado do que já existe <small>a Copa dos 8 de hoje, pra comparar</small></h2>
<div class="par">
  <div>
    <span class="rot">Hoje · Copa dos 8</span>
    <div class="bn" style="background:${ROXO_HOLO}">
      <span class="sheen"></span>
      <div class="bnc">
        <p class="bt">🏆 Chegou a Copa dos 8!</p>
        <div class="regras">
          <div class="r"><span>⚔️</span><p>Os 8 melhores da liga se enfrentam ida e volta: 1º×8º, 2º×7º, 3º×6º, 4º×5º. Quem passar cai na semifinal — e a final é jogo único. O campeão da Copa ganha <b style="display:inline;font-size:inherit;text-transform:none;color:${OURO}">outra carta</b> pro álbum!</p></div>
        </div>
        <p class="cont">⚽ A primeira partida começa em <b>10s</b></p>
      </div>
    </div>
  </div>
  <div class="cx">
    <p style="font-family:D,sans-serif;font-weight:700;font-size:16px;text-transform:uppercase;margin-bottom:10px">O que muda de um pro outro</p>
    <div class="it"><span class="n">🎨</span><p><b>A cor.</b> O roxo brilhante da Copa dos 8 vira o <b>azul-noite</b> da Libertadores. É o mesmo mecanismo de brilho da carta 💎 Promessa, que já roda no jogo e <b>não pesa nada</b>.</p></div>
    <div class="it" style="margin-top:11px"><span class="n">📜</span><p><b>As regras.</b> A Copa dos 8 cabe em um parágrafo; a Libertadores tem fase de grupos, então vira <b>4 linhas curtas</b> — uma por etapa.</p></div>
    <div class="it" style="margin-top:11px"><span class="n">⏱️</span><p><b>A contagem.</b> Hoje são <b>10s</b>. A Libertadores vai de <b>30s</b>, como você pediu — dá tempo de ler antes de a bola rolar.</p></div>
    <div class="it" style="margin-top:11px"><span class="n">▶️</span><p><b>O botão do host.</b> Já existe igualzinho: em sala com host mandando, a contagem some e ele aperta <b>▶️ Começar</b> quando quiser.</p></div>
  </div>
</div>

<h2>3 · Segurança</h2>
<div class="cx">
  <div class="grid2">
    <div class="it"><span class="n">🚫</span><p><b>Sem spoiler</b>: o banner não mostra grupo nem adversário. O sorteio só aparece <b>depois</b> que a contagem acaba — sua regra de ouro.</p></div>
    <div class="it"><span class="n">⏱️</span><p><b>Não atrasa nada</b>: os 30s rodam no tempo morto entre a liga e o primeiro jogo. Nenhum passo novo, nenhum toque a mais.</p></div>
    <div class="it"><span class="n">♻️</span><p><b>Nada de motor novo</b> nesta parte: é a caixa da Copa dos 8 com outra cor, outro texto e outro número.</p></div>
    <div class="it"><span class="n">↩️</span><p><b>Reverter é um commit</b>: sem o banner, a Libertadores começaria direto — nada quebra.</p></div>
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
