import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { vagasLiberta, simulaLibertadores } from '../src/escalacao/libertadores-oficial.ts'
import { vagasSula, simulaSulAmericana } from '../src/escalacao/sul-americana-oficial.ts'
import { PAISES_CONMEBOL, ordemNacionalConmebol, paisDosClubesConmebol } from '../src/escalacao/conmebol-inscricoes.ts'

const serieA = ['Palmeiras','Flamengo','Cruzeiro','Mirassol','Fluminense','Botafogo','Bahia','São Paulo','Grêmio','Vasco','Corinthians','Atlético-MG','Santos','Bragantino','Internacional','Athletico-PR','Coritiba','Vitória','Chapecoense','Remo']
const pais = paisDosClubesConmebol(), all = (v: ReturnType<typeof vagasLiberta>) => [...v.grupos, ...v.fase2, ...v.fase1]
let inscricoes = 0, simulacoes = 0
const campeoes = ['Flamengo', 'Palmeiras', ...Object.keys(pais)]
for (const liberta of campeoes) for (const sula of campeoes) {
  if (liberta === sula) continue
  const v = vagasLiberta({ serieA, copa: 'Vasco', copaVice: 'Grêmio', liberta, sula })
  assert.deepEqual([v.grupos.length, v.fase2.length, v.fase1.length], [28,13,6])
  const inscritos = all(v)
  assert.equal(new Set(inscritos).size, 47)
  assert(v.grupos.includes(liberta) && v.grupos.includes(sula), 'both continental champions enter next group stage')
  for (const p of PAISES_CONMEBOL) {
    const titles = [liberta, sula].filter(n => pais[n] === p).length
    assert.equal(inscritos.filter(n => v.pais[n] === p).length, (p === 'ARG' ? 6 : 4) + titles, `${p}: domestic slots + title slots`)
  }
  const s = vagasSula(serieA, inscritos), sul = [...s.grupos, ...s.fase1]
  assert.deepEqual([s.grupos.length, s.fase1.length], [12,32])
  assert.equal(new Set(sul).size, 44)
  assert(sul.every(n => !inscritos.includes(n)), 'no club registered in both starting lists')
  for (const p of PAISES_CONMEBOL) assert.equal(sul.filter(n => s.pais[n] === p).length, p === 'ARG' ? 6 : 4)
  inscricoes++
}
const joga = (a: string, b: string) => { assert(a && b, 'no match against a missing club'); return { gc: a.length % 4, gf: b.length % 3 } }
const pen = (a: string, _b: string) => a, forca = (n: string) => n.length
for (const p of ['BRA', ...PAISES_CONMEBOL]) for (const q of ['BRA', ...PAISES_CONMEBOL]) {
  const liberta = p === 'BRA' ? 'Flamengo' : ordemNacionalConmebol(p)[0]
  const sula = q === 'BRA' ? 'Palmeiras' : ordemNacionalConmebol(q)[p === q ? 1 : 0]
  const v = vagasLiberta({ serieA, copa: 'Vasco', copaVice: 'Grêmio', liberta, sula })
  const l = simulaLibertadores(v, 42, joga, pen, forca)
  assert.equal(l.fases[3].tabelas.length, 8)
  assert(l.fases[3].tabelas.every(g => g.tabela.length === 4))
  assert.equal(l.sulaGrupos.length, 4); assert.equal(l.sulaPlayoff.length, 8)
  const derrotados = l.fases[2].confrontos.map(c => c.a === c.vencedor ? c.b : c.a)
  assert.deepEqual(l.sulaGrupos, derrotados)
  assert(l.fases[3].tabelas.every(g => g.tabela.every(t => !derrotados.includes(t.time))), 'eliminated in Libertadores stays eliminated there')
  const sv = vagasSula(serieA, all(v)), s = simulaSulAmericana(sv, { grupos: l.sulaGrupos, playoff: l.sulaPlayoff }, 42, joga, pen, forca)
  assert.equal(s.fases[1].tabelas.length, 8)
  assert(s.fases[1].tabelas.every(g => g.tabela.length === 4))
  assert.equal(s.fases.at(-1)!.confrontos.length, 1)
  assert(s.campeao && s.vice && s.campeao !== s.vice)
  assert.equal(new Set(s.classificacao).size, 56)
  simulacoes++
}
// Snapshots of valid 2026 tournaments on published d9aa215a, before this fix.
const hashes = {1:'f57b116de5b8b72a40b7f9a4146a8da22342d6e1dedf99663348cd083111e173',42:'4082e739dd5b731e92838df78a0842b30b2e992b0cf69eb301bc643b7d66f61d'}
for (const seed of [1,42] as const) {
  const v = vagasLiberta(null), l = simulaLibertadores(v, seed, joga, pen, forca), sv = vagasSula(null, all(v))
  const s = simulaSulAmericana(sv, { grupos: l.sulaGrupos, playoff: l.sulaPlayoff }, seed, joga, pen, forca)
  assert.equal(createHash('sha256').update(JSON.stringify(s)).digest('hex'), hashes[seed], 'valid first-season matches/results must remain byte-identical')
}
let called = false
assert.throws(() => simulaLibertadores({ ...vagasLiberta(null), grupos: [] }, 1, () => { called = true; return {gc:0,gf:0} }, pen, forca), /Inscrição incompleta/)
assert.equal(called, false, 'invalid registration is rejected before generating any score')
console.log(`PASS ${inscricoes} combinações de campeões: cotas nacionais, 47/44 clubes, sem duplicação; ${simulacoes} pares de copas completos; snapshots de 2026 preservados`)

// Migração: edição antiga completa permanece idêntica; só a incompleta é reparada.
const { inscricoesConmebolDaTemporada } = await import('../src/escalacao/conmebol-temporada.ts')
const { vagasLibertaLegadas, vagasSulaLegadas } = await import('../src/escalacao/conmebol-inscricoes-legadas.ts')
const validHashes = {
  Lanús: {1:'bb66f836af906bda7170f6b037d3afe394de867ecf0c27360593448c3b2bc510',42:'6fe987257e7a373646071ff8b722d748f9fabd5f8aa566e07ed5bae23660b73a'},
  'São Paulo': {1:'c317d34d7e0b928be5e35873ef54fa86bdc085939dbf0c177921aefd2dc08a57',42:'f44b26d91cc1134d7603c1428066706340641baeef55a175933503c227cc2f5c'}
}
for (const sula of ['Lanús','São Paulo'] as const) for (const flag of [undefined,3]) {
  const anterior = {serieA, copa:'Vasco', copaVice:'Grêmio', liberta:'Flamengo', sula}
  const before = JSON.stringify(anterior), v = inscricoesConmebolDaTemporada(anterior,2,flag)
  assert.equal(v.modo,'preservada')
  assert.deepEqual(v.liberta,vagasLibertaLegadas(anterior))
  assert.deepEqual(v.sula,vagasSulaLegadas(serieA,all(v.liberta)))
  for (const seed of [1,42] as const) {
    const l=simulaLibertadores(v.liberta,seed,joga,pen,forca)
    const s=simulaSulAmericana(v.sula,{grupos:l.sulaGrupos,playoff:l.sulaPlayoff},seed,joga,pen,forca)
    assert.equal(createHash('sha256').update(JSON.stringify(s)).digest('hex'),validHashes[sula][seed])
  }
  assert.equal(JSON.stringify(anterior),before,'qualification must not mutate championship history')
  const nova=inscricoesConmebolDaTemporada(anterior,3,3)
  assert.equal(nova.modo,'nova')
  if(sula==='São Paulo') assert(nova.sula.grupos.includes('Lanús'),'next edition restores Lanús at its annual reference position')
}
const afetada=inscricoesConmebolDaTemporada({serieA,copa:'Vasco',copaVice:'Grêmio',liberta:'Alianza Lima',sula:'Lanús'},2)
assert.equal(afetada.modo,'reparada');assert.equal(all(afetada.liberta).length,47)
assert.equal(afetada.sula.fase1.length,32)
for(const parcial of [{liberta:'Lanús'},{sula:'Flamengo'},{}]) {
  const v=inscricoesConmebolDaTemporada({serieA,copa:'Vasco',copaVice:'Grêmio',...parcial},2,1)
  assert.equal(new Set(all(v.liberta)).size,47,'old unrecorded championship must not duplicate a club')
}
assert.throws(()=>vagasLiberta({serieA,copa:'Vasco',copaVice:'Grêmio',liberta:'Flamengo',sula:'Flamengo'}),/distintos/)
assert.throws(()=>simulaSulAmericana({...afetada.sula,fase1:[]},{grupos:[],playoff:[]},1,joga,pen,forca),/Inscrição incompleta/)
console.log('PASS edições antigas completas preservadas com resultados idênticos, edição incompleta reparada, migração futura, históricos parciais e inscrições inválidas')
