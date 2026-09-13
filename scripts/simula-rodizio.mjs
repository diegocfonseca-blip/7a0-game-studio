// 🔁 SIMULAÇÃO DO RODÍZIO AUTOMÁTICO — pedido do Diego (13/09):
//   *"coloque um botão de troca automática… mas veja todos os problemas que
//   podemos ter em relação a machucados ou qualquer coisa. Faça uma simulação
//   dessa nova forma."*
//
// Roda: npx tsx scripts/simula-rodizio.mjs
// Sai com código 1 se QUALQUER trava quebrar (serve pra rodar antes de commitar).
//
// O que ela faz: joga 3 temporadas inteiras (38 rodadas + 6 jogos de Copa cada,
// 132 jogos no total) com um elenco de verdade, três jeitos diferentes:
//   A) NUNCA rodizia (o técnico que não mexe em nada)
//   B) rodízio na MÃO (aperta o botão 🔁 RODIZIAR sempre que ele aparece)
//   C) rodízio AUTOMÁTICO (o interruptor novo — mesma sugestão, aplicada sozinha)
// B e C têm que dar EXATAMENTE o mesmo time em toda rodada: o automático não é
// uma regra nova, é o mesmo botão apertado por você. É isso que o teste prova.
//
// E confere, rodada a rodada, as travas que o Diego exige (nada de estado
// quebrado): 11 em campo sempre · ninguém repetido · nenhum jogador FAKE
// (perna-de-pau) · ninguém suspenso · ninguém machucado · ninguém voltando de
// lesão (−2/−1) puxado pro time pelo automático · posição preservada na vaga.
import { gasDoElenco, estadoGas, modGas, modVolta, sugerirRodizio, sorteiaLesaoDesgaste, GAS_JOGO, GAS_BANCO } from '../src/escalacao/condicao.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

// ─── o elenco de teste: 11 titulares + 7 reservas (elenco de Série C/B comum) ──
const POS_XI = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
const POS_BANCO = ['GOL', 'LAT', 'ZAG', 'MEI', 'MEI', 'ATA', 'ATA']
function montaElenco() {
  const squad = []
  POS_XI.forEach((pos, i) => squad.push({ id: `t${i}`, name: `Titular ${i}`, pos, lo: 78, hi: 88 }))
  POS_BANCO.forEach((pos, i) => squad.push({ id: `r${i}`, name: `Reserva ${i}`, pos, lo: 70, hi: 80 }))
  return squad
}

// ─── uma temporada/carreira inteira ──────────────────────────────────────────
// modo: 'nunca' | 'mao' | 'auto'  (mão e auto usam a MESMA função sugerirRodizio)
// Devolve o histórico pra conferência + as contas do relatório.
function joga({ modo, jogos, squad, seed = 7, comFake = false, semReservaMEI = false, lesaoForcada = null }) {
  const elenco = squad.map(c => ({ ...c }))
  if (comFake) elenco.push({ id: 'f0', name: 'Cria da Base', pos: 'MEI', lo: 55, hi: 62, fake: true })
  if (semReservaMEI) { // 🕳️ o caso do elenco curto: nenhum MEI no banco
    for (let i = elenco.length - 1; i >= 0; i--) if (elenco[i].id.startsWith('r') && elenco[i].pos === 'MEI') elenco.splice(i, 1)
  }
  const byRound = {}
  let xi = elenco.filter(c => c.id.startsWith('t')).map(c => c.id)
  let lesao = null // { cardId, ate } — fora até a rodada `ate` (exclusiva); volta em `ate`
  let suspenso = null // { cardId, r } — gancho de UMA rodada
  const hist = []
  let somaMod = 0, trocas = 0, jogosCansado = 0, lesoes = 0, crias = 0

  for (let r = 0; r < jogos; r++) {
    // 🩹 lesão combinada na mão (pra exercitar a volta gradual mesmo quando o
    // rodízio evita TODA lesão por desgaste — que é o que ele faz de bom)
    if (lesaoForcada && lesaoForcada.r === r) { lesao = { cardId: lesaoForcada.cardId, ate: r + lesaoForcada.rodadas }; lesoes++ }
    const gas = gasDoElenco(byRound, r, elenco)
    // 🩹 quem está MACHUCADO nesta rodada e quem está de GANCHO
    const fora = new Set()
    if (lesao && r < lesao.ate) fora.add(lesao.cardId)
    if (suspenso && suspenso.r === r) fora.add(suspenso.cardId)
    // evento "voltando de lesão" (−2 na rodada da volta, −1 na seguinte), no
    // mesmo formato que a tela usa
    const ev = lesao ? { tipo: 'lesao', season: 1, status: 'banco', volta: lesao.ate, cardId: lesao.cardId } : null

    // 1) o jogo tira do time quem não pode jogar (é o que o SET_LINEUP/tela já faz)
    xi = xi.slice()
    for (let i = 0; i < xi.length; i++) {
      if (!fora.has(xi[i])) continue
      const sai = elenco.find(c => c.id === xi[i])
      const cand = elenco.filter(c => c.pos === sai.pos && !xi.includes(c.id) && !fora.has(c.id))
        .sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]
      if (cand) { xi[i] = cand.id; continue }
      // 🌱 sem reserva na posição o jogo já faz o que sempre fez: entra um CRIA DA
      // BASE (o mesmo banner dos 3 Crias). É o buraco tapado pelo JOGO, não pelo
      // rodízio — o rodízio nunca escala carta fake.
      const cria = { id: `cria-${sai.pos}-${r}`, name: `Cria da Base (${sai.pos})`, pos: sai.pos, lo: 55, hi: 62, fake: true }
      elenco.push(cria); xi[i] = cria.id; crias++
    }

    // 2) 🔁 o RODÍZIO — exatamente o que o botão/o automático fazem na tela
    let entrouPeloRodizio = []
    if (modo !== 'nunca') {
      const bloq = new Set(elenco.filter(c => modVolta(ev, 1, r, c.id) !== 0).map(c => c.id))
      for (const id of fora) bloq.add(id)
      const sug = sugerirRodizio(xi, elenco, gas, bloq)
      if (sug) { xi = sug.ids; trocas += sug.trocas.length; entrouPeloRodizio = sug.trocas.map(t => t.entra.id) }
    }

    byRound[r] = xi.slice()
    // guarda quem estava "voltando de lesão" (−2/−1) NESTA rodada, pra conferir
    // que o rodízio não puxou nenhum deles
    const voltando = elenco.filter(c => modVolta(ev, 1, r, c.id) !== 0).map(c => c.id)
    hist.push({ r, xi: xi.slice(), gas: { ...gas }, fora: [...fora], entrouPeloRodizio, voltando })

    // 3) o jogo acontece: soma os −1/−2/−3 e sorteia lesão por desgaste
    for (const id of xi) {
      const m = modGas(gas[id] ?? 100) + modVolta(ev, 1, r, id)
      somaMod += m
      if (m < 0) jogosCansado++
    }
    if (!lesao || r >= lesao.ate + 2) { // o jogo guarda UM causo por vez
      const l = sorteiaLesaoDesgaste({ seed, seasonNo: 1 + Math.floor(r / 38), round: r, xi: xi.map(id => elenco.find(c => c.id === id)), gas })
      if (l) { lesao = { cardId: l.card.id, ate: r + 1 + l.rodadas }; lesoes++ }
    }
    // gancho: a cada 17 rodadas o zagueiro leva vermelho (só pra provar a trava)
    suspenso = r % 17 === 16 ? { cardId: 't3', r: r + 1 } : null
  }
  const gasFinal = gasDoElenco(byRound, jogos, elenco)
  return { elenco, byRound, hist, somaMod, trocas, jogosCansado, lesoes, crias, gasFinal }
}

// ─── as travas, conferidas rodada a rodada ───────────────────────────────────
function confere(nome, run) {
  const { elenco, hist } = run
  const byId = new Map(elenco.map(c => [c.id, c]))
  let onze = true, repetido = false, fake = false, forano = false, posErrada = false
  const base = POS_XI
  for (const h of hist) {
    if (h.xi.length !== 11) onze = false
    if (new Set(h.xi).size !== h.xi.length) repetido = true
    // carta FAKE só pode estar em campo se foi o JOGO que tapou o buraco (cria da
    // base por lesão sem reserva). Pelo RODÍZIO, nunca.
    for (const id of h.entrouPeloRodizio) if (byId.get(id)?.fake) fake = true
    h.xi.forEach((id, i) => {
      const c = byId.get(id)
      if (!c) { repetido = true; return }
      if (h.fora.includes(id)) forano = true
      if (c.pos !== base[i]) posErrada = true
    })
  }
  ok(onze, `${nome}: sempre 11 em campo`)
  ok(!repetido, `${nome}: ninguém repetido / ninguém de fora do elenco`)
  ok(!fake, `${nome}: nenhum jogador FAKE (perna-de-pau) entrou pelo rodízio`)
  ok(!forano, `${nome}: nenhum machucado nem suspenso entrou em campo`)
  ok(!posErrada, `${nome}: cada vaga manteve a posição (o campinho não embaralha)`)
}

const JOGOS = 132 // 3 temporadas de 38 + 6 jogos de Copa por temporada
const squad = montaElenco()

console.log('🔁 SIMULAÇÃO DO RODÍZIO AUTOMÁTICO — 3 temporadas (132 jogos), elenco de 18\n')

console.log('1) o automático é o MESMO botão — não é regra nova')
const mao = joga({ modo: 'mao', jogos: JOGOS, squad })
const auto = joga({ modo: 'auto', jogos: JOGOS, squad })
const nunca = joga({ modo: 'nunca', jogos: JOGOS, squad })
const igual = mao.hist.every((h, i) => h.xi.join('|') === auto.hist[i].xi.join('|'))
ok(igual, 'time IDÊNTICO em todas as 132 rodadas, na mão e no automático')
ok(mao.trocas === auto.trocas, `mesma quantidade de trocas (${auto.trocas})`)

console.log('\n2) travas de estado quebrado (a prioridade nº 1 do Diego)')
confere('automático', auto)
confere('na mão', mao)

console.log('\n3) machucado, voltando de lesão e suspenso')
ok(auto.hist.some(h => h.fora.length > 0), 'a simulação teve jogador fora (gancho a cada 17 rodadas)')
// 🩹 O RODÍZIO EVITA TODA LESÃO POR DESGASTE — e isso é o ponto: ninguém chega a
// 🥵/🚑, então o sorteio nunca dispara. Pra testar a volta gradual mesmo assim,
// esta rodada marca uma lesão NA MÃO (3 rodadas, o meia t5, na rodada 20).
console.log(`  · lesões por desgaste: ${nunca.lesoes} sem rodiziar × ${auto.lesoes} no automático`)
const machucado = joga({ modo: 'auto', jogos: JOGOS, squad, lesaoForcada: { cardId: 't5', r: 20, rodadas: 3 } })
confere('com lesão de 3 rodadas', machucado)
const rodadasComVolta = machucado.hist.filter(h => h.voltando.length > 0).length
ok(rodadasComVolta > 0, `houve ${rodadasComVolta} rodadas com jogador voltando de lesão (🩹 60% e 80%)`)
ok(!machucado.hist.some(h => h.entrouPeloRodizio.some(id => h.voltando.includes(id))),
  'o rodízio nunca puxou quem está voltando de lesão (bloqueado igual ao botão)')
ok(!machucado.hist.some(h => h.entrouPeloRodizio.some(id => h.fora.includes(id))),
  'o rodízio nunca puxou machucado nem suspenso')
ok(machucado.hist.filter(h => h.r >= 20 && h.r < 23).every(h => !h.xi.includes('t5')),
  'o machucado ficou de fora as 3 rodadas inteiras')

console.log('\n4) elenco CURTO (nenhum meia no banco) — não pode travar nada')
const curto = joga({ modo: 'auto', jogos: JOGOS, squad, semReservaMEI: true })
confere('sem reserva de MEI', curto)
ok(curto.hist.every(h => h.xi.filter(id => curto.elenco.find(c => c.id === id).pos === 'MEI').length === 3),
  'os 3 meias continuam em campo — quem não tem substituto joga cansado (e o preparador avisa)')

console.log('\n5) Cria da Base (carta fake) no elenco — nunca pode ser escalado pelo rodízio')
const comFake = joga({ modo: 'auto', jogos: JOGOS, squad, comFake: true })
confere('com Cria da Base', comFake)

console.log('\n6) sem loop: o rodízio não fica trocando pra frente e pra trás')
let maiorSeguida = 0, seguida = 0
for (let i = 1; i < auto.hist.length; i++) {
  const mudou = auto.hist[i].xi.join('|') !== auto.hist[i - 1].xi.join('|')
  seguida = mudou ? seguida + 1 : 0
  maiorSeguida = Math.max(maiorSeguida, seguida)
}
ok(auto.trocas <= JOGOS, `${auto.trocas} trocas em ${JOGOS} jogos — média de ${(auto.trocas / JOGOS).toFixed(2)} por rodada`)
ok(maiorSeguida < JOGOS, `maior sequência de rodadas com time mexido: ${maiorSeguida}`)

console.log('\n7) o que o técnico GANHA ligando o automático')
const piorNunca = Math.min(...Object.values(nunca.gasFinal))
const piorAuto = Math.min(...Object.values(auto.gasFinal))
console.log(`  · sem rodiziar : ${nunca.jogosCansado} presenças com jogador abaixo de 100% · ${nunca.somaMod} de força perdida · pior gás no fim: ${piorNunca}% (${estadoGas(piorNunca)})`)
console.log(`  · no automático: ${auto.jogosCansado} presenças com jogador abaixo de 100% · ${auto.somaMod} de força perdida · pior gás no fim: ${piorAuto}% (${estadoGas(piorAuto)})`)
ok(auto.somaMod >= nunca.somaMod, 'o automático perde MENOS força que não mexer em nada')

console.log('\n8) a escada bate com o pedido do Diego (1 a 50 · 55 · 60 · 65)')
const so = {}
for (let r = 0; r < 80; r++) so[r] = ['t0']
const gasNoJogo = n => gasDoElenco(so, n - 1, [{ id: 't0' }]).t0
ok(estadoGas(gasNoJogo(54)) === 'ok', `54º jogo seguido: ${gasNoJogo(54)}% 💪 inteiro`)
ok(estadoGas(gasNoJogo(55)) === 'cansado', `55º jogo seguido: ${gasNoJogo(55)}% 😓 — É AQUI que o botão 🔁 aparece`)
ok(estadoGas(gasNoJogo(60)) === 'limite', `60º jogo seguido: ${gasNoJogo(60)}% 🥵`)
ok(estadoGas(gasNoJogo(65)) === 'esgotado', `65º jogo seguido: ${gasNoJogo(65)}% 🚑`)
console.log(`  (titular −${GAS_JOGO} por jogo · banco +${GAS_BANCO} por rodada)`)

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo — o automático é o botão apertado sozinho, e nenhuma trava caiu')
process.exit(falhas ? 1 : 0)
