// ─── 🎬 REELS 1080×1920: SOBE UM GURI DA BASE QUANDO QUISER ──────────────────
// Companheiro do `video-master-reels.mjs`, mesmo molde creme animado em CSS
// (padrão dos reels do repo — NÃO gravação do jogo). Anuncia a caixa da Base na aba
// Elenco (13/09): com vaga no elenco, você escolhe a posição e um dos 3 guris do
// Sub-20 — nome + historinha — e ele sobe na hora.
//
// 🎞️ Roteiro (~22,5 s):
//   0,0–3,2   SOBE UM GURI DA BASE quando quiser (novidade da carreira)
//   3,2–7,4   a caixa no Elenco: só aparece com vaga · escolhe a posição
//   7,4–12,6  os 3 cartões: nome + historinha (todos dizem que ele é ruim… e tem coração)
//   12,6–16,2 as regras: fraquinho · de graça · sem contrato · invendável · sobe na hora
//   16,2–19,2 chegou jogador de verdade? ele volta pra base sozinho
//   19,2–22,5 já está no ar · marca
//
//   node scripts/video-base-reels.mjs [--saida base-reels.mp4]
//   (ffmpeg: `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'base-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', PAPEL = '#f6efdc'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'


const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

const NOMES = [
  ['Pintinho', 'O Pintinho é fraquinho, todo mundo no Sub-20 sabe. Mas ninguém corre mais que ele: marca, volta, cruza errado e ainda pede desculpa pro adversário. 💚'],
  ['Tampinha', 'Dizem que o Tampinha dormiu abraçado com a camisa do clube na noite em que soube que ia subir. Chuta com a canela, mas grita mais alto que a torcida. 📣'],
  ['Mirim', 'O Mirim leva marmita pro roupeiro, carrega a bolsa de bolas e erra passe de três metros. "É limitado, mas não desiste nunca." 🍱'],
]
const cartao = (nome, hist, atraso, sel = false, w = 900) => `
  <div style="width:${w}px;background:#fff;border:6px solid ${sel ? GREEN : INK};outline:${sel ? `5px solid ${GREEN}` : 'none'};outline-offset:2px;border-radius:22px;overflow:hidden;box-shadow:7px 7px 0 ${INK};text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <div style="display:flex;align-items:center;gap:16px;background:linear-gradient(160deg,#FFE79A,#FFC400 55%,#E8A200);border-bottom:5px solid ${INK};padding:14px 22px">
      <span style="font-size:44px">🌱</span>
      <div style="flex:1"><div style="${OSW};font-size:42px;line-height:1">${nome}</div><div style="${OSW};font-size:20px;color:rgba(12,12,12,.6);text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Laterais · Sub-20 · 48–58 · sem contrato</div></div>
      ${sel ? `<span style="${OSW};font-size:24px;background:${GREEN};color:#fff;border-radius:10px;padding:6px 16px">SOBE ✓</span>` : ''}
    </div>
    <p style="font-size:27px;font-weight:700;color:#3a3527;line-height:1.4;padding:16px 22px">${hist}</p>
  </div>`
const chip = (txt, on, atraso) => `<span style="display:inline-block;background:${on ? GREEN : '#fff'};color:${on ? '#fff' : INK};border:4px solid ${INK};border-radius:14px;padding:10px 20px;${OSW};font-size:30px;animation:pop .4s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">${txt}</span>`

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
@keyframes cresce{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
</style><body>

<!-- ① abertura -->
${cena(0, 3.2, `
  <p style="font-size:150px;line-height:1;margin-bottom:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🌱</p>
  <p style="${OSW};font-size:118px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    sobe um guri<br>da <span style="color:${GREEN}">base</span> quando quiser</p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.1s both">antes de alguém se machucar · você escolhe quem</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.6s both">${pill('novidade no modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② a caixa no Elenco -->
${cena(3.2, 7.4, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:34px;
    animation:sobe .45s 3.35s both">na aba <span style="color:${GREEN}">Elenco</span>, quando<br>tem vaga no elenco…</p>
  <div style="width:900px;background:#EAF6EE;border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:22px 28px;display:flex;align-items:center;gap:20px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 3.7s both">
    <span style="font-size:60px">🌱</span>
    <div style="flex:1"><div style="${OSW};font-size:40px;text-transform:uppercase;letter-spacing:.03em">Base · 7 vagas no elenco</div>
      <div style="font-size:26px;font-weight:700;color:rgba(12,12,12,.6);margin-top:4px">Laterais 2 · Zagueiros 1 · Meias 2 · Atacantes 2</div></div>
    <span style="${OSW};font-size:30px;background:${GREEN};color:#fff;border:4px solid ${INK};border-radius:14px;padding:12px 22px;animation:pulsa 1.2s ease-in-out 4.4s infinite">🌱 SUBIR DA BASE</span>
  </div>
  <p style="${OSW};font-size:50px;text-transform:uppercase;text-align:center;margin:50px 0 24px;animation:sobe .45s 5.2s both">escolhe a posição</p>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;width:900px">
    ${chip('Laterais · 2 vagas', true, 5.5)}${chip('Zagueiros · 1 vaga', false, 5.7)}${chip('Meias · 2 vagas', false, 5.9)}${chip('Atacantes · 2 vagas', false, 6.1)}
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:44px;text-align:center;animation:sobe .45s 6.5s both">não é obrigatório — sem vaga, a caixa nem aparece</p>`)}

<!-- ③ os 3 cartões -->
${cena(7.4, 12.6, `
  <p style="${OSW};font-size:56px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:30px;
    animation:sobe .45s 7.55s both">três guris do Sub-20 —<br><span style="color:${GREEN}">nome e historinha</span> vêm juntos</p>
  <div style="display:flex;flex-direction:column;gap:20px">
    ${cartao(NOMES[0][0], NOMES[0][1], 7.9, true)}
    ${cartao(NOMES[1][0], NOMES[1][1], 8.5)}
    ${cartao(NOMES[2][0], NOMES[2][1], 9.1)}
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;text-align:center;line-height:1.3;animation:sobe .45s 10.4s both">todos dizem, cada um do seu jeito: <b>o guri é ruim</b> — e tem coração 💚</p>`)}

<!-- ④ as regras -->
${cena(12.6, 16.2, `
  <p style="font-size:130px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 12.75s both">✅</p>
  <p style="${OSW};font-size:90px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 46px;color:${GREEN};
    animation:sobe .45s 13.0s both">confirmou, subiu na hora</p>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;width:940px">
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 13.4s both">${pill('fraquinho: 48–58', '#fff', INK, 32)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 13.7s both">${pill('de graça', GREEN, '#fff', 32)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 14.0s both">${pill('sem contrato', '#fff', INK, 32)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 14.3s both">${pill('invendável', '#fff', INK, 32)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 14.6s both">${pill('ocupa a vaga do elenco', '#fff', INK, 32)}</div>
  </div>
  <p style="${OSW};font-size:52px;text-transform:uppercase;text-align:center;margin-top:54px;line-height:1.15;animation:sobe .45s 15.1s both">
    enche o banco <span style="color:${RED}">antes</span><br>de alguém se machucar</p>`)}

<!-- ⑤ volta pra base -->
${cena(16.2, 19.2, `
  <p style="font-size:130px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 16.35s both">🔁</p>
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1.05;margin:14px 0 30px;
    animation:sobe .45s 16.6s both">chegou jogador<br><span style="color:${GREEN}">de verdade</span> na posição?</p>
  <div style="width:900px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:26px 30px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 17.1s both">
    <p style="font-size:34px;font-weight:800;line-height:1.35">🌱 <b>Pintinho</b> voltou pra base de cabeça erguida — missão cumprida, chegou reforço. Valeu, guri! 💚</p>
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:40px;text-align:center;line-height:1.3;animation:sobe .45s 17.8s both">ele sai sozinho, na virada da temporada.<br>quem sobe de verdade fica com a vaga.</p>`)}

<!-- ⑥ já está no ar + marca -->
${cena(19.2, 30, `
  <p style="font-size:120px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 19.35s both">🌱</p>
  <p style="${OSW};font-size:66px;text-transform:uppercase;text-align:center;line-height:1.1;margin:16px 0 30px;
    animation:sobe .45s 19.65s both">aba Elenco ›<br><span style="color:${GREEN}">Base · subir da base</span></p>
  <div style="margin-top:20px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 20.2s both">${pill('já está no ar', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 20.7s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-base-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-base-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(22900)
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
