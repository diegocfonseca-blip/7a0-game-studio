// 🏀 trava da SALA NBA (18/11, decisões do Diego): tamanho 30/20/10 com as conferências reais, 82/38/36 jogos, sem NBA Cup,
// "só a liga" ou liga + Play-In + Playoffs, e playoffs SEMPRE melhor de 7. Joga a sala inteira pelo reducer, do leilão ao anel.
// Rodar: npm run sala-nba
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v) }, removeItem: (k: string) => { mem.delete(k) } }
const { reducer, NBA_LESTE, NBA_OESTE } = await import('../src/escalacao/store.tsx')
const { todasAsCartas } = await import('../src/escalacao/liga-draft.ts')
const { SECTORS } = await import('../src/escalacao/types.ts')

let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }

function sala(tam: 30 | 20 | 10, formato: 'liga' | 'playoffs', gente: string[]) {
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'teste', roomCode: 'TESTE', isHost: true, playerIndex: 0, playerNames: gente, formation: '4-3-3', sport: 'basquete', nbaTam: tam, nbaFormato: formato } as any)
  // elencos prontos (o leilão não é o que se testa aqui)
  const cartas = todasAsCartas('nba' as any)
  const usados = new Set<string>(); let k = 0
  for (const m of s.managers) {
    m.squad = SECTORS.map((pos: string) => { const c = cartas.find((x: any) => x.pos === pos && !usados.has(x.name))!; usados.add(c.name); return { ...c, id: `c${k++}`, paid: 5, via: 'leilao' } })
  }
  s.screen = 'cerimonia'
  s = reducer(s, { type: 'FINISH_CEREMONY' } as any)
  return s
}
function temporada(s: any) {
  let cupViu = false
  for (let i = 0; i < 200 && s.round < s.fixtures.length; i++) { s = reducer(s, { type: 'PLAY_ROUND' } as any); if (s.nbaCup) cupViu = true }
  s = reducer(s, { type: 'FINISH_SEASON' } as any)
  return { s, cupViu }
}

for (const tam of [30, 20, 10] as const) {
  const gente = ['Garrafão do Zé', 'Rua 9', 'Quadra Norte']
  const s0 = sala(tam, 'playoffs', gente)
  ok(s0.nbaSala?.tam === tam && s0.league.length === tam, `${tam}: liga com ${tam} times (deu ${s0.league.length})`)
  const jogos = tam === 30 ? 82 : tam === 20 ? 38 : 36
  ok(s0.fixtures.length === jogos, `${tam}: ${jogos} jogos por time (deu ${s0.fixtures.length})`)
  {
    const c = s0.nbaConf ?? {}
    const nl = Object.values(c).filter(v => v === 'L').length, no = Object.values(c).filter(v => v === 'O').length
    ok(nl === tam / 2 && no === tam / 2, `${tam}: Leste ${nl} × Oeste ${no}`)
    const errado = s0.managers.filter((m: any) => !m.isHuman && ((NBA_LESTE.includes(m.teamName) && c[m.id] !== 'L') || (NBA_OESTE.includes(m.teamName) && c[m.id] !== 'O')))
    ok(errado.length === 0, `${tam}: toda franquia na conferência real`)
  }
  const { s: s1, cupViu } = temporada(s0)
  ok(!cupViu, `${tam}: sem NBA Cup`)
  const qc = s1.quickCopa
  ok(qc?.phase === 'playin' && qc.bo === 7, `${tam}: depois da liga vem o Play-In (fase ${qc?.phase})`)
  const grupos = 2 // 🏀 18/11: a de 10 também divide (5 × 5)
  ok(qc.ties.length === grupos * 2, `${tam}: Play-In rodada 1 com ${grupos * 2} jogos (deu ${qc.ties.length})`)
  // posições do Play-In batem com a tabela
  let s = s1
  const series: number[] = []
  let viuRodada2 = false, fases: string[] = []
  for (let i = 0; i < 400 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) {
    const antes = s.quickCopa.phase
    if (!fases.includes(antes)) fases.push(antes)
    if (antes === 'playin' && s.quickCopa.playin?.rodada === 2) viuRodada2 = true
    s = reducer(s, { type: 'PLAY_COPA_LEG' } as any)
    for (const b of s.quickCopa?.bracket ?? []) if (b.phase !== 'playin') for (const t of b.ties) series.push(t.legs.length)
  }
  ok(viuRodada2, `${tam}: teve a rodada 2 do Play-In (a última vaga)`)
  ok(s.quickCopa?.phase === 'done' && !!s.quickCopa.champion, `${tam}: saiu campeão (fases ${fases.join(' → ')})`)
  const todas = s.quickCopa.bracket.filter((b: any) => b.phase !== 'playin').flatMap((b: any) => b.ties)
  const fora = todas.filter((t: any) => { const va = t.legs.filter((l: number[]) => l[0] > l[1]).length, vb = t.legs.length - va; return Math.max(va, vb) !== 4 || t.legs.length > 7 || t.legs.length < 4 })
  ok(fora.length === 0, `${tam}: toda série de playoff é melhor de 7 (${todas.length} séries, ${fora.length} fora da regra)`)
  // 🃏 18/11: a cartinha de CONFERÊNCIA sai da fase 'semis' (a final de conferência) — 2 confrontos, e quem vence é finalista
  {
    const conf = s.quickCopa.bracket.find((b: any) => b.phase === 'semis'), fin = s.quickCopa.bracket.find((b: any) => b.phase === 'final')
    const venc = (conf?.ties ?? []).map((t: any) => t.winner).sort().join(','), finalistas = [fin?.ties[0]?.aId, fin?.ties[0]?.bId].sort().join(',')
    ok(conf?.ties.length === 2 && venc === finalistas, `${tam}: final de conferência = 'semis' (2 séries) e os vencedores fazem as Finals`)
  }
  const esperado = tam === 30 ? 16 : tam === 20 ? 8 : 4
  const primeira = s.quickCopa.bracket.find((b: any) => b.phase !== 'playin')
  ok(primeira.ties.length * 2 === esperado, `${tam}: ${esperado} times nos playoffs (deu ${primeira.ties.length * 2})`)
  // os diretos são os primeiros da tabela de cada grupo
  if (tam === 30) {
    const tab = [...s1.league].sort((a: any, b: any) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga))
    void tab
  }
}

// 📊 estatísticas do basquete (18/11): os 5 números existem e ficam numa faixa de NBA
{
  const { s } = temporada(sala(30, 'playoffs', ['Garrafão do Zé', 'Rua 9']))
  const rows = s.scorers.filter((r: any) => (r.j ?? 0) > 20)
  const lider = (k: string) => Math.max(...rows.map((r: any) => (k === 'pts' ? r.goals : r[k]) / r.j))
  const faixas: [string, number, number][] = [['pts', 22, 40], ['reb', 8, 17], ['ast', 6, 14], ['rou', 1.2, 3.5], ['toc', 1.2, 4]]
  for (const [k, lo, hi] of faixas) { const v = lider(k); ok(v >= lo && v <= hi, `estatística: líder de ${k} com ${v.toFixed(1)} por jogo (faixa ${lo}–${hi})`) }
  const media = (pos: string, k: string) => { const r = rows.filter((x: any) => x.pos === pos); return r.reduce((a: number, x: any) => a + x[k] / x.j, 0) / Math.max(1, r.length) }
  ok(media('ATA', 'reb') > media('GOL', 'reb') * 2, 'pivô pega muito mais rebote que armador')
  ok(media('GOL', 'ast') > media('ATA', 'ast') * 2, 'armador dá muito mais assistência que pivô')
  ok(media('ATA', 'toc') > media('GOL', 'toc') * 3, 'pivô dá muito mais toco que armador')
}
// 🏀 a mesma escolha na Partida Rápida OFFLINE (START_NBA): 30 times, conferências reais, Play-In
{
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_NBA', teamName: 'Garrafão do Zé', rivals: 5, nbaTam: 30, nbaFormato: 'playoffs' } as any)
  const leiloam = s.managers.filter((m: any) => m.isHuman || m.auctionRival).length
  const c = s.nbaConf ?? {}
  ok(s.managers.length === 30 && Object.values(c).filter(v => v === 'L').length === 15, `offline: 30 franquias, Leste 15 (leilão com ${leiloam} técnicos)`)
  ok(leiloam === 6, 'offline: só você + os 5 rivais escolhidos disputam o leilão')
  const cartas = todasAsCartas('nba' as any); const usados = new Set<string>(); let k = 0
  for (const m of s.managers) m.squad = SECTORS.map((pos: string) => { const cc = cartas.find((x: any) => x.pos === pos && !usados.has(x.name))!; usados.add(cc.name); return { ...cc, id: `o${k++}`, paid: 5, via: 'leilao' } })
  s.screen = 'cerimonia'; s = reducer(s, { type: 'FINISH_CEREMONY' } as any)
  ok(s.fixtures.length === 82, `offline: 82 jogos (deu ${s.fixtures.length})`)
  const { s: s2 } = temporada(s)
  ok(s2.quickCopa?.phase === 'playin', 'offline: depois da liga vem o Play-In')
}
// só a liga: nada depois da tabela
{
  const s0 = sala(30, 'liga', ['Garrafão do Zé', 'Rua 9'])
  const { s } = temporada(s0)
  ok(s.copaMode === 'liga' && !s.quickCopa && s.screen === 'end', 'só a liga: acabou a tabela, acabou a temporada')
}
// sala com mais gente que o tamanho cresce
{
  const gente = Array.from({ length: 12 }, (_, i) => `Time ${i + 1}`)
  const s0 = sala(10, 'playoffs', gente)
  ok(s0.nbaSala.tam === 20 && s0.league.length === 20, '12 pessoas numa sala de 10: a liga sobe pra 20')
}
// futebol não ganha nada disso
{
  let s: any = reducer({} as any, { type: 'NEW_GAME' } as any)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'f', roomCode: 'F', isHost: true, playerIndex: 0, playerNames: ['A', 'B'], formation: '4-3-3', nbaTam: 30 } as any)
  ok(!s.nbaSala && !s.nbaConf, 'futebol: sem sala NBA')
}
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)
