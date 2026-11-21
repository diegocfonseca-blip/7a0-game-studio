// 🌴 trava do VICE CITY (19/11): roda uma Partida Rápida inteira de Pregão aberto com as cartas de golpe ligadas, no motor de
// verdade (reducer), e confere:
//   · todo técnico de gente recebe 3 cartas no sorteio do começo (19/11 v2) e nunca mais (fora a de vingança do BUSTED)
//   · 🔒 Cadeia vale NA HORA: o jogador mais caro dele volta pra mesa com o dinheiro
//   · cada golpe é anunciado no feed, tira a carta da mão e dá 1 ⭐ escondida pra quem LEVOU
//   · Blitz / Barreira / Tanque vazio barram o lance (a tela e o motor leem `viceTravaLance`)
//   · Roubo de carro tira o último jogador do rival sem pagar; Assalto move 10 moedas; Colete segura; Fuga devolve
//   · BUSTED: só o 1º com 5 estrelas; no FIM do pregão os 5 melhores viram cartas REAIS de categoria Profissional (nunca jogador de mentira)
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
// 🚨 19/11 v3: na hora só é PEGO (sirene pra sala) — o elenco não muda até o fim do pregão
assert.deepEqual(b.managers.find(m => m.id === alvoId)!.squad.map(c => c.name), alvoAntes, 'BUSTED não mexe no elenco na hora')
assert.ok((vb.mao[alvoId] ?? []).includes('roubo'), 'BUSTED ganha Roubo de carro de vingança')
assert.ok(vb.feed.some(f => f.busted), 'BUSTED anunciado')
// 2º BUSTED não existe, e depois do 1º ninguém mais leva estrela
const outro = b.managers.find(m => !m.isHuman && m.id !== alvoId)!.id
const estrelasOutro = b.pa!.vice!.estrelas[outro] ?? 0
for (let i = 0; i < VICE_BUSTED_EM; i++) { b = structuredClone(b); da(b, eu.id, ['delacao']); b = usa(b, 'delacao', outro) }
assert.equal(b.pa!.vice!.busted, alvoId, 'só 1 BUSTED por sala')
assert.equal(b.pa!.vice!.estrelas[outro] ?? 0, estrelasOutro, 'depois do BUSTED ninguém mais leva estrela')
// a pena cai no FIM do pregão: os 5 melhores (acima de Profissional) viram Profissionais reais
const forca = (c: { hi?: number; lo?: number; fame?: number }) => (c.hi ?? 0) + (c.lo ?? 0) + (c.fame ?? 0) * 10
let g9 = 0
while (b.phase === 'pregao' && b.pa && g9++ < 40000) { avanca(PA_TICK_MS); b = reducer(b, { type: 'PREGAO_ABERTO_TICK' } as never) }
assert.ok(!b.pa, 'o pregão do BUSTED fechou')
const alvoDepois = b.managers.find(m => m.id === alvoId)!
const pena = alvoDepois.squad.filter(c => c.id.startsWith('vice-busted-'))
assert.ok(pena.length >= 1 && pena.length <= 5, `BUSTED troca até 5 no fim (${pena.length})`)
for (const c of pena) assert.equal(c.fame ?? 1, 1, 'quem entra é Profissional')
for (const c of alvoDepois.squad) assert.ok(!c.fake, 'nunca jogador de mentira no BUSTED')
const sairam = pena.map(c => c.name)
void forca
console.log(`✅ BUSTED: ${alvoDepois.teamName} ganhou no fim ${sairam.length} Profissionais (${sairam.join(', ')})`)

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
// 🆕 21/11: as 8 cartas novas (Pneu furado, Jacaré, NPC, Código de trapaça, Missão cumprida, Paraquedas, Loja de armas, Contrabando)
{
  let n = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  n = reducer(n, { type: 'START', teamName: 'Testador FC', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga', intro: true, pregaoAberto: true, vice: true } as never)
  n = reducer(n, { type: 'START_STREAM_AUCTION' } as never)
  avanca(8000); n = reducer(n, { type: 'PREGAO_ABERTO_TICK' } as never)
  const eu2 = () => n.managers[n.youIdx]
  const rb = n.managers.find(m => !m.isHuman)!.id
  const rob = () => n.managers.find(m => m.id === rb)!
  // 🛞 pneu: só o mínimo por 30 s
  n = structuredClone(n); da(n, eu2().id, ['pneu']); n = usa(n, 'pneu', rb)
  const min = paMinimo(n, 0)
  assert.ok(viceTravaLance(n, rb, min + 3), 'pneu: barra lance acima do mínimo')
  assert.equal(viceTravaLance(n, rb, min), null, 'pneu: o mínimo (+1) passa')
  avanca(31_000); n = reducer(n, { type: 'PREGAO_ABERTO_TICK' } as never)
  assert.equal(viceTravaLance(n, rb, paMinimo(n, 0) + 3), null, 'pneu acaba em 30 s')
  // 🤖 NPC: um Profissional real entra no time do rival
  const sq0 = rob().squad.length
  n = structuredClone(n); da(n, eu2().id, ['npc']); n = usa(n, 'npc', rb)
  assert.equal(rob().squad.length, sq0 + 1, 'NPC: entrou 1 no time dele')
  const npc = rob().squad.find(c => c.id.startsWith('vice-npc-'))!
  assert.ok(npc && (npc.fame ?? 1) === 1 && !npc.fake, 'NPC: carta real de Profissional')
  // 🎮 trapaça: +50 e +1 ⭐ pra quem usou
  const din = eu2().money, est = n.pa!.vice!.estrelas[eu2().id] ?? 0
  n = structuredClone(n); da(n, eu2().id, ['trapaca']); n = usa(n, 'trapaca')
  assert.equal(eu2().money, din + 50, 'trapaça: +50')
  assert.equal(n.pa!.vice!.estrelas[eu2().id] ?? 0, est + 1, 'trapaça: +1 estrela pra quem usou')
  // 🔫 loja: −10 e uma carta nova na mão
  const din2 = eu2().money
  n = structuredClone(n); da(n, eu2().id, ['loja']); const mao0 = n.pa!.vice!.mao[eu2().id].length; n = usa(n, 'loja')
  assert.equal(eu2().money, din2 - 10, 'loja: −10')
  assert.equal(n.pa!.vice!.mao[eu2().id].length, mao0, 'loja: gastou 1, ganhou 1')
  // ✈️ contrabando: o caixote cai pra alguém de gente e a cena do avião vai pra sala
  n = structuredClone(n); da(n, eu2().id, ['contrabando']); const mao1 = n.pa!.vice!.mao[eu2().id].length; n = usa(n, 'contrabando')
  assert.equal(n.pa!.vice!.mao[eu2().id].length, mao1, 'contrabando: (só eu de gente) gastei 1 e o caixote caiu pra mim')
  assert.equal(n.pa!.vice!.feed[0].cena, 'aviao', 'contrabando: cena do avião')
  // 💼 missão: marca a carta da mesa
  n = structuredClone(n); da(n, eu2().id, ['missao']); n = usa(n, 'missao')
  assert.equal(n.pa!.vice!.missao?.[eu2().id], n.pa!.idx, 'missão: vale a carta da mesa')
  // 🪂 paraquedas + 🐊 jacaré: o robô armou um jacaré em mim; a lenda que cai de paraquedas vai pra ele
  n = structuredClone(n)
  n.pa!.vice!.jacare = { [eu2().id]: rb }
  const robSq = rob().squad.length
  da(n, eu2().id, ['paraquedas']); n = usa(n, 'paraquedas')
  assert.ok(n.pa!.vice!.feed.some(f => f.cena === 'paraquedas'), 'paraquedas: cena')
  assert.ok(n.pa!.vice!.feed[0].cena === 'jacare', 'jacaré: abocanhou a lenda do paraquedas')
  assert.ok(rob().squad.some(c => c.id.startsWith('vice-jacare-') && c.fame === 5), 'jacaré: a lenda foi pro dono do jacaré')
  assert.ok(rob().squad.length >= robSq, 'jacaré: ninguém some do elenco do dono')
  assert.ok(!eu2().squad.some(c => c.id.startsWith('vice-paraquedas-')), 'jacaré: saiu do meu time')
  assert.equal(n.pa!.vice!.jacare?.[eu2().id], undefined, 'jacaré vale uma vez')
  // 🪂 paraquedas sem jacaré: a lenda fica comigo
  n = structuredClone(n); da(n, eu2().id, ['paraquedas']); n = usa(n, 'paraquedas')
  assert.ok(eu2().squad.some(c => c.id.startsWith('vice-paraquedas-') && c.fame === 5), 'paraquedas: lenda real no meu time')
  // e o resto do pregão fecha redondo
  let g4 = 0
  while (n.phase === 'pregao' && n.pa && g4++ < 40000) { avanca(PA_TICK_MS); n = reducer(n, { type: 'PREGAO_ABERTO_TICK' } as never); for (const m of n.managers) assert.ok(m.money >= 0, 'caixa nunca negativo') }
  assert.ok(!n.pa, 'pregão com as cartas novas fechou')
  const ids2 = n.managers.flatMap(m => m.squad.map(c => c.id))
  assert.equal(new Set(ids2).size, ids2.length, 'cartas novas: nenhuma carta em dois elencos')
  // 21/11: pela CARTA (nome|clube|ano), não pelo nome — a mesma pessoa em baralhos diferentes é permitida (De Paul Atlético × De Paul Inter Miami)
  const nomes2 = n.managers.flatMap(m => m.squad.filter(c => !c.fake).map(c => `${c.name}|${c.club}|${c.year}`))
  assert.equal(new Set(nomes2).size, nomes2.length, 'cartas novas: nenhum jogador repetido entre times')
  console.log('✅ cartas novas: pneu, NPC, trapaça, loja, contrabando, missão, paraquedas e jacaré')
}
console.log('✅ trava do Vice City passou')
