// ─── 🎬 REELS 1080×1920: O OLHEIRO — SONDAR JOGADOR VOLTOU ───────────────────
// Pedido do Diego (07/09): *"quero aquele vídeo padrão também… e diga que vocês
// pediram: agora vocês poderão ir sondar jogadores que estão direto no time
// deles"*.
//
// Mesma técnica dos outros reels do repo (`video-copa-online-reels.mjs`): as
// cenas são keyframes de CSS, o Playwright GRAVA A TELA em tempo real (webm) e
// o ffmpeg converte pra mp4 no formato que o Instagram aceita.
//
// 🎞️ Roteiro (~18 s):
//   0,0–3,2   "VOCÊS PEDIRAM" — e a gente ouviu
//   3,2–6,6   SONDAR JOGADOR: direto do time dos outros clubes
//   6,6–10,6  como funciona: a listinha do clube, marca → vai pro leilão
//   10,6–14,4 o OLHEIRO: básico · ⭐ Craque · 👑 Lenda (quem não alcança nem vê)
//   14,4–18,0 onde fica + grupo VIP a partir do Craque + marca
//
//   node scripts/video-olheiro-reels.mjs [--saida olheiro-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'olheiro-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const PRATA = 'linear-gradient(150deg,#F4F7FB,#CBD4DE 60%,#9BA7B5)'
const OURO = 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)'
const BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// uma linha da listinha do clube (igual à do jogo, só maior)
const jog = (nome, rot, estado, atraso) => {
  const marcado = estado === 'marcado'
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;background:${marcado ? '#E9F9EF' : '#fff'};
    border:5px solid ${INK};border-left:16px solid ${GREEN};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:18px 28px;width:860px;
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="${OSW};font-size:50px">${nome}</span>
    <span style="${OSW};font-size:32px;color:${GREEN};white-space:nowrap">${rot}</span>
  </div>`
}

// o cartão de um olheiro (tier)
const olheiro = (grad, titulo, alcance, atraso, cor = INK) => `
  <div style="width:880px;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};overflow:hidden;background:#fff;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <div style="background:${grad};padding:16px 28px;border-bottom:5px solid ${INK};position:relative;overflow:hidden">
      <span style="${OSW};font-size:50px;text-transform:uppercase;color:${cor};position:relative">${titulo}</span>
      ${grad === BEGE ? '' : '<div class="sheen"></div>'}
    </div>
    <p style="padding:16px 28px;font-size:36px;font-weight:800;line-height:1.3;text-align:left;color:rgba(12,12,12,.8)">${alcance}</p>
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
@keyframes vira{0%{background:#fff}100%{background:#E9F9EF}}
.sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.75) 48%,transparent 60%);
  background-size:250% 250%;animation:brilho 2.4s linear infinite}
</style><body>

<!-- ① vocês pediram -->
${cena(0, 3.2, `
  <p style="font-size:150px;line-height:1;margin-bottom:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🙏</p>
  <p style="${OSW};font-size:150px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    vocês<br><span style="color:${RED}">pediram</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.1s both">e a gente ouviu 👂</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.6s both">${pill('novidade no modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② sondar jogador -->
${cena(3.2, 6.6, `
  <p style="${OSW};font-size:58px;text-transform:uppercase;color:rgba(12,12,12,.5);animation:sobe .45s 3.35s both">agora dá pra</p>
  <p style="${OSW};font-size:124px;text-transform:uppercase;line-height:1;margin:10px 0 6px;color:${GREEN};text-align:center;
    animation:pop .55s cubic-bezier(.2,1.6,.4,1) 3.7s both">🕵️ sondar<br>jogador</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.12;margin-top:20px;animation:sobe .45s 4.25s both">
    que está <span style="color:${RED}">direto no time</span><br>dos outros clubes</p>
  <div style="margin-top:46px;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 4.9s both">${pill('junto com o técnico', GOLD, INK, 38)}</div>`)}

<!-- ③ como funciona -->
${cena(6.6, 10.6, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:40px;
    animation:sobe .45s 6.75s both">toca no clube,<br><span style="color:${GREEN}">marca quem você quer</span></p>
  <div style="display:flex;flex-direction:column;gap:22px">
    ${jog('Alan Ruschel', '📝 faltam 2', 'preso', 7.1)}
    ${jog('Lúcio', '✔ no leilão', 'marcado', 7.5)}
    ${jog('Bruno Rangel', '🆓 + sondar', 'livre', 7.9)}
  </div>
  <p style="${OSW};font-size:66px;text-transform:uppercase;text-align:center;line-height:1.1;margin-top:46px;color:${RED};
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 8.5s both">o sondado vai pro leilão 🔨</p>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:36px">
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 9.0s both">${pill('1 jogador por leilão', '#fff', INK, 30)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 9.3s both">${pill('só quem está sem contrato', '#fff', INK, 30)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 9.6s both">${pill('o clube dono briga de volta', '#fff', INK, 30)}</div>
  </div>`)}

<!-- ④ o olheiro -->
${cena(10.6, 14.4, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:36px;
    animation:sobe .45s 10.75s both">quem acha o jogador<br>é o <span style="color:${ROXO}">seu olheiro</span></p>
  <div style="display:flex;flex-direction:column;gap:22px">
    ${olheiro(BEGE, '🕵️ Olheiro básico', 'acha <b>foi profissional</b>, <b>bom jogador</b> e <b>promessa</b>', 11.1)}
    ${olheiro(PRATA, '⭐ Olheiro Craque', 'acha tudo isso <b>+ os craques</b>', 11.5)}
    ${olheiro(OURO, '👑 Olheiro Lenda', 'acha <b>todo mundo</b> — lenda inclusive', 11.9)}
  </div>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.6);margin-top:44px;text-align:center;line-height:1.3;
    animation:sobe .45s 12.6s both">quem o seu olheiro não alcança,<br>você nem vê na lista 🙈</p>`)}

<!-- ⑤ onde fica + grupo + marca -->
${cena(14.4, 30, `
  <p style="font-size:120px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 14.55s both">🕵️</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin:16px 0 30px;
    animation:sobe .45s 14.85s both">na janela antes do leilão,<br>aba <span style="color:${GREEN}">Sondar técnico e jogador</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 15.4s both">${pill('já está no ar', GOLD, INK, 40)}</div>
  <div style="margin-top:50px;width:880px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:22px 30px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 15.9s both">
    <p style="${OSW};font-size:44px;text-transform:uppercase">📲 e o grupo VIP do zap</p>
    <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:8px;line-height:1.3">agora é a partir do <b>⭐ Craque</b> — não só do Lenda</p>
  </div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 16.6s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-olheiro-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-olheiro-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(18400)
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
