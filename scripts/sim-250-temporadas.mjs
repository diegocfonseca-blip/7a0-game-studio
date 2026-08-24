// ─── 🔬 SIMULAÇÃO DE 250 TEMPORADAS — caça a ideias (Diego 24/08) ────────────
//
// Pedido dele: *"o jogo tá meio monótono. Preciso que você faça uma simulação por
// 250 temporadas em busca de ideias novas pro jogo — jogabilidade, resenha,
// criatividade, qualquer coisa além do que eu penso"*.
//
// A ideia aqui NÃO é chutar sugestões: é rodar o MOTOR REAL da carreira por 250
// temporadas e MEDIR onde a emoção morre — o que se repete, o que nunca
// acontece, e onde os números ficam previsíveis. As ideias saem do que os dados
// mostrarem.
//
// Como roda: o motor é TypeScript dentro do app, então uso o vite + um navegador
// (mesmo truque dos mockups) e importo os módulos de verdade. Nada é mockado —
// buildPyramid, simulatePyramid, computePromotions, seasonRewards etc. são as
// mesmas funções que rodam no celular do jogador.
//
//   npm run dev   (noutro terminal)
//   node scripts/sim-250-temporadas.mjs [--temporadas 250] [--saida rel.json]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '250'))
const SAIDA = arg('--saida', 'sim-250.json')
const ELENCO = arg('--elenco', 'forte') // forte | medio | fraco
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
// ⏳ o vite recarrega a página sozinho quando algum arquivo muda (HMR). Espera
// a poeira baixar antes de mandar a simulação, senão o contexto morre no meio.
await page.waitForTimeout(2500)

const relatorio = await page.evaluate(async ([TEMPS, ELENCO]) => {
  const P = await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, computePromotions, seasonRewards, seedCpuSquads, scorerRewards, sponsorBetRewards, torcidaDeltas, DIVS } = P

  // ── o técnico humano: elenco tirado da MESMA receita dos times de CPU, pra
  //    começar com força de time mediano (nem herói nem perna-de-pau).
  const receitas = seedCpuSquads([], 20250824, 'br', false)
  const nomesCpu = Object.keys(receitas)
  // qual elenco o técnico leva: forte (o 1º da lista), médio (meio) ou fraco (o
  // último). Serve pra separar "o jogador é bom" de "a regra empurra pra cima".
  const idx = ELENCO === 'fraco' ? nomesCpu.length - 1 : ELENCO === 'medio' ? Math.floor(nomesCpu.length / 2) : 0
  const meuElenco = receitas[nomesCpu[idx]].map(c => ({ ...c }))
  const managers = [{
    id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false,
    formation: '4-4-2', money: 100, squad: meuElenco,
  }]

  const SEED = 987654321
  let placements = null            // colocações da temporada anterior
  let cpuSquads = undefined        // fichas dos times de fundo (memória de mercado)
  let caixa = 100                  // 🪙 do técnico
  const hist = []                  // uma linha por temporada

  // memória pra medir REPETIÇÃO
  const campeoesPorDiv = {}        // div → { nome: vezes }
  const artilheiros = {}           // nome → vezes artilheiro
  const placaresSeus = {}          // "3x1" → vezes
  const goleadas = { a_favor: 0, contra: 0 }
  let titulosSeus = 0, acessos = 0, quedas = 0, temporadasNaA = 0
  let maiorSequenciaMesmaDiv = 0, sequenciaAtual = 0, divAnterior = null
  let jogosApertados = 0 // decididos por 1 gol ou empate — o termômetro da emoção

  for (let t = 1; t <= TEMPS; t++) {
    const world = buildPyramid(managers, 0, SEED, 'br', placements, cpuSquads)
    const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
    const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)

    // onde EU fiquei
    let minhaDiv = null, minhaPos = null, meuTime = null
    for (const d of DIVS) {
      const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0)
      if (i >= 0) { minhaDiv = d; minhaPos = i + 1; meuTime = live.tables[d][i] }
    }
    const novo = computePromotions(live.tables)
    const rewards = seasonRewards(live.tables)
    const scorer = scorerRewards(live.divTop)
    caixa += (rewards[0] ?? 0) + (scorer.rewards[0] ?? 0)

    // campeões e artilheiros — pra medir repetição do elenco de vencedores
    for (const d of DIVS) {
      const c = live.tables[d]?.[0]
      if (!c) continue
      campeoesPorDiv[d] = campeoesPorDiv[d] ?? {}
      campeoesPorDiv[d][c.name] = (campeoesPorDiv[d][c.name] ?? 0) + 1
    }
    for (const d of DIVS) { const a = live.divTop[d]; if (a) artilheiros[a.name] = (artilheiros[a.name] ?? 0) + 1 }

    // MEUS jogos da temporada (só a última rodada vem em `matches`, então
    // percorro os 38 turnos pra pegar todos os placares meus)
    let meusGols = 0, sofridos = 0, vit = 0, emp = 0, der = 0
    for (let r = 1; r <= 38; r++) {
      const rr = simulatePyramid(world, seasonSeed, r, {}, {}, 1.12, true, true)
      const m = (rr.matches[minhaDiv] ?? []).find(x => x.hId === 0 || x.aId === 0)
      if (!m) continue
      const euCasa = m.hId === 0
      const meu = euCasa ? m.hg : m.ag, dele = euCasa ? m.ag : m.hg
      meusGols += meu; sofridos += dele
      if (meu > dele) vit++; else if (meu === dele) emp++; else der++
      if (Math.abs(meu - dele) <= 1) jogosApertados++
      const chave = `${meu}x${dele}`
      placaresSeus[chave] = (placaresSeus[chave] ?? 0) + 1
      if (meu - dele >= 4) goleadas.a_favor++
      if (dele - meu >= 4) goleadas.contra++
    }

    const novaDiv = novo['m0']
    if (minhaPos === 1) titulosSeus++
    if (novaDiv && DIVS.indexOf(novaDiv) < DIVS.indexOf(minhaDiv)) acessos++
    if (novaDiv && DIVS.indexOf(novaDiv) > DIVS.indexOf(minhaDiv)) quedas++
    if (minhaDiv === 'A') temporadasNaA++
    if (minhaDiv === divAnterior) { sequenciaAtual++; maiorSequenciaMesmaDiv = Math.max(maiorSequenciaMesmaDiv, sequenciaAtual) } else sequenciaAtual = 1
    divAnterior = minhaDiv

    // 📏 folga do campeão pro vice na MINHA divisão (campeonato apertado ou passeio?)
    const tab = live.tables[minhaDiv] ?? []
    const folga = (tab[0]?.pts ?? 0) - (tab[1]?.pts ?? 0)
    hist.push({ t, div: minhaDiv, pos: minhaPos, pts: meuTime?.pts ?? 0, gf: meusGols, ga: sofridos, v: vit, e: emp, d: der, caixa, campeaoA: live.tables.A?.[0]?.name, folgaCampeao: folga, ptsCampeao: tab[0]?.pts ?? 0 })

    placements = novo
    // memória de mercado dos times de fundo (o jogo real guarda; aqui mantenho
    // a receita, que é o comportamento de uma carreira sem mexer no mercado)
    if (!cpuSquads) cpuSquads = seedCpuSquads(managers, SEED, 'br', false)
    if (t % 25 === 0) console.log(`SIM · temporada ${t}/${TEMPS} — ${minhaDiv}${minhaPos}º · caixa ${caixa}`)
  }

  // ── análise ────────────────────────────────────────────────────────────────
  const topRepetidos = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const placaresOrd = Object.entries(placaresSeus).sort((a, b) => b[1] - a[1])
  const totalJogos = placaresOrd.reduce((s, [, n]) => s + n, 0)
  const divsVisitadas = [...new Set(hist.map(h => h.div))]
  const posicoes = hist.map(h => h.pos)
  const media = a => a.reduce((s, x) => s + x, 0) / a.length

  return {
    temporadas: TEMPS,
    minhaCarreira: {
      titulos: titulosSeus, acessos, quedas, temporadasNaSerieA: temporadasNaA,
      divisoesVisitadas: divsVisitadas,
      maiorSequenciaNaMesmaDivisao: maiorSequenciaMesmaDiv,
      posicaoMedia: +media(posicoes).toFixed(2),
      posicaoMin: Math.min(...posicoes), posicaoMax: Math.max(...posicoes),
      caixaFinal: caixa,
      caixaPorTemporada: +(caixa / TEMPS).toFixed(1),
      golsFeitosMedia: +media(hist.map(h => h.gf)).toFixed(1),
      golsSofridosMedia: +media(hist.map(h => h.ga)).toFixed(1),
      vitoriasMedia: +media(hist.map(h => h.v)).toFixed(1),
    },
    emocao: {
      jogosApertados, // <=1 gol de diferença
      pctApertados: +(jogosApertados * 100 / totalJogos).toFixed(1),
      histogramaPosicoes: posicoes.reduce((o, p) => { o[p] = (o[p] ?? 0) + 1; return o }, {}),
      folgaMediaDoCampeao: +media(hist.map(h => h.folgaCampeao)).toFixed(1),
      vezesQueFuiCampeaoComFolgaMaiorQue5: hist.filter(h => h.pos === 1 && h.folgaCampeao > 5).length,
      clubesCampeoesDistintos: Object.fromEntries(DIVS.map(d => [d, Object.keys(campeoesPorDiv[d] ?? {}).length])),
      caixaSempreSubindo: hist.every((h, i) => i === 0 || h.caixa >= hist[i - 1].caixa),
    },
    repeticao: {
      placaresDistintos: placaresOrd.length,
      totalJogos,
      top10Placares: placaresOrd.slice(0, 10).map(([p, n]) => [p, n, `${(n * 100 / totalJogos).toFixed(1)}%`]),
      goleadas,
      campeoesSerieA: topRepetidos(campeoesPorDiv.A ?? {}),
      campeoesSerieD: topRepetidos(campeoesPorDiv.D ?? {}),
      artilheirosMaisRepetidos: topRepetidos(artilheiros),
      artilheirosDistintos: Object.keys(artilheiros).length,
    },
    linhaDoTempo: hist.filter(h => h.t % 10 === 0).map(h => ({ t: h.t, div: h.div, pos: h.pos, caixa: h.caixa })),
    primeiras10: hist.slice(0, 10),
    ultimas10: hist.slice(-10),
  }
}, [TEMPS, ELENCO])

await browser.close()
writeFileSync(SAIDA, JSON.stringify(relatorio, null, 2))
console.log(`\n✅ relatório salvo em ${SAIDA}`)
console.log(JSON.stringify(relatorio.minhaCarreira, null, 2))
console.log(JSON.stringify(relatorio.repeticao, null, 2))
