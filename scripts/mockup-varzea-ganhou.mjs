// 🖼️ MOCKUP — "E A VÁRZEA, GANHOU O QUÊ?" (pergunta do Diego, 16/09)
//
// No mockup das 6 trocas eu escrevi "a Várzea não muda em nada". Aquilo valia SÓ
// pra aquelas 6 linhas (camarote, cobertura, refletor, bilheteria, torcida,
// gramado de aba). As OUTRAS mudanças do dia — preço do começo e lotação de quem
// está lá embaixo — foram feitas justamente pra Várzea, e eu não deixei isso claro.
//
// Números conferidos em `scripts/varzea-ganhou.mjs`.
// Rodar: node scripts/mockup-varzea-ganhou.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-varzea-ganhou.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const GANHOS = [
  ['💸', 'Arquibancada Geral', '60 moedas', '40 moedas', 'a primeira obra de todo mundo'],
  ['🌱', 'Gramado', '60 moedas', '30 moedas', 'caiu pela metade'],
  ['💡', 'Refletores', '50 moedas', '30 moedas', 'era a pior compra do jogo'],
  ['🛍️', 'Loja do Clube', '80 · exige 2 setores', '60 · exige 1 setor', 'a melhor obra do jogo'],
]
const BILH = [
  ['brigando no meio da tabela (10º)', '21', '26'],
  ['escapou por pouco (16º)', '20', '24'],
  ['lá no fundo (18º)', '20', '22'],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:920px;padding:26px}
  h1{font-size:42px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .v{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 16px;font-size:16px;font-weight:700;margin:14px 0 20px;line-height:1.4}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:17px;margin-bottom:16px}
  .cab{display:inline-block;background:${VERDE};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
       text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:12px}
  .cab.r{background:${VERM}}
  .g{display:grid;grid-template-columns:40px 1fr 150px 30px 170px;gap:10px;align-items:center;
     padding:9px 0;border-top:1px solid rgba(12,12,12,.10)}
  .g:first-of-type{border-top:0}
  .g .e{font-size:26px;text-align:center}
  .g .n{font-size:17px;font-weight:900} .g .n i{display:block;font-size:12px;font-weight:600;color:#888;font-style:normal}
  .g .a{font-size:16px;font-weight:700;color:#aaa;text-decoration:line-through;text-align:right}
  .g .s{font-size:22px;text-align:center;color:#bbb}
  .g .d{font-size:18px;font-weight:900;color:${VERDE}}
  table{width:100%;border-collapse:collapse;font-size:15px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:5px 8px;color:#666;font-weight:700}
  th.l,td.l{text-align:left}
  td{padding:9px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
  td.l{font-weight:700;font-size:14px} .h{color:#aaa} .d{color:${VERDE};font-weight:900;font-size:18px}
  .destaque{background:#EAF5EE;border:3px solid ${VERDE};border-radius:14px;padding:14px 16px;margin-top:14px;
            font-size:16px;font-weight:700;line-height:1.45}
  .destaque b{color:${VERDE};font-size:19px}
  .nao{background:#FDECEA;border:3px solid ${VERM};border-radius:14px;padding:13px 16px;
       font-size:15px;font-weight:700;line-height:1.45}
</style>

<h1>E A VÁRZEA,<br><span class="v">GANHOU O QUÊ?</span></h1>
<div class="lead">Eu escrevi "a Várzea não muda nada" no mockup de mais cedo e isso ficou confuso —
aquilo valia só pras 6 linhas daquela lista. <b>As mudanças de preço do estádio foram feitas
PRA Várzea.</b> Segue a conta.</div>

<div class="card">
  <span class="cab">✅ ficou mais barato pra quem está começando</span>
  ${GANHOS.map(([e, n, a, d, i]) => `
    <div class="g"><div class="e">${e}</div><div class="n">${n}<i>${i}</i></div>
    <div class="a">${a}</div><div class="s">→</div><div class="d">${d}</div></div>`).join('')}
  <div class="destaque">🛍️ A conta que mais importa: pra <b>abrir a Loja do Clube</b> na Várzea
    você precisava juntar <b>200 moedas</b> (2 setores inteiros + a loja).
    Agora abre com <b>100</b>. <b>Metade do caminho.</b></div>
</div>

<div class="card">
  <span class="cab">🎟️ e o mesmo dinheiro rende mais</span>
  <p style="font-size:13.5px;font-weight:600;color:#555;margin-bottom:6px">
    Time da Várzea que pôs 40 moedas na arquibancada Geral — bilheteria por temporada:</p>
  <table>
    <tr><th class="l">onde ele terminou</th><th>antes</th><th>agora</th></tr>
    ${BILH.map(([o, a, d]) => `<tr><td class="l">${o}</td><td class="h">${a}</td><td class="d">${d}</td></tr>`).join('')}
  </table>
  <p style="font-size:13.5px;font-weight:600;color:#444;line-height:1.5;margin-top:10px">
    Por dois motivos: <b>os lugares passaram a contar na bilheteria</b> (21.500 lugares da Geral
    = +7) e <b>quem termina lá embaixo não joga mais pra estádio vazio</b> (18% → 27%).
    E isso pega em cheio na Várzea, que é onde quase todo mundo termina em posição ruim
    na primeira temporada.</p>
</div>

<div class="nao">❌ <b>A ÚNICA COISA que a Várzea NÃO ganhou</b> foi a torcida maior: ela continua
em <b>12.000</b>, enquanto a Série A subiu pra 100.000. E isso é de propósito — se o time de
várzea já tivesse torcida de Série A, subir de divisão deixaria de ter graça.
<b>A torcida é o prêmio de subir; o estádio barato é a ajuda pra começar.</b></div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 920, height: 1200 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
