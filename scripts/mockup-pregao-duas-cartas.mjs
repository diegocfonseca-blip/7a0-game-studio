#!/usr/bin/env node
// 🔨🔨 MOCKUP — PREGÃO ABERTO COM DUAS CARTAS NA MESA (17/10). Diego: "tá muito demorado… quanto mais pessoas jogando, mais
// lento". Proposta: duas cartas ao mesmo tempo, SEMPRE de posições diferentes, cada uma com o próprio lance e relógio.
// Carta COBERTA como hoje (sem categoria/rosto até o martelo). Corta o tempo pela metade.
// uso: node scripts/mockup-pregao-duas-cartas.mjs → scripts/mockups/pregao-duas-cartas.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const mesa = ({ pos, nome, clube, preco, lider, seg, quente, eu, trava, botoes }) => `<div class="mesa ${eu ? 'eu' : ''}">
  <div class="carta"><span class="pos">${pos}</span><span class="cat">❓ categoria</span><div class="rosto">?</div><b>${nome}</b><small>${clube}</small></div>
  <div class="lance ${quente ? 'quente' : ''}"><div><small>LANCE ATUAL</small><strong>${preco} 🪙</strong><span>${lider}</span></div><div class="rel">⏱ ${seg}s${quente ? '<em>DUAS…</em>' : ''}</div></div>
  ${trava ? `<div class="trava">🔒 ${trava}</div>` : `<div class="bts">${botoes.map(b => `<button>${b}</button>`).join('')}</div>`}
</div>`

const fone = `<div class="fone">
  <div class="topo"><span>🔨</span><div><b>PREGÃO ABERTO</b><small>cartas 37 e 38 de 220 · duas na mesa, posições diferentes</small></div><div class="caixa"><b>64 🪙</b><small>SEU CAIXA</small></div></div>
  <div class="duas">
    ${mesa({ pos: 'ZAG', nome: 'Lúcio', clube: 'Internacional · 2006', preco: 9, lider: 'Você ✋', seg: 4, eu: true, botoes: ['+1 → 10', '+2 → 11', 'outro'], trava: '' })}
    ${mesa({ pos: 'ATA', nome: 'Romário', clube: 'Vasco · 2000', preco: 14, lider: 'Leão da Estradinha', seg: 2, quente: true, botoes: ['15', '16', 'outro'] })}
  </div>
  <p class="dica">Cada carta tem o próprio relógio de 5s. Dá pra brigar pelas duas ao mesmo tempo — ou só pela que você precisa.</p>
  <div class="vend">🔨 VENDIDO! Kaká foi pro Fabulous EC por 12 · 🔨 Taffarel ficou com você por 7</div>
  <div class="campo"><div class="rot">SUA ESCALAÇÃO</div>
    <div class="ln"><i>ATA</i><i>ATA</i><i>ATA</i></div><div class="ln"><i class="ok">Zé Roberto</i><i>MEI</i><i>MEI</i></div>
    <div class="ln"><i>LAT</i><i class="ok">Aldair</i><i>ZAG</i><i>LAT</i></div><div class="ln"><i class="ok">Taffarel</i></div></div>
</div>`

const lado = `<div class="lado">
  <h2>Por que fica mais rápido</h2>
  <div class="cmp"><div class="c hoje"><small>HOJE · 1 carta por vez</small><b>~30 min</b><span>20 pessoas · 220 cartas</span></div><div class="c novo"><small>PROPOSTA · 2 na mesa</small><b>~15 min</b><span>as mesmas 220 cartas</span></div></div>
  <ul>
    <li><b>Sempre de posições diferentes</b> (ex.: zagueiro × atacante) — quem já fechou uma posição continua brigando pela outra, ninguém fica parado.</li>
    <li><b>Cada carta com o seu relógio de 5s</b>: martelou uma, a próxima entra no lugar dela na hora, sem esperar a outra.</li>
    <li><b>Mesmo motor de sempre</b>: carta coberta até o martelo, lance aberto, sem Monte, vaga vazia no fim ganha jogador de graça.</li>
    <li>Com poucas pessoas (até 6) pode continuar 1 carta por vez, que já é rápido — <b>a 2ª mesa liga sozinha a partir de 7</b>.</li>
  </ul>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:#0C0C0C;padding:24px;width:1000px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;color:#3a3a32}
.wrap{display:flex;gap:26px;align-items:flex-start}
.fone{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:28px;padding:12px;box-shadow:6px 6px 0 #0C0C0C}.fone>*{margin-bottom:10px}
.topo{display:flex;align-items:center;gap:9px;background:#0C0C0C;color:#fff;border-radius:13px;padding:8px 10px}.topo>span{font-size:22px}.topo b{font:700 15px Oswald;display:block}.topo small{font-size:9.5px;font-weight:700;opacity:.75}
.caixa{margin-left:auto;background:#FFC400;color:#0C0C0C;border:2px solid #fff;border-radius:10px;padding:3px 8px;text-align:center}.caixa b{font-size:14px}.caixa small{display:block;font-size:7px;letter-spacing:1px;opacity:1}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mesa{background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:7px;display:flex;flex-direction:column;gap:6px}.mesa.eu{box-shadow:0 0 0 3px #1B7A3D,3px 3px 0 #0C0C0C}
.carta{position:relative;background:repeating-linear-gradient(135deg,#E9DFC4 0 10px,#DED2B2 10px 20px);border:3px solid #0C0C0C;border-radius:11px;padding:28px 8px 8px;text-align:left}
.carta .pos{position:absolute;left:6px;top:6px;font:700 11px Oswald;background:#0C0C0C;color:#fff;border-radius:6px;padding:1px 6px}.carta .cat{position:absolute;right:6px;top:6px;font:700 9px Oswald;background:#fff;border:1.5px solid #0C0C0C;border-radius:6px;padding:1px 5px}
.rosto{width:54px;height:54px;margin:0 auto 6px;border:3px dashed #8a7d5c;border-radius:999px;display:grid;place-items:center;font:700 26px Oswald;color:#8a7d5c}
.carta b{font:700 17px Oswald;display:block}.carta small{font-size:10px;font-weight:700;color:#53534b}
.lance{display:flex;align-items:center;gap:6px;background:linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200);border:2px solid #0C0C0C;border-radius:10px;padding:5px 7px}.lance.quente{background:#E8503A;color:#fff}
.lance small{display:block;font-size:7.5px;font-weight:900;letter-spacing:1px;opacity:.8}.lance strong{font:700 20px Oswald;display:block;line-height:1}.lance span{font:700 10px Oswald;text-transform:uppercase}
.rel{margin-left:auto;background:#fff;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:8px;padding:2px 6px;font:700 13px Oswald;text-align:center}.rel em{display:block;font-style:normal;font-size:7px}
.bts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px}.bts button{font:700 11px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:7px 2px;background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}.bts button:last-child{background:#fff}
.trava{background:#CBBF9E;border:2px solid #0C0C0C;border-radius:8px;padding:7px;font:700 10px Oswald;text-align:center;text-transform:uppercase}
.dica{margin:0;font-size:11px;font-weight:700;color:#53534b;text-align:center}
.vend{background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:7px 9px;font-size:11.5px;font-weight:700}
.campo{background:repeating-linear-gradient(180deg,#1B7A3D 0 24px,#166332 24px 48px);border:3px solid #0C0C0C;border-radius:13px;padding:6px 8px 8px}.rot{text-align:center;font:700 10px Oswald;color:#fff;opacity:.8;letter-spacing:1px;margin-bottom:2px}
.ln{display:flex;justify-content:center;gap:6px;margin:5px 0}.ln i{font-style:normal;min-width:58px;padding:4px 4px;border:2px dashed rgba(255,255,255,.7);border-radius:8px;color:#fff;font:700 10px Oswald;text-align:center}.ln i.ok{background:#FFC400;color:#0C0C0C;border:2px solid #0C0C0C}
.lado{flex:1}.lado h2{font:700 22px Oswald;text-transform:uppercase;margin:0 0 10px}
.cmp{display:flex;gap:10px;margin-bottom:12px}.c{flex:1;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;text-align:center}.c small{display:block;font:700 11px Oswald;letter-spacing:.5px}.c b{display:block;font:700 34px Oswald}.c span{font-size:11px;font-weight:700}
.c.hoje{background:#fff}.c.novo{background:#1B7A3D;color:#fff}
ul{margin:0;padding:0;list-style:none}li{background:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px 11px;margin-bottom:9px;font-size:13px;font-weight:600;line-height:1.4}
</style></head><body><h1>🔨🔨 Pregão aberto · duas cartas na mesa</h1><p class="sub">Pra não arrastar quando a sala enche: duas cartas ao mesmo tempo, de posições diferentes.</p>
<div class="wrap">${fone}${lado}</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `pa2-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/pregao-duas-cartas.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/pregao-duas-cartas.png')
