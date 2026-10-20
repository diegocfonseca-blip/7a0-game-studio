// 🌐 CARREIRA ONLINE v2 — o FLUXO no motor (19/10).   node scripts/carreira-online/testa-fluxo.mjs
// 1) o dono abre a carreira com 3 clubes de gente (+ bots) e roda o leilão de estreia, com os lances dos 3;
// 2) cada convidado recebe a última foto e passa a tocar o PRÓPRIO clube (CO2_ASSUME);
// 3) os 3 aparelhos, cada um mexendo só no seu time e trocando gavetas, jogam 10 rodadas e chegam no MESMO lugar.
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const { reducer, INITIAL, sanitizeParaSala } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const { pack, unpack } = await vite.ssrLoadModule('/src/escalacao/netpack.ts')
const { buildPyramid, simulatePyramid } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const { minhaGaveta, mesclaEntradas, congelaMeu } = await vite.ssrLoadModule('/src/escalacao/carreira-online-v2.ts')
let falhas = 0
const ok = (c, m) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

const NOMES = ['Dono FC', 'Amigo Um', 'Amigo Dois']
let host = reducer(structuredClone(INITIAL), { type: 'START_CAREER_SOLO', teamName: NOMES[0], formation: '4-3-3', rivals: 5, co2: { sala: 'sala-teste', nomes: NOMES, assento: 0 } })
ok(host.co2?.comanda === true && host.managers.filter(m => m.isHuman).length === 3, 'o dono abre a carreira com 3 clubes de gente')
ok(host.managers.slice(0, 3).every((m, i) => m.isHuman && m.id === i && m.teamName === NOMES[i]), 'os clubes de gente têm id = ordem dos assentos')
const tamanhos = []
for (let i = 0; i < 5000 && host.screen !== 'season'; i++) {
  if (i % 25 === 0) tamanhos.push(pack(sanitizeParaSala(host)).length)
  if (host.screen === 'auction') {
    if (host.phase === 'envelope' || host.phase === 'resq_envelope') {
      // cada clube de gente lança 1 moeda na 1ª carta do setor (o "convidado" manda pelo canal; aqui vai direto no motor)
      for (const m of host.managers.filter(x => x.isHuman)) {
        if (host.submitted.includes(m.id)) continue
        // lança em 2 cartas do setor (valor que cabe no bolso), cada um em cartas diferentes
        const cartas = host.currentCards.filter((_, j) => j % 3 === m.id % 3).slice(0, 2)
        host = reducer(host, { type: 'SUBMIT_ENVELOPE', mgrId: m.id, bids: cartas.map(c => ({ cardId: c.id, amount: 6 + m.id })) })
      }
      if (host.phase === 'envelope' || host.phase === 'resq_envelope') host = reducer(host, { type: 'FORCE_SEAL' })
      continue
    }
    if (host.phase === 'tiebreak') {
      // empate entre gente: cada um re-lança (o dono recebe pelo canal) — aqui o de id maior cobre com +1
      const tb = host.tiebreaks[host.tiebreakIdx]
      if (tb) for (const id of tb.managers) { if (!tb.submitted.includes(id) && host.managers.find(m => m.id === id)?.isHuman) host = reducer(host, { type: 'SUBMIT_TIEBREAK', mgrId: id, amount: tb.amount + id }) }
      if (host.phase === 'tiebreak') { host = { ...host, phaseDeadline: 1 }; host = reducer(host, { type: 'FORCE_TIEBREAK' }) }
      continue
    }
    host = reducer(host, { type: 'ADVANCE_REVEAL' }); continue
  }
  if (host.screen === 'monte') {
    // no Monte, quem é de gente escolhe na vez dele (o convidado manda pelo canal): pega a 1ª carta que cabe
    const vez = host.monteOrder[host.monteIdx]
    const m = host.managers.find(x => x.id === vez)
    if (m?.isHuman) {
      const antes = host.monteIdx
      for (const c of host.monte) { host = reducer(host, { type: 'MONTE_PICK', mgrId: vez, cardId: c.id }); if (host.monteIdx !== antes || host.screen !== 'monte') break }
      if (host.screen === 'monte' && host.monteIdx === antes) host = reducer(host, { type: 'MONTE_PASS', mgrId: vez })
      if (host.screen === 'monte' && host.monteIdx === antes) { host = { ...host, monteDeadline: 1 }; host = reducer(host, { type: 'MONTE_TIMEOUT' }) }
      continue
    }
    host = { ...host, monteDeadline: 1 }; host = reducer(host, { type: 'MONTE_TIMEOUT' }); continue
  }
  if (host.screen === 'cerimonia') { host = reducer(host, { type: 'FINISH_CEREMONY' }); continue }
  host = reducer(host, { type: 'FORCE_SEAL' })
}
ok(host.screen === 'season', `o leilão de estreia chega na temporada (parou em ${host.screen}/${host.phase})`)
const kbMax = Math.max(...tamanhos) / 1024
ok(kbMax < 200, `o estado do leilão que vai pela sala cabe (maior pacote ${kbMax.toFixed(0)} KB comprimido)`)
const humanos = host.managers.filter(m => m.isHuman)
ok(humanos.every(m => m.squad.length >= 11), `os 3 clubes de gente saem do leilão com time (${humanos.map(m => m.squad.length + (m.squad.some(c => c.fake) ? '*' : '')).join(', ')})`)

// 📦 a última foto que o dono manda
const foto = pack(sanitizeParaSala(host))
const aparelhos = [host]
for (const meuId of [1, 2]) {
  const g = reducer(structuredClone(INITIAL), { type: 'CO2_ASSUME', newState: unpack(foto), meuId })
  aparelhos.push(g)
  ok(g.managers[g.youIdx]?.id === meuId && g.managers[g.youIdx].teamName === NOMES[meuId], `aparelho ${meuId}: "eu" é o ${NOMES[meuId]}`)
  ok(g.isHost === true && g.co2?.comanda === false && !g.co2?.espelho, `aparelho ${meuId}: toca o próprio clube (não comanda a sala)`)
  const compras = (g.careerLedger ?? []).filter(e => e.kind === 'buy').reduce((a, e) => a + e.amount, 0)
  const abertura = (g.careerLedger ?? []).find(e => e.kind === 'opening')?.amount ?? 0
  ok(abertura + compras === (g.careerCoins?.[meuId] ?? NaN), `aparelho ${meuId}: o extrato fecha com a caixa (${abertura} ${compras} = ${g.careerCoins?.[meuId]})`)
}
const extratoDono = (host.careerLedger ?? []).filter(e => e.kind === 'buy').reduce((a, e) => a + e.amount, 0) + 100
ok(extratoDono === host.careerCoins?.[0], `dono: o extrato só tem as compras DELE (${extratoDono} = ${host.careerCoins?.[0]})`)

// ⚽ 10 rodadas: cada aparelho mexe só no seu, sobe a gaveta, puxa as dos outros, congela no começo e joga
const TACS = ['retranca', 'equilibrio', 'ataque']
const entradasDe = (s) => ({ tactics: (s.careerTactics ?? {}), lineups: (s.careerLineup ?? {}), halftime: {}, penalty: {}, mods: {}, cardMods: {}, tecs: undefined })
const seasonSeed = (s) => (s.seed ^ ((s.seasonNo ?? 1) * 2654435761)) >>> 0
for (let r = 0; r < 10; r++) {
  // preparo: cada um troca a tática do PRÓPRIO clube
  for (let k = 0; k < 3; k++) { const s = aparelhos[k]; aparelhos[k] = reducer(s, { type: 'SET_TACTIC', mgrId: s.managers[s.youIdx].id, tactic: TACS[(r + k) % 3] }) }
  const gavetas = aparelhos.map(s => JSON.parse(JSON.stringify(minhaGaveta(s.managers[s.youIdx], entradasDe(s)))))
  // começou: todo mundo congela com as gavetas do banco e joga
  for (let k = 0; k < 3; k++) {
    let s = reducer(aparelhos[k], { type: 'CO2_GAVETAS', gavetas, ate: aparelhos[k].round })
    s = reducer(s, { type: 'PLAY_ROUND' })
    aparelhos[k] = s
  }
}
const resultado = (s) => {
  const meuId = s.managers[s.youIdx].id
  const e = mesclaEntradas(congelaMeu(entradasDe(s), s.co2?.minha, meuId, s.co2?.congeladoAte ?? -1), s.co2?.gavetas ?? [], meuId)
  const world = buildPyramid(s.managers, meuId, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
  const sim = simulatePyramid(world, seasonSeed(s), s.round, e.tactics, e.lineups, 1.12, true, true, e.mods, e.halftime, e.penalty, e.tecs, e.cardMods)
  return Object.entries(sim.tables).map(([d, ts]) => d + ':' + ts.map(t => `${t.name}:${t.pts}:${t.gf}:${t.ga}`).join(',')).join('#')
}
const r0 = resultado(aparelhos[0])
ok(aparelhos.every(s => s.round === 10), 'os 3 aparelhos estão na rodada 10')
ok(aparelhos.every(s => resultado(s) === r0), 'depois de 10 rodadas, as 5 tabelas são IGUAIS nos 3 aparelhos')
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ fluxo da carreira online v2 ok')
await vite.close()
process.exit(falhas ? 1 : 0)
