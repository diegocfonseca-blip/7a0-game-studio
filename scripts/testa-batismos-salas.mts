// 🖋🎲 Trava dos BATISMOS NAS SALAS (02/11): os bots da sala online saem dos clubes de batismo/fundador, sorteados,
// e nunca com o nome de quem está na sala. Rodar: npm run batismos-salas
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { BATISMOS } from '../src/escalacao/batismos'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const bat = new Set(BATISMOS.filter(b => b.tipo === 'batismo').map(b => b.clube))
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
if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) } else { console.log("\n✅ batismos nas salas ok"); process.exit(0) }
