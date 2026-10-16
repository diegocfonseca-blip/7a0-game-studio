// ─── 🎬 REELS 1080×1920: CRIE O SEU PRESIDENTE (16/10) ───────────────────────
// Mesmo molde creme animado em CSS dos reels do repo (`video-base-reels.mjs`) — NÃO é gravação do jogo.
// Os bonecos são as artes REAIS do editor (scripts/mockups/presidente-bonecos/, montados com base + cabelo).
//
// 🎞️ Roteiro (~23 s):
//   0,0–3,6   CRIE O SEU PRESIDENTE · o presidente é você
//   3,6–8,4   monte do seu jeito: pele, cabelo de lenda, barba, roupa (3 bustos entrando)
//   8,4–13,4  ele aparece no jogo: sala, chat, martelo, O MARTELO, Central, perfil
//   13,4–18,6 a escada dos planos (Craque básicas · Lenda especiais · Batismo gala · Fundador astronauta)
//   18,6–23,0 🛒 Loja do Clube › Meu presidente · marca
//
//   node scripts/video-presidente-reels.mjs [--saida scripts/posts/presidente-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/presidente-reels.mp4')
const b64f = f => readFileSync(f).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64f(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = n => `data:image/png;base64,${b64f(`scripts/mockups/presidente-bonecos/${n}.png`)}`
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const busto = (n, rot, atraso) => `<div style="text-align:center;animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
  <img src="${img(n + '-busto')}" style="width:300px;height:300px;object-fit:cover;object-position:top;border-radius:50%;border:7px solid ${INK};background:${GOLD};box-shadow:7px 7px 0 ${INK}">
  <div style="${OSW};font-size:34px;text-transform:uppercase;margin-top:14px">${rot}</div></div>`
const lugar = (ic, txt, atraso) => `<div style="display:flex;align-items:center;gap:22px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:18px 28px;width:860px;
  animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both"><span style="font-size:58px">${ic}</span><span style="${OSW};font-size:46px;text-transform:uppercase">${txt}</span></div>`
const degrau = (ic, plano, txt, bg, cor, atraso) => `<div style="display:flex;align-items:center;gap:18px;background:${bg};color:${cor};border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:16px 26px;width:900px;
  animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both"><span style="font-size:52px">${ic}</span><div><div style="${OSW};font-size:44px;text-transform:uppercase;line-height:1">${plano}</div><div style="font-size:28px;font-weight:800;margin-top:4px">${txt}</div></div></div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
</style><body>

<!-- ① abertura -->
${cena(0, 3.6, `
  <img src="${img('pirlo-corpo')}" style="height:820px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">
  <p style="${OSW};font-size:122px;text-transform:uppercase;text-align:center;line-height:.98;margin-top:30px;animation:sobe .5s .5s both">
    crie o seu<br><span style="color:${RED}">presidente</span></p>
  <div style="margin-top:34px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.3s both">${pill('o presidente é você', '#fff', INK, 38)}</div>`)}

<!-- ② monte do seu jeito -->
${cena(3.6, 8.4, `
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1.05;margin-bottom:46px;animation:sobe .45s 3.75s both">monte do<br><span style="color:${GREEN}">seu jeito</span></p>
  <div style="display:flex;gap:30px;flex-wrap:wrap;justify-content:center">
    ${busto('pirlo', 'cabelo do Pirlo', 4.3)}${busto('r10', 'do Ronaldinho', 4.9)}${busto('astro', 'barba e astronauta', 5.5)}
  </div>
  <p style="font-size:44px;font-weight:800;color:rgba(12,12,12,.65);margin-top:46px;text-align:center;line-height:1.3;animation:sobe .45s 6.3s both">pele · cabelo de lenda · barba · roupa</p>`)}

<!-- ③ onde aparece -->
${cena(8.4, 13.4, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1.05;margin-bottom:40px;animation:sobe .45s 8.55s both">ele aparece<br><span style="color:${RED}">no jogo todo</span></p>
  <div style="display:flex;flex-direction:column;gap:18px">
    ${lugar('👥', 'na lista da sala', 9.0)}${lugar('💬', 'no chat', 9.4)}${lugar('🔨', 'no martelo do leilão', 9.8)}${lugar('📰', 'na capa do O MARTELO', 10.2)}${lugar('📺', 'na Central Legends', 10.6)}${lugar('🙋', 'no seu perfil', 11.0)}
  </div>`)}

<!-- ④ planos -->
${cena(13.4, 18.6, `
  <p style="${OSW};font-size:78px;text-transform:uppercase;text-align:center;line-height:1.05;margin-bottom:38px;animation:sobe .45s 13.55s both">cada plano<br>libera <span style="color:${GREEN}">mais roupa</span></p>
  <div style="display:flex;flex-direction:column;gap:18px">
    ${degrau('⭐', 'Craque', 'cria o presidente + roupas básicas', 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', INK, 14.0)}
    ${degrau('👑', 'Lenda', 'smoking, couro, motoqueiro…', 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200)', INK, 14.5)}
    ${degrau('🖋', 'Batismo', 'as roupas de gala', INK, GOLD, 15.0)}
    ${degrau('🖋', 'Fundador', 'astronauta e gala dourada 🚀', 'linear-gradient(135deg,#14251a,#1B7A3D)', '#fff', 15.5)}
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;text-align:center;line-height:1.3;animation:sobe .45s 16.3s both">no grátis você monta pra ver como fica</p>`)}

<!-- ⑤ onde + marca -->
${cena(18.6, 30, `
  <img src="${img('astro-corpo')}" style="height:620px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) 18.75s both">
  <p style="${OSW};font-size:70px;text-transform:uppercase;text-align:center;line-height:1.1;margin:24px 0 26px;animation:sobe .45s 19.1s both">🛒 Loja do Clube ›<br><span style="color:${GREEN}">Meu presidente</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 19.6s both">${pill('só visual · ninguém compra vantagem', GOLD, INK, 32)}</div>
  <p style="${OSW};font-size:60px;margin-top:46px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 20.1s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com · jogue no navegador, de graça</p>`)}
</body>`

const REC = '/tmp/rec-presidente-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-presidente-reels.html'
writeFileSync(vtmp, video)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(23400)
await ctx.close(); await b.close()
const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
let FF = process.env.FFMPEG || 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa FFMPEG/PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
