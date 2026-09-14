// ─── 🧹 MOCKUP: aba ELENCO enxuta (antes × depois) ────────────────────────────
// Pedido do Diego (14/09), com print: *"tô achando que tá com MUITA informação
// desnecessária… não era pra contar o segredo de −1 −2 do cansaço… gols não
// entrando dentro do elenco porque tá cheio na listagem"*.
//
// Três consertos, desenhados com o elenco REAL dele (Neymarzetti, T16, Série D):
//   1. PREPARADOR sem número: só emoji + nome. O modificador (−1/−2/−3) e a
//      chance de lesão viram segredo do motor, igual o overall.
//   2. CARTA enxuta: gols/assistências/jogos numa linha DENTRO da carta (hoje
//      são balões flutuando por cima da borda). Valor e salário saem da lista e
//      ficam só no toque (a ficha do jogador já mostra isso).
//   3. TOPO compacto: formação e substituições em UMA faixa cada, sem parágrafo.
//      O texto explicativo longo do preparador vira um "?" que abre se quiser.
//
//   node scripts/mockup-elenco-enxuto.mjs [--saida elenco-enxuto.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'elenco-enxuto.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', VERM = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── o elenco do print (14/09) ──
const T = [ // titulares
  { pos: 'GOL', n: 'Pedro Gallese', c: 'Orlando City · 2022', b: '70–82', g: 40, gols: 0, a: 0, j: 54, ct: '6 anos', v: 6, s: 1 },
  { pos: 'LAT', n: 'Bernabei', c: 'Internacional · 2025', b: '66–80', g: 22, gols: 1, a: 1, j: 65, ct: '3 anos', v: 12, s: 1 },
  { pos: 'LAT', n: 'Santiago Arias', c: 'PSV · 2018', b: '66–81', g: 41, gols: 2, a: 1, j: 62, ct: '4 anos', v: 25, s: 3 },
  { pos: 'ZAG', n: 'Durval', c: 'Santos · 2013', b: '56–78', g: 40, gols: 1, a: 2, j: 54, ct: '4 anos', v: 5, s: 1 },
  { pos: 'MEI', n: 'Petit', c: 'Arsenal · 1998', b: '78–85', g: 54, gols: 4, a: 9, j: 60, ct: 'último ano', v: 15, s: 2 },
  { pos: 'ATA', n: 'Julián Álvarez', c: 'Atlético de Madrid · 2025', b: '82–89', g: 40, gols: 12, a: 2, j: 54, ct: '5 anos', v: 60, s: 6 },
]
const R = [ // reservas
  { pos: 'GOL', n: 'Fabien Barthez', c: 'Man United · 2000', b: '78–86', g: 100, gols: 0, a: 0, j: 11, ct: '2 anos', v: 27, s: 3 },
  { pos: 'MEI', n: 'Pintinho', c: 'Sub-20 · 2026', b: '48–58', g: 100, gols: 0, a: 3, j: 8, ct: 'sem contrato', cria: true, v: 0, s: 0 },
]
const corGas = g => g >= 50 ? GREEN : g >= 30 ? '#D9A000' : VERM
const barra = (g) => `<span style="display:inline-block;width:56px;height:7px;border:1.5px solid ${INK};border-radius:4px;background:#F1EBDD;vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${g}%;background:${corGas(g)}"></span></span>`

// ── carta ANTES: balões de gol/assist flutuando por cima, valor/salário/jogos
//    espremidos à direita (o que o print mostra)
const cartaAntes = p => `
  <div style="position:relative;background:#fff;border:2px solid ${INK};border-radius:9px;padding:7px 8px 6px;margin-bottom:6px;overflow:visible">
    ${p.gols ? `<span style="position:absolute;top:-9px;right:52px;font-size:10px;font-weight:900">⚽ ${p.gols}</span>` : ''}
    ${p.a ? `<span style="position:absolute;top:2px;right:8px;font-size:9px;font-weight:900;background:${VERM};color:#fff;border-radius:3px;padding:0 3px">A</span><span style="position:absolute;top:1px;right:1px;font-size:10px;font-weight:900">${p.a}</span>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div><span style="${OSW};font-size:8px;color:${GOLD};margin-right:4px">${p.pos}</span><span style="${OSW};font-size:12.5px">${p.n}</span></div>
        <div style="font-size:9px;font-weight:700;color:rgba(0,0,0,.55);margin-top:1px">${p.c} <span style="border:1.5px solid ${INK};border-radius:6px;padding:0 5px;background:${p.cria ? '#E9E3D2' : '#DDF3E4'};font-weight:900;color:${INK}">${p.b}</span></div>
        <div style="margin-top:4px">${barra(p.g)} <span style="font-size:9px;font-weight:900;color:${corGas(p.g)}">${p.g}%</span></div>
      </div>
      <div style="text-align:right;font-size:9px;font-weight:800;color:rgba(0,0,0,.6);line-height:1.35;min-width:70px;padding-top:12px">
        <div>💰 ${p.v} <span style="background:#FDE4E1;border-radius:3px;padding:0 3px">💵 ${p.s}</span></div>
        <div>📝 ${p.ct}</div>
        <div style="margin-right:-14px;white-space:nowrap">🏃 ${p.j} jogos</div>
      </div>
    </div>
  </div>`

// ── carta DEPOIS: 3 linhas limpas, tudo DENTRO da borda
const cartaDepois = p => `
  <div style="background:#fff;border:2px solid ${INK};border-radius:9px;padding:6px 8px;margin-bottom:6px">
    <div style="display:flex;align-items:baseline;gap:5px">
      <span style="${OSW};font-size:8px;color:${GOLD}">${p.pos}</span>
      <span style="${OSW};font-size:12.5px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.n}${p.cria ? ' 🌱' : ''}</span>
      <span style="border:1.5px solid ${INK};border-radius:6px;padding:0 5px;background:${p.cria ? '#E9E3D2' : '#DDF3E4'};font-size:9px;font-weight:900">${p.b}</span>
    </div>
    <div style="font-size:9px;font-weight:700;color:rgba(0,0,0,.55);margin-top:1px">${p.c}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:9px;font-weight:800;color:rgba(0,0,0,.6)">
      ${barra(p.g)}
      <span style="flex:1"></span>
      <span>⚽ ${p.gols} · 🅰 ${p.a} · ${p.j} j</span>
      <span style="color:rgba(0,0,0,.4)">·</span>
      <span style="${p.ct === 'último ano' ? 'color:' + VERM : ''}">📝 ${p.ct}</span>
    </div>
  </div>`

const caixa = (h) => `<div style="background:#fff;border:2.5px solid ${INK};border-radius:11px;box-shadow:2px 2px 0 ${INK};padding:8px 10px;margin-bottom:8px">${h}</div>`
const pill = (t, on) => `<span style="display:inline-block;${OSW};font-size:10px;border:2px solid ${INK};border-radius:8px;padding:3px 9px;margin-right:5px;background:${on ? INK : '#fff'};color:${on ? GOLD : INK}">${t}</span>`

const ANTES = `
  ${caixa(`<div style="${OSW};font-size:11px;margin-bottom:5px">📐 Formação do técnico</div>
    <div style="margin-bottom:5px">${pill('4-3-3 ✓', true)}${pill('3-4-3')}${pill('4-2-3-1')}</div>
    <p style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.6);margin:0 0 3px">🧳 O 4-3-3 não é do Fernando Diniz — é herança do técnico anterior: o time já jogava assim quando ele chegou, e continuou no cardápio.</p>
    <p style="font-size:8.5px;font-weight:700;color:${GREEN};margin:0">✅ Você pode trocar de formação quando quiser — vale do próximo jogo.</p>`)}
  ${caixa(`<div style="${OSW};font-size:11px;margin-bottom:5px">🔁 Substituições</div>
    <div style="display:flex;gap:6px"><div style="flex:1;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:5px 7px;font-size:9px;font-weight:800"><b>🔄 Dinâmico ✓</b><br>troca quando quiser · vale pro próximo jogo</div><div style="flex:1;border:2px solid ${INK};border-radius:8px;padding:5px 7px;font-size:9px;font-weight:800"><b>⏸ Só no intervalo</b><br>o jogo pausa aos 45' pra trocar</div></div>`)}
  ${caixa(`<div style="${OSW};font-size:11px">🔁 Faça suas trocas aqui: toque num jogador e depois no outro.</div><div style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.6)">Vale do próximo jogo em diante.</div>`)}
  ${caixa(`<div style="${OSW};font-size:10px;color:rgba(0,0,0,.6);letter-spacing:1px">🧑‍⚕️ PREPARADOR FÍSICO</div>
    <p style="font-size:9.5px;font-weight:700;margin:4px 0 6px;line-height:1.45"><b>Bernabei, Malcom, Matheus Cunha</b> estão <b style="color:${VERM}">esgotados</b> (🚑) — <b style="background:#FFE0E0">−3 e o triplo de risco de lesão</b>. <b>Ralf</b> está <b style="color:${VERM}">no limite</b> (🥵) — <b style="background:#FFE0E0">joga com −2 e o risco de lesão dobra</b>. <b>Durval, Julián Álvarez</b> estão <b style="color:#B8860B">cansados</b> (😓) — <b style="background:#FFE0E0">−1 no próximo jogo</b>.</p>
    <div style="background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:6px;${OSW};font-size:10px;margin-bottom:5px">🔁 RODIZIAR — Borges no lugar de Malcom</div>
    <div style="border:2px solid ${INK};border-radius:8px;padding:6px;${OSW};font-size:10px;margin-bottom:6px">🔁 LIGAR RODÍZIO AUTOMÁTICO<div style="font-family:system-ui;font-weight:700;font-size:8.5px;text-transform:none">deixa o preparador trocar sozinho, sem você ter que mexer toda rodada</div></div>
    <p style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.6);margin:0;line-height:1.4">Sem reserva inteiro pra toda vaga — quem fica joga cansado, e se alguém se machucar quem veste a camisa é um Cria da Base: ele é um moleque, bem mais fraco que o seu elenco. Monte um banco de verdade no leilão de transferências. Titular perde gás a cada jogo · o banco devolve a cada rodada · vale do próximo jogo · o jogo nunca troca por você.</p>`)}
  <div style="${OSW};font-size:11px;margin:4px 0 5px">⭐ TITULARES (11)</div>
  ${T.slice(0, 4).map(cartaAntes).join('')}
  <div style="${OSW};font-size:11px;margin:8px 0 5px">🔁 RESERVAS (4)</div>
  ${R.map(cartaAntes).join('')}`

const DEPOIS = `
  ${caixa(`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="${OSW};font-size:10px;color:rgba(0,0,0,.6)">📐 FORMAÇÃO</span>${pill('4-3-3 ✓', true)}${pill('3-4-3')}${pill('4-2-3-1')}
      <span style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5)">vale do próximo jogo</span></div>`)}
  ${caixa(`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="${OSW};font-size:10px;color:rgba(0,0,0,.6)">🔁 TROCAS</span>${pill('🔄 Dinâmico ✓', true)}${pill('⏸ Só no intervalo')}
      <span style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5)">toque num jogador, depois no outro</span></div>`)}
  ${caixa(`<div style="display:flex;align-items:center;gap:6px">
      <span style="${OSW};font-size:10px;color:rgba(0,0,0,.6)">🧑‍⚕️ PREPARADOR</span>
      <span style="flex:1"></span>
      <span style="font-size:11px;border:1.5px solid ${INK};border-radius:999px;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-weight:900">?</span></div>
    <p style="font-size:10px;font-weight:800;margin:5px 0 7px;line-height:1.5">
      🚑 <b>Bernabei · Malcom · Matheus Cunha</b> &nbsp; 🥵 <b>Ralf</b> &nbsp; 😓 <b>Durval · Julián Álvarez</b></p>
    <div style="display:flex;gap:6px">
      <div style="flex:1.4;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:6px 7px;${OSW};font-size:10px">🔁 RODIZIAR <span style="font-family:system-ui;font-weight:700;font-size:8.5px;text-transform:none;opacity:.9">Borges no lugar de Malcom</span></div>
      <div style="flex:1;border:2px solid ${INK};border-radius:8px;padding:6px 7px;${OSW};font-size:10px;text-align:center">🤖 AUTOMÁTICO<div style="font-family:system-ui;font-weight:700;font-size:8px;text-transform:none;color:rgba(0,0,0,.55)">desligado</div></div>
    </div>`)}
  <div style="${OSW};font-size:11px;margin:4px 0 5px">⭐ TITULARES (11)</div>
  ${T.slice(0, 4).map(cartaDepois).join('')}
  <div style="${OSW};font-size:11px;margin:8px 0 5px">🔁 RESERVAS (4)</div>
  ${R.map(cartaDepois).join('')}`

const tela = (titulo, corpo, legenda) => `
  <div style="width:400px;flex:none">
    <div style="${OSW};font-size:17px;text-transform:uppercase;text-align:center;margin-bottom:8px">${titulo}</div>
    <div style="background:#F4ECD6;border:4px solid ${INK};border-radius:20px;box-shadow:5px 6px 0 ${INK};padding:12px 11px;min-height:900px">
      <div style="background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:8px 10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="${OSW};font-size:13px">👥 Neymarzetti 👑</span><span style="${OSW};font-size:12px;background:#fff;border:2px solid ${INK};border-radius:7px;padding:1px 7px">22/22</span></div>
      ${corpo}
    </div>
    <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:10px 6px 0;text-align:center;color:rgba(0,0,0,.72)">${legenda}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE7D2;color:${INK};font-family:system-ui,-apple-system,sans-serif;width:900px;padding:28px 24px}
</style></head><body>
  <div style="text-align:center;margin-bottom:20px">
    <div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;box-shadow:4px 4px 0 ${INK};padding:7px 22px;${OSW};font-size:16px;text-transform:uppercase;letter-spacing:1px">🧹 aba Elenco, enxuta</div>
    <p style="font-size:13.5px;font-weight:600;margin:10px auto 0;max-width:780px;line-height:1.45">Mesmo elenco do seu print. Esquerda: como está. Direita: a proposta. <b>Nenhuma regra muda</b> — só o que aparece.</p>
  </div>
  <div style="display:flex;gap:26px;justify-content:center;align-items:flex-start">
    ${tela('Antes', ANTES, 'Três parágrafos antes da lista · o preparador entrega o <b>−1/−2/−3</b> · gols e assistências <b>flutuam por cima da borda</b> e o "jogos" vaza pra fora da carta.')}
    ${tela('Depois', DEPOIS, 'Formação e trocas em <b>uma linha cada</b> · preparador só com <b>emoji + nome</b> (o número vira segredo) · gols/assist/jogos <b>dentro da carta</b> · valor e salário só no toque.')}
  </div>
</body></html>`

const tmp = `/tmp/mock-elenco-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
