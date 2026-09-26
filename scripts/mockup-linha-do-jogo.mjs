#!/usr/bin/env node
// ─── 📺 MOCKUP: a LINHA DO JOGO no placar ao vivo (simulação dos 90 min) ─────
//
// Pergunta do Diego (26/09): *"como seria uma animação institucional irada no
// placar de gols dos jogos rolando das simulações de 90 min?"*
//
// A ideia: a LINHA DO TEMPO da transmissão de TV. Uma barra de 0' a 90' embaixo
// do placar; um marcador corre com o relógio; a cada gol, uma bolinha CAI na
// linha no minuto exato — em cima da linha se foi do mandante, embaixo se foi do
// visitante — com o nome de quem fez. No apito, a barra é a HISTÓRIA do jogo de
// relance: quem abriu, quando virou, o gol no fim.
//
// Regras dele que este desenho respeita:
//   · 🎙️ emoção = o LANCE (a narração e o GOOOL que já existem continuam iguais);
//     a linha não repete o teatro — ela é a MEMÓRIA do jogo, não a comemoração.
//   · 🙈 anti-spoiler por construção: bolinha só aparece quando o relógio PASSA
//     do minuto dela. O futuro fica vazio.
//   · 🚫 sem confete, sem faixa colorida: só a barra, o marcador e as bolinhas.
//   · 💾 0 KB: CSS + os gols que a tela já tem (`goals[]` com `min` e `home`).
//   · ⏱️ não atrasa nada: roda no mesmo relógio da simulação.
//
// Saída: PNG (3 momentos) + MP4 curto. Rodar do raiz: node scripts/mockup-linha-do-jogo.mjs /tmp/linha
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

// o jogo do print dele: The Wolf 2 × 2 Manfré FC
const GOLS = [
  { nome: 'Edin Džeko', min: 33, home: true },
  { nome: 'Marcos Senna', min: 58, home: true },
  { nome: 'Gol de Manfré FC', min: 59, home: false },
  { nome: 'Gol de Manfré FC', min: 66, home: false },
]
const NARR = { 33: '⚽ Džeko cabeceou no cantinho — sem chance pro goleiro!', 58: '⚽ Senna de fora da área, no ângulo!', 59: '⚽ Manfré FC respondeu na hora: bola cruzada, gol!', 66: '⚽ Manfré FC empatou: contra-ataque letal!' }

// o placar que já existe (mesmas cores/formas do online-match-visual.css) + a linha nova
const placar = (min, opts = {}) => {
  const vistos = GOLS.filter(g => g.min <= min)
  const hg = vistos.filter(g => g.home).length, ag = vistos.length - hg
  const ultimo = [...vistos].reverse()[0]
  const narr = opts.narr ?? (ultimo && min - ultimo.min < 4 ? NARR[ultimo.min] : min >= 90 ? 'Fim de jogo!' : 'Jogo rolando…')
  const golNaHora = ultimo && min - ultimo.min < 4
  const x = m => `${(Math.min(m, 93) / 93) * 100}%`
  return `
  <section class="score ${golNaHora ? 'marcou' : ''}">
    <div class="narr ${golNaHora ? 'goal' : ''}">${narr}</div>
    <div class="duel">
      <div class="team" style="border-color:#9C8B5A"><div class="crest">🐺</div><strong>The Wolf</strong><small>VOCÊ</small></div>
      <div class="numbers"><small>${Math.min(90, min)}′</small><strong>${hg} <span>×</span> ${ag}</strong></div>
      <div class="team" style="border-color:#2E6FB0"><div class="crest">🛡️</div><strong>Manfré FC</strong><small>RIVAL</small></div>
    </div>
    <!-- 📺 A LINHA DO JOGO -->
    <div class="linha ${opts.destaque ? 'destaque' : ''}">
      <div class="trilho">
        <div class="andou" style="width:${x(min)}"></div>
        <i class="tick" style="left:${x(45)}"></i><i class="tick fim" style="left:${x(90)}"></i>
        <b class="marcador ${min >= 90 ? 'fim' : ''}" style="left:${x(min)}"></b>
        ${vistos.map(g => `<span class="gol ${g.home ? 'cima' : 'baixo'} ${g.min === ultimo?.min && golNaHora ? 'agora' : ''}" style="left:${x(g.min)}"><em>⚽</em><u>${g.nome.replace('Gol de ', '')} ${g.min}′</u></span>`).join('')}
      </div>
      <div class="legenda"><span>0′</span><span>45′</span><span>90′</span></div>
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
/* ── o placar de hoje ── */
.score{background:linear-gradient(135deg,rgba(10,28,22,.94),rgba(7,19,15,.87));color:${CREME};border:2px solid #847657;border-radius:18px;overflow:hidden;box-shadow:0 4px 0 ${INK}}
.narr{height:36px;line-height:36px;padding:0 10px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:700 13px/36px Oswald,sans-serif;background:#0a1911}
.narr.goal{background:${GOLD};color:${INK}}
.duel{display:grid;grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);align-items:center;padding:14px 8px 10px;gap:8px}
.team{text-align:center;min-width:0;border-bottom:3px solid;padding-bottom:8px}
.team .crest{font-size:30px;line-height:1;margin-bottom:4px}.team strong{${OSW};font-size:16px;display:block}.team small{font-size:10px;letter-spacing:.1em;opacity:.7}
.numbers{background:${CREME};color:${INK};border:3px solid ${INK};border-radius:12px;padding:8px 2px 10px;text-align:center;box-shadow:3px 4px 0 ${INK};font-family:Oswald,sans-serif}
.numbers small{display:block;font-weight:700;font-size:14px}.numbers strong{display:block;font-size:32px;line-height:1.3}.numbers span{font-size:18px}
.scorers{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:10px 12px;border-top:1px solid #59624d;font-size:12px}.scorers p{margin:0 0 3px}.scorers b{font-weight:800}
/* ── 📺 A LINHA DO JOGO (novo) ── */
.linha{padding:26px 16px 4px;background:#0c0c0c40}
.trilho{position:relative;height:6px;border-radius:99px;background:rgba(244,236,214,.16);border:1px solid rgba(244,236,214,.18)}
.andou{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#9C8B5A,${GOLD});transition:width .25s linear}
.tick{position:absolute;top:-5px;width:2px;height:14px;background:rgba(244,236,214,.45);transform:translateX(-50%)}
.tick.fim{background:rgba(244,236,214,.7)}
.marcador{position:absolute;top:50%;width:14px;height:14px;border-radius:99px;background:${GOLD};border:2.5px solid ${INK};transform:translate(-50%,-50%);box-shadow:0 0 0 3px rgba(255,196,0,.28),0 0 12px rgba(255,196,0,.6)}
.marcador.fim{background:${CREME}}
.gol{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;${OSW}}
.gol em{font-style:normal;font-size:13px;line-height:1;filter:drop-shadow(0 1px 0 ${INK})}
.gol u{text-decoration:none;font-size:9px;letter-spacing:.3px;white-space:nowrap;color:${CREME};opacity:.9;background:rgba(12,12,12,.55);padding:1px 5px;border-radius:6px}
.gol.cima{bottom:9px}.gol.cima u{order:-1}
.gol.baixo{top:9px}
.gol.agora em{animation:cai .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes cai{0%{transform:translateY(-14px) scale(.4);opacity:0}100%{transform:none;opacity:1}}
.legenda{display:flex;justify-content:space-between;${OSW};font-size:9px;letter-spacing:.8px;color:rgba(244,236,214,.45);margin-top:22px}
.destaque .trilho{box-shadow:0 0 0 2px rgba(255,196,0,.35)}
`

const pagina = (corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="wrap">${corpo}</div></body></html>`

const htmlPng = pagina(`
<h1>📺 A linha do jogo no placar ao vivo</h1>
<p class="sub">A <b>linha do tempo da transmissão de TV</b> embaixo do placar: uma barra de 0′ a 90′, o marcador correndo com o relógio, e a cada gol uma bolinha <b>cai na linha no minuto exato</b> — em cima se foi do mandante, embaixo se foi do visitante, com o nome de quem fez. No apito, a barra é a <b>história do jogo de relance</b>.</p>

<p class="passo">① 34′ · acabou de sair o 1º gol — a bolinha CAI na linha (no vídeo dá pra ver)</p>
<div class="fundo">${placar(34)}</div>
<p class="cap"><b>Nada do que já existe muda:</b> a narração amarela do lance e a lista de gols continuam iguais. A linha entra entre o placar e a lista.</p>

<p class="passo">② 66′ · quatro gols, dois de cada lado — a virada e o empate visíveis num olhar</p>
<div class="fundo">${placar(66)}</div>
<p class="cap"><b>Mandante em cima, visitante embaixo.</b> Dá pra ler o jogo sem ler texto: abriu 2 a 0, o rival respondeu no minuto seguinte e empatou aos 66′.</p>

<p class="passo">③ 90′ · apito final — a linha vira o resumo do jogo</p>
<div class="fundo">${placar(93, { narr: 'Fim de jogo: 2 × 2 no The Wolf!' })}</div>
<p class="cap"><b>Anti-spoiler por construção:</b> a bolinha só aparece quando o relógio passa do minuto dela — o futuro fica vazio na barra, sempre.</p>

<div class="nota">🎙️ <b>O que ela NÃO faz:</b> não comemora — o GOOOL, a mascote e a narração do lance continuam sendo a emoção. A linha é a <b>memória</b> do jogo, não o teatro. Sem confete, sem faixa colorida.<br>💾 <b>0 KB:</b> só CSS e os gols que o placar já tem (minuto + lado). Vale pra todo jogo de 90 min: liga, Copa, Champions, Liberta, Copa do Mundo — e qualquer copa nova.<br>↩️ <b>Reverter:</b> é um bloco só embaixo do placar; tirar é uma linha.</div>
`)

// 🎥 vídeo: o relógio anda de 28′ a 70′ em ~8s, com os gols caindo
const htmlVid = pagina(`<div class="fundo" id="v">${placar(28)}</div>
<script>
  const gols = ${JSON.stringify(GOLS)}, narr = ${JSON.stringify(NARR)}
  const el = document.getElementById('v'); const t0 = Date.now()
  const x = m => (Math.min(m, 93) / 93 * 100) + '%'
  function frame(){
    const min = 28 + Math.min(42, (Date.now() - t0) / 1000 * 5.4)
    const vistos = gols.filter(g => g.min <= min); const hg = vistos.filter(g => g.home).length, ag = vistos.length - hg
    const ultimo = vistos[vistos.length - 1]; const golNaHora = ultimo && min - ultimo.min < 3.5
    el.querySelector('.narr').textContent = golNaHora ? narr[ultimo.min] : 'Jogo rolando…'
    el.querySelector('.narr').className = 'narr' + (golNaHora ? ' goal' : '')
    el.querySelector('.numbers small').textContent = Math.floor(min) + '′'
    el.querySelector('.numbers strong').innerHTML = hg + ' <span>×</span> ' + ag
    el.querySelector('.andou').style.width = x(min); el.querySelector('.marcador').style.left = x(min)
    const tr = el.querySelector('.trilho'); tr.querySelectorAll('.gol').forEach(n => n.remove())
    for (const g of vistos) { const s = document.createElement('span'); s.className = 'gol ' + (g.home ? 'cima' : 'baixo') + (g === ultimo && golNaHora ? ' agora' : ''); s.style.left = x(g.min); s.innerHTML = '<em>⚽</em><u>' + g.nome.replace('Gol de ', '') + ' ' + g.min + '′</u>'; tr.appendChild(s) }
    const [c1, c2] = el.querySelectorAll('.scorers > div')
    c1.innerHTML = vistos.filter(g => g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    c2.innerHTML = vistos.filter(g => !g.home).map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    if (min < 70) requestAnimationFrame(frame)
  }
  frame()
</script>`, 'body{padding:0 14px;background:#0C0C0C;zoom:1.6}.wrap{max-width:560px}')

const outDir = process.argv[2] ?? 'mockup-linha'
mkdirSync(outDir, { recursive: true })
const pngHtml = path.join(outDir, 'linha-do-jogo.html'), vidHtml = path.join(outDir, 'linha-video.html')
writeFileSync(pngHtml, htmlPng); writeFileSync(vidHtml, htmlVid)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${path.resolve(pngHtml)}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)
await p.screenshot({ path: path.join(outDir, 'linha-do-jogo.png'), fullPage: true })
await p.close()
const ctx = await b.newContext({ viewport: { width: 940, height: 560 }, deviceScaleFactor: 1, recordVideo: { dir: outDir, size: { width: 940, height: 560 } } })
const v = await ctx.newPage()
await v.goto(`file://${path.resolve(vidHtml)}`, { waitUntil: 'networkidle' })
await v.evaluate(() => document.fonts.ready)
await v.waitForTimeout(9500)
await ctx.close()
await b.close()
const webm = readdirSync(outDir).find(f => f.endsWith('.webm'))
if (webm) {
  const src = path.join(outDir, webm), mp4 = path.join(outDir, 'linha-do-jogo.mp4')
  try { execSync(`ffmpeg -y -loglevel error -i "${src}" -ss 0.6 -t 8.5 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`); renameSync(src, path.join(outDir, 'linha-do-jogo.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('ok →', outDir)
