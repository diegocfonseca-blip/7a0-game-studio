// 🖼️ MOCKUP — O PLANO DO ESTÁDIO: como está hoje × como ficaria.
//
// Diego, 16/09: *"me faça um mockup com tudo que você imagina, de como tava e
// qual é a ideia de deixar… e além disso a torcida crescer com a divisão, como
// ficaria da Várzea até a Série A… quero um planejamento melhor, me mostrando de
// forma LEIGA, porque senão eu não consigo entender, como está hoje e como vai
// ficar"*. E a pergunta dele sobre o gramado: *"melhorar o gramado mudaria tanto
// a capacidade do estádio assim?"*
//
// 📏 TODO NÚMERO AQUI FOI MEDIDO nos scripts `custo-estadio.mjs`,
// `bilheteria-comeco.mjs` e `custo-elenco-cheio.mjs`, com o motor real.
// A conta da camisa é linear na torcida (loja.ts): torcida × 4,5% × curva × bônus.
//
// Rodar: node scripts/mockup-plano-estadio.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-plano-estadio.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

// a torcida por divisão (proposta) e a camisa que ela gera, com 40.000 lugares
const TORCIDA = [
  ['Várzea', '12.000', '52.000', 21, '12.000', '52.000', 21],
  ['Série D', '12.000', '52.000', 21, '20.000', '60.000', 24],
  ['Série C', '12.000', '52.000', 21, '35.000', '75.000', 30],
  ['Série B', '12.000', '52.000', 21, '60.000', '100.000', 40],
  ['Série A', '12.000', '52.000', 21, '100.000', '140.000', 55],
]

const card = (tit, linha, botao, opts = {}) => `
  <div class="ob ${opts.cls || ''}">
    <div class="obi"><b>${tit}</b><span>${linha}</span></div>
    <div class="obb ${opts.bt || ''}">${botao}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:980px;padding:26px}
  h1{font-size:40px;font-weight:900;text-transform:uppercase;line-height:.95;letter-spacing:-.5px}
  h1 .r{color:${VERM}}
  .sub{font-size:15px;margin:9px 0 18px;line-height:1.4;font-weight:500}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:16px;margin-bottom:18px}
  .cab{display:inline-block;background:${INK};color:#fff;font-weight:800;font-size:13px;letter-spacing:.8px;
       text-transform:uppercase;padding:5px 12px;border-radius:9px;margin-bottom:12px}
  .cab.al{background:${VERM}} .cab.ok{background:${VERDE}} .cab.rx{background:${ROXO}}
  .duas{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .col h4{font-size:12px;text-transform:uppercase;letter-spacing:.9px;color:#777;margin-bottom:7px;font-weight:800}
  .col.dp h4{color:${VERDE}}
  .ob{background:#FBF6E9;border:2.5px solid ${INK};border-radius:12px;padding:9px 10px;margin-bottom:8px;
      display:flex;align-items:center;gap:9px}
  .ob.lock{border-style:dashed;opacity:.55;box-shadow:none}
  .obi{flex:1;min-width:0}
  .obi b{display:block;font-size:14px;font-weight:900}
  .obi span{display:block;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin-top:2px;line-height:1.35}
  .obi span .v{color:${VERDE};font-weight:900}
  .obi span .g{color:#9a4b00;font-weight:900}
  .obb{flex:none;min-width:80px;text-align:center;background:${INK};color:#fff;border-radius:9px;
       padding:8px;font-size:11.5px;font-weight:900;line-height:1.1}
  .obb.lk{background:#d9cfb4;color:#7d7358}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:6px 8px;color:#666;font-weight:700}
  th.l,td.l{text-align:left}
  td{padding:8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:700}
  .hoje{color:#999}
  .nova{color:${VERDE};font-weight:900}
  .nota{font-size:12.5px;color:#555;line-height:1.45;margin-top:11px;font-weight:500}
  .big{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
       padding:13px 16px;font-size:15px;font-weight:700;margin-bottom:18px}
  .bar{height:15px;background:#e4dcc6;border:2px solid ${INK};border-radius:8px;overflow:hidden;min-width:150px}
  .bar i{display:block;height:100%;background:${VERDE}}
</style>

<h1>O ESTÁDIO: <span class="r">COMO ESTÁ</span> × COMO FICARIA</h1>
<div class="sub">Tudo medido no motor do jogo. Sem tecniquês — <b>do lado esquerdo é o que a pessoa vê
  hoje, do lado direito é a ideia</b>.</div>
<div class="big">⚠️ NADA DISTO FOI FEITO AINDA. É proposta — você escolhe o que entra.</div>

<div class="card">
  <span class="cab al">🌱 1 · Sua pergunta: o gramado muda a capacidade?</span>
  <div class="nota" style="margin-top:0;font-size:15px">
    <b>Não muda NADA.</b> O gramado tem <b>zero lugares</b>. Os outros quatro setores somam
    <b>78.838 lugares</b>; o gramado soma <b>0</b>. Antes e depois de deixar ele 100%, cabe
    exatamente a mesma gente no estádio.<br><br>
    Ele está na lista das <b>🧱 Arquibancadas</b>, junto com Geral, Cadeiras, Visitante e Camarote —
    mas <b>ele não é arquibancada</b>. É a única peça daquela aba que não traz torcedor, e é por isso
    que ele demorava 30 temporadas pra se pagar (agora, mais barato, 15).<br><br>
    <b>Duas saídas:</b> ou ele sai da aba das arquibancadas e vira uma <b>melhoria</b> (que é o que ele
    é de verdade), ou ele ganha um efeito que não seja dinheiro — <b>gramado bom = time joga melhor
    em casa</b>, por exemplo. Hoje ele é só um pedágio antes do resto.
  </div>
</div>

<div class="card">
  <span class="cab al">📱 2 · A tela de hoje esconde o que importa</span>
  <div class="duas">
    <div class="col">
      <h4>❌ como está hoje</h4>
      ${card('🅿️ Estacionamento', 'custa 70 💰 · <span class="v">rende +4/temp</span>', 'Construir<br><small>−70 💰</small>')}
      ${card('🍔 Praça de Alimentação', 'custa 110 💰 · <span class="v">o food court do estádio</span>', 'Construir<br><small>−110 💰</small>')}
      ${card('☂️ Cobertura', '🔒 destrava com: <span class="g">4 setores prontos</span>', '🔒', { cls: 'lock', bt: 'lk' })}
      ${card('🌱 Gramado', 'custo total 30 💰 · <span class="v">rende +4/temp</span>', 'Investir<br><small>+20 💰</small>')}
    </div>
    <div class="col dp">
      <h4>✅ como ficaria</h4>
      ${card('🅿️ Estacionamento', 'custa 70 💰 · <span class="v">rende +4/temp</span> <i>(hoje +2 — estádio 55% cheio)</i>', 'Construir<br><small>−70 💰</small>')}
      ${card('🍔 Praça de Alimentação', 'custa 110 💰 · <span class="v">rende +7/temp</span> · o food court do estádio', 'Construir<br><small>−110 💰</small>')}
      ${card('☂️ Cobertura', '🔒 destrava com: <span class="g">4 setores</span> · custaria 130 💰 · renderia +8/temp', '🔒', { cls: 'lock', bt: 'lk' })}
      ${card('🌱 Gramado', 'custo total 30 💰 · <span class="v">rende +4/temp</span> · <b>sem lugares</b>', 'Investir<br><small>+20 💰</small>')}
    </div>
  </div>
  <div class="nota">
    <b>1.</b> A <b>Praça</b> rende <b>+7/temp</b> — mais que o Estacionamento (+4) — mas a tela troca o
    número por uma frase bonita. A pessoa compara os dois e acha que a Praça é enfeite.
    Acontece com as <b>cinco melhorias que mais rendem</b>: Retrátil (+10), Hotel (+9), Praça (+7),
    Choperia (+6) e Estação (+5). <b>As duas maiores do jogo escondem quanto rendem.</b><br>
    <b>2.</b> Obra trancada não diz o preço nem o ganho — <b>não dá pra planejar</b> pra que juntar dinheiro.<br>
    <b>3.</b> "rende +4/temp" é <b>se lotar</b>. Em 10º lugar ela recebe 55% disso. A tela promete 4 e entrega 2.<br>
    <b>4.</b> O gramado é o único que não diz "lugares" — porque não tem.<br>
    <b>Isto é só TEXTO DE TELA.</b> Não mexe em dinheiro, não mexe em save, não toca no desenho do estádio.
  </div>
</div>

<div class="card">
  <span class="cab rx">🧍 3 · A torcida crescendo com a divisão</span>
  <div class="nota" style="margin-top:0;margin-bottom:10px">
    <b>Hoje todo clube tem a mesma torcida-base: 12.000</b>, esteja na Várzea ou na Série A. Só os
    lugares do estádio somam em cima. Resultado: <b>um time da Série A vende exatamente a mesma
    camisa que um time da Várzea</b>. A ideia é o básico do futebol — <b>subir de divisão traz gente</b>.
  </div>
  <table>
    <tr><th class="l">divisão</th><th>torcida-base HOJE</th><th>camisa HOJE</th>
        <th style="color:${VERDE}">torcida-base NOVA</th><th style="color:${VERDE}">camisa NOVA</th><th class="l" style="padding-left:16px">tamanho da torcida</th></tr>
    ${TORCIDA.map(([d, ph, th_, ch, pn, tn, cn]) => `<tr>
      <td class="l">${d}</td>
      <td class="hoje">${ph}</td><td class="hoje">${ch} 💰</td>
      <td class="nova">${pn}</td><td class="nova">${cn} 💰</td>
      <td class="l" style="padding-left:16px"><div class="bar"><i style="width:${Math.round(parseInt(tn.replace(/\./g, '')) / 140000 * 100)}%"></i></div></td></tr>`).join('')}
  </table>
  <div class="nota">
    Com um estádio meio construído (40.000 lugares). <b>A Várzea não muda nada</b> — quem está
    começando não sente diferença nenhuma. O ajuste só acontece conforme a pessoa sobe, que é
    justamente onde hoje a conta não fecha: medido, um time de <b>meio de tabela da Série A com
    elenco completo sobra 7 moedas por temporada</b>. Com isto, passaria de <b>+7 para ~+41</b>.<br>
    E dá pra ler sem saber nada de número: <b>quanto mais alto você joga, mais gente torce pelo
    seu clube — e mais camisa você vende.</b>
  </div>
</div>

<div class="card">
  <span class="cab ok">📋 4 · O plano, em ordem</span>
  <table>
    <tr><th class="l">o quê</th><th class="l">mexe em quê</th><th class="l">risco</th></tr>
    <tr><td class="l"><b>✅ JÁ FEITO</b> — obras do começo mais baratas + lotação melhor pra quem está mal + a torcida aparecendo na tela</td><td class="l">preço e tela</td><td class="l" style="color:${VERDE}">nenhum — ninguém perdeu nada</td></tr>
    <tr><td class="l"><b>1.</b> A tela mostrar renda, preço e "sem lugares" (o bloco 2 aí em cima)</td><td class="l">só texto</td><td class="l" style="color:${VERDE}">zero</td></tr>
    <tr><td class="l"><b>2.</b> Cobertura e Refletores passarem a levar gente pro estádio</td><td class="l">bônus de camisa</td><td class="l" style="color:${VERDE}">baixo — só adiciona</td></tr>
    <tr><td class="l"><b>3.</b> A torcida crescer com a divisão (o bloco 3)</td><td class="l">economia</td><td class="l" style="color:#9a4b00">médio — muda o jogo de cima</td></tr>
    <tr><td class="l"><b>4.</b> O gramado sair das arquibancadas (ou ganhar outro efeito)</td><td class="l">organização da tela</td><td class="l" style="color:${VERDE}">baixo</td></tr>
  </table>
  <div class="nota">Dá pra fazer <b>1, 2 e 4 hoje</b> — são seguras e resolvem o "não entendo o que
    esse botão faz". A <b>3</b> é a que mexe de verdade no dinheiro; melhor decidir ela separada,
    com calma, porque é a que mais muda a Série A.</div>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 980, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
