// 🖼️ MOCKUP da COLETIVA como PASSO depois do jogo (20/10). Diego: *"não tá tendo sentido entrevista embaixo do jogo… tem que ser
// passo a passo: após o jogo, quando ele avançar ou pular, aparecer, mas sem mostrar o próximo jogo… melhorar muito visualmente"*
// e *"não é todo jogo né? senão fica cansativo"*. Três telas: (1) o jogo acabou → toque em "Próxima rodada"; (2) a SALA DE
// IMPRENSA em tela cheia (backdrop de patrocinadores, microfones, o repórter, a pergunta, 3 respostas); (3) a manchete que saiu.
//   node scripts/mockup-coletiva-passo.mjs  →  scripts/mockups/coletiva-passo.png
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const b64 = f => 'data:image/webp;base64,' + readFileSync(f).toString('base64')
const SALA = b64('src/escalacao/img/online-sala-v20.webp')
const VAD = b64('src/escalacao/img/patro-vadico-alfa.webp')
const TID = b64('src/escalacao/img/patro-tidex.webp')

const html = String.raw`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&family=Inter:wght@500;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:#F4ECD6;font-family:Inter,system-ui,sans-serif;padding:22px;color:#0C0C0C}
h1{font:900 24px Oswald;text-transform:uppercase;margin:0 0 4px}
.sub{font-size:13px;margin:0 0 16px;opacity:.75}
.row{display:flex;gap:22px;align-items:flex-start}
.col{width:360px}
.lbl{font:900 13px Oswald;text-transform:uppercase;margin:0 0 8px;display:flex;gap:6px;align-items:center}
.lbl b{background:#0C0C0C;color:#FFC400;border-radius:6px;padding:1px 7px}
.phone{width:360px;height:740px;border:4px solid #0C0C0C;border-radius:30px;overflow:hidden;box-shadow:5px 5px 0 #0C0C0C;position:relative;background:#11161c}
.top{height:44px;background:#0C0C0C;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font:800 13px Oswald}
.top .t5{background:#FFC400;color:#0C0C0C;border-radius:6px;padding:1px 7px;margin-right:6px}
/* tela 1 */
.fim{padding:14px}
.placar{background:#0C0C0C;border:3px solid #fff;border-radius:16px;color:#fff;padding:14px;text-align:center}
.placar .apito{font:800 11px Oswald;letter-spacing:1px;color:#FFC400}
.placar .nums{font:900 48px Oswald;line-height:1;margin:6px 0}
.placar .times{display:flex;justify-content:space-between;font:800 14px Oswald;text-transform:uppercase}
.goleiros{margin-top:8px;font-size:12px;opacity:.8}
.aviso{margin-top:12px;background:#FFF6DE;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 #0C0C0C;font-size:13px;font-weight:700;display:flex;gap:10px;align-items:center}
.aviso .mic{font-size:26px}
.btn{margin-top:14px;background:#FFC400;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:14px;text-align:center;font:900 20px Oswald;text-transform:uppercase}
.btn.sec{background:#fff;font-size:15px;padding:10px}
.dica{font-size:11.5px;opacity:.7;margin-top:6px;text-align:center}
/* tela 2: sala de imprensa */
.sala{position:absolute;inset:44px 0 0 0;background:#0e1319 url(${SALA}) center/cover;display:flex;flex-direction:column}
.sala:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,10,14,.55),rgba(8,10,14,.85) 60%,#0b0f14)}
.sala > *{position:relative}
.backdrop{margin:12px 12px 0;height:132px;border:3px solid #0C0C0C;border-radius:12px;background:#f7f2e4;position:relative;overflow:hidden;box-shadow:3px 3px 0 #000}
.backdrop .grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:0}
.backdrop .grid div{display:flex;align-items:center;justify-content:center;border-right:1px dashed rgba(0,0,0,.08);border-bottom:1px dashed rgba(0,0,0,.08)}
.backdrop .grid img{height:22px;max-width:86%;object-fit:contain;opacity:.95}
.backdrop .grid .t{background:#0B1220}
.backdrop .grid .ll{font:900 11px Oswald;color:#0C0C0C;letter-spacing:.5px}
.mesa{margin:-30px 22px 0;height:54px;background:linear-gradient(180deg,#1b232c,#0C0C0C);border:3px solid #0C0C0C;border-radius:10px 10px 4px 4px;position:relative;display:flex;align-items:flex-start;justify-content:center;gap:28px}
.mesa .m{width:8px;height:30px;background:#333;border-radius:4px;margin-top:-22px;position:relative}
.mesa .m:before{content:'';position:absolute;top:-12px;left:-6px;width:20px;height:16px;border-radius:8px;background:#555;border:2px solid #0C0C0C}
.mesa .m.y:before{background:#FFC400}.mesa .m.r:before{background:#E8503A}.mesa .m.g:before{background:#1B7A3D}
.mesa .nome{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font:900 12px Oswald;color:#FFC400;letter-spacing:1px;white-space:nowrap}
.cab{color:#fff;padding:10px 14px 0;font:800 11px Oswald;letter-spacing:1px;color:#FFC400;text-transform:uppercase;display:flex;justify-content:space-between}
.cab span{color:#fff;opacity:.8}
.pergunta{margin:8px 12px 0;display:flex;gap:9px;align-items:flex-start}
.rep{flex:none;width:44px;height:44px;border-radius:50%;background:#C2452F;border:3px solid #0C0C0C;color:#fff;font:900 20px Oswald;display:flex;align-items:center;justify-content:center;box-shadow:2px 2px 0 #000}
.balao{background:#fff;border:3px solid #0C0C0C;border-radius:4px 16px 16px 16px;padding:8px 11px;box-shadow:3px 3px 0 #000;font-size:14px;font-weight:700;line-height:1.3}
.balao .tag{display:inline-block;font:800 10px Oswald;background:#E8503A;color:#fff;border-radius:5px;padding:1px 6px;margin-bottom:4px;letter-spacing:.5px;text-transform:uppercase}
.resps{margin:10px 12px 0;display:flex;flex-direction:column;gap:8px}
.resp{background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:8px 10px;box-shadow:3px 3px 0 #000;display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center}
.resp .ic{width:34px;height:34px;border-radius:10px;border:2.5px solid #0C0C0C;display:flex;align-items:center;justify-content:center;font-size:18px}
.resp .tx{font:700 13px Oswald;line-height:1.2}
.resp .ef{font:600 11px Inter;opacity:.75;margin-top:2px}
.resp.prov{background:#FFE3D6}.resp.prov .ic{background:#E8503A}
.resp.dip .ic{background:#BFE3FF}.resp.des .ic{background:#EDE7D6}
.pular{margin:10px 12px;text-align:center;color:#fff;font:800 12px Oswald;letter-spacing:1px;opacity:.8;text-decoration:underline}
/* tela 3 */
.jornal{padding:14px}
.capa{background:#FFFDF4;border:3px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden}
.capa .logo{background:#0C0C0C;color:#FFC400;font:900 22px Oswald;text-align:center;padding:8px;letter-spacing:2px}
.capa .man{padding:12px 14px 4px;font:900 26px Oswald;text-transform:uppercase;line-height:1.05}
.capa .q{padding:2px 14px 12px;font-size:13px;font-style:italic;opacity:.8}
.efeito{margin-top:12px;background:#E9F7EE;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 #0C0C0C;font-size:13px;font-weight:700}
.efeito.ruim{background:#FFE3D6}
.regra{margin-top:18px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 14px;box-shadow:3px 3px 0 #0C0C0C;font-size:13px;line-height:1.45}
.regra b{font-family:Oswald;text-transform:uppercase}
</style></head><body>
<h1>🎙️ Coletiva como passo — mockup</h1>
<p class="sub">Só em jogo com assunto (clássico, goleada, virada, final, sequência…) — ~5 a 8 por temporada. Nunca embaixo do jogo.</p>
<div class="row">
 <div class="col">
  <div class="lbl"><b>1</b> O jogo acabou</div>
  <div class="phone"><div class="top"><span><span class="t5">T5</span>Rodada 11/38 · Série D</span><span>🥇 15º · 🪙 191</span></div>
   <div class="fim">
    <div class="placar"><div class="apito">APITO FINAL · CLÁSSICO</div><div class="nums">2 × 0</div><div class="times"><span>Neymarzetti</span><span>White Things</span></div><div class="goleiros">⚽ Júnior Baiano 90+2' · ⚽ Oséas 61'</div></div>
    <div class="aviso"><span class="mic">🎙️</span><span>Vitória no clássico: a imprensa está te esperando na sala de entrevistas.</span></div>
    <div class="btn">▶ Próxima rodada</div>
    <div class="dica">A coletiva abre ANTES da próxima rodada — o próximo jogo só aparece depois.</div>
   </div>
  </div>
 </div>
 <div class="col">
  <div class="lbl"><b>2</b> Sala de imprensa (tela cheia)</div>
  <div class="phone"><div class="top"><span><span class="t5">T5</span>Rodada 11/38 · Série D</span><span>🥇 15º · 🪙 191</span></div>
   <div class="sala">
    <div class="backdrop"><div class="grid">
      <div><img src="${VAD}"></div><div class="t"><img src="${TID}"></div><div><span class="ll">LEILÃO LEGENDS</span></div>
      <div class="t"><img src="${TID}"></div><div><span class="ll">LEILÃO LEGENDS</span></div><div><img src="${VAD}"></div>
      <div><span class="ll">LEILÃO LEGENDS</span></div><div><img src="${VAD}"></div><div class="t"><img src="${TID}"></div>
    </div></div>
    <div class="mesa"><div class="m y"></div><div class="m r"></div><div class="m g"></div><div class="nome">PRESIDENTE · NEYMARZETTI</div></div>
    <div class="cab">🎙️ Coletiva · Rodada 11 <span>⚽ 2 × 0 · vitória no clássico</span></div>
    <div class="pergunta"><div class="rep">R</div><div class="balao"><span class="tag">🎤 Rogério · Rádio Pregão</span><br>“Presidente, 2 a 0 no White Things e o lado de lá disse que vocês tiveram sorte. Vai deixar passar?”</div></div>
    <div class="resps">
     <div class="resp prov"><div class="ic">😈</div><div><div class="tx">“Vale uma temporada pra eles. Pra nós é só mais um clássico ganho.”</div><div class="ef">🔥 Rival motivado: o próximo clássico fica mais duro</div></div></div>
     <div class="resp dip"><div class="ic">🧊</div><div><div class="tx">“A cidade é grande pros dois. Hoje ela amanhece com a nossa cor.”</div><div class="ef">📣 Torcida em festa: +10% de bilheteria</div></div></div>
     <div class="resp des"><div class="ic">🚪</div><div><div class="tx">“Prefiro que a torcida fale por mim hoje.”</div><div class="ef">— sem efeito no jogo</div></div></div>
    </div>
    <div class="pular">pular a coletiva ›</div>
   </div>
  </div>
 </div>
 <div class="col">
  <div class="lbl"><b>3</b> A manchete (1 toque) → próxima rodada</div>
  <div class="phone"><div class="top"><span><span class="t5">T5</span>Rodada 11/38 · Série D</span><span>🥇 15º · 🪙 191</span></div>
   <div class="jornal">
    <div class="capa"><div class="logo">O MARTELO</div><div class="man">“A cidade amanhece com a nossa cor”</div><div class="q">Neymarzetti não provocou depois do 2 × 0 no clássico — e a torcida lotou o estádio de novo.</div></div>
    <div class="efeito">📣 Torcida em festa: +10% de bilheteria (já no caixa)</div>
    <div class="btn">▶ Ir pra rodada 12</div>
   </div>
  </div>
  <div class="regra"><b>Quando aparece:</b> só em jogo com assunto — clássico, goleada, virada, final de copa, sequência boa/ruim, proposta por craque. Assunto pequeno espera 2–4 rodadas. <b>No automático</b> ela fecha sozinha em 12 s (o jogo nunca trava).</div>
 </div>
</div>
</body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const tmp = 'scripts/mockups/_coletiva-passo.html'
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + process.cwd() + '/' + tmp)
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/mockups/coletiva-passo.png', fullPage: true })
await b.close()
console.log('→ scripts/mockups/coletiva-passo.png')
