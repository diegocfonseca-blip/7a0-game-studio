// 📋 trava da LIGA DRAFT (19/10): roda o motor de verdade (reducer) e confere as regras do Diego:
//   · a 1ª temporada é leilão só de profissional e bom (sem lenda, craque nem promessa) — e NÃO vira sala de Várzea
//   · no fim da temporada o dono abre o draft; a ordem é a da tabela (campeão primeiro)
//   · só quem está na vez escolhe; jogador com dono (humano ou bot, pelo NOME) é recusado; quem sai é da mesma posição
//   · tempo esgotado → o jogo escolhe o melhor livre e tira o mais fraco da posição
//   · fim da fila → próxima temporada com os elencos novos (temporada +1, draft não abre 2×)
//   · a turma que volta outro dia: os elencos voltam (montaCarry) e o draft pendente abre primeiro
//   npx tsx scripts/testa-liga-draft.mts
import assert from 'node:assert/strict'
import { reducer, sortedTable } from '../src/escalacao/store'
import { montaCarry, chaveCarta, chaveNome, nomesOcupados, cartasLivres, DRAFT_ESCOLHA_MS, DRAFT_REVELA_MS, todasAsCartas } from '../src/escalacao/liga-draft'
import type { EscState, Card } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }

const start = (extra: Record<string, unknown> = {}) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'DRAFT1', isHost: true, playerIndex: 0,
    playerNames: ['Butinas FC', 'Fabulous EC', 'K9 FC'], seatUids: ['u0', 'u1', 'u2'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', ...extra } as never)
  return s
}

// ① a largada: leilão fraco, sem cara de Várzea
let s = start()
assert.equal(s.ligaDraft, true)
assert.equal(s.varzea, false, 'não vira sala de Várzea (sem campo de terra)')
assert.equal(s.screen, 'auction')
const noBaralho = SECTORS.flatMap(p => s.deck[p])
assert.ok(noBaralho.length > 0)
assert.ok(noBaralho.every(c => c.fame <= 3 && !c.promessa), 'leilão só com profissional e bom')
const bots = s.managers.filter(m => !m.isHuman)
assert.ok(bots.every(b => b.squad.every(c => c.fake || (c.fame <= 3 && !c.promessa))), 'bots também começam fracos')
console.log('✅ largada fraca:', noBaralho.length, 'cartas no pregão ·', bots.length, 'bots fracos')

// ② simula a temporada inteira: elencos prontos (11 por humano) e tabela terminada
const fracas = todasAsCartas().filter(c => c.fame <= 2 && !c.promessa)
const usados = new Set(s.managers.flatMap(m => m.squad.map(c => chaveNome(c.name))))
let k = 0
for (const m of s.managers.filter(m => m.isHuman)) {
  const sq: Card[] = []
  for (const [pos, n] of [['GOL', 1], ['LAT', 2], ['ZAG', 2], ['MEI', 3], ['ATA', 3]] as const) {
    for (let i = 0; i < n; i++) {
      const c = fracas.find(x => x.pos === pos && !usados.has(chaveNome(x.name)))!
      usados.add(chaveNome(c.name))
      sq.push({ ...c, id: `t${k++}` })
    }
  }
  m.squad = sq.map(c => ({ ...c, paid: 1, via: 'leilao' as const }))
}
s.league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0, pts: m.id === 2 ? 90 : m.id === 0 ? 80 : 70 - i, w: 20, d: 0, l: 0, gf: 50, ga: 20 }))
s.fixtures = Array.from({ length: 38 }, () => [])
s.round = 38
s.screen = 'end'
s = reducer(s, { type: 'DRAFT_ABRIR' } as never)
assert.equal(s.screen, 'draft')
assert.deepEqual(s.draft!.ordem, [2, 0, 1], 'campeão (K9, 90 pts) primeiro, na ordem da tabela')
console.log('✅ ordem do draft:', s.draft!.ordem.map(id => s.managers[id].teamName).join(' → '))

// ③ só quem está na vez escolhe; nome com dono é recusado; quem sai é da mesma posição
const lenda = todasAsCartas().find(c => c.fame === 5 && c.pos === 'ATA' && !usados.has(chaveNome(c.name)))!
const ataK9 = s.managers[2].squad.find(c => c.pos === 'ATA')!
const golK9 = s.managers[2].squad.find(c => c.pos === 'GOL')!
let r = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(lenda), sai: s.managers[0].squad.find(c => c.pos === 'ATA')!.id } as never)
assert.equal(r, s, 'fora da vez: nada muda')
r = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 2, carta: chaveCarta(lenda), sai: golK9.id } as never)
assert.equal(r, s, 'quem sai tem que ser da mesma posição')
const doBot = s.managers.find(m => !m.isHuman && m.squad.some(c => !c.fake))!.squad.find(c => !c.fake)!
const mesmoNomeDoBot = todasAsCartas().find(c => chaveNome(c.name) === chaveNome(doBot.name))!
r = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 2, carta: chaveCarta(mesmoNomeDoBot), sai: s.managers[2].squad.find(c => c.pos === mesmoNomeDoBot.pos)!.id } as never)
assert.equal(r, s, `jogador do bot (${doBot.name}) é recusado — um só na liga`)
s = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 2, carta: chaveCarta(lenda), sai: ataK9.id } as never)
assert.equal(s.draft!.fase, 'revela')
assert.ok(s.managers[2].squad.some(c => c.name === lenda.name) && !s.managers[2].squad.some(c => c.id === ataK9.id), 'entrou a lenda, saiu o atacante')
assert.equal(s.managers[2].squad.length, 11, 'o time continua com 11')
// o mesmo nome agora tem dono
assert.ok(!cartasLivres(nomesOcupados(s.managers)).some(c => chaveNome(c.name) === chaveNome(lenda.name)), `${lenda.name} sai da lista de livres (todas as cartas dele)`)
console.log('✅ K9 escolheu', lenda.name, '(', lenda.club, lenda.year, ')')

// ④ o anúncio segura a sala até o fim; depois passa a vez
r = reducer(s, { type: 'DRAFT_TICK' } as never)
assert.equal(r, s, 'tique no meio do anúncio não muda nada')
avanca(DRAFT_REVELA_MS)
s = reducer(s, { type: 'DRAFT_TICK' } as never)
assert.equal(s.draft!.idx, 1); assert.equal(s.draft!.fase, 'escolha')

// ⑤ tempo esgotado: o jogo escolhe o melhor livre e tira o mais fraco
avanca(DRAFT_ESCOLHA_MS)
s = reducer(s, { type: 'DRAFT_TICK' } as never)
const auto = s.draft!.picks[1]
assert.ok(auto.auto, 'escolha automática marcada')
assert.equal(auto.carta.fame, 5, 'pegou uma lenda (o melhor livre)')
assert.equal(s.managers[0].squad.length, 11)
console.log('✅ tempo esgotado → automático:', auto.carta.name, '· saiu', auto.saiu?.name)
avanca(DRAFT_REVELA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)
avanca(DRAFT_ESCOLHA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)
avanca(DRAFT_REVELA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)

// ⑥ acabou a fila → próxima temporada, mesmos elencos com os reforços
assert.equal(s.screen, 'season')
assert.equal(s.seasonNo, 2, 'temporada +1')
assert.equal(s.draftFeito, 1)
assert.equal(s.draft, null)
assert.equal(s.round, 0)
const nomes = s.managers.flatMap(m => m.squad.filter(c => !c.fake).map(c => chaveNome(c.name)))
assert.equal(new Set(nomes).size, nomes.length, 'ninguém repetido na liga')
assert.equal(reducer({ ...s, screen: 'end', draftFeito: s.seasonNo } as EscState, { type: 'DRAFT_ABRIR' } as never).screen, 'end', 'draft já feito nesta temporada não abre de novo')
assert.equal(reducer({ ...s, screen: 'end' } as EscState, { type: 'DRAFT_ABRIR' } as never).screen, 'draft', 'o da temporada 2 abre normal')
console.log('✅ temporada 2 começou com os reforços; nomes únicos:', nomes.length)

// ⑦ a turma volta outro dia: os elencos voltam e, se a temporada acabou sem draft, ele abre primeiro
const gravada = JSON.parse(JSON.stringify({ ...s, round: 38, screen: 'lobby' })) // temporada 2 terminou e a turma foi embora
const carry = montaCarry(gravada, ['u1', 'u0', 'u2']) // entraram em outra ordem
assert.ok(carry && Object.keys(carry.squads).length === 3)
let v = start({ seasonNo: 3, playerNames: ['Fabulous EC', 'Butinas FC', 'K9 FC'], seatUids: ['u1', 'u0', 'u2'], youUid: 'u1', draftCarry: carry })
assert.equal(v.screen, 'draft', 'temporada acabou sem draft → abre o draft primeiro')
assert.ok(v.managers[2].squad.some(c => c.name === lenda.name), 'o K9 voltou com a lenda dele')
assert.ok(v.managers[0].squad.some(c => chaveNome(c.name) === chaveNome(s.managers[1].squad[0].name)), 'o Fabulous (assento novo 0) voltou com o elenco DELE')
const ordemVelha = sortedTable(gravada.league).map((t: { id: number }) => t.id).filter((id: number) => id < 3)
assert.deepEqual(v.draft!.ordem, ordemVelha.map((id: number) => ['u0', 'u1', 'u2'][id]).map((u: string) => ['u1', 'u0', 'u2'].indexOf(u)), 'ordem pela tabela velha, nos assentos novos')
// e termina na temporada 3 (não soma de novo: o número já veio certo do lobby)
for (let i = 0; i < 3; i++) { avanca(DRAFT_ESCOLHA_MS); v = reducer(v, { type: 'DRAFT_TICK' } as never); avanca(DRAFT_REVELA_MS); v = reducer(v, { type: 'DRAFT_TICK' } as never) }
assert.equal(v.screen, 'season'); assert.equal(v.seasonNo, 3)
// alguém novo na turma → recomeça com o leilão fraco (caminho seguro)
const carry2 = montaCarry(gravada, ['u0', 'u1', 'u2', 'u9'])
const w = start({ playerNames: ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Novato'], seatUids: ['u0', 'u1', 'u2', 'u9'], draftCarry: carry2 })
assert.equal(w.screen, 'auction', 'gente nova → leilão fraco de novo')
console.log('✅ a liga atravessa o dia (e recomeça com segurança quando a turma muda)')
console.log('📋 Liga Draft: tudo certo')
process.exit(0) // o cliente do Supabase dispara um aviso assíncrono no node (import.meta.env) — as travas já passaram
