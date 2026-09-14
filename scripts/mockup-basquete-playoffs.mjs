// 🖼️ MOCKUP — BidLegends: a TABELA POR CONFERÊNCIA e os PLAYOFFS de basquete
// (top 8 de cada lado, toda série melhor de 3). Pedido do Diego 14/09: *"comece a
// fazer o basquete tudo que falta… igual ao futebol, porém basquete suas regras"*.
//
// Não é desenho à mão: a tabela e o chaveamento saem do MOTOR DE VERDADE — monta
// uma sala de basquete pelo reducer, semeia os playoffs com `seedQuickCopa` e roda
// `PLAY_COPA_LEG` até sair o campeão. O que aparece aqui é o que o jogo faz.
//
// Rodar: npx tsx scripts/mockup-basquete-playoffs.mjs
//   → /tmp/mockup-basquete-playoffs.png
import { chromium } from 'playwright-core'
import { reducer, sortedTable, __seedQuickCopa as seedCopa } from '../src/escalacao/store.tsx'
import { basketClockLabel, MATCH_TICKS } from '../src/escalacao/sportcfg.ts'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE_ZONA = '#D8F0DE'
const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// ─── 1. uma sala de basquete de verdade (20 franquias + o time do Diego) ───
const base = { managers: [], stock: {}, deck: {}, screen: 'lobby', seasonVotes: {}, tactics: {} }
let s = reducer(base, {
  type: 'START_ONLINE', sport: 'basquete', roomId: 'r1', roomCode: 'MOCKUP', isHost: true,
  playerIndex: 0, playerNames: ['Diego'], formation: '4-3-3',
})

// ─── 2. temporada regular de 82 jogos (campanhas sorteadas, não uma escadinha) ───
// 30 franquias = 15 por conferência: é a NBA de verdade, o andar de cima da carreira,
// onde vale o top 8. (A sala ONLINE arma 20 times = 10 por lado e usa top 4 — mesma
// tela, só muda o número, e ele sai da mesma régua.)
const FRANQUIAS = [
  'Lakers', 'Celtics', 'Bulls', 'Warriors', 'Heat', 'Spurs', 'Knicks', 'Nets', 'Bucks', 'Suns',
  'Nuggets', 'Mavericks', 'Clippers', 'Sixers', 'Raptors', 'Grizzlies', 'Kings', 'Magic', 'Pistons',
  'Hornets', 'Hawks', 'Cavaliers', 'Pacers', 'Thunder', 'Trail Blazers', 'Jazz', 'Pelicans', 'Wizards',
  'Rockets', 'Timberwolves',
]
// a sala online arma 20 técnicos; a NBA tem 30 times, então clonamos os elencos
// pros 10 que faltam (o motor precisa de um técnico por time pra simular o jogo).
s = { ...s, managers: FRANQUIAS.map((nome, i) => ({ ...s.managers[i % s.managers.length], id: i, teamName: i === 0 ? s.managers[s.youIdx].teamName : nome, isHuman: i === 0 })), youIdx: 0 }
const rng = mulberry(2409)
const league = FRANQUIAS.map((nome, i) => {
  const w = 14 + Math.floor(rng() * 51)            // de 14 a 64 vitórias em 82 jogos
  const l = 82 - w
  // o saldo de cestas ANDA JUNTO com a campanha (quem ganha mais marca mais):
  // ~110 pontos por jogo de base, e cada vitória acima da média empurra o saldo.
  const margem = Math.round((w - 41) * 0.22 * 10) / 10 + (rng() * 2 - 1)
  const gf = Math.round(82 * (110 + margem / 2))
  const ga = Math.round(82 * (110 - margem / 2))
  return { id: i, name: i === 0 ? s.managers[s.youIdx].teamName : nome, isManager: true, pts: w * 3, w, l, d: 0, gf, ga }
})
s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 82, news: [] }

const table = sortedTable(league)
const leste = table.filter(t => t.id % 2 === 0)
const oeste = table.filter(t => t.id % 2 !== 0)
const vagasPO = leste.length >= 12 && oeste.length >= 12 ? 8 : 4
const EU = 0

// ─── 3. os playoffs INTEIROS pelo motor ───
s = { ...s, quickCopa: seedCopa(league, true) }
const chave = []            // [{ fase, ties: [...] }]
for (let passo = 0; passo < 80 && s.quickCopa && s.quickCopa.phase !== 'done'; passo++) {
  const antes = s.quickCopa.phase
  s = reducer(s, { type: 'PLAY_COPA_LEG' })
  if (s.quickCopa && s.quickCopa.phase !== antes) {
    const feita = s.quickCopa.bracket[s.quickCopa.bracket.length - 1]
    if (feita) chave.push({ fase: antes, ties: feita.ties })
  }
}
const campeao = s.quickCopa?.champion?.name ?? '—'

// ─── 4. HTML com a MESMA cara do jogo (creme, borda preta grossa, sombra dura) ───
const NOME_FASE = { oitavas: '1ª RODADA', quartas: 'SEMIS DE CONF.', semis: 'FINAIS DE CONF.', final: 'FINALS' }

const linha = (t, rank) => {
  const po = rank <= vagasPO
  const eu = t.id === EU
  const fundo = eu ? '#E9DFBE' : po ? VERDE_ZONA : 'transparent'
  const ap = Math.round(100 * t.w / (t.w + t.l))
  return `<tr style="background:${fundo}">
    <td class="pos">${rank}${po ? '<i class="po">PO</i>' : ''}</td>
    <td class="nm">${eu ? '👤 ' : ''}${t.name}</td>
    <td class="c b">${t.w}</td><td class="c">${t.l}</td><td class="c">${ap}%</td><td class="c">${t.gf - t.ga}</td>
  </tr>`
}
const tabelaConf = (times, nome) => `
  <div class="conf">
    <p class="chip">${nome}</p>
    <table>
      <thead><tr><th>#</th><th>Time</th><th class="c">V</th><th class="c">D</th><th class="c">AP</th><th class="c">SC</th></tr></thead>
      <tbody>${times.map((t, i) => linha(t, i + 1)).join('')}</tbody>
    </table>
  </div>`

const serie = t => {
  const va = t.legs.filter(([a, b]) => a > b).length
  const vb = t.legs.filter(([a, b]) => a < b).length
  const ganhouA = t.winner === t.aId
  const jogos = t.legs.map(([a, b], i) => `<span class="jg">jogo ${i + 1} <b>${a}</b>×<b>${b}</b></span>`).join('')
  return `<div class="tie">
    <p class="dupla"><span class="${ganhouA ? 'vc' : ''}">${t.aName}</span> <em>${va} × ${vb}</em> <span class="${ganhouA ? '' : 'vc'}">${t.bName}</span></p>
    <p class="jogos">${jogos} <small>melhor de 3</small></p>
  </div>`
}
const fases = chave.map(f => `
  <div class="fase">
    <p class="chip fase-chip">🏀 ${NOME_FASE[f.fase] ?? f.fase}</p>
    <div class="ties">${f.ties.map(serie).join('')}</div>
  </div>`).join('')

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:980px}
  h1{font-size:32px;margin:0 0 2px;text-transform:uppercase;letter-spacing:.5px}
  p.sub{margin:0 0 18px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.4}
  h2{font-size:19px;margin:22px 0 10px;text-transform:uppercase}
  .box{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px 16px}
  .duas{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .chip{display:inline-block;margin:0 0 8px;padding:2px 10px;font-size:14px;font-weight:800;text-transform:uppercase;
        background:${GOLD};border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK}}
  table{width:100%;border-collapse:collapse}
  th{font-size:12px;text-transform:uppercase;text-align:left;padding:3px 5px 7px;border-bottom:3px solid ${INK};color:#4a4636}
  td{padding:4px 5px;border-bottom:1px solid rgba(0,0,0,.1);font-size:13.5px}
  td.c,th.c{text-align:center}
  td.b{font-weight:800}
  td.pos{width:46px;font-weight:700;white-space:nowrap}
  td.nm{font-weight:600}
  i.po{font-style:normal;font-size:8px;font-weight:800;background:${GOLD};border:1px solid rgba(0,0,0,.4);border-radius:4px;padding:0 3px;margin-left:4px;vertical-align:middle}
  .fase{margin-bottom:14px}
  .fase-chip{background:#fff}
  .ties{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}
  .tie{border-bottom:1px dashed #d9d0b3;padding-bottom:5px}
  p.dupla{margin:0;font-size:15px;font-weight:700}
  p.dupla em{font-style:normal;font-weight:800;color:#1B7A3D;margin:0 6px}
  p.dupla .vc{text-decoration:underline;text-decoration-thickness:3px;text-decoration-color:${GOLD}}
  p.jogos{margin:1px 0 0;font-family:system-ui;font-size:12px;color:#5a5647}
  .jg{margin-right:9px}
  .jg b{color:${INK}}
  p.jogos small{color:#8a8470}
  .anel{margin-top:8px;font-size:20px;font-weight:800;text-transform:uppercase;text-align:center;
        background:${GOLD};border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:9px}
  .nota{margin-top:16px;font-family:system-ui;font-size:13.5px;line-height:1.5;color:#2f2c22;background:#fff7d6;
        border:3px solid ${INK};border-radius:14px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
  .nota b{font-family:Oswald}
  .relogio{display:flex;flex-wrap:wrap;gap:7px}
  .tick{flex:1 1 90px;text-align:center;background:${INK};color:#fff;border:3px solid ${INK};border-radius:12px;padding:6px 4px;box-shadow:3px 3px 0 rgba(0,0,0,.25)}
  .tick b{display:block;font-size:15px;font-weight:800;letter-spacing:.4px}
  .tick small{display:block;font-family:system-ui;font-size:10px;color:rgba(255,255,255,.6);margin-top:1px}
</style>
<h1>🏀 BidLegends — tabela por conferência e playoffs</h1>
<p class="sub">Tudo saiu do motor do jogo: temporada de 82 jogos, chaveamento semeado pelo <b>seedQuickCopa</b> e séries jogadas de verdade até sair o anel.</p>

<h2>1. A tabela: duas, uma por conferência</h2>
<div class="box duas">
  ${tabelaConf(leste, '🔵 LESTE')}
  ${tabelaConf(oeste, '🔴 OESTE')}
</div>
<p class="sub" style="margin-top:8px">🏆 <b>PO</b> = os ${vagasPO} primeiros de CADA conferência vão aos playoffs${vagasPO === 8 ? ' (1×8 · 4×5 · 3×6 · 2×7)' : ''}. A numeração recomeça do 1 em cada lado, porque é a posição DENTRO da conferência que manda no chaveamento. Sem faixa vermelha: no basquete ninguém cai.<br>Conferência grande (NBA 15 por lado, G League 12) passa 8; liga menor, como a sala online de 20 times, passa 4 — os mesmos 40% da Copa dos 8 do futebol, pra temporada regular continuar valendo alguma coisa.</p>

<h2>2. Os playoffs: toda série é melhor de 3</h2>
<div class="box">
  ${fases}
  <p class="anel">👑 ${campeao} é campeão das Finals — levou o anel 💍</p>
</div>

<h2>3. O relógio: 4 quartos de 12 minutos, contando pra baixo</h2>
<div class="box">
  <div class="relogio">
    ${[0, 12, 23, 24, 35, 46, 47, 58, 69, 70, 81, 92, MATCH_TICKS].map(m => `<span class="tick"><b>${basketClockLabel(m)}</b><small>${Math.round(100 * m / MATCH_TICKS)}% do jogo</small></span>`).join('')}
  </div>
  <p class="sub" style="margin:10px 0 0">O card da partida e a lista dos playoffs leem a <b>mesma conta</b>, então nunca marcam quartos diferentes no mesmo jogo. E as cestas narradas agora caem nos <b>quatro</b> quartos — antes o sorteio parava no meio e o 2º tempo ficava mudo.</p>
</div>

<div class="nota">
  <b>O que mudou:</b> antes o basquete usava o mata-mata do futebol — 4 times por conferência, ida e volta somando os pontos e <b>pênaltis</b> no empate. Agora é NBA: <b>top 8 de cada lado</b>, <b>melhor de 3</b> em toda rodada (inclusive a final), mando alternando casa/fora/casa, e jogo empatado vai pra <b>prorrogação</b>. Leste e Oeste só se cruzam nas <b>Finals</b>.<br>
  <b>O futebol não foi tocado:</b> chave de 4, ida e volta, final única e pênaltis continuam idênticos — o teste confere isso byte a byte.
</div>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1032, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/mockup-basquete-playoffs.png', fullPage: true })
await browser.close()
console.log('🖼️  /tmp/mockup-basquete-playoffs.png')
console.log(`   campeão: ${campeao} · ${chave.reduce((n, f) => n + f.ties.length, 0)} séries · Leste ${leste.length} × Oeste ${oeste.length} times`)
