// 📋 MOCKUP — CRIAR A LIGA DRAFT (19/10). Diego: *"seria algo novo q escolhe lá junto de sala rápida, bafo, carreira… criar
// parecido c/ salas rápido porém sem clubes… só jogador profissional e bom no leilão inicial… o cara pode escolher envelope,
// pregão aberto ou tocaia… baralho todos automático"*. Combinado: modo próprio que FICA DE PÉ (igual Minhas Ligas), porque o
// draft acontece entre uma temporada e outra.
//   node scripts/mockup-draft-criar.mjs  →  scripts/mockups/draft-criar.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px;width:560px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65;font-size:13.5px}
.fone{background:#0C0C0C;border:4px solid #0C0C0C;border-radius:30px;padding:14px;box-shadow:6px 6px 0 #0C0C0C;color:#F4ECD6}
.rot{font:700 12px Oswald;letter-spacing:1.5px;text-transform:uppercase;color:#F4ECD6;opacity:.85;margin:0 0 6px}
.modos{display:grid;grid-template-columns:1fr 1fr;border:2.5px solid #000;border-radius:12px;overflow:hidden;background:#000;gap:2.5px}
.modos span{position:relative;background:#fff;color:#0C0C0C;font:700 15px Oswald;text-align:center;padding:10px 4px}
.modos .on{background:#FFC400}.modos .span2{grid-column:span 2}
.novo{position:absolute;top:3px;right:6px;font:700 9px Oswald;letter-spacing:.06em;background:#E8503A;color:#fff;border:1.5px solid #0C0C0C;border-radius:6px;padding:0 5px}
.lema{margin:8px 2px 16px;font-size:12.5px;font-weight:700;line-height:1.4;color:#F4ECD6}
.sec{display:flex;align-items:center;gap:10px;margin:16px 0 10px}.sec b{display:grid;place-items:center;width:26px;height:26px;background:#FFC400;color:#0C0C0C;border-radius:7px;font:700 15px Oswald}.sec span{font:700 19px Oswald;text-transform:uppercase}
.campo{background:#fff;color:#0C0C0C;border:2.5px solid #000;border-radius:11px;padding:10px 12px;font-weight:700;font-size:14px;margin-bottom:8px}.campo small{display:block;font-size:10px;letter-spacing:1px;opacity:.55;text-transform:uppercase}
.seg{display:flex;border:2.5px solid #000;border-radius:12px;overflow:hidden}.seg span{flex:1;background:#fff;color:#0C0C0C;font:700 15px Oswald;text-align:center;padding:10px 2px;border-left:2.5px solid #000}.seg span:first-child{border-left:none}.seg .on{background:#FFC400}
.dica{margin:7px 2px 0;font-size:12px;font-weight:700;line-height:1.4;opacity:.85}
.fixo{background:#1c1c1c;border:2px dashed rgba(244,236,214,.35);border-radius:13px;padding:10px 12px}
.fixo div{display:flex;gap:9px;align-items:flex-start;padding:6px 0;border-top:1px solid rgba(255,255,255,.08);font-size:13px;font-weight:700;line-height:1.35}.fixo div:first-child{border-top:none}
.fixo i{font-style:normal;font-size:16px;width:22px;text-align:center}.fixo em{font-style:normal;color:#FFC400}
.criar{margin-top:16px;background:#FFC400;color:#0C0C0C;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #F4ECD6;font:700 20px Oswald;text-transform:uppercase;text-align:center;padding:13px}
.leg{margin-top:18px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 16px;box-shadow:4px 4px 0 #000;font-size:13px;font-weight:700;line-height:1.5}
</style></head><body>
<h1>📋 Criar a Liga Draft</h1>
<p class="sub">Um modo novo, ao lado de Rápido, Minhas ligas, Carreira e Bafo. O dono só escolhe o nome, a senha e o jeito do lance.</p>
<div class="fone">
  <p class="rot">Modo de jogo</p>
  <div class="modos"><span>⚡ Rápido</span><span>🏆 Minhas ligas</span><span class="on">📋 Liga Draft<i class="novo">NOVO</i></span><span>🌐 Carreira</span><span class="span2">🃏 Bafo</span></div>
  <p class="lema">📋 Todo mundo começa fraco. A cada temporada, cada técnico pega <b>1 jogador</b> no draft — de <b>todos do jogo</b>. O campeão escolhe primeiro.</p>

  <div class="sec"><b>1</b><span>A liga</span></div>
  <div class="campo"><small>Nome da liga</small>Liga da Firma</div>
  <div class="campo"><small>Senha (avise a galera)</small>••••••</div>
  <p class="dica" style="margin-top:0">🔒 A Liga Draft é sempre com senha: é a mesma turma, temporada após temporada.</p>

  <div class="sec"><b>2</b><span>O leilão da 1ª temporada</span></div>
  <p class="rot">Como é o leilão</p>
  <div class="seg"><span>✉️ Envelope cego</span><span>🐊 Tocaia</span><span class="on">🔨 Pregão aberto</span></div>
  <p class="dica">🔨 Uma carta por vez, com o lance à vista de todos. 5s sem lance = vendido.</p>

  <div class="sec"><b>3</b><span>Já vem pronto</span></div>
  <div class="fixo">
    <div><i>🃏</i><span>Leilão de <em>jogador</em> (sem Clubes)</span></div>
    <div><i>🌎</i><span>Baralho <em>Todos</em> (Brasil + Europa + Mundo)</span></div>
    <div><i>🪵</i><span>1ª temporada só com <em>profissional e bom</em> — ninguém começa com craque</span></div>
    <div><i>📋</i><span>Entre as temporadas: <em>draft</em>, 1 jogador por técnico, de todo o jogo · <em>60s</em> pra escolher · ordem da tabela</span></div>
    <div><i>☝️</i><span>Cada jogador é <em>único</em> na liga</span></div>
  </div>

  <div class="criar">📋 Criar Liga Draft</div>
</div>
<div class="leg">A fileira de modos passa a ter 5, então vira grade de 2 colunas (a régua de 21/09: de 4 opções em diante vira grade). O que é fixo aparece numa caixa tracejada, sem botão — pra ninguém procurar o que não dá pra mudar.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 560, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/draft-criar.png', fullPage: true })
await b.close(); console.log('📸 scripts/mockups/draft-criar.png')
