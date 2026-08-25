// ─── 🔬 RAIO-X DO RÁPIDO ONLINE — de onde saem as ideias (Diego 25/08) ──────
//
// Pedido dele: *"se vc quiser faça uma simulação do jogo rápido modo rápido.. e aí
// vc pode ter ideias p me dar em relação ao online"*.
//
// Em vez de chutar modo novo, este script joga MUITAS temporadas do rápido online
// no motor de verdade e mede as coisas que decidem se a sala é DIVERTIDA:
//
//   1. 🎯 O LEILÃO JÁ DECIDIU TUDO? — o quanto a posição final é explicada pela
//      força do elenco montado no pregão. Se for quase 100%, as 38 rodadas são
//      slideshow: dá pra prever o campeão antes da 1ª bola rolar.
//   2. ⏱️ QUANDO O TÍTULO ACABA — em que rodada o campeão assume a ponta e não
//      larga mais. Tudo depois disso é tempo morto.
//   3. 😴 JOGO SEM EMOÇÃO — % de partidas decididas por 3+ gols.
//   4. 🤖 BOT LEVANTA A TAÇA? — quantas vezes a taça não é de ninguém da sala.
//   5. 🪑 QUEM SENTA MELHOR — a vantagem de quem termina o leilão com o elenco
//      mais forte (se ganhar o pregão = ganhar a liga, o resto não importa).
//
// ⚠️ Monta a sala como o jogo monta DE VERDADE: humanos + técnicos-ROBÔ com
// elenco (é isso que a sala online tem — conferido no banco em 25/08). Sem os
// robôs, o `buildLeague` completa com clubes fixos e a medição mente.
//
//   npm run dev  (noutro terminal)
//   node scripts/simula-rapido-ideias.mjs [--temporadas 40] [--humanos 4]
import { chromium } from 'playwright-core'
import { writeFileSync, existsSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '40'))
const HUMANOS = Number(arg('--humanos', '4'))
const SAIDA = arg('--saida', 'raio-x-rapido.json')
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')
if (!existsSync('bench-sim.html')) writeFileSync('bench-sim.html', '<!doctype html><meta charset="utf-8"><title>bench</title><body>b</body>')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const rel = await page.evaluate(async ([TEMPS, HUMANOS]) => {
  const S = await import('/7a0-game-studio/src/escalacao/store.tsx')
  const D = await import('/7a0-game-studio/src/escalacao/data.ts')
  const { reducer, INITIAL } = S
  const LEAGUE = 20

  const porPos = {}
  for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
    porPos[p] = D.CATALOG[p].map(c => ({ ...c, pos: p })).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
  }
  // força de um elenco pela MESMA conta do motor (setor = média puxada pelo pior)
  const setor = (sq, pos) => {
    const s = sq.filter(c => c.pos === pos).map(c => (c.lo + c.hi) / 2)
    if (!s.length) return 40
    const avg = s.reduce((x, y) => x + y, 0) / s.length
    return avg - (avg - Math.min(...s)) * 0.35
  }
  const forca = sq => {
    const atk = setor(sq, 'ATA') * 0.45 + setor(sq, 'MEI') * 0.35 + setor(sq, 'LAT') * 0.20
    const def = setor(sq, 'GOL') * 0.30 + setor(sq, 'ZAG') * 0.40 + setor(sq, 'LAT') * 0.15 + setor(sq, 'MEI') * 0.15
    return (atk + def) / 2
  }

  // 🔨 SIMULA O PREGÃO: draft em serpentina com RUÍDO — quem lança melhor leva o
  // craque, mas ninguém ganha tudo. É o mais perto que dá do leilão às cegas sem
  // rodar o leilão inteiro (que exige gente apertando botão).
  const montaSala = (rng) => {
    const XI = { GOL: 1, LAT: 2, ZAG: 3, MEI: 4, ATA: 4 } // 14 cartas: elenco com reserva
    const cursor = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 }
    const squads = Array.from({ length: LEAGUE }, () => [])
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      for (let n = 0; n < XI[pos]; n++) {
        // ordem da leva: serpentina embaralhada (o "quem levou o melhor" varia)
        const ordem = Array.from({ length: LEAGUE }, (_, i) => i).sort(() => rng() - 0.5)
        for (const t of ordem) {
          const c = porPos[pos][cursor[pos]++]
          if (c) squads[t].push({ ...c, id: `${c.name}-${t}-${n}` })
        }
      }
    }
    return squads.map((sq, i) => ({
      id: i, name: i < HUMANOS ? `Jogador ${i + 1}` : `Robô ${i - HUMANOS + 1}`,
      teamName: i < HUMANOS ? `Time ${i + 1}` : `Robô ${i - HUMANOS + 1}`,
      isHuman: i < HUMANOS, auctionRival: false,
      formation: '4-3-3', money: 100, squad: sq,
    }))
  }

  let mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }

  let acertoDoLeilao = 0, campeaoEraOMaisForte = 0, campeaoBot = 0
  let somaRodadaDecidiu = 0, somaGolgoleada = 0, somaJogos = 0
  let somaGapCampeao = 0, temporadas = 0
  const posPorForca = [] // pares [rank de força, rank final] pra ver o quanto bate

  for (let t = 0; t < TEMPS; t++) {
    const rng = mulberry(20250825 + t * 7919)
    const managers = montaSala(rng)
    let st = { ...INITIAL, seed: (900000 + t * 6151) >>> 0, sport: 'futebol', onlineMode: 'online',
      careerOnline: false, screen: 'cerimonia', managers }
    st = reducer(st, { type: 'FINISH_CEREMONY' })

    // ranking de FORÇA logo depois do pregão (antes de qualquer bola rolar)
    const forcas = st.managers.map(m => ({ id: m.id, f: forca(m.squad) })).sort((a, b) => b.f - a.f)
    const rankForca = new Map(forcas.map((x, i) => [x.id, i + 1]))

    let liderDesde = null, liderAtual = null
    const rodadas = st.fixtures.length
    for (let r = 0; r < rodadas; r++) {
      st = reducer(st, { type: 'PLAY_ROUND' })
      for (const res of st.lastResults ?? []) { somaJogos++; if (Math.abs(res.hg - res.ag) >= 3) somaGolgoleada++ }
      const tab = [...st.league].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      if (tab[0].id !== liderAtual) { liderAtual = tab[0].id; liderDesde = r + 1 }
    }
    const tabFinal = [...st.league].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
    const campeao = tabFinal[0]
    const rankFinal = new Map(tabFinal.map((x, i) => [x.id, i + 1]))
    for (const x of tabFinal) if (rankForca.has(x.id)) posPorForca.push([rankForca.get(x.id), rankFinal.get(x.id)])

    if (rankForca.get(campeao.id) === 1) campeaoEraOMaisForte++
    if (rankForca.get(campeao.id) <= 3) acertoDoLeilao++
    if (campeao.id >= HUMANOS) campeaoBot++
    somaRodadaDecidiu += liderDesde ?? rodadas
    somaGapCampeao += campeao.pts - (tabFinal[1]?.pts ?? campeao.pts)
    temporadas++
  }

  // correlação simples entre rank de força e rank final (1 = o leilão decide tudo)
  const n = posPorForca.length
  const mx = posPorForca.reduce((s, p) => s + p[0], 0) / n
  const my = posPorForca.reduce((s, p) => s + p[1], 0) / n
  let num = 0, dx = 0, dy = 0
  for (const [x, y] of posPorForca) { num += (x - mx) * (y - my); dx += (x - mx) ** 2; dy += (y - my) ** 2 }
  const corr = num / Math.sqrt(dx * dy)

  console.log('SIM raio-x ok')
  return {
    temporadas, humanos: HUMANOS,
    correlacaoLeilaoXTabela: +corr.toFixed(3),
    campeaoEraOMaisForte: +(campeaoEraOMaisForte * 100 / temporadas).toFixed(1),
    campeaoNoTop3DeForca: +(acertoDoLeilao * 100 / temporadas).toFixed(1),
    campeaoFoiBot: +(campeaoBot * 100 / temporadas).toFixed(1),
    rodadaEmQueOLiderNaoMudaMais: +(somaRodadaDecidiu / temporadas).toFixed(1),
    pctJogosDecididosPor3Gols: +(somaGolgoleada * 100 / somaJogos).toFixed(1),
    folgaDoCampeaoEmPontos: +(somaGapCampeao / temporadas).toFixed(1),
  }
}, [TEMPS, HUMANOS])

await browser.close()
writeFileSync(SAIDA, JSON.stringify(rel, null, 2))
console.log(`\n══════ 🔬 RAIO-X DO RÁPIDO ONLINE · ${rel.temporadas} temporadas · ${rel.humanos} humanos ══════`)
console.log(`🎯 o leilão explica a tabela (0 = nada, 1 = tudo) ....... ${rel.correlacaoLeilaoXTabela}`)
console.log(`🏆 o time MAIS FORTE do pregão foi campeão ............. ${rel.campeaoEraOMaisForte}% das vezes`)
console.log(`🥇 o campeão saiu do TOP 3 de força do pregão .......... ${rel.campeaoNoTop3DeForca}%`)
console.log(`⏱️ rodada em que o líder assume e não larga mais ....... ${rel.rodadaEmQueOLiderNaoMudaMais}ª de 38`)
console.log(`📏 folga do campeão pro vice .......................... ${rel.folgaDoCampeaoEmPontos} pontos`)
console.log(`😴 jogos decididos por 3+ gols ........................ ${rel.pctJogosDecididosPor3Gols}%`)
console.log(`🤖 a taça ficou com um ROBÔ ........................... ${rel.campeaoFoiBot}%`)
console.log(`\n📄 ${SAIDA}`)
