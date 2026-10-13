// 🏆 MOCKUP — AS 3 PRÓXIMAS DAS COPAS DO ONLINE (13/10): chaveamento desenhado · resumo da fase · artilheiro no fim
//
// Diego: *"manda os mockups!"* (depois da abertura da rodada). Hoje o chaveamento das copas do online é uma
// LISTA ("quem pega quem", `ll26-draw-row`) antes de começar + os resultados de cada fase escondidos num
// "ver resultados" (`ll26-bracket-history`). Não existe a CHAVE desenhada (árvore com escudos).
//
//   node scripts/mockup-copas-proximos.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6', ROXO = '#7C3AED'
const esc = (f, s = 18) => `<img src="${img(f)}" style="height:${s}px;width:${s}px;object-fit:contain;flex:none">`

// 16 da Liberta (8 confrontos nas oitavas)
const T = {
  fab: ['fabulous-escudo.webp', 'Fabulous'], arr: ['arrogantchi-escudo.webp', 'Arrogantchi'], k9: ['k9-escudo.webp', 'K9 FC'], gre: ['gremio-escudo.webp', 'Grêmio FBPA'],
  fal: ['falad10-escudo.webp', 'Fala D10'], jul: ['julia-escudo.webp', 'Julia B.'], mad: ['madruga-escudo.webp', 'R. Madruga'], bes: ['bestia-escudo.webp', 'La Bestia'],
  lei: ['leitedeverdade-escudo.webp', 'Leite de V.'], gui: ['guimaraes-escudo.webp', 'Guimarães'], bri: ['brigadegalo-escudo.webp', 'Briga de Galo'], alt: ['al-takahdao-escudo.webp', 'Al Takhadao'],
  men: ['leao-estradinha-escudo.webp', 'Leão Estr.'], pap: ['intervale-escudo.webp', 'Inter Vale'], mar: ['marolados-escudo.webp', 'Marolados'], man: ['manfre-escudo.webp', 'Manfré'],
}
// chave: [a, b, ga, gb, vencedor, meu?]
const O = [['fab', 'arr', 2, 1, 'fab'], ['k9', 'gre', 1, 1, 'k9', true], ['fal', 'jul', 0, 2, 'jul'], ['mad', 'bes', 3, 0, 'mad'], ['lei', 'gui', 1, 0, 'lei'], ['bri', 'alt', 2, 2, 'alt'], ['men', 'pap', 1, 3, 'pap'], ['mar', 'man', 0, 1, 'man']]
const Q = [['fab', 'k9', 0, 1, 'k9', true], ['jul', 'mad', 2, 1, 'jul'], ['lei', 'alt', 1, 0, 'lei'], ['pap', 'man', 2, 0, 'pap']]
const S = [['k9', 'jul', null, null, null, true], ['lei', 'pap', null, null, null]]
const F = [[null, null, null, null, null]]

const tie = (t, pend = false) => {
  const [a, b, ga, gb, w, meu] = t
  const row = (k, g, win) => k ? `<div class="r ${win ? 'w' : ''} ${w && !win ? 'l' : ''}">${esc(T[k][0])}<span>${T[k][1]}</span><b>${g ?? ''}</b></div>` : `<div class="r v"><i></i><span>?</span><b></b></div>`
  return `<div class="tie ${meu ? 'meu' : ''} ${pend ? 'pend' : ''}">${row(a, ga, w === a)}${row(b, gb, w === b)}${t[7] ? '' : ''}</div>`
}
const col = (titulo, ties, estado) => `<div class="col ${estado}"><div class="ch">${titulo}</div><div class="ties">${ties.map(t => tie(t, estado === 'fut')).join('')}</div></div>`
const chave = `<div class="brk">${col('OITAVAS', O, 'ok')}${col('QUARTAS', Q, 'ok')}${col('SEMI', S, 'on')}${col('FINAL', F, 'fut')}</div>`

const resumo = `
  <div class="res"><div class="rt">✅ PASSARAM PRAS QUARTAS</div>
    <div class="grid">${['fab', 'k9', 'jul', 'mad', 'lei', 'alt', 'pap', 'man'].map(k => `<div class="chip ${k === 'k9' ? 'meu' : ''}">${esc(T[k][0], 22)}<span>${T[k][1]}</span></div>`).join('')}</div>
    <div class="rt x">❌ CAÍRAM NAS OITAVAS</div>
    <div class="grid">${['arr', 'gre', 'fal', 'bes', 'gui', 'bri', 'men', 'mar'].map(k => `<div class="chip out">${esc(T[k][0], 22)}<span>${T[k][1]}</span></div>`).join('')}</div>
    <div class="bar"><i style="width:55%;background:${ROXO}"></i></div><div class="bola">⏭ QUARTAS DE FINAL EM <b>3s</b></div>
  </div>`

const fim = `
  <div class="campeao"><div class="k">🏆 CAMPEÃO DA LIBERTADORES</div>${esc('k9-escudo.webp', 64)}<div class="n">K9 FC</div><div class="s">de Kelvin · venceu o Leite de Verdade FC na final por 2 × 1</div></div>
  <div class="art"><div class="k">👟 ARTILHEIRO DA COPA</div><div class="al"><div class="bola2">⚽</div><div><b>Romário</b><span>K9 FC · Vasco 1997</span></div><div class="g">7<small>gols</small></div></div>
    <div class="al sec"><span>2º Luis Suárez · Leite de Verdade · 5</span><span>3º Reus · Inter Vale · 4</span></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:${CREME};font-family:Inter,Arial,sans-serif;color:${INK};width:1320px;padding:40px 44px}
h1{font:700 46px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 20px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:28px;margin-top:24px}.col3{flex:1}
.lab{font:700 24px Oswald;text-transform:uppercase;text-align:center;margin-bottom:12px}.lab b{display:inline-grid;place-items:center;width:36px;height:36px;border:3px solid #000;border-radius:11px;background:${GOLD};box-shadow:3px 3px 0 #000;margin-right:8px}
.ph{width:380px;height:700px;margin:0 auto;border:5px solid #000;border-radius:42px;box-shadow:8px 8px 0 #000;overflow:hidden;background:#0C0C0C;padding:14px 12px;color:#fff}
.stage{border:3px solid #000;border-radius:16px;box-shadow:4px 5px 0 #000;background:linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,.2)),url(${img('online-liberta-v25.webp')});background-size:cover;background-position:center;padding:30px 14px 10px;margin-bottom:10px}
.stage small{font:700 11px Oswald;color:${GOLD};letter-spacing:.12em;display:block}.stage h2{font:700 22px Oswald;margin:2px 0 0;text-transform:uppercase}
/* chave */
.brk{display:flex;gap:4px;background:#161616;border:2px solid #333;border-radius:14px;padding:8px 6px}
.col{flex:1;min-width:0;display:flex;flex-direction:column}.col.ok{opacity:.9}.ch{font:700 9px Oswald;letter-spacing:.12em;color:rgba(255,255,255,.55);text-align:center;margin-bottom:6px}
.col.on .ch{color:${GOLD}}
.ties{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:4px}
.tie{background:#fff;color:${INK};border:1.5px solid #000;border-radius:7px;overflow:hidden}
.tie.meu{outline:2.5px solid ${GOLD};outline-offset:1px}.tie.pend{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff}
.r{display:flex;align-items:center;gap:3px;padding:2px 3px;font:700 8.5px Oswald;line-height:1}.r+.r{border-top:1px solid rgba(0,0,0,.12)}
.r span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:uppercase}.r b{width:9px;text-align:right}
.r.w{background:#D8F0DE}.r.l{opacity:.45}.r.v i{width:18px;height:18px;border-radius:99px;border:1.5px dashed rgba(255,255,255,.5);flex:none}
.leg2{font-size:10px;font-weight:700;color:rgba(255,255,255,.6);margin-top:8px;line-height:1.4}
/* resumo */
.res{background:linear-gradient(160deg,#1a1033,#0c0a1c);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 ${GOLD};padding:12px 10px}
.rt{font:700 12px Oswald;letter-spacing:.12em;color:#6fd08f;margin:0 0 6px}.rt.x{color:#f08a7a;margin-top:10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.chip{display:flex;align-items:center;gap:6px;background:#F4ECD6;color:${INK};border:2px solid #000;border-radius:9px;padding:4px 6px;font:700 11px Oswald;text-transform:uppercase}
.chip.meu{outline:2.5px solid ${GOLD};outline-offset:1px}.chip.out{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.25);filter:grayscale(.6)}
.bar{height:8px;border:2px solid rgba(255,255,255,.5);border-radius:6px;overflow:hidden;margin-top:12px}.bar i{display:block;height:100%}
.bola{text-align:center;font:700 14px Oswald;letter-spacing:.08em;margin-top:6px}.bola b{color:${GOLD}}
/* fim */
.campeao{background:linear-gradient(160deg,#FFE79A,${GOLD} 40%,#E8A200 70%,#FFDD70);color:${INK};border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px;text-align:center}
.campeao .k{font:700 11px Oswald;letter-spacing:.16em}.campeao img{margin:8px auto 4px;display:block}.campeao .n{font:700 30px Oswald;text-transform:uppercase;line-height:1}.campeao .s{font-size:11.5px;font-weight:700;margin-top:4px}
.art{background:#fff;color:${INK};border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:12px 14px;margin-top:10px}
.art .k{font:700 11px Oswald;letter-spacing:.16em;color:rgba(0,0,0,.55)}
.al{display:flex;align-items:center;gap:10px;margin-top:8px}.al b{font:700 20px Oswald;display:block;line-height:1}.al span{font-size:11px;font-weight:700;color:rgba(0,0,0,.6)}
.bola2{font-size:30px}.g{margin-left:auto;font:700 34px Oswald;color:${GREEN};line-height:1;text-align:center}.g small{display:block;font-size:10px;letter-spacing:.1em;color:rgba(0,0,0,.5)}
.al.sec{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border-top:1px dashed rgba(0,0,0,.2);padding-top:8px;margin-top:10px}
.leg{margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 16px}.lg b{font:700 22px Oswald;text-transform:uppercase;display:block;margin-bottom:4px}.lg span{font-size:15.5px;line-height:1.35;font-weight:500}
.lg em{display:block;font-style:normal;font-size:13px;color:rgba(0,0,0,.55);margin-top:6px}
</style></head><body>
<h1>🏆 Copas do online: <span>as 3 próximas</span></h1>
<div class="sub">Sala rápida e Minhas Ligas · exemplo com a Libertadores; vale pra Copa dos 8, Champions, Copa do Mundo e regionais.</div>
<div class="cols">
  <div class="col3"><div class="lab"><b>1</b>Chaveamento</div><div class="ph"><div class="stage"><small>LIBERTADORES</small><h2>Semifinal</h2></div>${chave}<p class="leg2">A chave inteira numa olhada: quem já caiu apagado, quem passou em verde, o seu caminho com a borda dourada, e o que ainda vem pontilhado.</p></div></div>
  <div class="col3"><div class="lab"><b>2</b>Resumo da fase</div><div class="ph"><div class="stage"><small>LIBERTADORES</small><h2>Oitavas encerradas</h2></div>${resumo}</div></div>
  <div class="col3"><div class="lab"><b>3</b>Fim da copa</div><div class="ph"><div class="stage"><small>LIBERTADORES</small><h2>Campeão definido</h2></div>${fim}</div></div>
</div>
<div class="leg">
  <div class="lg"><b>1 · Chaveamento desenhado</b><span>Aparece do mata-mata em diante, logo abaixo do palco. Toque num confronto já jogado abre o placar e os pênaltis.</span><em>Hoje: lista "quem pega quem" antes de começar + resultados escondidos num "ver resultados" por fase.</em></div>
  <div class="lg"><b>2 · Resumo da fase</b><span>Quando a fase acaba: 5s com quem passou (✅) e quem caiu (❌), e aí entra a abertura da próxima fase.</span><em>Hoje: a fase vira direto e a pessoa procura na lista quem avançou.</em></div>
  <div class="lg"><b>3 · Artilheiro no fim</b><span>Junto do campeão, o artilheiro da copa com gols, clube e carta, e o 2º e 3º. Igual já existe na liga.</span><em>Hoje: no fim da copa aparece só o campeão.</em></div>
</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 1200 } })
const tmp = resolve(tmpdir(), `prox-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/copas-proximos.png', fullPage: true }); await b.close()
console.log('🏆 scripts/mockups/copas-proximos.png')
