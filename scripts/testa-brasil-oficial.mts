// 🇧🇷 trava do Brasil Oficial (base pura): clubes, escudos e o sorteio dos 22.
import { CATALOG } from '../src/escalacao/data.ts'
import { CLUBES_INTERCONTINENTAL } from '../src/escalacao/intercontinental-oficial.ts'
import { ESCUDOS_OFICIAIS } from '../src/escalacao/escudos-oficiais.ts'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
import { CATALOG_OFICIAL_MODO } from '../src/escalacao/baralho-oficial.ts'
import { CLUBES_BR, CLUBES_BR_OUTROS, CLUBES_BR_TODOS, cartasDoClube, sorteiaElenco, fechaTime, clubesDaDivisao } from '../src/escalacao/brasil-oficial.ts'
import { existsSync, readFileSync } from 'node:fs'
import { ESTRANGEIROS_LIBERTA_2026 } from '../src/escalacao/libertadores-oficial.ts'
import { ESTRANGEIROS_SULA_2026 } from '../src/escalacao/sul-americana-oficial.ts'
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
// (ou um estrangeiro da Libertadores — as cartas dele só existem pra ela)
const nomes = new Set([...CLUBES_BR_TODOS.flatMap(c => [c.nome, ...(c.apelidos ?? [])]), ...ESTRANGEIROS_LIBERTA_2026.map(e => e.nome), ...ESTRANGEIROS_SULA_2026.map(e => e.nome), ...CLUBES_INTERCONTINENTAL])
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
  const { reducer, INITIAL, categoriaOficialOk } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
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
  // 🔨 18/11 (Diego): começa com o LEILÃO DE ABERTURA — 1 vaga por posição pra todos os 20 clubes da série
  if (s.screen !== 'auction' && s.screen !== 'season') falha(`devia abrir o leilão de abertura, está em ${s.screen}`)
  if (s.screen === 'auction') {
    if (!s.oficialAbertura) falha('leilão de abertura sem a marca oficialAbertura')
    for (const m of s.managers) for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const)
      if ((m.aberturaBase?.[p] ?? -1) !== m.squad.filter(c => c.pos === p).length) falha(`${m.teamName}: base da abertura errada em ${p}`)
    const dono = new Set(s.managers.flatMap(m => m.squad.map(c => `${c.name}|${c.club}|${c.year}`)))
    for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const) for (const c of s.deck[p]) if (!categoriaOficialOk(s.careerDivision ?? 'D', c)) falha(`categoria fora da série ${s.careerDivision} no leilão de abertura: ${c.name} (fame ${c.fame}${c.promessa ? ' promessa' : ''})`)
    for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const) for (const c of s.deck[p]) if (dono.has(`${c.name}|${c.club}|${c.year}`)) falha(`carta com dono no leilão de abertura: ${c.name}`)
  }
  if (s.managers.length !== 20) falha(`a divisão do Remo devia ter 20 clubes, tem ${s.managers.length}`)
  // 🏋️ 18/11: no Oficial o bot também tem PREPARADOR e paga do caixa (semeiaTecnicos via ALICIAR_SEED, rodada 0)
  {
    const s2 = reducer(s, { type: 'ALICIAR_SEED' } as never)
    const comPrep = s2.managers.filter((m: { isHuman: boolean; teamName: string }) => !m.isHuman && s2.careerPreparador?.[m.teamName])
    if (!comPrep.length) falha('nenhum bot comprou preparador no Oficial')
    for (const m of comPrep) {
      if (s2.careerPreparadorContrato?.[m.teamName] == null) falha(`${m.teamName}: preparador sem contrato`)
      const antes = s.clubCash?.['m' + m.id] ?? Math.round(m.money ?? 0), depois = s2.clubCash?.['m' + m.id] ?? 0
      if (!(depois < antes)) falha(`${m.teamName}: comprou preparador e não pagou (${antes} → ${depois})`)
    }
  }
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
  // 🏟️ o ESTADUAL do usuário vira as páginas da esteira (Remo → Parazão): toda página é do estadual, o Remo joga, todo time existe,
  // mesma semente = mesmo estadual, e o campeão das páginas é o do resultado
  {
    const { computeEstadualCarreira, ehPaginaEstadual } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const e1 = computeEstadualCarreira('Paraense', mundo, s.seed, 1)
    if (!e1 || !e1.rounds.length) falha('estadual: não montou as páginas do Parazão')
    else {
      if (!e1.rounds.every((r: { name: string }) => ehPaginaEstadual(r.name))) falha('estadual: página sem a marca do estadual')
      const jogosRemo = e1.rounds.flatMap((r: { ties: { a: { name: string; you: boolean }; b: { name: string; you: boolean } }[] }) => r.ties).filter((t: { a: { name: string }; b: { name: string } }) => t.a.name === 'Remo' || t.b.name === 'Remo')
      if (jogosRemo.length < 6) falha(`estadual: o Remo jogou só ${jogosRemo.length} jogos`)
      if (!jogosRemo.some((t: { a: { you: boolean }; b: { you: boolean } }) => t.a.you || t.b.you)) falha('estadual: o Remo do usuário não está marcado como "você"')
      const nomesP = new Set(e1.rounds.flatMap((r: { ties: { a: { name: string }; b: { name: string } }[] }) => r.ties.flatMap(t => [t.a.name, t.b.name])))
      if (nomesP.size !== 12) falha(`estadual: Parazão com ${nomesP.size} clubes`)
      for (const r of e1.rounds) for (const t of r.ties) if (t.a.xi.length !== 11 || t.b.xi.length !== 11) falha(`estadual: ${t.a.name} × ${t.b.name} sem 11 em campo`)
      if (JSON.stringify(computeEstadualCarreira('Paraense', mundo, s.seed, 1)?.resultado) !== JSON.stringify(e1.resultado)) falha('estadual: mesma semente, estadual diferente')
      const fin = e1.rounds[e1.rounds.length - 1].ties[0]
      if ((fin.win === 'a' ? fin.a.name : fin.b.name) !== e1.resultado.campeao) falha('estadual: o vencedor da última página não é o campeão')
    }
  }
  // 🇧🇷 COPA DO BRASIL REAL: 2026 = 28 na 1ª, 74 na 2ª, 4 na 3ª, 20 da Série A na 5ª; 126 clubes diferentes; 9 fases (1ª…Final);
  // 1ª a 4ª jogo único, 5ª a semis ida e volta, final jogo único; tem campeão
  {
    const { entradasCopaBrasilOficial } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const { computeCopaBrasil } = await vite.ssrLoadModule('/src/escalacao/copa-brasil.ts')
    const ent = entradasCopaBrasilOficial(mundo, s.seed)
    const tam = ent?.map((f: unknown[]) => f.length).join(',')
    if (tam !== '28,74,4,0,20') falha(`Copa do Brasil: entradas por fase ${tam} (devia 28,74,4,0,20)`)
    const nomesCB = new Set(ent?.flat().map((e: { t: { name: string } }) => e.t.name))
    if (nomesCB.size !== 126) falha(`Copa do Brasil: ${nomesCB.size} clubes diferentes (devia 126)`)
    const cb = computeCopaBrasil(mundo, s.seed, 1, 1.2, false, {}, false, undefined, ent)
    const fasesCB = [cb.round64, ...cb.rounds].filter(Boolean)
    if (fasesCB.map((f: { name: string }) => f.name).join('|') !== '1ª fase|2ª fase|3ª fase|4ª fase|5ª fase|Oitavas|Quartas|Semifinal|Final') falha(`Copa do Brasil: fases ${fasesCB.map((f: { name: string }) => f.name)}`)
    const pernas = fasesCB.map((f: { ties: { legs: unknown[] }[] }) => f.ties[0].legs.length).join('')
    if (pernas !== '111122221') falha(`Copa do Brasil: jogos por fase ${pernas}`)
    if (!cb.champion) falha('Copa do Brasil: sem campeão')
    const ent2 = entradasCopaBrasilOficial(mundo, s.seed + 1)
    if (ent2?.map((f: unknown[]) => f.length).join(',') !== '28,74,4,0,20') falha('Copa do Brasil: entradas mudam com a semente')
    // 🇧🇷 17/11: 2027+ = do jeito de 2026 (Série A na 5ª · campeões da C/D + 2 vagas regionais na 3ª · 102 pela cota de cada estado)
    const { computeEstadualCarreira } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const { CLUBES_MESTRA } = await vite.ssrLoadModule('/src/escalacao/brasil-oficial-clubes.ts')
    const { clubeOficial } = await vite.ssrLoadModule('/src/escalacao/brasil-oficial.ts')
    const cls = (est: string) => computeEstadualCarreira(est, mundo, s.seed, 2)?.resultado.classificacao ?? null
    const campC = mundo.C?.[0]?.name, campD = mundo.D?.[0]?.name
    const e27 = entradasCopaBrasilOficial(mundo, s.seed, { seasonNo: 2, prev: { campeaoC: campC, campeaoD: campD }, classificacao: cls })
    const t27 = e27?.map((f: unknown[]) => f.length).join(',')
    if (t27 !== '28,74,4,0,20') falha(`Copa do Brasil 2027: entradas por fase ${t27} (devia 28,74,4,0,20)`)
    const n27 = e27?.flat().map((e: { t: { name: string } }) => e.t.name) ?? []
    if (new Set(n27).size !== 126) falha(`Copa do Brasil 2027: ${new Set(n27).size} clubes diferentes (devia 126)`)
    const terc = (e27?.[2] ?? []).map((e: { t: { name: string } }) => e.t.name)
    for (const c of [campC, campD]) if (c && !terc.includes(c)) falha(`Copa do Brasil 2027: campeão da C/D ${c} fora da 3ª fase`)
    if ((e27?.[4] ?? []).some((e: { div: string }) => e.div !== 'A')) falha('Copa do Brasil 2027: clube fora da Série A na 5ª fase')
    // a cota de cada estado (a de 2026) é respeitada: nenhum estado passa da cota
    const cota: Record<string, number> = {}, usado: Record<string, number> = {}
    for (const x of CLUBES_MESTRA) if (x.copa === '1ª fase' || x.copa === '2ª fase') cota[x.uf] = (cota[x.uf] ?? 0) + 1
    for (const e of [...(e27?.[0] ?? []), ...(e27?.[1] ?? [])]) { const uf = clubeOficial(e.t.name)?.uf; if (uf) usado[uf] = (usado[uf] ?? 0) + 1 }
    for (const uf of Object.keys(usado)) if (usado[uf] > (cota[uf] ?? 0) + 2) falha(`Copa do Brasil 2027: ${uf} com ${usado[uf]} vagas (cota ${cota[uf] ?? 0})`)
    const cb27 = computeCopaBrasil(mundo, s.seed, 2, 1.2, false, {}, false, undefined, e27)
    if (!cb27.champion) falha('Copa do Brasil 2027: sem campeão')
    console.log(`  Copa do Brasil 2027: 3ª fase = ${terc.join(', ')} · campeão ${cb27.champion?.name}`)
  }
  // 🏆 SUPERCOPA REI: jogo único entre dois clubes reais, sempre com vencedor (pênaltis no empate), mesma semente = mesmo jogo
  {
    const { computeSupercopaRei, SUPERCOPA_REI } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    for (let k = 0; k < 30; k++) {
      const r = computeSupercopaRei('Flamengo', 'Corinthians', mundo, s.seed + k, 2)
      if (!r || r.name !== SUPERCOPA_REI || r.ties.length !== 1) { falha('Supercopa Rei: não montou o jogo'); break }
      const t = r.ties[0]
      if (t.legs.length !== 1) falha('Supercopa Rei: não é jogo único')
      if (t.aggA === t.aggB && !t.pens) falha('Supercopa Rei: empate sem pênaltis')
      if (t.goals.length !== t.aggA + t.aggB) falha('Supercopa Rei: gols não batem com o placar')
    }
    if (JSON.stringify(computeSupercopaRei('Flamengo', 'Corinthians', mundo, 5, 2)) !== JSON.stringify(computeSupercopaRei('Flamengo', 'Corinthians', mundo, 5, 2))) falha('Supercopa Rei: mesma semente, jogo diferente')
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
  // 🏆 LIBERTADORES REAL: os 47 clubes de 2026 fecham time com cartas do PRÓPRIO clube; páginas na ordem real (1ª, 2ª, 3ª fase,
  // 6 rodadas de grupo, oitavas, quartas, semi, final); 2 jogos por confronto até a semi e 1 na final; mesma semente = mesma
  {
    const { computeLibertadoresCarreira, fabricaTimesOficiais } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
    const { vagasLiberta } = await vite.ssrLoadModule('/src/escalacao/libertadores-oficial.ts')
    const v = vagasLiberta(null)
    const fab = fabricaTimesOficiais(mundo, s.seed)
    const sem = [...v.grupos, ...v.fase2, ...v.fase1].filter((n: string) => !fab(n))
    if (sem.length) falha(`Libertadores: ${sem.length} clube(s) sem time no baralho do modo: ${sem.join(', ')}`)
    else {
      const lib = computeLibertadoresCarreira(v, mundo, s.seed, 1)
      if (!lib) falha('Libertadores: não montou')
      else {
        const fases = lib.rounds.map((r: { name: string }) => r.name.split(' · ')[1]).join('|')
        if (fases !== '1ª fase|2ª fase|3ª fase|Fase de grupos|Fase de grupos|Fase de grupos|Fase de grupos|Fase de grupos|Fase de grupos|Oitavas de final|Quartas de final|Semifinal|Final') falha(`Libertadores: páginas ${fases}`)
        const pernas = lib.rounds.map((r: { ties: { legs: unknown[] }[] }) => r.ties[0].legs.length).join('')
        if (pernas !== '2221111112221') falha(`Libertadores: jogos por página ${pernas}`)
        for (const r of lib.rounds) for (const t of r.ties) if (t.a.xi.length !== 11 || t.b.xi.length !== 11) { falha(`Libertadores: ${t.a.name} × ${t.b.name} sem 11 em campo`); break }
        const fin = lib.rounds[lib.rounds.length - 1].ties[0]
        if ((fin.win === 'a' ? fin.a.name : fin.b.name) !== lib.resultado.campeao) falha('Libertadores: o vencedor da final não é o campeão')
        if (JSON.stringify(computeLibertadoresCarreira(v, mundo, s.seed, 1)?.resultado) !== JSON.stringify(lib.resultado)) falha('Libertadores: mesma semente, torneio diferente')
        const { computeSulaCarreira } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
        const { vagasSula } = await vite.ssrLoadModule('/src/escalacao/sul-americana-oficial.ts')
        const vs = vagasSula(null, [...v.grupos, ...v.fase2, ...v.fase1])
        const semS = [...vs.grupos, ...vs.fase1].filter((n: string) => !fab(n))
        if (semS.length) falha(`Sul-Americana: ${semS.length} clube(s) sem time no baralho do modo: ${semS.join(', ')}`)
        else {
          const sula = computeSulaCarreira(vs, { grupos: lib.resultado.sulaGrupos, playoff: lib.resultado.sulaPlayoff }, mundo, s.seed, 1)
          if (!sula) falha('Sul-Americana: não montou')
          else {
            const pernasS = sula.rounds.map((r: { ties: { legs: unknown[] }[] }) => r.ties[0].legs.length).join('')
            if (pernasS !== '111111122221') falha(`Sul-Americana: jogos por página ${pernasS}`)
            for (const r of sula.rounds) for (const t of r.ties) if (t.a.xi.length !== 11 || t.b.xi.length !== 11) { falha(`Sul-Americana: ${t.a.name} × ${t.b.name} sem 11 em campo`); break }
          }
        }
        const { premioLibertadores } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
        const r = lib.resultado
        if (premioLibertadores(r, r.campeao) !== 80 || premioLibertadores(r, r.vice) !== 40 || ![4, 8].includes(premioLibertadores(r, r.classificacao[r.classificacao.length - 1])) || premioLibertadores(r, 'Clube Que Não Existe') !== 0) falha('Libertadores: prêmio por etapa fora da régua de 18/11 (80/40/…/8 ou 4/0)')
      }
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
