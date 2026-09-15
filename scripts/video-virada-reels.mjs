// ─── 🎬 REELS 1080×1920: A VIRADA DA TEMPORADA EM PASSOS + O BICO DE FOLGA ──
// Pedido do Diego (15/09): *"quero um vídeo também de mockup daquele padrão, com arte
// da carteira de trabalho, e historinhas engraçadas, contando como funciona também as
// regras"*.
//
// Mesma técnica dos outros reels do repo (`video-loja-reels.mjs`): as cenas são
// keyframes de CSS, o Playwright GRAVA A TELA e o ffmpeg converte pra mp4. Sem voz.
//
// ⚖️ A CARTEIRA DE TRABALHO é desenhada aqui em CSS, igual ao jogo — nenhum arquivo de
// arte novo (a regra de peso do repo vale pro post também, e cena em CSS é 0 KB).
// 👷 O selo da capa é o emoji de trabalhador, e a carteira NÃO fala em futebol: correção
// dele, *"dá a entender que é carteira de trabalho do futebol, e estamos falando de bico
// apenas aqui"*.
//
// 😂 AS HISTORINHAS SÃO AS DO JOGO, palavra por palavra (`src/escalacao/bico.ts`) — o
// vídeo promete exatamente o texto que a pessoa vai ler na tela. A graça é o ARCO: ele
// começa lavando carro, vira gerente, esnoba quando o clube sobe e volta de boné na mão
// quando cai. Regra permanente: a história é sempre sobre o TÉCNICO (você), nunca sobre
// o dono da marca — são negócios de amigos de verdade do Diego.
//
// 🎞️ Roteiro (~37 s):
//   0,0–3,6    a virada da temporada mudou
//   3,6–9,0    os 5 passos, um por um
//   9,0–13,4   quem aparece toda temporada × quem só quando muda alguma coisa
//   13,4–17,8  💰 o que cai no caixa quando você aperta COMEÇAR
//   17,8–22,4  🛍️ a camisa na vitrine e o preço
//   22,4–26,8  🕴️ o bico ganhou carteira de trabalho
//   26,8–31,0  😂 a escada: lavador → vendedor → gerente
//   31,0–35,4  😂 o esnobe e a volta humilde
//   35,4–46    marca
//
//   node scripts/video-virada-reels.mjs [--saida virada-reels.mp4] [--chegando]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
import { camisa, img, LOGO_VADICO } from './loja-pecas.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'virada-reels.mp4')
// ⏳ este nasce DEPOIS do deploy geral, então o padrão é "já está no ar";
// `--chegando` volta pro aviso de novidade futura, se algum dia precisar.
const CHEGANDO = process.argv.includes('--chegando')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', AZUL = '#16233F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const CAMISA = (alt) => camisa({
  arte: img('public/mantos-salao/finalboss-camisa.webp'), alt, escudo: '',
  fornecedor: 'Naique', fornSimbolo: '✓', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.22, masterH: 0.155, masterCor: INK,
  pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
})

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

// um passo da fila, no formato de fileira
const passo = (n, ic, nome, atraso, destaque) => `
  <div style="display:flex;align-items:center;gap:20px;width:900px;background:${destaque ? GOLD : '#fff'};
    border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:16px 26px;
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="flex:none;width:70px;height:70px;border:5px solid ${INK};border-radius:18px;background:${destaque ? '#fff' : GOLD};
      display:flex;align-items:center;justify-content:center;${OSW};font-size:40px">${n}</span>
    <span style="font-size:52px;line-height:1;flex:none">${ic}</span>
    <span style="${OSW};font-size:46px;text-transform:uppercase;text-align:left;flex:1">${nome}</span>
  </div>`

// 🕴️ A CARTEIRA DE TRABALHO — a mesma que o jogo desenha, em tamanho de cinema
const carteira = ({ empregador, cargo, admissao, paga }) => `
  <div style="display:flex;width:880px;border:8px solid #0A1024;border-radius:20px;overflow:hidden;
    box-shadow:0 26px 34px rgba(0,0,0,.55);transform:rotate(-1.5deg)">
    <div style="width:38%;background:linear-gradient(145deg,${AZUL},#0E1830);padding:34px 22px;text-align:center;
      border-right:6px solid #0A1024;color:#fff">
      <div style="width:104px;height:104px;margin:0 auto 20px;border:7px solid ${GOLD};border-radius:999px;
        display:flex;align-items:center;justify-content:center;font-size:52px">👷</div>
      <div style="${OSW};font-size:30px;line-height:1.12;color:${GOLD};letter-spacing:.05em">CARTEIRA<br>DE TRABALHO</div>
      <div style="${OSW};font-weight:400;font-size:19px;line-height:1.25;color:rgba(255,255,255,.62);margin-top:12px;
        letter-spacing:.05em">REGISTRO DO<br>BICO DE FOLGA</div>
      <div style="margin-top:22px;border-top:2px solid rgba(255,255,255,.22);padding-top:14px;
        ${OSW};font-weight:400;font-size:18px;color:rgba(255,255,255,.5)">Nº 007-2027</div>
    </div>
    <div style="flex:1;background:#F6EFDC;padding:26px 28px 22px;color:${INK}">
      <div style="${OSW};font-size:21px;letter-spacing:.1em;text-align:center;color:#6B6552;
        border-bottom:2px solid #B9AB8A;padding-bottom:12px">CONTRATO DE TRABALHO</div>
      ${[['EMPREGADOR', empregador], ['CARGO', cargo], ['ADMISSÃO', admissao]].map(([k, v]) => `
        <div style="margin-top:17px">
          <div style="${OSW};font-weight:400;font-size:17px;letter-spacing:.08em;color:#8A7F63">${k}</div>
          <div style="${OSW};font-size:33px;line-height:1.15;border-bottom:2px solid #C9BB99;padding-bottom:4px">${v}</div>
        </div>`).join('')}
      <div style="margin-top:20px;text-align:center;border:5px solid ${INK};border-radius:16px;background:#fff;padding:10px 0">
        <div style="${OSW};font-weight:400;font-size:17px;letter-spacing:.08em;color:#8A7F63">REMUNERAÇÃO</div>
        <div style="${OSW};font-size:50px;line-height:1.05">+${paga} 🪙</div>
        <div style="${OSW};font-weight:400;font-size:20px;color:#6B6552">por temporada</div>
      </div>
    </div>
  </div>`

// 😂 um balão de historinha (texto DO JOGO, entre aspas)
const balao = (txt, atraso, cor = '#fff') => `
  <div style="width:940px;background:${cor};border:7px solid ${INK};border-radius:28px;box-shadow:8px 8px 0 ${INK};
    padding:26px 32px;animation:sobe .5s cubic-bezier(.2,1.4,.4,1) ${atraso}s both">
    <p style="font-size:36px;font-weight:800;line-height:1.35;color:${INK};font-style:italic">“${txt}”</p>
  </div>`

// um degrau da carreira dentro da empresa
const degrau = (div, cargo, moedas, atraso, cor) => `
  <div style="display:flex;align-items:center;gap:18px;width:900px;background:#fff;border:6px solid ${INK};
    border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:15px 24px;
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="flex:none;${OSW};font-size:30px;background:${cor};color:#fff;border:4px solid ${INK};
      border-radius:14px;padding:5px 16px">${div}</span>
    <span style="${OSW};font-size:42px;text-transform:uppercase;flex:1;text-align:left">${cargo}</span>
    <span style="${OSW};font-size:40px;color:${GREEN};white-space:nowrap">+${moedas} 🪙</span>
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
</style><body>

<!-- ① a virada mudou -->
${cena(0, 3.6, `
  <p style="font-size:132px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .15s both">🪜</p>
  <p style="${OSW};font-size:112px;text-transform:uppercase;text-align:center;line-height:.98;margin-top:22px;
    animation:sobe .5s .4s both">a virada<br><span style="color:${GREEN}">virou fila</span></p>
  <p style="font-size:40px;font-weight:800;color:rgba(12,12,12,.62);margin-top:26px;text-align:center;line-height:1.3;
    animation:sobe .5s .8s both">antes de começar a temporada,<br>uma decisão de cada vez</p>`)}

<!-- ② os 5 passos -->
${cena(3.6, 9.0, `
  <p style="${OSW};font-size:74px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:26px;
    animation:sobe .45s 3.75s both">são <span style="color:${GREEN}">cinco passos</span></p>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center">
    ${passo(1, '🏆', 'Patrocinador Master', 4.05)}
    ${passo(2, '🤝', 'Patrocinador Pontual', 4.25)}
    ${passo(3, '👟', 'Fornecedor de material', 4.45)}
    ${passo(4, '🛍️', 'Venda de camisas', 4.65)}
    ${passo(5, '🕴️', 'Bico de folga', 4.85)}
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:28px;text-align:center;
    animation:sobe .45s 5.6s both">e só aparece quem tem decisão pra tomar</p>`)}

<!-- ③ quem cai toda temporada × quem espera -->
${cena(9.0, 13.4, `
  <p style="${OSW};font-size:72px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:26px;
    animation:sobe .45s 9.15s both">quem aparece<br><span style="color:${GREEN}">quando</span></p>
  <div style="width:940px;background:${GREEN};border:7px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};
    padding:24px 30px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 9.5s both">
    <p style="${OSW};font-size:40px;color:#fff;text-transform:uppercase">🔁 toda temporada</p>
    <p style="font-size:34px;font-weight:800;color:rgba(255,255,255,.92);margin-top:8px">🤝 Pontual · 🛍️ venda de camisas</p>
  </div>
  <div style="width:940px;background:#fff;border:7px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};
    padding:24px 30px;margin-top:20px;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 9.9s both">
    <p style="${OSW};font-size:40px;text-transform:uppercase">⏳ só quando muda alguma coisa</p>
    <p style="font-size:33px;font-weight:800;color:rgba(12,12,12,.7);margin-top:8px;line-height:1.35">
      🏆 Master e 👟 fornecedor: quando o contrato acaba<br>🕴️ bico: quando você sobe ou cai de divisão</p>
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:26px;text-align:center;line-height:1.3;
    animation:sobe .45s 11.2s both">nada de repetir decisão que já está fechada</p>`)}

<!-- ④ o que cai no caixa ao COMEÇAR -->
${cena(13.4, 17.8, `
  <p style="font-size:120px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 13.55s both">💰</p>
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 10px;
    animation:sobe .45s 13.8s both">apertou <span style="color:${GREEN}">começar</span>,<br>o caixa já sobe</p>
  <p style="font-size:35px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:24px;text-align:center;
    animation:sobe .45s 14.1s both">contrato assinado não espera o fim do ano</p>
  <div style="display:flex;flex-direction:column;gap:13px;align-items:center">
    ${passo('🏆', '', 'Master', 14.4, true)}
    ${passo('👟', '', 'Fornecedor de material', 14.6, true)}
    ${passo('🕴️', '', 'Bico de folga', 14.8, true)}
  </div>
  <p style="font-size:33px;font-weight:800;color:rgba(12,12,12,.6);margin-top:26px;text-align:center;line-height:1.35;
    animation:sobe .45s 15.5s both">o 🤝 Pontual e a 🛍️ camisa continuam no fim —<br>são aposta, precisam saber como o ano terminou</p>`)}

<!-- ⑤ a camisa na vitrine -->
${cena(17.8, 22.4, `
  <p style="${OSW};font-size:78px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:8px;
    animation:sobe .45s 17.95s both">a sua camisa<br><span style="color:${GREEN}">na vitrine</span></p>
  <p style="font-size:35px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:22px;text-align:center;
    animation:sobe .45s 18.25s both">e o preço é escolha sua, antes de começar</p>
  <div style="position:relative;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 18.55s both;
    border:7px solid ${INK};border-radius:30px;box-shadow:9px 9px 0 ${INK};padding:20px 40px 10px;background:
      radial-gradient(120% 70% at 50% 4%,rgba(255,213,120,.42) 0%,rgba(255,196,0,.10) 38%,transparent 66%),
      linear-gradient(#2A1B10 0%,#40281680 34%,#1A0F08 100%),
      repeating-linear-gradient(90deg,#3A2414 0 26px,#331F11 26px 52px)">
    <div style="${OSW};font-size:24px;letter-spacing:.24em;color:#F0DFAE;text-transform:uppercase;text-align:center;margin-bottom:10px">· Loja do Clube ·</div>
    <div style="display:flex;justify-content:center;filter:drop-shadow(0 16px 20px rgba(0,0,0,.6))">${CAMISA(420)}</div>
    <div style="position:absolute;right:34px;top:150px;transform:rotate(7deg);background:${GOLD};border:6px solid ${INK};
      border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:10px 22px;text-align:center">
      <div style="${OSW};font-weight:400;font-size:19px;letter-spacing:.14em;text-transform:uppercase">preço</div>
      <div style="${OSW};font-size:44px;line-height:1">3 🪙</div>
      <div style="${OSW};font-size:21px;text-transform:uppercase">cara</div>
    </div>
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.66);margin-top:24px;text-align:center;line-height:1.3;
    animation:sobe .45s 20.2s both">camisa barata a torcida toda leva.<br>camisa cara, campeão vende que é uma beleza.</p>`)}

<!-- ⑥ a carteira de trabalho -->
${cena(22.4, 26.8, `
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:8px;
    animation:sobe .45s 22.55s both">o bico agora tem<br><span style="color:${GREEN}">carteira assinada</span></p>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:26px;text-align:center;
    animation:sobe .45s 22.85s both">com o cargo e o salário anotados</p>
  <div style="animation:pop .55s cubic-bezier(.2,1.6,.4,1) 23.15s both">
    ${carteira({ empregador: 'Vadico Veículos', cargo: 'gerente da loja', admissao: 'T7 · Série C', paga: 10 })}
  </div>`)}

<!-- ⑦ a escada dentro da empresa -->
${cena(26.8, 31.0, `
  <p style="${OSW};font-size:74px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:10px;
    animation:sobe .45s 26.95s both">e você <span style="color:${GREEN}">sobe lá também</span></p>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.62);margin-bottom:26px;text-align:center;
    animation:sobe .45s 27.25s both">cada degrau do clube é um degrau no emprego</p>
  <div style="display:flex;flex-direction:column;gap:16px;align-items:center">
    ${degrau('VÁRZEA', 'lavador de carro', 5, 27.55, '#8A1E1E')}
    ${degrau('SÉRIE D', 'vendedor do pátio', 7, 27.85, '#B8860B')}
    ${degrau('SÉRIE C', 'gerente da loja', 10, 28.15, GREEN)}
  </div>`)}

<!-- ⑧ o esnobe e a volta -->
${cena(31.0, 35.4, `
  <p style="${OSW};font-size:70px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:22px;
    animation:sobe .45s 31.15s both">chegou na <span style="color:${GREEN}">série b</span>?<br>ele larga o bico 🎩</p>
  ${balao('Devolveu o crachá sem olhar pra trás: agora eu compro o carro, não vendo.', 31.5)}
  <p style="${OSW};font-size:52px;text-transform:uppercase;margin:24px 0 18px;color:${RED};
    animation:sobe .45s 32.6s both">…e se cair de novo 😅</p>
  ${balao('Voltou com o boné na mão perguntar se ainda tinha vaga. Tinha. O pessoal não falou nada — mas guardaram o balde do lado da sua mesa, só de sacanagem.', 32.9, '#FFF1EE')}`)}

<!-- ⑨ marca -->
${cena(35.4, 50, `
  <p style="font-size:140px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 35.55s both">🪜</p>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 32px;
    animation:sobe .45s 35.85s both">no <span style="color:${GREEN}">modo carreira</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 36.3s both">${pill(CHEGANDO ? 'chegando' : 'já está no ar', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:58px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 36.8s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-virada-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-virada-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(38600)
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
