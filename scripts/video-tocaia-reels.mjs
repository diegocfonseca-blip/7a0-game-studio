// ─── 🎬 REELS 1080×1920: 🐊 CHEGOU A TOCAIA ──────────────────────────────────
// Pedido do Diego (20/09), no dia em que o modo ganhou o nome: *"preciso de um
// vídeo top agora, padrão de vídeos que fazemos, falando dessa baita novidade!!
// E mostrando o tempo rolando e etc."*
//
// 🎯 O CORAÇÃO DO VÍDEO é a cena ③: o PREÇO CAINDO na tela, com a leva inteira
// listada e o botão PEGAR em cada carta. É o que o modo tem de diferente, e é o
// que ele pediu pra mostrar ("o tempo rolando").
//
// ✅ OS NÚMEROS SÃO OS DE VERDADE: a escada vem de `scripts/escada-tocaia.mjs`,
// que é o espelho em JS puro do `holEscada` do `store.tsx` (script .mjs não
// importa .tsx). Se alguém mexer na escada do jogo e esquecer o espelho, o
// `npm run holandes` reprova — ele compara as duas listas.
//
// ⏱️ A DESCIDA NO VÍDEO CORRE EM DOBRO (100→18 leva 17,1s de verdade e aqui leva
// 8,5s). Não é enfeite mentiroso: a ORDEM e os NÚMEROS são os reais, e a própria
// tela avisa "a descida inteira leva ~50 segundos". Reel não aguenta 17s de
// contagem, mas ninguém pode chegar no jogo e achar que foi enganado.
//
// 🎞️ Roteiro (~35 s):
//   0,0– 4,4   🐊 CHEGOU A TOCAIA (a novidade, antes de qualquer regra)
//   4,4– 8,4   o que muda: envelope fechado × preço caindo à vista de todos
//   8,4–18,6   ⭐ O PREÇO ROLANDO: a leva inteira, 100 → 18, e alguém dá o bote
//  18,6–23,4   quem aperta PRIMEIRO leva (é por TEMPO, não por valor)
//  23,4–27,4   o jogador cai no seu campinho NA HORA
//  27,4–30,8   ninguém quis? vai pras sobras, igual sempre
//  30,8–35,0   onde jogar + marca
//
//   node scripts/video-tocaia-reels.mjs [--saida tocaia-reels.mp4]
//   (ffmpeg: usa `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
// 🐊 os degraus e a cadência SÃO os do jogo (`npm run holandes` confere que não desencontraram)
import { holEscada, holPassoMs, descidaSegundos } from './escada-tocaia.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tocaia-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const ESCADA = holEscada(100)
const DESCIDA_S = descidaSegundos(100)   // 49,1s do 100 até o 0
const PARA_EM = 18            // onde a cena do vídeo termina (alguém dá o bote)
const CENA3_INI = 8.4, CENA3_FIM = 18.6
const VELOCIDADE = 2          // a descida do vídeo roda em dobro (avisado na tela)
const PRECO_T0 = 8.9          // quando o primeiro número aparece

// os instantes de cada degrau no VÍDEO
const marcas = []
{
  let t = PRECO_T0
  for (const p of ESCADA) {
    marcas.push({ p, t })
    if (p === PARA_EM) break
    t += holPassoMs(p) / 1000 / VELOCIDADE
  }
}
const T_BOTE = marcas[marcas.length - 1].t + 0.35   // o dedo desce logo depois do 18

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// 🃏 uma carta da leva, do jeito que ela aparece no pregão
const carta = (nome, clube, pos, atraso, estado = 'livre', preco = 0) => `
  <div style="display:flex;align-items:center;gap:18px;width:940px;padding:18px 24px;margin-bottom:14px;text-align:left;
    background:${estado === 'meu' ? G_OURO : estado === 'outro' ? '#EDE7DA' : '#fff'};border:5px solid ${INK};border-radius:22px;
    box-shadow:${estado === 'outro' ? 'none' : `8px 8px 0 ${INK}`};${estado === 'outro' ? 'opacity:.6' : ''};
    animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="width:70px;height:70px;flex:none;background:${estado === 'meu' ? '#fff' : CREME};border:4px solid ${INK};border-radius:16px;
      display:flex;align-items:center;justify-content:center;${OSW};font-size:30px">${pos}</span>
    <span style="flex:1;min-width:0">
      <b style="${OSW};font-size:42px;display:block;line-height:1.05">${nome}</b>
      <span style="font-size:26px;font-weight:700;color:rgba(12,12,12,.55)">${clube}</span>
    </span>
    ${estado === 'meu'
      ? `<b style="${OSW};font-size:34px;background:${INK};color:${GOLD};border-radius:14px;padding:12px 22px;white-space:nowrap">PEGUEI! · ${preco} 🪙</b>`
      : estado === 'outro'
      ? `<b style="${OSW};font-size:30px;color:rgba(12,12,12,.5);white-space:nowrap">já tem dono</b>`
      : `<b style="${OSW};font-size:36px;background:${GREEN};color:#fff;border:4px solid ${INK};border-radius:16px;padding:10px 30px;
           box-shadow:5px 5px 0 ${INK};white-space:nowrap">PEGAR</b>`}
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
@keyframes batida{0%{transform:scale(1.34) translateY(-16px)}100%{transform:scale(1) translateY(0)}}
@keyframes drena{0%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes dedo{0%{transform:translate(0,130px) scale(.7);opacity:0}45%{transform:translate(0,0) scale(1.15);opacity:1}100%{transform:translate(0,14px) scale(1);opacity:1}}
@keyframes tremeNao{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 45px rgba(255,196,0,.9))}}
@keyframes cai{0%{transform:translateY(-220px) scale(.6) rotate(-12deg);opacity:0}70%{transform:translateY(16px) scale(1.06) rotate(2deg);opacity:1}100%{transform:translateY(0) scale(1) rotate(0);opacity:1}}
</style><body>

<!-- ① a NOVIDADE: chegou -->
${cena(0, 4.4, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('modo novo de leilão', RED, '#fff', 36)}</div>
  <p style="font-size:210px;line-height:1;margin-top:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .4s both, brilha 2.6s ease-in-out 1.6s infinite">🐊</p>
  <p style="${OSW};font-size:130px;text-transform:uppercase;text-align:center;line-height:.95;margin:18px 0 4px;
    animation:sobe .5s .7s both">chegou a</p>
  <p style="${OSW};font-size:190px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s 1.0s both">tocaia</p>
  <p style="font-size:46px;font-weight:700;color:rgba(12,12,12,.62);margin-top:44px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.7s both">o leilão em que o preço <b style="color:${INK}">desce</b><br>e quem dá o bote primeiro <b style="color:${GREEN}">leva</b></p>`)}

<!-- ② o que muda -->
${cena(4.4, 8.4, `
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:44px;
    animation:sobe .45s 4.55s both">dois jeitos de<br><span style="color:${GREEN}">montar o time</span></p>
  <div style="display:flex;gap:22px;align-items:stretch">
    <div style="width:436px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:28px;
      animation:entra .5s cubic-bezier(.2,1.5,.4,1) 5.0s both">
      <div style="font-size:74px">✉️</div>
      <div style="${OSW};font-size:46px;margin-top:8px;text-transform:uppercase">às cegas</div>
      <div style="font-size:31px;font-weight:700;color:rgba(12,12,12,.6);margin-top:10px;line-height:1.35">você escreve o valor,<br>lacra e <b>reza</b></div>
    </div>
    <div style="width:436px;background:${G_OURO};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:28px;
      animation:entra .5s cubic-bezier(.2,1.5,.4,1) 5.45s both">
      <div style="font-size:74px">🐊</div>
      <div style="${OSW};font-size:46px;margin-top:8px;text-transform:uppercase">tocaia</div>
      <div style="font-size:31px;font-weight:700;color:rgba(12,12,12,.65);margin-top:10px;line-height:1.35">o preço <b>cai na tela</b><br>à vista de todo mundo</div>
    </div>
  </div>
  <p style="font-size:44px;font-weight:800;text-align:center;line-height:1.35;margin-top:54px;
    animation:sobe .45s 6.2s both">todo mundo vê <b style="color:${GREEN}">o mesmo preço</b>,<br>ao mesmo tempo, na mesma tela</p>
  <p style="font-size:36px;font-weight:700;color:rgba(12,12,12,.58);text-align:center;margin-top:20px;
    animation:sobe .45s 6.7s both">e ninguém é obrigado a escolher agora 😏</p>`)}

<!-- ③ ⭐ O PREÇO ROLANDO — a cena que ele pediu -->
${cena(CENA3_INI, CENA3_FIM, `
  <div style="opacity:0;animation:sobe .35s ${CENA3_INI + 0.1}s both">${pill('🐊 tocaia · goleiros', INK, GOLD, 34)}</div>

  <!-- o painel do preço: número gigante trocando degrau por degrau -->
  <div style="position:relative;width:940px;height:300px;margin:24px 0 10px;background:#fff;border:7px solid ${INK};border-radius:32px;
    box-shadow:10px 10px 0 ${INK};opacity:0;animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${CENA3_INI + 0.2}s both">
    <p style="${OSW};font-size:32px;text-transform:uppercase;color:rgba(12,12,12,.5);text-align:center;padding-top:16px;letter-spacing:.04em">preço agora · cai sozinho</p>
    ${marcas.map((m, i) => {
      const fim = marcas[i + 1] ? marcas[i + 1].t : CENA3_FIM
      return `<div style="position:absolute;left:0;right:0;top:62px;height:172px;display:flex;align-items:center;justify-content:center;gap:16px;
        opacity:0;animation:apar .01s linear ${m.t}s both, some .01s linear ${fim}s both">
        <b style="${OSW};font-size:150px;line-height:1;color:${m.p <= 21 ? GREEN : INK};display:inline-block;
          animation:batida .2s cubic-bezier(.2,1.5,.4,1) ${m.t}s both">${m.p}</b>
        <span style="font-size:76px;line-height:1">🪙</span></div>`
    }).join('')}
    <!-- a barrinha que esvazia: o "tempo rolando" -->
    <div style="position:absolute;left:0;right:0;bottom:0;height:22px;background:rgba(12,12,12,.12);border-radius:0 0 24px 24px;overflow:hidden">
      <div style="height:100%;background:${RED};transform-origin:left;
        animation:drena ${(T_BOTE - PRECO_T0).toFixed(2)}s linear ${PRECO_T0}s both"></div>
    </div>
  </div>
  <p style="font-size:29px;font-weight:700;color:rgba(12,12,12,.5);margin-bottom:26px;white-space:nowrap;
    opacity:0;animation:apar .3s ${CENA3_INI + 0.5}s both">⏱️ no jogo a descida inteira leva ~${Math.round(DESCIDA_S)}s · aqui está acelerada</p>

  <!-- a leva INTEIRA listada, cada uma com o seu PEGAR.
       A 1ª carta tem DUAS versões empilhadas no MESMO lugar: a livre some no
       instante do bote e a dourada aparece por cima — é assim que o jogo faz. -->
  <div style="position:relative;width:940px">
    <div style="opacity:0;animation:apar .01s linear ${CENA3_INI + 0.35}s both, some .01s linear ${T_BOTE.toFixed(2)}s both">
      ${carta('Taffarel', 'Brasil 94', 'GOL', CENA3_INI + 0.35)}
    </div>
    <div style="position:absolute;left:0;right:0;top:0;opacity:0;animation:apar .01s linear ${T_BOTE.toFixed(2)}s both">
      ${carta('Taffarel', 'Brasil 94', 'GOL', T_BOTE, 'meu', PARA_EM)}
    </div>
    ${carta('Rogério Ceni', 'São Paulo', 'GOL', CENA3_INI + 0.5)}
    ${carta('Marcos', 'Palmeiras', 'GOL', CENA3_INI + 0.65)}
    <!-- 🫵 o dedo desce em cima do PEGAR da primeira -->
    <p style="position:absolute;right:36px;top:-18px;font-size:126px;line-height:1;opacity:0;
      animation:dedo .4s cubic-bezier(.2,1.5,.4,1) ${(T_BOTE - 0.45).toFixed(2)}s both, some .01s linear ${(T_BOTE + 0.06).toFixed(2)}s both">🫵</p>
  </div>

  <p style="${OSW};font-size:62px;color:${GREEN};text-transform:uppercase;margin-top:34px;opacity:0;
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${(T_BOTE + 0.25).toFixed(2)}s both">é seu por ${PARA_EM} 🪙</p>`)}

<!-- ④ quem aperta primeiro leva -->
${cena(18.6, 23.4, `
  <div style="animation:sobe .4s 18.75s both">${pill('e se dois quiserem?', '#fff', INK, 34)}</div>
  <p style="${OSW};font-size:120px;text-transform:uppercase;text-align:center;line-height:.98;margin:24px 0 14px;
    animation:sobe .45s 19.0s both">quem aperta<br><span style="color:${GREEN}">primeiro</span> leva</p>
  <p style="font-size:42px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.35;
    animation:sobe .45s 19.4s both">é por <b style="color:${INK}">tempo</b>, não por valor.<br>a carta tranca no primeiro toque</p>
  <div style="display:flex;gap:26px;margin-top:58px;align-items:stretch">
    <div style="width:430px;background:${G_OURO};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:30px 24px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 20.0s both">
      <div style="font-size:88px">🫵</div>
      <div style="${OSW};font-size:52px;margin-top:6px">PEGUEI!</div>
      <div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.65);margin-top:8px">tocou antes</div>
    </div>
    <div style="width:430px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:30px 24px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 20.35s both">
      <div style="font-size:88px;animation:tremeNao .5s ease-in-out 20.9s 2">😤</div>
      <div style="${OSW};font-size:52px;margin-top:6px;color:${RED}">QUASE!</div>
      <div style="font-size:30px;font-weight:800;color:rgba(12,12,12,.55);margin-top:8px">um toque depois</div>
    </div>
  </div>
  <p style="font-size:38px;font-weight:700;color:rgba(12,12,12,.6);text-align:center;line-height:1.35;margin-top:48px;
    animation:sobe .45s 21.4s both">nunca dá dois donos pra mesma carta —<br>quem manda é o <b style="color:${INK}">dono da sala</b></p>`)}

<!-- ⑤ cai no campinho na hora -->
${cena(23.4, 27.4, `
  <p style="${OSW};font-size:104px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:12px;
    animation:sobe .45s 23.55s both">e ele já <span style="color:${GREEN}">entra</span></p>
  <p style="font-size:42px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.35;margin-bottom:40px;
    animation:sobe .45s 23.9s both">sem esperar o fim da leva:<br>pegou, apareceu no seu campinho</p>
  <div style="width:620px;height:520px;background:linear-gradient(180deg,#1B7A3D,#166332);border:7px solid ${INK};border-radius:30px;
    box-shadow:10px 10px 0 ${INK};position:relative;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 24.3s both">
    <div style="position:absolute;left:50%;top:14px;transform:translateX(-50%);width:230px;height:86px;border:5px solid rgba(255,255,255,.5);border-top:none"></div>
    <div style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:230px;height:86px;border:5px solid rgba(255,255,255,.5);border-bottom:none"></div>
    <div style="position:absolute;left:14px;right:14px;top:50%;height:5px;background:rgba(255,255,255,.5)"></div>
    <div style="position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center">
     <div style="animation:cai .6s cubic-bezier(.2,1.5,.4,1) 25.0s both">
      <div style="width:190px;background:${G_OURO};border:6px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:14px 10px;text-align:center">
        <div style="font-size:54px;line-height:1">🧤</div>
        <div style="${OSW};font-size:34px;margin-top:4px">Taffarel</div>
        <div style="font-size:24px;font-weight:800;color:rgba(12,12,12,.6)">GOL · 18 🪙</div>
      </div>
     </div>
    </div>
  </div>
  <p style="font-size:40px;font-weight:800;text-align:center;line-height:1.3;margin-top:40px;
    animation:sobe .45s 25.9s both">sem susto, sem "será que foi?"</p>`)}

<!-- ⑥ ninguém quis? vai pras sobras -->
${cena(27.4, 30.8, `
  <p style="font-size:130px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 27.55s both">🪣</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 16px;
    animation:sobe .45s 27.8s both">e se <span style="color:${RED}">ninguém</span><br>quiser?</p>
  <p style="font-size:42px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.4;
    animation:sobe .45s 28.2s both">o preço cai até <b style="color:${INK}">zero</b> —<br>e quem sobrar vai pro <b>Monte de sobras</b>,<br>igualzinho já é hoje</p>
  <div style="margin-top:44px;width:940px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};
    padding:26px 32px;text-align:left;animation:entra .5s cubic-bezier(.2,1.5,.4,1) 29.0s both">
    <p style="font-size:37px;font-weight:800;line-height:1.45">Nada do <b>leilão às cegas</b> mudou. A Tocaia é um <b>modo à parte</b> —
      quem cria a sala escolhe qual dos dois vai rolar.</p>
  </div>`)}

<!-- ⑦ onde jogar + marca -->
${cena(30.8, 40, `
  <p style="font-size:140px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 30.95s both">🐊</p>
  <p style="${OSW};font-size:100px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 28px;
    animation:sobe .45s 31.2s both">já dá pra jogar</p>
  <div style="display:flex;flex-direction:column;gap:14px;align-items:center">
    <div style="width:820px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 31.6s both">⚡ partida rápida</div>
    <div style="width:820px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 31.9s both">🌐 sala online com os amigos</div>
    <div style="width:820px;background:#EDE4FF;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:18px 26px;
      ${OSW};font-size:44px;text-align:center;color:${ROXO};animation:entra .45s cubic-bezier(.2,1.5,.4,1) 32.2s both">🏆 minhas ligas</div>
  </div>
  <div style="margin-top:44px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 32.7s both">${pill('é só marcar 🐊 tocaia ao criar', GREEN, '#fff', 36)}</div>
  <p style="${OSW};font-size:64px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 33.2s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-tocaia-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-tocaia-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(35100)
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
