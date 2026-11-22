// Mockup (21/11): 3 pedidos do Diego depois do 1º teste do Bafo — pacote abrindo na convocação, suspense da carta tomada e
// a faixa da regra em cima do campo. Quadros parados, um ao lado do outro.
import { createRequire } from 'module'
import fs from 'fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const pack = 'data:image/webp;base64,' + fs.readFileSync('src/escalacao/img/online-pacote-v20.webp').toString('base64')
const css = `body{margin:0;background:#101612;font-family:Inter,sans-serif;padding:18px;color:#F4ECD6}
.os{font-family:Oswald;font-weight:700;text-transform:uppercase}
h2{font-family:Oswald;text-transform:uppercase;color:#FFC400;font-size:22px;margin:18px 0 4px}h2:first-child{margin-top:0}
.sub{font-size:13px;font-weight:600;color:#cfc8b4;margin:0 0 10px}
.row{display:flex;gap:14px;align-items:stretch}
.fr{width:300px;border:4px solid #0C0C0C;border-radius:22px;background:radial-gradient(circle at 50% 40%,#12301f,#0c0c0c 72%);padding:12px;box-shadow:4px 4px 0 #000;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:430px;position:relative;text-align:center}
.fr.rx{background:radial-gradient(circle at 50% 40%,#2a2140,#0c0c0c 70%)}
.n{position:absolute;top:8px;left:10px;background:#FFC400;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:8px;padding:0 7px;font-family:Oswald;font-size:13px}
.t{font-family:Oswald;text-transform:uppercase;font-size:21px;color:#fff;line-height:1.15;margin-top:10px}
.k{font-family:Oswald;text-transform:uppercase;font-size:11px;letter-spacing:.14em;color:#FFC400}
.pk{width:150px;filter:drop-shadow(0 0 18px rgba(60,220,120,.55))}
.pista{display:inline-block;font-family:Oswald;font-size:13px;border:2px solid #555;border-radius:8px;padding:1px 8px;margin:2px;background:#151515;color:#777}
.pista.on{background:#FFC400;color:#0C0C0C;border-color:#0C0C0C}
.cob{width:150px;height:200px;border-radius:16px;border:4px solid #555;background:repeating-linear-gradient(45deg,#1a1a1a 0 12px,#242424 12px 24px);display:grid;place-items:center}
.cob i{font-style:normal;width:92px;height:124px;border-radius:12px;background:#0C0C0C;border:3px solid #FFC400;color:#FFC400;font-family:Oswald;font-size:44px;display:grid;place-items:center}
.carta{width:190px;height:262px;border-radius:16px;border:4px solid #0C0C0C;background:linear-gradient(160deg,#7fd0ff,#2a78c8);box-shadow:0 0 30px #58b4ff;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;color:#fff;text-align:left;position:relative}
.carta b{font-family:Oswald;font-size:24px;text-transform:uppercase;line-height:1}
.carta small{font-weight:700;font-size:12px}
.carta .p{position:absolute;top:8px;left:8px;background:#0C0C0C;color:#FFC400;font-family:Oswald;border-radius:8px;padding:0 7px;font-size:15px}
.carimbo{position:absolute;right:26px;bottom:150px;transform:rotate(-10deg);font-family:Oswald;font-size:18px;color:#fff;background:#E8503A;border:3px solid #0C0C0C;border-radius:10px;padding:1px 10px;text-transform:uppercase}
.zo{margin-top:10px;background:#fff;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:7px 10px;font-size:13px;font-weight:700;text-align:left}
.lista{width:100%;background:#F4ECD6;border-radius:12px;border:3px solid #0C0C0C;color:#0C0C0C;text-align:left;padding:8px;font-size:12px;font-weight:700}
.lista div{border-bottom:1px solid rgba(0,0,0,.15);padding:5px 2px;display:flex;gap:6px;align-items:center}
.lista span{font-family:Oswald;border:2px solid #0C0C0C;border-radius:6px;padding:0 5px;font-size:11px;background:#fff}
.faixa{width:420px;background:#0C0C0C;border:3px solid #FFC400;border-radius:14px;padding:8px 12px;box-shadow:3px 3px 0 #000}
.faixa .l1{font-family:Oswald;text-transform:uppercase;font-size:15px;color:#FFC400}
.faixa .l2{font-size:13px;font-weight:700;color:#fff;margin-top:3px}
.faixa .l2 b{color:#7CFFA5}.campo{height:70px;border-radius:10px;margin-top:8px;background:repeating-linear-gradient(90deg,#2c7a3f 0 40px,#2f8344 40px 80px);border:2px solid #fff;opacity:.85;display:grid;place-items:center;font-family:Oswald;color:#fff;font-size:12px;letter-spacing:.1em}`
const f = (n, body, rx) => `<div class="fr ${rx ? 'rx' : ''}"><span class="n">${n}</span>${body}</div>`
const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<h2>1 · A convocação começa com o pacote abrindo</h2><p class="sub">Página nova. O pacote verde aparece fechado, treme, rasga (uns 2,5 s) e as suas cartas saem dele em lista, igual já é. O relógio só começa a contar quando a lista aparece.</p>
<div class="row">
${f('1', `<p class="k">🃏 Bafo · convocação</p><img class="pk" src="${pack}"><p class="t">Suas cartas de campeão…</p>`)}
${f('2', `<p class="k">🃏 Bafo · convocação</p><img class="pk" src="${pack}" style="transform:rotate(-7deg) scale(1.08);filter:drop-shadow(0 0 40px #9dffb9) brightness(1.35)"><p class="t">…abrindo! ✂️</p>`)}
${f('3', `<p class="k">⏱️ Convoque até 22 · 160s</p><div class="lista"><div><span>GOL</span>Taffarel · Flamengo 1990</div><div><span>LAT</span>Cafu · Flamengo 1990</div><div><span>ZAG</span>Aldair · Milan 1993</div><div><span>MEI</span>Zico · Santos 1996</div><div><span>ATA</span>Romário · Milan 1993</div><div style="border:0;color:#777">… a lista de sempre</div></div>`)}
</div>
<h2>2 · O suspense da carta que o campeão tomou</h2><p class="sub">Igual ao suspense da Liga Draft, só que começa no pacote verde fechado. Pistas de 2 em 2 s e a carta vira em tamanho real. No fim, a zoeira do campeão pra quem perdeu (frase sorteada de um banco grande).</p>
<div class="row">
${f('1', `<p class="k">🏆 Futpoint FC escolheu</p><img class="pk" src="${pack}"><p class="t">🥁 Carta tomada!</p><div><span class="pista">?</span><span class="pista">?</span><span class="pista">?</span></div>`, 1)}
${f('2', `<p class="k">🏆 Futpoint FC escolheu</p><div class="cob"><i>LAT</i></div><p class="t">É um… lateral</p><div><span class="pista on">LAT</span><span class="pista">?</span><span class="pista">?</span></div>`, 1)}
${f('3', `<p class="k">🏆 Futpoint FC escolheu</p><div class="cob" style="border-color:#58b4ff;box-shadow:0 0 34px #58b4ff;background:repeating-linear-gradient(135deg,#c8102e 0 18px,#111 18px 26px,#c8102e 26px 44px)"><i>LAT</i></div><p class="t">Era do Neymarzetti… Flamengo, anos 2000</p><div><span class="pista on">LAT</span><span class="pista on">⚽ Bom jogador</span><span class="pista on">anos 2000</span></div>`, 1)}
${f('4', `<p class="k">🏆 Futpoint FC tomou do Neymarzetti</p><div class="carta"><span class="p">LAT</span><b>Roger Guerreiro</b><small>Flamengo · 2004</small></div><span class="carimbo">Tomada!</span><div class="zo">😈 <b>Futpoint FC:</b> "Obrigado pelo presente, Neymarzetti. Vou cuidar bem dele… no banco."</div>`, 1)}
</div>
<h2>3 · Em cima do campo: a regra de ganhar e quem está na frente</h2><p class="sub">Uma faixa só, sempre no mesmo lugar (em cima do Campo 2D). O texto muda com o tamanho da sala.</p>
<div class="row">
<div><div class="faixa"><div class="l1">🃏 2 pessoas · 5 jogos · quem somar mais pontos leva</div><div class="l2">Jogo 3 de 5 · <b>Futpoint FC 4 pts</b> × 1 pt Neymarzetti</div><div class="campo">CAMPO 2D</div></div></div>
<div><div class="faixa"><div class="l1">🃏 4 pessoas · todos contra todos, 4 vezes</div><div class="l2">Rodada 5 de 12 · líder <b>The Wolf 10 pts</b> · você é o 2º, a 2 pts</div><div class="campo">CAMPO 2D</div></div></div>
<div><div class="faixa"><div class="l1">🃏 12 pessoas · todos contra todos, ida e volta</div><div class="l2">Rodada 9 de 22 · líder <b>Abobados 19 pts</b> · você é o 5º, a 6 pts</div><div class="campo">CAMPO 2D</div></div></div>
</div></body></html>`
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(1200)
await p.screenshot({ path: 'scripts/mockups/bafo-teatro.png', fullPage: true })
await b.close()
