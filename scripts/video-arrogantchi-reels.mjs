// ─── 🎬 CHEGOU O ARROGANTCHI — vídeo 9:16 pro Reels (Diego 08/10) ───────────────
//
// Pedido: *"faz um vídeo desse time daqueles mockups vídeos que já sabemos… falando do
// chegou o Arrogantchi e fale as frases bordões e no final a propaganda do Leilão
// Legends: não precisa baixar nada, jogue agora de graça"*.
//
// Mesma receita do `video-batismo-reels.mjs` (cenas em HTML na identidade do jogo →
// print 1080×1920 → ffmpeg com zoom lento e fade), com duas cenas a mais pros BORDÕES
// do dono ("Pra que jogar a bola na Mavie?" e "ARROGANTCHI!") e o fecho de propaganda.
// Sem áudio de propósito (o som em alta se escolhe dentro do Instagram).
// 🚫 Regra 05/09: o post NUNCA diz de quem era o assento — aqui é só "chega na Série A".
//
//   node scripts/video-arrogantchi-reels.mjs [--saida arrogantchi-reels.mp4] [--alta]
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', 'arrogantchi-reels.mp4')
const ALTA = process.argv.includes('--alta')
const ESCUDO = 'src/escalacao/img/arrogantchi-escudo.webp'
const MASCOTE = 'src/escalacao/img/arrogantchi-mascote.webp'
const CAMISA = 'scripts/kits/arrogantchi-camisa.webp'

const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(${fonte(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', CREME = '#F4ECD6', GREEN = '#1B7A3D'
const AZUL = '#4EC3FC', PRETO = '#141716' // as duas cores medidas no manto do dono
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const base = (corpo, extra = '') => `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden}
.wrap{height:100%;padding:110px 80px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative}
.pill{display:inline-block;background:${GOLD};border:7px solid ${INK};border-radius:999px;box-shadow:11px 11px 0 ${INK};
  padding:14px 40px;${OSW};font-size:36px;letter-spacing:.12em;text-transform:uppercase}
h1{${OSW};font-size:150px;line-height:.9;text-transform:uppercase;margin:44px 0 0}
h1 span{color:${RED}}
.sub{font-family:system-ui;font-size:38px;font-weight:700;color:rgba(12,12,12,.65);margin-top:36px;line-height:1.4;max-width:880px}
.moldura{background:#fff;border:9px solid ${INK};border-radius:38px;box-shadow:16px 16px 0 ${INK};padding:44px 40px}
.rot{${OSW};font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.nome{${OSW};font-size:64px;text-transform:uppercase;margin-top:18px}
.leg{font-family:system-ui;font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:10px}
.balao{position:relative;background:#fff;border:9px solid ${INK};border-radius:44px;box-shadow:16px 16px 0 ${INK};padding:40px 56px;${OSW};font-size:84px;line-height:1.02;text-transform:uppercase;max-width:920px}
.balao:after{content:'';position:absolute;left:50%;bottom:-46px;width:0;height:0;border-left:30px solid transparent;border-right:30px solid transparent;border-top:46px solid ${INK};transform:translateX(-50%)}
.balao:before{content:'';position:absolute;left:50%;bottom:-32px;width:0;height:0;border-left:22px solid transparent;border-right:22px solid transparent;border-top:34px solid #fff;transform:translateX(-50%);z-index:1}
${extra}</style><div class="wrap">${corpo}</div>`

// ── as 7 cenas ─────────────────────────────────────────────────────────────
const CENAS = [
  // ① chegou
  base(`
    <span class="pill">😜 Batismo de Lenda · Série A</span>
    <h1>Chegou o<br><span>Arrogantchi</span></h1>
    <p class="sub">O clube do <b>Heitor</b> ganhou escudo, mascote e manto — de verdade, dentro do jogo. E chega direto na <b>Série A</b>.</p>`),
  // ② escudo
  base(`
    <p class="rot">🛡️ o escudo</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(ESCUDO)}" style="height:620px;object-fit:contain"></div>
    <p class="nome">Arrogantchi FC</p>
    <p class="leg">azul-celeste e preto · chega na Série A</p>`),
  // ③ bordão 1 — a mascote fala
  base(`
    <div class="balao">Pra que jogar<br>a bola na <span style="color:${AZUL};-webkit-text-stroke:3px ${INK}">Mavie</span>?</div>
    <img src="${img(MASCOTE)}" style="height:760px;object-fit:contain;margin-top:70px;filter:drop-shadow(14px 14px 0 ${INK})">
    <p class="leg" style="margin-top:30px">a mascote: <b>O Arrogantchi</b> — com a Mavie no colo</p>`),
  // ④ bordão 2 — o grito
  base(`
    <p class="rot">🗣️ o grito da torcida</p>
    <h1 style="font-size:210px;margin-top:40px;-webkit-text-stroke:0;color:${AZUL};text-shadow:14px 14px 0 ${INK}">Arro<br>gantchi!</h1>
    <p class="sub" style="margin-top:50px">toda vez que o time faz gol, ele carimba a tela com a língua de fora 👅</p>`,
    `body{background:${PRETO}} .rot{color:rgba(255,255,255,.55)} .sub{color:rgba(255,255,255,.75)}`),
  // ⑤ manto
  base(`
    <p class="rot">🎽 o manto</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(CAMISA)}" style="height:640px;object-fit:contain"></div>
    <p class="nome">azul-celeste e preto</p>
    <p class="leg">as cores medidas na arte do dono</p>`),
  // ⑥ onde a mascote aparece
  base(`
    <p class="rot">😜 onde ele aparece</p>
    <div style="display:flex;flex-direction:column;gap:26px;margin-top:40px;width:900px">
      ${[['⚽', 'Carimbo no gol', 'passa a tela inteira toda vez que o Arrogantchi marca'], ['🏆', 'Festão de campeão', 'invade a tela quando o título vem'], ['👑', 'Entrada de gala', 'holofote e escudo no telão quando o Heitor entra na sala']]
        .map(([e, t, s]) => `<div style="display:flex;align-items:center;gap:28px;background:#fff;border:8px solid ${INK};border-radius:30px;box-shadow:12px 12px 0 ${INK};padding:30px 36px;text-align:left">
          <span style="font-size:76px">${e}</span><div><p style="${OSW};font-size:46px;text-transform:uppercase">${t}</p><p style="font-size:30px;font-weight:700;color:rgba(12,12,12,.6);margin-top:4px">${s}</p></div></div>`).join('')}
    </div>`),
  // ⑦ propaganda
  base(`
    <p style="font-size:150px;line-height:1">🔨</p>
    <h1 style="font-size:124px;margin-top:26px">Monte o seu<br><span>time de lendas</span></h1>
    <p class="sub">Leilão às cegas com os amigos. Ganhe títulos, batize o seu clube.</p>
    <div style="margin-top:56px;background:${GOLD};border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
      ${OSW};font-size:60px;text-transform:uppercase;padding:36px 54px">⚽ leilaolegends.com</div>
    <div style="margin-top:44px;background:${GREEN};color:#fff;border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
      ${OSW};font-size:54px;text-transform:uppercase;padding:30px 50px;line-height:1.1">Não precisa baixar nada<br><span style="color:${GOLD}">jogue agora, de graça</span></div>`),
]

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reels-'))
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: ALTA ? 2 : 1 })
const pngs = []
for (let i = 0; i < CENAS.length; i++) {
  const f = path.join(tmpDir, `cena${i}.html`)
  fs.writeFileSync(f, CENAS[i])
  await p.goto('file://' + f)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  const png = path.join(tmpDir, `cena${i}.png`)
  await p.screenshot({ path: png })
  pngs.push(png)
}
await b.close()
console.log(`${pngs.length} cenas desenhadas`)

// ── ffmpeg: zoom lento em cada cena + transição suave (mesma receita do batismo) ──
const FADE = 0.5, FPS = 30
const DURS = [3.0, 3.0, 3.4, 2.8, 3.0, 3.4, 4.0] // bordão 1 e "onde aparece" têm mais texto; o fecho fica mais
const clipes = pngs.map((png, i) => {
  const out = path.join(tmpDir, `c${i}.mp4`)
  const DUR = DURS[i]
  const frames = Math.round(DUR * FPS)
  const z = i % 2 === 0 ? `min(1.0+0.0009*on,1.10)` : `max(1.10-0.0009*on,1.0)`
  execFileSync('ffmpeg', ['-v', 'error', '-loop', '1', '-framerate', String(FPS), '-t', String(DUR), '-i', png,
    '-vf', `scale=${ALTA ? '2160:3840' : '1620:2880'},zoompan=z='${z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'veryfast', '-crf', ALTA ? '16' : '22',
    '-frames:v', String(frames), '-y', out])
  return out
})
let atual = clipes[0]
let acc = DURS[0]
for (let i = 1; i < clipes.length; i++) {
  const out = path.join(tmpDir, `j${i}.mp4`)
  const offset = (acc - FADE).toFixed(2)
  execFileSync('ffmpeg', ['-v', 'error', '-i', atual, '-i', clipes[i],
    '-filter_complex', `[0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=${offset},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'medium', '-crf', ALTA ? '16' : '20',
    ...(ALTA ? ['-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2'] : []),
    '-y', out])
  atual = out
  acc += DURS[i] - FADE
}
fs.copyFileSync(atual, SAIDA)
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SAIDA]).toString().trim()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024 / 1024).toFixed(1)} MB · ${Number(dur).toFixed(1)}s · 1080x1920`)
// 📸 as cenas também saem como PNG do lado do vídeo (pra conferir antes de postar)
const cenasDir = SAIDA.replace(/\.mp4$/, '') + '-cenas'
fs.mkdirSync(cenasDir, { recursive: true })
pngs.forEach((png, i) => fs.copyFileSync(png, path.join(cenasDir, `cena${i + 1}.png`)))
fs.rmSync(tmpDir, { recursive: true, force: true })
