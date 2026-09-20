// 📊 SIMULAÇÃO Nº2 — O TETO DO BOT PODE SUBIR COM O JOGO?
//
// Pedido do Diego (20/09): *"N quero prender somente a Série A.. Se tem time C
// dinheiro lá embaixo Tb deixe ofertar sim.. Pq isso varia Tb os times e
// divisões sei lá... Simule aí"*.
//
// A pergunta em uma frase: o teto do que o BOT aceita pagar deve seguir o
// BOLSO DAQUELE CLUBE (e o nível da carta) em vez de um número da sala inteira?
//
// ⚠️ HONESTIDADE DA BANCADA: as fórmulas de HOJE são cópias do jogo, com a linha
// de origem anotada. Se mexerem nelas no store.tsx, TEM que mexer aqui — senão
// esta análise mente. Nada aqui altera o jogo: é bancada de teste.
//
// Rodar:  npx tsx scripts/simula-teto.mts

type Div = 'V' | 'D' | 'C' | 'B' | 'A'
const ORDEM: Div[] = ['V', 'D', 'C', 'B', 'A']

// ── cópias fiéis do jogo ────────────────────────────────────────────────────
// store.tsx:1555 — teto do que o mercado aceita pagar, por CATEGORIA da carta
const catPriceCap = (c: Carta): number =>
  c.promessa ? 42 : c.fame >= 5 ? 90 : c.fame === 4 ? 65 : c.fame >= 2 ? 26 : 16
// store.tsx:1564 — fator econômico da SALA: média do caixa de todo mundo, teto 4×
const econSala = (media: number): number => Math.min(4, Math.max(1, 0.5 + media / 150))
// store.tsx:1329 — piso de tabela (valor oficial nunca cai abaixo disso)
const tabela = (c: Carta): number => c.fame >= 5 ? 30 : c.promessa ? 12 : c.fame === 4 ? 20 : c.fame >= 2 ? 8 : 3
// store.tsx:169 — salário = o que foi pago ÷ 10
const salario = (paid: number): number => Math.round(paid / 10)

// pyramidseason.tsx:450 — prêmios; estadiodata/loja — patrocínios
const CAMPEAO: Record<Div, number> = { A: 65, B: 50, C: 35, D: 20, V: 15 }
const ZONA: Record<Div, number> = { A: 30, B: 25, C: 20, D: 15, V: 10 }
const MASTER: Record<Div, number> = { A: 64, B: 32, C: 16, D: 8, V: 4 }
const FORN: Record<Div, number> = { A: 54, B: 27, C: 13, D: 7, V: 4 }
// 🎟️ PROXY de bilheteria+loja+TV+bico (dependem de obras do estádio, não são
// número fixo do código). Se estiver alto/baixo demais muda a VELOCIDADE, não a
// conclusão — que é a relação entre o bolso do clube e o teto do lance.
const RECEITA_ESTADIO: Record<Div, number> = { A: 120, B: 70, C: 40, D: 22, V: 10 }

// ── as três réguas em teste ─────────────────────────────────────────────────
// 🅰️ HOJE: teto = categoria × economia da SALA (média de todos), congela em 4×.
//    Um clube riquíssimo na Série D tem exatamente o mesmo teto de um clube
//    quebrado da Série A — o número não olha pro bolso de ninguém em particular.
// 🅱️ PELO BOLSO: teto = categoria × economia DAQUELE CLUBE, sem congelar em 4×,
//    mas nunca mais que uma FATIA do caixa dele. Time rico da Várzea oferta alto.
// 🅲️ BOLSO + NÍVEL: igual ao 🅱️, e dentro da MESMA categoria a carta mais forte
//    vale mais (craque 86 > craque 80) — hoje os dois valem idêntico.
// 🅳️ BOLSO+NÍVEL+TEMPO: igual ao 🅲️, mas o mercado INFLACIONA com as temporadas
//    (é o "igual no mundo real" que o Diego pediu). Só funciona se a RECEITA
//    subir junto — senão o teto sobe e ninguém tem dinheiro pra alcançar, e o
//    número vira enfeite. Por isso este modelo mexe nos DOIS ao mesmo tempo.
type Modelo = 'hoje' | 'bolso' | 'bolso+nivel' | 'bolso+nivel+tempo'
const FATIA_BOLSO = 0.35                 // no máximo 35% do caixa numa carta só
// +1,2% por temporada, parando em 2,5× (não existe inflação infinita no jogo)
const inflacaoTempo = (t: number): number => Math.min(2.5, 1 + t * 0.012)
const econBolso = (caixa: number): number => Math.max(1, 0.5 + caixa / 150)
// dentro da categoria: 0.75× no piso da faixa, 1.25× no topo
function fatorNivel(c: Carta): number {
  const faixa: [number, number] = c.promessa ? [70, 86] : c.fame >= 5 ? [88, 99] : c.fame === 4 ? [80, 90] : c.fame >= 2 ? [68, 82] : [50, 70]
  const p = Math.min(1, Math.max(0, (c.nivel - faixa[0]) / (faixa[1] - faixa[0])))
  return 0.75 + p * 0.5
}
function tetoDoBot(modelo: Modelo, c: Carta, caixaBot: number, mediaSala: number, temp = 1): number {
  if (modelo === 'hoje') return Math.round(catPriceCap(c) * econSala(mediaSala))
  let base = catPriceCap(c) * (modelo !== 'bolso' ? fatorNivel(c) : 1)
  if (modelo === 'bolso+nivel+tempo') base *= inflacaoTempo(temp)
  return Math.max(1, Math.min(Math.round(base * econBolso(caixaBot)), Math.round(caixaBot * FATIA_BOLSO)))
}

// ── mundo ───────────────────────────────────────────────────────────────────
type Carta = { fame: number; promessa: boolean; nivel: number; paid: number; livro: number }
type Clube = { id: number; div: Div; caixa: number; elenco: Carta[]; gastador: number; nome: string }

function rngDe(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

function novaCarta(rng: () => number, forte = false): Carta {
  const r = forte ? rng() * 0.45 + 0.55 : rng()
  const fame = r > 0.94 ? 5 : r > 0.8 ? 4 : r > 0.4 ? 2 : 1
  const promessa = !forte && fame <= 2 && rng() > 0.88
  const faixa: [number, number] = promessa ? [70, 86] : fame >= 5 ? [88, 99] : fame === 4 ? [80, 90] : fame >= 2 ? [68, 82] : [50, 70]
  const nivel = Math.round(faixa[0] + rng() * (faixa[1] - faixa[0]))
  return { fame, promessa, nivel, paid: tabela({ fame, promessa, nivel, paid: 0, livro: 0 }), livro: 0 }
}

const N_CLUBES = 40
const POR_DIV = N_CLUBES / 5

function simula(modelo: Modelo, temporadas: number) {
  const rng = rngDe(20250920)
  const clubes: Clube[] = []
  for (let i = 0; i < N_CLUBES; i++) {
    const div = ORDEM[Math.floor(i / POR_DIV)]
    const elenco: Carta[] = []
    for (let k = 0; k < 16; k++) elenco.push(novaCarta(rng, div === 'A' || div === 'B'))
    // 💰 o que faz existir "time rico na Várzea": clube pão-duro (gastador baixo)
    //    guarda dinheiro temporada após temporada mesmo sem subir de divisão.
    clubes.push({ id: i, div, caixa: 80 + rng() * 60, elenco, gastador: 0.25 + rng() * 0.7, nome: `C${i}` })
  }
  const hist: {
    t: number; media: number
    tetoLenda: Record<Div, number>          // teto médio pra uma LENDA, por divisão
    maiorTetoV: number                       // maior teto que um clube da VÁRZEA consegue
    maiorTetoGeral: number                   // o lance máximo que existe na liga
    elencoMedioA: number; elencoMedioV: number
    caixaMax: number; caixaMin: number
    precoLendaPago: number                   // preço médio REALMENTE pago numa lenda
  }[] = []

  for (let t = 1; t <= temporadas; t++) {
    const media = clubes.reduce((s, c) => s + c.caixa, 0) / clubes.length

    // ── 1) folha. 🛟 Clube que não fecha a conta VENDE pra sobreviver (é o que
    //     o jogo faz na prática: lista jogador caro, ele cai pro monte pela
    //     metade e o elenco encolhe de preço). Sem isso o rebaixado entra em
    //     espiral, chega a caixa 0 e a bancada não consegue nem MEDIR a pergunta
    //     do Diego (clube rico numa divisão de baixo).
    for (const c of clubes) {
      let folha = c.elenco.reduce((s, j) => s + salario(j.paid), 0)
      let guarda = 0
      while (c.caixa < folha && guarda++ < 16) {
        c.elenco.sort((a, b) => b.paid - a.paid)
        const vendido = c.elenco[0]
        c.caixa += Math.floor(vendido.paid / 2)                 // store.tsx:3800 halveListed
        c.elenco[0] = novaCarta(rng)                            // repõe com carta barata
        folha = c.elenco.reduce((s, j) => s + salario(j.paid), 0)
      }
      c.caixa -= folha
    }
    // ── 2) receitas (com sorte: campeão/zona variam)
    for (const c of clubes) {
      const sorte = rng()
      const infl = modelo === 'bolso+nivel+tempo' ? inflacaoTempo(t) : 1
      c.caixa += (ZONA[c.div] + MASTER[c.div] + FORN[c.div] + RECEITA_ESTADIO[c.div] * (0.7 + rng() * 0.6)) * infl
      if (sorte > 0.85) c.caixa += CAMPEAO[c.div] * infl
      if (c.caixa < 0) c.caixa = 0                     // 🛟 jogo não deixa virar dívida
    }

    // ── 3) leilão: 20 cartas na mesa, todo mundo dá lance até o SEU teto
    //     🛟 realismo obrigatório (store.tsx:1823 `need`/`m.money`): o bot só
    //     briga pelas VAGAS que tem (2 por temporada) e nunca come a reserva da
    //     folha. Sem isso a bancada quebra os clubes pobres e mente na resposta.
    const mesa: Carta[] = []
    for (let k = 0; k < 20; k++) mesa.push(novaCarta(rng, rng() > 0.7))
    const pagosLenda: number[] = []
    const vagas = new Map<number, number>(clubes.map(c => [c.id, 2]))
    const reserva = new Map<number, number>(clubes.map(c => [c.id, c.elenco.reduce((s, j) => s + salario(j.paid), 0) * 1.5]))
    for (const carta of mesa) {
      let melhor = 0, vencedor: Clube | null = null
      for (const c of clubes) {
        if ((vagas.get(c.id) ?? 0) <= 0) continue
        const bolso = c.caixa - (reserva.get(c.id) ?? 0)   // o que sobra depois da folha
        if (bolso <= 0) continue
        const teto = Math.min(tetoDoBot(modelo, carta, c.caixa, media, t), bolso)
        // o bot não torra tudo numa carta: agressividade sorteada dentro do teto
        const lance = Math.max(0, Math.round(teto * (0.55 + rng() * 0.45) * c.gastador * 1.3))
        if (lance > melhor) { melhor = Math.min(lance, teto); vencedor = c }
      }
      if (vencedor && melhor > 0) {
        vencedor.caixa -= melhor
        vagas.set(vencedor.id, (vagas.get(vencedor.id) ?? 1) - 1)
        carta.paid = melhor
        carta.livro = melhor                            // store.tsx:1320 recordPrice
        vencedor.elenco.sort((a, b) => a.nivel - b.nivel)
        vencedor.elenco.shift()
        vencedor.elenco.push(carta)
        if (carta.fame >= 5) pagosLenda.push(melhor)
      }
    }

    // ── 4) sobe/desce pela força do elenco
    for (const d of ORDEM) {
      const dela = clubes.filter(c => c.div === d).sort((a, b) => forca(b) - forca(a))
      if (d !== 'A') for (const c of dela.slice(0, 2)) c.div = ORDEM[ORDEM.indexOf(d) + 1]
      if (d !== 'V') for (const c of dela.slice(-2)) c.div = ORDEM[ORDEM.indexOf(d) - 1]
    }

    // ── 5) medições
    const lendaRef: Carta = { fame: 5, promessa: false, nivel: 93, paid: 0, livro: 0 }
    const tetoLenda = {} as Record<Div, number>
    for (const d of ORDEM) {
      const dela = clubes.filter(c => c.div === d)
      tetoLenda[d] = dela.length ? Math.round(dela.reduce((s, c) => s + tetoDoBot(modelo, lendaRef, c.caixa, media, t), 0) / dela.length) : 0
    }
    const varzea = clubes.filter(c => c.div === 'V')
    hist.push({
      t, media: Math.round(media), tetoLenda,
      maiorTetoV: varzea.length ? Math.max(...varzea.map(c => tetoDoBot(modelo, lendaRef, c.caixa, media, t))) : 0,
      maiorTetoGeral: Math.max(...clubes.map(c => tetoDoBot(modelo, lendaRef, c.caixa, media, t))),
      elencoMedioA: Math.round(mediaElenco(clubes.filter(c => c.div === 'A'))),
      elencoMedioV: Math.round(mediaElenco(varzea)),
      caixaMax: Math.round(Math.max(...clubes.map(c => c.caixa))),
      caixaMin: Math.round(Math.min(...clubes.map(c => c.caixa))),
      precoLendaPago: pagosLenda.length ? Math.round(pagosLenda.reduce((a, b) => a + b, 0) / pagosLenda.length) : 0,
    })
  }
  return hist
}

const forca = (c: Clube) => c.elenco.reduce((s, j) => s + j.nivel, 0)
const mediaElenco = (cs: Clube[]) => {
  if (!cs.length) return 0
  const tot = cs.reduce((s, c) => s + c.elenco.reduce((a, j) => a + Math.max(j.paid, j.livro), 0) / c.elenco.length, 0)
  return tot / cs.length
}

// ── relatório ───────────────────────────────────────────────────────────────
const T = 250
const marcos = [1, 5, 10, 25, 50, 100, 150, 200, 250]
const MODELOS: Modelo[] = ['hoje', 'bolso', 'bolso+nivel', 'bolso+nivel+tempo']
const res = Object.fromEntries(MODELOS.map(m => [m, simula(m, T)])) as Record<Modelo, ReturnType<typeof simula>>

for (const m of MODELOS) {
  console.log(`\n═══ RÉGUA: ${m.toUpperCase()} ═══`)
  console.log('temp | caixa médio | teto LENDA por divisão (V/D/C/B/A) | maior teto da VÁRZEA | maior teto da liga | pago de fato numa lenda')
  for (const t of marcos) {
    const d = res[m][t - 1]; if (!d) continue
    const tl = ORDEM.map(x => String(d.tetoLenda[x]).padStart(4)).join('/')
    console.log(`${String(d.t).padStart(4)} | ${String(d.media).padStart(11)} | ${tl} | ${String(d.maiorTetoV).padStart(20)} | ${String(d.maiorTetoGeral).padStart(18)} | ${String(d.precoLendaPago).padStart(23)}`)
  }
}

console.log('\n═══ 1) O TETO ACOMPANHA O JOGO? (maior lance possível na liga) ═══')
for (const m of MODELOS) {
  const a = res[m], q = (t: number) => a[t - 1].maiorTetoGeral
  console.log(`${m.padEnd(18)} → temp 10: ${String(q(10)).padStart(5)} · 50: ${String(q(50)).padStart(5)} · 100: ${String(q(100)).padStart(5)} · 250: ${String(q(250)).padStart(5)}`)
}

console.log('\n═══ 2) TIME RICO DA VÁRZEA CONSEGUE BRIGAR? (teto dele × teto da Série A) ═══')
for (const m of MODELOS) {
  const f = res[m][T - 1]
  console.log(`${m.padEnd(18)} → melhor da Várzea ${String(f.maiorTetoV).padStart(5)} · média da Série A ${String(f.tetoLenda.A).padStart(5)} · alcança ${Math.round(f.maiorTetoV / Math.max(1, f.tetoLenda.A) * 100)}% do bolso da elite`)
}

console.log('\n═══ 3) QUANTO CUSTA "ESPANTAR TODO MUNDO" (a artimanha) ═══')
for (const m of MODELOS) {
  const a = res[m]
  const linha = (t: number) => `${a[t - 1].maiorTetoGeral + 1}`
  console.log(`${m.padEnd(18)} → precisa dar lance acima de: temp 25 ${linha(25).padStart(5)} · 100 ${linha(100).padStart(5)} · 250 ${linha(250).padStart(5)}`)
}

console.log('\n═══ 4) INFLAÇÃO: o preço pago numa lenda dispara? ═══')
for (const m of MODELOS) {
  const a = res[m], q = (t: number) => a[t - 1].precoLendaPago
  console.log(`${m.padEnd(18)} → temp 10: ${String(q(10)).padStart(5)} · 50: ${String(q(50)).padStart(5)} · 100: ${String(q(100)).padStart(5)} · 250: ${String(q(250)).padStart(5)}`)
}

console.log('\n═══ 5) DESIGUALDADE: caixa do mais rico × do mais pobre (temp 250) ═══')
for (const m of MODELOS) {
  const f = res[m][T - 1]
  console.log(`${m.padEnd(18)} → mais rico ${String(f.caixaMax).padStart(6)} · mais pobre ${String(f.caixaMin).padStart(5)} · elenco médio A ${String(f.elencoMedioA).padStart(4)} · elenco médio V ${String(f.elencoMedioV).padStart(4)}`)
}
