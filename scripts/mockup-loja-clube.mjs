#!/usr/bin/env node
// 🎨 MOCKUP — LOJA DO CLUBE (14/10)
// Diego: volta Craque R$ 19,90 / Lenda R$ 39,90 (uma vez só), SOBE DE PLANO pagando só a diferença (Craque→Lenda +20,
// Craque→Batismo +60, Lenda→Batismo +40) e uma loja de AVULSOS estilo Fortnite (vitrine que gira toda semana, tudo
// visual), mais as MOEDAS do Banco Legends — que viram uma FICHA guardada na conta e a pessoa escolhe em qual carreira usar.
// Exemplo: usuário ⭐ CRAQUE. Itens e preços são de EXEMPLO.
// uso: node scripts/mockup-loja-clube.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const item = (ic, t, d, p, tag = '') => `<div class="it"><div class="ii">${ic}</div><b>${t}</b><small>${d}</small>${tag ? `<span class="nv">${tag}</span>` : ''}<div class="pr">R$ ${p}</div></div>`
const moeda = (r, n, t, dest = false) => `<div class="mo ${dest ? 'dest' : ''}"><div class="mi">🪙</div><b>${n} 🪙</b><small>${t}</small><div class="pr">R$ ${r}</div></div>`

const tela1 = `<div class="tela home">
<div class="hd"><b>LEILÃO LEGENDS</b><span class="lg">BR · EN</span></div>
<div class="me"><div class="av" style="background:${PRATA}">⭐</div><div><b>Renaton</b><small>⭐ CRAQUE</small></div>
<div class="lojab">🛒 LOJA<em>NOVO</em></div></div>
<div class="seta">👆 a Loja mora AQUI, do lado do seu nome — sempre à vista, sem atrapalhar o jogo</div>
<div class="bt g">🏆 CARREIRA</div><div class="bt">⚡ PARTIDA RÁPIDA</div><div class="bt">🌐 SALAS ONLINE</div><div class="bt">📋 MINHAS LIGAS</div>
<div class="seta" style="margin-top:14px">E também abre por: 🏦 Banco Legends (dentro da carreira) e pelo botão "Apoie"</div></div>`

const tela2 = `<div class="tela">
<div class="th"><h1>🛒 Loja do Clube</h1><span class="eu" style="background:${PRATA}">⭐ VOCÊ É CRAQUE</span></div>
<p class="sub">Mimos são só visuais. <b>Nada aqui muda sala online, liga dos amigos nem ranking.</b></p>
<h2>⬆️ Sobe de plano <small>paga só a diferença</small></h2>
<div class="up" style="background:${OURO}"><div><b>👑 LENDA</b><small>cor dourada em todo lugar + tudo do Craque</small></div><div class="pp"><s>R$ 39,90</s><b>+ R$ 20</b></div></div>
<div class="up bat"><div><b>🖋️ BATISMO</b><small>escudo, mascote e manto feitos SÓ pro seu clube · nome reservado · pra sempre</small></div><div class="pp"><s>R$ 79,90</s><b>+ R$ 60</b></div></div>
<h2>🔥 Vitrine da semana <small class="tm">⏳ troca em 5 dias</small></h2>
<div class="grid">
${item('📣', 'Canto da torcida', 'toca quando seu time faz gol', '9,90', 'SÓ ESSA SEMANA')}
${item('🎉', 'Comemoração', 'dancinha da mascote no gol', '4,90')}
${item('🔨', 'Frase do martelo', 'sua frase quando você arremata', '2,90')}
${item('👕', 'Manto retrô', 'listrado anos 80, pronto', '5,90')}
</div>
<h2>🎬 Entrada de gala</h2>
<div class="gala"><div class="gi">🎬</div><div><b>Seu clube entra na sala com festa</b><small>fumaça, holofote e o nome do clube no telão</small></div><div class="pr">R$ 19,90</div></div>
<h2>🏦 Moedas pro clube <small>Banco Legends · carreira solo</small></h2>
<div class="mgrid">${moeda('10', 30, 'Cafezinho')}${moeda('50', 150, 'Reforço pontual', true)}${moeda('100', 300, 'Fôlego de temporada')}</div>
<p class="obs">As moedas ficam GUARDADAS na sua conta. Você escolhe em qual carreira usar quando quiser →</p>
</div>`

const tela3 = `<div class="tela">
<div class="th"><h1>🏦 Usar moedas</h1></div>
<div class="cof"><b>💰 Guardado na sua conta</b><div class="big">150 🪙</div><small>comprado em 14/10 · não vence</small></div>
<h2>Em qual carreira?</h2>
<div class="car sel"><div class="ce">🦁</div><div><b>Leão da Estradinha</b><small>Série B · Temporada 37 · caixa 212 🪙</small></div><em>✓</em></div>
<div class="car"><div class="ce">⚓</div><div><b>Porto do Renaton</b><small>Série D · Temporada 4 · caixa 38 🪙</small></div></div>
<div class="qt"><span>Quanto?</span><div class="qq"><i>−</i><b>150 🪙</b><i>+</i></div></div>
<button class="btn">💸 MANDAR 150 🪙 PRO LEÃO DA ESTRADINHA</button>
<p class="obs">Pode dividir: um pouco em cada carreira. Moeda vale só na carreira solo (não entra em sala online nem em liga dos amigos).</p>
<div class="ok">✅ O jogo só libera depois que o pagamento CONFIRMA — nada de "cliquei e ganhei".</div>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:1350px;align-items:flex-start}
.tela{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
h1{font:700 28px/1 Oswald;text-transform:uppercase;margin:0}h2{font:700 19px/1 Oswald;text-transform:uppercase;margin:16px 0 8px;display:flex;justify-content:space-between;align-items:baseline}h2 small{font:600 11px Arial,sans-serif;text-transform:none;color:#53534b;font-weight:600}h2 .tm{background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:7px;padding:2px 6px;font:700 11px Oswald}
.sub{font-size:13px;font-weight:600;color:#3a3a32;margin:6px 0 4px}
.th{display:flex;justify-content:space-between;align-items:center;gap:8px}.eu{font:700 11px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:4px 7px;box-shadow:2px 2px 0 #0C0C0C;white-space:nowrap}
.up{display:flex;justify-content:space-between;gap:10px;align-items:center;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px;margin-bottom:8px}.up b{font:700 18px Oswald;display:block}.up small{font-size:11px;font-weight:600;line-height:1.3;display:block}.up.bat{background:linear-gradient(135deg,#14251a,#1B7A3D);color:#F4ECD6}.up.bat b{color:#FFC400}
.pp{text-align:right;white-space:nowrap}.pp s{font-size:11px;opacity:.7;display:block}.pp b{font:700 20px Oswald;background:#fff;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:8px;padding:2px 7px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.it{position:relative;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;text-align:center}.ii{font-size:34px}.it b{font:700 14px Oswald;text-transform:uppercase;display:block}.it small{font-size:10.5px;color:#53534b;font-weight:600;display:block;min-height:28px}.nv{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#C2452F;color:#fff;font:700 9.5px Oswald;border:2px solid #0C0C0C;border-radius:6px;padding:1px 5px;white-space:nowrap}
.pr{margin-top:6px;font:700 15px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:4px 0;box-shadow:2px 2px 0 #0C0C0C}
.gala{display:flex;gap:10px;align-items:center;background:linear-gradient(135deg,#2a1656,#7C3AED);color:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px}.gi{font-size:30px}.gala b{font:700 15px Oswald;text-transform:uppercase;display:block}.gala small{font-size:11px;opacity:.9}.gala .pr{white-space:nowrap;padding:5px 8px;margin:0}
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mo{background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:8px;text-align:center}.mo.dest{background:#FFF3C4}.mi{font-size:26px}.mo b{font:700 17px Oswald;display:block}.mo small{font-size:10px;font-weight:600;color:#53534b}
.obs{font-size:11px;color:#53534b;font-weight:600;margin:8px 2px 0;line-height:1.4}
.hd{display:flex;justify-content:space-between;align-items:center;font:700 22px Oswald}.lg{font:700 11px Oswald;border:2px solid #0C0C0C;border-radius:7px;padding:3px 6px;background:#fff}
.me{display:flex;gap:10px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;margin:12px 0 6px}.av{width:44px;height:44px;border:3px solid #0C0C0C;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}.me b{font:700 18px Oswald;display:block}.me small{font:700 11px Oswald;color:#6b7684}
.lojab{margin-left:auto;position:relative;font:700 17px Oswald;background:#FFC400;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:7px 12px;outline:3px dashed #C2452F;outline-offset:4px}.lojab em{position:absolute;top:-10px;right:-10px;font-style:normal;font:700 9px Oswald;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:1px 4px}
.seta{font-size:12px;font-weight:700;color:#C2452F;margin:6px 2px 12px}
.bt{font:700 20px Oswald;text-transform:uppercase;text-align:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;margin-bottom:9px}.bt.g{background:#1B7A3D;color:#fff}
.cof{background:#14251a;color:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;text-align:center;margin-top:12px}.cof b{font:700 14px Oswald;color:#FFC400;text-transform:uppercase}.cof .big{font:700 42px Oswald}.cof small{font-size:11px;opacity:.8}
.car{display:flex;gap:10px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;margin-bottom:8px;position:relative}.car.sel{background:#FFF3C4;box-shadow:0 0 0 3px #FFC400,3px 3px 0 #0C0C0C}.ce{font-size:28px}.car b{font:700 16px Oswald;display:block}.car small{font-size:11px;font-weight:600;color:#53534b}.car em{position:absolute;right:10px;font-style:normal;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font:700 13px Oswald}
.qt{display:flex;justify-content:space-between;align-items:center;margin:12px 2px}.qt span{font:700 16px Oswald;text-transform:uppercase}.qq{display:flex;gap:8px;align-items:center}.qq i{font-style:normal;font:700 18px Oswald;width:32px;height:32px;border:3px solid #0C0C0C;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center}.qq b{font:700 20px Oswald}
.btn{width:100%;font:700 16px Oswald;text-transform:uppercase;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:10px}
.ok{background:#e6f4ea;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px;font-size:11.5px;font-weight:700;margin-top:10px}
</style></head><body>${tela1}${tela2}${tela3}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1350, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `loja-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/loja-clube.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/loja-clube.png')
