// 🏀📡 trava da SALA NBA ONLINE (18/11): o dono joga a sala inteira (liga → Play-In → Playoffs → anel) e um CONVIDADO
// recebe cada atualização (SYNC_STATE), igual ao canal da sala. Confere que o convidado vê a MESMA coisa do dono a cada
// passo, que o assento dele (youIdx) nunca muda, que ele nunca vira dono, e que o baralho (NBA / NBA + Mundo) chega junto.
// Rodar: npm run sala-nba-online
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
const { reducer } = await import('../src/escalacao/store.tsx')
const { todasAsCartas } = await import('../src/escalacao/liga-draft.ts')
const { SECTORS } = await import('../src/escalacao/types.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }

for (const [tam, mundo] of [[30, false], [20, true], [10, false]] as const) {
  const gente = ['Dono', 'Convidado', 'Terceiro']
  let h: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  h = reducer(h, { type: 'START_ONLINE', roomId: 'r', roomCode: 'R', isHost: true, playerIndex: 0, playerNames: gente, formation: '4-3-3', sport: 'basquete', nbaTam: tam, nbaFormato: 'playoffs', nbaMundo: mundo } as any)
  let g: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  g = reducer(g, { type: 'START_ONLINE', roomId: 'r', roomCode: 'R', isHost: false, playerIndex: 1, playerNames: gente, formation: '4-3-3', sport: 'basquete', nbaTam: tam, nbaFormato: 'playoffs', nbaMundo: mundo } as any)
  const cartas = todasAsCartas('nba' as any); const usados = new Set<string>(); let k = 0
  for (const m of h.managers) m.squad = SECTORS.map((pos: string) => { const c = cartas.find((x: any) => x.pos === pos && !usados.has(x.name))!; usados.add(c.name); return { ...c, id: `c${k++}`, paid: 5, via: 'leilao' } })
  h.screen = 'cerimonia'; h = reducer(h, { type: 'FINISH_CEREMONY' } as any)
  const passos: [string, any][] = []
  const sync = () => { g = reducer(g, { type: 'SYNC_STATE', newState: JSON.parse(JSON.stringify(h)) } as any) }
  sync()
  let difs = 0, assento = 0, virouDono = 0, fases = new Set<string>()
  const confere = () => {
    if (g.youIdx !== 1) assento++
    if (g.isHost) virouDono++
    const a = JSON.stringify([h.round, h.screen, h.quickCopa?.phase, h.quickCopa?.legIdx, h.quickCopa?.ties?.map((t: any) => t.legs), h.league.map((t: any) => [t.id, t.w, t.l]), h.nbaSala, h.nbaConf, !!h.nbaMundo])
    const b = JSON.stringify([g.round, g.screen, g.quickCopa?.phase, g.quickCopa?.legIdx, g.quickCopa?.ties?.map((t: any) => t.legs), g.league.map((t: any) => [t.id, t.w, t.l]), g.nbaSala, g.nbaConf, !!g.nbaMundo])
    if (a !== b) difs++
    if (h.quickCopa?.phase) fases.add(h.quickCopa.phase)
  }
  confere()
  for (let i = 0; i < 200 && h.round < h.fixtures.length; i++) { h = reducer(h, { type: 'PLAY_ROUND' } as any); sync(); confere() }
  h = reducer(h, { type: 'FINISH_SEASON' } as any); sync(); confere()
  h = reducer(h, { type: 'START_COPA' } as any); sync(); confere()
  for (let i = 0; i < 400 && h.quickCopa && h.quickCopa.phase !== 'done'; i++) { h = reducer(h, { type: 'PLAY_COPA_LEG' } as any); sync(); confere() }
  ok(difs === 0, `${tam}${mundo ? ' (NBA + Mundo)' : ''}: convidado viu tudo igual ao dono (${difs} diferenças)`)
  ok(assento === 0 && virouDono === 0, `${tam}: o convidado nunca trocou de assento nem virou dono`)
  ok(h.quickCopa?.phase === 'done' && g.quickCopa?.champion?.id === h.quickCopa.champion.id, `${tam}: os dois veem o mesmo campeão (fases ${[...fases].join(' → ')})`)
  ok(g.nbaMundo === (mundo || undefined), `${tam}: o baralho escolhido chegou no convidado`)
}
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)
