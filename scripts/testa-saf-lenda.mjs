// 🏢👑 A LENDA DA AGÊNCIA FICA DESTRAVADA DEPOIS DA 1ª SAF (23/10, Diego: "se ele comprou, já destrava").
//   node scripts/testa-saf-lenda.mjs
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { temSafAgencia, INITIAL } = await server.ssrLoadModule('/src/escalacao/store.tsx')
const { agenciaRenda } = await server.ssrLoadModule('/src/escalacao/estadiodata.ts')
let erros = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }
const base = { ...INITIAL, careerOnline: true, onlineMode: 'solo' }
ok(!temSafAgencia(base), 'nunca teve SAF: Lenda travada')
ok(temSafAgencia({ ...base, careerFilial: { team: 'X', since: 1, earned: 0 } }), 'tem SAF agora: destravada')
ok(temSafAgencia({ ...base, careerFilial: null, saf2: { migrado: true, clubeId: 20, tacas: [] } }), 'caso Fabulous: trocou a SAF pelo 2º clube (migração) — continua destravada')
ok(temSafAgencia({ ...base, careerFilial: null, safJaTeve: true }), 'comprou e vendeu (marca nova): continua destravada')
ok(temSafAgencia({ ...base, careerFilial: null, careerLedger: [{ id: 'a', season: 40, kind: 'safsell', label: '🏢 Venda da SAF · Bangu', amount: 900 }] }), 'save antigo que vendeu a SAF (só o extrato prova): destravada')
ok(!temSafAgencia({ ...base, careerLedger: [{ id: 'b', season: 40, kind: 'safbuy', label: '🏛️ Compra do 2º clube (Multiclubes) · Bangu', amount: -4000 }] }), 'só comprou 2º clube do jeito antigo (sem SAF): continua travada')
const cards = [...Array(20)].map((_, i) => ({ fame: 4, name: `c${i}` })).concat([{ fame: 5, name: 'Ademir da Guia' }, { fame: 5, name: 'Marcos' }])
const st = { built: ['s1', 's2', 's3', 's4', 's5', 's6'], extras: ['e1'] }
ok(agenciaRenda(cards, undefined, true).by.lenda.unlocked && agenciaRenda(cards, undefined, true).by.lenda.income === 12, 'as 2 Lendas do Fabulous rendem 6 cada com a SAF contada')
await server.close()
if (erros) { console.log(`\n❌ ${erros} falha(s)`); process.exit(1) }
console.log('\n✅ Lenda da Agência segue a SAF que ele JÁ teve')
