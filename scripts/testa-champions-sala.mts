// 🧪 ⭐ LIGA + CHAMPIONS DA SALA (26/11) — o motor puro: 36 clubes reais, fase de liga de 8 rodadas (4 em casa, 4 fora, ninguém
// repete adversário), 1º–8º direto, 9º–24º no playoff, ida e volta até a semi (volta na casa do melhor), final única, pênaltis,
// mesma semente = mesma copa, e as cartas só do modo (baralho Europa, sem repetir pessoa, régua de 02/11, fora dos leilões).
// uso: npm run champions-sala
import { CHS, CHAMPIONS_SALA_VAGAS, clubesChampionsSala, montaFichaChampions, entrantesChampions, simulaChampionsSala, tabelaChampionsSala, jogosDoPassoCh, faseIdxCh, ehVoltaCh, chsComResumo } from '../src/escalacao/champions-sala'
import { CARTAS_CHAMPIONS_CLUBES as C } from '../src/escalacao/cartas-champions-clubes'
import { CARTAS_MUNDIAL_CLUBES as M } from '../src/escalacao/cartas-mundial-clubes'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../src/escalacao/data'
import { poolDoClube } from '../src/escalacao/copa-regional'
import { clubesLiberta } from '../src/escalacao/liberta-sala'
import { clubesMundial } from '../src/escalacao/mundial-sala'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

// ── as cartas ──
ok(clubesChampionsSala().length === CHAMPIONS_SALA_VAGAS, `os ${CHAMPIONS_SALA_VAGAS} clubes fecham um time (${clubesChampionsSala().length})`)
const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim()
const XARAS = new Set(['ederson', 'pepe', 'jorginho']) // outra pessoa, mesmo nome (Éderson Atalanta × Ederson City · Pêpê Pafos × Pepe Real · Jorginho Kairat)
const eu = [...Object.values(CATALOG_EU).flat(), ...M.filter(c => c.club === 'Salzburg')] as { name: string; club: string }[]
for (const c of C) {
  const rep = eu.filter(x => n(x.name) === n(c.name))
  if (rep.length && !XARAS.has(n(c.name))) ok(false, `${c.name} (${c.club}) já tem carta no baralho Europa: ${rep.map(r => r.club).join(', ')}`)
  if (C.filter(x => n(x.name) === n(c.name)).length > 1) ok(false, `${c.name} repetido no lote`)
  const faixa: Record<number, [number, number]> = { 1: [55, 66], 3: [68, 79], 4: [80, 89], 5: [90, 97] }
  const [lo, hi] = faixa[c.fame] ?? [0, 0], media = (c.lo + c.hi) / 2
  if (media < lo - 1 || media > hi + 1) ok(false, `${c.name}: média ${media} fora da régua da categoria ${c.fame}`)
}
ok(true, `${C.length} cartas do lote conferidas (baralho Europa, régua de 02/11)`)
const noLeilao = new Set([CATALOG, CATALOG_EU, CATALOG_WORLD].flatMap(d => Object.values(d).flat()).map((c: any) => `${c.name}|${c.club}|${c.year}`))
ok(C.every(c => !noLeilao.has(`${c.name}|${c.club}|${c.year}`)), 'nenhuma carta do lote está nos baralhos do leilão')
const outras = new Set([...clubesLiberta(), ...clubesMundial()].flatMap(cl => Object.values(poolDoClube(cl)).flat().map(c => `${c.name}|${c.club}|${c.year}`)))
ok(C.every(c => !outras.has(`${c.name}|${c.club}|${c.year}`)), 'Libertadores e Super Mundial da sala não ganharam carta deste lote')

// ── o torneio ──
function torneio(seed: number, humanos: number) {
  const lugares = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Time ${i + 1}`, humano: i < humanos }))
  const uid = new Map(lugares.filter(l => l.humano).map(l => [l.id, `u${l.id}`]))
  const picks = new Map([['u0', { pais: 'Kairat', xiKeys: [], form: '4-3-3' as const }]])
  const f = montaFichaChampions(lugares, uid, picks, seed, 1)
  const e = entrantesChampions(f, 'u0')
  return { f, e, m: simulaChampionsSala(e, seed) }
}
for (const [seed, hum] of [[11, 4], [777, 20], [2026, 1]] as const) {
  const { f, e, m } = torneio(seed, hum)
  const nome = `semente ${seed}`
  ok(f.times.length === 36 && new Set(f.times.map(t => t.pais)).size === 36, `${nome}: 36 clubes sem repetir`)
  ok(f.times[0].pais === 'Kairat', `${nome}: quem escolheu leva o clube que escolheu`)
  ok(m.rodadas.length === 8 && m.rodadas.every(r => r.length === 18), `${nome}: 8 rodadas de 18 jogos`)
  const casa = new Map<number, number>(), vs = new Map<number, Set<number>>()
  for (const r of m.rodadas) { const viu = new Set<number>(); for (const j of r) { for (const t of [j.h, j.a]) { if (viu.has(t)) ok(false, `${nome}: time joga 2x na rodada`); viu.add(t) } casa.set(j.h, (casa.get(j.h) ?? 0) + 1); (vs.get(j.h) ?? vs.set(j.h, new Set()).get(j.h)!).add(j.a); (vs.get(j.a) ?? vs.set(j.a, new Set()).get(j.a)!).add(j.h) } }
  ok(e.every((_, i) => casa.get(i) === 4), `${nome}: todo mundo 4 em casa e 4 fora`)
  ok(e.every((_, i) => vs.get(i)?.size === 8), `${nome}: 8 adversários diferentes`)
  const tab = tabelaChampionsSala(m, 36, 8).map(l => l.t)
  ok(JSON.stringify(tab) === JSON.stringify(m.classificacao), `${nome}: classificação = tabela das 8 rodadas`)
  const po = m.ko[0]
  ok(m.ko.map(k => k.tipo).join() === 'playoff,oitavas,quartas,semi' && po.ties.length === 8 && m.ko[1].ties.length === 8, `${nome}: playoff (8) → oitavas (8) → quartas → semi`)
  const pos = new Map(m.classificacao.map((t, i) => [t, i + 1]))
  ok(po.ties.every(t => { const p = [pos.get(t.h)!, pos.get(t.a)!].sort((a, b) => a - b); return p[0] >= 9 && p[1] <= 24 && p[0] + p[1] === 33 }), `${nome}: playoff 9×24 … 16×17`)
  const cabecas = new Set(m.classificacao.slice(0, 8)), vencPo = new Set(po.ties.map(t => t.winner))
  ok(m.ko[1].ties.every(t => (cabecas.has(t.a) && vencPo.has(t.h))), `${nome}: oitavas = cabeça (manda a volta) × vencedor do playoff`)
  for (const f of m.ko) for (const t of f.ties) {
    if (pos.get(t.a)! > pos.get(t.h)!) ok(false, `${nome}: volta não foi na casa do melhor`)
    const agg = [t.ida.gh + t.volta.ga, t.ida.ga + t.volta.gh]
    if (agg[0] === agg[1] && !t.pen) ok(false, `${nome}: agregado empatado sem pênaltis`)
    if (agg[0] !== agg[1] && t.winner !== (agg[0] > agg[1] ? t.h : t.a)) ok(false, `${nome}: vencedor errado no agregado`)
  }
  ok(!m.ko[2].ties.some(t => [t.h, t.a].includes(m.classificacao[0]) && [t.h, t.a].includes(m.classificacao[1])) && !m.ko[3].ties.some(t => [t.h, t.a].includes(m.classificacao[0]) && [t.h, t.a].includes(m.classificacao[1])), `${nome}: 1º e 2º só podem se cruzar na final`)
  ok(m.final.winner === m.campeao && [m.final.h, m.final.a].includes(m.campeao) && (m.final.g[0] !== m.final.g[1] || !!m.final.pen), `${nome}: final única com campeão (${e[m.campeao].pais})`)
  ok(JSON.stringify(simulaChampionsSala(entrantesChampions(f, 'u0'), seed)) === JSON.stringify(m), `${nome}: mesma ficha + mesma semente = mesma copa`)
  // passos
  ok(jogosDoPassoCh(m, 8).length === 18 && jogosDoPassoCh(m, 9).length === 8 && jogosDoPassoCh(m, 16).length === 2 && jogosDoPassoCh(m, 17).length === 0 && jogosDoPassoCh(m, 18).length === 1, `${nome}: jogos por passo (liga 18 · playoff 8 · semi 2 · pausa 0 · final 1)`)
}
ok(CHS.P_RODADAS <= 16 && CHS.P_KO <= 4 && CHS.FIM === CHS.P_RODADAS + 2 + CHS.P_KO, 'cabe no relógio do banco (p_rodadas ≤ 16, p_ko ≤ 4)')
ok([9, 11, 13, 15, 18].every(chsComResumo) && ![10, 12, 14, 16, 17].some(chsComResumo) && faseIdxCh(9) === 0 && faseIdxCh(16) === 3 && ehVoltaCh(10) && !ehVoltaCh(11), 'passos de fase, ida e volta')
console.log(falhas ? `\n❌ ${falhas} falha(s) na Champions da sala` : '\n✅ Liga + Champions da sala: 36 clubes reais, fase de liga, playoff, ida e volta e final única')
if (falhas) process.exit(1)
