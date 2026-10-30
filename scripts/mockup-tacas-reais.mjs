// 🏆 MOCKUP: taças REAIS redesenhadas no traço da Copa dos 8 (30/10, Diego: "pesquise foto dos troféus reais dos
// campeonatos todos… e recrie no formato de arte igual vc fez da copa dos 08… se tiver libertadores na carreira e
// no online deixe igual"). Mostra a FOTO real (referência, só no mockup) ao lado do DESENHO novo (vetor, 0 KB de
// imagem, mesmo viewBox 120×170 do `Trofeu` de competicoes-visual.tsx).
//
// Fotos de referência: github.com/Brasfoot-Next/database (trophies/*.png) — ficam SÓ no mockup, nunca no jogo.
//   node scripts/mockup-tacas-reais.mjs <pasta-das-fotos> <saida.png>
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { TACAS } from './tacas-reais-svg.mjs'

const [REF, OUT] = process.argv.slice(2)
const INK = '#0C0C0C'
const grads = id => `<defs>
<linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".35" stop-color="#FFC400"/><stop offset=".7" stop-color="#C98A00"/><stop offset="1" stop-color="#FFE08A"/></linearGradient>
<linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#D5DCE4"/><stop offset=".75" stop-color="#8E9AA8"/><stop offset="1" stop-color="#F1F4F7"/></linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD2A8"/><stop offset=".4" stop-color="#C77B45"/><stop offset=".75" stop-color="#7A3F1C"/><stop offset="1" stop-color="#E9A36F"/></linearGradient>
<linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2FBF5A"/><stop offset="1" stop-color="#0E5B2A"/></linearGradient>
<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3a1e"/><stop offset="1" stop-color="#2b1a0c"/></linearGradient>
</defs>`
const svg = (k, size = 150) => {
  const id = 'm' + k
  const body = TACAS[k].svg({ o: `url(#${id}o)`, p: `url(#${id}p)`, b: `url(#${id}b)`, v: `url(#${id}v)`, m: `url(#${id}m)`, INK })
  return `<svg viewBox="0 0 120 170" width="${size}" height="${Math.round(size * 170 / 120)}" style="display:block;filter:drop-shadow(4px 4px 0 rgba(0,0,0,.55))">${grads(id)}${body}</svg>`
}
const foto = f => f && existsSync(`${REF}/${f}`) ? `<img src="data:image/png;base64,${readFileSync(`${REF}/${f}`).toString('base64')}" style="max-height:170px;max-width:120px">` : '<i style="color:#888">sem foto</i>'

const reais = Object.entries(TACAS).filter(([, t]) => t.real)
const nossas = Object.entries(TACAS).filter(([, t]) => !t.real)
const card = ([k, t]) => `<div class="card"><div class="t">${t.nome}</div><div class="onde">${t.onde}</div><div class="par">
  ${t.real ? `<div class="lado"><div class="foto">${foto(t.foto)}</div><small>foto real</small></div><div class="seta">➜</div>` : ''}
  <div class="lado"><div class="arte" style="background:${t.fundo}">${svg(k)}</div><small>${t.real ? 'desenho novo' : t.nova ? 'desenho novo (inventada)' : 'fica como está'}</small></div></div></div>`

const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet"><style>
body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:${INK};padding:28px;width:1180px}
h1{font-weight:900;text-transform:uppercase;font-size:40px;margin:0}h2{font-weight:900;text-transform:uppercase;font-size:24px;margin:26px 0 10px}
p.s{margin:4px 0 0;font-size:18px;color:#444}
.grid{display:flex;flex-wrap:wrap;gap:16px}
.card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 #000;padding:12px 14px;width:358px;box-sizing:border-box}
.t{font-weight:900;text-transform:uppercase;font-size:20px}.onde{font-size:13px;color:#555;margin-bottom:8px}
.par{display:flex;align-items:center;justify-content:center;gap:10px}.lado{display:flex;flex-direction:column;align-items:center;gap:4px}
.foto{width:130px;height:190px;display:flex;align-items:center;justify-content:center;background:#efe7d0;border-radius:10px}
.arte{width:170px;height:228px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:2px solid ${INK}}
.seta{font-size:26px}small{font-size:12px;color:#555;text-transform:uppercase;font-weight:700}
</style></head><body>
<h1>🏆 As taças do jogo · desenho novo</h1>
<p class="s">Cada taça REAL redesenhada no traço da Copa dos 8 (contorno preto, dourado/prata, sombra dura). A MESMA taça vale no online e na carreira.</p>
<h2>Taças reais (foto de referência → desenho novo)</h2><div class="grid">${reais.map(card).join('')}</div>
<h2>Taças nossas (inventadas)</h2><div class="grid">${nossas.map(card).join('')}</div>
</body></html>`
writeFileSync(OUT.replace(/\.png$/, '.html'), html)
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1236, height: 900 } })
await pg.setContent(html, { waitUntil: 'networkidle' }).catch(() => {})
await pg.waitForTimeout(500)
await pg.screenshot({ path: OUT, fullPage: true })
await br.close()
console.log('✅', OUT)
