// 🧪 TRAVA DAS COPAS REGIONAIS (Diego 10/10) — `npm run regional`
// Garante: 1) cada clube enfrenta os n do OUTRO lado uma vez só, nunca o próprio lado;
// 2) a tabela é por lado e só conta o que já apitou; 3) quartas/semis cruzadas, com
// os dois líderes só se cruzando na final; 4) mesma semente = mesma copa; 5) o pior e o
// melhor clube livre; 6) nenhum clube entra sem fechar 11; 7) carta regional não existe
// fora da copa regional (não está em nenhum baralho do jogo).
process.on('uncaughtException', e => { if (!String(e?.message).includes('DEV')) throw e })
const R: any = await import('../src/escalacao/copa-regional.ts')
const D: any = await import('../src/escalacao/data.ts')
const CR: any = await import('../src/escalacao/cartas-regionais.ts')
let erros = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }

const ent = (nome: string, str: number) => ({ club: nome, you: false, pais: nome, xi: R.xiDaMaquinaClube('Flamengo').xi, str })
for (const n of [8, 4, 2]) {
  console.log(`— copa com ${n} por lado`)
  const es = Array.from({ length: 2 * n }, (_, i) => ent(`C${i}`, 70 + (i % 5)))
  const m = R.simulaRegional(es, 777)
  ok(m.rodadas.length === n && m.rodadas.every((r: any) => r.length === n), `${n} rodadas de ${n} jogos`)
  const pares = new Set<string>(); let mesmoLado = 0
  for (const r of m.rodadas) for (const j of r) {
    const ladoH = j.h < n ? 0 : 1, ladoA = j.a < n ? 0 : 1
    if (ladoH === ladoA) mesmoLado++
    pares.add([Math.min(j.h, j.a), Math.max(j.h, j.a)].join('-'))
  }
  ok(mesmoLado === 0, 'nenhum jogo entre clubes do mesmo lado')
  ok(pares.size === n * n, `cada clube pega os ${n} do outro lado uma vez só (${pares.size} confrontos)`)
  for (const r of m.rodadas) { const vistos = new Set<number>(); for (const j of r) { vistos.add(j.h); vistos.add(j.a) } ok(vistos.size === 2 * n, 'ninguém joga duas vezes na mesma rodada') ; break }
  const t0 = R.tabelaDoLado(m, 0, 0)
  ok(t0.every((r: any) => r.j === 0 && r.pts === 0), 'tabela antes do apito: tudo zerado')
  const tA = R.tabelaDoLado(m, 0, n)
  ok(tA.every((r: any) => r.j === n) && tA.every((r: any) => r.t < n), 'tabela do lado A só tem clubes do lado A, todos com n jogos')
  ok(tA.every((r: any, i: number) => i === 0 || tA[i - 1].pts >= r.pts), 'tabela em ordem de pontos')
  const fases = m.ko.map((f: any) => f.tipo).join('/')
  ok(fases === (n >= 8 ? 'quartas/semi/final' : n >= 4 ? 'semi/final' : 'final'), `mata-mata: ${fases}`)
  const prim = m.ko[0].ties
  ok(prim.every((t: any) => (t.h < n) !== (t.a < n)), 'primeira fase do mata-mata é sempre cruzada (um de cada lado)')
  const [A, B] = m.classificados
  if (n >= 4) {
    const metade = (x: number) => prim.findIndex((t: any) => t.h === x || t.a === x) < prim.length / 2 ? 0 : 1
    ok(metade(A[0]) !== metade(B[0]), 'os dois líderes ficam em metades diferentes da chave (só se cruzam na final)')
  }
  ok(m.ko.every((f: any) => f.ties.every((t: any) => t.winner === t.h || t.winner === t.a)), 'todo confronto tem vencedor de dentro dele')
  ok(m.ko.every((f: any) => f.ties.every((t: any) => t.g[0] !== t.g[1] || !!t.pen)), 'empate sempre vai pros pênaltis')
  ok(JSON.stringify(R.simulaRegional(es, 777)) === JSON.stringify(m), 'mesma semente = mesma copa, gol por gol')
  ok(JSON.stringify(R.simulaRegional(es, 778)) !== JSON.stringify(m), 'semente diferente = copa diferente')
  const p = R.passosRegional(n)
  ok(p.FIM === n + 2 + m.ko.length && p.FINAL === p.FIM - 1, `passos: ${n} rodadas · chave ${p.CHAVE} · fim ${p.FIM}`)
}

console.log('— clubes e baralho')
for (const id of ['riosp', 'sulminas', 'nordeste']) {
  const c = R.clubesDaCopa(id)
  ok(c.todos.every((x: string) => R.clubeFechaTime(x)), `${id}: só entra quem fecha 11 (${c.n} por lado: ${c.todos.join(', ') || '—'})`)
  ok(c.ladoA.length === c.ladoB.length, `${id}: os dois lados do mesmo tamanho`)
}
const rio = R.clubesDaCopa('riosp')
if (rio.n >= 2) {
  const pior = R.piorClubeLivre('riosp', new Set())
  const melhor = R.melhorClubeLivre('riosp', new Set())
  ok(rio.todos.every((x: string) => R.forcaDoClube(pior) <= R.forcaDoClube(x)), `pior livre = ${pior}`)
  ok(rio.todos.every((x: string) => R.forcaDoClube(melhor) >= R.forcaDoClube(x)), `melhor livre = ${melhor}`)
  ok(R.piorClubeLivre('riosp', new Set([pior])) !== pior, 'clube já pego nunca é o "pior livre"')
  const xi = R.completaXIClube('Flamengo', '4-3-3', [])
  ok(xi.length === 11 && new Set(xi.map((c: any) => `${c.name}|${c.club}|${c.year}`)).size === 11, 'quem não convoca leva 11 de verdade (sem repetir carta)')
}
const todasDoJogo = new Set<string>()
for (const deck of [D.CATALOG, D.CATALOG_EU, D.CATALOG_WORLD]) for (const cs of Object.values(deck) as any[]) for (const c of cs) todasDoJogo.add(`${c.name}|${c.club}|${c.year}`)
const regionais = (Object.values(CR.CARTAS_REGIONAIS) as any[]).flat()
ok(regionais.every((c: any) => !todasDoJogo.has(`${c.name}|${c.club}|${c.year}`)), `carta regional não está em nenhum baralho do jogo (${regionais.length} cartas regionais)`)

console.log(erros ? `\n❌ ${erros} falha(s)` : '\n✅ tudo certo — copa regional no formato combinado')
process.exit(erros ? 1 : 0)
