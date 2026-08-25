// ─── 🎬 BATISMO EM VÍDEO 9:16 — pro REELS (Diego 24/08) ────────────────────
//
// Pedido: *"faça essa arte aqui como vídeo p eu postar reels"*.
//
// Como funciona: desenha as CENAS em HTML (mesma identidade do post — creme,
// borda preta grossa, sombra dura, Oswald), tira um print de cada uma em
// 1080x1920, e o ffmpeg costura tudo com zoom lento (Ken Burns) e transição
// suave. Sem áudio de propósito: no Instagram/TikTok o áudio em alta tem que
// ser escolhido DENTRO do app, senão não entra no algoritmo.
//
// ⚠️ Regra do Diego que vale aqui: a camisa que o DONO mandou vai no post
// (`--camisa`) — ela mora em `scripts/kits/`, nunca em `src/escalacao/img/`.
//
//   node scripts/video-batismo-reels.mjs \
//     --clube "Neymarzetti" --serie C --antigo "Paixandu" \
//     --escudo src/escalacao/img/neymarzetti-escudo.webp \
//     --mascote src/escalacao/img/neymarzetti-mascote.webp \
//     --camisa scripts/kits/neymarzetti.webp \
//     --mascote-nome "O Mascarado" --c1-nome preto --c2-nome prata \
//     --dono Diego --fundador 1 --saida reels.mp4
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const o = {
  clube: arg('clube'), serie: arg('serie', 'D'), antigo: arg('antigo'),
  escudo: arg('escudo'), mascote: arg('mascote'), camisa: arg('camisa'),
  mascoteNome: arg('mascote-nome', 'a mascote'),
  c1: arg('c1', '#141416'), c1nome: arg('c1-nome', ''),
  c2: arg('c2', '#B6B7B8'), c2nome: arg('c2-nome', ''),
  dono: arg('dono', ''), fundador: arg('fundador', ''),
  saida: arg('saida', 'batismo-reels.mp4'),
  alta: process.argv.includes('--alta'), // 🔍 qualidade de Instagram: cenas em 2x, crf 18, bitrate alto
}
if (!o.clube || !o.escudo || !o.mascote) { console.error('faltou --clube, --escudo ou --mascote'); process.exit(1) }

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

// ── as 5 cenas ─────────────────────────────────────────────────────────────
const CENAS = [
  // ① abertura
  base(`
    <span class="pill">🦇 Batismo de Lenda</span>
    <h1>${l1 ? `Nasceu o ${l1}<br>` : 'Nasceu o<br>'}<span>${l2}</span></h1>
    <p class="sub">O clube do <b>${o.dono}</b> ganhou escudo, mascote e manto — de verdade, dentro do jogo.</p>`),
  // ② escudo
  base(`
    <p class="rot">🛡️ o escudo</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(o.escudo)}" style="height:620px;object-fit:contain"></div>
    <p class="nome">${o.clube}</p>
    <p class="leg">${o.c1nome} e ${o.c2nome}${o.antigo ? ` · entra no lugar do ${o.antigo}` : ''}</p>`),
  // ③ mascote
  base(`
    <p class="rot">🦇 a mascote</p>
    <div class="moldura" style="margin-top:34px"><img src="${img(o.mascote)}" style="height:640px;object-fit:contain"></div>
    <p class="nome">${o.mascoteNome}</p>
    <p class="leg">carimba a tela toda vez que o time faz gol</p>`),
  // ④ manto
  base(`
    <p class="rot">🎽 o manto</p>
    <div class="moldura" style="margin-top:34px">${o.camisa
      ? `<img src="${img(o.camisa)}" style="height:640px;object-fit:contain">`
      : `<div style="width:340px;height:560px;border:9px solid ${INK};border-radius:24px;background:repeating-linear-gradient(90deg,${o.c1} 0 56px,${o.c2} 56px 112px)"></div>`}</div>
    <p class="nome">${o.c1nome} e ${o.c2nome}</p>
    <p class="leg">as cores medidas na arte do dono</p>`),
  // ⑤ chamada
  base(`
    <p style="font-size:150px;line-height:1">🔨</p>
    <h1 style="font-size:132px;margin-top:26px">Monte o seu<br><span>time de lendas</span></h1>
    <p class="sub">Leilão às cegas com os amigos. Ganhe títulos, batize seu clube.</p>
    <div style="margin-top:64px;background:${GOLD};border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
      ${OSW};font-size:60px;text-transform:uppercase;padding:36px 54px">⚽ leilaolegends.com</div>
    <p class="leg" style="margin-top:40px">grátis, direto do navegador · sem baixar nada</p>`),
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
