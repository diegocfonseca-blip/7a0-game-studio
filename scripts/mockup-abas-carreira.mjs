// Mockup (27/10): abas da carreira — EM CIMA no computador (com a logo do Leilão Legends no topo e a faixa da comunidade do
// WhatsApp), EMBAIXO e mais fortes no celular. Pedido do Diego depois de olhar o Brasileirinho: *"abas em cima e melhoradas
// pois acho tão apagadas, e também do móvel as abas de baixo melhoradas… além da logo Leilão Legends no PC lá no header e
// também o aviso da comunidade do zap"*. Rodar: node scripts/mockup-abas-carreira.mjs
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const fav = 'data:image/svg+xml;base64,' + fs.readFileSync('public/favicon.svg').toString('base64')
const ICON = {
  central: '<rect x="3" y="6" width="18" height="12.5" rx="2.4" F/><path d="M8.5 3.5L12 6l3.5-2.5M9 21h6M7 11.5l3.5 2-3.5 2z" P/>',
  jogos: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4" F/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" P/><circle cx="12" cy="15" r="2.4" P/>',
  tabelas: '<rect x="3.5" y="4" width="17" height="16" rx="2.4" F/><path d="M3.5 9h17M3.5 14.5h17M9 4v16" P/>',
  elenco: '<path d="M12 3.5l7 2.6v5.3c0 4.3-3 7.6-7 9.1-4-1.5-7-4.8-7-9.1V6.1z" F/><path d="M9.2 12.3l1.9 1.9 3.7-3.9" P/>',
  ranking: '<path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" F/><path d="M7 5.2H4.3v1.6A3.2 3.2 0 0 0 7 9.9M17 5.2h2.7v1.6A3.2 3.2 0 0 1 17 9.9M12 13.7v3.1M8.6 20.5h6.8" P/>',
  estadio: '<path d="M4 20.5V10l8-5.5 8 5.5v10.5z" F/><path d="M8.5 20.5v-4.6h7v4.6M8.5 12.4h7" P/>',
}
const ic = (k, cor, fill, sw = 2, sz = 24) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24">${ICON[k]
  .replaceAll(' F/>', ` fill="${fill}" stroke="${cor}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`)
  .replaceAll(' P/>', ` fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`)}</svg>`
// 🔁 27/10 (Diego: "jogo e tabela é na mesma página… é uma coisa só em cada lugar"): Jogos + Tabela é UMA aba só
const ABAS = [['central', 'Central'], ['jogos', 'Jogos + Tabela'], ['elenco', 'Elenco'], ['ranking', 'Rank'], ['estadio', 'Clube']]
const css = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;color:#0C0C0C}
.osw{font-family:Oswald,sans-serif}
.zap{height:36px;background:#14110C;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:600 13px Inter;position:relative}
.zap .dot{width:9px;height:9px;border-radius:9px;background:#25D366}
.zap b{font:800 13px Oswald}
.zap .btn{font:800 12px Oswald;letter-spacing:.05em;text-transform:uppercase;background:#25D366;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:999px;padding:3px 12px;box-shadow:2px 2px 0 #000}
.zap .x{position:absolute;right:14px;color:rgba(255,255,255,.55)}
.logo{display:flex;align-items:center;gap:9px}
.logo img{width:34px;height:34px}
.logo .t{font:900 25px/1 Oswald;text-transform:uppercase;letter-spacing:.01em}
.logo .t span{color:#C2452F}
.ph{background:repeating-linear-gradient(45deg,#ece2c6 0 10px,#e6dbbd 10px 20px);border:3px dashed rgba(12,12,12,.25);border-radius:16px;display:flex;align-items:center;justify-content:center;font:800 15px Oswald;color:rgba(12,12,12,.4);text-transform:uppercase}
.tit{font:900 30px Oswald;text-transform:uppercase;margin:0 0 4px}
.lbl{font:800 14px Oswald;text-transform:uppercase;letter-spacing:.06em;background:#0C0C0C;color:#FFC400;display:inline-block;padding:3px 10px;border-radius:8px}
`
// ─── COMPUTADOR ───
const abaTopo = ([k, n], on, extra = '') => `<div style="display:flex;align-items:center;gap:7px;padding:9px 15px;border-radius:12px;${on
  ? 'background:#0C0C0C;color:#FFC400;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #C2452F'
  : 'background:#fff;color:#0C0C0C;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #000'};position:relative">
  ${ic(k, on ? '#FFC400' : '#0C0C0C', on ? 'rgba(255,196,0,.25)' : 'rgba(12,12,12,.10)', 2.2, 22)}
  <span class="osw" style="font-weight:900;font-size:16px;text-transform:uppercase;letter-spacing:.03em">${n}</span>${extra}</div>`
const desk = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700;800;900&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body style="width:1440px;background:#F4ECD6">
<div class="zap"><span class="dot"></span><span>Já somos <b>16.703 técnicos</b> no Leilão Legends. Obrigado a cada um de vocês!</span><span class="btn">💬 Entre na comunidade</span><span class="x">✕</span></div>
<div style="background:#F4ECD6;border-bottom:3px solid #0C0C0C;padding:14px 32px;display:flex;align-items:center;gap:24px">
  <div class="logo"><img src="${fav}"><div class="t">Leilão <span>Legends</span></div></div>
  <div style="flex:1"></div>
  <div class="osw" style="font-weight:800;font-size:13px;border:2.5px solid #0C0C0C;border-radius:10px;padding:5px 11px;background:#fff;box-shadow:2px 2px 0 #000">🪙 1.240</div>
  <div class="osw" style="font-weight:800;font-size:13px;border:2.5px solid #0C0C0C;border-radius:10px;padding:5px 11px;background:#fff;box-shadow:2px 2px 0 #000">BR | EN</div>
  <div style="display:flex;align-items:center;gap:8px;font:700 14px Inter">👤 Seu Time FC</div>
</div>
<div style="padding:18px 32px 0">
  <div style="background:#fff;border:3px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #000;padding:12px 16px;display:flex;align-items:center;gap:18px">
    <div style="display:flex;align-items:center;gap:12px;min-width:0">
      <div style="width:46px;height:46px;border-radius:12px;background:#1B7A3D;border:3px solid #0C0C0C;display:flex;align-items:center;justify-content:center;font-size:24px">🛡️</div>
      <div><div class="osw" style="font-weight:900;font-size:22px;text-transform:uppercase;line-height:1">Seu Time FC</div>
      <div style="font:700 12px Inter;color:rgba(12,12,12,.6);margin-top:3px">T12 · Série B · 3º lugar · Rodada 14</div></div>
    </div>
    <div style="flex:1"></div>
    <div style="display:flex;gap:10px">
      ${ABAS.map((a, i) => abaTopo(a, i === 0, i === 1 ? '<span class="osw" style="position:absolute;top:-10px;right:-6px;background:#E8503A;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:0 5px;font-weight:900;font-size:10px">AO VIVO</span>' : i === 4 ? '<span class="osw" style="position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;border-radius:99px;background:#C2452F;color:#fff;border:2px solid #fff;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center">2</span>' : '')).join('')}
    </div>
  </div>
</div>
<div style="padding:18px 32px 28px;height:440px;display:flex">
  <div class="ph" style="flex:1">📺 Aqui fica SÓ a Central — do jeito que ela é hoje</div>
</div>
<div style="padding:0 32px 26px;font:700 13px Inter;color:rgba(12,12,12,.6)">👆 Cada aba mostra só o que é dela. No computador a barra de baixo SOME: as abas moram em cima, junto do nome do clube, sempre à vista.</div>
</body></html>`
// ─── CELULAR ───
const barraHoje = () => `<div style="display:flex;gap:2px;padding:6px 6px 10px;background:rgba(250,247,238,.97);border-top:1.5px solid rgba(12,12,12,.13)">
${ABAS.map(([k, n], i) => { const on = i === 0, cor = on ? '#1B7A3D' : 'rgba(12,12,12,.45)'
  return `<div style="flex:1;text-align:center;color:${cor}"><div style="display:flex;justify-content:center">${ic(k, cor, on ? 'rgba(12,12,12,.10)' : 'rgba(12,12,12,.10)')}</div><div class="osw" style="font-weight:${on ? 900 : 700};font-size:9.5px;text-transform:uppercase;margin-top:2px">${n}</div></div>` }).join('')}</div>`
const barraNova = () => `<div style="display:flex;gap:3px;padding:8px 6px 12px;background:#FFFDF6;border-top:3px solid #0C0C0C;box-shadow:0 -3px 0 rgba(0,0,0,.06)">
${ABAS.map(([k, n], i) => { const on = i === 0
  return `<div style="flex:1;text-align:center;position:relative">
    <div style="margin:0 auto;width:48px;height:32px;border-radius:11px;display:flex;align-items:center;justify-content:center;${on ? 'background:#0C0C0C;border:2.5px solid #0C0C0C;box-shadow:2px 2px 0 #C2452F' : 'border:2.5px solid transparent'}">${ic(k, on ? '#FFC400' : '#0C0C0C', on ? 'rgba(255,196,0,.25)' : 'rgba(12,12,12,.10)', 2.2, 24)}</div>
    <div class="osw" style="font-weight:900;font-size:11px;line-height:1.05;text-transform:uppercase;margin-top:3px;color:${on ? '#0C0C0C' : 'rgba(12,12,12,.78)'}">${n}</div>
    ${i === 1 ? '<span class="osw" style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#E8503A;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:0 5px;font-weight:900;font-size:9.5px;white-space:nowrap">AO VIVO</span>' : ''}
    ${i === 4 ? '<span class="osw" style="position:absolute;top:-6px;right:4px;min-width:18px;height:18px;border-radius:99px;background:#C2452F;color:#fff;border:2px solid #fff;font-weight:900;font-size:10px;display:flex;align-items:center;justify-content:center">2</span>' : ''}
  </div>` }).join('')}</div>`
const fone = (titulo, barra, zap) => `<div style="width:390px">
  <div class="osw" style="font-weight:900;font-size:20px;text-transform:uppercase;margin:0 0 10px">${titulo}</div>
  <div style="width:390px;height:700px;border:4px solid #0C0C0C;border-radius:30px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000;display:flex;flex-direction:column">
    ${zap ? `<div class="zap" style="height:34px;font-size:11.5px;gap:7px"><span class="dot"></span><span><b>16.703 técnicos</b> jogando</span><span class="btn" style="font-size:10.5px;padding:2px 9px">💬 Comunidade</span><span class="x" style="right:9px">✕</span></div>` : ''}
    <div style="padding:12px;flex:1;display:flex;flex-direction:column;gap:12px">
      <div class="ph" style="flex:1">📺 Só a Central</div>
    </div>
    ${barra}
  </div></div>`
const mob = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700;800;900&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body style="width:900px;background:#F4ECD6;padding:28px">
<div style="display:flex;gap:44px">${fone('Hoje', barraHoje(), false)}${fone('Nova ✨', barraNova(), true)}</div>
<div style="margin-top:18px;font:700 13.5px Inter;line-height:1.45;max-width:830px">👉 Ícone e nome em <b>preto de verdade</b> (não mais cinza apagado), letra maior, e a aba aberta vira um <b>botão preto com o ícone dourado</b> e a sombra dura do jogo. A barra ganha a borda preta grossa no topo. Contagem e AO VIVO continuam iguais.</div>
</body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [html, out] of [[desk, 'scripts/mockups/abas-carreira-pc.png'], [mob, 'scripts/mockups/abas-carreira-celular.png']]) {
  const p = await b.newPage({ deviceScaleFactor: 2 }); await p.setContent(html); await p.waitForTimeout(1500)
  await p.locator('body').screenshot({ path: out }); console.log(out); await p.close()
}
await b.close()
