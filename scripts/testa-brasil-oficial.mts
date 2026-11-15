// 🇧🇷 trava do Brasil Oficial (base pura): clubes, escudos e o sorteio dos 22.
import { CATALOG } from '../src/escalacao/data.ts'
import { ESCUDOS_OFICIAIS } from '../src/escalacao/escudos-oficiais.ts'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
import { CLUBES_BR, cartasDoClube, sorteiaElenco, fechaTime, clubesDaDivisao } from '../src/escalacao/brasil-oficial.ts'
let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
if (clubesDaDivisao('A').length !== 20) falha('Série A precisa de 20')
if (clubesDaDivisao('B').length !== 20) falha('Série B precisa de 20')
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
const juntas = Object.fromEntries((Object.keys(CATALOG) as (keyof typeof CATALOG)[]).map(p => [p, [...CATALOG[p], ...CATALOG_OFICIAL[p]]])) as typeof CATALOG
for (const c of CLUBES_BR) if (!fechaTime(cartasDoClube(c, juntas))) falha(`não fecha um 11: ${c.nome}`)
// toda carta do modo é de um clube do modo
const nomes = new Set(CLUBES_BR.flatMap(c => [c.nome, ...(c.apelidos ?? [])]))
for (const l of Object.values(CATALOG_OFICIAL)) for (const x of l) if (!nomes.has(x.club)) falha(`carta de clube fora do modo: ${x.name} (${x.club})`)
// mesmo nome+clube+ano não pode existir nos dois baralhos
const ja = new Set(Object.values(CATALOG).flat().map(x => `${x.name}|${x.club}|${x.year}`))
for (const l of Object.values(CATALOG_OFICIAL)) for (const x of l) if (ja.has(`${x.name}|${x.club}|${x.year}`)) falha(`carta já existe no baralho: ${x.name} ${x.club} ${x.year}`)
if (erros) { console.log(`❌ brasil-oficial: ${erros} erro(s)`); process.exit(1) }
console.log('✅ brasil-oficial: 40 clubes com escudo, sorteio dos 22 estável e sem perder carta')

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
  for (const c of clubesDaDivisao('B')) if (s.careerPlacements?.[c.nome] !== 'B') falha(`${c.nome} devia estar na Série B`)
  const fundo = seedCpuSquadsOficial(s)
  for (const c of clubesDaDivisao('B')) if (!fundo[c.nome] || !fechaTime(fundo[c.nome])) falha(`fundo: ${c.nome} sem elenco que feche um 11`)
  const todos = [...ids, ...Object.values(fundo).flat().filter(c => c.club !== 'Várzea').map(c => `${c.name}|${c.club}|${c.year}`)]
  const rep = todos.filter((k, i) => todos.indexOf(k) !== i)
  if (rep.length) falha(`carta repetida entre clubes: ${rep.slice(0, 5).join(', ')}`)
  // a carreira de time criado continua sem as cartas do modo
  const criada = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: 'Meu Time', formation: '4-3-3', rivals: 5, league: 'both' } as never)
  if (criada.oficial) falha('carreira criada marcada como oficial')
  const doModo = new Set(Object.values(CATALOG_OFICIAL).flat().map(x => `${x.name}|${x.club}|${x.year}`))
  if (criada.managers.some(m => m.squad.some(c => doModo.has(`${c.name}|${c.club}|${c.year}`)))) falha('carta do Brasil Oficial vazou pra carreira criada')
  _forcaBrasilOficialParaTeste(false)
  await vite.close()
  if (erros) { console.log(`❌ brasil-oficial: ${erros} erro(s)`); process.exit(1) }
  console.log('✅ brasil-oficial: carreira nasce com o clube real, 20 da divisão real, elencos sem repetir, fundo real, sem vazar pra carreira criada')
}
