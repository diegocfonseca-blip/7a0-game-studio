#!/usr/bin/env node
// 🎨 MOCKUP — CAMPINHO DO MODO REIS (estilo Kings League Brasil) NO LEILÃO (15/10)
// Diego: *"como é o campinho da kings league pra aparecer no leilão, igual já fizemos com basquete, mas agora de
// futebol da kings"*. Futebol 7: 1 goleiro + 6 (2 ZAG · 2 MEI · 2 ATA), gramado sintético de arena com placas em
// volta. Do lado, a quadra do BidLegends como já é (`NbaCourt`, screens.tsx), pra comparar. Nada da arte/marca deles.
// uso: node scripts/mockup-campinho-reis.mjs → scripts/mockups/campinho-reis.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const ROXO = 'linear-gradient(160deg,#C9A8FF,#7C3AED)'
const VERDE = 'linear-gradient(160deg,#9BE0B0,#2E9E58)'
const vaga = (x, y, pos, nome = '', grad = '', em = '') => `<div class="vg" style="left:${x}%;top:${y}%"><div class="vc ${nome ? '' : 'vz'}" style="${nome ? `background:${grad}` : ''}"><span>${pos}</span>${nome ? `<b>${nome}</b><i>${em}</i>` : '<em>Vazio</em>'}</div></div>`

const campoReis = `<div class="campo">
  <div class="placas top">MODO REIS · 👑 · MODO REIS · 👑 · MODO REIS</div>
  <div class="placas bot">LEILÃO LEGENDS · 🔨 · LEILÃO LEGENDS · 🔨</div>
  <svg viewBox="0 0 100 130" preserveAspectRatio="none">
    <g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="0.9">
      <rect x="6" y="8" width="88" height="114" rx="2"/>
      <line x1="6" y1="65" x2="94" y2="65"/>
      <circle cx="50" cy="65" r="11"/>
      <rect x="28" y="8" width="44" height="17"/>
      <rect x="28" y="105" width="44" height="17"/>
      <rect x="40" y="5" width="20" height="3" fill="rgba(255,255,255,.25)"/>
      <rect x="40" y="122" width="20" height="3" fill="rgba(255,255,255,.25)"/>
    </g>
    <circle cx="50" cy="20" r="0.9" fill="#fff"/><circle cx="50" cy="110" r="0.9" fill="#fff"/>
  </svg>
  <div class="selo"><b>MODO<br>REIS</b><span>👑</span></div>
  ${vaga(32, 22, 'ATA', 'Romário', OURO, '👑')}${vaga(68, 22, 'ATA')}
  ${vaga(24, 45, 'MEI', 'Djalminha', ROXO, '⭐')}${vaga(76, 45, 'MEI')}
  ${vaga(30, 68, 'ZAG', 'Aldair', VERDE, '🎯')}${vaga(70, 68, 'ZAG')}
  ${vaga(50, 85, 'GOL', 'Marcos', ROXO, '⭐')}
</div>`

const quadra = `<div class="quadra">
  <svg viewBox="0 0 100 118" preserveAspectRatio="none"><rect x="37" y="3" width="26" height="40" fill="#E8703A" fill-opacity=".92"/>
  <g fill="none" stroke="rgba(20,12,4,.55)" stroke-width="1.1"><rect x="3" y="3" width="94" height="112" rx="3"/><rect x="37" y="3" width="26" height="40"/><circle cx="50" cy="43" r="12"/><path d="M14 3 L14 26 A 36 36 0 0 0 86 26 L86 3"/><path d="M30 115 A 20 20 0 0 1 70 115"/></g></svg>
  <div class="selo q"><b>BID<br>LEGENDS</b><span>🏀</span></div>
  ${vaga(62, 22, 'C')}${vaga(38, 22, 'PF')}${vaga(19, 50, 'SF')}${vaga(81, 50, 'SG')}${vaga(50, 84, 'PG')}
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:flex;gap:22px;padding:22px;width:900px;align-items:flex-start}
.col{width:420px}.col h2{font:700 20px Oswald;text-transform:uppercase;margin:0 0 4px}.col p{font-size:12px;font-weight:600;color:#53534b;margin:0 0 10px;line-height:1.4}
.tela{background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:14px}
.lb{font:700 13px Oswald;text-transform:uppercase;margin:0 0 8px;color:#53534b}
.campo,.quadra{position:relative;width:100%;max-width:340px;margin:0 auto;border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 #0C0C0C}
.campo{aspect-ratio:1/1.3;background:repeating-linear-gradient(180deg,#1f8f4a 0 9%,#1a8042 9% 18%);}
.quadra{aspect-ratio:1/1.18;background:linear-gradient(180deg,#E7BE85,#DFB074 55%,#D7A566)}
svg{position:absolute;inset:0;width:100%;height:100%}
.placas{position:absolute;left:0;right:0;height:5.5%;background:#111;color:#FFC400;font:700 10px/1 Oswald;letter-spacing:.18em;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;z-index:2}.placas.top{top:0}.placas.bot{bottom:0}
.selo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:92px;height:92px;border-radius:50%;border:3px solid rgba(255,255,255,.55);background:rgba(0,0,0,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:rgba(255,255,255,.9)}.selo b{font:700 14px/.95 Oswald}.selo span{font-size:18px}
.selo.q{top:56%;width:110px;height:110px;border-color:rgba(12,12,12,.45);background:rgba(232,112,58,.13);color:rgba(12,12,12,.8)}
.vg{position:absolute;transform:translate(-50%,-50%);width:80px;text-align:center;z-index:3}
.vc{border:3px solid #0C0C0C;border-radius:11px;box-shadow:2px 3px 0 #0C0C0C;padding:4px 4px 5px;background:#fff}.vc.vz{background:rgba(255,255,255,.4);border-style:dashed;box-shadow:none}
.vc span{display:inline-block;font:700 10px Oswald;background:#0C0C0C;color:#fff;border-radius:6px;padding:1px 7px;margin-bottom:2px}.vc.vz span{background:rgba(0,0,0,.55)}
.vc b{display:block;font:700 12.5px/1 Oswald}.vc i{font-style:normal;font-size:11px}.vc em{display:block;font-style:normal;font:700 11px Oswald;color:rgba(12,12,12,.7)}
.ok{margin-top:10px;font-size:11.5px;font-weight:700;background:#fff;border:2px solid #0C0C0C;border-radius:10px;padding:7px 9px;line-height:1.45}
</style></head><body>
<div class="col"><h2>⚽👑 Modo Reis — novo</h2><p>Futebol 7: <b>1 goleiro + 6</b> (2 zagueiros, 2 meias, 2 atacantes). Gramado sintético de arena, gol pequeno, placas em volta. Aparece no lugar do campinho de 11, só nas salas do Modo Reis.</p>
<div class="tela"><div class="lb">🔨 Seu time no leilão · 4/7</div>${campoReis}
<div class="ok">✅ Mesmas cartas, mesmas cores de nível (👑 lenda · ⭐ craque · 🎯 bom). Só muda o desenho do campo e o número de vagas.</div></div></div>
<div class="col"><h2>🏀 BidLegends — como já é</h2><p>A quadra do basquete que já existe no leilão (5 vagas), só pra comparar o padrão.</p>
<div class="tela"><div class="lb">🔨 Seu time no leilão</div>${quadra}</div></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `reis-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/campinho-reis.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/campinho-reis.png')
