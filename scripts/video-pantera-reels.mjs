// ─── 🐆👑 REELS DO PANTERA NEGRA FC — 9:16, pro collab com o dono ──────────
//
// Pedido do Diego (21/09): *"podemos fazer um vídeo dizendo isso com os bordões
// e também que você não jogou comigo no FIFA, mas agora vai ter a chance de
// jogar no Leilão Legends, e de graça… mostre essa foto dele também, talvez uma
// de cada vez e depois tudo junto… lembrando que o mascote vai com a plaquinha
// embaixo e o balão em cima… e no final diga que pra jogar é de graça, é só
// digitar leilaolegends no navegador"*.
//
// ⚠️ POR QUE ESTE SCRIPT EXISTE, e não é um vídeo feito na mão: o post é de
// COLLAB — o público do dono nunca ouviu falar do jogo. Então o roteiro tem que
// fazer três coisas na ordem, e isso se perde se cada vídeo for improvisado:
//   1. prender com os BORDÕES dele (a arte já conta a piada sozinha),
//   2. dizer o que é o jogo em UMA frase,
//   3. fechar dizendo que é de GRAÇA e que NÃO BAIXA NADA.
//
// 🖼️ DE ONDE VEM CADA PEÇA:
//   · escudo / mascote → `src/escalacao/img/` (as MESMAS do jogo, recortadas)
//   · camisa           → `public/mantos-salao/` (a do Salão, com alfa)
//   · balão · plaquinha · arte inteira → `scripts/kits/pantera-*` (são do POST,
//     nunca do jogo — não entram no bundle nem contam no teto do batismo)
//
// 📏 A arte do dono tem fundo creme #FAF1DB (não o #F4ECD6 do jogo). As cenas
// que mostram arte usam ESSE creme, senão aparece um retângulo de fundo
// diferente em volta da peça.
//
// 🚫 Regra 05/09: o post NÃO diz de quem era o assento — só "chega na Série C".
//
//   node scripts/video-pantera-reels.mjs --saida /tmp/pantera-reels.mp4 --alta
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', 'pantera-reels.mp4')
const ALTA = process.argv.includes('--alta')

const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(${fonte(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const ESCUDO = img('src/escalacao/img/pantera-escudo.webp')
const CAMISA = img('public/mantos-salao/pantera-camisa-v1.webp')
const ARTE = img('scripts/kits/pantera-arte-post.webp')
// 🎭 A MASCOTE JÁ VEM COM A PLAQUINHA EMBAIXO E O BALÃO EM CIMA — é assim que a
// arte do dono nasceu, e foi o que o Diego lembrou (*"o mascote vai com a
// plaquinha de baixo e balão em cima"*). Então NÃO se monta isso na mão: colar
// um balão por cima duplicaria o que já está no desenho (foi o erro do 1º corte).
// O arquivo do post é a peça do jogo ampliada 3× em LANCZOS — o navegador
// esticando os 440px originais deixava a arte molenga na tela do celular.
const MASCOTE = img('scripts/kits/pantera-mascote-post.webp')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', CREME_ARTE = '#FAF1DB'
const PRETO = '#191615', DOURADO = '#CB9D3E' // 🐆 as cores do manto, medidas na prancha do dono
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const base = (corpo, { fundo = CREME, extra = '' } = {}) => `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${fundo};font-family:system-ui;overflow:hidden}
.wrap{height:100%;padding:100px 70px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.pill{display:inline-block;background:${GOLD};border:7px solid ${INK};border-radius:999px;box-shadow:11px 11px 0 ${INK};
  padding:14px 42px;${OSW};font-size:36px;letter-spacing:.12em;text-transform:uppercase}
.pill.preta{background:${PRETO};color:${DOURADO};border-color:${INK}}
h1{${OSW};font-size:132px;line-height:.92;text-transform:uppercase}
h1 .ouro{color:${DOURADO}}
.sub{font-family:system-ui;font-size:40px;font-weight:700;color:rgba(12,12,12,.62);line-height:1.38;max-width:900px}
.leg{font-family:system-ui;font-size:34px;font-weight:700;color:rgba(12,12,12,.5);line-height:1.35}
.cta{background:${GOLD};border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
  ${OSW};font-size:62px;text-transform:uppercase;padding:34px 52px}
${extra}</style><div class="wrap">${corpo}</div>`

// ── o roteiro ──────────────────────────────────────────────────────────────
const CENAS = [
  // ① o gancho — é a primeira frase que o público DELE vê
  base(`
    <h1>Você nunca viu<br>o Pantera<br><span class="ouro">no FIFA.</span></h1>
    <p class="sub" style="margin-top:56px">Mas o time dele acabou de entrar num jogo de verdade.</p>`),

  // ② o escudo (a marca do clube) — regra 05/09: só "chega na Série C"
  base(`
    <span class="pill preta">🐆👑 Batismo de Lenda</span>
    <div style="margin:46px 0 10px"><img src="${ESCUDO}" style="height:700px;object-fit:contain"></div>
    <h1 style="font-size:104px">Pantera<br><span class="ouro">Negra FC</span></h1>
    <p class="leg" style="margin-top:26px">chega na Série C do Leilão Legends</p>`,
    { fundo: CREME_ARTE }),

  // ③ o mascote COM O BALÃO EM CIMA E A PLAQUINHA EMBAIXO (ordem do Diego)
  base(`
    <p class="leg">e o cara tem currículo, viu 👇</p>
    <img src="${MASCOTE}" style="width:940px;margin-top:26px;object-fit:contain">
    <p class="sub" style="margin-top:22px"><b>16 países. 14 continentes. 36 galáxias.</b></p>`,
    { fundo: CREME_ARTE }),

  // ④ a camisa — o terceiro bordão já vem escrito nela
  base(`
    <p class="leg">🎽 o manto</p>
    <div style="margin:30px 0 24px"><img src="${CAMISA}" style="height:940px;object-fit:contain"></div>
    <h1 style="font-size:82px">Milionário aos 22.<br><span class="ouro">Pobre aos 23.</span></h1>`,
    { fundo: CREME_ARTE }),

  // ⑤ tudo junto — a arte que o dono vai reconhecer no feed dele
  base(`
    <h1 style="font-size:84px">Escudo, mascote<br>e <span class="ouro">manto</span></h1>
    <p class="leg" style="margin-top:16px">tudo dele, dentro do jogo</p>
    <img src="${ARTE}" style="width:1010px;margin-top:34px">`,
    { fundo: CREME_ARTE }),

  // ⑥ o que é o jogo — UMA frase, pra quem nunca ouviu falar
  base(`
    <p style="font-size:150px;line-height:1">🔨</p>
    <h1 style="font-size:100px;margin-top:30px">Leilão <span class="ouro">às cegas</span><br>de lendas</h1>
    <p class="sub" style="margin-top:44px">Todo mundo dá o lance <b>escondido</b>. Quem pagar mais leva o craque —
      e ninguém sabe quanto o outro ofereceu até o martelo bater.</p>
    <p class="sub" style="margin-top:30px">Aí você monta seu time e sobe da Várzea até a Série A.</p>`),

  // ⑦ o fecho: de graça, no navegador, sem baixar nada
  base(`
    <h1 style="font-size:116px">Agora você<br>encara <span class="ouro">o Pantera</span></h1>
    <p class="sub" style="margin-top:40px">Não baixa nada. Não instala nada.</p>
    <div class="cta" style="margin-top:52px">⚽ leilaolegends.com</div>
    <p class="leg" style="margin-top:40px">é só digitar no navegador do celular · <b>de graça</b></p>`),
]

// ── desenho das cenas ──────────────────────────────────────────────────────
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantera-'))
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

// ── ffmpeg: zoom lento (Ken Burns) + transição suave ───────────────────────
// ⚠️ A armadilha do zoompan (anotada em 24/08 no vídeo de batismo): `d` é quantos
// quadros ele gera POR QUADRO QUE ENTRA — a entrada já vem no FPS final e d=1.
const DUR = [3.2, 3.4, 4.2, 3.4, 3.8, 4.4, 4.0] // ⑥ e ③ são as que têm mais texto/arte pra ler
const FADE = 0.5, FPS = 30
const clipes = pngs.map((png, i) => {
  const out = path.join(tmpDir, `c${i}.mp4`)
  const dur = DUR[i] ?? 3.2
  const z = i % 2 === 0 ? `min(1.0+0.0008*on,1.09)` : `max(1.09-0.0008*on,1.0)`
  execFileSync('ffmpeg', ['-v', 'error', '-loop', '1', '-framerate', String(FPS), '-t', String(dur), '-i', png,
    '-vf', `scale=${ALTA ? '2160:3840' : '1620:2880'},zoompan=z='${z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'veryfast', '-crf', ALTA ? '16' : '22',
    '-frames:v', String(Math.round(dur * FPS)), '-y', out])
  return out
})
let atual = clipes[0]
let acc = DUR[0]
for (let i = 1; i < clipes.length; i++) {
  const out = path.join(tmpDir, `j${i}.mp4`)
  execFileSync('ffmpeg', ['-v', 'error', '-i', atual, '-i', clipes[i],
    '-filter_complex', `[0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=${(acc - FADE).toFixed(2)},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'medium', '-crf', ALTA ? '16' : '20',
    ...(ALTA ? ['-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2'] : []),
    '-y', out])
  atual = out
  acc += (DUR[i] ?? 3.2) - FADE
}
fs.copyFileSync(atual, SAIDA)
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SAIDA]).toString().trim()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024 / 1024).toFixed(1)} MB · ${Number(dur).toFixed(1)}s · 1080x1920`)
fs.rmSync(tmpDir, { recursive: true, force: true })
