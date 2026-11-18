// 🏆 trava da Libertadores do Brasil Oficial (`npm run libertadores`): 47 clubes no formato real de 2026, cada fase com o
// tamanho certo, ninguém joga 2× na rodada dos grupos, mesmo país não cai junto no grupo, vagas brasileiras descem certo.
import { simulaLibertadores, vagasLiberta, ESTRANGEIROS_LIBERTA_2026 } from '../src/escalacao/libertadores-oficial.ts'
import { simulaIntercontinental, FASES_INTERCONTINENTAL, CLUBES_INTERCONTINENTAL } from '../src/escalacao/intercontinental-oficial.ts'
import type { Joga, Penaltis } from '../src/escalacao/campeonato-oficial.ts'
let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
const rng = (s: number) => () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296 }
const jogaDe = (seed: number): Joga => { const r = rng(seed); return () => ({ gc: Math.floor(r() * 4), gf: Math.floor(r() * 3) }) }
const pen: Penaltis = (a, b) => (a < b ? a : b)
if (ESTRANGEIROS_LIBERTA_2026.length !== 39) falha(`estrangeiros: ${ESTRANGEIROS_LIBERTA_2026.length} (esperado 39)`)
const v1 = vagasLiberta(null)
if (v1.grupos.length !== 28 || v1.fase2.length !== 13 || v1.fase1.length !== 6) falha(`2026: ${v1.grupos.length}/${v1.fase2.length}/${v1.fase1.length}`)
const A = ['Palmeiras', 'Flamengo', 'Cruzeiro', 'Mirassol', 'Fluminense', 'Botafogo', 'Bahia', 'São Paulo', 'Grêmio', 'Vasco']
// campeão da Copa já no G4 → a vaga desce; vice da Copa no G5 → desce; campeão da Liberta brasileiro = 8 vagas
const v2 = vagasLiberta({ serieA: A, copa: 'Flamengo', copaVice: 'Fluminense', liberta: 'Palmeiras' })
const br2 = [...v2.grupos, ...v2.fase2].filter(n => v2.pais[n] === 'BRA')
if (JSON.stringify(v2.grupos.slice(0, 6)) !== JSON.stringify(['Palmeiras', 'Flamengo', 'Cruzeiro', 'Mirassol', 'Fluminense', 'Botafogo'])) falha(`grupos BR: ${v2.grupos.slice(0, 6)}`)
if (JSON.stringify(v2.fase2.slice(0, 2)) !== JSON.stringify(['Bahia', 'São Paulo'])) falha(`2ª fase BR: ${v2.fase2.slice(0, 2)}`)
if (br2.length !== 8 || v2.grupos.length !== 28 || v2.fase2.length !== 13) falha(`com campeão BR: ${br2.length} BR, ${v2.grupos.length}/${v2.fase2.length}`)
const v3 = vagasLiberta({ serieA: A, copa: 'Vasco', copaVice: 'Grêmio', liberta: 'Alianza Lima' })
if (v3.grupos.length !== 27 || v3.fase2.length !== 13 || v3.fase1.length !== 6) falha(`campeão estrangeiro (sem vaga extra, Diego 16/11): ${v3.grupos.length}/${v3.fase2.length}/${v3.fase1.length}`)
if ([...v3.grupos, ...v3.fase2].filter(n => v3.pais[n] === 'BRA').length !== 7) falha('campeão estrangeiro: o Brasil devia mandar 7')
if (!v3.grupos.includes('Alianza Lima') || !v3.grupos.includes('Vasco') || !v3.fase2.includes('Grêmio') || !v3.fase1.includes('Cusco')) falha('campeão estrangeiro/copa fora do lugar')
for (const v of [v1, v2, v3]) for (let k = 0; k < 15; k++) {
  const forca = (t: string) => (t.length * 7 + k) % 13
  const r = simulaLibertadores(v, 500 + k, jogaDe(9 + k), pen, forca)
  const todos = [...v.grupos, ...v.fase2, ...v.fase1], N = todos.length
  if (new Set(todos).size !== N || (N !== 47 && N !== 46)) falha(`vagas com ${new Set(todos).size} clubes`)
  if (r.classificacao.length !== N || new Set(r.classificacao).size !== N) { falha(`classificação com ${r.classificacao.length} de ${N}`); break }
  if (r.classificacao[0] !== r.campeao || r.classificacao[1] !== r.vice) falha('campeão/vice fora do topo')
  const tam = r.fases.map(f => f.tabelas.length ? f.tabelas.reduce((s, t) => s + t.tabela.length, 0) : f.confrontos.length)
  if (JSON.stringify(tam) !== JSON.stringify([3, 8, 4, 32, 8, 4, 2, 1])) falha(`tamanhos ${tam}`)
  const grupos = r.fases[3].tabelas
  for (const g of grupos) { const ps = g.tabela.map(l => v.pais[l.time]).filter(Boolean); if (new Set(ps).size !== ps.length && k === 0) falha(`${g.nome} com país repetido: ${g.tabela.map(l => l.time)}`) }
  for (let rd = 1; rd <= 6; rd++) { const l = r.jogos.filter(j => j.ctx.fase === 'Fase de grupos' && j.ctx.rodada === rd).flatMap(j => [j.casa, j.fora]); if (l.length !== 32 || new Set(l).size !== 32) falha(`rodada ${rd} dos grupos com ${l.length}`) }
  if (r.sulaGrupos.length !== 4 - (47 - N) || r.sulaPlayoff.length !== 8) falha('Sula com tamanho errado')
  if (k === 0 && JSON.stringify(simulaLibertadores(v, 500, jogaDe(9), pen, forca)) !== JSON.stringify(r)) falha('mesma semente, Libertadores diferente')
}
// 🌎 Sul-Americana: 56 clubes (32 na 1ª fase por país, 12 diretos, 4 da 3ª fase da Liberta, 8 terceiros no playoff)
{
  const { vagasSula, simulaSulAmericana } = await import('../src/escalacao/sul-americana-oficial.ts')
  const vl = vagasLiberta(null)
  const vs = vagasSula(null, [...vl.grupos, ...vl.fase2, ...vl.fase1])
  if (vs.grupos.length !== 12 || vs.fase1.length !== 32) falha(`Sula 2026: ${vs.grupos.length} diretos / ${vs.fase1.length} na 1ª fase`)
  for (let k = 0; k < 15; k++) {
    const lib = simulaLibertadores(vl, 900 + k, jogaDe(30 + k), pen, () => 1)
    const r = simulaSulAmericana(vs, { grupos: lib.sulaGrupos, playoff: lib.sulaPlayoff }, 700 + k, jogaDe(50 + k), pen, t => t.length)
    const tam = r.fases.map(f => f.tabelas.length ? f.tabelas.reduce((x, t) => x + t.tabela.length, 0) : f.confrontos.length)
    if (JSON.stringify(tam) !== JSON.stringify([16, 32, 8, 8, 4, 2, 1])) { falha(`Sula: tamanhos ${tam}`); break }
    if (r.classificacao.length !== 56 || new Set(r.classificacao).size !== 56) falha(`Sula: classificação com ${r.classificacao.length}`)
    for (const c of r.fases[0].confrontos) if (vs.pais[c.a] !== vs.pais[c.b]) falha(`Sula 1ª fase com países diferentes: ${c.a} × ${c.b}`)
    if (r.classificacao[0] !== r.campeao) falha('Sula: campeão fora do topo')
  }
  // a vaga do campeão da Sula: brasileiro entra nos grupos (8 brasileiros com campeão da Liberta brasileiro) e o Lanús sai
  const v4 = vagasLiberta({ serieA: A, copa: 'Vasco', copaVice: 'Grêmio', liberta: 'Palmeiras', sula: 'São Paulo' })
  if (!v4.grupos.includes('São Paulo') || v4.grupos.includes('Lanús') || v4.grupos.length !== 28) falha(`Sula campeão brasileiro: ${v4.grupos.length} nos grupos`)
  const v5 = vagasLiberta({ serieA: A, copa: 'Vasco', copaVice: 'Grêmio', liberta: 'Palmeiras', sula: 'Racing' }, { Racing: 'ARG' })
  if (!v5.grupos.includes('Racing') || v5.grupos.includes('Lanús') || v5.grupos.length !== 28 || v5.pais.Racing !== 'ARG') falha('Sula campeão estrangeiro de fora da Liberta não herdou a vaga do Lanús')
}
// 🌐 Intercontinental: 5 jogos únicos na ordem real, o campeão da Liberta entra no Dérbi, o PSG só na final, 6 clubes classificados
for (let sd = 1; sd <= 30; sd++) {
  const ic = simulaIntercontinental('Flamengo', jogaDe(sd), pen)
  if (ic.fases.map(f => f.nome).join('|') !== FASES_INTERCONTINENTAL.join('|')) falha('intercontinental: fases fora de ordem')
  if (ic.jogos.length !== 5 || ic.fases.some(f => f.confrontos.length !== 1)) falha('intercontinental: não são 5 jogos únicos')
  const der = ic.fases[2].confrontos[0], fin = ic.fases[4].confrontos[0]
  if (der.a !== 'Flamengo' || der.b !== 'Toluca') falha(`dérbi: ${der.a} × ${der.b}`)
  if (fin.b !== 'PSG' || ic.fases.slice(0, 4).some(f => f.confrontos[0].a === 'PSG' || f.confrontos[0].b === 'PSG')) falha('PSG fora da final ou antes dela')
  if (new Set(ic.classificacao).size !== 6 || !['Flamengo', ...CLUBES_INTERCONTINENTAL].every(n => ic.classificacao.includes(n))) falha(`classificação: ${ic.classificacao}`)
}
if (erros) { console.log(`❌ libertadores: ${erros} erro(s)`); process.exit(1) }
console.log('✅ libertadores + sul-americana: 47 clubes no formato real (1ª 6 · 2ª 16 · 3ª 8 · grupos 8×4 · oitavas a semis ida e volta · final única), vagas brasileiras descem certo, país não repete no grupo · intercontinental 5 jogos únicos na ordem real')
