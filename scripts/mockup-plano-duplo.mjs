// 💛 MOCKUP · PLANO DUPLO (16/10): Diego — "plano duplo poderia ter desconto de 10%… de qualquer plano… sutilmente embaixo
// do plano" e "o valor tem que ser um só pagando, já com desconto". 2 do mesmo plano (um pra você, um de presente) num Pix só.
// uso: node scripts/mockup-plano-duplo.mjs → scripts/mockups/plano-duplo.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const plano = (nome, sub, preco, duplo, cheio, grad) => `<div class="pl" style="background:${grad}"><div class="top"><b>${nome}</b><span class="pr">R$ ${preco}</span></div><p>${sub}</p>
 ${duplo ? `<div class="dup"><span>💛 Leve 2: um pra você, outro de presente</span><span class="dp"><s>R$ ${cheio}</s> <b>R$ ${duplo}</b> <i>-10%</i></span></div>` : ''}</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:20px}
h1{margin:0;font-size:26px;text-transform:uppercase}.sub{margin:2px 0 14px;font-weight:500}
.cols{display:flex;gap:22px;align-items:flex-start}.col{width:380px}
.tag{display:inline-block;font-weight:700;text-transform:uppercase;border:3px solid #000;border-radius:10px;padding:2px 10px;box-shadow:3px 3px 0 #000;background:#FFC400;margin-bottom:10px;font-size:14px}
.pl{border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:12px}
.top{display:flex;justify-content:space-between;align-items:center}.top b{font-size:20px;text-transform:uppercase}
.pr{background:#0C0C0C;color:#FFC400;border-radius:9px;padding:2px 10px;font-weight:700;font-size:16px}
.pl p{margin:4px 0 0;font-weight:500;font-size:13px}
.dup{margin-top:8px;border-top:2px dashed rgba(0,0,0,.25);padding-top:6px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;font-weight:700}
.dp{white-space:nowrap}.dp s{opacity:.55;font-weight:500}.dp b{font-size:14px}.dp i{font-style:normal;background:#1B7A3D;color:#fff;border-radius:6px;padding:0 5px;margin-left:3px;font-size:11px}
.pix{background:#fff;border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px}
.pix h3{margin:0 0 6px;font-size:20px;text-transform:uppercase}.lin{display:flex;justify-content:space-between;font-weight:500;font-size:14px;padding:3px 0}
.tot{border-top:3px solid #000;margin-top:6px;padding-top:6px;font-size:20px;font-weight:700}
.campo{margin-top:10px;font-weight:700;font-size:13px}.inp{border:2px solid #000;border-radius:10px;padding:7px 9px;background:#F4ECD6;font-weight:500;margin-top:4px}
.btn{display:block;text-align:center;margin-top:12px;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px;font-weight:700;font-size:17px;text-transform:uppercase}
.nota{font-weight:500;font-size:13px;margin:10px 2px 0;line-height:1.3}
</style></head><body>
<h1>💛 Plano duplo: 2 planos, 1 Pix, 10% a menos</h1><p class="sub">Uma linha discreta embaixo de cada plano. O valor já vem com o desconto.</p>
<div class="cols">
 <div class="col"><span class="tag">Na lista de planos</span>
  ${plano('⭐ Craque', 'Modo Manual, nível e olheiro até Craque, nome prata', '29,90', '53,90', '59,80', 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)')}
  ${plano('👑 Lenda', 'nível e olheiro até Lenda, nome dourado, salas à vontade, Minhas Ligas', '49,90', '89,90', '99,80', 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)')}
  ${plano('🖋 Batismo', 'escudo, mascote e manto feitos só pro seu clube + entrada de gala', '79,90', '', '', 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)')}
  <p class="nota">Batismo e Fundador ficam sem o "leve 2" porque cada um dá trabalho de arte seu.</p></div>
 <div class="col"><span class="tag">Tocou no "leve 2"</span>
  <div class="pix"><h3>💛 2× 👑 Lenda</h3>
   <div class="lin"><span>👑 Lenda pra você</span><span>R$ 49,90</span></div>
   <div class="lin"><span>🎁 👑 Lenda de presente</span><span>R$ 49,90</span></div>
   <div class="lin" style="color:#1B7A3D;font-weight:700"><span>Desconto do plano duplo</span><span>− R$ 9,90</span></div>
   <div class="lin tot"><span>Um Pix só</span><span>R$ 89,90</span></div>
   <div class="campo">E-mail do amigo que vai ganhar<div class="inp">amigo@email.com</div></div>
   <span class="btn">Gerar Pix de R$ 89,90</span></div>
  <p class="nota">Paga uma vez. Caiu o Pix, o seu plano libera na hora e o do amigo chega como 🎁 presente, com o aviso "Fulano te deu um presente!". Se o amigo ainda não tem conta, o presente espera ele criar.</p></div>
</div></body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 860, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/plano-duplo.png', fullPage: true }); await b.close()
console.log('scripts/mockups/plano-duplo.png')
