// 🖼️ MOCKUP — ESTÁDIO: o que é HOJE × como FICA. Sem teoria, só a troca.
//
// Diego, 16/09: *"vou te falar que não entendi foi nada… pqp seja objetivo, o que
// tá e como vai ficar, claro. Ah, e o camarote cobra caro mas não pode render
// mais também? Sei lá"*.
//
// A ideia dele sobre o camarote é a saída certa e entrou como proposta nº 1:
// camarote é o lugar mais caro do estádio, então o torcedor de camarote vale por
// dois. Resolve sem baixar preço de nada.
//
// Este mockup NÃO explica mecanismo. É uma lista: linha da esquerda = hoje,
// linha da direita = como fica. O que muda vem destacado.
//
// Rodar: node scripts/mockup-estadio-antes-depois.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-estadio-antes-depois.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

// [nº, item, hoje, fica]  — o <b> marca o que muda
const LINHAS = [
  ['1', '🎭 Camarote',
   'custa 150 · 16.000 lugares<br><i>cada lugar vale igual ao da geral</i>',
   'custa 150 · 16.000 lugares<br><b>cada lugar vale por DOIS</b> — quem senta no camarote gasta mais'],
  ['2', '☂️ Cobertura',
   'custa 130 · rende +8<br><i>não traz nenhum torcedor</i>',
   'custa 130 · rende +8<br><b>+8% de venda de camisa</b> — sem chuva, o povo vem'],
  ['3', '💡 Refletores',
   'custa 30 · rende +2<br><i>não traz nenhum torcedor</i>',
   'custa 30 · rende +2<br><b>+5% de venda de camisa</b> — jogo à noite enche mais'],
  ['4', '🎟️ Bilheteria',
   '<b>os lugares NÃO contam</b><br><i>tanto faz ter 78 mil lugares ou zero</i>',
   '<b>os lugares CONTAM</b><br>+1 moeda a cada 3.000 lugares construídos'],
  ['5', '🧍 Torcida',
   '<b>12.000 em TODAS as divisões</b><br><i>Várzea e Série A têm a mesma torcida</i>',
   '<b>cresce quando você sobe</b><br>Várzea 12.000 · D 20.000 · C 35.000 · B 60.000 · A 100.000'],
  ['6', '🌱 Gramado',
   'fica na aba das <b>Arquibancadas</b><br><i>mas tem 0 lugares — não é arquibancada</i>',
   'vai pra aba das <b>Melhorias</b><br>é onde ele sempre devia ter estado'],
]

// impacto medido (estádio completo, elenco cheio de 22)
const IMPACTO = [
  ['🎟️ Bilheteria — estádio completo, 3º lugar', '112', '138'],
  ['🎟️ Bilheteria — estádio completo, 10º lugar', '77', '84'],
  ['👕 Camisa — Série A, estádio meio construído', '21', '55'],
  ['💰 Sobra por temporada — Série A, meio de tabela, elenco de 22', '+7', '~+48'],
  ['💰 Sobra por temporada — VÁRZEA, meio de tabela', '+43', '+43 (não muda)'],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:940px;padding:26px}
  h1{font-size:40px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .r{color:${VERM}} h1 .v{color:${VERDE}}
  .big{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
       padding:13px 16px;font-size:15px;font-weight:700;margin:14px 0 18px}
  .hd{display:grid;grid-template-columns:46px 1fr 1fr;gap:12px;margin-bottom:8px}
  .hd div{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;padding-left:4px}
  .hd .a{color:${VERM}} .hd .b{color:${VERDE}}
  .lin{display:grid;grid-template-columns:46px 1fr 1fr;gap:12px;margin-bottom:11px;align-items:stretch}
  .n{background:${INK};color:#fff;border-radius:11px;display:flex;align-items:center;justify-content:center;
     font-size:21px;font-weight:900}
  .cx{border:3px solid ${INK};border-radius:13px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
  .cx.a{background:#FDECEA} .cx.b{background:#EAF5EE}
  .cx h5{font-size:16px;font-weight:900;margin-bottom:5px}
  .cx p{font-size:13px;font-weight:600;line-height:1.45}
  .cx p i{font-weight:500;color:#777;font-size:12px}
  .cx.b p b{color:${VERDE}}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-top:6px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:6px 8px;color:#666;font-weight:700}
  th.l,td.l{text-align:left}
  td{padding:9px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
  td.l{font-weight:700;font-size:13.5px}
  .h{color:#aaa} .d{color:${VERDE};font-weight:900;font-size:16px}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:16px;margin-top:20px}
  .cab{display:inline-block;background:${VERDE};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
       text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:10px}
</style>

<h1>ESTÁDIO: <span class="r">HOJE</span> × <span class="v">COMO FICA</span></h1>
<div class="big">⚠️ NADA DISTO FOI FEITO. Você lê e me diz quais linhas entram.</div>

<div class="hd"><div></div><div class="a">❌ hoje é assim</div><div class="b">✅ fica assim</div></div>
${LINHAS.map(([n, it, h, d]) => `
  <div class="lin">
    <div class="n">${n}</div>
    <div class="cx a"><h5>${it}</h5><p>${h}</p></div>
    <div class="cx b"><h5>${it}</h5><p>${d}</p></div>
  </div>`).join('')}

<div class="card">
  <span class="cab">💰 O que isso muda no bolso</span>
  <table>
    <tr><th class="l">o quê</th><th>hoje</th><th>fica</th></tr>
    ${IMPACTO.map(([o, h, d]) => `<tr><td class="l">${o}</td><td class="h">${h}</td><td class="d">${d}</td></tr>`).join('')}
  </table>
  <p style="font-size:13px;font-weight:600;color:#444;line-height:1.5;margin-top:11px">
    👉 <b>A Várzea não muda em nada.</b> Quem está começando não sente diferença nenhuma — o ajuste
    só aparece conforme a pessoa sobe, que é onde hoje a conta não fecha.<br>
    👉 <b>Ninguém perde nada em lugar nenhum.</b> Todas as 6 linhas só ADICIONAM.</p>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
