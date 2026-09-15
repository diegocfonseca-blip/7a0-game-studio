// 🖼️ MOCKUP — hierarquia da tela de carreira: parar de ter 4 fileiras de botão
// iguais, e fazer a aba ELENCO mostrar o ELENCO.
//
// Diego, 15/09, com dois prints: *"de alguma forma não está ficando bom o visual pra ver
// o elenco… os cansados e etc. O cara tem que descer lá embaixo pra ver o elenco, que é
// algo importante"*; e, no zoom: *"isso aqui também não tá legal, olha que confusão,
// tudo parecido"*.
//
// O diagnóstico: a tela empilha QUATRO fileiras de botão com a MESMA forma e
// significados totalmente diferentes — ritmo (verde), ação (dourado), navegação
// (dourado escuro) e tática (azul) — e só DEPOIS de tudo isso vem o elenco.
//
// Regra da proposta: FORMA SEGUE PAPEL.
//   · ação (faz a rodada andar) = o ÚNICO botão grande
//   · ritmo = faixa fina escura (igual já ficou no online)
//   · navegação = aba de texto com sublinhado, sem caixa
//   · tática = pertence ao TIME, desce pra junto do elenco
//   · o bloco da PARTIDA colapsa numa faixa fina quando você está no Elenco
//
// Rodar: node scripts/mockup-carreira-hierarquia.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const jog = (pos, nome, clube, faixa, pct, cor) => `<div class="jg">
  <span class="jp">${pos}</span>
  <span class="jn"><b>${nome}</b><i>${clube}</i>
    <span class="bar"><u style="width:${pct}%;background:${cor}"></u></span><em style="color:${cor}">${pct}%</em></span>
  <span class="jf">${faixa}</span>
</div>`

const ELENCO = [
  ['GOL', 'Pedro Gallese', 'Orlando City · 2022', '70–82', 0, '#7A1B1B'],
  ['LAT', 'Santiago Arias', 'PSV · 2018', '66–81', 0, '#7A1B1B'],
  ['LAT', 'Bernabei', 'Internacional · 2025', '66–80', 0, '#7A1B1B'],
  ['ZAG', 'Durval', 'Santos · 2013', '56–78', 0, '#7A1B1B'],
  ['ZAG', 'Fábio Luciano', 'Corinthians · 2000', '64–82', 100, VERDE],
]

// ─── HOJE ────────────────────────────────────────────────────────────────────
const hoje = `
<div class="banner"><b>TEMPORADA 25 · LIGA LEGENDS</b><h3>Rodada 3 <small>/ 38</small></h3><i>Várzea</i></div>
<div class="placar"><p>📣 Acabou! O juiz encerrou a peleja!</p><div class="pl"><span>Neymarzetti</span><b>2 × 1</b><span>Monarca EC</span></div></div>
<div class="cx">
  <div class="l3"><button class="v">MANUAL</button><button>AUTO</button><button class="g">Normal ▾</button></div>
  <div class="l2"><button class="g">▶️ Próxima rodada</button><button>PULAR</button></div>
</div>
<div class="l2 sep"><button class="gd">🎽 TIME</button><button>🕴️ AGENCIADOS</button></div>
<div class="l3 sep"><button>🧱 Retranca</button><button class="az">⚖️ Equilíbrio</button><button>🔥 Ataque</button></div>
<p class="expl">Tática e substituições valem do <b>próximo jogo</b> em diante — o jogo que está rolando não muda.</p>
<div class="clube"><b>👥 Neymarzetti 👑</b><span>13/22</span></div>
<div class="clube2">🏷️ Elenco vale 229 · 🏃 Gás do time: <b style="color:${VERM}">29%</b> · 9 🚑</div>
<div class="form"><b>📝 Formação</b><span class="fm">4-3-3 ✓</span></div>
<div class="corte">⬇️ e AQUI você ainda precisa rolar <b>mais de duas telas</b><br>pra chegar nos titulares e ver quem está cansado</div>`

// ─── PROPOSTA (2ª volta) ─────────────────────────────────────────────────────
// ⛔ O Diego BARROU a 1ª ideia: *"mas isso aqui não deve sair… e o campinho com elenco
// também não"*, apontando o banner do estádio + o placar. Ele tem razão e isso casa com
// a regra antiga dele (o desenho do estádio é sagrado, é a primeira coisa que se vê).
// 👉 Então a proposta virou: NADA SAI DO LUGAR. Estádio, placar, campinho, tática —
// tudo fica, na mesma ordem. Muda só a FORMA de cada coisa (pra o olho separar o que é
// apertar-agora, o que é ajuste e o que é aba) e entra UM ATALHO pro elenco.
const proposta = `
<div class="banner"><b>TEMPORADA 25 · LIGA LEGENDS</b><h3>Rodada 3 <small>/ 38</small></h3><i>Várzea</i>
  <span class="tor">😐 TORCIDA <u></u> 30%</span></div>
<div class="placar"><p>📣 Acabou! O juiz encerrou a peleja!</p><div class="pl"><span>Neymarzetti</span><b>2 × 1</b><span>Monarca EC</span></div><span class="gols">Bernabei 34' · Petit 53'</span></div>
<div class="acao"><button class="big">▶️ PRÓXIMA RODADA</button><button class="pular">PULAR</button></div>
<div class="ritmo"><span class="rot">⏱️ RITMO</span><div class="seg"><button>MANUAL</button><button class="on">AUTO</button></div><select><option>Normal</option></select></div>
<nav class="abast"><button class="on">TIME</button><button>AGENCIADOS</button></nav>
<div class="tatica"><span class="trot">⚔️ TÁTICA DO PRÓXIMO JOGO</span>
  <div class="chips"><button>🧱 Retranca</button><button class="on">⚖️ Equilíbrio</button><button>🔥 Ataque</button></div></div>
<div class="clube"><b>👥 Neymarzetti 👑</b><span>13/22</span></div>
<button class="atalho"><span class="ae">🚑</span><span class="at"><b>9 esgotados · gás do time 29%</b><i>toque pra ver quem — e trocar</i></span><span class="seta">›</span></button>
<div class="campo"><span class="cl">o campinho continua aqui, igualzinho</span>
  <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
<div class="depois">⬇️ e o elenco segue logo abaixo, como sempre</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1000px;padding:26px}
 h1{font-family:Oswald;font-size:32px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16px;color:#4a4636;margin:0 0 20px;line-height:1.5}
 .grid{display:flex;gap:22px;align-items:flex-start}
 .col{width:450px}
 .ct{font-family:Oswald;font-weight:900;font-size:16px;text-transform:uppercase;padding:8px 12px;border:4px solid ${INK};border-radius:14px 14px 0 0;border-bottom:0}
 .ct.a{background:#E8E2CE} .ct.b{background:${VERDE};color:#fff}
 .tela{background:${CREME};border:4px solid ${INK};border-radius:0 0 14px 14px;padding:11px;box-shadow:5px 5px 0 ${INK}}

 /* peças de HOJE — cópia fiel */
 .banner{background:linear-gradient(160deg,#1d2118,#0e1109);border:3px solid ${INK};border-radius:12px;padding:10px 12px;color:#fff;margin-bottom:9px}
 .banner b{font:900 9.5px Oswald;color:${GOLD};letter-spacing:.8px}
 .banner h3{font:900 22px Oswald;margin:2px 0 0} .banner h3 small{font-size:13px;opacity:.6}
 .banner i{font-style:normal;font-size:10.5px;opacity:.7}
 .placar{background:linear-gradient(160deg,#1d2118,#0e1109);border:3px solid ${INK};border-radius:12px;padding:9px 11px;color:#fff;margin-bottom:9px;text-align:center}
 .placar p{font:700 11px system-ui;margin:0 0 6px;color:#e8e2ce}
 .pl{display:flex;align-items:center;justify-content:space-between;font:900 12px Oswald}
 .pl b{font-size:19px;background:#fff;color:${INK};border-radius:7px;padding:1px 9px}
 .cx{border:3px solid ${INK};border-radius:12px;background:#FBF6E8;padding:8px;margin-bottom:9px}
 .l2,.l3{display:grid;gap:7px}
 .l2{grid-template-columns:1fr 1fr} .l3{grid-template-columns:1fr 1fr 1.25fr}
 .l2+.l2,.cx .l2{margin-top:7px}
 .sep{margin-bottom:9px}
 .cx button,.sep button{background:#fff;border:3px solid ${INK};border-radius:10px;box-shadow:2px 3px 0 ${INK};min-height:40px;font:700 12.5px Oswald;padding:5px}
 .cx .v{background:${VERDE};color:#fff} .cx .g{background:${GOLD}}
 .sep .gd{background:#C9A227} .sep .az{background:#2F6BAE;color:#fff}
 .expl{font-size:10px;font-weight:700;color:#5a5647;text-align:center;line-height:1.4;margin:0 0 9px}
 .clube{display:flex;justify-content:space-between;background:${GOLD};border:3px solid ${INK};border-radius:11px 11px 0 0;padding:7px 10px;font:900 13px Oswald}
 .clube2{background:#fff;border:3px solid ${INK};border-top:0;padding:6px 10px;font-size:10.5px;font-weight:800}
 .form{background:${GOLD};border:3px solid ${INK};border-top:0;border-radius:0 0 11px 11px;padding:7px 10px;font:900 12px Oswald;display:flex;gap:8px;align-items:center}
 .fm{background:#C9A227;border:2px solid ${INK};border-radius:8px;padding:3px 9px;font-size:12px}
 .corte{margin-top:11px;border:3px dashed ${VERM};border-radius:11px;background:#FDECEA;color:#8a2318;padding:10px;font-size:12px;font-weight:800;text-align:center;line-height:1.45}

 /* peças da PROPOSTA */
 .fita{background:#000;color:#e6e1cf;border-radius:9px;padding:7px 10px;font:700 11px Oswald;letter-spacing:.4px;margin-bottom:9px;display:flex;align-items:center}
 .fita b{color:#fff;font-size:13px;margin:0 4px} .cv{margin-left:auto;opacity:.6}
 .acao{display:flex;gap:7px;margin-bottom:9px}
 .big{flex:2.1;background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:12px;box-shadow:3px 4px 0 ${INK};min-height:52px;font:900 16px Oswald}
 .pular{flex:1;background:#fff;border:2px solid ${INK};border-radius:10px;box-shadow:2px 2px 0 ${INK};min-height:52px;font:700 12px Oswald}
 .ritmo{display:flex;align-items:center;gap:7px;background:#000;border-radius:10px;padding:5px 8px;margin-bottom:11px}
 .ritmo .rot{font:900 9px Oswald;letter-spacing:1px;color:#b9b19a}
 .ritmo .seg{flex:1;display:flex;border:2px solid #6c6350;border-radius:7px;overflow:hidden}
 .ritmo .seg button{flex:1;background:transparent;border:0;color:#cfc8b4;min-height:26px;font:700 11px Oswald}
 .ritmo .seg .on{background:${VERDE};color:#fff;font-weight:900}
 .ritmo select{background:#1d2118;color:#e6e1cf;border:2px solid #6c6350;border-radius:7px;min-height:26px;font:700 10.5px Oswald;padding:0 5px}
 .abast{display:flex;gap:18px;border-bottom:3px solid rgba(0,0,0,.14);margin-bottom:11px}
 .abast button{background:none;border:0;border-bottom:4px solid transparent;padding:0 2px 7px;font:900 14px Oswald;color:rgba(0,0,0,.4);margin-bottom:-3px}
 .abast .on{color:${INK};border-bottom-color:${INK}}
 .alerta{display:flex;gap:9px;align-items:center;background:#FDECEA;border:3px solid ${VERM};border-radius:11px;padding:8px 10px;margin-bottom:10px;box-shadow:2px 3px 0 ${VERM}}
 .alerta .ae{font-size:22px}
 .alerta b{display:block;font:900 13px Oswald;color:#8a2318}
 .alerta i{display:block;font-style:normal;font-size:10.5px;font-weight:700;color:#8a2318;opacity:.85}
 .listas{background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 9px;box-shadow:2px 3px 0 ${INK}}
 .lt{font:900 11px Oswald;letter-spacing:.6px;color:#5a5647;margin:0 0 6px}
 .jg{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1.5px dashed #e6dfc8}
 .jg:last-of-type{border-bottom:0}
 .jp{flex:none;font:900 8.5px Oswald;color:#8a8266;width:24px}
 .jn{flex:1;min-width:0}
 .jn b{display:block;font:900 12.5px Oswald;line-height:1.1}
 .jn i{display:block;font-style:normal;font-size:9px;font-weight:700;color:#8a8266}
 .bar{display:inline-block;width:56px;height:5px;border:1.5px solid ${INK};border-radius:4px;background:#e9dfbe;overflow:hidden;vertical-align:middle;margin-top:3px}
 .bar u{display:block;height:100%;text-decoration:none}
 .jn em{font-style:normal;font-size:9px;font-weight:900;margin-left:5px}
 .jf{flex:none;background:#DFF3E6;border:2px solid ${INK};border-radius:7px;padding:1px 6px;font:900 10px Oswald}
 .mais{font-size:10px;font-weight:800;color:#8a8266;text-align:center;margin:6px 0 0}
 .tatica{border:2px solid rgba(0,0,0,.18);border-radius:11px;padding:7px 8px;margin-bottom:9px;background:rgba(255,255,255,.5)}
 .tatica .trot{display:block;font:900 8.5px Oswald;letter-spacing:1px;color:#8a8266;margin-bottom:5px}
 .chips{display:flex;gap:6px}
 .chips button{flex:1;background:#fff;border:2px solid ${INK};border-radius:999px;min-height:30px;font:700 11px Oswald}
 .chips .on{background:#2F6BAE;color:#fff;font-weight:900}
 .atalho{width:100%;display:flex;align-items:center;gap:9px;background:#FDECEA;border:3px solid ${VERM};border-top:0;border-radius:0 0 11px 11px;padding:8px 10px;margin-bottom:10px;text-align:left}
 .atalho .ae{font-size:20px} .atalho .at{flex:1}
 .atalho b{display:block;font:900 12px Oswald;color:#8a2318}
 .atalho i{display:block;font-style:normal;font-size:9.5px;font-weight:700;color:#8a2318;opacity:.8}
 .atalho .seta{font:900 20px Oswald;color:${VERM}}
 .campo{background:repeating-linear-gradient(180deg,${VERDE} 0 18px,#166332 18px 36px);border:3px solid ${INK};border-radius:11px;padding:10px 8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px}
 .campo .cl{width:100%;text-align:center;color:rgba(255,255,255,.75);font:700 9.5px system-ui;margin-bottom:4px}
 .campo i{display:block;width:17px;height:23px;border-radius:5px;background:linear-gradient(180deg,#fff 0 58%,#0A0A0A 58%);border:1.5px solid ${INK}}
 .banner .tor{display:block;margin-top:7px;font:700 9px system-ui;color:#e8e2ce}
 .banner .tor u{display:inline-block;width:110px;height:5px;border-radius:3px;background:linear-gradient(90deg,${GOLD} 30%,rgba(255,255,255,.2) 30%);vertical-align:middle;text-decoration:none;margin:0 5px}
 .placar .gols{display:block;margin-top:6px;font-size:9.5px;color:#cfc8b4;font-weight:700}
 .depois{margin-top:10px;font-size:11px;font-weight:700;color:#5a5647;text-align:center;line-height:1.45}
 .nota{margin-top:20px;background:#FFF4E2;border:4px solid #B8722A;border-radius:14px;padding:15px 18px;font-size:15px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>A tela de carreira: hierarquia e atalho pro elenco</h1>
<p class="sub">2ª volta: o Diego barrou tirar o estádio, o placar e o campinho — <b>tudo isso fica</b>. O que muda é só a <b>forma</b> das quatro fileiras de botão (que hoje são iguais com significados diferentes: ritmo, ação, navegação e tática) e entra <b>um atalho</b> pro elenco. Regra: <b>a forma segue o papel</b>.</p>
<div class="grid">
  <div class="col"><div class="ct a">Como é hoje</div><div class="tela">${hoje}</div></div>
  <div class="col"><div class="ct b">Assim ficou (publicado 15/09)</div><div class="tela">${proposta}</div></div>
</div>
<div class="nota">
  <b>✅ PUBLICADO em 15/09 — o que mudou, item por item:</b><br>
  · <b>NADA SAI DO LUGAR.</b> Estádio, torcida, placar, campinho e tática continuam onde estão, na mesma ordem — você barrou a ideia de colapsar, e com razão.<br>
  · <b>Só a AÇÃO é botão grande</b> — "Próxima rodada" é a única coisa que faz o jogo andar. O PULAR fica ao lado, menor.<br>
  · <b>O botão grande ficou DOURADO, não verde</b> (mudei de propósito na hora de codar): o verde agora é o "ligado" do ritmo, e uma cor não pode querer dizer duas coisas. Quem manda na hierarquia é o TAMANHO.<br>· <b>O ritmo continua a faixa fina verde</b> que você aprovou dia 15 ("só menor e verde"). Ajuste não compete com ação.<br>
  · <b>TIME/AGENCIADOS vira aba de texto</b> com sublinhado. Aba não é botão — e assim some mais uma fileira de caixas.<br>
  · <b>A tática vira pastilha redonda</b> com um rótulo em cima ("⚔️ TÁTICA DO PRÓXIMO JOGO") — fica no mesmo lugar, mas deixa de parecer mais uma fileira de botões.<br>
  · <b>Entra o ATALHO 🚑</b> colado na caixa do clube: "9 esgotados · gás 29% — toque pra ver quem". <b>Um toque</b> leva direto pra lista, sem rolar nada. É isso que resolve o "tem que descer lá embaixo" sem tirar nada da tela.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-carreira-hierarquia.png', fullPage: true })
await b.close()
console.log('ok')
