// ─── 🎬 REELS 1080×1920: 🥇 A BOLA DE OURO AGORA PAGA ────────────────────────
// Pedido do Diego (19/09): *"preciso de um mockup agora do bola de ouro que fizemos e
// vídeo também igual normalmente costumamos fazer do mockup e explicando"*. Mesma
// técnica dos outros reels do repo (`video-preparador-reels.mjs`): as cenas são
// keyframes de CSS, o Playwright GRAVA A TELA em tempo real (webm) e o ffmpeg converte
// pra mp4 de Instagram/WhatsApp.
//
// 🎞️ Roteiro (~27 s):
//   0,0–4,4    🥇 a Bola de Ouro agora PAGA
//   4,4–9,4    quem leva: gols + assistências somados (não é o artilheiro, não é o garçom)
//   9,4–14,2   +20 🪙 pro clube, na linha do extrato
//  14,2–19,8   +10 de piso no jogador — e o que "piso" muda (renovação · venda · SAF)
//  19,8–23,6   duas bolas = duas vezes 10 · e se for de bot, a carta encarece pra todos
//  23,6–27,5   marca
//
//   node scripts/video-bola-ouro-reels.mjs [--saida bola-ouro-reels.mp4]
//   (ffmpeg: usa `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'bola-ouro-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${readFileSync('src/escalacao/img/jornal-bola-ouro-v1.webp').toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// 🪙 o número gigante do prêmio
const numero = (valor, rotulo, atraso, cor = GOLD) => `
  <div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${atraso}s both;background:${cor === GOLD ? G_OURO : '#fff'};
    border:7px solid ${INK};border-radius:34px;box-shadow:10px 10px 0 ${INK};padding:26px 54px;text-align:center">
    <div style="${OSW};font-size:150px;line-height:1">${valor}</div>
    <div style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:6px">${rotulo}</div>
  </div>`
// 🧾 uma linha do extrato
const linha = (ic, txt, val, atraso, destaque) => `
  <div style="display:flex;align-items:center;gap:20px;width:920px;padding:20px 26px;font-size:34px;font-weight:800;text-align:left;
    background:${destaque ? 'linear-gradient(90deg,#FFF3C9,#fff)' : '#fff'};border:5px solid ${INK};border-radius:20px;
    ${destaque ? `box-shadow:8px 8px 0 ${INK}` : 'box-shadow:none;opacity:.55'};margin-bottom:14px;
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="font-size:40px">${ic}</span><span style="flex:1">${txt}</span>
    <b style="${OSW};font-size:44px;color:${String(val).startsWith('−') ? RED : GREEN}">${val}</b>
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
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 40px rgba(255,196,0,.85))}}
</style><body>

<!-- ① abertura -->
${cena(0, 4.4, `
  <img src="${ARTE}" style="width:840px;border:7px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};
    animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both, brilha 2.6s ease-in-out 1s infinite">
  <p style="${OSW};font-size:118px;text-transform:uppercase;text-align:center;line-height:.98;margin-top:44px;
    animation:sobe .5s .6s both">a bola de ouro<br>agora <span style="color:${GREEN}">paga</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:34px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.4s both">o melhor do mundo do ano não é mais<br>só uma página bonita no jornal</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 2.1s both">${pill('modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② quem leva -->
${cena(4.4, 9.4, `
  <div style="animation:sobe .45s 4.55s both">${pill('quem leva', '#fff', INK, 34)}</div>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:26px 0 16px;
    animation:sobe .45s 4.8s both">gols <span style="color:${GOLD}">+</span> assistências</p>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.35;
    animation:sobe .45s 5.2s both">somados na temporada inteira<br>liga e todas as copas, no mundo todo</p>
  <div style="display:flex;align-items:center;gap:26px;margin-top:52px">
    <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 5.8s both;background:#fff;border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};padding:22px 34px;text-align:center">
      <div style="${OSW};font-size:96px;line-height:1">27</div><div style="font-size:30px;font-weight:800;opacity:.6">gols</div></div>
    <span style="${OSW};font-size:80px;color:${GOLD}">+</span>
    <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 6.2s both;background:#fff;border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};padding:22px 34px;text-align:center">
      <div style="${OSW};font-size:96px;line-height:1">16</div><div style="font-size:30px;font-weight:800;opacity:.6">assist.</div></div>
    <span style="${OSW};font-size:80px;color:${GOLD}">=</span>
    <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 6.6s both;background:${G_OURO};border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};padding:22px 34px;text-align:center">
      <div style="${OSW};font-size:96px;line-height:1">43</div><div style="font-size:30px;font-weight:800;opacity:.7">total</div></div>
  </div>
  <p style="font-size:42px;font-weight:800;text-align:center;line-height:1.3;margin-top:52px;
    animation:sobe .45s 7.4s both">não é o <b style="color:${RED}">artilheiro</b>.<br>não é o <b style="color:${RED}">garçom</b>.<br>
    é quem fez <b style="color:${GREEN}">as duas coisas</b>.</p>`)}

<!-- ③ +20 moedas pro clube -->
${cena(9.4, 14.2, `
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:12px;
    animation:sobe .45s 9.55s both">o <span style="color:${GREEN}">clube</span> fatura</p>
  <div style="margin:24px 0 40px">${numero('+20', 'moedas no caixa', 9.9)}</div>
  ${linha('🏆', 'Prêmio por posição', '+34', 10.6)}
  ${linha('🥇', 'Bola de Ouro: Rummenigge', '+20', 11.0, true)}
  ${linha('🎟️', 'Bilheteria da temporada', '+58', 11.4)}
  <p style="font-size:38px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;margin-top:34px;
    animation:sobe .45s 12.0s both">entra sozinho na virada da temporada,<br>na mesma lista dos outros prêmios</p>`)}

<!-- ④ +10 de piso no jogador -->
${cena(14.2, 19.8, `
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:12px;
    animation:sobe .45s 14.35s both">e o <span style="color:${GREEN}">craque</span> valoriza</p>
  <div style="margin:24px 0 34px">${numero('+10', 'de piso no valor dele', 14.7)}</div>
  <div style="width:920px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px 32px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 15.5s both">
    <p style="${OSW};font-size:34px;text-transform:uppercase;color:rgba(12,12,12,.55);margin-bottom:14px">o piso manda em</p>
    <p style="font-size:37px;font-weight:800;line-height:1.55">📝 quanto custa <b>renovar</b> com ele<br>
      💰 o <b>teto</b> do que você recebe na venda<br>
      🏢 o que a <b>SAF</b> paga no empréstimo</p>
  </div>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;margin-top:34px;
    animation:sobe .45s 17.4s both">ganhar a Bola de Ouro deixa o cara<br><b style="color:${INK}">mais caro de segurar — e de vender</b></p>`)}

<!-- ⑤ acumula, e vale pro mundo inteiro -->
${cena(19.8, 23.6, `
  <p style="font-size:130px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 19.95s both">🥇🥇</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin:22px 0 16px;
    animation:sobe .45s 20.2s both">duas bolas,<br>duas vezes <span style="color:${GOLD}">10</span></p>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.35;
    animation:sobe .45s 20.7s both">o piso soma a cada título — e fica na carta,<br>não na temporada</p>
  <div style="margin-top:44px;width:920px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};
    padding:26px 32px;text-align:left;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 21.4s both">
    <p style="font-size:36px;font-weight:800;line-height:1.45">Se o melhor do mundo for de um time da máquina, <b>ninguém recebe as moedas</b> —
      mas a carta <b>encarece pra todo mundo</b> no próximo leilão.</p>
  </div>`)}

<!-- ⑥ marca -->
${cena(23.6, 40, `
  <p style="font-size:150px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 23.75s both">🥇</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 34px;
    animation:sobe .45s 24.05s both">no fim de<br><span style="color:${GREEN}">toda temporada</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 24.5s both">${pill('já está no ar', GREEN, '#fff', 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 25s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-bola-ouro-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-bola-ouro-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(27600)
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
