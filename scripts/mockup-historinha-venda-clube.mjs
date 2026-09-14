// 🖼️ MOCKUP — A HISTORINHA DOS 300 (venda do 2º clube).
//
// Diego, 14/09: *"só q vender pelo msm valor n sei se é válido.. podia deixar
// vender mas perdendo um cadinho, pelo menos 300 moedas... com uma histórinha,
// só n sei qual"*. Então a venda virou 4.000 pagos → 3.700 de volta, e este
// mockup põe as três historinhas candidatas lado a lado pra ele escolher.
//
// A mordida de 300 é o que fecha a porta giratória: como o caixa que o 2º clube
// juntou fica COM ELE, comprar e vender em seguida não rende nada, só custa 300.
// Rodar: node scripts/mockup-historinha-venda-clube.mjs
import { chromium } from 'playwright-core'
const INK='#0C0C0C', CREME='#F4ECD6', OURO='#FFC400', VERM='#C2452F', VERDE='#1B7A3D'
const OPS = [
  { n:'A', t:'🏛️ Taxa da federação', rec:true,
    btn:'💸 Vender o Adão Esporte · 3.700 🪙',
    txt:'Você recebe <b>3.700 🪙</b> — as 4.000 que pagou, menos <b>300 de taxa da federação</b> pra passar o clube pra outro dono.',
    pe:'Papel carimbado custa. Até pra largar um clube tem fila.',
    por:'É a mais fácil de entender na hora. Todo mundo sabe que mudar de dono tem burocracia.' },
  { n:'B', t:'📋 O despachante', rec:false,
    btn:'💸 Vender o Adão Esporte · 3.700 🪙',
    txt:'Você recebe <b>3.700 🪙</b> — as 4.000 que pagou, menos <b>300 do despachante</b> que correu atrás da papelada.',
    pe:'Ele resolveu em três dias o que levaria três meses. Cobrou por isso.',
    por:'A mais engraçada, bem BR. Mas exige conhecer a figura do despachante.' },
  { n:'C', t:'🤝 Acerto com quem fica', rec:false,
    btn:'💸 Vender o Adão Esporte · 3.700 🪙',
    txt:'Você recebe <b>3.700 🪙</b> — as 4.000 que pagou, menos <b>300 pra acertar as contas</b> de quem fica no clube.',
    pe:'Roupeiro, massagista, o cara do cafezinho. Ninguém sai de mãos abanando.',
    por:'A mais simpática: você sai pagando o pessoal, não sendo taxado.' },
]
const cards = OPS.map(o => `
  <div class="op ${o.rec?'rec':''}">
    <p class="tag">OPÇÃO ${o.n}${o.rec?' · minha recomendação':''}</p>
    <h3>${o.t}</h3>
    <div class="btn">${o.btn}</div>
    <div class="aviso">
      <div class="ok">✅ ${o.txt}</div>
      <p class="pe">“${o.pe}”</p>
    </div>
    <p class="por"><b>Por quê:</b> ${o.por}</p>
  </div>`).join('')
const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:1120px}
 h1{font-size:34px;margin:0 0 2px;text-transform:uppercase}
 p.sub{margin:0 0 20px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.45;max-width:940px}
 .cols{display:flex;gap:16px;align-items:stretch}
 .op{flex:1;background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:14px;display:flex;flex-direction:column}
 .op.rec{border-color:${VERDE};box-shadow:5px 5px 0 ${VERDE}}
 .tag{margin:0 0 6px;font-size:11.5px;letter-spacing:1.2px;text-transform:uppercase;font-weight:900;color:#6b6552}
 .op.rec .tag{color:${VERDE}}
 h3{margin:0 0 11px;font-size:19px;text-transform:uppercase;line-height:1.15}
 .btn{background:${VERM};color:#fff;border:3px solid ${INK};border-radius:12px;padding:9px;text-align:center;
      font-weight:900;font-size:13.5px;text-transform:uppercase;box-shadow:3px 3px 0 ${INK};margin-bottom:11px}
 .aviso{background:#faf7ee;border:3px dashed #c9bf9f;border-radius:13px;padding:10px;margin-bottom:10px}
 .ok{background:#eafaef;border:2px solid ${VERDE};border-radius:10px;padding:8px 9px;font-family:system-ui;font-size:12.5px;line-height:1.45}
 .pe{margin:9px 0 0;font-family:Georgia,serif;font-style:italic;font-size:13px;line-height:1.45;color:#4a4636}
 .por{margin:auto 0 0;font-family:system-ui;font-size:12.5px;line-height:1.45;color:#333;
      border-top:2px solid #e3d9ba;padding-top:9px}
 .nota{margin-top:18px;font-family:system-ui;font-size:13.5px;line-height:1.55;color:#2f2c22;background:#fff7d6;
       border:3px solid ${INK};border-radius:14px;padding:12px 14px;box-shadow:3px 3px 0 ${INK}}
 .conta{display:inline-block;background:${INK};color:${OURO};border-radius:10px;padding:6px 12px;font-weight:900;font-size:15px;margin:2px 0 10px}
</style>
<h1>A historinha dos 300</h1>
<p class="sub">Você pediu pra vender perdendo um cadinho. Ficou assim: <b>paga 4.000, recebe 3.700</b>. Os 300 são a mordida. Escolhe qual história aparece na tela.</p>
<div class="conta">4.000 🪙 pagos &nbsp;→&nbsp; 3.700 🪙 de volta &nbsp;·&nbsp; mordida de 300</div>
<div class="cols">${cards}</div>
<div class="nota"><b>Por que 300 resolve o problema:</b> com o caixa do 2º clube ficando com ele (a minha proposta anterior), comprar e vender em seguida não rende nada — só custa 300. Some a porta giratória. E 300 em cima de 4.000 é uma mordida de 7,5%: dói, mas não pune quem mudou de ideia de boa-fé.<br><br><b>Se preferir mais salgado:</b> dá pra subir a mordida sem mexer em mais nada — é um número só no código. Me diz o valor.</div>`
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport:{width:1120,height:900}, deviceScaleFactor:2 })
await p.setContent(html,{waitUntil:'networkidle'})
await p.screenshot({ path:'/tmp/claude-0/-home-user-7a0-game-studio/15782737-58e2-54d9-971e-653cb64061f2/scratchpad/mockup-historinha.png', fullPage:true })
await b.close(); console.log('ok')
