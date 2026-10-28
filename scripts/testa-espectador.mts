// 🧪 👁️ MODO ESPECTADOR "FANTASMA" (28/10). Regra do Diego: *"ele entra mas não joga, pode falar no chat… o nome não aparece
// na lista… como um fantasma"* + *"não quero erro, não quero bugs"* (medo de mudar cadeira).
// Confere no MOTOR: o fantasma assiste pelos olhos do dono · nunca é dono · as cadeiras (seatUids/managers) do dono não mudam ·
// troca de cadeira/coroa/auto-cura não pegam nele · reconexão de jogador de verdade apaga a marca · sair limpa tudo ·
// e a TRAVA DE GRAVAÇÃO: com o fantasma ligado, nenhuma escrita no banco sai do aparelho; desligado, nada muda.
// uso: npx tsx scripts/testa-espectador.mts   (ou npm run espectador)
import { reducer, INITIAL } from '../src/escalacao/store'
import { instalaTravaEspectador, setModoEspectador } from '../src/escalacao/espectador'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

const UIDS = ['uid-dono', 'uid-ana', 'uid-bia']
// o DONO monta a partida (como no START_ONLINE de verdade) e anda até o leilão
let host = reducer(structuredClone(INITIAL) as EscState, {
  type: 'START_ONLINE', roomId: 'sala1', roomCode: 'ABC123', isHost: true, playerIndex: 0, playerNames: ['Dono FC', 'Ana FC', 'Bia FC'],
  seatUids: UIDS, youUid: 'uid-dono', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa',
} as never)
const fotoCadeiras = JSON.stringify({ seat: host.seatUids, mg: host.managers.map(m => [m.id, m.isHuman, m.name]) })

console.log('👁️ 1) entrar assistindo')
let esp = reducer(structuredClone(INITIAL) as EscState, { type: 'ASSISTIR_ONLINE', state: structuredClone(host), roomId: 'sala1', roomCode: 'ABC123', youUid: 'uid-fantasma', hostUid: 'uid-dono' })
ok(esp.espectador === true && esp.espHostUid === 'uid-dono', 'marca de espectador ligada, olhando pelo dono')
ok(esp.isHost === false, 'o fantasma NÃO é dono')
ok(esp.onlineMode === 'online' && esp.roomId === 'sala1', 'está na sala certa (só ouvindo)')
ok(esp.managers[esp.youIdx]?.id === 0 && esp.managers[esp.youIdx]?.name === 'Dono FC', `a tela é desenhada pelos olhos do dono (${esp.managers[esp.youIdx]?.name})`)
ok(esp.youUid === 'uid-fantasma' && !(esp.seatUids ?? []).includes('uid-fantasma'), 'o crachá dele é o próprio e NÃO está em cadeira nenhuma')
ok(JSON.stringify({ seat: esp.seatUids, mg: esp.managers.map(m => [m.id, m.isHuman, m.name]) }) === fotoCadeiras, 'cadeiras e times idênticos aos do dono')

console.log('\n🚫 1b) jogar e assistir ao mesmo tempo, nunca')
const jogadorTentando = reducer(structuredClone(INITIAL) as EscState, { type: 'ASSISTIR_ONLINE', state: structuredClone(host), roomId: 'sala1', roomCode: 'ABC123', youUid: 'uid-ana', hostUid: 'uid-dono' })
ok(!jogadorTentando.espectador && jogadorTentando.onlineMode !== 'online', 'quem tem cadeira na sala (Ana) NÃO entra como fantasma')
const anaJogando = reducer(structuredClone(INITIAL) as EscState, { type: 'RESTORE_ONLINE', state: structuredClone(host), roomId: 'sala1', roomCode: 'ABC123', isHost: false, playerIndex: 1, youUid: 'uid-ana' })
const anaTenta = reducer(anaJogando, { type: 'ASSISTIR_ONLINE', state: structuredClone(host), roomId: 'sala2', roomCode: 'XYZ999', youUid: 'uid-fantasma', hostUid: 'uid-dono' })
ok(anaTenta === anaJogando, 'quem está no meio de uma partida como jogador não vira fantasma de outra sala')

console.log('\n👑 2) coroa e cadeira nunca pegam no fantasma')
ok(reducer(esp, { type: 'BECOME_HOST' }).isHost === false, 'BECOME_HOST é ignorado')
ok(reducer(esp, { type: 'RECOVER_LOCAL_HOST' } as never).isHost === false, 'RECOVER_LOCAL_HOST é ignorado')
ok(reducer(esp, { type: 'FIX_YOU_IDX', idx: 2 }).youIdx === esp.youIdx, 'a auto-cura de cadeira não mexe nele')

console.log('\n🔁 3) o dono manda o estado (SYNC) — o fantasma continua fantasma')
// o dono reordena os times (como a carreira/novo leilão fazem) — o fantasma segue grudado no DONO pelo crachá
const reord = structuredClone(host); reord.managers = [...reord.managers].reverse()
const s2 = reducer(esp, { type: 'SYNC_STATE', newState: reord })
ok(s2.espectador === true && s2.isHost === false && s2.youUid === 'uid-fantasma', 'continua espectador, não-dono, com o próprio crachá')
ok(s2.managers[s2.youIdx]?.name === 'Dono FC', `segue olhando pelo dono mesmo com os times reordenados (${s2.managers[s2.youIdx]?.name})`)
const hostSync = reducer(host, { type: 'SYNC_STATE', newState: reord })
ok(!hostSync.espectador, 'quem NÃO é espectador nunca recebe a marca por sync')

console.log('\n🚪 4) sair e entrar de verdade')
const saiu = reducer(s2, { type: 'GO_LOBBY' })
ok(!saiu.espectador && !saiu.espHostUid && saiu.onlineMode === 'cpu', 'SAIR apaga a marca e desliga o online')
const jog = reducer(s2, { type: 'RESTORE_ONLINE', state: structuredClone(host), roomId: 'sala1', roomCode: 'ABC123', isHost: false, playerIndex: 1, youUid: 'uid-ana' })
ok(!jog.espectador && jog.managers[jog.youIdx]?.name === 'Ana FC', 'entrar como JOGADOR (reconexão) nunca herda a marca de fantasma')
ok(!reducer(s2, { type: 'NEW_GAME' }).espectador, 'NOVO JOGO zera tudo')

console.log('\n🛡️ 5) trava de gravação no banco')
const chamadas: string[] = []
const builder = (t: string) => ({ select: () => { chamadas.push(`select ${t}`); return Promise.resolve({ data: [], error: null }) },
  insert: () => { chamadas.push(`insert ${t}`); return Promise.resolve({ data: null, error: null }) },
  update: () => { chamadas.push(`update ${t}`); return { eq: () => Promise.resolve({ data: null, error: null }) } },
  upsert: () => { chamadas.push(`upsert ${t}`); return Promise.resolve({ data: null, error: null }) },
  delete: () => { chamadas.push(`delete ${t}`); return { eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) } } })
const cli = { from: (t: string) => builder(t), rpc: (fn: string) => { chamadas.push(`rpc ${fn}`); return Promise.resolve({ data: true, error: null }) } }
instalaTravaEspectador(cli as never)
const c = cli as unknown as { from: (t: string) => Record<string, (...a: unknown[]) => unknown>; rpc: (fn: string, a?: unknown) => PromiseLike<{ error: unknown }> }
setModoEspectador(false)
await (c.from('game_rooms').update({}) as { eq: (...a: unknown[]) => Promise<unknown> }).eq('id', 'x')
await c.rpc('esc_votar')
ok(chamadas.includes('update game_rooms') && chamadas.includes('rpc esc_votar'), 'fantasma DESLIGADO: tudo passa igual a sempre')
chamadas.length = 0
setModoEspectador(true)
for (const t of ['game_rooms', 'room_players', 'game_champions', 'user_cards', 'esc_quedas']) {
  for (const k of ['insert', 'upsert', 'update', 'delete']) {
    const r = await ((c.from(t)[k]({}) as { eq: (...a: unknown[]) => { eq: (...a: unknown[]) => PromiseLike<{ error: unknown }> } }).eq('a', 1).eq('b', 2))
    if (!(r as { error?: unknown })?.error) ok(false, `${k} em ${t} devia voltar erro`)
  }
}
const rv = await c.rpc('esc_votar')
const rl = await c.rpc('esc_mantos_sala')
await (c.from('game_rooms').select as () => Promise<unknown>)()
ok(!chamadas.some(x => /^(insert|update|upsert|delete) /.test(x)), `fantasma LIGADO: nenhuma escrita saiu (${chamadas.join(', ') || 'nada'})`)
ok(!!rv.error && !chamadas.includes('rpc esc_votar'), 'função que grava (esc_votar) é barrada')
ok(!rl.error && chamadas.includes('rpc esc_mantos_sala') && chamadas.includes('select game_rooms'), 'leitura (mantos da sala, select) continua funcionando')
setModoEspectador(false)

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Espectador fantasma: tudo certo.')
process.exit(falhas ? 1 : 0)
