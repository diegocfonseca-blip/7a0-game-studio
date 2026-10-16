#!/usr/bin/env node
// 🎨 MOCKUP — LOJA DO CLUBE: FICHA EXTRA + IDEIAS NOVAS (16/10)
// Diego: "ficha avulsa R$ 14,90… quero mais coisas, mais ideias". A ficha está DECIDIDA; o resto é proposta pra ele
// escolher. Regra de todas: nada dá vantagem em sala online (só visual/zoeira) e nada repete o que ele já cortou
// (cor do nome, gala avulsa, peça de Fundador avulsa).
// uso: node scripts/mockup-loja-ideias.mjs  →  scripts/mockups/loja-ideias.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')

const ideia = (n, ic, t, d, onde, p) => `<div class="id"><span class="n">${n}</span><div class="ic">${ic}</div><div class="tx"><b>${t}</b><small>${d}</small><em>${onde}</em></div><div class="pr">R$ ${p}</div></div>`

const tela1 = `<div class="tela">
<div class="th"><h1>🛒 Loja do Clube</h1><span class="eu">⭐ VOCÊ É CRAQUE</span></div>
<h2>💾 Ficha extra de carreira <small>✅ decidido</small></h2>
<div class="ficha">
  <div class="fi">💾</div>
  <div class="ft"><b>+1 carreira guardada</b><small>Seu plano deixa 2. Com a ficha extra você joga 3 carreiras ao mesmo tempo, sem apagar nenhuma. É sua pra sempre.</small>
  <div class="sl"><span class="on">1</span><span class="on">2</span><span class="nv">+3</span></div></div>
  <div class="pr big">R$ 14,90</div>
</div>
<p class="obs">Pode comprar mais de uma. Cai na hora pelo Pix, igual às salas extras.</p>
<div class="hint">👉 Do lado: as ideias novas pra você escolher. Os preços são sugestão.</div>
</div>`

const tela2 = `<div class="tela larga">
<h1 style="font-size:24px">💡 Ideias novas pra Loja</h1>
<p class="sub">Todas são <b>visual e zoeira</b>. Nenhuma dá vantagem em sala online.</p>
${ideia(1, '🔨', 'Frase do martelo', 'Quando você arremata, aparece a SUA frase no "VENDIDO!" pra sala toda ver.', 'online e carreira', '4,90')}
${ideia(2, '🔊', 'Pacote de áudios de zoeira', '3 áudios novos no "Zoa a galera", do lado do "SIIIUU" e do "Posso te ligar?". Pacote muda todo mês.', 'sala online', '4,90')}
${ideia(3, '💬', 'Figurinhas do chat', '10 figurinhas exclusivas pra mandar no chat da sala (zoeira de leilão, de goleada, de rebaixado).', 'sala online', '3,90')}
${ideia(4, '📰', 'Sua capa do O MARTELO', 'Foi campeão? Você escreve a manchete da capa e o seu presidente aparece nela. Vale um título.', 'carreira e online', '4,90')}
${ideia(5, '🧑‍💼', 'Vitrine do presidente', 'Toda semana 4 peças avulsas pro boneco: cabelo de craque R$ 2,90, roupa especial R$ 4,90. Peça de Fundador nunca entra.', 'Loja', '2,90+')}
${ideia(6, '🎁', 'Presente de avulso', 'Dar sala extra, ficha ou áudio pra um amigo, não só plano.', 'Loja', 'o do item')}
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:1010px;align-items:flex-start}
.tela{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}.tela.larga{width:536px}
h1{font:700 28px/1.05 Oswald;text-transform:uppercase;margin:0}h2{font:700 19px/1 Oswald;text-transform:uppercase;margin:18px 0 8px;display:flex;justify-content:space-between;align-items:baseline}h2 small{font:700 11px Arial;text-transform:none;color:#1B7A3D}
.th{display:flex;justify-content:space-between;align-items:center;gap:8px}.eu{font:700 11px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:4px 7px;box-shadow:2px 2px 0 #0C0C0C;background:linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)}
.sub{font-size:13px;font-weight:600;color:#3a3a32;margin:6px 0 10px}
.ficha{display:flex;gap:10px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:12px}
.fi{font-size:36px}.ft{flex:1}.ft b{font:700 17px Oswald;text-transform:uppercase;display:block}.ft small{font-size:11.5px;font-weight:700;line-height:1.35;display:block;color:#3a3a32}
.sl{display:flex;gap:6px;margin-top:8px}.sl span{font:700 13px Oswald;width:34px;height:28px;display:grid;place-items:center;border:2px solid #0C0C0C;border-radius:8px}.sl .on{background:#F4ECD6}.sl .nv{background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}
.pr{font:700 15px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:6px 10px;box-shadow:2px 2px 0 #0C0C0C;white-space:nowrap}.pr.big{font-size:18px}
.obs{font-size:11px;color:#53534b;font-weight:700;margin:8px 2px 0}
.hint{margin-top:16px;background:#FFF3C4;border:3px solid #0C0C0C;border-radius:12px;padding:9px 11px;font:700 13px Oswald;text-transform:uppercase}
.id{position:relative;display:flex;gap:10px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px 10px 14px;margin-bottom:9px}
.id .n{position:absolute;left:-9px;top:-9px;width:24px;height:24px;border-radius:999px;background:#0C0C0C;color:#FFC400;font:700 13px Oswald;display:grid;place-items:center}
.ic{font-size:30px}.tx{flex:1}.tx b{font:700 16px Oswald;text-transform:uppercase;display:block}.tx small{font-size:11.5px;font-weight:700;line-height:1.35;display:block;color:#3a3a32}.tx em{font-style:normal;font-size:10px;font-weight:900;color:#7C3AED;text-transform:uppercase;letter-spacing:.5px}
</style></head><body>${tela1}${tela2}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1010, height: 700 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `loja-ideias-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/loja-ideias.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/loja-ideias.png')
