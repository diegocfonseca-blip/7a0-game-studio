// 🌍 trava do BARALHO MUNDO do basquete (18/11, pedido do Diego): dois baralhos — "🏀 NBA" (só carta de franquia da NBA)
// e "🌍 NBA + Mundo" (as de fora entram JUNTO, nunca sozinhas). No mesmo baralho, ninguém repete; carta do Mundo nunca é
// de franquia da NBA; régua de força igual à da NBA; bio PT e EN; e o futebol/carreira nunca veem o Mundo.
// Rodar: npm run baralho-mundo-nba
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
const { reducer } = await import('../src/escalacao/store.tsx')
const { CATALOG_NBA } = await import('../src/escalacao/data-basquete.ts')
const { CATALOG_NBA_MUNDO, NBA_MUNDO_TOTAL } = await import('../src/escalacao/data-basquete-mundo.ts')
const { NBA_CLUBS } = await import('../src/escalacao/basquete-deck.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }

const mundo = Object.values(CATALOG_NBA_MUNDO).flat() as any[]
const nba = Object.values(CATALOG_NBA).flat() as any[]
ok(NBA_MUNDO_TOTAL >= 100, `Mundo com ${NBA_MUNDO_TOTAL} cartas`)
const nomes = mundo.map(c => c.name); const rep = nomes.filter((n, i) => nomes.indexOf(n) !== i)
ok(rep.length === 0, `ninguém repetido dentro do Mundo ${rep.join(', ')}`)
const franquias = new Set([...NBA_CLUBS.map((c: any) => c.name), ...nba.map(c => c.club)])
const daNba = mundo.filter(c => franquias.has(c.club))
ok(daNba.length === 0, `nenhuma carta do Mundo é de franquia da NBA ${daNba.map(c => c.name + '/' + c.club).join(', ')}`)
const faixa: Record<number, [number, number]> = { 5: [86, 99], 4: [80, 92], 3: [74, 90], 2: [70, 86], 1: [55, 80] }
const fora = mundo.filter(c => c.lo < faixa[c.fame][0] || c.hi > faixa[c.fame][1] || c.lo >= c.hi)
ok(fora.length === 0, `força na régua da NBA ${fora.map(c => c.name).join(', ')}`)
ok(mundo.every(c => c.bioPt?.trim() && c.bioEn?.trim() && c.bioPt !== c.bioEn), 'toda carta com bio PT e EN')
ok(mundo.some(c => c.name === 'Oscar Schmidt' && c.club === 'Caserta' && c.year === 1987 && c.fame === 5), 'Oscar = lenda no Caserta 1987 (aprovado pelo Diego)')

const nomesDeck = (s: any) => new Set(Object.values(s.deck ?? {}).flat().map((c: any) => `${c.name}|${c.club}|${c.year}`))
const temMundo = (s: any) => { const d = nomesDeck(s); return mundo.some(c => d.has(`${c.name}|${c.club}|${c.year}`)) }
function sala(nbaMundo: boolean, sport = 'basquete', extra: any = {}) {
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  return reducer(s, { type: 'START_ONLINE', roomId: 'x', roomCode: 'X', isHost: true, playerIndex: 0, playerNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], formation: '4-3-3', sport, nbaTam: 30, nbaFormato: 'playoffs', nbaMundo, ...extra } as any)
}
const sN = sala(false), sM = sala(true)
ok(!sN.nbaMundo && !temMundo(sN), 'sala "🏀 NBA": nenhuma carta do Mundo no pregão')
ok(sM.nbaMundo === true && temMundo(sM), 'sala "🌍 NBA + Mundo": cartas do Mundo no pregão')
ok(Object.values(sM.deck).flat().some((c: any) => nba.some(n => n.name === c.name && n.club === c.club)), 'NBA + Mundo também tem cartas da NBA (o Mundo nunca joga sozinho)')
// convidado/F5: o estado manda (reancora pelo nbaMundo)
const sync = reducer(sN, { type: 'SYNC_STATE', newState: sM } as any)
ok(!!sync && sync.nbaMundo === true, 'convidado recebe o estado da sala com o baralho Mundo')
// offline
{
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_NBA', teamName: 'Z', rivals: 7, nbaTam: 30, nbaFormato: 'playoffs', nbaMundo: true } as any)
  ok(s.nbaMundo === true && temMundo(s), 'Partida Rápida offline: NBA + Mundo')
  s = reducer(s, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_NBA', teamName: 'Z', rivals: 7, nbaTam: 30, nbaFormato: 'playoffs' } as any)
  ok(!s.nbaMundo && !temMundo(s), 'Partida Rápida offline: sem escolher, só NBA (não herda)')
}
// futebol nunca vê
{
  const f = sala(true, 'futebol')
  const d = nomesDeck(f); const vaz = mundo.filter(c => d.has(`${c.name}|${c.club}|${c.year}`)).map(c => c.name + '|' + c.club)
  ok(!f.nbaMundo && vaz.length === 0, `futebol: pedir Mundo não muda nada ${vaz.join(', ')} ${f.nbaMundo}`)
}
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)
