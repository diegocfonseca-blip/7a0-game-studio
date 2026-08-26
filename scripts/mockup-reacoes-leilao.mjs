// 😏 MOCKUP — ARRUMAR AS REAÇÕES DO LEILÃO (25/08)
//
// Diego: *"esses emojis dos jogadores tô achando que tá demais… tá ruim
// vertical, sei lá. E os mascotes eu acho que só nos emojis onde tem contando
// moeda, lacra logo e etc"*.
//
// São DUAS barras diferentes no leilão de hoje, e ele falou de cada uma:
//   A) `CardReact` (screens.tsx) — botão 😏 ao lado de CADA carta. Abre um
//      popover VERTICAL com as 6 CANTADAS, cada uma numa linha com frase longa
//      ("TÔ NESSE, vou com TUDO!"). Numa leva de 6 jogadores isso é muito peso —
//      é o que ele está achando "demais".
//   B) "😈 CUTUCA QUEM TÁ PENSANDO" — fileira horizontal de pílulas (🐢 Anda ·
//      😴 Dormiu · 🔒 Lacra logo · 🧮 Conta moeda · 💸 Chora depois), que só
//      aparece DEPOIS que você lacrou. É aqui que ele quer a mascote.
//
// Este mockup mostra o de hoje e duas saídas pra (A), + a mascote entrando em (B).
//
//   node scripts/mockup-reacoes-leilao.mjs --saida reacoes.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'reacoes.png')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 14, sh = 3) => `background:${bg};border:2.5px solid ${INK};border-radius:${r}px;box-shadow:${sh}px ${sh}px 0 ${INK}`
const tit = (n, cor, t, s) => `
  <div style="margin:0 0 9px">
    <p style="${OSW};font-weight:700;font-size:17px;margin:0;text-transform:uppercase;line-height:1.15"><span style="color:${cor}">${n}</span> ${t}</p>
    <p style="font-size:11.5px;font-weight:700;margin:2px 0 0;line-height:1.3;color:rgba(0,0,0,.6)">${s}</p>
  </div>`
// carta do leilão (compacta, como na lista de setor)
const carta = (nome, clube, extra = '') => `
  <div style="${box('#fff', 12, 2)};padding:7px 9px;display:flex;align-items:center;gap:8px;margin-bottom:7px">
    <span style="width:30px;height:30px;flex:none;border-radius:50%;background:linear-gradient(150deg,#FFE79A,#E8A200);border:2px solid ${INK};${OSW};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center">${nome[0]}</span>
    <span style="flex:1;min-width:0"><b style="display:block;${OSW};font-weight:700;font-size:14px;line-height:1.05">${nome}</b>
    <b style="display:block;font-size:9.5px;font-weight:800;opacity:.5">${clube}</b></span>
    ${extra}
  </div>`
const pill = (e, t, novo) => `<span style="${box(novo ? '#EAF0FB' : '#fff', 999, 2)};${novo ? `border-color:${PURPLE};` : ''}padding:4px 11px;font-size:11.5px;font-weight:900;${OSW};display:inline-flex;align-items:center;gap:5px;white-space:nowrap">${e} ${t}</span>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:412px;padding:16px 14px 22px}
</style></head><body>

<div style="text-align:center;margin-bottom:14px">
  <span style="display:inline-block;${box(GOLD, 999, 3)};padding:5px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1.1px;text-transform:uppercase">😏 Mockup · reações do leilão</span>
</div>

<!-- ───────── HOJE ───────── -->
${tit('HOJE', RED, '· menu vertical por carta', 'Um botão 😏 em cada carta. Abre 6 linhas com frase. Em 6 jogadores, vira paredão.')}
<div style="${box('#fff', 14, 3)};padding:10px;margin-bottom:8px;position:relative">
  ${carta('Romário', 'Vasco · 2000', `<span style="${box('#fff', 9, 2)};width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">😏</span>`)}
  <div style="${box('#fff', 10, 2)};width:196px;padding:6px;margin:-4px 0 0 auto;position:relative;z-index:2">
    ${[['😈', 'TÔ NESSE, vou com TUDO!'], ['💸', 'esse vai ficar CARO…'], ['❤️', 'meu ÍDOLO — não perco'], ['🪙', 'relaxa, 1 moedinha leva'], ['🥱', 'nem quero…'], ['🤣', '']]
      .map(([e, t]) => `<div style="display:flex;align-items:center;gap:6px;border:1px solid rgba(0,0,0,.15);border-radius:6px;padding:3px 5px;margin-bottom:3px">
        <span style="font-size:15px">${e}</span><b style="font-size:9.5px;${OSW};font-weight:700;line-height:1.1">${t}</b></div>`).join('')}
    <p style="font-size:8px;font-weight:700;opacity:.4;text-align:center;margin:1px 0 0">a sala toda vê… mas pode ser blefe 😏</p>
  </div>
  ${carta('Zico', 'Flamengo · 1981', `<span style="${box('#fff', 9, 2)};width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">😏</span>`)}
</div>
<p style="font-size:11px;font-weight:800;color:${RED};margin:0 0 20px">👆 é este bloco que fica comprido e tapa as cartas de baixo.</p>

<!-- ───────── OPÇÃO A ───────── -->
${tit('OPÇÃO A', GREEN, '· vira fileira, e só 3 cantadas', 'Mesmo botão 😏 na carta, mas abre DEITADO e enxuto. A frase só aparece quando você manda.')}
<div style="${box('#fff', 14, 3)};padding:10px;margin-bottom:8px">
  ${carta('Romário', 'Vasco · 2000', `<span style="${box(GOLD, 9, 2)};width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">😏</span>`)}
  <div style="${box('#FBF6E9', 10, 2)};padding:6px 7px;margin:-3px 0 7px;display:flex;gap:6px;justify-content:center">
    ${[['😈', 'TÔ NESSE'], ['💸', 'VAI FICAR CARO'], ['🪙', '1 MOEDINHA']]
      .map(([e, t]) => `<span style="${box('#fff', 8, 2)};padding:4px 7px;text-align:center;flex:1">
        <b style="display:block;font-size:16px;line-height:1">${e}</b>
        <b style="display:block;font-size:7.5px;${OSW};font-weight:700;margin-top:1px;letter-spacing:.2px">${t}</b></span>`).join('')}
  </div>
  ${carta('Zico', 'Flamengo · 1981', `<span style="${box('#fff', 9, 2)};width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">😏</span>`)}
  ${carta('Bebeto', 'Vasco · 1989', `<span style="${box('#fff', 9, 2)};width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">😏</span>`)}
</div>
<p style="font-size:11px;font-weight:800;color:rgba(0,0,0,.6);margin:0 0 20px">Ocupa <b>uma linha</b> em vez de sete. As outras 3 cantadas (❤️ 🥱 🤣) viram a barra de baixo.</p>

<!-- ───────── OPÇÃO B ───────── -->
${tit('OPÇÃO B', PURPLE, '· tira o botão das cartas', 'Nenhum 😏 nas cartas. Uma barra só, embaixo: escolhe a cantada e ela gruda na carta que você tocou por último.')}
<div style="${box('#fff', 14, 3)};padding:10px;margin-bottom:8px">
  ${carta('Romário', 'Vasco · 2000', `<span style="${OSW};font-weight:700;font-size:10px;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:2px 8px">mirando</span>`)}
  ${carta('Zico', 'Flamengo · 1981')}
  ${carta('Bebeto', 'Vasco · 1989')}
  <div style="${box('#FBF6E9', 10, 2)};padding:7px 8px;margin-top:2px">
    <p style="font-size:9px;font-weight:800;opacity:.5;margin:0 0 5px;${OSW};letter-spacing:.8px">CANTADA PRO <b style="color:${INK}">ROMÁRIO</b></p>
    <div style="display:flex;gap:5px;flex-wrap:wrap">
      ${['😈', '💸', '❤️', '🪙', '🥱', '🤣'].map(e => `<span style="${box('#fff', 8, 2)};width:38px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px">${e}</span>`).join('')}
    </div>
  </div>
</div>
<p style="font-size:11px;font-weight:800;color:rgba(0,0,0,.6);margin:0 0 22px">A lista de cartas fica <b>limpa</b>. Mas some o "reagir bem naquela carta" — precisa mirar antes.</p>

<!-- ───────── A MASCOTE ───────── -->
${tit('E A MASCOTE', PURPLE, '· só nesta barra, como você falou', 'A do "conta moeda / lacra logo", que só aparece depois que VOCÊ lacrou. Ela é sobre você, não sobre a carta.')}
<div style="${box('#fff', 14, 3)};padding:11px">
  <p style="font-size:10.5px;font-weight:900;color:rgba(0,0,0,.45);margin:0 0 7px;${OSW}">😈 CUTUCA QUEM TÁ PENSANDO</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
    ${[['🐢', 'Anda!'], ['😴', 'Dormiu?'], ['🔒', 'Lacra logo!'], ['🧮', 'Conta moeda?'], ['💸', 'Chora depois!']].map(([e, t]) => pill(e, t)).join('')}
  </div>
  <div style="display:flex;align-items:center;gap:9px;${box('#EAF0FB', 11, 2)};padding:7px 9px;border-color:${PURPLE}">
    <img src="${img('leao-estradinha-mascote.webp')}" style="height:38px" />
    <span style="flex:1"><b style="display:block;${OSW};font-weight:700;font-size:13px">🦁 SOLTA A SUA MASCOTE</b>
    <b style="display:block;font-size:10.5px;font-weight:700;opacity:.6">só quem tem clube batizado</b></span>
    <span style="${OSW};font-weight:700;font-size:9px;background:${PURPLE};color:#fff;border:2px solid ${INK};border-radius:999px;padding:2px 8px">NOVO</span>
  </div>
</div>

<div style="${box('#FBF6E9', 14, 3)};padding:11px 13px;margin-top:14px">
  <p style="${OSW};font-weight:700;font-size:12.5px;margin:0 0 5px;text-transform:uppercase">Por que a mascote é aqui e não na carta</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.45;margin:0;color:rgba(0,0,0,.72)">
    A cantada da carta é sobre <b>o jogador</b> ("tô nesse"). A barra de baixo é sobre <b>você cutucando a galera</b> — e a mascote é <b>a sua cara</b>.
    É o lugar certo. E, como essa barra só abre <b>depois que você lacrou</b>, a mascote nunca atrapalha ninguém decidindo o lance.</p>
</div>

<p style="margin:16px 0 0;${OSW};font-weight:700;font-size:12.5px;text-align:center;opacity:.5">⚽ Leilão Legends · mockup, não está no ar</p>
</body></html>`

const tmp = `/tmp/reacoes-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
