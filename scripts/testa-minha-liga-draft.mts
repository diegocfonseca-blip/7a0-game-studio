// 📋🏆 trava da MINHA LIGA DRAFT (01/11) — regras fechadas com o Diego (docs/pendencias.md, "Minhas Ligas + Draft"):
//   · a 1ª temporada é o leilão NORMAL (lenda/craque também), não o fraco da Liga Draft
//   · cada vez começa PARADA esperando o ✋ pronto de quem está na vez — e só ele pode dar pronto
//   · depois do pronto: 45 s. Acabou o tempo = PERDE A VEZ (o jogo NÃO escolhe por ninguém)
//   · o DONO pode pular a vez de quem não deu pronto; convidado não pula
//   · o dono saiu no meio do draft: na volta a fila continua de onde parou (quem já escolheu não escolhe de novo)
//   npx tsx scripts/testa-minha-liga-draft.mts
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import { montaCarry, chaveCarta, chaveNome, todasAsCartas, DRAFT_ESCOLHA_MINHA_MS, DRAFT_REVELA_MS } from '../src/escalacao/liga-draft'
import type { EscState, Card } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }
const NOMES = ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Tocaia SC']
const UIDS = ['u0', 'u1', 'u2', 'u3']
const start = (extra: Record<string, unknown> = {}) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'MINHA1', isHost: true, playerIndex: 0,
    playerNames: NOMES, seatUids: UIDS, youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', ...extra } as never)
  return s
}

// ① largada: leilão NORMAL
let s = start()
assert.equal(s.minhaLigaDraft, true)
const noBaralho = SECTORS.flatMap(p => s.deck[p])
assert.ok(noBaralho.some(c => c.fame >= 4), 'tem craque/lenda no 1º leilão (não é o leilão fraco)')
assert.equal(start({ minhaLigaDraft: false }).minhaLigaDraft, false, 'Liga Draft de antes continua igual')
console.log('✅ 1ª temporada com leilão normal:', noBaralho.filter(c => c.fame >= 4).length, 'craques/lendas no pregão')

// ② fim da temporada: elencos de 11 e tabela pronta
const fracas = todasAsCartas().filter(c => c.fame <= 2 && !c.promessa)
const usados = new Set(s.managers.flatMap(m => m.squad.map(c => chaveNome(c.name))))
let k = 0
for (const m of s.managers.filter(m => m.isHuman)) {
  const sq: Card[] = []
  for (const [pos, n] of [['GOL', 1], ['LAT', 2], ['ZAG', 2], ['MEI', 3], ['ATA', 3]] as const) for (let i = 0; i < n; i++) {
    const c = fracas.find(x => x.pos === pos && !usados.has(chaveNome(x.name)))!
    usados.add(chaveNome(c.name)); sq.push({ ...c, id: `t${k++}` })
  }
  m.squad = sq.map(c => ({ ...c, paid: 1, via: 'leilao' as const }))
}
s.league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0, pts: 100 - i * 5, w: 20, d: 0, l: 0, gf: 50, ga: 20 }))
s.fixtures = Array.from({ length: 38 }, () => [])
s.round = 38
s.screen = 'end'
s = reducer(s, { type: 'DRAFT_ABRIR' } as never)
assert.equal(s.screen, 'draft')
assert.deepEqual(s.draft!.ordem, [0, 1, 2, 3])
assert.equal(s.draft!.fase, 'aguarda', 'a vez começa parada, esperando o pronto')

// ③ o relógio não corre sem pronto; só quem está na vez dá pronto
avanca(10 * 60_000)
assert.equal(reducer(s, { type: 'DRAFT_TICK' } as never), s, 'parado não anda sozinho, nem 10 min depois')
assert.equal(reducer(s, { type: 'DRAFT_PRONTO', mgrId: 2 } as never), s, 'fora da vez não dá pronto')
s = reducer(s, { type: 'DRAFT_PRONTO', mgrId: 0 } as never)
assert.equal(s.draft!.fase, 'escolha'); assert.equal(s.draft!.prazo, Date.now() + DRAFT_ESCOLHA_MINHA_MS, '45 s')
const prazo = s.draft!.prazo
avanca(5000); s = reducer(s, { type: 'DRAFT_PRONTO', mgrId: 0 } as never)
assert.equal(s.draft!.prazo, prazo, 'pronto repetido não reinicia o relógio')

// ④ Butinas escolhe uma lenda
const lenda = todasAsCartas().find(c => c.fame === 5 && c.pos === 'ATA' && !usados.has(chaveNome(c.name)))!
s = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(lenda), sai: s.managers[0].squad.find(c => c.pos === 'ATA')!.id } as never)
assert.equal(s.draft!.fase, 'revela')
assert.equal(reducer(s, { type: 'DRAFT_PULAR' } as never), s, 'ninguém pula no meio do anúncio')
avanca(DRAFT_REVELA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)
assert.equal(s.draft!.idx, 1); assert.equal(s.draft!.fase, 'aguarda', 'próxima vez também começa parada')
console.log('✅ pronto → 45 s → escolheu', lenda.name)

// ⑤ o dono saiu agora (vez do Fabulous, parada): a liga gravada volta e continua do Fabulous
const gravada = JSON.parse(JSON.stringify({ ...s, screen: 'lobby' }))
const carry = montaCarry(gravada, ['u1', 'u0', 'u2', 'u3'])!
assert.deepEqual(carry.ordem, [0, 2, 3], 'Butinas (que já escolheu) não está mais na fila; Fabulous (assento novo 0) é o próximo')
const v = start({ seasonNo: 1, playerNames: ['Fabulous EC', 'Butinas FC', 'K9 FC', 'Tocaia SC'], seatUids: ['u1', 'u0', 'u2', 'u3'], youUid: 'u1', draftCarry: carry })
assert.equal(v.screen, 'draft'); assert.equal(v.draft!.fase, 'aguarda', 'volta parada: ninguém perde tempo')
assert.ok(v.managers[1].squad.some(c => c.name === lenda.name), 'a escolha do Butinas ficou salva')
console.log('✅ dono saiu no meio: volta de onde parou, com a escolha feita guardada')

// ⑥ convidado não pula; o dono pula o Fabulous
const convidado = { ...s, isHost: false, onlineMode: 'online' } as EscState
assert.equal(reducer(convidado, { type: 'DRAFT_PULAR' } as never), convidado, 'convidado não pula ninguém')
s = reducer(s, { type: 'DRAFT_PULAR' } as never)
assert.deepEqual(s.draft!.pulados, [1]); assert.equal(s.draft!.idx, 2); assert.equal(s.draft!.fase, 'aguarda')
assert.equal(s.draft!.picks.length, 1, 'quem foi pulado não ganhou jogador')

// ⑦ K9 dá pronto e deixa o tempo acabar → perde a vez (nada de escolha automática)
const antes = JSON.stringify(s.managers[2].squad)
s = reducer(s, { type: 'DRAFT_PRONTO', mgrId: 2 } as never)
avanca(DRAFT_ESCOLHA_MINHA_MS); s = reducer(s, { type: 'DRAFT_TICK' } as never)
assert.deepEqual(s.draft!.pulados, [1, 2]); assert.equal(s.draft!.picks.length, 1, 'o jogo NÃO escolheu pelo K9')
assert.equal(JSON.stringify(s.managers[2].squad), antes, 'o elenco do K9 não mudou')
console.log('✅ pulado pelo dono e tempo esgotado = perdeu a vez, sem jogador')

// ⑧ Tocaia é pulado → acabou a fila, temporada 2 começa
s = reducer(s, { type: 'DRAFT_PULAR' } as never)
assert.equal(s.screen, 'season'); assert.equal(s.seasonNo, 2); assert.equal(s.draft, null); assert.equal(s.draftFeito, 1)
console.log('✅ fim da fila → temporada 2')
console.log('📋🏆 Minha Liga Draft: tudo certo')
process.exit(0)
