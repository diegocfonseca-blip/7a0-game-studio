// 🌎🌍🌐 CARREIRA ONLINE — Libertadores, Champions e Mundial ÚNICOS.   node scripts/carreira-online/testa-internacional.mjs
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const I = await vite.ssrLoadModule('/src/escalacao/co2-internacional.ts')
const S0 = await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
const K = await vite.ssrLoadModule('/src/escalacao/career-international.ts')
const V = await vite.ssrLoadModule('/src/escalacao/career-international-view.tsx')
let falhas = 0
const ok = (c, m) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const SEASON = 3, SEED = 987654
// 3 amigos convidados: 0 campeão da A (prioridade 1), 1 em 4º (prioridade 4), 2 campeão da Copa (prioridade 2)
const fila = I.filaIntl([{ mgrId: 1, priority: 4, name: 'Amigo B' }, { mgrId: 0, priority: 1, name: 'Amigo A' }, { mgrId: 2, priority: 2, name: 'Amigo C' }])
ok(fila.map(v => v.mgrId).join() === '0,2,1', 'fila pela prioridade da regra (campeão da A, campeão da Copa, depois a tabela)')
const esc = {}
ok(I.vezDaIntl(fila, esc, [], SEASON) === 0, 'o mais alto escolhe primeiro')
// convites do amigo 0 (bloco 1) — sempre 2 da Libertadores
const choices = p => K.INTERNATIONAL_CLUBS.filter(c => c.block >= p)
const cv0 = V.convitesDaTemporada(SEED, SEASON, 1, choices(1), false)
ok(cv0.length === 2 && cv0.every(c => c.comp === 'libertadores'), '2 convites da Libertadores (Champions só depois de ganhar a Liberta)')
const xiDe = club => { const cs = K.internationalClubCards(club); const pega = (pos, n) => cs.filter(c => c.pos === pos).slice(0, n); return [...pega('GOL', 1), ...pega('LAT', 2), ...pega('ZAG', 2), ...pega('MEI', 3), ...pega('ATA', 3)] }
const clubeA = cv0.find(c => K.validInternationalXI(xiDe(c.club)))?.club
ok(!!clubeA, `amigo A aceita ${clubeA}`)
esc[0] = { season: SEASON, club: clubeA, xi: xiDe(clubeA) }
ok(I.vezDaIntl(fila, esc, [], SEASON) === 2, 'depois dele, o próximo da fila')
const tomados = I.clubesTomados(esc, SEASON, 2)
const cv2 = V.convitesDaTemporada(SEED, SEASON, 2, choices(2).filter(c => !tomados.includes(c.name)), false)
ok(!cv2.some(c => c.club === clubeA), 'o clube que o amigo aceitou SAI da lista do outro')
// o amigo C pega um clube que feche time (procura no bloco dele)
const clubeC = K.INTERNATIONAL_CLUBS.filter(c => c.block >= 2 && c.competition === 'libertadores' && !tomados.includes(c.name)).map(c => c.name).find(n => K.validInternationalXI(xiDe(n)))
esc[2] = { season: SEASON, club: clubeC, xi: xiDe(clubeC) }
ok(I.vezDaIntl(fila, esc, [], SEASON) === 1, 'vez do terceiro')
ok(I.vezDaIntl(fila, esc, [1], SEASON) === null, 'o dono pulou quem sumiu: todos decidiram')
esc[1] = { season: SEASON, club: null }
ok(I.vezDaIntl(fila, esc, [], SEASON) === null, 'sem clube pra convocar também conta como decidido')
const nomeDe = id => ['Amigo A', 'Amigo B', 'Amigo C'][id]
// cada aparelho monta a campanha: o próprio clube como representedClub + os amigos
const monta = meu => {
  const minha = esc[meu]
  const amigos = I.amigosDaIntl(esc, SEASON, meu, nomeDe)
  return S0.makeInternationalCampaign({ season: SEASON, seed: SEED, representedClub: minha?.club ?? null, userTeam: nomeDe(meu), userId: meu, priority: null, userXI: minha?.club ? minha.xi : [], motor2: true, amigos })
}
const camps = [0, 1, 2].map(monta)
const semVoce = c => JSON.stringify({ t: c.teams, st: c.steps, l: c.libertadoresChampion, ch: c.championsChampion, m: c.mundialChampion }, (k, v) => (k === 'you' ? undefined : v))
ok(camps.every(c => semVoce(c) === semVoce(camps[0])), 'a campanha inteira (72 clubes, 14 noites, motor novo) sai IGUAL nos 3 aparelhos')
const tA = camps[1].teams.find(t => t.id === clubeA), tC = camps[0].teams.find(t => t.id === clubeC)
ok(tA.humano && tA.name === 'Amigo A' && tA.teamId === 0 && !tA.you, 'no aparelho do B, o clube do A é do A (gente, não bot)')
ok(tC.humano && tC.name === 'Amigo C' && camps[2].teams.find(t => t.id === clubeC).you, '"você" só no aparelho de cada um')
const jogosGente = camps[0].steps.flatMap(s => [s.libertadores, s.champions, s.mundial]).flatMap(p => p?.matches ?? []).filter(m => m.home === clubeA || m.away === clubeA || m.home === clubeC || m.away === clubeC)
ok(jogosGente.length > 0 && jogosGente.every(m => m.m2), 'todo jogo de clube de gente é do motor novo (em todo aparelho)')
const usadas = new Set(), repetida = camps[0].teams.flatMap(t => t.xi).some(c => { const k = `${c.name}|${c.club}|${c.year}`; if (usadas.has(k)) return true; usadas.add(k); return false })
ok(!repetida, 'nenhuma carta em dois clubes ("não existe dois Neymar 2011")')
const h = I.titulosDaIntl(camps[1])
ok(JSON.stringify(h) === JSON.stringify(I.titulosDaIntl(camps[0])), 'os títulos carimbados saem iguais de qualquer aparelho')
const hist = [h]
ok(I.contaTitulosIntl(hist, 0, SEASON).libertadores_titles === 0, 'título da temporada só conta no ranking depois que ela fecha')
const quem = h.lib.mgrId
if (quem != null) ok(I.contaTitulosIntl(hist, quem, SEASON + 1).libertadores_titles === 1, 'na temporada seguinte o campeão de gente ganha o título no ranking')
// solo continua igual (sem amigos)
const solo1 = S0.makeInternationalCampaign({ season: 41, seed: SEED, representedClub: clubeA, userTeam: 'Eu', userId: 0, priority: 1, userXI: xiDe(clubeA), motor2: true })
ok(!solo1.teams.some(t => t.humano), 'carreira solo: nada muda (sem marca de gente)')
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Libertadores/Champions/Mundial da carreira online ok')
await vite.close()
process.exit(falhas ? 1 : 0)
