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
  fornPorTemporada, fornLiberado, fornAtivo, fornValor, fornecedorDe, FORNECEDORES,
  calculaVendas, torcidaDoEstadio, faixaDaPos,
} = loja
const { reducer, INITIAL } = store

let falhas = 0
const ok = (c, t) => { console.log(`${c ? '✅' : '❌'} ${t}`); if (!c) falhas++ }

// ── 1) a régua do fornecedor ────────────────────────────────────────────────
console.log('\n👟 1) régua do fornecedor (moedas por temporada)')
const REGUA = { V: [1, 2, 2, 3], D: [3, 4, 5, 7], C: [6, 9, 11, 16], B: [13, 18, 23, 33], A: [25, 35, 45, 65] }
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
ok(!fornLiberado(naique, 'C'), 'Naique (5 temporadas) NÃO fecha com clube da Série C')
ok(fornLiberado(naique, 'B'), 'Naique fecha da Série B pra cima')
ok(fornLiberado(penalti, 'V'), 'Pênalti do Bairro fecha até na Várzea (ninguém fica sem opção)')

// ── 3) contrato congela e não quebra ────────────────────────────────────────
console.log('\n👟 3) o contrato congela na divisão da assinatura')
const c = { fornId: 'adibas', anos: 2, div: 'D', desde: 5, porTemporada: fornPorTemporada('D', 2) }
ok(fornValor(c) === 4, `assinou na Série D por 2 temporadas → 4 🪙 (deu ${fornValor(c)})`)
ok(fornAtivo(c, 5) && fornAtivo(c, 6), 'cobre as temporadas 5 e 6')
ok(!fornAtivo(c, 7), 'na 7 já acabou (chegam propostas novas)')
ok(fornValor(c) === 4, 'subiu pra Série C no meio? o valor continua 4 — o contrato NÃO quebra')

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
console.log('\n🛡️ 7) carreira SEM careerLoja não é tocada (teste fechado)')
const carta = (id, pos) => ({ id, name: pos, club: 'X', year: 2000, pos, fame: 2, lo: 60, hi: 70, paid: 1, buyPrice: 1 })
const base = {
  ...INITIAL, screen: 'season', careerOnline: true, onlineMode: 'solo', seasonNo: 5, youIdx: 0,
  managers: [{ ...INITIAL.managers[0], id: 1, isHuman: true, teamName: 'Sem Loja FC', squad: [carta('a', 'GOL')] }],
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
s2 = reducer(s2, { type: 'LOJA_FORNECEDOR', fornId: 'adibas', mgrId: 1 })
ok(s2.careerLoja[1].forn?.fornId === 'adibas', 'assinou a Adibas (2 temporadas, Série C)')
ok(s2.careerLoja[1].forn?.porTemporada === 9, `valor congelado da Série C: 9 (deu ${s2.careerLoja[1].forn?.porTemporada})`)
s2 = reducer(s2, { type: 'LOJA_FORNECEDOR', fornId: 'pumba', mgrId: 1 })
ok(s2.careerLoja[1].forn?.fornId === 'adibas', 'tentou trocar pela Pumba no meio: RECUSADO')
let s3 = reducer({ ...base, careerLoja: { 1: {} } }, { type: 'LOJA_FORNECEDOR', fornId: 'naique', mgrId: 1 })
ok(!s3.careerLoja[1].forn, 'Naique na Série C: RECUSADO pelo reducer (a trava não é só da tela)')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
await server.close()
process.exit(falhas ? 1 : 0)
