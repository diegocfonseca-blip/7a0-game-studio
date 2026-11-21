// 📲 STORIES do lançamento do 🃏 BAFO (21/11, Diego: *"faça agora o mockup de postagem de stories do bafo"*). 1080×1920.
// Cartas e pacote são os DE VERDADE do jogo (scripts/foto-bafo-cartas.mjs → scripts/posts/img/bafo-*.png).
// ⛔ Postar só quando o Bafo for liberado pra todos (`SALA_ELENCO_GERAL`).
// Rodar: node scripts/stories-bafo.mjs → scripts/posts/stories-bafo.png
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const img = f => `data:image/png;base64,${readFileSync(`scripts/posts/img/${f}`).toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', RED = '#E8503A'
const passo = (n, ic, t, s) => `<div class="passo"><span class="num">${n}</span><span class="ic">${ic}</span><div><b>${t}</b><small>${s}</small></div></div>`
const carta = (f, x, y, rot, w) => `<img src="${img(f)}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg)">`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;
background:radial-gradient(ellipse at 50% 34%,#1f8a47 0%,#0f4a26 40%,#06180d 82%);position:relative}
.wrap{position:relative;padding:60px 64px 0;display:flex;flex-direction:column;align-items:center;text-align:center}
.pill{display:flex;gap:14px;font:700 30px Oswald;letter-spacing:.06em;text-transform:uppercase}
.pill span{border:4px solid ${INK};border-radius:999px;padding:8px 26px;box-shadow:5px 5px 0 #000;background:${GOLD};color:${INK}}
h1{font:700 300px/.9 Oswald;text-transform:uppercase;margin:26px 0 0;color:${GOLD};text-shadow:10px 10px 0 #000;letter-spacing:.02em}
.frase{font:700 50px/1.1 Oswald;text-transform:uppercase;margin:22px 0 0}
.frase em{font-style:normal;color:${GOLD}}
.palco{position:relative;width:952px;height:560px;margin:6px 0 0}
.pac{position:absolute;left:346px;top:60px;width:260px;border-radius:18px;border:5px solid ${INK};box-shadow:10px 10px 0 #000;transform:rotate(-3deg)}
.carimbo{position:absolute;left:560px;top:250px;background:${RED};color:#fff;border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 #000;padding:6px 26px;font:700 58px Oswald;transform:rotate(-10deg)}
.box{width:100%;background:${CREME};color:${INK};border:5px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 #000;padding:22px 30px;text-align:left}
.passo{display:flex;align-items:center;gap:20px;padding:11px 0}.passo+.passo{border-top:3px dashed rgba(12,12,12,.2)}
.num{flex:none;width:58px;height:58px;border-radius:99px;background:${INK};color:${GOLD};font:700 32px Oswald;display:flex;align-items:center;justify-content:center}
.ic{font-size:48px;flex:none}.passo b{display:block;font:700 40px Oswald;text-transform:uppercase;line-height:1}.passo small{display:block;font:700 26px system-ui;color:rgba(12,12,12,.65);margin-top:4px}
.selos{margin-top:22px;display:flex;gap:16px;width:100%}
.selos div{flex:1;background:${GOLD};color:${INK};border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 #000;padding:14px 8px;font:700 34px Oswald;text-transform:uppercase;line-height:1.05}
.selos small{display:block;font:800 21px system-ui;text-transform:none;margin-top:5px}
.site{margin-top:26px;background:#fff;color:${INK};border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 #000;padding:12px 40px;font:700 42px Oswald}
.site b{color:#C2452F}
</style></head><body>
<div class="wrap">
  <div class="pill"><span>🃏 Novo nas salas online</span></div>
  <h1>Bafo</h1>
  <p class="frase">Aqui a carta é <em>de verdade</em>.<br>Perdeu, ela vai embora.</p>
  <div class="palco">
    ${carta('bafo-taffarel.png', -10, 150, -16, 300)}${carta('bafo-zico.png', 120, 80, -8, 320)}
    ${carta('bafo-pele.png', 690, 150, 16, 300)}${carta('bafo-romario.png', 540, 80, 8, 320)}
    ${carta('bafo-ronaldo.png', 280, 20, 0, 400)}
    <div class="carimbo">TOMADA!</div>
  </div>
  <div class="box">
    ${passo(1, '🏆', 'Suas cartas de campeão', 'as que você ganhou na Carreira e nas salas online')}
    ${passo(2, '📋', 'Convoque 22', 'você tem 160 s pra escolher quem vai pro jogo')}
    ${passo(3, '⚽', 'Só gente, só liga', 'sem bot, no Campo 2D, com reserva pra trocar')}
    ${passo(4, '😈', 'O campeão toma 1 carta', 'escolhe de quem quiser, com suspense pra sala toda')}
  </div>
  <div class="selos"><div>1ª sala do dia<small>é de graça</small></div><div>Entrar<small>é livre</small></div><div>11+ cartas<small>pra jogar</small></div></div>
  <div class="site">⚽ Leilão <b>Legends</b> · leilaolegends.com</div>
</div></body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800)
await p.screenshot({ path: 'scripts/posts/stories-bafo.png' }); await b.close(); console.log('scripts/posts/stories-bafo.png')
