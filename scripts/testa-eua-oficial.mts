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
// 🔨 leilão de abertura com a SOBRA das franquias (Celtics tem 27 cartas, só 15 jogam)
ok(s.screen === 'auction' && s.oficialAbertura, `abre o leilão de abertura com a sobra (${s.screen})`)
const donos = new Set(s.managers.flatMap((m: any) => m.squad.map((c: any) => `${c.name}|${c.club}|${c.year}`)))
const noLeilao = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].flatMap(p => s.deck[p])
ok(noLeilao.length > 0 && noLeilao.every((c: any) => !donos.has(`${c.name}|${c.club}|${c.year}`)), `leilão só com carta sem dono (${noLeilao.length} cartas)`)
ok(s.managers.every((m: any) => ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].every(p => m.aberturaBase?.[p] === m.squad.filter((c: any) => c.pos === p).length)), 'cada franquia leva no máximo +1 por posição')
ok(s.managers.filter((m: any) => !m.isHuman).every((m: any) => m.money > 0), 'os bots têm caixa pra dar lance')
s.screen = 'cerimonia'; s = reducer(s, { type: 'FINISH_CEREMONY' } as any)
ok(s.screen === 'season' && !s.oficialAbertura && s.managers.every((m: any) => !m.aberturaBase) && s.fixtures.length === 82 && s.nbaSala?.tam === 30, `fim do leilão: 82 jogos, sem a marca da abertura (${s.screen}, ${s.fixtures.length})`)
// 🏆 NBA Cup real: grupos de 2026, jogos de grupo = o 1º encontro no calendário (contam na tabela), 8 no mata-mata
ok(s.euaCup?.grupos.length === 6 && s.euaCup.grupos.every((g: any) => g.times.length === 5) && s.euaCup.grupos[1].times.includes('Knicks') && s.euaCup.grupos[4].times.includes('Pelicans'), 'NBA Cup: os 6 grupos reais de 2026')
let rCup = -1
for (let i = 0; i < 200 && s.round < s.fixtures.length; i++) {
  s = reducer(s, { type: 'PLAY_ROUND' } as any)
  if (s.nbaCup && rCup < 0) {
    rCup = s.round
    ok(Object.keys(s.euaCup.jogos).length === 60 && s.euaCup.fechado, `NBA Cup: 60 jogos de grupo e fase fechada (rodada ${rCup})`)
    const conf = (n: string) => NBA_LESTE.includes(n) ? 'L' : 'O'
    const ts = s.nbaCup.ties
    ok(ts.length === 4 && conf(ts[0].aName) === 'L' && conf(ts[1].bName) === 'L' && conf(ts[2].aName) === 'O' && conf(ts[3].bName) === 'O', `NBA Cup: quartas dentro da conferência (${ts.map((t: any) => t.aName + '×' + t.bName).join(' · ')})`)
    const tab = JSON.stringify(s.league)
    for (let k = 0; k < 20 && s.nbaCup.phase !== 'done'; k++) s = reducer(s, { type: 'PLAY_NBA_CUP_ROUND' } as any)
    ok(s.nbaCup.phase === 'done' && !!s.nbaCup.champion && JSON.stringify(s.league) === tab, `NBA Cup: campeão (${s.nbaCup.champion?.name}), e o mata-mata não mexe na tabela`)
  }
}
ok(rCup > 0 && rCup <= 29, `NBA Cup acontece no começo da temporada (rodada ${rCup})`)
s = reducer(s, { type: 'FINISH_SEASON' } as any)
const fases: string[] = []
for (let i = 0; i < 600 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) { if (!fases.includes(s.quickCopa.phase)) fases.push(s.quickCopa.phase); s = reducer(s, { type: 'PLAY_COPA_LEG' } as any) }
ok(fases[0] === 'playin' && s.quickCopa?.phase === 'done' && !!s.quickCopa.champion, `Play-In → Playoffs → campeão (${fases.join(' → ')})`)
s.screen = 'end'
s = reducer(s, { type: 'CLOSE_NBA_BOOKS' } as any)
s = reducer(s, { type: 'NEXT_NBA_SEASON' } as any)
ok(s.seasonNo === 2 && s.nbaTier === 'nba' && s.euaOficial?.franquia === 'Pelicans', 'T2: continua na NBA, com os Pelicans (sem sobe e desce)')
ok(s.euaCup?.temporada === 2 && Object.keys(s.euaCup.jogos).length === 0 && !s.nbaCup && s.euaCup.grupos.every((g: any) => g.times.length === 5) && new Set(s.euaCup.grupos.flatMap((g: any) => g.times)).size === 30, 'T2: grupos novos da NBA Cup, sorteados')
ok(s.managers.length === 30 && s.managers[0].squad.length === 15 && s.managers[0].nbaSlots === 3, 'T2: as mesmas 30, você com os 15')
ok(s.fixtures.length === 82 && (s.screen === 'season' || s.screen === 'auction'), `T2: 82 jogos (${s.screen})`)
let s2: any = reducer(s, { type: 'START_NBA_CAREER', teamName: 'Rua' } as any)
ok(!s2.euaOficial && s2.nbaTier === 'street' && !s2.nbaSala, 'carreira de sempre depois não herda o EUA Oficial')
console.log(falhas ? `❌ ${falhas} falha(s)` : 'TUDO OK')
process.exit(falhas ? 1 : 0)
