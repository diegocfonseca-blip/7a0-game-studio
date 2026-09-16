// 🖼️ MOCKUP — TUDO QUE MELHOROU NO CLUBE HOJE (16/09), num quadro só.
//
// Pedido do Diego: *"faça o mockup de todas as novidades, melhorias, valor, tudo
// que você fez de ganho hoje em relação às coisas pro clube"* — economia e
// estádio, NÃO arte (isso é o `mockup-artes-16-09.mjs`).
//
// Regra deste arquivo: cada linha tem NÚMERO de antes e NÚMERO de depois. Sem
// explicação de mecanismo, sem teoria — foi disso que ele reclamou o dia inteiro.
// Todos os valores foram medidos: `sim-caixa-divisoes.mjs`, `custo-estadio.mjs`,
// `varzea-ganhou.mjs`.
//
// Rodar: node scripts/mockup-tudo-hoje.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-tudo-hoje.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const BARATO = [
  ['🌱', 'Gramado', '60', '30'],
  ['💺', 'Arquibancada Geral', '60', '40'],
  ['💡', 'Refletores', '50', '30'],
  ['🛍️', 'Loja do Clube', '80 · exige 2 setores', '60 · exige 1 setor'],
]
const TORCIDA = [['Várzea', '12.000', '12.000', 1], ['Série D', '12.000', '20.000', 0],
  ['Série C', '12.000', '35.000', 0], ['Série B', '12.000', '60.000', 0], ['Série A', '12.000', '100.000', 0]]
const CAMISA = [['Várzea', '21', '21', 1], ['Série D', '21', '24', 0], ['Série C', '21', '30', 0],
  ['Série B', '21', '40', 0], ['Série A', '21', '55', 0]]
const BILHETERIA = [
  ['brigando pelo acesso (3º)', '112', '132'],
  ['meio de tabela (10º)', '77', '90'],
  ['escapou do rebaixamento (16º)', '35% do estádio', '40% do estádio'],
  ['caiu (17º/18º)', '18% do estádio', '27% do estádio'],
]
const RENDE = [
  ['🎟️', 'Os lugares não contavam na bilheteria', 'cada 3.000 lugares = +1 moeda por temporada'],
  ['🎭', 'Camarote: 16.000 lugares valendo igual aos da geral', 'cada lugar do camarote vale por DOIS (ideia sua)'],
  ['☂️', 'Cobertura não levava ninguém ao estádio', '+8% de venda de camisa'],
  ['💡', 'Refletores não levavam ninguém ao estádio', '+5% de venda de camisa'],
]
const TELA = [
  'Obra mostra a <b>renda E a graça juntas</b> — antes a frase bonita escondia o "+10/temp" das 5 melhores obras.',
  'Obra <b>trancada mostra preço e ganho</b>, pra dar pra planejar pra que juntar dinheiro.',
  'Setor mostra a <b>renda de verdade</b>: "rende +6/temp (hoje +3 — estádio 55% cheio)".',
  'Barra da <b>🧍 torcida do clube</b> na tela do estádio — com o texto explicando que torcida <b>não é</b> capacidade.',
  '🌱 O Gramado saiu das Arquibancadas e foi pras Melhorias (ele não tem lugar nenhum).',
]

const tabela = (linhas, th) => `<table>
  <tr><th class="l">${th}</th><th>antes</th><th>agora</th></tr>
  ${linhas.map(([n, a, d, igual]) => `<tr><td class="l">${n}</td><td class="h">${a}</td>
    <td class="${igual ? 'ig' : 'd'}">${d}${igual ? ' <span class="mini">(igual)</span>' : ''}</td></tr>`).join('')}
</table>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1020px;padding:28px}
  h1{font-size:48px;font-weight:900;text-transform:uppercase;line-height:.93}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 17px;font-size:16px;font-weight:700;margin:14px 0 20px;line-height:1.4}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:17px 19px;margin-bottom:16px}
  .cab{display:inline-block;background:${VERDE};color:#fff;font-weight:800;font-size:13.5px;letter-spacing:.8px;
       text-transform:uppercase;padding:6px 13px;border-radius:9px;margin-bottom:12px}
  .cab.o{background:#B8860B} .cab.r{background:${VERM}} .cab.k{background:${INK}}
  .sub{font-size:13.5px;font-weight:600;color:#555;margin:-4px 0 10px;line-height:1.45}
  table{width:100%;border-collapse:collapse;font-size:15.5px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:5px 8px;color:#777;font-weight:800}
  th.l,td.l{text-align:left}
  td{padding:10px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
  td.l{font-weight:700;font-size:15px}
  .h{color:#b3b3b3;text-decoration:line-through}
  .d{color:${VERDE};font-weight:900;font-size:20px}
  .ig{color:#888;font-weight:800}
  .mini{font-size:11px;font-weight:700;color:#bbb;text-decoration:none}
  .li{display:grid;grid-template-columns:34px 1fr 20px 1fr;gap:9px;align-items:center;
      padding:10px 0;border-top:1px solid rgba(12,12,12,.10);font-size:14.5px;font-weight:700;line-height:1.35}
  .li:first-of-type{border-top:0}
  .li2{display:grid;grid-template-columns:34px 1fr 190px 22px 190px;gap:9px;align-items:center;
       padding:10px 0;border-top:1px solid rgba(12,12,12,.10);font-size:14.5px;font-weight:700;line-height:1.35}
  .li2:first-of-type{border-top:0}
  .li2 .e{font-size:24px;text-align:center}
  .li2 .a{color:#b3b3b3;text-decoration:line-through;text-align:right;font-size:15px}
  .li2 .s{color:#ccc;font-size:20px;text-align:center}
  .li2 .n{color:${VERDE};font-weight:900;font-size:17px}
  .li .e{font-size:24px;text-align:center}
  .li .a{color:#aaa} .li .s{color:#ccc;font-size:20px;text-align:center}
  .li .n{color:${VERDE};font-weight:900}
  .bul{font-size:14.5px;font-weight:600;line-height:1.55;padding-left:2px}
  .bul p{margin-bottom:7px} .bul b{font-weight:900}
  .dup{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .sel{background:#EAF5EE;border:3px solid ${VERDE};border-radius:14px;padding:13px 16px;margin-top:12px;
       font-size:15px;font-weight:700;line-height:1.45}
  .sel b{color:${VERDE}}
  .seg{background:${INK};color:#fff;border-radius:16px;padding:17px 19px;font-size:14.5px;font-weight:700;line-height:1.6}
  .seg b{color:${GOLD}}
</style>

<h1>TUDO QUE O CLUBE<br><span class="g">GANHOU HOJE</span></h1>
<div class="lead">Só número: o que era e o que ficou. Tudo medido dentro do jogo.
<b>Nenhuma mudança tira nada de ninguém</b> — nenhum estádio já construído foi mexido.</div>

<div class="card">
  <span class="cab">1 · 💸 ficou mais barato construir</span>
  <div class="sub">Os preços do começo, que é onde a pessoa decide se continua jogando ou não.</div>
  ${BARATO.map(([e, n, a, d]) => `<div class="li2"><div class="e">${e}</div><div>${n}</div>
    <div class="a">${a}</div><div class="s">→</div><div class="n">${d}</div></div>`).join('')}
  <div class="sel">🛍️ <b>A conta que mais muda:</b> pra abrir a Loja do Clube você precisava juntar
    <b>200 moedas</b> (2 setores inteiros + a loja). Agora abre com <b>100</b>. É a obra que mais rende do jogo.</div>
</div>

<div class="card">
  <span class="cab o">2 · 🎟️ a bilheteria virou bilheteria de verdade</span>
  <div class="sub">Antes dava no mesmo ter 78 mil lugares ou ZERO: a bilheteria não olhava os lugares.
  E quem terminava lá embaixo jogava pra um estádio quase vazio.</div>
  <table>
    <tr><th class="l">estádio completo, por temporada</th><th>antes</th><th>agora</th></tr>
    ${BILHETERIA.map(([n, a, d]) => `<tr><td class="l">${n}</td><td class="h">${a}</td><td class="d">${d}</td></tr>`).join('')}
  </table>
</div>

<div class="dup">
  <div class="card">
    <span class="cab">3 · 🧍 torcida do clube</span>
    <div class="sub">Quanta gente torce pelo clube (não é quanta cabe no estádio). <b>Agora subir de divisão traz torcedor.</b></div>
    ${tabela(TORCIDA, 'torcedores')}
  </div>
  <div class="card">
    <span class="cab">4 · 👕 venda de camisa</span>
    <div class="sub">Por temporada, com o estádio meio construído. Era o MESMO valor da Várzea à Série A.</div>
    ${tabela(CAMISA, 'moedas / temporada')}
  </div>
</div>

<div class="card">
  <span class="cab o">5 · 🏟️ o que passou a render e não rendia</span>
  ${RENDE.map(([e, a, d]) => `<div class="li"><div class="e">${e}</div><div class="a">${a}</div>
    <div class="s">→</div><div class="n">${d}</div></div>`).join('')}
</div>

<div class="card">
  <span class="cab k">6 · 📱 a tela ficou honesta</span>
  <div class="bul">${TELA.map(t => `<p>· ${t}</p>`).join('')}</div>
</div>

<div class="seg">
  🛡️ <b>Segurança (o que você sempre pergunta):</b> dá pra voltar atrás em tudo — cada bloco foi um
  commit separado, e um <i>revert</i> desfaz sem encostar nos outros.<br>
  🧾 <b>Ninguém perde nada:</b> todas as mudanças só SOMAM. Estádio que já estava construído continua
  igual; obra que já estava destravada continua destravada; save nenhum foi tocado.<br>
  🌱 <b>E a Várzea ganhou também:</b> as 4 obras baratas e a lotação de quem termina lá embaixo
  (18% → 27%) pegam em cheio em quem está começando. O único que ela não ganhou é o piso de torcida —
  esse é o prêmio de subir de divisão.
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1020, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
