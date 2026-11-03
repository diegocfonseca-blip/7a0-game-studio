// 🥇⚔️ MOCKUP · MEDALHA DO CLÃ DA SEMANA (02/11). Pergunta do Diego: *"oq o clã da semana poderia ganhar cada usuário? pq o
// individual ganha medalha já… e se o clã tiver o msm usuário q tb tá ganhando na semana? e o presidente do clã? e se o presidente
// tb tiver batismo ou fundador?"*. Proposta: medalha 🥇🥈🥉 NA PÍLULA do clã por 30 dias (todo membro) · quem ganha as duas leva as
// duas (nome × pílula) · presidente = o mesmo + coroa dourada na pílula · batismo/fundador não muda nada.
// uso: node scripts/mockup-cla-semana-medalha.mjs → scripts/mockups/cla-semana-medalha.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const G = {
  bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)',
  roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)',
  ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
}
const pilula = (cla, med, pres) => `<span class="pil ${med ? 'med' : ''} ${pres && med ? 'presmed' : ''}">${pres ? '<i class="cr">👑</i>' : ''}⚔️ CLÃ ${cla}${med ? ` <b class="m">${med}</b>` : ''}</span>`
const tec = (nome, tier, selo, sub, pil, nota) => `<div class="tec" style="background:${G[tier]}"><span class="ini">${nome[0]}</span><div class="txt"><b>${nome} ${selo}</b>${pil}${sub ? `<small>${sub}</small>` : ''}</div>${nota ? `<span class="nota">${nota}</span>` : ''}</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:900px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65;font-size:15px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin:6px 0 10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 12px;margin-bottom:18px}
.box h3{font:700 15px Oswald;text-transform:uppercase;margin:0 0 12px;letter-spacing:.5px}
.tec{display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:10px}
.ini{width:36px;height:36px;border-radius:50%;border:2px solid #0C0C0C;background:#fff;display:flex;align-items:center;justify-content:center;font:700 16px Oswald;flex:none}
.txt{flex:1}.txt b{display:block;font:700 17px Oswald}.txt small{font-size:11px;font-weight:700;opacity:.7;margin-left:6px}
.nota{font-size:12px;font-weight:700;background:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:3px 7px;max-width:230px}
.pil{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font:700 11px Oswald;letter-spacing:.04em;background:#0C0C0C;color:#fff;border-radius:999px;padding:2px 9px;position:relative}
.pil.med{box-shadow:0 0 0 2px #FFC400}.pil .m{font-size:13px}
.pil .cr{font-style:normal;font-size:12px;filter:grayscale(1) brightness(1.6)}
.pil.presmed .cr{filter:drop-shadow(0 0 3px #FFC400)}
.pil.presmed{background:linear-gradient(90deg,#0C0C0C,#3a2b00);box-shadow:0 0 0 2px #FFC400,0 0 10px rgba(255,196,0,.6)}
.leg{font-size:13px;font-weight:600;line-height:1.5;margin:6px 0 0}
.perfil{display:flex;gap:14px;align-items:center;background:#0C0C0C;color:#fff;border-radius:14px;padding:14px 16px;border:3px solid #0C0C0C}
.perfil .esc{font-size:40px}.perfil b{font:700 22px Oswald;display:block}.perfil small{opacity:.8;font-weight:700}
.selo{display:inline-block;margin-top:6px;background:#FFC400;color:#0C0C0C;font:700 13px Oswald;letter-spacing:.05em;border:2px solid #FFC400;border-radius:8px;padding:2px 9px}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 6px;border-bottom:1px dashed #ccc;vertical-align:top}
td:first-child{font-weight:800;width:240px}.ja{color:#1B7A3D;font-weight:800}.novo{color:#7C3AED;font-weight:800}
.dois{display:flex;gap:18px}.dois>div{flex:1}
</style></head><body>
<h1>🥇⚔️ Clã da semana: o que cada membro ganha</h1>
<p class="sub">Exemplo: o Clã Futpoint fechou a semana em 1º. O presidente é o Futpoint FC (batismo). O Didico também foi o 1º do ranking individual.</p>

<span class="tag">1 · NA SALA DE ESPERA (técnicos)</span>
<div class="box"><h3>👥 Técnicos na sala</h3>
${tec('FUTPOINT FC', 'ouro', '👑', '', pilula('FUTPOINT', '🥇', true), '👑 presidente: coroa dourada acesa na pílula')}
${tec('DIDICO', 'bege', '🥇', '', pilula('FUTPOINT', '🥇', false), 'ganhou as DUAS: 🥇 no nome (individual) + 🥇 na pílula (clã)')}
${tec('GAMA FC', 'roxo', '💎', '', pilula('FUTPOINT', '🥇', false), 'membro comum: só a 🥇 do clã')}
${tec('VACA MELADA', 'bege', '', '', pilula('PREGÃO NOTURNO', '🥈', false), '2º clã da semana: 🥈')}
${tec('BUTINAS', 'bege', '', '', pilula('ÁGUIAS', '', false), 'clã fora do pódio: igual a hoje')}
<p class="leg">🥇 <b>no nome</b> = ranking individual (já existe). 🥇 <b>na pílula</b> = o clã dele foi pódio. São dois lugares diferentes, então nunca embola.</p>
</div>

<div class="dois"><div>
<span class="tag">2 · NO PERFIL</span>
<div class="box"><div class="perfil"><span class="esc">🛡️</span><div><b>⚔️ CLÃ FUTPOINT</b><small>líder: Futpoint FC · 14/22</small><br><span class="selo">🥇 CLÃ CAMPEÃO DA SEMANA · até 02/12</span></div></div>
<p class="leg">A caixinha do clã no perfil ganha o selo com a data em que a medalha some (30 dias).</p></div>
</div><div>
<span class="tag">3 · NOS AMIGOS</span>
<div class="box">
${tec('DIDICO', 'bege', '🥇', 'online', pilula('FUTPOINT', '🥇', false), '')}
${tec('GAMA FC', 'roxo', '💎', 'visto há 2h', pilula('FUTPOINT', '🥇', false), '')}
<p class="leg">Mesma pílula de sempre, só com a medalha.</p></div>
</div></div>

<span class="tag">4 · O QUE CADA UM GANHA</span>
<div class="box"><table>
<tr><td>Todo membro do top 3 de clãs</td><td><span class="ja">JÁ EXISTE:</span> 30 · 20 · 10 🪙 pra carreira (só quem está no clã desde segunda).<br><span class="novo">NOVO:</span> medalha 🥇🥈🥉 na pílula do clã por 30 dias.</td></tr>
<tr><td>Ganhou o individual E o clã</td><td>Leva os dois: a medalha no nome, a medalha na pílula e as moedas das duas.</td></tr>
<tr><td>👑 Presidente do clã</td><td>O mesmo dos membros, e a coroa da pílula fica <b>dourada e acesa</b> nos 30 dias.</td></tr>
<tr><td>Presidente batismo/fundador</td><td>Nada a mais. O que é do plano continua do plano, e o prêmio do clã é igual pra todos.</td></tr>
<tr><td>Onde NÃO aparece</td><td>Chat (você tirou o selo do clã de lá), telão, tabela, placar e jogo.</td></tr>
</table></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ viewport: { width: 944, height: 800 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/cla-semana-medalha.png', fullPage: true })
await br.close()
console.log('scripts/mockups/cla-semana-medalha.png')
