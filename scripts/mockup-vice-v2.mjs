// 🌴 19/11: mockup Vice City v2 — sorteio das 3 cartas, banner do golpe pra sala, estrelas de procurado na tela de quem levou.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const fundo = `background:linear-gradient(180deg,#14072e 0%,#3b1265 30%,#7a1d7e 55%,#ff4f8b 80%,#ffb26b 90%,#2a0c45 91%,#160828 100%)`
const carta = (e, n, f, giro = 0, vira = false) => `<div class="c" style="transform:rotate(${giro}deg)">${vira ? '<div class="verso">🌴<br>?</div>' : `<div class="ce">${e}</div><div class="cn">${n}</div><div class="cf">${f}</div>`}</div>`
const html = `<!doctype html><meta charset="utf-8"><style>${F}
*{box-sizing:border-box;margin:0}body{width:1260px;background:#F4ECD6;font-family:Oswald,sans-serif;padding:28px;color:#0C0C0C}
h1{font-size:40px;text-transform:uppercase}.sub{font-size:19px;color:#444;margin:4px 0 22px}
.row{display:flex;gap:26px}.col{width:380px}.tit{font-size:21px;font-weight:700;text-transform:uppercase;margin-bottom:8px}.exp{font-size:15px;color:#333;margin-top:10px;line-height:1.3}
.tela{height:720px;border:5px solid #0C0C0C;border-radius:30px;box-shadow:7px 7px 0 #0C0C0C;overflow:hidden;position:relative;${fundo};color:#fff;padding:18px}
.ban{position:absolute;left:12px;right:12px;top:150px;background:rgba(20,6,40,.95);border:4px solid #ff4fd8;border-radius:22px;box-shadow:0 0 30px #ff4fd8;padding:18px 14px;text-align:center}
.bt{font-size:28px;font-weight:700;letter-spacing:1px;color:#ffd24d;text-shadow:0 0 10px #ff4fd8}.bs{font-size:15px;color:#ffe1f6;margin-top:4px}
.cs{display:flex;gap:10px;justify-content:center;margin-top:16px}
.c{width:104px;height:150px;background:#fff;color:#0C0C0C;border:4px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;padding:8px 6px;text-align:center}
.ce{font-size:38px}.cn{font-size:15px;font-weight:700;text-transform:uppercase;line-height:1.05;margin-top:4px}.cf{font-size:11px;color:#444;line-height:1.15;margin-top:4px;font-family:sans-serif}
.verso{height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff4fd8,#7c3aed);color:#fff;border-radius:8px;font-size:30px;font-weight:700}
.bar{display:flex;gap:6px;align-items:center;background:rgba(0,0,0,.35);border-radius:12px;padding:8px 10px;font-size:15px}
.mesa{margin:16px auto 0;width:200px;height:250px;background:repeating-linear-gradient(45deg,#e6dcc0 0 12px,#ddd1b0 12px 24px);border:4px solid #0C0C0C;border-radius:14px;color:#0C0C0C;display:flex;align-items:flex-end;padding:10px;font-weight:700;font-size:20px;opacity:.55}
.golpe{position:absolute;left:0;right:0;top:220px;background:linear-gradient(90deg,#c2452f,#ff4fd8);border-top:4px solid #0C0C0C;border-bottom:4px solid #0C0C0C;padding:16px 14px;text-align:center;box-shadow:0 0 30px #ff4fd8}
.gt{font-size:32px;font-weight:700;letter-spacing:1px;text-shadow:3px 3px 0 #0C0C0C}.gs{font-size:17px;margin-top:4px}
.estrelas{position:absolute;right:14px;top:14px;background:rgba(0,0,0,.55);border:3px solid #ffd24d;border-radius:12px;padding:6px 10px;font-size:26px;letter-spacing:2px}
.estrelas b{color:#ffd24d;text-shadow:0 0 10px #ffd24d}.estrelas i{color:rgba(255,255,255,.25);font-style:normal}
.alerta{position:absolute;left:12px;right:12px;top:80px;background:#0C0C0C;border:4px solid #ffd24d;border-radius:16px;padding:12px;text-align:center}
.at{font-size:24px;font-weight:700;color:#ffd24d}.as{font-size:14px;color:#fff;margin-top:4px;font-family:sans-serif}
.pisca{position:absolute;inset:0;border:10px solid transparent;border-image:linear-gradient(90deg,#ff2b2b,#2b6bff) 1;opacity:.8}
</style><body>
<h1>🌴 Vice City · o que muda</h1><div class="sub">Mockup — nada disso está no jogo ainda</div>
<div class="row">
 <div class="col"><div class="tit">① O sorteio das 3 cartas</div>
  <div class="tela"><div class="bar">🔨 o pregão começa em <b style="color:#ffd24d">&nbsp;8s</b></div>
   <div class="ban"><div class="bt">🎰 SUAS CARTAS DE GOLPE</div><div class="bs">sorteadas agora · só você vê</div>
    <div class="cs">${carta('🚔', 'Blitz', 'Ele fica 10 s sem dar lance', -4)}${carta('🛡️', 'Colete', 'O próximo golpe contra você não pega', 0)}${carta('', '', '', 4, true)}</div>
    <div class="bs" style="margin-top:12px">a 3ª está virando…</div></div></div>
  <div class="exp">Antes do pregão, cada técnico vê as <b>3 cartas</b> dele virando uma por uma (sorteio automático). Ninguém vê as dos outros. Acabou a carta que chegava no meio do pregão.</div></div>
 <div class="col"><div class="tit">② Golpe = banner pra sala toda</div>
  <div class="tela"><div class="bar">LAT · Pará (Santos 2011) · lance 12</div><div class="mesa">Pará</div>
   <div class="golpe"><div class="gt">🚔 BLITZ!</div><div class="gs"><b>Futpoint FC</b> travou o <b>Neymarzetti</b><br>10 s sem dar lance</div></div></div>
  <div class="exp">Todo golpe aparece em <b>faixa grande no meio da tela de todo mundo</b> por 3 s, com o emoji, quem usou e em quem. O relógio do pregão NÃO para.</div></div>
 <div class="col"><div class="tit">③ Estrelas de procurado</div>
  <div class="tela"><div class="pisca"></div><div class="estrelas"><b>★★</b><i>★★★</i></div>
   <div class="alerta"><div class="at">🚨 VOCÊ ESTÁ SENDO PROCURADO</div><div class="as">Levou o 2º golpe. Com 5 ⭐ vem o BUSTED.</div></div>
   <div class="mesa" style="margin-top:200px">Pará</div></div>
  <div class="exp">Quem leva golpe vê as <b>próprias estrelas</b> no canto (1, depois 2…) e a tela pisca a sirene na hora. <b>Só ele vê as dele</b> — o ranking de todo mundo continua só no 🎯 Sniper.</div></div>
</div></body>`
const tmp = `/tmp/vice-v2-${process.pid}.html`; writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1260, height: 900 } })
await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/vice-city-v2.png', fullPage: true }); await b.close(); console.log('ok')
