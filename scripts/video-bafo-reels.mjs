// ─── 🎬 REELS 1080×1920: 🃏 BAFO — LANÇAMENTO (21/11) ───────────────────────────────────────────────────────────────
// Pedido do Diego (21/11): *"eu quero aquele vídeo padrão aí do bafo também… lançamento"*. Mesmo molde do
// `video-liga-draft-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg). Cartas e pacote são os DE VERDADE do jogo
// (scripts/foto-bafo-cartas.mjs → scripts/posts/img/bafo-*.png). Nomes de técnico INVENTADOS.
// ⛔ Postar só quando o Bafo for liberado pra todos (`SALA_ELENCO_GERAL`).
//
// 🎞️ Roteiro (~37 s):
//   0,0– 4,6   🃏 chegou o BAFO: aqui a carta é de verdade
//   4,6–10,0   de onde vêm as cartas: foi campeão, abre o pacote
//  10,0–15,6   convoque 22 (160 s) · reserva pra trocar no jogo
//  15,6–21,2   só gente, só liga, no Campo 2D · 2 / 3–4 / 5–20 pessoas
//  21,2–28,2   o campeão toma 1 carta: pacote, suspense, TOMADA! + zoeira
//  28,2–32,4   1ª sala do dia grátis · entrar é livre · 11+ cartas
//  32,4–37,4   CTA: Salas online → 🃏 Bafo
//
//   node scripts/video-bafo-reels.mjs [--saida scripts/posts/bafo-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/bafo-reels.mp4')
const img = f => `data:image/png;base64,${readFileSync(`scripts/posts/img/${f}`).toString('base64')}`
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
const PAC = img('bafo-pacote.png')
const pacote = (w, extra) => `<img src="${PAC}" style="width:${w}px;border-radius:18px;border:6px solid ${INK};box-shadow:10px 10px 0 #000;${extra}">`
// carta do leque: gira em volta do pé da carta
const leque = (f, rot, dx, atraso, w = 330) => `<img src="${img(f)}" style="position:absolute;left:50%;bottom:0;width:${w}px;margin-left:${-w / 2 + dx}px;transform-origin:50% 100%;--r:${rot}deg;animation:abre .55s cubic-bezier(.2,1.4,.4,1) ${atraso}s both">`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:radial-gradient(ellipse at 50% 36%,#1f8a47 0%,#0f4a26 40%,#06180d 82%);font-family:system-ui;overflow:hidden;position:relative;color:#fff}
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
</style><body>

<!-- ① chegou o Bafo -->
${cena(0, 4.6, `
  <div style="${pop(.1)}">${pacote(330, 'animation:treme .5s ease-in-out .7s infinite')}</div>
  <p style="${OSW};font-size:62px;text-transform:uppercase;color:rgba(255,255,255,.7);margin:44px 0 6px;${sobe(.45)}">chegou o</p>
  <p style="${OSW};font-size:330px;text-transform:uppercase;line-height:.88;color:${GOLD};text-shadow:12px 12px 0 #000;${pop(.75)}">bafo</p>
  <p style="${OSW};font-size:56px;text-transform:uppercase;line-height:1.1;margin-top:26px;${sobe(1.3)}">aqui a carta é <span style="color:${GOLD}">de verdade</span></p>
  <div style="margin-top:36px;${pop(1.9)}">${pill('😈 perdeu, ela vai embora', RED, '#fff', 40)}</div>`)}

<!-- ② de onde vêm as cartas -->
${cena(4.6, 10.0, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;position:absolute;top:150px;left:0;right:0;${sobe(4.7)}">foi <span style="color:${GOLD}">campeão</span>?<br>abre o pacote 🏆</p>
  <div style="position:relative;width:560px;height:760px;margin-top:150px">
    <div style="position:absolute;left:115px;top:130px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 4.8s both, rasga .6s ease-in 6.3s forwards">${pacote(330, 'animation:treme .45s ease-in-out 5.3s 2')}</div>
    <img src="${img('bafo-ronaldo.png')}" style="position:absolute;left:0;top:0;width:560px;opacity:0;animation:vira .6s cubic-bezier(.2,1.3,.4,1) 6.7s both, brilho 1.4s ease-in-out 7.3s infinite">
  </div>
  <p style="${OSW};font-size:44px;line-height:1.2;position:absolute;bottom:230px;left:40px;right:40px;${sobe(7.5)}">cada título dá <span style="color:${GOLD}">1 carta</span> · na Carreira e nas salas online</p>
  <p style="font-size:32px;font-weight:800;color:rgba(255,255,255,.7);position:absolute;bottom:150px;left:0;right:0;${sobe(8.2)}">essas cartas são suas · e agora valem jogo</p>`)}

<!-- ③ convoque 22 -->
${cena(10.0, 15.6, `
  <p style="${OSW};font-size:70px;text-transform:uppercase;line-height:1.05;${sobe(10.1)}">📋 convoque <span style="color:${GOLD}">22</span></p>
  <div style="position:relative;width:1000px;height:600px;margin:20px 0 10px">
    ${leque('bafo-taffarel.png', -28, -40, 10.4)}${leque('bafo-zico.png', -14, -20, 10.55)}${leque('bafo-romario.png', 28, 40, 10.85)}${leque('bafo-pele.png', 14, 20, 10.7)}${leque('bafo-cafu.png', 0, 0, 11.0, 350)}
  </div>
  ${caixa(`<div style="padding:18px 28px;${OSW};font-size:34px;background:${INK};color:${GOLD};display:flex;justify-content:space-between"><span>CONVOCAÇÃO</span><span>⏱ 160 s</span></div>
    ${linha(`✅ <b style="${OSW};font-size:52px;color:${GREEN}">22/22</b> · escolha quem vai pro jogo`, 11.6)}
    ${linha('🔁 11 titulares + reservas pra <b>trocar no meio</b>', 12.1, false)}
    ${linha('⏰ não escolheu? o jogo completa com as <b style="color:' + RED + '">piores</b>', 12.6, false)}`, 11.3)}`)}

<!-- ④ só gente, só liga -->
${cena(15.6, 21.2, `
  <div style="font-size:150px;${pop(15.7)}">⚽</div>
  <p style="${OSW};font-size:74px;text-transform:uppercase;line-height:1.05;margin:14px 0 30px;${sobe(15.9)}">só <span style="color:${GOLD}">gente</span>, só <span style="color:${GOLD}">liga</span></p>
  ${caixa(`<div style="padding:18px 28px;${OSW};font-size:32px;background:${INK};color:${GOLD};letter-spacing:.06em">🃏 QUANTOS NA SALA?</div>
    ${linha(`<b style="${OSW};font-size:46px">2 pessoas</b> · 5 jogos entre os dois`, 16.4)}
    ${linha(`<b style="${OSW};font-size:46px">3 ou 4</b> · todos contra todos, 4 vezes`, 16.8, false)}
    ${linha(`<b style="${OSW};font-size:46px">5 a 20</b> · todos contra todos, ida e volta`, 17.2, false)}`, 16.2)}
  <div style="display:flex;gap:18px;margin-top:34px">${[['🚫🤖', 'sem bot'], ['📺', 'Campo 2D'], ['⏱', '60 s pra escalar']].map(([e, t], i) => `<div style="width:300px;background:${GOLD};color:${INK};border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 #000;padding:16px 0;${pop(17.9 + i * .22)}"><div style="font-size:64px">${e}</div><div style="${OSW};font-size:40px;text-transform:uppercase">${t}</div></div>`).join('')}</div>`)}

<!-- ⑤ o campeão toma 1 carta -->
${cena(21.2, 28.2, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.05;position:absolute;top:130px;left:0;right:0;${sobe(21.3)}">🏆 o campeão <span style="color:${RED}">toma 1 carta</span></p>
  <p style="${OSW};font-size:38px;letter-spacing:.14em;color:${GOLD};position:absolute;top:300px;left:0;right:0;${sobe(21.8)}">TIGRÃO FC ESCOLHE DE QUEM QUISER…</p>
  <div style="position:relative;width:600px;height:800px;margin-top:210px">
    <div style="position:absolute;left:135px;top:140px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 21.5s both, rasga .6s ease-in 23.6s forwards">${pacote(330, 'animation:treme .45s ease-in-out 22.1s 3')}</div>
    <img src="${img('bafo-ronaldo.png')}" style="position:absolute;left:0;top:0;width:600px;opacity:0;animation:vira .6s cubic-bezier(.2,1.3,.4,1) 24.0s both, brilho 1.4s ease-in-out 24.6s infinite">
    <div style="position:absolute;left:330px;top:330px;background:${RED};color:#fff;border:6px solid ${INK};border-radius:18px;box-shadow:7px 7px 0 #000;padding:6px 30px;${OSW};font-size:76px;opacity:0;animation:carimba .35s cubic-bezier(.3,1.4,.5,1) 24.9s both">TOMADA!</div>
  </div>
  <div style="width:940px;background:#fff;color:${INK};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 #000;padding:22px 28px;text-align:left;font-size:36px;font-weight:800;line-height:1.3;position:absolute;bottom:130px;left:70px;${pop(25.7)}">😈 <b>Tigrão FC:</b> "Várzea Moral, devolvo o Ronaldo quando você ganhar de mim. Ou seja: nunca."</div>`)}

<!-- ⑥ como entra -->
${cena(28.2, 32.4, `
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(28.3)}">quem pode <span style="color:${GOLD}">jogar</span>?</p>
  ${caixa(`${linha(`🎟️ <b>1ª sala do dia</b> pra criar é <b style="color:${GREEN}">de graça</b>`, 28.8)}
    ${linha(`🚪 <b>entrar</b> na sala do amigo é <b style="color:${GREEN}">livre</b>`, 29.2, false)}
    ${linha('🃏 precisa de <b>11 cartinhas</b> de campeão ou mais', 29.6, false)}`, 28.6)}
  <p style="font-size:34px;font-weight:800;color:rgba(255,255,255,.75);margin-top:36px;${sobe(30.3)}">🤫 ninguém vê quantas cartas você tem</p>`)}

<!-- ⑦ CTA -->
${cena(32.4, 60, `
  <div style="${pop(32.5)}">${pacote(250, 'transform:rotate(-4deg)')}</div>
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.08;margin-top:40px;${sobe(32.7)}">bota suas cartas<br>em <span style="color:${GOLD}">jogo</span></p>
  <div style="margin-top:40px;${pop(33.2)}">${pill('🌐 Salas online → 🃏 Bafo', GOLD, INK, 48)}</div>
  <p style="${OSW};font-size:62px;margin-top:80px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34.2s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(255,255,255,.7);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-bafo-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-bafo-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(37600)
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
