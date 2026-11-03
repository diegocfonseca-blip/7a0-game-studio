// ⭐ MOCKUP · PONTOS DE TÉCNICO + CHECK-IN + MISSÕES (03/11). Diego: "tem muita gente que não paga e fica fazendo conta atrás de
// conta… algo com pontos, quem começa numa sala e vai até o final… além de check-in de missões". Pontos ficam na CONTA; conta nova
// começa do zero. uso: node scripts/mockup-pontos-tecnico.mjs → scripts/mockups/pontos-tecnico.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const dias = [[1, 5, 'ok'], [2, 10, 'ok'], [3, 10, 'ok'], [4, 15, 'hoje'], [5, 15, ''], [6, 15, ''], [7, 30, 'bau']]
const missao = (ic, t, prog, tot, pts, feita) => `<div class="mis ${feita ? 'feita' : ''}"><span class="mi">${ic}</span><div class="mt"><b>${t}</b><div class="bar"><i style="width:${Math.round(prog / tot * 100)}%"></i></div><small>${prog}/${tot}</small></div><span class="mp">${feita ? '✅' : `+${pts}`}</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:900px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin:6px 0 10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 12px;margin-bottom:16px}
.saldo{display:flex;align-items:center;gap:14px;background:linear-gradient(150deg,#262626,#0c0c0c);color:#fff;border-radius:14px;padding:14px 16px;border:3px solid #0C0C0C}
.saldo b{font:700 40px Oswald;color:#FFC400;line-height:1}.saldo small{font-weight:800;opacity:.85}
.dias{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin:12px 0 4px}
.d{border:3px solid #0C0C0C;border-radius:12px;text-align:center;padding:8px 2px;font:700 13px Oswald;background:#fff}
.d.ok{background:#1B7A3D;color:#fff}.d.hoje{background:#FFC400;box-shadow:3px 3px 0 #000}.d.bau{background:linear-gradient(160deg,#FFE79A,#FFC400)}
.d span{display:block;font-size:20px}
.btn{display:inline-block;background:#FFC400;border:3px solid #0C0C0C;border-radius:10px;box-shadow:3px 3px 0 #000;font:700 16px Oswald;padding:7px 16px;margin-top:8px}
.mis{display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:8px}
.mis.feita{background:#E3F4E8}.mi{font-size:24px}.mt{flex:1}.mt b{font:700 15px Oswald;display:block}.mt small{font-size:11px;font-weight:800;opacity:.6}
.bar{height:8px;background:#eee;border:1.5px solid #0C0C0C;border-radius:99px;overflow:hidden;margin:4px 0 2px}.bar i{display:block;height:100%;background:#1B7A3D}
.mp{font:700 18px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px}
.loja{display:flex;align-items:center;gap:12px;border:2px solid #0C0C0C;border-radius:12px;padding:10px;margin-bottom:8px}
.loja b{font:700 16px Oswald;flex:1}.troca{background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:8px;font:700 14px Oswald;padding:4px 12px;box-shadow:2px 2px 0 #000}
.cinza{opacity:.45}.leg{font-size:14px;font-weight:600;line-height:1.5;margin:6px 0 0}
.dois{display:flex;gap:18px}.dois>div{flex:1}
.fim{border:3px solid #0C0C0C;border-radius:12px;padding:12px;background:#FFF6D6;font-weight:700;font-size:14px;line-height:1.45}
</style></head><body>
<h1>⭐ Pontos de técnico</h1>
<p class="sub">Ficam guardados na conta. Joga até o fim, faz check-in, cumpre missão → junta pontos → troca por sala extra. Conta nova começa do zero.</p>

<span class="tag">1 · O SALDO (topo da home, embaixo do nome)</span>
<div class="box"><div class="saldo"><span style="font-size:40px">⭐</span><div><b>340</b><small>pontos de técnico · 🔥 4 dias seguidos</small></div><span style="flex:1"></span><span class="btn" style="margin:0">🎁 Trocar</span></div></div>

<span class="tag">2 · CHECK-IN DO DIA</span>
<div class="box">
<div class="dias">${dias.map(([n, p, c]) => `<div class="d ${c}">${c === 'ok' ? '✅' : c === 'bau' ? '🎁' : c === 'hoje' ? '⭐' : '·'}<span>+${p}</span>dia ${n}</div>`).join('')}</div>
<span class="btn">⭐ Fazer check-in de hoje (+15)</span>
<p class="leg">Um toque por dia. Dias seguidos rendem mais; o 7º dia é o baú (+30). <b>Faltou um dia, a sequência volta pro dia 1.</b></p>
</div>

<div class="dois"><div>
<span class="tag">3 · MISSÕES DE HOJE</span>
<div class="box">
${missao('🏁', 'Termine 2 salas até o fim', 1, 2, 20, false)}
${missao('⚔️', 'Ganhe um clássico da sala', 1, 1, 20, true)}
${missao('👑', 'Faça gol com uma lenda', 0, 1, 20, false)}
<p class="leg">Troca todo dia à meia-noite.</p></div>
</div><div>
<span class="tag">4 · MISSÕES DA SEMANA</span>
<div class="box">
${missao('🏆', 'Seja campeão de uma copa', 0, 1, 50, false)}
${missao('🔨', 'Termine 10 salas até o fim', 6, 10, 50, false)}
${missao('🤝', 'Jogue uma sala com o seu clã', 1, 1, 30, true)}
<p class="leg">Troca toda segunda, junto com o ranking.</p></div>
</div></div>

<span class="tag">5 · JOGAR ATÉ O FIM (fim da sala)</span>
<div class="box"><div class="fim">🏁 Você jogou a sala até o fim: <b>+10 ⭐</b><br><span style="font-weight:600">Missão "Termine 2 salas": 2/2 ✅ <b>+20 ⭐</b></span></div>
<p class="leg">Quem sai no meio não ganha. Só conta sala com 2+ pessoas.</p></div>

<span class="tag">6 · TROCAR OS PONTOS</span>
<div class="box">
<div class="loja"><span style="font-size:26px">🎟️</span><b>+1 sala extra</b><span class="mp">150 ⭐</span><span class="troca">Trocar</span></div>
<div class="loja cinza"><span style="font-size:26px">🧑‍💼</span><b>Peça do presidente (em breve)</b><span class="mp">— ⭐</span></div>
<p class="leg">A sala extra fica guardada na conta e é usada quando a sala do dia acaba — igual à sala extra comprada na Loja.</p></div>

<span class="tag">7 · AS REGRAS</span>
<div class="box"><p class="leg" style="margin:0">
✅ Pontos são da CONTA: não passam pra outra e conta nova começa com 0.<br>
✅ Mesmo celular com várias contas: só UMA ganha o check-in do dia.<br>
✅ Só conta sala com 2+ pessoas e jogada até o fim (sair no meio = 0).<br>
✅ Quem tem plano também junta pontos (cria sala à vontade, mas usa nas outras trocas).</p></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ viewport: { width: 944, height: 800 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/pontos-tecnico.png', fullPage: true })
await br.close()
console.log('ok')
