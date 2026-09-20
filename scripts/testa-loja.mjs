// 🛍️ LOJA DO CLUBE — teste das regras (15/09).
// O que ele PROVA, na ordem em que o Diego se importa:
//   1. 🔒 carreira SEM `careerLoja` não é tocada — nem moeda, nem extrato. É a
//      trava que garante "nunca quebrar o futebol" enquanto a loja está em teste
//      fechado na conta dele;
//   2. 👟 o fornecedor CONGELA o valor na divisão em que assinou e NÃO quebra ao
//      subir ou cair (ordem dele, copiada do Master);
//   3. 👟 marca grande só fecha com clube da divisão dela pra cima;
//   4. 👟 não dá pra trocar de fornecedor no meio do contrato (sem rescisão);
//   5. 💰 a aposta do preço funciona: só se manteve → popular ganha · campeão →
//      cara ganha;
//   6. 🔴 quem CAI não vende nada, em qualquer preço;
//   7. 🛍️ sem a obra "Loja do Clube" não há venda nenhuma.
//   node scripts/testa-loja.mjs
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const loja = await server.ssrLoadModule('/src/escalacao/loja.ts')
const store = await server.ssrLoadModule('/src/escalacao/store.tsx')
const {
  fornPorTemporada, fornLiberado, fornOfertas, fornBonusLoja, fornAtivo, fornValor, fornecedorDe, FORNECEDORES,
  calculaVendas, torcidaDoEstadio, faixaDaPos,
} = loja
const { reducer, INITIAL } = store

let falhas = 0
const ok = (c, t) => { console.log(`${c ? '✅' : '❌'} ${t}`); if (!c) falhas++ }

// ── 1) a régua do fornecedor ────────────────────────────────────────────────
console.log('\n👟 1) régua do fornecedor (moedas por temporada)')
const REGUA = { V: [3, 4, 5, 7], D: [4, 5, 7, 10], C: [8, 11, 14, 20], B: [15, 21, 27, 39], A: [30, 42, 54, 78] }
for (const [d, esperado] of Object.entries(REGUA)) {
  const v = [1, 2, 3, 5].map(a => fornPorTemporada(d, a))
  ok(JSON.stringify(v) === JSON.stringify(esperado), `${d}: ${v.join('/')} (esperado ${esperado.join('/')})`)
}
// o fornecedor tem que pagar MENOS que o Master em toda divisão e todo prazo
const est = await server.ssrLoadModule('/src/escalacao/estadiodata.ts')
let menorSempre = true
for (const d of ['V', 'D', 'C', 'B', 'A']) for (const a of [1, 2, 3, 5])
  if (fornPorTemporada(d, a) >= est.masterPorTemporada(d, a)) menorSempre = false
ok(menorSempre, 'o fornecedor paga MENOS que o Master em TODA divisão e prazo (ordem do Diego)')

// ── 2) trava de divisão ─────────────────────────────────────────────────────
console.log('\n🔒 2) marca grande só procura quem subiu')
const naique = FORNECEDORES.find(f => f.id === 'naique')
const penalti = FORNECEDORES.find(f => f.id === 'penalti')
ok(!fornLiberado(naique, 'B'), 'Naique (Elite e Luxo) NÃO fecha com clube da Série B')
ok(fornLiberado(naique, 'A'), 'Naique só fecha na Série A')
ok(!fornLiberado(penalti, 'V'), 'Penality (Clássicas Regionais) não desce até a Várzea')
const hawaianos = FORNECEDORES.find(f => f.id === 'hawaianos')
ok(fornLiberado(hawaianos, 'V'), 'a Várzea tem marca própria (ninguém fica sem opção)')
// 🎲 e a vitrine da vez: 4 papéis, um de cada prazo, do meu andar e do de baixo
const ofertas = fornOfertas('A', 12345, 7)
ok(ofertas.length === 4, `a vitrine traz 4 propostas (deu ${ofertas.length})`)
ok(new Set(ofertas.map(f => f.anos)).size === 4, 'uma de cada prazo (1 · 2 · 3 · 5)')
ok(ofertas.every(f => ['A', 'B'].includes(f.desde)), 'na Série A só aparecem marcas da A e da B')
ok(JSON.stringify(fornOfertas('A', 12345, 7)) === JSON.stringify(ofertas), 'o sorteio é preso na semente: reabrir o jogo dá a MESMA vitrine')
ok(!fornOfertas('A', 12345, 7, 'naique').some(f => f.id === 'naique'), 'a marca que já é minha sai dos papéis (ela fica na faixa de RENOVAR)')
ok(fornOfertas('A', 12345, 7, 'naique').length === 4, 'e mesmo assim nenhum papel fica vazio')
ok(fornOfertas('V', 12345, 7).every(f => f.desde === 'V'), 'na Várzea só aparecem as 4 do bairro')

// ── 3) contrato congela e não quebra ────────────────────────────────────────
console.log('\n👟 3) o contrato congela na divisão da assinatura')
const c = { fornId: 'adibas', anos: 2, div: 'D', desde: 5, porTemporada: fornPorTemporada('D', 2) }
ok(fornValor(c) === 5, `assinou na Série D por 2 temporadas → 5 🪙 (deu ${fornValor(c)})`)
ok(fornAtivo(c, 5) && fornAtivo(c, 6), 'cobre as temporadas 5 e 6')
ok(!fornAtivo(c, 7), 'na 7 já acabou (chegam propostas novas)')
ok(fornValor(c) === 5, 'subiu pra Série C no meio? o valor continua 5 — o contrato NÃO quebra')

// ── 4) a aposta do preço ────────────────────────────────────────────────────
console.log('\n💰 4) a aposta do preço')
// clube de Série C: Geral + Cadeiras prontas, com estacionamento e a loja
const st = { inv: { geral: 60, cadeiras: 90 }, ext: ['loja', 'estac'] }
ok(torcidaDoEstadio(st) === 52000, `torcida = 12.000 + assentos = ${torcidaDoEstadio(st)}`)
const m = (pos, preco) => calculaVendas({ st, pos, preco, fornLoja: 0.20 }).moedas
const tab = { manteve: 10, acesso: 3, campeao: 1 }
console.log('preço    │ manteve │ classif │ campeão │ caiu')
for (const p of ['popular', 'normal', 'cara'])
  console.log(`${p.padEnd(9)}│${String(m(tab.manteve, p)).padStart(8)} │${String(m(tab.acesso, p)).padStart(8)} │${String(m(tab.campeao, p)).padStart(8)} │${String(m(18, p)).padStart(5)}`)
ok(m(10, 'popular') > m(10, 'cara'), `só se manteve: popular (${m(10, 'popular')}) rende MAIS que cara (${m(10, 'cara')})`)
ok(m(1, 'cara') > m(1, 'popular'), `campeão: cara (${m(1, 'cara')}) rende MAIS que popular (${m(1, 'popular')})`)
ok(m(3, 'normal') >= m(3, 'popular') && m(3, 'normal') >= m(3, 'cara'), `classificação: a normal é a melhor (${m(3, 'normal')})`)

// ── 5) caiu não vende nada ──────────────────────────────────────────────────
console.log('\n🔴 5) quem cai não vende nada')
ok(faixaDaPos(17) === 'caiu' && faixaDaPos(16) === 'manteve', 'a faixa vira em 17º (Z4 de 20 times)')
ok(['popular', 'normal', 'cara'].every(p => m(18, p) === 0), 'zero em TODOS os preços')

// ── 6) sem a obra, sem loja ─────────────────────────────────────────────────
console.log('\n🏗️ 6) sem a obra da Loja do Clube não há venda')
ok(loja.lojaConstruida(st), 'com a obra, a loja existe')
ok(!loja.lojaConstruida({ inv: { geral: 60 }, ext: [] }), 'sem a obra, não existe')

// ── 7) A TRAVA QUE MAIS IMPORTA: carreira sem Loja não é tocada ─────────────
// ⚠️ Esta trava valia como rede do teste fechado e CONTINUA valendo depois da
// liberação geral: quem nunca abriu a Loja (nunca construiu a obra) não tem
// `careerLoja` no save, e nada de loja pode tocar no caixa dele.
console.log('\n🛡️ 7) carreira SEM careerLoja não é tocada')
const carta = (id, pos) => ({ id, name: pos, club: 'X', year: 2000, pos, fame: 2, lo: 60, hi: 70, paid: 1, buyPrice: 1 })
const base = {
  ...INITIAL, screen: 'season', careerOnline: true, onlineMode: 'solo', seasonNo: 5, youIdx: 0,
  managers: [{ ...INITIAL.managers[0], id: 1, isHuman: true, teamName: 'Sem Loja FC', formation: '4-4-2', squad: [carta('a', 'GOL')] }],
  careerCoins: { 1: 100 }, careerLedgers: {}, careerLedger: [],
  stadiums: { 1: st }, careerPlacements: { m1: 'C' }, booksSeason: 4,
}
const semLoja = reducer({ ...base }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 1 } })
const comLoja = reducer({ ...base, careerLoja: { 1: { preco: 'normal' } } }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 1 } })
const linhasLoja = (s) => (s.careerLedger ?? []).concat(Object.values(s.careerLedgers ?? {}).flat()).filter(l => /Loja|Material/.test(l?.label ?? ''))
ok(linhasLoja(semLoja).length === 0, `sem careerLoja: NENHUMA linha de loja no extrato (achou ${linhasLoja(semLoja).length})`)
ok(linhasLoja(comLoja).length > 0, `com careerLoja: a venda entra no extrato (${linhasLoja(comLoja).map(l => l.label).join(', ')})`)
ok(!!comLoja.careerLoja?.[1]?.balanco, 'e o balanço fica guardado pra tela da temporada nova')
ok(comLoja.careerLoja?.[1]?.balanco?.pos === 1, 'o balanço guarda a colocação final (1º)')

// ── 8) sem rescisão ─────────────────────────────────────────────────────────
console.log('\n✍️ 8) não dá pra trocar de fornecedor no meio do contrato')
let s2 = { ...base, careerLoja: { 1: {} } }
s2 = reducer(s2, { type: 'LOJA_FORNECEDOR', fornId: 'ombro', mgrId: 1 })
ok(s2.careerLoja[1].forn?.fornId === 'ombro', 'assinou a Ombro (2 temporadas, Série C)')
ok(s2.careerLoja[1].forn?.porTemporada === 11, `valor congelado da Série C: 11 (deu ${s2.careerLoja[1].forn?.porTemporada})`)
s2 = reducer(s2, { type: 'LOJA_FORNECEDOR', fornId: 'meuzuno', mgrId: 1 })
ok(s2.careerLoja[1].forn?.fornId === 'ombro', 'tentou trocar pela Meuzuno no meio: RECUSADO')
let s3 = reducer({ ...base, careerLoja: { 1: {} } }, { type: 'LOJA_FORNECEDOR', fornId: 'naique', mgrId: 1 })
ok(!s3.careerLoja[1].forn, 'Naique na Série C: RECUSADO pelo reducer (a trava não é só da tela)')
// 🤝 RENOVAÇÃO (20/09): a marca que já era dele fica, com o selo de fidelidade —
// e o valor é recalculado na divisão de HOJE, não no contrato velho.
let s4 = { ...base, careerLoja: { 1: { forn: { fornId: 'ombro', anos: 2, div: 'D', desde: 1, porTemporada: fornPorTemporada('D', 2) } } } }
s4 = reducer(s4, { type: 'LOJA_FORNECEDOR', fornId: 'ombro', mgrId: 1, fidelidade: true })
ok(s4.careerLoja[1].forn?.fidelidade === true, 'renovou com a mesma marca e ganhou o selo de fidelidade')
ok(s4.careerLoja[1].forn?.porTemporada === fornPorTemporada('C', 2), 'e o valor foi recalculado na divisão de HOJE (subiu de D pra C)')
ok(Math.abs(fornBonusLoja(s4.careerLoja[1].forn) - 0.25) < 1e-9, 'o bônus de loja vira 25% (20% da marca + 5% de fidelidade)')
let s5 = { ...base, careerLoja: { 1: { forn: { fornId: 'ombro', anos: 2, div: 'D', desde: 1, porTemporada: 5 } } } }
s5 = reducer(s5, { type: 'LOJA_FORNECEDOR', fornId: 'naique', mgrId: 1, fidelidade: true })
ok(!s5.careerLoja[1].forn || s5.careerLoja[1].forn.fornId === 'ombro', 'não dá pra "renovar" com uma marca que nunca foi sua')

// ── 9) SEM A LOJA NÃO HÁ FORNECEDOR (ordem do Diego, 15/09) ────────────────
console.log('\n🔒 9) sem a loja construída não há fornecedor nem venda')
const stSemLoja = { inv: { geral: 60 }, ext: [] } // 1 setor, sem a obra da loja
const semObra = reducer({ ...base, stadiums: { 1: stSemLoja }, careerLoja: { 1: {} } },
  { type: 'LOJA_FORNECEDOR', fornId: 'penalti', mgrId: 1 })
ok(!semObra.careerLoja[1].forn, 'sem a obra da loja, assinar fornecedor é RECUSADO pelo reducer')
const comObra = reducer({ ...base, stadiums: { 1: st }, careerLoja: { 1: {} } },
  { type: 'LOJA_FORNECEDOR', fornId: 'penalti', mgrId: 1 })
ok(!!comObra.careerLoja[1].forn, 'com a obra, assina normalmente')
ok(calculaVendas({ st: stSemLoja, pos: 1, preco: 'normal' }).moedas > 0 === true, '(a conta pura ignora a obra — quem barra é o reducer/tela)')
const fechouSemObra = reducer({ ...base, stadiums: { 1: stSemLoja }, careerLoja: { 1: { preco: 'normal' } } },
  { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 1 } })
ok(linhasLoja(fechouSemObra).length === 0, 'e na virada sem a obra não entra NENHUMA moeda de loja')

// ── 10) o +6 fixo da obra vira as vendas (só pra quem tem a Loja) ───────────
console.log('\n💰 10) a obra da Loja não paga mais +6 fixo pra quem tem a aba')
const caixa = (s2) => s2.careerCoins?.[1] ?? 0
const semAba = reducer({ ...base, stadiums: { 1: st } }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 10 } })
const comAba = reducer({ ...base, stadiums: { 1: st }, careerLoja: { 1: { preco: 'normal' } } }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 10 } })
const est2 = est.stadiumIncome(st), est3 = est.stadiumIncome(st, true)
ok(est2 - est3 === 6, `stadiumIncome com e sem a loja difere exatamente nos 6 da obra (${est2} × ${est3})`)
ok(caixa(semAba) > 100, `quem NÃO tem a aba continua recebendo o estádio cheio (caixa ${caixa(semAba)})`)
ok(caixa(comAba) > caixa(semAba), `quem tem a aba troca os 6 fixos pelas vendas e sai na frente (${caixa(comAba)} × ${caixa(semAba)})`)

// ── 11) o degrau de divisão continua valendo a pena ────────────────────────
console.log('\n📈 11) subir de divisão continua compensando (Diego: "não atrapalhar a Série B")')
const mst = (d, a) => est.masterPorTemporada(d, a)
ok(mst('C', 5) < mst('B', 3), `Master: o melhor da Série C (${mst('C', 5)}) fica abaixo do de 3 temporadas da B (${mst('B', 3)})`)
ok(fornPorTemporada('C', 5) < fornPorTemporada('B', 3), `Fornecedor: idem (${fornPorTemporada('C', 5)} < ${fornPorTemporada('B', 3)})`)
for (const [a, b] of [['V','D'],['D','C'],['C','B'],['B','A']])
  ok(mst(a, 1) < mst(b, 1) && fornPorTemporada(a, 1) < fornPorTemporada(b, 1), `${a} paga menos que ${b} no contrato de 1 temporada`)

// ── 12) 💰 QUANDO CADA UM PAGA (Diego 15/09) — e a migração dos saves antigos ──
// Esta é a parte que mexe em dinheiro de quem JÁ ESTÁ JOGANDO, então é a que mais
// precisa de prova. A regra: Master · fornecedor · bico caem ao COMEÇAR a temporada;
// Pontual e venda de camisas ficam no fim. E o save que já tinha começado a temporada
// quando a regra chegou recebe no FIM daquela (ordem dele), sem receber duas vezes.
console.log('\n💰 12) contratos fixos pagam no COMEÇO; aposta continua no fim')
const stB = { inv: { geral: 100, cadeiras: 100, visitante: 100, camarote: 100 }, ext: ['loja'] }
const comContratos = {
  ...base, seasonNo: 5, round: 0, stadiums: { 1: stB },
  careerMaster: { 1: { brandId: 'vadico', anos: 5, div: 'C', desde: 3 } },
  careerLoja: { 1: { preco: 'normal', forn: { fornId: 'pumba', anos: 3, div: 'C', desde: 4, porTemporada: fornPorTemporada('C', 3) } } },
  careerBico: { brandId: 'vadico', since: 3 },
  careerSponsorBet: { 1: { season: 5, tier: 1, brandId: 'padaria' } },
}
const rotulos = (s2) => (s2.careerLedger ?? []).concat(Object.values(s2.careerLedgers ?? {}).flat()).map(l => l?.label ?? '')
const tem = (s2, re) => rotulos(s2).some(l => re.test(l))

// a) apertou COMEÇAR → os três já entram
const comecou = reducer({ ...comContratos }, { type: 'PLAY_ROUND' })
ok(comecou.careerCoins[1] > 100, `ao começar a temporada o caixa sobe na hora (100 → ${comecou.careerCoins[1]})`)
ok(tem(comecou, /Master/), 'extrato do começo tem a linha do 🏆 Master')
ok(tem(comecou, /Material/), 'extrato do começo tem a linha do 👟 fornecedor')
ok(tem(comecou, /Bico/), 'extrato do começo tem a linha do 🕴️ bico')
ok(!tem(comecou, /Loja ·/), 'a 🛍️ venda de camisas NÃO entra no começo (é aposta)')
const esperado = 100 + est.masterPorTemporada('C', 5) + fornPorTemporada('C', 3) + 10
ok(comecou.careerCoins[1] === esperado, `valor certo: Master + fornecedor + bico (${comecou.careerCoins[1]} = ${esperado})`)

// b) começar de novo não paga de novo
const deNovo = reducer({ ...comecou, round: 0 }, { type: 'PLAY_ROUND' })
ok(deNovo.careerCoins[1] === comecou.careerCoins[1], 'apertar COMEÇAR duas vezes não paga duas vezes')

// c) o fechamento da temporada que já pagou no começo NÃO repete
const fechouDepois = reducer({ ...comecou, booksSeason: 4 }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 10 } })
const soVendas = fechouDepois.careerCoins[1] - comecou.careerCoins[1]
const master2x = rotulos(fechouDepois).filter(l => /Master/.test(l)).length
ok(master2x === 1, `o 🏆 Master aparece UMA vez no extrato da temporada (achou ${master2x})`)
ok(soVendas > 0, `no fim entram as outras receitas, incluindo as vendas (+${soVendas})`)

// d) 🛡️ SAVE ANTIGO (já estava no meio da temporada): o FIM paga os três
const antigo = reducer({ ...comContratos, round: 12, booksSeason: 4 }, { type: 'CLOSE_SEASON_BOOKS', finalPos: { 1: 10 } })
ok(tem(antigo, /Master/) && tem(antigo, /Material/) && tem(antigo, /Bico/),
  'save que já tinha começado a temporada recebe os três no FIM dela (ninguém perde parcela)')
ok(antigo.pagoAdiantado?.[1]?.master === 5, 'e fica marcado como pago, pra não repetir')

// e) e na temporada SEGUINTE ele volta a receber no começo
const proxima = reducer({ ...antigo, seasonNo: 6, round: 0 }, { type: 'PLAY_ROUND' })
ok(proxima.careerCoins[1] > antigo.careerCoins[1], 'na temporada seguinte os contratos fixos caem no COMEÇO, como combinado')

// f) quem não tem nada disso não é tocado
const semNada = reducer({ ...base, round: 0 }, { type: 'PLAY_ROUND' })
ok(semNada.careerCoins[1] === 100, 'carreira sem Master/fornecedor/bico não ganha moeda nenhuma ao começar')

// g) 🚫🤝 A TRAVA QUE PRENDEU TODO MUNDO (19/09): com o patrocinador pontual removido,
//    a rodada 0 tem que ANDAR sem aposta nenhuma. O reducer exigia a aposta da
//    temporada — e, sem a tela que apostava, o botão verde virava botão mudo (print do
//    Cr7 Leilão, T48). Este check existe pra isso nunca mais voltar.
const semAposta = reducer({ ...base, round: 0 }, { type: 'PLAY_ROUND' })
ok(semAposta.round === 1, 'sem patrocinador pontual, COMEÇAR A TEMPORADA funciona (rodada 0 → 1)')
const comRestoDeAposta = reducer({ ...base, round: 0, careerSponsorBet: { 1: { season: 1, tier: 1, brandId: 'padaria' } } }, { type: 'PLAY_ROUND' })
ok(comRestoDeAposta.round === 1, 'e save antigo com aposta velha guardada também anda (o resíduo não trava nada)')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
await server.close()
process.exit(falhas ? 1 : 0)
