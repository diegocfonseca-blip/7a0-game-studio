// ─── 🎬 REELS 1080×1920: 👑 ENTRADA DE GALA ───────────────────────────────────
// Pedido do Diego (28/09): *"preciso de um vídeo mostrando a entrada de gala..
// mostra o neymarzetti e alguns outros.. explique aonde aparece e etc.. e pra quem
// tem batismo. Tudo no padrão que costumamos fazer"*. Mesmo molde do
// `video-clubes-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg).
//
// ✅ O show é o MESMO da sala (`entrada-gala.tsx`): escurece, holofote, escudo no
// telão, "👑 CHEGOU NA SALA", o grito "Ô Ô Ô" e a mascote atravessando — só que
// no tamanho do reels. As artes são as de verdade (`src/escalacao/img/`).
// 🚫 Sem nº de sócio/fundador (ordem do Diego, 28/09).
// 📧 Vale pela CONTA do dono (e-mail do batismo), nunca pelo nome digitado.
//
// 🎞️ Roteiro (~47 s) — os 4 clubes foram escolhidos pelo Diego (28/09):
//   0,0– 4,6   👑 chegou a ENTRADA DE GALA
//   4,6– 9,6   onde: sala online, enquanto ela enche → o Neymarzetti chegou
//   9,6–15,6   🎬 a gala do Neymarzetti (tela inteira, a sala toda vê)
//  15,6–21,6   🎬 Murriz FC — chegou mais de um? um de cada vez
//  21,6–27,6   🎬 Internacional de Madrid — cada clube com a sua mascote
//  27,6–33,6   🎬 Meia na Canela (ex-Jurubeba) — trocou o nome, a gala vai junto
//  33,6–38,6   e fica DOURADO na lista, com a mascote pulando
//  38,6–43,0   pra quem: só batismo, pela conta · não atrasa nada
//  43,0–47,5   toca no escudo → "quero entrar assim também" + marca
//
//   node scripts/video-gala-reels.mjs [--saida gala-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'gala-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const art = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}.webp`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const GALA_S = 5.6

const CLUBES = {
  ney: { nome: 'Neymarzetti', curto: 'NEYMARZETTI', esc: art('neymarzetti-escudo'), mas: art('neymarzetti-mascote'), tec: 'Diego' },
  murriz: { nome: 'Murriz FC', curto: 'MURRIZ', esc: art('murriz-escudo'), mas: art('murriz-mascote') },
  inter: { nome: 'Internacional de Madrid', curto: 'INTERNACIONAL', esc: art('internacional-madrid-escudo'), mas: art('internacional-madrid-mascote') },
  meia: { nome: 'Meia na Canela de Desportos', curto: 'MEIA NA CANELA', esc: art('jurubeba-escudo'), mas: art('jurubeba-mascote') },
}

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html, fundo = '') => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both;${fundo}">${html}</div>`

// 🎬 o show da sala, em tamanho de reels (mesmos passos do `entrada-gala.tsx`)
const gala = (c, t0, legenda) => `
  <div style="position:absolute;inset:0;background:${CREME}">${sala([['P', 'Pastel United'], ['T', 'Tocaia do Zé'], ['B', 'Bolacha FC']], [], 0)}</div>
  <div class="g-show" style="animation-delay:${t0}s">
    <div class="g-escuro"></div><div class="g-feixe" style="animation-delay:${t0}s"></div>
    <div class="g-telao" style="animation-delay:${t0}s">
      <img src="${c.esc}" style="height:430px;filter:drop-shadow(0 0 50px rgba(255,196,0,.85)) drop-shadow(8px 10px 0 #000)">
      <p style="${OSW};font-size:40px;letter-spacing:8px;color:${GOLD};margin-top:20px">👑 CHEGOU NA SALA</p>
      <p style="${OSW};font-size:${c.nome.length > 18 ? 76 : 104}px;line-height:1;color:#fff;text-transform:uppercase;margin-top:12px;text-shadow:6px 6px 0 #000;padding:0 40px">${c.nome}</p>
    </div>
    <p class="g-grito" style="animation-delay:${t0}s">🔊 Ô Ô Ô, ${c.curto}! 🔊</p>
    <div class="g-masc" style="animation-delay:${t0}s"><img src="${c.mas}" style="height:520px;filter:drop-shadow(8px 12px 0 rgba(0,0,0,.5))"></div>
  </div>
  ${legenda ? `<div style="position:absolute;left:0;right:0;top:70px;text-align:center;z-index:5;animation:sobe .45s ${(t0 + .9).toFixed(2)}s both">${legenda}</div>` : ''}`

// 📱 a sala de espera (lista de técnicos) como no jogo
const linhaNormal = (letra, nome) => `
  <div style="display:flex;align-items:center;gap:20px;padding:16px 20px;margin-bottom:14px;background:#fff;border:4px solid ${INK};border-radius:18px">
    <b style="width:64px;height:64px;border-radius:50%;background:#E9DFC4;border:4px solid ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-size:34px">${letra}</b>
    <b style="${OSW};font-size:38px;text-transform:uppercase;flex:1;text-align:left">${nome}</b>
  </div>`
const linhaGala = (c, atraso = 0) => `
  <div class="g-linha" style="display:flex;align-items:center;gap:18px;padding:10px 16px;margin-bottom:14px;${atraso ? `animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both` : ''}">
    <img src="${c.esc}" style="height:76px;position:relative;z-index:1">
    <b style="${OSW};font-size:${c.nome.length > 18 ? 30 : 38}px;text-transform:uppercase;flex:1;text-align:left;position:relative;z-index:1;line-height:1.05">${c.nome}</b>
    <span class="g-pula"><img src="${c.mas}" style="height:96px;margin:-10px 0 -14px"></span>
  </div>`
const sala = (normais, galas, atraso) => `
  <div style="width:820px;margin:0 auto;background:${CREME};border:6px solid ${INK};border-radius:34px;box-shadow:10px 10px 0 ${INK};overflow:hidden">
    <div style="background:${INK};color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:center">
      <b style="${OSW};font-size:34px">🌐 SALA K7Q2PX</b><span style="${OSW};font-size:28px;color:${GOLD}">ESPERANDO · 6/8</span>
    </div>
    <div style="padding:22px 24px 10px">
      <p style="${OSW};font-size:30px;letter-spacing:.1em;color:rgba(12,12,12,.55);text-align:left;margin-bottom:14px">TÉCNICOS NA SALA</p>
      ${galas.map((c, i) => linhaGala(c, atraso ? atraso + i * .35 : 0)).join('')}
      ${normais.map(([l, n]) => linhaNormal(l, n)).join('')}
    </div>
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
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 45px rgba(255,196,0,.9))}}
@keyframes toque{0%,100%{transform:scale(1)}50%{transform:scale(.86)}}
/* 🎬 o show — cópia em escala do entrada-gala.tsx */
.g-show{position:absolute;inset:0;overflow:hidden;opacity:0;animation:gIn ${GALA_S}s ease both}
@keyframes gIn{0%{opacity:0}6%{opacity:1}88%{opacity:1}100%{opacity:0}}
.g-escuro{position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 50% 40%,rgba(40,30,5,.72),rgba(0,0,0,.96) 70%)}
.g-feixe{position:absolute;left:50%;top:-80px;width:900px;height:1400px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(255,240,190,.55),rgba(255,240,190,0));clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);opacity:0;animation:gFeixe ${GALA_S}s ease both}
@keyframes gFeixe{0%,6%{opacity:0}14%{opacity:1}85%{opacity:1}100%{opacity:0}}
.g-telao{position:absolute;left:50%;top:300px;width:1080px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3);animation:gTelao ${GALA_S}s cubic-bezier(.2,1.3,.4,1) both}
@keyframes gTelao{0%,12%{opacity:0;transform:translateX(-50%) scale(.3)}22%{opacity:1;transform:translateX(-50%) scale(1.08)}28%{transform:translateX(-50%) scale(1)}86%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.g-grito{position:absolute;left:0;right:0;top:1240px;text-align:center;${OSW};font-size:66px;color:${GOLD};text-shadow:4px 4px 0 #000;opacity:0;animation:gGrito ${GALA_S}s ease both;padding:0 30px}
@keyframes gGrito{0%,30%{opacity:0;transform:scale(.6)}36%{opacity:1;transform:scale(1.15)}40%{transform:scale(1)}80%{opacity:1}88%{opacity:0}}
.g-masc{position:absolute;bottom:40px;left:-600px;animation:gMasc ${GALA_S}s ease-in-out both}
@keyframes gMasc{0%,24%{left:-600px}34%{left:90px}40%{left:240px;transform:rotate(-6deg)}46%{transform:rotate(6deg)}52%{transform:rotate(0)}70%{left:240px}90%{left:1200px}100%{left:1200px}}
.g-linha{position:relative;overflow:hidden;background:linear-gradient(120deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70);border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK}}
.g-linha:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.75) 48%,transparent 62%);background-size:250% 100%;animation:gBrilho 2.6s linear infinite}
@keyframes gBrilho{from{background-position:120% 0}to{background-position:-120% 0}}
.g-pula{display:inline-flex;animation:gPula 1.2s ease-in-out infinite;position:relative;z-index:1}
@keyframes gPula{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.6, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('novo · só pra quem tem batismo', RED, '#fff', 34)}</div>
  <p style="font-size:210px;line-height:1;margin-top:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .4s both, brilha 2.6s ease-in-out 1.6s infinite">👑</p>
  <p style="${OSW};font-size:130px;text-transform:uppercase;text-align:center;line-height:.95;margin:18px 0 4px;animation:sobe .5s .7s both">entrada de</p>
  <p style="${OSW};font-size:230px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s 1.0s both">gala</p>
  <p style="font-size:48px;font-weight:700;color:rgba(12,12,12,.62);margin-top:44px;text-align:center;line-height:1.35;animation:sobe .5s 1.7s both">
    dono de batismo <b style="color:${INK}">não entra</b> na sala.<br>ele faz <b style="color:${GREEN}">ENTRADA</b>.</p>`)}

<!-- ② onde -->
${cena(4.6, 9.6, `
  <div style="animation:sobe .4s 4.75s both">${pill('📍 onde acontece', INK, GOLD, 34)}</div>
  <p style="${OSW};font-size:82px;text-transform:uppercase;text-align:center;line-height:1;margin:24px 0 34px;animation:sobe .45s 4.95s both">na sala <span style="color:${GREEN}">online</span>,<br>enquanto ela enche</p>
  <div style="animation:sobe .5s 5.3s both">${sala([['P', 'Pastel United'], ['T', 'Tocaia do Zé'], ['B', 'Bolacha FC']], [], 0)}</div>
  <div style="margin-top:34px;display:flex;align-items:center;gap:20px;background:${INK};color:#fff;border:5px solid ${GOLD};border-radius:24px;padding:20px 30px;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 7.6s both">
    <span style="font-size:60px">🚪</span><b style="${OSW};font-size:44px;text-transform:uppercase">o <span style="color:${GOLD}">Neymarzetti</span> tá chegando…</b>
  </div>`)}

<!-- ③ Neymarzetti -->
${cena(9.6, 15.6, gala(CLUBES.ney, 9.7, pill('a sala inteira vê 👀', GOLD, INK, 34)), 'padding:0')}

<!-- ④ Murriz -->
${cena(15.6, 21.6, gala(CLUBES.murriz, 15.7, pill('chegou mais de um? um de cada vez', GOLD, INK, 32)), 'padding:0')}

<!-- ④b Internacional de Madrid -->
${cena(21.6, 27.6, gala(CLUBES.inter, 21.7, pill('cada clube com a sua mascote', GOLD, INK, 32)), 'padding:0')}

<!-- ⑤ Meia na Canela (ex-Jurubeba) -->
${cena(27.6, 33.6, gala(CLUBES.meia, 27.7, pill('trocou o nome do clube? a gala vai junto', GOLD, INK, 30)), 'padding:0')}

<!-- ⑥ dourado na lista -->
${cena(33.6, 38.6, `
  <div style="animation:sobe .4s 33.75s both">${pill('✨ e fica assim na lista', INK, GOLD, 34)}</div>
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin:24px 0 34px;animation:sobe .45s 33.95s both">linha <span style="color:#E8A200">dourada</span><br>e a mascote pulando</p>
  <div style="animation:sobe .5s 34.2s both">${sala([['P', 'Pastel United'], ['T', 'Tocaia do Zé']], [CLUBES.ney, CLUBES.murriz, CLUBES.inter, CLUBES.meia], 34.4)}</div>`)}

<!-- ⑦ pra quem -->
${cena(38.6, 43, `
  <p style="font-size:130px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 38.75s both">🔑</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin:18px 0 34px;animation:sobe .45s 39s both">
    só pra quem<br>tem <span style="color:${GREEN}">batismo</span></p>
  ${[['📧', 'vale pela <b>sua conta</b>', 'escrever o nome de um batismo não adianta'],
     ['👑', 'escudo, mascote e manto <b>seus</b>', 'em toda sala que você entrar'],
     ['⏱️', '<b>não atrasa</b> o jogo', 'acontece enquanto a sala enche']].map(([ic, t, s], i) => `
    <div style="display:flex;align-items:center;gap:24px;width:940px;padding:20px 26px;margin-bottom:16px;text-align:left;background:#fff;
      border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${(39.4 + i * .35).toFixed(2)}s both">
      <span style="font-size:64px">${ic}</span>
      <span><b style="${OSW};font-weight:500;font-size:44px;display:block;line-height:1.1;text-transform:uppercase">${t}</b>
        <span style="font-size:30px;font-weight:700;color:rgba(12,12,12,.55)">${s}</span></span>
    </div>`).join('')}`)}

<!-- ⑧ toque + marca -->
${cena(43, 51, `
  <p style="${OSW};font-size:78px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:30px;animation:sobe .45s 43.15s both">quer entrar<br><span style="color:#E8A200">assim também?</span></p>
  <div style="width:820px;animation:sobe .45s 43.4s both">${linhaGala(CLUBES.ney)}</div>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin:6px 0 18px;animation:sobe .4s 43.7s both">👆 toca no escudo dourado</p>
  <div style="width:820px;background:${INK};color:#fff;border:5px solid ${GOLD};border-radius:24px;padding:24px 28px;text-align:left;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 44.2s both">
    <p style="font-size:32px;font-weight:700;line-height:1.4">O <b style="color:${GOLD}">Neymarzetti</b> tem escudo, mascote e manto próprios — e entra assim em toda sala.</p>
    <div style="margin-top:16px;background:${GOLD};color:${INK};border:4px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:16px;text-align:center;
      ${OSW};font-size:40px;text-transform:uppercase;animation:toque .5s ease-in-out 45.3s 2">👑 quero entrar assim também</div>
  </div>
  <div style="margin-top:36px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 45.8s both">${pill('faça o batismo do seu clube', GREEN, '#fff', 36)}</div>
  <p style="${OSW};font-size:64px;margin-top:40px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 46.2s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-gala-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-gala-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(48300)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
