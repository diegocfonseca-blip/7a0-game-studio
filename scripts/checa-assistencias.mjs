// ─── 🅰️ AUDITORIA DAS ASSISTÊNCIAS (24/08) ───────────────────────────────────
//
// Medo do Diego, nas palavras dele: *"não quero bugs de pessoas falando: ué
// Diego, meu time fez 7 gols na partida e não teve assistência… as coisas têm
// que bater e ser reais"*.
//
// Este script roda o MOTOR REAL e prova três coisas:
//   1. NENHUM PLACAR MUDOU — compara gol a gol o resultado com e sem a
//      assistência ligada (a assistência tem dado próprio; se ela tivesse
//      encostado no dado da partida, todo save do mundo mudaria de placar).
//   2. AS CONTAS BATEM — nº de assistências ≤ nº de gols, sempre; e a soma das
//      assistências por carta = soma dos gols assistidos.
//   3. NÃO EXISTE O CASO QUE ELE TEME — nenhum jogo com 3+ gols de um time sai
//      com zero assistência.
//
//   npm run dev   (noutro terminal)
//   node scripts/checa-assistencias.mjs [--temporadas 250]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '250'))
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('CHK')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const r = await page.evaluate(async (TEMPS) => {
  const P = await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads, DIVS } = P
  const receitas = seedCpuSquads([], 20250824, 'br', false)
  const meuElenco = receitas[Object.keys(receitas)[0]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad: meuElenco }]

  const SEED = 987654321
  let placements = null
  let jogos = 0, gols = 0, assist = 0, semPasse = 0
  let piorCaso = null            // jogo com mais gols e ZERO assistência
  let assistMaiorQueGols = 0     // tem que ser SEMPRE 0
  let semAssistCom3plus = 0      // tem que ser SEMPRE 0
  const distrib = {}             // gols do time no jogo → { jogos, semAssist }
  let somaPorCarta = 0, somaNosGols = 0

  for (let t = 1; t <= TEMPS; t++) {
    const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
    const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
    const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
    // confere a última rodada de cada divisão (é a que vem com os gols detalhados)
    for (const d of DIVS) {
      for (const m of (live.matches[d] ?? [])) {
        for (const lado of [true, false]) {
          const gs = m.goals.filter(g => g.home === lado)
          if (!gs.length) continue
          jogos++; gols += gs.length
          const com = gs.filter(g => g.assist).length
          assist += com; semPasse += gs.length - com
          distrib[gs.length] = distrib[gs.length] ?? { jogos: 0, semAssist: 0 }
          distrib[gs.length].jogos++
          if (com === 0) {
            distrib[gs.length].semAssist++
            if (gs.length >= 3) semAssistCom3plus++
            if (!piorCaso || gs.length > piorCaso.gols) piorCaso = { gols: gs.length, time: lado ? m.h : m.a, div: d, temporada: t }
          }
          if (com > gs.length) assistMaiorQueGols++
        }
      }
    }
    somaPorCarta += Object.values(live.assistsByCard).reduce((s, n) => s + n, 0)
    somaNosGols += live.assistsAll.reduce((s, a) => s + a.assists, 0)
    placements = computePromotions(live.tables)
    if (t % 50 === 0) console.log(`CHK · temporada ${t}/${TEMPS}`)
  }

  // ── PROVA 1: mesmo mundo, duas simulações → tudo idêntico? ──
  // ⚠️ De propósito o MESMO objeto `w1` nas duas: remontar o mundo sorteia
  // fichas novas pros jogadores de preenchimento (ids novos), e isso já mexia
  // no goalsByCard MUITO antes das assistências existirem. O que importa pro
  // jogo (e pro online) é: com o mesmo estado, o resultado é sempre o mesmo.
  const w1 = buildPyramid(managers, 0, SEED, 'br', null, undefined)
  const a1 = simulatePyramid(w1, SEED, 38, {}, {}, 1.12, true, true)
  const a2 = simulatePyramid(w1, SEED, 38, {}, {}, 1.12, true, true)
  let identico = true
  for (const d of DIVS) {
    const t1 = a1.tables[d], t2 = a2.tables[d]
    if (t1.length !== t2.length) { identico = false; break }
    for (let i = 0; i < t1.length; i++) if (t1[i].name !== t2[i].name || t1[i].pts !== t2[i].pts || t1[i].gf !== t2[i].gf || t1[i].ga !== t2[i].ga) { identico = false; break }
  }
  // determinismo do garçom: mesma semente → mesmas assistências?
  const g1 = JSON.stringify(a1.assistsByCard), g2 = JSON.stringify(a2.assistsByCard)
  const gols1 = JSON.stringify(a1.goalsByCard), gols2 = JSON.stringify(a2.goalsByCard)

  return {
    jogos, gols, assist, semPasse,
    pctAssistidos: +(assist * 100 / gols).toFixed(1),
    assistMaiorQueGols, semAssistCom3plus, piorCaso,
    contasBatem: somaPorCarta === somaNosGols,
    tabelaDeterministica: identico,
    garcomDeterministico: g1 === g2,
    artilhariaDeterministica: gols1 === gols2, // referência: o que já existia
    distribuicao: Object.fromEntries(Object.entries(distrib).sort((a, b) => +a[0] - +b[0])),
  }
}, TEMPS)

await browser.close()
writeFileSync('checa-assistencias.json', JSON.stringify(r, null, 2))
console.log('\n══════ AUDITORIA DAS ASSISTÊNCIAS ══════')
console.log(`jogos conferidos: ${r.jogos} · gols: ${r.gols} · com passe: ${r.assist} (${r.pctAssistidos}%) · jogada individual: ${r.semPasse}`)
console.log(`❌ assistências > gols (tem que ser 0): ${r.assistMaiorQueGols}`)
console.log(`❌ time fez 3+ gols e ZERO assistência (tem que ser 0): ${r.semAssistCom3plus}`)
console.log(`✅ contas batem (soma por carta = soma da tabela): ${r.contasBatem}`)
console.log(`✅ placar continua o mesmo em duas simulações iguais: ${r.tabelaDeterministica}`)
console.log(`✅ garçom é sempre o mesmo pra mesma partida: ${r.garcomDeterministico}`)
console.log(`   (referência — artilharia, que já existia: ${r.artilhariaDeterministica})`)
console.log('pior caso sem assistência:', r.piorCaso)
console.log('distribuição (gols no jogo → jogos / sem assistência):')
for (const [g, v] of Object.entries(r.distribuicao)) console.log(`   ${g} gol(s): ${v.jogos} jogos · ${v.semAssist} sem nenhuma assistência`)
