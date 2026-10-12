// ─── 🎬 REELS 1080×1920: 💬 A COMUNIDADE DO WHATSAPP CHEGOU ─────────────────
// Pedido do Diego (12/10): *"preciso de um post de vídeo agora pra falar da comunidade. Lá
// teremos anúncios e avisos e serão 3 grupos: 1 geral (carreira e online) pra encontrar mais
// pessoas pra jogar online e falar de dicas pro modo carreira; 2 bug e sugestões; 3 VIP
// (pagantes do jogo)… vídeo padrão que sempre fazemos"*. Mesmo molde do
// `video-regionais-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg).
//
// ✅ O que aparece: o link de verdade (o mesmo de `src/escalacao/comunidade.ts`), o QR desse
// link (`scripts/kits/comunidade-qr.svg`, gerado com segno) e um aviso de verdade da
// comunidade (o do Inter Vale, `scripts/posts/aviso-2026-10-12-inter-vale.png`). As conversas
// dos grupos são ILUSTRAÇÃO: sem nome de ninguém, só bolinha colorida (regra de não inventar
// pessoa real, 18/08).
//
// 🎞️ Roteiro (~31 s):
//   0,0– 4,4   💬 chegou a comunidade do Leilão Legends no WhatsApp
//   4,4– 9,6   📢 anúncios e avisos em primeira mão (o aviso de verdade entrando)
//   9,6–15,0   1️⃣ grupo GERAL: achar gente pra jogar online + dicas da carreira
//  15,0–20,0   2️⃣ BUGS E SUGESTÕES
//  20,0–25,0   3️⃣ VIP 👑 só de quem apoia o jogo
//  25,0–31,0   entra agora: QR + link + marca
//
//   node scripts/video-comunidade-reels.mjs [--saida comunidade-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'comunidade-reels.mp4')
const LINK = 'chat.whatsapp.com/KfSkVvbjjdiHptHfJE5hQN'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const dataUrl = (f, tipo) => `data:${tipo};base64,${readFileSync(f).toString('base64')}`
const QR = dataUrl('scripts/kits/comunidade-qr.svg', 'image/svg+xml')
const AVISO = dataUrl('scripts/posts/aviso-2026-10-12-inter-vale.png', 'image/png')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', ZAP = '#25D366'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = (atraso, extra = '') => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both;${extra}`
const sobe = atraso => `animation:sobe .45s ${atraso}s both`
const pop = atraso => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both`

// balão de conversa: bolinha colorida no lugar de gente (ninguém de verdade)
const balao = (cor, txt, atraso, lado = 'e') => `
  <div style="display:flex;gap:16px;align-items:flex-end;width:900px;justify-content:${lado === 'e' ? 'flex-start' : 'flex-end'};${sobe(atraso)}">
    ${lado === 'e' ? `<span style="flex:none;width:58px;height:58px;border-radius:50%;background:${cor};border:4px solid ${INK}"></span>` : ''}
    <span style="max-width:720px;background:${lado === 'e' ? '#fff' : '#DCF8C6'};border:4px solid ${INK};border-radius:24px;
      ${lado === 'e' ? 'border-bottom-left-radius:6px' : 'border-bottom-right-radius:6px'};box-shadow:5px 5px 0 ${INK};
      padding:16px 24px;font-size:34px;font-weight:700;text-align:left;line-height:1.3">${txt}</span>
    ${lado === 'd' ? `<span style="flex:none;width:58px;height:58px;border-radius:50%;background:${cor};border:4px solid ${INK}"></span>` : ''}
  </div>`

// cabeçalho de cada grupo: número grande + nome + pra quê
const grupo = (n, emoji, nome, pra, cor, atraso, fundo = '#fff', tinta = INK) => `
  <div style="display:flex;align-items:center;gap:26px;width:960px;background:${fundo};color:${tinta};border:5px solid ${INK};border-radius:28px;
    box-shadow:9px 9px 0 ${INK};padding:24px 30px;margin-bottom:40px;${pop(atraso)}">
    <span style="flex:none;width:118px;height:118px;border-radius:24px;background:${cor};border:5px solid ${INK};display:flex;align-items:center;
      justify-content:center;${OSW};font-size:76px;color:${cor === GOLD ? INK : '#fff'}">${n}</span>
    <span style="flex:1;text-align:left">
      <b style="${OSW};font-size:58px;display:block;line-height:1.02;text-transform:uppercase">${emoji} ${nome}</b>
      <span style="font-size:30px;font-weight:700;opacity:.7">${pra}</span>
    </span>
  </div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes cai{0%{transform:translateY(-260px) rotate(-8deg);opacity:0}70%{transform:translateY(16px) rotate(1deg);opacity:1}100%{transform:translateY(0) rotate(0);opacity:1}}
@keyframes brilho{0%{background-position:-400px 0}100%{background-position:900px 0}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.4, `
  <div style="width:230px;height:230px;border-radius:50%;background:${ZAP};border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};
    display:flex;align-items:center;justify-content:center;font-size:130px;${pop(.1)}">💬</div>
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin-top:50px;${sobe(.45)}">chegou a</p>
  <p style="${OSW};font-size:124px;text-transform:uppercase;line-height:.98;color:${GREEN};${pop(.7)}">comunidade</p>
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.1;margin-top:14px;${sobe(1.1)}">do Leilão <span style="color:${RED}">Legends</span></p>
  <div style="margin-top:46px;${pop(1.6)}">${pill('📱 no WhatsApp', ZAP, INK, 40)}</div>`)}

<!-- ② anúncios e avisos -->
${cena(4.4, 9.6, `
  <p style="font-size:110px;line-height:1;${pop(4.5)}">📢</p>
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.05;margin:12px 0 10px;${sobe(4.7)}">anúncios e avisos<br><span style="color:${RED}">em primeira mão</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.6);margin-bottom:34px;${sobe(4.9)}">batismo novo, novidade do jogo, carta nova…</p>
  <img src="${AVISO}" style="width:600px;border:5px solid ${INK};border-radius:24px;box-shadow:10px 10px 0 ${INK};animation:cai .7s cubic-bezier(.2,1.4,.4,1) 5.4s both">`)}

<!-- ③ grupo geral -->
${cena(9.6, 15.0, `
  ${grupo(1, '🌐', 'Geral', 'carreira e online', GREEN, 9.7)}
  <div style="display:flex;flex-direction:column;gap:22px;align-items:center">
    ${balao('#7C3AED', 'bora sala online hoje às 22h? 🔨', 10.4)}
    ${balao('#E8503A', 'tô dentro! cria aí que eu entro', 11.1, 'd')}
    ${balao('#F2C200', 'como faz pra subir pra Série B na carreira? 🤔', 11.9)}
    ${balao('#1B7A3D', 'segura o caixa no leilão e investe no ataque 💡', 12.7, 'd')}
  </div>
  <div style="margin-top:44px;${pop(13.4)}">${pill('ache gente pra jogar + dicas da carreira', '#fff', INK, 30)}</div>`)}

<!-- ④ bugs e sugestões -->
${cena(15.0, 20.0, `
  ${grupo(2, '🐞', 'Bugs e sugestões', 'achou um problema? teve uma ideia?', RED, 15.1)}
  <div style="display:flex;flex-direction:column;gap:22px;align-items:center">
    ${balao('#3B82F6', 'achei um bug na sala, olha o print 📸', 15.8)}
    ${balao('#E8503A', 'ideia: modo só com goleiros kkkk 💡', 16.6, 'd')}
  </div>
  <div style="display:flex;gap:18px;margin-top:46px">
    <div style="${pop(17.4)}">${pill('🐞 manda o print', '#fff', INK, 32)}</div>
    <div style="${pop(17.7)}">${pill('💡 manda a ideia', GOLD, INK, 32)}</div>
  </div>
  <p style="font-size:32px;font-weight:800;margin-top:34px;${sobe(18.2)}">quem joga ajuda a deixar o jogo melhor 💪</p>`)}

<!-- ⑤ VIP -->
${cena(20.0, 25.0, `
  <p style="font-size:120px;line-height:1;${pop(20.1)}">👑</p>
  ${grupo(3, '', 'Grupo VIP', 'só de quem apoia o jogo', GOLD, 20.4, INK, '#fff')}
  <div style="width:960px;border:5px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:30px;
    background:linear-gradient(110deg,${GOLD} 0%,#FFE27A 40%,#fff6cf 50%,#FFE27A 60%,${GOLD} 100%);background-size:900px 100%;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 21.0s both, brilho 2.2s linear 21.5s infinite">
    <p style="${OSW};font-size:46px;text-transform:uppercase;line-height:1.15">⭐ Craque · 👑 Lenda · 🖋️ Batismo</p>
    <p style="font-size:32px;font-weight:800;margin-top:14px;line-height:1.35">pertinho do criador do jogo,<br>pra quem faz o Leilão Legends crescer 💛</p>
  </div>`)}

<!-- ⑥ entra agora -->
${cena(25.0, 60, `
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1.02;${sobe(25.1)}">entra <span style="color:${GREEN}">agora</span></p>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin:12px 0 36px;${sobe(25.3)}">aponta a câmera ou toca no link 👇</p>
  <div style="background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};padding:22px;${pop(25.6)}">
    <img src="${QR}" style="display:block;width:420px;height:420px"></div>
  <div style="margin-top:40px;background:${ZAP};border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:18px 28px;
    ${OSW};font-size:40px;letter-spacing:.01em;${pop(26.1)}">${LINK}</div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:34px;${pop(26.6)}">
    ${pill('1 · Geral', '#fff', INK, 28)}${pill('2 · Bugs e sugestões', '#fff', INK, 28)}${pill('3 · VIP 👑', GOLD, INK, 28)}
  </div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 27.2s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-comunidade-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-comunidade-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(31500)
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
