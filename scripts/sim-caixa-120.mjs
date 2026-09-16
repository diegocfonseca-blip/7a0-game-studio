// ─── 💰 SIMULAÇÃO DE CAIXA — 120 TEMPORADAS DA VÁRZEA À SÉRIE A ─────────────
//
// Pedido do Diego (16/09): *"faça uma simulação de 120 temporadas começando na
// várzea. Time de 11 jogadores misturados em foi profissional e bom jogador.
// Quero que me fale no final de toda simulação como ficou seu time e
// principalmente CAIXA. Porque muita gente reclama do caixa depois que fizemos
// salário, renovação de contrato e agora a condição física que faz machucar
// jogador. Analise todas premiações de campeonatos, jogadores, patrocínios,
// venda de camisa, bicos, cota de TV, participação em campeonatos... e veja se
// temos que aumentar mais valores de algumas coisas. E me fale, com base em cada
// divisão, o sufoco e etc."*
//
// ⚠️ NADA AQUI É CHUTADO. Todo número sai das funções REAIS do jogo, importadas
// do código que roda no celular do jogador:
//   · liga/pirâmide  → buildPyramid · simulatePyramid · computePromotions
//   · prêmios        → seasonRewards · scorerRewards · copaRewards ·
//                      sponsorBetRewards · torcidaBonusRewards
//   · cota de TV     → TV_COTA (store.tsx)
//   · Master         → masterPorTemporada (estadiodata.ts)
//   · fornecedor     → fornPorTemporada (loja.ts)
//   · bico           → bicoValor / bicoElegivel (bico.ts)
//   · camisas        → calculaVendas (loja.ts)
//   · bilheteria     → stadiumIncomeAt · stadiumOccupancy (estadiodata.ts)
//   · folha          → salaryOfCard / squadPayroll (store.tsx) = preço ÷ 10
//   · renovação      → renewCost / renewOptions (store.tsx)
//   · cansaço/lesão  → gasDoElenco · estadoGas · sorteiaLesaoDesgaste (condicao.ts)
//
// 🔌 COMO RODA: o motor é TypeScript dentro do app, então uso o vite + o Chromium
// (mesmo truque dos mockups e do sim-250). ⚠️ `screens.tsx` TEM que ser importado
// ANTES de `pyramidseason.tsx`: existe um ciclo de import entre pyramidseason e
// copa-brasil, e importar a pirâmide direto estoura
// "Cannot access 'COPA_LEG_MS' before initialization".
//
//   npm run dev   (noutro terminal)
//   node scripts/sim-caixa-120.mjs [--temporadas 120] [--saida /tmp/caixa.json]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '120'))
const SAIDA = arg('--saida', '/tmp/sim-caixa-120.json')
const ELENCO_ALVO = Number(arg('--elenco', '11'))   // tamanho do elenco COM o gás ligado (11 = como o Diego pediu, sem banco)
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)   // o vite recarrega sozinho (HMR); espera a poeira baixar

const rel = await page.evaluate(async ([TEMPS, ELENCO_ALVO_COM_BANCO]) => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')            // 🔁 quebra o ciclo de import (ver cabeçalho)
  const P = await import(B + 'pyramidseason.tsx')
  const S = await import(B + 'store.tsx')
  const E = await import(B + 'estadiodata.ts')
  const L = await import(B + 'loja.ts')
  const BI = await import(B + 'bico.ts')
  const C = await import(B + 'condicao.ts')
  const D = await import(B + 'data.ts')

  const { buildPyramid, simulatePyramid, computePromotions, seasonRewards, scorerRewards,
          sponsorBetRewards, seedCpuSquads, DIVS } = P
  const { TV_COTA, salaryOfCard, renewCost, renewOptions } = S
  const { masterPorTemporada, stadiumIncomeAt, stadiumOccupancy, STADIUM_SECTORS, STADIUM_EXTRAS } = E
  const { fornPorTemporada, calculaVendas } = L
  const { bicoValor, bicoElegivel } = BI
  const { gasDoElenco, estadoGas, sorteiaLesaoDesgaste, modsDoElenco, GAS_JOGO } = C

  const ROUNDS = 38
  const SEED = 424242
  const ORDEM = ['V', 'D', 'C', 'B', 'A']
  const acima = (a, b) => ORDEM.indexOf(a) > ORDEM.indexOf(b)   // a é divisão MAIS ALTA que b

  // ── 👥 O ELENCO INICIAL: 11 cartas "foi profissional" (fame 1) + "bom jogador"
  //    (fame 2-3), sem promessa — que é EXATAMENTE o que a escada libera na Várzea
  //    (`escadaAllows('V', c)` no store). Uma por posição, do mais barato pro mais
  //    caro, como quem começa do zero monta.
  // ⚠️ CATALOG é Record<Sector, C[]>, não lista chapada — e a CARREIRA usa o
  //    CATALOG_BOTH (BR + Europa + Mundo), não só o brasileiro.
  const FONTE = D.CATALOG_BOTH ?? D.CATALOG
  const porPos = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const k in porPos) {
    porPos[k] = (FONTE[k] ?? []).filter(c => !c.fake && (c.fame ?? 1) <= 3 && !c.promessa)
      .map(c => ({ ...c, pos: k }))
      .sort((a, b) => (a.lo ?? 0) - (b.lo ?? 0))
  }
  const MOLDE = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA'] // 4-4-2
  const START_MONEY = 100   // 💰 o que a carreira nova dá de bolso (store.tsx)
  let uid = 0
  const usados = new Set()
  const mid = c => ((c.lo ?? 1) + (c.hi ?? 2)) / 2
  const ident = c => `${c.name}|${c.club}|${c.year}`
  const embaralha = (arr, rnd) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

  // 🪜 a escada diz QUEM cada divisão negocia (escadaAllows, no store)
  const poolDaDiv = (d, pos) => {
    const todos = (FONTE[pos] ?? []).filter(c => !c.fake).map(c => ({ ...c, pos }))
    if (d === 'V') return todos.filter(c => !c.promessa && (c.fame ?? 1) <= 3)
    if (d === 'D') return todos.filter(c => c.promessa || ((c.fame ?? 1) >= 2 && (c.fame ?? 1) <= 3))
    if (d === 'C' || d === 'B') return todos.filter(c => c.promessa || (!c.promessa && (c.fame ?? 1) === 4))
    return todos.filter(c => !c.promessa && (c.fame ?? 1) >= 4)
  }

  // ── 🥅 UM TIME DE VÁRZEA DE VERDADE ────────────────────────────────────────
  // ⚠️ ESTE ERA O ERRO DA 1ª VERSÃO. Eu montava o elenco pegando A MELHOR carta
  //    de cada posição dentro do degrau da Várzea — e "a melhor foi-profissional
  //    do catálogo inteiro" é um monstro: o top-11 do degrau V tem média 84,
  //    enquanto a MEDIANA dos times da Série D é 58,8. Resultado: o time ganhava
  //    a Várzea, a D, a C e a B seguidas e chegava na Série A em 5 temporadas —
  //    justamente fugindo das divisões que o Diego quer medir.
  //    O jogo NÃO monta assim. O `makeBotSquad` (store.tsx) monta por SORTEIO,
  //    com uma proporção de categoria por força do time:
  //      fraco 55% foi-profissional · médio 40% · forte 22% (o resto, bom jogador)
  //    Aqui é a mesma receita — e o meu time entra como MÉDIO, que é o que o
  //    Diego pediu: "misturados em foi profissional e bom jogador".
  const montaVarzea = (rnd, tier) => {
    const foiRate = tier === 'strong' ? 0.22 : tier === 'weak' ? 0.55 : 0.40
    const sq = []
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      const need = MOLDE.filter(p => p === pos).length
      const livres = embaralha(poolDaDiv('V', pos).filter(c => !usados.has(ident(c))), rnd)
      const foi = livres.filter(c => (c.fame ?? 1) === 1)
      const bom = livres.filter(c => (c.fame ?? 1) === 2 || (c.fame ?? 1) === 3)
      const nFoi = Math.round(need * foiRate)
      let picks = [...foi.slice(0, nFoi), ...bom.slice(0, need - nFoi)]
      if (picks.length < need) for (const c of [...bom.slice(need - nFoi), ...foi.slice(nFoi)]) { if (picks.length >= need) break; picks.push(c) }
      for (const c of picks) { usados.add(ident(c)); sq.push({ ...c, pos, id: `c${uid++}` }) }
    }
    return sq
  }

  /** compra um reforço do degrau da divisão — por SORTEIO entre os bons daquele
   *  degrau (não "o melhor do catálogo"), pagando o que a fatia do bolso permite.
   *  O preço vira SALÁRIO (÷10) e base da RENOVAÇÃO. */
  const compra = (d, pos, fatia, rnd) => {
    const livres = poolDaDiv(d, pos).filter(c => !usados.has(ident(c)))
    if (!livres.length || fatia < 1) return null
    // sorteia entre o terço de cima do degrau (é o que um time competitivo caça)
    const ord = livres.sort((a, b) => mid(b) - mid(a))
    const c = ord[Math.floor((rnd ? rnd() : 0.2) * Math.max(1, Math.floor(ord.length / 3)))]
    if (!c) return null
    usados.add(ident(c))
    return { ...c, id: `me${uid++}`, paid: Math.max(1, Math.round(Math.min(mid(c), fatia))), contratoAte: 0 }
  }

  // 🎲 sorteio do mundo (fixo pela semente, pra a simulação ser repetível)
  const rndMundo = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296 })(SEED)

  // ── O MEU TIME: várzea, tier MÉDIO (misturado, como ele pediu)
  const squad = montaVarzea(rndMundo, 'mid')
  {
    // divide as 100 moedas do bolso entre as 11 cartas (o leilão nunca passa disso)
    const total = squad.reduce((n, c) => n + mid(c), 0)
    for (const c of squad) c.paid = Math.max(1, Math.round(START_MONEY * mid(c) / total))
  }

  // ── 🏟️ A VÁRZEA PRECISA DE ADVERSÁRIOS ────────────────────────────────────
  // ⚠️ O OUTRO ERRO DA 1ª VERSÃO. `buildCpuSquads` só gera times de fundo pra
  //    A/B/C/D — a VÁRZEA é preenchida pelos MANAGERS (você + os rivais de CPU do
  //    leilão). Passando só `{ m0: 'V' }` eu era o ÚNICO time da Várzea: ganhava
  //    sozinho, com 0 adversários, e subia na primeira temporada. Por isso a
  //    Várzea "não aparecia" na simulação, que foi o que o Diego pegou.
  //    Agora entram 19 rivais, com a mesma mistura de tiers do jogo.
  const TIERS = ['weak', 'weak', 'weak', 'weak', 'weak', 'weak', 'mid', 'mid', 'mid', 'mid',
                 'mid', 'mid', 'mid', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong']
  const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false,
                      formation: '4-4-2', money: 0, squad }]
  TIERS.forEach((tier, i) => {
    managers.push({ id: i + 1, name: `Rival ${i + 1}`, teamName: `Várzea FC ${i + 1}`, isHuman: false,
                    auctionRival: true, formation: '4-4-2', money: 0, squad: montaVarzea(rndMundo, tier) })
  })

  // ── 🎲 aleatório determinístico (mesma família do motor)
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }

  // ── 🏟️ estádio do técnico (o mesmo formato do save: { inv, ext })
  const st = { inv: {}, ext: [] }
  const setorPronto = k => (st.inv[k] ?? 0) >= (STADIUM_SECTORS.find(s => s.k === k)?.cost ?? 1e9)
  const setoresProntos = () => STADIUM_SECTORS.filter(s => setorPronto(s.k)).length
  const temExtra = k => st.ext.includes(k)
  // a ordem em que um técnico sensato constrói: os 2 setores baratos → LOJA (que
  // destrava venda de camisa + fornecedor de material) → o resto por custo.
  const PLANO_OBRA = [
    { tipo: 'setor', k: 'grama' }, { tipo: 'setor', k: 'geral' },
    { tipo: 'extra', k: 'loja' },
    { tipo: 'setor', k: 'cadeiras' }, { tipo: 'extra', k: 'refl' }, { tipo: 'extra', k: 'telao' },
    { tipo: 'extra', k: 'estac' }, { tipo: 'setor', k: 'visitante' }, { tipo: 'extra', k: 'praca' },
    { tipo: 'extra', k: 'chopp' }, { tipo: 'setor', k: 'camarote' }, { tipo: 'extra', k: 'estacao' },
    { tipo: 'extra', k: 'cober' },
  ]

  // ── 💼 estado financeiro e contratual
  let caixa = 0
  let div = 'V'
  // 🌱 a carreira NOVA nasce na VÁRZEA (escada ligada). Sem semear isto, o
  //    buildPyramid cai no mundo SEM Várzea e joga o técnico direto na Série D —
  //    foi o que aconteceu na 1ª rodada desta simulação.
  let placements = null   // semeado logo abaixo, com a pirâmide inteira
  let cpuSquads = undefined
  let master = null          // { div, anos, desde }
  let forn = null            // { div, anos, desde }
  const carry = {}           // cansaço que ATRAVESSA temporadas: id → { g, j }
  // 😓 O GÁS SÓ LIGA AO CHEGAR NA SÉRIE C — e daí não desliga mais (regra fechada
  //    do Diego, 12/09: *"a condição física não libera de cara. Ele precisa
  //    primeiro chegar na Série C pra desbloquear pra sempre"*). Na Várzea e na D
  //    ninguém cansa, e é por isso que a subida inicial é mais fácil que parece.
  let gasLigado = false
  const hist = []
  const porDiv = {}          // div → acumuladores
  const rngGeral = mulberry(SEED ^ 0xBEEF)
  // 🌱 a colocação inicial: TODOS os managers na Várzea e os times de fundo nas
  //    divisões deles — é o que o START faz no store (divsDeFundo + DIVISION_TEAMS).
  placements = {}
  for (const m of managers) placements[`m${m.id}`] = 'V'

  const chave = c => `${c.name}|${c.club}|${c.year}`
  const somaDiv = (d, campo, v) => {
    porDiv[d] = porDiv[d] ?? { temporadas: 0, receita: 0, despesa: 0, linhas: {}, caixaFim: [], lesoes: 0, posSoma: 0 }
    if (campo) porDiv[d].linhas[campo] = (porDiv[d].linhas[campo] ?? 0) + v
  }

  for (let t = 1; t <= TEMPS; t++) {
    const rng = mulberry((SEED ^ Math.imul(t, 2654435761)) >>> 0)
    const rec = {}   // receitas desta temporada
    const des = {}   // despesas desta temporada
    const addR = (k, v) => { if (v) { rec[k] = (rec[k] ?? 0) + v; caixa += v } }
    const addD = (k, v) => { if (v) { des[k] = (des[k] ?? 0) + v; caixa -= v } }

    // ══════════ 1. COMEÇO DA TEMPORADA: os 3 contratos fixos ══════════
    // (ordem do Diego 15/09: Master, fornecedor e bico pagam ao APERTAR começar)
    if (!master || t >= master.desde + master.anos) master = { div, anos: 5, desde: t } // assina o mais longo
    addR('master', masterPorTemporada(master.div ?? div, master.anos))
    if (temExtra('loja')) {
      if (!forn || t >= forn.desde + forn.anos) forn = { div, anos: 5, desde: t }
      addR('fornecedor', fornPorTemporada(forn.div ?? div, forn.anos))
    }
    if (bicoElegivel(t, div)) addR('bico', bicoValor(div, false))
    addR('cotaTV', TV_COTA[div] ?? 0)

    // ══════════ 2. A TEMPORADA ══════════
    const world = buildPyramid(managers, 0, SEED, 'br', placements, cpuSquads)
    const seasonSeed = (SEED ^ Math.imul(t, 2654435761)) >>> 0
    // 😓 o cansaço PIORA a carta dentro do motor (comMods soma o mod em lo/hi).
    //    Sem passar `cardMods` a simulação roda como se ninguém cansasse — foi o
    //    que aconteceu na 1ª versão: o time subia de V até A em 5 temporadas com
    //    o elenco inteiro em 🚑, porque o desgaste não chegava no campo.
    const inicioG = {}, inicioJ = {}
    for (const c of squad) { const k = carry[chave(c)]; if (k) { inicioG[c.id] = k.g; inicioJ[c.id] = k.j } }
    // 🔁 RODÍZIO: com banco, quem está mais INTEIRO joga (é o que o rodízio
    //    automático do preparador faz). Com 11 exatos não existe rodízio — os
    //    mesmos 11 jogam as 38 rodadas, e é por isso que eles afundam.
    const byRound = {}
    {
      const gAtual = {}
      for (const c of squad) gAtual[c.id] = inicioG[c.id] ?? 100
      for (let r = 0; r < ROUNDS; r++) {
        const ordem = [...squad].sort((a, b) => (gAtual[b.id] ?? 100) - (gAtual[a.id] ?? 100))
        const xi = ordem.slice(0, 11)
        byRound[r] = xi.map(c => c.id)
        const dentro = new Set(byRound[r])
        for (const c of squad) gAtual[c.id] = Math.round((dentro.has(c.id) ? Math.max(0, gAtual[c.id] - 1.4) : Math.min(100, gAtual[c.id] + 4)) * 10) / 10
      }
    }
    const XI0 = squad.slice(0, 11)
    const condMods = gasLigado
      ? { 0: modsDoElenco(byRound, ROUNDS, squad, r => (byRound[r] ?? []), null, t, 0, inicioG) }
      : {}
    const live = simulatePyramid(world, seasonSeed, ROUNDS, {}, {}, 1.12, true, true, {}, {}, {}, undefined, condMods)
    let minhaDiv = null, pos = null
    for (const d of DIVS) { const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0); if (i >= 0) { minhaDiv = d; pos = i + 1 } }
    minhaDiv = minhaDiv ?? div

    // ══════════ 3. CANSAÇO E LESÕES (condicao.ts, com o carry da carreira) ══════════
    // Com 11 jogadores NÃO EXISTE banco: os 11 jogam as 38 rodadas, toda rodada.
    // lesões: o motor joga UM DADO POR TITULAR CANSADO, toda rodada — e só conta
    // depois que o gás ligou (Série C pra cima)
    let lesoes = 0
    if (gasLigado) for (let r = 0; r < ROUNDS; r++) {
      const gasR = gasDoElenco(byRound, r, squad, 0, inicioG)
      const l = sorteiaLesaoDesgaste({ seed: seasonSeed, seasonNo: t, round: r, xi: (byRound[r] ?? []).map(id => squad.find(c => c.id === id)).filter(Boolean), gas: gasR })
      if (l) lesoes++
    }
    const gasFim = gasLigado ? gasDoElenco(byRound, ROUNDS, squad, 0, inicioG) : {}
    if (gasLigado) for (const c of squad) {
      carry[chave(c)] = { g: Math.round(gasFim[c.id] ?? 100), j: (inicioJ[c.id] ?? 0) + ROUNDS }
    }
    // 🔓 chegou na C? liga o gás PRA SEMPRE (a partir da PRÓXIMA temporada, que é
    //    como a regra cai: o desbloqueio acontece ao CHEGAR na divisão)
    if (!gasLigado && (minhaDiv === 'C' || minhaDiv === 'B' || minhaDiv === 'A')) gasLigado = true
    const estados = squad.map(c => estadoGas(gasFim[c.id] ?? 100))
    const nosVermelhos = estados.filter(e => e === 'limite' || e === 'esgotado').length

    // ══════════ 4. PRÊMIOS ══════════
    addR('premios', seasonRewards(live.tables)[0] ?? 0)
    addR('artilheiro', scorerRewards(live.divTop).rewards[0] ?? 0)
    // 🤝 Pontual: a aposta que quase todo mundo faz é a do nível 1 ("não cair")
    const bets = { 0: { tier: 1, brandId: 'padaria', season: t } }
    addR('pontual', sponsorBetRewards(live.tables, bets, null, undefined).rewards[0] ?? 0)

    // ══════════ 5. BILHETERIA E CAMISAS ══════════
    const occ = stadiumOccupancy(pos ?? 20, st)
    addR('bilheteria', stadiumIncomeAt(st, occ, temExtra('loja')))
    if (temExtra('loja')) {
      // preço 'normal' é o PRECO_PADRAO da loja; o bônus do fornecedor sai do
      // contrato de material (FORNECEDORES[].loja), aqui o do meio: +10%
      const v = calculaVendas({ st, pos: pos ?? 20, preco: 'normal', fornLoja: forn ? 0.10 : 0 })
      addR('camisas', v.moedas)
    }

    // ══════════ 6. FOLHA (a partir da T4, regra do chargeSalaries) ══════════
    if (t >= 4) addD('folha', squad.reduce((n, c) => n + salaryOfCard(c), 0))

    // ══════════ 7. RENOVAÇÕES ══════════
    // contrato sorteado 5-10 temporadas na chegada; vencendo, renova por 5 anos
    // se a caixa aguentar (é o que um técnico cuidadoso faz pra não perder o time).
    let gastoRenov = 0
    for (const c of squad) {
      if (!c.contratoAte) c.contratoAte = t + 5 + Math.floor(rng() * 6)
      if (c.contratoAte > t) continue
      const oficial = Math.max(1, Math.round(c.paid ?? 1))
      const opts = renewOptions(oficial)
      const anos = opts.includes(5) ? 5 : (opts[opts.length - 1] ?? 1)
      const custo = renewCost(oficial, anos)
      if (custo <= Math.max(0, caixa) - gastoRenov) { gastoRenov += custo; c.contratoAte = t + anos }
      else c.contratoAte = t + 1   // não deu: segura mais um ano no sufoco (perderia o jogador)
    }
    addD('renovacoes', gastoRenov)

    // ══════════ 7b. REFORÇOS E RESERVAS ══════════
    // 💡 É AQUI QUE MORA A PERGUNTA DO DIEGO. Sem esta parte a simulação mente:
    //    o técnico terminava com 3 mil moedas porque nunca comprava ninguém, e
    //    a folha ficava congelada em 11 a vida toda. Na vida real ele reforça —
    //    e cada reforço é preço no leilão HOJE + salário (preço ÷ 10) PRA SEMPRE.
    //    Duas compras, por motivos diferentes:
    //      a) SUBIR DE NÍVEL: ao trocar de divisão a escada libera categoria nova
    //         (promessa → craque → lenda) e o elenco velho não compete mais.
    //      b) BANCO: com o gás ligado, 11 jogadores não aguentam 38 rodadas.
    //         Sem reserva o time inteiro vira 🚑 e não sai mais de lá.
    let gastoReforco = 0
    {
      const RESERVA_CAIXA = 40
      const alvo = gasLigado ? ELENCO_ALVO_COM_BANCO : 11
      // (b) completa o banco
      while (squad.length < alvo) {
        const sobra = caixa - gastoReforco - RESERVA_CAIXA
        if (sobra < 5) break
        const falta = MOLDE[squad.length % MOLDE.length]
        const c = compra(minhaDiv, falta, Math.min(sobra, 40), rng)
        if (!c) break
        squad.push(c); gastoReforco += c.paid
      }
      // (a) troca os 3 piores titulares por gente do degrau da divisão de hoje
      const ordem = [...squad].sort((a, b) => mid(a) - mid(b))
      for (const velho of ordem.slice(0, 3)) {
        const sobra = caixa - gastoReforco - RESERVA_CAIXA
        if (sobra < 10) break
        const novo = compra(minhaDiv, velho.pos, Math.min(sobra, 60), rng)
        if (!novo) break
        if (mid(novo) <= mid(velho) * 1.15) continue   // não troca por igual
        squad[squad.indexOf(velho)] = novo
        gastoReforco += novo.paid
      }
    }
    addD('reforcos', gastoReforco)

    // ══════════ 8. OBRA NO ESTÁDIO (só com folga; guarda uma reserva) ══════════
    const RESERVA = 30
    let gastoObra = 0
    for (const o of PLANO_OBRA) {
      const sobra = caixa - gastoObra - RESERVA
      if (sobra <= 0) break
      if (o.tipo === 'setor') {
        if (setorPronto(o.k)) continue
        const sec = STADIUM_SECTORS.find(s => s.k === o.k)
        const falta = sec.cost - (st.inv[o.k] ?? 0)
        const paga = Math.min(falta, sobra)
        st.inv[o.k] = (st.inv[o.k] ?? 0) + paga; gastoObra += paga
        if (paga < falta) break
      } else {
        if (temExtra(o.k)) continue
        const ex = STADIUM_EXTRAS.find(e => e.k === o.k)
        if (o.k === 'loja' && setoresProntos() < 2) continue
        if (o.k === 'estac' && !temExtra('loja')) continue
        if (o.k === 'praca' && !temExtra('loja')) continue
        if (o.k === 'chopp' && !temExtra('praca')) continue
        if (o.k === 'estacao' && !temExtra('estac')) continue
        if (o.k === 'cober' && setoresProntos() < 4) continue
        if (ex.cost > sobra) break
        st.ext.push(o.k); gastoObra += ex.cost
      }
    }
    addD('obras', gastoObra)

    // ══════════ 9. VIRADA ══════════
    const novo = computePromotions(live.tables)
    const novaDiv = novo['m0'] ?? minhaDiv
    const subiu = acima(novaDiv, minhaDiv), caiu = acima(minhaDiv, novaDiv)

    const receita = Object.values(rec).reduce((a, b) => a + b, 0)
    const despesa = Object.values(des).reduce((a, b) => a + b, 0)
    hist.push({ t, div: minhaDiv, pos, caixa, receita, despesa, saldo: receita - despesa,
                rec: { ...rec }, des: { ...des }, lesoes, nosVermelhos,
                elenco: squad.length,
                gasMedio: Math.round(squad.reduce((n, c) => n + (gasFim[c.id] ?? 100), 0) / squad.length * 10) / 10,
                folha: des.folha ?? 0, subiu, caiu, novaDiv,
                estadio: { setores: setoresProntos(), extras: st.ext.length, loja: temExtra('loja') } })

    const P2 = porDiv[minhaDiv] = porDiv[minhaDiv] ?? { temporadas: 0, receita: 0, despesa: 0, linhas: {}, caixaFim: [], lesoes: 0, posSoma: 0, saldoNeg: 0 }
    P2.temporadas++; P2.receita += receita; P2.despesa += despesa; P2.lesoes += lesoes; P2.posSoma += (pos ?? 20)
    P2.caixaFim.push(caixa); if (receita - despesa < 0) P2.saldoNeg++
    for (const k in rec) P2.linhas[k] = (P2.linhas[k] ?? 0) + rec[k]
    for (const k in des) P2.linhas['-' + k] = (P2.linhas['-' + k] ?? 0) + des[k]

    div = novaDiv
    placements = novo
    if (!cpuSquads) cpuSquads = seedCpuSquads(managers, SEED, 'br', false)
    if (t % 20 === 0) console.log(`SIM · T${t} ${minhaDiv}${pos}º · caixa ${caixa} · folha ${des.folha ?? 0} · lesões ${lesoes}`)
  }

  return { hist, porDiv, elencoFinal: squad.map(c => ({ nome: c.name, pos: c.pos, fame: c.fame, preco: c.paid,
             salario: salaryOfCard(c), gas: carry[chave(c)]?.g, jogos: carry[chave(c)]?.j, contratoAte: c.contratoAte })),
           caixaFinal: caixa, estadio: { inv: st.inv, ext: st.ext } }
}, [TEMPS, ELENCO_ALVO])

writeFileSync(SAIDA, JSON.stringify(rel, null, 1))
console.log(`\n💾 ${SAIDA}`)
await browser.close()
