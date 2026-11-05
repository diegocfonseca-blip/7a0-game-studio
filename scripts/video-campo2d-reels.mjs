// ─── 🎬 REELS 1080×1920: 📺 CAMPO 2D — LANÇAMENTO (05/11) ───────────────────────────────────────────────────────────
// Pedido do Diego (05/11): *"outro vídeo só do campinho 2D também de lançamento… dizendo que chegou finalmente"*. Mesmo molde
// do `video-clas-reels.mjs`. Os quadros do campinho são da TELA DE VERDADE (scripts/posts/img/campo2d-*.png).
// ⛔ NÃO POSTAR antes do 2D ser liberado (hoje só a conta do Diego/testadores — `CAMPO2D_TESTERS`).
//
// 🎞️ Roteiro (~37 s):
//   0,0– 4,6   📺 chegou finalmente: CAMPO 2D
//   4,6–10,6   o jogo inteiro rolando no campinho, lance a lance (quadros reais)
//  10,6–16,2   GOOOL: a narração conta como a bola entrou
//  16,2–21,6   a SUA formação manda · cada um na vaga que você escalou · golpes das lendas
//  21,6–26,6   regras de futebol de verdade · torcida · sol, nublado e chuva
//  26,6–31,8   serve pra tudo: liga, copas, Liberta, Champions, Copa do Mundo · online e carreira
//  31,8–37,2   CTA: nas salas quem cria escolhe 📺 · na carreira/partida rápida, do ⭐ Craque Salas pra cima
//
//   node scripts/video-campo2d-reels.mjs [--saida scripts/posts/campo2d-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/campo2d-reels.mp4')
const img = f => `data:image/png;base64,${readFileSync(`scripts/posts/img/${f}`).toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = atraso => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both`
const sobe = atraso => `animation:sobe .45s ${atraso}s both`
const pop = atraso => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both`
const caixa = (html, atraso, extra = '') => `<div style="width:940px;background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;text-align:left;${pop(atraso)};${extra}">${html}</div>`
const ordem = (pos, nome, tag, atraso, vez = false) => `<div style="display:flex;align-items:center;gap:22px;padding:16px 28px;${vez ? `background:#FFF3C4;` : ''}border-top:3px dashed #0002;${entra(atraso)}">
  <span style="${OSW};font-size:44px;width:70px">${pos}</span><b style="${OSW};flex:1;font-size:42px">${nome}</b><span style="${OSW};font-size:30px;color:${vez ? RED : '#999'}">${tag}</span></div>`
const pista = (src, ini, fim) => `<img src="${src}" style="position:absolute;width:640px;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:34px;box-shadow:12px 12px 0 ${INK};opacity:0;animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">`

const campo = (f, atraso, extra = '') => `<div style="width:760px;border:7px solid ${INK};border-radius:34px;box-shadow:12px 12px 0 ${INK};overflow:hidden;background:#123;${pop(atraso)};${extra}"><img src="${img(f)}" style="width:100%;display:block"></div>`
const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative;color:${INK}}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes bola{0%{transform:translate(-260px,0) rotate(0)}50%{transform:translate(0,-30px) rotate(360deg)}100%{transform:translate(260px,0) rotate(720deg)}}
@keyframes troca{0%,45%{opacity:1}50%,100%{opacity:0}}
@keyframes gol{0%{transform:scale(.2) rotate(-8deg);opacity:0}60%{transform:scale(1.18) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes chuva{from{background-position:0 0}to{background-position:-60px 300px}}
</style><body>

<!-- ① chegou finalmente -->
${cena(0, 4.6, `
  <div style="position:relative;width:260px;height:260px;border-radius:40px;background:${GREEN};border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:140px;${pop(.1)}">📺</div>
  <div style="font-size:90px;height:110px;margin-top:20px;animation:bola 2.2s ease-in-out .6s infinite alternate">⚽</div>
  <p style="${OSW};font-size:62px;text-transform:uppercase;color:rgba(12,12,12,.5);margin:10px 0 22px;${sobe(.45)}">chegou finalmente</p>
  <p style="${OSW};font-size:180px;text-transform:uppercase;line-height:.9;color:${GREEN};${pop(.75)}">campo 2D</p>
  <div style="margin-top:44px;${pop(1.5)}">${pill('o jogo rolando na sua frente', GOLD, INK, 40)}</div>`)}

<!-- ② o jogo inteiro rolando -->
${cena(4.6, 10.6, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(4.7)}">o jogo <span style="color:${GREEN}">inteiro</span><br>no campinho</p>
  <div style="position:relative">${campo('campo2d-a.png', 5.0)}
    <div style="position:absolute;inset:0;animation:apar .3s linear 7.6s both;opacity:0">${campo('campo2d-b.png', 7.6, 'animation:none')}</div></div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.65);margin-top:30px;${sobe(5.8)}">passe, drible, chute, defesa · os 22 em campo · 90 minutos</p>`)}

<!-- ③ gol + narração -->
${cena(10.6, 16.2, `
  <p style="${OSW};font-size:200px;line-height:.9;color:${GOLD};-webkit-text-stroke:6px ${INK};text-shadow:10px 10px 0 ${INK};animation:gol .6s cubic-bezier(.2,1.6,.4,1) 10.7s both">GOOOOL!</p>
  ${caixa(`<div style="padding:18px 28px;${OSW};font-size:30px;background:${INK};color:${GOLD};letter-spacing:.06em">🎙️ A NARRAÇÃO CONTA TUDO</div>
    <div style="padding:22px 28px;font-size:36px;font-weight:800;line-height:1.35;${entra(11.6)}">32' tabelinha pela esquerda…</div>
    <div style="padding:0 28px 22px;font-size:36px;font-weight:800;line-height:1.35;${entra(12.2)}">33' Romário recebe na área, gira…</div>
    <div style="padding:0 28px 28px;font-size:40px;font-weight:900;line-height:1.35;color:${GREEN};${entra(12.8)}">⚽ É GOOOL! De bico, no canto!</div>`, 11.2, 'margin-top:40px')}
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:32px;${sobe(13.6)}">e o placar é o mesmo do jogo · sem spoiler</p>`)}

<!-- ④ formação manda -->
${cena(16.2, 21.6, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(16.3)}">a <span style="color:${ROXO}">sua formação</span> manda</p>
  <div style="display:flex;gap:22px">${[['4-3-3', 'pontas abertas'], ['4-5-1', 'meio fechado'], ['3-5-2', 'alas no ataque']].map(([f, d], i) => `<div style="width:290px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:22px 0;${pop(16.7 + i * .25)}"><div style="${OSW};font-size:72px;line-height:1">${f}</div><div style="${OSW};font-size:28px;color:#666;margin-top:8px">${d}</div></div>`).join('')}</div>
  ${caixa(`<div style="padding:26px 28px;font-size:38px;font-weight:800;line-height:1.35;${entra(17.8)}">📍 cada um na vaga que <b>você</b> escalou</div>
    <div style="padding:0 28px 26px;font-size:38px;font-weight:800;line-height:1.35;${entra(18.2)}">⭐ as lendas com as <b style="color:${ROXO}">jogadas de verdade</b> delas</div>
    <div style="padding:0 28px 30px;font-size:38px;font-weight:800;line-height:1.35;${entra(18.6)}">🧠 o técnico grita da beira do campo</div>`, 17.4, 'margin-top:34px')}`)}

<!-- ⑤ regras, torcida, clima -->
${cena(21.6, 26.6, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(21.7)}">futebol <span style="color:${RED}">de verdade</span></p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;width:960px">${[['🚩', 'lateral · escanteio · tiro de meta'], ['🧱', 'barreira na distância da regra'], ['🏟️', 'torcida da casa lotando'], ['🌧️', 'sol, nublado… e chuva (rara)']].map(([e, t], i) => `<div style="background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:24px 18px;${pop(22.1 + i * .25)}"><div style="font-size:80px">${e}</div><div style="${OSW};font-size:34px;line-height:1.15;margin-top:6px">${t}</div></div>`).join('')}</div>`)}

<!-- ⑥ serve pra tudo -->
${cena(26.6, 31.8, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(26.7)}">serve pra <span style="color:${GREEN}">tudo</span></p>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:18px;width:980px">${['🏆 Liga', '🥇 Copas', '🌎 Libertadores', '⭐ Champions', '🌐 Copa do Mundo', '🗺️ Regionais', '🌐 Salas online', '💼 Carreira'].map((t, i) => `<span style="${pop(27.0 + i * .14)};display:inline-block">${pill(t, i % 2 ? '#fff' : GOLD, INK, 40)}</span>`).join('')}</div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:40px;${sobe(28.6)}">no celular em pé · no computador deitado</p>`)}

<!-- ⑦ CTA -->
${cena(31.8, 60, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.08;${sobe(31.9)}">na sala online,<br>quem cria escolhe</p>
  <div style="margin-top:34px;${pop(32.4)}">${pill('📊 Placar  ou  📺 Campo 2D', GREEN, '#fff', 46)}</div>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.65);margin:28px 0 0;${sobe(33.0)}">quem entra na sala assiste de graça</p>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.65);margin:14px 0 0;${sobe(33.4)}">na carreira e na partida rápida: do ⭐ Craque Salas pra cima</p>
  <p style="${OSW};font-size:60px;margin-top:80px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-campo2d-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-campo2d-reels.html'
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
