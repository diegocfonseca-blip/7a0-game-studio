// 🔒 MOCKUP · CARREIRA GRÁTIS ATÉ A TEMPORADA 50 (27/10, Diego: "quem não tem plano… chegando na temporada 50 só avança quem tem
// plano pago… avise com um banner e a pessoa já abre os planos, mas não deixa ela seguir jogando mais aquele save… ela pagando
// descongela"). Quem já passou da 50 segue sem problema (333 carreiras na nuvem hoje). uso: node scripts/mockup-carreira-50.mjs
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const trava = `<div class="cel"><div class="top">🔨 FIM DA TEMPORADA 50 · DECISÃO</div><div class="pad">
 <div class="ban azul">➡️ CONTINUA NA SÉRIE B<small>Série B · Temporada 50 · 7 títulos na carreira</small></div>
 <div class="lock">
  <div class="li">🔒</div>
  <b class="lt">A CARREIRA GRÁTIS VAI ATÉ A TEMPORADA 50</b>
  <p>Pra jogar a <b>temporada 51</b> em diante com o Gaviões FC, escolha qualquer plano.</p>
  <p class="ok">✅ Seu save fica guardado do jeito que está. Assinou, ele destrava na hora e você segue de onde parou.</p>
  <span class="bt ouro">⭐ VER OS PLANOS E DESTRAVAR</span>
  <span class="bt branco">🚪 SAIR E SALVAR</span>
  <p class="aviso">☁️ Sem plano, a cópia na nuvem some se a carreira ficar 7 dias sem salvar. No aparelho ela continua.</p>
 </div>
 <p class="nota">No lugar de “Continuar com o mesmo time / Trocar tudo”. O resto da tela (jornal, caixa, Copa do Mundo) continua igual.</p>
</div></div>`

const pago = `<div class="cel"><div class="top">🔨 FIM DA TEMPORADA 50 · COM PLANO</div><div class="pad">
 <div class="ban azul">➡️ CONTINUA NA SÉRIE B<small>Série B · Temporada 50 · 7 títulos na carreira</small></div>
 <p class="q">COMO QUER SEGUIR?</p>
 <span class="bt verde">▶️ CONTINUAR COM O MESMO TIME</span>
 <span class="bt branco">🔄 TROCAR TUDO (NOVO LEILÃO)</span>
 <p class="nota">Quem tem qualquer plano (ou já passou da 50 antes desta regra) vê a tela de sempre.</p>
</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1010px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.75;font-size:15px}
.cols{display:flex;gap:22px;align-items:flex-start}.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{width:460px;border:4px solid #0C0C0C;border-radius:26px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.top{background:#0C0C0C;color:#FFC400;font:700 17px Oswald;padding:12px 16px}.pad{padding:14px}
.ban{border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:10px;text-align:center;color:#fff;font:700 20px Oswald}.ban small{display:block;font:700 12px system-ui;opacity:.8;margin-top:2px}.azul{background:#2E6FB0}
.lock{margin-top:12px;background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #000;padding:14px;text-align:center}
.li{font-size:38px}.lt{display:block;font:700 21px Oswald;line-height:1.1;margin:2px 0 6px}.lock p{margin:6px 0;font-size:14px;font-weight:600;line-height:1.4}
.ok{background:#E9F7EE;border:2px solid #1B7A3D;border-radius:10px;padding:6px 8px}.aviso{font-size:12px!important;opacity:.7}
.bt{display:block;text-align:center;font:700 16px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:12px;padding:10px;box-shadow:3px 3px 0 #000;margin-top:10px}
.ouro{background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)}.branco{background:#fff}.verde{background:#1B7A3D;color:#fff}
.q{text-align:center;font:700 14px Oswald;opacity:.6;margin:14px 0 0}.nota{font-weight:700;font-size:12.5px;margin:12px 2px 0;line-height:1.4;opacity:.8}
</style></head><body>
<h1>🔒 Carreira grátis até a temporada 50</h1>
<p class="sub">Sem plano, a carreira para na decisão do fim da temporada 50. O save não some: fica congelado até a pessoa assinar qualquer plano. Quem já passou da 50 segue livre.</p>
<div class="cols"><div><span class="tag">SEM PLANO · TEMPORADA 50</span>${trava}</div><div><span class="tag">COM PLANO</span>${pago}</div></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1010, height: 800 }, deviceScaleFactor: 1.4 })
await page.setContent(html); await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/carreira-50.png', fullPage: true })
await browser.close(); console.log('scripts/mockups/carreira-50.png')
