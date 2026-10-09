// ─── 🧊👑 MOCKUP · ENTRADA ÚNICA DO K9 FC: "O REI GELADO" ─────────────────────
//
// Pedido do Diego (09/10): *"como seria o K9 caindo de entrada de gala personalizada pra ele…
// lembrando que ele é lenda, gosta de coroa de Rei e tem apelido de gelado porque não tem medo de
// nada"*. É só o DESENHO pra ele aprovar (nada vai pro jogo). Mesmo formato do mockup do
// Neymarzetti (`mockup-entrada-helicoptero.mjs`): palco de celular 420×880, ~8 s.
//
// A cena: a sala CONGELA (geada sobe pelas bordas, neve cai) → um BLOCO DE GELO despenca do céu e
// crava no chão (tela treme) → o gelo racha e estoura → sai o Rei K9 (a arte DO DONO, sem inventar
// nada da cara dele) → uma COROA dourada desce girando e pousa em cima do escudo no telão → "👑 O REI
// GELADO CHEGOU" e o grito da torcida. Só desenho em CSS/SVG + as duas artes do batismo.
//
// uso: node scripts/mockup-entrada-k9.mjs [--saida pasta]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mockups/entrada-k9')
mkdirSync(SAIDA, { recursive: true })
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const ESC = `data:image/webp;base64,${b64('src/escalacao/img/k9-escudo.webp')}`
const MAS = `data:image/webp;base64,${b64('src/escalacao/img/k9-mascote.webp')}`
const T = 8400
const pct = ms => (ms / T * 100).toFixed(1) + '%'

// 👑 coroa em SVG (só do mockup)
const COROA = `<svg viewBox="0 0 120 80" width="120" height="80" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 70 L14 22 L38 46 L60 8 L82 46 L106 22 L112 70 Z" fill="#FFC400" stroke="#0C0C0C" stroke-width="4" stroke-linejoin="round"/>
  <rect x="8" y="64" width="104" height="12" rx="3" fill="#E8A200" stroke="#0C0C0C" stroke-width="4"/>
  <circle cx="60" cy="8" r="6" fill="#8fd3ff" stroke="#0C0C0C" stroke-width="3"/><circle cx="14" cy="22" r="5" fill="#8fd3ff" stroke="#0C0C0C" stroke-width="3"/><circle cx="106" cy="22" r="5" fill="#8fd3ff" stroke="#0C0C0C" stroke-width="3"/>
  <circle cx="38" cy="58" r="4" fill="#E8503A"/><circle cx="60" cy="58" r="4" fill="#8fd3ff"/><circle cx="82" cy="58" r="4" fill="#E8503A"/>
  <path d="M20 30 L24 52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
</svg>`
// 🧊 cacos de gelo que voam quando o bloco estoura
const CACOS = Array.from({ length: 14 }, (_, i) => {
  const ang = (i / 14) * Math.PI * 2, d = 150 + (i % 4) * 40
  return { dx: Math.round(Math.cos(ang) * d), dy: Math.round(Math.sin(ang) * d * 0.8) - 40, r: (i * 47) % 360, w: 14 + (i % 3) * 8 }
})
const NEVE = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 420, d: (i * 0.23) % 3, s: 3 + (i % 3) * 2, dur: 4 + (i % 5) * 0.7 }))

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#111}
.cel{position:relative;width:420px;height:880px;margin:0 auto;background:#F4ECD6;overflow:hidden;font-family:system-ui,sans-serif}
.fundo{padding:18px 16px}.fundo h1{font:700 30px Oswald;margin:10px 0}.fundo .l{height:52px;border:2px solid #0C0C0C;border-radius:12px;margin:8px 0;background:#F4ECD6}
.show{position:absolute;inset:0;opacity:0}
.on.show{animation:vis ${T}ms ease forwards}
@keyframes vis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.palco{position:absolute;inset:0}
.on .palco{animation:treme ${T}ms linear forwards}
@keyframes treme{0%,${pct(2550)}{transform:none}${pct(2600)}{transform:translate(-9px,5px)}${pct(2680)}{transform:translate(8px,-6px)}${pct(2760)}{transform:translate(-6px,3px)}${pct(2840)}{transform:translate(4px,-2px)}${pct(2950)}{transform:none}100%{transform:none}}
.escuro{position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 50% 55%,rgba(28,62,98,.9),rgba(2,8,18,.985) 75%)}
/* geada subindo pelas bordas */
.geada{position:absolute;inset:0;opacity:0;box-shadow:inset 0 0 0 0 rgba(200,235,255,.0);background:
 radial-gradient(ellipse 60% 18% at 50% 100%,rgba(210,240,255,.55),transparent 70%),
 radial-gradient(ellipse 18% 60% at 0% 50%,rgba(210,240,255,.45),transparent 70%),
 radial-gradient(ellipse 18% 60% at 100% 50%,rgba(210,240,255,.45),transparent 70%),
 radial-gradient(ellipse 60% 14% at 50% 0%,rgba(210,240,255,.4),transparent 70%)}
.on .geada{animation:geada ${T}ms ease forwards}
@keyframes geada{0%,4%{opacity:0}${pct(1400)}{opacity:1}90%{opacity:1}100%{opacity:0}}
.neve{position:absolute;top:-10px;border-radius:50%;background:#fff;opacity:.85}
.on .neve{animation-name:cai;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes cai{0%{transform:translate(0,-20px)}100%{transform:translate(-30px,900px)}}
.temp{position:absolute;left:0;right:0;top:120px;text-align:center;font:700 52px Oswald;color:#cfeeff;text-shadow:0 0 18px rgba(140,210,255,.9),3px 3px 0 #000;opacity:0}
.on .temp{animation:temp ${T}ms ease forwards}
@keyframes temp{0%,${pct(500)}{opacity:0;transform:scale(.6)}${pct(900)}{opacity:1;transform:scale(1.1)}${pct(1100)}{transform:scale(1)}${pct(1700)}{opacity:1}${pct(2000)}{opacity:0}100%{opacity:0}}
/* bloco de gelo despencando */
.bloco{position:absolute;left:105px;top:-320px;width:210px;height:280px;border-radius:18px;background:linear-gradient(150deg,rgba(220,245,255,.92),rgba(140,205,240,.75) 55%,rgba(90,170,220,.8));border:4px solid #0C0C0C;box-shadow:inset 10px 10px 0 rgba(255,255,255,.5),inset -8px -10px 0 rgba(60,140,200,.5),6px 6px 0 #000;overflow:hidden}
.bloco img{position:absolute;left:50%;bottom:6px;height:240px;transform:translateX(-50%);opacity:.35;filter:blur(1.5px) saturate(.4)}
.bloco .racha{position:absolute;inset:0;opacity:0}
.on .bloco{animation:bloco ${T}ms cubic-bezier(.55,0,.9,.6) forwards}
@keyframes bloco{0%,${pct(1900)}{top:-320px;transform:rotate(-6deg);opacity:1}${pct(2600)}{top:420px;transform:rotate(0)}${pct(2700)}{top:430px;transform:scale(1.04,.96)}${pct(2850)}{top:426px;transform:scale(1)}${pct(3550)}{top:426px;opacity:1;transform:scale(1)}${pct(3700)}{top:426px;opacity:0;transform:scale(1.15)}100%{top:426px;opacity:0}}
.on .bloco .racha{animation:racha ${T}ms linear forwards}
@keyframes racha{0%,${pct(2800)}{opacity:0}${pct(2950)}{opacity:.6}${pct(3300)}{opacity:1}100%{opacity:1}}
/* poeira de gelo no impacto */
.impacto{position:absolute;left:0;right:0;top:690px;height:60px;opacity:0;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(220,245,255,.8),transparent 70%)}
.on .impacto{animation:impacto ${T}ms ease forwards}
@keyframes impacto{0%,${pct(2580)}{opacity:0;transform:scaleX(.4)}${pct(2700)}{opacity:1;transform:scaleX(1.3)}${pct(3300)}{opacity:0;transform:scaleX(1.6)}100%{opacity:0}}
/* cacos voando quando estoura */
.caco{position:absolute;left:200px;top:560px;opacity:0;background:linear-gradient(150deg,#e6f7ff,#8fd0f2);border:2px solid #0C0C0C;clip-path:polygon(50% 0,100% 60%,40% 100%,0 40%)}
.on .caco{animation:caco ${T}ms cubic-bezier(.2,.7,.4,1) forwards}
@keyframes caco{0%,${pct(3550)}{opacity:0;transform:translate(0,0) rotate(0)}${pct(3620)}{opacity:1}${pct(4500)}{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
.clarao{position:absolute;inset:0;background:#dff4ff;opacity:0}
.on .clarao{animation:clarao ${T}ms ease forwards}
@keyframes clarao{0%,${pct(3550)}{opacity:0}${pct(3620)}{opacity:.85}${pct(4000)}{opacity:0}100%{opacity:0}}
/* o Rei K9 (arte do dono) */
.masc{position:absolute;left:50%;top:446px;width:186px;height:250px;opacity:0;transform:translateX(-50%);filter:drop-shadow(0 0 16px rgba(140,210,255,.8)) drop-shadow(4px 6px 0 rgba(0,0,0,.5))}
.on .masc{animation:masc ${T}ms ease forwards}
@keyframes masc{0%,${pct(3560)}{opacity:0;transform:translateX(-50%) scale(.85)}${pct(3700)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(3900)}{transform:translateX(-50%) scale(1)}${pct(8100)}{opacity:1}100%{opacity:0;transform:translateX(-50%) scale(1)}}
/* 🥶 as MÃOS do abraço esfregando os braços de frio (Diego 09/10: "as mãos pra cima e baixo se alisando,
   sem perder o abraço"). A arte é uma só; aqui dois pedacinhos dela (cada mão) são copiados por cima e
   deslizam pra cima e pra baixo, cada um num sentido, com a borda esfumada pra não aparecer o recorte. */
.masc img{display:block;height:250px;width:186px}
.mao{position:absolute;background-image:url(${MAS});background-size:186px 250px;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%)}
.mao.e{left:63px;top:66px;width:21px;height:23px;background-position:-63px -66px}
.mao.d{left:105px;top:66px;width:21px;height:21px;background-position:-105px -66px}
.on .mao.e{animation:esfrega .34s ease-in-out infinite alternate}
.on .mao.d{animation:esfrega .34s ease-in-out infinite alternate-reverse}
@keyframes esfrega{from{transform:translateY(-4px)}to{transform:translateY(4px)}}
/* e um tremidinho de frio no corpo todo, bem leve */
.on .masc .treme{animation:tremido .09s linear infinite}
@keyframes tremido{0%{transform:translateX(0)}25%{transform:translateX(.8px)}75%{transform:translateX(-.8px)}100%{transform:translateX(0)}}
/* telão com o escudo */
.telao{position:absolute;left:50%;top:118px;width:380px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3)}
.on .telao{animation:telao ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes telao{0%,${pct(4300)}{opacity:0;transform:translateX(-50%) scale(.3)}${pct(4900)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(5200)}{transform:translateX(-50%) scale(1)}${pct(7900)}{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.telao img{height:170px;filter:drop-shadow(0 0 22px rgba(140,210,255,.9)) drop-shadow(4px 5px 0 #000)}
.chega{font:700 15px Oswald;letter-spacing:3px;color:#9fe0ff;margin:4px 0 0;text-shadow:2px 2px 0 #000}
.nome{font:700 40px/1 Oswald;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
/* a coroa desce girando e pousa no escudo */
.coroa{position:absolute;left:150px;top:-120px;opacity:0;filter:drop-shadow(0 0 14px rgba(255,196,0,.9)) drop-shadow(3px 4px 0 #000)}
.on .coroa{animation:coroa ${T}ms cubic-bezier(.3,.8,.4,1) forwards}
@keyframes coroa{0%,${pct(4900)}{opacity:0;top:-120px;transform:rotateY(0) rotate(-20deg)}${pct(5000)}{opacity:1}${pct(5800)}{top:30px;transform:rotateY(720deg) rotate(0)}${pct(5950)}{top:38px;transform:rotateY(720deg) scale(1.1,.9)}${pct(6100)}{top:34px;transform:rotateY(720deg) scale(1)}${pct(7900)}{opacity:1;top:34px}100%{opacity:0;top:34px;transform:rotateY(720deg)}}
.brilho{position:absolute;left:210px;top:72px;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 18px 9px #FFC400;opacity:0}
.on .brilho{animation:brilho ${T}ms ease forwards}
@keyframes brilho{0%,${pct(5900)}{opacity:0;transform:scale(.4)}${pct(6000)}{opacity:1;transform:scale(2.4)}${pct(6400)}{opacity:0;transform:scale(3)}100%{opacity:0}}
.grito{position:absolute;left:0;right:0;top:392px;text-align:center;font:700 26px Oswald;color:#FFC400;text-shadow:2px 2px 0 #000;opacity:0}
.on .grito{animation:grito ${T}ms ease forwards}
@keyframes grito{0%,${pct(6000)}{opacity:0;transform:scale(.6)}${pct(6300)}{opacity:1;transform:scale(1.15)}${pct(6500)}{transform:scale(1)}${pct(7800)}{opacity:1}${pct(8100)}{opacity:0}}
</style></head><body><div class="cel">
  <div class="fundo"><h1>ESPERANDO A GALERA</h1>${'<div class="l"></div>'.repeat(6)}</div>
  <div class="show" id="show"><div class="palco">
    <div class="escuro"></div><div class="geada"></div>
    ${NEVE.map(n => `<span class="neve" style="left:${n.x}px;width:${n.s}px;height:${n.s}px;animation-duration:${n.dur}s;animation-delay:-${n.d}s"></span>`).join('')}
    <p class="temp">❄️ -40°</p>
    <div class="telao"><img src="${ESC}"><p class="chega">👑 O REI GELADO CHEGOU</p><p class="nome">K9 FC</p></div>
    <div class="coroa">${COROA}</div><span class="brilho"></span>
    <p class="grito">🔊 Ô Ô Ô, K9! 🔊</p>
    <div class="impacto"></div>
    <div class="masc"><div class="treme" style="position:relative"><img src="${MAS}"><span class="mao e"></span><span class="mao d"></span></div></div>
    <div class="bloco"><img src="${MAS}"><svg class="racha" viewBox="0 0 210 280" width="210" height="280"><path d="M105 0 L95 60 L120 100 L88 150 L112 200 L96 280 M95 60 L40 90 M120 100 L180 120 M88 150 L30 190 M112 200 L170 240" stroke="#fff" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M105 0 L95 60 L120 100 L88 150 L112 200 L96 280" stroke="#0C0C0C" stroke-width="1.5" fill="none"/></svg></div>
    ${CACOS.map(c => `<span class="caco" style="width:${c.w}px;height:${c.w + 6}px;--dx:${c.dx}px;--dy:${c.dy}px;--r:${c.r}deg"></span>`).join('')}
    <div class="clarao"></div>
  </div></div>
</div>
<script>window.entra=()=>{const s=document.getElementById('show');s.classList.remove('on');void s.offsetWidth;s.classList.add('on')}</script>
</body></html>`

const tmp = path.resolve(SAIDA, 'entrada-k9.html')
writeFileSync(tmp, html)
for (const f of readdirSync(SAIDA)) if (f.endsWith('.webm')) rmSync(path.join(SAIDA, f))
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, ms] of [['1-sala-congela', 1000], ['2-bloco-crava', 3000], ['3-gelo-estoura', 3720], ['4-coroa-desce', 5400], ['5-rei-gelado', 6800]]) {
  const p = await br.newPage({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2 })
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => window.entra()); await p.waitForTimeout(ms)
  await p.screenshot({ path: path.join(SAIDA, nome + '.png') }); await p.close()
  console.log('   📸', nome)
}
const ctx = await br.newContext({ viewport: { width: 420, height: 880 }, recordVideo: { dir: SAIDA, size: { width: 420, height: 880 } } })
const v = await ctx.newPage()
await v.goto('file://' + tmp); await v.evaluate(() => document.fonts.ready); await v.waitForTimeout(900)
await v.evaluate(() => window.entra()); await v.waitForTimeout(T + 800)
await ctx.close(); await br.close()
console.log('✅', SAIDA)
