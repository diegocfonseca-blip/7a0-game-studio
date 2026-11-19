// 🏀🇺🇸 trava da CARREIRA EUA OFICIAL (19/11). Escolhe uma franquia → a liga é a NBA real (30 franquias, cada uma com as cartas
// DELA, Leste/Oeste reais, 82 jogos, Play-In + Playoffs melhor de 7), sem sobe e desce, e a T2 segue igual.
//   npm run eua-oficial
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
const { reducer, NBA_LESTE } = await import('../src/escalacao/store.tsx')
const { cartasEuaComoCard } = await import('../src/escalacao/eua-oficial-cartas.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }
const LINHAGEM: Record<string, string> = { Sonics: 'Thunder', SuperSonics: 'Thunder', Bullets: 'Wizards', Royals: 'Kings', Bobcats: 'Hornets', Braves: 'Clippers', Nationals: 'Sixers', Blazers: 'Trail Blazers' }

let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
s = reducer(s, { type: 'START_EUA_CAREER', franquia: 'Pelicans', extras: cartasEuaComoCard() } as any)
ok(s.euaOficial?.franquia === 'Pelicans' && s.nbaCareer && s.sport === 'basquete', 'começa a carreira EUA Oficial com os Pelicans')
ok(s.managers.length === 30 && s.managers[0].teamName === 'Pelicans' && s.managers[0].isHuman && s.managers.filter((m: any) => m.isHuman).length === 1, '30 franquias, você é os Pelicans')
ok(new Set(s.managers.map((m: any) => m.teamName)).size === 30, 'nenhuma franquia repetida')
ok(s.managers.every((m: any) => m.squad.length === 15), `todo elenco tem 15 (${[...new Set(s.managers.map((m: any) => m.squad.length))].join(',')})`)
ok(s.managers.every((m: any) => m.squad.every((c: any) => (LINHAGEM[c.club] ?? c.club) === m.teamName)), 'cada franquia só tem cartas DELA')
ok(s.managers.every((m: any) => ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].every(p => m.squad.some((c: any) => c.pos === p))), 'todo time fecha o quinteto (1+ por posição)')
const nomes = s.managers.flatMap((m: any) => m.squad.map((c: any) => `${c.name}|${c.club}|${c.year}`))
ok(nomes.length === new Set(nomes).size, 'nenhuma carta em dois times')
ok(s.managers.every((m: any) => (s.nbaConf[m.id] === 'L') === NBA_LESTE.includes(m.teamName)), 'Leste/Oeste reais (inclusive a sua franquia)')
ok(s.screen === 'season' && s.fixtures.length === 82 && s.nbaSala?.tam === 30, `82 jogos, direto na temporada (${s.screen}, ${s.fixtures.length})`)
for (let i = 0; i < 200 && s.round < s.fixtures.length; i++) s = reducer(s, { type: 'PLAY_ROUND' } as any)
s = reducer(s, { type: 'FINISH_SEASON' } as any)
const fases: string[] = []
for (let i = 0; i < 600 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) { if (!fases.includes(s.quickCopa.phase)) fases.push(s.quickCopa.phase); s = reducer(s, { type: 'PLAY_COPA_LEG' } as any) }
ok(fases[0] === 'playin' && s.quickCopa?.phase === 'done' && !!s.quickCopa.champion, `Play-In → Playoffs → campeão (${fases.join(' → ')})`)
s.screen = 'end'
s = reducer(s, { type: 'CLOSE_NBA_BOOKS' } as any)
s = reducer(s, { type: 'NEXT_NBA_SEASON' } as any)
ok(s.seasonNo === 2 && s.nbaTier === 'nba' && s.euaOficial?.franquia === 'Pelicans', 'T2: continua na NBA, com os Pelicans (sem sobe e desce)')
ok(s.managers.length === 30 && s.managers[0].squad.length === 15 && s.managers[0].nbaSlots === 3, 'T2: as mesmas 30, você com os 15')
ok(s.fixtures.length === 82 && (s.screen === 'season' || s.screen === 'auction'), `T2: 82 jogos (${s.screen})`)
let s2: any = reducer(s, { type: 'START_NBA_CAREER', teamName: 'Rua' } as any)
ok(!s2.euaOficial && s2.nbaTier === 'street' && !s2.nbaSala, 'carreira de sempre depois não herda o EUA Oficial')
console.log(falhas ? `❌ ${falhas} falha(s)` : 'TUDO OK')
process.exit(falhas ? 1 : 0)
