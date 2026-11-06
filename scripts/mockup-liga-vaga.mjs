// 🧩 MOCKUP (06/11) — entrar em Liga da Turma / Liga Draft já começada + "Encerrar a noite" sem sair da sala.
// Pedido do Diego: *"faz o mockup e em qual área ele poderia fazer isso… como ele fecha a liga pra jogar outro dia sem sair da sala?"*
//   node scripts/mockup-liga-vaga.mjs  →  scripts/mockups/liga-vaga.png
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', CREAM = '#F4ECD6'

const pessoas = [['Futpoint', '👑 DONO', 1, 34], ['Neymarzetti', '', 2, 31], ['Julia Barranquilla', '', 3, 29], ['Rei da Bola', '', 5, 24], ['Cajuri Raiva', '', 8, 20]]
const bots = [['🤖 Bot Tigres FC', 4, 26], ['🤖 Bot Atlético Várzea', 11, 15], ['🤖 Bot Real Pelada', 19, 6]]
const linhaP = ([n, tag, pos, pts]) => `<div class="li"><span class="pos">${pos}º</span><span class="nm">${n}${tag ? ` <i class="tag">${tag}</i>` : ''}</span><span class="pts">${pts} pts</span>${tag ? '<span class="sp"></span>' : `<button class="rm">✕ Remover</button>`}</div>`
const linhaB = ([n, pos, pts]) => `<div class="li bot"><span class="pos">${pos}º</span><span class="nm">${n}</span><span class="pts">${pts} pts</span><button class="add">➕ Pôr alguém</button></div>`

const tela1 = `<div class="tela"><p class="cab">1 · SALA DE ESPERA DA LIGA (antes de começar a noite)</p>
<div class="box"><p class="t">📋 Liga Draft do Futpoint</p><p class="s">Temporada 5 · Rodada 12 de 38 · <b>a liga está PARADA</b></p></div>
<div class="box"><p class="h">🏟️ TIMES DA LIGA · 20</p><p class="s">17 pessoas · 3 bots · <b>só o dono mexe aqui</b></p>
${pessoas.map(linhaP).join('')}<p class="mais">… + 12 pessoas</p>${bots.map(linhaB).join('')}
<p class="ex">✕ <b>Remover</b>: a pessoa sai e o time dela vira 🤖 bot (elenco, pontos e posição ficam).<br>➕ <b>Pôr alguém</b>: a pessoa nova assume o time do bot do jeito que está.</p></div>
<div class="box ped"><p class="h">🙋 PEDIDOS PRA ENTRAR · 2</p>
<div class="li"><span class="nm">Mengão do Sul <i class="tag ok">⭐ plano</i></span><span class="sp"></span></div>
<div class="li"><span class="nm">Zé Ninguém FC <i class="tag no">sem plano</i></span><span class="sp"></span></div>
<p class="ex">Quem não tem plano aparece, mas não pode entrar (com aviso pra ele do porquê).</p></div></div>`

const tela2 = `<div class="tela"><p class="cab">2 · TOCOU EM ➕ PÔR ALGUÉM</p>
<div class="modal"><p class="t">Quem assume o 🤖 Bot Tigres FC?</p><p class="s">4º lugar · 26 pts · elenco de 22 · caixa 312 🪙</p>
<div class="op sel">⭐ Mengão do Sul <span>pediu pra entrar</span></div>
<div class="op off">Zé Ninguém FC <span>🔒 precisa de plano</span></div>
<div class="op">📨 Convidar por código…</div>
<div class="aviso">O time continua com o nome do bot até a pessoa trocar. A partir da próxima noite ele é dela: elenco, pontos, caixa e lugar no draft.</div>
<button class="go">✅ Mengão do Sul assume o time</button><button class="cancel">Cancelar</button></div>
<p class="cab" style="margin-top:22px">CASO "LIGA CHEIA (20 PESSOAS)"</p>
<div class="box"><p class="s">Não tem bot → o botão ➕ não aparece. O dono primeiro ✕ remove alguém (o time vira bot) e aí ➕ põe a pessoa nova nesse time.</p></div></div>`

const tela3 = `<div class="tela"><p class="cab">3 · NO MEIO DA NOITE: ENCERRAR SEM SAIR</p>
<div class="ctrl"><p class="mini">🎮 CONTROLE DA PARTIDA</p><div class="row"><span class="b g">MANUAL</span><span class="b">AUTO</span><span class="b y">⚡ 3×</span></div>
<div class="row"><span class="b y wide">▶️ Próxima rodada</span><span class="b">PULAR</span></div>
<button class="noite">🌙 Encerrar a noite (só o dono)</button></div>
<div class="modal"><p class="t">🌙 Encerrar a noite?</p><p class="s">A liga para na <b>rodada 12</b>, fica guardada e todo mundo volta pra sala de espera da liga. Na próxima noite continua da rodada 13 — ninguém perde nada.</p>
<div class="aviso">Só dá com a rodada já apitada (nunca no meio de um jogo nem do leilão/draft).</div>
<button class="go">🌙 Encerrar por hoje</button><button class="cancel">Continuar jogando</button></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0}body{width:1560px;background:${CREAM};font-family:system-ui,sans-serif;color:${INK};padding:28px}
h1{font:700 34px Oswald;text-transform:uppercase;margin-bottom:4px}.sub{font-weight:700;opacity:.6;margin-bottom:22px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.cab{font:700 15px Oswald;letter-spacing:.5px;color:${ROXO};margin-bottom:10px}
.box,.modal,.ctrl{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px 14px;margin-bottom:14px}
.box.ped{background:#FFF4CF}.t{font:700 20px Oswald}.h{font:700 15px Oswald;letter-spacing:.5px}.s{font-size:13px;font-weight:600;color:#444;margin-top:3px}
.li{display:flex;align-items:center;gap:8px;border-top:1.5px solid #0002;padding:7px 0;font-size:14px;font-weight:700}
.li.bot{background:#EEF2FF;margin:0 -6px;padding:7px 6px}.pos{width:30px;font:700 14px Oswald;color:#777}.nm{flex:1}.pts{font:700 13px Oswald;color:#555}
.tag{font-style:normal;font-size:10px;background:${GOLD};border:1.5px solid ${INK};border-radius:999px;padding:1px 6px;margin-left:4px}.tag.ok{background:${GREEN};color:#fff}.tag.no{background:#ddd}
button{font:700 12px Oswald;border:2.5px solid ${INK};border-radius:9px;padding:5px 9px;box-shadow:2px 2px 0 ${INK};cursor:pointer}
.rm{background:#fff;color:${RED}}.add{background:${ROXO};color:#fff}.sp{width:84px}
.mais{font-size:12px;font-weight:700;color:#777;padding:6px 0;border-top:1.5px solid #0002}
.ex{font-size:12px;font-weight:600;color:#555;margin-top:8px;line-height:1.4}
.op{border:2.5px solid ${INK};border-radius:11px;padding:9px 11px;margin-top:8px;font-weight:800;display:flex;justify-content:space-between}
.op span{font-size:12px;font-weight:700;color:#666}.op.sel{background:${GOLD};box-shadow:3px 3px 0 ${INK}}.op.off{opacity:.45}
.aviso{background:#FFF4CF;border:2px dashed #a87b00;border-radius:10px;padding:8px 10px;font-size:12.5px;font-weight:700;margin-top:10px}
.go{display:block;width:100%;margin-top:10px;background:${GREEN};color:#fff;font-size:16px;padding:10px}.cancel{display:block;width:100%;margin-top:7px;background:#fff;font-size:14px}
.ctrl{background:#F4ECD6}.mini{font:700 11px Oswald;letter-spacing:1px;color:#0008;margin-bottom:6px}.row{display:flex;gap:6px;margin-bottom:6px}
.b{flex:1;text-align:center;font:700 14px Oswald;border:2.5px solid ${INK};border-radius:10px;padding:8px;background:#fff}.b.g{background:${GREEN};color:#fff}.b.y{background:${GOLD}}.b.wide{flex:2}
.noite{display:block;width:100%;background:#1E1B4B;color:#fff;font-size:15px;padding:10px;margin-top:4px}
</style></head><body><h1>Liga já começada: tirar, pôr gente e encerrar a noite</h1>
<p class="sub">Liga da Turma e Liga Draft · só o dono · só com a liga parada · quem entra precisa de plano</p>
<div class="grid">${tela1}${tela2}${tela3}</div></body></html>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'scripts/mockups/liga-vaga.png', fullPage: true })
await b.close()
console.log('🖼️ scripts/mockups/liga-vaga.png')
