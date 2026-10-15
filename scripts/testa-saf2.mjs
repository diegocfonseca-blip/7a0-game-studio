// 🏢➡️⚽ trava da SAF QUE VIRA 2º CLUBE (13/10, Diego: "Ok pode ser assim").
// Confere as regras PURAS (saf2.ts — a tela e o reducer usam as mesmas) e o reducer de verdade:
// tabelas de venda, coleção de taças com lucro máximo +500, as 10 temporadas, só pagante, a janela,
// o reembolso da migração, metade do salário, transferência 1 por janela, aporte só numa direção.
// E que, com a chave DESLIGADA, a SAF e o 2º clube antigos seguem iguais.
//   npm run saf2
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
let n = 0
const ok = (cond, txt) => { assert.ok(cond, txt); n++ }
try {
  const R = await vite.ssrLoadModule('/src/escalacao/saf2.ts')
  const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const SP = await vite.ssrLoadModule('/src/escalacao/sport.ts')
  const { reducer, INITIAL } = S

  // ── 1. venda da SAF pela divisão ────────────────────────────────────────────
  assert.deepEqual(['V', 'D', 'C', 'B', 'A'].map(R.valorVendaSaf), [500, 1000, 1500, 2000, 2500]); n++
  ok(R.valorVendaSaf(undefined) === 1000, 'sem divisão = Série D')
  ok(Math.max(...['V', 'D', 'C', 'B', 'A'].map(R.valorVendaSaf)) - R.PRECO_SAF === R.LUCRO_MAXIMO, 'SAF: lucro máximo +500 (só na A)')

  // ── 2. 2º clube pela coleção de taças ───────────────────────────────────────
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(R.valorTacas), [3000, 3580, 4170, 4750, 5330, 5920, 6500]); n++
  ok(R.valorTacas(9) === 6500 && R.valorTacas(-2) === 3000, 'fora da faixa não passa dos limites')
  ok(R.valorTacas(6) - (R.PRECO_SAF + R.PRECO_COMANDO) === R.LUCRO_MAXIMO, '2º clube: as 6 taças = +500, nunca mais')
  for (let k = 0; k <= 6; k++) ok(R.valorTacas(k) - 6000 <= 500, `com ${k} taças o lucro não passa de 500`)
  ok(R.colecao(['A', 'A', 'copa', 'mundo', 'B', 'copaDoMundo']).length === 2, 'taça repetida, Série B e Copa do Mundo não contam')
  ok(R.addTaca(['A'], 'A').length === 1, 'ganhar a mesma taça de novo não soma')
  const v = R.valorVenda2oClube({ tacas: ['A', 'copa'], caixa: 380 })
  ok(v.base === 4170 && v.caixa === 380 && v.total === 4550, 'mockup ⑦: 2 taças = 4.170 + caixa 380')
  ok(R.valorVenda2oClube({ tacas: [], caixa: -200 }).total === 2800, 'dívida desconta')
  ok(R.valorVenda2oClube({ tacas: [], caixa: 0, antigo: true }).base === 3000, '2º clube antigo: piso de 3.000')
  ok(R.valorVenda2oClube({ tacas: ['A', 'copa', 'supercopa', 'libertadores'], caixa: 0, antigo: true }).base === 5330, 'antigo: recebe o MAIOR entre 3.000 e as taças')
  ok(R.investido2o({ origemSaf: true, aportes: 300 }) === 6300 && R.investido2o({}) === 4000, 'investido: SAF 2.000 + comando 4.000 + aportes (antigo = 4.000)')
  ok(R.lucroVenda(4170, 6000) === -1830, 'mockup ⑦: 4.170 · −1.830')

  // ── 3. assumir o comando: 10 temporadas, pagante, moedas, janela ────────────
  const base = { temSaf: true, tem2o: false, janela: true, pagante: true, seasonNo: 19, safDesde: 9, caixa: 5210 }
  ok(R.podeAssumir(base).ok, '10 de 10, pagante, 5.210 no caixa, na janela = pode')
  ok(R.podeAssumir({ ...base, seasonNo: 13 }).motivo === 'temporadas' && R.podeAssumir({ ...base, seasonNo: 13 }).faltamTemporadas === 6, 'mockup ②: 4 de 10 → faltam 6')
  ok(R.podeAssumir({ ...base, seasonNo: 13, semEspera: true }).ok, 'migração (ficou com a SAF): sem as 10 temporadas')
  ok(R.podeAssumir({ ...base, pagante: false }).motivo === 'pagante', 'grátis não assume (só pagante)')
  ok(R.podeAssumir({ ...base, caixa: 3999 }).motivo === 'moedas' && R.podeAssumir({ ...base, caixa: 3999 }).faltamMoedas === 1, 'sem os 4.000 não assume')
  ok(R.podeAssumir({ ...base, janela: false }).motivo === 'janela', 'fora da virada não assume')
  ok(R.podeAssumir({ ...base, tem2o: true }).motivo === 'ja-tem-2o', 'já tem 2º clube: não assume outro')
  ok(R.ehPagante('prata') && R.ehPagante('ouro') && !R.ehPagante('bege') && !R.ehPagante(null), 'Craque antigo e Lenda são pagantes; grátis não')
  ok(R.ehPagante(null, { pago: true }) && R.ehPagante('bege', { batismo: true }) && R.ehPagante(null, { socioAtivo: true }) && !R.ehPagante(null, {}), 'plano novo, batismo e sócio contam')

  // ── 4. janela, migração, salário, transferência, aporte ─────────────────────
  ok(R.janelaAberta({ careerOnline: true, screen: 'season', round: 0 }), 'janela = tela da temporada antes da 1ª rodada')
  ok(!R.janelaAberta({ careerOnline: true, screen: 'season', round: 1 }) && !R.janelaAberta({ careerOnline: true, screen: 'auction', round: 0 }) && !R.janelaAberta({ careerOnline: true, online: true, screen: 'season', round: 0 }), 'fora disso (ou online) fecha')
  ok(R.precisaMigrar({ temSaf: true, tem2o: true }) && !R.precisaMigrar({ temSaf: true, tem2o: true, migrado: true }) && !R.precisaMigrar({ temSaf: true, tem2o: false }), 'migração só pra quem tem os dois, uma vez')
  ok(R.reembolsoMigracao('2o') === 2000 && R.reembolsoMigracao('saf') === 4000, 'reembolso inteiro: 2.000 (SAF) ou 4.000 (2º clube)')
  ok(R.metadeSalario(100) === 5 && R.metadeSalario(30) === 2 && R.metadeSalario(0) === 0, 'metade do salário (salário = piso ÷ 10)')
  ok(R.podeTransferir({ janela: true, seasonNo: 7, caixaComprador: 100, valor: 30 }) === 'ok', 'transferência ok')
  ok(R.podeTransferir({ janela: true, ultimaTransf: 7, seasonNo: 7, caixaComprador: 100, valor: 30 }) === 'ja-fez', '1 por janela')
  ok(R.podeTransferir({ janela: true, seasonNo: 7, caixaComprador: 10, valor: 30 }) === 'caixa', 'comprador sem caixa')
  ok(R.podeAportar({ valor: 100, caixaPrincipal: 100 }) && !R.podeAportar({ valor: 101, caixaPrincipal: 100 }) && !R.podeAportar({ valor: -5, caixaPrincipal: 100 }) && !R.podeAportar({ valor: 1.5, caixaPrincipal: 100 }), 'aporte: positivo, inteiro, até o que o principal tem')

  // ── 5. o REDUCER de verdade ──────────────────────────────────────────────────
  const carta = (id, pos, paid = 20) => ({ id, name: `J-${id}`, club: 'Clube', year: 2000, pos, fame: 2, lo: 60, hi: 70, paid, buyPrice: paid, via: 'leilao' })
  const onze = (p) => [carta(`${p}g1`, 'GOL'), carta(`${p}l1`, 'LAT'), carta(`${p}l2`, 'LAT'), carta(`${p}z1`, 'ZAG'), carta(`${p}z2`, 'ZAG'), carta(`${p}m1`, 'MEI'), carta(`${p}m2`, 'MEI'), carta(`${p}m3`, 'MEI'), carta(`${p}a1`, 'ATA'), carta(`${p}a2`, 'ATA'), carta(`${p}a3`, 'ATA')]
  const tecnico = (id, nome, extra = {}) => ({ ...INITIAL.managers[0], id, name: nome, teamName: nome, isHuman: true, formation: '4-3-3', money: 0, squad: [...onze(`c${id}`), carta(`c${id}m4`, 'MEI')], ...extra })
  const comSaf = (o = {}) => ({
    ...INITIAL, screen: 'season', careerOnline: true, onlineMode: 'solo', seasonNo: 19, round: 0, seed: 777, youIdx: 0,
    managers: [tecnico(1, 'Seu Clube FC')], careerCoins: { 1: 5210 }, careerRivals: [],
    careerFilial: { team: 'Galáxia EC', since: 9, earned: 0, titlesAtBuy: 0, loanOut: [], loanIn: [] },
    cpuSquads: { 'Galáxia EC': onze('gx') }, careerPlacements: { m1: 'A', 'Galáxia EC': 'C' }, clubCash: { 'Galáxia EC': 380 },
    ...o,
  })
  const coins = (st, id) => st.careerCoins?.[id] ?? 0

  // chave DESLIGADA: tudo como antes
  SP.saf2ParaTeste(false)
  ok(reducer(comSaf(), { type: 'SAF2_ASSUMIR', pagante: true }).careerFilial?.team === 'Galáxia EC', 'chave desligada: SAF2_ASSUMIR não faz nada')
  const velhaVenda = reducer(comSaf(), { type: 'SELL_FILIAL' })
  ok(velhaVenda.careerFilial === null && coins(velhaVenda, 1) === 5210 + S.filialSaleValue(comSaf()).value, 'chave desligada: a venda velha da SAF segue igual')
  const doisVelho = () => ({ ...comSaf({ careerFilial: null }), managers: [tecnico(1, 'Seu Clube FC'), tecnico(2, 'Bagres 1993', { mine: true, dormindo: true })], multiClube: { team: 'Bagres 1993', id: 2, since: 4 }, careerCoins: { 1: 100, 2: 250 } })
  const vendaVelha2o = reducer(doisVelho(), { type: 'SELL_MULTICLUBE' })
  ok(!vendaVelha2o.multiClube && coins(vendaVelha2o, 1) === 100 + 3000 && vendaVelha2o.managers[1].isHuman === false, 'chave desligada: o 2º clube antigo vende por 3.000 (o miolo refatorado é o mesmo)')

  // chave LIGADA
  SP.saf2ParaTeste(true)
  ok(reducer(comSaf(), { type: 'SELL_MULTICLUBE' }) && reducer(doisVelho(), { type: 'SELL_MULTICLUBE' }).multiClube, 'SAF nova: a venda velha de 3.000 não existe mais')
  ok(reducer(comSaf({ seasonNo: 13 }), { type: 'SAF2_ASSUMIR', pagante: true }).careerFilial, 'faltam 6 temporadas: não assume')
  ok(reducer(comSaf(), { type: 'SAF2_ASSUMIR', pagante: false }).careerFilial, 'não pagante: não assume')
  ok(reducer(comSaf({ round: 3 }), { type: 'SAF2_ASSUMIR', pagante: true }).careerFilial, 'no meio da temporada: não assume')
  const assumiu = reducer(comSaf(), { type: 'SAF2_ASSUMIR', pagante: true })
  const seg = assumiu.managers.find(m => m.mine)
  ok(!assumiu.careerFilial && seg && seg.teamName === 'Galáxia EC' && seg.dormindo && seg.squad.length === 11, 'assumiu: a SAF vira o 2º clube com o mesmo elenco, dormindo')
  ok(coins(assumiu, 1) === 1210 && coins(assumiu, seg.id) === 380, 'pagou 4.000 do principal; o caixa da SAF vira o caixa do 2º clube')
  ok(assumiu.careerPlacements[`m${seg.id}`] === 'C' && assumiu.careerPlacements['Galáxia EC'] === undefined, 'nasce na divisão em que a SAF estava (C)')
  ok(assumiu.multiClube?.id === seg.id && assumiu.saf2?.origemSaf && S.saf2Valor2o(assumiu).investido === 6000, 'investido = 6.000')

  // venda da SAF pela divisão
  const vendeuSaf = reducer(comSaf(), { type: 'SAF2_VENDER_SAF' })
  ok(!vendeuSaf.careerFilial && coins(vendeuSaf, 1) === 5210 + 1500, 'SAF na Série C vende por 1.500')
  ok(reducer(comSaf({ round: 2 }), { type: 'SAF2_VENDER_SAF' }).careerFilial, 'venda da SAF só na janela')
  ok(reducer(comSaf(), { type: 'SELL_FILIAL' }).careerFilial, 'SAF nova: a venda velha (base + títulos) não roda mais')

  // empréstimo com a SAF só na janela
  ok(reducer(comSaf({ round: 4 }), { type: 'LOAN_TO_FILIAL', cardId: 'c1m4' }).careerFilial.loanOut.length === 0, 'empréstimo pra SAF fora da janela: travado')
  ok(reducer(comSaf(), { type: 'LOAN_TO_FILIAL', cardId: 'c1m4' }).careerFilial.loanOut.length === 1, 'empréstimo pra SAF na janela: vai')

  // 2º clube: taças, aporte, empréstimo, transferência, venda
  let d = { ...assumiu, saf2: { ...assumiu.saf2, tacas: ['A', 'copa'] } }
  d = reducer(d, { type: 'SAF2_APORTE', valor: 200 })
  ok(coins(d, 1) === 1010 && coins(d, seg.id) === 580 && d.saf2.aportes === 200, 'aporte: principal → 2º clube')
  ok(coins(reducer(d, { type: 'SAF2_APORTE', valor: 5000 }), 1) === 1010, 'aporte maior que o caixa: travado')
  d = reducer(d, { type: 'SAF2_EMPRESTAR', cardId: 'c1m4' })
  ok(d.managers.find(m => m.id === seg.id).squad.some(c => c.id === 'c1m4' && c.emprestado), 'empréstimo pro 2º clube: o jogador vai, marcado como emprestado')
  ok(reducer({ ...d, round: 1 }, { type: 'SAF2_EMPRESTAR', cardId: 'c1a1' }).saf2.emprestimos.length === 1, 'empréstimo entre clubes fora da janela: travado')
  ok(reducer(d, { type: 'SAF2_EMPRESTAR', cardId: 'c1a1' }).saf2.emprestimos.length === 1, 'não deixa abrir buraco no titular de quem empresta')
  const antesT = coins(d, seg.id)
  d = reducer(d, { type: 'SAF2_TRANSFERIR', cardId: 'gxa3' })
  ok(d.managers[0].squad.some(c => c.id === 'gxa3') === false, 'transferência que abriria buraco no titular do 2º clube: travada')
  const tPrinc = { ...d, managers: d.managers.map(m => m.id === 1 ? { ...m, squad: [...m.squad, carta('extra1', 'ZAG', 30), carta('extra2', 'ZAG', 30)] } : m) }
  let t = reducer(tPrinc, { type: 'SAF2_TRANSFERIR', cardId: 'extra1' })
  const val = S.valorOficial(t, carta('extra1', 'ZAG', 30))
  ok(t.managers.find(m => m.id === seg.id).squad.some(c => c.id === 'extra1') && coins(t, seg.id) === antesT - val && coins(t, 1) === coins(tPrinc, 1) + val, 'transferência de vez pelo valor oficial: dinheiro passa de um caixa pro outro')
  ok(reducer(t, { type: 'SAF2_TRANSFERIR', cardId: 'extra2' }).managers[0].squad.some(c => c.id === 'extra2'), '2ª transferência na mesma janela: travada')
  const venda2o = S.saf2Valor2o(t)
  ok(venda2o.base === 4170 && venda2o.investido === 6200, 'venda do 2º clube: 2 taças = 4.170 · investido 6.200 (com o aporte)')
  const vendeu2o = reducer(t, { type: 'SAF2_VENDER_2O' })
  ok(!vendeu2o.multiClube && coins(vendeu2o, 1) === coins(t, 1) + venda2o.total && vendeu2o.managers.find(m => m.id === seg.id).isHuman === false, 'vendeu: taças + caixa caem no principal e o clube volta pra máquina')
  ok(vendeu2o.managers[0].squad.some(c => c.id === 'c1m4' && !c.emprestado), 'o emprestado volta pro dono na venda')

  // migração: quem tem SAF e 2º clube antigo separados
  const sep = () => ({ ...comSaf(), managers: [tecnico(1, 'Seu Clube FC'), tecnico(2, 'Bagres 1993', { mine: true, dormindo: true })], multiClube: { team: 'Bagres 1993', id: 2, since: 4 }, careerCoins: { 1: 100, 2: 250 } })
  const fica2o = reducer(sep(), { type: 'SAF2_MIGRAR', fica: '2o' })
  ok(!fica2o.careerFilial && fica2o.multiClube && coins(fica2o, 1) === 2100 && fica2o.saf2.migrado, 'fica com o 2º clube: SAF sai, +2.000 inteiros')
  ok(S.saf2Valor2o(fica2o).antigo && S.saf2Valor2o(fica2o).base === 3000, 'o 2º clube antigo continua com o piso de 3.000')
  const ficaSaf = reducer(sep(), { type: 'SAF2_MIGRAR', fica: 'saf' })
  ok(ficaSaf.careerFilial && !ficaSaf.multiClube && coins(ficaSaf, 1) === 100 + 4000 + 250 && ficaSaf.saf2.semEspera, 'fica com a SAF: 2º clube sai, +4.000 inteiros (+ caixa dele)')
  const ja = reducer({ ...ficaSaf, seasonNo: 10 }, { type: 'SAF2_ASSUMIR', pagante: true })
  ok(!ja.careerFilial && ja.multiClube, '…e a SAF vira 2º clube na hora, sem esperar as 10 temporadas')
  const sepAtivo2o = { ...sep(), youIdx: 1, managers: [tecnico(1, 'Seu Clube FC', { dormindo: true }), tecnico(2, 'Bagres 1993', { mine: true })], multiClube: { team: 'Seu Clube FC', id: 1, since: 4 } }
  const ficaSaf2 = reducer(sepAtivo2o, { type: 'SAF2_MIGRAR', fica: 'saf' })
  ok(!ficaSaf2.multiClube && ficaSaf2.managers[ficaSaf2.youIdx].id === 1 && coins(ficaSaf2, 1) === 4350, 'com o 2º clube no comando: volta pro principal antes de devolver')
  ok(reducer(fica2o, { type: 'SAF2_MIGRAR', fica: 'saf' }) && reducer(fica2o, { type: 'SAF2_MIGRAR', fica: 'saf' }).multiClube, 'migração só uma vez')
  ok(reducer(sep(), { type: 'BUY_MULTICLUBE', team: 'X' }).multiClube.id === 2 && reducer(comSaf(), { type: 'BUY_MULTICLUBE', team: 'X' }).multiClube == null, 'SAF nova: 2º clube não se compra mais direto')
  ok(reducer({ ...doisVelho() }, { type: 'BUY_FILIAL', team: 'Outro' }).careerFilial == null, 'com 2º clube não compra SAF (escada única)')

  // ── 6. A VIRADA: metade do salário de cada lado e o empréstimo volta sozinho ──
  const semEmp = { ...assumiu, seasonNo: 19, round: 38, screen: 'season' }
  const comEmp = reducer({ ...assumiu }, { type: 'SAF2_EMPRESTAR', cardId: 'c1m4' })
  const vira = st => reducer({ ...st, round: 38 }, { type: 'OPEN_RESERVE_LIST', placements: st.careerPlacements, champions: { [`m${seg.id}`]: 'A' }, copaChampion: null, supercopaChampion: null })
  const v0 = vira(semEmp), v1 = vira(comEmp)
  const meio = R.metadeSalario(20), cheio = R.salarioCheio(20)
  ok(coins(v1, 1) - coins(v0, 1) === cheio - meio, `quem emprestou paga só a metade (${meio}) em vez do salário cheio (${cheio})`)
  ok(coins(v0, seg.id) - coins(v1, seg.id) === meio, `quem recebeu paga a outra metade (${meio}) — antes era zero`)
  ok(v1.managers.find(m => m.id === 1).squad.some(c => c.id === 'c1m4' && !c.emprestado) && !v1.managers.find(m => m.id === seg.id).squad.some(c => c.id === 'c1m4'), 'na virada o emprestado volta sozinho pro dono')
  ok((v1.saf2.emprestimos ?? []).length === 0, 'a lista de empréstimos zera na virada')
  ok(S.saf2Tacas(v0).includes('A'), 'título da Série A do 2º clube entra na coleção de taças')
  // SAF: emprestado pra SAF também volta na virada, e a SAF paga metade
  const safEmp = reducer(comSaf(), { type: 'LOAN_TO_FILIAL', cardId: 'c1m4' })
  const vs0 = vira(comSaf()), vs1 = vira(safEmp)
  ok(coins(vs1, 1) - coins(vs0, 1) === cheio - meio, 'emprestado pra SAF: você paga metade')
  ok(vs1.careerFilial.loanOut.length === 0 && vs1.managers[0].squad.some(c => c.id === 'c1m4'), 'emprestado pra SAF volta sozinho na virada')
  ok((vs0.clubCash['Galáxia EC'] ?? 0) - (vs1.clubCash['Galáxia EC'] ?? 0) === meio, 'e a SAF paga a outra metade do caixa dela')

  SP.saf2ParaTeste(false)
  console.log(`✅ SAF que vira 2º clube: ${n} conferências passaram`)
} finally {
  await vite.close()
}
