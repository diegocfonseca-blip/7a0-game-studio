// ⭐ prévia (02/11): faixa dourada "cada membro com plano abre +1 vaga" na caixa Clãs da semana. uso: node scripts/mockup-clas-semana-texto-vagas.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const F = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`/home/user/7a0-game-studio/scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const O = "font-family:Oswald;font-weight:800"
const row = (p, n, t, ouro) => `<div style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:9px;${ouro ? 'background:linear-gradient(90deg,#FFE79A,#FFC400);border:2px solid #0C0C0C' : 'border-top:1.5px solid #0001'}"><span style="${O};font-size:15px;width:26px;text-align:center">${p}</span><span style="font-size:20px">🛡️</span><b style="${O};flex:1;font-size:14px">${n}</b><span style="${O};font-size:15px">${t} <span style="font-size:10px">títulos</span></span><span style="${O};font-size:16px;color:#0006">›</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${F}body{margin:0;background:#e9dfc4;padding:16px;font-family:system-ui;width:380px}</style></head><body>
<div style="background:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:12px 12px 10px">
<p style="${O};margin:0;font-size:17px;text-transform:uppercase">⚔️ Clãs da semana</p>
<p style="margin:2px 0 1px;font-size:11px;font-weight:700;color:#5a5240">Todo título online de cada membro soma pro clã. Zera segunda.</p>
<p style="margin:0 0 8px;font-size:10px;font-weight:700;font-style:italic;color:#8a8270">🔄 atualiza a cada 5 min</p>
<p style="${O};margin:0 0 8px;font-size:12.5px;letter-spacing:.03em;color:#FFC400;background:linear-gradient(150deg,#262626,#0c0c0c);border:2px solid #0C0C0C;border-radius:10px;padding:5px 9px;line-height:1.25">⭐ Cada membro com plano abre +1 vaga no clã — sem limite!</p>
${row('🥇', 'Lulubaba', 41, true)}${row('🥈', 'Futpoint', 30)}${row('🥉', 'Leite de Verdade', 22)}${row('4º', 'ACIMA DA MEDIA', 9)}
</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 412, height: 300 }, deviceScaleFactor: 2 })
await pg.setContent(html); await pg.screenshot({ path: 'scripts/mockups/clas-semana-texto-vagas.png', fullPage: true }); await br.close()
