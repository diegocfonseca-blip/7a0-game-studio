// 🪞 ANTES × DEPOIS — as mudanças de organização da carreira, FEITAS e fotografadas
//
// Pedido do Diego (16/09): *"cadê mockups das ideias de como ficaria"*.
//
// ⚠️ NÃO É DESENHO: as telas do "depois" são o JOGO DE VERDADE rodando com as
// mudanças aplicadas num rascunho local. Foram capturadas pela mesma bancada do
// "antes" (`scripts/navega-carreira.mjs`), no mesmo save e no mesmo celular de
// 430×900 — por isso os dois lados são comparáveis de verdade.
//
// O rascunho NÃO foi commitado: está esperando o Diego escolher.
//
// Rodar: node scripts/mockup-antes-depois-carreira.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-antes-depois-carreira.png')
const A = arg('antes', '/tmp/carreira-telas'), D = arg('depois', '/tmp/carreira-depois')
const VERM = '#C2452F', ROXO = '#7C3AED'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`

// rolagem medida nas duas vezes (telas de celular)
const MEDIDAS = [
  ['Jogos', 2.8, 2.7], ['Tabelas', 2.0, 1.5], ['Elenco', 3.8, 3.4], ['Rank', 2.3, 1.8], ['Clube', 3.8, 3.4],
]
const linhaMedida = ([nome, antes, depois]) => {
  const g = (antes - depois) / antes * 100
  return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
    <span style="${OSW};font-weight:700;font-size:13px;width:66px">${nome}</span>
    <span style="flex:1;position:relative;height:20px;background:#E3DAC0;border-radius:5px;display:block">
      <span style="position:absolute;inset:0;width:${antes / 4 * 100}%;background:#B9AE92;border-radius:5px"></span>
      <span style="position:absolute;inset:0;width:${depois / 4 * 100}%;background:${GREEN};border-radius:5px;
        display:flex;align-items:center;justify-content:flex-end;padding-right:7px;${OSW};font-weight:700;font-size:11px;color:#fff">${depois}</span>
    </span>
    <span style="${OSW};font-weight:700;font-size:12px;width:78px;text-align:right;color:${g > 1 ? GREEN : '#8a8069'}">
      ${g > 1 ? `−${Math.round(g)}%` : 'igual'}</span>
  </div>`
}

// um par de telas lado a lado
const par = (titulo, sub, fAntes, fDepois, legA, legD) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};
    overflow:hidden;margin-bottom:20px">
    <div style="background:${INK};padding:10px 16px">
      <div style="${OSW};font-weight:700;font-size:19px;color:${GOLD};text-transform:uppercase;line-height:1.1">${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:12.5px;color:rgba(244,236,214,.8);margin-top:2px">${sub}</div>
    </div>
    <div style="display:flex;gap:16px;padding:16px">
      ${[[fAntes, 'ANTES · hoje no ar', '#8a8069', legA], [fDepois, 'DEPOIS · o rascunho', GREEN, legD]].map(([f, rot, cor, leg]) => `
        <div style="flex:1;text-align:center">
          <div style="display:inline-block;background:${cor};color:#fff;border:3px solid ${INK};border-radius:999px;
            padding:3px 14px;${OSW};font-weight:700;font-size:11.5px;letter-spacing:1px;margin-bottom:8px;
            box-shadow:3px 3px 0 ${INK}">${rot}</div>
          <img src="${png(f)}" style="width:100%;display:block;border:3px solid ${INK};border-radius:12px;
            box-shadow:3px 3px 0 ${INK}">
          <div style="${OSW};font-weight:400;font-size:12px;line-height:1.4;margin-top:7px;opacity:.82">${leg}</div>
        </div>`).join('')}
    </div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1120px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  O "DEPOIS" É O JOGO RODANDO DE VERDADE · MESMO SAVE · MESMO CELULAR DE 430px</div>
<h1 style="${OSW};font-weight:700;font-size:42px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Antes × depois <span style="color:${ROXO}">de verdade</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 20px;max-width:980px;opacity:.85">
  Você pediu pra ver. Então em vez de desenhar, eu <b>fiz as mudanças num rascunho</b> e fotografei o jogo
  de novo, com a mesma bancada e o mesmo save. <b>Nada disso foi commitado</b> — está aqui só pra você
  escolher o que entra e o que não entra.</p>

<div style="display:flex;gap:22px;align-items:stretch;margin-bottom:22px">
  <div style="flex:1.15;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:10px">
      📏 Rolagem de cada aba · cinza = antes · verde = depois</div>
    ${MEDIDAS.map(linhaMedida).join('')}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;opacity:.75;margin-top:8px">
      A aba <b>Jogos</b> fica igual de propósito — lá nada foi tirado.</div>
  </div>
  <div style="flex:1;border:4px solid ${GREEN};border-radius:18px;background:#EFF7F1;padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px;color:${GREEN}">
      🏟️ E o número que mais importa</div>
    <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
      Onde começa o <b>desenho do estádio</b> na aba Clube:</div>
    <div style="display:flex;align-items:center;gap:14px;margin:12px 0 4px">
      <div style="text-align:center;flex:1">
        <div style="${OSW};font-weight:700;font-size:34px;color:#8a8069;line-height:1">740px</div>
        <div style="${OSW};font-weight:400;font-size:11.5px;opacity:.7">antes · quase 1 tela pra baixo</div></div>
      <div style="${OSW};font-weight:700;font-size:28px;color:${GREEN}">→</div>
      <div style="text-align:center;flex:1">
        <div style="${OSW};font-weight:700;font-size:34px;color:${GREEN};line-height:1">318px</div>
        <div style="${OSW};font-weight:400;font-size:11.5px;opacity:.7">depois · na primeira tela</div></div>
    </div>
    <div style="${OSW};font-weight:400;font-size:12.5px;line-height:1.5;margin-top:8px;
      background:#fff;border-radius:9px;padding:8px 11px">
      É a sua regra de volta: <b>"o desenho do estádio é sagrado — primeira coisa visível"</b>.</div>
  </div>
</div>

${par('1 · A aba Clube', 'o placar entra já como a faixinha fina no topo, e a caixa de conta sai — o estádio volta pra primeira tela',
  `${A}/aba-Clube-topo.png`, `${D}/aba-Clube-topo.png`,
  'Caixa de conta, faixa da temporada e <b>o placar inteiro</b> antes de tudo. O estádio não aparece.',
  'A faixinha do placar fica <b>grudada no topo</b> (toca e abre inteiro). <b>O estádio aparece de cara.</b>')}

${par('2 · A aba Elenco', 'mesma mexida: o que você foi buscar sobe uma tela inteira',
  `${A}/aba-Elenco-topo.png`, `${D}/aba-Elenco-topo.png`,
  'O campinho e a tática começam lá embaixo, depois de tudo que se repete.',
  'O time aparece <b>quase de cara</b>. Nada foi removido — só saiu da frente.')}

${par('3 · O modal do preparador', 'botão travado deixa de ter cara de botão, e passa a dizer quanto falta',
  `${A}/modal-preparador.png`, `${D}/modal-preparador.png`,
  'Dois retângulos escuros e grandes escritos <b>"moedas insuficientes"</b> — cara de clicável, e o preço some.',
  'Vira etiqueta lisa e tracejada: <b>🔒 300 🪙 · faltam 196 🪙 pra contratar</b>. O preço fica, e diz a saída.')}

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:15px 18px;margin-bottom:18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:7px">
    ⚠️ Uma coisa que eu preciso te falar antes de você decidir</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.6">
    A caixa de <b>"criar conta"</b> ficou grande porque <b>VOCÊ pediu</b>, em 21/08:
    <i>"a parte do criar conta deixe um pouco mais chamativo"</i>. Antes dela era uma tirinha fininha que
    sumia no meio dos quadros.<br>
    <b>Por isso eu não a diminuí.</b> No rascunho ela continua exatamente do jeito que você aprovou —
    só que <b>na aba Jogos</b>, e não repetida nas outras quatro. Você continua ganhando o chamariz forte,
    e ele para de empurrar o elenco e o estádio pra baixo. Se preferir manter nas cinco, é uma linha de volta.</div>
</div>

<div style="border:4px solid ${ROXO};border-radius:18px;background:#F6F0FF;padding:14px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;color:${ROXO};margin-bottom:7px">
    ✅ O que já está pronto pra ligar, se você aprovar</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.65">
    As três coisas de cima <b>estão feitas e o jogo compila</b> — falta só o seu OK.
    Não mexem em <b>nenhuma regra, nenhum número e nenhum save</b>: é só onde as coisas ficam na tela.
    Junto com elas entram duas mexidas pequenas que não dá pra fotografar: o <b>"Bola rolando"</b> some da
    faixa (o cartão do jogo logo abaixo já diz) e a frase <b>"Acompanhe sua divisão…"</b> passa a aparecer
    só na 1ª temporada.<br>
    <b>Ficaram de fora, esperando você:</b> a faixa do Desbloquear virar modal, os três andares de
    navegação do Elenco, e a virada mostrar um passo de cada vez.<br>
    <b>Reverter é um commit</b> — como sempre.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:12px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    rascunho de 16/09 · NÃO está no ar<br>refazer: <b>node scripts/mockup-antes-depois-carreira.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1120, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
