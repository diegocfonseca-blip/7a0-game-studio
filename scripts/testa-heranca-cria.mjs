// 🧪 TRAVA: a Cria da Base (e os eventos de jogador) NÃO podem vazar de uma
// carreira pro jogo RÁPIDO nem pro Minhas Ligas. Relato do Diego (11/09):
// *"esse negócio de base tá aparecendo nos modos rápidos e minhas ligas"*.
// Rodar da RAIZ do repo:  node scripts/testa-heranca-cria.mjs
// 🧪 prova do conserto: com criaNews "sujo" de uma carreira anterior, um jogo
// RÁPIDO (solo e online) tem que nascer LIMPO.
import { createServer } from 'vite'
const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { reducer, INITIAL } = await s.ssrLoadModule('/src/escalacao/store.tsx')

// estado sujo, como fica quando a pessoa saiu de uma carreira
const sujo = (base) => ({ ...base,
  criaNews: [{ texto: 'historia velha', nome: 'Pintinho', pos: 'LAT' }],
  criaNames: ['Pintinho'],
  eventoTemporada: { status: 'pendente' },
  reserveAuction: true,
})

const ver = (rot, st) => {
  const n = (st.criaNews ?? []).length
  console.log(`${rot.padEnd(34)} criaNews=${n}  criaNames=${(st.criaNames ?? []).length}  evento=${st.eventoTemporada ? 'SIM' : 'não'}  reservas=${st.reserveAuction ? 'SIM' : 'não'}  → ${n === 0 ? '✅ limpo' : '❌ VAZOU'}`)
  return n === 0
}

const vazio = INITIAL
let ok = true

// 1) rápido SOLO
ok = ver('rápido solo (START)', reducer(sujo(vazio), {
  type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: 5,
})) && ok

// 2) rápido ONLINE (é o que o Minhas Ligas usa: career = false)
ok = ver('rápido online (START_ONLINE)', reducer(sujo(vazio), {
  type: 'START_ONLINE', roomId: 'r1', roomCode: 'ABC', isHost: true, playerIndex: 0,
  playerNames: ['Diego', 'Amigo'], formation: '4-3-3', career: false,
})) && ok

// 3) carreira online CONTINUA funcionando (nasce limpa também, como sempre)
ok = ver('carreira online (START_ONLINE career)', reducer(sujo(vazio), {
  type: 'START_ONLINE', roomId: 'r2', roomCode: 'DEF', isHost: true, playerIndex: 0,
  playerNames: ['Diego', 'Amigo'], formation: '4-3-3', career: true,
})) && ok

console.log(ok ? '\n✅ PASSOU: nenhum modo herda a Cria da Base' : '\n❌ FALHOU')
await s.close()
process.exit(ok ? 0 : 1)
