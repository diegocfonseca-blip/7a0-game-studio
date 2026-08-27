// ─── 📱 STORIES 1080×1920: AS 15 FORMAÇÕES ──────────────────────────────────
// Pedido do Diego (27/08): *"quero uma arte pra stories preenchendo a tela"* —
// a versão vertical anterior (1080×3172) era post/feed, comprida demais pra story.
//
// Aqui a tela é EXATAMENTE 1080×1920 e o conteúdo preenche por inteiro:
// a página é um flex-column de altura fixa, então nada sobra nem falta.
//
// 🧮 POR QUE 4 COLUNAS × 4 LINHAS (e não 5×3): numa tela de 1080×1920, com 15
// campinhos, a largura da coluna decide a ALTURA do campo. Com 5 colunas o campo
// fica 190×470 — um corredor, com metade de grama vazia no meio (foi a 1ª tentativa
// e o Diego ia reprovar de novo). Com 4 colunas ele fica ~241×306, que é a mesma
// proporção do campinho do jogo. Sobra 1 célula das 16, e ela vira o cartão da
// legenda — assim não fica buraco na grade.
// O que separa novo de antigo é o selo 🆕 e a cor do rótulo, não a posição.
//
// 🤫 REGRA DE OURO (herdada do post original): o mapa de maquiagem é SEGREDO DE
// PRODUÇÃO. Aqui NÃO existe "espelho", "conta do motor" nem técnico — pro
// usuário são 15 formações, todas igualmente de verdade.
//
// ✅ As 5 antigas saem da fonte real (`FORMATIONS` em types.ts), não de memória —
//    reparar no 3-4-3 (2 LAT + 1 ZAG) e no 5-3-2 (2 LAT + 3 ZAG).
//
//   node scripts/mockup-formacoes-15-stories.mjs [--saida formacoes-15-stories.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'formacoes-15-stories.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const dot = (tag, rec = false) => `
  <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;
    border:2.5px solid ${INK};background:${tag === 'G' ? '#F3D34A' : tag === 'L' ? '#BFE3C7' : '#DBD1B5'};color:${INK};
    ${OSW};font-size:11.5px;flex:none;${rec ? 'transform:translateY(10px)' : ''}">${tag}</span>`
const linha = dots => `<div style="display:flex;justify-content:center;gap:6px;flex:none">${dots}</div>`

// o campinho ESTICA pra altura da célula (height:100%) — é isso que faz a arte
// preencher a tela sem sobrar faixa de creme no fim.
const campo = (rotulo, faixas, novo) => `
  <div style="display:flex;flex-direction:column;height:100%;min-height:0">
    <p style="${OSW};font-size:15px;text-transform:uppercase;margin:0 0 5px;text-align:center;white-space:nowrap;
      color:${novo ? INK : '#4a6b55'}">${novo ? '🆕 ' : ''}${rotulo}</p>
    <div style="flex:1;min-height:0;background:repeating-linear-gradient(180deg,${GREEN} 0 26px,#166332 26px 52px);
      border:3px solid ${INK};border-radius:12px;padding:11px 3px 9px;box-shadow:3px 3px 0 ${INK};
      display:flex;flex-direction:column">
      ${faixas.ataque}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">${faixas.meio}</div>
      <div style="margin-bottom:12px">${faixas.defesa}</div>
      ${faixas.gol}
    </div>
  </div>`

const A = n => linha(Array.from({ length: n }, () => dot('A')).join(''))
const M = n => linha(Array.from({ length: n }, () => dot('M')).join(''))
const DEF4 = linha(dot('L') + dot('Z') + dot('Z') + dot('L'))
const DEF5 = linha(dot('L') + dot('Z') + dot('Z') + dot('Z') + dot('L'))
const DEF3Z = linha(dot('Z') + dot('Z') + dot('Z'))
const DEF343 = linha(dot('L') + dot('Z') + dot('L'))
const GOL = linha(dot('G'))
const LOS = M(1) + linha(dot('M') + '<span style="width:32px"></span>' + dot('M')) + M(1)

// linhas 1 e 2 da grade — as 10 NOVAS
const NOVAS = {
  '4-2-4': { ataque: A(4), meio: M(2), defesa: DEF4, gol: GOL },
  '5-4-1': { ataque: A(1), meio: M(4), defesa: DEF5, gol: GOL },
  '4-3-1-2': { ataque: A(2), meio: M(1) + M(3), defesa: DEF4, gol: GOL },
  '4-2-3-1': { ataque: A(1), meio: M(3) + M(2), defesa: DEF4, gol: GOL },
  '4-3-2-1': { ataque: A(1), meio: M(2) + M(3), defesa: DEF4, gol: GOL },
  '4-1-4-1': { ataque: A(1), meio: M(4) + M(1), defesa: DEF4, gol: GOL },
  '4-4-2 losango': { ataque: A(2), meio: LOS, defesa: DEF4, gol: GOL },
  '3-4-3 losango': { ataque: A(3), meio: LOS, defesa: DEF343, gol: GOL },
  '3-5-2': { ataque: A(2), meio: linha(dot('L', true) + dot('M') + dot('M') + dot('M') + dot('L', true)), defesa: DEF3Z, gol: GOL },
  '5-3-2 líbero': { ataque: A(2), meio: M(3), defesa: linha(dot('L') + dot('Z') + dot('Z', true) + dot('Z') + dot('L')), gol: GOL },
}
// linha 3 da grade — as 5 que o jogo JÁ TINHA (conta real de FORMATIONS)
const ANTIGAS = {
  '4-3-3': { ataque: A(3), meio: M(3), defesa: DEF4, gol: GOL },
  '4-4-2': { ataque: A(2), meio: M(4), defesa: DEF4, gol: GOL },
  '4-5-1': { ataque: A(1), meio: M(5), defesa: DEF4, gol: GOL },
  '3-4-3': { ataque: A(3), meio: M(4), defesa: DEF343, gol: GOL },
  '5-3-2': { ataque: A(2), meio: M(3), defesa: DEF5, gol: GOL },
}

const celulas = (obj, novo) => Object.entries(obj).map(([r, f]) => campo(r, f, novo)).join('')

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};width:1080px;height:1920px;padding:40px 34px 30px;font-family:system-ui;
     display:flex;flex-direction:column;overflow:hidden}</style>
<body>

  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;box-shadow:4px 4px 0 ${INK};
      padding:9px 26px;${OSW};font-size:24px;letter-spacing:.07em;text-transform:uppercase">🎽 vem aí ⚽</div>
    <h1 style="${OSW};font-size:96px;line-height:.98;text-transform:uppercase;margin:16px 0 0">
      De <span style="color:${RED}">5</span> pra <span style="color:${GREEN}">15</span></h1>
    <h2 style="${OSW};font-size:44px;line-height:1.05;text-transform:uppercase;margin:2px 0 12px">formações!</h2>
    <p style="font-size:22px;font-weight:700;line-height:1.4;margin:0 auto;max-width:930px">
      Do <b>4-2-4</b> com quatro atacantes de verdade ao ônibus do <b>5-4-1</b> — passando pelo losango,
      pela árvore de Natal e pelo <b>líbero</b> raiz. 🔥</p>
  </div>

  <!-- 4 colunas × 4 linhas = 16 células: 15 campinhos + o cartão da legenda -->
  <div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);
    gap:15px 14px;margin:20px 0 14px">
    ${celulas(NOVAS, true)}
    ${celulas(ANTIGAS, false)}
    <div style="display:flex;flex-direction:column;justify-content:center;gap:13px;height:100%;
      background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:14px 12px;margin-top:20px">
      <div style="text-align:center">
        <span style="${OSW};font-size:15px;text-transform:uppercase;background:#E8503A;color:#fff;border:2.5px solid ${INK};
          border-radius:999px;padding:4px 12px;display:inline-block">🆕 10 novas</span>
        <p style="font-size:12.5px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 0 0;line-height:1.3">as que chegaram agora</p>
      </div>
      <div style="text-align:center">
        <span style="${OSW};font-size:15px;text-transform:uppercase;background:${GREEN};color:#fff;border:2.5px solid ${INK};
          border-radius:999px;padding:4px 12px;display:inline-block">✅ 5 de sempre</span>
        <p style="font-size:12.5px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 0 0;line-height:1.3">ninguém perde o esquema que já usava</p>
      </div>
    </div>
  </div>

  <p style="flex:none;font-size:21px;font-weight:700;color:rgba(0,0,0,.6);text-align:center">
    ⚽ Leilão <span style="color:${RED};${OSW}">Legends</span> · leilaolegends.com</p>
</body>`

const tmp = `/tmp/mock-form15st-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA }) // sem fullPage: é story, tem que ser 1080×1920 cravado
await b.close()
console.log(`${SAIDA} — 1080x1920`)
