// 🚪➕ Trava da LIGA JÁ COMEÇADA (06/11, Diego): quem sai/é removido vira BOT com o mesmo elenco (a liga não recomeça do zero),
// quem chega assume o time que o dono escolheu (bot, ou no lugar de alguém) e, sem escolha, o PIOR bot. Os bots são renumerados
// logo depois dos humanos (é o que a largada exige) e o draft pendente põe o novato na posição da tabela do time que ele assumiu.
// Rodar: npx tsx scripts/testa-liga-vaga.mts
import { montaCarry } from '../src/escalacao/liga-draft'
import type { Manager, WonCard } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { if (!c) { falhas++; console.log('❌', m) } else console.log('✅', m) }
let n = 0
const carta = (dono: string): WonCard => ({ id: `c${n++}`, name: `${dono}-${n}`, club: 'X', year: 2000, pos: 'MEI', fame: 2, lo: 60, hi: 70, paid: 1 } as unknown as WonCard)
const time = (id: number, humano: boolean, nome: string): Manager => ({ id, name: nome, teamName: `${nome} FC`, isHuman: humano, formation: '4-3-3', money: 100 + id,
  squad: Array.from({ length: 15 }, () => carta(nome)) } as unknown as Manager)
// partida gravada: 4 humanos (A B C D = ids 0..3) + 6 bots (ids 4..9), liga de 10; a temporada ACABOU e o draft não rolou
const humanos = ['A', 'B', 'C', 'D'].map((x, i) => time(i, true, x))
const bots = [4, 5, 6, 7, 8, 9].map(i => time(i, false, `Bot${i}`))
const prev = {
  managers: [...humanos, ...bots], seatUids: ['uA', 'uB', 'uC', 'uD'],
  league: [...humanos, ...bots].map((m, k) => ({ id: m.id, name: m.teamName, pts: 100 - k * 5, w: 0, gf: 0, ga: 0 })), // tabela: 0 1º … 9 último
  fixtures: new Array(18).fill(0), round: 18, seasonNo: 3, draftFeito: 2,
}
const nomesDe = (sq: WonCard[] | undefined) => sq?.[0]?.name.split('-')[0]

// 1) a mesma turma: nada muda
let c = montaCarry(prev, ['uA', 'uB', 'uC', 'uD'])!
ok(nomesDe(c.squads[1]) === 'B' && c.bots.length === 6 && c.bots.every((b, j) => b.id === 4 + j), 'mesma turma: elencos voltam e os 6 bots ficam em 4..9')

// 2) o dono removeu o C: o time do C vira bot (com o elenco dele), ninguém recomeça do zero
c = montaCarry(prev, ['uA', 'uB', 'uD'])!
ok(c.bots.length === 7 && c.bots.every((b, j) => b.id === 3 + j && !b.isHuman), 'C removido: 7 bots renumerados 3..9, nenhum humano')
ok(c.bots.some(b => nomesDe(b.squad) === 'C'), 'o elenco do C continua na liga, agora como bot')
ok(nomesDe(c.squads[2]) === 'D', 'o D continua com o time dele (assento 2 agora)')

// 3) novato aceito no lugar do Bot6
c = montaCarry(prev, ['uA', 'uB', 'uC', 'uD', 'uX'], { uX: { bot: 6 } })!
ok(nomesDe(c.squads[4]) === 'Bot6' && c.caixa?.[4] === 106, 'X assume o Bot6: elenco e caixa dele')
ok(c.bots.length === 5 && !c.bots.some(b => nomesDe(b.squad) === 'Bot6') && c.bots.every((b, j) => b.id === 5 + j), 'sobram 5 bots (sem o Bot6) em 5..9')

// 4) novato sem escolha (entrou por código): pega o PIOR bot da tabela (Bot9)
c = montaCarry(prev, ['uA', 'uB', 'uC', 'uD', 'uY'])!
ok(nomesDe(c.squads[4]) === 'Bot9', 'Y sem escolha pega o último da tabela (Bot9)')

// 5) o dono tirou o C e pôs o Z no lugar dele: o Z leva o time do C e o C NÃO vira bot
c = montaCarry(prev, ['uA', 'uB', 'uD', 'uZ'], { uZ: { uid: 'uC' } })!
ok(nomesDe(c.squads[3]) === 'C' && c.bots.length === 6 && !c.bots.some(b => nomesDe(b.squad) === 'C'), 'Z no lugar do C: leva o time do C, os 6 bots de antes ficam')

// 6) o draft pendente põe o novato na posição do time que ele assumiu (Bot6 era o 7º → depois dos 4 humanos)
c = montaCarry(prev, ['uA', 'uB', 'uC', 'uD', 'uX'], { uX: { bot: 6 } })!
const ordemHumanos = (c.ordem ?? []).filter(id => id <= 4)
ok(JSON.stringify(ordemHumanos) === JSON.stringify([0, 1, 2, 3, 4]), `draft: A B C D e depois o X (posição do Bot6) — ${JSON.stringify(ordemHumanos)}`)

// 7) dois pedem o mesmo bot: o 2º cai no pior que sobrou, ninguém fica sem time
c = montaCarry(prev, ['uA', 'uB', 'uC', 'uD', 'uX', 'uW'], { uX: { bot: 6 }, uW: { bot: 6 } })!
ok(nomesDe(c.squads[4]) === 'Bot6' && nomesDe(c.squads[5]) === 'Bot9' && c.bots.length === 4, 'dois no mesmo bot: o 2º pega o pior que sobrou')

// 8) total sempre fecha: humanos + bots = 10
for (const [uids, ent] of [[['uA', 'uB'], {}], [['uA', 'uB', 'uC', 'uD', 'uX', 'uY', 'uW'], {}], [['uB', 'uZ'], { uZ: { uid: 'uA' } }]] as const) {
  const r = montaCarry(prev, [...uids], ent as Record<string, { bot?: number; uid?: string }>)!
  ok(uids.length + r.bots.length === 10 && Object.keys(r.squads).length === uids.length, `${uids.length} pessoas + ${r.bots.length} bots = 10, todo mundo com time`)
}
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ liga já começada: tudo certo')
process.exit(falhas ? 1 : 0)
