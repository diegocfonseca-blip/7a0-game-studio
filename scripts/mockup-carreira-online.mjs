// 📸 MOCKUP (19/10): Carreira Online v2 — (1) sala de espera da carreira, (2) a barra do PRONTO antes da rodada.
//   node scripts/mockup-carreira-online.mjs → scripts/mockups/carreira-online-espera.png e carreira-online-pronto.png
import { chromium } from 'playwright-core'
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6', RED = '#C2452F'
const css = `<style>@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700;800;900&display=swap');
*{box-sizing:border-box}body{margin:0;background:${CREAM};font-family:system-ui,Arial,sans-serif;color:${INK}}
.o{font-family:Oswald,sans-serif;font-weight:900;text-transform:uppercase}
.box{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK}}
.btn{font-family:Oswald;font-weight:900;text-transform:uppercase;border:4px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};text-align:center;padding:13px 0;font-size:20px}
.tag{display:inline-block;font:800 11px Oswald;border:2px solid ${INK};border-radius:7px;padding:1px 6px}
</style>`
const clubes = [['😈 Wen Milan B 👑','A',1,1],['🦇 Neymarzetti 👑','A',1,1],['📍 Futpoint FC','B',1,1],['🐍 Tricolor do Arruda','B',1,0],['Cativeiro fc','C',1,1],['Low profile F.C','C',0,0],['LendiasFC','D',1,1],['Mauro bet','D',1,0]]
const cor = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460' }
const espera = `${css}<div style="padding:16px;max-width:430px;margin:0 auto">
<div style="background:${INK};color:${GOLD};border-radius:14px;padding:12px 14px" class="o">🌐 Carreira online · <span style="color:#fff">Temporada 3 · rodada 14</span></div>
<div class="box" style="padding:14px;margin-top:12px">
 <p class="o" style="margin:0;font-size:22px">A Pirâmide dos Amigos</p>
 <p style="margin:4px 0 10px;font-size:13px;font-weight:700;color:#5a5240">Dono: Neymarzetti · 8 técnicos · tudo salvo na nuvem do jogo</p>
 ${clubes.map(([n,d,on,pr])=>`<div style="display:flex;align-items:center;gap:8px;border:2px solid ${INK};border-radius:10px;padding:7px 9px;margin-bottom:6px;background:${on?'#fff':'#ece4cf'}">
  <span class="tag" style="background:${cor[d]};color:#fff">${d}</span><b style="flex:1;font-size:14px;${on?'':'color:#8a8170'}">${n}</b>
  <span style="font-size:12px;font-weight:800;color:${on?GREEN:'#8a8170'}">${on?'● chegou':'○ ainda não'}</span></div>`).join('')}
 <p style="font-size:12px;font-weight:700;color:#5a5240;margin:8px 0 12px">Quem não vier hoje joga com a última escalação. O clube continua guardado.</p>
 <div class="btn" style="background:${GOLD}">▶️ Continuar carreira</div>
 <p style="font-size:11.5px;font-weight:700;color:#7a7060;text-align:center;margin:8px 0 0">Só o dono da sala continua. Os outros esperam aqui.</p>
</div></div>`
const pronto = `${css}<div style="padding:16px;max-width:430px;margin:0 auto">
<div style="background:${INK};color:#fff;border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center"><span class="o" style="color:${GOLD}">Rodada 15 · Série A</span><span class="o" style="font-size:13px">próximo: 😈 Wen Milan B</span></div>
<div class="box" style="padding:14px;margin-top:12px;background:#FFF7DA">
 <div style="display:flex;align-items:center;gap:12px">
  <div style="width:66px;height:66px;border:3px solid ${INK};border-radius:50%;display:grid;place-items:center;background:#fff" class="o"><span style="font-size:24px">0:42</span></div>
  <div style="flex:1"><p class="o" style="margin:0;font-size:18px">Arrume seu time</p><p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#5a5240">A rodada começa quando todo mundo apertar PRONTO ou o tempo acabar.</p></div>
 </div>
 <div style="margin:12px 0 4px;height:14px;border:2px solid ${INK};border-radius:8px;background:#fff;overflow:hidden"><div style="width:62%;height:100%;background:${GREEN}"></div></div>
 <p style="margin:0 0 12px;font-size:13px;font-weight:800">✅ 5 de 8 prontos · faltam: Futpoint FC, Tricolor do Arruda, Mauro bet</p>
 <div style="display:flex;gap:8px"><div class="btn" style="flex:1;background:#fff;font-size:16px">🧩 Escalação</div><div class="btn" style="flex:1;background:#fff;font-size:16px">🎯 Tática</div></div>
 <div class="btn" style="background:${GREEN};color:#fff;margin-top:10px">✅ Estou pronto</div>
</div>
<div class="box" style="padding:12px;margin-top:12px"><p class="o" style="margin:0 0 6px;font-size:14px">Só o dono vê</p>
 <div style="display:flex;gap:8px"><div class="btn" style="flex:2;background:${GOLD};font-size:16px">▶️ Começar agora</div><div class="btn" style="flex:1;background:#fff;font-size:16px">⏸️ Pausar</div></div>
 <p style="font-size:11.5px;font-weight:700;color:#7a7060;margin:8px 0 0">Automático ligado · velocidade 1× · quem não apertar joga com a escalação que já está.</p></div>
</div>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html] of [['espera', espera], ['pronto', pronto]]) {
  const p = await b.newPage({ viewport: { width: 430, height: 820 }, deviceScaleFactor: 2 })
  await p.setContent(`<!doctype html><meta charset=utf-8>${html}`, { waitUntil: 'networkidle' })
  await p.screenshot({ path: `scripts/mockups/carreira-online-${nome}.png`, fullPage: true }); await p.close()
}
await b.close(); console.log('ok')
