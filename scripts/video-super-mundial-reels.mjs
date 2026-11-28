// ─── 🎬 REELS 1080×1920: 🌍 SUPER MUNDIAL — LANÇAMENTO (28/11) ─────────────────────────────────────────────────────
// Pedido do Diego (28/11): *"faça um vídeo… eu lançando o Super Mundial, tanto convocando e sem ser convocando"*.
// Mesmo molde do `video-bafo-reels.mjs`. Telas = as do story (scripts/mockups/super-mundial/story-*.png, jogo de verdade),
// troféu e escudos reais do jogo. ⛔ Postar só quando o Super Mundial for liberado pra todos (`SUPER_MUNDIAL_GERAL`).
//   node scripts/video-super-mundial-reels.mjs [--saida scripts/posts/super-mundial-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/super-mundial-reels.mp4')
const img = f => `data:image/${f.endsWith('.webp') ? 'webp' : 'png'};base64,${readFileSync(f).toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 #000;padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = atraso => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both`
const sobe = atraso => `animation:sobe .45s ${atraso}s both`
const pop = atraso => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both`
const caixa = (html, atraso, extra = '') => `<div style="width:940px;background:${CREME};color:${INK};border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 #000;overflow:hidden;text-align:left;${pop(atraso)};${extra}">${html}</div>`
const linha = (html, atraso, topo = true) => `<div style="padding:${topo ? 26 : 0}px 28px 26px;font-size:38px;font-weight:800;line-height:1.3;${entra(atraso)}">${html}</div>`

const SM = 'scripts/mockups/super-mundial/'
const TROF = img(SM + 'trofeu-grande.png')
const ESC = ['chelsea','real-madrid','flamengo','palmeiras','psg','al-hilal','inter-miami','boca-juniors','bayern','juventus','fluminense','botafogo','monterrey','urawa-reds','wydad','benfica'].map(n => img(`public/escudos-clubes/${n}.webp`))
const tela = (f, w, atraso, extra = '') => `<img src="${img(SM + f)}" style="width:${w}px;border-radius:28px;border:6px solid ${INK};box-shadow:12px 12px 0 #000;${pop(atraso)};${extra}">`
const cab = (txt, bg, atraso) => `<div style="${pop(atraso)}">${pill(txt, bg, '#fff', 42)}</div>`
const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:radial-gradient(ellipse at 50% 34%,#5a4300 0%,#2a1f00 42%,#0b0800 84%);font-family:system-ui;overflow:hidden;position:relative;color:#fff}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes treme{0%,100%{transform:rotate(-4deg)}25%{transform:rotate(5deg) translateX(8px)}50%{transform:rotate(-6deg) translateX(-8px)}75%{transform:rotate(4deg)}}
@keyframes rasga{0%{transform:scale(1);opacity:1}60%{transform:scale(1.25) rotate(8deg);opacity:1}100%{transform:scale(1.7) rotate(14deg);opacity:0}}
@keyframes abre{0%{transform:rotate(0) scale(.6);opacity:0}100%{transform:rotate(var(--r)) scale(1);opacity:1}}
@keyframes vira{0%{transform:rotateY(90deg) scale(.7);opacity:0}100%{transform:rotateY(0) scale(1);opacity:1}}
@keyframes brilho{0%,100%{filter:drop-shadow(0 0 30px rgba(255,196,0,.55))}50%{filter:drop-shadow(0 0 90px rgba(255,220,90,1))}}
@keyframes carimba{0%{transform:rotate(-10deg) scale(3.2);opacity:0}100%{transform:rotate(-10deg) scale(1);opacity:1}}
@keyframes voa{0%{transform:translateX(0) rotate(0)}100%{transform:translateX(330px) rotate(9deg)}}
@keyframes chove{0%{transform:translateY(-260px) rotate(-20deg);opacity:0}100%{transform:translateY(0) rotate(0);opacity:1}}
@keyframes gira{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
</style><body>
<!-- ① chegou o Super Mundial -->
${cena(0, 4.6, `
  <img src="${TROF}" style="width:360px;${pop(.1)};animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, brilho 1.6s ease-in-out .8s infinite">
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(255,255,255,.7);margin:40px 0 4px;${sobe(.5)}">chegou o</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;line-height:.9;color:#fff;text-shadow:10px 10px 0 #000;${pop(.8)}">super</p>
  <p style="${OSW};font-size:190px;text-transform:uppercase;line-height:.9;color:${GOLD};text-shadow:10px 10px 0 #000;${pop(1.05)}">mundial</p>
  <div style="margin-top:40px;${pop(1.7)}">${pill('🌍 novo nas salas online', GOLD, INK, 40)}</div>`)}

<!-- ② os clubes de verdade -->
${cena(4.6, 9.0, `
  <p style="${OSW};font-size:70px;text-transform:uppercase;line-height:1.05;${sobe(4.7)}">o <span style="color:${GOLD}">Mundial de Clubes 2025</span><br>no formato real</p>
  <div style="display:grid;grid-template-columns:repeat(4,190px);gap:34px;margin-top:70px">
    ${ESC.map((e, i) => `<img src="${e}" style="width:190px;height:190px;object-fit:contain;filter:drop-shadow(6px 6px 0 #000);animation:chove .5s cubic-bezier(.2,1.4,.4,1) ${(5.0 + i * 0.12).toFixed(2)}s both">`).join('')}
  </div>
  <p style="${OSW};font-size:52px;text-transform:uppercase;margin-top:70px;${sobe(7.2)}">Real · Chelsea · Flamengo · PSG…</p>`)}

<!-- ③ CONVOCANDO -->
${cena(9.0, 16.2, `
  ${cab('📋 jeito 1 · convocando', GREEN, 9.1)}
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1;margin:30px 0 24px;${sobe(9.3)}">liga + <span style="color:${GOLD}">super mundial</span></p>
  ${tela('story-grade.png', 620, 9.7)}
  <p style="font-size:42px;font-weight:800;line-height:1.25;margin-top:34px;${sobe(11.2)}">acabou a liga? <span style="color:${GOLD}">escolhe um clube</span> do Mundial</p>
  <p style="font-size:42px;font-weight:800;line-height:1.25;margin-top:10px;${sobe(12.6)}">e convoca as <span style="color:${GOLD}">cartas dele</span> 🃏</p>`)}

<!-- ④ COM O SEU TIME -->
${cena(16.2, 23.2, `
  ${cab('⚽ jeito 2 · com o seu time', RED, 16.3)}
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1;margin:30px 0 24px;${sobe(16.5)}">só <span style="color:${GOLD}">super mundial</span></p>
  ${tela('story-grupos.png', 620, 16.9)}
  <p style="font-size:42px;font-weight:800;line-height:1.25;margin-top:34px;${sobe(18.4)}">sem liga: <span style="color:${GOLD}">o seu time do leilão</span></p>
  <p style="font-size:42px;font-weight:800;line-height:1.25;margin-top:10px;${sobe(19.8)}">encara Real, Chelsea, Flamengo… 🔥</p>`)}

<!-- ⑤ formato -->
${cena(23.2, 27.6, `
  <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1.05;${sobe(23.3)}">formato de <span style="color:${GOLD}">verdade</span></p>
  ${caixa(`
    ${linha('🌍 <b>32 clubes</b>', 23.7)}
    ${linha('🗂️ <b>8 grupos</b> de 4, turno único', 24.2, false)}
    ${linha('⚔️ <b>oitavas</b> na chave de 2025', 24.7, false)}
    ${linha('🏆 tudo em <b>jogo único</b> até a final', 25.2, false)}`, 23.6, 'margin-top:50px')}`)}

<!-- ⑥ CTA -->
${cena(27.6, 60, `
  <img src="${TROF}" style="width:260px;${pop(27.7)}">
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.08;margin-top:36px;${sobe(27.9)}">quem vai ser o<br><span style="color:${GOLD}">campeão do mundo</span>?</p>
  <div style="margin-top:40px;${pop(28.4)}">${pill('🌐 Salas online → 🌍 Super Mundial', GOLD, INK, 42)}</div>
  <p style="${OSW};font-size:62px;margin-top:70px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 29.2s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(255,255,255,.7);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-super-mundial-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-super-mundial-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(33000)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log('🎬', SAIDA)
