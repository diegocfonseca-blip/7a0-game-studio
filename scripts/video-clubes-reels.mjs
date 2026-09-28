// ─── 🎬 REELS 1080×1920: 🧱 LEILÃO DE CLUBES ─────────────────────────────────
// Pedido do Diego (27/09): *"preciso de um vídeo novo no estilo padrão dos vídeos
// que costumamos fazer de mockup, lançando o novo modo de leilão de clubes por
// setores"*. Mesmo molde do `video-tocaia-reels.mjs` (cenas em HTML + Playwright
// gravando + ffmpeg).
//
// ✅ TUDO QUE APARECE É DO JOGO DE VERDADE: os pacotes e as contagens saem do
// baralho (Ataque do Milan = 12 atacantes no baralho, Goleiros do Palmeiras = 7…),
// os rostos são os `.webp` do jogo (`public/avatars/`), o relógio é o de 90s e o
// castigo é o do motor (o PIOR do pacote na vaga vazia). O pregão NÃO mostra os
// nomes — só o clube e quantos tem —, igual à tela.
// 🔒 O ONLINE AINDA ESTÁ TRAVADO pra geral, então o vídeo diz "online: em breve".
//
// 🎞️ Roteiro (~38 s):
//   0,0– 4,6   🧱 chegou o LEILÃO DE CLUBES
//   4,6–10,0   o lote é um SETOR de um clube (só o clube e quantos tem)
//  10,0–15,6   dá o lance no pacote → martelo: é seu o Ataque do Milan
//  15,6–19,6   um pacote por setor = o time inteiro
//  19,6–28,0   ⭐ a CONVOCAÇÃO: 90s, você escolhe quem joga, o rosto cai no campo
//  28,0–32,0   não escolheu? o PIOR do pacote · quem sobra vai pros bots
//  32,0–38,2   envelope ou tocaia · onde jogar + marca
//
//   node scripts/video-clubes-reels.mjs [--saida clubes-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'clubes-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const rosto = f => `data:image/webp;base64,${readFileSync(`public/avatars/lendas-v1/${f}.webp`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// 🛡️ o escudo do jogo pra clube sem arte: escudinho com a inicial (neutro — nada de escudo real)
const escudo = (letra, cor, tam = 78) => `
  <span style="width:${tam}px;height:${Math.round(tam * 1.12)}px;flex:none;background:${cor};border:4px solid ${INK};
    border-radius:14px 14px ${tam / 2}px ${tam / 2}px;display:flex;align-items:center;justify-content:center;
    ${OSW};font-size:${Math.round(tam * .5)}px;color:#fff;text-shadow:2px 2px 0 ${INK}">${letra}</span>`
// 🧱 um pacote do pregão, do jeito da tela: escudo + setor do clube + QUANTOS tem (sem nomes)
const pacote = (ic, setor, clube, letra, cor, n, atraso, extra = '') => `
  <div style="display:flex;align-items:center;gap:20px;width:940px;padding:20px 24px;margin-bottom:16px;text-align:left;
    background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    ${escudo(letra, cor)}
    <span style="flex:1;min-width:0">
      <b style="${OSW};font-size:44px;display:block;line-height:1.05;text-transform:uppercase">${ic} ${setor} ${clube}</b>
      <span style="font-size:28px;font-weight:700;color:rgba(12,12,12,.55)">${n} jogadores no pacote</span>
    </span>
    ${extra}
  </div>`
const lance = v => `
  <span style="display:flex;align-items:center;gap:10px;flex:none">
    <b style="width:58px;height:58px;border:4px solid ${INK};border-radius:14px;display:flex;align-items:center;justify-content:center;${OSW};font-size:40px">−</b>
    <b style="width:96px;height:58px;border:4px solid ${INK};border-radius:14px;display:flex;align-items:center;justify-content:center;${OSW};font-size:36px">${v}</b>
    <b style="width:58px;height:58px;border:4px solid ${INK};border-radius:14px;background:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:40px">+</b>
  </span>`

// ⭐ a convocação: 3 atacantes do Milan que têm rosto no jogo
const ATA = [
  { nome: 'Andriy Shevchenko', ano: 2004, f: 'andriy-shevchenko-milan-2004', t: 22.1 },
  { nome: 'George Weah', ano: 1995, f: 'george-weah-milan-1995', t: 23.3 },
  { nome: 'Marco van Basten', ano: 1989, f: 'marco-van-basten-milan-1989', t: 24.5 },
]
const LISTA = ['Alexandre Pato', 'Andriy Shevchenko', 'Filippo Inzaghi', 'George Weah', 'José Altafini', 'Marco van Basten', 'Rafael Leão', 'Ruud Gullit']
const RELOGIO_T0 = 20.4 // o 90 aparece aqui e desce de verdade, 1 por segundo

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
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 45px rgba(255,196,0,.9))}}
@keyframes martelo{0%{transform:rotate(-55deg) translateY(-40px);opacity:0}55%{transform:rotate(12deg);opacity:1}100%{transform:rotate(0)}}
@keyframes treme{0%,100%{transform:translateX(0)}20%{transform:translateX(-14px)}40%{transform:translateX(14px)}60%{transform:translateX(-9px)}80%{transform:translateX(9px)}}
@keyframes cai{0%{transform:translateY(-240px) scale(.6);opacity:0}70%{transform:translateY(14px) scale(1.06);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes tremeNao{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.6, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('modo novo de leilão', RED, '#fff', 36)}</div>
  <p style="font-size:200px;line-height:1;margin-top:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .4s both, brilha 2.6s ease-in-out 1.6s infinite">🧱</p>
  <p style="${OSW};font-size:130px;text-transform:uppercase;text-align:center;line-height:.95;margin:18px 0 4px;animation:sobe .5s .7s both">leilão de</p>
  <p style="${OSW};font-size:200px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s 1.0s both">clubes</p>
  <p style="font-size:46px;font-weight:700;color:rgba(12,12,12,.62);margin-top:44px;text-align:center;line-height:1.35;animation:sobe .5s 1.7s both">
    você não compra <b style="color:${INK}">um jogador</b>.<br>compra o <b style="color:${GREEN}">setor inteiro</b> de um clube</p>`)}

<!-- ② o lote é um setor -->
${cena(4.6, 10.0, `
  <div style="animation:sobe .4s 4.75s both">${pill('⚡ pregão · ataque', INK, GOLD, 34)}</div>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:26px 0 36px;animation:sobe .45s 4.95s both">cada lote é<br><span style="color:${GREEN}">um pacote</span></p>
  ${pacote('⚡', 'Ataque do', 'Milan', 'M', '#C2452F', 12, 5.4)}
  ${pacote('⚡', 'Ataque do', 'Barcelona', 'B', '#1E3F8C', 18, 5.6)}
  ${pacote('⚡', 'Ataque do', 'Palmeiras', 'P', GREEN, 17, 5.8)}
  <div style="margin-top:34px;width:940px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:24px 30px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 6.8s both">
    <p style="font-size:38px;font-weight:800;line-height:1.4">🙈 No pregão <b>não aparece nome</b>: só o clube e quantos jogadores tem.
      Quem é quem você descobre <b>depois</b>.</p>
  </div>`)}

<!-- ③ o lance e o martelo -->
${cena(10.0, 15.6, `
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:34px;animation:sobe .45s 10.15s both">dá o lance<br><span style="color:${GREEN}">no pacote</span></p>
  <div style="animation:treme .5s ease-in-out 12.9s both">
    ${pacote('⚡', 'Ataque do', 'Milan', 'M', '#C2452F', 12, 10.5, lance(38))}
  </div>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.55);margin:6px 0 34px;animation:sobe .4s 10.9s both">✉️ lance escondido · o maior leva</p>
  <div style="display:flex;align-items:center;gap:26px;width:940px;background:${GREEN};color:#fff;border:6px solid ${INK};border-radius:26px;
    box-shadow:9px 9px 0 ${INK};padding:26px 30px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 12.6s both">
    <span style="font-size:110px;line-height:1;transform-origin:80% 80%;animation:martelo .55s cubic-bezier(.2,1.5,.4,1) 12.5s both">🔨</span>
    <span style="text-align:left"><b style="${OSW};font-size:62px;display:block;line-height:1">VENDIDO!</b>
      <span style="${OSW};font-size:40px;text-transform:uppercase">Ataque do Milan · 38 🪙</span></span>
  </div>
  <p style="${OSW};font-size:58px;margin-top:38px;text-transform:uppercase;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 13.6s both">os 12 atacantes são seus</p>`)}

<!-- ④ um pacote por setor -->
${cena(15.6, 19.6, `
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:40px;animation:sobe .45s 15.75s both">um pacote<br><span style="color:${GREEN}">por setor</span></p>
  ${[['GOL', '🧤 Goleiros do', 'Palmeiras', 'P', GREEN, 7],
     ['LAT', '↔️ Laterais do', 'Barcelona', 'B', '#1E3F8C', 7],
     ['ZAG', '🛡️ Zaga do', 'Flamengo', 'F', '#B01E23', 15],
     ['MEI', '🎯 Meio do', 'Real Madrid', 'R', '#6C5A2B', 14],
     ['ATA', '⚡ Ataque do', 'Milan', 'M', '#C2452F', 12]].map(([pos, s, c, l, cor, n], i) => `
    <div style="display:flex;align-items:center;gap:18px;width:940px;padding:14px 22px;margin-bottom:12px;background:#fff;border:5px solid ${INK};
      border-radius:20px;box-shadow:6px 6px 0 ${INK};animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${(16.1 + i * .3).toFixed(2)}s both">
      <b style="background:${INK};color:#fff;border-radius:10px;padding:4px 14px;${OSW};font-size:30px">${pos}</b>
      ${escudo(l, cor, 50)}
      <b style="${OSW};font-size:38px;text-transform:uppercase;flex:1">${s} ${c}</b>
      <span style="font-size:26px;font-weight:700;color:rgba(12,12,12,.5)">${n}</span>
    </div>`).join('')}
  <p style="font-size:40px;font-weight:800;text-align:center;margin-top:26px;animation:sobe .45s 17.9s both">5 setores = <b style="color:${GREEN}">o time inteiro</b></p>`)}

<!-- ⑤ ⭐ a convocação -->
${cena(19.6, 28.0, `
  <div style="display:flex;align-items:center;gap:22px;width:940px;background:${GOLD};border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};
    padding:16px 26px;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 19.8s both">
    <span style="position:relative;width:130px;height:84px;flex:none">
      ${Array.from({ length: 9 }, (_, k) => `<b style="position:absolute;inset:0;${OSW};font-size:74px;line-height:84px;text-align:center;opacity:0;
        animation:apar .01s linear ${(RELOGIO_T0 + k).toFixed(2)}s both${k < 8 ? `, some .01s linear ${(RELOGIO_T0 + k + 1).toFixed(2)}s both` : ''}">${90 - k}s</b>`).join('')}
    </span>
    <span style="font-size:34px;font-weight:800;line-height:1.25;text-align:left">Não escolheu a tempo? O sistema escolhe o <b>PIOR</b> do pacote pra você.</span>
  </div>
  <p style="${OSW};font-size:74px;text-transform:uppercase;text-align:center;line-height:1;margin:30px 0 22px;animation:sobe .45s 20.2s both">agora você <span style="color:${GREEN}">convoca</span></p>

  <div style="width:940px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};overflow:hidden;animation:sobe .45s 20.6s both">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 20px;background:#FFF4CF;border-bottom:4px solid ${INK}">
      ${escudo('M', '#C2452F', 46)}
      <b style="${OSW};font-size:36px;text-transform:uppercase;flex:1;text-align:left">⚡ Ataque do Milan</b>
      <span style="font-size:26px;font-weight:800;color:rgba(12,12,12,.55)">convoque 3 de 12</span>
    </div>
    ${LISTA.map(n => {
      const a = ATA.find(x => x.nome === n)
      return `<div style="position:relative;display:flex;align-items:center;gap:16px;padding:9px 20px;border-bottom:2px solid rgba(0,0,0,.07)">
        <span style="position:relative;width:40px;height:40px;border:4px solid ${INK};border-radius:10px;flex:none">
          ${a ? `<b style="position:absolute;inset:-4px;border-radius:10px;background:${GREEN};color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0;animation:pop .3s cubic-bezier(.2,1.6,.4,1) ${a.t}s both">✓</b>` : ''}
        </span>
        <b style="${OSW};font-size:34px;text-transform:uppercase;flex:1;text-align:left">${n}</b>
        ${a ? `<span style="position:absolute;inset:0;background:#E9F5EC;z-index:-1;opacity:0;animation:apar .01s linear ${a.t}s both"></span>` : ''}
      </div>`
    }).join('')}
  </div>

  <!-- o campinho: o rosto cai na grama, igual ao da carreira -->
  <div style="width:940px;height:330px;margin-top:22px;background:repeating-linear-gradient(180deg,#1B7A3D 0 48px,#166332 48px 96px);
    border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};display:flex;justify-content:space-around;align-items:flex-end;padding:0 20px 16px;
    animation:sobe .45s 21.0s both">
    ${ATA.map(a => `<div style="width:260px;text-align:center;animation:cai .55s cubic-bezier(.2,1.5,.4,1) ${(a.t + .15).toFixed(2)}s both">
      <img src="${rosto(a.f)}" style="width:250px;height:auto;display:block;margin:0 auto -6px;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.4))">
      <b style="${OSW};font-size:28px;color:#fff;text-transform:uppercase;text-shadow:2px 2px 0 ${INK},-2px 2px 0 ${INK},2px -2px 0 ${INK},-2px -2px 0 ${INK}">
        <span style="font-size:.7em;background:${INK};border-radius:6px;padding:0 6px;margin-right:6px;text-shadow:none">ATA</span>${a.nome.split(' ').pop()}</b>
    </div>`).join('')}
  </div>`)}

<!-- ⑥ o castigo + as sobras -->
${cena(28.0, 32.0, `
  <p style="font-size:120px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 28.15s both">⏱️</p>
  <p style="${OSW};font-size:90px;text-transform:uppercase;text-align:center;line-height:1;margin:18px 0 16px;animation:sobe .45s 28.4s both">
    enrolou?<br><span style="color:${RED}">leva o pior</span></p>
  <p style="font-size:42px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.35;animation:sobe .45s 28.8s both">
    são <b style="color:${INK}">90 segundos</b>. vaga que ficar vazia,<br>o sistema preenche com o <b style="color:${INK}">pior do pacote</b></p>
  <div style="display:flex;gap:24px;margin-top:46px">
    <div style="width:440px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.6s both">
      <div style="font-size:80px">🤖</div>
      <div style="${OSW};font-size:40px;margin-top:6px;text-transform:uppercase">quem sobra</div>
      <div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:6px">vai reforçar os bots</div>
    </div>
    <div style="width:440px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.95s both">
      <div style="font-size:80px">🚫🦵</div>
      <div style="${OSW};font-size:40px;margin-top:6px;text-transform:uppercase">perna-de-pau?</div>
      <div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:6px">nunca. só jogador de verdade</div>
    </div>
  </div>`)}

<!-- ⑦ envelope ou tocaia + onde jogar + marca -->
${cena(32.0, 40, `
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:26px;animation:sobe .45s 32.15s both">do seu jeito</p>
  <div style="display:flex;gap:22px">
    <div style="width:436px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:24px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 32.5s both">
      <div style="font-size:70px">✉️</div><div style="${OSW};font-size:42px;text-transform:uppercase">envelope cego</div></div>
    <div style="width:436px;background:${G_OURO};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:24px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 32.8s both">
      <div style="font-size:70px">🐊</div><div style="${OSW};font-size:42px;text-transform:uppercase">tocaia</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center;margin-top:40px">
    <div style="width:820px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 33.4s both">⚡ partida rápida · <span style="color:${GREEN}">já liberado</span></div>
    <div style="width:820px;background:#EDE4FF;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;color:${ROXO};animation:entra .45s cubic-bezier(.2,1.5,.4,1) 33.7s both">🌐 sala online · em breve</div>
  </div>
  <div style="margin-top:40px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 34.3s both">${pill('marque 🧱 clubes ao criar', GREEN, '#fff', 36)}</div>
  <p style="${OSW};font-size:64px;margin-top:54px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34.8s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-clubes-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-clubes-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(38300)
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
