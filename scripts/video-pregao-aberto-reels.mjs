// ─── 🎬 REELS 1080×1920: 🔨 PREGÃO ABERTO (EM TESTE) ─────────────────────────
// Pedido do Diego (17/10), no dia em que o modo foi liberado pra todos: *"me mande também um vídeo sobre o
// leilão"* → e depois *"o vídeo tá saindo cortado… quero no padrão também dos outros que sempre fazemos"*.
// O padrão é este: reel animado 1080×1920 em cenas (molde do `video-tocaia-reels.mjs`), não gravação da tela.
//
// 🎯 O CORAÇÃO DO VÍDEO é a cena ③: a carta COBERTA na mesa, os lances subindo à vista de todos, o relógio
// zerando a cada lance, "uma… duas… três… VENDIDO!" e a carta VIRANDO (só aí aparece a categoria).
//
// ✅ AS REGRAS SÃO AS DO JOGO (script .mjs não importa .tsx, então ficam espelhadas aqui — mudou lá, muda aqui):
//   martelo em 5s sem lance novo (`PA_MARTELO_MS`) · a carta abre em 1 (`PA_ABRE`) · duas mesas a partir de
//   11 clubes (`PA_DUPLO_A_PARTIR`) · sem Monte: vaga vazia ganha jogador de graça (`paCompletaElencos`).
//   A carta do exemplo é a de verdade: Romário · Vasco · 2000 · Lenda (data.ts).
//
// 🎞️ Roteiro (~42 s):
//   0,0– 4,4   🔨 CHEGOU O PREGÃO ABERTO (em teste)
//   4,4– 8,4   agora são 3 jeitos: envelope · tocaia · pregão aberto
//   8,4–20,8   ⭐ A MESA: carta coberta, lances, relógio, VENDIDO e a carta vira
//  20,8–25,0   a carta vem coberta: quem conhece futebol leva vantagem
//  25,0–29,0   sala grande? duas cartas na mesa (11+ clubes)
//  29,0–32,4   sem Monte: vaga vazia ganha jogador de graça
//  32,4–36,0   combina com 🧱 Clubes e 🤝 Duplas
//  36,0–42,0   onde jogar + marca
//
//   node scripts/video-pregao-aberto-reels.mjs [--saida scripts/posts/pregao-aberto-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/pregao-aberto-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const DURACAO = 42

// as regras do jogo (espelho do store.tsx)
const MARTELO_S = 5, DUAS_MESAS_A_PARTIR = 11

// ⭐ cena ③: quem lança e quando (o relógio volta pros 5s a cada lance)
const C3 = 8.4, C3_FIM = 20.8
const LANCES = [
  { t: 10.0, quem: 'Leão da Estradinha', v: 3 },
  { t: 10.7, quem: 'Arrogantchi FC', v: 8 },
  { t: 11.4, quem: 'Seu Time FC', v: 12, eu: true },
  { t: 12.1, quem: 'Neymarzetti', v: 15 },
  { t: 12.8, quem: 'Seu Time FC', v: 19, eu: true },
  { t: 13.5, quem: 'Labubu FC', v: 22 },
  { t: 14.2, quem: 'Seu Time FC', v: 24, eu: true },
]
const ULT = LANCES[LANCES.length - 1]
const T_VENDIDO = ULT.t + MARTELO_S - 0.6 // o relógio corre no tempo de verdade depois do último lance
const T_VIRA = T_VENDIDO + 0.35

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const janela = (ini, fim, html, extra = '') => `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:14px;opacity:0;
  animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both;${extra}">${html}</div>`

// 🃏 carta COBERTA (igual à do jogo: só nome, clube, ano e posição) e a mesma carta VIRADA
const coberta = (nome, clube, pos, w = 430) => `
  <div style="position:relative;width:${w}px;aspect-ratio:5/7;border:7px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;
    background:repeating-linear-gradient(135deg,#E7DEC6 0 26px,#DED3B6 26px 52px)">
    <span style="position:absolute;top:20px;left:20px;background:${INK};color:#fff;border-radius:12px;padding:2px 14px;${OSW};font-size:${w * .07}px">${pos}</span>
    <span style="position:absolute;top:20px;right:18px;background:#fff;border:4px solid ${INK};border-radius:12px;padding:0 12px;${OSW};font-size:${w * .055}px">❓ categoria</span>
    <div style="position:absolute;top:22%;left:50%;transform:translateX(-50%);width:46%;aspect-ratio:1;border-radius:50%;background:#C9BD9C;border:5px dashed #8a7d59;
      display:flex;align-items:center;justify-content:center;${OSW};font-size:${w * .2}px;color:#8a7d59">?</div>
    <div style="position:absolute;left:24px;right:18px;bottom:24px">
      <b style="${OSW};font-size:${w * .11}px;display:block;line-height:1.05">${nome}</b>
      <span style="font-size:${w * .058}px;font-weight:700;color:rgba(0,0,0,.65)">${clube}</span>
    </div>
  </div>`
const virada = (nome, clube, pos, cat, w = 430) => `
  <div style="position:relative;width:${w}px;aspect-ratio:5/7;border:7px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;background:${G_OURO}">
    <div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);
      transform:translateX(-120%);animation:brilhoPassa 1.4s ease-in-out ${T_VIRA + 0.5}s both"></div>
    <span style="position:absolute;top:20px;left:20px;background:${INK};color:#fff;border-radius:12px;padding:2px 14px;${OSW};font-size:${w * .07}px">${pos}</span>
    <span style="position:absolute;top:20px;right:18px;background:${INK};color:${GOLD};border-radius:12px;padding:0 12px;${OSW};font-size:${w * .06}px">${cat}</span>
    <div style="position:absolute;top:22%;left:50%;transform:translateX(-50%);width:46%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.55);
      border:5px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:${w * .2}px">👑</div>
    <div style="position:absolute;left:24px;right:18px;bottom:24px">
      <b style="${OSW};font-size:${w * .11}px;display:block;line-height:1.05">${nome}</b>
      <span style="font-size:${w * .058}px;font-weight:700;color:rgba(0,0,0,.7)">${clube}</span>
      <div style="font-size:${w * .07}px;margin-top:4px;letter-spacing:4px">⭐⭐⭐⭐⭐</div>
    </div>
  </div>`

// o relógio da mesa: volta pra 5s a cada lance e desce de verdade depois do último
const relogio = []
{
  const marcos = LANCES.map(l => l.t)
  for (let i = 0; i < marcos.length; i++) {
    const ini = marcos[i], fim = marcos[i + 1] ?? T_VENDIDO
    for (let s = MARTELO_S; s >= 1; s--) {
      const t0 = ini + (MARTELO_S - s), t1 = Math.min(ini + (MARTELO_S - s) + 1, fim)
      if (t0 >= fim) break
      relogio.push({ s, t0, t1 })
    }
  }
}
const contagem = s => s === 3 ? 'UMA…' : s === 2 ? 'DUAS…' : s === 1 ? 'TRÊS…' : ''

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
@keyframes batida{0%{transform:scale(1.34) translateY(-16px)}100%{transform:scale(1) translateY(0)}}
@keyframes vira{0%{transform:perspective(1400px) rotateY(90deg)}100%{transform:perspective(1400px) rotateY(0)}}
@keyframes martelo{0%{transform:rotate(-55deg) scale(.6);opacity:0}55%{transform:rotate(18deg) scale(1.15);opacity:1}100%{transform:rotate(0) scale(1);opacity:1}}
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 45px rgba(255,196,0,.9))}}
@keyframes brilhoPassa{to{transform:translateX(120%)}}
@keyframes dedo{0%{transform:translate(0,90px) scale(.7);opacity:0}45%{transform:translate(0,0) scale(1.15);opacity:1}100%{transform:translate(0,10px) scale(1);opacity:0}}
</style><body>

<!-- ① a NOVIDADE -->
${cena(0, 4.4, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('modo novo de leilão · em teste', GREEN, '#fff', 34)}</div>
  <p style="font-size:210px;line-height:1;margin-top:26px;animation:martelo .7s cubic-bezier(.2,1.6,.4,1) .4s both, brilha 2.6s ease-in-out 1.6s infinite">🔨</p>
  <p style="${OSW};font-size:130px;text-transform:uppercase;text-align:center;line-height:.95;margin:18px 0 4px;animation:sobe .5s .7s both">chegou o</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s 1.0s both">pregão<br>aberto</p>
  <p style="font-size:46px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.7s both">o leilão clássico: <b style="color:${INK}">dou 10… 11…</b><br>uma, duas, três, <b style="color:${GREEN}">vendido!</b></p>`)}

<!-- ② agora são 3 jeitos -->
${cena(4.4, 8.4, `
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:44px;
    animation:sobe .45s 4.55s both">agora são <span style="color:${GREEN}">3 jeitos</span><br>de dar lance</p>
  ${[['✉️', 'envelope', 'lance escondido, abre no martelo', '#fff', 4.9],
     ['🐊', 'tocaia', 'o preço cai, quem apertar primeiro leva', '#fff', 5.25],
     ['🔨', 'pregão aberto', 'lance à vista de todos, 5s sem lance = vendido', G_OURO, 5.6]].map(([e, n, d, bg, t]) => `
    <div style="display:flex;align-items:center;gap:26px;width:940px;margin-bottom:22px;padding:24px 30px;background:${bg};border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${t}s both">
      <span style="font-size:84px;line-height:1">${e}</span>
      <span style="text-align:left"><b style="${OSW};font-size:52px;text-transform:uppercase;display:block">${n}${n === 'pregão aberto' ? ` <span style="font-size:30px;background:${INK};color:${GOLD};border-radius:10px;padding:2px 12px;vertical-align:middle">NOVO</span>` : ''}</b>
        <span style="font-size:32px;font-weight:700;color:rgba(12,12,12,.62)">${d}</span></span>
    </div>`).join('')}
  <p style="font-size:38px;font-weight:700;color:rgba(12,12,12,.58);text-align:center;margin-top:26px;animation:sobe .45s 6.4s both">quem cria a sala escolhe 😏</p>`)}

<!-- ③ ⭐ A MESA -->
${cena(C3, C3_FIM, `
  <div style="opacity:0;animation:sobe .35s ${C3 + 0.1}s both">${pill('🔨 pregão aberto · carta 37', INK, GOLD, 34)}</div>
  <div style="position:relative;width:430px;margin:30px 0 26px;opacity:0;animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${C3 + 0.25}s both">
    <div style="opacity:1;animation:some .01s linear ${T_VIRA}s both">${coberta('Romário', 'Vasco · 2000', 'ATA')}</div>
    <div style="position:absolute;inset:0;opacity:0;animation:apar .01s linear ${T_VIRA}s both"><div style="animation:vira .6s ease-out ${T_VIRA}s both">${virada('Romário', 'Vasco · 2000', 'ATA', '👑 LENDA')}</div></div>
    <p style="position:absolute;right:-150px;top:120px;font-size:150px;line-height:1;opacity:0;transform-origin:80% 80%;
      animation:martelo .5s cubic-bezier(.2,1.6,.4,1) ${T_VENDIDO}s both, some .01s linear ${T_VENDIDO + 1.8}s both">🔨</p>
  </div>

  <!-- o lance atual + o relógio -->
  <div style="position:relative;width:940px;height:190px;border:7px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;
    background:linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200);opacity:0;animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${C3 + 0.6}s both">
    ${janela(C3 + 0.6, LANCES[0].t, `<b style="${OSW};font-size:46px;text-transform:uppercase">ninguém deu lance · abre em 1</b>`)}
    ${LANCES.map((l, i) => janela(l.t, LANCES[i + 1]?.t ?? C3_FIM, `
      <b style="${OSW};font-size:120px;line-height:1;display:inline-block;animation:batida .2s cubic-bezier(.2,1.5,.4,1) ${l.t}s both">${l.v}</b>
      <span style="font-size:70px">🪙</span>
      <span style="flex:1;max-width:440px;text-align:left;margin-left:10px">
        <small style="display:block;font-size:24px;font-weight:900;letter-spacing:2px;opacity:.7">LANCE ATUAL</small>
        <b style="${OSW};font-size:${l.quem.length > 14 ? 40 : 48}px;text-transform:uppercase;line-height:1.05">${l.quem}${l.eu ? ' · VOCÊ' : ''}</b>
      </span>`, 'padding:0 30px;justify-content:flex-start')).join('')}
    <!-- o vermelho dos últimos 2 segundos -->
    <div style="position:absolute;inset:0;background:${RED};mix-blend-mode:multiply;opacity:0;animation:apar .01s linear ${(T_VENDIDO - 2).toFixed(2)}s both"></div>
  </div>
  <div style="position:relative;width:300px;height:120px;margin-top:22px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};
    opacity:0;animation:apar .01s linear ${LANCES[0].t}s both, some .01s linear ${T_VENDIDO}s both">
    ${relogio.map(r => janela(r.t0, r.t1, `<span style="text-align:center"><b style="${OSW};font-size:62px;line-height:1">⏱ ${r.s}s</b>${contagem(r.s) ? `<small style="display:block;${OSW};font-size:24px;color:${RED}">${contagem(r.s)}</small>` : ''}</span>`)).join('')}
  </div>
  <p style="${OSW};font-size:84px;color:${GREEN};text-transform:uppercase;position:absolute;bottom:250px;opacity:0;
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${T_VENDIDO}s both">vendido!</p>
  <p style="font-size:44px;font-weight:800;text-align:center;position:absolute;bottom:170px;opacity:0;
    animation:sobe .4s ${T_VIRA + 0.5}s both">era <b style="color:${INK}">LENDA</b> · é seu por ${ULT.v} 🪙</p>
  <p style="font-size:30px;font-weight:700;color:rgba(12,12,12,.55);text-align:center;position:absolute;bottom:90px;opacity:0;
    animation:apar .3s ${LANCES[1].t}s both, some .01s linear ${T_VENDIDO}s both">cada lance novo zera o relógio · ${MARTELO_S}s sem lance = martelo</p>
  ${LANCES.filter(l => l.eu).map(l => `<p style="position:absolute;right:120px;top:1290px;font-size:110px;line-height:1;opacity:0;
    animation:dedo .6s ease-out ${(l.t - 0.25).toFixed(2)}s both">🫵</p>`).join('')}`)}

<!-- ④ a carta vem coberta -->
${cena(C3_FIM, 25.0, `
  <div style="animation:sobe .4s ${C3_FIM + 0.15}s both">${pill('o segredo do modo', '#fff', INK, 34)}</div>
  <p style="${OSW};font-size:112px;text-transform:uppercase;text-align:center;line-height:.98;margin:26px 0 18px;
    animation:sobe .45s ${C3_FIM + 0.4}s both">a carta vem<br><span style="color:${GREEN}">coberta</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.4;
    animation:sobe .45s ${C3_FIM + 0.8}s both">só <b style="color:${INK}">nome, clube e ano</b>.<br>lenda, craque ou promessa?<br>só aparece quando é <b style="color:${INK}">vendida</b></p>
  <div style="display:flex;gap:30px;margin-top:50px;align-items:center;animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${C3_FIM + 1.4}s both">
    ${coberta('Romário', 'Vasco · 2000', 'ATA', 300)}
    <span style="${OSW};font-size:90px">→</span>
    ${virada('Romário', 'Vasco · 2000', 'ATA', '👑 LENDA', 300)}
  </div>
  <p style="${OSW};font-size:52px;text-transform:uppercase;margin-top:46px;animation:sobe .45s ${C3_FIM + 2.1}s both">quem conhece futebol <span style="color:${GREEN}">leva vantagem</span></p>`)}

<!-- ⑤ sala grande: duas cartas -->
${cena(25.0, 29.0, `
  <p style="font-size:120px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 25.15s both">🔨🔨</p>
  <p style="${OSW};font-size:100px;text-transform:uppercase;text-align:center;line-height:1;margin:22px 0 16px;animation:sobe .45s 25.4s both">sala <span style="color:${ROXO}">grande?</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.4;animation:sobe .45s 25.7s both">a partir de <b style="color:${INK}">${DUAS_MESAS_A_PARTIR} clubes</b>,<br><b style="color:${INK}">duas cartas na mesa</b> ao mesmo tempo</p>
  <div style="display:flex;gap:30px;margin-top:46px">
    ${[['Kaká', 'Milan · 2007', 'MEI', '⏱ 4s', 26.1], ['Lúcio', 'Inter · 2010', 'ZAG', '⏱ 2s', 26.35]].map(([n, c, p, s, t]) => `
      <div style="animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${t}s both;text-align:center">
        ${coberta(n, c, p, 380)}
        <div style="margin-top:22px;display:inline-block;background:#fff;border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:8px 22px;${OSW};font-size:46px">${s}</div>
      </div>`).join('')}
  </div>
  <p style="font-size:36px;font-weight:700;color:rgba(12,12,12,.58);text-align:center;margin-top:30px;animation:sobe .45s 26.9s both">posições diferentes · cada uma com o seu relógio</p>`)}

<!-- ⑥ sem Monte -->
${cena(29.0, 32.4, `
  <p style="font-size:140px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.15s both">🎁</p>
  <p style="${OSW};font-size:100px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 18px;animation:sobe .45s 29.4s both">sem <span style="color:${RED}">monte</span></p>
  <p style="font-size:46px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.4;animation:sobe .45s 29.8s both">sobrou vaga no fim?<br>ela ganha jogador <b style="color:${GREEN}">de graça</b><br>e o time sai fechado</p>`)}

<!-- ⑦ combina com clubes e duplas -->
${cena(32.4, 36.0, `
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:40px;animation:sobe .45s 32.55s both">combina com</p>
  ${[['🧱', 'leilão de clubes', 'na mesa aparece o escudo e quantos jogadores vêm', 32.9], ['🤝', 'duplas', 'cada um dá lance nas posições dele', 33.25]].map(([e, n, d, t]) => `
    <div style="display:flex;align-items:center;gap:26px;width:940px;margin-bottom:24px;padding:26px 30px;background:#fff;border:6px solid ${INK};border-radius:26px;
      box-shadow:8px 8px 0 ${INK};animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${t}s both">
      <span style="font-size:90px;line-height:1">${e}</span>
      <span style="text-align:left"><b style="${OSW};font-size:54px;text-transform:uppercase;display:block">${n}</b>
        <span style="font-size:34px;font-weight:700;color:rgba(12,12,12,.62)">${d}</span></span>
    </div>`).join('')}`)}

<!-- ⑧ onde jogar + marca -->
${cena(36.0, DURACAO + 1, `
  <p style="font-size:140px;line-height:1;animation:martelo .6s cubic-bezier(.2,1.6,.4,1) 36.15s both">🔨</p>
  <p style="${OSW};font-size:100px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 28px;animation:sobe .45s 36.4s both">já dá pra jogar</p>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center">
    <div style="width:820px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 36.8s both">⚡ partida rápida</div>
    <div style="width:820px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 37.1s both">🌐 sala online com os amigos</div>
    <div style="width:820px;background:#EDE4FF;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;color:${ROXO};animation:entra .45s cubic-bezier(.2,1.5,.4,1) 37.4s both">🏆 minhas ligas</div>
  </div>
  <div style="margin-top:44px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 37.9s both">${pill('como é o leilão → 🔨 pregão aberto', GREEN, '#fff', 34)}</div>
  <p style="${OSW};font-size:64px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 38.4s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-pregao-aberto-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-pregao-aberto-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(DURACAO * 1000 + 100)
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
