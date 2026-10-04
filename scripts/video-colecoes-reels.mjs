// ─── 🎬 REELS 1080×1920: 📚 COLEÇÕES DE CLUBES + 🤝 TROCAS ──────────────────────
// Pedido do Diego (04/10): *"aqueles vídeos padrão que você costuma fazer do eu anunciar a novidade
// das cartas colecionáveis que ganham moedas + troca, e que agora será mais raro receber lendas e
// também terão cartas repetidas"*. Mesmo molde do `video-clubes-reels.mjs` (HTML + Playwright + ffmpeg).
//
// ✅ TUDO QUE APARECE É DO JOGO DE VERDADE: escudos oficiais (`public/escudos-clubes/`), quantas cartas
// cada clube tem e quanto paga (saem de `COLECOES` — Peñarol 11 · 27 🪙, Real Madrid 52 · 162 🪙…), os
// valores por categoria, a troca de até 10 de cada lado, a lenda a 4% e as Lendas Avulsas.
//
// 🎞️ Roteiro (~40 s):
//   0,0– 4,6   📚 suas cartas agora VALEM MOEDAS
//   4,6–10,8   junte TODAS as cartas de um clube (grade com escudos, rodinha enchendo)
//  10,8–16,4   o prêmio é a soma das cartas (lenda 5 · craque 3 · promessa 2 · bom 1 · profissional 0,5)
//  16,4–22,0   recebe DENTRO da carreira, na Agência → moedas no caixa · a carta fica no álbum
//  22,0–29,0   🤝 trocas: até 10 de cada lado (10 cartas por uma lenda) · aceitar / contra / recusar
//  29,0–34,0   🎲 lenda mais rara + pode vir repetida (repetida = moeda de troca)
//  34,0–40,0   🌟 Lendas Avulsas · onde fica · marca
//
//   node scripts/video-colecoes-reels.mjs [--saida colecoes-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'colecoes-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const rosto = f => `data:image/webp;base64,${readFileSync(`public/avatars/lendas-v1/${f}.webp`).toString('base64')}`
const esc = f => `data:image/webp;base64,${readFileSync(`public/escudos-clubes/${f}.webp`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const G_PRATA = 'linear-gradient(150deg,#F4F7FB,#CBD4DE 45%,#9BA7B5 78%,#EAEFF4)'
const G_VERDE = 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)'
const G_BEGE = 'linear-gradient(150deg,#DBD1B5,#CBBF9E 60%,#B2A583)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// 🔲 um quadro da grade, igual ao do jogo: rodinha verde em volta do escudo oficial
const quadro = (arq, nome, n, total, premio, atraso, enche = 0) => {
  const pronta = n >= total, pct = n / total
  return `<div style="position:relative;width:228px;padding:14px 6px 12px;text-align:center;border:5px solid ${INK};border-radius:24px;
    box-shadow:6px 6px 0 ${INK};background:${pronta ? 'linear-gradient(160deg,#FFE58A,#FFC400)' : '#fff'};
    animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <div style="width:118px;height:118px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
      background:conic-gradient(${GREEN} ${pct * 360}deg,#EADFC2 0);${enche ? `animation:enche${enche} 1.4s ease-out ${atraso + .3}s both` : ''}">
      <div style="width:96px;height:96px;border-radius:50%;background:#fff;display:grid;place-items:center">
        <img src="${esc(arq)}" style="max-width:76px;max-height:76px"></div></div>
    <b style="${OSW};font-size:28px;text-transform:uppercase;display:block;margin-top:8px;line-height:1.05">${nome}</b>
    <b style="${OSW};font-size:28px;display:block;color:${pronta ? GREEN : INK}">${pronta ? '✅ PRONTA' : `${n}/${total}`}</b>
    <span style="font-size:24px;font-weight:700;opacity:.75">🪙 ${premio}</span>
  </div>`
}
// 🃏 carta pequena do álbum (só nome/clube/ano, cor da categoria)
const carta = (pos, nome, clube, ano, grad, atraso, extra = '') => `
  <div style="position:relative;width:200px;padding:10px 12px;text-align:left;border:4px solid ${INK};border-radius:16px;
    box-shadow:4px 4px 0 ${INK};background:${grad};color:${grad === G_VERDE ? '#fff' : INK};overflow:hidden;
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <b style="${OSW};font-size:18px;background:${INK};color:#fff;border-radius:6px;padding:0 7px">${pos}</b>
    <b style="${OSW};display:block;font-size:24px;line-height:1.05;margin-top:6px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</b>
    <span style="font-size:17px;opacity:.75;white-space:nowrap">${clube} · ${ano}</span>${extra}
  </div>`

const DEZ = [['GOL', 'Alex Muralha', 2017, G_BEGE], ['GOL', 'Bruno', 2009, G_VERDE], ['GOL', 'Diego', 2009, G_BEGE], ['LAT', 'Vanderlei Luxemburgo', 1975, G_BEGE],
  ['LAT', 'Athirson', 1999, G_VERDE], ['LAT', 'Rodinei', 2019, G_VERDE], ['LAT', 'Isla', 2020, G_VERDE], ['LAT', 'China', 2004, G_BEGE], ['LAT', 'Jorge', 2016, G_BEGE], ['GOL', 'Getúlio Vargas', 2005, G_BEGE]]

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
@keyframes chove{0%{transform:translateY(-300px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(1100px) rotate(540deg);opacity:0}}
@keyframes gira{0%{transform:rotateY(0)}100%{transform:rotateY(720deg)}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.6, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('novidade no álbum', RED, '#fff', 36)}</div>
  <p style="font-size:200px;line-height:1;margin-top:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .4s both, brilha 2.6s ease-in-out 1.6s infinite">📚</p>
  <p style="${OSW};font-size:120px;text-transform:uppercase;text-align:center;line-height:.95;margin:18px 0 4px;animation:sobe .5s .7s both">suas cartas<br>agora</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s 1.0s both">valem <span style="-webkit-text-fill-color:initial;filter:none">🪙</span></p>
  <p style="font-size:46px;font-weight:700;color:rgba(12,12,12,.62);margin-top:44px;text-align:center;line-height:1.35;animation:sobe .5s 1.7s both">
    feche a <b style="color:${INK}">coleção de um clube</b><br>e ganhe <b style="color:${GREEN}">moedas na carreira</b></p>`)}

<!-- ② a grade -->
${cena(4.6, 10.8, `
  <div style="animation:sobe .4s 4.75s both">${pill('📚 coleções de clubes', INK, GOLD, 34)}</div>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:26px 0 34px;animation:sobe .45s 4.95s both">junte <span style="color:${GREEN}">todas</span> as<br>cartas do clube</p>
  <div style="display:grid;grid-template-columns:repeat(4,228px);gap:18px">
    ${quadro('penarol', 'Peñarol', 11, 11, 27, 5.3)}
    ${quadro('inter-miami', 'Inter Miami', 11, 11, 24, 5.45)}
    ${quadro('real-madrid', 'Real Madrid', 45, 52, 162, 5.6)}
    ${quadro('flamengo', 'Flamengo', 58, 77, 141, 5.75)}
    ${quadro('boca-juniors', 'Boca Juniors', 8, 16, 32, 5.9)}
    ${quadro('barcelona', 'Barcelona', 20, 46, 137, 6.05)}
    ${quadro('santos', 'Santos', 12, 50, 95, 6.2)}
    ${quadro('leicester', 'Leicester', 2, 11, 19, 6.35)}
  </div>
  <div style="margin-top:36px;width:960px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:22px 30px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 7.4s both">
    <p style="font-size:38px;font-weight:800;line-height:1.4">🛡️ <b>82 clubes</b> com escudo oficial. A rodinha verde enche conforme você junta as cartas.</p>
  </div>`)}

<!-- ③ o prêmio -->
${cena(10.8, 16.4, `
  <p style="${OSW};font-size:90px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:34px;animation:sobe .45s 10.95s both">quanto vale?<br><span style="color:${GREEN}">a soma das cartas</span></p>
  ${[['👑', 'Lenda', '5', G_OURO], ['⭐', 'Craque', '3', G_PRATA], ['💎', 'Promessa', '2', '#EDE4FF'], ['🎯', 'Bom jogador', '1', G_VERDE], ['🪵', 'Foi profissional', '0,5', G_BEGE]].map(([ic, nome, v, g], i) => `
    <div style="display:flex;align-items:center;gap:20px;width:900px;padding:14px 26px;margin-bottom:12px;background:${g};border:5px solid ${INK};
      border-radius:20px;box-shadow:6px 6px 0 ${INK};color:${g === G_VERDE ? '#fff' : INK};animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${(11.3 + i * .25).toFixed(2)}s both">
      <span style="font-size:52px">${ic}</span>
      <b style="${OSW};font-size:46px;text-transform:uppercase;flex:1;text-align:left">${nome}</b>
      <b style="${OSW};font-size:52px">${v} 🪙</b>
    </div>`).join('')}
  <div style="display:flex;gap:22px;margin-top:30px">
    ${[['real-madrid', 'Real Madrid', 162], ['flamengo', 'Flamengo', 141], ['penarol', 'Peñarol', 27]].map(([a, n, p], i) => `
      <div style="width:290px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:16px;text-align:center;
        animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${(13.2 + i * .3).toFixed(2)}s both">
        <img src="${esc(a)}" style="height:80px"><b style="${OSW};display:block;font-size:30px;text-transform:uppercase">${n}</b>
        <b style="${OSW};font-size:46px;color:${GREEN}">${p} 🪙</b></div>`).join('')}
  </div>`)}

<!-- ④ receber na carreira -->
${cena(16.4, 22.0, `
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:30px;animation:sobe .45s 16.55s both">recebe <span style="color:${GREEN}">na carreira</span></p>
  <div style="animation:sobe .4s 16.8s both">${pill('🕴️ agência', INK, GOLD, 34)}</div>
  <div style="width:940px;margin-top:26px;background:linear-gradient(160deg,#FFF6D2,#FFE07A);border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:26px 30px;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 17.1s both">
    <div style="display:flex;align-items:center;gap:22px">
      <img src="${esc('penarol')}" style="height:110px">
      <span style="flex:1;text-align:left"><b style="${OSW};font-size:58px;display:block;text-transform:uppercase;line-height:1">Peñarol</b>
        <b style="${OSW};font-size:36px;color:${GREEN}">✅ 11 de 11</b></span>
    </div>
    <div style="margin-top:22px;background:${GOLD};border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:20px;text-align:center;
      ${OSW};font-size:50px;text-transform:uppercase;animation:pulsa .9s ease-in-out 17.8s 2">🪙 Receber 27 moedas</div>
  </div>
  <div style="position:relative;width:940px;margin-top:30px;background:${GREEN};color:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:9px 9px 0 ${INK};padding:24px 30px;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 19.6s both">
    <b style="${OSW};font-size:64px;display:block;line-height:1">+27 🪙 NO CAIXA!</b>
    <span style="font-size:32px;font-weight:700">as cartas continuam no seu álbum, marcadas como usadas nesta carreira</span>
  </div>
  ${Array.from({ length: 14 }, (_, k) => `<span style="position:absolute;top:0;left:${60 + k * 70}px;font-size:70px;opacity:0;animation:chove 2.2s linear ${(19.6 + (k % 5) * .15).toFixed(2)}s both">🪙</span>`).join('')}`)}

<!-- ⑤ trocas -->
${cena(22.0, 29.0, `
  <div style="animation:sobe .4s 22.15s both">${pill('🤝 trocas com os amigos', ROXO, '#fff', 34)}</div>
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin:22px 0 24px;animation:sobe .45s 22.35s both">até <span style="color:${ROXO}">10 cartas</span><br>de cada lado</p>
  <div style="width:960px;background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:18px">
    <b style="${OSW};font-size:30px;display:block;text-align:left;margin-bottom:10px;animation:sobe .3s 22.7s both">VOCÊ DÁ · 10 cartas</b>
    <div style="display:grid;grid-template-columns:repeat(4,200px);gap:12px;justify-content:center">
      ${DEZ.map(([pos, n, a, g], i) => carta(pos, n, 'Flamengo', a, g, 22.8 + i * .12)).join('')}
    </div>
  </div>
  <p style="font-size:80px;margin:10px 0;animation:pop .4s cubic-bezier(.2,1.6,.4,1) 24.2s both">⇅</p>
  <div style="display:flex;align-items:center;gap:26px;width:960px;background:${G_OURO};border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:16px 24px;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 24.4s both">
    <img src="${rosto('raul-real-madrid-2001')}" style="height:150px">
    <span style="text-align:left;flex:1"><b style="${OSW};font-size:30px">VOCÊ RECEBE · 👑 LENDA</b>
      <b style="${OSW};display:block;font-size:64px;text-transform:uppercase;line-height:1">Raúl</b>
      <span style="font-size:28px;font-weight:700">Real Madrid · 2001</span></span>
  </div>
  <div style="display:flex;gap:16px;margin-top:26px">
    ${[['✅ ACEITAR', GREEN, '#fff'], ['🔁 CONTRA', GOLD, INK], ['✖️ RECUSAR', '#fff', INK]].map(([t, bg, c], i) => `
      <span style="width:300px;background:${bg};color:${c};border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:16px;text-align:center;
        ${OSW};font-size:38px;animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${(25.4 + i * .2).toFixed(2)}s both">${t}</span>`).join('')}
  </div>
  <p style="font-size:34px;font-weight:800;text-align:center;margin-top:22px;line-height:1.35;animation:sobe .45s 26.4s both">nada sai do seu álbum até o outro <b style="color:${GREEN}">aceitar</b></p>`)}

<!-- ⑥ sorteio novo -->
${cena(29.0, 34.0, `
  <p style="font-size:150px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.15s both">🎲</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 30px;animation:sobe .45s 29.4s both">ganhou título?<br><span style="color:${GREEN}">ganha carta</span></p>
  <div style="display:flex;gap:24px">
    <div style="width:450px;background:${G_OURO};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.9s both">
      <div style="font-size:90px;display:inline-block;animation:gira 1.2s ease-in-out 30.2s both">👑</div>
      <div style="${OSW};font-size:44px;margin-top:6px;text-transform:uppercase">lenda mais rara</div>
      <div style="font-size:30px;font-weight:800;margin-top:6px">agora vale ouro de verdade</div>
    </div>
    <div style="width:450px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px;text-align:center;
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) 30.3s both">
      <div style="font-size:90px">🔁</div>
      <div style="${OSW};font-size:44px;margin-top:6px;text-transform:uppercase">pode vir repetida</div>
      <div style="font-size:30px;font-weight:800;color:${ROXO};margin-top:6px">repetida vira moeda de troca</div>
    </div>
  </div>
  <p style="font-size:36px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;margin-top:34px;line-height:1.35;animation:sobe .45s 31.2s both">
    quem já tem cartas <b style="color:${INK}">continua com todas</b> 👊</p>`)}

<!-- ⑦ lendas avulsas + onde + marca -->
${cena(34.0, 41, `
  <div style="animation:sobe .4s 34.15s both">${pill('🌟 coleção especial', INK, GOLD, 34)}</div>
  <p style="${OSW};font-size:86px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 26px;animation:sobe .45s 34.35s both">lendas <span style="color:#C99A00">avulsas</span></p>
  <div style="display:flex;gap:16px">
    ${[['lev-yashin-dinamo-de-moscou-1963', 'Yashin'], ['bobby-moore-west-ham-1966', 'Moore'], ['carlos-valderrama-deportivo-cali-1988', 'Valderrama']].map(([f, n], i) => `
      <div style="width:260px;background:${G_OURO};border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:10px;text-align:center;
        animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${(34.7 + i * .2).toFixed(2)}s both">
        <img src="${rosto(f)}" style="height:170px"><b style="${OSW};display:block;font-size:34px;text-transform:uppercase">${n}</b></div>`).join('')}
    <div style="width:180px;background:#fff;border:5px dashed rgba(0,0,0,.4);border-radius:22px;display:grid;place-items:center;${OSW};font-size:30px;text-align:center;
      animation:pop .45s cubic-bezier(.2,1.6,.4,1) 35.3s both">+ Simonsen</div>
  </div>
  <p style="font-size:36px;font-weight:800;text-align:center;margin-top:20px;animation:sobe .45s 35.6s both">junte as 4 · <b style="color:${GREEN}">20 🪙</b></p>
  <div style="display:flex;flex-direction:column;gap:12px;align-items:center;margin-top:30px">
    <div style="width:860px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:14px 26px;
      ${OSW};font-size:38px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 36.2s both">📖 Álbum → ver coleções e trocar</div>
    <div style="width:860px;background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 ${INK};padding:14px 26px;
      ${OSW};font-size:38px;text-align:center;animation:entra .45s cubic-bezier(.2,1.5,.4,1) 36.45s both">🕴️ Carreira → Agência → receber</div>
  </div>
  <p style="${OSW};font-size:64px;margin-top:40px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 37s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-colecoes-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-colecoes-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(40300)
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
