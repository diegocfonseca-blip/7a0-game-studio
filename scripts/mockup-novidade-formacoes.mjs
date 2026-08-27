// ─── 📢 POST PROS USUÁRIOS: as formações novas + o campinho que cresceu ──────
// Material de DIVULGAÇÃO (27/08, pedido do Diego: "me mande as formações novas
// que entrarão no jogo pra eu mandar pros usuários, além do campinho que
// aumentou, que vai ser a próxima novidade do dia").
//
// 🤫 REGRA DE OURO: o mapa de maquiagem é SEGREDO DE PRODUÇÃO. Aqui não existe
// "maquiagem", "conta do motor" nem estilo de técnico — pro usuário são 10
// formações NOVAS, todas igualmente de verdade. E nada de técnico ainda (não
// foi anunciado): o post é só formações + campinho.
//
//   node scripts/mockup-novidade-formacoes.mjs [--saida novidade-formacoes.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'novidade-formacoes.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// bolinha pequena do campinho de divulgação (sem nome — é desenho de esquema)
const dot = (tag, rec = false) => `
  <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;
    border:2.5px solid ${INK};background:${tag === 'G' ? '#F3D34A' : tag === 'L' ? '#BFE3C7' : '#DBD1B5'};color:${INK};
    ${OSW};font-size:10.5px;flex:none;${rec ? 'transform:translateY(9px)' : ''}">${tag}</span>`
const linha = (dots) => `<div style="display:flex;justify-content:center;gap:7px;flex:none">${dots}</div>`
// campo PADRÃO: altura única + faixas fixas (gol/zaga/ataque sempre no lugar,
// só o miolo redistribui) — exatamente a regra que entrou no jogo.
const ALT = 236
const campo = (rotulo, faixas, nova = true) => `
  <div style="width:196px;flex:none">
    <p style="${OSW};font-size:13px;text-transform:uppercase;color:${INK};margin:0 0 5px;text-align:center">${nova ? '🆕 ' : ''}${rotulo}</p>
    <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 ${ALT / 10}px,#166332 ${ALT / 10}px ${ALT / 5}px);
      border:3px solid ${INK};border-radius:12px;padding:10px 3px 8px;box-shadow:3px 3px 0 ${INK};
      height:${ALT}px;display:flex;flex-direction:column">
      ${faixas.ataque}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">${faixas.meio}</div>
      <div style="margin-bottom:11px">${faixas.defesa}</div>
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
const LOS = M(1) + linha(dot('M') + `<span style="width:34px"></span>` + dot('M')) + M(1)

const F = {
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

// ── campinho ANTES × DEPOIS (a novidade do campo maior/padrão) ──
const antes = `
  <div style="width:196px;flex:none">
    <p style="${OSW};font-size:12px;text-transform:uppercase;color:rgba(0,0,0,.5);margin:0 0 5px;text-align:center">como ERA</p>
    <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 16px,#166332 16px 32px);border:3px solid ${INK};border-radius:12px;
      padding:10px 3px 8px;box-shadow:3px 3px 0 ${INK};height:160px;display:flex;flex-direction:column;justify-content:space-between">
      ${A(3)}${M(3)}${DEF4}${GOL}
    </div>
    <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 2px 0;line-height:1.4;text-align:center">campo apertado, tudo colado</p>
  </div>`
const depois = `
  <div style="width:196px;flex:none">
    <p style="${OSW};font-size:12px;text-transform:uppercase;color:${GREEN};margin:0 0 5px;text-align:center">como FICOU ✅</p>
    ${campo('', { ataque: A(3), meio: M(3), defesa: DEF4, gol: GOL }, false).replace(/<p[^>]*><\/p>/, '')}
    <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 2px 0;line-height:1.4;text-align:center">campo MAIOR, e do MESMO tamanho em toda formação — goleiro, zaga e ataque sempre no lugar</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};padding:34px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:6px 18px;${OSW};font-size:15px;letter-spacing:.08em">🎽 VEM AÍ: 10 FORMAÇÕES NOVAS! ⚽</div>
  <p style="font-size:14px;font-weight:700;max-width:1080px;line-height:1.55;margin:12px 0 6px">
    O Leilão Legends vai ganhar <b>10 formações novas</b> — de 5 pra <b>15 esquemas táticos</b>! Do 4-2-4 com quatro
    atacantes de verdade ao ônibus do 5-4-1, passando pelo losango, pela árvore de Natal e pelo líbero raiz. 🔥</p>
  <p style="font-size:12px;font-weight:700;color:#5a5647;max-width:1080px;line-height:1.5;margin:0 0 18px">
    E olha o detalhe: no 3-5-2 os ALAS são seus laterais de verdade, e no 5-3-2 líbero o zagueiro do meio fica de vigia atrás da linha. 👀</p>
  <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;max-width:1120px">
    ${Object.entries(F).map(([r, f]) => campo(r, f)).join('')}
  </div>
  <div style="margin-top:26px;display:inline-block;background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:14px 18px">
    <p style="${OSW};font-size:14px;text-transform:uppercase;margin:0 0 10px">🏟️ e o CAMPINHO CRESCEU</p>
    <div style="display:flex;gap:22px;align-items:flex-start">
      ${antes}
      ${depois}
    </div>
  </div>
  <p style="margin-top:18px;font-size:12px;font-weight:700;color:rgba(0,0,0,.55)">⚽ Leilão <span style="color:${RED};${OSW}">Legends</span> · leilaolegends.com</p>
</body>`

const tmp = `/tmp/mock-novidade-form-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
