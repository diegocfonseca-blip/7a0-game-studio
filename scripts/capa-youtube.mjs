// ─── 🖼️ CAPAS PRO YOUTUBE (thumbnail) ────────────────────────────────────────
// Pedido do Diego (02/09): *"preciso também de uma foto, né? capa? não
// entendo… e texto também"*. A "foto" é a CAPA (thumbnail): a imagem que o
// YouTube mostra antes de dar play. É ela que decide o clique.
//
// Saem DUAS, porque o YouTube tem dois formatos:
//   • 16:9 (1280×720)  → capa do vídeo NORMAL (a apresentação de 2 min)
//   • 9:16 (1080×1920) → capa do SHORT (o reel de 28 s); no Short o YouTube
//     usa um quadro do próprio vídeo, mas dá pra escolher/enviar esta
//
// Regras de capa que funcionam (e que eu segui): NO MÁXIMO 4 palavras, letra
// gigante, contraste alto, um "rosto" (aqui a mascote — arte real do jogo),
// e a marca pequena. Nada de frase inteira: no celular a capa tem 2 cm.
//
// Mesma técnica dos mockups: HTML no estilo da casa → Playwright fotografa.
//   node scripts/capa-youtube.mjs [--pasta /tmp/capas]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const PASTA = arg('--pasta', '/tmp/capas')
mkdirSync(PASTA, { recursive: true })

const b64 = p => readFileSync(p).toString('base64')
const FONTES = [500, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${b64(p)}`
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const MASCOTE = img('src/escalacao/img/al-takahdao-mascote.webp')
const ESCUDOS = ['neymarzetti', 'nata', 'papao', 'al-takahdao'].map(n => img(`src/escalacao/img/${n}-escudo.webp`))

const base = (w, h, corpo) => `<!doctype html><meta charset="utf-8"><style>${FONTES}
  html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${CREME};color:${INK};font-family:Oswald,sans-serif}
  .pill{display:inline-block;background:${GOLD};color:${INK};border:5px solid ${INK};border-radius:999px;box-shadow:6px 6px 0 ${INK};
    padding:10px 28px;${OSW};letter-spacing:.06em;text-transform:uppercase}
  .marca{position:absolute;${OSW};text-transform:uppercase;color:rgba(12,12,12,.55)}
</style><body>${corpo}</body>`

// ── 16:9 — capa do vídeo normal ─────────────────────────────────────────────
const capa169 = base(1280, 720, `
  <div style="position:absolute;inset:0;background:
    radial-gradient(circle at 78% 55%, rgba(255,196,0,.55), transparent 42%),
    repeating-linear-gradient(135deg, transparent 0 46px, rgba(12,12,12,.045) 46px 48px)"></div>
  <img src="${MASCOTE}" style="position:absolute;right:40px;bottom:-10px;height:690px;filter:drop-shadow(10px 10px 0 ${INK})">
  <div style="position:absolute;left:56px;top:56px;width:720px">
    <p style="${OSW};font-size:58px;text-transform:uppercase;line-height:1;margin:0;color:rgba(12,12,12,.7)">é tipo Brasfoot</p>
    <p style="${OSW};font-size:124px;text-transform:uppercase;line-height:.92;margin:8px 0 0">só que com<br><span style="color:${GREEN}">a turma</span></p>
    <p style="margin:26px 0 0"><span class="pill" style="font-size:32px">🔨 leilão às cegas · grátis</span></p>
  </div>
  <div style="position:absolute;left:56px;bottom:36px;display:flex;gap:14px;align-items:center">
    ${ESCUDOS.slice(0, 3).map(s => `<img src="${s}" style="height:78px;filter:drop-shadow(4px 4px 0 ${INK})">`).join('')}
    <span class="marca" style="position:static;font-size:30px;margin-left:10px">⚽ Leilão <span style="color:${RED}">Legends</span></span>
  </div>`)

// ── 9:16 — capa do Short ────────────────────────────────────────────────────
const capa916 = base(1080, 1920, `
  <div style="position:absolute;inset:0;background:
    radial-gradient(circle at 50% 62%, rgba(255,196,0,.55), transparent 40%),
    repeating-linear-gradient(135deg, transparent 0 46px, rgba(12,12,12,.045) 46px 48px)"></div>
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center;padding:0 60px">
    <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1;margin:0;color:rgba(12,12,12,.7)">seu amigo pagou</p>
    <p style="${OSW};font-size:300px;line-height:.9;margin:0;color:${RED}">180</p>
    <p style="${OSW};font-size:82px;text-transform:uppercase;line-height:1;margin:10px 0 0">num jogador de <span style="color:${GREEN}">40</span></p>
  </div>
  <img src="${MASCOTE}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:230px;height:820px;filter:drop-shadow(12px 12px 0 ${INK})">
  <p style="position:absolute;left:0;right:0;bottom:150px;text-align:center;margin:0"><span class="pill" style="font-size:44px">QUASE! 😱</span></p>
  <p class="marca" style="left:0;right:0;bottom:44px;text-align:center;font-size:36px">⚽ Leilão <span style="color:${RED}">Legends</span> · leilaolegends.com</p>`)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h] of [['capa-youtube-16x9.png', capa169, 1280, 720], ['capa-short-9x16.png', capa916, 1080, 1920]]) {
  const p = `${PASTA}/${nome}.html`; writeFileSync(p, html)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300)
  await pg.screenshot({ path: `${PASTA}/${nome}`, type: 'png' })
  await pg.close(); console.log(`${PASTA}/${nome}`)
}
await b.close()
