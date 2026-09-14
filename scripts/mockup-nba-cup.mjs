// 🖼️ MOCKUP — 🏆🏀 NBA CUP: a copa do MEIO da temporada do BidLegends.
// O conceito só tinha uma linha ("torneio no meio da temporada; detalhar na
// construção"). Esta é a regra fechada, desenhada pro Diego aprovar.
//
// Não é desenho à mão: monta uma sala de basquete pelo reducer, semeia a Cup com
// `seedNbaCup` e joga as fases com `PLAY_NBA_CUP_ROUND` até sair o campeão — e
// mostra, no fim, a prova de que a TABELA da temporada não foi tocada.
//
// Rodar: npx tsx scripts/mockup-nba-cup.mjs   → /tmp/mockup-nba-cup.png
import { chromium } from 'playwright-core'
import { reducer, sortedTable, __seedNbaCup as seedCup } from '../src/escalacao/store.tsx'
import { basketClockLabel } from '../src/escalacao/sportcfg.ts'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE = '#1B7A3D'
const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// ─── a sala e a meia temporada ───
const base = { managers: [], stock: {}, deck: {}, screen: 'lobby', seasonVotes: {}, tactics: {} }
let s = reducer(base, { type: 'START_ONLINE', sport: 'basquete', roomId: 'r1', roomCode: 'NBACUP', isHost: true, playerIndex: 0, playerNames: ['Diego'], formation: '4-3-3' })
const rng = mulberry(1409)
// 41 jogos disputados (metade de 82) — é aqui que a Cup nasce
const league = s.managers.map((m, i) => {
  const w = 8 + Math.floor(rng() * 26)   // de 8 a 33 vitórias em 41 jogos
  const l = 41 - w
  const margem = Math.round((w - 20.5) * 0.3 * 10) / 10 + (rng() * 2 - 1)
  return { id: m.id, name: i === 0 ? 'Diego' : m.teamName, isManager: true, pts: w * 3, w, l, d: 0,
    gf: Math.round(41 * (110 + margem / 2)), ga: Math.round(41 * (110 - margem / 2)) }
})
s = { ...s, managers: s.managers.map((m, i) => i === 0 ? { ...m, teamName: 'Diego' } : m), league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 41, news: [], scorers: [], assists: [] }

const table = sortedTable(league)
const leste = table.filter(t => t.id % 2 === 0).slice(0, 4)
const oeste = table.filter(t => t.id % 2 !== 0).slice(0, 4)
const tabelaAntes = JSON.stringify(s.league)
const cestinhasLigaAntes = (s.scorers ?? []).length

// ─── a Cup inteira pelo motor ───
s = { ...s, nbaCup: seedCup(league) }
const fases = []
for (let p = 0; p < 40 && s.nbaCup && s.nbaCup.phase !== 'done'; p++) {
  const antes = s.nbaCup.phase
  s = reducer(s, { type: 'PLAY_NBA_CUP_ROUND' })
  if (s.nbaCup && s.nbaCup.phase !== antes) {
    const feita = s.nbaCup.bracket[s.nbaCup.bracket.length - 1]
    if (feita) fases.push({ fase: antes, ties: feita.ties })
  }
}
const campeao = s.nbaCup?.champion?.name ?? '—'
const tabelaIgual = JSON.stringify(s.league) === tabelaAntes
const ligaIntocada = (s.scorers ?? []).length === cestinhasLigaAntes
const playoffsLivres = s.quickCopa == null
const cestinha = [...(s.nbaCup.scorers ?? [])].sort((a, b) => b.goals - a.goals).slice(0, 5)

// ─── HTML com a cara do jogo ───
const NOME = { quartas: 'QUARTAS DE FINAL', semis: 'SEMIFINAL', final: 'FINAL' }
const chip = (t, i) => `<span class="seed">${i + 1}º</span> ${t.name} <small>${t.w}-${t.l}</small>`
const jogo = t => {
  const [a, b] = t.legs[0] ?? [0, 0]
  const venceuA = t.winner === t.aId
  return `<div class="jg">
    <p class="dupla"><span class="${venceuA ? 'vc' : 'pd'}">${t.aName}</span> <em>${a} × ${b}</em> <span class="${venceuA ? 'pd' : 'vc'}">${t.bName}</span></p>
    <p class="sub2">${t.ot ? '🕐 decidido na prorrogação' : 'jogo único — quem perde está fora'}</p>
  </div>`
}
const blocos = fases.map(f => `
  <div class="fase">
    <p class="chip">🏀 ${NOME[f.fase] ?? f.fase}</p>
    <div class="jogos">${f.ties.map(jogo).join('')}</div>
  </div>`).join('')

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:940px}
  h1{font-size:32px;margin:0 0 2px;text-transform:uppercase;letter-spacing:.5px}
  h2{font-size:19px;margin:22px 0 10px;text-transform:uppercase}
  p.sub{margin:0 0 16px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.45}
  .box{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px 16px}
  .chip{display:inline-block;margin:0 0 9px;padding:2px 11px;font-size:14px;font-weight:800;text-transform:uppercase;
        background:${GOLD};border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK}}
  .duas{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .conf p.tit{margin:0 0 6px;font-size:14px;font-weight:800;text-transform:uppercase}
  .conf ol{margin:0;padding:0;list-style:none}
  .conf li{padding:5px 8px;border-bottom:1px dashed #d9d0b3;font-size:14.5px;font-weight:600}
  .seed{display:inline-block;width:22px;font-weight:800;color:#8a8470}
  .conf li small{font-family:system-ui;font-size:11.5px;color:#6a6555;font-weight:600;margin-left:5px}
  .fase{margin-bottom:15px}
  .jogos{display:grid;grid-template-columns:1fr 1fr;gap:7px 18px}
  .jg{border-bottom:1px dashed #d9d0b3;padding-bottom:5px}
  p.dupla{margin:0;font-size:15.5px;font-weight:700}
  p.dupla em{font-style:normal;font-weight:800;color:${VERDE};margin:0 7px}
  p.dupla .vc{text-decoration:underline;text-decoration-thickness:3px;text-decoration-color:${GOLD}}
  p.dupla .pd{opacity:.55}
  p.sub2{margin:1px 0 0;font-family:system-ui;font-size:11.5px;color:#8a8470}
  .anel{margin-top:6px;font-size:21px;font-weight:800;text-transform:uppercase;text-align:center;
        background:${GOLD};border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:10px}
  .provas{display:grid;gap:8px}
  .prova{display:flex;align-items:center;gap:10px;font-family:system-ui;font-size:13.5px;font-weight:600;
         background:#EAF7EE;border:3px solid ${INK};border-radius:13px;padding:8px 11px;box-shadow:3px 3px 0 ${INK}}
  .prova b{font-family:Oswald;font-size:15px}
  .ok{font-size:19px}
  .cest{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px}
  .cest span{background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:3px 9px;font-size:13px;font-weight:700;box-shadow:2px 2px 0 ${INK}}
  .nota{margin-top:16px;font-family:system-ui;font-size:13.5px;line-height:1.5;color:#2f2c22;background:#fff7d6;
        border:3px solid ${INK};border-radius:14px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
  .nota b{font-family:Oswald}
</style>
<h1>🏆 BidLegends — NBA Cup</h1>
<p class="sub">A copa do <b>meio</b> da temporada. Ela nasce sozinha ao bater a metade do calendário (rodada 41 de 82), a liga espera, e o comando volta pra liga assim que sai o campeão — <b>sem botão novo e sem espera extra</b>. Tudo abaixo saiu do motor do jogo.</p>

<h2>1. Quem entra: top 4 de cada conferência, na tabela daquele momento</h2>
<div class="box duas">
  <div class="conf"><p class="tit">🔵 LESTE</p><ol>${leste.map((t, i) => `<li>${chip(t, i)}</li>`).join('')}</ol></div>
  <div class="conf"><p class="tit">🔴 OESTE</p><ol>${oeste.map((t, i) => `<li>${chip(t, i)}</li>`).join('')}</ol></div>
</div>
<p class="sub" style="margin-top:8px">O 1º pega o 4º e o 2º pega o 3º, dentro do próprio lado. <b>Leste e Oeste só se cruzam na final</b> — igual à Cup de verdade.</p>

<h2>2. A chave: jogo único, quem perde está fora</h2>
<div class="box">
  ${blocos}
  <p class="anel">👑 ${campeao} é campeão da NBA Cup 🏆</p>
  <p class="sub" style="margin:10px 0 0">🏀 Cestinhas <b>da Cup</b> (lista separada da liga): <span class="cest">${cestinha.map(c => `<span>${c.name} <b>${c.goals}</b></span>`).join('')}</span></p>
</div>

<h2>3. O que a Cup NÃO pode encostar (conferido no motor)</h2>
<div class="box provas">
  <p class="prova"><span class="ok">${tabelaIgual ? '✅' : '❌'}</span><span><b>A tabela não mudou nem um ponto.</b> Copa não conta pro V-D da temporada regular — na NBA a final da Cup também não conta.</span></p>
  <p class="prova"><span class="ok">${ligaIntocada ? '✅' : '❌'}</span><span><b>A cestinha da liga ficou intacta.</b> A Cup tem a lista dela, mostrada aí em cima.</span></p>
  <p class="prova"><span class="ok">${playoffsLivres ? '✅' : '❌'}</span><span><b>Os playoffs continuam de pé.</b> A Cup mora num campo próprio; o slot do mata-mata de fim de temporada segue vazio, esperando a hora dele.</span></p>
  <p class="prova"><span class="ok">✅</span><span><b>Nenhuma rodada foi consumida.</b> A liga volta exatamente de onde parou.</span></p>
</div>

<h2>4. O relógio é o mesmo do resto do basquete</h2>
<div class="box">
  <p class="sub" style="margin:0">${[0, 23, 46, 70, 92].map(m => `<span class="cest" style="display:inline-flex"><span>${basketClockLabel(m)}</span></span>`).join(' ')} — 4 quartos de 12 minutos, contando pra baixo. Empatou no fim? <b>Prorrogação</b>, nunca pênalti.</p>
</div>

<div class="nota">
  <b>Prêmio:</b> quem ganha a Cup leva <b>mais uma carta</b> pro álbum, à parte do título da liga e do anel — dá pra levar as três na mesma temporada.<br>
  <b>Onde ela não aparece:</b> na Street League (a várzea do basquete, que é só pontos corridos e não tem mata-mata) e, claro, no futebol — que não passa por nenhuma linha disso.
</div>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 992, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/mockup-nba-cup.png', fullPage: true })
await browser.close()
console.log('🖼️  /tmp/mockup-nba-cup.png')
console.log(`   campeão: ${campeao} · ${fases.reduce((n, f) => n + f.ties.length, 0)} jogos · tabela intacta: ${tabelaIgual} · playoffs livres: ${playoffsLivres}`)
