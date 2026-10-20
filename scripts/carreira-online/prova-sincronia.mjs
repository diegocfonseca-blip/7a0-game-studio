// 🌐 PROVA DA CARREIRA ONLINE (19/10) — antes de construir, provar que o jeito escolhido com o Diego funciona:
//   · cada clube é uma "gaveta" pequena (elenco + formação + escalação), o que é de todos é um pedaço pequeno (semente,
//     divisões, fichas dos bots);
//   · dois aparelhos que só recebem ESSES pedaços chegam na MESMA temporada (tabela, placares, artilharia) — o motor da
//     carreira solo (`buildPyramid` + `simulatePyramid`) já é determinístico.
// Mede o tamanho de cada pedaço e reprova se os dois aparelhos discordarem.   node scripts/carreira-online/prova-sincronia.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const kb = o => (Buffer.byteLength(JSON.stringify(o)) / 1024).toFixed(1) + ' KB'
try {
  const P = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const D = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const N = Number(process.argv[2] ?? 20)
  const seed = 424242
  // 20 clubes de gente com elenco de verdade (cartas do baralho), espalhados pelas 4 divisões
  let r = 7; const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648
  const usados = new Set()
  const pega = (sec, n) => { const lista = D.CATALOG_BOTH[sec]; const out = []; while (out.length < n) { const c = lista[Math.floor(rnd() * lista.length)]; const k = `${c.name}|${c.club}|${c.year}`; if (usados.has(k)) continue; usados.add(k); out.push({ ...c, __sec: sec }) } return out }
  const managers = Array.from({ length: N }, (_, i) => {
    const cartas = [...pega('GOL', 2), ...pega('LAT', 4), ...pega('ZAG', 4), ...pega('MEI', 6), ...pega('ATA', 6)]
    return { id: i, teamName: `Clube ${i + 1}`, isHuman: true, money: 100, formation: '4-3-3',
      squad: cartas.map((c, j) => ({ ...c, id: `${i}-${j}`, pos: c.pos ?? c.__sec, paid: 10 })) }
  })
  for (const m of managers) m.squad.forEach(c => { if (!c.pos) throw new Error('carta sem posição') })
  const divs = ['A', 'B', 'C', 'D']
  const placements = Object.fromEntries(managers.map((m, i) => [`m${m.id}`, divs[i % 4]]))
  // escalação de cada rodada (o que cada um aperta antes do PRONTO): aqui o XI automático
  const lineups = {}

  // 📱 APARELHO A: o estado inteiro, como a carreira solo faz
  const worldA = P.buildPyramid(managers, 0, seed, 'both', placements, undefined)
  const simA = P.simulatePyramid(worldA, seed, 38, {}, lineups)

  // 📦 OS PEDAÇOS que iriam pra nuvem do jogo
  const base = { seed, deck: 'both', placements, temporada: 1, rodada: 38 }
  const gavetas = managers.map(m => ({ id: m.id, teamName: m.teamName, isHuman: true, formation: m.formation, squad: m.squad }))
  // fichas dos bots (no online elas mudam no mercado da virada → vão UMA vez por temporada)
  const fichasBots = {}
  for (const d of divs) for (const t of worldA[d]) if (!t.human) fichasBots[t.name] = t.squad ?? t.cards ?? []

  // 📱 APARELHO B: só recebe os pedaços (passando pelo JSON, como na rede), e é OUTRO jogador (youId 7)
  const gavetasB = JSON.parse(JSON.stringify(gavetas)).map(g => ({ ...g, money: 100 }))
  const baseB = JSON.parse(JSON.stringify(base))
  const worldB = P.buildPyramid(gavetasB, 7, baseB.seed, baseB.deck, baseB.placements, undefined)
  const simB = P.simulatePyramid(worldB, baseB.seed, 38, {}, {})

  const semVoce = tab => Object.fromEntries(Object.entries(tab).map(([d, ts]) => [d, ts.map(t => `${t.name}:${t.pts}:${t.gf}:${t.ga}`)]))
  assert.deepEqual(semVoce(simB.tables), semVoce(simA.tables), 'as tabelas dos dois aparelhos têm que ser IGUAIS')
  assert.deepEqual(simB.scorers.slice(0, 20).map(s => `${s.name}:${s.goals}`), simA.scorers.slice(0, 20).map(s => `${s.name}:${s.goals}`), 'artilharia igual')
  // e uma rodada no meio (o que a tela mostra ao vivo)
  const mA = P.simulatePyramid(worldA, seed, 17, {}, lineups).matches, mB = P.simulatePyramid(worldB, seed, 17, {}, {}).matches
  // ("você" muda de aparelho pra aparelho — é o único campo que PODE diferir; placar, gol, autor e minuto não)
  const placar = ms => Object.fromEntries(Object.entries(ms).map(([d, l]) => [d, l.map(m => `${m.h} ${m.hg}x${m.ag} ${m.a}|${(m.goals ?? []).map(g => `${g.min}'${g.name}/${g.assist ?? ''}`).join(',')}`)]))
  assert.deepEqual(placar(mB), placar(mA), 'placares e gols da rodada 17 iguais')
  for (let rr = 1; rr <= 38; rr++) assert.deepEqual(placar(P.simulatePyramid(worldB, seed, rr, {}, {}).matches), placar(P.simulatePyramid(worldA, seed, rr, {}, lineups).matches), `rodada ${rr} igual`)

  const umaGaveta = gavetas[0]
  console.log(`✅ ${N} clubes de gente: os dois aparelhos chegaram na MESMA temporada (tabelas das 4 divisões, artilharia, placares rodada a rodada)`)
  console.log(`📦 o que é de todos (semente, divisões, rodada): ${kb(base)}`)
  console.log(`📦 a gaveta de UM clube (elenco + formação): ${kb(umaGaveta)} · as ${N} juntas: ${kb(gavetas)}`)
  console.log(`📦 fichas dos bots (sobe 1x por temporada): ${kb(fichasBots)}`)
  console.log(`📦 escalação de uma rodada (o que cada um manda no PRONTO): ${kb({ xi: umaGaveta.squad.slice(0, 11).map(c => c.id), formacao: '4-3-3' })}`)
} finally { await vite.close() }
