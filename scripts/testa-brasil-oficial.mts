// 🇧🇷 trava do Brasil Oficial (base pura): clubes, escudos e o sorteio dos 22.
import { CATALOG } from '../src/escalacao/data.ts'
import { ESCUDOS_OFICIAIS } from '../src/escalacao/escudos-oficiais.ts'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
import { CATALOG_OFICIAL_MODO } from '../src/escalacao/baralho-oficial.ts'
import { CLUBES_BR, CLUBES_BR_OUTROS, CLUBES_BR_TODOS, cartasDoClube, sorteiaElenco, fechaTime, clubesDaDivisao } from '../src/escalacao/brasil-oficial.ts'
import { existsSync, readFileSync } from 'node:fs'
let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
if (clubesDaDivisao('A').length !== 20) falha('Série A precisa de 20')
if (clubesDaDivisao('B').length !== 20) falha('Série B precisa de 20')
if (clubesDaDivisao('C').length !== 20) falha('Série C precisa de 20')
if (new Set(CLUBES_BR.map(c => c.nome)).size !== CLUBES_BR.length) falha('clube repetido')
for (const c of CLUBES_BR) if (!(ESCUDOS_OFICIAIS as Record<string, unknown>)[c.nome]) falha(`sem escudo oficial: ${c.nome}`)
// sorteio: mesma semente = mesmo elenco; 22 sem repetir; sobra + elenco = todas
const fla = CLUBES_BR.find(c => c.nome === 'Flamengo')!
const todas = cartasDoClube(fla, CATALOG)
const a = sorteiaElenco(todas, 42), b = sorteiaElenco(todas, 42), d = sorteiaElenco(todas, 43)
if (a.elenco.length !== 22) falha('Flamengo: elenco ≠ 22')
if (a.elenco.length + a.sobra.length !== todas.length) falha('Flamengo: carta sumiu no sorteio')
if (new Set(a.elenco).size !== 22) falha('Flamengo: carta repetida no elenco')
if (a.elenco.map(x => x.carta.name).join() !== b.elenco.map(x => x.carta.name).join()) falha('mesma semente deu elenco diferente')
if (a.elenco.map(x => x.carta.name).join() === d.elenco.map(x => x.carta.name).join()) falha('semente diferente deu o mesmo elenco')
if (!fechaTime(a.elenco)) falha('Flamengo: os 22 sorteados não fecham um 11')
// 🇧🇷 com as cartas do modo (CATALOG + CATALOG_OFICIAL), TODO clube fecha um 11
const juntas = Object.fromEntries((Object.keys(CATALOG) as (keyof typeof CATALOG)[]).map(p => [p, [...CATALOG[p], ...CATALOG_OFICIAL_MODO[p]]])) as typeof CATALOG
for (const c of CLUBES_BR) if (!fechaTime(cartasDoClube(c, juntas))) falha(`não fecha um 11: ${c.nome}`)
// 🇧🇷 os 168 de fora de A/B/C (Série D 96 em 16 grupos de 6 + estaduais/Copa)
if (CLUBES_BR_OUTROS.length !== 168) falha(`lista mestra: ${CLUBES_BR_OUTROS.length} clubes fora de A/B/C (devia 168)`)
if (clubesDaDivisao('D').length !== 96) falha(`Série D com ${clubesDaDivisao('D').length} (devia 96)`)
{ const g: Record<string, number> = {}; for (const c of clubesDaDivisao('D')) g[c.grupoD!] = (g[c.grupoD!] ?? 0) + 1
  if (Object.keys(g).length !== 16 || Object.values(g).some(n => n !== 6)) falha(`grupos da Série D errados: ${JSON.stringify(g)}`) }
if (new Set(CLUBES_BR_TODOS.map(c => c.nome)).size !== CLUBES_BR_TODOS.length) falha('clube repetido entre A/B/C e o resto')
// todo clube que já tem lote de pesquisa fecha um 11 (os lotes que ainda faltam ficam de fora até chegarem)
const lotes = ['al-rn-ro', 'ba-se', 'df-es-to', 'go-ms', 'ma-rr', 'mg-sp', 'mt', 'pa', 'pb-pe', 'pr-sc', 'rj-rs', 'norte1', 'ce-pi']
const comLote = new Set<string>()
for (const l of lotes) { const f = `docs/brasil-oficial/cartas-d-${l}.md`; if (existsSync(f)) for (const m of readFileSync(f, 'utf8').matchAll(/^## (.+)$/gm)) comLote.add(m[1].trim()) }
const semCarta: string[] = []
for (const c of CLUBES_BR_OUTROS) { if (!fechaTime(cartasDoClube(c, juntas))) (comLote.has(c.nome) ? falha(`não fecha um 11: ${c.nome}`) : semCarta.push(c.nome)) }
if (semCarta.length) console.log(`⏳ ${semCarta.length} clubes ainda esperando lote de cartas: ${semCarta.join(', ')}`)
// toda carta do modo é de um clube do modo
const nomes = new Set(CLUBES_BR_TODOS.flatMap(c => [c.nome, ...(c.apelidos ?? [])]))
for (const l of Object.values(CATALOG_OFICIAL)) for (const x of l) if (!nomes.has(x.club)) falha(`carta de clube fora do modo: ${x.name} (${x.club})`)
// mesmo nome+clube+ano não pode existir nos dois baralhos
const ja = new Set(Object.values(CATALOG).flat().map(x => `${x.name}|${x.club}|${x.year}`))
for (const l of Object.values(CATALOG_OFICIAL)) for (const x of l) if (ja.has(`${x.name}|${x.club}|${x.year}`)) falha(`carta já existe no baralho: ${x.name} ${x.club} ${x.year}`)
if (erros) { console.log(`❌ brasil-oficial: ${erros} erro(s)`); process.exit(1) }
console.log(`✅ brasil-oficial: 60 clubes com escudo, ${CLUBES_BR_OUTROS.length - semCarta.length}/168 de D/estaduais fechando um 11, sorteio dos 22 estável e sem perder carta`)

// ── 🇧🇷 a carreira nasce com o clube real (reducer) ──
{
  // (via vite, igual ao `npm run troca`: o store e a tela da temporada precisam do import.meta.env do vite)
  const { createServer } = await import('vite')
  const vite = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'silent' })
  const { reducer, INITIAL } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const { _forcaBrasilOficialParaTeste } = await vite.ssrLoadModule('/src/escalacao/sport.ts')
  const { seedCpuSquadsOficial } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const base = { type: 'START_CAREER_SOLO', teamName: 'Remo', formation: '4-3-3', rivals: 5, league: 'both', oficial: { clube: 'Remo' } } as const
  // sem acesso: carreira de sempre (o oficial é ignorado)
  const semAcesso = reducer(INITIAL, base as never)
  if (semAcesso.oficial) falha('sem acesso o oficial não pode ligar')
  _forcaBrasilOficialParaTeste(true)
  // 🇧🇷 cartas do modo ainda não baixadas: começar NÃO faz nada (a tela espera), e a ficha de save oficial não é tocada
  const carga = await vite.ssrLoadModule('/src/escalacao/baralho-oficial-carga.ts')
  const { __sincronizaNiveis } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  if (carga.baralhoOficial()) falha('o baralho do modo já veio carregado (devia ser um pedaço separado)')
  if (reducer(INITIAL, base as never) !== INITIAL) falha('começou carreira oficial sem as cartas baixadas')
  // xará de verdade: o baralho de sempre tem UM Ronaldo (Cruzeiro 1993) — a ficha antiga mandava o do Atlético-GO 2023 pra lá
  const romulo = { name: 'Ronaldo', club: 'Atlético-GO', year: 2023, fame: 1, lo: 55, hi: 66, pos: 'ATA', id: 'x' }
  const saveOf = { ...INITIAL, careerOnline: true, oficial: { clube: 'Remo', desde: 1 }, managers: [{ id: 0, squad: [{ ...romulo }] }] }
  const antes = __sincronizaNiveis(saveOf).managers[0].squad[0]
  if (antes.club !== 'Atlético-GO') falha(`ficha sem o baralho mexeu na carta do modo: Ronaldo foi pro ${antes.club}`)
  await carga.carregaBaralhoOficial()
  const depois = __sincronizaNiveis({ ...saveOf, managers: [{ id: 0, squad: [{ ...romulo }] }] }).managers[0].squad[0]
  if (depois.club !== 'Atlético-GO' || depois.year !== 2023 || depois.fame === 5) falha(`ficha com o baralho trocou a carta do modo de clube: ${depois.club} ${depois.year}`)
  const s = reducer(INITIAL, base as never)
  if (!s.oficial || s.oficial.clube !== 'Remo') falha('não marcou a carreira como oficial')
  if (s.screen !== 'season') falha(`devia começar na temporada (sem leilão de estreia), está em ${s.screen}`)
  if (s.managers.length !== 20) falha(`a divisão do Remo devia ter 20 clubes, tem ${s.managers.length}`)
  if (s.managers[0].teamName !== 'Remo' || !s.managers[0].isHuman) falha('o assento 0 tem que ser o Remo do usuário')
  const nomesA = new Set(clubesDaDivisao('A').map(c => c.nome))
  if (!s.managers.every(m => nomesA.has(m.teamName))) falha('time fora da Série A real na divisão do Remo')
  for (const m of s.managers) if (!fechaTime(m.squad)) falha(`${m.teamName} não fecha um 11`)
  const ids = s.managers.flatMap(m => m.squad.map(c => `${c.name}|${c.club}|${c.year}`))
  if (new Set(ids).size !== ids.length) falha('a mesma carta em dois clubes')
  if (s.careerDivision !== 'A') falha('divisão do usuário errada')
  for (const d of ['B', 'C'] as const) for (const c of clubesDaDivisao(d)) if (s.careerPlacements?.[c.nome] !== d) falha(`${c.nome} devia estar na Série ${d}`)
  for (const d of ['A', 'B', 'C', 'D']) { const n = Object.values(s.careerPlacements ?? {}).filter(v => v === d).length, tam = d === 'D' ? 96 : 20; if (n !== tam) falha(`Série ${d} com ${n} clubes (devia ${tam})`) }
  const fundo = seedCpuSquadsOficial(s)
  // 🇧🇷 a pirâmide MONTADA (o que a tela simula) só tem clube real: A/B/C = as séries reais de 2026, D = clubes reais da D
  const { buildPyramid } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const BO = await vite.ssrLoadModule('/src/escalacao/brasil-oficial.ts')
  const mundo = buildPyramid(s.managers, 0, s.seed, s.deckLeague, s.careerPlacements, fundo, true)
  for (const d of ['A', 'B', 'C', 'D'] as const) {
    const tam = d === 'D' ? 96 : 20
    if (mundo[d].length !== tam) falha(`pirâmide: Série ${d} com ${mundo[d].length} times (devia ${tam})`)
    const falsos = mundo[d].filter((t: { name: string }) => !BO.clubeOficial(t.name))
    if (falsos.length) falha(`pirâmide: Série ${d} com clube que não é real: ${falsos.slice(0, 4).map((t: { name: string }) => t.name).join(', ')}`)
    if (d !== 'D') { const esperado = new Set(BO.clubesDaDivisao(d).map((c: { nome: string }) => c.nome)); const fora = mundo[d].filter((t: { name: string }) => !esperado.has(t.name)); if (fora.length) falha(`pirâmide: Série ${d} com clube de outra série: ${fora.map((t: { name: string }) => t.name).join(', ')}`) }
    else if (mundo.D.some((t: { name: string }) => BO.clubeOficial(t.name)?.div !== 'D')) falha('pirâmide: Série D com clube que não é da D real')
  }
  for (const t of Object.values(mundo).flat() as { name: string; xi: unknown[] }[]) if (t.xi.length !== 11) falha(`pirâmide: ${t.name} não escala 11`)
  // 🇧🇷 a temporada no formato real fecha: B com playoff (4 sobem), C em fases (4 sobem, 2 caem), D com 96 (6 sobem)
  const { simulaTemporadaOficial } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const fimTudo = simulaTemporadaOficial(mundo, s.seed, 38, 2026), fim = fimTudo.oficial
  if (fim.B.sobem?.length !== 4) falha(`temporada: B com ${fim.B.sobem?.length} acessos`)
  if (fim.C.sobem?.length !== 4 || fim.C.caem?.length !== 2 || !fim.C.campeao) falha(`temporada: C sobem ${fim.C.sobem} caem ${fim.C.caem} campeão ${fim.C.campeao}`)
  if (fim.D.sobem?.length !== 6 || new Set(fim.D.sobem).size !== 6 || !fim.D.campeao) falha(`temporada: D sobem ${fim.D.sobem}`)
  const meio = simulaTemporadaOficial(mundo, s.seed, 20, 2026)
  if (meio.oficial.C.campeao || meio.oficial.D.campeao || meio.oficial.B.playoff) falha('temporada: campeão/playoff aparecendo no meio da temporada (spoiler)')
  if (JSON.stringify(simulaTemporadaOficial(mundo, s.seed, 38, 2026).oficial) !== JSON.stringify(fim)) falha('temporada: mesma semente deu temporada diferente')
  // 🟫 começar na SÉRIE D: carreira oficial (não cai na carreira de sempre), 96 na D, você no seu grupo, o grupo inteiro na sua turma
  {
    const d = reducer(INITIAL, { ...base, teamName: 'Galvez', oficial: { clube: 'Galvez' } } as never)
    if (!d.oficial || d.oficial.clube !== 'Galvez') falha('Série D: começou sem ser Brasil Oficial (caiu na carreira de sempre)')
    else {
      if (d.careerDivision !== 'D') falha(`Série D: divisão ${d.careerDivision}`)
      if (d.managers.length !== 20 || d.managers[0].teamName !== 'Galvez') falha('Série D: turma errada')
      const nD = Object.values(d.careerPlacements ?? {}).filter(v => v === 'D').length
      if (nD !== 96) falha(`Série D: ${nD} clubes (devia 96)`)
      const grupo = BO.clubesDaDivisao('D').filter((c: { grupoD?: string }) => c.grupoD === BO.clubeOficial('Galvez').grupoD).map((c: { nome: string }) => c.nome)
      if (!grupo.every((n: string) => d.managers.some((m: { teamName: string }) => m.teamName === n))) falha('Série D: o seu grupo não está inteiro na sua turma')
      const fd = seedCpuSquadsOficial(d)
      const md = buildPyramid(d.managers, 0, d.seed, d.deckLeague, d.careerPlacements, fd, true)
      if (md.D.length !== 96 || !md.D.some((t: { you: boolean }) => t.you)) falha(`Série D: pirâmide com ${md.D.length} na D`)
      const nomes = md.D.map((t: { name: string }) => t.name)
      if (new Set(nomes).size !== 96) falha('Série D: clube repetido na D')
      const tempD = simulaTemporadaOficial(md, d.seed, 38, 2026).oficial
      if (!tempD.agenda.some((x: { casa: string; fora: string }) => x.casa === 'Galvez' || x.fora === 'Galvez')) falha('Série D: o seu clube sem jogo na agenda')
    }
  }
  // 🇧🇷 playoff da B NA TELA (`computePlayoffB`): 3º×6º e 4º×5º, ida na casa do pior, empate no agregado = melhor campanha, sem
  // pênalti; mesma semente = mesmo playoff; e o 1º e o 2º nunca jogam
  {
    const { computePlayoffB, PLAYOFF_B } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const tb = fimTudo.tables.B
    for (let k = 0; k < 40; k++) {
      const po = computePlayoffB(tb, s.seed + k, 1)
      if (!po || po.name !== PLAYOFF_B || po.ties.length !== 2) { falha('playoff B: não montou os 2 confrontos'); break }
      const [x, y] = po.ties
      if (x.a.name !== tb[5].name || x.b.name !== tb[2].name || y.a.name !== tb[4].name || y.b.name !== tb[3].name) falha('playoff B: confrontos fora de 3º×6º e 4º×5º')
      for (const t of po.ties) {
        if (t.pens) falha('playoff B: teve pênalti (o regulamento não tem)')
        if (t.legs.length !== 2) falha('playoff B: não é ida e volta')
        if (t.aggA !== t.legs[0][0] + t.legs[1][0] || t.aggB !== t.legs[0][1] + t.legs[1][1]) falha('playoff B: agregado não bate com os jogos')
        const esperado = t.aggA > t.aggB ? 'a' : 'b'
        if (t.win !== esperado) falha(`playoff B: vencedor errado (${t.aggA}×${t.aggB} deu ${t.win})`)
      }
      if (JSON.stringify(computePlayoffB(tb, s.seed + k, 1)) !== JSON.stringify(po)) falha('playoff B: mesma semente, playoff diferente')
    }
  }
  // 🔁 três temporadas seguidas: as séries chegam no TAMANHO REAL de cada ano (2027: C 24 · 2028: C 28 · D sempre 96)
  {
    const { promocoesOficial } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const semDiv = BO.CLUBES_BR_OUTROS.filter((c: { div: string }) => c.div === 'E').map((c: { nome: string }) => c.nome)
    let pl = s.careerPlacements as Record<string, string>, m = mundo, campeoes: string[] = []
    for (const ano of [2026, 2027, 2028]) {
      const res = simulaTemporadaOficial(m, s.seed + ano, 38, ano)
      campeoes.push(`${ano}: C ${res.oficial.C.campeao} · D ${res.oficial.D.campeao}`)
      pl = promocoesOficial(res.tables, res.oficial, s.seed, semDiv)
      const prox = ano + 1
      const tam = { A: 20, B: 20, C: prox === 2027 ? 24 : 28, D: 96 } as Record<string, number>
      for (const d of ['A', 'B', 'C', 'D']) { const n = Object.values(pl).filter(v => v === d).length; if (n !== tam[d]) falha(`${prox}: Série ${d} com ${n} clubes (devia ${tam[d]})`) }
      const fundo2 = seedCpuSquadsOficial({ managers: s.managers, seed: s.seed, careerPlacements: pl })
      m = buildPyramid(s.managers, 0, s.seed, s.deckLeague, pl, fundo2, true)
      for (const d of ['A', 'B', 'C', 'D'] as const) if (m[d].length !== tam[d]) falha(`${prox}: pirâmide montada com Série ${d} de ${m[d].length}`)
      const falsos = Object.values(m).flat().filter((t: { name: string; teamId: number }) => t.teamId < 0 && !BO.clubeOficial(t.name))
      if (falsos.length) falha(`${prox}: clube que não é real na pirâmide: ${falsos.slice(0, 3).map((t: { name: string }) => t.name)}`)
    }
    console.log('   ' + campeoes.join(' | '))
  }
  for (const c of [...clubesDaDivisao('B'), ...clubesDaDivisao('C')]) if (!fundo[c.nome] || !fechaTime(fundo[c.nome])) falha(`fundo: ${c.nome} sem elenco que feche um 11`)
  const todos = [...ids, ...Object.values(fundo).flat().filter(c => c.club !== 'Várzea').map(c => `${c.name}|${c.club}|${c.year}`)]
  const rep = todos.filter((k, i) => todos.indexOf(k) !== i)
  if (rep.length) falha(`carta repetida entre clubes: ${rep.slice(0, 5).join(', ')}`)
  // a carreira de time criado continua sem as cartas do modo
  const criada = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: 'Meu Time', formation: '4-3-3', rivals: 5, league: 'both' } as never)
  if (criada.oficial) falha('carreira criada marcada como oficial')
  const doModo = new Set(Object.values(CATALOG_OFICIAL_MODO).flat().map(x => `${x.name}|${x.club}|${x.year}`))
  if (criada.managers.some(m => m.squad.some(c => doModo.has(`${c.name}|${c.club}|${c.year}`)))) falha('carta do Brasil Oficial vazou pra carreira criada')
  _forcaBrasilOficialParaTeste(false)
  await vite.close()
  if (erros) { console.log(`❌ brasil-oficial: ${erros} erro(s)`); process.exit(1) }
  console.log('✅ brasil-oficial: carreira nasce com o clube real, 20 da divisão real, elencos sem repetir, fundo real, sem vazar pra carreira criada')
}
