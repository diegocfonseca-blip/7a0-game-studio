// 💳 MOCKUP · PIX AUTOMÁTICO DO MERCADO PAGO (15/10): os 3 momentos da caixa de pagamento
// (gerou o Pix → esperando → caiu). Substitui a chave fixa + "manda o comprovante no Instagram".
// uso: node scripts/mockup-pix-mp.mjs → scripts/mockups/pix-mp.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
// QR de mentira (só desenho): grade pseudo-aleatória com os 3 olhos
const qr = (() => {
  const n = 29, c = 6; let s = 7, cel = ''
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const olho = (x, y) => `<rect x="${x*c}" y="${y*c}" width="${7*c}" height="${7*c}" fill="#000"/><rect x="${(x+1)*c}" y="${(y+1)*c}" width="${5*c}" height="${5*c}" fill="#fff"/><rect x="${(x+2)*c}" y="${(y+2)*c}" width="${3*c}" height="${3*c}" fill="#000"/>`
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const emOlho = (x < 8 && y < 8) || (x > n-9 && y < 8) || (x < 8 && y > n-9); if (!emOlho && r() < .48) cel += `<rect x="${x*c}" y="${y*c}" width="${c}" height="${c}" fill="#000"/>` }
  return `<svg viewBox="0 0 ${n*c} ${n*c}" width="190" height="190" style="background:#fff">${cel}${olho(0,0)}${olho(n-7,0)}${olho(0,n-7)}</svg>`
})()
const topo = `<div class="plano"><span>👑 PLANO LENDA</span><b>R$ 49,90</b></div>`
const tela = (t, corpo) => `<div class="col"><span class="tag">${t}</span><div class="box">${topo}${corpo}</div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65}
.cols{display:flex;gap:20px;align-items:flex-start}.col{width:340px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px;text-align:center}
.plano{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70);border:3px solid #0C0C0C;border-radius:12px;padding:8px 12px;font:700 16px Oswald;margin-bottom:12px}
.plano b{font-size:22px}
.btn{display:block;width:100%;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #000;padding:12px;font:700 18px Oswald;text-transform:uppercase;margin-top:10px}
.verde{background:#1B7A3D;color:#fff}.ouro{background:#FFC400}.branco{background:#fff}
.mini{font-size:12.5px;font-weight:700;color:#5a5240;line-height:1.4;margin:8px 0 0}
.qr{display:inline-block;border:3px solid #0C0C0C;border-radius:12px;padding:8px;background:#fff}
.cod{font:600 11px monospace;background:#F4ECD6;border:2px dashed #0C0C0C;border-radius:10px;padding:8px;word-break:break-all;margin-top:10px;text-align:left}
.esp{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;font:700 15px Oswald;text-transform:uppercase}
.pulso{width:12px;height:12px;border-radius:50%;background:#E8503A;box-shadow:0 0 0 5px rgba(232,80,58,.25)}
.relogio{font:700 13px Oswald;letter-spacing:.06em;color:#C2452F}
.ok{font-size:64px;line-height:1;margin:6px 0}
.okt{font:700 26px Oswald;text-transform:uppercase;color:#1B7A3D}
.lista{text-align:left;font-weight:700;font-size:13.5px;margin:10px 0 0;padding-left:18px;line-height:1.6}
.nota{margin-top:16px;font-weight:700;font-size:14px;max-width:1060px;line-height:1.45}
</style></head><body>
<h1>💳 Pix na hora, sem comprovante</h1><p class="sub">O jogo gera o Pix, o Mercado Pago avisa quando caiu, e o plano entra sozinho.</p>
<div class="cols">
${tela('1 · ESCOLHEU O PLANO', `
  <p class="mini" style="margin:0">O Pix sai com o valor certinho. Não precisa digitar nada nem mandar comprovante.</p>
  <button class="btn verde">⚡ GERAR MEU PIX</button>
  <p class="mini">Pagamento único. Nada de mensalidade.</p>`)}
${tela('2 · PIX GERADO', `
  <div class="qr">${qr}</div>
  <div class="cod">00020126580014br.gov.bcb.pix0136a1b2c3d4-…-5204000053039865405 49.905802BR5913LEILAO LEGENDS…</div>
  <button class="btn ouro">📋 COPIAR CÓDIGO PIX</button>
  <p class="mini">Abra o app do banco → Pix → <b>Copia e Cola</b> (ou leia o QR com a câmera).</p>
  <div class="esp"><span class="pulso"></span> Esperando o pagamento…</div>
  <div class="relogio">⏳ vale por 29:41</div>`)}
${tela('3 · CAIU!', `
  <div class="ok">✅</div>
  <div class="okt">Pagamento confirmado!</div>
  <p class="mini" style="font-size:14px">Seu <b>👑 Plano Lenda</b> já está valendo:</p>
  <ul class="lista"><li>cor dourada em todo lugar</li><li>Modo Manual</li><li>criar sala à vontade</li></ul>
  <button class="btn verde">🎮 BORA JOGAR</button>`)}
</div>
<p class="nota">• O preço é calculado no servidor (com a subida pela diferença + R$ 5 pra quem já tem plano).<br>
• O jogo só libera depois de conferir DIRETO no Mercado Pago que o Pix foi pago e com o valor certo.<br>
• Batismo/Fundador: o pagamento confirma na hora e o escudo/mascote seguem com você, como sempre.<br>
• Se o Pix vencer (30 min), é só gerar outro. A chave Pix antiga e o botão do comprovante saem.</p>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1110, height: 760 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/pix-mp.png', fullPage: true }); await b.close()
console.log('scripts/mockups/pix-mp.png')
