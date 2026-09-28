// ─── 🚁 MOCKUP · ENTRADA INDIVIDUAL DO NEYMARZETTI (descendo de helicóptero) ──
//
// Ideia do Diego (28/09), depois da Entrada de Gala: *"entradas individuais, cada
// um com a sua… tipo Neymarzetti, que a mascote é jogador"* → escolheu
// *"descendo de helicóptero"*. É só o DESENHO pra ele aprovar (nada vai pro jogo).
// Artes reais do batismo (escudo + mascote); o helicóptero é desenho do mockup.
//
// uso: node scripts/mockup-entrada-helicoptero.mjs [--saida pasta]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mockups/entrada-helicoptero')
mkdirSync(SAIDA, { recursive: true })
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const ESC = `data:image/webp;base64,${b64('src/escalacao/img/neymarzetti-escudo.webp')}`
const MAS = `data:image/webp;base64,${b64('src/escalacao/img/neymarzetti-mascote.webp')}`
const T = 8200 // duração total do show (ms)

// 🚁 helicóptero em SVG (só do mockup): preto e dourado, com o NZ na cauda
const HELI = `<svg viewBox="0 0 300 140" width="300" height="140" xmlns="http://www.w3.org/2000/svg">
  <!-- nariz pra ESQUERDA (ele entra pela direita e segue pra esquerda) -->
  <g class="rotor"><rect x="10" y="6" width="220" height="8" rx="4" fill="#1d1d1d"/></g>
  <rect x="114" y="12" width="12" height="18" rx="3" fill="#0C0C0C"/>
  <!-- cauda afinando, com a aleta e o rotor de trás -->
  <path d="M170 58 L285 50 L288 62 L175 80 Z" fill="#0C0C0C" stroke="#FFC400" stroke-width="3" stroke-linejoin="round"/>
  <path d="M270 50 L292 22 L298 26 L286 58 Z" fill="#0C0C0C" stroke="#FFC400" stroke-width="3" stroke-linejoin="round"/>
  <g class="rotor-cauda"><rect x="289" y="10" width="7" height="44" rx="3" fill="#1d1d1d"/></g>
  <!-- corpo gordinho -->
  <path d="M40 72 C40 44 70 28 110 28 L150 28 C178 28 190 46 190 66 L190 82 C190 98 176 108 158 108 L78 108 C54 108 40 94 40 72 Z" fill="#0C0C0C" stroke="#FFC400" stroke-width="4"/>
  <!-- bolha da cabine na frente -->
  <path d="M44 74 C44 50 62 36 90 34 L100 34 L100 84 L48 84 C45 81 44 78 44 74 Z" fill="#8fd3ff" stroke="#0C0C0C" stroke-width="3"/>
  <path d="M58 48 C64 42 72 39 82 38" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>
  <text x="112" y="80" font-family="Oswald" font-weight="700" font-size="26" fill="#FFC400">NZ</text>
  <!-- esqui -->
  <rect x="70" y="106" width="8" height="16" fill="#0C0C0C"/><rect x="150" y="106" width="8" height="16" fill="#0C0C0C"/>
  <path d="M46 124 L176 124 C182 124 184 118 184 116" stroke="#0C0C0C" stroke-width="7" stroke-linecap="round" fill="none"/>
</svg>`

const pct = ms => (ms / T * 100).toFixed(1) + '%'
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#111}
.cel{position:relative;width:420px;height:880px;margin:0 auto;background:#F4ECD6;overflow:hidden;font-family:system-ui,sans-serif}
.fundo{padding:18px 16px}.fundo h1{font:700 30px Oswald;margin:10px 0}.fundo .l{height:52px;border:2px solid #0C0C0C;border-radius:12px;margin:8px 0;background:#F4ECD6}
.show{position:absolute;inset:0;opacity:0}
.on.show{animation:vis ${T}ms ease forwards}
@keyframes vis{0%{opacity:0}4%{opacity:1}93%{opacity:1}100%{opacity:0}}
.escuro{position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 55%,rgba(30,40,70,.55),rgba(0,0,0,.95) 75%)}
/* holofote de busca varrendo o céu */
.busca{position:absolute;left:50%;bottom:0;width:120px;height:900px;transform-origin:50% 100%;background:linear-gradient(0deg,rgba(255,240,190,.0),rgba(255,240,190,.28));clip-path:polygon(40% 100%,60% 100%,100% 0,0 0);opacity:0}
.on .busca{animation:busca ${T}ms ease-in-out forwards}
@keyframes busca{0%{opacity:0;transform:translateX(-50%) rotate(-35deg)}8%{opacity:1}22%{transform:translateX(-50%) rotate(25deg)}34%{transform:translateX(-50%) rotate(0deg)}80%{opacity:1;transform:translateX(-50%) rotate(0)}90%{opacity:0}}
/* helicóptero: chega da direita, paira, sobe e vai embora */
.heli{position:absolute;top:60px;left:460px}
.on .heli{animation:heli ${T}ms cubic-bezier(.4,0,.3,1) forwards}
@keyframes heli{0%{left:460px;top:40px;transform:rotate(-8deg)}
 ${pct(1800)}{left:80px;top:90px;transform:rotate(4deg)}
 ${pct(2300)}{left:80px;top:100px;transform:rotate(0)}
 ${pct(3000)}{top:94px}${pct(3700)}{top:102px}${pct(4400)}{top:96px}
 ${pct(5200)}{left:80px;top:98px;transform:rotate(0)}
 ${pct(6600)}{left:-320px;top:-40px;transform:rotate(-12deg)}100%{left:-320px;top:-40px}}
.rotor{transform-origin:120px 10px;animation:gira .12s linear infinite}
@keyframes gira{0%{transform:scaleX(1)}50%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
.rotor-cauda{transform-origin:292px 32px;animation:gira2 .1s linear infinite}
@keyframes gira2{0%{transform:scaleY(1)}50%{transform:scaleY(.2)}100%{transform:scaleY(1)}}
/* vento: poeira no chão enquanto ele paira */
.vento{position:absolute;left:0;right:0;bottom:120px;height:40px;opacity:0;background:radial-gradient(ellipse 45% 50% at 50% 50%,rgba(255,255,255,.35),transparent 70%)}
.on .vento{animation:vento ${T}ms ease forwards}
@keyframes vento{0%,${pct(2200)}{opacity:0}${pct(2600)}{opacity:1}${pct(5200)}{opacity:1}${pct(5800)}{opacity:0}}
/* corda */
.corda{position:absolute;left:192px;top:210px;width:4px;height:0;background:#0C0C0C;border-left:1px solid #FFC400}
.on .corda{animation:corda ${T}ms ease forwards}
@keyframes corda{0%,${pct(2400)}{height:0;top:210px}${pct(2900)}{height:300px;top:210px}${pct(4300)}{height:300px;top:210px}${pct(5000)}{height:0;top:210px}100%{height:0}}
/* mascote: desce pela corda, pousa, acena */
.masc{position:absolute;left:118px;top:120px;height:230px;opacity:0;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.5))}
.on .masc{animation:masc ${T}ms ease-in-out forwards}
@keyframes masc{0%,${pct(2800)}{opacity:0;top:140px}
 ${pct(2900)}{opacity:1;top:150px;transform:rotate(-4deg)}
 ${pct(4100)}{top:470px;transform:rotate(3deg)}
 ${pct(4300)}{top:490px;transform:scale(1.06,.94)}
 ${pct(4500)}{top:486px;transform:scale(1)}
 ${pct(5300)}{transform:rotate(-5deg)}${pct(5700)}{transform:rotate(5deg)}${pct(6100)}{transform:rotate(0)}
 ${pct(8000)}{opacity:1;top:486px}100%{opacity:0;top:486px}}
/* telão */
.telao{position:absolute;left:50%;top:40px;width:380px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3)}
.on .telao{animation:telao ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes telao{0%,${pct(4400)}{opacity:0;transform:translateX(-50%) scale(.3)}${pct(5000)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(5300)}{transform:translateX(-50%) scale(1)}${pct(7700)}{opacity:1}100%{opacity:0}}
.telao img{height:170px;filter:drop-shadow(0 0 22px rgba(255,196,0,.8)) drop-shadow(4px 5px 0 #000)}
.chega{font:700 15px Oswald;letter-spacing:3px;color:#FFC400;margin:4px 0 0}
.nome{font:700 40px/1 Oswald;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
.grito{position:absolute;left:0;right:0;top:405px;text-align:center;font:700 26px Oswald;color:#FFC400;text-shadow:2px 2px 0 #000;opacity:0}
.on .grito{animation:grito ${T}ms ease forwards}
@keyframes grito{0%,${pct(4600)}{opacity:0;transform:scale(.6)}${pct(5000)}{opacity:1;transform:scale(1.15)}${pct(5300)}{transform:scale(1)}${pct(7500)}{opacity:1}${pct(7900)}{opacity:0}}
.flash{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 14px 7px #fff;opacity:0}
.on .flash{animation:flash ${T}ms linear forwards}
@keyframes flash{0%,${pct(4400)}{opacity:0}${pct(4450)}{opacity:1}${pct(4550)}{opacity:0}${pct(5500)}{opacity:0}${pct(5550)}{opacity:1}${pct(5650)}{opacity:0}${pct(6400)}{opacity:0}${pct(6450)}{opacity:1}${pct(6550)}{opacity:0}}
</style></head><body><div class="cel">
  <div class="fundo"><h1>ESPERANDO A GALERA</h1>${'<div class="l"></div>'.repeat(6)}</div>
  <div class="show" id="show">
    <div class="escuro"></div><div class="busca"></div>
    <span class="flash" style="left:50px;top:300px"></span><span class="flash" style="left:360px;top:260px"></span><span class="flash" style="left:320px;top:640px"></span>
    <div class="telao"><img src="${ESC}"><p class="chega">🚁 CHEGOU NA SALA</p><p class="nome">Neymarzetti FC</p></div>
    <p class="grito">🔊 Ô Ô Ô, NEYMARZETTI! 🔊</p>
    <div class="vento"></div>
    <div class="corda"></div>
    <img class="masc" src="${MAS}">
    <div class="heli">${HELI}</div>
  </div>
</div>
<script>window.entra=()=>{const s=document.getElementById('show');s.classList.remove('on');void s.offsetWidth;s.classList.add('on')}</script>
</body></html>`

const tmp = path.resolve(SAIDA, 'entrada-helicoptero.html')
writeFileSync(tmp, html)
for (const f of readdirSync(SAIDA)) if (f.endsWith('.webm')) rmSync(path.join(SAIDA, f))
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, ms] of [['1-helicoptero-chegando', 1300], ['2-descendo-na-corda', 3600], ['3-pousou-telao', 5600]]) {
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
const webm = readdirSync(SAIDA).find(f => f.endsWith('.webm'))
if (webm) execSync(`ffmpeg -y -loglevel error -i "${path.join(SAIDA, webm)}" -ss 0.6 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${path.join(SAIDA, 'entrada-helicoptero.mp4')}"`)
console.log('✅', SAIDA)
