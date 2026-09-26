#!/usr/bin/env node
// ─── 🏟️ MOCKUP: o GIRO DA COPA vira LETREIRO DE ESTÁDIO ───────────────────────
//
// Pedido do Diego (26/09): *"quero que faça uma mudança visual melhor no giro da
// copa. Seja mais com alguma animação ou outras coisas… igual você fez uma ótima
// mudança na disputa de pênaltis. Qual sua melhor ideia?"*
//
// A ideia: hoje o giro é uma caixinha bege com uma frase que troca a cada 3s.
// Vira o LETREIRO ELETRÔNICO do estádio — a faixa de LED que corre em volta do
// gramado: fundo preto, letra âmbar com brilho, matriz de pontinhos, e as
// manchetes CORRENDO da direita pra esquerda, uma atrás da outra, com um ◆ entre
// elas. Todo mundo que já foi a um estádio reconhece na hora.
//
// Regras dele que este desenho respeita:
//   · 🎭 não repete o teatro do placar — o placar mostra o LANCE; o letreiro
//     mostra a NOTÍCIA, com outra cara (LED, não texto de jornal).
//   · 🚫 nada de confete nem faixa colorida — a cor muda SÓ no LED: âmbar de
//     sempre, dourado quando é 👑 campeão, vermelho quando é 🎯 pênalti.
//   · ⏱️ nada atrasa o jogo: é a mesma caixa, no mesmo lugar, sem toque novo.
//   · 💾 0 KB: só CSS (matriz de pontos = radial-gradient, corrida = keyframes).
//   · 🚫 anti-spoiler intacto: o letreiro mostra a MESMA lista que o giro já
//     segura até o apito. Só muda a cara.
//
// Saída: um PNG (hoje × novo, 2 estados) e um MP4 curto com o letreiro correndo.
// Rodar do raiz: node scripts/mockup-giro-letreiro.mjs /tmp/giro
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

// as manchetes de uma rodada de Champions de verdade (as do print dele)
const MANCHETES = [
  { t: '⚽ Champions QUARTAS · volta: Al Takhadao FC 1 × 0 Bagres 1993', k: 'placar' },
  { t: '🏆 Al Takhadao FC avançou na Champions — adeus, Bagres 1993!', k: 'avancou' },
  { t: '🎯 Manfré FC passou nos PÊNALTIS e eliminou Leite de Verdade FC!', k: 'penal' },
  { t: '⚽ Champions QUARTAS · volta: Manfré FC 1 × 1 Leite de Verdade FC', k: 'placar' },
]
const CAMPEAO = [
  { t: '👑 FUTPOINT FC É CAMPEÃO DA CHAMPIONS! A orelhuda é dele.', k: 'campeao' },
  { t: '🥈 Al Takhadao FC bateu na trave: perdeu a final por 2 × 1', k: 'avancou' },
]

const COR = { placar: '#FFB000', avancou: '#FFB000', penal: '#FF5A3C', campeao: '#FFE066' }
const led = (lista, dur) => `
  <div class="letreiro">
    <div class="topo"><span class="rot">🏆 GIRO DA COPA</span><span class="pts">${lista.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</span></div>
    <div class="faixa"><div class="corre" style="animation-duration:${dur}s">
      ${[...lista, ...lista].map(m => `<span class="m" style="color:${COR[m.k]};text-shadow:0 0 6px ${COR[m.k]}88">${m.t}</span><span class="sep">◆</span>`).join('')}
    </div></div>
  </div>`

const hoje = `
  <div class="hoje">
    <p class="hrot">🏆 Giro da Copa</p>
    <p class="htxt">🏆 Briga de Galo FC avançou na Champions — adeus, Rei da Bola FC!</p>
    <div class="hdots"><i class="on"></i><i></i><i></i><i></i></div>
  </div>`

const CSS = `${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:900px;margin:0 auto}
h1{${OSW};font-size:20px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:14px;line-height:1.5}
.passo{${OSW};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin:16px 0 6px}
.tela{background:#1b3a25;background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),repeating-linear-gradient(90deg,#2b6b3e 0 40px,#25603a 40px 80px);border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:14px}
/* ── hoje: a caixinha bege ── */
.hoje{background:#FFF6DC;border:3px solid ${INK};border-radius:14px;padding:12px;box-shadow:4px 4px 0 ${INK}}
.hrot{${OSW};font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.htxt{font-size:12px;font-weight:700;min-height:2.4em}
.hdots{display:flex;justify-content:center;gap:4px;margin-top:8px}
.hdots i{width:5px;height:5px;border-radius:99px;background:#e2d8b8;display:inline-block}.hdots i.on{background:#8a8069}
/* ── novo: o letreiro ── */
.letreiro{background:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};overflow:hidden}
.topo{display:flex;align-items:center;justify-content:space-between;padding:6px 10px 5px;background:${CREME};border-bottom:3px solid ${INK}}
.rot{${OSW};font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:${INK}}
.pts i{display:inline-block;width:5px;height:5px;border-radius:99px;background:#d9cfae;margin-left:4px}.pts i.on{background:${INK}}
.faixa{position:relative;height:46px;background:#0a0a0a;
  background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);background-size:4px 4px;
  box-shadow:inset 0 0 18px rgba(0,0,0,.9)}
.faixa:before,.faixa:after{content:'';position:absolute;top:0;bottom:0;width:26px;z-index:2;pointer-events:none}
.faixa:before{left:0;background:linear-gradient(90deg,#0a0a0a,transparent)}
.faixa:after{right:0;background:linear-gradient(270deg,#0a0a0a,transparent)}
.corre{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;white-space:nowrap;
  animation:corre linear infinite;padding-left:100%}
@keyframes corre{to{transform:translateX(-50%)}}
.m{${OSW};font-size:16px;letter-spacing:.6px;text-transform:uppercase}
.sep{color:rgba(255,176,0,.45);margin:0 18px;font-size:11px}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:8px}
.cap b{font-weight:800}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.6;color:#3d3a30;margin-top:18px}
`

const pagina = (corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="wrap">${corpo}</div></body></html>`
// 📸 na FOTO a corrida fica congelada no MEIO (delay negativo): a manchete inteira
// aparece na faixa, em vez de uma ponta entrando pela direita.
const PARADO = '.corre{animation-play-state:paused;animation-delay:-7s}'

// ── página do PNG: hoje × novo, dois estados ──
const htmlPng = pagina(`
<h1>🏟️ O giro da copa vira letreiro de estádio</h1>
<p class="sub">A caixinha bege que troca de frase vira a <b>faixa de LED que corre em volta do gramado</b>: fundo preto, letra âmbar com brilho, matriz de pontinhos, e as manchetes <b>correndo</b> uma atrás da outra. Mesma caixa, mesmo lugar, mesma lista (o anti-spoiler continua igual). <b>0 KB — só CSS.</b></p>

<p class="passo">hoje</p>
<div class="tela">${hoje}</div>
<p class="cap"><b>Uma frase por vez</b>, troca a cada 3 segundos, cara de aviso de sistema.</p>

<p class="passo">novo · rodada normal (o LED âmbar corre — no vídeo dá pra ver)</p>
<div class="tela">${led(MANCHETES, 26)}</div>
<p class="cap"><b>Todas as manchetes passam</b>, sem esperar 3s por cada uma. 🎯 pênalti acende em <b style="color:#FF5A3C">vermelho</b>, o resto em <b style="color:#B87A00">âmbar</b>.</p>

<p class="passo">novo · saiu o campeão</p>
<div class="tela">${led(CAMPEAO, 18)}</div>
<p class="cap">Quando é 👑 <b>campeão</b>, o LED fica <b style="color:#B8960B">dourado</b> — sem confete, sem faixa: só a cor da luz.</p>

<div class="nota">🔒 <b>O que não muda:</b> o lugar (embaixo da tabela), a lista de manchetes e a regra de segurar tudo até o apito. Quem prefere movimento reduzido no celular vê a frase parada, como hoje.<br>↩️ <b>Reverter:</b> o componente antigo fica guardado; é trocar uma linha.</div>
`, PARADO)

// ── página do VÍDEO: só o letreiro, grande ──
// 🎥 o vídeo grava em 960×600 com a página em zoom 2 — assim o letreiro sai nítido
// e ocupa o quadro inteiro (com dpr 2 o gravador encolhia a página pra um canto).
const htmlVid = pagina(`<div class="tela" style="margin-top:80px">${led(MANCHETES, 22)}</div>`, 'body{padding:0 14px;background:#0C0C0C;zoom:2}.wrap{max-width:452px}')

const outDir = process.argv[2] ?? 'mockup-giro'
mkdirSync(outDir, { recursive: true })
const pngHtml = path.join(outDir, 'giro-letreiro.html'), vidHtml = path.join(outDir, 'giro-video.html')
writeFileSync(pngHtml, htmlPng); writeFileSync(vidHtml, htmlVid)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// PNG
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${path.resolve(pngHtml)}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(1200)
await p.screenshot({ path: path.join(outDir, 'giro-letreiro.png'), fullPage: true })
await p.close()
// VÍDEO (webm → mp4)
const ctx = await b.newContext({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1, recordVideo: { dir: outDir, size: { width: 960, height: 600 } } })
const v = await ctx.newPage()
await v.goto(`file://${path.resolve(vidHtml)}`, { waitUntil: 'networkidle' })
await v.evaluate(() => document.fonts.ready)
await v.waitForTimeout(9000)
await ctx.close()
await b.close()
const webm = readdirSync(outDir).find(f => f.endsWith('.webm'))
if (webm) {
  const src = path.join(outDir, webm), mp4 = path.join(outDir, 'giro-letreiro.mp4')
  try { execSync(`ffmpeg -y -loglevel error -i "${src}" -ss 1 -t 7 -vf "scale=960:-2" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`) ; renameSync(src, path.join(outDir, 'giro-letreiro.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('ok →', outDir)
