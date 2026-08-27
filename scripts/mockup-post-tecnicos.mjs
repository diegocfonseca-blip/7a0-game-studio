// ─── 📢 KIT DE LANÇAMENTO DOS TÉCNICOS: feed + stories + VÍDEO (27/08) ───────
// Pedido do Diego: "vocês pediram muito e agora teremos os técnicos!! Quero
// vídeo e postagem p stories e feed".
//
// 🤫 Sem maquiagem, sem mapa, sem tela interna — é HYPE de lançamento:
// técnicos com carta igual jogador, formações próprias, aliciar às cegas,
// contrato de 5 temporadas. Identidade visual do jogo (creme/tinta/dourado,
// Oswald, sombra dura).
//
// Gera: post-tecnicos-feed.png (1080×1350) · post-tecnicos-stories.png
// (1080×1920) · post-tecnicos-video.mp4 (1080×1920, ~14 s).
//   node scripts/mockup-post-tecnicos.mjs [--dir saida/]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const DIR = arg('--dir', '.')
mkdirSync(DIR, { recursive: true })
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const chip = (t, s = 22) => `<span style="${OSW};font-weight:800;font-size:${s}px;border:3px solid ${INK};border-radius:12px;padding:4px 12px;background:rgba(255,255,255,.9);color:${INK}">${t}</span>`
const cartaMisterio = (w = 340) => `
  <div style="width:${w}px;border:5px solid ${INK};border-radius:22px;background:#fff;box-shadow:7px 7px 0 ${INK};padding:22px 24px;flex:none">
    <span style="${OSW};font-size:20px;background:${INK};color:#fff;border-radius:10px;padding:3px 14px">TEC</span>
    <p style="${OSW};font-weight:900;font-size:44px;margin:10px 0 0;letter-spacing:.05em">? ? ? ? ?</p>
    <p style="font-family:system-ui;font-size:17px;font-weight:800;color:#5a5647;margin:10px 0 0;line-height:1.35">🎲 contratação ÀS CEGAS: você só descobre tudo quando ele for SEU</p>
  </div>`
const cartaLenda = (w = 340) => `
  <div style="width:${w}px;border:5px solid ${INK};border-radius:22px;background:linear-gradient(160deg,#FFE79A,#FFC400 60%,#D99E00);box-shadow:7px 7px 0 ${INK};padding:22px 24px;flex:none">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:20px;background:${INK};color:#fff;border-radius:10px;padding:3px 14px">TEC</span>
      <span style="${OSW};font-weight:900;font-size:19px;letter-spacing:.06em">👑 LENDA</span>
    </div>
    <p style="${OSW};font-weight:900;font-size:40px;margin:10px 0 0;line-height:1.05">Alex Ferguson 🇬🇧</p>
    <p style="${OSW};font-weight:800;font-size:19px;margin:6px 0 0;opacity:.85">⚽ Ofensivo · 📊 89–95</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${['4-4-2', '4-3-3', '4-2-3-1', '4-5-1', '3-4-3'].map(f => chip(f, 17)).join('')}</div>
  </div>`
const bullets = (fs = 26) => `
  <div style="background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:26px 30px">
    <p style="${OSW};font-weight:900;font-size:${fs + 4}px;margin:0 0 14px;text-transform:uppercase">Como vai ser 👇</p>
    <p style="font-family:system-ui;font-size:${fs}px;font-weight:700;line-height:1.75;margin:0">
      🧢 <b>Mais de 100 técnicos de verdade</b> — de Ferguson e Guardiola a Telê, Renato Gaúcho e… Joel Santana 😂<br>
      🃏 Carta IGUAL jogador: 👑 Lenda · ⭐ Craque · 💜 Promessa · 💚 Bom · 🤎 Foi profissional<br>
      📊 O overall do técnico <b>JOGA</b> — dia inspirado, dia apagado<br>
      🎽 Cada técnico traz <b>AS FORMAÇÕES DELE</b> — são 15 esquemas no jogo!<br>
      🔨 Aliciar <b>ÀS CEGAS</b>: leilão você × rivais × o clube dono<br>
      📝 Contrato de 5 temporadas · demitiu? <b>multa na hora</b> 💸</p>
  </div>`
const pill = (t, fs = 30) => `<div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;box-shadow:5px 5px 0 ${INK};padding:10px 28px;${OSW};font-weight:900;font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${t}</div>`

// ── FEED 1080×1350 ──
const feed = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;height:1350px;background:${CREME};padding:54px;font-family:system-ui;overflow:hidden}</style><body>
  ${pill('🗣️ vocês pediram muito…', 30)}
  <p style="${OSW};font-weight:900;font-size:96px;line-height:1.02;margin:22px 0 6px;text-transform:uppercase">E vem aí:<br><span style="color:${RED}">os TÉCNICOS!</span> 🧢</p>
  <p style="font-family:system-ui;font-size:28px;font-weight:800;color:#5a5647;margin:0 0 28px">A maior novidade da história do modo carreira. 🔥</p>
  <div style="display:flex;gap:26px;align-items:center;margin-bottom:30px">
    ${cartaMisterio(330)}
    <span style="${OSW};font-size:56px">➜</span>
    ${cartaLenda(390)}
  </div>
  ${bullets(25)}
  <p style="${OSW};font-weight:900;font-size:30px;margin:26px 0 0;text-align:center;text-transform:uppercase">⏳ EM BREVE · ⚽ Leilão <span style="color:${RED}">Legends</span> · leilaolegends.com</p>
</body>`

// ── STORIES 1080×1920 ──
const stories = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;height:1920px;background:${CREME};padding:70px 54px;font-family:system-ui;overflow:hidden}</style><body>
  <div style="text-align:center">${pill('🗣️ vocês pediram muito…', 32)}</div>
  <p style="${OSW};font-weight:900;font-size:118px;line-height:1.0;margin:30px 0 10px;text-transform:uppercase;text-align:center">E vem aí:<br><span style="color:${RED}">os TÉCNICOS!</span> 🧢</p>
  <p style="font-family:system-ui;font-size:32px;font-weight:800;color:#5a5647;margin:0 0 40px;text-align:center">A maior novidade da história do modo carreira 🔥</p>
  <div style="display:flex;flex-direction:column;gap:26px;align-items:center;margin-bottom:40px">
    ${cartaMisterio(560)}
    <span style="${OSW};font-size:60px">⬇️</span>
    ${cartaLenda(560)}
  </div>
  ${bullets(30)}
  <p style="${OSW};font-weight:900;font-size:38px;margin:40px 0 0;text-align:center;text-transform:uppercase">⏳ EM BREVE<br>⚽ Leilão <span style="color:${RED}">Legends</span></p>
</body>`

// ── VÍDEO 1080×1920 (~14 s, cenas por keyframe CSS; gravado em tempo real) ──
const cena = (ini, fim, html, extra = '') => `
  <div class="cena" style="animation:apar 0.01s linear ${ini}s both, some 0.01s linear ${fim}s both;${extra}">${html}</div>`
const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;opacity:0}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes treme{0%,100%{transform:rotate(0)}20%{transform:rotate(-2.5deg)}60%{transform:rotate(2.5deg)}}
@keyframes sobe{0%{transform:translateY(120px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes vira{0%{transform:rotateY(0)}100%{transform:rotateY(180deg)}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.pop{animation:pop .7s cubic-bezier(.2,1.6,.4,1) both}
</style><body>
  ${cena(0, 3.0, `
    <p class="pop" style="${OSW};font-weight:900;font-size:150px;text-align:center;line-height:1.05;text-transform:uppercase;animation-delay:.2s">🗣️<br>VOCÊS<br>PEDIRAM<br>MUITO…</p>`)}
  ${cena(3.0, 6.2, `
    <div class="pop" style="animation-delay:3.1s;text-align:center">
      <p style="${OSW};font-weight:900;font-size:130px;line-height:1.0;text-transform:uppercase">E VEM AÍ:</p>
      <p style="${OSW};font-weight:900;font-size:170px;line-height:1.0;text-transform:uppercase;color:${RED};animation:treme .9s ease-in-out 3.6s 3">OS<br>TÉCNICOS!</p>
      <p style="font-size:120px;margin-top:10px">🧢</p>
    </div>`)}
  ${cena(6.2, 9.6, `
    <p style="${OSW};font-weight:900;font-size:64px;text-transform:uppercase;margin-bottom:34px;animation:sobe .5s 6.3s both">contratação às cegas… 🎲</p>
    <div style="animation:sobe .5s 6.5s both">${cartaMisterio(620)}</div>
    <p style="font-size:80px;margin:24px 0;animation:sobe .5s 7.4s both">⬇️</p>
    <div style="animation:pop .7s cubic-bezier(.2,1.6,.4,1) 7.8s both">${cartaLenda(640)}</div>`)}
  ${cena(9.6, 12.4, `
    <p style="${OSW};font-weight:900;font-size:76px;text-align:center;line-height:1.15;text-transform:uppercase;animation:sobe .5s 9.7s both">cada técnico traz<br><span style="color:${GREEN}">AS FORMAÇÕES DELE</span> 🎽</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:800px;margin-top:44px">
      ${['4-2-4', '3-5-2', '4-4-2 losango', '4-2-3-1', '5-3-2 líbero', 'árvore de Natal 🎄'].map((f, i) =>
        `<span style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${10.0 + i * 0.28}s both">${chip(f, 34)}</span>`).join('')}
    </div>
    <p style="${OSW};font-weight:900;font-size:52px;margin-top:44px;animation:sobe .5s 11.6s both">são 15 esquemas no jogo! 🔥</p>`)}
  ${cena(12.4, 30, `
    <p style="${OSW};font-weight:900;font-size:70px;text-align:center;line-height:1.3;text-transform:uppercase;animation:sobe .5s 12.5s both">🔨 leilão contra seus rivais<br>📝 contrato de 5 temporadas<br>💸 demitiu? multa!</p>
    <div style="margin-top:60px;animation:pop .7s cubic-bezier(.2,1.6,.4,1) 13.2s both">${pill('⏳ EM BREVE', 44)}</div>
    <p style="${OSW};font-weight:900;font-size:60px;margin-top:40px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 13.6s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>`)}
</body>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })

// estáticos
for (const [nome, html, h] of [['post-tecnicos-feed.png', feed, 1350], ['post-tecnicos-stories.png', stories, 1920]]) {
  const tmp = `/tmp/post-tec-${nome}.html`
  writeFileSync(tmp, html)
  const p = await b.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 2 })
  await p.goto('file://' + tmp)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${DIR}/${nome}` })
  await p.close()
  console.log(`${DIR}/${nome}`)
}

// vídeo: grava em tempo real (webm) e converte pra mp4
const vtmp = `/tmp/post-tec-video.html`
writeFileSync(vtmp, video)
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: '/tmp/post-tec-rec', size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(15500)
await ctx.close()
const webm = readdirSync('/tmp/post-tec-rec').find(f => f.endsWith('.webm'))
execSync(`ffmpeg -y -i /tmp/post-tec-rec/${webm} -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${DIR}/post-tecnicos-video.mp4" 2>/dev/null`)
console.log(`${DIR}/post-tecnicos-video.mp4`)
await b.close()
