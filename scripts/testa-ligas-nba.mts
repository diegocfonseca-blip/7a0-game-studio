// 🏀🏆📋 trava das LIGAS DO BASQUETE (19/11, Diego: *"siga o liga da turma e liga draft contando que é basquete"*).
// A Liga da Turma e a Liga Draft do basquete são a SALA NBA (franquias reais, 30/20/10 times, Leste/Oeste, Play-In/Playoffs
// melhor de 7) — e continuam assim temporada após temporada (a liga "não acaba"). Roda pelo reducer do dono.
//   npm run ligas-nba
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
const nowRef = { t: 1_800_000_000_000 }
Date.now = () => nowRef.t
const { reducer } = await import('../src/escalacao/store.tsx')
const { todasAsCartas } = await import('../src/escalacao/liga-draft.ts')
const { SECTORS } = await import('../src/escalacao/types.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }

function comElencos(s: any) {
  const cartas = todasAsCartas('nba' as any), usados = new Set<string>(); let k = 0
  for (const m of s.managers) m.squad = SECTORS.map((pos: string) => { const c = cartas.find((x: any) => x.pos === pos && !usados.has(x.name))!; usados.add(c.name); return { ...c, id: `c${k++}`, paid: 5, via: 'leilao' } })
  s.screen = 'cerimonia'
  return reducer(s, { type: 'FINISH_CEREMONY' } as any)
}
function joga(s: any) {
  for (let i = 0; i < 200 && s.round < s.fixtures.length; i++) s = reducer(s, { type: 'PLAY_ROUND' } as any)
  s = reducer(s, { type: 'FINISH_SEASON' } as any)
  const fases: string[] = []
  for (let i = 0; i < 400 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) { if (!fases.includes(s.quickCopa.phase)) fases.push(s.quickCopa.phase); s = reducer(s, { type: 'PLAY_COPA_LEG' } as any) }
  return { s, fases }
}
const GENTE = ['Garrafão do Zé', 'Rua 9', 'Quadra Norte']

// 🏆 LIGA DA TURMA · 20 times · Play-In + Playoffs · 2 temporadas
{
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_ONLINE', sport: 'basquete', liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'TURMA', isHost: true, playerIndex: 0, playerNames: GENTE, seatUids: ['u0', 'u1', 'u2'], youUid: 'u0', formation: '4-3-3', nbaTam: 20, nbaFormato: 'playoffs' } as any)
  ok(s.nbaSala?.tam === 20 && s.managers.length === 20, `Liga da Turma: sala NBA de 20 (${s.managers.length} times)`)
  ok(!!s.nbaConf && Object.values(s.nbaConf).filter(v => v === 'L').length === 10, 'Liga da Turma: Leste 10 × Oeste 10')
  s = comElencos(s)
  ok(s.fixtures.length === 38, `Liga da Turma: 38 jogos (deu ${s.fixtures.length})`)
  for (let temp = 1; temp <= 2; temp++) {
    const r = joga(s); s = r.s
    ok(r.fases[0] === 'playin' && s.quickCopa?.phase === 'done' && !!s.quickCopa.champion, `Liga da Turma T${temp}: Play-In → Playoffs → campeão (${r.fases.join(' → ')})`)
    if (temp === 1) {
      s = reducer(s, { type: 'REPLAY_SEASON' } as any)
      ok(s.seasonNo === 2 && s.round === 0 && !s.quickCopa && s.nbaSala?.tam === 20 && s.league.length === 20 && s.fixtures.length === 38 && s.screen === 'season',
        `Liga da Turma: a T2 começa no MESMO formato NBA (20 times, 38 jogos, tabela zerada)`)
      ok(s.managers.filter((m: any) => m.isHuman).length === 3, 'Liga da Turma: a turma continua a mesma na T2')
    }
  }
}

// 📋 LIGA DRAFT · 10 times · só a liga · liga → draft → T2
{
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_ONLINE', sport: 'basquete', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r2', roomCode: 'DRAFT', isHost: true, playerIndex: 0, playerNames: GENTE, seatUids: ['u0', 'u1', 'u2'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', nbaTam: 10, nbaFormato: 'liga' } as any)
  ok(s.minhaLigaDraft && s.nbaSala?.tam === 10 && s.managers.length === 10, `Liga Draft: sala NBA de 10 (${s.managers.length} times)`)
  s = comElencos(s)
  ok(s.fixtures.length === 36 && s.copaMode === 'liga', `Liga Draft: 36 jogos, só a liga (deu ${s.fixtures.length} · ${s.copaMode})`)
  const r = joga(s); s = r.s
  ok(!s.quickCopa && s.screen === 'end' && s.champion != null, `Liga Draft T1: só a liga, campeão pela campanha (tela ${s.screen})`)
  s = reducer(s, { type: 'DRAFT_ABRIR' } as any)
  ok(s.screen === 'draft', 'Liga Draft: depois da liga vem a noite do draft')
  for (let i = 0; i < 40 && s.screen === 'draft'; i++) {
    const d = s.draft
    if (d.fase === 'aguarda') s = reducer(s, { type: 'DRAFT_PULAR' } as any)
    else if (d.fase === 'escolha' || d.fase === 'revela') { nowRef.t += 70_000; s = reducer(s, { type: 'DRAFT_TICK' } as any) }
    else s = reducer(s, { type: 'DRAFT_SEGUIR' } as any)
  }
  ok(s.screen === 'season' && s.seasonNo === 2, `Liga Draft: chegou na T2 (${s.screen} · T${s.seasonNo} · ${s.draft?.fase ?? '-'})`)
  ok(s.nbaSala?.tam === 10 && s.league.length === 10 && s.fixtures.length === 36, `Liga Draft T2: mesmo formato NBA (10 times, ${s.fixtures.length} jogos)`)
  for (let i = 0; i < 5; i++) s = reducer(s, { type: 'PLAY_ROUND' } as any)
  ok(s.round >= 1, `Liga Draft T2 joga (rodada ${s.round})`)
}
console.log(falhas ? `❌ ${falhas} falha(s)` : 'TUDO OK')
process.exit(falhas ? 1 : 0)
