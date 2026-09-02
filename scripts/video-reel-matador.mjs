// ─── 🎬 REEL MATADOR 1080×1920 (3 partes × ~9 s ≈ 28 s) ────────────────────
// Pedido do Diego (02/09), depois das 5 partes de 2 minutos: *"achei muito
// cansativo. Preciso de um vídeo matador que funcione e engaje pra reels."*
//
// O que muda em relação à apresentação longa (`video-apresentacao-partes.mjs`):
//   • GANCHO nos 2 primeiros segundos — a mancada do amigo no leilão, não
//     "lembra do Brasfoot" (isso é lento; aqui o Brasfoot vira um golpe de 1,5 s)
//   • UMA ideia por tela, no máximo 6 palavras, letra gigante
//   • corte a cada 1,5–3 s, nada fica parado
//   • termina com chamada curta que também funciona como re-gancho (o reel
//     repete sozinho no Instagram — o fim tem que emendar no começo)
//
// 3 partes separadas pra ele colar no CapCut (ou postar só a 1ª como teaser):
//   parte 1 (~9,5 s)  gancho: a mancada · QUASE! · "isso é o Leilão Legends"
//   parte 2 (~9,0 s)  o que é em 3 golpes: tipo Brasfoot · com 20 amigos · várzea→A
//   parte 3 (~9,0 s)  o clube é SEU (escudo real) · martelo · chama a turma
//
// Mesma técnica dos outros reels: cenas em CSS, Playwright grava, ffmpeg converte.
// Números conferidos no código (02/09): 20 assentos, escada V→D→C→B→A, 45 s.
//
//   node scripts/video-reel-matador.mjs [--so 2] [--pasta /tmp/reel]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const PASTA = arg('--pasta', '/tmp/reel-matador')
const SO = arg('--so', '')
mkdirSync(PASTA, { recursive: true })

const b64 = p => readFileSync(p).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${b64(p)}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const cena = (ini, fim, html, fundo = CREME) => `
  <div class="cena" style="background:${fundo};animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// letra GIGANTE, uma ideia
const golpe = (txt, atraso, cor = INK, fs = 150) => `
  <p style="${OSW};font-size:${fs}px;text-transform:uppercase;text-align:center;line-height:.95;margin:0;color:${cor};
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${txt}</p>`
const apoio = (txt, atraso, fs = 46, cor = 'rgba(12,12,12,.7)') => `
  <p style="font-size:${fs}px;font-weight:700;color:${cor};text-align:center;line-height:1.25;margin:22px 0 0;
    animation:sobe .35s ${atraso}s both">${txt}</p>`
const pill = (txt, bg, cor, atraso, fs = 40) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:5px solid ${INK};border-radius:999px;box-shadow:6px 6px 0 ${INK};
    padding:14px 40px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase;margin-top:30px;
    animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${txt}</span>`
const envelope = (nome, lance, atraso, cor = INK, tremer = false) => `
  <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border:6px solid ${INK};border-radius:24px;
    box-shadow:8px 8px 0 ${INK};padding:22px 36px;width:820px;box-sizing:border-box;
    animation:entra .35s cubic-bezier(.2,1.5,.4,1) ${atraso}s both${tremer ? `, treme .5s ${atraso + 0.9}s 2` : ''}">
    <span style="${OSW};font-size:60px">✉️ ${nome}</span><span style="${OSW};font-size:64px;color:${cor}">${lance}</span></div>`

const ESC = {
  neymarzetti: img('src/escalacao/img/neymarzetti-escudo.webp'),
  nata: img('src/escalacao/img/nata-escudo.webp'),
  takhadao: img('src/escalacao/img/al-takahdao-escudo.webp'),
  papao: img('src/escalacao/img/papao-escudo.webp'),
}
const MASC_TAK = img('src/escalacao/img/al-takahdao-mascote.webp')

const pagina = corpo => `<!doctype html><meta charset="utf-8"><style>${FONTES}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${CREME};color:${INK};font-family:Oswald,sans-serif}
  .cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 60px;opacity:0;box-sizing:border-box}
  @keyframes apar{to{opacity:1}} @keyframes some{to{opacity:0}}
  @keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
  @keyframes entra{0%{transform:translateX(-90px);opacity:0}100%{transform:translateX(0);opacity:1}}
  @keyframes sobe{0%{transform:translateY(70px);opacity:0}100%{transform:translateY(0);opacity:1}}
  @keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  @keyframes treme{0%,100%{transform:translateX(0)}20%{transform:translateX(-14px)}40%{transform:translateX(14px)}60%{transform:translateX(-10px)}80%{transform:translateX(10px)}}
  @keyframes martelo{0%{transform:rotate(-55deg) scale(.6);opacity:0}55%{transform:rotate(22deg) scale(1.15);opacity:1}100%{transform:rotate(0) scale(1)}}
  @keyframes conta{from{width:100%}to{width:0}}
  @keyframes flash{0%{opacity:.9}100%{opacity:0}}
  .marca{position:absolute;bottom:64px;left:0;right:0;text-align:center;${OSW};font-size:38px;color:rgba(12,12,12,.5);text-transform:uppercase}
</style><body>${corpo}
<div class="marca">⚽ Leilão <span style="color:${RED}">Legends</span> · leilaolegends.com</div>
</body>`

// ─── PARTE 1 · o gancho (a mancada) ────────────────────────────────────────
const parte1 = { dur: 9.6, html: `
${cena(0, 2.2, `
  ${golpe('seu amigo<br>pagou <span style="color:' + RED + '">180</span>', 0.05, INK, 130)}
  ${apoio('num jogador que valia 40 😭', 0.6, 50)}`)}
${cena(2.2, 5.4, `
  ${apoio('porque o leilão é <b>às cegas</b>', 2.3, 44)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:26px">
    ${envelope('você', '40', 2.6)}
    ${envelope('o zé', '180', 3.0, RED, true)}
    ${envelope('o cunhado', '0', 3.4, 'rgba(12,12,12,.4)')}
  </div>
  <div style="width:820px;height:30px;border:5px solid ${INK};border-radius:999px;background:#fff;overflow:hidden;margin-top:30px;animation:sobe .3s 2.7s both">
    <div style="height:100%;background:${RED};animation:conta 2.4s linear 2.9s both"></div></div>`)}
${cena(5.4, 7.4, `
  ${golpe('QUASE! 😱', 5.45, RED, 190)}
  ${apoio('quem dá o maior lance leva.<br>ninguém vê o do outro.', 6.0, 44)}`)}
${cena(7.4, 9.6, `
  ${golpe('isso é o<br>Leilão <span style="color:' + RED + '">Legends</span>', 7.45, INK, 120)}
  ${apoio('monta seu time leiloando lendas', 8.0, 46)}
  ${pill('grátis · no navegador', GOLD, INK, 8.4, 36)}`)}
` }

// ─── PARTE 2 · o que é, em 3 golpes ────────────────────────────────────────
const cadeiras = (atraso) => `
  <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;width:940px;margin-top:30px">
    ${Array.from({ length: 20 }, (_, i) => `<span style="width:82px;height:82px;border-radius:50%;border:5px solid ${INK};box-shadow:4px 4px 0 ${INK};
      display:inline-flex;align-items:center;justify-content:center;font-size:40px;background:${i < 8 ? GOLD : '#DBD1B5'};
      animation:pop .3s cubic-bezier(.2,1.6,.4,1) ${(atraso + i * 0.06).toFixed(2)}s both">${i < 8 ? '🙂' : '🤖'}</span>`).join('')}
  </div>`
const degraus = (atraso) => `
  <div style="display:flex;flex-direction:column-reverse;gap:10px;align-items:center;margin-top:48px">
    ${[['🌱 Várzea', '#DBD1B5', 520], ['Série D', '#F3D34A', 600], ['Série C', '#BFE3C7', 680], ['Série B', '#B9D8F5', 760], ['👑 Série A', GOLD, 840]]
      .map(([r, c, w], i) => `<div style="width:${w}px;background:${c};border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:8px 0;
        ${OSW};font-size:44px;text-transform:uppercase;text-align:center;animation:sobe .3s ${(atraso + i * 0.18).toFixed(2)}s both">${r}</div>`).join('')}
  </div>`
const parte2 = { dur: 9.2, html: `
${cena(0, 2.6, `
  ${apoio('é tipo', 0.05, 56)}
  ${golpe('BRASFOOT', 0.3, INK, 170)}
  ${golpe('só que com a turma', 0.9, GREEN, 96)}`)}
${cena(2.6, 5.6, `
  ${golpe('até <span style="color:' + GREEN + '">20 amigos</span><br>na mesma sala', 2.65, INK, 104)}
  ${cadeiras(3.1)}
  ${apoio('manda o código no zap e pronto', 4.5, 40)}`)}
${cena(5.6, 9.2, `
  ${golpe('ou sozinho:<br>da <span style="color:' + RED + '">várzea</span> à Série A', 5.65, INK, 96)}
  ${degraus(6.1)}
  ${apoio('38 rodadas por temporada · copas · estádio', 7.4, 38)}`)}
` }

// ─── PARTE 3 · o clube é SEU + martelo + chamada ───────────────────────────
const escudo = (src, atraso, h) => `<img src="${src}" style="height:${h}px;width:auto;animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">`
const parte3 = { dur: 9.2, html: `
${cena(0, 3.2, `
  ${golpe('e o time<br>pode ser <span style="color:' + RED + '">o seu</span>', 0.05, INK, 120)}
  <div style="display:flex;gap:26px;align-items:center;margin-top:34px">
    ${escudo(ESC.neymarzetti, 0.6, 250)}${escudo(ESC.nata, 0.8, 250)}${escudo(ESC.papao, 1.0, 250)}
  </div>
  ${apoio('nome, escudo e mascote de verdade', 1.5, 42)}`)}
${cena(3.2, 5.8, `
  <div style="display:flex;gap:34px;align-items:flex-end">
    ${escudo(ESC.takhadao, 3.3, 330)}${escudo(MASC_TAK, 3.55, 430)}
  </div>
  ${golpe('a mascote carimba<br>quando faz gol', 4.0, INK, 88)}`)}
${cena(5.8, 7.6, `
  <p style="font-size:260px;line-height:1;margin:0;transform-origin:80% 80%;animation:martelo .6s cubic-bezier(.2,1.5,.4,1) 5.85s both">🔨</p>
  ${golpe('É SEU!', 6.3, GREEN, 170)}`)}
${cena(7.6, 9.2, `
  ${golpe('chama<br>a turma', 7.65, INK, 150)}
  ${pill('leilaolegends.com', INK, GOLD, 8.1, 44)}
  ${apoio('grátis · sem instalar nada', 8.4, 40)}`)}
` }

// ─── grava ─────────────────────────────────────────────────────────────────
const PARTES = [parte1, parte2, parte3]
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (let i = 0; i < PARTES.length; i++) {
  const n = i + 1
  if (SO && String(n) !== SO) continue
  const { dur, html } = PARTES[i]
  const REC = `${PASTA}/rec-${n}`
  rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
  const htmlPath = `${PASTA}/reel-${n}.html`
  writeFileSync(htmlPath, pagina(html))
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
  const vp = await ctx.newPage()
  await vp.goto('file://' + htmlPath)
  await vp.evaluate(() => document.fonts.ready)
  await vp.waitForTimeout(Math.round(dur * 1000) + 400)
  await ctx.close()
  const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
  if (!webm) throw new Error(`parte ${n}: o Playwright não gravou o webm`)
  const saida = `${PASTA}/reel-matador-parte${n}.mp4`
  execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-t', String(dur),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-r', '30', '-movflags', '+faststart', saida], { stdio: 'ignore' })
  console.log(`parte ${n}: ${saida} (${dur}s)`)
}
await b.close()
