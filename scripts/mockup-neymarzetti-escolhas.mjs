// 🖼️ MOCKUP — a ESCOLHA que sobrou na arte nova do Neymarzetti (16/09).
// A prancha do Diego traz o morcego-N COM o letreiro "NEYMARZETTI" embaixo. No jogo o
// escudo é desenhado a 78px e o nome do clube já aparece escrito do lado dele — então
// o letreiro dentro do escudo duplica o nome e encolhe o morcego pela metade.
// Este mockup mostra os dois no TAMANHO REAL pra ele decidir. Ele decide o visual.
// Rodar: node scripts/mockup-neymarzetti-escolhas.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = p => `data:image/webp;base64,${readFileSync(p).toString('base64')}`
const MORCEGO = b64('/tmp/ney/op-morcego.webp'), COMPLETO = b64('/tmp/ney/op-completo.webp')
const INK='#0C0C0C', GOLD='#FFC400', CREME='#F4ECD6', VERDE='#1B7A3D', VERM='#C2452F'
const BRANCO='#F0EFEF', PRETO='#080908'
const listra = (c1,c2) => `repeating-linear-gradient(90deg,${c1} 0 14px,${c2} 14px 28px)`
const esc = (src,w,h,alt) => `<img src="${src}" height="${alt}" width="${Math.round(alt*w/h)}" style="display:block">`
const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}
body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1180px;padding:26px}
h1{font-family:Oswald;font-size:30px;margin:0 0 4px;text-transform:uppercase}
p.sub{font-size:16px;color:#4a4636;margin:0 0 18px;line-height:1.5}
h2{font:900 17px Oswald;margin:0 0 10px;text-transform:uppercase}
.card{background:#fff;border:4px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px}
.par{display:flex;gap:16px}
.op{flex:1;border:3px solid ${INK};border-radius:12px;overflow:hidden}
.oh{font:900 13px Oswald;text-transform:uppercase;padding:7px 11px;color:#fff}
.ob{background:${CREME};padding:14px;text-align:center}
.linha{display:flex;align-items:center;gap:10px;justify-content:center;background:#fff;border:2px solid ${INK};border-radius:10px;padding:8px 10px;margin-top:10px}
.linha b{font:900 14px Oswald}
.cap{font:900 9px Oswald;letter-spacing:1px;color:#8a8266;text-transform:uppercase;margin:12px 0 5px;display:block}
.nota{font-size:12.5px;font-weight:700;color:#4a4636;line-height:1.45;padding:10px 12px;background:#FBF6E8}
.manto{height:74px;border:3px solid ${INK};border-radius:11px}
.nota2{margin-top:6px;background:#FFF4E2;border:4px solid #B8722A;border-radius:14px;padding:15px 18px;font-size:15px;line-height:1.55;color:#3A2C18}
</style>
<h1>🦇 Arte nova do Neymarzetti — duas escolhas suas</h1>
<p class="sub">A arte foi recortada e está pronta. Antes de publicar, duas coisas que eu não decido pela sua cara: <b>qual escudo entra no jogo</b> e <b>em que ordem ficam as cores do manto</b>.</p>

<div class="card">
  <h2>1 · Qual escudo vai pro jogo?</h2>
  <div class="par">
    <div class="op"><div class="oh" style="background:${VERDE}">A · só o morcego (recomendo)</div><div class="ob">
      ${esc(MORCEGO,360,245,160)}
      <span class="cap">no tamanho REAL do jogo (78px)</span>
      <div class="linha">${esc(MORCEGO,360,245,78)}<b>Neymarzetti</b></div>
      <div class="nota">O jogo já escreve o nome do clube do lado do escudo em todo lugar. Com o letreiro dentro, o nome aparece <b>duas vezes</b> e o morcego encolhe. É também o formato do escudo de hoje (deitado).</div>
    </div></div>
    <div class="op"><div class="oh" style="background:#7C3AED">B · morcego + letreiro</div><div class="ob">
      ${esc(COMPLETO,348,360,160)}
      <span class="cap">no tamanho REAL do jogo (78px)</span>
      <div class="linha">${esc(COMPLETO,348,360,78)}<b>Neymarzetti</b></div>
      <div class="nota">Fiel à prancha que você mandou. Mas a 78px o <b>NEYMARZETTI</b> vira um borrão e o morcego fica quase metade do tamanho.</div>
    </div></div>
  </div>
</div>

<div class="card">
  <h2>2 · O manto muda junto (já decidido, mas é fácil de trocar)</h2>
  <p style="font-size:14px;line-height:1.5;margin:0">A camisa nova é <b>branca com detalhe preto</b> — medido na arte: branco <b>83,6%</b>, preto <b>10,3%</b>. Hoje o seu manto está <b>preto + prata</b>, das listras de 24/08, então ele muda de qualquer jeito.<br>
  Vai entrar como <b>preto #080908 + branco #F0EFEF</b>, nessa ordem — o preto primeiro porque listra clara em cima da tela creme do jogo some, e é a mesma ordem que o Tricolor do Arruda e o Briga de Galo usam pelo mesmo motivo. Se você quiser o branco na frente, é uma linha.</p>
</div>
<div class="nota2"><b>Me responde só com a letra do escudo</b> (A ou B) que eu publico. <b>Dá pra voltar atrás?</b> Sim — é trocar o arquivo e duas cores; nada de save, nada de banco.<br>
<b>Peso:</b> escudo só-morcego 17,5 KB · escudo completo 29,5 KB · mascote 42,4 KB. Qualquer combinação cabe no teto de 75 KB.</div>`
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport:{width:1180,height:900}, deviceScaleFactor:2 })
await p.setContent(html,{waitUntil:'networkidle'})
await p.screenshot({ path:'scripts/mockups/neymarzetti-escolhas.png', fullPage:true })
await b.close(); console.log('ok')
