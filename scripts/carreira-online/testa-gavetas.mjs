// 🌐 TRAVA DA CARREIRA ONLINE v2 — as gavetas (19/10).   npm run carreira-online
// 20 aparelhos, cada um sabendo SÓ das coisas do próprio clube (tática, escalação, intervalo, pênalti, força do dia,
// gás dos jogadores, técnico) e com uma cópia VELHA dos outros clubes. Depois de misturar as gavetas, todos têm que
// chegar na MESMA temporada que um "juiz" que conhece tudo: placar, autor do gol, tabela e artilharia, rodada a rodada.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const P = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const D = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const G = await vite.ssrLoadModule('/src/escalacao/carreira-online-v2.ts')
  const N = 20, seed = 777001, R = 38
  let r = 99; const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648
  const usados = new Set()
  const pega = (sec, n) => { const l = D.CATALOG_BOTH[sec]; const out = []; while (out.length < n) { const c = l[Math.floor(rnd() * l.length)]; const k = `${c.name}|${c.club}|${c.year}`; if (usados.has(k)) continue; usados.add(k); out.push({ ...c, __sec: sec }) } return out }
  const FORMS = ['4-3-3', '4-4-2', '5-3-2']
  const managers = Array.from({ length: N }, (_, i) => {
    const cartas = [...pega('GOL', 2), ...pega('LAT', 4), ...pega('ZAG', 4), ...pega('MEI', 6), ...pega('ATA', 6)]
    return { id: i, name: `T${i}`, teamName: `Clube ${i + 1}`, isHuman: true, auctionRival: true, money: 100, formation: FORMS[i % 3],
      squad: cartas.map((c, j) => ({ ...c, id: `${i}-${j}`, pos: c.pos ?? c.__sec, paid: 10 })) }
  })
  const divs = ['A', 'B', 'C', 'D']
  const placements = Object.fromEntries(managers.map((m, i) => [`m${m.id}`, divs[i % 4]]))
  const TACS = ['retranca', 'equilibrio', 'ataque']

  // 🧠 o que cada clube decidiu na temporada (só o aparelho do dono sabe)
  const decisoes = managers.map(m => {
    const tac = {}, xi = {}, ht = {}, pen = {}, mods = {}, card = {}
    for (let rr = 1; rr <= R; rr++) {
      if (rnd() < 0.3) tac[rr] = TACS[Math.floor(rnd() * 3)]
      if (rnd() < 0.25) { const base = P.lineupAt({}, 0, 1, m.squad, m.formation).map(c => c.id); const banco = m.squad.filter(c => !base.includes(c.id)); const sai = Math.floor(rnd() * 11); const entra = banco.find(c => c.pos === m.squad.find(x => x.id === base[sai]).pos); if (entra) base[sai] = entra.id; xi[rr] = base }
      if (rnd() < 0.1) mods[rr] = rnd() < 0.5 ? -2 : 1
      if (rnd() < 0.3) { const c = m.squad[Math.floor(rnd() * m.squad.length)]; card[rr] = { [c.id]: rnd() < 0.5 ? -1 : -2 } }
      if (rnd() < 0.08) ht[rr] = { xi2: P.lineupAt({}, 0, 1, m.squad, m.formation).map(c => c.id), tactic: 'ataque' }
      if (rnd() < 0.05) pen[rr - 1] = { scored: rnd() < 0.7, taker: m.squad[m.squad.length - 1].name }
    }
    const tec = m.id % 5 === 0 ? { lo: 6, hi: 9, desdeR: m.id % 2 ? 0 : 10 } : undefined
    return { tac, xi, ht, pen, mods, card, tec }
  })
  // técnicos dos BOTS: são do mundo (iguais em todo aparelho)
  const tecsBots = { 'Flamengo': { lo: 7, hi: 9, desdeR: 0 } }

  // ⚖️ o JUIZ: conhece as decisões de todo mundo
  const tudo = { tactics: {}, lineups: {}, halftime: {}, penalty: {}, mods: {}, cardMods: {}, tecs: { ...tecsBots } }
  for (const m of managers) { const d = decisoes[m.id]; tudo.tactics[m.id] = d.tac; tudo.lineups[m.id] = d.xi; tudo.halftime[m.id] = d.ht; tudo.penalty[m.id] = d.pen; tudo.mods[m.id] = d.mods; tudo.cardMods[m.id] = d.card; if (d.tec) tudo.tecs[m.teamName] = d.tec }
  const simula = (ms, e, ate) => P.simulatePyramid(P.buildPyramid(ms, 0, seed, 'both', placements, undefined), seed, ate, e.tactics, e.lineups, 1.12, true, true, e.mods, e.halftime, e.penalty, e.tecs, e.cardMods)
  const placar = ms => Object.entries(ms).map(([d, l]) => d + ':' + l.map(m => `${m.h} ${m.hg}x${m.ag} ${m.a}|${(m.goals ?? []).map(g => `${g.min}'${g.name}/${g.assist ?? ''}`).join(',')}`).join(';')).join('#')
  const tabela = t => Object.entries(t).map(([d, ts]) => d + ':' + ts.map(x => `${x.name}:${x.pts}:${x.gf}:${x.ga}`).join(',')).join('#')

  // 📦 a gaveta que cada aparelho sobe (tirada dos mapas LOCAIS dele)
  const gavetas = managers.map(m => {
    const d = decisoes[m.id]
    const local = { tactics: { [m.id]: d.tac }, lineups: { [m.id]: d.xi }, halftime: { [m.id]: d.ht }, penalty: { [m.id]: d.pen }, mods: { [m.id]: d.mods }, cardMods: { [m.id]: d.card }, tecs: d.tec ? { ...tecsBots, [m.teamName]: d.tec } : { ...tecsBots } }
    return JSON.parse(JSON.stringify(G.minhaGaveta(m, local)))
  })

  const juiz = Array.from({ length: R }, (_, i) => simula(managers, tudo, i + 1))
  let checados = 0
  for (let k = 0; k < N; k++) {
    const me = managers[k], d = decisoes[k]
    // 📱 aparelho k: só sabe do próprio clube; os outros estão com elenco VELHO (sem a última carta) e LIXO nos mapas
    const velhos = managers.map(m => m.id === k ? m : { ...m, teamName: 'nome velho', squad: m.squad.slice(0, 20), formation: '4-4-2' })
    const local = { tactics: { [k]: d.tac, [(k + 1) % N]: { 1: 'ataque' } }, lineups: { [k]: d.xi }, halftime: { [k]: d.ht }, penalty: { [k]: d.pen }, mods: { [k]: d.mods, [(k + 2) % N]: { 3: -2 } }, cardMods: { [k]: d.card }, tecs: d.tec ? { ...tecsBots, [me.teamName]: d.tec } : { ...tecsBots } }
    const ms = G.mesclaClubes(velhos, gavetas, k)
    const e = G.mesclaEntradas(local, gavetas, k)
    for (const rr of [1, 10, 19, 27, 38]) {
      const s = simula(ms, e, rr)
      assert.equal(placar(s.matches), placar(juiz[rr - 1].matches), `aparelho ${k}, rodada ${rr}: placares iguais`)
      assert.equal(tabela(s.tables), tabela(juiz[rr - 1].tables), `aparelho ${k}, rodada ${rr}: tabela igual`)
      checados++
    }
    const s38 = simula(ms, e, R)
    assert.deepEqual(s38.scorers.slice(0, 15).map(x => `${x.name}:${x.goals}`), juiz[R - 1].scorers.slice(0, 15).map(x => `${x.name}:${x.goals}`), `aparelho ${k}: artilharia igual`)
  }
  // 🧊 quem mexeu no time DEPOIS da gaveta subir: até a rodada que começou vale a gaveta do banco (o que os outros veem)
  for (const k of [0, 7, 13]) {
    const me = managers[k], d = decisoes[k]
    const mexido = { ...d.tac, 3: 'ataque', 5: 'retranca', 9: 'ataque', 25: 'retranca' }
    const local = { tactics: { [k]: mexido }, lineups: { [k]: d.xi }, halftime: { [k]: d.ht }, penalty: { [k]: d.pen }, mods: { [k]: { ...d.mods, 4: -2 } }, cardMods: { [k]: d.card }, tecs: d.tec ? { ...tecsBots, [me.teamName]: d.tec } : { ...tecsBots } }
    const ate = 12
    const e = G.mesclaEntradas(G.congelaMeu(local, gavetas[k], k, ate), gavetas, k)
    const s = simula(managers, e, ate + 1)
    assert.equal(placar(s.matches), placar(juiz[ate].matches), `aparelho ${k}: com o time mexido depois da gaveta, até a rodada ${ate + 1} vale a gaveta`)
    const semCongelar = simula(managers, G.mesclaEntradas(local, gavetas, k), ate + 1)
    assert.notEqual(tabela(semCongelar.tables), tabela(juiz[ate].tables), 'sem congelar, o aparelho que mexeu sairia diferente')
  }
  // e o contrário: SEM a mistura, os aparelhos discordam (senão o teste não prova nada)
  const semMistura = simula(managers.map(m => m.id === 3 ? m : { ...m, squad: m.squad.slice(0, 20) }), { tactics: { 3: decisoes[3].tac }, lineups: {}, halftime: {}, penalty: {}, mods: {}, cardMods: {}, tecs: tecsBots }, R)
  assert.notEqual(tabela(semMistura.tables), tabela(juiz[R - 1].tables), 'sem as gavetas a temporada TEM que sair diferente')
  const kb = Buffer.byteLength(JSON.stringify(gavetas[0])) / 1024
  console.log(`✅ ${N} aparelhos, cada um só com o próprio clube: depois das gavetas, ${checados} conferências de placar+tabela iguais ao juiz e artilharia igual`)
  console.log(`📦 uma gaveta com a temporada inteira de decisões: ${kb.toFixed(1)} KB`)
} finally { await vite.close() }
