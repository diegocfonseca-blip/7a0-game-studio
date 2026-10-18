#!/usr/bin/env node
// 🏆 MOCKUP — PATROCINADOR MASTER INVERTIDO (17/10). Diego: "não tá fazendo sentido… todo mundo sempre escolhe a Vadico
// (5 anos)". Hoje o longo paga MAIS por temporada E trava o valor — ganha em tudo. Proposta: igual contrato de jogador —
// o CURTO paga mais por temporada (quem vai subir renova logo pelo valor da divisão nova); o LONGO paga menos, mas é seguro
// (se cair, continua recebendo o valor travado). Multiplicadores: hoje 1,25·1,75·2,25·2,75·3,25 → proposta 3,25·3·2,75·2,6·2,5.
// O 5 anos fica ACIMA do fornecedor de 5 anos (trava do `npm run loja`). Contrato já assinado não perde nada (`masterValor` usa
// o maior entre o que foi assinado e a conta nova).
// uso: node scripts/mockup-master-invertido.mjs → scripts/mockups/master-invertido.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const HOJE = [1.25, 1.75, 2.25, 2.75, 3.25], NOVO = [3.25, 3, 2.75, 2.6, 2.5]
const MARCAS = ['Max Joias', 'Rei das Tintas', 'ERO Odontologia', 'Uomo Concetto', 'Vadico Veículos']
const PRA = ['🚀 vai subir? renova logo', '🚀 subindo aos poucos', '⚖️ meio-termo', '🛡️ quer segurança', '🛡️ medo de cair']
const papel = (base, i) => {
  const anos = i + 1, h = Math.round(base * HOJE[i]), n = Math.round(base * NOVO[i])
  return `<div class="papel"><small>CONTRATO MASTER</small><b class="marca">${MARCAS[i]}</b><span class="anos">${anos} ${anos > 1 ? 'TEMPORADAS' : 'TEMPORADA'}</span>
    <div class="por"><strong>+${n}</strong><em>por temporada</em></div><div class="hoje">hoje: +${h}</div>
    <div class="tot">${n * anos} 🪙 no total</div><div class="pra">${PRA[i]}</div></div>`
}
const linha = (nome, base) => `<h3>${nome}</h3><div class="grade">${[0, 1, 2, 3, 4].map(i => papel(base, i)).join('')}</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:#0C0C0C;padding:24px;width:1000px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 14px;font-weight:700;color:#3a3a32;font-size:14px}
.painel{background:#16120d;border:4px solid #0C0C0C;border-radius:20px;padding:16px 18px;box-shadow:6px 6px 0 #0C0C0C;color:#f6efdc}
h3{font:700 18px Oswald;text-transform:uppercase;margin:6px 0 8px;color:#FFC400}
.grade{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}
.papel{background:#f6efdc;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:6px;box-shadow:3px 3px 0 rgba(0,0,0,.55);padding:9px 6px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px}
.papel small{font:700 7.5px Oswald;letter-spacing:.08em}.marca{font:700 15px Oswald}.anos{font:700 11px Oswald;background:#0C0C0C;color:#FFC400;border-radius:5px;padding:1px 7px}
.por{margin-top:4px;line-height:1}.por strong{font:700 26px Oswald;color:#1B7A3D;display:block}.por em{font-style:normal;font-size:10px;font-weight:700}
.hoje{font-size:10px;font-weight:700;color:#8a7d59;text-decoration:line-through}.tot{font:700 12px Oswald;margin-top:2px}
.pra{align-self:stretch;border-top:1px solid #897b5d;margin-top:4px;padding-top:4px;font-size:10px;font-weight:700;color:#5b3fa0}
.notas{margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.notas div{background:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px 11px;font-size:13px;font-weight:600;line-height:1.35}
</style></head><body><h1>🏆 Patrocinador Master · proposta</h1><p class="sub">O valor grande agora é <b>por temporada</b>. Curto paga mais por ano; longo paga menos, mas fica travado mesmo se o time cair.</p>
<div class="painel">${linha('Várzea', 3)}${linha('Série A', 32)}</div>
<div class="notas"><div><b>Vai subir?</b> Pega o curto: ganha mais por ano e, quando acabar, renova pelo valor da divisão nova.</div><div><b>Medo de cair?</b> Pega o longo: ganha um pouco menos por ano, mas o valor fica travado até o fim.</div><div><b>Quem já assinou não perde nada:</b> contrato correndo continua pagando o que foi assinado.</div></div>
</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `mi-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/master-invertido.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/master-invertido.png')
