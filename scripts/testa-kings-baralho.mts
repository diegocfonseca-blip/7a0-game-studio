// 👑 TRAVA DO BARALHO DA KINGS (10/11, pedido do Diego): os jogadores da Kings League só aparecem no leilão da Kings com
// "Jogadores da Kings League"; nunca em outro leilão; nunca entra jogador falso; todo mundo fecha as 7 vagas; o valor é 100.
// Rodar: npx tsx scripts/testa-kings-baralho.mts
import { PRESIDENTES_KINGS } from '../src/escalacao/kings-presidentes'
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { BARALHO_KINGS } from '../src/escalacao/kings-baralho'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../src/escalacao/data'

const chave = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
// 🎩 12/11: os PRESIDENTES da Kings também são do leilão dela (vaga 'LAT')
const KINGS = new Set([...Object.values(BARALHO_KINGS).flat(), ...PRESIDENTES_KINGS].map(chave))
// os JOGADORES da Kings (os presidentes valem nos dois baralhos da Kings — só não podem sair da Kings)
const KINGS_JOG = new Set(Object.values(BARALHO_KINGS).flat().map(chave))
let falhas = 0
const falha = (m: string) => { falhas++; console.log('❌ ' + m) }

// 1) nenhuma carta da Kings está nos baralhos de sempre (é por ISSO que não vaza)
for (const cat of [CATALOG, CATALOG_EU, CATALOG_WORLD]) for (const c of Object.values(cat).flat()) if (KINGS.has(chave(c))) falha(`carta da Kings dentro de um baralho de sempre: ${chave(c)}`)
// 2) só lenda/craque/bom/profissional
for (const c of Object.values(BARALHO_KINGS).flat()) if (![1, 2, 4, 5].includes(c.fame)) falha(`categoria fora da regra: ${c.name}`)

function partida(opts: Record<string, unknown>, modo: (s: EscState) => EscState = s => s) {
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, copaMode: 'liga', league: 'br', ...opts } as never)
  s = modo(s)
  if (opts.kings) for (const m of s.managers) if (m.money !== 100) falha(`${m.name} começou com ${m.money} moedas (devia 100)`)
  const vistas = new Set<string>()
  const olha = () => { for (const l of Object.values(s.deck ?? {})) for (const c of l as { name: string; club: string; year: number }[]) vistas.add(chave(c)) }
  olha()
  for (let i = 0; i < 4000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') { if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: s.managers[s.youIdx].id, bids: [] } as never); continue } if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' } as never); continue } s = reducer(s, { type: 'ADVANCE_REVEAL' } as never); olha(); continue }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' } as never); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' } as never); continue }
    s = reducer(s, { type: 'FORCE_SEAL' } as never)
  }
  return { s, vistas }
}

let jogosKings = 0
for (let t = 0; t < 8; t++) {
  const { s, vistas } = partida({ kings: true, kingsBaralho: true })
  if (s.screen !== 'season') { falha(`Kings com baralho da Kings não chegou na temporada (tela ${s.screen})`); continue }
  if (!s.kingsBaralho) falha('a partida esqueceu que é com o baralho da Kings')
  if (s.managers.length !== 10) falha(`Kings com ${s.managers.length} times (devia ser 10)`)
  for (const k of vistas) if (!KINGS.has(k)) falha(`carta de fora no leilão da Kings: ${k}`)
  for (const m of s.managers) {
    if (m.squad.length !== 8 || m.squad.filter(c => c.presidente).length !== 1) falha(`${m.name} fechou com ${m.squad.length} (devia 7 + 1 presidente)`)
    for (const c of m.squad) { if (c.fake) falha(`jogador falso no ${m.name}: ${c.name}`); if (!KINGS.has(chave(c))) falha(`carta de fora no elenco ${m.name}: ${chave(c)}`) }
  }
  let x = s
  for (let r = 0; r < 9; r++) { x = reducer(x, { type: 'PLAY_ROUND' } as never); jogosKings += x.lastResults.length }
}
// 2b) a Kings não tem lateral: nenhum lote de lateral no leilão (nem com os jogadores padrão)
for (const kb of [true, false]) {
  const s0 = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'T', formation: '4-3-3', rivals: 9, kings: true, kingsBaralho: kb, copaMode: 'liga', league: 'br' } as never)
  if ((s0.deck.LAT ?? []).some(c => !c.presidente)) falha(`Kings (${kb ? 'baralho da Kings' : 'jogadores padrão'}) com lateral de verdade no leilão (a vaga LAT é só dos 🎩 presidentes)`)
}
// 3) com "jogadores padrão" a Kings usa o baralho de sempre (nenhuma carta da Kings)
for (let t = 0; t < 3; t++) {
  const { s, vistas } = partida({ kings: true })
  if (s.kingsBaralho) falha('Kings com jogadores padrão ficou com o baralho da Kings')
  for (const k of vistas) if (KINGS_JOG.has(k)) falha(`carta da Kings vazou na Kings com jogadores padrão: ${k}`)
}
// 4) e depois de uma Kings, a partida rápida normal NÃO herda o baralho da Kings
for (let t = 0; t < 3; t++) {
  partida({ kings: true, kingsBaralho: true })
  const { vistas } = partida({})
  for (const k of vistas) if (KINGS.has(k)) falha(`carta da Kings vazou no leilão normal: ${k}`)
  const cl = partida({ clubes: true })
  for (const k of cl.vistas) if (KINGS.has(k)) falha(`carta da Kings vazou no leilão de Clubes: ${k}`)
}
// 5) 👑 11/11: SALA ONLINE da Kings — 10 times na formação 'kings', a competição dela (só liga), o baralho da Kings e nada vaza
for (const kb of [true, false]) {
  const s0 = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 'r', roomCode: 'KINGS1', isHost: true, playerIndex: 0, playerNames: ['Ana', 'Beto', 'Caio'], seatUids: ['a', 'b', 'c'], formation: 'kings', kingsBaralho: kb, deck: 'br', copaMode: 'liga_copa', tamanhoLiga: 10, envUnico: true, clubes: true } as never)
  if (s0.managers.length !== 10) falha(`sala Kings com ${s0.managers.length} times`)
  if (!s0.managers.every(m => m.formation === 'kings')) falha('sala Kings com time fora da formação kings')
  if (s0.copaMode !== 'liga' || s0.leilaoClubes || s0.tamanhoLiga) falha('sala Kings levou opção que não vale nela (copa/clubes/liga de 10)') // (o envelope único VALE na Kings desde 11/11)
  if (!!s0.kingsBaralho !== kb) falha(`sala Kings: kingsBaralho ${s0.kingsBaralho} (esperado ${kb})`)
  const cartas = [...Object.values(s0.deck ?? {}).flat(), ...s0.managers.flatMap(m => m.squad)] as { name: string; club: string; year: number }[]
  for (const c of cartas) if ((c as { presidente?: boolean }).presidente ? !KINGS.has(chave(c)) : kb !== KINGS_JOG.has(chave(c))) { falha(`sala Kings (${kb ? 'baralho da Kings' : 'padrão'}): carta ${chave(c)}`); break } // 🎩 presidentes valem nos dois
  for (const m of s0.managers.filter(m => !m.isHuman)) if (m.squad.length !== 8 || m.squad.filter(c => c.presidente).length !== 1 || m.squad.some(c => c.fake)) falha(`bot ${m.name} da sala Kings com ${m.squad.length} (ou falso / sem presidente)`)
}
// 6) e uma sala normal depois de uma sala da Kings não herda o baralho dela
{
  const s1 = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 'r2', roomCode: 'NORMAL1', isHost: true, playerIndex: 0, playerNames: ['Ana', 'Beto'], seatUids: ['a', 'b'], formation: '4-3-3', deck: 'br', copaMode: 'liga' } as never)
  if (s1.kingsBaralho) falha('sala normal herdou o baralho da Kings')
  for (const c of [...Object.values(s1.deck ?? {}).flat(), ...s1.managers.flatMap(m => m.squad)] as { name: string; club: string; year: number }[]) if (KINGS.has(chave(c))) { falha(`carta da Kings vazou na sala normal: ${chave(c)}`); break }
}
console.log(`(${jogosKings} jogos da Kings jogados com o baralho dela)`)
if (falhas) { console.log(`🔴 ${falhas} falha(s)`); process.exit(1) }
console.log('🟢 baralho da Kings: só na Kings, 100 moedas, sem jogador falso, 7 vagas fechadas, nunca vaza')
process.exit(0)
