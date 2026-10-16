// 🔨 trava do PREGÃO ABERTO (16/10): roda uma Partida Rápida inteira no motor de verdade (reducer), com o humano dando
// lance de vez em quando, e confere que o pregão fecha redondo:
//   · a fila vem EMBARALHADA entre as posições (ninguém sabe a próxima) e tem o baralho inteiro
//   · toda carta vendida está no elenco de quem levou, paga pelo lance final (caixa nunca negativo)
//   · gente só dá lance com vaga na posição e dinheiro; não cobre o próprio lance; abaixo do mínimo é recusado
//   · o martelo vende pro líder; sem lance, a carta vai pro Monte; e no fim o jogo segue pro Monte/cerimônia
//   npx tsx scripts/testa-pregao-aberto.mts
import assert from 'node:assert/strict'
import { reducer, paPodeLancar, paMinimo, PA_MARTELO_MS } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'

const nowRef = { t: 1_800_000_000_000 }
const realNow = Date.now
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }

let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START', teamName: 'Testador FC', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga_copa', intro: true, pregaoAberto: true } as never)
assert.equal(s.pregaoAberto, true, 'modo ligado')
assert.equal(s.screen, 'streamIntro', 'tela de regras antes do pregão, como no rápido de sempre')
s = reducer(s, { type: 'START_STREAM_AUCTION' } as never) // "Começar o leilão"
assert.equal(s.holandes, false, 'Tocaia desligada')
assert.equal(s.screen, 'auction'); assert.equal(s.phase, 'pregao', 'abriu no pregão')
assert.ok(s.pa, 'estado vivo')
const total = s.pa!.fila.length
const porPos = SECTORS.map(p => [p, s.pa!.fila.filter(c => c.pos === p).length] as const)
assert.ok(total >= 11 * 10, `baralho inteiro na fila (${total})`)
// embaralhada: as 10 primeiras não são todas da mesma posição
assert.ok(new Set(s.pa!.fila.slice(0, 10).map(c => c.pos)).size >= 2, 'ordem embaralhada entre posições')
console.log('fila', total, 'cartas', porPos.map(([p, n]) => `${p} ${n}`).join(' · '))

const me = s.managers[s.youIdx]
const caixa0 = me.money
let vendasHumano = 0, recusas = 0, cartas = 0, semLance = 0, tetoMax1 = 0
const vendidos = new Map<string, { mgr: number; preco: number }>()
let guard = 0
while (s.phase === 'pregao' && s.screen === 'auction' && guard++ < 20000) {
  const pa = s.pa!
  const card = s.currentCards[0]
  if (!card) { s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never); continue }
  const you = s.managers[s.youIdx]
  cartas++
  // 🧠 nenhum robô topa mais que 35% do caixa numa carta só (40% se for lenda) — foi o "49 de primeira" do 1º teste
  for (const [id, teto] of Object.entries(pa.tetos)) {
    const m = s.managers.find(x => x.id === Number(id))!
    const lim = Math.floor(m.money * (card.fame >= 5 ? 0.4 : 0.35))
    assert.ok(teto <= Math.max(lim, 1), `${m.teamName} toparia ${teto} com ${m.money} no caixa (${card.name}, ${card.fame}⭐)`)
  }
  if (cartas === 1) tetoMax1 = Math.max(0, ...Object.values(pa.tetos))
  // o humano briga em ~1 de cada 4 cartas, até um teto dele
  const quer = cartas % 4 === 0 && paPodeLancar(s, you.id, paMinimo(s))
  const meuTeto = quer ? paMinimo(s) + 6 : 0
  // lance abaixo do mínimo e lance acima do caixa são recusados SEMPRE
  const antes = s.pa!.lances.length
  s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: paMinimo(s) - 1 } as never)
  s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: Math.floor(you.money) + 1 } as never)
  if (s.pa!.lances.length !== antes) throw new Error('lance inválido foi aceito')
  recusas += 2
  let ticks = 0
  const id = card.id
  while (s.currentCards[0]?.id === id && s.phase === 'pregao' && ticks++ < 400) {
    avanca(1000)
    if (quer && s.pa!.lider !== you.id && paMinimo(s) <= meuTeto && paPodeLancar(s, you.id, paMinimo(s))) {
      s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: paMinimo(s) } as never)
      assert.equal(s.pa!.lider, you.id, 'meu lance válido entra e eu fico na frente')
      // cobrir o próprio lance é recusado
      const n = s.pa!.lances.length
      s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: paMinimo(s) } as never)
      assert.equal(s.pa!.lances.length, n, 'não cobre o próprio lance')
    }
    s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never)
  }
  const v = s.pa?.vendidos[0]
  if (s.pa && v && v.cardId === id) {
    if (v.mgr === null) semLance++
    else { vendidos.set(id, { mgr: v.mgr, preco: v.preco }); if (v.mgr === you.id) vendasHumano++ }
  }
}
assert.ok(guard < 20000, 'o pregão termina')
assert.ok(['monte', 'cerimonia', 'season'].includes(s.screen), `seguiu pro Monte/cerimônia (tela ${s.screen})`)
assert.equal(s.pa, undefined, 'estado vivo limpo no fim')
// toda carta vendida está no elenco do comprador, uma vez só, e ninguém ficou negativo
for (const [id, v] of vendidos) {
  const donos = s.managers.filter(m => m.squad.some(c => c.id === id))
  assert.equal(donos.length, 1, `carta ${id} tem um dono só`)
  assert.equal(donos[0].id, v.mgr, `carta ${id} está com quem arrematou`)
  const w = donos[0].squad.find(c => c.id === id)!
  assert.equal(w.paid, v.preco, `pagou o lance final (${w.paid} vs ${v.preco})`)
}
for (const m of s.managers) assert.ok(m.money >= 0, `${m.teamName} não ficou negativo (${m.money})`)
const meFim = s.managers[s.youIdx]
const gasto = meFim.squad.reduce((a, c) => a + ((c as { paid?: number }).paid ?? 0), 0)
assert.equal(Math.round(caixa0 - meFim.money), gasto, 'o caixa do humano bateu com o que ele pagou')
// ninguém tem mais que as vagas da posição (o lance só é aceito com vaga aberta)
for (const m of s.managers) for (const pos of SECTORS) {
  const n = m.squad.filter(c => c.pos === pos).length
  assert.ok(n <= 6, `${m.teamName} com ${n} em ${pos}`)
}
console.log(`🧠 maior teto de robô na 1ª carta: ${tetoMax1}`)
console.log(`✅ pregão aberto: ${cartas} cartas na mesa · ${vendidos.size} vendidas · ${semLance} sem lance → Monte · humano levou ${vendasHumano} · ${recusas} lances inválidos recusados · tela final: ${s.screen} · martelo ${PA_MARTELO_MS / 1000}s`)
Date.now = realNow
process.exit(0)
