// 🌐 CARREIRA ONLINE v2 — o FLUXO no motor (19/10).   node scripts/carreira-online/testa-fluxo.mjs
// 1) o dono abre a carreira com 3 clubes de gente (+ bots) e roda o leilão de estreia, com os lances dos 3;
// 2) cada convidado recebe a última foto e passa a tocar o PRÓPRIO clube (CO2_ASSUME);
// 3) os 3 aparelhos, cada um mexendo só no seu time e trocando gavetas, jogam 10 rodadas e chegam no MESMO lugar.
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const { reducer, INITIAL, sanitizeParaSala, openSlots, co2SaveVersion } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const { pack, unpack } = await vite.ssrLoadModule('/src/escalacao/netpack.ts')
const { buildPyramid, simulatePyramid, computePromotions } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const { minhaGaveta, mesclaEntradas, congelaMeu, co2Fechamento } = await vite.ssrLoadModule('/src/escalacao/carreira-online-v2.ts')
const { computeCopaBrasil, computeSupercopa } = await vite.ssrLoadModule('/src/escalacao/copa-brasil.ts')
const { lineupAt } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
let falhas = 0
const ok = (c, m) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

const NOMES = ['Dono FC', 'Amigo Um', 'Amigo Dois']
// SEED=n fixa a semente da carreira (pra reproduzir uma falha)
const rnd0 = Math.random
if (process.env.SEED) Math.random = () => Number(process.env.SEED) / 1e9
let host = reducer(structuredClone(INITIAL), { type: 'START_CAREER_SOLO', teamName: NOMES[0], formation: '4-3-3', rivals: Number(process.env.BOTS ?? 5), co2: { sala: 'sala-teste', nomes: NOMES, assento: 0 } })
Math.random = rnd0
console.log('   semente:', host.seed)
ok(host.co2?.comanda === true && host.managers.filter(m => m.isHuman).length === 3, 'o dono abre a carreira com 3 clubes de gente')
ok(host.managers.slice(0, 3).every((m, i) => m.isHuman && m.id === i && m.teamName === NOMES[i]), 'os clubes de gente têm id = ordem dos assentos')
function rodaLeilao(host, fora = [], tamanhos = []) {
for (let i = 0; i < 5000 && host.screen !== 'season'; i++) {
  if (i % 25 === 0) tamanhos.push(pack(sanitizeParaSala(host)).length)
  if (host.screen === 'auction') {
    if (host.phase === 'envelope' || host.phase === 'resq_envelope') {
      // cada clube de gente lança 1 moeda na 1ª carta do setor (o "convidado" manda pelo canal; aqui vai direto no motor)
      if (process.env.DBG && host.currentCards.some(c => c.id === 'reserva-teste')) console.log('DBG', host.currentCards.find(c => c.id === 'reserva-teste').pos, host.managers.filter(x => x.isHuman).map(x => [x.id, x.money, openSlots(x, host.currentCards.find(c => c.id === 'reserva-teste').pos), x.squad.length]))
      for (const m of host.managers.filter(x => x.isHuman && !fora.includes(x.id))) {
        if (host.submitted.includes(m.id)) continue
        // lança em 2 cartas do setor (valor que cabe no bolso), cada um em cartas diferentes
        const soSonda = !!process.env.LANCE_SONDA && host.seasonNo === 2 && m.id === 1 // no teste do sondar, o amigo guarda vaga e caixa só pro reserva
        const cartas = [...host.currentCards.filter(c => c.sondadoPor === m.id), ...(soSonda ? [] : host.currentCards.filter((c, j) => j % 3 === m.id % 3 && c.sondadoPor !== m.id))].slice(0, 2)
        host = reducer(host, { type: 'SUBMIT_ENVELOPE', mgrId: m.id, bids: cartas.map(c => ({ cardId: c.id, amount: c.sondadoPor === m.id ? Math.max(c.paid ?? 0, 6 + m.id) + (process.env.LANCE_SONDA ? 0 : -99) : 6 + m.id })) })
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
    if (m?.isHuman && !fora.includes(m.id)) {
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
return host
}
const tamanhos = []
host = rodaLeilao(host, [], tamanhos)
ok(host.screen === 'season', `o leilão de estreia chega na temporada (parou em ${host.screen}/${host.phase})`)
const kbMax = Math.max(...tamanhos) / 1024
ok(kbMax < 200, `o estado do leilão que vai pela sala cabe (maior pacote ${kbMax.toFixed(0)} KB comprimido)`)
const versaoSave = co2SaveVersion(host)
const recebeGavetas = reducer(host, { type: 'CO2_GAVETAS', gavetas: [] })
ok(co2SaveVersion(recebeGavetas) === versaoSave, 'receber dados dos amigos não manda outro save privado inteiro')
const mudaMeuClube = reducer(recebeGavetas, { type: 'SET_TACTIC', mgrId: host.managers[host.youIdx].id, tactic: 'ataque' })
ok(co2SaveVersion(mudaMeuClube) > versaoSave, 'mudança do meu clube gera salvamento automático, mesmo na mesma rodada')
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
const RODADAS = 38 // 26/11: a temporada inteira (antes 10) — prepara a virada
for (let r = 0; r < RODADAS; r++) {
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
const simDe = (s) => {
  const meuId = s.managers[s.youIdx].id
  const e = mesclaEntradas(congelaMeu(entradasDe(s), s.co2?.minha, meuId, s.co2?.congeladoAte ?? -1), s.co2?.gavetas ?? [], meuId)
  const world = buildPyramid(s.managers, meuId, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
  return simulatePyramid(world, seasonSeed(s), s.round, e.tactics, e.lineups, 1.12, true, true, e.mods, e.halftime, e.penalty, e.tecs, e.cardMods)
}
const resultado = (s) => {
  const meuId = s.managers[s.youIdx].id
  const e = mesclaEntradas(congelaMeu(entradasDe(s), s.co2?.minha, meuId, s.co2?.congeladoAte ?? -1), s.co2?.gavetas ?? [], meuId)
  const world = buildPyramid(s.managers, meuId, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
  const sim = simulatePyramid(world, seasonSeed(s), s.round, e.tactics, e.lineups, 1.12, true, true, e.mods, e.halftime, e.penalty, e.tecs, e.cardMods)
  return Object.entries(sim.tables).map(([d, ts]) => d + ':' + ts.map(t => `${t.name}:${t.pts}:${t.gf}:${t.ga}`).join(',')).join('#')
}
if (process.env.DBG_SQ) for (const k of [1, 2]) {
  const proprio = JSON.stringify(aparelhos[k].managers.find(m => m.id === k).squad)
  const copia = JSON.stringify(aparelhos[0].managers.find(m => m.id === k).squad)
  if (proprio !== copia) { const a = JSON.parse(proprio), b = JSON.parse(copia); console.log('DBG elenco', k, 'difere', a.length, b.length, JSON.stringify(a.map((c, i) => Object.keys({ ...c, ...b[i] }).filter(f => JSON.stringify(c[f]) !== JSON.stringify(b[i]?.[f])).map(f => f + ':' + JSON.stringify(c[f]) + '≠' + JSON.stringify(b[i]?.[f]))).filter(x => x.length)).slice(0, 400)) }
}
const r0 = resultado(aparelhos[0])
ok(aparelhos.every(s => s.round === RODADAS), `os 3 aparelhos estão na rodada ${RODADAS}`)
ok(aparelhos.every(s => resultado(s) === r0), `depois de ${RODADAS} rodadas, as 5 tabelas são IGUAIS nos 3 aparelhos`)
// 🔼🔽 fim da temporada: quem sobe e quem cai sai IGUAL em todo aparelho (a pirâmide da T2 depende disso)
const sobeCai = (s) => JSON.stringify(computePromotions(simDe(s).tables))
const p0 = sobeCai(aparelhos[0])
ok(aparelhos.every(s => sobeCai(s) === p0), 'fim da temporada: sobe/cai IGUAL nos 3 aparelhos')
// 🏆 a copa do fim: o DONO congela a escalação de todo mundo (mundo.copaXi) e todo aparelho monta a MESMA Copa do Brasil + Supercopa
const eDono = mesclaEntradas(congelaMeu(entradasDe(host), host.co2?.minha, 0, host.co2?.congeladoAte ?? -1), host.co2?.gavetas ?? [], 0)
const xi = {}
for (const m of host.managers) if (m.isHuman) xi[m.id] = lineupAt(eDono.lineups, m.id, 38, m.squad, m.formation).map(c => c.id)
for (let k = 0; k < 3; k++) aparelhos[k] = reducer(aparelhos[k], { type: 'FREEZE_COPA_XI', season: aparelhos[k].seasonNo ?? 1, xi })
const copaDe = (s) => {
  const meuId = s.managers[s.youIdx].id
  const e = mesclaEntradas(congelaMeu(entradasDe(s), s.co2?.minha, meuId, s.co2?.congeladoAte ?? -1), s.co2?.gavetas ?? [], meuId)
  const lin = { ...e.lineups }; for (const k in s.copaXi) lin[+k] = { ...(lin[+k] ?? {}), 38: s.copaXi[+k] }
  const t = simDe(s).tables
  const cb = computeCopaBrasil(t, s.seed, s.seasonNo, 1.12, true, lin)
  const sc = cb?.champion ? computeSupercopa(t, cb.champion, s.seed, s.seasonNo, 1.12, true, lin) : null
  return JSON.stringify([cb?.champion?.name, cb?.vice?.name ?? null, (cb?.scorers ?? []).slice(0, 5), sc?.win, sc?.a?.name, sc?.b?.name])
}
const c0 = copaDe(aparelhos[0])
ok(aparelhos.every(s => copaDe(s) === c0), `copa do fim (Copa do Brasil + Supercopa) IGUAL nos 3 aparelhos (campeão: ${JSON.parse(c0)[0]})`)
if (!aparelhos.every(s => copaDe(s) === c0)) console.log('   ⚠️ semente pra reproduzir:', host.seed, aparelhos.map(s => copaDe(s)).join(' ‖ '))

// 🔄 VIRADA: o aparelho 0 (dono) e o 1 fecham a temporada; o 2 FALTOU. O dono abre o leilão de todos com os fechamentos.
const argsFim = (s) => { const t = simDe(s).tables; return { placements: computePromotions(t), champions: {}, copaChampion: null } }
const pl0 = JSON.stringify(argsFim(aparelhos[0]).placements)
ok(aparelhos.every(s => JSON.stringify(argsFim(s).placements) === pl0), 'virada: as divisões da T2 saem iguais em todo aparelho')
// marca de "estádio" do aparelho 1 (o que é do clube dele e o leilão não pode apagar)
aparelhos[1] = { ...aparelhos[1], careerTorcida: { ...(aparelhos[1].careerTorcida ?? {}), marca1: 77 } }
for (const k of [0, 1]) {
  let s = reducer(aparelhos[k], { type: 'OPEN_RESERVE_LIST', ...argsFim(aparelhos[k]) })
  ok(s.screen === 'reserveList' && s.seasonNo === 2, `aparelho ${k}: fecha as contas e abre a janela da T2 (${s.screen}, T${s.seasonNo})`)
  s = reducer(s, { type: 'CO2_FECHA' })
  ok(s.co2?.fechou === 2, `aparelho ${k}: fechou a temporada`)
  aparelhos[k] = s
}
// 🕵️ SONDAR DE AMIGO: o dono tem um RESERVA a mais; o aparelho 1 enxerga (gaveta) e sonda
const FORM = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 } }
const amigoUm = aparelhos[1].managers[1]
const posVaga = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].sort((a, b) => (amigoUm.squad.filter(c => c.pos === a).length - (FORM['4-3-3'][a] * 2)) - (amigoUm.squad.filter(c => c.pos === b).length - (FORM['4-3-3'][b] * 2)))[0]
const reserva = { ...aparelhos[0].managers[0].squad.find(c => c.pos === posVaga), pos: posVaga, id: 'reserva-teste', name: 'Reserva do Dono', lo: 60, hi: 70, paid: 9 }
aparelhos[0] = { ...aparelhos[0], managers: aparelhos[0].managers.map(m => m.id === 0 ? { ...m, squad: [...m.squad, reserva] } : m) }
aparelhos[1] = { ...aparelhos[1], managers: aparelhos[1].managers.map(m => m.id === 0 ? { ...m, squad: [...m.squad, reserva] } : m) }
const titDono = aparelhos[1].managers[0].squad.find(c => c.id !== 'reserva-teste')
ok(reducer(aparelhos[1], { type: 'ALICIAR_MARCAR', cardId: titDono.id }).aliciarJogadores?.length !== 1 || false, 'titular do amigo NÃO pode ser sondado')
aparelhos[1] = reducer(aparelhos[1], { type: 'ALICIAR_MARCAR', cardId: 'reserva-teste' })
if (process.env.LANCE_SONDA) aparelhos[1] = { ...aparelhos[1], careerCoins: { ...aparelhos[1].careerCoins, 1: (aparelhos[1].careerCoins?.[1] ?? 0) + 60 } }
ok(JSON.stringify(aparelhos[1].aliciarJogadores) === '["reserva-teste"]', 'reserva do amigo pode ser sondado')
const caixa1 = aparelhos[1].careerCoins?.[1]
const fech1 = JSON.parse(JSON.stringify(co2Fechamento(aparelhos[1])))
ok(fech1 && fech1.temporada === 2 && fech1.squad.length >= 11, 'o fechamento do aparelho 1 leva elenco e caixa')
// o 1 tenta abrir o leilão sozinho: nada acontece
ok(reducer(aparelhos[1], { type: 'RESERVE_AUCTION_ONLINE' }) === aparelhos[1] || reducer(aparelhos[1], { type: 'RESERVE_AUCTION_ONLINE' }).screen === 'reserveList', 'quem não é dono não abre o leilão de todos')
const expiradosAus = aparelhos[0].managers.find(m => m.id === 2).squad.filter(c => c.contratoAte != null && c.contratoAte < 2).length
// 🙋 27/11: um amigo novo (pedido aceito pelo dono) entra NA VIRADA assumindo um clube da máquina
const { vagasDeNovos } = await vite.ssrLoadModule('/src/escalacao/carreira-online-v2.ts')
const vagaNovo = vagasDeNovos(aparelhos[0].managers, aparelhos[0].careerPlacements, 1)[0]
const botNovo = aparelhos[0].managers.find(m => m.id === vagaNovo)
ok(botNovo && ['D', 'V'].includes(aparelhos[0].careerPlacements?.[`m${botNovo.id}`] ?? 'V'), `a vaga do amigo novo é um bot da máquina lá de baixo (${aparelhos[0].careerPlacements?.[`m${botNovo?.id}`]})`)
const caixaBot = aparelhos[0].careerCoins?.[botNovo?.id] ?? botNovo?.money
// 🚪 27/11: quem SAIU da carreira — o clube vira da máquina na virada, com o mesmo elenco (teste num ramo à parte)
{
  const hs = reducer(aparelhos[0], { type: 'CO2_ABRE_VIRADA', fechamentos: { 1: fech1 }, saidas: [2, 0] })
  const m2 = (hs.managers ?? []).find(m => m.id === 2)
  ok(m2 && !m2.isHuman, 'quem saiu: o clube vira da máquina na virada')
  ok(m2 && m2.squad.length > 0 && !(hs.co2?.fora ?? []).includes(2), 'e o bot assume o elenco (não fica "fora" como quem só faltou)')
  ok(hs.managers.find(m => m.id === 0)?.isHuman, 'o MEU clube nunca vira da máquina, mesmo se vier na lista')
  ok((hs.marketLog ?? []).some(l => l.includes('agora é da máquina')), 'a notícia conta que o clube virou da máquina')
}
let h = reducer(aparelhos[0], { type: 'CO2_ABRE_VIRADA', fechamentos: { 1: fech1 }, novos: botNovo ? [{ mgr: botNovo.id, nome: 'Amigo Novo' }] : [] })
ok(!!botNovo && h.managers.find(m => m.id === botNovo.id)?.isHuman && h.managers.find(m => m.id === botNovo.id)?.teamName === 'Amigo Novo', `o amigo novo assume o clube da máquina na virada (${botNovo?.teamName} → Amigo Novo)`)
ok(!!botNovo && (h.co2?.fora ?? []).includes(botNovo.id), 'o amigo novo fica de fora do leilão da virada (não fechou nada)')
ok((h.marketLog ?? []).some(l => l.includes('Amigo Novo chegou na carreira no lugar do')), 'a notícia diz no lugar de qual clube ele entrou')
ok(h.screen !== 'reserveList', `o dono abre o leilão de todos (${h.screen}/${h.phase})`)
ok((h.co2?.fora ?? []).includes(2) && !(h.co2?.fora ?? []).includes(1), 'quem não fechou fica fora do leilão')
ok(h.careerCoins?.[1] === caixa1, `caixa do 1 no leilão = o caixa que o aparelho dele fechou (${h.careerCoins?.[1]} = ${caixa1})`)
// o aparelho 1 assiste (espelho) e o dono roda o leilão
let a1 = reducer(aparelhos[1], { type: 'CO2_ESPELHO', newState: unpack(pack(sanitizeParaSala(h))), meuId: 1 })
ok(a1.co2?.espelho === true && !!a1.co2?.base, 'o aparelho 1 passa a assistir o leilão e guarda o próprio clube')
const lote = Object.values(h.deck ?? {}).flat().concat(h.currentCards ?? []).find(c => c.id === 'reserva-teste')
ok(!!lote && lote.sondadoPor === 1 && lote.seller === 0 && !h.managers[0].squad.some(c => c.id === 'reserva-teste'), `o reserva sondado vai pro leilão de todos (mínimo ${lote?.paid})`)
h = rodaLeilao(h, [2])
ok(h.screen === 'season' && h.seasonNo === 2 && h.round === 0, `o leilão da virada termina na T2 (${h.screen})`)
a1 = reducer(a1, { type: 'CO2_ASSUME', newState: unpack(pack(sanitizeParaSala(h))), meuId: 1 })
if (botNovo) {
  const novo = reducer(structuredClone(INITIAL), { type: 'CO2_NOVO', newState: unpack(pack(sanitizeParaSala(h))), meuId: botNovo.id })
  ok(novo.managers[novo.youIdx]?.id === botNovo.id && novo.managers[novo.youIdx].teamName === 'Amigo Novo' && novo.co2?.comanda === false && novo.screen === 'season', 'o aparelho do amigo novo carrega a carreira pela foto da virada, no clube dele')
  ok(!(novo.careerLedger ?? []).some(e => e.mgrId != null && e.mgrId !== botNovo.id), 'o extrato do amigo novo não traz o do dono')
  ok(reducer(novo, { type: 'CO2_NOVO', newState: unpack(pack(sanitizeParaSala(h))), meuId: botNovo.id }) === novo, 'quem já tem a carreira no aparelho não é sobrescrito pela foto')
}
ok(a1.screen === 'season' && a1.seasonNo === 2 && !a1.co2?.espelho && !a1.co2?.base, 'o aparelho 1 volta a tocar o próprio clube na T2')
ok(a1.careerTorcida?.marca1 === 77, 'o que é do clube do 1 (fora do leilão) não se perde na virada')
ok(a1.managers[a1.youIdx].id === 1 && JSON.stringify(a1.managers[a1.youIdx].squad.map(c => c.id)) === JSON.stringify(h.managers.find(m => m.id === 1).squad.map(c => c.id)), 'o elenco do 1 depois do leilão é o mesmo nos dois aparelhos')
ok(a1.careerCoins?.[1] === h.careerCoins?.[1], `caixa do 1 bate (${a1.careerCoins?.[1]} = ${h.careerCoins?.[1]})`)
const mov1 = (h.careerLedgers?.[1] ?? []).filter(e => e.season === 2).reduce((n, e) => n + e.amount, 0)
ok(Math.abs(caixa1 + mov1 - a1.careerCoins?.[1]) < 0.01, `extrato do 1 fecha com o caixa depois da virada (${caixa1} ${mov1 >= 0 ? '+' : ''}${mov1} = ${a1.careerCoins?.[1]})`)
const aus = h.managers.find(m => m.id === 2)
ok(aus.squad.length >= 11 && !aus.squad.some(c => c.fake), 'o clube de quem faltou segue com time (sem jogador fake)')
ok(!aus.squad.some(c => c.contratoAte != null && c.contratoAte < 2), `quem faltou: contrato vencido renovou sozinho (${expiradosAus} vencidos)`)
ok(h.managers.every(m => !m.isHuman || !m.squad.some(c => c.fake)), 'nenhum clube de gente com jogador fake')
const ondeFoi = h.managers.find(m => m.squad.some(c => c.id === 'reserva-teste'))
ok(ondeFoi && ondeFoi.id !== undefined, `o reserva sondado terminou no ${ondeFoi?.teamName} (nunca sumiu)`)
if (process.env.LANCE_SONDA) ok(ondeFoi?.id === 1, 'quem sondou e deu lance ficou com o reserva (preferência de igualar)')
else ok(ondeFoi?.id === 0 ? (h.marketLog ?? []).some(l => /voltou pro Dono FC/.test(l)) : !ondeFoi?.isHuman || ondeFoi.id !== 0, `sem lance do amigo: o reserva ${ondeFoi?.id === 0 ? 'voltou pro dono' : 'foi comprado por ' + ondeFoi?.teamName} (nunca o dono comprando o próprio)`)
ok(!(h.managers[0].squad.find(c => c.id === 'reserva-teste')?.sondadoPor), 'carta não fica marcada depois do leilão')
console.log('   leilão:', (h.marketLog ?? []).filter(l => /sondou|igualou|voltou/.test(l)).join(' | '))
{
  const compraBot = (h.careerTransferHistory ?? []).filter(t => t.season === 2 && !h.managers.find(m => m.id === t.teamId)?.isHuman)
  console.log('   notícias:', (h.news ?? []).filter(n => /levou|repôs/.test(n)).slice(0, 3).join(' | ') || '(nenhuma)')
ok(process.env.BOTS !== '0' || compraBot.length === 0, `com 0 bots, nenhum clube de máquina comprou no leilão da virada (${compraBot.length})`)
}
// o 2 FALTOU: volta depois, fecha o clube dele e alcança pela FOTO da virada (a que o dono grava no banco)
let a2 = { ...aparelhos[2], careerTorcida: { ...(aparelhos[2].careerTorcida ?? {}), marca2: 55 } }
a2 = reducer(reducer(a2, { type: 'OPEN_RESERVE_LIST', ...argsFim(a2) }), { type: 'CO2_FECHA' })
const caixa2 = a2.careerCoins?.[2]
a2 = reducer(a2, { type: 'CO2_ALCANCA', newState: unpack(pack(sanitizeParaSala(h))), meuId: 2 })
ok(a2.screen === 'season' && a2.seasonNo === 2 && a2.careerTorcida?.marca2 === 55, 'quem faltou alcança pela foto da virada sem perder o que é do clube dele')
ok(JSON.stringify(a2.managers[a2.youIdx].squad.map(c => c.id)) === JSON.stringify(aus.squad.map(c => c.id)), 'quem faltou fica com o elenco que o leilão deixou (o mesmo time)')
const mov2 = (h.careerLedgers?.[2] ?? []).filter(e => e.season === 2).reduce((n, e) => n + e.amount, 0)
ok(a2.careerCoins?.[2] === caixa2 + mov2, `caixa de quem faltou = o dele + o que o leilão lançou (${caixa2} ${mov2 >= 0 ? '+' : ''}${mov2} = ${a2.careerCoins?.[2]})`)
aparelhos[0] = h; aparelhos[1] = a1; aparelhos[2] = a2
ok(aparelhos.every(s => JSON.stringify(s.careerPlacements) === JSON.stringify(h.careerPlacements)), 'T2: mesma pirâmide nos 3')
ok(aparelhos.every(s => JSON.stringify(s.cpuSquads) === JSON.stringify(h.cpuSquads)), 'T2: mesmos elencos dos bots nos 3')
// ⚽ 5 rodadas da T2 iguais
for (let r = 0; r < 5; r++) {
  for (let k = 0; k < 3; k++) { const s = aparelhos[k]; aparelhos[k] = reducer(s, { type: 'SET_TACTIC', mgrId: s.managers[s.youIdx].id, tactic: TACS[(r + k) % 3] }) }
  const gavetas = aparelhos.map(s => JSON.parse(JSON.stringify(minhaGaveta(s.managers[s.youIdx], entradasDe(s)))))
  for (let k = 0; k < 3; k++) aparelhos[k] = reducer(reducer(aparelhos[k], { type: 'CO2_GAVETAS', gavetas, ate: aparelhos[k].round }), { type: 'PLAY_ROUND' })
}
const t2 = resultado(aparelhos[0])
ok(aparelhos.every(s => s.round === 5 && resultado(s) === t2), 'T2: depois de 5 rodadas, as tabelas são IGUAIS nos 3 aparelhos')
// 📴 o 2 some 5 rodadas (o time dele joga sozinho nos outros aparelhos, com a última gaveta que ele subiu) e depois alcança
let gavetaVelha2 = JSON.parse(JSON.stringify(minhaGaveta(aparelhos[2].managers[aparelhos[2].youIdx], entradasDe(aparelhos[2]))))
let ultimas = null
for (let r = 0; r < 5; r++) {
  for (const k of [0, 1]) { const s = aparelhos[k]; aparelhos[k] = reducer(s, { type: 'SET_TACTIC', mgrId: s.managers[s.youIdx].id, tactic: TACS[(r + k + 1) % 3] }) }
  ultimas = [0, 1].map(k => JSON.parse(JSON.stringify(minhaGaveta(aparelhos[k].managers[aparelhos[k].youIdx], entradasDe(aparelhos[k]))))).concat([gavetaVelha2])
  for (const k of [0, 1]) aparelhos[k] = reducer(reducer(aparelhos[k], { type: 'CO2_GAVETAS', gavetas: ultimas, ate: aparelhos[k].round }), { type: 'PLAY_ROUND' })
}
ok(aparelhos[2].round === 5 && aparelhos[0].round === 10, 'o 2 ficou parado na rodada 5 enquanto a turma foi pra 10')
aparelhos[2] = reducer(aparelhos[2], { type: 'CO2_ALCANCA_RODADAS', gavetas: ultimas, ate: 10 })
const t3 = resultado(aparelhos[0])
ok(aparelhos[2].round === 10, `quem voltou alcança a rodada da turma (rodada ${aparelhos[2].round})`)
ok(aparelhos.every(s => resultado(s) === t3), 'quem voltou vê as MESMAS tabelas que a turma viu')
// 🚨 27/11: a crise dos -500 vale na carreira online (cada aparelho cuida do próprio clube, igual à tradicional)
{
  const a = aparelhos[1], me = a.managers[a.youIdx]
  const alvo = [...me.squad].sort((x, y) => (y.fame - x.fame) || (y.hi - x.hi))[0]
  const c = reducer(a, { type: 'START_CAREER_CRISE', mgrId: me.id, barrier: -500, playerId: alvo.id, playerName: alvo.name, pos: alvo.pos })
  ok(c.careerCrise?.[me.id]?.playerId === alvo.id, `crise dos -500 dispara na carreira online (${alvo.name} anuncia saída)`)
  const r = reducer(c, { type: 'RESOLVE_CAREER_CRISE', mgrId: me.id, choice: 'base' })
  const eu = r.managers[r.youIdx]
  ok(!eu.squad.some(x => x.id === alvo.id) && eu.squad.length === me.squad.length && !eu.squad.some(x => x.fake), 'resolvida com a Cria da Base: sai o craque, entra o guri (nunca fake)')
}
// Retorno após três temporadas de ausência, sem herdar o presidente nem duplicar o caixa.
{
 const base={...aparelhos[2],co2:{...aparelhos[2].co2,comanda:false},careerTorcida:{...aparelhos[2].careerTorcida,minhaMarca:71}},cmd={...aparelhos[0],seasonNo:5,round:0,screen:'season',careerCoins:{...aparelhos[0].careerCoins,2:321},careerPlacements:{...aparelhos[0].careerPlacements,m2:'B'}}
 const voltou=reducer(base,{type:'CO2_RETORNO',newState:cmd,meuId:2})
 ok(voltou.seasonNo===5&&voltou.youIdx===2&&voltou.careerCoins[2]===321&&voltou.careerPlacements.m2==='B','retorno de várias temporadas: calendário, caixa e divisão atuais da sala')
 const donoRetorna=reducer({...base,co2:{...base.co2,comanda:true}},{type:'CO2_RETORNO',newState:cmd,meuId:2});ok(donoRetorna.co2.comanda===true,'retorno em outro aparelho não rebaixa o dono')
 ok(voltou.stadiums===base.stadiums&&voltou.careerPresident===base.careerPresident&&voltou.careerTorcida.minhaMarca===71,'retorno preserva estádio, presidente e torcida do próprio clube')
 ok(reducer(voltou,{type:'CO2_RETORNO',newState:cmd,meuId:2})===voltou,'repetir o retorno não duplica prêmios nem dinheiro')
 ok(reducer(base,{type:'CO2_RETORNO',newState:{...cmd,co2:{...cmd.co2,sala:'outra'}},meuId:2})===base,'não aceita foto de outra carreira')
}
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ fluxo da carreira online v2 ok')
await vite.close()
process.exit(falhas ? 1 : 0)
