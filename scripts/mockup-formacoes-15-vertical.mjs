// ─── 📢 POST VERTICAL: AS 15 FORMAÇÕES (as 5 de sempre + as 10 novas) ────────
// Pedido do Diego (27/08): *"me mande um mockup vertical dessa arte aí das
// formações e coloque as que já tínhamos também, anteriores, 433 442 e outras 3"*.
//
// É a versão VERTICAL (1080 de largura, pra postar) do
// `mockup-novidade-formacoes.mjs`, agora com as 15: primeiro as 10 novas, depois
// as 5 que o jogo já tinha, e por último o campinho que cresceu.
//
// 🤫 REGRA DE OURO (herdada do post original): o mapa de maquiagem é SEGREDO DE
// PRODUÇÃO. Aqui NÃO existe "espelho", "conta do motor" nem técnico — pro
// usuário são 15 formações, todas igualmente de verdade.
//
// ✅ As 5 antigas saem da fonte real (`FORMATIONS` em types.ts), não de memória:
//    4-3-3 (2·2·3·3) · 4-4-2 (2·2·4·2) · 4-5-1 (2·2·5·1)
//    3-4-3 (2 LAT + 1 ZAG · 4 · 3) · 5-3-2 (2 LAT + 3 ZAG · 3 · 2)
//
//   node scripts/mockup-formacoes-15-vertical.mjs [--saida formacoes-15.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'formacoes-15.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// bolinha do campinho (sem nome — é desenho de esquema)
const dot = (tag, rec = false) => `
  <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;
    border:3px solid ${INK};background:${tag === 'G' ? '#F3D34A' : tag === 'L' ? '#BFE3C7' : '#DBD1B5'};color:${INK};
    ${OSW};font-size:14px;flex:none;${rec ? 'transform:translateY(12px)' : ''}">${tag}</span>`
const linha = dots => `<div style="display:flex;justify-content:center;gap:8px;flex:none">${dots}</div>`

// campo PADRÃO: altura única + faixas fixas (gol/zaga/ataque sempre no lugar,
// só o miolo redistribui) — exatamente a regra que entrou no jogo.
const ALT = 292
const campo = (rotulo, faixas, novo = true) => `
  <div style="width:100%">
    <p style="${OSW};font-size:17px;text-transform:uppercase;color:${INK};margin:0 0 6px;text-align:center;white-space:nowrap">${novo ? '🆕 ' : ''}${rotulo}</p>
    <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 ${ALT / 10}px,#166332 ${ALT / 10}px ${ALT / 5}px);
      border:4px solid ${INK};border-radius:14px;padding:13px 4px 10px;box-shadow:4px 4px 0 ${INK};
      height:${ALT}px;display:flex;flex-direction:column">
      ${faixas.ataque}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">${faixas.meio}</div>
      <div style="margin-bottom:14px">${faixas.defesa}</div>
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
const LOS = M(1) + linha(dot('M') + '<span style="width:40px"></span>' + dot('M')) + M(1)

// ── as 10 NOVAS (mesmas do post original) ──
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

// ── as 5 que o jogo JÁ TINHA (conta tirada de FORMATIONS, types.ts) ──
const ANTIGAS = {
  '4-3-3': { ataque: A(3), meio: M(3), defesa: DEF4, gol: GOL },
  '4-4-2': { ataque: A(2), meio: M(4), defesa: DEF4, gol: GOL },
  '4-5-1': { ataque: A(1), meio: M(5), defesa: DEF4, gol: GOL },
  '3-4-3': { ataque: A(3), meio: M(4), defesa: DEF343, gol: GOL },
  '5-3-2': { ataque: A(2), meio: M(3), defesa: DEF5, gol: GOL },
}

// 3 por linha, CENTRALIZADO — 10 e 5 não são múltiplos de 3, então a última
// linha fica com sobra; centralizada ela não parece erro de diagramação.
const grade = (obj, novo) => `
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:22px 20px">
    ${Object.entries(obj).map(([r, f]) => `<div style="width:320px;flex:none">${campo(r, f, novo)}</div>`).join('')}
  </div>`

const faixa = (texto, bg, cor = INK) => `
  <div style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:4px 4px 0 ${INK};padding:8px 22px;${OSW};font-size:21px;letter-spacing:.06em;text-transform:uppercase">${texto}</div>`

// ── campinho ANTES × DEPOIS ──
const mini = (rot, cor, corpo, nota) => `
  <div style="flex:1">
    <p style="${OSW};font-size:15px;text-transform:uppercase;color:${cor};margin:0 0 6px;text-align:center">${rot}</p>
    ${corpo}
    <p style="font-family:system-ui;font-size:13px;font-weight:700;color:rgba(0,0,0,.55);margin:8px 2px 0;line-height:1.4;text-align:center">${nota}</p>
  </div>`
const antesCampo = `
  <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 18px,#166332 18px 36px);border:4px solid ${INK};border-radius:14px;
    padding:13px 4px 10px;box-shadow:4px 4px 0 ${INK};height:186px;display:flex;flex-direction:column;justify-content:space-between">
    ${A(3)}${M(3)}${DEF4}${GOL}
  </div>`
const depoisCampo = campo('', { ataque: A(3), meio: M(3), defesa: DEF4, gol: GOL }, false)
  .replace(/<p[^>]*>[^<]*<\/p>/, '')

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};width:1080px;padding:44px 40px 38px;font-family:system-ui}</style>
<body>

  <div style="text-align:center">
    ${faixa('🎽 agora são 15 formações! ⚽', GOLD)}
  </div>

  <h1 style="${OSW};font-size:64px;line-height:1.06;text-transform:uppercase;text-align:center;margin:18px 0 10px">
    De 5 pra <span style="color:${GREEN}">15</span> esquemas</h1>

  <p style="font-size:19px;font-weight:700;line-height:1.5;margin:0 0 8px;text-align:center">
    O Leilão Legends vai ganhar <b>10 formações novas</b>. Do <b>4-2-4</b> com quatro atacantes de verdade
    ao ônibus do <b>5-4-1</b>, passando pelo losango, pela árvore de Natal e pelo líbero raiz. 🔥</p>
  <p style="font-size:16px;font-weight:700;color:#5a5647;line-height:1.5;margin:0 0 30px;text-align:center">
    E olha o detalhe: no <b>3-5-2</b> os alas são seus laterais de verdade, e no <b>5-3-2 líbero</b>
    o zagueiro do meio fica de vigia atrás da linha. 👀</p>

  <div style="text-align:center;margin-bottom:20px">${faixa('🆕 as 10 novas', '#E8503A', '#fff')}</div>
  ${grade(NOVAS, true)}

  <div style="text-align:center;margin:38px 0 20px">${faixa('✅ as 5 de sempre', GREEN, '#fff')}</div>
  <p style="font-size:16px;font-weight:700;color:#5a5647;line-height:1.5;margin:-8px 0 20px;text-align:center">
    Essas continuam onde estavam — ninguém perde o esquema que já usava.</p>
  ${grade(ANTIGAS, false)}

  <div style="margin-top:38px;background:#fff;border:4px solid ${INK};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:20px 24px">
    <p style="${OSW};font-size:22px;text-transform:uppercase;margin:0 0 14px;text-align:center">🏟️ e o campinho cresceu</p>
    <div style="display:flex;gap:26px;align-items:flex-start">
      ${mini('como era', 'rgba(0,0,0,.5)', antesCampo, 'campo apertado, tudo colado')}
      ${mini('como ficou ✅', GREEN, depoisCampo, 'campo MAIOR, e do MESMO tamanho em toda formação — goleiro, zaga e ataque sempre no lugar')}
    </div>
  </div>

  <p style="margin-top:26px;font-size:16px;font-weight:700;color:rgba(0,0,0,.55);text-align:center">
    ⚽ Leilão <span style="color:${RED};${OSW}">Legends</span> · leilaolegends.com</p>
</body>`

const tmp = `/tmp/mock-form15-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
const alt = await p.evaluate(() => document.body.scrollHeight)
await b.close()
console.log(`${SAIDA} — 1080x${alt}`)
