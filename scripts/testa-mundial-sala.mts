// 🌍 Trava da LIGA + SUPER MUNDIAL das salas (Diego 26/11) — `npm run mundial-sala`
// Confere o motor puro (`src/escalacao/mundial-sala.ts`) e as cartas SÓ do modo (`cartas-mundial-clubes.ts`):
//  · os 32 clubes do Mundial de 2025 fecham 11 com as PRÓPRIAS cartas;
//  · as cartas novas não repetem pessoa no MESMO baralho (Salzburg = Europa; o resto = Mundo), conferido contra data.ts,
//    as cartas de seleção extra e o Brasil Oficial (o Sundowns do Oficial é repetido IGUAL, e isso pode);
//  · força na régua de 02/11 por categoria;
//  · 8 grupos de 4, turno único, regra das confederações, 2 passam, chave das oitavas do Mundial de 2025, tudo em jogo único,
//    mesma semente = mesma copa, campeão definido;
//  · as copas que já rodam (Libertadores da sala e regionais) não ganham carta nova.
import {
  MUNDIAL_CLUBES, MUNDIAL_VAGAS, MUN, clubesMundial, confedDoClube, simulaMundialSala, tabelaDoGrupoMun, montaFichaMundial, entrantesMundial,
  jogosDoPassoMun, munRodaBola, artilhariaMundial, type LugarMundial, type PickMundial,
} from '../src/escalacao/mundial-sala'
import { clubeFechaTime, poolDoClube, COPAS_REGIONAIS } from '../src/escalacao/copa-regional'
import { LIBERTA_CLUBES } from '../src/escalacao/liberta-sala'
import { CARTAS_MUNDIAL_CLUBES } from '../src/escalacao/cartas-mundial-clubes'
import { CARTAS_SELECOES_EXTRA } from '../src/escalacao/cartas-selecoes-extra'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../src/escalacao/data'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial'
import { ESTRANGEIROS_LIBERTA_2026 } from '../src/escalacao/libertadores-oficial'
import { ESTRANGEIROS_SULA_2026 } from '../src/escalacao/sul-americana-oficial'
import { CLUBES_INTERCONTINENTAL } from '../src/escalacao/intercontinental-oficial'

let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('❌', msg) } }
type Carta = { name: string; club: string; year: number; fame?: number; lo?: number; hi?: number }
const chave = (c: Carta) => `${c.name}|${c.club}|${c.year}`
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim()

// 1) os 32 do Mundial, cada um fechando 11
ok(MUNDIAL_CLUBES.length === 32, `lista tem ${MUNDIAL_CLUBES.length} clubes (esperado 32)`)
ok(new Set(MUNDIAL_CLUBES.map(c => c.clube)).size === 32, 'clube repetido na lista')
for (const { clube } of MUNDIAL_CLUBES) ok(clubeFechaTime(clube), `${clube} não fecha um time de 11`)
ok(clubesMundial().length === 32, `só ${clubesMundial().length} clubes jogáveis`)
const conta = (c: string) => MUNDIAL_CLUBES.filter(x => x.confed === c).length
ok(conta('UEFA') === 12 && conta('CONMEBOL') === 6 && conta('AFC') === 4 && conta('CAF') === 4 && conta('CONCACAF') === 5 && conta('OFC') === 1, 'vagas por confederação diferentes do Mundial de 2025')

// 2) cartas novas: mesma pessoa não repete no MESMO baralho; régua de força
const deckDe = (clube: string) => clube === 'Salzburg' ? 'EU' : 'MUNDO'
const foraOficial = new Set([...[...ESTRANGEIROS_LIBERTA_2026, ...ESTRANGEIROS_SULA_2026].map((c: { nome: string }) => c.nome), ...CLUBES_INTERCONTINENTAL])
const base: Record<'EU' | 'MUNDO', Map<string, Carta[]>> = { EU: new Map(), MUNDO: new Map() }
const pus = (m: Map<string, Carta[]>, c: Carta) => { const k = norm(c.name); (m.get(k) ?? m.set(k, []).get(k)!).push(c) }
for (const l of Object.values(CATALOG_EU)) for (const c of l as Carta[]) pus(base.EU, c)
for (const l of Object.values(CATALOG_WORLD)) for (const c of l as Carta[]) pus(base.MUNDO, c)
for (const l of Object.values(CATALOG_OFICIAL)) for (const c of l as Carta[]) if (foraOficial.has(c.club)) pus(base.MUNDO, c)
const EUROPEUS_EXTRA = new Set(['Newcastle', 'Anderlecht', 'Celtic', 'Bologna', 'Espanyol', 'Deportivo La Coruña', 'Copenhagen', 'Estrela Vermelha', 'Nice', 'AZ Alkmaar', 'Everton', 'DAC Dunajská Streda'])
for (const c of CARTAS_SELECOES_EXTRA) pus(EUROPEUS_EXTRA.has(c.club) ? base.EU : base.MUNDO, c)
void CATALOG
const vistas = new Map<string, Carta>()
for (const c of CARTAS_MUNDIAL_CLUBES) {
  const k = norm(c.name) + '|' + deckDe(c.club)
  const ja = vistas.get(k)
  ok(!ja, `${c.name}: duas cartas no baralho ${deckDe(c.club)} (${ja?.club} e ${c.club})`)
  vistas.set(k, c)
  const outras = (base[deckDe(c.club)].get(norm(c.name)) ?? []).filter(b => chave(b) !== chave(c))
  ok(!outras.length, `${c.name} (${c.club} ${c.year}) já tem carta no baralho ${deckDe(c.club)}: ${outras.map(chave).join(', ')}`)
  const doOficial = (base.MUNDO.get(norm(c.name)) ?? []).some(b => chave(b) === chave(c))
  const faixa: Record<number, [number, number]> = { 1: [55, 66], 2: [62, 85], 3: [62, 79], 4: [77, 89], 5: [87, 99] }
  const [lo, hi] = faixa[c.fame] ?? [0, 0]
  ok(doOficial || (c.lo >= lo - 1 && c.hi <= hi && c.lo < c.hi), `${c.name}: força ${c.lo}-${c.hi} fora da régua da categoria ${c.fame}`)
  ok(MUNDIAL_CLUBES.some(m => m.clube === c.club), `${c.name}: clube ${c.club} não é do Mundial`)
}
// as cartas novas não entram em clube da Libertadores da sala nem de regional (nenhuma copa que já roda muda)
const jaRodam = new Set([...LIBERTA_CLUBES.map(c => c.clube), ...Object.values(COPAS_REGIONAIS).flatMap(r => r.lados.flatMap(l => l.clubes))])
for (const c of CARTAS_MUNDIAL_CLUBES) ok(!jaRodam.has(c.club), `${c.club} joga Liberta/regional e ganhou carta do Mundial`)
for (const clube of jaRodam) {
  const p = Object.values(poolDoClube(clube)).flat()
  ok(!p.some(x => CARTAS_SELECOES_EXTRA.some(e => chave(e) === chave(x)) && !CARTAS_MUNDIAL_CLUBES.length), `${clube}: carta de seleção extra entrou`)
}
ok(!Object.values(poolDoClube('Universitario')).flat().some(c => c.name === 'Alberto Quintero'), 'carta de seleção extra vazou pra Libertadores da sala')

// 3) uma liga de 20 (7 de gente) monta a ficha de 32 e o torneio fecha
const classif: LugarMundial[] = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Time ${i + 1}`, humano: i % 3 === 0 }))
const uidDe = new Map(classif.filter(c => c.humano).map(c => [c.id, `u${c.id}`]))
const picks = new Map<string, PickMundial>([
  ['u0', { pais: 'Auckland City', form: '4-3-3', xiKeys: [] }],
  ['u3', { pais: 'Fluminense', form: '4-4-2', xiKeys: [] }],
  ['u6', { pais: 'Auckland City', form: '4-3-3', xiKeys: [] }],
])
let campeoes = new Map<string, number>()
for (let seed = 1; seed <= 300; seed++) {
  const ficha = montaFichaMundial(classif, uidDe, picks, seed * 7919, 1)
  ok(ficha.times.length === 32, `seed ${seed}: ficha com ${ficha.times.length} times`)
  ok(new Set(ficha.times.map(t => t.pais)).size === 32, `seed ${seed}: clube repetido na ficha`)
  ok(ficha.times[0].pais === 'Auckland City' && ficha.times[3].pais === 'Fluminense', `seed ${seed}: a escolha de gente não foi respeitada`)
  ok(ficha.times[6].pais !== 'Auckland City', `seed ${seed}: dois times com o Auckland`)
  const ents = entrantesMundial(ficha, 'u0')
  for (const e of ents) {
    ok(e.xi.length === 11, `${e.pais}: XI com ${e.xi.length}`)
    const minhas = new Set(Object.values(poolDoClube(e.pais)).flat().map(chave))
    ok(e.xi.every(c => minhas.has(chave(c))), `${e.pais}: carta de fora do clube no XI`)
  }
  const m = simulaMundialSala(ents, ficha.seed)
  const m2 = simulaMundialSala(entrantesMundial(montaFichaMundial(classif, uidDe, picks, seed * 7919, 1), 'u0'), ficha.seed)
  ok(JSON.stringify(m) === JSON.stringify(m2), `seed ${seed}: mesma semente deu copa diferente`)
  ok(m.grupos.length === 8 && m.grupos.every(g => g.length === 4) && new Set(m.grupos.flat()).size === 32, `seed ${seed}: grupos tortos`)
  ok(m.rodadas.length === 3 && m.rodadas.every(r => r.length === 16), `seed ${seed}: rodadas tortas`)
  for (const g of m.grupos) {
    const conf = g.map(t => confedDoClube(ents[t].pais))
    const uefa = conf.filter(c => c === 'UEFA').length
    const outras = conf.filter(c => c !== 'UEFA')
    ok(uefa <= 2 && new Set(outras).size === outras.length, `seed ${seed}: grupo com confederação repetida (${g.map(t => ents[t].pais).join(', ')})`)
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const n = m.rodadas.flat().filter(x => (x.h === g[i] && x.a === g[j]) || (x.h === g[j] && x.a === g[i])).length
      ok(n === 1, `seed ${seed}: ${ents[g[i]].pais} × ${ents[g[j]].pais} jogaram ${n} vezes`)
    }
  }
  for (let gi = 0; gi < 8; gi++) { const t = tabelaDoGrupoMun(m, gi, 3); ok(m.classificados[gi][0] === t[0].t && m.classificados[gi][1] === t[1].t, `seed ${seed}: classificado errado no grupo ${gi}`) }
  const oit = m.ko[0].ties
  const esperado = [[0, 1], [2, 3], [4, 5], [6, 7], [1, 0], [3, 2], [5, 4], [7, 6]]
  oit.forEach((t, i) => ok(t.h === m.classificados[esperado[i][0]][0] && t.a === m.classificados[esperado[i][1]][1], `seed ${seed}: chave das oitavas ${i} fora do Mundial de 2025`))
  ok(m.ko.map(f => f.ties.length).join() === '8,4,2', `seed ${seed}: mata-mata torto`)
  for (const f of [...m.ko.flatMap(x => x.ties), m.final]) {
    ok(f.winner === f.h || f.winner === f.a, `seed ${seed}: vencedor estranho`)
    if (f.g[0] === f.g[1]) ok(!!f.pen && f.pen[0] !== f.pen[1], `seed ${seed}: empate sem pênaltis`)
    else ok(!f.pen && f.winner === (f.g[0] > f.g[1] ? f.h : f.a), `seed ${seed}: vencedor não bate com o placar`)
    ok(f.ev.filter(e => e.home).length === f.g[0] && f.ev.filter(e => !e.home).length === f.g[1], `seed ${seed}: gols da súmula não batem com o placar`)
  }
  ok(m.ko[1].ties.every((t, i) => t.h === m.ko[0].ties[2 * i].winner && t.a === m.ko[0].ties[2 * i + 1].winner), `seed ${seed}: quartas não seguem a chave`)
  ok(m.campeao === m.final.winner, `seed ${seed}: campeão diferente do vencedor da final`)
  ok(jogosDoPassoMun(m, 1).length === 16 && jogosDoPassoMun(m, MUN.OITAVAS).length === 8 && jogosDoPassoMun(m, MUN.FINAL).length === 1 && jogosDoPassoMun(m, MUN.PAUSA).length === 0, `seed ${seed}: jogos por passo errados`)
  ok(artilhariaMundial(m).length > 0, `seed ${seed}: copa sem gol`)
  campeoes.set(ents[m.campeao].pais, (campeoes.get(ents[m.campeao].pais) ?? 0) + 1)
}
// 4) os passos batem com o relógio do banco: p_rodadas 6 + parado + 1 de final + fim
ok(MUN.FIM === MUN.P_RODADAS + 2 + MUN.P_KO, 'passos não batem com o esc_regional_clock')
ok([1, 2, 3, 4, 5, 6, 8].every(munRodaBola) && ![0, 7, 9].some(munRodaBola), 'munRodaBola errado')

const top = [...campeoes].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => `${c} ${n}`).join(' · ')
console.log(`🏆 campeões em 300 copas: ${top}`)
console.log(falhas ? `❌ ${falhas} falha(s) no Super Mundial da sala` : '✅ Super Mundial da sala: 32 clubes reais, cartas sem pessoa repetida no baralho, grupos com a regra das confederações, chave de 2025 e tudo em jogo único')
if (falhas) process.exit(1)
