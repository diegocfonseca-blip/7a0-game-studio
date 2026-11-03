import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const F = [500,700].map(w=>`@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const bar = (nome, livre) => `<div class="id"><span class="lab">LOGADO COMO</span><span class="pill">${nome} ✏️</span>${livre?`<p class="av">🔓 Seu nome ainda não é reservado: se alguém com plano usar ele, o seu vira as iniciais. <u>Travar meu nome ⭐</u></p>`:''}</div>`
const ok = (t,s)=>`<div class="nr"><b>✅ ${t}</b> <i>NOVO</i><br><span>${s}</span></div>`
const html = `<!doctype html><meta charset=utf-8><style>${F}body{margin:0;background:#1d1510;font-family:system-ui;color:#fff;padding:18px;width:420px}
h3{font:700 16px Oswald;color:#FFC400;margin:14px 0 6px}
.id{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;background:rgba(12,12,12,.8);border:2px solid #51483b;border-radius:12px;padding:8px 12px}
.lab{font-size:10px;font-weight:900;letter-spacing:2px;color:rgba(255,255,255,.5)}.pill{border:2px solid rgba(255,255,255,.3);border-radius:99px;padding:4px 10px;font-weight:900;font-size:13px;background:rgba(255,255,255,.1)}
.av{flex-basis:100%;margin:0;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.55);line-height:1.35}.av u{color:#FFC400;font-weight:900}
.card{background:#fff;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:14px;padding:10px;box-shadow:3px 3px 0 #000}
.nr{background:#FFF4C2;border:2px solid #0C0C0C;border-radius:8px;box-shadow:2px 2px 0 #000;padding:4px 8px;font-size:13px}.nr i{font:700 10px Oswald;font-style:normal;background:#1B7A3D;color:#fff;border-radius:4px;padding:0 5px}.nr span{font-weight:500}
</style><h3>SALAS · conta SEM plano</h3>${bar('Joaozinho FC',true)}<h3>SALAS · conta COM plano (nada muda)</h3>${bar('Neymarzetti 👑',false)}
<h3>PLANOS (⭐ Craque e 👑 Lenda)</h3><div class="card">${ok('🔒 Nome único no jogo','ninguém mais cria conta com o nome do seu time · quem não tem plano e usava fica com as iniciais')}</div>
<h3>AVISO PRA QUEM PERDEU O NOME (o mesmo aviso de conta que já existe)</h3><div class="card" style="padding:0;overflow:hidden"><div style="background:#C2452F;color:#fff;font:700 18px Oswald;padding:10px 12px;border-bottom:3px solid #0C0C0C">🔤 SEU NOME MUDOU</div><p style="margin:0;padding:12px;font-size:14px;font-weight:600">Seu nome agora é JF, porque outro jogador reservou "Joaozinho FC" com plano. Sua carreira, seus títulos e seu clã continuam iguais. Quer outro nome? Troque quando quiser na sua Conta.</p></div>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 456, height: 800 } })
await pg.setContent(html); await pg.evaluate(()=>document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/nome-unico.png', fullPage: true }); await br.close()
