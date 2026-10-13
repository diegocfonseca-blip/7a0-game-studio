// 🎬 MOCKUP — ABERTURA DA RODADA NAS COPAS DO ONLINE: HOJE × COMO FICARIA (13/10)
//
// Diego: *"tô falando do online, tá? que aparece pra todas na sala rápida e Minhas Ligas. Faça outro
// mockup com antes como está hoje e como ficaria"*.
// HOJE (screens.tsx, Copa dos 8 / Liberta / Champions do online): palco da copa → caixa roxa com o
// TEXTÃO da fase ("Sobraram 16 clubes… A partida começa em 12s") → controle da partida → placar grande
// → "Todos os jogos da fase". A pessoa lê um parágrafo e não vê QUEM joga contra QUEM até o placar abrir.
// DEPOIS: a MESMA tela, só trocando o textão pela ABERTURA — caminho da copa + confrontos escudo×escudo
// (o seu em destaque) + contagem. O resto (controle, placar, jogos) fica exatamente onde está.
//
//   node scripts/mockup-abertura-copas-antes-depois.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6', ROXO = '#7C3AED'
const esc = (f, s = 30) => `<img src="${img(f)}" style="height:${s}px;max-width:${s}px;object-fit:contain">`

const JOGOS = [
  ['fabulous-escudo.webp', 'Fabulous EC', 'arrogantchi-escudo.webp', 'Arrogantchi FC'],
  ['k9-escudo.webp', 'K9 FC', 'gremio-escudo.webp', 'Grêmio FBPA', true],
  ['falad10-escudo.webp', 'Fala D10', 'julia-escudo.webp', 'Julia Barranquila'],
  ['madruga-escudo.webp', 'Real Madruga', 'bestia-escudo.webp', 'La Bestia Negra'],
]

// ── peças que são IGUAIS nas duas telas (copiadas do jogo) ──
const palco = `<section class="stage"><div class="copy"><small>LIBERTADORES</small><h2>Oitavas de Final</h2><p>Jogo de ida · 8 confrontos na fase</p></div><div class="status"><span></span>Começa em 12s</div></section>`
const controle = `<div class="ctl"><div class="ct">🎮 CONTROLE DA PARTIDA</div><div class="cb"><div class="on">⚡ Auto</div><div>⏸️ Manual</div><div>⏩ 2×</div></div></div>`
const placar = `<div class="pl"><div class="ph2">⭐ SEU JOGO · IDA</div><div class="pd"><div class="pt">${esc('k9-escudo.webp', 40)}<b>K9 FC</b></div><div class="ps">0 <i>×</i> 0</div><div class="pt r"><b>Grêmio FBPA</b>${esc('gremio-escudo.webp', 40)}</div></div><div class="pm">⏱ 0′ · aguardando a bola rolar</div></div>`
const jogos = `<div class="tj">TODOS OS JOGOS DA FASE</div>` + JOGOS.slice(0, 2).map(([a, an, b, bn, eu]) => `<article class="fx ${eu ? 'mine' : ''}"><header><span>${eu ? 'SEU JOGO' : 'JOGO DA RODADA'}</span><b>0′</b></header><div class="duel"><div>${esc(a, 22)}<span>${an}</span></div><strong>0<i>×</i>0</strong><div>${esc(b, 22)}<span>${bn}</span></div></div></article>`).join('')

// ── o que MUDA ──
const hoje = `<div class="box"><p class="t">🌎 Chegou a LIBERTADORES!</p><p>Sobraram <b>16 clubes</b> — os 2 primeiros de cada grupo. Daqui pra frente é ida e volta, e quem perder <b>vai pra casa</b>. A final é <b>jogo único</b>. Quem levantar a taça ganha <b>outra carta</b>.</p><p class="c">⚽ A partida começa em 12s</p></div>`
const depois = `<div class="ab">
  <div class="cam"><span class="ok">✔ GRUPOS</span><i>›</i><span class="on">OITAVAS</span><i>›</i><span>QUARTAS</span><i>›</i><span>SEMI</span><i>›</i><span>FINAL</span></div>
  <div class="tit">CONFRONTOS DA RODADA</div>
  ${JOGOS.map(([a, an, b, bn, eu]) => `<div class="jg ${eu ? 'eu' : ''}">${eu ? '<div class="tag">⭐ SEU JOGO</div>' : ''}<div class="t">${esc(a, 34)}<b>${an}</b></div><div class="x">×</div><div class="t r"><b>${bn}</b>${esc(b, 34)}</div></div>`).join('')}
  <div class="mais">+ 4 confrontos ↓</div>
  <div class="bar"><i></i></div><div class="bola">⚽ A BOLA ROLA EM <b>5s</b></div>
</div>`

const tela = (meio) => `<div class="phone"><div class="scroll">${palco}${meio}${controle}${placar}${jogos}</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:${CREME};font-family:Inter,Arial,sans-serif;color:${INK};width:1100px;padding:40px 44px}
h1{font:700 46px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 20px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:40px;margin-top:24px;justify-content:center}.col{width:420px}
.lab{font:700 28px Oswald;text-transform:uppercase;text-align:center;margin-bottom:12px}.lab.n{color:${GREEN}}
.phone{width:400px;height:860px;margin:0 auto;border:5px solid #000;border-radius:42px;box-shadow:8px 8px 0 #000;overflow:hidden;background:#101010}
.scroll{padding:14px 12px;display:flex;flex-direction:column;gap:10px}
.stage{border:3px solid #0c0c0c;border-radius:18px;overflow:hidden;box-shadow:4px 5px 0 #0c0c0c;background:linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,.12)),url(${img('online-liberta-v25.webp')});background-size:cover;background-position:center;color:#f4ecd6;min-height:150px;display:flex;flex-direction:column;justify-content:flex-end}
.copy{padding:40px 16px 10px;text-shadow:0 2px 6px #000}.copy small{font:700 11px Oswald;color:#ffc400;letter-spacing:.12em;display:block}.copy h2{font:700 24px Oswald;margin:2px 0 0;text-transform:uppercase}.copy p{font-size:11px;margin:4px 0 0;opacity:.9}
.status{background:#0c0c0cbf;padding:9px 14px;font:700 11px Oswald;border-top:1px solid #f4ecd644;display:flex;align-items:center;gap:8px}.status span{width:8px;height:8px;border-radius:99px;background:${GOLD}}
.box{background:linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;padding:14px 12px;color:#fff}
.box .t{font:700 16px Oswald;color:${GOLD};text-align:center;margin:0 0 6px}.box p{font-size:12px;line-height:1.45;margin:0;text-align:center;font-weight:600}.box .c{font:700 13px Oswald;margin-top:8px}
.ctl{background:${GOLD};border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px 10px}.ct{font:700 11px Oswald;letter-spacing:.06em;margin-bottom:5px}.cb{display:flex;gap:5px}.cb div{flex:1;border:2px solid #000;border-radius:8px;background:#fff;font:700 11px Oswald;text-align:center;padding:5px 0}.cb .on{background:${GREEN};color:#fff}
.pl{background:#fff;border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;padding:10px 12px}.ph2{font:700 10px Oswald;letter-spacing:.14em;color:${ROXO}}.pd{display:flex;align-items:center;gap:8px;margin-top:6px}.pt{flex:1;display:flex;align-items:center;gap:6px;min-width:0}.pt.r{justify-content:flex-end;text-align:right}.pt b{font:700 14px/1.1 Oswald;text-transform:uppercase}.ps{font:700 30px Oswald}.ps i{color:${RED};font-style:normal;padding:0 4px}.pm{font:700 11px Oswald;color:rgba(0,0,0,.5);text-align:center;margin-top:4px}
.tj{font:700 13px Oswald;color:#f4ecd6;padding:4px 0 0;letter-spacing:.06em}
.fx{background:#fff;color:#0c0c0c;border:2px solid #0c0c0c;border-radius:11px;overflow:hidden;box-shadow:2px 3px 0 #0c0c0c}.fx.mine{border-color:${ROXO}}.fx header{display:flex;justify-content:space-between;padding:5px 9px;background:#f4ecd6;font:700 10px Oswald}.fx header b{color:${GREEN}}
.duel{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px;padding:8px}.duel>div{display:flex;gap:6px;align-items:center;min-width:0}.duel span{font:700 11px/1.2 Oswald}.duel strong{font:700 18px Oswald}.duel i{font-style:normal;color:${RED};padding:0 3px}
/* abertura */
.ab{background:linear-gradient(160deg,#1a1033,#0c0a1c);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 ${GOLD};padding:12px 12px 10px;color:#fff}
.cam{display:flex;align-items:center;gap:4px;flex-wrap:wrap;font:700 9.5px Oswald;letter-spacing:.06em;margin-bottom:10px}.cam span{border:1.5px solid rgba(255,255,255,.35);border-radius:6px;padding:2px 6px;color:rgba(255,255,255,.55)}.cam .ok{color:#fff;border-color:rgba(255,255,255,.6)}.cam .on{background:${GOLD};color:#000;border-color:#000;box-shadow:2px 2px 0 #000}.cam i{font-style:normal;color:rgba(255,255,255,.4)}
.tit{font:700 11px Oswald;letter-spacing:.16em;color:rgba(255,255,255,.6);margin-bottom:6px}
.jg{position:relative;display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);border-radius:12px;padding:7px 9px;margin-bottom:6px}
.jg.eu{background:${CREME};color:#0C0C0C;border:3px solid #000;box-shadow:3px 3px 0 ${GOLD};padding-top:12px;margin-top:10px}
.jg .tag{position:absolute;top:-9px;left:9px;background:${GOLD};color:#000;border:2px solid #000;border-radius:7px;font:700 9px Oswald;letter-spacing:.1em;padding:1px 6px}
.jg .t{flex:1;display:flex;align-items:center;gap:6px;min-width:0}.jg .t.r{justify-content:flex-end;text-align:right}.jg b{font:700 12px/1.1 Oswald;text-transform:uppercase}
.x{font:700 16px Oswald;color:${GOLD};padding:0 2px}.jg.eu .x{color:${RED}}
.mais{font:700 10px Oswald;color:rgba(255,255,255,.5);text-align:center;letter-spacing:.08em;margin:2px 0 8px}
.bar{height:8px;border:2px solid rgba(255,255,255,.5);border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;width:60%;background:${ROXO}}
.bola{text-align:center;font:700 14px Oswald;letter-spacing:.08em;margin-top:6px}.bola b{color:${GOLD}}
.leg{margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 16px}.lg b{font:700 22px Oswald;text-transform:uppercase;display:block;margin-bottom:4px}.lg span{font-size:16px;line-height:1.35;font-weight:500}
.nota{margin-top:18px;background:${GREEN};color:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 20px;font:700 20px/1.3 Oswald}
</style></head><body>
<h1>🎬 Copas do online: <span>hoje × como ficaria</span></h1>
<div class="sub">Sala rápida e Minhas Ligas · exemplo com a Libertadores; vale igual pra Copa dos 8, Champions, Copa do Mundo e regionais.</div>
<div class="cols">
  <div class="col"><div class="lab">Hoje</div>${tela(hoje)}</div>
  <div class="col"><div class="lab n">Como ficaria</div>${tela(depois)}</div>
</div>
<div class="leg">
  <div class="lg"><b>O que sai</b><span>A caixa roxa com o parágrafo explicando a fase. Quem quiser ler a regra continua tendo o "Como funciona a Copa" no palco.</span></div>
  <div class="lg"><b>O que entra no lugar</b><span>O caminho da copa (fase de agora, as que passaram, o seu time marcado) e os confrontos da rodada, escudo contra escudo, com o seu em destaque. A contagem de 5s continua.</span></div>
</div>
<div class="nota">O resto da tela não muda: controle da partida, placar grande e a lista de jogos ficam exatamente onde estão. Nenhum toque a mais, nenhuma regra mexida.</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1100, height: 1300 } })
const tmp = resolve(tmpdir(), `abertura2-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/abertura-copas-antes-depois.png', fullPage: true }); await b.close()
console.log('🎬 scripts/mockups/abertura-copas-antes-depois.png')
