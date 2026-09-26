#!/usr/bin/env node
// ─── ⚽🥅 MOCKUP: o GOLZINHO em "3D" (perspectiva de câmera de TV) ─────────────
//
// Diego (26/09), depois de gostar do golzinho: *"e se fosse algo ainda mais
// perfeito, em 3D ou algo do tipo, como seria?"*
//
// O que dá pra fazer SEM pesar: 3D de CSS. A faixa preta vira um pedaço de
// gramado visto de cima, em perspectiva (as laterais convergem, o fundo é mais
// escuro), com uma trave DESENHADA em cada ponta — postes, travessão e a rede com
// profundidade — e a bola de verdade do pênalti (a foto `ball.webp` que o jogo já
// tem), com sombra no chão. No gol a bola sai em ARCO (sobe e cai), gira, a sombra
// acompanha, e a rede ESTUFA pra trás quando ela entra.
//
// O que eu NÃO faria: motor 3D de verdade (three.js) — são ~600 KB a mais pra todo
// mundo baixar e o celular esquenta numa tela que fica aberta 8 minutos por rodada.
// A regra dele é "nada atrasa o jogo". Com CSS o efeito é o mesmo e custa 0 KB
// (a bola já está no jogo por causa do pênalti).
//
// Rodar do raiz: node scripts/mockup-golzinho-3d.mjs /tmp/golzinho3d
import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const BOLA = `data:image/webp;base64,${readFileSync(`${ROOT}/public/penalty-private-v1/ball.webp`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CASA = '#9C8B5A', FORA = '#2E6FB0'

const GOLS = [
  { nome: 'Edin Džeko', min: 33, home: true },
  { nome: 'Marcos Senna', min: 58, home: true },
  { nome: 'Gol de Manfré FC', min: 59, home: false },
  { nome: 'Gol de Manfré FC', min: 66, home: false },
]
const NARR = { 33: '⚽ GOL DO THE WOLF! Džeko cabeceou no cantinho', 58: '⚽ GOL DO THE WOLF! Senna de fora da área, no ângulo', 59: '⚽ GOL DO MANFRÉ FC! Cruzamento e cabeçada', 66: '⚽ GOL DO MANFRÉ FC! Contra-ataque letal' }

// 🥅 a trave desenhada: postes + travessão + rede com profundidade (a parte de
// trás é mais escura e menor, dando o volume). `esq` espelha.
const trave = (lado) => `
  <svg class="trave ${lado}" viewBox="0 0 60 44" aria-hidden="true">
    <defs><pattern id="rede-${lado}" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M4 0L0 4" stroke="rgba(244,236,214,.55)" stroke-width=".6"/></pattern></defs>
    <g class="rede">
      <!-- fundo da rede (mais atrás, menor = profundidade) -->
      <path d="M14 8 L46 8 L46 36 L14 36 Z" fill="rgba(0,0,0,.35)"/>
      <path d="M14 8 L46 8 L46 36 L14 36 Z" fill="url(#rede-${lado})"/>
      <!-- laterais da rede (as "paredes" indo pra trás) -->
      <path d="M6 2 L14 8 L14 36 L6 42 Z" fill="url(#rede-${lado})" opacity=".8"/>
      <path d="M54 2 L46 8 L46 36 L54 42 Z" fill="url(#rede-${lado})" opacity=".8"/>
      <path d="M6 2 L54 2 L46 8 L14 8 Z" fill="url(#rede-${lado})" opacity=".7"/>
    </g>
    <!-- postes e travessão (na frente) -->
    <path d="M6 2 L54 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 2 L6 42 M54 2 L54 42" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="30" cy="43" rx="27" ry="2" fill="rgba(0,0,0,.35)"/>
  </svg>`

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
    <!-- ⚽🥅 O GOLZINHO 3D -->
    <div class="campo ${estado}">
      <div class="gramado">
        <i class="linha meio"></i><i class="circulo"></i>
        <i class="lado casa" style="background:${CASA}"></i><i class="lado fora" style="background:${FORA}"></i>
      </div>
      ${trave('esq')}
      ${trave('dir')}
      <span class="sombra"></span>
      <img class="bola" src="${BOLA}" alt="">
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
/* ── ⚽🥅 O GOLZINHO 3D ── */
.campo{position:relative;height:74px;background:#07120c;overflow:hidden;perspective:260px}
.gramado{position:absolute;left:-6%;right:-6%;top:10px;bottom:-30px;transform-origin:50% 100%;transform:rotateX(58deg);
  background:repeating-linear-gradient(90deg,#2e7a45 0 34px,#27693b 34px 68px);
  box-shadow:inset 0 30px 40px rgba(0,0,0,.55)}
.gramado .linha.meio{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.75);transform:translateX(-50%)}
.gramado .circulo{position:absolute;left:50%;top:50%;width:70px;height:70px;border:2px solid rgba(255,255,255,.7);border-radius:50%;transform:translate(-50%,-50%)}
.gramado .lado{position:absolute;top:0;bottom:0;width:6px;opacity:.9}
.gramado .lado.casa{left:0}.gramado .lado.fora{right:0}
.trave{position:absolute;bottom:8px;width:56px;height:41px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
.trave.esq{left:4px}.trave.dir{right:4px}
.trave .rede{transform-origin:50% 100%}
.campo.fora .trave.esq .rede{animation:estufa .45s ease .5s}
.campo.casa .trave.dir .rede{animation:estufa .45s ease .5s}
@keyframes estufa{35%{transform:scale(1.14,1.08) translateY(-2px)}70%{transform:scale(1.04,1.03)}}
.bola{position:absolute;left:50%;bottom:16px;width:22px;height:22px;transform:translateX(-50%);filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
.sombra{position:absolute;left:50%;bottom:12px;width:18px;height:6px;border-radius:50%;background:rgba(0,0,0,.45);transform:translateX(-50%);filter:blur(1px)}
.campo.casa .bola{animation:voa-dir .62s cubic-bezier(.3,.6,.5,1) forwards}
.campo.casa .sombra{animation:sombra-dir .62s cubic-bezier(.3,.6,.5,1) forwards}
.campo.fora .bola{animation:voa-esq .62s cubic-bezier(.3,.6,.5,1) forwards}
.campo.fora .sombra{animation:sombra-esq .62s cubic-bezier(.3,.6,.5,1) forwards}
@keyframes voa-dir{0%{left:50%;bottom:16px;transform:translateX(-50%) rotate(0)}50%{bottom:40px;transform:translateX(-50%) rotate(300deg) scale(1.1)}100%{left:calc(100% - 26px);bottom:22px;transform:translateX(-50%) rotate(620deg) scale(.7)}}
@keyframes voa-esq{0%{left:50%;bottom:16px;transform:translateX(-50%) rotate(0)}50%{bottom:40px;transform:translateX(-50%) rotate(-300deg) scale(1.1)}100%{left:26px;bottom:22px;transform:translateX(-50%) rotate(-620deg) scale(.7)}}
@keyframes sombra-dir{0%{left:50%;transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(.55);opacity:.5}100%{left:calc(100% - 26px);transform:translateX(-50%) scale(.7)}}
@keyframes sombra-esq{0%{left:50%;transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(.55);opacity:.5}100%{left:26px;transform:translateX(-50%) scale(.7)}}
`

const pagina = (corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="wrap">${corpo}</div></body></html>`
const PARADO = '.campo.casa .bola,.campo.fora .bola,.campo.casa .sombra,.campo.fora .sombra{animation-play-state:paused;animation-delay:-.62s}.trave .rede{animation:none!important}.numbers i.pula{animation:none;color:#1B7A3D}'

const htmlPng = pagina(`
<h1>⚽🥅 O golzinho em 3D (câmera de TV)</h1>
<p class="sub">A faixa preta vira um <b>pedaço de gramado em perspectiva</b>, com uma <b>trave desenhada de verdade</b> em cada ponta (postes, travessão e rede com fundo) e <b>a bola do pênalti</b> — a foto que o jogo já tem — com sombra no chão. No gol ela sai em <b>arco</b>, gira, a sombra acompanha, e a <b>rede estufa</b> quando ela entra. Tudo em CSS: <b>0 KB a mais</b>.</p>

<p class="passo">① jogo rolando · o campo em perspectiva, a bola no círculo central</p>
<div class="fundo">${placar(20)}</div>
<p class="cap">O lado de cada time continua marcado pela <b>cor na lateral do gramado</b> (esquerda The Wolf, direita Manfré).</p>

<p class="passo">② 33′ · gol do The Wolf → a bola voa em arco e estufa a rede da DIREITA</p>
<div class="fundo">${placar(33, 'casa')}</div>
<p class="cap">Mesmos três sinais de antes (rede, número em verde, faixa amarela) — só que agora com volume: a bola sobe, gira e cai dentro do gol.</p>

<p class="passo">③ 59′ · gol do Manfré → a bola voa pra ESQUERDA</p>
<div class="fundo">${placar(59, 'fora')}</div>

<div class="nota">🎥 <b>Por que "3D de CSS" e não motor 3D:</b> um motor de verdade (three.js) são ~600 KB pra todo mundo baixar e esquenta o celular numa tela que fica aberta 8 minutos por rodada — a regra é "nada atrasa o jogo". Com perspectiva de CSS o efeito de câmera é o mesmo, roda liso em qualquer celular e não pesa nada.<br>🎭 <b>Um teatro só</b>, no lugar dos raios do GOOOL. 🙈 Anti-spoiler igual. ↩️ Reverter: um bloco só.</div>
`, PARADO)

const htmlVid = pagina(`<div class="fundo" id="v">${placar(28)}</div>
<script>
  const gols = ${JSON.stringify(GOLS)}, narr = ${JSON.stringify(NARR)}
  const el = document.getElementById('v'); const t0 = Date.now()
  let ultimoVisto = -1
  function frame(){
    const min = 28 + Math.min(42, (Date.now() - t0) / 1000 * 4.2)
    const vistos = gols.filter(g => g.min <= min); const hg = vistos.filter(g => g.home).length, ag = vistos.length - hg
    const ultimo = vistos[vistos.length - 1]; const golNaHora = ultimo && min - ultimo.min < 8
    const estado = golNaHora ? (ultimo.home ? 'casa' : 'fora') : 'parado'
    el.querySelector('.narr').textContent = golNaHora ? narr[ultimo.min] : 'Jogo rolando…'
    el.querySelector('.narr').className = 'narr' + (golNaHora ? ' goal' : '')
    el.querySelector('.numbers small').textContent = Math.floor(min) + '′'
    const [n1, n2] = el.querySelectorAll('.numbers i'); n1.textContent = hg; n2.textContent = ag
    const campo = el.querySelector('.campo')
    if (ultimo && ultimo.min !== ultimoVisto) {
      ultimoVisto = ultimo.min
      campo.className = 'campo'; void campo.offsetWidth; campo.className = 'campo ' + estado
      const n = ultimo.home ? n1 : n2; n.classList.remove('pula'); void n.offsetWidth; n.classList.add('pula')
    }
    if (!golNaHora && campo.className !== 'campo') { campo.className = 'campo'; n1.classList.remove('pula'); n2.classList.remove('pula') }
    const [c1, c2] = el.querySelectorAll('.scorers > div')
    c1.innerHTML = vistos.filter(g => g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    c2.innerHTML = vistos.filter(g => !g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    if (min < 70) requestAnimationFrame(frame)
  }
  frame()
</script>`, 'body{padding:0 14px;background:#0C0C0C;zoom:1.6}.wrap{max-width:560px}')

const outDir = process.argv[2] ?? 'mockup-golzinho-3d'
mkdirSync(outDir, { recursive: true })
const pngHtml = path.join(outDir, 'golzinho-3d.html'), vidHtml = path.join(outDir, 'golzinho-3d-video.html')
writeFileSync(pngHtml, htmlPng); writeFileSync(vidHtml, htmlVid)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${path.resolve(pngHtml)}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)
await p.screenshot({ path: path.join(outDir, 'golzinho-3d.png'), fullPage: true })
await p.close()
const ctx = await b.newContext({ viewport: { width: 940, height: 600 }, deviceScaleFactor: 1, recordVideo: { dir: outDir, size: { width: 940, height: 600 } } })
const v = await ctx.newPage()
await v.goto(`file://${path.resolve(vidHtml)}`, { waitUntil: 'networkidle' })
await v.evaluate(() => document.fonts.ready)
await v.waitForTimeout(11500)
await ctx.close()
await b.close()
const webm = readdirSync(outDir).find(f => f.endsWith('.webm'))
if (webm) {
  const src = path.join(outDir, webm), mp4 = path.join(outDir, 'golzinho-3d.mp4')
  try { execSync(`ffmpeg -y -loglevel error -i "${src}" -ss 0.6 -t 10.5 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`); renameSync(src, path.join(outDir, 'golzinho-3d.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('ok →', outDir)
