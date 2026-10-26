// 🏆⚔️ MOCKUP · AVISO DE FIM DE SEMANA (26/10, Diego: "o ranking do clã vai acabar junto com o dos individuais… meia-noite… aparece
// esse modal diferente na tela dele informando que o clã dele venceu na semana, dando parabéns, falando o nome do clã vencedor, e que
// cada participante ganhará 30 moedas… e fale pela zoação também de poder zoar o clã perdedor… quando fechar o X não aparece mais…
// em qualquer lugar da tela. Já dos individuais aparece também dando parabéns aos vencedores, moedas ganhas e que estarão no telão").
// uso: node scripts/mockup-premio-semana-modal.mjs → scripts/mockups/premio-semana-modal.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const fundo = `<div class="fundo"><div class="fx"></div><div class="fx"></div><div class="fx curto"></div><div class="fx"></div><div class="fx curto"></div></div>`
const cla = `<div class="cel">${fundo}<div class="veu"></div>
 <div class="modal">
  <button class="x">✕</button>
  <div class="selo">⚔️ CLÃS DA SEMANA · FECHOU</div>
  <div class="escudo"><span>⚡</span></div>
  <div class="tit">SEU CLÃ<br>É O CAMPEÃO!</div>
  <div class="nome">🥇 LADO A-DPA</div>
  <div class="num">276 títulos online na semana</div>
  <div class="moedas"><b>+30 🪙</b><span>pra CADA membro jogar no modo carreira<br><small>caem sozinhas na próxima vez que você abrir a carreira</small></span></div>
  <div class="telao">📺 O Lado A-DPA passa no telão de todas as salas a semana inteira</div>
  <div class="zoeira"><small>😜 ZOEIRA LIBERADA</small>O <b>Futpoint</b> ficou com 96… vai precisar de mais 180 títulos e um milagre 🙏</div>
  <div class="botoes"><span class="btn zap">📲 ZOAR O FUTPOINT NO ZAP</span><span class="btn ok">BORA! 🔨</span></div>
 </div></div>`
const ind = `<div class="cel">${fundo}<div class="veu"></div>
 <div class="modal ouro">
  <button class="x">✕</button>
  <div class="selo">📊 RANKING DA SEMANA · FECHOU</div>
  <div class="medalha">🥇</div>
  <div class="tit">VOCÊ FOI O<br>1º DA SEMANA!</div>
  <div class="nome">LABUBU F.C</div>
  <div class="num">54 títulos online — ninguém fez mais</div>
  <div class="moedas"><b>+30 🪙</b><span>pra jogar no modo carreira<br><small>caem sozinhas na próxima vez que você abrir a carreira</small></span></div>
  <div class="lista">
   <div>🥇 Medalha no nome por <b>30 dias</b></div>
   <div>📺 Sua vitória no <b>telão de TODAS as salas</b> a semana inteira</div>
  </div>
  <div class="botoes"><span class="btn zap">📲 CONTAR NO ZAP</span><span class="btn ok">BORA! 🔨</span></div>
 </div></div>`
const ind2 = `<div class="mini"><b>2º e 3º</b> recebem o MESMO aviso, com 🥈 +20 🪙 ou 🥉 +10 🪙.<br>
 Clã em 2º e 3º também: "Seu clã ficou em 2º" · +20 🪙 / +10 🪙 cada membro (sem a zoeira — zoeira é só do campeão).</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1010px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65;font-size:15px}
.cols{display:flex;gap:26px}.col{width:470px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{position:relative;width:470px;height:820px;border:4px solid #0C0C0C;border-radius:30px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.fundo{padding:70px 22px}.fx{height:64px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;margin-bottom:14px}.fx.curto{width:70%}
.veu{position:absolute;inset:0;background:rgba(12,12,12,.62)}
.modal{position:absolute;left:22px;right:22px;top:46px;background:#FFF8E6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:6px 6px 0 #000;padding:20px 20px 18px;text-align:center}
.modal.ouro{background:linear-gradient(170deg,#FFF6D0,#FFF8E6 40%)}
.x{position:absolute;right:12px;top:12px;width:38px;height:38px;border:3px solid #0C0C0C;border-radius:12px;background:#fff;font:700 18px Oswald;box-shadow:2px 2px 0 #000}
.selo{display:inline-block;font:700 12px Oswald;letter-spacing:1.2px;background:#7C3AED;color:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:3px 10px;box-shadow:2px 2px 0 #000}
.escudo{width:96px;height:110px;margin:14px auto 6px;background:#2563EB;border:4px solid #0C0C0C;border-radius:16px 16px 48px 48px;box-shadow:4px 4px 0 #000;display:flex;align-items:center;justify-content:center;font-size:52px}
.medalha{font-size:84px;line-height:1;margin:12px 0 4px;filter:drop-shadow(3px 3px 0 #000)}
.tit{font:700 34px/1.02 Oswald;text-transform:uppercase;margin:4px 0 8px}
.nome{display:inline-block;font:700 24px Oswald;background:linear-gradient(160deg,#FFE79A,#FFC400 45%,#E8A200);border:3px solid #0C0C0C;border-radius:12px;padding:4px 16px;box-shadow:3px 3px 0 #000}
.num{font-weight:700;font-size:14px;opacity:.7;margin:8px 0 12px}
.moedas{display:flex;align-items:center;gap:12px;text-align:left;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:10px 14px;box-shadow:3px 3px 0 #000;margin-bottom:10px}
.moedas b{font:700 34px Oswald;white-space:nowrap}.moedas span{font-weight:700;font-size:14px;line-height:1.25}.moedas small{font-weight:600;opacity:.85;font-size:12px}
.telao{font-weight:700;font-size:14px;background:#fff;border:2px dashed #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:10px}
.lista{text-align:left;background:#fff;border:2px solid #0C0C0C;border-radius:12px;padding:8px 12px;margin-bottom:12px;font-weight:600;font-size:14px;line-height:1.7}
.zoeira{text-align:left;background:#FFE3DD;border:3px solid #0C0C0C;border-radius:14px;padding:9px 12px;font-weight:600;font-size:15px;line-height:1.3;margin-bottom:12px;box-shadow:3px 3px 0 #000}
.zoeira small{display:block;font:700 12px Oswald;letter-spacing:1px;color:#C2452F;margin-bottom:2px}
.botoes{display:flex;gap:10px}.btn{flex:1;font:700 15px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:12px;padding:11px 6px;box-shadow:3px 3px 0 #000}
.zap{background:#25D366;color:#0C0C0C}.ok{background:#FFC400}
.nota{font-weight:700;font-size:14px;margin:10px 4px 0;line-height:1.4}
.mini{margin-top:18px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 14px;font-weight:600;font-size:14px;line-height:1.45;box-shadow:3px 3px 0 #000}
</style></head><body>
<h1>🏆 Fim da semana: o aviso na tela</h1>
<p class="sub">Segunda 0h (Brasília) fecham os DOIS rankings juntos — técnicos e clãs. Na 1ª vez que a pessoa abrir o jogo depois, em QUALQUER tela, aparece o aviso. Fechou no ✕ (ou no BORA), não volta mais — em nenhum aparelho.</p>
<div class="cols">
 <div class="col"><span class="tag">⚔️ MEMBRO DO CLÃ CAMPEÃO</span>${cla}<p class="nota">A zoeira sorteia uma frase com o 2º colocado (várias frases, pra não repetir). O botão verde abre o WhatsApp com a frase pronta.</p></div>
 <div class="col"><span class="tag">🥇 TÉCNICO NO PÓDIO</span>${ind}<p class="nota">Quem foi do pódio E do clã campeão vê os dois avisos, um depois do outro.</p>${ind2}</div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1054, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/premio-semana-modal.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/premio-semana-modal.png')
