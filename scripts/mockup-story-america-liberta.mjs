// 📱 STORIES DA COPA AMÉRICA + LIBERTADORES DAS SALAS (19/11, Diego: "arte padrão igual temos feito p eu lançar nos stories").
// Mesmo formato do story da Eurocopa (scripts/mockup-story-eurocopa.mjs): 1080×1920, creme · borda preta · sombra dura · Oswald,
// com os escudos DE VERDADE do jogo (img/nations-v25 e public/escudos-clubes) e as telas reais da Libertadores (scripts/mockups/liberta-story-*.png).
//   node scripts/mockup-story-america-liberta.mjs → scripts/posts/story-copa-america.png + scripts/posts/story-libertadores-sala.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/${f.endsWith('.webp') ? 'webp' : 'png'};base64,${readFileSync(f).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFE14D', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const BASE = `${FONTES}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${CREME};font-family:Oswald,sans-serif;color:${INK};padding:70px 56px;display:flex;flex-direction:column}
.sel{align-self:flex-start;font-weight:700;font-size:30px;letter-spacing:3px;padding:10px 24px;border:5px solid ${INK};border-radius:14px;box-shadow:7px 7px 0 ${INK}}
h1{font-size:108px;font-weight:700;text-transform:uppercase;line-height:.9;margin:26px 0 10px;letter-spacing:-2px}
.lead{font-size:34px;font-weight:500;line-height:1.3;color:#333}
.fmt{display:flex;gap:14px;justify-content:center;margin-bottom:24px}.fmt div{background:#fff;border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:14px 18px;text-align:center;font-weight:700;font-size:32px;line-height:1.1}.fmt span{display:block;font-size:22px;font-weight:500;color:#555}
.pe{margin-top:auto;text-align:center}.pe .l{font-size:52px;font-weight:700;text-transform:uppercase}.pe .l span{color:#C2452F}
.pe .s{display:inline-block;margin-top:14px;font-weight:700;font-size:34px;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:16px;padding:12px 36px;box-shadow:7px 7px 0 ${INK}}`
const PE = `<div class="pe"><div class="l">⚽ Leilão <span>Legends</span></div><div class="s">leilaolegends.com</div></div>`

// 🌎 COPA AMÉRICA — as 16 seleções com o escudo de verdade
const NACOES = ['brazil', 'argentina', 'uruguay', 'colombia', 'ecuador', 'paraguay', 'chile', 'peru', 'bolivia', 'venezuela', 'mexico', 'usa', 'canada', 'costa-rica', 'jamaica', 'panama']
const america = `<!doctype html><meta charset="utf-8"><style>${BASE}
.sel{background:#0f3d8c;color:${GOLD}} h1 b{color:#1f6fd1}
.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin:38px 0 34px;background:#fff;border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:30px 26px}
.grade div{height:150px;display:flex;align-items:center;justify-content:center}.grade img{max-width:140px;max-height:140px}
</style><body>
<div class="sel">🌎 NOVO NAS SALAS</div>
<h1>Liga +<br><b>Copa América</b></h1>
<div class="lead">Acabou a liga? Escolhe uma <b>seleção das Américas</b>, convoca os 11 e disputa a Copa América com a galera.</div>
<div class="grade">${NACOES.map(n => `<div><img src="${img(`src/escalacao/img/nations-v25/${n}.webp`)}"></div>`).join('')}</div>
<div class="fmt"><div>16<span>seleções</span></div><div>4 grupos<span>de 4</span></div><div>quartas<span>até a final</span></div><div>jogo único<span>empate = pênaltis</span></div></div>
${PE}</body>`

// 🏆 LIBERTADORES — escolhe o clube pela tabela e convoca as cartas DELE
const CLUBES = ['flamengo', 'palmeiras', 'river-plate', 'boca-juniors', 'penarol', 'nacional-uru', 'sao-paulo', 'santos', 'colo-colo', 'olimpia', 'independiente', 'gremio']
const liberta = `<!doctype html><meta charset="utf-8"><style>${BASE}
.sel{background:#0b3a28;color:${GOLD}} h1 b{color:#b8860b}
.telas{display:flex;gap:22px;margin:30px 0 22px;justify-content:center;align-items:flex-start}
.telas img{border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK}}
.telas .a{width:420px;height:760px;object-fit:cover;object-position:top}.telas .b{width:500px;height:760px;object-fit:cover;object-position:center top}
.esc{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-bottom:22px}.esc img{width:100%;height:66px;object-fit:contain}
</style><body>
<div class="sel">🏆 NOVO NAS SALAS</div>
<h1>Liga +<br><b>Libertadores</b></h1>
<div class="lead">Acabou a liga? Na <b>ordem da tabela</b>, cada um escolhe um <b>clube sul-americano de verdade</b> e convoca as cartas DELE.</div>
<div class="telas"><img class="a" src="${img('scripts/mockups/liberta-story-escolha.png')}"><img class="b" src="${img('scripts/mockups/liberta-story-campeao.png')}"></div>
<div class="esc">${CLUBES.map(c => `<img src="${img(`public/escudos-clubes/${c}.webp`)}">`).join('')}</div>
<div class="fmt"><div>32<span>clubes</span></div><div>8 grupos<span>ida e volta</span></div><div>mata-mata<span>ida e volta</span></div><div>final<span>jogo único</span></div></div>
${PE}</body>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html] of [['story-copa-america', america], ['story-libertadores-sala', liberta]]) {
  const tmp = `/tmp/${nome}-${process.pid}.html`; writeFileSync(tmp, html)
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700)
  await p.screenshot({ path: `scripts/posts/${nome}.png` }); await p.close(); console.log(`scripts/posts/${nome}.png`)
}
await b.close()
