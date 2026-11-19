// 🌴 trava do VICE CITY (19/11): roda uma Partida Rápida inteira de Pregão aberto com as cartas de golpe ligadas, no motor de
// verdade (reducer), e confere:
//   · todo técnico de gente recebe 3 cartas no sorteio do começo (19/11 v2) e nunca mais (fora a de vingança do BUSTED)
//   · 🔒 Cadeia vale NA HORA: o jogador mais caro dele volta pra mesa com o dinheiro
//   · cada golpe é anunciado no feed, tira a carta da mão e dá 1 ⭐ escondida pra quem LEVOU
//   · Blitz / Barreira / Tanque vazio barram o lance (a tela e o motor leem `viceTravaLance`)
//   · Roubo de carro tira o último jogador do rival sem pagar; Assalto move 10 moedas; Colete segura; Fuga devolve
//   · BUSTED: só 1 por sala, troca os 3 melhores por cartas REAIS de categoria Profissional (nunca jogador de mentira)
//   · o pregão fecha redondo, sem carta duplicada e sem caixa negativo
//   npx tsx scripts/testa-vice-city.mts
import assert from 'node:assert/strict'
import { reducer, paPodeLancar, paMinimo, PA_TICK_MS, viceTravaLance, viceAlvoServe } from '../src/escalacao/store'
import type { EscState, WonCard } from '../src/escalacao/types'
import { GOLPES, VICE_BUSTED_EM, type GolpeId } from '../src/escalacao/vice-city'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }

let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START', teamName: 'Testador FC', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga', intro: true, pregaoAberto: true, vice: true } as never)
assert.equal(s.viceCity, true, 'Vice City ligado')
s = reducer(s, { type: 'START_STREAM_AUCTION' } as never)
assert.equal(s.phase, 'pregao', 'abriu no pregão')
const v0 = s.pa!.vice!
assert.ok(v0, 'estado das cartas nasceu')
const me = s.managers[s.youIdx]
assert.equal((v0.mao[me.id] ?? []).length, 3, '3 cartas no sorteio do começo')
assert.ok((v0.sorteioAte ?? 0) > Date.now(), 'janela do sorteio aberta')

assert.ok(v0.feed.length >= 1, 'boas-vindas no feed')
const robo = s.managers.find(m => !m.isHuman)!
assert.equal(v0.mao[robo.id], undefined, 'robô não recebe carta')

// força uma mão de teste (o reducer é quem usa; aqui só arrumamos o baralho do teste)
const da = (st: EscState, id: number, cartas: GolpeId[]) => { (st.pa!.vice!.mao[id] = st.pa!.vice!.mao[id] ?? []).push(...cartas) }
const usa = (st: EscState, golpe: GolpeId, alvo?: number) => reducer(st, { type: 'VICE_USAR', mgrId: st.managers[st.youIdx].id, golpe, alvo } as never)

// 🚔 Blitz no robô: ele não pode dar lance por 10 s; a estrela vai pra ele
s = structuredClone(s); da(s, me.id, ['blitz'])
let feed0 = s.pa!.vice!.feed.length
s = usa(s, 'blitz', robo.id)
assert.ok(viceTravaLance(s, robo.id), 'blitz trava o robô')
assert.equal(s.pa!.vice!.estrelas[robo.id], 1, 'quem leva golpe ganha 1 ⭐')
assert.ok(s.pa!.vice!.feed.length > feed0, 'golpe anunciado')
assert.ok(!s.pa!.vice!.mao[me.id].includes('blitz'), 'a carta sai da mão')
avanca(10_500)
assert.equal(viceTravaLance(s, robo.id), null, 'blitz acaba em 10 s')

// 🏦 Assalto: 10 moedas do robô pra mim
s = structuredClone(s); da(s, me.id, ['assalto'])
const meu0 = s.managers[s.youIdx].money, dele0 = s.managers.find(m => m.id === robo.id)!.money
s = usa(s, 'assalto', robo.id)
assert.equal(s.managers[s.youIdx].money, meu0 + 10, 'assalto põe 10 no meu caixa')
assert.equal(s.managers.find(m => m.id === robo.id)!.money, dele0 - 10, 'e tira 10 dele')

// 🛡️ Colete do alvo segura o golpe (sem estrela); 🚁 Fuga devolve
s = structuredClone(s)
s.pa!.vice!.colete[robo.id] = true; da(s, me.id, ['multa'])
const est1 = s.pa!.vice!.estrelas[robo.id] ?? 0
s = usa(s, 'multa', robo.id)
assert.equal(s.pa!.vice!.estrelas[robo.id] ?? 0, est1, 'colete: sem estrela')
assert.ok(!s.pa!.vice!.multa[robo.id], 'colete: multa não pegou')
s = structuredClone(s)
s.pa!.vice!.fuga[robo.id] = true; da(s, me.id, ['tanque'])
s = usa(s, 'tanque', robo.id)
assert.ok(viceTravaLance(s, me.id, 50), 'fuga: o tanque vazio voltou pra mim')
assert.equal(viceTravaLance(s, me.id, 5), null, 'tanque vazio deixa lance até 10')
avanca(16_000)

// 🔒 Cadeia (v2): sem jogador pago não dá; com jogador pago, o mais caro volta pra mesa NA HORA e o dinheiro volta
{
  let c = structuredClone(s)
  const rb = c.managers.find(m => m.id === robo.id)!
  rb.squad = rb.squad.filter(x => !(x.paid ?? 0))
  assert.equal(viceAlvoServe(c, 'cadeia', me.id, robo.id), false, 'cadeia sem jogador pago não acende')
  const caro = { ...((c.deck.ATA ?? [])[0] ?? c.pa!.fila[c.pa!.fila.length - 1]), id: 'teste-caro', paid: 33 } as never as WonCard
  rb.squad.push(caro)
  const din0 = rb.money, fila0 = c.pa!.fila.length
  da(c, me.id, ['cadeia'])
  c = usa(c, 'cadeia', robo.id)
  const rb2 = c.managers.find(m => m.id === robo.id)!
  assert.ok(!rb2.squad.some(x => x.id === 'teste-caro'), 'cadeia: o mais caro saiu do elenco')
  assert.equal(rb2.money, din0 + 33, 'cadeia: o dinheiro voltou')
  assert.equal(c.pa!.fila.length, fila0 + 1, 'cadeia: a carta voltou pra mesa')
}
// joga o pregão inteiro: eu dou lance de vez em quando e uso o que tiver na mão; confere o resto no caminho
let guard = 0, golpes = 0, receberam2 = false
while (s.phase === 'pregao' && s.pa && guard++ < 40000) {
  const v = s.pa?.vice
  if (v && (v.recebidas[me.id] ?? 0) === 3) receberam2 = true
  if (v && (v.recebidas[me.id] ?? 0) > 3) assert.fail('mais de 3 cartas recebidas')
  // usa a primeira carta da mão num alvo que sirva
  const mao = (v?.mao[me.id] ?? []) as GolpeId[]
  if (mao.length && guard % 40 === 0) {
    const g = mao[0]
    const alvo = GOLPES[g].alvo ? s.managers.find(m => m.id !== me.id)!.id : undefined
    s = usa(s, g, alvo); golpes++
  }
  const card = s.currentCards[0]
  if (card && guard % 7 === 0) {
    const min = paMinimo(s, 0)
    if (paPodeLancar(s, me.id, min)) s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: me.id, valor: min, cardId: card.id } as never)
  }
  avanca(PA_TICK_MS)
  s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never)
  for (const m of s.managers) assert.ok(m.money >= 0, `caixa nunca negativo (${m.teamName} ${m.money})`)
}
assert.ok(!s.pa, 'o pregão fechou')
assert.ok(receberam2, 'as 3 cartas ficaram (nenhuma chega no meio)')
// sem carta duplicada entre elencos
const ids = s.managers.flatMap(m => m.squad.map(c => c.id))
assert.equal(new Set(ids).size, ids.length, 'nenhuma carta em dois elencos')
console.log(`✅ Vice City: ${golpes} golpes no pregão, fechou na fase ${s.phase}`)

// 🚨 BUSTED: monta uma sala nova e bate 5 vezes no mesmo robô
let b = reducer({} as EscState, { type: 'NEW_GAME' } as never)
b = reducer(b, { type: 'START', teamName: 'Testador FC', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga', intro: true, pregaoAberto: true, vice: true } as never)
b = reducer(b, { type: 'START_STREAM_AUCTION' } as never)
// deixa o robô com elenco: roda o pregão até ele ter uns jogadores
let g2 = 0
const alvoId = b.managers.find(m => !m.isHuman)!.id
while (b.phase === 'pregao' && b.pa && (b.managers.find(m => m.id === alvoId)!.squad.length < 6) && g2++ < 20000) { avanca(PA_TICK_MS); b = reducer(b, { type: 'PREGAO_ABERTO_TICK' } as never) }
const alvoAntes = b.managers.find(m => m.id === alvoId)!.squad.map(c => c.name)
const eu = b.managers[b.youIdx]
for (let i = 0; i < VICE_BUSTED_EM; i++) { b = structuredClone(b); da(b, eu.id, ['delacao']); b = usa(b, 'delacao', alvoId) }
const vb = b.pa!.vice!
assert.equal(vb.busted, alvoId, 'BUSTED no 5º golpe')
const alvoDepois = b.managers.find(m => m.id === alvoId)!
const sairam = alvoAntes.filter(n => !alvoDepois.squad.some(c => c.name === n))
assert.ok(sairam.length >= 1 && sairam.length <= 3, `BUSTED troca até 3 (${sairam.length})`)
for (const c of alvoDepois.squad) assert.ok(!c.fake, 'nunca jogador de mentira no BUSTED')
assert.ok((vb.mao[alvoId] ?? []).includes('roubo'), 'BUSTED ganha Roubo de carro de vingança')
assert.ok(vb.feed.some(f => f.busted), 'BUSTED anunciado')
// 2º BUSTED não existe
const outro = b.managers.find(m => !m.isHuman && m.id !== alvoId)!.id
for (let i = 0; i < VICE_BUSTED_EM; i++) { b = structuredClone(b); da(b, eu.id, ['delacao']); b = usa(b, 'delacao', outro) }
assert.equal(b.pa!.vice!.busted, alvoId, 'só 1 BUSTED por sala')
console.log(`✅ BUSTED: ${alvoDepois.teamName} perdeu ${sairam.join(', ')}`)

// 🚗 Roubo de carro: leva o último jogador do rival, de graça
let r = reducer({} as EscState, { type: 'NEW_GAME' } as never)
r = reducer(r, { type: 'START', teamName: 'Testador FC', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga', intro: true, pregaoAberto: true, vice: true } as never)
r = reducer(r, { type: 'START_STREAM_AUCTION' } as never)
let g3 = 0
while (r.phase === 'pregao' && r.pa && g3++ < 20000) {
  avanca(PA_TICK_MS); r = reducer(r, { type: 'PREGAO_ABERTO_TICK' } as never)
  const vv = r.pa?.vice
  const dono = vv && Object.keys(vv.ultimo).map(Number).find(id => id !== r.managers[r.youIdx].id)
  if (dono !== undefined && dono !== false) {
    const cid = vv!.ultimo[dono]
    const c = r.managers.find(m => m.id === dono)!.squad.find(x => x.id === cid)!
    const meu = r.managers[r.youIdx]
    if (r.managers.find(m => m.id === meu.id) && (meu.squad.filter(x => x.pos === c.pos).length < 1)) {
      const cx = meu.money
      r = structuredClone(r); da(r, meu.id, ['roubo']); r = usa(r, 'roubo', dono)
      const meu2 = r.managers[r.youIdx]
      assert.ok(meu2.squad.some(x => x.id === cid), 'roubei o jogador')
      assert.ok(!r.managers.find(m => m.id === dono)!.squad.some(x => x.id === cid), 'saiu do elenco dele')
      assert.equal(meu2.money, cx, 'roubo não custa nada')
      console.log(`✅ Roubo de carro: levei ${c.name}`)
      break
    }
  }
}
console.log('✅ trava do Vice City passou')
