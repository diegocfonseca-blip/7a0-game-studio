// 📸 MOCKUP (19/10): perfil com o ranking da carreira por temporada (última + melhor) e o online com "Todos os tempos".
//   node scripts/mockup-perfil-rankings.mjs  → scripts/mockups/perfil-rankings.png
import { chromium } from 'playwright-core'
const INK = '#0C0C0C', GOLD = '#FFC400', CREAM = '#F4ECD6'
const caixa = `background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:3px 3px 0 ${INK};padding:12px;margin-top:12px`
const h3 = `font:900 17px Oswald;text-transform:uppercase;margin:0 0 8px`
const tile = (top, num, sub, dest) => `<div style="flex:1;border:2px solid ${INK};border-radius:12px;text-align:center;padding:8px 4px;background:${dest ? '#FFF7DA' : '#f3eee0'}">
  <div style="font:800 12px system-ui;color:#555">${top}</div><div style="font:900 30px Oswald;line-height:1.1">${num}</div><div style="font:800 11px system-ui;color:#555">${sub}</div></div>`
const html = `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel=stylesheet>
<body style="margin:0;background:#222;font-family:system-ui">
<div style="background:${CREAM};margin:12px;border-radius:18px;padding:12px">
 <div style="background:${INK};color:${GOLD};border-radius:12px;padding:10px 14px;font:900 18px Oswald">👤 PERFIL</div>

 <p style="font:900 13px Oswald;color:#C2452F;margin:14px 0 0">① CARREIRA · POR TEMPORADA, IGUAL AO RANKING GLOBAL</p>
 <div style="${caixa};background:#FFF7DA;display:flex;gap:12px;align-items:center">
  <div style="min-width:96px;text-align:center"><div style="font:900 40px Oswald;line-height:1">540º</div></div>
  <div><p style="${h3};margin:0">📊 Ranking global da carreira</p>
   <p style="font:700 12.5px system-ui;color:#555;margin:3px 0 0">Última carreira · <b style="color:${INK}">Neymarzetti</b> · na temporada <b style="color:${INK}">5</b></p>
   <p style="font:800 12px system-ui;color:#7a5a00;margin:5px 0 0">🏅 Melhor posição: <b style="color:${INK}">206º</b> na temporada 44</p></div>
 </div>

 <p style="font:900 13px Oswald;color:#C2452F;margin:16px 0 0">② ONLINE · GANHA A CAIXA "TODOS OS TEMPOS"</p>
 <div style="${caixa}">
  <p style="${h3}">📊 No online</p>
  <div style="display:flex;gap:6px">${tile('Esta semana', '—', 'sem título ainda')}${tile('Este mês', '560º', '1 título', 1)}${tile('Todos os tempos', '562º', '1 título', 1)}</div>
  <p style="font:700 11px system-ui;color:#777;margin:6px 0 0;text-align:center">"Todos os tempos" conta desde 02/09, quando o jogo começou a guardar os títulos das salas.</p>
  <p style="font:900 18px Oswald;text-align:center;margin:8px 0 0">🥇 0 &nbsp; 🥈 0 &nbsp; 🥉 0</p>
 </div>
</div></body>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: new URL('./mockups/perfil-rankings.png', import.meta.url).pathname, fullPage: true })
await b.close(); console.log('ok')
