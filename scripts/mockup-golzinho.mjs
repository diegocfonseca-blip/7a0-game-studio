#!/usr/bin/env node
// ─── ⚽🥅 MOCKUP: o GOLZINHO no placar ao vivo (um gol de cada lado) ───────────
//
// Diego (26/09), reprovando a "linha do jogo": *"não vai ficar muito com nome de
// jogador? já tem nome embaixo… não tá dando pra diferenciar de quem é o gol… o
// que eu tava falando é fazer gol mesmo, um golzinho, igual tem na disputa de
// pênalti — de um lado e do outro"*.
//
// Então: a MESMA faixa preta do palco dos pênaltis, só que com DOIS gols — um em
// cada ponta, embaixo de cada time, e a bola parada no meio. Quando alguém marca,
// a bola corre pela pista e ENTRA na rede de quem TOMOU o gol (a rede balança), o
// número de quem FEZ pula, e a faixa amarela em cima diz o lance. Sem nome nenhum
// na faixa — o nome fica só na lista de gols embaixo, como hoje.
//
// Como se sabe de quem é o gol, sem ler: cada metade da pista tem a COR do time
// (a mesma da barra embaixo do nome), a rede que balança é a do outro, e o número
// que pula é o do time que fez.
//
// Regras dele que este desenho respeita:
//   · 🎭 UM teatro só: o golzinho ENTRA NO LUGAR dos raios/partículas do GOOOL
//     que existem hoje na prévia — não em cima deles. A narração do lance fica.
//   · 🙈 anti-spoiler: a bola só corre quando o relógio passa do minuto do gol.
//   · 💾 0 KB: emoji + CSS, igual ao palco dos pênaltis (⚽ e 🥅).
//
// Rodar do raiz: node scripts/mockup-golzinho.mjs /tmp/golzinho
import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CASA = '#9C8B5A', FORA = '#2E6FB0' // as cores dos dois times (as mesmas da barra embaixo do nome)

// o jogo do print dele
const GOLS = [
  { nome: 'Edin Džeko', min: 33, home: true },
  { nome: 'Marcos Senna', min: 58, home: true },
  { nome: 'Gol de Manfré FC', min: 59, home: false },
  { nome: 'Gol de Manfré FC', min: 66, home: false },
]
const NARR = { 33: '⚽ GOL DO THE WOLF! Džeko cabeceou no cantinho', 58: '⚽ GOL DO THE WOLF! Senna de fora da área, no ângulo', 59: '⚽ GOL DO MANFRÉ FC! Cruzamento e cabeçada', 66: '⚽ GOL DO MANFRÉ FC! Contra-ataque letal' }

// estado da faixa: 'parado' · 'casa' (a casa marcou → bola vai pra rede da DIREITA) · 'fora'
const placar = (min, estado = 'parado', opts = {}) => {
  const vistos = GOLS.filter(g => g.min <= min)
  const hg = vistos.filter(g => g.home).length, ag = vistos.length - hg
  const ultimo = [...vistos].reverse()[0]
  const narr = opts.narr ?? (estado !== 'parado' && ultimo ? NARR[ultimo.min] : min >= 90 ? 'Fim de jogo!' : 'Jogo rolando…')
  return `
  <section class="score">
    <div class="narr ${estado !== 'parado' ? 'goal' : ''}">${narr}</div>
    <div class="duel">
      <div class="team" style="border-color:${CASA}"><div class="crest">🐺</div><strong>The Wolf</strong><small>VOCÊ</small></div>
      <div class="numbers"><small>${Math.min(90, min)}′</small><strong><i class="${estado === 'casa' ? 'pula' : ''}">${hg}</i> <span>×</span> <i class="${estado === 'fora' ? 'pula' : ''}">${ag}</i></strong></div>
      <div class="team" style="border-color:${FORA}"><div class="crest">🛡️</div><strong>Manfré FC</strong><small>RIVAL</small></div>
    </div>
    <!-- ⚽🥅 O GOLZINHO -->
    <div class="palco ${estado}">
      <span class="meta esq ${estado === 'fora' ? 'balanca' : ''}">🥅</span>
      <div class="pista">
        <i class="metade casa"></i><i class="metade fora"></i>
        <span class="bola">⚽</span>
      </div>
      <span class="meta dir ${estado === 'casa' ? 'balanca' : ''}">🥅</span>
    </div>
    <div class="scorers">
      <div>${vistos.filter(g => g.home).map(g => `<p>⚽ ${g.nome} <b>${g.min}′</b></p>`).join('') || '<p>Sem gols</p>'}</div>
      <div>${vistos.filter(g => !g.home).map(g => `<p>⚽ ${g.nome} <b>${g.min}′</b></p>`).join('') || '<p>Sem gols</p>'}</div>
    </div>
  </section>`
}

const CSS = `${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:900px;margin:0 auto}
h1{${OSW};font-size:20px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:14px;line-height:1.5}
.passo{${OSW};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin:16px 0 6px}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:8px}.cap b{font-weight:800}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.6;color:#3d3a30;margin-top:18px}
.fundo{background:#1b3a25;background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),repeating-linear-gradient(90deg,#2b6b3e 0 40px,#25603a 40px 80px);border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:14px}
/* ── o placar de hoje (online-match-visual.css) ── */
.score{background:linear-gradient(135deg,rgba(10,28,22,.94),rgba(7,19,15,.87));color:${CREME};border:2px solid #847657;border-radius:18px;overflow:hidden;box-shadow:0 4px 0 ${INK}}
.narr{height:36px;line-height:36px;padding:0 10px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:700 13px/36px Oswald,sans-serif;background:#0a1911}
.narr.goal{background:${GOLD};color:${INK}}
.duel{display:grid;grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);align-items:center;padding:14px 8px 10px;gap:8px}
.team{text-align:center;min-width:0;border-bottom:3px solid;padding-bottom:8px}
.team .crest{font-size:30px;line-height:1;margin-bottom:4px}.team strong{${OSW};font-size:16px;display:block}.team small{font-size:10px;letter-spacing:.1em;opacity:.7}
.numbers{background:${CREME};color:${INK};border:3px solid ${INK};border-radius:12px;padding:8px 2px 10px;text-align:center;box-shadow:3px 4px 0 ${INK};font-family:Oswald,sans-serif}
.numbers small{display:block;font-weight:700;font-size:14px}.numbers strong{display:block;font-size:32px;line-height:1.3}.numbers span{font-size:18px}
.numbers i{font-style:normal;display:inline-block}.numbers i.pula{animation:pula .5s cubic-bezier(.2,1.6,.4,1);color:#1B7A3D}
@keyframes pula{0%{transform:scale(.6)}60%{transform:scale(1.35)}100%{transform:none}}
.scorers{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:10px 12px;border-top:1px solid #59624d;font-size:12px}.scorers p{margin:0 0 3px}.scorers b{font-weight:800}
/* ── ⚽🥅 O GOLZINHO (a MESMA faixa preta do palco dos pênaltis) ── */
.palco{background:${INK};display:flex;align-items:center;gap:8px;padding:8px 12px;min-height:46px}
.meta{font-size:26px;line-height:1;display:inline-block;transform:translateY(-1px)}
.meta.esq{transform:scaleX(-1)}
.meta.balanca{animation:rede .45s ease}
.meta.esq.balanca{animation:rede-esq .45s ease}
@keyframes rede{30%{transform:rotate(-10deg) scale(1.22)}60%{transform:rotate(8deg) scale(1.12)}}
@keyframes rede-esq{30%{transform:scaleX(-1) rotate(-10deg) scale(1.22)}60%{transform:scaleX(-1) rotate(8deg) scale(1.12)}}
.pista{flex:1;position:relative;height:30px}
.metade{position:absolute;top:50%;height:0;border-top:2px dashed;width:50%;opacity:.55}
.metade.casa{left:0;border-color:${CASA}}.metade.fora{right:0;border-color:${FORA}}
.bola{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px;line-height:1;filter:drop-shadow(0 1px 0 rgba(0,0,0,.6))}
.palco.casa .bola{animation:vai-dir .6s cubic-bezier(.2,.7,.4,1) forwards}
.palco.fora .bola{animation:vai-esq .6s cubic-bezier(.2,.7,.4,1) forwards}
@keyframes vai-dir{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}100%{left:calc(100% - 4px);transform:translate(-50%,-50%) rotate(540deg) scale(.8)}}
@keyframes vai-esq{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}100%{left:4px;transform:translate(-50%,-50%) rotate(-540deg) scale(.8)}}
`

const pagina = (corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="wrap">${corpo}</div></body></html>`
const PARADO = '.palco.casa .bola,.palco.fora .bola{animation-play-state:paused;animation-delay:-.6s}.meta.balanca{animation:none}.numbers i.pula{animation:none;color:#1B7A3D}'

const htmlPng = pagina(`
<h1>⚽🥅 O golzinho no placar ao vivo</h1>
<p class="sub">A <b>mesma faixa preta do palco dos pênaltis</b>, com <b>um gol em cada ponta</b>, embaixo de cada time, e a bola parada no meio. Quando alguém marca, a bola corre e <b>entra na rede de quem tomou</b> (a rede balança), o <b>número de quem fez pula</b>, e a faixa amarela diz o lance. <b>Sem nome na faixa</b> — o nome fica só na lista embaixo, como hoje.</p>

<p class="passo">① jogo rolando · bola parada no meio, cada metade da pista com a cor do time</p>
<div class="fundo">${placar(20)}</div>
<p class="cap"><b>Quieto enquanto não tem gol.</b> A pista é um tracejado com a cor de cada time (a mesma barra que já fica embaixo do nome) — o lado esquerdo é o do The Wolf, o direito é o do Manfré.</p>

<p class="passo">② 33′ · gol do The Wolf → a bola corre pra DIREITA e entra na rede do Manfré</p>
<div class="fundo">${placar(33, 'casa')}</div>
<p class="cap"><b>Três sinais no mesmo segundo, nenhum é texto:</b> a rede da direita balança, o <b>1</b> do The Wolf pula em verde, e a faixa amarela diz de quem foi. Não tem como confundir de quem é o gol.</p>

<p class="passo">③ 59′ · gol do Manfré → a bola corre pra ESQUERDA e entra na rede do The Wolf</p>
<div class="fundo">${placar(59, 'fora')}</div>
<p class="cap">Mesma coisa, espelhada. Depois de ~2 segundos a bola volta pro meio e espera o próximo.</p>

<div class="nota">🎭 <b>Um teatro só:</b> o golzinho entra <b>no lugar</b> dos raios e partículas do GOOOL que a prévia tem hoje — não em cima. A narração do lance continua igual.<br>🙈 <b>Anti-spoiler:</b> a bola só corre quando o relógio passa do minuto do gol.<br>💾 <b>0 KB:</b> emoji + CSS, igual ao palco dos pênaltis. Vale em todo jogo de 90 min — liga, Copa, Champions, Liberta, Mundo e copa nova.<br>↩️ <b>Reverter:</b> um bloco só; tirar é uma linha.</div>
`, PARADO)

// 🎥 vídeo: 28′ → 70′ em ~8s, os 4 gols entrando (a bola volta pro meio entre eles)
const htmlVid = pagina(`<div class="fundo" id="v">${placar(28)}</div>
<script>
  const gols = ${JSON.stringify(GOLS)}, narr = ${JSON.stringify(NARR)}
  const el = document.getElementById('v'); const t0 = Date.now()
  let ultimoVisto = -1
  function frame(){
    const min = 28 + Math.min(42, (Date.now() - t0) / 1000 * 4.2) // 🎥 ~10s de vídeo pros 42 minutos
    const vistos = gols.filter(g => g.min <= min); const hg = vistos.filter(g => g.home).length, ag = vistos.length - hg
    const ultimo = vistos[vistos.length - 1]; const golNaHora = ultimo && min - ultimo.min < 8 // no vídeo o gol fica ~2s na tela (no jogo é o tempo do lance)
    const estado = golNaHora ? (ultimo.home ? 'casa' : 'fora') : 'parado'
    el.querySelector('.narr').textContent = golNaHora ? narr[ultimo.min] : 'Jogo rolando…'
    el.querySelector('.narr').className = 'narr' + (golNaHora ? ' goal' : '')
    el.querySelector('.numbers small').textContent = Math.floor(min) + '′'
    const [n1, n2] = el.querySelectorAll('.numbers i'); n1.textContent = hg; n2.textContent = ag
    const palco = el.querySelector('.palco')
    if (ultimo && ultimo.min !== ultimoVisto) { // gol novo: reinicia a corrida e o pulo
      ultimoVisto = ultimo.min
      palco.className = 'palco'; void palco.offsetWidth; palco.className = 'palco ' + estado
      const m = el.querySelector(ultimo.home ? '.meta.dir' : '.meta.esq'); m.classList.remove('balanca'); void m.offsetWidth; setTimeout(() => m.classList.add('balanca'), 520)
      const n = ultimo.home ? n1 : n2; n.classList.remove('pula'); void n.offsetWidth; n.classList.add('pula')
    }
    if (!golNaHora && palco.className !== 'palco') { palco.className = 'palco'; el.querySelectorAll('.meta').forEach(m => m.classList.remove('balanca')); n1.classList.remove('pula'); n2.classList.remove('pula') }
    const [c1, c2] = el.querySelectorAll('.scorers > div')
    c1.innerHTML = vistos.filter(g => g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    c2.innerHTML = vistos.filter(g => !g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    if (min < 70) requestAnimationFrame(frame)
  }
  frame()
</script>`, 'body{padding:0 14px;background:#0C0C0C;zoom:1.6}.wrap{max-width:560px}')

const outDir = process.argv[2] ?? 'mockup-golzinho'
mkdirSync(outDir, { recursive: true })
const pngHtml = path.join(outDir, 'golzinho.html'), vidHtml = path.join(outDir, 'golzinho-video.html')
writeFileSync(pngHtml, htmlPng); writeFileSync(vidHtml, htmlVid)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${path.resolve(pngHtml)}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)
await p.screenshot({ path: path.join(outDir, 'golzinho.png'), fullPage: true })
await p.close()
const ctx = await b.newContext({ viewport: { width: 940, height: 560 }, deviceScaleFactor: 1, recordVideo: { dir: outDir, size: { width: 940, height: 560 } } })
const v = await ctx.newPage()
await v.goto(`file://${path.resolve(vidHtml)}`, { waitUntil: 'networkidle' })
await v.evaluate(() => document.fonts.ready)
await v.waitForTimeout(11500)
await ctx.close()
await b.close()
const webm = readdirSync(outDir).find(f => f.endsWith('.webm'))
if (webm) {
  const src = path.join(outDir, webm), mp4 = path.join(outDir, 'golzinho.mp4')
  try { execSync(`ffmpeg -y -loglevel error -i "${src}" -ss 0.6 -t 10.5 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`); renameSync(src, path.join(outDir, 'golzinho.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('ok →', outDir)
