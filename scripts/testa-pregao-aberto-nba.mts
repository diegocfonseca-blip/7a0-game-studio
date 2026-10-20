// 🏀🔨 trava do PREGÃO ABERTO NO BASQUETE (19/10): roda uma partida rápida do BidLegends inteira no motor de verdade
// (reducer) com o pregão aberto ligado — é o MESMO motor que a sala online usa (o dono roda o reducer). Confere:
//   · a fila é só de cartas da NBA (nenhum jogador de futebol entra num time de basquete)
//   · todo time fecha o quinteto (1 por posição), ninguém fica negativo com as 50 moedas
//   · a vaga que sobra é completada com carta da NBA (ou o tapa-buraco do basquete), nunca do futebol
//   npx tsx scripts/testa-pregao-aberto-nba.mts
import assert from 'node:assert/strict'
import { reducer, paPodeLancar, paMinimo, PA_TICK_MS, openSlots } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'
import { CATALOG_NBA } from '../src/escalacao/data-basquete'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }
const NBA = new Set(Object.values(CATALOG_NBA).flat().map(c => `${c.name}|${c.club}`))

// sem pedir pregão aberto, a partida rápida do basquete é o envelope de sempre (não herda o jeito de lance de antes)
{
  let h = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  h = { ...h, pregaoAberto: true, holandes: true }
  h = reducer(h, { type: 'START_NBA', teamName: 'Tijoleiros', rivals: 3 } as never)
  assert.equal(h.pregaoAberto, false, 'não herdou o pregão aberto'); assert.equal(h.holandes, false, 'não herdou a Tocaia')
  assert.notEqual(h.phase, 'pregao', 'abriu no envelope')
  console.log('ok - partida rápida do basquete não herda o jeito de lance da anterior')
}
for (const rivals of [3, 9, 15]) {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_NBA', teamName: 'Tijoleiros', rivals, pregaoAberto: true } as never)
  assert.equal(s.sport, 'basquete')
  assert.equal(s.phase, 'pregao', `abriu no pregão aberto (${rivals} rivais)`)
  for (const c of s.pa!.fila) assert.ok(NBA.has(`${c.name}|${c.club}`), `${c.name} (${c.club}) é carta da NBA`)
  const me = s.managers[s.youIdx]
  const caixa0 = me.money
  assert.equal(caixa0, 50, 'orçamento do basquete')
  let guard = 0, cartas = 0
  while (s.phase === 'pregao' && s.screen === 'auction' && guard++ < 20000) {
    const card = s.currentCards[0]
    if (!card) { avanca(PA_TICK_MS); s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never); continue } // 2 mesas (11+ times): a carta pode estar só na 2ª
    cartas++
    const pa = s.pa!
    if (pa.viraAte && pa.viraAte > nowRef.t) avanca(pa.viraAte - nowRef.t)
    const you = s.managers[s.youIdx]
    const quer = cartas % 3 === 0 && paPodeLancar(s, you.id, paMinimo(s))
    const id = card.id
    let ticks = 0
    while (s.currentCards[0]?.id === id && s.phase === 'pregao' && ticks++ < 800) {
      avanca(PA_TICK_MS)
      if (quer && s.pa!.lider !== you.id && paMinimo(s) <= 8 && paPodeLancar(s, you.id, paMinimo(s)))
        s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: paMinimo(s) } as never)
      s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never)
    }
  }
  assert.ok(guard < 20000, 'o pregão termina')
  assert.ok(['monte', 'cerimonia', 'season'].includes(s.screen), `seguiu em frente (tela ${s.screen})`)
  for (const m of s.managers) {
    for (const pos of SECTORS) assert.equal(openSlots(m, pos), 0, `${m.teamName} fechou ${pos}`)
    assert.equal(m.squad.length, 5, `${m.teamName} tem o quinteto (${m.squad.length})`)
    assert.ok(m.money >= 0, `${m.teamName} não ficou negativo (${m.money})`)
    for (const c of m.squad) {
      const nba = NBA.has(`${c.name}|${c.club}`)
      const tapa = c.club === 'Pickup' || (c as { fake?: boolean }).fake
      assert.ok(nba || tapa, `${m.teamName}: ${c.name} (${c.club}) não é carta da NBA`)
    }
  }
  const gasto = s.managers[s.youIdx].squad.reduce((a, c) => a + ((c as { paid?: number }).paid ?? 0), 0)
  assert.equal(Math.round(caixa0 - s.managers[s.youIdx].money), gasto, 'o caixa bateu com o que pagou')
  console.log(`ok - ${rivals + 1} times: ${cartas} cartas no pregão, todos com quinteto da NBA, ninguém negativo`)
}
console.log('TUDO OK')
process.exit(0) // não espera o cliente do banco (ele dispara um evento de login depois e suja a saída)
