// Exercita os cases reais do reducer e o lançamento real do extrato, sem
// provider, autenticação, rede ou persistência de uma carreira de usuário.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
registerHooks({
 resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
   const candidate = fileURLToPath(new URL(specifier, context.parentURL))
   if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
  }
  return next(specifier, context)
 },
 load(url, context, next) {
  if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
  return next(url, context)
 },
})
const data = await import('../src/escalacao/estadiodata.ts')
const domain = await import('../src/escalacao/presidencia-estacionamento.ts')
const project = await import('../src/escalacao/presidencia-estadio-projeto.ts')
const { podeAlterarPresidencia } = await import('../src/escalacao/presidencia-carreira.ts')
const { valorEstadioPresidencia } = await import('../src/escalacao/presidencia-valores.ts')
const flags = await import('../src/escalacao/presidencia-lotes.ts')
assert.equal(flags.PRESIDENCY_PARKING_STAGES_RELEASED, true, 'publicação privada autorizada junto ao mapa com etapas físicas')

const source = fs.readFileSync(new URL('../src/escalacao/store.tsx', import.meta.url), 'utf8')
const begin = source.indexOf("    case 'STADIUM_PARKING_INVEST': {"), end = source.indexOf("    case 'BECOME_HOST': {", begin)
assert(begin >= 0 && end > begin)
const cases = source.slice(begin, end)
const ledgerBegin = source.indexOf('function logFin('), ledgerEnd = source.indexOf('// 🕴️ AGÊNCIA 2.0', ledgerBegin)
assert(ledgerBegin >= 0 && ledgerEnd > ledgerBegin)
const ledger = stripTypeScriptTypes(source.slice(ledgerBegin, ledgerEnd))
const buildReducer = (released, account = true) => {
 const deps = { ...data, ...domain, ...project, podeAlterarPresidencia,
  presidentWritesEnabled: () => account, PRESIDENCY_PARKING_STAGES_RELEASED: released }
 // O reducer principal clona antes do switch. O harness mantém essa fronteira
 // para conferir que nenhuma recusa ou atualização altera o estado de entrada.
 return new Function(...Object.keys(deps), ledger + '\nreturn (state,action)=>{const s=structuredClone(state);switch(action.type){' + cases + '}return state}')(...Object.values(deps))
}
const fixture = (stadium = { inv: { grama: 30 }, ext: ['loja'] }, coins = 70) => ({
 careerOnline: true, onlineMode: 'cpu', sport: 'futebol', youIdx: 0, seasonNo: 3, agenciaOn: true,
 managers: [{ id: 7, isHuman: true }, { id: 8, isHuman: false }],
 stadiums: { 7: structuredClone(stadium), 8: { inv: { geral: 40 }, ext: ['loja', 'estac'] } },
 careerCoins: { 7: coins, 8: 234 }, careerLedger: [{ id: 'anterior', season: 2, kind: 'stadium', label: 'Obra anterior', amount: -30 }],
 untouched: { title: 'preservar', squad: ['jogador-real'] },
})
const action = expectedStage => ({ type: 'STADIUM_PARKING_INVEST', mgrId: 7, expectedStage })
const gated = buildReducer(false)
const enabled = buildReducer(flags.PRESIDENCY_PARKING_STAGES_RELEASED)
const denyAccount = buildReducer(true, false)
let state = fixture()
const original = structuredClone(state), oldValue = valorEstadioPresidencia(state.stadiums[7])
assert.strictEqual(gated(state, action(0)), state, 'desligar a publicação impede a nova compra até para a conta autorizada')
assert.strictEqual(denyAccount(state, action(0)), state, 'a flag sozinha não concede acesso à conta')
const totals = []
for (let stage = 0; stage < 4; stage++) {
 const before = structuredClone(state), previous = state
 state = enabled(state, action(stage))
 assert.notStrictEqual(state, previous)
 assert.deepEqual(previous, before)
 const parking = domain.estacionamentoDoSave(state.stadiums[7])
 assert.equal(parking.stage, stage + 1)
 assert.equal(state.careerCoins[7], 70 - parking.investment)
 assert.equal(valorEstadioPresidencia(state.stadiums[7]), oldValue + parking.investment,
  'patrimônio acompanha as moedas investidas em cada lote sem duplicar a compra completa')
 const entry = state.careerLedger.at(-1)
 assert.equal(entry.kind, 'stadium'); assert.equal(entry.season, 3)
 assert.equal(entry.amount, -(stage === 3 ? 10 : 20))
 assert.equal(entry.label, `🅿️ Estacionamento: etapa ${stage + 1}/4`)
 assert.equal(state.careerLedger.length, stage + 2)
 assert.deepEqual(state.careerLedger[0], original.careerLedger[0])
 assert.deepEqual(state.stadiums[8], original.stadiums[8]); assert.equal(state.careerCoins[8], 234)
 assert.deepEqual(state.untouched, original.untouched)
 assert.strictEqual(enabled(state, action(stage)), state, 'clique repetido não cobra nem lança no extrato')
 assert.equal(data.extraUnlocked(state.stadiums[7], 'estacao'), stage === 3)
 assert.equal(data.stadiumIncome(state.stadiums[7]), data.stadiumIncome(original.stadiums[7]) + (stage === 3 ? 4 : 0))
 // O novo campo permanece no mesmo objeto salvo com saldo e extrato. Isto
 // verifica o round-trip do save, não executa o useEffect de autosave.
 const restored = JSON.parse(JSON.stringify(state))
 assert.deepEqual(restored.stadiums, state.stadiums)
 assert.deepEqual(restored.careerCoins, state.careerCoins)
 assert.deepEqual(restored.careerLedger, state.careerLedger)
 totals.push(parking.investment)
}
assert.strictEqual(enabled(state, action(4)), state, 'estacionamento completo não é comprado de novo')
assert.equal(state.careerCoins[7], 0)
assert.equal(state.careerLedger.slice(1).reduce((total, entry) => total + entry.amount, 0), -70)

const denials = [
 [fixture(), { ...action(0), mgrId: 8 }],
 [fixture(), { ...action(0), mgrId: 0 }],
 [fixture(), { ...action(0), mgrId: -1 }],
 [fixture(), { ...action(0), mgrId: 7.1 }],
 [fixture(), { ...action(0), mgrId: '7' }],
 [{ ...fixture(), onlineMode: 'online' }, action(0)],
 [{ ...fixture(), sport: 'basquete' }, action(0)],
 [{ ...fixture(), careerOnline: false }, action(0)],
 [{ ...fixture(), youIdx: 1 }, action(0)],
 [{ ...fixture(), managers: [{ id: 7, isHuman: false }] }, action(0)],
 [fixture({ inv: {}, ext: [] }), action(0)],
 [fixture(undefined, 19), action(0)],
 [fixture(undefined, NaN), action(0)],
 [fixture({ inv: {}, ext: ['loja'], estacionamentoInvestido: 30 }), action(0)],
 [fixture({ inv: {}, ext: ['loja'], estacionamentoInvestido: 70 }), action(4)],
 [fixture({ inv: {}, ext: ['loja', 'estac'], estacionamentoInvestido: 20 }), action(1)],
 [fixture(), { ...action(0), expectedStage: undefined }],
 [fixture(), { ...action(0), expectedStage: 1 }],
]
for (const [before, request] of denials) {
 const snapshot = structuredClone(before)
 assert.strictEqual(enabled(before, request), before, `nega sem modificar: ${JSON.stringify(request)}`)
 assert.deepEqual(before, snapshot)
}

// Regressão da compra binária pública: mesmo preço, mesmo patrimônio e
// mesmo lançamento; conta privada com a nova flag fechada também preserva.
const binaryAction = { type: 'STADIUM_BUILD', mgrId: 7, ext: 'estac' }
for (const reducer of [buildReducer(false, false), buildReducer(false, true), buildReducer(true, false)]) {
 const input = fixture(), bought = reducer(input, binaryAction)
 assert.equal(bought.careerCoins[7], 0)
 assert.deepEqual(bought.stadiums[7].ext, ['loja', 'estac'])
 assert.equal(bought.stadiums[7].estacionamentoInvestido, undefined)
 assert.equal(bought.careerLedger.at(-1).amount, -70)
 assert.equal(valorEstadioPresidencia(bought.stadiums[7]), oldValue + 70)
 assert.deepEqual(input, original)
}
assert.deepEqual(enabled(fixture(), binaryAction), fixture(), 'com etapas liberadas, callback antigo privado não pode comprar por fora')
for (const investment of [0, 20, 40, 60, 70, null, NaN]) {
 const input = fixture({ inv: {}, ext: ['loja'], estacionamentoInvestido: investment }, 100)
 for (const reducer of [buildReducer(false, false), buildReducer(false, true), buildReducer(true, false), enabled]) {
  const snapshot = structuredClone(input), output = reducer(input, binaryAction)
  assert.deepEqual(output, snapshot, 'a compra antiga nunca cobra mais 70 sobre save do novo formato')
  assert.deepEqual(input, snapshot)
 }
}
for (const legacy of [{ inv: {}, ext: ['estac'] }, { inv: { grama: 30 }, ext: ['loja', 'estac'] }]) {
 const input = fixture(legacy, 100)
 assert.strictEqual(enabled(input, action(4)), input)
 assert.equal(domain.estacionamentoDoSave(input.stadiums[7]).legacy, true)
 assert.equal(valorEstadioPresidencia(legacy), legacy.inv.grama === 30 ? 160 : 70)
}

assert.equal(valorEstadioPresidencia(undefined), 0)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: [] }), 0)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: ['medico'] }), 0)
assert.equal(valorEstadioPresidencia({ inv: { grama: 30 }, ext: ['grama'] }), 30)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: ['grama'] }), undefined)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: ['desconhecido'] }), undefined)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: ['loja'], estacionamentoInvestido: 30 }), undefined)
assert.equal(valorEstadioPresidencia({ inv: {}, ext: ['loja', 'estac'], estacionamentoInvestido: 70 }), 130)
assert.equal(valorEstadioPresidencia({ inv: { geral: Number.MAX_SAFE_INTEGER }, ext: ['estac'] }), undefined)
assert.equal(valorEstadioPresidencia({ inv: { geral: 2.5 }, ext: [] }), undefined)
console.log(JSON.stringify({ ok: true, releaseEnabled: flags.PRESIDENCY_PARKING_STAGES_RELEASED, totals,
 actualReducerCases: true, actualLedgerFunction: true, blockedCases: denials.length, otherAccountsPreserved: true,
 legacyPreserved: true, assetsCountedOnce: true, saveRoundTrip: true, providerAutosaveTested: false }))
