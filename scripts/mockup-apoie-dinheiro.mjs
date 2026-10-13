#!/usr/bin/env node
// 🎨 MOCKUP — "PRA ONDE VAI O DINHEIRO" + META DO MÊS na tela de apoio (13/10)
// Diego mandou o print do Brasileirinho: *"precisamos fazer algo parecido… dizer aonde vai o dinheiro mas sempre
// com nossa forma de falar… padrões visuais"* + uma barra do mês: quanto entrou × quanto custou (Supabase + Claude),
// com a marca de "o jogo se paga" e a de "sustentável". A barra mostra só % pro público (valores ficam com o Diego).
// uso: node scripts/mockup-apoie-dinheiro.mjs [pct]
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const PCT = Number(process.argv[2] ?? 52)
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const item = (ic, t, d) => `<div class="it"><span class="ic">${ic}</span><div><b>${t}</b><p>${d}</p></div></div>`
const marca = (p, t, ok) => `<div class="mk" style="left:${p}%"><i></i><span class="${ok ? 'ok' : ''}">${t}</span></div>`
const SUST = 150
const larg = Math.min(100, PCT / SUST * 100)
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:#0C0C0C;width:420px;padding:18px 16px 28px}
h1{font:700 34px/1 Oswald;text-transform:uppercase;margin:0}.sub{font-size:14px;line-height:1.4;margin:8px 0 16px;font-weight:600;color:#3a3a32}
.box{background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #0C0C0C;padding:16px;margin-bottom:16px}
h2{font:700 22px/1 Oswald;text-transform:uppercase;margin:0 0 4px}.h2s{font-size:13px;color:#53534b;font-weight:600;margin:0 0 10px}
.it{display:flex;gap:10px;padding:10px 0;border-top:2px dashed #0c0c0c22}.it:first-of-type{border-top:0}
.ic{font-size:24px;line-height:1;width:30px;text-align:center}.it b{font:700 16px Oswald;text-transform:uppercase}.it p{margin:2px 0 0;font-size:13px;line-height:1.4;color:#3a3a32}
.selo{margin-top:10px;background:#FFC400;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px;font:700 15px/1.3 Oswald}
.meta h2{display:flex;justify-content:space-between;align-items:baseline}.meta h2 em{font-style:normal;color:#1B7A3D;font-size:28px}
.bar{position:relative;height:26px;border:3px solid #0C0C0C;border-radius:12px;background:#F4ECD6;margin:30px 0 10px;overflow:visible}
.fill{position:absolute;inset:0 auto 0 0;border-radius:8px;background:repeating-linear-gradient(135deg,#1B7A3D 0 12px,#239a4e 12px 24px)}
.mk{position:absolute;top:-30px;bottom:-4px;transform:translateX(-50%)}.mk i{position:absolute;left:50%;top:22px;bottom:0;width:3px;margin-left:-1.5px;background:#0C0C0C}
.mk span{position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:nowrap;font:700 11px Oswald;letter-spacing:.04em;background:#fff;border:2px solid #0C0C0C;border-radius:7px;padding:1px 6px}.mk span.ok{background:#1B7A3D;color:#fff}.mk.fim span{left:auto;right:-2px;transform:none}
.lin{font-size:13px;font-weight:600;line-height:1.4;margin:6px 0}.lin b{font:700 14px Oswald;text-transform:uppercase}
.pq{font-size:11px;color:#53534b;margin:8px 0 0}
.tag{font:700 10px Oswald;letter-spacing:.12em;background:#7C3AED;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:1px 6px}
</style></head><body>
<h1>🔨 Apoie o jogo</h1>
<p class="sub">O Leilão Legends é de graça e vai continuar de graça. Quem apoia banca o servidor e faz chegar novidade toda semana.</p>
<div class="box"><h2>💸 Pra onde vai o dinheiro</h2><p class="h2s">Sem mistério: cada real vira jogo.</p>
${item('🗄️', 'O cofre da carreira', 'Cada carreira é um mundo inteiro guardado no servidor: elencos, contratos, tabelas, 190 temporadas de história. Tem gente com save de quase 1 MB. Alguém paga esse armário.')}
${item('📡', 'A sala ao vivo', 'Cada lance, cada envelope, cada zoeira do chat viaja na hora pra todo mundo da sala. São milhões de mensagens por mês passando pelo servidor.')}
${item('🧠', 'Quem faz o jogo', 'Novidade toda semana, conserto no mesmo dia, carta nova, batismo novo. Isso tem ferramenta e tem hora de trabalho.')}
${item('🌙', 'Horário de pico', 'À noite, com as salas lotadas, o servidor trabalha dobrado. É aí que ele mais custa.')}
<div class="selo">Apoiar não deixa seu time mais forte. Não muda placar, leilão, dinheiro do clube nem ranking. Aqui ninguém compra título. 🏆</div></div>
<div class="box meta"><h2>📊 Meta de outubro <em>${PCT}%</em></h2><p class="h2s">Quanto do custo deste mês o apoio da galera já pagou.</p>
<div class="bar"><div class="fill" style="width:${larg}%"></div>${marca(100 / SUST * 100, '🧾 100%', PCT >= 100)}${marca(100, '🚀 ' + SUST + '%', PCT >= SUST).replace('class="mk"', 'class="mk fim"')}</div>
<div class="lin">${PCT >= 100 ? '✅' : '⏳'} <b>O jogo se paga</b> — aos 100%: servidor e ferramentas pagos.</div>
<div class="lin">${PCT >= SUST ? '✅' : '⏳'} <b>Sustentável</b> — aos ${SUST}%: sobra pra crescer (mais servidor, mais novidade).</div>
<p class="pq">A barra mostra só a porcentagem. Atualiza ao longo do mês.</p></div>
</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `apoie-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/apoie-dinheiro.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/apoie-dinheiro.png')
