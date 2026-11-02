// 🖋🎲 Trava dos BATISMOS NAS SALAS (02/11): os bots da sala online saem dos clubes de batismo/fundador, sorteados,
// e nunca com o nome de quem está na sala. Rodar: npm run batismos-salas
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { BATISMOS, chaveClube } from '../src/escalacao/batismos'
import { championsConvidados } from '../src/escalacao/champions'
const mulberry = (a: number) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const batK = new Set(BATISMOS.filter(b => b.tipo === 'batismo').map(b => chaveClube(b.clube))); const bat = { has: (n: string) => batK.has(chaveClube(n)), size: batK.size }
const vistos = new Set<string>(); const primeiros: string[] = []
for (let i = 0; i < 12; i++) {
  const s = reducer(structuredClone(INITIAL) as EscState, {
    type: 'START_ONLINE', roomId: 'sala' + i, roomCode: 'C' + i, isHost: true, playerIndex: 0,
    playerNames: ['Príncipe Rubro Negro', 'Joaquim FC'], seatUids: ['a', 'b'], youUid: 'a', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa',
  } as never)
  const bots = s.managers.filter(m => !m.isHuman)
  ok(bots.length > 0 && bots.every(m => bat.has(m.teamName)), `sala ${i}: ${bots.length} bots, todos de batismo/fundador`)
  ok(!bots.some(m => m.teamName === 'Príncipe Rubro Negro'), `sala ${i}: o dono nunca joga contra o próprio clube`)
  ok(new Set(bots.map(m => m.teamName)).size === bots.length, `sala ${i}: nenhum clube repetido`)
  bots.forEach(m => vistos.add(m.teamName)); primeiros.push(bots[0].teamName)
}
ok(new Set(primeiros).size >= 6, `o sorteio muda de sala pra sala (${new Set(primeiros).size} primeiros diferentes em 12)`)
ok(vistos.size >= bat.size * 0.8, `revezamento: ${vistos.size} de ${bat.size} batismos apareceram em 12 salas`)

// ⭐ Champions das salas: convidados sorteados, força pela divisão, sem repetir quem está na sala
const ordem = championsConvidados(['Príncipe Rubro Negro'])
const prim = new Set<string>(); const todosC = new Set<string>()
for (let i = 0; i < 12; i++) {
  const c = championsConvidados(['Príncipe Rubro Negro'], 28, mulberry(1000 + i))
  ok(c.length === 28 && new Set(c.map(x => x.name)).size === 28, `champions ${i}: 28 convidados, nenhum repetido`)
  ok(!c.some(x => x.name === 'Príncipe Rubro Negro'), `champions ${i}: o dono não vira convidado`)
  ok(c.every(x => BATISMOS.some(b => chaveClube(b.clube) === chaveClube(x.name))), `champions ${i}: todos são clube de gente (batismo/fundador/sócio)`)
  const fA = c.filter(x => x.divisao === 'A').map(x => x.atk), fV = c.filter(x => x.divisao === 'V').map(x => x.atk)
  ok(!fA.length || !fV.length || Math.min(...fA) > Math.max(...fV), `champions ${i}: Série A segue mais forte que a Várzea`)
  prim.add(c.map(x => x.name).sort().join()); c.forEach(x => todosC.add(x.name))
}
ok(prim.size >= 10, `champions: a turma muda de sala pra sala (${prim.size} de 12 diferentes)`)
ok(todosC.size > ordem.length + 20, `champions: revezamento (${todosC.size} clubes diferentes em 12 salas; antes eram sempre os mesmos ${ordem.length})`)
if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) } else { console.log("\n✅ batismos nas salas ok"); process.exit(0) }
