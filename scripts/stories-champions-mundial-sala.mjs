// 📱 STORIES DA ⭐ LIGA + CHAMPIONS (convocando) e do 🌍 SUPER MUNDIAL (dois modos) — 26/11, pedido do Diego.
// Mesmo formato dos stories da Eurocopa / Copa América / Libertadores (scripts/mockup-story-america-liberta.mjs): 1080×1920,
// creme · borda preta · sombra dura · Oswald, com os escudos DE VERDADE do jogo (public/escudos-clubes) e telas reais da bancada
// (scripts/mockups/champions-sala/story-*.png e scripts/mockups/super-mundial/story-*.png).
//   node scripts/stories-champions-mundial-sala.mjs → scripts/posts/story-champions-sala.png + scripts/posts/story-super-mundial.png
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/${f.endsWith('.webp') ? 'webp' : 'png'};base64,${readFileSync(f).toString('base64')}`
const esc = c => { const f = `public/escudos-clubes/${c}.webp`; if (!existsSync(f)) throw new Error('sem escudo: ' + c); return img(f) }
const INK = '#0C0C0C', GOLD = '#FFE14D', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const BASE = `${FONTES}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${CREME};font-family:Oswald,sans-serif;color:${INK};padding:70px 56px;display:flex;flex-direction:column}
.sel{align-self:flex-start;font-weight:700;font-size:30px;letter-spacing:3px;padding:10px 24px;border:5px solid ${INK};border-radius:14px;box-shadow:7px 7px 0 ${INK}}
h1{font-size:108px;font-weight:700;text-transform:uppercase;line-height:.9;margin:26px 0 10px;letter-spacing:-2px}
.lead{font-size:34px;font-weight:500;line-height:1.3;color:#333}
.fmt{display:flex;gap:14px;justify-content:center;margin-bottom:24px}.fmt div{background:#fff;border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:14px 18px;text-align:center;font-weight:700;font-size:32px;line-height:1.1}.fmt span{display:block;font-size:22px;font-weight:500;color:#555}
.telas{display:flex;gap:22px;margin:30px 0 22px;justify-content:center;align-items:flex-start}
.tela{border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};overflow:hidden;height:900px;background:#fff}
.tela img{display:block;width:100%}
.esc{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin:10px 0 30px}.esc img{width:100%;height:66px;object-fit:contain}
.pe{margin-top:auto;text-align:center}.pe .l{font-size:52px;font-weight:700;text-transform:uppercase}.pe .l span{color:#C2452F}
.pe .s{display:inline-block;margin-top:14px;font-weight:700;font-size:34px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:16px;padding:12px 36px;box-shadow:7px 7px 0 ${INK}}`
const PE = `<div class="pe"><div class="l">⚽ Leilão <span>Legends</span></div><div class="s">leilaolegends.com</div></div>`

// ⭐ LIGA + CHAMPIONS — escolhe o clube pela tabela e convoca as cartas DELE; fase de liga de 36
const CH = ['real-madrid', 'barcelona', 'liverpool', 'bayern', 'psg', 'inter', 'arsenal', 'atalanta', 'athletic-bilbao', 'brugge', 'bodo-glimt', 'qarabag']
const RESOLVE = { 'real-madrid': 'real-madrid', 'barcelona': 'barcelona', 'liverpool': 'liverpool', 'bayern': 'bayern', 'psg': 'psg', 'inter': 'inter', 'arsenal': 'arsenal' }
const champions = `<!doctype html><meta charset="utf-8"><style>${BASE}
.sel{background:#0A1640;color:#fff} h1 b{color:#1F3A93}
.tela.a{width:430px;height:800px}.tela.b{width:490px;height:800px}.tela.b img{margin-top:-64px}
</style><body>
<div class="sel">⭐ NOVO NAS SALAS</div>
<h1>Liga +<br><b>Champions</b></h1>
<div class="lead">Acabou a liga? Na <b>ordem da tabela</b>, cada um escolhe um <b>clube da Champions 2025–26</b> e convoca as cartas DELE.</div>
<div class="telas"><div class="tela a"><img src="${img('scripts/mockups/champions-sala/story-grade.png')}"></div><div class="tela b"><img src="${img('scripts/mockups/champions-sala/story-tabela.png')}"></div></div>
<div class="esc">${CH.map(c => `<img src="${esc(RESOLVE[c] ?? c)}">`).join('')}</div>
<div class="fmt"><div>36<span>clubes</span></div><div>fase de liga<span>8 jogos</span></div><div>playoff<span>9º ao 24º</span></div><div>final<span>jogo único</span></div></div>
${PE}</body>`

// 🌍 SUPER MUNDIAL — os dois modos lado a lado
const MU = ['chelsea', 'real-madrid', 'flamengo', 'palmeiras', 'psg', 'al-hilal', 'inter-miami', 'boca-juniors', 'urawa-reds', 'wydad', 'monterrey', 'auckland-city']
const mundial = `<!doctype html><meta charset="utf-8"><style>${BASE}
.sel{background:#111;color:#FFC400} h1 b{color:#B8860B}
.topo{display:flex;align-items:flex-start;gap:20px}.topo .t{flex:1}.topo img{width:270px;margin-top:10px;filter:drop-shadow(6px 6px 0 rgba(0,0,0,.25))}
.modos{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:26px 0 22px}
.modo{background:#fff;border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};overflow:hidden}
.modo h2{font-size:38px;font-weight:700;text-transform:uppercase;padding:14px 20px 4px;line-height:1}
.modo p{font-size:24px;font-weight:500;color:#333;padding:0 20px 14px;line-height:1.25}
.modo .cab{font-size:22px;font-weight:700;letter-spacing:2px;padding:8px 20px;color:#fff}
.modo .ft{height:590px;overflow:hidden;border-top:5px solid ${INK}}.modo .ft img{display:block;width:100%}.modo .ft.g img{margin-top:-64px}
</style><body>
<div class="sel">🌍 NOVO NAS SALAS</div>
<div class="topo"><div class="t"><h1>Super<br><b>Mundial</b></h1>
<div class="lead">O Mundial de Clubes de <b>2025</b> nas salas, no formato real. E com <b>dois jeitos</b> de jogar:</div></div>
${existsSync('scripts/mockups/super-mundial/trofeu-grande.png') ? `<img src="${img('scripts/mockups/super-mundial/trofeu-grande.png')}">` : ''}</div>
<div class="modos">
 <div class="modo"><div class="cab" style="background:${GREEN}">📋 CONVOCANDO</div><h2>Liga + Super Mundial</h2><p>Acabou a liga, cada um escolhe um <b>clube do Mundial</b> e convoca as cartas dele.</p><div class="ft"><img src="${img('scripts/mockups/super-mundial/story-grade.png')}"></div></div>
 <div class="modo"><div class="cab" style="background:#C2452F">⚽ COM O SEU TIME</div><h2>Só Super Mundial</h2><p>Sem liga: o <b>seu time do leilão</b> encara Real, Chelsea, Flamengo…</p><div class="ft g"><img src="${img('scripts/mockups/super-mundial/story-grupos.png')}"></div></div>
</div>
<div class="esc">${MU.map(c => `<img src="${esc(c)}">`).join('')}</div>
<div class="fmt"><div>32<span>clubes</span></div><div>8 grupos<span>turno único</span></div><div>oitavas<span>chave de 2025</span></div><div>tudo<span>jogo único</span></div></div>
${PE}</body>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html] of [['story-champions-sala', champions], ['story-super-mundial', mundial]]) {
  const tmp = `/tmp/${nome}-${process.pid}.html`; writeFileSync(tmp, html)
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700)
  await p.screenshot({ path: `scripts/posts/${nome}.png` }); await p.close(); console.log(`scripts/posts/${nome}.png`)
}
await b.close()
