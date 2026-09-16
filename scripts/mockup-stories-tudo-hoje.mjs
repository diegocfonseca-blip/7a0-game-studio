// 📱 STORIES — TUDO QUE O CLUBE GANHOU HOJE (16/09), em 1080×1920.
//
// É o `mockup-tudo-hoje.mjs` quebrado em telas de story. Só ECONOMIA e ESTÁDIO —
// as artes dos clubes têm o story delas em `mockup-stories-melhorias.mjs`.
// Regra: uma ideia por tela, número de antes e número de depois, sem teoria.
//
// Rodar: node scripts/mockup-stories-tudo-hoje.mjs   (gera /tmp/hoje-1..7.png)
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const base = corpo => `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box;margin:0}
 body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1080px;height:1920px;
      padding:90px 60px 70px;display:flex;flex-direction:column;justify-content:center}
 .sel{display:inline-block;background:${VERM};color:#fff;font-size:24px;font-weight:900;letter-spacing:2px;
      text-transform:uppercase;padding:10px 22px;border-radius:12px;border:4px solid ${INK};
      box-shadow:6px 6px 0 ${INK};margin-bottom:26px;align-self:flex-start}
 .sel.g{background:${VERDE}} .sel.o{background:#B8860B} .sel.k{background:${INK}}
 h1{font-size:82px;font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-2px;margin-bottom:16px}
 h1 .g{color:${VERDE}} h1 .r{color:${VERM}}
 .lead{font-size:31px;font-weight:600;line-height:1.35;margin-bottom:38px;color:#444}
 .it{background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};
     padding:28px 30px;margin-bottom:24px;display:flex;align-items:center;gap:24px}
 .it .e{font-size:56px;flex:none}
 .it b{display:block;font-size:37px;font-weight:900;line-height:1.05}
 .it span{display:block;font-size:26px;font-weight:600;color:#555;margin-top:5px;line-height:1.3}
 .pr{background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};
     padding:26px 30px;margin-bottom:22px;display:flex;align-items:center;gap:22px}
 .pr .e{font-size:52px;flex:none}
 .pr .n{flex:1;font-size:36px;font-weight:900;line-height:1.1}
 .pr .a{font-size:34px;font-weight:800;color:#bbb;text-decoration:line-through}
 .pr .s{font-size:36px;color:#ccc}
 .pr .d{font-size:44px;font-weight:900;color:${VERDE}}
 table{width:100%;border-collapse:collapse;font-size:34px}
 td{padding:28px 10px;border-top:3px solid rgba(12,12,12,.12);font-weight:800}
 tr:first-child td{border-top:0}
 td.l{text-align:left} td.h{text-align:right;color:#bbb;font-size:29px;text-decoration:line-through}
 td.r{text-align:right;color:${VERDE};font-weight:900;font-size:44px}
 td.ig{text-align:right;color:#999;font-weight:800;font-size:34px}
 .cx{background:${GOLD};border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};
     padding:30px;font-size:33px;font-weight:800;line-height:1.35;margin-top:14px}
 .pe{margin-top:auto;padding-top:36px;font-size:29px;font-weight:800;color:#666;text-align:center}
 .pe b{color:${INK}}
</style>${corpo}`

const preco = (e, n, a, d) => `<div class="pr"><div class="e">${e}</div><div class="n">${n}</div>
  <div class="a">${a}</div><div class="s">→</div><div class="d">${d}</div></div>`
const linhas = rows => rows.map(([n, a, d, ig]) => `<tr><td class="l">${n}</td><td class="h">${a}</td>
  <td class="${ig ? 'ig' : 'r'}">${d}</td></tr>`).join('')

const TELAS = [
  ['/tmp/hoje-1.png', `
    <div class="sel">⚽ Leilão Legends · 16 de setembro</div>
    <h1>O SEU CLUBE<br><span class="g">FICOU MAIS<br>RICO HOJE</span></h1>
    <div class="lead">Mexemos na conta do clube inteira: estádio, bilheteria, torcida e camisa.</div>
    <div class="it"><span class="e">💸</span><div><b>Construir ficou mais barato</b>
      <span>as obras do começo caíram quase pela metade</span></div></div>
    <div class="it"><span class="e">🎟️</span><div><b>Arquibancada agora dá dinheiro</b>
      <span>antes os lugares não contavam na bilheteria</span></div></div>
    <div class="it"><span class="e">🧍</span><div><b>Subir de divisão traz torcedor</b>
      <span>era a MESMA torcida da Várzea à Série A</span></div></div>
    <div class="it"><span class="e">🛡️</span><div><b>Ninguém perdeu nada</b>
      <span>tudo só somou — nenhum estádio construído foi mexido</span></div></div>`],

  ['/tmp/hoje-2.png', `
    <div class="sel g">1 · mais barato construir</div>
    <h1>COMEÇAR<br>FICOU <span class="g">MAIS<br>FÁCIL</span></h1>
    <div class="lead">Os preços do começo, que é onde a pessoa decide se continua jogando.</div>
    ${preco('🌱', 'Gramado', '60', '30')}
    ${preco('💺', 'Geral', '60', '40')}
    ${preco('💡', 'Refletores', '50', '30')}
    ${preco('🛍️', 'Loja do Clube', '80', '60')}
    <div class="cx">🛍️ E a Loja abre com <b>1 setor</b> em vez de 2: juntar
      <b>200 moedas</b> virou juntar <b>100</b>. É a obra que mais rende do jogo.</div>`],

  ['/tmp/hoje-3.png', `
    <div class="sel o">2 · bilheteria</div>
    <h1>AGORA<br><span class="g">ENCHER</span><br>DÁ DINHEIRO</h1>
    <div class="lead">Antes dava no mesmo ter 78 mil lugares ou ZERO — a bilheteria não olhava os lugares.</div>
    <table>${linhas([
      ['🥇 brigando pelo acesso (3º)', '112', '132'],
      ['⚪ meio de tabela (10º)', '77', '90'],
    ])}</table>
    <div class="cx">😮‍💨 E quem termina lá embaixo não joga mais pra estádio vazio:<br>
      16º lugar <b>35% → 40%</b> · rebaixado <b>18% → 27%</b> do estádio cheio.</div>`],

  ['/tmp/hoje-4.png', `
    <div class="sel g">3 · torcida do clube</div>
    <h1>SUBIR AGORA<br><span class="g">TRAZ<br>TORCEDOR</span></h1>
    <div class="lead">Quanta gente torce pelo seu clube. Era 12.000 da Várzea à Série A — a mesma.</div>
    <table>${linhas([
      ['Várzea', '12.000', '12.000', 1], ['Série D', '12.000', '20.000'],
      ['Série C', '12.000', '35.000'], ['Série B', '12.000', '60.000'],
      ['Série A', '12.000', '100.000'],
    ])}</table>
    <div class="pe">🧍 Torcida é <b>quem torce</b> — não é quanta gente cabe no estádio.</div>`],

  ['/tmp/hoje-5.png', `
    <div class="sel g">4 · venda de camisa</div>
    <h1>E A CAMISA<br><span class="g">VENDE MAIS</span><br>LÁ EM CIMA</h1>
    <div class="lead">Moedas por temporada, com o estádio meio construído. Era 21 em todas as divisões.</div>
    <table>${linhas([
      ['Várzea', '21', '21', 1], ['Série D', '21', '24'], ['Série C', '21', '30'],
      ['Série B', '21', '40'], ['Série A', '21', '55'],
    ])}</table>
    <div class="pe">👕 Mais torcedor, mais camisa vendida.</div>`],

  ['/tmp/hoje-6.png', `
    <div class="sel o">5 · o que passou a render</div>
    <h1>QUATRO COISAS<br>QUE <span class="r">NÃO<br>RENDIAM</span> NADA</h1>
    <div class="it"><span class="e">🎟️</span><div><b>Os lugares construídos</b>
      <span>agora cada 3.000 lugares = +1 moeda por temporada</span></div></div>
    <div class="it"><span class="e">🎭</span><div><b>O camarote</b>
      <span>cada lugar do camarote vale por DOIS — quem senta lá gasta mais</span></div></div>
    <div class="it"><span class="e">☂️</span><div><b>A cobertura</b>
      <span>+8% de venda de camisa: sem chuva, o povo vem</span></div></div>
    <div class="it"><span class="e">💡</span><div><b>Os refletores</b>
      <span>+5% de venda de camisa: jogo à noite enche mais</span></div></div>`],

  ['/tmp/hoje-7.png', `
    <div class="sel k">6 · e a tela ficou honesta</div>
    <h1>AGORA DÁ<br>PRA <span class="g">PLANEJAR</span></h1>
    <div class="it"><span class="e">👀</span><div><b>Obra trancada mostra preço e ganho</b>
      <span>dá pra saber pra que você está juntando dinheiro</span></div></div>
    <div class="it"><span class="e">🧾</span><div><b>Setor mostra a renda de verdade</b>
      <span>"rende +6/temp (hoje +3 — estádio 55% cheio)"</span></div></div>
    <div class="it"><span class="e">🧍</span><div><b>Barra da torcida na tela do estádio</b>
      <span>pra ver a sua torcida crescer a cada divisão</span></div></div>
    <div class="cx">🛡️ <b>Ninguém perdeu nada.</b> Estádio já construído continua igual, obra
      destravada continua destravada. Tudo só somou.</div>
    <div class="pe">⚽ <b>leilaolegends.com</b></div>`],
]

const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [f, corpo] of TELAS) {
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  await pg.setContent(base(corpo), { waitUntil: 'networkidle' })
  await pg.waitForTimeout(500)
  await pg.screenshot({ path: f })
  await pg.close()
  console.log(f)
}
await br.close()
