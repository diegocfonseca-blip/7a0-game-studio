#!/usr/bin/env node
// ─── ⭐ MOCKUP: CHAMPIONS LEGENDS no formato REAL de hoje ────────────────────
//
// Pedido do Diego (21/09): *"quero formato real de hoje, como seria"* e, logo
// depois, *"manda.. principalmente da parte q os 8 primeiros tem q ficar
// aguardando tb o mata mata da repescagem sei lá"*.
//
// Ele pôs o dedo no ponto certo: no formato novo da Champions (2024+) NÃO tem
// grupo — é uma TABELA ÚNICA de 36, cada clube joga 8 adversários diferentes, e
// no fim 1º-8º vão direto pras oitavas, 9º-24º jogam um repescão de ida e volta,
// 25º-36º caem fora. Ou seja: quem termina no TOP 8 fica parado uma fase inteira
// esperando saber quem sobe. Isso bate de frente com a regra de ouro dele
// (*"nada pode atrasar o ritmo do jogo"*), então o mockup mostra as DUAS telas:
//   ① a tabela de 36 INTEIRA, com as linhas de corte coloridas
//   ② a tela da espera — e as três saídas possíveis pra ela
//
// A Oswald vem de `scripts/fonts/` (fora do bundle do jogo — só roda aqui).
//
// Rodar:  node scripts/mockup-champions.mjs /tmp/champions.png

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTS = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// identidade do jogo (CLAUDE.md — não inventar cor nova)
const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'
const ESTRELA = '#1B3FA0' // ⭐ a cor da Champions na família (🟢 Copa · 🔵 Supercopa · 🟣 Copa dos 8 · 🌑 Liberta)

// ── a tabela: 8 do usuário/liga + 28 europeus de paródia ────────────────────
// 36 = os 8 da SUA liga (🔨) + 28 europeus de paródia. Os nomes são rascunho —
// o Diego aprova a zoeira antes de virar código.
const TABELA = [
  ['Baião de Munique', 21], ['Real Madrix', 19], ['Manchester Unaited', 18],
  ['Livrapul', 17], ['Pariz São Germano', 16], ['Interlagos de Milão', 15],
  ['Arsenau', 14], ['Borussia Dortmundo', 14],
  ['Ajax de Limpeza 🧽', 13], ['Atlético da Madri', 13], ['Juve Tudo Nosso', 12],
  ['NEYMARZETTI', 11, 'liga', 'eu'], ['Xelsi', 11], ['Benfeita', 10],
  ['Napolitano', 10], ['Porto Seguro', 9], ['Milão de Queijo', 9],
  ['Bayer Leve o Cuzco', 8], ['Cajuri Raiva', 8, 'liga'], ['Sportingo', 7],
  ['Roma Tomate', 7], ['Rei da Bola FC', 7, 'liga'], ['Feyenordeste', 6],
  ['Cluba Bruges', 6], ['Stocco FC', 5, 'liga'], ['Galata Saraiva', 5],
  ['Céltico', 5], ['Futpoint FC', 4, 'liga'], ['Xaktar', 4],
  ['Olimpiacos', 4], ['Pantera Negra FC', 3, 'liga'], ['Estrela Vermelhinha', 3],
  ['Slávia da Praga', 2], ['Al Takhadao FC', 2, 'liga'], ['Jovem Menino de Berna', 1],
  ['Marreco FC', 0, 'liga'],
]

function linha(i) {
  const [nome, pts, origem, eu] = TABELA[i]
  const pos = i + 1
  const zona = pos <= 8 ? VERDE : pos <= 24 ? GOLD : '#9A9384'
  const fundo = eu ? '#FFF6D6' : pos <= 8 ? '#EAF6EE' : pos <= 24 ? '#FFFBEA' : '#F2EFE6'
  return `<div class="row" style="background:${fundo};${eu ? `outline:3px solid ${INK};outline-offset:-3px` : ''}">
    <span class="pos" style="background:${zona};color:#fff">${pos}</span>
    <span class="nome" style="${eu ? 'font-weight:700' : ''}">${nome}${origem === 'liga' ? '<b class="daliga">🔨</b>' : ''}</span>
    <span class="pts">${pts}</span>
  </div>`
}

// 🔨 A TABELA INTEIRA, os 36 (Diego 21/09: *"pq n cabe a tabela toda? queria ela
// toda poow"*). E ele está certo: a tabela da liga já mostra 20 e ninguém reclama
// de rolar. O que não pode é paredão SEM leitura — por isso as três faixas de
// corte ficam FIXAS no meio da lista, dizendo o que cada zona significa.
const tudo = [
  `<div class="faixa" style="background:${VERDE}">🟢 1º ao 8º · VÃO DIRETO PRAS OITAVAS</div>`,
  ...Array.from({ length: 8 }, (_, i) => linha(i)),
  `<div class="faixa" style="background:${GOLD};color:${INK}">🟡 9º ao 24º · JOGAM O REPESCÃO (ida e volta)</div>`,
  ...Array.from({ length: 16 }, (_, i) => linha(i + 8)),
  `<div class="faixa" style="background:#9A9384">⚪ 25º ao 36º · ESTÃO FORA</div>`,
  ...Array.from({ length: 12 }, (_, i) => linha(i + 24)),
].join('')

const telaTabela = `
<div class="fone">
  <div class="top" style="background:${ESTRELA}">
    <div class="topL">⭐ CHAMPIONS LEGENDS</div>
    <div class="topR">RODADA 8 DE 8 · última</div>
  </div>
  <div class="sub">36 clubes, uma tabela só. Cada um joga <b>8 adversários diferentes</b>.</div>
  ${tudo}
  <div class="rodape">🔨 = veio da SUA liga (os 8 primeiros) · os outros 28 são do continente</div>
</div>`

// ── ② a tela da espera (a parte que o Diego cobrou) ─────────────────────────
const telaEspera = `
<div class="fone">
  <div class="top" style="background:${ESTRELA}">
    <div class="topL">⭐ CHAMPIONS LEGENDS</div>
    <div class="topR">REPESCÃO · ida</div>
  </div>
  <div class="selo">🟢 VOCÊ TERMINOU EM <b>6º</b> — JÁ ESTÁ NAS OITAVAS</div>
  <div class="espera">
    <div class="esperaT">Agora rola o <b>repescão</b>: 16 clubes brigam por 8 vagas.<br>Você não joga essa fase — está esperando saber quem te pega.</div>
  </div>
  <div class="jogos">
    ${[['Ajax de Limpeza 🧽', 'Esparta', '2', '0'], ['Atlético da Madri', 'Céltico', '1', '1'], ['Juve Tudo Nosso', 'Galata Saraiva', '3', '1'], ['Xelsi', 'Cluba Bruges', '0', '2']].map(([a, b, ga, gb]) =>
      `<div class="jogo"><span class="t">${a}</span><span class="pl">${ga} × ${gb}</span><span class="t r">${b}</span></div>`).join('')}
    <div class="corte" style="margin:4px 0">⋯ mais 4 jogos ⋯</div>
  </div>
  <div class="btn">▶️ PASSAR PRO PRÓXIMO JOGO</div>
  <div class="btnG">⏩ PULAR PRO SORTEIO DAS OITAVAS</div>
  <div class="dica">o repescão inteiro roda em ~20s · você pode assistir ou pular</div>
</div>`

const nota = (t, txt, cor) => `<div class="nota" style="border-color:${cor}"><div class="nt" style="color:${cor}">${t}</div>${txt}</div>`

const notas = [
  nota('⚠️ O PROBLEMA QUE VOCÊ APONTOU', `Terminar no <b>top 8</b> é o prêmio — mas no formato real ele vem com uma fase de
    <b>espera</b>: os 16 do meio jogam ida e volta e você fica olhando. Na Liberta isso não existe, porque lá todo mundo
    que passa joga as oitavas direto.`, VERM),
  nota('✅ COMO EU RESOLVERIA', `Três coisas, todas do jeito que o jogo já faz:<br>
    <b>1.</b> O repescão inteiro é <b>simulado corrido</b> (~20s), não jogo a jogo obrigatório.<br>
    <b>2.</b> Botão <b>⏩ PULAR PRO SORTEIO</b> desde o primeiro segundo — quem não quiser ver, não vê.<br>
    <b>3.</b> A espera vira <b>prêmio</b>, não castigo: a tela diz "você já está dentro" e mostra quem pode te pegar.`, VERDE),
  nota('🤔 A PERGUNTA HONESTA', `Vale a pena? O formato real é mais interessante (dá pra estar em 10º e brigar pra pular
    o repescão), mas ele <b>alonga</b> a competição: 8 rodadas + repescão + oitavas + quartas + semi + final.
    A Liberta tem 6 rodadas e já emenda nas oitavas.`, INK),
  nota('🎨 A TABELA INTEIRA, COMO VOCÊ PEDIU', `Os <b>36 na tela</b>, rolando — igual à tabela da liga, que já mostra 20.
    O que segura a leitura são as <b>três faixas de corte</b> no meio da lista (elas ficam grudadas no topo enquanto você
    rola) e o <b>🔨</b> marcando quem veio da sua liga. Seu clube fica com a borda preta, pra achar de primeira.`, ESTRELA),
]

const css = `${FONTS}
*{box-sizing:border-box}
body{margin:0;background:#EFE9DA;font-family:Oswald,sans-serif;color:${INK};padding:22px}
.wrap{display:flex;gap:22px;align-items:flex-start;max-width:1180px;margin:0 auto}
.col{flex:0 0 auto}
.col.larga{flex:1}
h1{font-size:15px;font-weight:700;text-transform:uppercase;margin:0 0 10px;letter-spacing:.4px}
h1 span{display:block;font-size:11px;font-weight:500;text-transform:none;opacity:.55;letter-spacing:0}
.fone{width:330px;background:${CREME};border:4px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;color:#fff}
.topL{font-size:13px;font-weight:700;letter-spacing:.4px}
.topR{font-size:9.5px;font-weight:600;opacity:.85;text-transform:uppercase}
.sub{font-size:10.5px;font-weight:500;padding:8px 11px;color:#4a4638;line-height:1.45;border-bottom:2px solid rgba(0,0,0,.1)}
.faixa{font-size:9px;font-weight:700;color:#fff;padding:4px 10px;text-transform:uppercase;letter-spacing:.3px}
.row{display:flex;align-items:center;gap:7px;padding:3px 10px;border-bottom:1px solid rgba(0,0,0,.06)}
.pos{flex:0 0 20px;text-align:center;font-size:10px;font-weight:700;border-radius:5px;padding:1px 0}
.nome{flex:1;font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pts{font-size:11.5px;font-weight:700;flex:0 0 22px;text-align:right}
.corte{text-align:center;font-size:9.5px;font-weight:600;color:#8c866f;padding:3px 0;background:#EDE7D6}
.rodape{text-align:center;font-size:9px;font-weight:600;padding:7px 9px;background:#fff;border-top:3px solid ${INK};color:#5a5546;line-height:1.4}\n.daliga{font-size:9px;margin-left:4px;opacity:.75}
.selo{background:${VERDE};color:#fff;font-size:11.5px;font-weight:600;padding:8px 11px;text-align:center}
.espera{padding:12px 11px;background:#fff;border-bottom:2px solid rgba(0,0,0,.1)}
.esperaT{font-size:11.5px;font-weight:500;line-height:1.5;color:#3d3a30}
.jogos{padding:8px 9px}
.jogo{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid ${INK};border-radius:9px;padding:5px 8px;margin-bottom:5px}
.jogo .t{flex:1;font-size:10.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jogo .t.r{text-align:right}
.jogo .pl{font-size:12px;font-weight:700;flex:0 0 auto;background:${ESTRELA};color:#fff;border-radius:6px;padding:1px 7px}
.btn{margin:2px 9px 6px;text-align:center;background:${GOLD};border:3px solid ${INK};border-radius:11px;padding:9px;font-size:12.5px;font-weight:700;box-shadow:3px 3px 0 ${INK}}
.btnG{margin:0 9px 6px;text-align:center;background:#fff;border:3px solid ${INK};border-radius:11px;padding:9px;font-size:12.5px;font-weight:700;box-shadow:3px 3px 0 ${INK}}
.dica{text-align:center;font-size:9.5px;font-weight:500;color:#6e6959;padding:0 11px 11px;line-height:1.4}
.nota{background:#fff;border:3px solid;border-radius:13px;padding:11px 13px;margin-bottom:11px;font-size:12px;font-weight:500;line-height:1.55;color:#3d3a30}
.nt{font-size:12.5px;font-weight:700;text-transform:uppercase;margin-bottom:5px;letter-spacing:.3px}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<div class="col"><h1>① A tabela de 36 INTEIRA<span>sem grupo, sem janela — os 36 na tela, rolando</span></h1>${telaTabela}</div>
<div class="col"><h1>② A espera do top 8<span>o ponto que você levantou</span></h1>${telaEspera}</div>
<div class="col larga"><h1>O que pensar antes<span>formato real × ritmo do jogo</span></h1>${notas.join('')}</div>
</div></body></html>`

const out = process.argv[2] ?? 'mockup-champions.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-champions.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
