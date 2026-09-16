// 🖼️ MOCKUP — ESTÁDIO: FICOU ASSIM (as 6 mudanças, já no ar).
// Diego, 16/09: *"pode fazer tudo… e me manda mockup depois"*.
// Este é o "depois": o mesmo formato do mockup que ele aprovou, agora com ✅ e os
// números MEDIDOS depois de implementar.
// Rodar: node scripts/mockup-estadio-feito.mjs [saida.png]
import { chromium } from 'playwright-core'
const SAIDA = process.argv[2] || '/tmp/mockup-estadio-feito.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D'
const L = [
  ['🎭 Camarote', 'cada lugar valia igual ao da geral', 'cada lugar vale por <b>DOIS</b> — quem senta no camarote gasta mais'],
  ['☂️ Cobertura', 'não trazia nenhum torcedor', '<b>+8% de venda de camisa</b> — sem chuva, o povo vem'],
  ['💡 Refletores', 'não trazia nenhum torcedor', '<b>+5% de venda de camisa</b> — jogo à noite enche mais'],
  ['🎟️ Bilheteria', 'os lugares NÃO contavam', 'os lugares <b>CONTAM</b>: +1 moeda a cada 3.000 lugares'],
  ['🧍 Torcida', '12.000 em TODAS as divisões', '<b>cresce quando você sobe</b>: V 12.000 · D 20.000 · C 35.000 · B 60.000 · A 100.000'],
  ['🌱 Gramado', 'ficava nas Arquibancadas (com 0 lugares)', 'foi pras <b>Melhorias</b>, e agora diz <b>"sem lugares"</b>'],
  ['📱 A tela', 'a graça da obra ESCONDIA quanto ela rende', 'mostra <b>preço E renda juntos</b> — até nas obras trancadas'],
]
const IMP = [
  ['🎟️ Bilheteria — estádio completo, 3º lugar', '112', '132'],
  ['🎟️ Bilheteria — estádio completo, 10º lugar', '77', '90'],
  ['👕 Camisa — Série A, estádio meio construído', '21', '55'],
  ['👕 Camisa — Série B', '21', '40'],
  ['👕 Camisa — Série C', '21', '30'],
  ['👕 Camisa — VÁRZEA', '21', '21 — não muda'],
]
const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box;margin:0}
 body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:940px;padding:26px}
 h1{font-size:40px;font-weight:900;text-transform:uppercase;line-height:.95}
 h1 .v{color:${VERDE}}
 .big{background:${VERDE};color:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
      padding:14px 17px;font-size:16px;font-weight:800;margin:14px 0 18px}
 .lin{display:grid;grid-template-columns:44px 1fr 1fr;gap:12px;margin-bottom:10px;align-items:stretch}
 .n{background:${VERDE};color:#fff;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900}
 .cx{border:3px solid ${INK};border-radius:13px;padding:10px 12px;box-shadow:3px 3px 0 ${INK}}
 .cx.a{background:#F1EDE2;opacity:.75} .cx.b{background:#EAF5EE}
 .cx h5{font-size:15px;font-weight:900;margin-bottom:4px}
 .cx p{font-size:12.5px;font-weight:600;line-height:1.45}
 .cx.a p{color:#777}
 .cx.b p b{color:${VERDE}}
 .hd{display:grid;grid-template-columns:44px 1fr 1fr;gap:12px;margin-bottom:7px}
 .hd div{font-size:12.5px;font-weight:900;text-transform:uppercase;letter-spacing:1px;padding-left:4px;color:#888}
 .hd .b{color:${VERDE}}
 .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:16px;margin-top:18px}
 .cab{display:inline-block;background:${VERDE};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
      text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:10px}
 table{width:100%;border-collapse:collapse;font-size:14px}
 th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:6px 8px;color:#666;font-weight:700}
 th.l,td.l{text-align:left}
 td{padding:9px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
 td.l{font-weight:700;font-size:13.5px} .h{color:#aaa} .d{color:${VERDE};font-weight:900;font-size:16px}
</style>
<h1>ESTÁDIO: <span class="v">FICOU ASSIM</span></h1>
<div class="big">✅ AS 7 MUDANÇAS ESTÃO NO AR. Ninguém perdeu nada — todas só somam.</div>
<div class="hd"><div></div><div>era assim</div><div class="b">✅ agora é assim</div></div>
${L.map(([it, a, b], i) => `<div class="lin"><div class="n">${i + 1}</div>
  <div class="cx a"><h5>${it}</h5><p>${a}</p></div>
  <div class="cx b"><h5>${it}</h5><p>${b}</p></div></div>`).join('')}
<div class="card"><span class="cab">💰 medido depois de fazer</span>
  <table><tr><th class="l">o quê</th><th>era</th><th>ficou</th></tr>
  ${IMP.map(([o, a, b]) => `<tr><td class="l">${o}</td><td class="h">${a}</td><td class="d">${b}</td></tr>`).join('')}</table>
  <p style="font-size:13px;font-weight:600;color:#444;line-height:1.5;margin-top:11px">
   👉 <b>A Várzea não mudou em nada</b> — quem está começando não sente diferença.<br>
   👉 <b>Dá pra voltar atrás a qualquer hora</b>, e nenhum estádio já construído foi tocado.</p></div>`
const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'networkidle' }); await pg.waitForTimeout(700)
await pg.screenshot({ path: SAIDA, fullPage: true }); await br.close(); console.log(SAIDA)
