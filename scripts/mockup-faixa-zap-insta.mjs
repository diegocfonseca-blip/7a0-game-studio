// Mockup (27/10): faixa do topo — A) só a comunidade do Zap · B) Zap + Instagram (@leilaolegendscom).
// Pedido do Diego: *"entre na comunidade do Zap e siga nós, e também uma do siga nosso Instagram… as duas opções"*.
// Rodar: node scripts/mockup-faixa-zap-insta.mjs
import { chromium } from 'playwright-core'
const btn = (bg, cor, txt) => `<b style="flex:none;background:${bg};color:${cor};border:2px solid #0C0C0C;border-radius:999px;padding:1px 10px;box-shadow:2px 2px 0 #000;font:800 11.5px/18px Oswald;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap">${txt}</b>`
const ZAP = btn('#25D366', '#0C0C0C', '💬 Entrar')
const INSTA = btn('linear-gradient(90deg,#F58529,#DD2A7B,#8134AF)', '#fff', '📸 Seguir')
const faixa = (w, conteudo) => `<div style="width:${w}px;height:34px;background:#14110C;display:flex;align-items:center;justify-content:center;gap:9px;color:rgba(255,255,255,.9);font:600 13px Inter;position:relative;padding:0 30px;box-sizing:border-box;white-space:nowrap;overflow:hidden">${conteudo}<span style="position:absolute;right:11px;color:rgba(255,255,255,.55)">✕</span></div>`
const dot = c => `<span style="width:8px;height:8px;border-radius:9px;background:${c};flex:none"></span>`
const A = w => faixa(w, `${dot('#25D366')}<span>${w < 500 ? 'Entre na comunidade do Zap' : 'Entre na nossa comunidade do WhatsApp'}</span>${ZAP}`)
const Bpc = w => faixa(w, `${dot('#25D366')}<span>Entre na comunidade do Zap</span>${ZAP}<span style="color:rgba(255,255,255,.3);margin:0 6px">|</span>${dot('#DD2A7B')}<span>Siga no Instagram</span>${INSTA}`)
const Bcel = w => faixa(w, `<span>Comunidade</span>${ZAP}<span style="color:rgba(255,255,255,.3)">|</span><span>Instagram</span>${INSTA}`)
const bloco = (letra, titulo, pc, cel) => `<div style="background:#fff;border:3px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px 18px;margin-bottom:22px">
  <div style="font:900 22px Oswald;text-transform:uppercase;margin-bottom:12px"><span style="background:#FFC400;border:3px solid #0C0C0C;border-radius:10px;padding:0 9px;margin-right:8px">${letra}</span>${titulo}</div>
  <div style="font:800 12px Oswald;letter-spacing:.06em;text-transform:uppercase;color:rgba(12,12,12,.55);margin:0 0 5px">🖥️ computador</div>
  <div style="border:3px solid #0C0C0C;border-radius:10px;overflow:hidden;width:fit-content">${pc}<div style="height:44px;background:#F4ECD6;display:flex;align-items:center;padding:0 16px;font:900 22px Oswald;text-transform:uppercase">⚽ Leilão <span style="color:#C2452F;margin-left:6px">Legends</span></div></div>
  <div style="font:800 12px Oswald;letter-spacing:.06em;text-transform:uppercase;color:rgba(12,12,12,.55);margin:14px 0 5px">📱 celular</div>
  <div style="border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;width:fit-content">${cel}<div style="height:60px;background:#F4ECD6"></div></div>
</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;800;900&family=Inter:wght@500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:#F4ECD6;padding:26px;width:1180px;font-family:Inter;color:#0C0C0C">
<div style="font:900 32px Oswald;text-transform:uppercase;margin-bottom:16px">Faixa do topo — 2 opções</div>
${bloco('A', 'Só a comunidade do Zap', A(1100), A(390))}
${bloco('B', 'Zap + Instagram', Bpc(1100), Bcel(390))}
</body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ deviceScaleFactor: 2 }); await p.setContent(html); await p.waitForTimeout(1300)
await p.locator('body').screenshot({ path: 'scripts/mockups/faixa-zap-insta.png' }); await b.close(); console.log('ok')
