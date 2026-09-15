// ─── 🎬 REELS 1080×1920: 🛍️ LOJA DO CLUBE (venda de camisas) + 👟 FORNECEDOR ──
// Pedido do Diego (15/09): *"quero um vídeo agora daquele que fizemos sempre, com
// as novidades do fornecedor de material esportivo e também da venda de camisas"*.
// Mesma técnica dos outros reels do repo (`video-preparador-reels.mjs`): as cenas
// são keyframes de CSS, o Playwright GRAVA A TELA e o ffmpeg converte pra mp4.
//
// 👕 A CAMISA É A DE VERDADE: montada pelas mesmas peças que o jogo usa
// (`scripts/loja-pecas.mjs`), com o escudo no peito esquerdo, o fornecedor no
// direito e o Master na barriga. O vídeo promete o que a tela entrega.
//
// ⚠️ A feature ainda está em TESTE FECHADO, então o vídeo diz "chegando".
// Trocar por `--no-ar` no dia que liberar geral.
//
// 🎞️ Roteiro (~27 s):
//   0,0–3,6    abriu a LOJA DO CLUBE
//   3,6–8,0    a camisa montada: escudo · fornecedor · Master
//   8,0–12,4   👟 o fornecedor de material — 4 marcas, o valor trava na sua divisão
//   12,4–17,0  👥 a torcida vem do estádio que VOCÊ levanta
//   17,0–22,2  💰 o preço é uma aposta (popular · normal · cara)
//   22,2–24,6  🔴 se cair, não vende nada
//   24,6–40    marca
//
//   node scripts/video-loja-reels.mjs [--saida loja-reels.mp4] [--no-ar]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
import { camisa, escudoBase, CAMISA_TIER, LOGO_VADICO } from './loja-pecas.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'loja-reels.mp4')
const NO_AR = process.argv.includes('--no-ar')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// a camisa montada, em dois tamanhos (a cena 2 mostra grande, as outras menor)
const CAMISA = (alt) => camisa({
  arte: CAMISA_TIER, alt,
  escudo: escudoBase({ letra: 'S', c1: '#2E9E5B', c2: '#14612F', size: Math.round(alt * 0.085) }),
  fornecedor: 'Pumba', fornSimbolo: '🐆', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.20, masterH: 0.155, masterCor: '#4F462E',
  pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
})

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// a vitrine (o mesmo degradê da tela do jogo)
const vitrine = (alt) => `
  <div style="position:relative;border:7px solid ${INK};border-radius:30px;box-shadow:9px 9px 0 ${INK};padding:18px 30px 0;
    background:radial-gradient(120% 70% at 50% 4%,rgba(255,213,120,.42) 0%,rgba(255,196,0,.10) 38%,transparent 66%),
               linear-gradient(#2A1B10 0%,#40281680 34%,#1A0F08 100%),
               repeating-linear-gradient(90deg,#3A2414 0 26px,#331F11 26px 52px)">
    <div style="${OSW};font-size:26px;letter-spacing:.24em;color:#F0DFAE;text-transform:uppercase;text-align:center;margin-bottom:6px">· Loja do Clube ·</div>
    <div style="display:flex;justify-content:center;filter:drop-shadow(0 16px 20px rgba(0,0,0,.6))">${CAMISA(alt)}</div>
    <div style="height:38px;margin-top:-8px;background:linear-gradient(#150C06,#0A0603);border-top:3px solid #54351C;
      margin-left:-30px;margin-right:-30px;border-radius:0 0 22px 22px"></div>
  </div>`

// uma seta apontando pra um ponto da camisa
const ponto = (emoji, titulo, txt, atraso) => `
  <div style="display:flex;align-items:center;gap:20px;width:860px;background:#fff;border:6px solid ${INK};border-radius:24px;
    box-shadow:7px 7px 0 ${INK};padding:18px 26px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="font-size:58px;line-height:1;flex:none">${emoji}</span>
    <span style="text-align:left">
      <span style="display:block;${OSW};font-size:42px;text-transform:uppercase;line-height:1.05">${titulo}</span>
      <span style="display:block;font-size:31px;font-weight:800;color:rgba(12,12,12,.68);margin-top:3px">${txt}</span>
    </span>
  </div>`

// uma marca de material
const marca = (simb, cor, nome, prazo, bonus, atraso) => `
  <div style="display:flex;align-items:center;gap:18px;width:880px;background:#fff;border:6px solid ${INK};border-radius:22px;
    box-shadow:6px 6px 0 ${INK};padding:14px 22px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="flex:none;width:68px;height:68px;border:5px solid ${INK};border-radius:16px;background:${cor};color:#fff;
      display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:4px 4px 0 ${INK}">${simb}</span>
    <span style="${OSW};font-size:42px;text-transform:uppercase;flex:1;text-align:left">${nome}</span>
    <span style="font-size:27px;font-weight:800;color:rgba(12,12,12,.55);white-space:nowrap">${prazo}</span>
    <span style="${OSW};font-size:38px;color:${GREEN};white-space:nowrap;min-width:150px;text-align:right">+${bonus}%</span>
  </div>`

// um preço, com o final em que ele é o melhor
const precoCard = (nome, moeda, quando, cor, atraso) => `
  <div style="flex:1;background:#fff;border:6px solid ${cor};border-radius:24px;box-shadow:6px 6px 0 ${INK};padding:22px 16px;
    animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <div style="${OSW};font-size:42px;text-transform:uppercase;line-height:1">${nome}</div>
    <div style="display:inline-block;${OSW};font-size:30px;color:#fff;background:${cor};border:4px solid ${INK};
      border-radius:14px;padding:2px 14px;margin-top:10px">${moeda} 🪙</div>
    <div style="${OSW};font-size:28px;color:${cor};margin-top:14px;text-transform:uppercase;line-height:1.15">${quando}</div>
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
@keyframes sobeb{0%{transform:translateY(16px)}100%{transform:translateY(-16px)}}
</style><body>

<!-- ① abertura -->
${cena(0, 3.6, `
  <p style="font-size:156px;line-height:1;margin-bottom:22px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🛍️</p>
  <p style="${OSW};font-size:120px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    agora a sua<br>torcida<br><span style="color:${GREEN}">compra</span> camisa</p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.2s both">abriu a Loja do Clube — e a sua camisa<br>vira dinheiro toda temporada</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.8s both">${pill('modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② a camisa montada -->
${cena(3.6, 8.0, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:26px;
    animation:sobe .45s 3.75s both">a camisa do<br><span style="color:${GREEN}">seu clube</span></p>
  <div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) 4.1s both">${vitrine(430)}</div>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.68);margin-top:34px;text-align:center;line-height:1.3;
    animation:sobe .45s 5.0s both">escudo no peito esquerdo · fornecedor no direito<br>e o seu Master na barriga</p>`)}

<!-- ③ o fornecedor de material -->
${cena(8.0, 12.4, `
  <p style="font-size:120px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 8.15s both">👟</p>
  <p style="${OSW};font-size:82px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 8px;
    animation:sobe .45s 8.4s both">fornecedor<br>de <span style="color:${GREEN}">material</span></p>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:22px;text-align:center;
    animation:sobe .45s 8.7s both">contrato de 1, 2, 3 ou 5 temporadas — igual ao Master</p>
  <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
    ${marca('⚡', '#8A1E1E', 'Pênalti do Bairro', '1 temporada', 10, 9.0)}
    ${marca('◣', '#0E3E86', 'Adibas', '2 temporadas', 20, 9.2)}
    ${marca('🐆', '#B5651D', 'Pumba', '3 temporadas', 30, 9.4)}
    ${marca('✓', GREEN, 'Naique', '5 temporadas', 45, 9.6)}
  </div>
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:24px;text-align:center;line-height:1.3;
    animation:sobe .45s 10.2s both">🔒 o valor trava na divisão em que você assina —<br>subiu ou caiu, o contrato não quebra</p>`)}

<!-- ④ a torcida vem do estádio -->
${cena(12.4, 17.0, `
  <p style="font-size:130px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 12.55s both">👥</p>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 10px;
    animation:sobe .45s 12.8s both">quanto mais<br><span style="color:${GREEN}">arquibancada</span><br>mais camisa</p>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.66);text-align:center;line-height:1.3;margin-bottom:30px;
    animation:sobe .45s 13.2s both">a sua torcida cresce com o estádio que VOCÊ levanta</p>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center">
    ${ponto('🏟️', 'cada setor pronto', 'mais gente no estádio = mais gente na loja', 13.6)}
    ${ponto('🍔', 'praça, choperia, estação…', 'cada obra soma nas vendas da temporada', 13.9)}
    ${ponto('🛍️', 'precisa da Loja construída', 'sem ela não há venda nem fornecedor', 14.2)}
  </div>`)}

<!-- ⑤ o preço é uma aposta -->
${cena(17.0, 22.2, `
  <p style="font-size:120px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 17.15s both">🎲</p>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 10px;
    animation:sobe .45s 17.4s both">o preço é<br>uma <span style="color:${GREEN}">aposta</span></p>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.66);text-align:center;line-height:1.3;margin-bottom:28px;
    animation:sobe .45s 17.7s both">você escolhe ANTES da temporada começar</p>
  <div style="display:flex;gap:16px;width:940px">
    ${precoCard('Popular', 1, 'se só se manter', GREEN, 18.1)}
    ${precoCard('Normal', 2, 'se pegar o acesso', '#B8860B', 18.35)}
    ${precoCard('Cara', 3, 'se for campeão', RED, 18.6)}
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.7);margin-top:34px;text-align:center;line-height:1.35;
    animation:sobe .45s 19.4s both">camisa cara com o time brigando pra não cair<br><span style="color:${RED}">é prejuízo</span> — a popular renderia o dobro</p>`)}

<!-- ⑥ se cair, não vende nada -->
${cena(22.2, 24.6, `
  <p style="font-size:150px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 22.35s both">🔴</p>
  <p style="${OSW};font-size:104px;text-transform:uppercase;text-align:center;line-height:1;margin:18px 0 14px;
    animation:sobe .45s 22.6s both">se cair,<br><span style="color:${RED}">não vende<br>nada</span></p>
  <p style="font-size:40px;font-weight:800;color:rgba(12,12,12,.66);text-align:center;line-height:1.3;
    animation:sobe .45s 23.0s both">em qualquer preço — mais um motivo<br>pra não flertar com o Z4</p>`)}

<!-- ⑦ marca -->
${cena(24.6, 40, `
  <p style="font-size:146px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 24.75s both">🛍️</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 32px;
    animation:sobe .45s 25.05s both">chega no<br><span style="color:${GREEN}">modo carreira</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 25.5s both">${pill(NO_AR ? 'já está no ar' : 'chegando', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:58px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 26.0s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-loja-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-loja-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(28200)
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
