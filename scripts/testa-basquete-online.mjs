// 🏀🌐 ONLINE DO BASQUETE — confere no MOTOR (não na tela) que a sala online de
// basquete nasce certa e que o futebol não muda NADA.
// Rodar: npx tsx scripts/testa-basquete-online.mjs   (sai 1 se algo quebrar)
import { reducer, __resolveQuickCopaTie as resolveTie, __seedQuickCopa as seedCopa, __seedNbaCup as seedCup, __sincronizaNiveis as sincroniza } from '../src/escalacao/store.tsx'
import { basketClockLabel, MATCH_TICKS } from '../src/escalacao/sportcfg.ts'
import { CATALOG_NBA } from '../src/escalacao/data-basquete.ts'
const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

const base = () => ({ managers: [], stock: {}, deck: {}, screen: 'lobby', seasonVotes: {}, tactics: {} })
const sala = (extra = {}) => ({
  type: 'START_ONLINE', roomId: 'r1', roomCode: 'ABC123', isHost: true, playerIndex: 0,
  playerNames: ['Eu', 'Amigo'], formation: '4-3-3', ...extra,
})

console.log('1) sala de BASQUETE: baralho NBA, quinteto de 5, franquias e caixa de 50')
const nba = reducer(base(), sala({ sport: 'basquete' }))
ok(nba.sport === 'basquete', 'o estado da sala diz basquete (viaja pro convidado no sync)')
ok(nba.nbaCareer === false, 'não é a carreira salva do basquete (é sala online)')
const eu = nba.managers[nba.youIdx]
ok(eu && eu.isHuman && eu.teamName === 'Eu', `meu time na sala: ${eu?.teamName}`)
ok(nba.managers.length === 20, `tabela de 20 times (${nba.managers.length})`)
ok(nba.managers.filter(m => m.isHuman).every(m => m.money === 50), 'quem disputa o pregão começa com 50 moedas (5 jogadores ≈ 10 cada, igual ao futebol)')
const FRANQUIAS = new Set(['Lakers', 'Celtics', 'Bulls', 'Warriors', 'Heat', 'Spurs', 'Knicks', 'Nets', 'Bucks', 'Suns', 'Nuggets', 'Mavericks', 'Clippers', 'Sixers', 'Raptors', 'Grizzlies', 'Kings', 'Magic', 'Pistons', 'Hornets', 'Hawks', 'Cavaliers', 'Pacers', 'Thunder', 'Trail Blazers', 'Jazz', 'Pelicans', 'Wizards', 'Rockets', 'Timberwolves'])
const bots = nba.managers.filter(m => !m.isHuman)
ok(bots.length > 0 && bots.every(m => FRANQUIAS.has(m.teamName)), `os adversários são franquias da NBA (ex.: ${bots.slice(0, 3).map(m => m.teamName).join(', ')})`)
const cartasNba = Object.values(nba.deck).flat()
ok(cartasNba.length > 0, `o pregão tem ${cartasNba.length} cartas`)
// franquias NBA de TODAS as eras (Royals viraram Kings; Nationals viraram 76ers)
const CLUBES_NBA = /Bulls|Lakers|Celtics|Heat|Warriors|Spurs|Knicks|Nets|Suns|Bucks|Rockets|Magic|Sixers|76ers|Jazz|Pistons|Hawks|Kings|Pacers|Blazers|Mavericks|Cavaliers|Raptors|Nuggets|Clippers|Wizards|Grizzlies|Thunder|Hornets|Pelicans|Timberwolves|Sonics|Bullets|Royals|Nationals|Pipers|Squires|Colonels|Stags|Capitols|Bombers|Olympians|Packers|Zephyrs|Rens/
const reais = cartasNba.filter(c => !c.fake)
ok(reais.length > 0 && reais.every(c => CLUBES_NBA.test(c.club)), 'toda carta REAL do pregão é de franquia NBA (nenhum jogador de futebol vazou)')

console.log('2) as vagas: QUINTETO (1 por posição), não o XI do futebol')
const bot = bots[0]
ok(bot.squad.length === 5, `o elenco do bot tem 5 (quinteto) — veio ${bot.squad.length}`)
const porPos = {}
for (const c of bot.squad) porPos[c.pos] = (porPos[c.pos] ?? 0) + 1
ok(['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].every(p => porPos[p] === 1), `1 por posição: ${JSON.stringify(porPos)}`)

console.log('3) sala de FUTEBOL segue idêntica (nenhuma linha nova no caminho dela)')
const fut = reducer(base(), sala())
ok(fut.sport === 'futebol', 'sala sem `sport` = futebol, como sempre')
ok(fut.managers.filter(m => m.isHuman).every(m => m.money === 100), 'caixa de 100 no futebol (intocado)')
const botF = fut.managers.find(m => !m.isHuman)
ok(botF.squad.length === 11, `elenco do bot de futebol = 11 (XI) — veio ${botF.squad.length}`)
const cartasFut = Object.values(fut.deck).flat().filter(c => !c.fake)
ok(cartasFut.length > 0 && !cartasFut.every(c => CLUBES_NBA.test(c.club)), 'o baralho do futebol continua de futebol')

console.log('4) 🔁 o CONVIDADO (sync) reancora no esporte da sala — não volta pro futebol')
// o convidado recebe o estado do host; o motor dele tem que trocar pro baralho NBA.
const convidado = reducer(fut, { type: 'SYNC_STATE', newState: { ...nba, youIdx: 1 } })
ok(convidado.sport === 'basquete', 'o convidado passa a ver a sala como basquete')
const depois = reducer(base(), sala({ sport: 'basquete', roomCode: 'XYZ789' }))
const reais2 = Object.values(depois.deck).flat().filter(c => !c.fake)
ok(reais2.every(c => CLUBES_NBA.test(c.club)), 'e uma sala nova DEPOIS do sync continua montando baralho NBA (o ponteiro não ficou no futebol)')
const fut2 = reducer(base(), sala({ roomCode: 'FUT111' }))
const reaisF2 = Object.values(fut2.deck).flat().filter(c => !c.fake)
ok(!reaisF2.every(c => CLUBES_NBA.test(c.club)), 'e uma sala de FUTEBOL depois de uma de basquete volta pro baralho de futebol')

console.log('5) 🏀 mata-mata: empate no agregado vai pra PRORROGAÇÃO (não pênaltis)')
const tieNba = { aId: 0, bId: 1, aName: 'Lakers', bName: 'Celtics', legs: [[100, 90], [90, 100]], winner: null }
resolveTie(tieNba, mulberry(7), true)
ok(tieNba.ot === true, 'o desempate do basquete é marcado como prorrogação (a tela escreve PRORROGAÇÃO)')
ok(tieNba.pens && tieNba.pens[0] !== tieNba.pens[1], `placar da prorrogação: ${tieNba.pens?.join(' × ')} (nunca empatado)`)
ok(tieNba.pens.every(p => p >= 6 && p <= 20), 'pontuação de período extra (6-20), não de pênalti')
ok(tieNba.winner === (tieNba.pens[0] > tieNba.pens[1] ? 0 : 1), 'quem fez mais na prorrogação avançou')
const tieFut = { aId: 0, bId: 1, aName: 'A', bName: 'B', legs: [[1, 0], [0, 1]], winner: null }
resolveTie(tieFut, mulberry(7))
ok(!tieFut.ot && !!tieFut.pens, 'no FUTEBOL continua pênaltis, como sempre')
let semOt = 0
for (let i = 1; i <= 200; i++) { const t = { aId: 0, bId: 1, legs: [[80, 80]], winner: null }; resolveTie(t, mulberry(i), true); if (t.pens[0] === t.pens[1]) semOt++ }
ok(semOt === 0, '200 prorrogações e nenhuma terminou empatada')

console.log('6) 🏀 playoffs por CONFERÊNCIA (Leste × Oeste) — o TAMANHO da liga escolhe o top 8 ou o top 4')
const ligaDe = n => Array.from({ length: n }, (_, i) => ({ id: i, name: `T${i}`, isManager: true, pts: 100 - i, w: 60 - i, l: i, d: 0, gf: 0, ga: 0 }))
// NBA de verdade: 30 times = 15 por conferência → top 8 de cada lado
const liga = ligaDe(30)
const copa = seedCopa(liga, true)
ok(copa.ties.length === 8, `NBA (30 times, 15 por lado): oito séries na 1ª rodada — 4 do Leste + 4 do Oeste (vieram ${copa.ties.length})`)
const leste = copa.ties.slice(0, 4).flatMap(t => [t.aId, t.bId])
const oeste = copa.ties.slice(4).flatMap(t => [t.aId, t.bId])
ok(leste.every(id => id % 2 === 0), 'a primeira metade da chave é só do Leste')
ok(copa.ties[0].aId === 0 && copa.ties[0].bId === 14, 'o 1º do Leste pega o 8º (1×8), como na NBA')
ok(oeste.every(id => id % 2 !== 0), 'a segunda metade é só do Oeste — os campeões só se cruzam nas Finais')
// G League: 24 times = 12 por conferência, o mínimo do top 8
ok(seedCopa(ligaDe(24), true).ties.length === 8, 'G League (24 times, 12 por lado): também top 8 de cada conferência')
// ⚖️ sala online (20 times = 10 por lado): top 8 classificaria 8 de 10 e a
// temporada regular não valeria nada — então cai pro top 4, os mesmos 40% da Copa
// dos 8 do futebol.
const copaSala = seedCopa(ligaDe(20), true)
ok(copaSala.ties.length === 4, `sala online (20 times, 10 por lado): top 4 de cada lado = 4 séries (vieram ${copaSala.ties.length})`)
ok(copaSala.phase === 'quartas', 'e ela começa direto nas SEMIS DE CONF. (4 séries), sem 1ª rodada')
ok(copaSala.ties.slice(0, 2).flatMap(t => [t.aId, t.bId]).every(id => id % 2 === 0), 'no top 4 as conferências continuam em metades separadas')

console.log('7) 🏀 PLAYOFFS INTEIROS no motor: série MELHOR DE 3, do 1º jogo ao anel')
{
  // sala de basquete pronta → monta a tabela da NBA (30 times) e semeia os playoffs,
  // como o fim da temporada faz. 30 times = 15 por conferência = o top 8 de verdade.
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'PLAYOF' }))
  // a sala arma 20 técnicos; a NBA tem 30 times, então clonamos os elencos pros 10
  // que faltam — o motor precisa de UM técnico por time da tabela pra simular.
  s = { ...s, managers: Array.from({ length: 30 }, (_, i) => ({ ...s.managers[i % s.managers.length], id: i, teamName: `T${i}`, isHuman: i === 0 })), youIdx: 0 }
  const league = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `T${i}`, isManager: true, pts: 0, w: 60 - i, l: i, d: 0, gf: 2000 - i * 10, ga: 1900 }))
  // o ajuste de força dos bots é recalculado pelo jogo na CERIMÔNIA (cpuAdjFor);
  // como o teste pula direto pros playoffs, entra zerado na mão.
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 82, news: [], quickCopa: seedCopa(league, true) }
  ok(s.quickCopa.phase === 'oitavas' && s.quickCopa.ties.length === 8, `1ª rodada com 8 séries (top 8 de cada conferência) — veio ${s.quickCopa.ties.length}`)
  const fases = []
  for (let passo = 0; passo < 60 && s.quickCopa && s.quickCopa.phase !== 'done'; passo++) {
    const antes = s.quickCopa.phase
    s = reducer(s, { type: 'PLAY_COPA_LEG' })
    if (s.quickCopa && s.quickCopa.phase !== antes) fases.push(antes)
  }
  ok(s.quickCopa?.phase === 'done', 'os playoffs terminaram sozinhos (sem travar)')
  ok(JSON.stringify(fases) === JSON.stringify(['oitavas', 'quartas', 'semis', 'final']), `caminho: 1ª rodada → semis de conf. → finais de conf. → FINALS (${fases.join(' → ')})`)
  ok(!!s.quickCopa?.champion, `campeão das Finals: ${s.quickCopa?.champion?.name}`)
  const todasSeries = s.quickCopa.bracket.flatMap(b => b.ties)
  ok(todasSeries.length === 15, `15 séries no total (8+4+2+1) — vieram ${todasSeries.length}`)
  ok(todasSeries.every(t => t.legs.length >= 2 && t.legs.length <= 3), 'toda série durou 2 ou 3 jogos (melhor de 3)')
  ok(todasSeries.every(t => t.legs.filter(l => l[0] > l[1]).length === 2 || t.legs.filter(l => l[1] > l[0]).length === 2), 'quem passou venceu exatamente 2 jogos')
  ok(todasSeries.every(t => t.legs.every(l => l[0] !== l[1])), 'nenhum jogo terminou empatado (a prorrogação resolve dentro do jogo)')
  ok(todasSeries.every(t => !t.pens), 'nenhuma série precisou de desempate por fora — quem ganhou 2 jogos levou')
  const pontos = todasSeries.flatMap(t => t.legs.flat())
  ok(pontos.every(p => p >= 70 && p <= 160), `placares de basquete de verdade (${Math.min(...pontos)}–${Math.max(...pontos)} pontos)`)
  // conferências: até as Finais, ninguém do Leste enfrenta ninguém do Oeste
  const antesDaFinal = s.quickCopa.bracket.filter(b => b.phase !== 'final').flatMap(b => b.ties)
  ok(antesDaFinal.every(t => t.aId % 2 === t.bId % 2), 'Leste e Oeste só se cruzam nas FINALS')
}

console.log('7b) 🏀 e na SALA ONLINE (20 times): top 4 de cada lado, mesma série melhor de 3')
{
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'SALAPO' }))
  const league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 60 - i, l: i, d: 0, gf: 2000 - i * 10, ga: 1900 }))
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 82, news: [], quickCopa: seedCopa(league, true) }
  ok(s.quickCopa.ties.length === 4, `a sala começa nas SEMIS DE CONF. com 4 séries — veio ${s.quickCopa.ties.length}`)
  for (let passo = 0; passo < 60 && s.quickCopa && s.quickCopa.phase !== 'done'; passo++) s = reducer(s, { type: 'PLAY_COPA_LEG' })
  ok(s.quickCopa?.phase === 'done', 'a chave da sala também fecha sozinha')
  const series = s.quickCopa.bracket.flatMap(b => b.ties)
  ok(series.length === 7, `7 séries (4+2+1) — vieram ${series.length}`)
  ok(series.every(t => t.legs.length >= 2 && t.legs.length <= 3), 'melhor de 3 aqui também')
  ok(!!s.quickCopa?.champion, `campeão da sala: ${s.quickCopa?.champion?.name}`)
  const antesDaFinal = s.quickCopa.bracket.filter(b => b.phase !== 'final').flatMap(b => b.ties)
  ok(antesDaFinal.every(t => t.aId % 2 === t.bId % 2), 'e as conferências seguem separadas até a final')
}

console.log('8) ⏱️ o RELÓGIO: 4 quartos de 12 min contando pra baixo (nunca minuto de futebol)')
{
  ok(basketClockLabel(0) === 'Q1 12:00', `o jogo abre em Q1 12:00 — veio ${basketClockLabel(0)}`)
  ok(basketClockLabel(MATCH_TICKS) === 'FINAL', 'no fim do contador o relógio diz FINAL')
  ok(basketClockLabel(MATCH_TICKS, 'FIM') === 'FIM', 'e a palavra do fim é a que a tela pedir (BR/EN)')
  const quartos = []
  for (let m = 0; m < MATCH_TICKS; m++) quartos.push(+basketClockLabel(m).slice(1, 2))
  ok(quartos.every(q => q >= 1 && q <= 4), 'nunca aparece um Q5 (nem Q0)')
  ok(quartos.every((q, i) => i === 0 || q >= quartos[i - 1]), 'o quarto só anda pra frente, nunca volta')
  ok(new Set(quartos).size === 4, `o jogo passa pelos QUATRO quartos — passou por ${new Set(quartos).size}`)
  // dentro de um quarto o relógio DESCE (é contagem regressiva, como na quadra)
  const segs = [10, 11, 12, 13].map(m => { const [mm, ss] = basketClockLabel(m).split(' ')[1].split(':'); return +mm * 60 + +ss })
  ok(segs.every((v, i) => i === 0 || v < segs[i - 1]), 'dentro do quarto o tempo DESCE (12:00 → 0:00)')
  ok(basketClockLabel(MATCH_TICKS - 1).startsWith('Q4'), 'o último lance do jogo ainda é no Q4')
}

console.log('9) 🏀 a cesta acontece nos QUATRO quartos (não só até o intervalo)')
{
  // roda várias séries de playoff e olha em que minutos os lances narrados caem.
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'RELOGI' }))
  const league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 60 - i, l: i, d: 0, gf: 2000 - i * 10, ga: 1900 }))
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 82, news: [], quickCopa: seedCopa(league, true) }
  const mins = []
  for (let passo = 0; passo < 60 && s.quickCopa && s.quickCopa.phase !== 'done'; passo++) {
    s = reducer(s, { type: 'PLAY_COPA_LEG' })
    for (const t of (s.quickCopa?.ties ?? [])) for (const h of (t.lastHighlights ?? [])) if (typeof h.min === 'number') mins.push(h.min)
    for (const b of (s.quickCopa?.bracket ?? [])) for (const t of b.ties) for (const h of (t.lastHighlights ?? [])) if (typeof h.min === 'number') mins.push(h.min)
  }
  ok(mins.length > 0, `saíram ${mins.length} lances narrados pra conferir`)
  ok(mins.every(m => m >= 1 && m <= MATCH_TICKS), `todo lance cai dentro do jogo (${Math.min(...mins)}–${Math.max(...mins)})`)
  const porQuarto = new Set(mins.map(m => basketClockLabel(m).slice(0, 2)))
  ok(porQuarto.size === 4, `teve cesta nos quatro quartos — apareceram ${[...porQuarto].sort().join(', ')}`)
  const segundoTempo = mins.filter(m => m > MATCH_TICKS / 2).length
  ok(segundoTempo > 0, `${segundoTempo} lances no 2º tempo (antes eram ZERO: o sorteio parava no 47)`)
}

console.log('10) 🏆 NBA CUP: copa do MEIO da temporada, 8 times, JOGO ÚNICO')
{
  const ligaDe = n => Array.from({ length: n }, (_, i) => ({ id: i, name: `T${i}`, isManager: true, pts: 100 - i, w: 60 - i, l: i, d: 0, gf: 0, ga: 0 }))
  const cup = seedCup(ligaDe(30))
  ok(cup.phase === 'quartas' && cup.ties.length === 4, `começa nas QUARTAS com 4 jogos — veio ${cup?.ties.length}`)
  ok(cup.ties.slice(0, 2).flatMap(t => [t.aId, t.bId]).every(id => id % 2 === 0), 'os 2 primeiros jogos são do Leste (top 4 de lá)')
  ok(cup.ties.slice(2).flatMap(t => [t.aId, t.bId]).every(id => id % 2 !== 0), 'os 2 últimos são do Oeste — os lados só se cruzam na FINAL')
  ok(cup.ties[0].aId === 0 && cup.ties[0].bId === 6, 'o 1º do Leste pega o 4º do Leste (1×4)')
  ok(seedCup(ligaDe(7)) === null, 'liga com menos de 8 times não tem Cup (em vez de montar chave torta)')

  // a Cup inteira no motor, dentro de uma temporada de verdade
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'NBACUP' }))
  const league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 20 - i, l: i, d: 0, gf: 2000 - i * 10, ga: 1900 }))
  const tabelaAntes = JSON.stringify(league)
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 41, news: [], nbaCup: seedCup(league) }
  const fases = []
  for (let passo = 0; passo < 40 && s.nbaCup && s.nbaCup.phase !== 'done'; passo++) {
    const antes = s.nbaCup.phase
    s = reducer(s, { type: 'PLAY_NBA_CUP_ROUND' })
    if (s.nbaCup && s.nbaCup.phase !== antes) fases.push(antes)
  }
  ok(s.nbaCup?.phase === 'done', 'a Cup termina sozinha (sem travar)')
  ok(JSON.stringify(fases) === JSON.stringify(['quartas', 'semis', 'final']), `caminho: quartas → semis → final (${fases.join(' → ')})`)
  ok(!!s.nbaCup?.champion, `campeão da NBA Cup: ${s.nbaCup?.champion?.name}`)
  const jogos = s.nbaCup.bracket.flatMap(b => b.ties)
  ok(jogos.length === 7, `7 confrontos no total (4+2+1) — vieram ${jogos.length}`)
  ok(jogos.every(t => t.legs.length === 1), 'TODO confronto foi de JOGO ÚNICO (é copa, não série)')
  ok(jogos.every(t => t.legs[0][0] !== t.legs[0][1]), 'nenhum jogo terminou empatado')
  ok(jogos.every(t => !t.pens), 'ninguém precisou de desempate por fora')
  const pts = jogos.flatMap(t => t.legs.flat())
  ok(pts.every(p => p >= 60 && p <= 170), `placares de basquete (${Math.min(...pts)}–${Math.max(...pts)})`)
  const antesDaFinal = s.nbaCup.bracket.filter(b => b.phase !== 'final').flatMap(b => b.ties)
  ok(antesDaFinal.every(t => t.aId % 2 === t.bId % 2), 'Leste e Oeste só se cruzaram na FINAL')

  console.log('   — e o que a Cup NÃO pode encostar:')
  ok(JSON.stringify(s.league) === tabelaAntes, 'a TABELA da temporada regular não mudou nem um ponto (copa não conta pro V-D)')
  ok((s.scorers ?? []).length === 0, 'a lista de cestinhas da LIGA não foi tocada (a Cup tem a dela)')
  ok((s.nbaCup.scorers ?? []).length > 0, `a Cup tem a cestinha dela (${s.nbaCup.scorers.length} nomes)`)
  ok(s.quickCopa == null, 'o slot do mata-mata de FIM de temporada continua VAZIO — os playoffs ainda vão ser semeados')
  ok(s.round === 41, 'a Cup não consumiu rodada da liga')

  console.log('   — e o futebol nunca entra aqui:')
  let f = reducer(base(), sala({ roomCode: 'FUTCUP' }))
  const fLeague = f.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 20 - i, l: i, d: 0, gf: 0, ga: 0 }))
  f = { ...f, league: fLeague, round: 19, fixtures: new Array(38).fill(null).map(() => []) }
  const fDepois = reducer(f, { type: 'PLAY_NBA_CUP_ROUND' })
  ok(fDepois.nbaCup == null, 'mandar a ação da Cup numa sala de FUTEBOL não faz nada')
}

console.log('11) 🗓️ a Cup nasce na METADE da temporada — e a temporada segue normal depois dela')
{
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'MEIOTM' }))
  const league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 0, l: 0, d: 0, gf: 0, ga: 0 }))
  // calendário de 82 rodadas VAZIAS: aqui só interessa o RELÓGIO da temporada
  // (quando a Cup nasce), não o resultado dos jogos.
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 0, news: [], scorers: [], assists: [], lastResults: [], fixtures: new Array(82).fill(null).map(() => []) }
  let nasceuNa = null
  for (let r = 0; r < 82 && s.round < 82; r++) {
    s = reducer(s, { type: 'PLAY_ROUND' })
    if (s.nbaCup && nasceuNa === null) nasceuNa = s.round
  }
  ok(nasceuNa === 41, `a Cup nasceu na rodada 41 (metade de 82) — nasceu na ${nasceuNa}`)
  ok(s.round === 82, `a liga foi até o fim mesmo assim (rodada ${s.round})`)
  ok(s.nbaCupFeita === s.seasonNo, 'fica marcado que a Cup desta temporada já rolou')
  // não pode nascer DUAS vezes na mesma temporada
  const antes = s.nbaCup
  s = { ...s, nbaCup: null, round: 41 }
  s = reducer(s, { type: 'PLAY_ROUND' })
  ok(s.nbaCup == null, 'e ela não nasce de novo na mesma temporada (a marca segura)')
  ok(!!antes, 'a Cup da primeira vez existiu mesmo')

  console.log('   — e no FUTEBOL a metade da temporada continua não tendo copa nenhuma:')
  let f = reducer(base(), sala({ roomCode: 'FUTMEI' }))
  const fl = f.managers.map(m => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 0, l: 0, d: 0, gf: 0, ga: 0 }))
  f = { ...f, league: fl, round: 0, news: [], scorers: [], assists: [], lastResults: [], fixtures: new Array(38).fill(null).map(() => []) }
  for (let r = 0; r < 38 && f.round < 38; r++) f = reducer(f, { type: 'PLAY_ROUND' })
  ok(f.nbaCup == null, 'a temporada inteira do futebol passou e nenhuma NBA Cup apareceu')
  ok(f.round === 38, 'e ela foi até a 38ª rodada, como sempre')

  console.log('   — e a STREET LEAGUE (a várzea do basquete) também não tem Cup:')
  let st = reducer(base(), sala({ sport: 'basquete', roomCode: 'STREET' }))
  const stl = st.managers.map(m => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 0, l: 0, d: 0, gf: 0, ga: 0 }))
  st = { ...st, league: stl, copaMode: 'liga', round: 0, news: [], scorers: [], assists: [], lastResults: [], fixtures: new Array(38).fill(null).map(() => []) }
  for (let r = 0; r < 38 && st.round < 38; r++) st = reducer(st, { type: 'PLAY_ROUND' })
  ok(st.nbaCup == null, 'andar sem mata-mata (copaMode liga) passa a temporada toda sem Cup — igual não tem playoff')
}

console.log('12) 🔁 TEMPORADA INTEIRA: liga → NBA Cup no meio → liga de novo → PLAYOFFS → anel')
{
  // é o teste que importa de verdade: prova que a Cup não deixa a temporada
  // presa no meio do caminho nem rouba o lugar dos playoffs.
  let s = reducer(base(), sala({ sport: 'basquete', roomCode: 'INTEIR' }))
  const league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, pts: 0, w: 0, l: 0, d: 0, gf: 0, ga: 0 }))
  s = { ...s, league, copaMode: 'liga_copa', cpuAtkAdj: 0, cpuDefAdj: 0, round: 0, news: [], scorers: [], assists: [], lastResults: [], fixtures: new Array(82).fill(null).map(() => []) }
  let cupJogada = false, rodadaDaCup = null, passos = 0
  // o laço imita a TELA: se a Cup está rolando, ela manda; senão, roda a liga.
  while (passos++ < 400) {
    if (s.nbaCup && s.nbaCup.phase !== 'done') {
      if (rodadaDaCup === null) rodadaDaCup = s.round
      s = reducer(s, { type: 'PLAY_NBA_CUP_ROUND' })
      if (s.nbaCup?.phase === 'done') cupJogada = true
      continue
    }
    if (s.round < 82) { s = reducer(s, { type: 'PLAY_ROUND' }); continue }
    break
  }
  ok(cupJogada, 'a Cup rolou inteira no meio do caminho')
  ok(rodadaDaCup === 41, `e ela rolou na rodada 41 (rodou na ${rodadaDaCup})`)
  ok(!!s.nbaCup?.champion, `campeão da Cup: ${s.nbaCup?.champion?.name}`)
  ok(s.round === 82, `a liga chegou ao fim mesmo assim (rodada ${s.round})`)
  // agora o fim de temporada: os playoffs TÊM que ser semeados
  s = reducer(s, { type: 'FINISH_SEASON' })
  ok(!!s.quickCopa, 'o fim de temporada semeou os PLAYOFFS (a Cup não roubou o slot)')
  for (let p = 0; p < 80 && s.quickCopa && s.quickCopa.phase !== 'done'; p++) s = reducer(s, { type: 'PLAY_COPA_LEG' })
  ok(s.quickCopa?.phase === 'done', 'e os playoffs terminaram sozinhos')
  ok(!!s.quickCopa?.champion, `campeão das Finals: ${s.quickCopa?.champion?.name}`)
  ok(!!s.nbaCup?.champion, 'e o campeão da Cup continua guardado no fim (é a carta dele)')
  const series = s.quickCopa.bracket.flatMap(b => b.ties)
  ok(series.every(t => t.legs.length >= 2), 'os playoffs seguiram em SÉRIE (melhor de 3), não viraram jogo único da Cup')
}

console.log('13) 🃏 BARALHO: tem jogador RUIM famoso, e mexer nele atualiza o save (regra do Diego 21/08)')
{
  const todas = Object.values(CATALOG_NBA).flat()
  ok(todas.length >= 300, `o baralho tem ${todas.length} cartas`)
  const porFama = {}
  for (const c of todas) porFama[c.fame] = (porFama[c.fame] ?? 0) + 1
  ok([1, 2, 3, 4, 5].every(f => (porFama[f] ?? 0) > 0), `as cinco categorias existem: ${JSON.stringify(porFama)}`)
  ok((porFama[1] ?? 0) >= 30, `"foi profissional" (o famoso ruim) tem ${porFama[1] ?? 0} cartas — o Diego pediu que tivesse`)
  ok(todas.some(c => c.promessa), 'e existe PROMESSA no baralho')
  ok(todas.every(c => c.bioPt && c.bioEn), 'TODA carta nasce bilíngue (bioPt + bioEn) — regra do BidLegends')
  ok(todas.every(c => c.lo < c.hi && c.lo >= 40 && c.hi <= 99), 'toda faixa de nível é válida (lo < hi, dentro de 40–99)')
  const chaves = todas.map(c => `${c.name}|${c.club}|${c.year}`)
  ok(new Set(chaves).size === chaves.length, 'nenhuma carta repetida (nome|franquia|ano)')
  ok(new Set(todas.map(c => c.name)).size === todas.length, 'e nenhum nome repetido entre cartas')
  // ⚠️ esta conferência é o que pegou o De'Aaron Fox duplicado em 14/09: o script
  // de fora que eu usava pra caçar repetido lia o arquivo com regex e QUEBRAVA em
  // nome com apóstrofo (De'Aaron, Amar'e, O'Neal) — ele via "De" e passava batido.
  // Aqui é o baralho de VERDADE, importado, então apóstrofo nenhum engana.

  // 🔁 a trava do Diego: mexeu na ficha do jogador, o save tem que acompanhar
  const carta = Object.values(CATALOG_NBA).flat()[0]
  const saveVelho = {
    sport: 'basquete',
    managers: [{ id: 0, squad: [{ ...carta, id: 'x1', pos: 'GOL', fame: 1, lo: 10, hi: 11, bio: 'bio velha' }] }],
  }
  const curado = sincroniza(saveVelho)
  const depois = curado.managers[0].squad[0]
  ok(depois.fame === carta.fame && depois.lo === carta.lo && depois.hi === carta.hi,
    `a ficha do save foi regravada pelo baralho (fame ${depois.fame}, ${depois.lo}–${depois.hi})`)
  ok(depois.bio === carta.bioPt || depois.bio === carta.bioEn, 'e a bio veio do baralho, no idioma da vez')
  ok(depois.name === carta.name && depois.club === carta.club && depois.year === carta.year, 'identidade da carta (nome/franquia/ano) NÃO foi tocada')
  ok(depois.pos === 'GOL', 'e a posição também não — mexer nela quebraria o time já escalado')

  console.log('   — e o save de FUTEBOL não olha pro baralho de basquete:')
  const saveFut = {
    sport: 'futebol',
    managers: [{ id: 0, squad: [{ ...carta, id: 'y1', pos: 'GOL', fame: 1, lo: 10, hi: 11, bio: 'bio velha' }] }],
  }
  const futDepois = sincroniza(saveFut).managers[0].squad[0]
  ok(futDepois.fame === 1 && futDepois.lo === 10 && futDepois.bio === 'bio velha',
    'carta de basquete dentro de um save de futebol fica intocada (os mapas são separados)')
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
