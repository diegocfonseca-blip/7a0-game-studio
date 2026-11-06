// 🧩 MOCKUP (06/11, v2) — entrar em Liga da Turma / Liga Draft já começada, tudo no QUADRO DA LIGA ("🏆 Suas ligas").
// Diego: *"não tem sala de espera… eu como host clico em voltar e volta no mesmo lugar. Nessa mesma tela deveria ter pedidos pra
// entrar e também ao apertar em editar deixar a nova temporada ser com novas formas… 19 rodadas… de 10 pra 20 poderia"*.
// Regras: só pagante pede · dono aceita e escolhe o time (bot, ou alguém que ele remove → vira bot) · a pessoa entra na VIRADA da
// temporada (nunca no meio) · Editar a próxima temporada: 38/19 rodadas (20 times) · 18/9 (10 times) · 10→20 pode, 20→10 não · Copa sim/não.
//   node scripts/mockup-liga-vaga.mjs  →  scripts/mockups/liga-vaga.png
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'

const quadro = (extra = '') => `<div class="liga"><p class="lt">🏆 Suas ligas</p><div class="card">
<p class="nm">Liga Draft do Neymarzetti</p>
<div class="stats"><div><b>T5</b><small>TEMP.</small></div><div><b>17</b><small>TÉCNICOS</small></div><div><b>3 bots</b><small>TABELA</small></div><span class="volt">↩️ VOLTAR</span></div>
<p class="meta">👥 17 · 1VMFFJ · rodada 24 de 38</p>
<div class="acts"><span class="a roxo">📤 Convidar</span><span class="a">✏️ Editar</span><span class="a red">🗑️ Excluir</span></div>
<span class="ped">🙋 Pedidos pra entrar <i>2</i></span>${extra}</div></div>`

const p1 = `<div class="tela"><p class="cab">1 · O DONO VÊ OS PEDIDOS NO QUADRO DA LIGA</p>${quadro(`
<div class="drop"><p class="h">🙋 PEDIDOS PRA ENTRAR · 2</p>
<div class="li"><span class="n">Mengão do Sul <i class="tag ok">⭐ plano</i></span><span class="b ok">✅ Aceitar</span><span class="b">✕</span></div>
<div class="li off"><span class="n">Zé Ninguém FC <i class="tag">sem plano</i></span><span class="mini">🔒 precisa de plano</span></div>
<p class="ex">Só o dono vê. Aceitar = escolher em qual time a pessoa entra.</p></div>`)}</div>`

const p2 = `<div class="tela"><p class="cab">2 · ACEITOU → EM QUAL TIME ELE ENTRA?</p><div class="modal">
<p class="t">Mengão do Sul entra no lugar de…</p><p class="s">Ele assume o time como está: elenco, pontos, caixa e lugar no draft.</p>
<p class="g">🤖 TIMES DE BOT</p>
<div class="op sel">🤖 Tigres FC <span>4º · 26 pts</span></div>
<div class="op">🤖 Atlético Várzea <span>11º · 15 pts</span></div>
<div class="op">🤖 Real Pelada <span>19º · 6 pts</span></div>
<p class="g">👤 OU NO LUGAR DE ALGUÉM (ele sai e não volta)</p>
<div class="op">Cajuri Raiva <span>8º · 20 pts</span></div><div class="op">Rei da Bola <span>5º · 24 pts</span></div>
<div class="aviso">⏳ Ele entra na <b>virada da temporada</b> (fim da T5), nunca no meio — assim ninguém troca de cadeira com jogo rolando.</div>
<span class="go">✅ Confirmar</span></div></div>`

const p3 = `<div class="tela"><p class="cab">3 · ✏️ EDITAR → A PRÓXIMA TEMPORADA</p><div class="modal">
<p class="t">✏️ Temporada 6</p><p class="s">Vale a partir da virada. A temporada de agora não muda.</p>
<p class="g">🏟️ TIMES NA LIGA</p><div class="seg"><span class="dis">10 🔒</span><span class="on">20</span></div>
<p class="mini2">De 20 não volta pra 10 (teria que tirar times). De 10 pra 20 pode: entram bots.</p>
<p class="g">📅 RODADAS</p><div class="seg"><span class="on">38 · ida e volta</span><span>19 · só ida</span></div>
<p class="g">🏆 COPA</p><div class="seg"><span class="on">Com Copa</span><span>Só liga</span></div>
<p class="g">🔄 ENTRA NA VIRADA</p><div class="lst">✅ Mengão do Sul → no lugar do 🤖 Tigres FC</div>
<span class="go">💾 Salvar pra T6</span></div></div>`

const p4 = `<div class="tela"><p class="cab">4 · QUEM PEDE (precisa de plano)</p>
<div class="row"><span class="sel2">📋 LIGA DRAFT</span><span class="rn">Liga Draft do Neymarzetti</span><span class="em">Em jogo</span></div>
<span class="go roxo">🙋 Pedir pra entrar</span>
<p class="cab" style="margin-top:22px">DEPOIS QUE O DONO ACEITA</p>
<div class="liga"><div class="card"><p class="nm">Liga Draft do Neymarzetti</p>
<div class="aviso">✅ <b>Você foi aceito!</b> Entra na <b>temporada 6</b> no lugar do 🤖 Tigres FC (4º, 26 pts). Quando a T5 acabar, é só tocar em VOLTAR.</div></div></div>
<p class="cab" style="margin-top:22px">SEM PLANO</p>
<div class="aviso">🔒 Pra pedir vaga numa liga que já começou, precisa de um plano (a partir do ⭐ Craque Salas). <u>Ver planos</u></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0}body{width:1900px;background:#2a1d14;font-family:system-ui,sans-serif;color:${INK};padding:28px}
h1{font:700 34px Oswald;text-transform:uppercase;color:#fff}.sub{font-weight:700;color:#fff9;margin:4px 0 22px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;align-items:start}
.cab{font:700 15px Oswald;letter-spacing:.5px;color:${GOLD};margin-bottom:10px}
.liga{background:#FFF4CF;border:3px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:12px}
.lt{font:700 18px Oswald;color:#7a4d00;margin-bottom:8px}
.card{background:#fff;border:2.5px solid ${INK};border-radius:14px;padding:10px}
.nm{font:700 18px Oswald;margin-bottom:8px}
.stats{display:flex;gap:6px;align-items:center}.stats div{flex:1;border:2.5px solid ${INK};border-radius:10px;text-align:center;padding:4px;background:#FFF9E6}
.stats b{display:block;font:700 17px Oswald}.stats small{font-size:9px;font-weight:800;color:#555}
.volt{background:${GREEN};color:#fff;font:700 14px Oswald;border:2.5px solid ${INK};border-radius:10px;padding:10px 8px}
.meta{font-size:12px;font-weight:700;color:#555;margin:7px 0}
.acts{display:flex;gap:6px}.a{flex:1;text-align:center;font:700 13px Oswald;border:2.5px solid ${INK};border-radius:10px;padding:7px;background:#fff}
.a.roxo{background:${ROXO};color:#fff}.a.red{background:${RED};color:#fff}
.ped{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:8px;font:700 14px Oswald;background:${GOLD};border:2.5px solid ${INK};border-radius:10px;padding:8px;box-shadow:2px 2px 0 ${INK}}
.ped i{font-style:normal;background:${RED};color:#fff;border-radius:999px;padding:0 7px;border:2px solid ${INK}}
.drop{margin-top:10px;border-top:2px dashed #0003;padding-top:8px}.h{font:700 14px Oswald}
.li{display:flex;align-items:center;gap:6px;padding:7px 0;border-top:1.5px solid #0002;font-weight:800;font-size:14px}.li.off{opacity:.55}.n{flex:1}
.b{font:700 12px Oswald;border:2px solid ${INK};border-radius:8px;padding:4px 8px;background:#fff}.b.ok{background:${GREEN};color:#fff}
.tag{font-style:normal;font-size:10px;background:#ddd;border:1.5px solid ${INK};border-radius:999px;padding:1px 6px}.tag.ok{background:${GREEN};color:#fff}
.mini{font-size:11px;font-weight:700;color:#666}.ex{font-size:12px;font-weight:600;color:#555;margin-top:6px}
.modal{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px 14px}
.t{font:700 20px Oswald}.s{font-size:13px;font-weight:600;color:#444;margin-top:3px}
.g{font:700 12px Oswald;letter-spacing:.6px;color:#666;margin:12px 0 4px}
.op{border:2.5px solid ${INK};border-radius:10px;padding:8px 10px;margin-top:6px;font-weight:800;display:flex;justify-content:space-between;font-size:14px}
.op span{font-size:12px;color:#666}.op.sel{background:${GOLD};box-shadow:3px 3px 0 ${INK}}
.aviso{background:#FFF4CF;border:2px dashed #a87b00;border-radius:10px;padding:8px 10px;font-size:12.5px;font-weight:700;margin-top:10px;line-height:1.35}
.go{display:block;text-align:center;margin-top:12px;background:${GREEN};color:#fff;font:700 16px Oswald;border:2.5px solid ${INK};border-radius:10px;padding:10px;box-shadow:2px 2px 0 ${INK}}
.go.roxo{background:${ROXO}}
.seg{display:flex;gap:6px}.seg span{flex:1;text-align:center;font:700 14px Oswald;border:2.5px solid ${INK};border-radius:10px;padding:8px;background:#fff}
.seg .on{background:${GOLD};box-shadow:2px 2px 0 ${INK}}.seg .dis{opacity:.4}
.mini2{font-size:11.5px;font-weight:700;color:#666;margin-top:5px}.lst{font-size:13px;font-weight:800;border:2px solid ${INK};border-radius:10px;padding:8px;background:#EFFBF2}
.row{display:flex;align-items:center;gap:8px;background:#FFF4CF;border:3px solid ${INK};border-radius:14px;padding:10px;box-shadow:3px 3px 0 ${INK}}
.sel2{font:700 10px Oswald;background:${ROXO};color:#fff;border:2px solid ${INK};border-radius:5px;padding:2px 5px}.rn{flex:1;font:700 15px Oswald}
.em{font:700 11px Oswald;background:${RED};color:#fff;border-radius:999px;padding:2px 8px}
</style></head><body><h1>Gente nova em liga já começada — tudo no quadro da liga</h1>
<p class="sub">Liga da Turma e Liga Draft · só quem tem plano pede · o dono aceita e escolhe o time · a pessoa entra na virada da temporada</p>
<div class="grid">${p1}${p2}${p3}${p4}</div></body></html>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1900, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'scripts/mockups/liga-vaga.png', fullPage: true })
await b.close()
console.log('🖼️ scripts/mockups/liga-vaga.png')
