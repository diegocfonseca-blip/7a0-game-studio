// 🖼️ MOCKUP — o estádio no COMEÇO do jogo: o problema e as saídas.
//
// Diego, 16/09: *"não entendi quase nada, faça mockup de tudo… melhor. E também
// não entendi se vai baratear os setores de melhorias do estádio"*.
//
// ⚠️ RESPOSTA CURTA, e ela está NO MOCKUP: **nada foi barateado ainda.** Tudo o
// que existe até aqui é MEDIÇÃO. Este desenho serve pra ele bater o olho e
// decidir o que quer que mude.
//
// O mockup tem 3 blocos:
//   1. 😞 O PROBLEMA — o que a pessoa vê hoje ao apertar "investir" (os números
//      são os medidos por `bilheteria-comeco.mjs`, com o motor real).
//   2. 💰 O QUE DÁ PRA BARATEAR — tabela ANTES → DEPOIS, obra por obra.
//   3. 👀 A IDEIA QUE NÃO MEXE EM REGRA — mostrar a TORCIDA subindo na tela.
//
// Rodar: node scripts/mockup-estadio-comeco.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-estadio-comeco.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

// ── os números medidos (bilheteria-comeco.mjs · custo-estadio.mjs)
const HOJE = [
  ['1º clique — 20 🪙 no Gramado', '21', '20', '20'],
  ['Gramado INTEIRO — 60 🪙', '24', '22', '20'],
  ['Gramado + Geral — 120 🪙', '28', '24', '21'],
  ['os 5 setores — 500 🪙', '52', '37', '25'],
  ['estádio COMPLETO — 1.530 🪙', '112', '77', '43'],
]
const BARATEAR = [
  ['🌱 Gramado', '60', '30', 'não tem assento nenhum — nunca vira camisa. É o pior primeiro passo do jogo.'],
  ['Geral', '60', '40', 'traz 21.500 lugares, mas eles só valem quando a Loja abre.'],
  ['🛍️ Loja do Clube', '80', '60', 'a MELHOR obra do jogo (se paga em 6 temporadas). Devia vir antes.'],
  ['💡 Refletores', '50', '30', 'hoje custa 50 e rende +1. Leva 50 temporadas pra se pagar.'],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:900px;padding:26px}
  .tit{font-size:38px;font-weight:900;text-transform:uppercase;line-height:.95;letter-spacing:-.5px}
  .tit .r{color:${VERM}}
  .sub{font-size:15px;margin:10px 0 20px;line-height:1.4;font-weight:500}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:16px;margin-bottom:18px}
  .cab{display:inline-block;background:${INK};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
       text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:12px}
  .cab.ok{background:${VERDE}} .cab.al{background:${VERM}}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:5px 7px;color:#666;font-weight:700}
  th.l,td.l{text-align:left}
  td{padding:7px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:600}
  td.l{font-weight:700}
  .zero{color:${VERM};font-weight:900}
  .bom{color:${VERDE};font-weight:900}
  .seta{color:#999;padding:0 4px}
  .nota{font-size:12.5px;color:#555;line-height:1.45;margin-top:10px;font-weight:500}
  .tor{background:${CREME};border:3px dashed ${INK};border-radius:14px;padding:14px;margin-top:10px}
  .tor .lin{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;margin:6px 0}
  .barra{flex:1;height:16px;background:#e4dcc6;border:2px solid ${INK};border-radius:9px;overflow:hidden}
  .barra i{display:block;height:100%;background:${VERDE}}
  .antes{opacity:.45}
  .avs{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
       padding:13px 16px;font-size:15px;font-weight:700;margin-bottom:20px}
  .pe{font-size:12px;color:#666;margin-top:6px;font-weight:500}
</style>
<div class="tit">O ESTÁDIO NO <span class="r">COMEÇO</span> DO JOGO</div>
<div class="sub">Tudo aqui foi <b>MEDIDO no motor do jogo</b>, clique a clique.
  A pergunta é uma só: <b>a pessoa desanima antes de continuar?</b></div>

<div class="avs">⚠️ NADA FOI BARATEADO AINDA. Isto é só o retrato — quem decide o que muda é você.</div>

<div class="card">
  <span class="cab al">😞 1 · O problema de hoje</span>
  <table>
    <tr><th class="l">o que a pessoa gasta</th><th>em 3º lugar</th><th>em 10º lugar</th><th>em 18º lugar</th></tr>
    ${HOJE.map(([a, b, c, d], i) => `<tr><td class="l">${a}</td>
      <td>${b} 🪙</td>
      <td class="${i === 0 ? 'zero' : ''}">${c} 🪙${i === 0 ? ' ←' : ''}</td>
      <td class="${i <= 1 ? 'zero' : ''}">${d} 🪙</td></tr>`).join('')}
  </table>
  <div class="nota"><b>A bilheteria começa em 20 🪙 com o estádio zerado.</b><br>
    Na Várzea, <b>20 🪙 é um quarto da receita da temporada inteira</b>. A pessoa junta isso com
    dificuldade, aperta investir — e <b>o número não se mexe</b>.<br>
    De 25 cliques: <b>8 não mudam nada</b> pra quem está em 10º, e <b>20 de 25</b> pra quem está em 18º.</div>
</div>

<div class="card">
  <span class="cab al">🎟️ 2 · E a lotação corta tudo pela metade</span>
  <table>
    <tr><th class="l">sua colocação</th><th>quanto do estádio você recebe</th></tr>
    <tr><td class="l">1º ao 4º</td><td class="bom">100%</td></tr>
    <tr><td class="l">5º ao 7º</td><td>82%</td></tr>
    <tr><td class="l">8º ao 14º</td><td>55%</td></tr>
    <tr><td class="l">15º e 16º</td><td>35%</td></tr>
    <tr><td class="l">17º pra baixo</td><td class="zero">18%</td></tr>
  </table>
  <div class="nota">Quem está em 17º recebe <b>18% do estádio que pagou</b> — e é justamente ele
    que mais precisa de dinheiro pra sair de lá. <b>O jogo castiga duas vezes quem está mal.</b><br>
    Um clube novo na Várzea costuma terminar entre 10º e 16º: <b>35% a 55%</b>. Ele constrói e não vê.</div>
</div>

<div class="card">
  <span class="cab">💰 3 · O que DARIA pra baratear</span>
  <table>
    <tr><th class="l">obra</th><th>hoje</th><th></th><th>proposta</th><th class="l" style="padding-left:14px">por quê</th></tr>
    ${BARATEAR.map(([o, a, d, p]) => `<tr><td class="l">${o}</td><td class="antes">${a} 🪙</td>
      <td class="seta">→</td><td class="bom">${d} 🪙</td>
      <td class="l" style="font-weight:500;font-size:12.5px;padding-left:14px">${p}</td></tr>`).join('')}
  </table>
  <div class="nota">➕ E a mudança de <b>uma linha só</b>: a <b>🛍️ Loja abrir com 1 setor pronto</b>,
    não 2. Hoje a pessoa é obrigada a fazer <b>as duas piores obras do jogo</b> (Gramado e Geral,
    que levam 30 temporadas pra se pagar) antes de liberar <b>a melhor</b> (a Loja, 6 temporadas).<br>
    <b>São 200 🪙 até a primeira camisa vendida. Com as duas mudanças, cairia pra 100 🪙</b> — de
    ~5 temporadas de espera pra ~2.</div>
</div>

<div class="card">
  <span class="cab ok">👀 4 · A ideia que NÃO mexe em regra nenhuma</span>
  <div class="nota" style="margin-top:0;margin-bottom:6px">O ganho por clique vai ser pequeno de
    qualquer jeito. Mas o jogo <b>já calcula</b> a torcida e <b>não mostra</b>. Em vez de "+0 moedas":</div>
  <div class="tor">
    <div class="lin antes">😐 hoje: <b>Bilheteria 20 🪙</b> <span style="font-size:14px">→ investiu 20 🪙 →</span> <b>20 🪙</b></div>
    <div class="lin">🧍 <b>Torcida</b>
      <div class="barra"><i style="width:14%"></i></div> <span style="font-size:17px">12.000</span></div>
    <div class="lin" style="color:${VERDE}">🧍 <b>depois</b>
      <div class="barra"><i style="width:37%"></i></div> <span style="font-size:17px">19.200</span></div>
    <div class="pe">O Geral sozinho traz <b>21.500 lugares</b>. Esse número sobe de verdade a cada
      clique — e é ele que vira venda de camisa lá na frente.</div>
  </div>
  <div class="nota"><b>Esta é a única das quatro que dá pra fazer hoje sem risco:</b> não muda
    economia, não mexe no save de ninguém, não altera o desenho do estádio. É só mostrar na tela
    um número que já existe.</div>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
