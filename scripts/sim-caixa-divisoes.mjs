// ─── 💰 O SUFOCO DIVISÃO POR DIVISÃO — quanto entra e quanto sai em cada série ─
//
// Companheiro do `sim-caixa-120.mjs`. Enquanto aquele segue UMA carreira subindo,
// este responde a outra metade da pergunta do Diego: *"me fale, com base em cada
// divisão, o sufoco e etapa"*.
//
// Aqui um time FICA na divisão e a gente lê a conta dele. Todos os valores saem
// das funções REAIS do jogo (mesmos imports do outro script). O que varia é onde
// ele termina o campeonato — porque quase toda receita do jogo depende disso:
//   · campeão (1º) · zona de acesso (2º-4º) · meio de tabela (10º) · rebaixado (18º)
//
// Roda com o vite de pé:  node scripts/sim-caixa-divisoes.mjs
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', '/tmp/sim-caixa-divisoes.json')
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

const rel = await page.evaluate(async () => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')       // 🔁 quebra o ciclo de import (ver sim-caixa-120)
  const S = await import(B + 'store.tsx')
  const E = await import(B + 'estadiodata.ts')
  const L = await import(B + 'loja.ts')
  const BI = await import(B + 'bico.ts')

  const { TV_COTA, renewCost } = S
  const { masterPorTemporada, stadiumIncomeAt, stadiumOccupancy, sponsorBetValue,
          STADIUM_SECTORS, STADIUM_EXTRAS } = E
  const { fornPorTemporada, calculaVendas } = L
  const { bicoValor, bicoElegivel } = BI

  // os mesmos números da tabela de prêmios do pyramidseason (seasonRewards)
  const CAMPEAO = { A: 65, B: 50, C: 35, D: 20, V: 15 }
  const ZONA = { A: 30, B: 25, C: 20, D: 15, V: 10 }
  const QUEDA = { A: 20, B: 15, C: 10, D: 0, V: 0 }

  // 🏟️ três estádios de referência, porque a receita muda MUITO com a obra:
  const estadios = {
    zerado: { inv: {}, ext: [] },
    meio: { inv: { grama: 60, geral: 60, cadeiras: 90 }, ext: ['loja', 'refl'] },
    completo: {
      inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])),
      ext: STADIUM_EXTRAS.map(e => e.k),
    },
  }

  const CENARIOS = [
    { k: 'campeao', pos: 1, rot: 'campeão' },
    { k: 'acesso', pos: 3, rot: 'zona de acesso (3º)' },
    { k: 'meio', pos: 10, rot: 'meio de tabela (10º)' },
    { k: 'caiu', pos: 18, rot: 'rebaixado (18º)' },
  ]

  const out = {}
  for (const div of ['V', 'D', 'C', 'B', 'A']) {
    out[div] = { cenarios: {}, master: {}, forn: {} }
    // 🏆 o Master por prazo — é aqui que mora a ARMADILHA do contrato longo:
    // o valor CONGELA na divisão em que foi assinado (masterValor no store).
    for (const anos of [1, 2, 3, 5]) out[div].master[anos] = masterPorTemporada(div, anos)
    for (const anos of [1, 2, 3, 5]) out[div].forn[anos] = fornPorTemporada(div, anos)

    for (const c of CENARIOS) {
      const linha = {}
      linha.cotaTV = TV_COTA[div] ?? 0
      linha.premios = (c.pos === 1 ? CAMPEAO[div] : 0) + (c.pos <= 4 ? ZONA[div] : 0) - (c.pos >= 17 ? QUEDA[div] : 0)
      // 🤝 Pontual: nível 1 = "não cair" (bate até o 16º) · 2 = top4 · 3 = campeão
      linha.pontual_n1 = c.pos <= 16 ? sponsorBetValue(div, 1) : 0
      linha.pontual_n2 = c.pos <= 4 ? sponsorBetValue(div, 2) : 0
      linha.pontual_n3 = c.pos === 1 ? sponsorBetValue(div, 3) : 0
      linha.bico = bicoElegivel(5, div) ? bicoValor(div, false) : 0
      linha.master_3anos = masterPorTemporada(div, 3)
      for (const [nome, st] of Object.entries(estadios)) {
        const occ = stadiumOccupancy(c.pos, st)
        linha['bilheteria_' + nome] = stadiumIncomeAt(st, occ, st.ext.includes('loja'))
        linha['camisas_' + nome] = st.ext.includes('loja')
          ? calculaVendas({ st, pos: c.pos, preco: 'normal', fornLoja: 0.10 }).moedas : 0
        linha['torcida_' + nome] = st.ext.includes('loja')
          ? calculaVendas({ st, pos: c.pos, preco: 'normal', fornLoja: 0.10 }).torcida : 0
      }
      linha.fornecedor_3anos = fornPorTemporada(div, 3)
      out[div].cenarios[c.k] = { rot: c.rot, pos: c.pos, linhas: linha }
    }
  }

  // 💸 QUANTO CUSTA UM ELENCO: folha = preço ÷ 10 por carta, e a renovação sai da
  //    tabela real. Aqui pra três tamanhos de elenco × três níveis de investimento.
  const custos = {}
  for (const elenco of [11, 16, 22]) {
    custos[elenco] = {}
    for (const precoMedio of [8, 20, 40, 80]) {
      const folha = elenco * Math.round(precoMedio / 10)
      // renovação: por temporada vence ~1/5 do elenco (contratos de ~5 anos)
      const renovAno = Math.round((elenco / 5) * renewCost(precoMedio, 5))
      custos[elenco][precoMedio] = { folha, renovAno, total: folha + renovAno }
    }
  }
  return { porDivisao: out, custos }
})

writeFileSync(SAIDA, JSON.stringify(rel, null, 1))
console.log(`💾 ${SAIDA}`)
await browser.close()
