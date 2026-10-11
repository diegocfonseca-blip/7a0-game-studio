// ─── 🎬 REELS 1080×1920: 🏟️ AS COPAS REGIONAIS CHEGARAM NAS SALAS ───────────
// Pedido do Diego (11/10): *"quero vídeo de mockup tb padrão.. anunciando as ligas
// estaduais"*. Mesmo molde do `video-copa-online-reels.mjs` / `video-clubes-reels.mjs`
// (cenas em HTML + Playwright gravando + ffmpeg).
//
// ✅ TUDO QUE APARECE É DO JOGO: as 3 copas e os 16 clubes saem de `copa-regional.ts`,
// os prazos (60s pra escolher, 90s pra convocar), o corte (16 da liga de 20), o
// formato (cada clube joga contra os 8 do OUTRO lado, 4 de cada lado pras quartas
// cruzadas) e as cartas regionais (Zózimo do Bangu, Lugão do Volta Redonda…) são as
// de `cartas-regionais.ts`. Os rostos são os `.webp` do jogo.
//
// 🎞️ Roteiro (~36 s):
//   0,0– 4,4   🏟️ chegaram as COPAS REGIONAIS (as três)
//   4,4– 9,4   joga a liga de sempre · os 16 primeiros vão pra copa
//   9,4–15,6   escolhe o clube NA ORDEM DA TABELA (60s · não escolheu = o pior que sobrou)
//  15,6–21,2   convoca 11 do clube em 90s
//  21,2–26,4   dois lados de 8 · cada um enfrenta o outro lado · quartas → final
//  26,4–31,4   🃏 jogador de clube pequeno: só nessas salas
//  31,4–36,4   onde jogar + marca
//
//   node scripts/video-regionais-reels.mjs [--saida regionais-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'regionais-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const rosto = f => `data:image/webp;base64,${readFileSync(`public/avatars/lendas-v1/${f}.webp`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// bolinha de clube (duas cores + inicial) — a mesma do mockup aprovado; nada de escudo real
const bola = ([n, c1, c2], s = 54) => `<span style="flex:none;width:${s}px;height:${s}px;border-radius:50%;border:4px solid ${INK};
  background:linear-gradient(135deg,${c1} 50%,${c2} 50%);display:inline-flex;align-items:center;justify-content:center;
  font-size:${Math.round(s * .4)}px;${OSW};color:${GOLD};text-shadow:0 0 3px #000">${n[0]}</span>`
const entra = (atraso, extra = '') => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both;${extra}`

const RIO = [['Flamengo', '#C8102E', '#111'], ['Vasco', '#111', '#fff'], ['Botafogo', '#111', '#fff'], ['Fluminense', '#7A1F3D', '#0B6B3A'], ['Bangu', '#C8102E', '#fff'], ['America-RJ', '#C8102E', '#fff'], ['Madureira', '#F2C200', '#1B3E8A'], ['Volta Redonda', '#F2C200', '#111']]
const SP = [['Corinthians', '#fff', '#111'], ['São Paulo', '#C8102E', '#111'], ['Palmeiras', '#0B6B3A', '#fff'], ['Santos', '#fff', '#111'], ['Portuguesa', '#C8102E', '#0B6B3A'], ['Guarani', '#0B6B3A', '#fff'], ['Ponte Preta', '#111', '#fff'], ['São Caetano', '#1B3E8A', '#fff']]

// ① as três copas
const copa = (emoji, nome, lados, atraso, cor) => `
  <div style="display:flex;align-items:center;gap:24px;width:900px;background:#fff;border:5px solid ${INK};border-radius:24px;
    box-shadow:8px 8px 0 ${INK};padding:22px 28px;${entra(atraso)}">
    <span style="font-size:84px;line-height:1">${emoji}</span>
    <span style="flex:1;text-align:left">
      <b style="${OSW};font-size:56px;display:block;line-height:1.02;text-transform:uppercase;color:${cor}">${nome}</b>
      <span style="font-size:28px;font-weight:700;color:rgba(12,12,12,.58)">${lados}</span>
    </span>
  </div>`

// ② a liga de sempre: 20 linhas, corte depois do 16º
const ligaLinhas = Array.from({ length: 20 }, (_, i) => {
  const dentro = i < 16, eu = i === 5
  return `<div style="display:flex;align-items:center;gap:14px;height:44px;padding:0 18px;border-bottom:2px solid #0001;
    background:${eu ? '#FFE07A' : dentro ? '#E3F2E6' : '#f1ece0'};${eu ? `outline:4px solid ${INK};outline-offset:-4px;` : ''}
    animation:entra .3s ease-out ${(5.0 + i * .06).toFixed(2)}s both">
    <span style="${OSW};font-size:26px;width:40px">${i + 1}º</span>
    <span style="flex:1;display:flex"><span style="height:14px;border-radius:7px;background:${eu ? INK : 'rgba(12,12,12,.22)'};width:${eu ? 180 : 140 + (i * 37) % 160}px"></span></span>
    ${eu ? `<span style="${OSW};font-size:26px">você 🫵</span>` : ''}
    <span style="${OSW};font-size:26px;width:44px;text-align:right">${Math.max(4, 48 - i * 2 - (i % 3))}</span>
  </div>${i === 15 ? `<div style="background:${GREEN};color:#fff;${OSW};font-size:24px;text-align:center;padding:5px;
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) 6.4s both">▲ OS 16 PRIMEIROS VÃO PRA COPA</div>` : ''}`
}).join('')

// ③ escolha: Rio × SP com quem já pegou
const DONO = { Flamengo: '1º', Corinthians: '2º', Palmeiras: '3º', Vasco: '4º', 'São Paulo': '5º' }
const cartao = (c, atraso) => {
  const d = DONO[c[0]], meu = c[0] === 'Botafogo'
  return `<div style="position:relative;display:flex;align-items:center;gap:12px;border:4px solid ${INK};border-radius:16px;padding:10px 12px;
    background:${d ? '#e3dccb' : '#fff'};opacity:${d ? .72 : 1};${entra(atraso)}">
    ${meu ? `<span style="position:absolute;inset:-4px;border:4px solid ${INK};border-radius:16px;background:${GOLD};z-index:0;
      animation:apar .01s linear 13.0s both;opacity:0"></span>` : ''}
    <span style="position:relative;z-index:1;display:flex;align-items:center;gap:12px;min-width:0">
      ${bola(c, 46)}
      <span style="text-align:left;min-width:0">
        <b style="${OSW};font-size:28px;display:block;white-space:nowrap;line-height:1.1">${c[0]}</b>
        <span style="font-size:20px;font-weight:800;color:${d ? RED : GREEN}">${d ? `🔒 ${d} da liga` : meu ? '<span class="troca">🆓 livre</span><span class="vira">✅ é seu!</span>' : '🆓 livre'}</span>
      </span>
    </span>
  </div>`
}
// o relógio de 60 caindo (no vídeo anda ~3× mais rápido, e a tela avisa)
const RELOGIO = Array.from({ length: 12 }, (_, i) => 60 - i * 3).map((v, i, a) => {
  const ini = 10.4 + i * 0.22, fim = i === a.length - 1 ? 15.6 : ini + 0.22
  return `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;
    animation:apar .01s linear ${ini.toFixed(2)}s both, some .01s linear ${fim.toFixed(2)}s both">${v}s</span>`
}).join('')

// ④ convocação: 3 craques do Botafogo que têm rosto no jogo + o resto em bolinha
const CONV = [
  { nome: 'Garrincha', ano: 1958, f: 'garrincha-botafogo-1958', t: 17.4 },
  { nome: 'Didi', ano: 1958, f: 'didi-botafogo-1958', t: 18.1 },
  { nome: 'Jairzinho', ano: 1970, f: 'jairzinho-botafogo-1970', t: 18.8 },
]
const face = (p) => `
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${p.t}s both">
    <img src="${rosto(p.f)}" style="width:170px;height:170px;border-radius:50%;border:6px solid ${INK};box-shadow:6px 6px 0 ${INK};
      background:${GOLD};object-fit:cover">
    <b style="${OSW};font-size:34px;text-transform:uppercase">${p.nome}</b>
    <span style="font-size:24px;font-weight:700;color:rgba(12,12,12,.55)">Botafogo ${p.ano}</span>
  </div>`
const RELOGIO90 = Array.from({ length: 8 }, (_, i) => 90 - i * 4).map((v, i, a) => {
  const ini = 16.0 + i * 0.6, fim = i === a.length - 1 ? 21.2 : ini + 0.6
  return `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;
    animation:apar .01s linear ${ini.toFixed(2)}s both, some .01s linear ${fim.toFixed(2)}s both">${v}s</span>`
}).join('')
const onze = `
  <div style="display:flex;flex-direction:column;gap:16px;align-items:center">
    ${[3, 3, 4, 1].map((n, li) => `
      <div style="display:flex;gap:16px">
        ${Array.from({ length: n }, (_, i) => `
          <span style="width:54px;height:54px;border-radius:50%;border:5px solid ${INK};background:${li === 3 ? '#F3D34A' : li === 2 ? '#DBD1B5' : '#BFE3C7'};
            box-shadow:4px 4px 0 ${INK};display:inline-block;
            animation:pop .42s cubic-bezier(.2,1.6,.4,1) ${(19.4 + (li * 4 + i) * 0.07).toFixed(2)}s both"></span>`).join('')}
      </div>`).join('')}
  </div>`

// ⑤ os dois lados
const ladoCol = (titulo, arr, atraso) => `
  <div style="width:440px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};overflow:hidden;${entra(atraso)}">
    <p style="background:${INK};color:#fff;${OSW};font-size:30px;text-transform:uppercase;padding:10px">${titulo}</p>
    ${arr.map((c, i) => `<div style="display:flex;align-items:center;gap:12px;padding:6px 14px;border-bottom:2px solid #0001;
      background:${i < 4 ? '#E3F2E6' : '#fff'}">${bola(c, 36)}<b style="${OSW};font-size:25px;white-space:nowrap">${c[0]}</b></div>
      ${i === 3 ? `<div style="background:${GREEN};color:#fff;${OSW};font-size:19px;padding:3px">▲ 4 VÃO PRAS QUARTAS</div>` : ''}`).join('')}
  </div>`
const fase = (txt, atraso) => `
  <div style="background:${INK};color:#fff;border:4px solid ${INK};border-radius:16px;padding:14px 26px;${OSW};font-size:40px;
    box-shadow:6px 6px 0 ${GOLD};animation:entra .42s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">${txt}</div>`

// ⑥ cartas que só existem aqui (são de cartas-regionais.ts)
const REG = [
  ['Zózimo', 'Bangu', 1958], ['Arturzinho', 'Bangu', 1985], ['Lugão', 'Volta Redonda', 2005],
  ['Rodrigo Posso', 'Ipatinga', 2005], ['Cenilson', 'Moto Club', 1977], ['Joanderson', 'River-PI', 2024],
]
const regCard = ([n, c, a], i) => `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;width:880px;background:#fff;border:5px solid ${INK};
    border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:16px 26px;${entra(27.4 + i * .3)}">
    <b style="${OSW};font-size:42px;text-transform:uppercase">${n}</b>
    <span style="${OSW};font-size:30px;color:${GREEN};white-space:nowrap">${c} ${a}</span>
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
@keyframes dedo{0%{transform:translate(120px,-160px);opacity:0}60%{transform:translate(0,0);opacity:1}80%{transform:scale(.85)}100%{transform:scale(1);opacity:1}}
@keyframes zera{to{opacity:0;font-size:0}}
.troca{animation:zera .01s linear 13s both}
.vira{opacity:0;animation:apar .01s linear 13s both;color:${INK}}
</style><body>

<!-- ① chegaram -->
${cena(0, 4.4, `
  <p style="font-size:140px;line-height:1;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .1s both">🏟️</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin-top:14px;animation:sobe .45s .3s both">chegaram as</p>
  <p style="${OSW};font-size:112px;text-transform:uppercase;line-height:1;color:${RED};margin-bottom:40px;
    animation:pop .55s cubic-bezier(.2,1.6,.4,1) .55s both">copas regionais</p>
  <div style="display:flex;flex-direction:column;gap:22px">
    ${copa('🔥', 'Rio × São Paulo', 'Flamengo, Vasco, Corinthians, Palmeiras…', 1.1, RED)}
    ${copa('🧉', 'Sul × Minas-PR', 'Inter, Grêmio, Cruzeiro, Atlético-MG…', 1.5, GREEN)}
    ${copa('🌵', 'Copa do Nordeste', 'Bahia, Sport, Fortaleza, Ceará…', 1.9, ROXO)}
  </div>`)}

<!-- ② a liga de sempre -->
${cena(4.4, 9.4, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.08;animation:sobe .45s 4.5s both">
    primeiro, a liga<br><span style="color:${GREEN}">de sempre</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.6);margin:12px 0 26px;animation:sobe .45s 4.7s both">leilão às cegas · 20 clubes</p>
  <div style="width:820px;border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};overflow:hidden;background:#fff">${ligaLinhas}</div>`)}

<!-- ③ escolha na ordem da tabela -->
${cena(9.4, 15.6, `
  <p style="${OSW};font-size:58px;text-transform:uppercase;line-height:1.08;animation:sobe .45s 9.5s both">
    escolhe o clube<br><span style="color:${RED}">na ordem da tabela</span></p>
  <div style="display:flex;align-items:center;gap:22px;width:960px;background:${INK};color:#fff;border-radius:22px;padding:18px 26px;
    margin:26px 0 22px;box-shadow:7px 7px 0 ${GOLD};animation:pop .45s cubic-bezier(.2,1.6,.4,1) 9.9s both">
    <span style="${OSW};font-size:76px;color:${GOLD}">6º</span>
    <span style="flex:1;text-align:left"><b style="${OSW};font-size:38px;display:block">SUA VEZ DE ESCOLHER</b>
      <span style="font-size:24px;font-weight:700;color:#ccc">o 1º escolheu qualquer um, depois o 2º…</span></span>
    <span style="position:relative;width:130px;height:80px;${OSW};font-size:60px;color:${GOLD}">${RELOGIO}</span>
  </div>
  <p style="${OSW};font-size:30px;margin-bottom:10px;animation:sobe .4s 10.2s both">🏖️ LADO DO RIO</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:960px">${RIO.map((c, i) => cartao(c, 10.3 + i * .08)).join('')}</div>
  <p style="${OSW};font-size:30px;margin:18px 0 10px;animation:sobe .4s 10.9s both">🏙️ LADO DE SÃO PAULO</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:960px">${SP.map((c, i) => cartao(c, 11.0 + i * .08)).join('')}</div>
  <span style="position:absolute;left:330px;top:745px;font-size:110px;animation:dedo .6s ease-out 12.4s both;opacity:0">🫵</span>
  <div style="margin-top:24px;width:960px;background:#FFE3DD;border:4px solid ${INK};border-radius:18px;padding:14px 20px;
    font-size:28px;font-weight:800;line-height:1.35;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 13.6s both">
    ⏱️ 60s pra escolher · não escolheu?<br>fica com o <span style="color:${RED}">PIOR clube que sobrou</span> 😬</div>
  <p style="font-size:20px;font-weight:700;color:rgba(12,12,12,.45);margin-top:10px">relógio acelerado no vídeo</p>`)}

<!-- ④ convocação -->
${cena(15.6, 21.2, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.08;animation:sobe .45s 15.7s both">
    e convoca <span style="color:${ROXO}">11</span><br>do seu clube</p>
  <div style="position:relative;width:200px;height:110px;margin:20px 0 28px;background:${GOLD};border:5px solid ${INK};border-radius:22px;
    box-shadow:6px 6px 0 ${INK};${OSW};font-size:68px;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 16.0s both">${RELOGIO90}</div>
  <div style="display:flex;gap:30px;margin-bottom:34px">${CONV.map(face).join('')}</div>
  ${onze}
  <div style="margin-top:34px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 20.2s both">${pill('90s · igual ao Leilão de Clubes', '#fff', INK, 34)}</div>`)}

<!-- ⑤ os dois lados -->
${cena(21.2, 26.4, `
  <p style="${OSW};font-size:58px;text-transform:uppercase;line-height:1.08;animation:sobe .45s 21.3s both">
    rio <span style="color:${RED}">×</span> são paulo</p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.62);margin:10px 0 26px;animation:sobe .45s 21.5s both">
    cada clube joga contra os 8 do OUTRO lado</p>
  <div style="display:flex;gap:24px">${ladoCol('🏖️ Rio', [RIO[2], RIO[0], RIO[3], RIO[1], RIO[4], RIO[6], RIO[5], RIO[7]], 21.8)}${ladoCol('🏙️ SP', [SP[1], SP[0], SP[2], SP[3], SP[5], SP[4], SP[6], SP[7]], 22.1)}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:36px">
    ${fase('quartas cruzadas', 23.6)}
    ${fase('semi', 23.95)}
    ${fase('final 🏆', 24.3)}
  </div>`)}

<!-- ⑥ jogador de clube pequeno -->
${cena(26.4, 31.4, `
  <p style="font-size:110px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 26.5s both">🃏</p>
  <p style="${OSW};font-size:58px;text-transform:uppercase;line-height:1.08;margin:10px 0 30px;animation:sobe .45s 26.7s both">
    +444 cartas de<br><span style="color:${GREEN}">clube pequeno</span></p>
  <div style="display:flex;flex-direction:column;gap:16px">${REG.map(regCard).join('')}</div>
  <div style="margin-top:34px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 29.6s both">${pill('só entram nas copas regionais', GOLD, INK, 34)}</div>`)}

<!-- ⑦ onde + marca -->
${cena(31.4, 60, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.1;animation:sobe .45s 31.5s both">monta a sala<br>com a turma</p>
  <div style="display:flex;flex-direction:column;gap:18px;margin:36px 0;align-items:center">
    ${fase('🌐 Online', 31.9)}
    ${fase('➕ Criar sala', 32.2)}
    ${fase('🏆 Depois da liga', 32.5)}
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 33.1s both">
    ${pill('🔥 Rio × SP', '#fff', INK, 30)}${pill('🧉 Sul × Minas', '#fff', INK, 30)}${pill('🌵 Nordeste', '#fff', INK, 30)}
  </div>
  <p style="${OSW};font-size:60px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 33.6s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-regionais-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-regionais-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(36800)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)