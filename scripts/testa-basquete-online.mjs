// 🏀🌐 ONLINE DO BASQUETE — confere no MOTOR (não na tela) que a sala online de
// basquete nasce certa e que o futebol não muda NADA.
// Rodar: npx tsx scripts/testa-basquete-online.mjs   (sai 1 se algo quebrar)
import { reducer, __resolveQuickCopaTie as resolveTie, __seedQuickCopa as seedCopa } from '../src/escalacao/store.tsx'
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

console.log('6) 🏀 playoffs por CONFERÊNCIA (Leste × Oeste), top 4 de cada lado')
const liga = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `T${i}`, pts: 100 - i, w: 60 - i, l: i, d: 0, gf: 0, ga: 0 }))
const copa = seedCopa(liga, true)
ok(copa.ties.length === 4, 'quatro confrontos na primeira fase')
const leste = copa.ties.slice(0, 2).flatMap(t => [t.aId, t.bId])
const oeste = copa.ties.slice(2).flatMap(t => [t.aId, t.bId])
ok(leste.every(id => id % 2 === 0), 'a primeira metade da chave é só do Leste')
ok(oeste.every(id => id % 2 !== 0), 'a segunda metade é só do Oeste — os campeões só se cruzam nas Finais')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
