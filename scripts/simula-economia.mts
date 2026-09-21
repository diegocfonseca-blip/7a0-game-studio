// 📊 SIMULAÇÃO ECONÔMICA — 250 temporadas, da Várzea à Série A
//
// Pedido do Diego (20/09): *"faz uma simulação aí de 250 temporadas, você começando
// na várzea, com time fraco… faz a tática que esses usuários estão fazendo também e
// tenta ver as artimanhas… principalmente do piso, se dá pra aumentar ou não, com
// base no time do usuário"*.
//
// ⚠️ HONESTIDADE DA BANCADA: as fórmulas abaixo são CÓPIAS das do jogo (store.tsx),
// com a linha de origem anotada. Copiei em vez de importar porque `catPriceCap`,
// `fairPrice` e `escadaEconFactor` não são exportadas. Se alguém mexer nelas lá,
// TEM que mexer aqui — senão esta análise mente.
//
// O que a simulação NÃO modela (e por isso não vira número aqui): bilheteria, loja,
// TV e bico — são receitas ligadas a estádio/obras e não mudam a PERGUNTA, que é a
// relação entre o valor do elenco e o teto que o bot aceita pagar.
//
// Rodar:  npx tsx scripts/simula-economia.mts

type Div = 'V' | 'D' | 'C' | 'B' | 'A'
type Cat = 'prof' | 'bom' | 'promessa' | 'craque' | 'lenda'

// ── cópias fiéis do jogo ────────────────────────────────────────────────────
// store.tsx:1555 — teto do que o mercado aceita pagar por categoria
const catPriceCap = (cat: Cat): number =>
  cat === 'promessa' ? 42 : cat === 'lenda' ? 90 : cat === 'craque' ? 65 : cat === 'bom' ? 26 : 16
// store.tsx:1565 — fator econômico da sala: caixa média ~100 = 1×, teto 4×
const econFactor = (caixaMedia: number): number => Math.min(4, Math.max(1, 0.5 + caixaMedia / 150))
// store.tsx:1808 — o que o bot acha "justo" pra um jogador de nível v
const fairPrice = (v: number): number => Math.max(1, Math.round(Math.pow(Math.max(0, v - 40) / 10, 1.55) * 3.2))
// store.tsx:1329 — piso de tabela por categoria (valor oficial nunca cai abaixo)
const tabela = (cat: Cat): number => cat === 'lenda' ? 30 : cat === 'promessa' ? 12 : cat === 'craque' ? 20 : cat === 'bom' ? 8 : 3
// store.tsx:169 — salário = o que foi pago ÷ 10
const salario = (paid: number): number => Math.round(paid / 10)
// store.tsx:1482 — renovar por 5 anos custa metade do valor oficial
const renovar5 = (oficial: number): number => Math.max(1, Math.ceil(oficial * 0.5))
// pyramidseason.tsx:450 — prêmios da temporada
const CAMPEAO: Record<Div, number> = { A: 65, B: 50, C: 35, D: 20, V: 15 }
const ZONA: Record<Div, number> = { A: 30, B: 25, C: 20, D: 15, V: 10 }
const ARTILHEIRO: Record<Div, number> = { A: 16, B: 12, C: 8, D: 4, V: 2 }
// estadiodata.ts / loja.ts — patrocínio master + fornecedor por temporada (contrato de 3)
const MASTER: Record<Div, number> = { A: 64, B: 32, C: 16, D: 8, V: 4 }
const FORN: Record<Div, number> = { A: 54, B: 27, C: 13, D: 7, V: 4 }

const ORDEM: Div[] = ['V', 'D', 'C', 'B', 'A']
const NIVEL: Record<Cat, number> = { prof: 62, bom: 72, promessa: 78, craque: 86, lenda: 92 }
// 🎟️ PROXY de bilheteria + loja + TV + bico. Não são números do código (dependem de
// obras do estádio), então entram como uma receita por divisão que cresce junto —
// o suficiente pra um clube honesto FECHAR NO AZUL, que é a condição mínima pra
// simulação dizer alguma coisa. Se este número estiver alto ou baixo demais, o que
// muda é a velocidade; a CONCLUSÃO (teto fixo × caixa que cresce) não muda.
const RECEITA_ESTADIO: Record<Div, number> = { A: 120, B: 70, C: 40, D: 22, V: 10 }

function simula(estrategia: Estrategia, temporadas: number) {
  let div: Div = 'V'
  let caixa = 100
  let caixaBots = 100                       // caixa média dos rivais (move o fator econômico)
  const elenco: Jogador[] = []
  for (let i = 0; i < 16; i++) elenco.push({ cat: 'prof', paid: 2, livro: 2, contratoAte: 5 })
  const linha: { t: number; div: Div; caixa: number; folha: number; medioElenco: number; tetoBot: number; econ: number; melhorCarta: number; podeCobrir: number }[] = []

  for (let t = 1; t <= temporadas; t++) {
    const econ = econFactor((caixa + caixaBots * 3) / 4)
    const tetoBot = (cat: Cat) => Math.round(catPriceCap(cat) * econ)

    // ── 1) folha da temporada que passou
    const folha = elenco.reduce((s, j) => s + salario(j.paid), 0)
    caixa -= folha

    // ── 2) receitas: prêmios + patrocínio + o proxy de estádio
    caixa += CAMPEAO[div] * (t % 3 === 0 ? 1 : 0) + ZONA[div] + MASTER[div] + FORN[div] + RECEITA_ESTADIO[div]
    caixaBots += (CAMPEAO[div] + ZONA[div]) / 6 + MASTER[div] / 2
    const subiu = div !== 'A' && t % 4 === 0

    // ── 3) artilheiro: sobe o livro, LIMITADO pelo teto da categoria (o único
    //     freio de inflação que existe hoje no jogo)
    const art = elenco.filter(j => j.cat !== 'prof').sort((a, b) => NIVEL[b.cat] - NIVEL[a.cat])[0]
    if (art) {
      caixa += ARTILHEIRO[div]
      art.livro = Math.min(art.livro + 10, Math.max(tetoBot(art.cat), art.livro))
      art.paid = Math.max(art.paid, art.livro)
    }

    // ── 4) renovações vencidas
    for (const j of elenco) {
      if (j.contratoAte > t) continue
      const oficial = Math.max(j.livro, j.paid, tabela(j.cat))
      caixa -= renovar5(oficial)
      j.contratoAte = t + 5
    }

    // ── 5) leilão: reforça 2 por temporada, SÓ se o caixa aguenta (limite de 40%
    //     do caixa, que é como gente de verdade joga — não torra tudo)
    const alvo: Cat = div === 'A' ? 'lenda' : div === 'B' ? 'craque' : div === 'C' ? 'promessa' : div === 'D' ? 'bom' : 'prof'
    for (let k = 0; k < 2; k++) {
      const mercado = tetoBot(alvo)                      // até aqui os bots brigam
      // 💸 O INFLADOR paga o que for preciso pra ninguém competir; o honesto paga
      //    preço de mercado. Repare: o lance do USUÁRIO não tem teto nenhum no jogo.
      const preco = estrategia === 'inflador' ? Math.min(Math.round(caixa * 0.4), mercado * 4) : mercado + 2
      if (preco <= 0 || caixa < preco) break
      const jaTem = elenco.filter(j => j.cat === alvo).length
      if (jaTem >= 11) break
      caixa -= preco
      elenco.sort((a, b) => NIVEL[a.cat] - NIVEL[b.cat])
      elenco.shift()
      elenco.push({ cat: alvo, paid: preco, livro: preco, contratoAte: t + 5 })
    }

    // ── 6) A ARTIMANHA: lista e repesca no monte. Hoje volta DE GRAÇA e pela
    //     METADE — e só é garantido quando o piso passa do teto do bot.
    if (estrategia !== 'honesto') {
      const lavaveis = elenco.filter(j => j.paid > tetoBot(j.cat)).slice(0, 6)
      for (const j of lavaveis) {
        j.paid = Math.floor(j.paid / 2)       // store.tsx:3800 halveListed
        j.livro = j.paid                      // store.tsx:1617 montePush → recordPrice
        j.contratoAte = t + 8                 // volta sem contrato → ganha 5-10 novos de graça
      }
    }

    if (subiu) div = ORDEM[Math.min(4, ORDEM.indexOf(div) + 1)]
    const medio = elenco.reduce((s, j) => s + Math.max(j.livro, j.paid), 0) / elenco.length
    const melhor = Math.max(...elenco.map(j => Math.max(j.livro, j.paid)))
    linha.push({ t, div, caixa: Math.round(caixa), folha, medioElenco: Math.round(medio), tetoBot: tetoBot(alvo), econ: +econ.toFixed(2), melhorCarta: Math.round(melhor), podeCobrir: Math.round(caixa / Math.max(1, tetoBot(alvo)) * 10) / 10 })
  }
  return linha
}

// ── relatório ───────────────────────────────────────────────────────────────
const T = 250
const linhas = { honesto: simula('honesto', T), lavador: simula('lavador', T), inflador: simula('inflador', T) }
const marcos = [1, 10, 25, 50, 100, 150, 200, 250]

for (const [nome, dados] of Object.entries(linhas)) {
  console.log(`\n═══ ESTRATÉGIA: ${nome.toUpperCase()} ═══`)
  console.log('temp | div |  caixa | folha | elenco médio | melhor carta | teto do bot | econ | caixa÷teto')
  for (const t of marcos) {
    const d = dados[t - 1]; if (!d) continue
    console.log(`${String(d.t).padStart(4)} |  ${d.div}  | ${String(d.caixa).padStart(6)} | ${String(d.folha).padStart(5)} | ${String(d.medioElenco).padStart(12)} | ${String(d.melhorCarta).padStart(12)} | ${String(d.tetoBot).padStart(11)} | ${String(d.econ).padStart(4)} | ${d.podeCobrir}×`)
  }
}

console.log('\n═══ A PERGUNTA DO DIEGO: o bot acompanha o piso do elenco? ═══')
for (const [nome, dados] of Object.entries(linhas)) {
  const fim = dados[dados.length - 1]
  console.log(`${nome.padEnd(9)} → elenco médio ${fim.medioElenco} · teto do bot ${fim.tetoBot} · o bot alcança ${Math.round(fim.tetoBot / fim.medioElenco * 100)}% do valor do elenco`)
}
const h = linhas.honesto[T - 1], l = linhas.lavador[T - 1], i = linhas.inflador[T - 1]
console.log('\n═══ O QUE A ARTIMANHA RENDE ═══')
console.log(`folha na temporada ${T}: honesto ${h.folha} · lavador ${l.folha} · inflador ${i.folha}`)
console.log(`caixa na temporada ${T}: honesto ${h.caixa} · lavador ${l.caixa} · inflador ${i.caixa}`)
const totalFolha = (d: typeof h[]) => d.reduce((s, x) => s + x.folha, 0)
console.log(`folha PAGA em ${T} temporadas: honesto ${totalFolha(linhas.honesto)} · lavador ${totalFolha(linhas.lavador)} · inflador ${totalFolha(linhas.inflador)}`)
console.log(`\nteto ABSOLUTO do bot hoje (lenda × econ 4×): ${90 * 4} moedas — não importa quanto a liga enriqueça.`)
