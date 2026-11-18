// 🏀📺 trava da QUADRA 2D (18/11): o roteiro fecha SEMPRE no placar do jogo, nunca anda pra trás, cesta de 3 sai de
// FORA da linha de 3 (regra do Diego), cesta de 2 de DENTRO, lance livre da linha, e a mesma entrada dá o mesmo roteiro.
// Rodar: npm run quadra2d
const { planoQuadra, placarEm, foraDaLinha3, QUADRA } = await import('../src/escalacao/quadra2d-plano.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }
let fecha = 0, anda = 0, tres = 0, dois = 0, ll = 0, total = 0, foraQuadra = 0, tempo = 0, nTres = 0, nCesta = 0, ptsTres = 0, ptsTot = 0
for (let s = 1; s <= 3000; s++) {
  const h = 72 + (s * 37) % 70, a = 72 + (s * 53) % 70
  const p = planoQuadra(s * 7919, h, a)
  total++
  if (p.casaFim !== h || p.foraFim !== a || placarEm(p, 93).casa !== h || placarEm(p, 93).fora !== a) fecha++
  let c = 0, f = 0, t = 0
  for (const l of p.lances) {
    if (l.casa < c || l.fora < f || l.t1 < l.t0 || l.t0 < t - 1e-9) anda++
    c = l.casa; f = l.fora; t = l.t1
    if (l.t0 < 0 || l.t1 > 93) tempo++
    if (l.x < 47 || l.x > 94 || l.y < 0 || l.y > 50) foraQuadra++
    if (l.pts === 3 && !foraDaLinha3(l.x, l.y)) tres++
    if (l.pts === 2 && foraDaLinha3(l.x, l.y)) dois++
    if (l.tipo === 'lance' && (Math.abs(l.x - QUADRA.linhaLL) > 0.01)) ll++
    if (l.pts === 3) { nTres++; ptsTres += 3 }
    if (l.pts > 0) nCesta++
    ptsTot += l.pts
  }
}
ok(fecha === 0, `o roteiro fecha no placar do jogo (${total} jogos, ${fecha} errados)`)
ok(anda === 0, 'o placar nunca anda pra trás e o tempo só vai pra frente')
ok(tempo === 0 && foraQuadra === 0, 'tudo dentro do relógio (0–93) e da meia-quadra do ataque')
ok(tres === 0, `cesta de 3 SEMPRE de fora da linha de 3 (${tres} fora da regra)`)
ok(dois === 0, `cesta de 2 SEMPRE de dentro da linha (${dois} fora da regra)`)
ok(ll === 0, 'lance livre sai da linha do lance livre')
const pct3 = ptsTres / ptsTot
ok(pct3 > 0.25 && pct3 < 0.42, `bola de 3 = ${(pct3 * 100).toFixed(0)}% dos pontos (NBA ~35%)`)
const a = JSON.stringify(planoQuadra(42, 101, 97)), b = JSON.stringify(planoQuadra(42, 101, 97))
ok(a === b, 'mesma entrada = mesmo roteiro (a sala inteira vê igual)')
ok(placarEm(planoQuadra(42, 101, 97), 0).casa === 0, 'no apito inicial o placar é 0 × 0 (sem spoiler)')
// canto: a linha reta fica a 3 pés da lateral — dentro dela é 2
ok(!foraDaLinha3(89, 5) && foraDaLinha3(89, 1.5) && foraDaLinha3(60, 25) && !foraDaLinha3(75, 25), 'linha de 3 medida como na NBA (canto e arco)')
// 📊 18/11: com os pontos de cada jogador do jogo, a quadra dá a cada um EXATAMENTE os pontos da estatística dele
{
  let erradas = 0, cadaUm = 0
  for (let s = 1; s <= 1500; s++) {
    const pc = [5, 4, 3, 2, 1].map((w, i) => 4 + ((s * (i + 3) * 37) % 30) + w)
    const pf = [3, 5, 2, 4, 1].map((w, i) => 2 + ((s * (i + 5) * 53) % 28) + w)
    const h = pc.reduce((a, b) => a + b, 0), a = pf.reduce((a2, b) => a2 + b, 0)
    const p = planoQuadra(s * 104729, h, a, [], [], pc, pf)
    if (p.casaFim !== h || p.foraFim !== a) erradas++
    for (const [lado, alvo] of [['casa', pc], ['fora', pf]] as const) {
      const soma = [0, 0, 0, 0, 0]
      for (const l of p.lances) if (l.lado === lado) soma[l.quem] += l.pts
      if (soma.some((v, i) => v !== alvo[i])) cadaUm++
    }
    for (const l of p.lances) if ((l.pts === 3 && !foraDaLinha3(l.x, l.y)) || (l.pts === 2 && foraDaLinha3(l.x, l.y))) erradas++
  }
  ok(erradas === 0 && cadaUm === 0, `com os pontos do jogo: cada jogador faz na quadra exatamente os pontos da estatística (${cadaUm} diferentes em 1500 jogos)`)
}
// e o jogo de verdade entrega esses pontos (somam o placar do time)
{
  const mem = new Map<string, string>()
  ;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
  const { reducer } = await import('../src/escalacao/store.tsx')
  const { todasAsCartas } = await import('../src/escalacao/liga-draft.ts')
  const { SECTORS } = await import('../src/escalacao/types.ts')
  let st: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  st = reducer(st, { type: 'START_ONLINE', roomId: 'q', roomCode: 'Q', isHost: true, playerIndex: 0, playerNames: ['A', 'B'], formation: '4-3-3', sport: 'basquete', nbaTam: 10, nbaFormato: 'playoffs' } as any)
  const cartas = todasAsCartas('nba' as any); const usados = new Set<string>(); let k = 0
  for (const m of st.managers) m.squad = SECTORS.map((pos: string) => { const c = cartas.find((x: any) => x.pos === pos && !usados.has(x.name))!; usados.add(c.name); return { ...c, id: `c${k++}`, paid: 5, via: 'leilao' } })
  st.screen = 'cerimonia'; st = reducer(st, { type: 'FINISH_CEREMONY' } as any)
  let bate = 0, jogos = 0
  for (let i = 0; i < 20; i++) {
    st = reducer(st, { type: 'PLAY_ROUND' } as any)
    for (const r of st.lastResults) if (r.bbPts) { jogos++; const s1 = (r.bbPts[r.homeId] ?? []).reduce((a: number, x: any) => a + x.p, 0), s2 = (r.bbPts[r.awayId] ?? []).reduce((a: number, x: any) => a + x.p, 0); if (s1 === r.hg && s2 === r.ag) bate++ }
  }
  ok(jogos > 0 && bate === jogos, `o jogo guarda os pontos de cada jogador e eles somam o placar (${bate}/${jogos} jogos com gente)`)
}
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)
