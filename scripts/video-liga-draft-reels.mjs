// ─── 🎬 REELS 1080×1920: 📋 LIGA DRAFT — LANÇAMENTO (05/11) ─────────────────────────────────────────────────────────
// Pedido do Diego (05/11): *"já prepare o lançamento por vídeo da Liga Draft com vídeos que costumamos fazer de reels…
// dizendo que chegou finalmente"*. Mesmo molde do `video-clas-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg).
// As imagens são da TELA DE VERDADE (bancada `scripts/teste-draft/` e o mockup aprovado do anúncio), em scripts/posts/img/.
// Nomes de técnico INVENTADOS. ⛔ NÃO POSTAR antes da Liga Draft ser liberada pra todos (`MINHA_LIGA_DRAFT_GERAL`).
//
// 🎞️ Roteiro (~38 s):
//   0,0– 4,8   📋 chegou finalmente: LIGA DRAFT
//   4,8–10,4   a liga da sua turma que não acaba · 1ª temporada = leilão de sempre
//  10,4–16,2   a noite do draft: campeão escolhe primeiro · 1 jogador de TODO o jogo · um Neymar só na liga
//  16,2–22,6   suspense: as pistas caem e a carta vira (Romário!)
//  22,6–27,8   ou sonda o amigo: o jogador dele vai a leilão · contrato de 3 temporadas
//  27,8–32,4   moedas pela colocação · elenco até 22 · regras que a turma combina
//  32,4–38,2   CTA: Salas online → 📋 Liga Draft
//
//   node scripts/video-liga-draft-reels.mjs [--saida scripts/posts/liga-draft-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/liga-draft-reels.mp4')
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
@keyframes balanca{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes rola{0%{transform:translateY(0)}100%{transform:translateY(-420px)}}
@keyframes moeda{0%{transform:translateY(-300px) rotate(0);opacity:0}60%{opacity:1}100%{transform:translateY(0) rotate(360deg);opacity:1}}
</style><body>

<!-- ① chegou finalmente -->
${cena(0, 4.8, `
  <div style="width:250px;height:250px;border-radius:50%;background:${ROXO};border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:140px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, balanca 1.2s ease-in-out .7s infinite">📋</div>
  <p style="${OSW};font-size:62px;text-transform:uppercase;color:rgba(12,12,12,.5);margin:50px 0 26px;${sobe(.45)}">chegou finalmente</p>
  <p style="${OSW};font-size:190px;text-transform:uppercase;line-height:.9;color:${ROXO};${pop(.75)}">liga<br>draft</p>
  <p style="${OSW};font-size:58px;text-transform:uppercase;line-height:1.1;margin-top:22px;${sobe(1.2)}">Leilão <span style="color:${RED}">Legends</span></p>
  <div style="margin-top:44px;${pop(1.7)}">${pill('⚽ um Neymar só pra liga inteira', GOLD, INK, 38)}</div>`)}

<!-- ② a liga da turma -->
${cena(4.8, 10.4, `
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(4.9)}">a liga da <span style="color:${ROXO}">sua turma</span><br>que não acaba</p>
  ${caixa(`<div style="padding:22px 28px;${OSW};font-size:34px;background:${INK};color:${GOLD}">🏆 TEMPORADA 1</div>
    <div style="padding:26px 28px;font-size:38px;font-weight:800;line-height:1.35;${entra(5.6)}">🔨 começa no <b style="color:${GREEN}">leilão de sempre</b></div>
    <div style="padding:0 28px 26px;font-size:38px;font-weight:800;line-height:1.35;${entra(6.0)}">👥 10 ou 20 times · 🤖 bots completam</div>
    <div style="padding:0 28px 30px;font-size:38px;font-weight:800;line-height:1.35;${entra(6.4)}">📅 acabou a temporada? <b style="color:${ROXO}">vem a noite do draft</b></div>`, 5.2)}
  <p style="${OSW};font-size:46px;margin-top:40px;${pop(7.6)}">o elenco atravessa as temporadas 🔁</p>`)}

<!-- ③ a noite do draft -->
${cena(10.4, 16.2, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:26px;${sobe(10.5)}">📋 a noite do draft</p>
  ${caixa(`<div style="padding:18px 28px;${OSW};font-size:30px;background:${INK};color:${GOLD};letter-spacing:.08em">ORDEM DO DRAFT · A TABELA MANDA</div>
    ${ordem('1º', 'Tigrão FC 🏆', 'escolheu', 10.9)}${ordem('2º', 'Várzea Moral', '⏱ NA VEZ', 11.2, true)}${ordem('3º', 'Pé de Pano EC', '…', 11.5)}`, 10.7)}
  <div style="width:940px;height:520px;margin-top:30px;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;background:#fff;${pop(12.0)}">
    <img src="${img('draft-lista.png')}" style="width:100%;animation:rola 3.6s ease-in-out 12.6s both"></div>
  <p style="${OSW};font-size:40px;line-height:1.15;margin-top:30px;${sobe(12.8)}">o campeão escolhe primeiro · <span style="color:${ROXO}">1 jogador de TODO o jogo</span></p>`)}

<!-- ④ o suspense -->
${cena(16.2, 22.6, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.05;position:absolute;top:120px;left:0;right:0;${sobe(16.3)}">🥁 e o anúncio tem <span style="color:${RED}">suspense</span></p>
  ${pista(img('draft-p0.png'), 16.4, 17.6)}${pista(img('draft-p1.png'), 17.6, 18.8)}${pista(img('draft-p2.png'), 18.8, 20.0)}${pista(img('draft-p3.png'), 20.0, 21.0)}${pista(img('draft-romario.png'), 21.0, 22.6)}
  <p style="${OSW};font-size:42px;position:absolute;bottom:150px;left:0;right:0;${sobe(16.8)}">posição → categoria → época → <span style="color:${ROXO}">a carta vira</span></p>`)}

<!-- ⑤ sondar o amigo -->
${cena(22.6, 27.8, `
  <div style="font-size:150px;${pop(22.7)}">🕵️</div>
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin:20px 0 30px;${sobe(22.9)}">ou <span style="color:${RED}">sonda o amigo</span></p>
  ${caixa(`<div style="padding:26px 28px;font-size:38px;font-weight:800;line-height:1.35;${entra(23.4)}">🔨 o jogador dele vai pro <b>leilão</b> no envelope</div>
    <div style="padding:0 28px 26px;font-size:38px;font-weight:800;line-height:1.35;${entra(23.8)}">⚡ quem sondou pode <b style="color:${RED}">igualar</b> o lance</div>
    <div style="padding:0 28px 30px;font-size:38px;font-weight:800;line-height:1.35;${entra(24.2)}">🔒 contrato: só depois de <b>3 temporadas</b> no time</div>`, 23.2)}
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:32px;${sobe(25)}">e cada um pode pôr 1 jogador seu à venda 🏷️</p>`)}

<!-- ⑥ moedas, elenco, regras -->
${cena(27.8, 32.4, `
  <div style="display:flex;gap:30px;font-size:110px">${['🪙', '🪙', '🪙'].map((m, i) => `<span style="animation:moeda .8s cubic-bezier(.2,1.2,.4,1) ${27.9 + i * .15}s both">${m}</span>`).join('')}</div>
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.05;margin:20px 0 30px;${sobe(28.2)}">moedas pela <span style="color:${GREEN}">colocação</span></p>
  <div style="display:flex;gap:22px">${[['👕', 'até 22', 'no elenco'], ['📜', 'regras', 'da turma'], ['🤖', 'bots', 'na briga']].map(([e, a, b], i) => `<div style="width:290px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:20px 0;${pop(28.8 + i * .25)}"><div style="font-size:80px">${e}</div><div style="${OSW};font-size:56px;line-height:1">${a}</div><div style="${OSW};font-size:30px;color:#666">${b}</div></div>`).join('')}</div>
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;${sobe(29.8)}">"ninguém pega lenda", "só jogador brasileiro"… vocês combinam</p>`)}

<!-- ⑦ CTA -->
${cena(32.4, 60, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.08;${sobe(32.5)}">chama a turma<br>e monta a sua</p>
  <div style="margin-top:44px;${pop(33.0)}">${pill('🌐 Salas online → 📋 Liga Draft', ROXO, '#fff', 46)}</div>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin:30px 0 0;${sobe(33.6)}">criar é do ⭐ plano · entrar na liga do amigo é de graça</p>
  <p style="${OSW};font-size:60px;margin-top:80px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34.2s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-liga-draft-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-liga-draft-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(38600)
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
