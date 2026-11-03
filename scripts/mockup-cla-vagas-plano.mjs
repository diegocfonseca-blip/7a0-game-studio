// ⭐⚔️ MOCKUP · VAGAS DE PLANO NO CLÃ (02/11). Diego: *"qual prioridade eu poderia dar pra qm tem plano nos clãs… tá lotando"*.
// Proposta: 22 vagas pra todo mundo + 3 vagas ⭐ só pra quem tem plano (até 25) · pedido de quem tem plano no topo da lista do
// presidente · grátis vê o clã cheio com o motivo. uso: node scripts/mockup-cla-vagas-plano.mjs → scripts/mockups/cla-vagas-plano.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const bolas = (n, cor, borda = '#0C0C0C', txt = '') => Array.from({ length: n }, () => `<span class="v" style="background:${cor};border-color:${borda}">${txt}</span>`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:900px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin:6px 0 10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 12px;margin-bottom:18px}
.topo{background:linear-gradient(150deg,#262626,#0c0c0c);color:#fff;border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center}
.topo b{font:700 22px Oswald;display:block}.topo small{color:#FFC400;font-weight:800}
.vagas{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0 6px}.v{width:24px;height:24px;border-radius:50%;border:2px solid;display:inline-flex;align-items:center;justify-content:center;font-size:12px}
.leg{font-size:14px;font-weight:600;line-height:1.5;margin:6px 0 0}
.row{display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:8px}
.row b{font:700 16px Oswald;flex:1}.ok{background:#1B7A3D;color:#fff;font:700 13px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:4px 10px;box-shadow:2px 2px 0 #000}
.no{background:#fff;font:700 13px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:4px 10px}
.star{background:#FFC400;border:2px solid #0C0C0C;border-radius:6px;font:700 11px Oswald;padding:1px 6px}
.dois{display:flex;gap:18px}.dois>div{flex:1}
.aviso{border:3px solid #0C0C0C;border-radius:12px;padding:12px;font-weight:700;font-size:14px;line-height:1.45}
.btn{display:inline-block;margin-top:10px;background:#FFC400;border:3px solid #0C0C0C;border-radius:10px;box-shadow:3px 3px 0 #000;font:700 15px Oswald;padding:6px 14px}
.cinza{opacity:.5}
</style></head><body>
<h1>⭐⚔️ Clã: 3 vagas a mais só pra quem tem plano</h1>
<p class="sub">Hoje todo clã para em 22. Com isso: 22 vagas pra todo mundo + 3 vagas ⭐ que só quem tem plano ocupa (até 25).</p>

<span class="tag">1 · A PÁGINA DO CLÃ (exemplo: Lulubaba)</span>
<div class="box">
<div class="topo"><span style="font-size:38px">🛡️</span><div><b>⚔️ CLÃ LULUBABA</b><small>23/25 · 22 de todo mundo + 1 de ⭐ plano</small></div></div>
<div class="vagas">${bolas(22, '#DBD1B5')}${bolas(1, '#FFC400', '#0C0C0C', '⭐')}${bolas(2, '#fff', '#C9A400', '⭐')}</div>
<p class="leg">⚪ 22 vagas normais (cheias) · ⭐ 3 vagas de plano: 1 ocupada, <b>2 livres — só quem tem plano entra</b>.</p>
</div>

<div class="dois"><div>
<span class="tag">2 · GRÁTIS TENTANDO ENTRAR</span>
<div class="box"><div class="aviso">🔒 O Lulubaba está cheio pra quem não tem plano (22/22).<br><span style="font-weight:600">Ainda tem 2 vagas ⭐ — só pra quem tem plano.</span></div>
<span class="btn">⭐ Ver os planos</span></div>
</div><div>
<span class="tag">3 · QUEM TEM PLANO</span>
<div class="box"><div class="aviso" style="background:#FFF6D6">⭐ Você tem plano: pode entrar numa das 2 vagas ⭐ do Lulubaba.</div>
<span class="btn" style="background:#1B7A3D;color:#fff">Pedir pra entrar</span></div>
</div></div>

<span class="tag">4 · PEDIDOS QUE O PRESIDENTE RECEBE</span>
<div class="box">
<div class="row"><span class="star">⭐ PLANO</span><b>GAMA FC 💎</b><span class="ok">Aceitar</span><span class="no">Recusar</span></div>
<div class="row"><span class="star">⭐ PLANO</span><b>PAÇOCA LEILOEIRO ⭐</b><span class="ok">Aceitar</span><span class="no">Recusar</span></div>
<div class="row cinza"><b>BUTINAS</b><span class="no">clã cheio pra grátis</span></div>
<p class="leg">Quem tem plano aparece <b>primeiro</b>. Pedido de grátis só dá pra aceitar se abrir vaga normal.</p>
</div>

<span class="tag">5 · AS REGRAS</span>
<div class="box"><p class="leg" style="margin:0">
✅ Ninguém que já está no clã sai por causa disso.<br>
✅ Perdeu o plano? Continua no clã. Só que a vaga ⭐ dele não volta pra grátis.<br>
✅ Abriu vaga normal (alguém saiu)? Qualquer um pode entrar nela.<br>
✅ Presidente continua aceitando e recusando como hoje.</p></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ viewport: { width: 944, height: 800 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/cla-vagas-plano.png', fullPage: true })
await br.close()
console.log('ok')
