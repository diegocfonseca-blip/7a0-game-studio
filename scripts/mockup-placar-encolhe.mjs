// 🖼️ MOCKUP — o PLACAR encolhe quando você rola, e volta quando você sobe.
//
// Ideia do Diego (15/09), depois de ele BARRAR o colapso automático que eu tinha
// proposto: *"sobre arrastar pra baixo o placar rolando, daria? Quando eu quiser
// arrastar pra descer mais as coisas"*.
//
// É melhor que a minha proposta original justamente porque NADA SOME: o placar vira
// uma barrinha fixa no topo enquanto você desce, e volta inteiro quando você sobe.
// Quem manda é o dedo dele, não o jogo.
//
// Rodar: node scripts/mockup-placar-encolhe.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const jog = (pos, nome, clube, pct, cor) => `<div class="jg">
  <span class="jp">${pos}</span><span class="jn"><b>${nome}</b><i>${clube}</i>
  <span class="bar"><u style="width:${pct}%;background:${cor}"></u></span><em style="color:${cor}">${pct}%</em></span></div>`
const LISTA = [
  ['GOL', 'Pedro Gallese', 'Orlando City · 2022', 0, '#7A1B1B'],
  ['LAT', 'Santiago Arias', 'PSV · 2018', 0, '#7A1B1B'],
  ['LAT', 'Bernabei', 'Internacional · 2025', 0, '#7A1B1B'],
  ['ZAG', 'Durval', 'Santos · 2013', 0, '#7A1B1B'],
  ['ZAG', 'Fábio Luciano', 'Corinthians · 2000', 100, VERDE],
  ['MEI', 'Petit', 'Arsenal · 1998', 0, '#7A1B1B'],
].map(a => jog(...a)).join('')

const banner = `<div class="banner"><b>TEMPORADA 25 · LIGA LEGENDS</b><h3>Rodada 3 <small>/ 38</small></h3><i>Várzea</i></div>`
const placarCheio = `<div class="placar"><p>📣 Acabou! O juiz encerrou a peleja!</p>
  <div class="pl"><span>Neymarzetti</span><b>2 × 1</b><span>Monarca EC</span></div>
  <span class="gols">Bernabei 34' · Petit 53'</span><span class="alca"></span></div>`
const faixa = `<div class="fixa">⚽ <b>2 × 1</b> FIM · Neymarzetti × Monarca EC <span class="cv">▾ toque pra abrir</span></div>`
const campinho = `<div class="campo"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`

const tela = (titulo, cor, corpo, legenda) => `<div class="col">
  <div class="ct" style="background:${cor}">${titulo}</div>
  <div class="tela">${corpo}</div>
  <p class="lg">${legenda}</p>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1180px;padding:26px}
 h1{font-family:Oswald;font-size:31px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16px;color:#4a4636;margin:0 0 20px;line-height:1.5;max-width:1050px}
 .grid{display:flex;gap:18px;align-items:flex-start}
 .col{width:360px}
 .ct{font-family:Oswald;font-weight:900;font-size:14px;text-transform:uppercase;padding:8px 11px;border:4px solid ${INK};border-radius:13px 13px 0 0;border-bottom:0}
 .tela{background:${CREME};border:4px solid ${INK};border-radius:0 0 13px 13px;padding:10px;box-shadow:5px 5px 0 ${INK};height:430px;overflow:hidden;position:relative}
 .lg{font-size:12.5px;font-weight:700;color:#4a4636;line-height:1.45;margin:9px 2px 0}

 .banner{background:linear-gradient(160deg,#1d2118,#0e1109);border:3px solid ${INK};border-radius:11px;padding:9px 11px;color:#fff;margin-bottom:8px}
 .banner b{font:900 9px Oswald;color:${GOLD};letter-spacing:.8px}
 .banner h3{font:900 20px Oswald;margin:2px 0 0} .banner h3 small{font-size:12px;opacity:.6}
 .banner i{font-style:normal;font-size:10px;opacity:.7}
 .placar{position:relative;background:linear-gradient(160deg,#1d2118,#0e1109);border:3px solid ${INK};border-radius:11px;padding:9px 11px 13px;color:#fff;margin-bottom:8px;text-align:center}
 .placar p{font:700 10.5px system-ui;margin:0 0 6px;color:#e8e2ce}
 .pl{display:flex;align-items:center;justify-content:space-between;font:900 11.5px Oswald}
 .pl b{font-size:18px;background:#fff;color:${INK};border-radius:7px;padding:1px 9px}
 .gols{display:block;margin-top:6px;font-size:9px;color:#cfc8b4;font-weight:700}
 .alca{position:absolute;left:50%;bottom:4px;transform:translateX(-50%);width:42px;height:4px;border-radius:3px;background:rgba(255,255,255,.35)}
 .fixa{background:#000;color:#e6e1cf;border:3px solid ${INK};border-radius:10px;padding:7px 10px;font:700 11px Oswald;margin-bottom:8px;display:flex;align-items:center;gap:5px}
 .fixa b{color:#fff;font-size:14px}
 .fixa .cv{margin-left:auto;font-size:9px;opacity:.6}
 .campo{background:repeating-linear-gradient(180deg,${VERDE} 0 16px,#166332 16px 32px);border:3px solid ${INK};border-radius:11px;padding:9px 7px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px}
 .campo i{display:block;width:15px;height:21px;border-radius:4px;background:linear-gradient(180deg,#fff 0 58%,#0A0A0A 58%);border:1.5px solid ${INK}}
 .listas{background:#fff;border:3px solid ${INK};border-radius:11px;padding:7px 8px}
 .lt{font:900 10px Oswald;letter-spacing:.6px;color:#5a5647;margin:0 0 5px}
 .jg{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1.5px dashed #e6dfc8}
 .jp{flex:none;font:900 8px Oswald;color:#8a8266;width:22px}
 .jn{flex:1;min-width:0}
 .jn b{display:block;font:900 11.5px Oswald;line-height:1.1}
 .jn i{display:block;font-style:normal;font-size:8.5px;font-weight:700;color:#8a8266}
 .bar{display:inline-block;width:50px;height:5px;border:1.5px solid ${INK};border-radius:4px;background:#e9dfbe;overflow:hidden;vertical-align:middle;margin-top:2px}
 .bar u{display:block;height:100%;text-decoration:none}
 .jn em{font-style:normal;font-size:8.5px;font-weight:900;margin-left:4px}
 .dedo{position:absolute;right:16px;top:150px;font-size:34px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}
 .seta{position:absolute;right:26px;top:110px;font:900 26px Oswald;color:${VERM}}
 .nota{margin-top:20px;background:#FFF4E2;border:4px solid #B8722A;border-radius:14px;padding:15px 18px;font-size:15.5px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>⬇️ O placar encolhe quando você rola — e volta quando você sobe</h1>
<p class="sub">Ideia sua, e é melhor que a minha: <b>nada some</b>. Enquanto você desce, o placar vira uma barrinha fina que fica <b>grudada no topo</b> — some do caminho, mas continua ali te dizendo o resultado. Subiu de volta, ele abre inteiro outra vez. Quem manda é o seu dedo.</p>
<div class="grid">
  ${tela('1 · no topo', GOLD, banner + placarCheio + campinho, 'Chegou na tela: <b>tudo inteiro</b>, do jeito que é hoje. A alcinha embaixo do placar avisa que dá pra puxar.')}
  ${tela('2 · você rola pra baixo', VERDE + ';color:#fff', faixa + campinho + `<div class="listas"><p class="lt">⭐ TITULARES (11)</p>${LISTA}</div><div class="seta">⬇</div><div class="dedo">👆</div>`, 'O placar <b>encolhe pra uma barrinha</b> grudada no topo e o elenco sobe. Você ganha meia tela sem perder o resultado de vista.')}
  ${tela('3 · você sobe de novo', GOLD, banner + placarCheio + campinho, 'Voltou pro topo: o placar <b>abre inteiro sozinho</b>. Não precisa apertar nada pra desfazer.')}
</div>
<div class="nota">
  <b>Dois jeitos de fazer — e eu prefiro o primeiro:</b><br>
  · <b>🅰️ Encolhe sozinho ao rolar</b> (o do desenho). É o jeito que todo app faz: você só rola, e ele sai do caminho. Zero toque a mais, nada pra aprender, e impossível "ficar preso" com o placar escondido — subiu, voltou.<br>
  · <b>🅱️ Alça pra puxar na mão</b>: uma pecinha embaixo do placar que você arrasta pra encolher, e ele <b>fica como você deixou</b> até puxar de volta. É mais controle, mas é mais um gesto pra descobrir — e tem o risco de alguém encolher sem querer e achar que o placar sumiu.<br>
  <b>Dá pra ter os dois:</b> encolhe ao rolar (🅰️) e, se você tocar na barrinha, ela trava aberta. Aí o padrão funciona sozinho e quem quiser mandar, manda.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-placar-encolhe.png', fullPage: true })
await b.close()
console.log('ok')
