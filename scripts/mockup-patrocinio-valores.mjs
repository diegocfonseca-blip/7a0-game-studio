// 💼 MOCKUP · VALORES DO PATROCÍNIO (16/10). Tabela proposta ao Diego com base em ~5 mil contas ativas/mês
// (mensal: competição 300 · LED+placar 200 · O MARTELO 150 · os 3 juntos 500 · 1º mês pela metade; diário: Dia da marca 50).
// É pra mandar no PRIVADO pra marca interessada — na Loja o mensal não aparece com preço (decisão do Diego).
// uso: node scripts/mockup-patrocinio-valores.mjs → scripts/mockups/patrocinio-valores.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const lin = (e, nome, sub, preco, dest) => `<div class="lin${dest ? ' dest' : ''}"><span class="e">${e}</span><div class="t"><b>${nome}</b><small>${sub}</small></div><span class="p">${preco}</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:22px;width:1000px}
h1{margin:0;font-size:30px;text-transform:uppercase}.sub{margin:2px 0 16px;font-weight:500;font-size:15px}
.cols{display:flex;gap:20px;align-items:flex-start}.box{flex:1;background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px}
.box h2{margin:0 0 4px;font-size:22px;text-transform:uppercase}.box .s{margin:0 0 10px;font-weight:500;font-size:13px;color:#555}
.lin{display:flex;align-items:center;gap:10px;border:3px solid #000;border-radius:12px;padding:8px 10px;margin-bottom:8px;background:#F4ECD6}
.lin.dest{background:linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)}
.e{font-size:26px}.t{flex:1}.t b{display:block;font-size:17px;text-transform:uppercase}.t small{font-weight:500;font-size:12px}
.p{background:#0C0C0C;color:#FFC400;border-radius:10px;padding:4px 10px;font-weight:700;font-size:18px;white-space:nowrap}
.tag{display:inline-block;margin-top:4px;background:#1B7A3D;color:#fff;border:2px solid #000;border-radius:9px;padding:3px 9px;font-weight:700;font-size:13px}
.nota{font-weight:500;font-size:13px;margin:8px 2px 0;line-height:1.35}
.base{margin-top:16px;background:#141414;color:#fff;border-radius:14px;padding:10px 14px;font-weight:500;font-size:13.5px;box-shadow:4px 4px 0 #000}
.base b{color:#FFC400}
</style></head><body>
<h1>💼 Patrocínio no Leilão Legends: valores</h1><p class="sub">Uma marca por espaço. Tabela pra mandar no privado pra empresa interessada.</p>
<div class="cols">
 <div class="box"><h2>📅 Mensal</h2><p class="s">A marca fica 30 dias no espaço, sem sair.</p>
  ${lin('🏆', 'Nome da competição', '"Champions Legends apresentada por…"', 'R$ 300')}
  ${lin('🏟️', 'LED do estádio + placar', 'placa no estádio e linha embaixo do placar', 'R$ 200')}
  ${lin('📰', 'Anúncio no O MARTELO', 'quadro no jornal do campeão', 'R$ 150')}
  ${lin('📦', 'Os 3 juntos', 'competição + LED/placar + O MARTELO', 'R$ 500', true)}
  <span class="tag">🎉 1º mês pela metade</span>
  <p class="nota">Toda marca mensal entra na 🏪 Vitrine dos patrocinadores, com logo, bio, Instagram e cupom.</p></div>
 <div class="box"><h2>⚡ Diário</h2><p class="s">Paga uma vez. A marca domina o jogo por 24 horas.</p>
  ${lin('⚡', 'Dia da marca', 'cartão na home + LED dividido com a marca do mês', 'R$ 50', true)}
  <p class="nota">Quem paga o mês nunca perde o espaço: no Dia da marca o LED alterna as duas marcas, e a competição e o O MARTELO continuam com a do mês.</p>
  <p class="nota">O Dia da marca pode ficar na 🛒 Loja com preço. O mensal só é negociado no privado.</p></div>
</div>
<div class="base">📊 Base do preço: <b>5.052 contas entraram nos últimos 30 dias</b> (~1.000 por semana) e <b>4.366 contas novas</b> no mês, sem contar quem joga sem conta. Quando passar de ~10 mil contas ativas no mês, os valores sobem.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1044, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/patrocinio-valores.png', fullPage: true }); await b.close()
console.log('scripts/mockups/patrocinio-valores.png')
