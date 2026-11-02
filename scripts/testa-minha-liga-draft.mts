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
import { SECTORS, FORMATIONS } from '../src/escalacao/types'

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
const dez = start({ tamanhoLiga: 10 })
assert.equal(dez.managers.length, 10, 'liga de 10: 4 pessoas + 6 bots')
assert.equal(dez.tamanhoLiga, 10)
const dezT = reducer(dez, { type: 'REPLAY_SEASON' } as never)
assert.equal(dezT.league.length, 10, 'a TABELA também tem 10 (não completa com clubes até 20)')
assert.equal(dezT.fixtures.length, 18, '18 rodadas')
assert.equal(reducer(start(), { type: 'REPLAY_SEASON' } as never).league.length, 20, 'padrão: tabela de 20')
assert.equal(start().managers.length, 20, 'padrão continua 20')
// 🇧🇷 Liga Draft só com o baralho Brasil: o draft também só oferece cartas do Brasil
const br = start({ deck: 'br' })
assert.equal(br.deckLeague, 'br')
const tdc = todasAsCartas
assert.ok(tdc('br').length < tdc().length && tdc('eu').length < tdc().length, 'baralho só BR/só EU é menor que o jogo inteiro')
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
assert.equal(s.draft!.fase, 'prontos', 'antes do draft: ✋ prontos (o dono decide quando começa)')
const caixaAntes = 0
assert.ok(s.draft!.premios && s.draft!.premios[0] === 40 && s.draft!.premios[3] === 20, 'moedas pela colocação: 1º 40 · 4º 20')
assert.equal(reducer({ ...s, isHost: false, onlineMode: 'online' } as EscState, { type: 'DRAFT_SEGUIR', by: 'u1' } as never).draft!.fase, 'prontos', 'convidado não começa o draft')
s = reducer(s, { type: 'DRAFT_ESTOU_PRONTO', mgrId: 1 } as never)
assert.deepEqual(s.draft!.prontos, [1])
// Tocaia põe 1 jogador à venda
const vendaTocaia = s.managers[3].squad.find(c => c.pos === 'MEI')!
s = reducer(s, { type: 'DRAFT_VENDER', mgrId: 3, cardId: vendaTocaia.id } as never)
s = reducer(s, { type: 'DRAFT_SEGUIR' } as never)
assert.equal(s.draft!.fase, 'aguarda', 'a vez começa parada, esperando o pronto')
void caixaAntes

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
assert.equal(s.managers[0].squad.length, 12, 'com vaga (menos de 22) ninguém sai: o elenco cresce')
assert.equal(s.managers[0].squad.at(-1)!.paid, 10, 'jogador do draft chega valendo 10')
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

// ⑧ Tocaia dá pronto e SONDA o Romário… quer dizer, a lenda do Butinas → perde a vez, fila acaba
s = reducer(s, { type: 'DRAFT_PRONTO', mgrId: 3 } as never)
const alvo = s.managers[0].squad.find(c => c.name === lenda.name)!
assert.equal(reducer(s, { type: 'DRAFT_SONDAR', mgrId: 3, dono: 3, cardId: vendaTocaia.id } as never).draft!.sondagens!.length, 0, 'não sonda a si mesmo')
// 🔒 contrato: a lenda chegou agora (temporada 2) e um jogador do leilão da T1 tem 1 temporada no time → nenhum dá pra sondar
assert.equal(alvo.mldDesde, 2, 'jogador do draft chega com a temporada em que entra no time')
const daT1 = s.managers[0].squad.find(c => c.mldDesde == null && !c.fake)!
assert.equal(reducer(s, { type: 'DRAFT_SONDAR', mgrId: 3, dono: 0, cardId: alvo.id } as never).draft!.sondagens!.length, 0, 'recém-chegado está no contrato')
assert.equal(reducer(s, { type: 'DRAFT_SONDAR', mgrId: 3, dono: 0, cardId: daT1.id } as never).draft!.sondagens!.length, 0, 'só 1 temporada no time: ainda no contrato')
const t3 = JSON.parse(JSON.stringify(s)) as EscState; t3.draft!.temporada = 3
assert.equal(reducer(t3, { type: 'DRAFT_SONDAR', mgrId: 3, dono: 0, cardId: daT1.id } as never).draft!.sondagens!.length, 1, 'no draft do fim da 3ª temporada libera')
s.managers[0].squad = s.managers[0].squad.map(c => c.id === alvo.id ? { ...c, mldDesde: -5 } : c) // (simula um veterano pra seguir o teste do leilão)
s = reducer(s, { type: 'DRAFT_SONDAR', mgrId: 3, dono: 0, cardId: alvo.id } as never)
console.log('✅ contrato: só sonda quem tem 3 temporadas no time')
assert.equal(s.draft!.fase, 'prontos'); assert.equal(s.draft!.proxima, 'leilao')
assert.equal(s.draft!.lotes!.length, 2, 'lotes: o sondado + o que o Tocaia pôs à venda')
const iS = s.draft!.lotes!.findIndex(l => l.sondador === 3), iV = s.draft!.lotes!.findIndex(l => l.sondador == null)
console.log('✅ sondou', alvo.name, '· lotes:', s.draft!.lotes!.map(l => l.carta.name).join(', '))

// ⑨ leilão: K9 dá o maior lance no sondado, Fabulous compra o à venda; Tocaia (quem sondou) IGUALA
s = reducer(s, { type: 'DRAFT_SEGUIR' } as never)
assert.equal(s.draft!.fase, 'leilao')
for (const m of s.managers) if (m.isHuman) m.money = 100
const piso = s.draft!.lotes![iS].piso
assert.equal(reducer(s, { type: 'DRAFT_LANCE', mgrId: 2, lote: iS, valor: piso - 1 } as never).draft!.lances?.[iS]?.[2], undefined, 'abaixo do piso é recusado')
assert.equal(reducer(s, { type: 'DRAFT_LANCE', mgrId: 2, lote: iS, valor: 101 } as never).draft!.lances?.[iS]?.[2], undefined, 'acima do caixa é recusado')
s = reducer(s, { type: 'DRAFT_LANCE', mgrId: 2, lote: iS, valor: 50 } as never)
s = reducer(s, { type: 'DRAFT_LANCE', mgrId: 3, lote: iS, valor: 30 } as never)
s = reducer(s, { type: 'DRAFT_LANCE', mgrId: 1, lote: iV, valor: 20 } as never)
avanca(60_000); s = reducer(s, { type: 'DRAFT_TICK' } as never)
assert.equal(s.draft!.fase, 'igualar'); assert.equal(s.draft!.igualarIdx, iS)
assert.equal(reducer(s, { type: 'DRAFT_IGUALAR', mgrId: 2, sim: true } as never).draft!.lotes![iS].igualou, undefined, 'só quem sondou iguala')
s = reducer(s, { type: 'DRAFT_IGUALAR', mgrId: 3, sim: true } as never)
assert.equal(s.draft!.fase, 'escala')
const tocaia = s.managers[3], butinas = s.managers[0], fab = s.managers[1], k9 = s.managers[2]
assert.ok(tocaia.squad.some(c => c.name === lenda.name), 'Tocaia igualou e levou a lenda')
assert.ok(!butinas.squad.some(c => c.name === lenda.name), 'saiu do Butinas')
assert.equal(butinas.money, 150, 'o dono recebeu os 50')
assert.equal(tocaia.money, 100 - 50 + 20, 'Tocaia pagou 50 e recebeu 20 da venda')
assert.equal(k9.money, 100, 'o K9 não pagou nada (perdeu no igualar)')
assert.ok(fab.squad.some(c => c.name === vendaTocaia.name) && fab.money === 80, 'Fabulous comprou o à venda por 20')
const need = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 } as const
for (const m of [butinas, tocaia]) for (const p of SECTORS) assert.ok(m.squad.filter(c => c.pos === p).length >= need[p], `${m.teamName} fecha a formação em ${p}`)
console.log('✅ leilão: K9 50 · Tocaia igualou · venda do Tocaia pro Fabulous · ninguém ficou furado')

// ⑩ escalação: troca titular ↔ reserva da mesma posição; o dono começa a temporada
const ata = butinas.squad.filter(c => c.pos === 'ATA')
if (ata.length > 3) {
  s = reducer(s, { type: 'MLD_TROCA', mgrId: 0, a: ata[0].id, b: ata[3].id } as never)
  assert.equal(s.managers[0].squad.filter(c => c.pos === 'ATA')[0].id, ata[3].id, 'o reserva virou titular')
}
const gol = s.managers[0].squad.find(c => c.pos === 'GOL')!
assert.equal(reducer(s, { type: 'MLD_TROCA', mgrId: 0, a: gol.id, b: ata[0].id } as never), s, 'posições diferentes não trocam')
// formação: só aceita o que o elenco preenche; o XI se refaz sozinho
const f0 = s.managers[0].formation
const outra = (['4-4-2', '4-3-3', '3-5-2', '4-5-1', '5-3-2'] as const).find(f => f !== f0)!
const t1 = reducer(s, { type: 'MLD_FORMACAO', mgrId: 0, formation: outra } as never)
const need2 = FORMATIONS[outra]
const cabe = SECTORS.every(p => s.managers[0].squad.filter(c => c.pos === p).length >= need2[p])
assert.equal(t1.managers[0].formation, cabe ? outra : f0, cabe ? 'formação trocada' : 'formação que não fecha é recusada')
const botsAntes = JSON.stringify(s.managers.filter(m => !m.isHuman).map(m => m.squad.map(c => c.name)))
s = reducer(s, { type: 'DRAFT_SEGUIR' } as never)
assert.equal(s.screen, 'season'); assert.equal(s.seasonNo, 2)
const bots = s.managers.filter(m => !m.isHuman)
const novos = bots.flatMap(m => m.squad.filter(c => c.id.startsWith('mlb')))
assert.ok(JSON.stringify(bots.map(m => m.squad.map(c => c.name))) !== botsAntes && novos.length > 0, 'bots ganharam reforço calado')
assert.ok(novos.every(c => c.fame >= 2 && c.fame <= 4 && !c.promessa), 'reforço de bot nunca é lenda nem promessa')
assert.ok(bots.every(m => m.squad.length === JSON.parse(botsAntes)[bots.indexOf(m)].length), 'bot troca 1 por 1 (elenco do mesmo tamanho)')
const todos = s.managers.flatMap(m => m.squad.filter(c => !c.fake).map(c => chaveNome(c.name)))
assert.equal(new Set(todos).size, todos.length, 'ninguém repetido na liga depois do reforço')
console.log('✅ bots: reforço calado em', novos.length, 'times (bom/craque, sem lenda)'); assert.equal(s.draft, null); assert.equal(s.draftFeito, 1)
console.log('✅ escalação → temporada 2')

// ⑪ elenco cheio (22): o draft exige quem sai, sem furar posição; o motor joga só com o XI
const cheio = JSON.parse(JSON.stringify(s)) as EscState
const m0 = cheio.managers[0]
const extra = todasAsCartas().filter(c => c.fame <= 2 && !c.promessa && !cheio.managers.some(m => m.squad.some(x => chaveNome(x.name) === chaveNome(c.name))))
for (let i = 0; m0.squad.length < 22; i++) m0.squad.push({ ...extra[i], id: `x${i}`, paid: 1, via: 'leilao' } as never)
cheio.league = cheio.league.map(t => ({ ...t })); cheio.round = 38; cheio.screen = 'end'
let c2 = reducer(cheio, { type: 'DRAFT_ABRIR' } as never)
c2 = reducer(c2, { type: 'DRAFT_SEGUIR' } as never)
const vez = c2.draft!.ordem[0]
c2.draft!.ordem = [0, ...c2.draft!.ordem.filter(x => x !== 0)]; void vez
c2 = reducer(c2, { type: 'DRAFT_PRONTO', mgrId: 0 } as never)
const nova = todasAsCartas().find(c => c.pos === 'GOL' && !c2.managers.some(m => m.squad.some(x => chaveNome(x.name) === chaveNome(c.name))))!
assert.equal(reducer(c2, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(nova), sai: '' } as never), c2, 'elenco cheio: tem que dizer quem sai')
const unicoGol = c2.managers[0].squad.filter(c => c.pos === 'GOL')
const zag = c2.managers[0].squad.filter(c => c.pos === 'ZAG')
if (zag.length === 2) assert.equal(reducer(c2, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(nova), sai: zag[0].id } as never), c2, 'não pode tirar quem fura a posição')
c2 = reducer(c2, { type: 'DRAFT_ESCOLHER', mgrId: 0, carta: chaveCarta(nova), sai: unicoGol[0].id } as never)
assert.equal(c2.managers[0].squad.length, 22, 'continua com 22')
console.log('✅ elenco cheio: escolhe quem sai, sem furar posição')
console.log('📋🏆 Minha Liga Draft (fase 2): tudo certo')
console.log('📋🏆 Minha Liga Draft: tudo certo')
process.exit(0)
