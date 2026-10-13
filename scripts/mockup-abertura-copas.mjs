// 🎬 MOCKUP — ABERTURA DA RODADA NAS COPAS DAS SALAS ONLINE (13/10)
//
// Diego: *"o que fazer pra deixar a simulação dos jogos, as telas das copas quando começam os jogos,
// mais organizado… todas: Copa do Mundo, Champions, regionais, Libertadores, Copa dos 8"*.
// A ideia escolhida: antes de a bola rolar, 5 segundos de ABERTURA — os confrontos da rodada,
// escudo contra escudo, o seu em destaque — e o CAMINHO da copa no topo (em que fase está, até onde
// o seu time chegou). Mesma peça pra toda copa; só troca a arte/cor de cada uma.
//
//   node scripts/mockup-abertura-copas.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'

const esc = f => `<img src="${img(f)}" style="height:44px;max-width:44px;object-fit:contain">`
const flag = e => `<span style="font-size:36px;line-height:1">${e}</span>`

// cada copa: cor do palco, caminho (fases) e os confrontos da rodada (o 2º é o SEU)
const COPAS = [
  { nome: '🌐 COPA DO MUNDO', sub: 'Grupos · rodada 1 de 3', cor: 'linear-gradient(160deg,#0b2a4a,#071a30)', faixa: '#2F6FDB',
    fases: ['GRUPOS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL'], ativa: 0, meu: 0,
    jogos: [['🇧🇷', 'Brasil', '🇫🇷', 'França'], ['🇦🇷', 'Argentina', '🇩🇪', 'Alemanha', true], ['🇮🇹', 'Itália', '🇳🇱', 'Holanda'], ['🇪🇸', 'Espanha', '🇺🇾', 'Uruguai']], flags: true },
  { nome: '🌎 LIBERTADORES', sub: 'Oitavas de final · jogo único', cor: 'linear-gradient(160deg,#1a1033,#0c0a1c)', faixa: '#7C3AED',
    fases: ['GRUPOS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL'], ativa: 1, meu: 1,
    jogos: [['fabulous-escudo.webp', 'Fabulous EC', 'arrogantchi-escudo.webp', 'Arrogantchi FC'], ['k9-escudo.webp', 'K9 FC', 'gremio-escudo.webp', 'Grêmio FBPA', true], ['falad10-escudo.webp', 'Fala D10', 'julia-escudo.webp', 'Julia Barranquila'], ['madruga-escudo.webp', 'Real Madruga', 'bestia-escudo.webp', 'La Bestia Negra']] },
  { nome: '🏖️🏙️ RIO × SÃO PAULO', sub: 'Semifinal · jogo único', cor: 'linear-gradient(160deg,#3a1a0c,#1c0d06)', faixa: '#E8503A',
    fases: ['LADOS', 'QUARTAS', 'SEMI', 'FINAL'], ativa: 2, meu: 2,
    jogos: [['leao-estradinha-escudo.webp', 'Flamengo · Didico', 'guimaraes-escudo.webp', 'Santos · DOMCITY'], ['intervale-escudo.webp', 'Vasco · Neymarzetti', 'manfre-escudo.webp', 'Palmeiras · Las Mulas', true]] },
]

const caminho = c => `<div class="cam">${c.fases.map((f, i) => `<span class="${i < c.ativa ? 'ok' : i === c.ativa ? 'on' : ''}${i <= c.meu ? ' meu' : ''}">${i < c.ativa ? '✔ ' : ''}${f}</span>${i < c.fases.length - 1 ? '<i>›</i>' : ''}`).join('')}</div>`
const jogo = (c, j) => {
  const [a, an, b, bn, eu] = j
  const A = c.flags ? flag(a) : esc(a), B = c.flags ? flag(b) : esc(b)
  return `<div class="jg ${eu ? 'eu' : ''}">${eu ? '<div class="tag">⭐ SEU JOGO</div>' : ''}<div class="t">${A}<b>${an}</b></div><div class="x">×</div><div class="t r"><b>${bn}</b>${B}</div></div>`
}
const tela = c => `<div class="ph"><div class="palco" style="background:${c.cor}">
  <div class="k">${c.nome}</div><div class="s">${c.sub}</div>
  ${caminho(c)}
  <div class="tit">CONFRONTOS DA RODADA</div>
  ${c.jogos.map(j => jogo(c, j)).join('')}
  <div class="bar"><i style="width:62%;background:${c.faixa}"></i></div>
  <div class="bola">⚽ A BOLA ROLA EM <b>3s</b></div>
</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:${INK};width:1320px;padding:40px 44px}
h1{font:700 48px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 21px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:28px;margin-top:26px}.col{flex:1}
.lab{font:700 22px Oswald;text-transform:uppercase;text-align:center;margin-bottom:12px;color:rgba(0,0,0,.6)}
.ph{width:380px;height:700px;margin:0 auto;border:5px solid #000;border-radius:42px;box-shadow:8px 8px 0 #000;overflow:hidden;background:#0C0C0C}
.palco{height:100%;color:#fff;padding:22px 16px;display:flex;flex-direction:column}
.k{font:700 13px Oswald;letter-spacing:.18em;color:${GOLD}}.s{font:700 22px Oswald;text-transform:uppercase;margin-top:2px}
.cam{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:12px 0 16px;font:700 10px Oswald;letter-spacing:.06em}
.cam span{border:1.5px solid rgba(255,255,255,.35);border-radius:6px;padding:2px 6px;color:rgba(255,255,255,.55)}
.cam span.ok{color:#fff;border-color:rgba(255,255,255,.6)}.cam span.on{background:${GOLD};color:#000;border-color:#000;box-shadow:2px 2px 0 #000}
.cam span.meu{border-style:solid}.cam i{font-style:normal;color:rgba(255,255,255,.4)}
.tit{font:700 12px Oswald;letter-spacing:.16em;color:rgba(255,255,255,.6);margin-bottom:8px}
.jg{position:relative;display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);border-radius:14px;padding:10px 10px;margin-bottom:8px}
.jg.eu{background:#F4ECD6;color:#0C0C0C;border:3px solid #000;box-shadow:4px 4px 0 ${GOLD};padding-top:16px}
.jg .tag{position:absolute;top:-10px;left:10px;background:${GOLD};color:#000;border:2px solid #000;border-radius:7px;font:700 10px Oswald;letter-spacing:.1em;padding:1px 7px}
.t{flex:1;display:flex;align-items:center;gap:8px;min-width:0}.t.r{justify-content:flex-end;text-align:right}
.t b{font:700 14px/1.1 Oswald;text-transform:uppercase}
.x{font:700 20px Oswald;color:${GOLD};padding:0 2px}.jg.eu .x{color:${RED}}
.bar{margin-top:auto;height:10px;border:2px solid rgba(255,255,255,.5);border-radius:6px;overflow:hidden}.bar i{display:block;height:100%}
.bola{text-align:center;font:700 16px Oswald;letter-spacing:.08em;margin-top:8px}.bola b{color:${GOLD}}
.leg{margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 16px}
.lg b{font:700 22px Oswald;text-transform:uppercase;display:block;margin-bottom:4px}.lg span{font-size:16px;line-height:1.35;font-weight:500}
.nota{margin-top:20px;background:${GREEN};color:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 20px;font:700 21px/1.3 Oswald}
</style></head><body>
<h1>🎬 Abertura da rodada <span>— todas as copas</span></h1>
<div class="sub">5 segundos antes de a bola rolar, em toda copa das salas online: Copa do Mundo, Libertadores, Champions, Copa dos 8 e regionais.</div>
<div class="cols">
  ${COPAS.map(c => `<div class="col"><div class="lab">${c.nome}</div>${tela(c)}</div>`).join('')}
</div>
<div class="leg">
  <div class="lg"><b>Caminho da copa</b><span>A faixa de cima mostra a fase de agora e as que já passaram. O seu time fica marcado até onde chegou.</span></div>
  <div class="lg"><b>Confrontos da rodada</b><span>Escudo contra escudo, o seu jogo em destaque. Na Copa do Mundo, bandeira; nas outras, o escudo do clube.</span></div>
  <div class="lg"><b>A bola rola sozinha</b><span>Contagem de 5s e o placar grande abre como sempre. Nenhum toque a mais, nenhum passo novo.</span></div>
</div>
<div class="nota">Mesma peça em todas as copas, só muda a cor e a arte de cada uma. Não mexe em regra, relógio nem resultado — é só a abertura.</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 1250 } })
const tmp = resolve(tmpdir(), `abertura-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/abertura-copas.png', fullPage: true }); await b.close()
console.log('🎬 scripts/mockups/abertura-copas.png')
