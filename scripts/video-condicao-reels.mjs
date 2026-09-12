// ─── 🎬 REELS 1080×1920: CONDIÇÃO / GÁS — SEUS JOGADORES AGORA CANSAM ──────────
// Pedido do Diego (12/09): *"queria aquele mockup igual fizemos os últimos vídeos
// animados em creme… não coisa simulada no jogo. E faça só da condição"*.
//
// Mesma técnica dos outros reels do repo (`video-olheiro-reels.mjs`): as cenas
// são keyframes de CSS, o Playwright GRAVA A TELA em tempo real (webm) e o
// ffmpeg converte pra mp4 no formato que o Instagram/WhatsApp aceitam.
//
// 🎞️ Roteiro (~22 s):
//   0,0–3,2   SEUS JOGADORES AGORA CANSAM (novidade da carreira)
//   3,2–7,6   a escada: 1º ao 10º inteiro · 11º 😓 · 12º 🥵 · 13º+ 🚑 (barra esvaziando)
//   7,6–11,4  cansado joga pior — e pode se machucar de desgaste (15% · 30%)
//   11,4–15,0 o banco recupera +15 por rodada (barra enchendo)
//   15,0–18,4 o preparador avisa · RODIZIAR — você decide, o jogo nunca troca sozinho
//   18,4–22,0 já vale pra todo mundo, em qualquer divisão · próxima rodada, todos em 100% · marca
//
//   node scripts/video-condicao-reels.mjs [--saida condicao-reels.mp4]
//   (ffmpeg: usa `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'condicao-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', AMBAR = '#D9A000', VINHO = '#7A1B1B'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// 🔋 a barrinha do jogo, grande: `de` → `ate` (%) animando a partir de `ini` por `dur` s
const barra = (de, ate, cor, ini, dur, w = 880) => `
  <div style="width:${w}px;height:54px;border:6px solid ${INK};border-radius:16px;background:#e9dfbe;overflow:hidden;box-shadow:6px 6px 0 ${INK}">
    <div style="height:100%;background:${cor};width:${de}%;animation:larg${de}a${ate} ${dur}s ease-in-out ${ini}s both"></div>
  </div>`
const keyBarra = (de, ate) => `@keyframes larg${de}a${ate}{from{width:${de}%}to{width:${ate}%}}`

// uma linha da LISTA do jogo (nome · clube · barrinha · % · jogos) — igual à aba Elenco, só maior
const linha = (nome, clube, pct, cor, emoji, jogos, atraso, w = 880) => `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;background:#fff;border:5px solid ${INK};border-radius:18px;
    box-shadow:6px 6px 0 ${INK};padding:16px 26px;width:${w}px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <div style="text-align:left;min-width:0">
      <div style="${OSW};font-size:44px;line-height:1.05;white-space:nowrap">${nome}</div>
      <div style="font-size:26px;font-weight:700;color:rgba(12,12,12,.5);margin-top:2px">${clube}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <div style="width:220px;height:22px;border:4px solid ${INK};border-radius:8px;background:#e9dfbe;overflow:hidden"><div style="height:100%;width:${pct}%;background:${cor}"></div></div>
        <span style="${OSW};font-size:30px;color:${cor}">${pct}%</span>
      </div>
    </div>
    <div style="text-align:right;white-space:nowrap">
      <div style="font-size:60px;line-height:1">${emoji}</div>
      <div style="font-size:26px;font-weight:800;color:rgba(12,12,12,.55);margin-top:6px">🏃 ${jogos} jogos</div>
    </div>
  </div>`

// um degrau da escada
const degrau = (rot, txt, cor, corTxt, atraso, w = 880) => `
  <div style="display:flex;align-items:center;gap:22px;width:${w}px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="flex:none;min-width:250px;text-align:center;background:${cor};color:${corTxt};border:5px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:12px 20px;${OSW};font-size:40px;text-transform:uppercase;white-space:nowrap">${rot}</span>
    <span style="${OSW};font-size:44px;text-align:left;line-height:1.05">${txt}</span>
  </div>`

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
@keyframes treme{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
@keyframes corBarra{0%{background:${GREEN}}55%{background:${GREEN}}70%{background:${AMBAR}}85%{background:${RED}}100%{background:${VINHO}}}
@keyframes corSobe{0%{background:${VINHO}}40%{background:${AMBAR}}100%{background:${GREEN}}}
${keyBarra(100, 12)}${keyBarra(12, 100)}
</style><body>

<!-- ① abertura -->
${cena(0, 3.2, `
  <p style="font-size:150px;line-height:1;margin-bottom:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">😓</p>
  <p style="${OSW};font-size:132px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    seus jogadores<br><span style="color:${RED}">agora cansam</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.1s both">titular gasta gás · o banco recupera</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.6s both">${pill('novidade no modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② a escada (barra esvaziando) -->
${cena(3.2, 7.6, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:34px;
    animation:sobe .45s 3.35s both">cada jogo seguido<br>como titular <span style="color:${RED}">desconta</span></p>
  <div style="animation:sobe .45s 3.6s both">
    <div style="width:880px;height:54px;border:6px solid ${INK};border-radius:16px;background:#e9dfbe;overflow:hidden;box-shadow:6px 6px 0 ${INK}">
      <div style="height:100%;width:100%;animation:larg100a12 3.4s linear 3.9s both, corBarra 3.4s linear 3.9s both"></div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px;margin-top:44px">
    ${degrau('1º ao 10º', '💪 inteiro — joga normal', GREEN, '#fff', 4.0)}
    ${degrau('11º', '😓 cansado — <span style="color:${AMBAR}">−1</span> no jogo', AMBAR, INK, 5.0)}
    ${degrau('12º', '🥵 no limite — <span style="color:${RED}">−2</span>', RED, '#fff', 5.8)}
    ${degrau('13º em diante', '🚑 esgotado — <span style="color:${VINHO}">−3</span>', VINHO, '#fff', 6.5)}
  </div>`)}

<!-- ③ lesão por desgaste -->
${cena(7.6, 11.4, `
  <p style="font-size:130px;line-height:1;animation:treme .5s ease-in-out 7.8s 3">🩹</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 10px;color:${RED};
    animation:pop .55s cubic-bezier(.2,1.6,.4,1) 7.9s both">cansado joga pior…</p>
  <p style="${OSW};font-size:64px;text-transform:uppercase;text-align:center;line-height:1.1;animation:sobe .45s 8.4s both">
    e pode <span style="color:${VINHO}">se machucar de desgaste</span></p>
  <div style="display:flex;gap:22px;margin-top:50px">
    <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 8.9s both;background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:26px 34px;width:420px;text-align:center">
      <div style="font-size:80px;line-height:1">🥵</div><div style="${OSW};font-size:74px;color:${RED};margin-top:6px">15%</div><div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6)">por jogo</div></div>
    <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 9.2s both;background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:26px 34px;width:420px;text-align:center">
      <div style="font-size:80px;line-height:1">🚑</div><div style="${OSW};font-size:74px;color:${VINHO};margin-top:6px">30%</div><div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6)">por jogo</div></div>
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:44px">
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 9.8s both">${pill('fora de 1 a 3 rodadas', '#fff', INK, 30)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 10.1s both">${pill('volta aos poucos: 60% → 80% → 100%', '#fff', INK, 30)}</div>
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:40px;text-align:center;line-height:1.3;
    animation:sobe .45s 10.5s both">sem reserva? entram os <b>Crias da Base</b> 🌱</p>`)}

<!-- ④ o banco recupera (barra enchendo) -->
${cena(11.4, 15.0, `
  <p style="font-size:130px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 11.55s both">🪑</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 10px;color:${GREEN};
    animation:sobe .45s 11.8s both">no banco o gás volta</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;animation:sobe .45s 12.1s both">+15 por rodada</p>
  <div style="margin-top:46px;animation:sobe .45s 12.3s both">
    <div style="width:880px;height:54px;border:6px solid ${INK};border-radius:16px;background:#e9dfbe;overflow:hidden;box-shadow:6px 6px 0 ${INK}">
      <div style="height:100%;width:12%;animation:larg12a100 2.0s ease-out 12.6s both, corSobe 2.0s ease-out 12.6s both"></div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px;margin-top:46px">
    ${degrau('😓 cansado', '1 rodada fora → inteiro', AMBAR, INK, 13.2)}
    ${degrau('🚑 esgotado', 'precisa de <span style="color:${RED}">2 rodadas</span>', VINHO, '#fff', 13.7)}
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:44px;text-align:center;line-height:1.3;
    animation:sobe .45s 14.2s both">quem volta de lesão volta com o gás que tem</p>`)}

<!-- ⑤ o preparador + rodiziar -->
${cena(15.0, 18.4, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:30px;
    animation:sobe .45s 15.15s both">na aba <span style="color:${GREEN}">Elenco</span>, a barrinha<br>de cada jogador</p>
  <div style="display:flex;flex-direction:column;gap:18px">
    ${linha('Zico', 'Flamengo · 1981', 86, GREEN, '💪', 2, 15.4)}
    ${linha('Cafu', 'Milan · 2004', 30, AMBAR, '😓', 11, 15.7)}
    ${linha('Lúcio', 'Inter · 2010', 16, VINHO, '🚑', 13, 16.0)}
  </div>
  <div style="margin-top:34px;width:880px;background:#FFF6D6;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:22px 30px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 16.5s both">
    <p style="${OSW};font-size:34px;text-transform:uppercase;color:rgba(12,12,12,.55)">🧑‍⚕️ preparador físico</p>
    <p style="font-size:34px;font-weight:800;margin-top:8px;line-height:1.3"><b>Lúcio</b> está <span style="color:${VINHO}">esgotado</span> — −3 e o triplo de risco de lesão.</p>
    <div style="margin-top:18px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:16px 24px;${OSW};font-size:40px;
      animation:pulsa 1.2s ease-in-out 17.1s infinite">🔁 RODIZIAR — Mozer no lugar de Lúcio</div>
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:36px;text-align:center;line-height:1.3;
    animation:sobe .45s 17.4s both">o preparador sugere — <b>você decide</b>.<br>o jogo nunca troca sozinho</p>`)}

<!-- ⑥ quando libera + marca -->
${cena(18.4, 30, `
  <p style="font-size:120px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 18.55s both">🏆</p>
  <p style="${OSW};font-size:66px;text-transform:uppercase;text-align:center;line-height:1.1;margin:16px 0 30px;
    animation:sobe .45s 18.85s both">vale pra <span style="color:${GREEN}">todo mundo</span><br>em qualquer divisão</p>
  <div style="width:880px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:22px 30px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 19.4s both">
    <p style="${OSW};font-size:44px;text-transform:uppercase">quando começa?</p>
    <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:8px;line-height:1.3">na sua <b>próxima rodada</b> — todo mundo começa em 100%</p>
  </div>
  <div style="margin-top:40px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 19.9s both">${pill('já está no ar', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 20.4s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-condicao-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-condicao-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(22400)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

let FF = process.env.FFMPEG || 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa FFMPEG/PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
