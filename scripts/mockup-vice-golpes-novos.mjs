// 🌴 20/11: mockup Vice City — 8 cartas de golpe novas (ideias aprovadas pelo Diego) + 3 cenas: avião do Contrabando,
// lenda caindo de Paraquedas, Jacaré abocanhando a lenda. Mesmo visual do mockup-vice-v2.mjs.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const fundo = `background:linear-gradient(180deg,#14072e 0%,#3b1265 30%,#7a1d7e 55%,#ff4f8b 80%,#ffb26b 90%,#2a0c45 91%,#160828 100%)`
const carta = (e, n, f, tipo) => `<div class="c"><div class="tp ${tipo === 'ataque' ? 'at' : 'eu'}">${tipo === 'ataque' ? '🎯 NO RIVAL' : '🙋 PRA VOCÊ'}</div><div class="ce">${e}</div><div class="cn">${n}</div><div class="cf">${f}</div></div>`
const CARTAS = [
  ['🛞', 'Pneu furado', 'Por 30 s o rival só dá lance de +1', 'ataque'],
  ['🐊', 'Jacaré', 'Fica de tocaia no rival: a próxima LENDA que cair no time dele vai pro seu, de graça', 'ataque'],
  ['🤖', 'NPC', 'Manda uma carta Profissional aleatória pro time do rival, ocupando uma vaga dele', 'ataque'],
  ['🎮', 'Código de trapaça', '+50 moedas — mas a sala vê "TRAPACEIRO!" e você ganha +1 ⭐', 'eu'],
  ['💼', 'Missão cumprida', 'Ganhou a próxima carta? +10 moedas de bônus', 'eu'],
  ['🪂', 'Paraquedas', 'Uma LENDA aleatória cai do céu no seu time, de graça', 'eu'],
  ['🔫', 'Loja de armas', 'Paga 10 moedas e ganha mais 1 carta de golpe aleatória', 'eu'],
  ['✈️', 'Contrabando', 'O avião passa pra sala toda e o caixote cai pra 1 pessoa sorteada: ela ganha 1 carta de golpe', 'eu'],
]
const html = `<!doctype html><meta charset="utf-8"><style>${F}
*{box-sizing:border-box;margin:0}body{width:1260px;background:#F4ECD6;font-family:Oswald,sans-serif;padding:28px;color:#0C0C0C}
h1{font-size:40px;text-transform:uppercase}.sub{font-size:19px;color:#444;margin:4px 0 22px}
h2{font-size:24px;text-transform:uppercase;margin:6px 0 12px}
.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:30px}
.c{background:#fff;border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:10px 10px 14px;text-align:center;min-height:230px}
.tp{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;border:2px solid #0C0C0C}
.tp.at{background:#E8503A;color:#fff}.tp.eu{background:#1B7A3D;color:#fff}
.ce{font-size:52px;margin-top:6px}.cn{font-size:21px;font-weight:700;text-transform:uppercase;line-height:1.05;margin-top:2px}
.cf{font-size:14px;color:#333;line-height:1.25;margin-top:8px;font-family:sans-serif}
.row{display:flex;gap:26px}.col{width:380px}.tit{font-size:21px;font-weight:700;text-transform:uppercase;margin-bottom:8px}.exp{font-size:15px;color:#333;margin-top:10px;line-height:1.3}
.tela{height:600px;border:5px solid #0C0C0C;border-radius:30px;box-shadow:7px 7px 0 #0C0C0C;overflow:hidden;position:relative;${fundo};color:#fff;padding:18px}
.bar{display:flex;gap:6px;align-items:center;background:rgba(0,0,0,.35);border-radius:12px;padding:8px 10px;font-size:15px}
.mesa{position:absolute;left:90px;top:300px;width:190px;height:220px;background:repeating-linear-gradient(45deg,#e6dcc0 0 12px,#ddd1b0 12px 24px);border:4px solid #0C0C0C;border-radius:14px;color:#0C0C0C;display:flex;align-items:flex-end;padding:10px;font-weight:700;font-size:20px;opacity:.5}
.golpe{position:absolute;left:0;right:0;background:linear-gradient(90deg,#c2452f,#ff4fd8);border-top:4px solid #0C0C0C;border-bottom:4px solid #0C0C0C;padding:12px 14px;text-align:center;box-shadow:0 0 30px #ff4fd8}
.gt{font-size:28px;font-weight:700;letter-spacing:1px;text-shadow:3px 3px 0 #0C0C0C}.gs{font-size:16px;margin-top:2px}
.aviao{position:absolute;top:110px;left:30px;display:flex;align-items:center;gap:0}
.av{font-size:64px;transform:scaleX(-1)}.faixa{background:#FFC400;color:#0C0C0C;border:3px solid #0C0C0C;font-weight:700;font-size:17px;padding:6px 12px;border-radius:6px;box-shadow:3px 3px 0 #0C0C0C}
.corda{width:30px;height:2px;background:#0C0C0C}
.caixote{position:absolute;font-size:44px}.para{position:absolute;font-size:46px}
.lenda{position:absolute;width:120px;height:160px;border:4px solid #0C0C0C;border-radius:12px;background:linear-gradient(160deg,#FFE07a,#FFC400 50%,#d99a00);box-shadow:0 0 30px #FFC400;color:#0C0C0C;font-weight:700;text-align:center;padding-top:40px;font-size:18px;line-height:1.1}
.rastro{position:absolute;width:2px;background:repeating-linear-gradient(180deg,#fff 0 6px,transparent 6px 12px);opacity:.7}
.jac{position:absolute;font-size:90px}
</style><body>
<h1>🌴 Vice City · 8 cartas de golpe novas</h1><div class="sub">Mockup — nada disso está no jogo ainda. Mesma carta de sempre (sorteio das 3, banner pra sala toda, estrela pra quem leva golpe).</div>
<h2>As cartas</h2>
<div class="grade">${CARTAS.map(c => carta(...c)).join('')}</div>
<h2>Como aparecem na tela</h2>
<div class="row">
 <div class="col"><div class="tit">✈️ Contrabando</div>
  <div class="tela"><div class="bar">MEI · lance 18 · Tôka10</div><div class="mesa">?</div>
   <div class="aviao"><div class="av">✈️</div><div class="corda"></div><div class="faixa">📦 CONTRABANDO!</div></div>
   <div class="rastro" style="left:120px;top:180px;height:120px"></div><div class="caixote" style="left:96px;top:290px">📦</div>
   <div class="golpe" style="top:430px"><div class="gt">📦 CAIU PRO NEYMARZETTI</div><div class="gs">o <b>Futpoint FC</b> usou o Contrabando · ganhou 1 carta de golpe</div></div></div>
  <div class="exp">O avião de carga cruza a tela de <b>todo mundo</b> (igual ao avião da home). O caixote cai pra <b>uma pessoa só</b>, sorteada — pode ser até quem usou. Ninguém aperta nada, o pregão não para.</div></div>
 <div class="col"><div class="tit">🪂 Paraquedas</div>
  <div class="tela"><div class="bar">ATA · lance 9 · Imperial EC</div>
   <div class="para" style="left:150px;top:90px">🪂</div><div class="rastro" style="left:176px;top:140px;height:40px"></div>
   <div class="lenda" style="left:120px;top:180px">👑 LENDA<br><span style="font-size:15px">sorteada</span></div>
   <div class="golpe" style="top:430px"><div class="gt">🪂 CAIU DO CÉU!</div><div class="gs">uma <b>LENDA</b> pousou no <b>Imperial EC</b>, de graça</div></div></div>
  <div class="exp">A lenda <b>desce de paraquedas</b> e cai numa posição em que você ainda tem vaga (time cheio: entra no lugar do pior daquela posição). Carta <b>real</b> do baralho.</div></div>
 <div class="col"><div class="tit">🐊 Jacaré</div>
  <div class="tela"><div class="bar">ZAG · martelou · Leoxizbr</div>
   <div class="lenda" style="left:120px;top:150px">👑 LENDA<br><span style="font-size:15px">do Leoxizbr</span></div>
   <div class="jac" style="left:150px;top:250px">🐊</div>
   <div class="golpe" style="top:430px"><div class="gt">🐊 O JACARÉ PEGOU!</div><div class="gs">a lenda do <b>Leoxizbr</b> foi pro <b>Águia de Marabá</b><br>(ele recebe o dinheiro de volta)</div></div></div>
  <div class="exp">Ninguém vê o jacaré sendo armado — só que ele foi usado. Quando cair uma <b>lenda</b> no time daquele rival, o jacaré abocanha e ela vai pro seu time.</div></div>
</div></body>`
const tmp = `/tmp/vice-novos-${process.pid}.html`; writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1260, height: 900 } })
await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/vice-golpes-novos.png', fullPage: true }); await b.close(); console.log('ok')
