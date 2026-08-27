// ─── 🎬 REELS 1080×1920: AS 15 FORMAÇÕES ────────────────────────────────────
// Pedido do Diego (27/08): *"manda o vídeo aí de mockup pra eu fazer o reels"*.
//
// Mesma técnica do `mockup-post-tecnicos.mjs`: as cenas são keyframes de CSS e o
// Playwright GRAVA A TELA em tempo real (webm), depois o ffmpeg converte pra mp4
// no formato que o Instagram aceita (H.264 + yuv420p + faststart).
//
// ⚙️ FFMPEG: usa o `ffmpeg-static` (devDependency, não entra no bundle do jogo)
// e cai no ffmpeg do sistema se ele existir. Nenhum dos dois é usado em `npm run
// build` — é ferramenta de post, não de jogo.
//
// 🤫 REGRA DE OURO (herdada do post original): o mapa de maquiagem é SEGREDO DE
// PRODUÇÃO. Aqui NÃO existe "espelho", "conta do motor" nem técnico — pro
// usuário são 15 formações, todas igualmente de verdade.
//
// ✅ As 5 antigas saem da fonte real (`FORMATIONS` em types.ts): reparar no
//    3-4-3 (2 LAT + 1 ZAG) e no 5-3-2 (2 LAT + 3 ZAG).
//
// 🎞️ Roteiro (~15,5 s):
//    0,0–2,6  "até hoje eram 5 esquemas"  (os 5 campinhos)
//    2,6–4,6  "AGORA SÃO 15"              (número gigante)
//    4,6–11,8 a grade enche: as 5 entram juntas, as 10 novas pipocam uma a uma
//    11,8–15,5 os destaques + "em breve"
//
//   node scripts/video-formacoes-reels.mjs [--saida formacoes-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'formacoes-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── campinho (tamanho FIXO: no vídeo cada cena é uma camada absoluta, não dá
//    pra deixar o flex esticar como na arte estática) ──
const dot = (tag, rec = false, esc = 1) => `
  <span style="display:inline-flex;align-items:center;justify-content:center;width:${26 * esc}px;height:${26 * esc}px;border-radius:50%;
    border:${2.5 * esc}px solid ${INK};background:${tag === 'G' ? '#F3D34A' : tag === 'L' ? '#BFE3C7' : '#DBD1B5'};color:${INK};
    ${OSW};font-size:${11.5 * esc}px;flex:none;${rec ? `transform:translateY(${10 * esc}px)` : ''}">${tag}</span>`
const linha = dots => `<div style="display:flex;justify-content:center;gap:6px;flex:none">${dots}</div>`

const campo = (rotulo, faixas, novo, L = 232, H = 300) => `
  <div style="width:${L}px;flex:none">
    <p style="${OSW};font-size:${Math.round(L / 15)}px;text-transform:uppercase;margin:0 0 5px;text-align:center;white-space:nowrap;
      color:${novo ? INK : '#4a6b55'}">${novo ? '🆕 ' : ''}${rotulo}</p>
    <div style="height:${H}px;background:repeating-linear-gradient(180deg,${GREEN} 0 26px,#166332 26px 52px);
      border:3px solid ${INK};border-radius:12px;padding:11px 3px 9px;box-shadow:3px 3px 0 ${INK};
      display:flex;flex-direction:column">
      ${faixas.ataque}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">${faixas.meio}</div>
      <div style="margin-bottom:12px">${faixas.defesa}</div>
      ${faixas.gol}
    </div>
  </div>`

const A = n => linha(Array.from({ length: n }, () => dot('A')).join(''))
const M = n => linha(Array.from({ length: n }, () => dot('M')).join(''))
const DEF4 = linha(dot('L') + dot('Z') + dot('Z') + dot('L'))
const DEF5 = linha(dot('L') + dot('Z') + dot('Z') + dot('Z') + dot('L'))
const DEF3Z = linha(dot('Z') + dot('Z') + dot('Z'))
const DEF343 = linha(dot('L') + dot('Z') + dot('L'))
const GOL = linha(dot('G'))
const LOS = M(1) + linha(dot('M') + '<span style="width:32px"></span>' + dot('M')) + M(1)

const ANTIGAS = {
  '4-3-3': { ataque: A(3), meio: M(3), defesa: DEF4, gol: GOL },
  '4-4-2': { ataque: A(2), meio: M(4), defesa: DEF4, gol: GOL },
  '4-5-1': { ataque: A(1), meio: M(5), defesa: DEF4, gol: GOL },
  '3-4-3': { ataque: A(3), meio: M(4), defesa: DEF343, gol: GOL },
  '5-3-2': { ataque: A(2), meio: M(3), defesa: DEF5, gol: GOL },
}
const NOVAS = {
  '4-2-4': { ataque: A(4), meio: M(2), defesa: DEF4, gol: GOL },
  '5-4-1': { ataque: A(1), meio: M(4), defesa: DEF5, gol: GOL },
  '4-3-1-2': { ataque: A(2), meio: M(1) + M(3), defesa: DEF4, gol: GOL },
  '4-2-3-1': { ataque: A(1), meio: M(3) + M(2), defesa: DEF4, gol: GOL },
  '4-3-2-1': { ataque: A(1), meio: M(2) + M(3), defesa: DEF4, gol: GOL },
  '4-1-4-1': { ataque: A(1), meio: M(4) + M(1), defesa: DEF4, gol: GOL },
  '4-4-2 losango': { ataque: A(2), meio: LOS, defesa: DEF4, gol: GOL },
  '3-4-3 losango': { ataque: A(3), meio: LOS, defesa: DEF343, gol: GOL },
  '3-5-2': { ataque: A(2), meio: linha(dot('L', true) + dot('M') + dot('M') + dot('M') + dot('L', true)), defesa: DEF3Z, gol: GOL },
  '5-3-2 líbero': { ataque: A(2), meio: M(3), defesa: linha(dot('L') + dot('Z') + dot('Z', true) + dot('Z') + dot('L')), gol: GOL },
}

const pill = (txt, bg, cor, fs = 30) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 30px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

// ── cenas ──────────────────────────────────────────────────────────────────
const cena = (ini, fim, html, extra = '') => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both;${extra}">${html}</div>`

// cena 3: a grade que enche. As 5 antigas entram juntas; as 10 novas pipocam.
const T_ANT = 4.9, T_NOV = 5.8, PASSO = 0.42
const gradeCheia = `
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px">
    ${Object.entries(ANTIGAS).map(([r, f]) =>
      `<div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${T_ANT}s both">${campo(r, f, false)}</div>`).join('')}
    ${Object.entries(NOVAS).map(([r, f], i) =>
      `<div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${(T_NOV + i * PASSO).toFixed(2)}s both">${campo(r, f, true)}</div>`).join('')}
  </div>`

const T_FIM = (T_NOV + 9 * PASSO + 0.8) // ~10,4 s: quando a última já assentou

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:46px 40px;opacity:0}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes treme{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}70%{transform:rotate(3deg)}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
</style><body>

  <!-- ① até hoje: 5 esquemas -->
  ${cena(0, 2.6, `
    <p style="${OSW};font-size:56px;text-transform:uppercase;text-align:center;line-height:1.1;animation:sobe .45s .15s both">até hoje o seu técnico<br>tinha só</p>
    <p style="${OSW};font-size:230px;line-height:1;color:${RED};animation:pop .6s cubic-bezier(.2,1.6,.4,1) .5s both">5</p>
    <p style="${OSW};font-size:56px;text-transform:uppercase;margin-bottom:44px;animation:sobe .45s .8s both">esquemas 😴</p>
    <div style="display:flex;gap:12px;justify-content:center;animation:sobe .5s 1.15s both">
      ${Object.entries(ANTIGAS).map(([r, f]) => campo(r, f, false, 182, 236)).join('')}
    </div>`)}

  <!-- ② agora são 15 -->
  ${cena(2.6, 4.6, `
    <p style="${OSW};font-size:88px;text-transform:uppercase;animation:sobe .4s 2.7s both">agora são</p>
    <p style="${OSW};font-size:420px;line-height:.95;color:${GREEN};animation:pop .6s cubic-bezier(.2,1.6,.4,1) 3.0s both, treme .8s ease-in-out 3.6s 2">15</p>
    <p style="${OSW};font-size:76px;text-transform:uppercase;animation:sobe .4s 3.5s both">formações! 🔥</p>`)}

  <!-- ③ a grade enchendo -->
  ${cena(4.6, 11.9, `
    <p style="${OSW};font-size:52px;text-transform:uppercase;margin-bottom:26px;animation:sobe .4s 4.7s both">
      15 esquemas táticos ⚽</p>
    ${gradeCheia}
    <div style="margin-top:30px;animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${T_FIM.toFixed(2)}s both">
      ${pill('🆕 10 novas + as 5 de sempre', GOLD, INK, 34)}</div>`)}

  <!-- ④ destaques + em breve -->
  ${cena(11.9, 30, `
    <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.12;margin-bottom:34px;animation:sobe .45s 12.0s both">
      do <span style="color:${RED}">4-2-4</span> raiz<br>ao ônibus do <span style="color:${GREEN}">5-4-1</span></p>
    <div style="display:flex;gap:20px;justify-content:center;margin-bottom:44px">
      <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 12.3s both">${campo('4-2-4', NOVAS['4-2-4'], true, 250, 320)}</div>
      <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 12.7s both">${campo('5-4-1', NOVAS['5-4-1'], true, 250, 320)}</div>
      <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 13.1s both">${campo('5-3-2 líbero', NOVAS['5-3-2 líbero'], true, 250, 320)}</div>
    </div>
    <div style="animation:pop .6s cubic-bezier(.2,1.6,.4,1) 13.6s both">${pill('⏳ vem aí', RED, '#fff', 44)}</div>
    <p style="${OSW};font-size:56px;margin-top:38px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 14.1s infinite">
      ⚽ Leilão <span style="color:${RED}">Legends</span></p>
    <p style="font-size:28px;font-weight:700;color:rgba(0,0,0,.55);margin-top:10px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-form-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-formacoes-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(16200)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

// ffmpeg-static primeiro (devDependency); ffmpeg do sistema como reserva
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
