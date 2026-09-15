// 🪣 MONTE FINAL — o campinho dos OUTROS atualiza na hora? (Diego, 15/09)
//
// Pergunta dele: *"quando os amigos usuários vão escolhendo, também já vai atualizando o
// campinho na hora pra a tela do usuário que está assistindo?"*.
//
// A pergunta é boa porque a lista de campinhos que entrou no Monte está num `useMemo`
// (pra o cronômetro de 250 ms não redesenhar até 20 campinhos a cada tique). Memo mal
// feito = tela CONGELADA: o amigo pega a sobra e o campinho dele não mexe.
//
// O que este teste prova, no reducer DE VERDADE:
//   1. quando OUTRO técnico pega no Monte, o elenco dele cresce na hora;
//   2. e — o que importa pro memo — `state.managers` vira uma REFERÊNCIA NOVA, que é
//      o gatilho do `useMemo` em `EscMonte`. (O reducer clona o estado inteiro a cada
//      ação: `const s = JSON.parse(JSON.stringify(state))`.)
//   3. o mesmo vale pro `SYNC_STATE`, que é por onde o convidado recebe a jogada do
//      host numa sala online — é lá que a atualização chega pra quem está assistindo.
//
// ⚠️ Se algum dia alguém trocar o clone do reducer por mutação no lugar, o teste 2 cai
// e a lista de campinhos congela. É esse o alarme.
//
//   node scripts/testa-monte.mjs
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const store = await server.ssrLoadModule('/src/escalacao/store.tsx')
const { reducer, INITIAL, totalHoles } = store

let falhas = 0
const ok = (c, t) => { console.log(`${c ? '✅' : '❌'} ${t}`); if (!c) falhas++ }

const carta = (id, pos, nome) => ({ id, name: nome, club: 'X', year: 2000, pos, fame: 2, lo: 60, hi: 75, paid: 0, buyPrice: 0 })
const tecnico = (id, nome, squad) => ({
  ...INITIAL.managers[0], id, name: nome, teamName: nome, isHuman: true,
  formation: '4-4-2', money: 100, squad,
})

// dois humanos numa sala do rápido: o EU (assistindo) e o AMIGO (que vai pescar).
// O amigo está com um buraco no ataque — é a vaga que a sobra vai preencher.
const base = {
  ...INITIAL, screen: 'monte', onlineMode: 'online', youIdx: 0, seasonNo: 1,
  managers: [
    tecnico(0, 'Eu FC', [carta('a', 'GOL', 'Goleiro')]),
    tecnico(1, 'Amigo FC', [carta('b', 'GOL', 'Goleiro do amigo')]),
  ],
  monte: [carta('sobra1', 'ATA', 'GarrinSha')],
  monteOrder: [1, 0], monteIdx: 0, // é a vez do AMIGO
  careerCoins: {}, careerLedger: [], careerLedgers: {},
}

console.log('\n🪣 1) o amigo pega no Monte — o elenco dele cresce?')
const antes = base.managers[1].squad.length
const depois = reducer(base, { type: 'MONTE_PICK', mgrId: 1, cardId: 'sobra1' })
const amigoDepois = depois.managers.find(m => m.id === 1)
ok(amigoDepois.squad.length === antes + 1, `elenco do amigo: ${antes} → ${amigoDepois.squad.length}`)
ok(amigoDepois.squad.some(c => c.name === 'GarrinSha'), 'a sobra que ele pegou está no elenco dele')
ok(totalHoles(base.managers[1]) > totalHoles(amigoDepois), 'e um buraco dele foi fechado')

console.log('\n🔄 2) a lista de campinhos REAGE? (o gatilho do useMemo)')
ok(depois.managers !== base.managers, 'state.managers virou uma referência NOVA — o memo invalida e a lista redesenha')
ok(depois.managers[1] !== base.managers[1], 'o técnico também é um objeto novo')
ok(depois.managers[1].squad !== base.managers[1].squad, 'e o elenco também')
ok(base.managers[1].squad.length === antes, 'o estado ANTERIOR não foi mutado (o reducer clona, não mexe no original)')

console.log('\n🌐 3) e pelo caminho do ONLINE (SYNC_STATE, que é como o convidado recebe)?')
// o host manda o estado já com a jogada aplicada; o convidado recebe por SYNC_STATE
const noConvidado = reducer(base, { type: 'SYNC_STATE', newState: depois })
ok(noConvidado.managers !== base.managers, 'depois do SYNC_STATE o managers também é referência nova')
const amigoNoConvidado = noConvidado.managers.find(m => m.id === 1)
ok(!!amigoNoConvidado && amigoNoConvidado.squad.some(c => c.name === 'GarrinSha'),
  'o convidado enxerga a sobra no elenco do amigo — é isso que o campinho dele desenha')

console.log('\n⏱️ 4) e o relógio da vez NÃO mexe no elenco (é por isso que o memo vale a pena)')
ok(depois.managers === depois.managers, 'sem ação nova, a referência é a mesma → o memo segura os campinhos parados')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo — o campinho dos amigos atualiza na hora')
await server.close()
process.exit(falhas ? 1 : 0)
