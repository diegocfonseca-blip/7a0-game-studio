// 🕐 MOCKUP · CONTA NOVA SÓ CRIA SALA DEPOIS DE 24 H (03/11). Diego: "conta nova só consegue criar sala após 24h mas pode entrar em
// qualquer sala ilimitada de forma gratuita… ou ele pode antecipar e ter direito a criar 3 salas por 4,90 ou plano mensal de 9,90
// ilimitado". uso: node scripts/mockup-conta-nova-24h.mjs → scripts/mockups/conta-nova-24h.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:900px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin:6px 0 10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.dois{display:flex;gap:18px;align-items:flex-start}.dois>div{flex:1}
.cel{background:#e9dfc4;border:3px solid #0C0C0C;border-radius:22px;padding:14px;box-shadow:4px 4px 0 #000}
.modal{background:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
.modal h3{font:700 22px Oswald;text-transform:uppercase;margin:0 0 6px}
.relogio{display:flex;align-items:center;gap:10px;background:linear-gradient(150deg,#262626,#0c0c0c);color:#fff;border-radius:12px;padding:10px 12px;margin:8px 0}
.relogio b{font:700 30px Oswald;color:#FFC400;letter-spacing:1px}
.ok{background:#DDF2E3;border:2px solid #0C0C0C;border-radius:10px;padding:8px 10px;font-weight:700;font-size:14px;margin:8px 0}
.op{display:flex;align-items:center;gap:10px;border:3px solid #0C0C0C;border-radius:12px;padding:10px;margin-top:10px;background:#fff;box-shadow:3px 3px 0 #000}
.op b{font:700 17px Oswald;display:block}.op small{font-size:12px;font-weight:700;opacity:.75}.op .pr{margin-left:auto;font:700 20px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:2px 10px;white-space:nowrap}
.op.plano{background:linear-gradient(160deg,#F4F7FB,#CBD4DE)}
.btn{display:block;text-align:center;border:3px solid #0C0C0C;border-radius:10px;box-shadow:3px 3px 0 #000;font:700 16px Oswald;padding:8px;margin-top:10px;background:#1B7A3D;color:#fff}
.leg{font-size:14px;font-weight:600;line-height:1.5;margin:8px 0 0}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 12px;margin-bottom:16px}
.criar{display:block;text-align:center;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #000;font:700 18px Oswald;padding:10px;background:#FFC400}
.trava{font-size:12px;font-weight:800;text-align:center;margin-top:6px;color:#5a5240}
</style></head><body>
<h1>🕐 Conta nova: criar sala só depois de 24 h</h1>
<p class="sub">Entrar em sala continua grátis e à vontade. Criar: conta nova espera 24 h — ou antecipa com 3 salas por R$ 4,90 ou o plano de R$ 9,90/mês.</p>

<div class="dois"><div>
<span class="tag">1 · NA HOME (conta com menos de 24 h)</span>
<div class="cel">
<span class="criar">➕ CRIAR SALA</span>
<p class="trava">🕐 Conta nova: libera em 17h42 · entrar em sala é grátis</p>
<div style="height:10px"></div>
<span class="criar" style="background:#fff">🔎 ENTRAR NUMA SALA</span>
<p class="trava" style="color:#1B7A3D">✅ Grátis e à vontade, quantas quiser</p>
</div>
<p class="leg">O botão continua lá; embaixo dele, a contagem e o lembrete de que entrar é de graça.</p>
</div><div>
<span class="tag">2 · TOCOU EM CRIAR SALA</span>
<div class="cel"><div class="modal">
<h3>🕐 Conta nova</h3>
<p style="margin:0;font-weight:700;font-size:14px">Pra criar sala de graça, a conta precisa ter <b>24 horas</b>. A sua libera em:</p>
<div class="relogio"><span style="font-size:28px">⏳</span><b>17:42:05</b><small style="font-weight:800;opacity:.8">depois disso: 1 sala grátis por dia</small></div>
<div class="ok">✅ Enquanto isso, <b>entrar em qualquer sala é grátis e à vontade</b>.</div>
<p style="margin:10px 0 0;font:700 15px Oswald;text-transform:uppercase">Quer criar agora?</p>
<div class="op"><span style="font-size:26px">🎟️</span><div><b>3 salas</b><small>cria agora · usa quando quiser</small></div><span class="pr">R$ 4,90</span></div>
<div class="op plano"><span style="font-size:26px">⭐</span><div><b>Craque Salas</b><small>cria sala à vontade, todo dia</small></div><span class="pr">R$ 9,90/mês</span></div>
<span class="btn">🔎 Entrar numa sala de graça</span>
</div></div>
</div></div>

<span class="tag">3 · AS REGRAS</span>
<div class="box"><p class="leg" style="margin:0">
✅ Vale só pra conta criada daqui pra frente. Quem já tem conta não muda nada.<br>
✅ Entrar em sala: grátis e ilimitado, desde o primeiro minuto.<br>
✅ Criar sala grátis: a partir de 24 h de conta, 1 por dia (como já é hoje).<br>
✅ Antecipar: 3 salas extras por R$ 4,90 ou ⭐ Craque Salas R$ 9,90/mês (à vontade). Os dois já existem na Loja.<br>
✅ Quem tem qualquer plano não espera nada.</p></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ viewport: { width: 944, height: 800 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/conta-nova-24h.png', fullPage: true })
await br.close()
console.log('ok')
