#!/usr/bin/env node
// 🎨 MOCKUP — DUPLA: QUEM CONVOCA (15/10)
// Bug da sala do Futpoint (dupla Futpoint + Cativeiro): no Rio × SP cada um escolheu um clube, porque a Copa do
// Mundo/regional online não sabia de dupla. Diego: *"poderia ter na opção lá quando escolhe atacante, zag e etc… quando
// tiver convocação no modo escolhido… e quando alguém tiver convocando tem que aparecer pro outro quem tá convocando"*.
// 3 telas: sala de espera (a escolha junto das posições) · fila da escolha · a tela do parceiro durante a convocação.
// uso: node scripts/mockup-dupla-convoca.mjs → scripts/mockups/dupla-convoca.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const G = '#1B7A3D'
const cat = (ic, t, meu, outro) => `<div class="ct ${meu ? 'meu' : outro ? 'out' : ''}"><span>${ic}</span>${t}</div>`

const tela1 = `<div class="tela">
<div class="th"><h1>Sala de espera</h1><span class="tag">🤝 DUPLAS · 🏟️ RIO × SP</span></div>
<div class="du">
  <div class="dn"><b>FUTPOINT NO CATIVEIRO FC</b><small>Futpoint (você) + Cativeiro</small></div>
  <div class="lb">✋ QUEM CUIDA DE QUÊ · dividido ✅</div>
  <div class="g3">${cat('🧤', 'Goleiro', 1)}${cat('🏃', 'Lateral', 0, 1)}${cat('🛡️', 'Zagueiro', 1)}${cat('🎩', 'Meia', 0, 1)}${cat('⚽', 'Atacante', 1)}${cat('📦', 'Monte', 0, 1)}</div>
  <div class="novo">
    <div class="lb">🏳️ QUEM ESCOLHE O CLUBE E CONVOCA <em>NOVO</em></div>
    <div class="g2"><div class="ct meu big">🙋 EU<small>Futpoint</small></div><div class="ct big">🤝 PARCEIRO<small>Cativeiro</small></div></div>
    <p class="ex">Vale pro <b>Rio × SP</b> e pra <b>Copa do Mundo</b>. Só um escolhe e convoca; o outro assiste ao vivo. Se ninguém marcar, quem criou a dupla convoca.</p>
  </div>
</div>
<p class="obs">👆 Só aparece quando a sala tem convocação (Copa do Mundo ou copa regional). Sala sem convocação = tudo igual a hoje.</p>
</div>`

const linha = (n, nome, extra, dir, cls = '') => `<div class="fl ${cls}"><i>${n}º</i><div class="fn"><b>${nome}</b>${extra ? `<small>${extra}</small>` : ''}</div><span>${dir}</span></div>`
const tela2 = `<div class="tela">
<div class="th"><h1>🏟️ Rio × São Paulo</h1></div>
<div class="vez">● Futpoint está escolhendo o clube pela dupla · 28s</div>
<div class="fila">
  <div class="fh">🥇 QUEM TERMINOU NA FRENTE ESCOLHE PRIMEIRO</div>
  ${linha(1, 'Lukedemos', '', '<em class="ok">Santos</em>')}
  ${linha(2, 'City de verdade', '', '<em class="ok">Vasco</em>')}
  ${linha(3, 'Futpoint no cativeiro FC', '🏳️ <u>Futpoint escolhe</u> · 🤝 Cativeiro assiste', '<em class="rel">⏳ 28s</em>', 'vz')}
  ${linha(4, 'Real do Gui', '', 'na fila')}
  ${linha(5, 'Gui|Palmolego', '🏳️ Gui escolhe · 🤝 Palmolego', 'na fila')}
  ${linha(6, 'Vou te come|NEYMAR_FC', '🏳️ NEYMAR_FC escolhe · 🤝 Vou te come', 'na fila')}
</div>
<p class="obs">A dupla aparece <b>uma vez só</b> na fila, com os dois nomes: quem escolhe e quem acompanha. Ninguém mais escolhe na vez de outra dupla.</p>
</div>`

const bol = (t, v = '') => `<div class="bo ${v ? 'cheia' : ''}">${v || '+'}</div><div class="bl">${t}</div>`
const tela3 = `<div class="tela">
<div class="vista">👀 <b>Futpoint está convocando pela dupla</b><small>Você é dupla dele — acompanha ao vivo. As escolhas aparecem aqui na hora.</small></div>
<div class="conv"><div><b>CONVOCAÇÃO · VOLTA REDONDA</b><small>por Futpoint · 🤝 com você (Cativeiro)</small></div><div class="cnt">7/11</div></div>
<div class="campo">
  <div class="lin">${['Nenê', 'Luiz Henrique'].map(n => `<div class="pp">${bol('ATA', n)}</div>`).join('')}</div>
  <div class="lin">${['Bruno', '+', 'Dudu', '+'].map(n => `<div class="pp">${bol('MEI', n === '+' ? '' : n)}</div>`).join('')}</div>
  <div class="lin">${['+', 'Gil', 'Reginaldo', '+'].map((n, i) => `<div class="pp">${bol(i % 3 ? 'ZAG' : 'LAT', n === '+' ? '' : n)}</div>`).join('')}</div>
  <div class="lin"><div class="pp">${bol('GOL', 'Jefferson')}</div></div>
</div>
<div class="rel2">⏱️ 41s pra fechar a convocação</div>
<p class="obs">Na tela de quem NÃO convoca, os botões ficam travados com o aviso de quem manda — igual ao leilão da dupla. Pra sala, o placar e a tabela mostram o nome da dupla, como sempre.</p>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:1350px;align-items:flex-start}
.tela{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
h1{font:700 26px/1 Oswald;text-transform:uppercase;margin:0}.th{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}
.tag{font:700 11px Oswald;background:#0C0C0C;color:#FFC400;border-radius:8px;padding:3px 7px;white-space:nowrap}
.du{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px}
.dn b{font:700 20px Oswald;display:block}.dn small{font-size:12px;font-weight:700;color:#53534b}
.lb{font:700 11.5px Oswald;letter-spacing:.04em;color:#53534b;margin:12px 0 6px;display:flex;align-items:center;gap:6px}.lb em{font-style:normal;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:0 5px;font-size:10px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ct{border:2px solid #0C0C0C;border-radius:9px;padding:6px 4px;text-align:center;font:700 11.5px Oswald;background:#fff}.ct span{display:block;font-size:15px}
.ct.meu{background:${G};color:#fff}.ct.out{background:#e6dcbf;color:rgba(0,0,0,.45)}
.ct.big{font-size:16px;padding:9px 4px;box-shadow:2px 2px 0 #0C0C0C}.ct.big small{display:block;font:700 11px Oswald;opacity:.8}
.novo{margin-top:12px;border:3px dashed #C2452F;border-radius:13px;padding:2px 10px 10px;background:#FFF8E6}
.ex{font-size:11.5px;font-weight:600;color:#3a3a32;margin:8px 0 0;line-height:1.4}
.obs{font-size:11.5px;color:#53534b;font-weight:600;margin:10px 2px 0;line-height:1.45}
.vez{font:700 13px Oswald;background:#0C0C0C;color:#F4ECD6;border-radius:10px;padding:8px 10px;margin-bottom:10px}
.fila{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:10px}
.fh{font:700 12px Oswald;color:#53534b;margin-bottom:6px}
.fl{display:flex;align-items:center;gap:8px;padding:7px 6px;border-top:1px solid #eee}.fl i{font-style:normal;font:700 14px Oswald;color:#8a8577;width:22px}.fn{flex:1;min-width:0}.fn b{font:700 15px Oswald;display:block}.fn small{font-size:10.5px;font-weight:600;color:#53534b}.fn small u{text-decoration:none;font-weight:800;color:#0C0C0C}.fl>span{font:700 12px Oswald;color:#8a8577}
.fl.vz{background:#FFF3C4;border-radius:10px;border:2px solid #E8A200}.ok{font-style:normal;color:${G};font-size:15px}.rel{font-style:normal;color:#C2452F;font-size:14px}
.vista{background:#7C3AED;color:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px}.vista b{font:700 17px Oswald;display:block}.vista small{font-size:11.5px;font-weight:600;opacity:.92}
.conv{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#0C0C0C;color:#fff;border-radius:14px;padding:10px 12px;margin-top:10px}.conv b{font:700 16px Oswald;display:block}.conv small{font-size:11px;opacity:.8}.cnt{font:700 22px Oswald;background:#FFC400;color:#0C0C0C;border-radius:10px;padding:4px 10px}
.campo{background:repeating-linear-gradient(180deg,#1f8a45 0 46px,#1B7A3D 46px 92px);border:3px solid #0C0C0C;border-radius:14px;margin-top:10px;padding:10px 6px}
.lin{display:flex;justify-content:space-around;margin:6px 0}.pp{text-align:center;width:80px}
.bo{width:44px;height:44px;margin:0 auto;border-radius:50%;border:2px dashed rgba(255,255,255,.8);color:#fff;font:700 18px Oswald;display:flex;align-items:center;justify-content:center}
.bo.cheia{border:2px solid #0C0C0C;background:#F4ECD6;color:#0C0C0C;font-size:9.5px;line-height:1;padding:2px;text-align:center}
.bl{display:inline-block;margin-top:3px;font:700 10px Oswald;background:#0C0C0C;color:#fff;border-radius:5px;padding:1px 5px}
.rel2{margin-top:10px;font:700 15px Oswald;text-align:center;background:#FFF3C4;border:2px solid #0C0C0C;border-radius:10px;padding:6px}
</style></head><body>${tela1}${tela2}${tela3}</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1350, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `dupla-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/dupla-convoca.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/dupla-convoca.png')
