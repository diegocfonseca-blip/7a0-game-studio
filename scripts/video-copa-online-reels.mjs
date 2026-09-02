// ─── 🎬 REELS 1080×1920: A COPA DO MUNDO CHEGOU NO ONLINE ───────────────────
// Pedido do Diego (31/08): *"faça agora tb um vídeo falando sobre essa novidade,
// de o que já é bom no modo carreira agora chegou no modo online pra você jogar
// com os seus amigos"*.
//
// Mesma técnica dos outros reels do repo (`video-formacoes-reels.mjs`): as cenas
// são keyframes de CSS, o Playwright GRAVA A TELA em tempo real (webm) e o
// ffmpeg converte pra mp4 no formato que o Instagram aceita.
//
// ⚙️ FFMPEG: `ffmpeg-static` (devDependency) e o do sistema como reserva. Nada
// disso entra no bundle do jogo — é ferramenta de post.
//
// 🎞️ Roteiro (~17 s):
//   0,0–3,2  a Copa que já existia na carreira (o cadeado da temporada 100)
//   3,2–6,2  "AGORA É COM A SUA TURMA"
//   6,2–10,4 cada um pega uma seleção (as bandeiras entram com o nome do amigo)
//   10,4–13,6 convocação: 11 na veia, sem leilão · o formato da Copa
//   13,6–17,0 o que o campeão leva + a marca
//
//   node scripts/video-copa-online-reels.mjs [--saida copa-online-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'copa-online-reels.mp4')
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

// cartão de uma seleção com o dono do lado (é o que a tabela da Copa mostra)
const selecao = (bandeira, pais, dono, atraso, cor = GOLD) => `
  <div style="display:flex;align-items:center;gap:22px;background:#fff;border:5px solid ${INK};border-radius:22px;
    box-shadow:7px 7px 0 ${INK};padding:20px 26px;width:840px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="font-size:74px;line-height:1">${bandeira}</span>
    <span style="${OSW};font-size:52px;flex:1;text-align:left">${pais}</span>
    <span style="${OSW};font-size:34px;color:${cor === GOLD ? GREEN : cor};text-align:right;max-width:340px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dono}</span>
  </div>`

// um "campinho" de 11 bolinhas — a convocação
const onze = `
  <div style="display:flex;flex-direction:column;gap:20px;align-items:center">
    ${[3, 3, 4, 1].map((n, li) => `
      <div style="display:flex;gap:20px">
        ${Array.from({ length: n }, (_, i) => `
          <span style="width:64px;height:64px;border-radius:50%;border:5px solid ${INK};background:${li === 3 ? '#F3D34A' : li === 2 ? '#DBD1B5' : '#BFE3C7'};
            box-shadow:4px 4px 0 ${INK};display:inline-block;
            animation:pop .42s cubic-bezier(.2,1.6,.4,1) ${(11.0 + (li * 4 + i) * 0.085).toFixed(2)}s both"></span>`).join('')}
      </div>`).join('')}
  </div>`

const fase = (txt, atraso) => `
  <div style="background:${INK};color:#fff;border:4px solid ${INK};border-radius:16px;padding:14px 26px;${OSW};font-size:40px;
    box-shadow:6px 6px 0 ${GOLD};animation:entra .42s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">${txt}</div>`

const premio = (emoji, txt, atraso) => `
  <div style="display:flex;align-items:center;gap:20px;background:#fff;border:5px solid ${INK};border-radius:20px;
    box-shadow:6px 6px 0 ${INK};padding:18px 26px;width:800px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="font-size:56px;line-height:1">${emoji}</span>
    <span style="${OSW};font-size:38px;text-align:left;line-height:1.15">${txt}</span>
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
@keyframes brilho{0%{background-position:180% 180%}100%{background-position:-80% -80%}}
.sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.75) 48%,transparent 60%);
  background-size:250% 250%;animation:brilho 2.4s linear infinite}
</style><body>

<!-- ① a Copa que já existia (na carreira) -->
${cena(0, 3.25, `
  <p style="font-size:150px;line-height:1;margin-bottom:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🌍</p>
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1.05;animation:sobe .5s .35s both">
    Copa do Mundo<br><span style="color:${RED}">Legends</span></p>
  <div style="margin-top:34px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .8s both">${pill('no modo carreira', '#fff', INK, 36)}</div>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.15s both">o torneio de seleções que só<br>abria pra quem chegava lá 🔒</p>`)}

<!-- ② agora é com a turma -->
${cena(3.25, 6.25, `
  <p style="${OSW};font-size:58px;text-transform:uppercase;color:rgba(12,12,12,.5);animation:sobe .45s 3.4s both">agora ela chegou no</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;line-height:1;margin:10px 0 6px;color:${RED};
    animation:pop .55s cubic-bezier(.2,1.6,.4,1) 3.75s both">ONLINE</p>
  <p style="${OSW};font-size:66px;text-transform:uppercase;text-align:center;line-height:1.12;animation:sobe .45s 4.25s both">
    pra você jogar<br>com os seus amigos</p>
  <div style="margin-top:46px;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 4.8s both">${pill('⚽ sala nova · Copa do Mundo', GOLD, INK, 38)}</div>`)}

<!-- ③ cada um pega uma seleção -->
${cena(6.25, 10.45, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:44px;
    animation:sobe .45s 6.4s both">cada um pega<br><span style="color:${GREEN}">uma seleção</span></p>
  <div style="display:flex;flex-direction:column;gap:22px">
    ${selecao('🇧🇷', 'Brasil', 'você', 6.85)}
    ${selecao('🇦🇷', 'Argentina', 'o zé', 7.3)}
    ${selecao('🇫🇷', 'França', 'o compadre', 7.75)}
    ${selecao('🇵🇹', 'Portugal', 'o cunhado', 8.2)}
  </div>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.6);margin-top:44px;text-align:center;line-height:1.3;
    animation:sobe .45s 8.75s both">duas pessoas não levam o mesmo país —<br>quem pegar primeiro, leva 😤</p>`)}

<!-- ④ convocação + formato -->
${cena(10.45, 13.65, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;text-align:center;line-height:1.1;animation:sobe .45s 10.6s both">
    e convoca <span style="color:${ROXO}">11</span> do país</p>
  <div style="margin:34px 0 30px">${onze}</div>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 12.05s both">${pill('sem leilão · convocação pura', '#fff', INK, 36)}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:40px">
    ${fase('4 grupos', 12.4)}
    ${fase('mata-mata', 12.7)}
    ${fase('final única', 13.0)}
  </div>`)}

<!-- ⑤ o que o campeão leva + marca -->
${cena(13.65, 30, `
  <p style="font-size:130px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 13.8s both">🏆</p>
  <p style="${OSW};font-size:70px;text-transform:uppercase;text-align:center;line-height:1.08;margin:14px 0 38px;
    animation:sobe .45s 14.1s both">campeão do mundo<br>leva tudo</p>
  <div style="display:flex;flex-direction:column;gap:18px">
    ${premio('🥇', 'Título no seu <b>Rank</b>', 14.5)}
    ${premio('🎴', 'A <b>carta do campeão</b>', 14.85)}
    ${premio('🏆', 'Troféu na <b>estante da sala</b>', 15.2)}
  </div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 15.8s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-copa-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-copa-online-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(17400)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
