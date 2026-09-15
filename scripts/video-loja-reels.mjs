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
// ⚠️ REFEITO em 15/09 depois do corte dele: *"não gostei, não ficou claro.
// Primeiro que são DUAS novidades. A primeira novidade é o fornecedor de material
// esportivo, tá? E a segunda novidade é a venda de camisas. E não coloca esse
// negócio de se não vender nada, não ganha nada — não coloca essa informação pra
// assustar as pessoas"*.
// Então: DUAS partes, cada uma com a sua cartela de número, e a cena do
// rebaixamento SAIU. O vídeo anuncia, não ameaça.
//
// 🎞️ Roteiro (~31 s):
//   0,0–3,4    duas novidades no modo carreira (a 1 e a 2 já listadas)
//   3,4–5,6    CARTELA · NOVIDADE 1 · 👟 fornecedor de material
//   5,6–10,0   uma marca veste o seu time — e aparece na camisa (peito direito)
//   10,0–14,6  as 4 marcas · o valor trava na divisão em que você assina
//   14,6–16,8  CARTELA · NOVIDADE 2 · 🛍️ venda de camisas
//   16,8–21,2  a sua camisa vira dinheiro toda temporada (a vitrine)
//   21,2–25,4  quanto mais arquibancada, mais camisa
//   25,4–30,2  você escolhe o preço — cada um rende melhor num final
//   30,2–40    marca
//
//   node scripts/video-loja-reels.mjs [--saida loja-reels.mp4] [--no-ar]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
import { camisa, img, LOGO_VADICO } from './loja-pecas.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'loja-reels.mp4')
const NO_AR = process.argv.includes('--no-ar')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// 👕 A CAMISA DO VÍDEO É A DO **FINAL BOSS FC** — a arte de batismo de verdade, com o
// Master da Vadico e o fornecedor de material no peito direito. Cobrança dele (15/09):
// *"eu pedi a arte do Final Boss que fizemos com patrocínio da Vadico e fornecedor
// esportivo, e não a do sem batismo"*. O molde de tier (`CAMISA_TIER`) serve pro post
// que EXPLICA o escudo base de quem não tem batismo — no vídeo, que é vitrine, entra a
// arte bonita. `escudo: ''` porque a arte do batismo já traz o escudo dele.
const ARTE_FINALBOSS = img('public/mantos-salao/finalboss-camisa.webp')
const CAMISA = (alt) => camisa({
  arte: ARTE_FINALBOSS, alt, escudo: '',
  fornecedor: 'Naique', fornSimbolo: '✓', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.22, masterH: 0.155, masterCor: INK,
  pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
})

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
// 🔢 a CARTELA que separa as duas novidades — é ela que deixa claro que são DUAS
const cartela = (n, emoji, titulo, atraso) => `
  <div style="display:flex;flex-direction:column;align-items:center;animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <span style="display:inline-block;background:${INK};color:${GOLD};border:6px solid ${INK};border-radius:999px;
      padding:10px 40px;${OSW};font-size:34px;letter-spacing:.14em;text-transform:uppercase">novidade ${n} de 2</span>
    <p style="font-size:156px;line-height:1;margin:34px 0 10px">${emoji}</p>
    <p style="${OSW};font-size:104px;text-transform:uppercase;text-align:center;line-height:.98">${titulo}</p>
  </div>`

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

// 🚫 TINHA um anel dourado piscando em cima do peito direito, pra apontar onde a marca
// entra. O Diego cortou (15/09): *"o círculo não envolveu o fornecedor de material
// esportivo, e melhor nem ter esse círculo"*. Ele estava mesmo caindo fora do lugar (a
// posição da estampa muda com a proporção de cada arte), e marcação que erra o alvo é
// pior que nenhuma. A frase da cena já diz "no peito direito" — isso basta.

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

<!-- ① abertura: são DUAS novidades, e já diz quais -->
${cena(0, 3.4, `
  <p style="${OSW};font-size:124px;text-transform:uppercase;text-align:center;line-height:.98;
    animation:sobe .5s .2s both">duas<br><span style="color:${GREEN}">novidades</span></p>
  <p style="font-size:42px;font-weight:800;color:rgba(12,12,12,.6);margin:22px 0 40px;text-align:center;
    animation:sobe .5s .6s both">no modo carreira</p>
  <div style="display:flex;flex-direction:column;gap:18px;align-items:center">
    <div style="display:flex;align-items:center;gap:22px;width:900px;background:#fff;border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};padding:22px 30px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 1.1s both">
      <span style="flex:none;width:78px;height:78px;border:6px solid ${INK};border-radius:20px;background:${GOLD};
        display:flex;align-items:center;justify-content:center;${OSW};font-size:46px">1</span>
      <span style="text-align:left">
        <span style="display:block;${OSW};font-size:50px;text-transform:uppercase;line-height:1.05">👟 fornecedor</span>
        <span style="display:block;font-size:33px;font-weight:800;color:rgba(12,12,12,.6)">de material esportivo</span>
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:22px;width:900px;background:#fff;border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};padding:22px 30px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 1.5s both">
      <span style="flex:none;width:78px;height:78px;border:6px solid ${INK};border-radius:20px;background:${GOLD};
        display:flex;align-items:center;justify-content:center;${OSW};font-size:46px">2</span>
      <span style="text-align:left">
        <span style="display:block;${OSW};font-size:50px;text-transform:uppercase;line-height:1.05">🛍️ venda</span>
        <span style="display:block;font-size:33px;font-weight:800;color:rgba(12,12,12,.6)">de camisas</span>
      </span>
    </div>
  </div>`)}

<!-- ② CARTELA da novidade 1 -->
${cena(3.4, 5.6, cartela(1, '👟', 'fornecedor<br>de material', 3.55))}

<!-- ③ o que é: a marca veste o time e APARECE na camisa -->
${cena(5.6, 10.0, `
  <p style="${OSW};font-size:74px;text-transform:uppercase;text-align:center;line-height:1.02;margin-bottom:8px;
    animation:sobe .45s 5.75s both">uma marca<br><span style="color:${GREEN}">veste o seu time</span></p>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:24px;text-align:center;
    animation:sobe .45s 6.05s both">e aparece na camisa, no peito direito</p>
  <div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) 6.35s both">${vitrine(400)}</div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.62);margin-top:26px;text-align:center;line-height:1.3;
    animation:sobe .45s 7.6s both">contrato de 1, 2, 3 ou 5 temporadas —<br>igual ao Patrocinador Master</p>`)}

<!-- ④ as 4 marcas + a trava do valor -->
${cena(10.0, 14.6, `
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:22px;
    animation:sobe .45s 10.15s both">quatro marcas<br><span style="color:${GREEN}">na mesa</span></p>
  <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
    ${marca('⚡', '#8A1E1E', 'Pênalti do Bairro', '1 temporada', 10, 10.5)}
    ${marca('◣', '#0E3E86', 'Adibas', '2 temporadas', 20, 10.7)}
    ${marca('🐆', '#B5651D', 'Pumba', '3 temporadas', 30, 10.9)}
    ${marca('✓', GREEN, 'Naique', '5 temporadas', 45, 11.1)}
  </div>
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.58);margin-top:18px;text-align:center;
    animation:sobe .45s 11.6s both">a porcentagem é o que ela soma nas vendas da sua loja</p>
  <div style="margin-top:26px;width:900px;background:${INK};border-radius:24px;padding:22px 28px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 12.2s both">
    <p style="${OSW};font-size:44px;color:${GOLD};text-transform:uppercase">🔒 o valor trava na sua divisão</p>
    <p style="font-size:32px;font-weight:800;color:rgba(244,236,214,.9);margin-top:8px;line-height:1.3">
      assinou na Série D? é o valor da Série D até o fim —<br>subiu ou caiu, o contrato não quebra</p>
  </div>`)}

<!-- ⑤ CARTELA da novidade 2 -->
${cena(14.6, 16.8, cartela(2, '🛍️', 'venda<br>de camisas', 14.75))}

<!-- ⑥ a loja: a camisa vira dinheiro -->
${cena(16.8, 21.2, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:8px;
    animation:sobe .45s 16.95s both">a sua camisa<br><span style="color:${GREEN}">vira dinheiro</span></p>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:24px;text-align:center;
    animation:sobe .45s 17.25s both">a torcida compra, e entra no caixa toda temporada</p>
  <div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) 17.55s both">${vitrine(400)}</div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.62);margin-top:26px;text-align:center;line-height:1.3;
    animation:sobe .45s 18.6s both">o balanço aparece na abertura<br>da temporada seguinte</p>`)}

<!-- ⑦ a torcida vem do estádio -->
${cena(21.2, 25.4, `
  <p style="font-size:126px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 21.35s both">👥</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 10px;
    animation:sobe .45s 21.6s both">quanto mais<br><span style="color:${GREEN}">arquibancada</span><br>mais camisa</p>
  <p style="font-size:37px;font-weight:800;color:rgba(12,12,12,.64);text-align:center;line-height:1.3;margin-bottom:26px;
    animation:sobe .45s 21.95s both">a sua torcida cresce com o estádio que VOCÊ levanta</p>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center">
    ${ponto('🏟️', 'cada setor pronto', 'mais gente no estádio = mais gente na loja', 22.3)}
    ${ponto('🍔', 'praça, choperia, estação…', 'cada obra soma nas vendas da temporada', 22.6)}
  </div>`)}

<!-- ⑧ o preço que você escolhe -->
${cena(25.4, 30.2, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:8px;
    animation:sobe .45s 25.55s both">você escolhe<br><span style="color:${GREEN}">o preço</span></p>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:26px;text-align:center;line-height:1.3;
    animation:sobe .45s 25.85s both">cada um rende melhor num final de temporada</p>
  <div style="display:flex;gap:16px;width:940px">
    ${precoCard('Popular', 1, 'se só se manter', GREEN, 26.2)}
    ${precoCard('Normal', 2, 'se pegar o acesso', '#B8860B', 26.45)}
    ${precoCard('Cara', 3, 'se for campeão', ROXO, 26.7)}
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.7);margin-top:32px;text-align:center;line-height:1.35;
    animation:sobe .45s 27.5s both">camisa barata a torcida toda leva.<br>camisa cara, campeão vende que é uma beleza.</p>`)}

<!-- ⑨ marca -->
${cena(30.2, 44, `
  <p style="font-size:146px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 30.35s both">🛍️</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 32px;
    animation:sobe .45s 30.65s both">chega no<br><span style="color:${GREEN}">modo carreira</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 31.1s both">${pill(NO_AR ? 'já está no ar' : 'chegando', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:58px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 31.6s infinite">
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
await vp.waitForTimeout(33400)
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
