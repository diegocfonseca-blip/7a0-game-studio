// 🪣 MONTE FINAL — os BURACOS do ⚙️ gerenciar caem em tempo real? (Diego, 15/09)
//
// Pedido dele: *"faça aquela situação do gerenciar, ver os buracos, em tempo real também:
// se o cara pegou um jogador, aí vai diminuindo"*.
//
// (O Monte voltou a mostrar SÓ o seu campinho — ele pediu, viu e voltou atrás. O que
// ficou daquela conversa foi o contador de buracos no ⚙️ gerenciar técnicos.)
//
// O que este teste prova, no reducer DE VERDADE:
//   1. quando OUTRO técnico pega no Monte, o elenco dele cresce e o buraco DIMINUI;
//   2. o estado vira uma REFERÊNCIA NOVA a cada jogada — é isso que faz o `Shell`
//      redesenhar e recontar `totalHoles`. (O reducer clona o estado inteiro:
//      `const s = JSON.parse(JSON.stringify(state))`.)
//   3. o mesmo vale pro `SYNC_STATE`, que é por onde o convidado recebe a jogada do
//      host numa sala online — é lá que a atualização chega pra quem está assistindo.
//
// ⚠️ Se algum dia alguém trocar o clone do reducer por mutação no lugar, o contador
// CONGELA e o teste 2 cai. É esse o alarme.
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

console.log('\n🔄 2) a tela REAGE? (o gatilho do redesenho do ⚙️ gerenciar)')
ok(depois.managers !== base.managers, 'state.managers virou uma referência NOVA — o Shell redesenha e reconta os buracos')
ok(depois.managers[1] !== base.managers[1], 'o técnico também é um objeto novo')
ok(depois.managers[1].squad !== base.managers[1].squad, 'e o elenco também')
ok(base.managers[1].squad.length === antes, 'o estado ANTERIOR não foi mutado (o reducer clona, não mexe no original)')

console.log('\n🌐 3) e pelo caminho do ONLINE (SYNC_STATE, que é como o convidado recebe)?')
// o host manda o estado já com a jogada aplicada; o convidado recebe por SYNC_STATE
const noConvidado = reducer(base, { type: 'SYNC_STATE', newState: depois })
ok(noConvidado.managers !== base.managers, 'depois do SYNC_STATE o managers também é referência nova')
const amigoNoConvidado = noConvidado.managers.find(m => m.id === 1)
ok(!!amigoNoConvidado && amigoNoConvidado.squad.some(c => c.name === 'GarrinSha'),
  'o convidado enxerga a sobra no elenco do amigo — é daqui que sai o contador de buracos')

console.log('\n🕳️ 4) o CONTADOR do ⚙️ gerenciar, passo a passo')
// é exatamente a conta que a linha do gerenciar faz: totalHoles(m) por técnico
const antesH = totalHoles(base.managers[1]), depoisH = totalHoles(amigoDepois)
ok(depoisH === antesH - 1, `o amigo foi de −${antesH} 🕳️ pra −${depoisH} 🕳️ na mesma jogada`)
ok(totalHoles(depois.managers.find(m => m.id === 0)) === totalHoles(base.managers[0]),
  'e o buraco de QUEM NÃO pegou não mexeu (cada linha conta o time dela)')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo — os buracos caem em tempo real')
await server.close()
process.exit(falhas ? 1 : 0)
