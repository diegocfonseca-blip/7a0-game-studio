// 🇧🇷 SIMULAÇÃO DO BRASIL OFICIAL (19/11, pedido do Diego: *"simulação jogando várias temporadas começando na Série D… analise a força
// dos bots… se tá muito difícil"*). Mede a força (nível médio do 11 titular) de cada série e onde um clube da D termina.
//   npx tsx scripts/simula-brasil-oficial.mts
const { createServer } = await import('vite')
const vite = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'silent' })
const { reducer, INITIAL } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const { _forcaBrasilOficialParaTeste } = await vite.ssrLoadModule('/src/escalacao/sport.ts')
const carga = await vite.ssrLoadModule('/src/escalacao/baralho-oficial-carga.ts')
const P = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const BO = await vite.ssrLoadModule('/src/escalacao/brasil-oficial.ts')
_forcaBrasilOficialParaTeste(true); await carga.carregaBaralhoOficial()
type T = { name: string; you?: boolean; xi: { lo?: number; hi?: number }[] }
const forca = (t: T) => t.xi.reduce((s, c) => s + ((c.lo ?? 50) + (c.hi ?? 60)) / 2, 0) / t.xi.length
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)] }
const f1 = (n: number) => n.toFixed(1)
const clubesD = BO.clubesDaDivisao('D').map((c: { nome: string }) => c.nome)
const amostra = clubesD.filter((_: string, i: number) => i % 8 === 0).slice(0, 12)
const linhas: string[] = []
const porDiv: Record<string, number[]> = { A: [], B: [], C: [], D: [] }
const voce: number[] = [], posD: string[] = []
let subiu = 0, n = 0
for (const clube of amostra) {
  const s = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: clube, formation: '4-3-3', rivals: 5, league: 'both', oficial: { clube } } as never)
  if (!s.oficial) { console.log('não começou', clube); continue }
  const fundo = P.seedCpuSquadsOficial(s)
  const mundo = P.buildPyramid(s.managers, 0, s.seed, s.deckLeague, s.careerPlacements, fundo, true) as Record<string, T[]>
  for (const d of ['A', 'B', 'C', 'D']) for (const t of mundo[d]) if (!t.you) porDiv[d].push(forca(t))
  const eu = mundo.D.find(t => t.you)!
  voce.push(forca(eu))
  const ordD = [...mundo.D].sort((a, b) => forca(b) - forca(a)), rank = ordD.findIndex(t => t.you) + 1
  // 3 temporadas de semente diferente com o MESMO elenco (sem reforço): quantas vezes ele sobe?
  for (const k of [0, 1, 2]) {
    const fim = P.simulaTemporadaOficial(mundo, s.seed + k * 7919, 38, 2026).oficial
    n++; if (fim.D.sobem?.includes(clube)) subiu++
  }
  posD.push(`${clube}: força ${f1(forca(eu))} · ${rank}º mais forte de 96 na D`)
}
console.log('\n📊 FORÇA DO 11 TITULAR (nível médio) — bots de cada série')
for (const d of ['D', 'C', 'B', 'A']) { const a = porDiv[d]; console.log(`  Série ${d}: mín ${f1(Math.min(...a))} · mediana ${f1(med(a))} · máx ${f1(Math.max(...a))}`) }
console.log(`\n🧑‍💼 o SEU clube na D (sem reforço): mediana ${f1(med(voce))}`)
for (const l of posD) console.log('  ' + l)
console.log(`\n🔼 com o elenco de início, sem nenhum reforço: subiu da D em ${subiu}/${n} temporadas simuladas (${Math.round(subiu / n * 100)}%)`)
// 🎯 quanto de força precisa pra SUBIR em cada série (todos os 136 bots, 8 temporadas de semente diferente)
{
  const clube = amostra[0]
  const s = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: clube, formation: '4-3-3', rivals: 5, league: 'both', oficial: { clube } } as never)
  const mundo = P.buildPyramid(s.managers, 0, s.seed, s.deckLeague, s.careerPlacements, P.seedCpuSquadsOficial(s), true) as Record<string, T[]>
  console.log('\n🏆 os mais fortes de cada série:')
  for (const d of ['D', 'C', 'B', 'A']) console.log(`  ${d}: ` + [...mundo[d]].sort((a, b) => forca(b) - forca(a)).slice(0, 5).map(t => `${t.name} ${f1(forca(t))}`).join(' · '))
  const faixas = (d: string) => { const r: Record<string, [number, number]> = {}
    for (let k = 0; k < 8; k++) { const fim = P.simulaTemporadaOficial(mundo, s.seed + k * 104729, 38, 2026).oficial
      const sobem: string[] = d === 'B' ? (fim.B.sobem ?? []) : d === 'C' ? (fim.C.sobem ?? []) : (fim.D.sobem ?? [])
      for (const t of mundo[d]) { const f = forca(t), fx = f < 58 ? '<58' : f < 62 ? '58-62' : f < 66 ? '62-66' : f < 70 ? '66-70' : f < 74 ? '70-74' : '74+'
        const x = (r[fx] ??= [0, 0]); x[1]++; if (sobem.includes(t.name)) x[0]++ } }
    return ['<58', '58-62', '62-66', '66-70', '70-74', '74+'].filter(k => r[k]).map(k => `${k}: ${Math.round(r[k][0] / r[k][1] * 100)}% (${r[k][1] / 8} times)`).join(' · ') }
  console.log('\n🔼 chance de SUBIR pela força do 11:')
  for (const d of ['D', 'C', 'B']) console.log(`  Série ${d} → ${faixas(d)}`)
}
await vite.close()
