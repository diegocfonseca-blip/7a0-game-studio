// ─── 📏 QUANTO UM "+X DE OVERALL" DO TÉCNICO REALMENTE MUDA? (Diego 24/08) ──
//
// Pergunta dele: *"E se botarmos apenas formação q libera e overall tb?? Mas
// isso implicaria em deixar o time mais forte e etc?? Oq diz??"*
//
// Em vez de chutar, este script MEDE no motor de verdade. Roda a MESMA
// temporada (mesma semente, mesmo mundo, mesmo calendário) várias vezes, só
// mudando quanto de overall o técnico soma no elenco — e compara pontos,
// gols, títulos e acessos.
//
// ⚠️ Por que isso importa: o Diego já cortou a ideia de "escada" (*"a Lenda
// Telê N poderia ser apenas ter 5 formações e o craque 3 e essa ser a única
// diferença"*). Se +overall for FORTE demais, o técnico vira escada de novo
// (todo mundo quer só o topo). Se for fraco demais, vira enfeite. O número
// abaixo é o que decide onde fica o ponto certo.
//
//   npm run dev  (noutro terminal)
//   node scripts/mede-overall-tecnico.mjs [--temporadas 60]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '60'))
const SAIDA = arg('--saida', 'overall-tecnico.json')
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const rel = await page.evaluate(async ([TEMPS]) => {
  // ⚠️ ORDEM DE IMPORT IMPORTA: pyramidseason e screens se importam em círculo.
  // Importar pyramidseason PRIMEIRO estoura `COPA_LEG_MS before initialization`.
  // Carregando screens antes, o ciclo se resolve na ordem certa.
  await import('/7a0-game-studio/src/escalacao/screens.tsx')
  const P = await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads, DIVS } = P

  const receitas = seedCpuSquads([], 20250824, 'br', false)
  const nomes = Object.keys(receitas)
  const SEED = 987654321

  // roda TEMPS temporadas com um bônus fixo de overall no elenco do humano.
  // O bônus entra em `lo`/`hi` de cada carta — é EXATAMENTE o que "overall do
  // técnico" significaria na prática (o time joga como se fosse melhor).
  const roda = (bonus, elencoIdx) => {
    const meuElenco = receitas[nomes[elencoIdx]].map(c => ({
      ...c, lo: Math.min(99, c.lo + bonus), hi: Math.min(99, c.hi + bonus),
    }))
    const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false,
      formation: '4-4-2', money: 100, squad: meuElenco }]
    let placements = null
    let pontos = 0, gols = 0, sofridos = 0, titulos = 0, acessos = 0, quedas = 0, vit = 0, emp = 0, der = 0
    let temporadasNaA = 0
    for (let t = 1; t <= TEMPS; t++) {
      const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
      const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
      const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
      let minhaDiv = null, minhaPos = null, meu = null
      for (const d of DIVS) {
        const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0)
        if (i >= 0) { minhaDiv = d; minhaPos = i + 1; meu = live.tables[d][i] }
      }
      if (!meu) break
      pontos += meu.pts ?? 0; gols += meu.gf ?? 0; sofridos += meu.ga ?? 0
      vit += meu.w ?? 0; emp += meu.d ?? 0; der += meu.l ?? 0
      if (minhaPos === 1) titulos++
      if (minhaDiv === 'A') temporadasNaA++
      const novo = computePromotions(live.tables)
      const nd = novo['m0']
      if (nd && DIVS.indexOf(nd) < DIVS.indexOf(minhaDiv)) acessos++
      if (nd && DIVS.indexOf(nd) > DIVS.indexOf(minhaDiv)) quedas++
      placements = novo
    }
    return {
      bonus,
      pontosPorTemporada: +(pontos / TEMPS).toFixed(1),
      golsPorTemporada: +(gols / TEMPS).toFixed(1),
      sofridosPorTemporada: +(sofridos / TEMPS).toFixed(1),
      vitoriasPorTemporada: +(vit / TEMPS).toFixed(1),
      titulos, acessos, quedas, temporadasNaA,
    }
  }

  const BONUS = [0, 1, 2, 3, 5, 8]
  const out = {}
  for (const el of [['forte', 0], ['medio', Math.floor(nomes.length / 2)], ['fraco', nomes.length - 1]]) {
    out[el[0]] = BONUS.map(b => roda(b, el[1]))
    console.log('SIM ' + el[0] + ' ok')
  }
  return { temporadas: TEMPS, resultados: out }
}, [TEMPS])

await browser.close()
writeFileSync(SAIDA, JSON.stringify(rel, null, 2))

const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(1)
for (const [elenco, linhas] of Object.entries(rel.resultados)) {
  const base = linhas[0]
  console.log(`\n══════ ELENCO ${elenco.toUpperCase()} · ${rel.temporadas} temporadas cada ══════`)
  console.log('bônus | pts/temp | Δpts | gols | sofridos | títulos | acessos | quedas | temps na A')
  for (const l of linhas) {
    console.log(
      `  +${l.bonus}   |  ${String(l.pontosPorTemporada).padStart(5)}   | ${fmt(l.pontosPorTemporada - base.pontosPorTemporada).padStart(5)} |` +
      ` ${String(l.golsPorTemporada).padStart(4)} |   ${String(l.sofridosPorTemporada).padStart(4)}   |` +
      `   ${String(l.titulos).padStart(3)}   |   ${String(l.acessos).padStart(3)}   |  ${String(l.quedas).padStart(3)}   |    ${l.temporadasNaA}`)
  }
}
console.log(`\n📄 ${SAIDA}`)
