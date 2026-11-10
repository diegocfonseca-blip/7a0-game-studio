// 🏀📋 trava da LIGA DRAFT NO BASQUETE (10/11, Diego: *"tudo igual do futebol pro basquete… mais modos como Liga Draft"*).
// Roda no motor de verdade (reducer do dono) e confere:
//   · a sala de basquete com Liga Draft liga a Minha Liga Draft (a de hoje) com o baralho da NBA — nenhum jogador de futebol
//   · o draft só oferece/aceita carta da NBA; cada jogador é único na liga
//   · elenco de até 15 (3 por posição, limite da NBA): com vaga entra no banco; cheio, tem que dizer quem sai sem furar posição
//   · prêmio padrão pela colocação é a METADE do futebol (o orçamento do basquete é 50, não 100)
//   · a temporada 2 joga (o motor usa o quinteto titular) e o FUTEBOL continua com 22 (npm run minha-liga-draft)
//   npx tsx scripts/testa-liga-draft-nba.mts
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import { chaveCarta, chaveNome, todasAsCartas, acharCarta, elencoMaxDraft, titularesDraft, DRAFT_REVELA_MS } from '../src/escalacao/liga-draft'
import { CATALOG_NBA } from '../src/escalacao/data-basquete'
import type { EscState, Card } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }
const NBA = new Set(Object.values(CATALOG_NBA).flat().map(c => `${c.name}|${c.club}`))
const ehNba = (c: { name: string; club: string; fake?: boolean }) => NBA.has(`${c.name}|${c.club}`) || c.club === 'Pickup' || !!c.fake
const NOMES = ['Tijoleiros', 'Garrafão FC', 'Pivô Torto', 'Arremesso SC']
const UIDS = ['u0', 'u1', 'u2', 'u3']
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_ONLINE', sport: 'basquete', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'NBA1', isHost: true, playerIndex: 0,
  playerNames: NOMES, seatUids: UIDS, youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
assert.equal(s.sport, 'basquete'); assert.equal(s.minhaLigaDraft, true, 'Liga Draft liga no basquete')
assert.equal(elencoMaxDraft(), 15, 'elenco máximo do basquete = 15'); assert.equal(titularesDraft(), 5, 'quinteto')
const noBaralho = SECTORS.flatMap(p => s.deck[p])
assert.ok(noBaralho.length > 0 && noBaralho.every(ehNba), 'o 1º leilão é só da NBA')
const nomes1 = noBaralho.map(c => chaveNome(c.name)); assert.equal(new Set(nomes1).size, nomes1.length, 'um LeBron só no baralho da liga')
assert.ok(todasAsCartas('nba').every(ehNba) && todasAsCartas('nba').length > 100, 'baralho do draft = NBA')
console.log('✅ largada: Liga Draft do basquete, leilão só com cartas da NBA')

// fim da T1: cada humano com um quinteto
const livres = todasAsCartas('nba').filter(c => c.fame <= 2 && !c.promessa)
const usados = new Set(s.managers.filter(m => !m.isHuman).flatMap(m => m.squad.map(c => chaveNome(c.name))))
let k = 0
for (const m of s.managers.filter(m => m.isHuman)) {
  const sq: Card[] = []
  for (const pos of SECTORS) { const c = livres.find(x => x.pos === pos && !usados.has(chaveNome(x.name)))!; usados.add(chaveNome(c.name)); sq.push({ ...c, id: `t${k++}` }) }
  m.squad = sq.map(c => ({ ...c, paid: 1, via: 'leilao' as const }))
}
s.league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0, pts: 100 - i * 5, w: 20, d: 0, l: 0, gf: 50, ga: 20 }))
s.fixtures = Array.from({ length: 38 }, () => [])
s.round = 38; s.screen = 'end'
s = reducer(s, { type: 'DRAFT_ABRIR' } as never)
assert.equal(s.screen, 'draft')
assert.equal(s.draft!.premios![0], 20, `prêmio do 1º = metade do futebol (${s.draft!.premios![0]})`)
s = reducer(s, { type: 'DRAFT_SEGUIR' } as never)
s = reducer(s, { type: 'DRAFT_PRONTO', mgrId: 0 } as never)
// carta de futebol não entra
const futebol = todasAsCartas('todos').find(c => c.fame === 5)!
assert.equal(acharCarta(chaveCarta(futebol), 'nba'), undefined)
assert.equal(reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(futebol), sai: '' } as never), s, 'jogador de futebol não entra no draft do basquete')
const lenda = todasAsCartas('nba').find(c => c.fame === 5 && !usados.has(chaveNome(c.name)))!
s = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(lenda), sai: '' } as never)
assert.equal(s.managers[0].squad.length, 6, 'com vaga (até 15) ninguém sai: vai pro banco')
assert.equal(s.managers[0].squad.at(-1)!.paid, 10)
avanca(DRAFT_REVELA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)
console.log('✅ draft: só NBA, entrou', lenda.name, 'no banco (6/15)')

// os outros passam a vez → leilão/escalação → temporada 2
for (let i = 0; i < 6 && s.screen === 'draft'; i++) {
  const d = s.draft!
  if (d.fase === 'aguarda') s = reducer(s, { type: 'DRAFT_PULAR' } as never)
  else s = reducer(s, { type: 'DRAFT_SEGUIR' } as never)
}
assert.equal(s.screen, 'season', `chegou na temporada 2 (${s.screen} · ${s.draft?.fase})`)
assert.ok(s.managers.every(m => m.squad.every(ehNba)), 'nenhum jogador de futebol em time nenhum (bots também)')
assert.ok(s.managers.every(m => m.squad.length <= 15), 'ninguém passa de 15')
const tds = s.managers.flatMap(m => m.squad.filter(c => !c.fake).map(c => chaveNome(c.name)))
assert.equal(new Set(tds).size, tds.length, 'ninguém repetido na liga')
for (let r = 0; r < 3; r++) s = reducer(s, { type: 'PLAY_ROUND' } as never)
assert.ok(s.round >= 1, `a temporada 2 joga (rodada ${s.round})`)
console.log('✅ temporada 2 jogando, todos com NBA, ninguém repetido')

// elenco cheio (15): tem que dizer quem sai, sem furar posição
const cheio = JSON.parse(JSON.stringify(s)) as EscState
const m0 = cheio.managers[0]
const extra = todasAsCartas('nba').filter(c => !cheio.managers.some(m => m.squad.some(x => chaveNome(x.name) === chaveNome(c.name))))
for (const pos of SECTORS) for (let i = 0; m0.squad.filter(c => c.pos === pos).length < 3; i++) { const c = extra.find(x => x.pos === pos && !m0.squad.some(y => chaveNome(y.name) === chaveNome(x.name)))!; m0.squad.push({ ...c, id: `x${pos}${i}`, paid: 1, via: 'leilao' } as never) }
assert.equal(m0.squad.length, 15)
cheio.round = cheio.fixtures.length; cheio.screen = 'end'; cheio.draftFeito = undefined
let c2 = reducer(cheio, { type: 'DRAFT_ABRIR' } as never)
c2 = reducer(c2, { type: 'DRAFT_SEGUIR' } as never)
c2.draft!.ordem = [0, ...c2.draft!.ordem.filter(x => x !== 0)]
c2 = reducer(c2, { type: 'DRAFT_PRONTO', mgrId: 0 } as never)
const nova = todasAsCartas('nba').find(c => c.pos === 'GOL' && !c2.managers.some(m => m.squad.some(x => chaveNome(x.name) === chaveNome(c.name))))!
assert.equal(reducer(c2, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(nova), sai: '' } as never), c2, 'elenco cheio (15): tem que dizer quem sai')
const pg = c2.managers[0].squad.filter(c => c.pos === 'GOL')
c2 = reducer(c2, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(nova), sai: pg[0].id } as never)
assert.equal(c2.managers[0].squad.length, 15, 'continua com 15')
assert.ok(c2.managers.filter(m => !m.isHuman).every(m => m.squad.length <= 15 && m.squad.every(ehNba)), 'bots: até 15, só NBA')
console.log('✅ elenco cheio (15): escolhe quem sai')
console.log('🏀📋 Liga Draft do basquete: tudo certo')
process.exit(0)
