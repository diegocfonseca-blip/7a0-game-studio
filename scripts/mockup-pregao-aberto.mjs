// 🔨 MOCKUP — PREGÃO ABERTO (16/10, pedido do Diego): o 3º jeito de dar lance, ao lado do ✉️ Envelope e da 🐊 Tocaia.
// Uma carta por vez, lance ABERTO ("dou 10… 11… 12… uma, duas, três, vendido!"), ordem das posições EMBARALHADA
// (ninguém sabe a próxima carta nem a posição), martelo em 6s sem lance novo, quem já fechou a posição não dá lance.
//   node scripts/mockup-pregao-aberto.mjs  →  scripts/mockups/pregao-aberto.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const G = { bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', prata: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)' }

const lance = (quem, tier, v, ativo) => `<div class="lan ${ativo ? 'ativo' : ''}"><span class="quem" style="background:${G[tier]}">${quem}</span><b>${v} 🪙</b></div>`
const slot = (tag, ok) => `<div class="slot ${ok ? 'ok' : ''}">${ok ? '✓' : tag}</div>`
const campo = (gol, lat, zag, mei, ata) => `<div class="campo">
  <div class="linha">${slot('ATA', ata > 0)}${slot('ATA', ata > 1)}${slot('ATA', ata > 2)}</div>
  <div class="linha">${slot('MEI', mei > 0)}${slot('MEI', mei > 1)}${slot('MEI', mei > 2)}</div>
  <div class="linha">${slot('LAT', lat > 0)}${slot('ZAG', zag > 0)}${slot('ZAG', zag > 1)}${slot('LAT', lat > 1)}</div>
  <div class="linha">${slot('GOL', gol > 0)}</div></div>`

const topo = (n, tot) => `<div class="topo"><span>🔨</span><div><b>PREGÃO ABERTO · SALA DO K9</b><small>carta ${n} de ${tot} · ordem embaralhada: ninguém sabe a próxima</small></div><div class="caixa"><b>137 🪙</b><small>SEU CAIXA</small></div></div>`

const telaA = `<div class="fone">
  ${topo(37, 220)}
  <div class="carta">
    <div class="pos">GOL</div>
    <div class="nome">Taffarel</div><div class="clube">Internacional · 1989</div>
    <div class="nivel"><span>LENDA</span> 88–94</div>
    <div class="prox">próxima carta: <b>?</b> · posição: <b>?</b></div>
  </div>
  <div class="martelo gold"><b>14 🪙</b><div><small>LANCE ATUAL</small><span>Fabulous EC 👑</span></div><div class="relogio">⏱ 6s</div></div>
  <div class="lances">${lance('Fabulous EC 👑', 'ouro', 14, true)}${lance('K9 FC 🖋', 'ouro', 13, false)}${lance('Butinas', 'bege', 11, false)}${lance('Fabulous EC 👑', 'ouro', 10, false)}</div>
  <div class="meu"><button class="b">+1 → 15</button><button class="b">+2 → 16</button><button class="b">+5 → 19</button><button class="b livre">outro valor</button></div>
  <p class="dica">Cada lance novo zera o relógio. 6s sem lance = <b>uma, duas, três… vendido!</b></p>
  ${campo(0, 1, 2, 1, 2)}
</div>`

const telaB = `<div class="fone">
  ${topo(37, 220)}
  <div class="carta vendida">
    <div class="pos">GOL</div>
    <div class="nome">Taffarel</div><div class="clube">Internacional · 1989</div>
    <div class="carimbo">VENDIDO!</div>
  </div>
  <div class="martelo green"><b>16 🪙</b><div><small>LEVOU</small><span>K9 FC 🖋</span></div><div class="relogio">🔨</div></div>
  <p class="zoeira">💸 K9 FC pagou 16 e o Fabulous ficou só olhando. "QUASE!" — era 15 e deu ruim.</p>
  <div class="meu travado"><span>🔒 Você já tem goleiro — nesta carta só assiste.</span></div>
  <p class="dica">Quem já fechou a posição não dá lance. No fim, quem ficou sem peça cai no 🃏 Monte, como sempre.</p>
  ${campo(1, 1, 2, 1, 2)}
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:14px}
.cols{display:flex;gap:26px;align-items:flex-start}
.fone{width:420px;background:#0c0c0c;border:4px solid #0C0C0C;border-radius:30px;padding:12px;box-shadow:6px 6px 0 #0C0C0C}
.fone>*{margin-bottom:10px}
.topo{display:flex;align-items:center;gap:9px;background:#0C0C0C;color:#fff;border-radius:13px;padding:8px 10px}
.topo>span{font-size:24px}.topo b{font:700 15px Oswald;text-transform:uppercase;display:block}.topo small{font-size:10px;font-weight:700;opacity:.7}
.topo .caixa{margin-left:auto;background:#FFC400;color:#0C0C0C;border:2px solid #fff;border-radius:10px;padding:4px 9px;text-align:center}.topo .caixa b{font-size:15px;line-height:1}.topo .caixa small{font-size:7px;letter-spacing:1px;opacity:1}
.carta{position:relative;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px 16px;text-align:center}
.carta .pos{position:absolute;left:12px;top:12px;font:700 13px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px}
.carta .nome{font:700 34px Oswald;text-transform:uppercase;margin-top:6px}.carta .clube{font-weight:700;opacity:.65;font-size:13px}
.carta .nivel{margin:8px auto 0;display:inline-block;font:700 15px Oswald;background:#FFE79A;border:2px solid #0C0C0C;border-radius:9px;padding:3px 10px}.carta .nivel span{color:#7C3AED;margin-right:6px}
.carta .prox{margin-top:10px;font-size:11.5px;font-weight:700;opacity:.6}.carta .prox b{display:inline-block;width:22px;height:22px;border:2px solid #0C0C0C;border-radius:6px;background:#F4ECD6;line-height:18px}
.carta.vendida .carimbo{position:absolute;right:10px;top:38px;transform:rotate(-14deg);font:700 30px Oswald;color:#C2452F;border:4px solid #C2452F;border-radius:10px;padding:0 10px;background:rgba(255,255,255,.85)}
.martelo{display:flex;align-items:center;gap:12px;border:3px solid #0C0C0C;border-radius:14px;padding:8px 12px;box-shadow:4px 4px 0 #000}
.martelo.gold{background:linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)}.martelo.green{background:#1B7A3D;color:#fff}
.martelo>b{font:700 34px Oswald;line-height:1}.martelo small{display:block;font-size:9px;font-weight:900;letter-spacing:1px;opacity:.75}.martelo span{font:700 17px Oswald;text-transform:uppercase}
.martelo .relogio{margin-left:auto;font:700 22px Oswald;background:#fff;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:10px;padding:4px 10px}
.lances{background:#fff;border:3px solid #0C0C0C;border-radius:13px;overflow:hidden}
.lan{display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1.5px solid rgba(0,0,0,.08);font-weight:700;font-size:12px}.lan:first-child{border-top:none}
.lan.ativo{background:#E9F5EC}.lan .quem{border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px;font:700 12px Oswald;text-transform:uppercase}.lan b{margin-left:auto;font:700 16px Oswald}
.meu{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.b{font:700 14px Oswald;border:3px solid #0C0C0C;border-radius:11px;padding:10px 4px;background:#FFC400;box-shadow:3px 3px 0 #000}.b.livre{background:#fff}
.meu.travado{display:block;background:#CBBF9E;border:3px solid #0C0C0C;border-radius:11px;padding:10px;text-align:center;font:700 13px Oswald;text-transform:uppercase;color:rgba(0,0,0,.6)}
.dica{margin:0;color:#fff;font-size:11px;font-weight:700;opacity:.85;text-align:center}.zoeira{margin:0;background:#7C3AED;color:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px;font-size:12px;font-weight:700}
.campo{background:repeating-linear-gradient(180deg,#1B7A3D 0 26px,#166332 26px 52px);border:3px solid #0C0C0C;border-radius:13px;padding:8px}
.linha{display:flex;justify-content:center;gap:6px;margin:4px 0}.slot{width:40px;height:28px;border:2px dashed rgba(255,255,255,.7);border-radius:8px;color:#fff;font:700 10px Oswald;display:grid;place-items:center}
.slot.ok{background:#FFC400;color:#0C0C0C;border:2px solid #0C0C0C;font-size:14px}
.leg{margin-top:18px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 16px;box-shadow:4px 4px 0 #000;font-size:13px;font-weight:700;line-height:1.5;max-width:866px}
</style></head><body>
<h1>🔨 Pregão aberto · o 3º jeito de dar lance</h1>
<p class="sub">Uma carta por vez · lance aberto, todo mundo vendo · ordem embaralhada · martelo em 6s · quem já fechou a posição só assiste</p>
<div class="cols">${telaA}${telaB}</div>
<div class="leg">À esquerda: a briga rolando — cada toque em +1/+2/+5 zera o relógio de 6s. À direita: bateu o martelo, a carta foi, e quem já tem a posição vê a trava explicada. Embaixo, o campinho mostra o que falta pra fechar o time. Monte, cerimônia e temporada continuam os de sempre.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 920, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/pregao-aberto.png', fullPage: true })
await b.close(); console.log('📸 scripts/mockups/pregao-aberto.png')
