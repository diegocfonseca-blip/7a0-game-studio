// 🖥️ MOCKUP — O ONLINE NO DESKTOP (pedido do Diego, 18/09)
//
// Palavras dele, com print do ultrawide: *"eu acho que deveríamos fazer pra
// desktop usar mais o espaço que temos, não? Porque a tabela fica lá embaixo…
// esse negócio de próximo jogo aí ninguém vê e é tá muito grande… equilíbrio,
// retranca e ataque grande também. Ajusta aí melhor"*.
//
// A CAUSA, achada no código: a tela inteira é UMA COLUNA de `maxWidth: 620`
// (screens.tsx:340). No monitor dele isso usa ~18% da largura — o resto é papel
// de parede, e tudo que não cabe nos 620 desce pra baixo da dobra. A tabela é a
// última da fila.
//
// ⚠️ ISTO É SÓ DESENHO. Nada foi mexido no jogo — ele aprova antes.
// Rodar: node scripts/mockup-online-desktop.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/mockup-online-desktop.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

// os dados são os do print dele, pra ele reconhecer a própria tela
const TABELA = [
  [1, 'Neymarzetti 👑', 12, 4, 0, 1, 5, 1], [2, 'Flapingas', 11, 3, 2, 0, 6, 0],
  [3, 'Bagres de Wall Street FC', 9, 3, 0, 2, 2, 0], [4, 'Só Deus Sabe FC', 8, 2, 2, 1, 6, 0],
  [5, 'Rei da Bola FC', 8, 2, 2, 1, 4, 0], [6, 'Fala D10', 8, 2, 2, 1, 2, 0],
  [7, 'Xurupitas FC', 8, 2, 2, 1, 2, 0], [8, 'Vidraceiro FC', 7, 2, 1, 2, 1, 0],
  [9, 'Nata de SP', 7, 2, 1, 2, 0, 0], [10, 'Al Takhadao FC', 6, 1, 3, 1, 0, 0],
  [11, 'Bagres 1993', 6, 1, 3, 1, -1, 0], [12, 'São Luiz FC', 5, 1, 2, 2, -2, 0],
]
const OUTROS = [
  ['Nata de SP', '0', '1', 'Vidraceiro FC', "Elias 1'"],
  ['São Luiz FC', '0', '0', 'Al Takhadao FC', ''],
  ['Bagres de Wall Street FC', '0', '0', 'Fala D10', ''],
  ['Só Deus Sabe FC', '0', '2', 'Rei da Bola FC', "Zico 8' · Bebeto 14'"],
  ['Flapingas', '1', '0', 'Xurupitas FC', "Sávio 11'"],
]

const css = `
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME}}
  .tela{background:linear-gradient(180deg,#14261a,#0b1a12);padding:14px;border:4px solid ${INK};border-radius:16px}
  .cd{background:#F7F4EA;border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK}}
  .cab{font-size:11px;font-weight:900;letter-spacing:1.1px;text-transform:uppercase;color:#7a7364;padding:8px 11px 5px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:#8a8270;font-weight:800;padding:4px 5px;text-align:right}
  th.l{text-align:left}
  td{padding:5px 5px;font-weight:800;text-align:right;border-top:1px solid rgba(12,12,12,.08)}
  td.l{text-align:left;font-weight:700}
  tr.eu td{background:#FFF0C4}
  .g8{display:inline-block;background:${GOLD};border:1.5px solid ${INK};border-radius:5px;font-size:8.5px;font-weight:900;padding:0 4px;margin-right:5px}
  .placar{display:flex;align-items:center;justify-content:center;gap:22px;color:#fff}
  .placar .t{font-size:15px;font-weight:900;text-align:center;min-width:130px}
  .placar .n{background:#fff;border:3px solid ${INK};border-radius:11px;padding:3px 16px;font-size:26px;font-weight:900;color:${INK}}
  .jogo{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;padding:6px 9px;border-top:1px solid rgba(12,12,12,.08)}
  .jogo .pl{background:${INK};color:#fff;border-radius:6px;padding:1px 7px;font-size:11px;flex:none}
  .jogo .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .jogo .gl{font-size:9.5px;font-weight:700;color:#8a8270;flex:none}
  .tat{display:flex;gap:6px;padding:0 9px 9px}
  .tat b{flex:1;text-align:center;font-size:11.5px;font-weight:900;border:2.5px solid ${INK};border-radius:8px;padding:5px 0;background:#fff}
  .tat b.on{background:${GOLD}}
  .lider{background:${ROXO};color:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};
         padding:7px 11px;font-size:12.5px;font-weight:900;text-align:center}
  .abas{display:flex;gap:7px;margin-bottom:9px}
  .abas b{flex:1;text-align:center;font-size:11.5px;font-weight:900;border:3px solid ${INK};border-radius:10px;padding:6px 0;background:#F7F4EA;box-shadow:2px 2px 0 ${INK}}
  .abas b.on{background:${ROXO};color:#fff}
`

const tabelaHtml = (n) => `<table>
  <tr><th class="l">#&nbsp;&nbsp;Time</th><th>P</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr>
  ${TABELA.slice(0, n).map(([p, t, P, V, E, D, SG, eu]) => `<tr class="${eu ? 'eu' : ''}">
    <td class="l"><span class="g8">G8</span>${p}. ${t}</td><td>${P}</td><td>${V}</td><td>${E}</td><td>${D}</td><td>${SG}</td></tr>`).join('')}
</table>`

const placar = `<div class="placar">
  <div class="t">Bagres 1993<br><span style="font-size:9.5px;opacity:.6">RIVAL</span></div>
  <div style="text-align:center"><div style="font-size:9.5px;color:#9fe6b5;font-weight:800;margin-bottom:3px">🟢 BOLA ROLANDO · 22'</div>
    <div class="n">0 &times; 0</div></div>
  <div class="t">Neymarzetti 👑<br><span style="font-size:9.5px;opacity:.6">VOCÊ</span></div>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  ${css}
  .wrap{width:1660px;padding:26px}
  h1{font-size:42px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 17px;font-size:16px;font-weight:700;margin:13px 0 20px;line-height:1.45}
  .rot{display:inline-block;color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;
       padding:6px 14px;border-radius:9px;margin-bottom:10px}
  .nota{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:15px 18px;margin-top:18px;
        font-size:14.5px;font-weight:700;line-height:1.55}
  .nota b{color:${VERDE}}
  .lado{display:grid;grid-template-columns:430px 1fr;gap:22px;align-items:start}
  .fold{position:relative}
  .fold::after{content:'↓ tudo daqui pra baixo só aparece se rolar';position:absolute;left:0;right:0;bottom:-20px;
               text-align:center;font-size:11px;font-weight:900;color:${VERM};letter-spacing:.5px}
</style>
<div class="wrap">
<h1>O ONLINE NO <span class="g">DESKTOP</span></h1>
<div class="lead">🖥️ A tela do jogo inteira é <b>uma coluna de 620px</b>. No seu monitor isso usa menos de um quinto da
largura — o resto é papel de parede, e o que não cabe nos 620 <b>desce pra baixo da dobra</b>. A tabela é a última da fila.
<b>Nada foi mexido: isto é só o desenho pra você aprovar.</b></div>

<div class="lado">
  <div>
    <div class="rot" style="background:${VERM}">❌ como está hoje</div>
    <div class="tela fold" style="height:520px;overflow:hidden">
      <div style="width:290px;margin:0 auto">
        <div style="color:#fff;font-size:10px;font-weight:800;display:flex;justify-content:space-between;margin-bottom:6px"><span>RODADA 6/38</span><span>1º · 12 pts</span></div>
        <div class="cd" style="background:#22352a;border-color:#000;padding:9px 6px;margin-bottom:9px">${placar}</div>
        <div class="abas"><b class="on">JOGOS · TABELA</b><b>ESTATÍSTICAS</b><b>ELENCO</b></div>
        <div class="cd" style="margin-bottom:9px"><div class="cab">Outros jogos · rodada 6</div>
          ${OUTROS.slice(0, 2).map(([a, x, y, b, g]) => `<div class="jogo"><span class="nm">${a}</span><span class="pl">${x}&times;${y}</span><span class="nm" style="text-align:right">${b}</span></div>`).join('')}
        </div>
        <div class="cd"><div class="cab">Próximo: Xurupitas FC × Neymarzetti (fora)</div>
          <div class="tat"><b>🛡️ Retranca</b><b class="on">⚖️ Equilíbrio</b><b>🔥 Ataque</b></div>
          <p style="font-size:9px;font-weight:700;color:#8a8270;padding:0 9px 9px;line-height:1.35">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
        </div>
      </div>
    </div>
    <p style="font-size:13px;font-weight:700;color:#555;margin-top:30px;line-height:1.5">
      👉 A <b>tabela</b>, o <b>giro da rodada</b> e a faixa de líder ficam TODOS abaixo disto.<br>
      👉 O bloco do <b>Próximo jogo</b> ocupa quase um terço da altura visível — e é o que você disse que ninguém vê.</p>
  </div>

  <div>
    <div class="rot" style="background:${VERDE}">✅ como ficaria</div>
    <div class="tela">
      <div style="color:#fff;font-size:11px;font-weight:800;display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
        <span>RODADA 6/38</span><span style="font-size:13px;font-weight:900">👑 1º lugar · 12 pts</span></div>
      <div class="cd" style="background:#22352a;border-color:#000;padding:10px 6px;margin-bottom:10px">${placar}</div>
      <div style="display:grid;grid-template-columns:1fr 330px;gap:10px;align-items:start">
        <div>
          <div class="abas"><b class="on">JOGOS · TABELA</b><b>ESTATÍSTICAS</b><b>ELENCO</b></div>
          <div class="cd"><div class="cab">🏆 Liga Legends</div>${tabelaHtml(12)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:9px">
          <div class="lider">👑 Você é o novo LÍDER do campeonato!</div>
          <div class="cd">
            <div class="cab">⚔️ Próximo · Xurupitas FC (fora)</div>
            <div class="tat"><b>🛡️</b><b class="on">⚖️ Equilíbrio</b><b>🔥</b></div>
          </div>
          <div class="cd"><div class="cab">Outros jogos · rodada 6</div>
            ${OUTROS.map(([a, x, y, b, g]) => `<div class="jogo"><span class="nm">${a}</span><span class="pl">${x}&times;${y}</span><span class="nm" style="text-align:right">${b}</span></div>`).join('')}
          </div>
          <div class="cd"><div class="cab">📣 Giro da rodada</div>
            <p style="font-size:11.5px;font-weight:700;padding:0 11px 10px;line-height:1.4">R6 · 👑 Flapingas assumiu a liderança do campeonato!</p></div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="nota">
  <b>O que muda, item por item</b><br>
  📊 <b>A tabela sobe pra tela.</b> Ela vira a coisa principal do lado esquerdo — 12 times visíveis sem rolar nada.
  É o que você olha toda rodada.<br>
  ⚔️ <b>O "Próximo jogo" encolhe e sobe pro lado direito.</b> Vira uma linha: o adversário no título e os três botões
  do tamanho de botão. A explicação ("retranca segura ataque…") vira a dica que aparece ao passar o mouse — ela é pra
  aprender uma vez, não pra ficar ocupando tela toda rodada.<br>
  🛡️ <b>Retranca e Ataque viram só o ícone</b> quando não estão escolhidos; o escolhido fica por extenso e dourado.
  Assim dá pra ver o que está valendo de longe, sem três caixões.<br>
  📣 <b>Giro da rodada e a faixa de líder</b> saem do fim da fila e ficam na coluna da direita, onde a notícia é lida.<br>
  📱 <b>O celular NÃO muda em nada.</b> As duas colunas só existem em tela larga; abaixo disso tudo volta a empilhar
  exatamente como está hoje.
</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1660, height: 1200 }, deviceScaleFactor: 1.5 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
