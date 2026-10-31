// 📱 STORY DOS 3 MODOS NOVOS DE LEILÃO (31/10, Diego: "post no Instagram dos 3 modos novos"). 1080×1920, cara do jogo,
// os 3 numerados, cada um com um LOTE DE VERDADE do baralho (cartas conferidas no data.ts).
//   node scripts/mockup-story-selecoes-decada.mjs   → scripts/posts/story-selecoes-decada.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6', RED = '#C2452F', ROXO = '#7C3AED'
const MODOS = [
  { n: 1, cor: GREEN, tit: '🏳️ Seleções', sub: 'todas as épocas', lote: 'Atacantes da Argentina', cartas: [['Batistuta', 'Fiorentina 1998'], ['Crespo', 'Inter 2003'], ['Agüero', 'Man City 2015']] },
  { n: 2, cor: RED, tit: '🧱 Clubes', sub: '🕰️ por década', lote: 'Meias do Milan · anos 90', cartas: [['Boban', '1998'], ['Savićević', '1994'], ['Albertini', '1994'], ['Leonardo', '1999']] },
  { n: 3, cor: ROXO, tit: '🏳️ Seleções', sub: '🕰️ por década', lote: 'Atacantes do Brasil · anos 90', cartas: [['Romário', 'Barcelona 1994'], ['Ronaldo Fenômeno', 'Inter 1998'], ['Edmundo', 'Vasco 1997']] },
]
const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${CREME};font-family:Oswald,sans-serif;color:${INK};padding:64px 56px;display:flex;flex-direction:column}
.sel{align-self:flex-start;background:${INK};color:${GOLD};font-weight:700;font-size:30px;letter-spacing:3px;padding:10px 24px;border-radius:14px;box-shadow:7px 7px 0 ${GOLD}}
h1{font-size:96px;font-weight:700;text-transform:uppercase;line-height:.92;margin:24px 0 8px;letter-spacing:-2px}h1 b{color:${RED}}
.lead{font-size:31px;font-weight:500;line-height:1.3;color:#333;margin-bottom:26px}
.m{display:flex;gap:20px;background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:20px 22px;margin-bottom:26px}
.num{flex:0 0 86px;height:86px;border-radius:50%;border:5px solid ${INK};display:grid;place-items:center;font-size:52px;font-weight:700;color:#fff}
.c{flex:1;min-width:0}.t{font-size:46px;font-weight:700;text-transform:uppercase;line-height:1}.t span{font-size:30px;font-weight:500;color:#555;text-transform:none;margin-left:8px}
.teste{display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;letter-spacing:1px;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:8px;padding:2px 10px}
.lote{margin-top:12px;background:${CREME};border:4px solid ${INK};border-radius:16px;padding:10px 16px}
.lote .k{font-size:20px;font-weight:500;color:#6b6250;text-transform:uppercase;letter-spacing:1px}.lote .nm{font-size:34px;font-weight:700;text-transform:uppercase;line-height:1.05}
.pl{display:flex;justify-content:space-between;font-size:25px;font-weight:500;border-top:3px dashed #0002;padding:4px 0}.pl b{font-weight:700}
.pe{margin-top:auto;text-align:center}.pe .x{font-size:28px;font-weight:500;color:#333;margin-bottom:12px}.pe .l{font-size:50px;font-weight:700;text-transform:uppercase}.pe .l span{color:${RED}}
.pe .s{display:inline-block;margin-top:12px;font-weight:700;font-size:34px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:16px;padding:12px 36px;box-shadow:7px 7px 0 ${INK}}
</style><body>
<div class="sel">🔨 NOVO NAS SALAS</div>
<h1>3 leilões<br><b>novos</b></h1>
<div class="lead">Em vez de um jogador, cada lote é um <b>pacote</b>. Você leva, e no fim convoca quem joga.</div>
${MODOS.map(m => `<div class="m"><div class="num" style="background:${m.cor}">${m.n}</div><div class="c">
<div class="t">${m.tit}<span>${m.sub}</span><i class="teste" style="font-style:normal">EM TESTE</i></div>
<div class="lote"><div class="k">exemplo de lote</div><div class="nm">${m.lote}</div>
${m.cartas.map(([a, b]) => `<div class="pl"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div></div>`).join('')}
<div class="pe"><div class="x">Envelope, Tocaia ou Pregão aberto · salas de até 36</div><div class="l">⚽ Leilão <span>Legends</span></div><div class="s">leilaolegends.com</div></div>
</body>`
const tmp = `/tmp/story-sel-${process.pid}.html`; writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/posts/story-selecoes-decada.png' }); await b.close(); console.log('scripts/posts/story-selecoes-decada.png')
