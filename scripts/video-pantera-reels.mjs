// ─── 🐆👑 REELS DO PANTERA NEGRA FC — DOIS vídeos 9:16, pro collab ─────────
//
// Pedido do Diego (21/09): *"preciso de dois vídeos separados, porque ficou tudo
// muito rápido… e coloque o texto em destaque dizendo: você não viu ele no FIFA,
// não viu ele no PES, mas ele jogou em 16 países, 14 continentes e 36 galáxias…
// e agora você terá a oportunidade de jogar com o time do Pantera no Leilão
// Legends, de graça, navegador, blá blá blá… fale bordões, faça suspense… e
// também explique como joga pros seguidores dele, porque além de ser meu anúncio,
// quando ele postar, muita gente nem sabe o que é Leilão Legends"*.
//
// 🎬 POR QUE DOIS, e não um só: são DOIS trabalhos diferentes, e num vídeo só o
// segundo atropela o primeiro (foi a reclamação dele no 1º corte — "ficou tudo
// muito rápido"). Então:
//   · PARTE 1 — O PANTERA: suspense + bordões + a chamada. É o post do collab.
//   · PARTE 2 — COMO JOGA: o passo a passo pra quem nunca ouviu falar do jogo.
// Cada cena ganhou mais tempo (3,4s a 4,6s) e MENOS palavra por tela — quem vê
// reels lê uma linha, não um parágrafo.
//
// ⚠️ "JOGAR COM O TIME DO PANTERA": é a frase DELE, e ela fica. O que o jogo faz
// de verdade é pôr o clube do dono na Série C, então a linha miúda embaixo
// explica ("o clube dele está na Série C — vai cruzar com o seu"). Assim a
// chamada tem a força que ele quer sem prometer o que o jogo não faz.
//
// 🖼️ DE ONDE VEM CADA PEÇA:
//   · escudo → `src/escalacao/img/` (a MESMA do jogo)
//   · camisa → `public/mantos-salao/` (a do Salão, com alfa)
//   · mascote · balão · plaquinha · arte inteira → `scripts/kits/pantera-*`
//     (são do POST, nunca do jogo — não entram no bundle nem contam no teto de
//     peso do batismo)
//   · as salas/estádio da PARTE 2 → as ilustrações que já existem no jogo
//
// 📏 A arte do dono tem fundo creme #FAF1DB (não o #F4ECD6 do jogo). As cenas
// que mostram arte usam ESSE creme, senão aparece um retângulo de fundo
// diferente em volta da peça.
//
// 🚫 Regra 05/09: o post NÃO diz de quem era o assento — só "chega na Série C".
//
//   node scripts/video-pantera-reels.mjs --parte 1 --saida /tmp/pantera-1.mp4 --alta
//   node scripts/video-pantera-reels.mjs --parte 2 --saida /tmp/pantera-2.mp4 --alta
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PARTE = arg('parte', '1')
const SAIDA = arg('saida', `pantera-parte${PARTE}.mp4`)
const ALTA = process.argv.includes('--alta')

const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(${fonte(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const ESCUDO = img('src/escalacao/img/pantera-escudo.webp')
const CAMISA = img('public/mantos-salao/pantera-camisa-v1.webp')
const ARTE = img('scripts/kits/pantera-arte-post.webp')
const PLACA = img('scripts/kits/pantera-plaquinha.webp')
const BALAO = img('scripts/kits/pantera-balao.webp')
// 🎭 A MASCOTE JÁ VEM COM A PLAQUINHA EMBAIXO E O BALÃO EM CIMA — é assim que a
// arte do dono nasceu, e foi o que o Diego lembrou. Então NÃO se monta isso na
// mão: colar um balão por cima duplicaria o que já está no desenho (erro do 1º
// corte). O arquivo do post é a peça do jogo ampliada 3× em LANCZOS, com o
// verde-chave que sobrou na grama apagado.
const MASCOTE = img('scripts/kits/pantera-mascote-post.webp')
// 🏟️ as ilustrações que o jogo já usa — servem pra explicar COMO joga
const SALA_LEILAO = img('src/escalacao/img/home-leilao-v07.webp')
const MESA_LANCE = img('src/escalacao/img/online-sala-v20.webp')
const ESTADIO = img('src/escalacao/img/online-estadio-v25.webp')
// 🎴 As cartas REAIS do jogo, tiradas com `scripts/carta/print.mjs` (o mesmo
// <CollectibleCard> que o jogador vê no álbum) — nada redesenhado pro post.
// Elas mostram sozinhas a distância que o Diego quis dizer com "do Pelé ao
// Obina": a dourada de 👑 LENDA e a verde de 🃏 FOLCLÓRICO.
// ⚠️ A carta do Pelé NÃO tem rosto desenhado, e isso é regra do Diego (18/08):
// não se inventa como uma pessoa real é. O avatar do jogo é a silhueta neutra.
const CARTA_PELE = img('scripts/kits/carta-pele.webp')
const CARTA_OBINA = img('scripts/kits/carta-obina.webp')

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
/* ⚠️ line-height baixo demais CORTA a cedilha do "GRAÇA" (peguei no 1º corte da
   parte 2: saía "GRACA"). .98 + uma folga embaixo resolve sem afrouxar o texto. */
h1{${OSW};font-size:132px;line-height:.98;padding-bottom:10px;text-transform:uppercase}
h1 .ouro{color:${DOURADO}}
h1 .risca{position:relative;display:inline-block}
h1 .risca::after{content:'';position:absolute;left:-10px;right:-10px;top:52%;height:12px;background:#C2452F;transform:rotate(-3deg)}
.sub{font-family:system-ui;font-size:40px;font-weight:700;color:rgba(12,12,12,.62);line-height:1.38;max-width:900px}
.leg{font-family:system-ui;font-size:34px;font-weight:700;color:rgba(12,12,12,.5);line-height:1.35}
.passo{${OSW};font-size:44px;color:${DOURADO};letter-spacing:.1em;text-transform:uppercase}
.foto{width:920px;border:9px solid ${INK};border-radius:32px;box-shadow:16px 16px 0 ${INK};overflow:hidden;display:block}
.foto img{width:100%;display:block}
.cta{background:${GOLD};border:9px solid ${INK};border-radius:34px;box-shadow:16px 16px 0 ${INK};
  ${OSW};font-size:62px;text-transform:uppercase;padding:34px 52px}
${extra}</style><div class="wrap">${corpo}</div>`

// ═══ PARTE 1 — O PANTERA ═══════════════════════════════════════════════════
// Suspense: as três primeiras telas são UMA frase cada, pra dar tempo de ler e
// de criar a pergunta "então quem é esse cara?".
const PARTE1 = [
  { d: 3.4, html: base(`<h1>Você não viu ele<br>no <span class="risca">FIFA</span>.</h1>`) },
  { d: 3.2, html: base(`<h1>Não viu ele<br>no <span class="risca">PES</span>.</h1>`) },
  { d: 3.4, html: base(`<h1 style="font-size:104px">Mas ele jogou<br>em <span class="ouro">16 países</span>.</h1>`) },
  { d: 3.2, html: base(`<h1 style="font-size:116px"><span class="ouro">14</span><br>continentes.</h1>`) },
  { d: 4.2, html: base(`
      <h1 style="font-size:104px">E <span class="ouro">36 galáxias</span>.</h1>
      <img src="${PLACA}" style="width:620px;margin-top:54px">`, { fundo: CREME_ARTE }) },
  { d: 4.2, html: base(`
      <p class="leg">perguntaram se ele é destro ou canhoto 👇</p>
      <img src="${BALAO}" style="width:900px;margin-top:40px">`, { fundo: CREME_ARTE }) },
  { d: 4.4, html: base(`
      <p class="leg">esse é o Pantera 🐆</p>
      <img src="${MASCOTE}" style="width:930px;margin-top:22px;object-fit:contain">`, { fundo: CREME_ARTE }) },
  { d: 4.0, html: base(`
      <p class="leg">e o manto dele já diz tudo 👇</p>
      <img src="${CAMISA}" style="height:900px;margin:26px 0 22px;object-fit:contain">
      <h1 style="font-size:78px">Milionário aos 22.<br><span class="ouro">Pobre aos 23.</span></h1>`, { fundo: CREME_ARTE }) },
  { d: 4.2, html: base(`
      <span class="pill preta">🐆👑 Batismo de Lenda</span>
      <img src="${ESCUDO}" style="height:660px;margin:44px 0 12px;object-fit:contain">
      <h1 style="font-size:100px">Pantera<br><span class="ouro">Negra FC</span></h1>
      <p class="leg" style="margin-top:24px">escudo, mascote e manto — dentro do jogo</p>`, { fundo: CREME_ARTE }) },
  { d: 4.0, html: base(`
      <h1 style="font-size:88px">Agora ele tem<br><span class="ouro">time de verdade</span></h1>
      <img src="${ARTE}" style="width:1000px;margin-top:36px">
      <p class="leg" style="margin-top:20px">Pantera Negra FC · Série C</p>`, { fundo: CREME_ARTE }) },
  { d: 4.8, html: base(`
      <h1 style="font-size:96px">E agora você<br>joga com o<br><span class="ouro">time do Pantera</span></h1>
      <p class="sub" style="margin-top:34px">Não baixa nada. Não instala nada.</p>
      <div class="cta" style="margin-top:44px">⚽ leilaolegends.com</div>
      <p class="leg" style="margin-top:36px">é só digitar no navegador do celular · <b>de graça</b></p>`) },
]

// ═══ PARTE 2 — COMO JOGA ═══════════════════════════════════════════════════
// Pro seguidor DELE, que nunca ouviu falar do jogo. Um passo por tela, na ordem
// em que a pessoa vai viver: entra → dá o lance → martelo → monta o time → joga.
const PARTE2 = [
  { d: 3.8, html: base(`
      <span class="pill">🔨 como joga</span>
      <h1 style="font-size:100px;margin-top:44px">O que é o<br><span class="ouro">Leilão Legends</span>?</h1>
      <p class="sub" style="margin-top:36px">Em 1 minuto você entende. Prometo.</p>`) },
  // 🕹️ A REFERÊNCIA QUE O DIEGO PEDIU: *"é um jogo inspirado no Brasfoot"*. Pro
  // público dele isso explica o jogo inteiro numa palavra — e a linha de baixo
  // diz na hora o que MUDA, senão a pessoa espera um Brasfoot igualzinho.
  { d: 4.4, html: base(`
      <h1 style="font-size:96px">Inspirado no<br><span class="ouro">Brasfoot</span></h1>
      <p class="sub" style="margin-top:40px">Só que aqui o elenco <b>não vem pronto</b>.<br>Você arremata os jogadores num leilão.</p>`) },
  { d: 4.4, html: base(`
      <p class="passo">o baralho</p>
      <h1 style="font-size:72px;margin-top:22px">Mais de <span class="ouro">1.500 cartas</span></h1>
      <img src="${CARTA_PELE}" style="height:900px;margin-top:28px;object-fit:contain">
      <p class="leg" style="margin-top:22px">tem do Pelé…</p>`) },
  // 🎴 As DUAS juntas: sozinha na tela, a carta verde do Obina é quase vazia (ele
  // não tem avatar) e o vídeo dá um buraco. Lado a lado com a dourada do Pelé,
  // o vazio vira a piada — dá pra VER a distância que o Diego quis dizer.
  { d: 4.2, html: base(`
      <div style="display:flex;gap:34px;align-items:flex-end;justify-content:center">
        <img src="${CARTA_PELE}" style="height:700px;object-fit:contain;transform:rotate(-4deg)">
        <img src="${CARTA_OBINA}" style="height:700px;object-fit:contain;transform:rotate(4deg)">
      </div>
      <h1 style="font-size:78px;margin-top:44px">…<span class="ouro">ao Obina</span>.</h1>
      <p class="leg" style="margin-top:18px">Brasil, Europa e resto do mundo</p>`) },
  { d: 4.4, html: base(`
      <p class="passo">1 · o lance</p>
      <div class="foto" style="margin-top:28px"><img src="${MESA_LANCE}"></div>
      <h1 style="font-size:62px;margin-top:32px">Aparece o craque.<br>Você escreve<br><span class="ouro">quanto vale</span></h1>
      <p class="leg" style="margin-top:18px">no envelope, escondido</p>`) },
  { d: 4.2, html: base(`
      <p class="passo">2 · o martelo</p>
      <p style="font-size:180px;line-height:1;margin-top:20px">🔨</p>
      <h1 style="font-size:70px;margin-top:22px">Ninguém vê<br>o lance <span class="ouro">do outro</span></h1>
      <p class="sub" style="margin-top:28px">Quem pagou mais leva. Quem pagou de menos<br>fica falando sozinho.</p>`) },
  { d: 4.4, html: base(`
      <p class="passo">3 · o time</p>
      <div class="foto" style="margin-top:28px"><img src="${SALA_LEILAO}"></div>
      <h1 style="font-size:70px;margin-top:32px">Você monta<br><span class="ouro">o elenco</span></h1>
      <p class="leg" style="margin-top:18px">goleiro, zaga, meio e ataque — com o que sobrou no caixa</p>`) },
  { d: 4.6, html: base(`
      <p class="passo">4 · a subida</p>
      <div class="foto" style="margin-top:28px"><img src="${ESTADIO}"></div>
      <h1 style="font-size:62px;margin-top:32px">Começa na <span class="ouro">Várzea</span><br>e leva o time<br>até a <span class="ouro">Série A</span></h1>`) },
  // 👥 20 é o número REAL: `MAX_PLAYERS = 20` no lobby.tsx (a tabela tem 20 times
  // e as vagas que sobram viram bot). Não arredondar isso em anúncio.
  { d: 4.4, html: base(`
      <h1 style="font-size:74px">Sozinho contra o<br>computador — ou com<br><span class="ouro">até 20 pessoas</span></h1>
      <p class="sub" style="margin-top:36px">na mesma sala online, todo mundo dando lance<br>na mesma lenda ao mesmo tempo.</p>`) },
  { d: 4.2, html: base(`
      <h1 style="font-size:84px">E o clube do<br><span class="ouro">Pantera</span> está lá</h1>
      <img src="${ESCUDO}" style="height:540px;margin-top:30px;object-fit:contain">
      <p class="leg" style="margin-top:20px">Pantera Negra FC · Série C</p>`, { fundo: CREME_ARTE }) },
  { d: 4.8, html: base(`
      <h1 style="font-size:100px">De <span class="ouro">graça</span>.<br>No navegador.</h1>
      <p class="sub" style="margin-top:34px">Não tem loja de aplicativo. Não tem download.<br>Abre e joga.</p>
      <div class="cta" style="margin-top:44px">⚽ leilaolegends.com</div>
      <p class="leg" style="margin-top:36px">é só digitar aí no navegador do celular</p>`) },
]

const CENAS = PARTE === '2' ? PARTE2 : PARTE1

// ── desenho das cenas ──────────────────────────────────────────────────────
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantera-'))
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: ALTA ? 2 : 1 })
const pngs = []
for (let i = 0; i < CENAS.length; i++) {
  const f = path.join(tmpDir, `cena${i}.html`)
  fs.writeFileSync(f, CENAS[i].html)
  await p.goto('file://' + f)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  const png = path.join(tmpDir, `cena${i}.png`)
  await p.screenshot({ path: png })
  pngs.push(png)
}
await b.close()
console.log(`parte ${PARTE}: ${pngs.length} cenas desenhadas`)

// ── ffmpeg: zoom lento (Ken Burns) + transição suave ───────────────────────
// ⚠️ A armadilha do zoompan (anotada em 24/08 no vídeo de batismo): `d` é quantos
// quadros ele gera POR QUADRO QUE ENTRA — a entrada já vem no FPS final e d=1.
const FADE = 0.5, FPS = 30
const clipes = pngs.map((png, i) => {
  const out = path.join(tmpDir, `c${i}.mp4`)
  const dur = CENAS[i].d
  const z = i % 2 === 0 ? `min(1.0+0.0006*on,1.08)` : `max(1.08-0.0006*on,1.0)`
  execFileSync('ffmpeg', ['-v', 'error', '-loop', '1', '-framerate', String(FPS), '-t', String(dur), '-i', png,
    '-vf', `scale=${ALTA ? '2160:3840' : '1620:2880'},zoompan=z='${z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'veryfast', '-crf', ALTA ? '16' : '22',
    '-frames:v', String(Math.round(dur * FPS)), '-y', out])
  return out
})
let atual = clipes[0]
let acc = CENAS[0].d
for (let i = 1; i < clipes.length; i++) {
  const out = path.join(tmpDir, `j${i}.mp4`)
  execFileSync('ffmpeg', ['-v', 'error', '-i', atual, '-i', clipes[i],
    '-filter_complex', `[0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=${(acc - FADE).toFixed(2)},format=yuv420p`,
    '-c:v', 'libx264', '-preset', ALTA ? 'slow' : 'medium', '-crf', ALTA ? '16' : '20',
    ...(ALTA ? ['-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2'] : []),
    '-y', out])
  atual = out
  acc += CENAS[i].d - FADE
}
fs.copyFileSync(atual, SAIDA)
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SAIDA]).toString().trim()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024 / 1024).toFixed(1)} MB · ${Number(dur).toFixed(1)}s · 1080x1920`)
fs.rmSync(tmpDir, { recursive: true, force: true })
