#!/usr/bin/env node
// 🎨 MOCKUP — VITRINE DO SÓCIO (14/10)
// Ideia aprovada pra mockup: o Sócio (mensal) escolhe 1 escudo, 1 mascote e 1 manto de uma vitrine PRONTA (igual pra
// todo sócio, feita uma vez só, sem trabalho por pessoa). Parou de pagar → some. Abre só no 2º mês pago (trava contra
// "paga 1 mês e cancela"). Batismo continua sendo a arte ÚNICA, só dela e pra sempre.
// ⚠️ As artes aqui são de EXEMPLO (CSS + emoji). A final vira .webp gerado, seguindo a regra de peso.
// uso: node scripts/mockup-vitrine-socio.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')

const ESC = [['🦁', '#1B7A3D', '#FFC400'], ['🦅', '#0C0C0C', '#F4ECD6'], ['⚡', '#7C3AED', '#FFC400'], ['🐺', '#3A4A5C', '#E8E8E8'],
  ['🔥', '#C2452F', '#FFC400'], ['⭐', '#0E3E86', '#F4ECD6'], ['🐉', '#1B7A3D', '#C2452F'], ['⚓', '#0E3E86', '#E8503A'], ['🐂', '#5A3A1E', '#FFC400']]
const MAS = ['🦁', '🦅', '🐺', '🐊', '🦈', '🐯', '🐂', '🦉', '🐍']
const MAN = [['#1B7A3D', '#F4ECD6'], ['#0C0C0C', '#FFFFFF'], ['#C2452F', '#0C0C0C'], ['#0E3E86', '#FFFFFF'], ['#7C3AED', '#FFC400'],
  ['#FFC400', '#0C0C0C'], ['#E8503A', '#FFFFFF'], ['#3A4A5C', '#E8E8E8'], ['#1B7A3D', '#FFC400']]

const escudo = ([ic, c1, c2], sz = 54) => `<div class="esc" style="width:${sz}px;height:${sz * 1.15}px;background:linear-gradient(90deg,${c1} 50%,${c2} 50%)"><span style="font-size:${sz * .45}px">${ic}</span></div>`
const manto = ([c1, c2], sz = 54) => `<div class="man" style="width:${sz}px;height:${sz}px;background:repeating-linear-gradient(90deg,${c1} 0 ${sz / 6}px,${c2} ${sz / 6}px ${sz / 3}px)"></div>`
const cel = (inner, sel, lock) => `<div class="cel ${sel ? 'sel' : ''} ${lock ? 'lk' : ''}">${inner}${sel ? '<em>✓</em>' : ''}</div>`

const preview = `<div class="prev"><div class="pv-esc">${escudo(ESC[0], 64)}</div><div class="pv-txt"><b>LEÃO DA ESTRADINHA</b><small>como os outros vão ver o seu clube</small><div class="pv-row">${manto(MAN[0], 34)}<span class="pv-mas">🦁</span><span class="tag">SÓCIO</span></div></div></div>`

const tela1 = `<div class="tela">
<h1>🎽 Vitrine do Sócio</h1><p class="sub">Escolha a cara do seu clube: 1 escudo, 1 mascote e 1 manto.</p>
<div class="trava"><b>🔒 Abre no seu 2º mês de sócio</b><p>Você está no 1º mês. Daqui a <b>18 dias</b>, quando renovar, a vitrine abre e você escolhe.</p>
<div class="bar"><div class="fill" style="width:40%"></div></div><small>1º mês ━━━━ 2º mês 🔓</small></div>
<div class="box"><div class="tabs"><span class="on">🛡️ ESCUDO</span><span>🐾 MASCOTE</span><span>👕 MANTO</span></div>
<div class="grid">${ESC.map(e => cel(escudo(e), false, true)).join('')}</div></div>
<p class="obs">Dá pra olhar tudo desde já. Escolher, só a partir do 2º mês.</p></div>`

const tela2 = `<div class="tela">
<h1>🎽 Vitrine do Sócio</h1><p class="sub">Escolha a cara do seu clube: 1 escudo, 1 mascote e 1 manto.</p>
${preview}
<div class="box"><div class="tabs"><span class="on">🛡️ ESCUDO</span><span>🐾 MASCOTE</span><span>👕 MANTO</span></div>
<div class="grid">${ESC.map((e, i) => cel(escudo(e), i === 0)).join('')}</div>
<button class="btn">✓ USAR ESTE ESCUDO</button>
<p class="obs2">Pode trocar quando quiser, quantas vezes quiser.</p></div>
<div class="aviso">⏳ Vale enquanto você for sócio. Se o plano parar, o clube volta pro visual normal. Volta a pagar, a sua escolha volta.</div>
<div class="comp"><div class="c1"><b>⭐ SÓCIO · R$ 9,90/mês</b><p>Arte <b>da vitrine</b>, igual pra todo sócio. Vale enquanto pagar.</p></div>
<div class="c2"><b>🖋️ BATISMO · R$ 79,90</b><p>Arte <b>feita só pra você</b>, nome reservado e é <b>pra sempre</b>.</p></div></div></div>`

const tela3 = `<div class="tela">
<h1>🐾 Aba Mascote</h1><p class="sub">A mascote que pula no gol, na festa de campeão e no pênalti.</p>
<div class="box"><div class="tabs"><span>🛡️ ESCUDO</span><span class="on">🐾 MASCOTE</span><span>👕 MANTO</span></div>
<div class="grid">${MAS.map((m, i) => cel(`<span class="mas">${m}</span>`, i === 0)).join('')}</div></div>
<h1 style="margin-top:14px">👕 Aba Manto</h1><p class="sub">As cores do seu time no campinho e no placar.</p>
<div class="box"><div class="tabs"><span>🛡️ ESCUDO</span><span>🐾 MASCOTE</span><span class="on">👕 MANTO</span></div>
<div class="grid">${MAN.map((m, i) => cel(manto(m), i === 0)).join('')}</div></div>
<p class="obs">⚠️ Artes de EXEMPLO. As de verdade são geradas uma vez só (~10 de cada) e servem pra todo sócio.</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:1350px;align-items:flex-start}
.tela{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
h1{font:700 28px/1 Oswald;text-transform:uppercase;margin:0}.sub{font-size:13px;font-weight:600;color:#3a3a32;margin:6px 0 12px}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;margin-bottom:12px}
.tabs{display:flex;gap:6px;margin-bottom:10px}.tabs span{flex:1;text-align:center;font:700 13px Oswald;border:3px solid #0C0C0C;border-radius:10px;padding:6px 0;background:#F4ECD6}.tabs .on{background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cel{position:relative;height:88px;display:flex;align-items:center;justify-content:center;border:3px solid #0C0C0C;border-radius:12px;background:#F4ECD6}
.cel.sel{background:#FFF3C4;border-color:#0C0C0C;box-shadow:0 0 0 3px #FFC400,3px 3px 0 #0C0C0C}.cel em{position:absolute;top:-8px;right:-8px;background:#1B7A3D;color:#fff;font-style:normal;font:700 13px Oswald;border:2px solid #0C0C0C;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
.cel.lk>*{filter:grayscale(.6);opacity:.55}.cel.lk::after{content:'🔒';position:absolute;bottom:4px;right:6px;font-size:14px}
.esc{border:3px solid #0C0C0C;border-radius:8px 8px 50% 50%/8px 8px 40% 40%;display:flex;align-items:center;justify-content:center}
.man{border:3px solid #0C0C0C;border-radius:10px 10px 6px 6px;clip-path:polygon(22% 0,78% 0,100% 18%,88% 34%,80% 28%,80% 100%,20% 100%,20% 28%,12% 34%,0 18%)}
.mas{font-size:44px}
.trava{background:#14251a;color:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;margin-bottom:12px}.trava>b{font:700 18px Oswald;color:#FFC400;text-transform:uppercase}.trava p{font-size:13px;margin:6px 0 8px;line-height:1.4}.trava small{font:500 11px Oswald;letter-spacing:.06em;opacity:.8}
.bar{height:14px;border:2px solid #0C0C0C;border-radius:8px;background:#F4ECD6;margin-bottom:4px;overflow:hidden}.fill{height:100%;background:repeating-linear-gradient(135deg,#1B7A3D 0 10px,#239a4e 10px 20px)}
.prev{display:flex;gap:12px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px;margin-bottom:12px}.pv-txt b{font:700 18px Oswald;display:block}.pv-txt small{font-size:11px;color:#53534b;font-weight:600}.pv-row{display:flex;gap:8px;align-items:center;margin-top:6px}.pv-mas{font-size:28px}
.tag{font:700 11px Oswald;letter-spacing:.1em;background:linear-gradient(135deg,#1B7A3D,#2fae5c);color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:2px 7px}
.btn{width:100%;margin-top:10px;font:700 17px Oswald;text-transform:uppercase;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px}
.obs{font-size:11px;color:#53534b;font-weight:600;margin:4px 2px 0}.obs2{font-size:11px;color:#53534b;font-weight:600;text-align:center;margin:6px 0 0}
.aviso{background:#FFF3C4;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px 11px;font-size:12px;font-weight:600;line-height:1.4;margin-bottom:12px}
.comp{display:flex;gap:8px}.comp>div{flex:1;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px}.comp>div>b{font:700 13px Oswald;display:block}.comp p{font-size:11px;margin:4px 0 0;line-height:1.35}.c1{background:#e6f4ea}.c2{background:linear-gradient(135deg,#FFE37A,#FFC400)}
</style></head><body>${tela1}${tela2}${tela3}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1350, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `vitrine-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/vitrine-socio.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/vitrine-socio.png')
