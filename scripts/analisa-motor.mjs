// ─── 🔬 RAIO-X DO MOTOR: quem faz gol, que nível joga onde, e o que não fecha ──
//
// Pergunta do Diego (16/09): *"da simulação que você fez, consegue ver como está a
// dificuldade do jogo, e também em relação a zagueiro metendo muito gol, lateral,
// nível de jogadores… enfim, coisas que você vê que não têm sentido nenhum?"*.
//
// ⚠️ Este script SÓ MEDE. Não muda nada, não propõe nada — só roda o motor de
// verdade (as mesmas funções do celular do jogador) e conta o que sai.
//
// O que ele apura, por divisão:
//  · 🥅 gols por POSIÇÃO (é aqui que mora a suspeita do zagueiro/lateral)
//  · 🏆 quem termina ARTILHEIRO (posição e nível da carta)
//  · 📊 gols por jogo, goleadas, jogos apertados
//  · 🎚️ nível médio dos elencos de cada divisão (a "escada" faz sentido?)
//  · 🤨 as estranhezas: goleiro marcando, zagueiro artilheiro, lateral no top-5
//
// Roda com o vite de pé:  node scripts/analisa-motor.mjs [--temporadas 40]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '40'))
const SAIDA = arg('--saida', '/tmp/raiox-motor.json')
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)

const rel = await page.evaluate(async (TEMPS) => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')   // 🔁 quebra o ciclo de import (ver sim-caixa-120)
  const P = await import(B + 'pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads, DIVS } = P
  const DECK = 'todos' // 🌎 a carreira com a escada usa os TRES baralhos (Brasil + Europa + Mundo)

  // o técnico humano leva um elenco MEDIANO (a receita do meio da lista de CPU),
  // pra separar "o jogador é bom" de "a regra empurra pra cima".
  const receitas = seedCpuSquads([], 20250824, DECK, false)
  const nomes = Object.keys(receitas)
  const meuElenco = receitas[nomes[Math.floor(nomes.length / 2)]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad: meuElenco }]

  const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  const zero = () => Object.fromEntries(POS.map(p => [p, 0]))
  const out = {}
  for (const d of DIVS) out[d] = {
    golsPorPos: zero(), artilheiroPorPos: zero(), top5PorPos: zero(),
    gols: 0, jogos: 0, goleadas: 0, apertados: 0,
    nivelElenco: [], nivelArtilheiro: [], golsArtilheiro: [],
    nivelPorPos: Object.fromEntries(POS.map(p => [p, []])),
    campeaoPts: [], lanternaPts: [],
  }
  // 🤨 a lista das cenas estranhas, pra mostrar exemplo e não só porcentagem
  const estranho = { goleiroArtilheiro: [], zagueiroArtilheiro: [], lateralArtilheiro: [], zagueiro15: [], golsDeGoleiro: 0 }
  const minhaVida = { div: {}, pos: [], acessos: 0, quedas: 0, titulos: 0 }

  const SEED = 987654321
  let placements = null, cpuSquads = undefined

  for (let t = 1; t <= TEMPS; t++) {
    const world = buildPyramid(managers, 0, SEED, DECK, placements, cpuSquads)
    const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
    const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)

    // 🗂️ ficha de cada carta que jogou (pra saber posição e nível de quem marcou)
    const ficha = new Map()
    for (const d of DIVS) for (const tm of world[d]) for (const c of tm.squad) ficha.set(c.id, { pos: c.pos, nivel: (c.lo + c.hi) / 2, name: c.name })

    for (const d of DIVS) {
      const o = out[d]
      // nível dos elencos (só o XI, que é quem joga)
      for (const tm of world[d]) for (const c of tm.xi) { o.nivelElenco.push((c.lo + c.hi) / 2); o.nivelPorPos[c.pos].push((c.lo + c.hi) / 2) }
      // gols por posição — de TODOS os artilheiros da divisão
      const daDiv = (live.scorersAll ?? []).filter(s => s.div === d)
      for (const s of daDiv) {
        const f = ficha.get(s.cardId)
        if (!f) continue
        o.golsPorPos[f.pos] += s.goals
        if (f.pos === 'GOL') estranho.golsDeGoleiro += s.goals
        if (f.pos === 'ZAG' && s.goals >= 15) estranho.zagueiro15.push({ temporada: t, div: d, nome: s.name, time: s.teamName, gols: s.goals, nivel: Math.round(f.nivel) })
      }
      // o ARTILHEIRO e o top-5 da divisão
      const rank = daDiv.slice().sort((a, b) => b.goals - a.goals)
      const art = rank[0]
      if (art) {
        const f = ficha.get(art.cardId)
        if (f) {
          o.artilheiroPorPos[f.pos]++
          o.nivelArtilheiro.push(f.nivel); o.golsArtilheiro.push(art.goals)
          const reg = { temporada: t, div: d, nome: art.name, time: art.teamName, gols: art.goals, nivel: Math.round(f.nivel) }
          if (f.pos === 'GOL') estranho.goleiroArtilheiro.push(reg)
          if (f.pos === 'ZAG') estranho.zagueiroArtilheiro.push(reg)
          if (f.pos === 'LAT') estranho.lateralArtilheiro.push(reg)
        }
      }
      for (const s of rank.slice(0, 5)) { const f = ficha.get(s.cardId); if (f) o.top5PorPos[f.pos]++ }
      // placares da divisão
      const tab = live.tables[d] ?? []
      if (tab.length) { o.campeaoPts.push(tab[0].pts); o.lanternaPts.push(tab[tab.length - 1].pts) }
      for (const tm of tab) { o.gols += tm.gf; o.jogos += tm.w + tm.d + tm.l }
    }
    // jogos: contei 2× (cada partida aparece nos dois times)
    // onde EU terminei
    let minhaDiv = null, minhaPos = null
    for (const d of DIVS) { const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0); if (i >= 0) { minhaDiv = d; minhaPos = i + 1 } }
    minhaVida.div[minhaDiv] = (minhaVida.div[minhaDiv] ?? 0) + 1
    minhaVida.pos.push({ t, div: minhaDiv, pos: minhaPos })
    if (minhaPos === 1) minhaVida.titulos++
    const novo = computePromotions(live.tables)
    const nd = novo['m0']
    if (nd && DIVS.indexOf(nd) < DIVS.indexOf(minhaDiv)) minhaVida.acessos++
    if (nd && DIVS.indexOf(nd) > DIVS.indexOf(minhaDiv)) minhaVida.quedas++
    placements = novo
  }

  // fecha as contas
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
  const resumo = {}
  for (const d of DIVS) {
    const o = out[d]
    const totalGols = POS.reduce((s, p) => s + o.golsPorPos[p], 0)
    resumo[d] = {
      golsPorPosPct: Object.fromEntries(POS.map(p => [p, +(100 * o.golsPorPos[p] / (totalGols || 1)).toFixed(1)])),
      artilheiroPorPos: o.artilheiroPorPos,
      top5PorPos: o.top5PorPos,
      golsPorJogo: +(o.gols / (o.jogos / 2 || 1)).toFixed(2),
      nivelMedioXI: +media(o.nivelElenco).toFixed(1),
      nivelMedioPorPos: Object.fromEntries(POS.map(p => [p, +media(o.nivelPorPos[p]).toFixed(1)])),
      nivelMedioArtilheiro: +media(o.nivelArtilheiro).toFixed(1),
      golsMediosArtilheiro: +media(o.golsArtilheiro).toFixed(1),
      ptsCampeao: +media(o.campeaoPts).toFixed(1),
      ptsLanterna: +media(o.lanternaPts).toFixed(1),
    }
  }
  return { temporadas: TEMPS, resumo, estranho, minhaVida }
}, TEMPS)

writeFileSync(SAIDA, JSON.stringify(rel, null, 1))
console.log(`💾 ${SAIDA}`)
console.log(JSON.stringify(rel.resumo, null, 1))
console.log('🤨 estranhezas:', JSON.stringify({
  golsDeGoleiro: rel.estranho.golsDeGoleiro,
  goleiroArtilheiro: rel.estranho.goleiroArtilheiro.length,
  zagueiroArtilheiro: rel.estranho.zagueiroArtilheiro.length,
  lateralArtilheiro: rel.estranho.lateralArtilheiro.length,
  zagueiroCom15maisGols: rel.estranho.zagueiro15.length,
}, null, 1))
console.log('🧍 sua vida:', JSON.stringify(rel.minhaVida.div), 'títulos', rel.minhaVida.titulos, 'acessos', rel.minhaVida.acessos, 'quedas', rel.minhaVida.quedas)
await browser.close()
