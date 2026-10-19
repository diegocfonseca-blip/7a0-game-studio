// 🏀🧱 trava do LEILÃO DE CLUBES NO BASQUETE (19/10, Diego: "quero da NBA"): roda partidas do BidLegends no motor de
// verdade (reducer — o mesmo que a sala online roda no aparelho do dono) com Clubes + pregão aberto e confere:
//   · todo pacote é UMA posição de UMA franquia da NBA ("Armadores dos Lakers"), só com cartas da NBA daquela posição
//   · tem pacote pra todo mundo em cada posição (de 4 a 20 times)
//   · depois do pregão vem a convocação; fechada, todo time tem o quinteto (1 por posição), sem jogador de futebol,
//     sem jogador repetido em dois times, ninguém negativo
//   npx tsx scripts/testa-clubes-nba.mts
import assert from 'node:assert/strict'
import { reducer, paPodeLancar, paMinimo, PA_TICK_MS } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { SECTORS } from '../src/escalacao/types'
import { CATALOG_NBA } from '../src/escalacao/data-basquete'
import { NBA_POS_ORDER } from '../src/escalacao/basquete-deck'

const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const avanca = (ms: number) => { nowRef.t += ms }
// carta da NBA por setor do motor (GOL..ATA = PG..C)
const NBA_DO_SETOR = new Map(SECTORS.map((s, i) => [s, new Set(CATALOG_NBA[NBA_POS_ORDER[i]].map(c => `${c.name}|${c.club}|${c.year}`))]))
const ehNba = (c: { name: string; club: string; year: number; pos: string }) => NBA_DO_SETOR.get(c.pos as never)?.has(`${c.name}|${c.club}|${c.year}`) ?? false

for (const rivals of [3, 9, 15, 19]) {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_NBA', teamName: 'Tijoleiros', rivals, clubes: true, pregaoAberto: true } as never)
  assert.equal(s.leilaoClubes, true, 'clubes ligado')
  assert.equal(s.phase, 'pregao')
  const n = s.managers.filter(m => m.isHuman || m.auctionRival).length
  for (const pac of s.pa!.fila) {
    assert.ok(pac.pacote, 'a fila é de pacotes')
    const cartas = pac.pacote!.cartas
    assert.ok(cartas.length >= 1, `pacote ${pac.name} tem gente`)
    for (const c of cartas) {
      assert.equal(c.pos, pac.pos, 'toda carta é da posição do pacote')
      assert.ok(ehNba(c), `${c.name} (${c.club}) é carta da NBA dessa posição`)
    }
    assert.equal(new Set(cartas.map(c => c.club)).size, 1, `pacote ${pac.name} é de UMA franquia`)
  }
  let minPorPos = 99
  for (const pos of SECTORS) minPorPos = Math.min(minPorPos, s.pa!.fila.filter(x => x.pos === pos).length)
  assert.ok(minPorPos >= n, `pacote pra todo mundo em cada posição (${minPorPos} pra ${n})`)
  let ticks = 0
  while (s.screen === 'auction' && ticks++ < 60000) {
    avanca(PA_TICK_MS)
    const you = s.managers[s.youIdx]
    if (ticks % 19 === 0 && s.currentCards[0] && paPodeLancar(s, you.id, paMinimo(s, 0), undefined, 0)) s = reducer(s, { type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: paMinimo(s, 0), mesa: 0 } as never)
    s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as never)
  }
  assert.equal(s.screen, 'convocacao', `depois do pregão vem a convocação (tela: ${s.screen})`)
  const you = s.managers[s.youIdx]
  // o humano convoca o 1º de cada pacote que levou
  const escolhas = (you.squad as { pacote?: { cartas: { id: string }[] } }[]).filter(c => c.pacote).map(c => c.pacote!.cartas[0].id)
  s = reducer(s, { type: 'CONVOCAR_CLUBES', mgrId: you.id, cartas: escolhas } as never)
  assert.notEqual(s.screen, 'convocacao', 'fechou a convocação')
  const vistos = new Map<string, string>()
  let tapa = 0
  for (const m of s.managers) {
    assert.ok(m.money >= 0, `${m.teamName} não ficou negativo (${m.money})`)
    assert.ok(!m.squad.some(c => (c as { pacote?: unknown }).pacote), `${m.teamName} não ficou com pacote fechado`)
    for (const pos of SECTORS) assert.equal(m.squad.filter(c => c.pos === pos).length, 1, `${m.teamName}: 1 em ${pos}`)
    for (const c of m.squad) {
      const k = `${c.name}|${c.club}|${c.year}`
      if (!ehNba(c)) { assert.ok(c.club === 'Pickup' || (c as { fake?: boolean }).fake, `${m.teamName}: ${c.name} (${c.club}) não é da NBA`); tapa++; continue }
      assert.ok(!vistos.has(k), `${c.name} está em dois times (${vistos.get(k)} e ${m.teamName})`)
      vistos.set(k, m.teamName)
    }
  }
  console.log(`ok - ${n} times: ${s.pa === undefined ? '' : ''}menor posição com ${minPorPos} pacotes · todos com quinteto da NBA · ${tapa} vaga(s) de tapa-buraco`)
}
console.log('TUDO OK')
process.exit(0)
