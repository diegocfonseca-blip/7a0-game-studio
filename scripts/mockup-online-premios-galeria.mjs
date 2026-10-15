#!/usr/bin/env node
// 🎨 MOCKUP — 🏅 PRÊMIOS DA NOITE (fim de toda sala online) + 🏛️ GALERIA DA MINHA LIGA (14/10). Só pra ver; não é pra fazer.
// Os prêmios saem dos dados do próprio leilão (lances, preços, níveis revelados) — ninguém aperta nada a mais.
// Nomes de exemplo. uso: node scripts/mockup-online-premios-galeria.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'
const premio = (e, t, quem, g, det) => `<div class="pr"><div class="pe">${e}</div><div class="pt"><b>${t}</b><div class="quem" style="background:${g}">${quem}</div><small>${det}</small></div></div>`
const premios = `<div class="tela"><div class="num">1</div><h1>🏅 Prêmios da noite</h1><p class="sub">Aparece no fim de TODA sala, depois do campeão. Sai sozinho do leilão.</p>
<div class="noite"><p class="cab">SALA 7XK2PA · 14/10 · 6 TÉCNICOS</p>
${premio('💸', 'Pagou Mais Caro', 'BOLACHA FC ⭐', PRATA, 'Pelé por 412 — o dobro do 2º lance')}
${premio('🎯', 'Maior Pechincha', 'LEÃO DA ESTRADINHA 👑', OURO, 'Romário por 18 · revelou nível 91')}
${premio('🤡', 'Comprou Perna de Pau', 'ZÉ DA VÁRZEA', BEGE, 'Zé Ninguém por 140 · nível 41')}
${premio('🧊', 'Mão de Vaca', 'NATA DE SP 👑', OURO, 'gastou só 38% do caixa')}
${premio('🔥', 'Rei do Envelope', 'LEÃO DA ESTRADINHA 👑', OURO, 'ganhou 9 de 11 disputas')}
</div>
<div class="botoes"><span>📲 MANDAR NO GRUPO</span><span class="sec">FECHAR</span></div>
<p class="obs">5 prêmios por sala, sorteados entre ~12 possíveis pra nunca ficar repetido. Ninguém espera: aparece na tela de fim que já existe.</p></div>`

const galeria = `<div class="tela"><div class="num">2</div><h1>🏛️ Galeria da Minha Liga</h1><p class="sub">Cada temporada fica guardada. Vira a história da turma.</p>
<div class="liga"><b>🏆 LIGA DOS CRIA</b><span>8 técnicos · 12 temporadas</span></div>
<div class="box"><p class="rot">QUEM MANDA NA LIGA</p>
<div class="rk"><span class="m">🥇</span><div class="n" style="background:${OURO}">LEÃO DA ESTRADINHA 👑</div><b>5 🏆</b></div>
<div class="rk"><span class="m">🥈</span><div class="n" style="background:${PRATA}">BOLACHA FC ⭐</div><b>4 🏆</b></div>
<div class="rk"><span class="m">🥉</span><div class="n" style="background:${OURO}">NATA DE SP 👑</div><b>2 🏆</b></div>
<div class="rk"><span class="m">·</span><div class="n" style="background:${BEGE}">ZÉ DA VÁRZEA</div><b>0 🏆 😭</b></div></div>
<div class="box"><p class="rot">TEMPORADA POR TEMPORADA</p>
${[['T12', 'Leão da Estradinha', 'Romário 23 gols', 'Zé da Várzea'], ['T11', 'Bolacha FC', 'Pelé 19 gols', 'Nata de SP'], ['T10', 'Leão da Estradinha', 'Zico 21 gols', 'Zé da Várzea'], ['T9', 'Nata de SP', 'Ronaldo 17 gols', 'Bolacha FC']].map(([t, c, a, l]) => `<div class="tp"><b class="tt">${t}</b><div><b>🏆 ${c}</b><small>⚽ ${a} · 🔻 lanterna: ${l}</small></div></div>`).join('')}
</div>
<div class="riv"><b>⚔️ RIVALIDADE</b><div class="pl"><span>LEÃO</span><b>7 × 4</b><span>BOLACHA</span></div><small>confrontos diretos em todas as temporadas</small></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:920px;align-items:flex-start}
.tela{position:relative;width:430px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
.num{position:absolute;top:-12px;left:-12px;width:34px;height:34px;border-radius:50%;background:#C2452F;color:#fff;border:3px solid #0C0C0C;font:700 18px Oswald;display:flex;align-items:center;justify-content:center}
h1{font:700 26px/1 Oswald;text-transform:uppercase;margin:0}.sub{font-size:12.5px;font-weight:700;color:#3a3a32;margin:6px 0 12px}
.noite{background:#14251a;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px}.cab{font:700 11px Oswald;letter-spacing:.1em;color:#FFC400;margin:0 0 8px;text-align:center}
.pr{display:flex;gap:10px;align-items:center;background:rgba(244,236,214,.08);border:2px solid rgba(244,236,214,.2);border-radius:12px;padding:8px;margin-top:7px}.pe{font-size:30px;width:40px;text-align:center}.pt b{font:700 15px Oswald;color:#FFC400;text-transform:uppercase;display:block}.quem{display:inline-block;font:700 13px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:1px 8px;margin:3px 0}.pt small{display:block;font-size:11px;color:#F4ECD6;opacity:.85}
.botoes{display:flex;gap:8px;margin-top:12px}.botoes span{flex:1;text-align:center;font:700 15px Oswald;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px}.botoes .sec{background:#fff;color:#0C0C0C}
.obs{font-size:11px;font-weight:700;color:#53534b;margin:10px 2px 0;line-height:1.4}
.liga{background:#0C0C0C;color:#FFC400;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:baseline}.liga b{font:700 20px Oswald}.liga span{font:700 11px Oswald;color:#F4ECD6}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;margin-bottom:12px}.rot{font:700 11px Oswald;letter-spacing:.1em;color:#53534b;margin:0 0 6px}
.rk{display:flex;gap:8px;align-items:center;margin-top:6px}.rk .m{width:24px;font-size:18px;text-align:center}.rk .n{flex:1;font:700 14px Oswald;border:2px solid #0C0C0C;border-radius:9px;padding:4px 9px}.rk b{font:700 16px Oswald;white-space:nowrap}
.tp{display:flex;gap:10px;align-items:center;border-top:2px dashed #0c0c0c22;padding:7px 0}.tp:first-of-type{border-top:0}.tt{font:700 14px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:2px 7px}.tp b{font:700 14px Oswald;display:block}.tp small{font-size:11px;color:#53534b;font-weight:700}
.riv{background:linear-gradient(135deg,#7C3AED,#3b1a7a);color:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;text-align:center}.riv>b{font:700 14px Oswald;letter-spacing:.1em}.pl{display:flex;justify-content:center;align-items:center;gap:14px;margin:4px 0}.pl span{font:700 16px Oswald}.pl b{font:700 34px Oswald;color:#FFC400}.riv small{font-size:11px;opacity:.85}
</style></head><body>${premios}${galeria}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 920, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `pg-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/online-premios-galeria.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/online-premios-galeria.png')
