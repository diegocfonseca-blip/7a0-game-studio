#!/usr/bin/env node
// 🏋️ TRAVAS DO PREPARADOR FÍSICO (carreira).
//
// Pedido do Diego (14-15/09): *"a gente tem que tirar esse botão de rodiziar, e só
// aparecer esse botão se comprar o preparador físico… ele vai ter salário também… e
// também vai ter contrato de renovação"*; *"botão automático podemos pôr apenas pro que
// pagar o preparador lenda"*; e, sobre quem já usa o rodízio hoje, *"zero"* (ninguém
// ganha de brinde). Sobre QUANDO trocar, ele foi e voltou: pediu no 49% e, depois de ver
// a tabela dos dois jeitos, escolheu *"podemos fazer isso no 55"* — com a cor junto.
//
// O que esta trava protege, em ordem de perigo:
//  1. o PREÇO nunca vem de fora — a action leva só a chave, o valor sai do catálogo
//  2. sem preparador NADA trava: o gás continua andando, ninguém some do time
//  3. o automático é SÓ do 👑 Lenda
//  4. o gatilho do rodízio é o 😓 (55º jogo) — o MESMO ponto em que a barra vira
//     amarela e em que o motor começa a descontar. Um ponto só, três sinais.
//
// uso: node scripts/testa-preparador.mjs     (sai com código 1 se reprovar)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const C = await vite.ssrLoadModule('/src/escalacao/condicao.ts')
const P = await vite.ssrLoadModule('/src/escalacao/preparadores.ts')
const { reducer } = S
const { gasDoElenco, sugerirRodizio, pctBarra, pedeRodizio, estadoGas, modGas, corBarra, corGas, GAS_BANCO, GAS_JOGO } = C
const { PREPARADORES, preparadorDe, salarioPreparador, temAutomatico, CONTRATO_PRAZOS, CONTRATO_MAX, sorteiaPrazo } = P

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }
const perto = (a, b, t = 0.05) => Math.abs(a - b) <= t

const carta = (id, pos = 'MEI', extra = {}) => ({ id, name: `Jogador ${id}`, club: 'X', year: 2020, pos, fame: 2, lo: 60, hi: 80, ...extra })
const tec = (id, teamName, extra = {}) => ({ id, name: teamName, teamName, isHuman: false, formation: '4-3-3', money: 0, squad: [], aggression: .5, starHunger: .5, ...extra })
const base = (extra = {}) => ({
  onlineMode: 'solo', careerOnline: true, seasonNo: 3, youIdx: 0, screen: 'season', phase: 'idle',
  managers: [tec(0, 'Meia na Canela', { isHuman: true, squad: [carta('p1'), carta('p2')] }), tec(3, 'Bot')],
  careerCoins: { 0: 1200 }, careerLedger: [], ...extra,
})

console.log('\n1) 💰 comprar — o preço sai do CATÁLOGO, nunca de fora')
{
  const s = reducer(base(), { type: 'BUY_PREPARADOR', key: 'faria' })
  ok(s.careerPreparador?.['Meia na Canela'] === 'faria', 'contratou o Rui Faria')
  ok(s.careerCoins[0] === 1200 - 100, `cobrou 100 (ficou ${s.careerCoins[0]})`)
  const prazo1 = s.careerPreparadorContrato?.['Meia na Canela'] - 3 + 1
  ok(CONTRATO_PRAZOS.includes(prazo1), `o prazo sai da escada 3/5/10 (saiu ${prazo1})`)
  const log = (s.careerLedger ?? []).at(-1)
  ok(log && log.amount === -100 && log.kind === 'buy', 'saiu no extrato do clube como −100')
}
{
  // a action só aceita CHAVE: chave inventada não compra nada e não tira moeda
  const s = reducer(base(), { type: 'BUY_PREPARADOR', key: 'mourinho' })
  ok(!s.careerPreparador?.['Meia na Canela'] && s.careerCoins[0] === 1200, 'chave inventada não compra nem cobra')
}
{
  const s = reducer(base({ careerCoins: { 0: 999 } }), { type: 'BUY_PREPARADOR', key: 'seirulo' })
  ok(!s.careerPreparador?.['Meia na Canela'] && s.careerCoins[0] === 999, 'sem moedas suficientes não compra (999 < 1000)')
}
{
  const um = reducer(base(), { type: 'BUY_PREPARADOR', key: 'faria' })
  const dois = reducer(um, { type: 'BUY_PREPARADOR', key: 'seirulo' })
  ok(dois.careerPreparador['Meia na Canela'] === 'faria' && dois.careerCoins[0] === 1100, 'já tendo um, não compra outro por cima (nem cobra)')
}
{
  const s = reducer(base({ careerOnline: false }), { type: 'BUY_PREPARADOR', key: 'faria' })
  ok(!s.careerPreparador, 'fora da carreira não contrata')
}

console.log('\n2) 📝 renovar e dispensar — as MESMAS regras do técnico')
{
  const comprado = reducer(base(), { type: 'BUY_PREPARADOR', key: 'faria' }) // contrato até a T7
  const naT5 = { ...comprado, seasonNo: 5 }
  const cedo = reducer(naT5, { type: 'RENOVAR_PREPARADOR' })
  ok(cedo.careerCoins[0] === 1100, 'contrato em dia NÃO renova (nem cobra)')
  const naT8 = { ...comprado, seasonNo: 8 } // venceu no fim da T7
  const renov = reducer(naT8, { type: 'RENOVAR_PREPARADOR' })
  const prazoR = renov.careerPreparadorContrato['Meia na Canela'] - 8 + 1
  ok(CONTRATO_PRAZOS.includes(prazoR) && renov.careerCoins[0] === 1000, `vencido renova pelo mesmo preço, com prazo novo sorteado (saiu ${prazoR})`)
  const solto = reducer(naT8, { type: 'DISPENSAR_PREPARADOR' })
  ok(solto.careerPreparador['Meia na Canela'] === null && solto.careerCoins[0] === 1100, 'dispensa vencido sem multa (não cobra nada)')
  const naoSolta = reducer(naT5, { type: 'DISPENSAR_PREPARADOR' })
  ok(naoSolta.careerPreparador['Meia na Canela'] === 'faria', 'contrato em dia não dispensa')
}

console.log('\n3) 🤖 o automático é SÓ do 👑 Lenda')
for (const p of PREPARADORES) ok(temAutomatico(p) === (p.key === 'seirulo'), `${p.nome}: automático ${p.key === 'seirulo' ? 'SIM' : 'não'}`)
ok(temAutomatico(null) === false, 'sem preparador: automático não')

console.log('\n4) 💸 salário = 10% do preço, igual ao técnico')
for (const p of PREPARADORES) ok(salarioPreparador(p) === Math.round(p.preco / 10), `${p.nome}: ${p.preco} → ${salarioPreparador(p)}/temporada`)
ok(salarioPreparador(null) === 0, 'sem preparador: folha não muda')

console.log('\n5) 🔁 o gatilho: no 😓 (55º jogo) — cor, emoji e ação no MESMO ponto')
{
  // 📜 15/09 teve uma volta: cheguei a pôr o gatilho na barra em 49% (51º jogo), pra
  // casar com a cor daquele dia. O Diego preferiu o contrário — puxar a COR pro 55º e
  // deixar o gatilho onde sempre esteve. É isto que este bloco tranca.
  const g54 = 25.8, g55 = 24.4 // gás antes do 54º e do 55º jogo
  ok(!pedeRodizio(g54) && estadoGas(g54) === 'ok', `54º jogo (💪): NÃO pede rodízio — barra ${pctBarra(g54)}%`)
  ok(pedeRodizio(g55) && estadoGas(g55) === 'cansado', `55º jogo (😓): pede rodízio — barra ${pctBarra(g55)}%`)
  ok(corBarra(g54) === corGas('ok') && corBarra(g55) === corGas('cansado'), 'e a BARRA vira amarela exatamente aí — nada de alerta aceso com o preparador parado')
  ok(modGas(g54) === 0 && modGas(g55) === -1, 'o motor também começa a descontar aí (−0 → −1): um ponto só, três sinais')
  ok(!pedeRodizio(100), 'quem está cheio não é trocado')
}
{
  // a troca de verdade: o titular 😓 sai, o reserva inteiro entra
  const squad = [carta('t1'), carta('r1'), carta('velho')]
  const sug = sugerirRodizio(['t1'], squad, { t1: 24.4, r1: 100, velho: 25 })
  ok(sug && sug.trocas.length === 1 && sug.trocas[0].entra.id === 'r1', 'titular 😓 sai e o reserva cheio entra')
  ok(sugerirRodizio(['t1'], squad, { t1: 24.4, r1: 24.4, velho: 24.4 }) === null, 'banco todo 😓 também: NÃO troca (seria trocar por trocar)')
  ok(sugerirRodizio(['t1'], squad, { t1: 25.8, r1: 100, velho: 100 }) === null, 'titular ainda 💪 no 54º: não troca (o preparador não tira quem está inteiro)')
  ok(sugerirRodizio(['t1'], squad, { t1: 100, r1: 100, velho: 100 }) === null, 'time inteiro: não sugere nada')
}

console.log('\n6) 🏋️ o banco devolve o que o preparador devolve')
{
  const squad = [carta('a')]
  const byRound = { 0: [], 1: [], 2: [] } // 3 rodadas no banco
  const semPrep = gasDoElenco(byRound, 3, squad, 0, { a: 50 })
  ok(perto(semPrep.a, 50 + 3 * GAS_BANCO), `sem preparador: 3 rodadas no banco → +${3 * GAS_BANCO} (${semPrep.a})`)
  for (const p of PREPARADORES) {
    const g = gasDoElenco(byRound, 3, squad, 0, { a: 50 }, p.banco)
    // ⚠️ o teto de 100 é regra: ninguém passa de cheio por ter preparador bom
    const esperado = Math.min(100, 50 + 3 * p.banco)
    ok(perto(g.a, esperado), `${p.nome}: 3 rodadas → ${esperado}${esperado === 100 ? ' (bateu no teto de 100, como tem que ser)' : ''} (${g.a})`)
  }
  ok(gasDoElenco({ 0: [] }, 1, squad, 0, { a: 99 }, 20).a === 100, 'o teto de 100 vale pra todos — preparador não deixa ninguém acima de cheio')
  // e o desconto por JOGO não muda com preparador nenhum (ele não deixa ninguém mais forte)
  const jog = { 0: ['a'], 1: ['a'] }
  const semP = gasDoElenco(jog, 2, squad, 0, { a: 100 })
  const comP = gasDoElenco(jog, 2, squad, 0, { a: 100 }, 20)
  ok(semP.a === comP.a && perto(semP.a, 100 - 2 * GAS_JOGO), 'jogar custa o mesmo com ou sem preparador (ele só ajuda a RECUPERAR)')
}

console.log('\n7) 🛡️ sem preparador NADA trava')
{
  // o gás continua andando igualzinho — ninguém perde jogador nem fica preso
  const squad = [carta('a')]
  const g = gasDoElenco({ 0: ['a'], 1: [] }, 2, squad, 0, { a: 80 })
  ok(perto(g.a, 80 - GAS_JOGO + GAS_BANCO), `gás anda normalmente sem preparador nenhum (${g.a})`)
  ok(preparadorDe(null) === null && preparadorDe(undefined) === null, 'save antigo (sem o campo) = sem preparador, sem quebrar')
  const s = reducer(base(), { type: 'SET_CONDICAO_AUTO', on: true })
  ok(s.condicaoAuto === true, 'a preferência do automático continua guardando (quem comprar o Lenda já acha ligada)')
}

console.log('\n8) 📝 "100 temporadas não existe" — o contrato da comissão tem TETO')
{
  // Diego (18/09), com print de dois amigos: *"empresário com 100 temporadas, técnico
  // com 100 temporadas… 100 temporadas não existe, pô"* (98 no técnico, 115 no
  // preparador). A causa: o RESTORE_CAREER zerava honras, caixa e estádio da carreira
  // anterior, mas os mapas da COMISSÃO nasceram depois e ficaram de fora — retomar uma
  // carreira ANTIGA carregava o contrato da ADIANTADA, marcado lá na frente.
  // Aqui a cura: contrato de comissão nunca falta mais que CONTRATO_TEMPORADAS.
  const torto = base({
    seasonNo: 5,
    careerPreparador: { 'Meia na Canela': 'seirulo' },
    careerPreparadorContrato: { 'Meia na Canela': 119 },   // 115 faltando — impossivel mesmo com o teto de 10
    careerTecnicoContrato: { 'Meia na Canela': 102, 'Bot': 7 }, // Bot: falta 3, dentro da regra
  })
  const s = reducer({ ...base(), screen: 'intro' }, { type: 'RESUME_CAREER_SOLO', saved: torto })
  const fimPrep = s.careerPreparadorContrato?.['Meia na Canela']
  const fimTec = s.careerTecnicoContrato?.['Meia na Canela']
  ok(fimPrep - s.seasonNo + 1 === CONTRATO_MAX, `preparador voltou pro teto de ${CONTRATO_MAX} temporadas (era 115, virou ${fimPrep - s.seasonNo + 1})`)
  ok(fimTec - s.seasonNo + 1 === CONTRATO_MAX, `tecnico voltou pro teto de ${CONTRATO_MAX} temporadas (era 98, virou ${fimTec - s.seasonNo + 1})`)
  ok(s.careerPreparador?.['Meia na Canela'] === 'seirulo', 'ninguem perde o funcionario que pagou — so o numero e consertado')
  ok(s.careerTecnicoContrato?.['Bot'] === 7, 'contrato que ja estava dentro da regra nao e tocado')
}
{
  // e a faxina do RESTORE_CAREER agora leva a comissão junto
  const sujo = { ...base({ seasonNo: 90 }), careerPreparador: { X: 'seirulo' }, careerPreparadorContrato: { X: 94 }, careerTecnicos: { X: 'Alguem' }, careerTecnicoContrato: { X: 94 } }
  const s = reducer(sujo, { type: 'RESTORE_CAREER', save: { division: 'D', seasonNo: 6, titles: 0, teamName: 'Meia na Canela', formation: '4-3-3', squad: [] } })
  ok(!s.careerPreparadorContrato || Object.keys(s.careerPreparadorContrato).length === 0, 'carreira retomada nao herda contrato de preparador da outra')
  ok(!s.careerTecnicoContrato || Object.keys(s.careerTecnicoContrato).length === 0, 'carreira retomada nao herda contrato de tecnico da outra')
  ok(!s.careerPreparador || Object.keys(s.careerPreparador).length === 0, 'nem o preparador em si')
}

console.log('\n9) 🎲 o PRAZO SORTEADO (Diego 18/09: "opcao A, mas quero mais tempos, falta um de dez")')
{
  // o prazo da comissao passou a sair sorteado na MESMA escada do jogador.
  // A trava garante tres coisas: so sai da escada, nunca passa do teto, e a media
  // nao pode ser PIOR que os 5 fixos de antes — item pago nao vira aposta ruim.
  const conta = {}
  let soma = 0
  const N = 20000
  let rngI = 0
  const rng = () => { rngI = (rngI * 1664525 + 1013904223) >>> 0; return rngI / 4294967296 }
  for (let i = 0; i < N; i++) { const v = sorteiaPrazo(rng); conta[v] = (conta[v] ?? 0) + 1; soma += v }
  const saiu = Object.keys(conta).map(Number).sort((a, b) => a - b)
  ok(saiu.every(v => CONTRATO_PRAZOS.includes(v)), `so sai da escada ${CONTRATO_PRAZOS.join('/')} (saiu ${saiu.join('/')})`)
  ok(saiu.length === CONTRATO_PRAZOS.length, 'todos os degraus acontecem — nenhum e inalcancavel')
  ok(Math.max(...saiu) <= CONTRATO_MAX, `nenhum sorteio passa do teto de ${CONTRATO_MAX}`)
  const media = soma / N
  ok(media >= 5, `a media (${media.toFixed(2)}) nao e pior que os 5 fixos de antes`)
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
await vite.close()
process.exit(falhas === 0 ? 0 : 1)
