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
// 🅴️ MERCADO: o teto NÃO é tabela chutada — sai do que o mercado REALMENTE pagou
//    em cartas daquele NÍVEL nas últimas temporadas. O jogo lê o próprio histórico
//    ("nível 91 tem saído por ~180") e usa isso como referência. Sobe sozinho
//    quando a liga enriquece e desce sozinho quando empobrece — sem eu chutar
//    número nenhum e sem inventar taxa de inflação.
//    ⚠️ O PERIGO: se o inflador contamina o histórico, o teto sobe junto e a
//    artimanha vira bola de neve. Por isso o índice usa MEDIANA (o do meio),
//    não média — um lance maluco de 1000 não move o do meio.
// 🅵️ RECOMENDADO: bolso + nível, com TETO DURO por cima. O teto duro é um número
//    escrito no código que NENHUM caminho pode furar (nem bot riquíssimo, nem
//    índice, nem lance de usuário). Mantém a proporção sagrada da escada:
//    🪵 nunca alcança ⭐, por mais rica que a liga fique.
// 🅶️ PERSEGUE (ideia do Diego, 20/09): *"se um usuário pagar no nível 90 mil, o teto
//    máximo que o bot pode chegar agora é mil também… porém sendo inteligente"*. E o
//    medo dele, que é o certo: *"pode ser que no próximo ele pague 1500, aí o bot
//    aumenta pra 1500 e daqui a pouco o jogo tá em 10k"*.
//    FREIO: o teto anda no máximo PASSO por temporada na direção do preço praticado,
//    e desce do mesmo jeito. Preço só conta se SE SUSTENTOU (mediana: um lance
//    maluco sozinho não move nada, dois ou mais já é preço).
// 🅷️ DINHEIRO (resposta ao 'mas aí ele trava nos 450 de novo'): o teto não vem de
//    PREÇO nenhum — vem do DINHEIRO QUE EXISTE NA LIGA. Moeda no jogo só nasce de
//    prêmio, patrocínio e estádio; pagar caro NÃO cria moeda, só troca de bolso.
//    Então não existe bola de neve: o trapaceiro pode pagar 10 mil que a referência
//    não se mexe, porque ele não criou um centavo.
//    Referência = caixa MEDIANO dos clubes (o do meio, não a média — um clube
//    riquíssimo não deve puxar o mercado inteiro sozinho).
//    E cresce sozinho conforme o jogo avança, porque a liga vai enriquecendo.
type Modelo = 'hoje' | 'bolso' | 'bolso+nivel' | 'bolso+nivel+tempo' | 'mercado' | 'mercado-media' | 'mercado-so-bots' | 'recomendado' | 'persegue' | 'persegue+duro' | 'dinheiro'
const PROPORCAO = (c: Carta) => catPriceCap(c) / 90   // 👑1,00 ⭐0,72 💎0,47 🎯0,29 🪵0,18
const K_DINHEIRO = 2.5                                // uma lenda custa ~2,5 caixa mediano
const PASSO = 0.25                       // sobe/desce no máximo 25% por temporada
const TETO_DURO = (c: Carta) => catPriceCap(c) * 5   // 👑450 ⭐325 💎210 🎯130 🪵80
const FAIXA_NIVEL = (n: number) => Math.floor(n / 5) * 5      // 50-54, 55-59, …
const JANELA = 5                                              // últimas 5 temporadas
const FOLGA = 1.3                                             // teto = mediana × 1,3
function mediana(v: number[]): number {
  if (!v.length) return 0
  const a = [...v].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2)
}
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
function tetoDoBot(modelo: Modelo, c: Carta, caixaBot: number, mediaSala: number, temp = 1, indice?: Map<number, number>): number {
  if (modelo === 'hoje') return Math.round(catPriceCap(c) * econSala(mediaSala))
  if (modelo === 'dinheiro') {
    const ref = indice?.get(-1) ?? 100                  // caixa mediano da liga
    return Math.max(1, Math.min(
      Math.round(ref * K_DINHEIRO * PROPORCAO(c) * fatorNivel(c)),
      Math.round(caixaBot * FATIA_BOLSO),
    ))
  }
  if (modelo === 'persegue' || modelo === 'persegue+duro') {
    const base = indice?.get(FAIXA_NIVEL(c.nivel)) ?? catPriceCap(c)
    const v = Math.min(Math.round(base * fatorNivel(c) * econBolso(caixaBot) / 2), Math.round(caixaBot * FATIA_BOLSO))
    return Math.max(1, modelo === 'persegue+duro' ? Math.min(v, TETO_DURO(c)) : v)
  }
  if (modelo === 'mercado' || modelo === 'mercado-media' || modelo === 'mercado-so-bots') {
    // referência do mercado pra ESTE nível; se ainda não tem histórico, cai na
    // tabela de hoje (é o que faz o jogo começar funcionando na temporada 1)
    const ref = indice?.get(FAIXA_NIVEL(c.nivel)) ?? 0
    const base = Math.max(catPriceCap(c), Math.round(ref * FOLGA))
    return Math.max(1, Math.min(Math.round(base * econBolso(caixaBot)), Math.round(caixaBot * FATIA_BOLSO)))
  }
  let base = catPriceCap(c) * (modelo !== 'bolso' ? fatorNivel(c) : 1)
  if (modelo === 'bolso+nivel+tempo') base *= inflacaoTempo(temp)
  const v = Math.min(Math.round(base * econBolso(caixaBot)), Math.round(caixaBot * FATIA_BOLSO))
  return Math.max(1, modelo === 'recomendado' ? Math.min(v, TETO_DURO(c)) : v)
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

function simula(modelo: Modelo, temporadas: number, comInflador = false) {
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
  // 📚 histórico de preços por FAIXA DE NÍVEL (só o que BOT pagou — ver nota
  //    no relatório sobre o inflador). Guarda as últimas JANELA temporadas.
  const historico = new Map<number, number[][]>()
  const indiceDoMercado = (): Map<number, number> => {
    // o 'dinheiro' não olha preço: guarda o caixa MEDIANO da liga na chave -1
    if (modelo === 'dinheiro') return new Map([[-1, mediana(clubes.map(c => Math.round(c.caixa)))]])
    if (modelo === 'persegue' || modelo === 'persegue+duro') return new Map(tetoPersegue)
    const idx = new Map<number, number>()
    for (const [faixa, temps] of historico) {
      const v = temps.flat()
      // 🧪 a diferença que decide o modelo: MEDIANA (o do meio) ignora o lance
      //    maluco; MÉDIA engole ele e o teto vira bola de neve.
      idx.set(faixa, modelo === 'mercado-media'
        ? Math.round(v.reduce((a, b) => a + b, 0) / Math.max(1, v.length))
        : mediana(v))
    }
    return idx
  }
  // teto perseguidor por faixa de nível (começa na tabela de hoje)
  const tetoPersegue = new Map<number, number>()
  const hist: {
    t: number; media: number
    tetoLenda: Record<Div, number>          // teto médio pra uma LENDA, por divisão
    maiorTetoV: number                       // maior teto que um clube da VÁRZEA consegue
    maiorTetoGeral: number                   // o lance máximo que existe na liga
    elencoMedioA: number; elencoMedioV: number
    caixaMax: number; caixaMin: number
    precoLendaPago: number                   // preço médio REALMENTE pago numa lenda
    refNivel90: number                       // a REFERÊNCIA do mercado pra nível 90-94
  }[] = []

  for (let t = 1; t <= temporadas; t++) {
    const media = clubes.reduce((s, c) => s + c.caixa, 0) / clubes.length
    const indice = indiceDoMercado()
    const pagosDaTemporada = new Map<number, number[]>()

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
        const teto = Math.min(tetoDoBot(modelo, carta, c.caixa, media, t, indice), bolso)
        // o bot não torra tudo numa carta: agressividade sorteada dentro do teto
        const lance = Math.max(0, Math.round(teto * (0.55 + rng() * 0.45) * c.gastador * 1.3))
        if (lance > melhor) { melhor = Math.min(lance, teto); vencedor = c }
      }
      // 💸 O INFLADOR (o usuário da artimanha): paga 10× o maior lance pra que
      //    nenhum bot dispute. É o que o Diego viu acontecendo no jogo.
      if (comInflador && rng() > 0.6) {
        const eu = clubes[0]
        // 🔁 a artimanha RECICLA o dinheiro: ele lista, ninguém cobre o preço
        //    inflado, a carta cai no monte pela metade e ele repesca. Na prática
        //    o caixa dele não seca — por isso a bancada o mantém abastecido.
        eu.caixa = Math.max(eu.caixa, 3000)
        melhor = Math.max(melhor * 10, 200); vencedor = eu
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
        // 🛡️ TRAVA: no modelo 'mercado-so-bots' o lance de QUEM JOGA não entra na
        //    referência de preço. O índice mede o que o MERCADO aceita, e o
        //    usuário não é mercado — é justamente quem quer distorcê-lo.
        const ehUsuario = comInflador && vencedor === clubes[0]
        if (!(modelo === 'mercado-so-bots' && ehUsuario)) {
          const fx = FAIXA_NIVEL(carta.nivel)
          pagosDaTemporada.set(fx, [...(pagosDaTemporada.get(fx) ?? []), melhor])
        }
      }
    }

    // 🐌 O FREIO: o teto anda no máximo PASSO por temporada em direção ao preço
    //    que SE SUSTENTOU (mediana da faixa). Sobe devagar e DESCE devagar.
  if (modelo === 'persegue' || modelo === 'persegue+duro') {
      for (const [fx, lista] of pagosDaTemporada) {
        const alvo = mediana(lista)
        const atual = tetoPersegue.get(fx) ?? 0
        const piso = catPriceCap({ fame: fx >= 88 ? 5 : fx >= 80 ? 4 : fx >= 68 ? 2 : 1, promessa: false, nivel: fx, paid: 0, livro: 0 })
        const novo = atual === 0 ? piso : atual + Math.max(-atual * PASSO, Math.min(atual * PASSO, alvo - atual))
        tetoPersegue.set(fx, Math.max(piso, Math.round(novo)))
      }
    }

    // fecha a temporada no histórico (janela deslizante)
    for (const [fx, lista] of pagosDaTemporada) {
      const temps = historico.get(fx) ?? []
      temps.push(lista)
      while (temps.length > JANELA) temps.shift()
      historico.set(fx, temps)
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
      tetoLenda[d] = dela.length ? Math.round(dela.reduce((s, c) => s + tetoDoBot(modelo, lendaRef, c.caixa, media, t, indice), 0) / dela.length) : 0
    }
    const varzea = clubes.filter(c => c.div === 'V')
    hist.push({
      t, media: Math.round(media), tetoLenda,
      maiorTetoV: varzea.length ? Math.max(...varzea.map(c => tetoDoBot(modelo, lendaRef, c.caixa, media, t, indice))) : 0,
      // ⚠️ o TRAPACEIRO é o clube 0 e tem o caixa abastecido de propósito pela bancada.
      // Contar o teto DELE aqui responderia a pergunta errada: o Diego quer saber se
      // um BOT pode, do nada, pagar um absurdo.
      maiorTetoGeral: Math.max(...clubes.filter(c => !(comInflador && c === clubes[0])).map(c => tetoDoBot(modelo, lendaRef, c.caixa, media, t, indice))),
      elencoMedioA: Math.round(mediaElenco(clubes.filter(c => c.div === 'A'))),
      elencoMedioV: Math.round(mediaElenco(varzea)),
      caixaMax: Math.round(Math.max(...clubes.map(c => c.caixa))),
      caixaMin: Math.round(Math.min(...clubes.map(c => c.caixa))),
      precoLendaPago: pagosLenda.length ? Math.round(pagosLenda.reduce((a, b) => a + b, 0) / pagosLenda.length) : 0,
      refNivel90: indice.get(90) ?? 0,
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
const MODELOS: Modelo[] = ['hoje', 'persegue+duro', 'dinheiro']
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


console.log('\n═══ 6) 🧪 O INFLADOR CONSEGUE ENVENENAR O ÍNDICE DE MERCADO? ═══')
console.log('(um clube paga 10× o maior lance pra ninguém disputar — a artimanha que o Diego viu)')
for (const m of ['mercado-media', 'persegue+duro', 'dinheiro'] as Modelo[]) {
  const limpo = simula(m, T), sujo = simula(m, T, true)
  // mede a REFERÊNCIA do mercado (nível 90-94), que é o número contaminável —
  // o teto final costuma estar preso no bolso do clube e esconde o estrago.
  const q = (d: ReturnType<typeof simula>, t: number) => d[t - 1].refNivel90
  console.log(`${m.padEnd(14)} → SEM inflador: t25 ${String(q(limpo, 25)).padStart(5)} · t100 ${String(q(limpo, 100)).padStart(5)} · t250 ${String(q(limpo, 250)).padStart(6)}`)
  console.log(`${''.padEnd(14)}   COM inflador: t25 ${String(q(sujo, 25)).padStart(5)} · t100 ${String(q(sujo, 100)).padStart(5)} · t250 ${String(q(sujo, 250)).padStart(6)}`)
  const razao = q(sujo, 250) / Math.max(1, q(limpo, 250))
  console.log(`${''.padEnd(14)}   → o inflador multiplicou a referência por ${razao.toFixed(1)}×\n`)
}


console.log('\n═══ 7) 🚨 O BOT PODE, DO NADA, PAGAR UM ABSURDO? ═══')
console.log('(o MAIOR lance que um bot chegou a dar em QUALQUER das 250 temporadas)')
console.log('régua               | sem inflador | com inflador solto | pior caso')
for (const m of ['hoje', 'mercado', 'recomendado', 'persegue', 'persegue+duro', 'dinheiro'] as Modelo[]) {
  const limpo = simula(m, T), sujo = simula(m, T, true)
  const pico = (d: ReturnType<typeof simula>) => Math.max(...d.map(x => x.maiorTetoGeral))
  const a = pico(limpo), b = pico(sujo)
  const risco = b > a * 2 ? '🚨 DISPARA' : b > a * 1.3 ? '⚠️ sobe' : '✅ seguro'
  console.log(`${m.padEnd(19)} | ${String(a).padStart(12)} | ${String(b).padStart(18)} | ${risco}`)
}


console.log('\n═══ 8) ⏳ E NA TEMPORADA 1200? (medo do Diego: gente já está lá) ═══')
for (const m of ['hoje', 'dinheiro'] as Modelo[]) {
  const d = simula(m, 1200)
  const q = (t: number) => d[t - 1].maiorTetoGeral
  const pico = Math.max(...d.map(x => x.maiorTetoGeral))
  console.log(`${m.padEnd(10)} → temp 100: ${String(q(100)).padStart(4)} · 300: ${String(q(300)).padStart(4)} · 600: ${String(q(600)).padStart(4)} · 900: ${String(q(900)).padStart(4)} · 1200: ${String(q(1200)).padStart(4)} · o MAIOR que já chegou em 1200 temporadas: ${pico}`)
}
