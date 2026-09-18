// 🧾 A LISTA SIMPLES — "o que muda e o que NÃO muda" no celular.
//
// Diego, depois de 6 versões de mockup: *"mas não o giro da rodada, as zoeiras e
// etc? Sei lá, tô confuso, não sei o que faço"*.
//
// A culpa da confusão é MINHA: eu fui mandando versão atrás de versão e nunca
// mostrei a LISTA COMPLETA do que existe na tela. Então este arquivo não desenha
// telefone nenhum — é só o inventário, bloco por bloco, conferido no código.
//
// 🔍 E conferindo achei o principal: **os OUTROS JOGOS já estão certos hoje.**
// `screens.tsx:5773` monta a `.ll27-room-summary` com a `.ll27-ticker`, que no
// `online-match-visual.css:110` é `overflow-x:auto` + `scroll-snap`, com cada
// card em `flex: 0 0 230px`. Ou seja: JÁ rola de lado, JÁ fica logo abaixo do
// placar, e o card JÁ tem 230px. Eu inventei um problema que não existia — e na
// v4 desenhei o card com 132px, que foi o "diminuiu os jogos" que ele reclamou.
// 👉 Eles não mudam em NADA.
//
// 💬 E a ZOEIRA também não muda: o `ChatWidget` é montado no `index.tsx:405`, no
// nível do app, como balão flutuante. Ele não está na fila da tela — flutua por
// cima dela. Nada a decidir sobre ele.
//
// Sobrou pouca coisa de verdade: a tabela sobe, a tática vira pílula, e as abas
// de cima descem pra barra que já existe embaixo.
//
// Rodar: node scripts/mockup-celular-lista.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/celular-lista.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D'

// [emoji, bloco, onde está hoje, o que acontece, muda?]
const LINHAS = [
  ['🟢', 'Placar ao vivo (com a mascote no gol)', 'no topo', 'fica igual — e ganha espaço, fica MAIOR', 0],
  ['📺', 'Outros jogos da rodada', 'faixa que rola de lado, abaixo do placar', 'NÃO MUDA NADA', 0],
  ['💬', 'Zoeira da sala', 'balão que flutua por cima', 'NÃO MUDA NADA', 0],
  ['👑', 'Notícia sua ("você é o novo LÍDER")', 'abaixo', 'fica no mesmo lugar', 0],
  ['📣', 'Giro da rodada', 'abaixo', 'fica no mesmo lugar', 0],
  ['🥊', 'Resultado do clássico / rival', 'abaixo', 'fica no mesmo lugar', 0],
  ['🛋️', 'Aviso de folga (rodada sem jogo)', 'abaixo', 'fica no mesmo lugar', 0],
  ['🏆', 'A TABELA', 'lá no fim, depois de tudo', 'SOBE pra logo depois do placar', 1],
  ['⚔️', 'Próximo jogo + tática', 'caixote com 3 botões grandes', 'vira UMA LINHA com pílula ⚖️ ▾', 1],
  ['📊', 'Estatísticas', 'aba em cima', 'vira botão na barra de baixo', 1],
  ['👥', 'Elenco', 'aba em cima', 'vira botão na barra de baixo', 1],
  ['🏅', 'Rank · Estante · Temporadas', 'barra fixa embaixo (3 botões)', 'viram 1 botão só: 📚 Estante', 1],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1120px;padding:30px}
  h1{font-size:46px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:14px 18px;font-size:16.5px;font-weight:700;margin:14px 0 22px;line-height:1.45}
  table{width:100%;border-collapse:collapse;background:#fff;border:3px solid ${INK};border-radius:14px;overflow:hidden;
        box-shadow:4px 4px 0 ${INK}}
  th{background:${INK};color:#fff;font-size:11.5px;letter-spacing:1px;text-transform:uppercase;padding:10px 12px;text-align:left}
  td{padding:11px 12px;border-top:2px solid rgba(12,12,12,.08);font-size:14.5px;font-weight:700;vertical-align:middle}
  td.e{font-size:22px;width:44px;text-align:center}
  td.hoje{color:#8a8270;font-weight:600;font-size:13.5px}
  .ok{color:${VERDE};font-weight:900}
  .mu{color:#B8860B;font-weight:900}
  tr.fica td{background:#F6FBF7}
  .cx{border:3px solid ${VERDE};background:#EAF5EE;border-radius:14px;padding:16px 19px;margin-top:20px;
      font-size:16px;font-weight:700;line-height:1.55}
  .cx b{color:${VERDE}}
  .fim{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:16px 19px;
       margin-top:16px;font-size:15.5px;font-weight:700;line-height:1.6}
</style>

<h1>CALMA — É SÓ<br><span class="g">ISTO AQUI</span></h1>
<div class="lead">😅 A confusão é culpa minha: eu te mandei seis versões de desenho e nunca te mostrei a
LISTA. Então parei de desenhar, fui no código e conferi <b>bloco por bloco</b> o que existe nessa tela.
<b>De 12 coisas, só 5 mudam de lugar — e nenhuma some.</b></div>

<table>
  <tr><th style="width:44px"></th><th>o quê</th><th>onde está hoje</th><th>o que acontece</th></tr>
  ${LINHAS.map(([e, o, h, d, muda]) => `<tr class="${muda ? '' : 'fica'}">
    <td class="e">${e}</td><td>${o}</td><td class="hoje">${h}</td>
    <td class="${muda ? 'mu' : 'ok'}">${muda ? '↪ ' : '✅ '}${d}</td></tr>`).join('')}
</table>

<div class="cx">🔍 <b>E achei uma coisa importante conferindo:</b> os <b>OUTROS JOGOS já estão certos hoje</b> —
no código eles já rolam de lado, já ficam logo abaixo do placar e o card já tem 230px de largura.
<b>Eu inventei um problema que não existia</b>, e no desenho passado encolhi o card pra 132px. Era isso que
você viu e não gostou. Eles <b>não mudam em nada</b>.<br>
💬 A <b>zoeira da sala</b> também não entra nessa conversa: ela é um balão que <b>flutua por cima</b> da
tela, não está na fila dos blocos. Fica exatamente como é.</div>

<div class="fim">
  <b>Traduzindo pro que você decide:</b> só preciso do seu sim ou não em <b>três coisas</b> —<br>
  1️⃣ <b>A tabela sobe</b> pra perto do placar (hoje ela é a última da fila).<br>
  2️⃣ <b>O caixote da tática vira uma pílula</b> que abre no toque, igual você já aprovou no Elenco.<br>
  3️⃣ <b>As abas de cima descem</b> pra barra que já existe embaixo (e Rank/Estante/Temporadas viram um
  botão só).<br><br>
  👉 Se você quiser, <b>dá pra fazer só a nº 1</b> e parar aí. É a que resolve a sua reclamação original
  ("a tabela fica lá embaixo") e é a mais fácil de desfazer.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1120, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
