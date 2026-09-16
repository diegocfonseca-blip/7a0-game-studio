// 🖼️ MOCKUP — ITEM POR ITEM: o preço de cada coisa do estádio está justo?
//
// Diego, 16/09: *"eu quero entender cada setor, cada item, cada categoria. Quero
// entender se tá certo, se tá cobrando certo, se tá rendendo certo, se é justo um
// item ser de um valor e o outro não… E eu não entendi: a capacidade do estádio e
// a capacidade da torcida não são coisas diferentes? Tô muito confuso."*
//
// 🔑 A CONFUSÃO DELE ESTAVA CERTA, E É DO JOGO — não dele. No código:
//   · `stadiumIncomeAt` (BILHETERIA) = base + renda_fixa × LOTAÇÃO.
//     → NÃO olha quantos LUGARES você construiu. Nenhum.
//   · `torcidaDoEstadio` (que manda na CAMISA) = 12.000 + LUGARES construídos.
//     → NÃO olha a divisão, nem títulos, nem nada. Torcedor = cadeira.
// Ou seja: **o jogo trocou as bolas.** Cadeira devia encher bilheteria; torcida
// devia vir de quem o clube é. Hoje é o contrário.
//
// Rodar: node scripts/mockup-estadio-justo.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-estadio-justo.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

// [nome, custo, renda, lugares] — valores de HOJE (já com o corte de 16/09)
const SET = [
  ['🌱 Gramado', 30, 4, 0], ['Geral', 40, 4, 21500], ['Cadeiras', 90, 6, 18500],
  ['Visitante', 120, 8, 22838], ['Camarote', 150, 10, 16000],
]
// [nome, custo, renda, bônus de camisa %]
const EXT = [
  ['🛍️ Loja do Clube', 60, 6, 0], ['💡 Refletores', 30, 2, 0], ['📺 Telão', 60, 3, 4],
  ['🅿️ Estacionamento', 70, 4, 6], ['🍻 Choperia', 90, 6, 6], ['🍔 Praça de Alimentação', 110, 7, 10],
  ['🚇 Estação', 120, 5, 8], ['☂️ Cobertura', 130, 8, 0], ['🏨 Hotel do Clube', 160, 9, 10],
  ['🏟️ Cobertura Retrátil', 180, 10, 6],
]
const fmt = n => n.toLocaleString('pt-BR')
const vered = (c, j) => { const d = c - j; return Math.abs(d) <= 18 ? ['justo', VERDE] : d < 0 ? ['barato', ROXO] : ['CARO', VERM] }

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:960px;padding:26px}
  h1{font-size:38px;font-weight:900;text-transform:uppercase;line-height:.95;letter-spacing:-.5px}
  h1 .r{color:${VERM}}
  .sub{font-size:15px;margin:9px 0 18px;line-height:1.45;font-weight:500}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:16px;margin-bottom:18px}
  .cab{display:inline-block;background:${INK};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
       text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:12px}
  .cab.al{background:${VERM}} .cab.ok{background:${VERDE}} .cab.rx{background:${ROXO}}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;text-align:right;padding:6px 7px;color:#666;font-weight:700}
  th.l,td.l{text-align:left}
  td{padding:8px 7px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:700}
  td.l{font-weight:800}
  .nota{font-size:13px;color:#444;line-height:1.5;margin-top:12px;font-weight:500}
  .big{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
       padding:14px 17px;font-size:15px;font-weight:700;margin-bottom:18px;line-height:1.45}
  .dois{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0}
  .bx{border:3px solid ${INK};border-radius:13px;padding:13px}
  .bx h5{font-size:16px;font-weight:900;margin-bottom:6px}
  .bx p{font-size:13px;font-weight:600;line-height:1.45}
  .bx.a{background:#FDECEA} .bx.b{background:#EAF5EE}
  .tag{display:inline-block;padding:2px 8px;border-radius:7px;font-size:11px;font-weight:900;color:#fff}
</style>

<h1>CADA ITEM DO ESTÁDIO <span class="r">ESTÁ JUSTO?</span></h1>
<div class="sub">Item por item, com a conta na mão. <b>Nada disto foi mudado</b> — é o retrato do que existe hoje.</div>

<div class="big">🔑 <b>PRIMEIRO, A SUA DÚVIDA — e você estava certo.</b> Capacidade e torcida SÃO coisas
  diferentes. Só que o jogo trata como se fossem a mesma, e ainda por cima <b>trocou as bolas</b>.</div>

<div class="card">
  <span class="cab al">🔀 1 · O jogo trocou as bolas</span>
  <div class="dois">
    <div class="bx a">
      <h5>🎟️ A BILHETERIA hoje</h5>
      <p>É <b>20 + a "renda fixa" × a sua colocação</b>.<br><br>
      <b>Ela NÃO olha quantos lugares você tem.</b> Nenhum. Você pode ter 78 mil lugares ou zero —
      a bilheteria é a mesma.</p>
    </div>
    <div class="bx a">
      <h5>👕 A CAMISA hoje</h5>
      <p>É a <b>"torcida" × preço</b>, e torcida = <b>12.000 + os lugares construídos</b>.<br><br>
      <b>Ela NÃO olha em que divisão você está.</b> Var­zea ou Série A, mesma torcida.</p>
    </div>
  </div>
  <div class="dois">
    <div class="bx b">
      <h5>🎟️ Como faria sentido</h5>
      <p><b>Lugar cheio = dinheiro de ingresso.</b> Quanto mais gente cabe e mais cheio fica,
      mais bilheteria. É pra isso que serve construir arquibancada.</p>
    </div>
    <div class="bx b">
      <h5>👕 Como faria sentido</h5>
      <p><b>Torcida é quem gosta do clube</b>, não quem tem cadeira. Ela cresce quando você
      <b>sobe de divisão e ganha título</b> — e é ela que compra camisa.</p>
    </div>
  </div>
  <div class="nota">👉 <b>É por isso que nada parecia fazer sentido.</b> Construir arquibancada não
    enche a bilheteria (só vende camisa), e subir de divisão não traz torcedor (só paga mais TV).
    <b>Não é um número errado — é o encanamento trocado.</b></div>
</div>

<div class="card">
  <span class="cab">🧱 2 · SETORES — está cobrando justo?</span>
  <table>
    <tr><th class="l">setor</th><th>custo</th><th>renda</th><th>lugares</th>
        <th>💰 por 1 de renda</th><th>💰 por mil lugares</th><th class="l" style="padding-left:14px">veredito</th></tr>
    ${SET.map(([n, c, i, s]) => {
      const pl = s ? c / (s / 1000) : null
      const ver = !s ? ['não dá lugar', VERM] : pl < 3 ? ['barato', ROXO] : pl < 6 ? ['justo', VERDE] : ['CARO por lugar', VERM]
      return `<tr><td class="l">${n}</td><td>${c}</td><td>+${i}</td><td>${s ? fmt(s) : '—'}</td>
        <td>${(c / i).toFixed(1)}</td><td>${pl ? pl.toFixed(1) : '—'}</td>
        <td class="l" style="padding-left:14px"><span class="tag" style="background:${ver[1]}">${ver[0]}</span></td></tr>`
    }).join('')}
  </table>
  <div class="nota">
    <b>Na RENDA está consistente:</b> os três grandes (Cadeiras, Visitante, Camarote) cobram
    <b>exatamente 15 moedas por ponto de renda</b>. Ninguém está sendo roubado aí.<br>
    <b>Nos LUGARES está torto:</b> o Geral cobra <b>1,9</b> por mil lugares e o Camarote cobra
    <b>9,4</b> — <b>cinco vezes mais caro pela mesma coisa</b>. O Camarote é o setor MAIS CARO
    (150) e o que dá MENOS lugares (16.000). E no jogo <b>uma cadeira de camarote vale igual a uma
    de geral</b> — não rende nada a mais.<br>
    👉 Ou o Camarote fica mais barato, <b>ou o camarote passa a valer mais</b> (ingresso mais caro
    é o que ele é na vida real). Hoje ele cobra preço de camarote e entrega arquibancada.
  </div>
</div>

<div class="card">
  <span class="cab ok">✨ 3 · MELHORIAS — está cobrando justo?</span>
  <table>
    <tr><th class="l">melhoria</th><th>custo</th><th>renda</th><th>bônus camisa</th>
        <th>preço justo*</th><th class="l" style="padding-left:14px">veredito</th></tr>
    ${EXT.map(([n, c, i, b]) => {
      const j = i * 15 + b * 5, v = vered(c, j)
      return `<tr><td class="l">${n}</td><td>${c}</td><td>+${i}</td><td>${b ? b + '%' : '—'}</td>
        <td>${j}</td><td class="l" style="padding-left:14px"><span class="tag" style="background:${v[1]}">${v[0]}</span></td></tr>`
    }).join('')}
  </table>
  <div class="nota">
    <i>*preço justo = o mesmo que os setores cobram (15 moedas por ponto de renda) + 5 moedas por
    cada 1% de bônus de camisa.</i><br><br>
    <b>Boa notícia: quase tudo está justo ou BARATO.</b> A Praça, o Hotel, a Choperia e o
    Estacionamento saem por menos do que valem. Aqui não tem roubo.<br>
    <b>Duas exceções:</b> ☂️ <b>Cobertura</b> e 💡 <b>Refletores</b> são as <b>únicas duas que não
    dão bônus de camisa nenhum</b> — todas as outras dão. E é o contrário do que faria sentido:
    <b>cobertura é não tomar chuva, refletor é jogo à noite</b>; na vida real são justamente as duas
    que MAIS enchem estádio. Prova de que é esquecimento: a <b>Retrátil</b>, que é o upgrade da
    Cobertura, <b>tem</b> o bônus. A simples ficou de fora.
  </div>
</div>

<div class="card">
  <span class="cab rx">🎯 4 · Minha conclusão, depois de medir tudo</span>
  <div class="nota" style="margin-top:0;font-size:14.5px">
    <b>Item por item, o estádio está quase todo justo.</b> Fui procurar preço abusivo e quase não
    achei — os setores cobram o mesmo por ponto de renda, e as melhorias estão de justas pra baratas.<br><br>
    <b>O que está errado é maior que qualquer preço:</b><br>
    <b>1.</b> 🔀 O encanamento trocado — arquibancada não enche bilheteria, divisão não traz torcida.<br>
    <b>2.</b> 🎭 O Camarote cobra 5× mais por lugar e entrega o mesmo que o Geral.<br>
    <b>3.</b> ☂️💡 Cobertura e Refletores não levam ninguém ao estádio.<br>
    <b>4.</b> 🌱 O gramado está na aba das arquibancadas sem ser arquibancada (0 lugares).<br><br>
    👉 <b>Mexer em preço de item não resolve nada.</b> Se você quiser fazer UMA coisa, faça a
    <b>nº 1</b>: é a que faz o estádio inteiro passar a fazer sentido pra quem joga — construir
    arquibancada enche o estádio, e subir de divisão traz torcedor.
  </div>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 960, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
