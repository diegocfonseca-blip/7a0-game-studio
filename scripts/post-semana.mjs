// ─── 🏆 POST DA SEMANA: CLÃ CAMPEÃO + PÓDIO INDIVIDUAL (Diego 02/11) ─────────────────────────────────────────────
// Pedido dele: *"post pro Instagram pro clã que ganhou a semana… e todos nomes dos seus usuários… e também o ranking
// da semana que ganha medalha individual… dois pra stories e um post único pro feed"*.
// Gera 3 PNG: stories do CLÃ (1080×1920), stories do PÓDIO (1080×1920) e o FEED juntando os dois (1080×1350).
// Os números vêm do banco (esc_titulos_por_uid da semana fechada + esc_cla_membros) e moram num JSON em scripts/posts/.
// Cara do jogo: creme, borda preta grossa, sombra dura, Oswald. Rodar da RAIZ do repo:
//   node scripts/post-semana.mjs scripts/posts/semana-2026-10-26.json
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
// imagem e fonte entram INLINE (data:) — a página nasce em about:blank e não pode ler file://
const url = p => `data:${p.endsWith('.woff2') ? 'font/woff2' : p.endsWith('.png') ? 'image/png' : 'image/webp'};base64,${readFileSync(resolve(p)).toString('base64')}`
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fonte = w => `url(${url(`scripts/fonts/oswald-latin-${w}-normal.woff2`)})`
const CSS = `
@font-face{font-family:Oswald;font-weight:400;src:${fonte(400)}}@font-face{font-family:Oswald;font-weight:500;src:${fonte(500)}}
@font-face{font-family:Oswald;font-weight:600;src:${fonte(600)}}@font-face{font-family:Oswald;font-weight:700;src:${fonte(700)}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C}
.pg{position:relative;overflow:hidden;background:#F4ECD6;padding:64px 60px}
.selo{display:inline-block;background:#FFC400;border:5px solid #0C0C0C;border-radius:22px;box-shadow:7px 7px 0 #0C0C0C;padding:10px 28px;font-weight:700;font-size:34px;letter-spacing:3px}
.data{font-weight:600;font-size:30px;color:rgba(12,12,12,.55);letter-spacing:2px;margin-top:22px}
h1{font-weight:700;text-transform:uppercase;line-height:.95;margin-top:10px}
.box{background:#fff;border:5px solid #0C0C0C;border-radius:30px;box-shadow:9px 9px 0 #0C0C0C}
.rod{position:absolute;left:60px;right:60px;bottom:52px;display:flex;justify-content:space-between;align-items:flex-end;border-top:6px solid #0C0C0C;padding-top:20px}
.rod b{font-weight:700;font-size:46px}.rod b i{font-style:normal;color:#C2452F}.rod span{font-weight:600;font-size:32px;color:rgba(12,12,12,.6)}
.nm{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tit{font-weight:700;color:#1B7A3D;flex:none}
`
const rodape = `<div class="rod"><b>LEILÃO <i>LEGENDS</i></b><span>leilaolegends.com</span></div>`
const cab = (selo, titulo, tam) => `<span class="selo">${selo}</span><div class="data">${esc(spec.periodo)}</div><h1 style="font-size:${tam}px">${titulo}</h1>`

// ── o clã: escudo grande + números + TODOS os membros (2 colunas, quem fez mais em cima) ──
const c = spec.cla
const membros = (cols, fs, pad) => {
  const porCol = Math.ceil(c.membros.length / cols)
  const col = i => c.membros.slice(i * porCol, (i + 1) * porCol).map(m => `
    <div style="display:flex;align-items:center;gap:12px;padding:${pad}px 18px;border-bottom:3px solid rgba(12,12,12,.1)">
      <span class="nm" style="flex:1;font-size:${fs}px">${m.lider ? '👑 ' : ''}${esc(m.nome)}</span>
      <span class="tit" style="font-size:${fs}px">${m.titulos}</span></div>`).join('')
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:0 20px">${Array.from({ length: cols }, (_, i) => `<div>${col(i)}</div>`).join('')}</div>`
}
const blocoCla = (esc1, nomeFs) => `
  <div style="display:flex;align-items:center;gap:34px">
    <img src="${url(c.escudo)}" style="height:${esc1}px;filter:drop-shadow(6px 6px 0 #0C0C0C)">
    <div>
      <div style="font-weight:700;font-size:${nomeFs}px;line-height:1;text-transform:uppercase">${esc(c.nome)}</div>
      <div style="font-weight:600;font-size:${Math.round(nomeFs * .36)}px;margin-top:10px">🏆 <b style="color:#1B7A3D">${c.titulos} títulos</b> na semana</div>
      <div style="font-weight:600;font-size:${Math.round(nomeFs * .3)}px;color:rgba(12,12,12,.6);margin-top:4px">👥 ${c.membros.length} técnicos · líder ${esc(c.lider)}</div>
    </div>
  </div>`

const storyCla = `<div class="pg" style="width:1080px;height:1920px">
  ${cab('⚔️ CLÃ DA SEMANA', 'O CLÃ<br>CAMPEÃO', 118)}
  <div class="box" style="margin-top:34px;padding:34px 36px">${blocoCla(240, 104)}</div>
  <div class="box" style="margin-top:30px;padding:16px 10px 10px">
    <div style="display:flex;justify-content:space-between;padding:0 18px 8px;font-weight:700;font-size:24px;letter-spacing:2px;color:rgba(12,12,12,.45)"><span>A TROPA</span><span>TÍTULOS</span></div>
    ${membros(2, 32, 12)}
  </div>
  ${rodape}</div>`

// ── o pódio individual: 3 degraus, medalha no nome por 30 dias ──
const MED = [['🥇', '#FFC400', '1º'], ['🥈', '#CBD4DE', '2º'], ['🥉', '#E0A06A', '3º']]
const marca = (p, h) => p.escudo
  ? `<img src="${url(p.escudo)}" style="height:${h}px;filter:drop-shadow(5px 5px 0 #0C0C0C)">`
  : `<span style="display:flex;width:${h}px;height:${h}px;border-radius:999px;border:5px solid #0C0C0C;background:#F4ECD6;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(h * .5)}px">${esc(p.nome[0].toUpperCase())}</span>`
const degrau = (p, i, esc1, fs) => `
  <div class="box" style="display:flex;align-items:center;gap:26px;padding:26px 30px;${i === 0 ? 'background:#FFF6D6' : ''}">
    <span style="flex:none;display:flex;flex-direction:column;align-items:center;width:${Math.round(fs * 1.7)}px">
      <span style="font-size:${Math.round(fs * 1.5)}px;line-height:1">${MED[i][0]}</span>
      <span style="font-weight:700;font-size:${Math.round(fs * .55)}px">${MED[i][2]}</span></span>
    ${marca(p, esc1)}
    <div style="flex:1;min-width:0">
      <div class="nm" style="font-weight:700;font-size:${fs}px;line-height:1.05;text-transform:uppercase">${esc(p.nome)}</div>
      <div style="font-weight:600;font-size:${Math.round(fs * .46)}px;margin-top:6px">🏆 <b style="color:#1B7A3D">${p.titulos} títulos</b> na semana</div>
    </div>
  </div>`
const podio = (esc1, fs, gap) => `<div style="display:flex;flex-direction:column;gap:${gap}px">${spec.podio.map((p, i) => degrau(p, i, esc1, fs)).join('')}</div>`
const storyRank = `<div class="pg" style="width:1080px;height:1920px">
  ${cab('🏅 RANKING DA SEMANA', 'OS MAIORES<br>CAMPEÕES', 118)}
  <div style="margin-top:50px">${podio(180, 70, 46)}</div>
  <div class="box" style="margin-top:36px;padding:28px 34px;background:#0C0C0C;color:#fff">
    <div style="font-weight:700;font-size:40px;color:#FFC400">🏅 MEDALHA NO NOME POR 30 DIAS</div>
    <div style="font-weight:500;font-size:30px;margin-top:8px;line-height:1.35">Quem fecha a semana no pódio leva a medalha grudada no nome — na sala, no chat e no ranking.</div>
  </div>
  ${rodape}</div>`

// ── o feed (4:5): o clã em cima, o pódio embaixo ──
const feed = `<div class="pg" style="width:1080px;height:1350px;padding:46px 50px">
  <div style="display:flex;justify-content:space-between;align-items:center"><span class="selo" style="font-size:28px">🏆 CAMPEÕES DA SEMANA</span><span class="data" style="margin:0;font-size:26px">${esc(spec.periodo)}</span></div>
  <div class="box" style="margin-top:24px;padding:22px 26px">
    <div style="font-weight:700;font-size:24px;letter-spacing:2px;color:rgba(12,12,12,.45);margin-bottom:10px">⚔️ CLÃ DA SEMANA</div>
    ${blocoCla(130, 64)}
    <div style="margin-top:14px;font-weight:500;font-size:19px;line-height:1.45;color:rgba(12,12,12,.75)">${c.membros.map(m => esc(m.nome)).join(' · ')}</div>
  </div>
  <div style="font-weight:700;font-size:24px;letter-spacing:2px;color:rgba(12,12,12,.45);margin:26px 0 12px">🏅 RANKING DA SEMANA · MEDALHA POR 30 DIAS</div>
  ${podio(110, 46, 26)}
  ${rodape.replace('bottom:52px', 'bottom:36px').replace('left:60px;right:60px', 'left:50px;right:50px')}</div>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ deviceScaleFactor: 2 })
for (const [html, w, h, saida] of [[storyCla, 1080, 1920, spec.saida.cla], [storyRank, 1080, 1920, spec.saida.ranking], [feed, 1080, 1350, spec.saida.feed]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  // nada pode passar por cima do rodapé (lista grande = fonte menor, não corte)
  const estoura = await page.evaluate(() => { const r = document.querySelector('.rod').getBoundingClientRect().top; return [...document.querySelectorAll('.box')].some(b => b.getBoundingClientRect().bottom > r - 8) })
  await page.screenshot({ path: saida, clip: { x: 0, y: 0, width: w, height: h } })
  console.log(saida, estoura ? '⚠️ passou do rodapé' : '✅')
}
await browser.close()
