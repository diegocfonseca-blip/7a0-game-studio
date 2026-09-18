// ⚽🦇 MOCKUP — "E O PLACAR VAI CONTINUAR MOSTRANDO A MASCOTE NO GOL?"
//
// Pergunta do Diego (18/09), depois de aprovar o layout de desktop:
// *"gostei!! Mas o placar vai continuar mostrando mascote quando faz gol e etc etc???"*.
//
// RESPOSTA CONFERIDA NO CÓDIGO (não de cabeça): sim, e não é por sorte — é porque
// o placar é UM COMPONENTE FECHADO (`OnlineScorePresentation`, em
// `online-match-visual.tsx`). A mascote é desenhada DENTRO dele: na linha 19 ela
// entra no lugar do escudo do lado que marcou, e na 36 ela vem como carimbo por
// cima (`ll26-goal-mascot`). O `pyramidseason.tsx` só entrega `mascot={carimboArt}`.
// Mudar o LAYOUT da página move esse componente de lugar — não abre ele.
//
// Este quadro mostra o placar NOVO nos dois momentos: 0×0 e no instante do gol.
// ⚠️ SÓ DESENHO. Nada mexido no jogo.
// Rodar: node scripts/mockup-online-desktop-gol.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const SAIDA = process.argv[2] || '/tmp/mockup-online-desktop-gol.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D'
const b64 = p => 'data:image/webp;base64,' + readFileSync(p).toString('base64')
const MASCOTE = b64('src/escalacao/img/neymarzetti-mascote.webp')   // 346x440
const ESCUDO_N = b64('src/escalacao/img/neymarzetti-escudo.webp')

const placar = (gol) => `
<div class="cd" style="background:#22352a;border-color:#000;padding:0;overflow:hidden;position:relative">
  <div style="background:${gol ? GOLD : '#101a13'};text-align:center;padding:7px 10px;font-size:13px;font-weight:900;color:${gol ? INK : '#fff'};letter-spacing:.4px">
    ${gol ? '⚽ GOOOL! Neymar Jr 23′' : '🟢 BOLA ROLANDO'}
  </div>
  <div style="position:relative;padding:14px 10px 16px">
    <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);background:${INK};color:#fff;font-size:11px;font-weight:900;padding:3px 12px;border-radius:999px">${gol ? "23'" : "22'"}</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-top:14px">
      <div style="text-align:center;color:#fff">
        <div style="font-size:16px;font-weight:900">Bagres 1993</div>
        <div style="font-size:10px;opacity:.55;font-weight:800">RIVAL</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:#fff;border:3px solid ${INK};border-radius:12px;padding:4px 16px">
        <span style="font-size:30px;font-weight:900">0</span><span style="color:#b8b0a0;font-size:17px">×</span>
        <span style="font-size:30px;font-weight:900;${gol ? `color:${VERDE}` : ''}">${gol ? '1' : '0'}</span>
      </div>
      <div style="text-align:center;color:#fff;position:relative">
        ${gol
          ? `<img src="${MASCOTE}" height="96" width="${Math.round(96 * 346 / 440)}" style="display:block;margin:0 auto -4px;filter:drop-shadow(0 0 10px rgba(255,196,0,.55))">`
          : `<img src="${ESCUDO_N}" height="46" style="display:block;margin:0 auto 4px">`}
        <div style="font-size:16px;font-weight:900">Neymarzetti 👑</div>
        <div style="font-size:10px;opacity:.55;font-weight:800">VOCÊ</div>
      </div>
    </div>
  </div>
  ${gol ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at 78% 45%, rgba(255,196,0,.28), transparent 60%);pointer-events:none"></div>` : ''}
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1280px;padding:28px}
  h1{font-size:44px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 17px;font-size:16px;font-weight:700;margin:13px 0 20px;line-height:1.45}
  .cd{border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK}}
  .rot{display:inline-block;color:#fff;font-weight:900;font-size:12.5px;letter-spacing:1px;text-transform:uppercase;
       padding:6px 13px;border-radius:9px;margin-bottom:9px;background:${INK}}
  .rot.g{background:${VERDE}}
  .dois{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
  .nota{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:16px 19px;margin-top:20px;
        font-size:14.5px;font-weight:700;line-height:1.6}
  .nota b{color:${VERDE}}
  .cx{background:#EAF5EE;border:3px solid ${VERDE};border-radius:13px;padding:13px 16px;margin-top:14px;font-size:14.5px;font-weight:700;line-height:1.5}
  .cx b{color:${VERDE}}
</style>

<h1>O GOL CONTINUA <span class="g">IGUALZINHO</span></h1>
<div class="lead">Conferi no código antes de responder. <b>O placar é um componente fechado</b> — a mascote é
desenhada DENTRO dele. O ajuste de desktop move esse bloco de lugar na página; <b>não abre ele</b>.
Então tudo que acontece no gol continua acontecendo, do mesmo jeito.</div>

<div class="dois">
  <div><div class="rot">bola rolando</div>${placar(false)}</div>
  <div><div class="rot g">⚽ no instante do gol</div>${placar(true)}</div>
</div>

<div class="cx">🖥️ E no desktop ele ainda <b>GANHA</b>: hoje o placar vive espremido numa coluna de 620px.
Na faixa larga a mascote entra maior e a comemoração fica mais visível — que é justamente o momento
que você quer que apareça.</div>

<div class="nota">
  <b>O que continua, item por item</b> (tudo vive dentro do placar, nada disso é do layout):<br>
  🦇 <b>A mascote carimba a tela</b> no gol — e cada uma entra do SEU jeito (a águia mergulha, o palhaço
  quica, a cobra rasteja).<br>
  ⚽ <b>As frases variadas do gol</b> — GOOOL! · PINGOU! · SACUDIU! · ESTUFOU! · GOLAÇO! — e as de fim de
  jogo (🔥 NOS ACRÉSCIMOS!, NO ÚLTIMO SUSPIRO!).<br>
  💥 <b>O flash dourado</b> na faixa, e o número do placar dando o pulinho quando muda.<br>
  ⏱️ <b>O relógio</b> com a bolinha pulsando, e o FIM no apito.<br>
  🎯 <b>A lista de goleadores</b> embaixo de cada time, com a trava anti-spoiler de sempre (nada aparece
  antes do relógio chegar no minuto).<br>
  🏆 <b>O festão do campeão</b> e o pulo no pênalti seguem fora disto, na tela deles — nem encostei.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
