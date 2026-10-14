// ─── 🎬 VÍDEO DO BATISMO DO K9 FC + PROPAGANDA (Diego 14/10) ─────────────────
// Pedido: *"vídeo do time do K9 de batismo… no final faça propaganda… jogue agora sem baixar nada, de graça no seu
// navegador… diga que o K9 entra também como jogador no jogo, Grêmio e G3X já como Lenda"* — pra ele repostar.
// Mesmo motor do `video-batismo-reels.mjs` (cenas em HTML → print → ffmpeg com zoom lento), sem áudio de propósito.
// ⚠️ Não falar do PORQUÊ das 2 cartas no mesmo baralho (exceção do Diego, não se divulga).
//   node scripts/video-k9-reels.mjs --saida k9-reels.mp4 [--alta]
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const o = {
  clube: 'K9 FC', escudo: 'src/escalacao/img/k9-escudo.webp', mascote: 'src/escalacao/img/k9-mascote.webp',
  camisa: 'scripts/kits/k9-camisa.webp', saida: arg('saida', 'k9-reels.mp4'), alta: process.argv.includes('--alta'),
}

const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(${fonte(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const partes = o.clube.trim().split(/\s+/)
const l1 = partes.length > 1 ? partes.slice(0, -1).join(' ') : ''
const l2 = partes.length > 1 ? partes[partes.length - 1] : partes[0]

const base = (corpo, extra = '') => `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden}
.wrap{height:100%;padding:110px 80px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.pill{display:inline-block;background:${GOLD};border:7px solid ${INK};border-radius:999px;box-shadow:11px 11px 0 ${INK};
  padding:14px 40px;${OSW};font-size:36px;letter-spacing:.12em;text-transform:uppercase}
h1{${OSW};font-size:150px;line-height:.9;text-transform:uppercase;margin:44px 0 0}
h1 span{color:${RED}}
.sub{font-family:system-ui;font-size:38px;font-weight:700;color:rgba(12,12,12,.65);margin-top:36px;line-height:1.4;max-width:880px}
.moldura{background:#fff;border:9px solid ${INK};border-radius:38px;box-shadow:16px 16px 0 ${INK};padding:44px 40px}
.rot{${OSW};font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:rgba(12,12,12,.5)}
.nome{${OSW};font-size:64px;text-transform:uppercase;margin-top:18px}
.leg{font-family:system-ui;font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:10px}
.rod{position:absolute;left:0;right:0;bottom:64px;text-align:center;${OSW};font-size:34px}
${extra}</style><div class="wrap">${corpo}</div>`

// ── as cenas ──────────────────────────────────────────────────────────────
const carta = (clube, ano, lenda) => `<div style="width:400px;background:${lenda ? 'linear-gradient(150deg,#FFE79A,#FFC400 45%,#E8A200)' : '#fff'};border:9px solid ${INK};border-radius:30px;box-shadow:14px 14px 0 ${INK};padding:34px 26px;text-align:center">
  <p style="${OSW};font-size:30px;letter-spacing:.1em;display:inline-block;background:${INK};color:#fff;border-radius:12px;padding:4px 16px">ATA</p>
  <p style="${OSW};font-size:58px;line-height:1;margin-top:26px;text-transform:uppercase">Kelvin<br>Oliveira</p>
  <p style="${OSW};font-size:40px;color:${RED};margin-top:8px">(K9)</p>
  <p style="font-family:system-ui;font-size:34px;font-weight:800;margin-top:22px">${clube} · ${ano}</p>
  ${lenda ? `<p style="${OSW};font-size:40px;margin-top:18px">👑 LENDA</p>` : ''}</div>`
const CENAS = [
  // ① abertura
  base(`
    <span class="pill">👑 Batismo</span>
    <h1>Nasceu o<br><span>K9 FC</span></h1>
    <p class="sub">O clube do <b>K9</b>, o Rei da Kings League, ganhou escudo, mascote e manto — de verdade, dentro do jogo.</p>`),
  // ② escudo
  base(`
    <p class="rot">🛡️ o escudo</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(o.escudo)}" style="height:640px;object-fit:contain"></div>
    <p class="nome">K9 FC</p>
    <p class="leg">branco e azul</p>`),
  // ③ mascote
  base(`
    <p class="rot">👑 a mascote</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(o.mascote)}" style="height:660px;object-fit:contain"></div>
    <p class="nome">O Rei K9</p>
    <p class="leg">carimba a tela toda vez que o time faz gol</p>`),
  // ④ manto
  base(`
    <p class="rot">🎽 o manto</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(o.camisa)}" style="height:660px;object-fit:contain"></div>
    <p class="nome">Branco e azul</p>
    <p class="leg">a camisa do K9 FC na Loja do Clube</p>`),
  // ⑤ o K9 jogador
  base(`
    <span class="pill">⚽ E tem mais</span>
    <h1 style="font-size:112px">O K9 também<br><span>entra em campo</span></h1>
    <p class="sub" style="margin-top:26px">Ele virou carta do jogo — dá pra contratar no leilão:</p>
    <div style="display:flex;gap:40px;margin-top:50px">${carta('Grêmio', 2023, false)}${carta('G3X', 2025, true)}</div>`),
  // ⑥ propaganda
  base(`
    <p style="${OSW};font-size:46px;letter-spacing:.14em;text-transform:uppercase;color:rgba(12,12,12,.55)">o jogo de técnico que você conhece</p>
    <h1 style="font-size:146px;margin-top:20px">Jogue<br><span>agora!</span></h1>
    <div class="moldura" style="margin-top:50px;text-align:left;padding:40px 56px">
      <p style="${OSW};font-size:54px;line-height:1.5">✅ Sem baixar nada</p>
      <p style="${OSW};font-size:54px;line-height:1.5">✅ De graça</p>
      <p style="${OSW};font-size:54px;line-height:1.5">✅ No seu navegador</p>
      <p style="font-family:system-ui;font-size:30px;font-weight:700;color:rgba(12,12,12,.55);margin-top:10px">celular ou computador</p>
    </div>
    <div style="margin-top:60px;background:${GOLD};border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
      ${OSW};font-size:66px;text-transform:uppercase;padding:34px 54px">⚽ leilaolegends.com</div>
    <p class="leg" style="margin-top:36px">leilão às cegas · carreira · online com os amigos</p>`),
]

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reels-'))
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: o.alta ? 2 : 1 })
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

// ── ffmpeg: zoom lento em cada cena + transição suave entre elas ───────────
const DUR = 3.0, FADE = 0.5, FPS = 30
const clipes = pngs.map((png, i) => {
  const out = path.join(tmpDir, `c${i}.mp4`)
  const frames = Math.round(DUR * FPS)
  // ⚠️ ARMADILHA DO ZOOMPAN (peguei na marra 24/08): `d` é quantos quadros ele
  // gera POR QUADRO QUE ENTRA. Com `-loop 1 -t 3` entram 75 quadros, e d=90
  // devolvia 6.750 — o vídeo saiu com 235s em vez de 13s.
  // Conserto: a entrada já vem no FPS final e `d=1` (1 sai pra cada 1 que
  // entra); o zoom cresce/diminui pelo número do quadro (`on`).
  const z = i % 2 === 0
    ? `min(1.0+0.0009*on,1.10)`   // aproxima devagar
    : `max(1.10-0.0009*on,1.0)`   // afasta devagar
  execFileSync('ffmpeg', ['-v', 'error', '-loop', '1', '-framerate', String(FPS), '-t', String(DUR), '-i', png,
    '-vf', `scale=${o.alta ? '2160:3840' : '1620:2880'},zoompan=z='${z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', o.alta ? 'slow' : 'veryfast', '-crf', o.alta ? '16' : '22',
    '-frames:v', String(frames), '-y', out])
  return out
})
// costura com xfade encadeado
let atual = clipes[0]
let acc = DUR
for (let i = 1; i < clipes.length; i++) {
  const out = path.join(tmpDir, `j${i}.mp4`)
  const offset = (acc - FADE).toFixed(2)
  execFileSync('ffmpeg', ['-v', 'error', '-i', atual, '-i', clipes[i],
    '-filter_complex', `[0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=${offset},format=yuv420p`,
    '-c:v', 'libx264', '-preset', o.alta ? 'slow' : 'medium', '-crf', o.alta ? '16' : '20',
    ...(o.alta ? ['-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2'] : []),
    '-y', out])
  atual = out
  acc += DUR - FADE
}
fs.copyFileSync(atual, o.saida)
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', o.saida]).toString().trim()
console.log(`${o.saida} · ${(fs.statSync(o.saida).size / 1024 / 1024).toFixed(1)} MB · ${Number(dur).toFixed(1)}s · 1080x1920`)
fs.rmSync(tmpDir, { recursive: true, force: true })
