// npx tsx --import ./scripts/node-stub-reg.mjs scripts/testa-tecnicos-brasil.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TECNICOS, ESQUEMAS_POR_DIV, fichaDoTecnico, formacoesDoTecnico, REPERTORIO, chavePessoaTecnico, distribuiVinculosTecnicos } from '../src/escalacao/tecnicos'
import { NOVOS_TECNICOS_BRASIL, TECNICOS_BRASIL_LOTE_1 } from '../src/escalacao/tecnicos-brasil'
import { TECNICOS_BRASIL_LOTE_2, TECNICOS_BRASIL_LOTE_3 } from '../src/escalacao/tecnicos-brasil-lotes'
import { FORMACOES15, ORDEM_EQUILIBRADO, COLUNA_ESTILO, formacaoAtual } from '../src/escalacao/formacoes'
import { CLUBES_BR_TODOS } from '../src/escalacao/brasil-oficial'
import { reducer, INITIAL } from '../src/escalacao/store'
import { carregaBaralhoOficial } from '../src/escalacao/baralho-oficial-carga'
import type { EscState, Manager } from '../src/escalacao/types'

assert.deepEqual(ESQUEMAS_POR_DIV, { A: 6, B: 5, C: 4, D: 3, V: 2 })
const nomes = new Map<string, string>()
for (const t of TECNICOS) for (const n of [t.nome, t.nomeCompleto].filter((n): n is string => !!n)) {
  const k = chavePessoaTecnico(n)
  assert.ok(!nomes.has(k) || nomes.get(k) === t.nome, `pessoa duplicada: ${t.nome} / ${nomes.get(k)}`)
  nomes.set(k, t.nome)
}
assert.equal(TECNICOS_BRASIL_LOTE_1.length, 40)
assert.equal(TECNICOS_BRASIL_LOTE_2.length, 40)
assert.equal(TECNICOS_BRASIL_LOTE_3.length, 40)
assert.equal(NOVOS_TECNICOS_BRASIL.length, 120)
assert.equal(TECNICOS.length, 225)
const clubes = new Set(CLUBES_BR_TODOS.map(c => c.nome))
for (const t of NOVOS_TECNICOS_BRASIL) {
  assert.ok(t.formacoes?.length, `${t.nome}: repertório já definido no cadastro`)
  assert.equal(t.formacoes!.length, ESQUEMAS_POR_DIV[t.div], `${t.nome}: quantidade pela categoria`)
  assert.deepEqual(fichaDoTecnico(t).formacoes, t.formacoes, `${t.nome}: ficha usa o repertório cadastrado`)
  if (t.formacoesDocumentadas?.length) {
    assert.ok(t.fontesFormacoes?.length, `${t.nome}: esquemas documentados têm fonte`)
    assert.ok(t.formacoesDocumentadas.every(f => t.formacoes!.includes(f)), `${t.nome}: esquemas pesquisados disponíveis`)
  }
  assert.ok(t.vinculos?.length, `${t.nome}: vínculo pesquisado`)
  for (const v of t.vinculos!) {
    // São Bento é vínculo histórico real; ainda não consta na lista mestra do modo.
    assert.ok(clubes.has(v.clube) || v.clube === 'São Bento', `nome de clube precisa bater com o catálogo: ${v.clube}`)
    assert.match(v.fonte, /^https:\/\//)
    assert.ok(v.referencia.length > 15)
  }
}
console.log('✅ 225 pessoas únicas; 120 novas com categoria, formações explícitas e vínculo documentado')

for (const t of TECNICOS) {
  const fs = formacoesDoTecnico(t), n = ESQUEMAS_POR_DIV[t.div]
  assert.equal(fs.length, n, t.nome)
  assert.equal(new Set(fs).size, n, `${t.nome}: sem esquema repetido`)
  assert.ok(fs.every(f => FORMACOES15.some(x => x.rotulo === f)), `${t.nome}: esquema existente`)
  if (t.formacoes) continue // repertórios explícitos são conferidos acima e pelo snapshot dos 145 anteriores
  const anterior = REPERTORIO[t.nome]?.filter(f => FORMACOES15.some(x => x.rotulo === f)) ?? []
  const antes = anterior.length ? [...new Set([...anterior, ...ORDEM_EQUILIBRADO, ...FORMACOES15.map(f => f.rotulo)])].slice(0, n - 1)
    : (t.estilo === 'equilibrado' ? ORDEM_EQUILIBRADO : COLUNA_ESTILO[t.estilo]).slice(0, n - 1)
  assert.deepEqual(fs.slice(0, n - 1), antes, `${t.nome}: opções já liberadas preservadas`)
}
// As notas e categorias dos 105 nomes anteriores não são reclassificadas.
const antigos: { nome: string; div: string; estilo: string }[] = JSON.parse(readFileSync(new URL('./fixtures/tecnicos-20261124.json', import.meta.url), 'utf8'))
assert.equal(antigos.length, 105)
for (const anterior of antigos) {
  const t = TECNICOS.find(t => t.nome === anterior.nome)!
  assert.equal(t.div, anterior.div, t.nome); assert.equal(t.estilo, anterior.estilo, t.nome)
  const fx = fichaDoTecnico(t)
  assert.equal(fx.lo, ({ A: 89, B: 83, C: 76, D: 68, V: 55 } as const)[t.div])
  assert.equal(fx.hi, ({ A: 95, B: 91, C: 86, D: 80, V: 70 } as const)[t.div])
}
console.log('✅ todas as categorias têm +1 formação; repertórios anteriores e notas preservados')

const primeiroLote: { nome: string; div: string; ficha: ReturnType<typeof fichaDoTecnico> }[] = JSON.parse(readFileSync(new URL('./fixtures/tecnicos-145-fichas.json', import.meta.url), 'utf8'))
assert.equal(primeiroLote.length, 145)
for (const anterior of primeiroLote) {
  const atual = TECNICOS.find(t => t.nome === anterior.nome)!
  assert.equal(atual.div, anterior.div)
  assert.deepEqual(fichaDoTecnico(atual), anterior.ficha, `${atual.nome}: ficha aprovada no primeiro lote preservada`)
}
console.log('✅ fichas completas dos 145 nomes anteriores permanecem iguais')

const alvos = ['São Paulo', 'Palmeiras', 'Flamengo', 'Portuguesa', 'Sampaio Corrêa', 'CSA', 'Santa Cruz', 'Retrô', 'Ceilândia', 'Botafogo-SP']
const a = distribuiVinculosTecnicos(alvos, [])
assert.equal(a['São Paulo'], 'Telê Santana')
assert.ok(['Abel Ferreira', 'Luiz Felipe Scolari', 'Oswaldo Brandão'].includes(a.Palmeiras))
assert.equal(a.Portuguesa, 'Jorginho Cantinflas')
assert.equal(a['Ceilândia'], 'Adelson de Almeida')
assert.equal(a['Retrô'], 'Itamar Schülle')
assert.equal(a.CSA, 'Flávio Araújo')
assert.equal(a['Sampaio Corrêa'], 'Francisco Diá', 'outro histórico cobre o clube sem duplicar Flávio')
assert.equal(new Set(Object.values(a)).size, Object.values(a).length)
assert.deepEqual(a, distribuiVinculosTecnicos([...alvos].reverse(), []), 'ordem de clubes não altera o resultado')
assert.notEqual(distribuiVinculosTecnicos(['São Paulo'], ['Telê Santana'])['São Paulo'], 'Telê Santana', 'técnico ocupado não duplica')
assert.equal(distribuiVinculosTecnicos(['PORTUGUESA'], [])['PORTUGUESA'], 'Jorginho Cantinflas')
console.log('✅ vínculos reservados antes do sorteio; histórico priorizado, ocupados respeitados')

const manager = (id: number, teamName: string, isHuman = false) => ({ id, name: teamName, teamName, isHuman, money: 100, squad: [], formation: '4-3-3' } as unknown as Manager)
const base = {
  ...structuredClone(INITIAL), careerOnline: true, onlineMode: 'cpu', seasonNo: 2, round: 5, seed: 734,
  oficial: { clube: 'Brasiliense', desde: 1, giro: 1 }, youIdx: 0,
  managers: [manager(1, 'Brasiliense', true), manager(2, 'Portuguesa'), manager(3, 'Santa Cruz')],
  careerPlacements: { m1: 'C', m2: 'C', m3: 'C', 'Sampaio Corrêa': 'C', 'São Paulo': 'A' },
  careerTecnicos: { 'Brasiliense': 'Alex Ferguson', 'São Paulo': 'Telê Santana' },
  careerTecnicosDesde: { 'Brasiliense': { t: 1, r: 2 }, 'São Paulo': { t: 1, r: 0 } },
  careerTecnicoContrato: { 'Brasiliense': 5, 'São Paulo': 5 },
} as unknown as EscState
const semeado = reducer(base, { type: 'ALICIAR_SEED' })
assert.equal(semeado.careerTecnicos?.Portuguesa, 'Jorginho Cantinflas')
assert.equal(semeado.careerTecnicos?.['Sampaio Corrêa'], 'Flávio Araújo')
assert.equal(semeado.careerTecnicos?.['Brasiliense'], 'Alex Ferguson', 'técnico do usuário preservado')
assert.equal(semeado.careerTecnicos?.['São Paulo'], 'Telê Santana', 'outra divisão conserva o treinador')
assert.equal(semeado.careerTecnicoContrato?.['São Paulo'], 5)
assert.deepEqual(semeado.careerTecnicosDesde?.Portuguesa, { t: 2, r: 5 }, 'efeito somente a partir da contratação')
assert.deepEqual(semeado.careerTecnicosDesde?.['São Paulo'], { t: 1, r: 0 })
assert.equal(new Set(Object.values(semeado.careerTecnicos!).filter(Boolean)).size, Object.values(semeado.careerTecnicos!).filter(Boolean).length)
const segunda = reducer(semeado, { type: 'ALICIAR_SEED' })
assert.deepEqual(segunda.careerTecnicos, semeado.careerTecnicos)
assert.deepEqual(segunda.careerTecnicoContrato, semeado.careerTecnicoContrato)
const promovido = reducer({ ...semeado, careerPlacements: { ...semeado.careerPlacements, m1: 'B', m2: 'B' } }, { type: 'ALICIAR_SEED' })
assert.equal(promovido.careerTecnicos?.Portuguesa, 'Jorginho Cantinflas', 'acesso não demite o técnico')
const atual = reducer({ ...base, careerTecnicos: { ...base.careerTecnicos, Portuguesa: 'Pep Guardiola' } }, { type: 'ALICIAR_SEED' })
assert.equal(atual.careerTecnicos?.Portuguesa, 'Pep Guardiola', 'vínculo histórico não substitui contratação de save antigo')
console.log('✅ reducer: sem duplicatas, sem substituir contratos, sem demissão por acesso, repetição idempotente')

await carregaBaralhoOficial()
const iniciais: Record<string, string> = { Portuguesa: 'Jorginho Cantinflas', 'São Paulo': 'Telê Santana', Santos: 'Lula', Gama: 'Vilson Taddei', Amazonas: 'Luizinho Vieira', Botafogo: 'Enderson Moreira', Trem: 'Sandro Macapá', Humaitá: 'Márcio Parreiras' }
for (const [clube, esperado] of Object.entries(iniciais)) {
  const inicio = reducer(structuredClone(INITIAL), { type: 'START_CAREER_SOLO', teamName: clube, formation: '4-3-3', rivals: 3, oficial: { clube } })
  assert.equal(inicio.oficial?.clube, clube)
  const eu = inicio.managers[inicio.youIdx]
  const n = inicio.careerTecnicos?.[eu.teamName]
  assert.equal(n, esperado, `${clube}: largada com vínculo pesquisado`)
  const t = TECNICOS.find(t => t.nome === n)!
  assert.equal(fichaDoTecnico(t).formacoes.length, ESQUEMAS_POR_DIV[t.div], `${clube}: treinador já inicia com os esquemas da própria categoria`)
  assert.equal(inicio.careerTecnicoContrato?.[eu.teamName], 5, 'contrato inicial do humano dura cinco temporadas')
  assert.ok((inicio.careerTecnicoPago?.[n!] ?? 0) > 0, 'valor de referência para salário e renovação')
  assert.ok(!inicio.careerLedger?.some(l => /técnico/i.test(l.label) && l.amount < 0), 'nenhuma contratação automática cobrada do humano')
  const ocupacoes = Object.values(inicio.careerTecnicos ?? {}).filter(Boolean)
  assert.equal(new Set(ocupacoes).size, ocupacoes.length, `${clube}: largada sem técnico em dois clubes`)
  for (const m of inicio.managers) {
    const tecnico = TECNICOS.find(t => t.nome === inicio.careerTecnicos?.[m.teamName])
    if (!tecnico) continue
    const liberadas = fichaDoTecnico(tecnico).formacoes
    const atual = formacaoAtual(m).rotulo
    assert.ok(liberadas.includes(atual) || inicio.careerFormacaoExtra?.[m.teamName] === atual, `${clube}/${m.teamName}: esquema inicial pertence ao técnico ou à casa`)
  }
}
console.log('✅ carreiras novas reais: clube humano recebe técnico com vínculo, contrato e referência financeira')
