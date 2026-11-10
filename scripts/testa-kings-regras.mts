// 🧪 Kings League: confere CADA regra em centenas de partidas de verdade (motor do jogo) — e que o PLACAR bate com os lances.
// uso: npx tsx scripts/testa-kings-regras.mts
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState, MatchResult } from '../src/escalacao/types'
import { OPCOES_CORINGA, PLACAR_MB, PLACAR_DOBRO_INI, PLACAR_INTERVALO, kParaPlacar, aplicaRegrasKings, agendaKings } from '../src/escalacao/kings-liga'
import type { KingsBase } from '../src/escalacao/types'
import { radioDoJogo, narraRadio } from '../src/escalacao/radio'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const gols = (r: MatchResult, id: number) => r.highlights.filter(h => h.kind === 'gol' && h.teamId === id)
const jogos: MatchResult[] = []
let giroVazio = 0
let ultimo: EscState | null = null
for (let t = 0; t < 12; t++) {
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, kings: true, copaMode: 'liga', league: 'br' })
  for (let i = 0; i < 3000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') { if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: s.managers[s.youIdx].id, bids: [] }); continue } if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' }); continue } s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' }); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
    s = reducer(s, { type: 'FORCE_SEAL' })
  }
  for (let r = 0; r < 9; r++) {
    s = reducer(s, { type: 'PLAY_ROUND' }); jogos.push(...s.lastResults.filter(x => x.kingsBase))
    if (s.lastResults.some(x => !x.kingsBase && x.highlights.filter(h => h.kind === 'gol').length !== x.hg + x.ag)) giroVazio++
  }
  ultimo = s
}
console.log(`(${jogos.length} partidas com gente conferidas lance a lance)`)
// ⚽ quantidade e MOMENTO dos gols (a Kings de verdade: ~7 por jogo; muito gol no 1×1 e no dado)
{
  const tot = jogos.reduce((a, r) => a + r.hg + r.ag, 0) / jogos.length
  const crus = jogos.map(r => r.kingsBase!.highlights.filter(h => h.kind === 'gol'))
  const porMin = (a: number, b: number) => crus.reduce((x, l) => x + l.filter(h => h.min >= kParaPlacar(a) && h.min < kParaPlacar(b)).length, 0) / crus.length / (b - a)
  const um = porMin(0, 2), escal = porMin(2, 7), sete = porMin(7, 18), dado = porMin(20, 23), seg = porMin(20, 36)
  const cedo = crus.filter(l => l.some(h => h.min < kParaPlacar(2))).length / crus.length
  const goleiro = jogos.some(r => r.kingsBase!.highlights.some(h => h.kind === 'gol' && h.min < kParaPlacar(3) && /^⚽ /.test(h.text)) )
  console.log(`   média ${tot.toFixed(1)} gols/jogo · por minuto: 1×1 ${um.toFixed(2)} · escalonado ${escal.toFixed(2)} · 7×7 ${sete.toFixed(2)} · dado ${dado.toFixed(2)} · 2º tempo ${seg.toFixed(2)} · ${Math.round(cedo * 100)}% dos jogos com gol nos 2 primeiros minutos`)
  ok(tot >= 6 && tot <= 9.5, `⚽ média de ${tot.toFixed(1)} gols por jogo (Kings de verdade ≈ 7,4)`)
  ok(um > sete * 2 && dado > sete * 1.8 && escal > sete, '⚽ sai MUITO mais gol no 1×1 e no dado do que no 7×7')
  ok(cedo > 0.2 && goleiro, `⚽ gol logo no 1×1 acontece (${Math.round(cedo * 100)}% dos jogos)`)
}
// placar
ok(jogos.every(r => gols(r, r.homeId).length === r.hg && gols(r, r.awayId).length === r.ag), 'PLACAR: o número que aparece na tela (lance a lance) bate com o resultado da tabela em TODA partida')
// ⏱️ MATCH BALL (regra de 10/11): no 36' o relógio para. Empatado → shootout e nada depois do 36' vale; alguém na frente →
// vence quem chegar primeiro a (líder + 1), o gol decisivo acaba o jogo e nada vem depois dele
const golT = (r: MatchResult) => r.highlights.filter(h => h.kind === 'gol')
ok(jogos.every(r => !!r.kings!.mb), '⏱️ todo jogo novo tem o match ball do 36\'')
const mbEmp = jogos.filter(r => r.kings!.mb!.empate)
ok(mbEmp.length > 0 && mbEmp.every(r => r.hg === r.ag && !!r.kings!.pens && !golT(r).some(h => h.min > PLACAR_MB)), `⏱️ EMPATADO no 36' → SHOOTOUT direto, nenhum gol depois — ${mbEmp.length} casos`)
const mbLid = jogos.filter(r => !r.kings!.mb!.empate)
for (const r of mbLid) { const mb = r.kings!.mb!, ult = golT(r).at(-1)!; if (!(Math.max(r.hg, r.ag) === mb.alvo && Math.min(r.hg, r.ag) < mb.alvo! && ult.text.startsWith('⏱️ MATCH BALL') && ult.min === mb.fim && !r.highlights.some(h => h.min > mb.fim) && !r.kings!.pens)) { if (process.env.DBG) console.log(JSON.stringify({ hg: r.hg, ag: r.ag, mb, pens: r.kings!.pens, fim: r.highlights.filter(h => h.min > 80).map(h => `${h.min} ${h.teamId} ${h.text}`) })) } }
ok(mbLid.length > 0 && mbLid.every(r => { const mb = r.kings!.mb!, ult = golT(r).at(-1)!; return Math.max(r.hg, r.ag) === mb.alvo && Math.min(r.hg, r.ag) < mb.alvo! && ult.text.startsWith('⏱️ MATCH BALL') && ult.min === mb.fim && !r.highlights.some(h => h.min > mb.fim) && !r.kings!.pens }),
  `⏱️ ALGUÉM NA FRENTE no 36' → vence quem chega primeiro a líder+1, e o jogo acaba no gol que decide — ${mbLid.length} casos (${mbLid.filter(r => { const ant = golT(r).filter(h => h.min <= PLACAR_MB), lid = ant.filter(h => h.teamId === r.homeId).length * 2 > ant.length ? r.homeId : r.awayId; return (r.hg > r.ag ? r.homeId : r.awayId) !== lid }).length} viradas de quem estava atrás)`)
// ✖️2 do 17' ao 20': todo gol "de jogo" dos dois times ganha o 2º lance no mesmo minuto
const janela = jogos.flatMap(r => golT(r).filter(h => h.text.startsWith('⚽') && h.min >= PLACAR_DOBRO_INI && h.min < PLACAR_INTERVALO).map(g => ({ r, g })))
ok(janela.length > 0 && janela.every(({ r, g }) => r.highlights.some(d => d.kind === 'gol' && d.min === g.min && d.teamId === g.teamId && /^(✖️2|⭐)/.test(d.text))), `✖️2 DO 17' AO 20': todo gol vale 2, pros dois times — ${janela.length} gols conferidos`)
// prova montada: empatado no 36' com gols depois → somem do placar E da artilharia
{
  let achou = 0, certo = 0
  for (let seed = 1; seed < 400 && achou < 20; seed++) {
    const base: KingsBase = { highlights: [
      { min: 10, text: '⚽ Fulano marca para Casa!', teamId: 1, kind: 'gol' },
      { min: 30, text: '⚽ Beltrano marca para Fora!', teamId: 2, kind: 'gol' },
      { min: 88, text: '⚽ Ciclano marca para Casa!', teamId: 1, kind: 'gol' },
    ], tmpS: [{ name: 'Fulano', teamId: 1, teamName: 'Casa', goals: 1 }, { name: 'Ciclano', teamId: 1, teamName: 'Casa', goals: 1 }, { name: 'Beltrano', teamId: 2, teamName: 'Fora', goals: 1 }], tmpA: [], seed, rodada: 0, decisoes: {}, art: { s: [], a: [] } }
    const r = { homeId: 1, awayId: 2, hg: 0, ag: 0, highlights: [] } as MatchResult
    const art = aplicaRegrasKings(r, base, { agenda: agendaKings(seed, 0), nomes: { h: 'Casa', a: 'Fora' }, humanos: [], estrela: () => null, linha: () => [] })
    if (!r.kings!.mb!.empate) continue // cobranças/cartas desse sorteio desempataram antes do 36'
    achou++
    if (!art.s.some(x => x.name === 'Ciclano') && !r.highlights.some(h => h.min > PLACAR_MB) && r.hg === r.ag && !!r.kings!.pens) certo++
  }
  ok(achou > 0 && certo === achou, `⏱️ (jogo montado) empatado no 36': o gol do 88' não existe — nem no placar nem na artilharia — ${certo}/${achou}`)
}
// cartas
const cartas = jogos.flatMap(r => (r.kings!.cartas ?? []).map(c => ({ r, c })))
const tipos = new Set(cartas.map(x => x.c.vale)); const sorteadas = new Set(cartas.map(x => x.c.sorteada))
ok(['penalti', 'shootout', 'suspensao', 'gol_dobro', 'estrela'].every(t => tipos.has(t as never)) && sorteadas.has('coringa'), `🃏 todas as cartas saem no sorteio (${[...sorteadas].join(', ')})`)
const dobro = cartas.filter(x => x.c.vale === 'gol_dobro')
const dobroOk = dobro.every(({ r, c }) => { const ate = c.min + kParaPlacar(4); return gols(r, c.teamId).filter(g => g.text.startsWith('⚽') && g.min >= c.min && g.min <= ate && g.min <= PLACAR_MB).every(g => r.highlights.some(d => d.text.startsWith('✖️2') && d.min === g.min && d.teamId === c.teamId)) })
const dobroComGol = dobro.filter(({ r, c }) => r.highlights.some(d => d.text.startsWith('✖️2') && d.teamId === c.teamId)).length
ok(dobro.length > 0 && dobroOk && dobroComGol > 0, `✖️2 GOL EM DOBRO: todo gol do time nos 4 min vale 2 — ${dobro.length} cartas, ${dobroComGol} com gol dobrado`)
const est = cartas.filter(x => x.c.vale === 'estrela')
// ⭐ 10/11: TODO gol do jogador estrela vale 2, da carta até o 36' (no match ball, não)
const estOk = est.every(({ r, c }) => r.highlights.filter(h => h.teamId === c.teamId && h.min >= c.min && h.min <= PLACAR_MB && h.text.startsWith(`⚽ ${c.estrela} marca`)).every(g => r.highlights.some(d => d.text.startsWith('⭐') && d.min === g.min && d.teamId === c.teamId)))
ok(est.length > 0 && est.every(x => !!x.c.estrela) && estOk, `⭐ JOGADOR ESTRELA: TODO gol dele vale 2 até o 36' — ${est.length} cartas, ${est.filter(({ r }) => r.highlights.some(h => h.text.startsWith('⭐'))).length} com gol da estrela`)
// 🃏 10/11: as ESCOLHAS de quem é gente — coringa vira a carta escolhida · suspensão tira o jogador escolhido (bot: sorteio)
{
  let coringaOk = 0, coringaN = 0, suspOk = 0, suspN = 0
  for (let seed = 1; seed < 3000 && (coringaN < 10 || suspN < 10); seed++) {
    const mk = (dec: Record<string, number>) => { const base: KingsBase = { highlights: [], tmpS: [], tmpA: [], seed, rodada: 0, decisoes: dec, art: { s: [], a: [] } }; const r = { homeId: 1, awayId: 2, hg: 0, ag: 0, highlights: [] } as MatchResult; aplicaRegrasKings(r, base, { agenda: agendaKings(seed, 0), nomes: { h: 'Casa', a: 'Fora' }, humanos: [1], estrela: () => 'Craque', linha: id => id === 2 ? ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'] : ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'] }); return r.kings!.cartas!.find(c => c.teamId === 1)! }
    const c0 = mk({})
    if (c0.sorteada === 'coringa' && coringaN < 10) { coringaN++; const c1 = mk({ 'coringa:h': 3 }); if (c1.vale === OPCOES_CORINGA[3]) coringaOk++ }
    if (c0.vale === 'suspensao' && c0.sorteada === 'suspensao' && suspN < 10) { suspN++; const c1 = mk({ 'susp:h': 4 }); if (c1.suspenso === 'F5') suspOk++ }
  }
  ok(coringaN > 0 && coringaOk === coringaN, `🃏 CORINGA: vira a carta que a pessoa escolheu — ${coringaOk}/${coringaN}`)
  ok(suspN > 0 && suspOk === suspN, `🟥 SUSPENSÃO: sai o jogador que a pessoa escolheu — ${suspOk}/${suspN}`)
}
const susp = cartas.filter(x => x.c.vale === 'suspensao')
ok(susp.length > 0 && susp.every(x => !!x.c.suspenso), `🟥 SUSPENSÃO: sempre diz QUEM do rival saiu — ${susp.length} cartas, ${susp.filter(({ r, c }) => r.highlights.some(h => h.text.startsWith('🟥') && h.teamId === c.teamId)).length} viraram gol`)
// cobranças
const duelos = jogos.flatMap(r => (r.kings!.duelos ?? []).map(d => ({ r, d })))
// 🔄 o PÊNALTI INVERSO saiu da roleta em 10/11 (não está nas 6 cartas que o Diego mandou)
ok(!duelos.some(x => x.d.tipo === 'penalti_inverso'), '🔄 pênalti inverso não sai mais')
const pres = duelos.filter(x => x.d.tipo === 'presidente')
ok(jogos.every(r => (r.kings!.duelos ?? []).filter(d => d.tipo === 'presidente').length === 2), '🎩 PRESIDENTE: todo jogo tem 1 pênalti pra CADA time')
ok(pres.every(({ r, d }) => d.gol === r.highlights.some(h => h.text.startsWith('🎩') && h.teamId === d.batedor && h.min === d.min + 1)), `🎩 gol do presidente aparece no placar logo depois da cobrança (${pres.filter(x => x.d.gol).length}/${pres.length} entraram)`)
const sh = duelos.filter(x => x.d.tipo === 'shootout'), pen = duelos.filter(x => x.d.tipo === 'penalti' || x.d.tipo === 'presidente')
const taxa = (l: typeof duelos) => Math.round(100 * l.filter(x => x.d.gol).length / Math.max(1, l.length))
ok(sh.length > 0 && taxa(sh) < taxa(pen), `🏃 SHOOTOUT de carta entra MENOS que pênalti (${taxa(sh)}% × ${taxa(pen)}%)`)
// empate final
const emp = jogos.filter(r => r.hg === r.ag)
ok(emp.length > 0 && emp.every(r => !!r.kings!.pens && r.kings!.pens[0] !== r.kings!.pens[1]), `🥅 EMPATE no apito → SHOOTOUT (5 do meio-campo) sempre com vencedor — ${emp.length} casos`)
// dado
const faces = new Set(jogos.map(r => r.kings!.dado))
ok(faces.has(1) && faces.has(2) && faces.has(3), '🎲 DADO: sai 👑 cara do rei (1×1), 2×2 e 3×3')

// 📺 GIRO: os jogos sem gente também guardam os lances (senão o giro mostra '–' até o apito e parece que não sai gol)
ok(giroVazio === 0, '📺 GIRO: todo jogo da rodada (até bot × bot) tem os gols lance a lance pra rolar no giro')
// 🟨🟥 CARTÕES: amarelo = 2 min fora, vermelho = 5 min fora, nunca antes do 7×7, nome de gente de verdade
{
  const cs = jogos.flatMap(r => (r.kings!.cartoes ?? []).map(c => ({ r, c })))
  const am = cs.filter(x => x.c.cor === 'amarelo'), vm = cs.filter(x => x.c.cor === 'vermelho')
  const durOk = cs.every(({ c }) => { const k = Math.round(c.min * 40 / 93); return c.ate === 40 || (c.ate - k >= (c.cor === 'amarelo' ? 2 : 5) && c.ate - k <= (c.cor === 'amarelo' ? 4 : 7)) })
  for (const { c } of cs) { const k = Math.round(c.min * 40 / 93); if (!(c.ate === 40 || (c.ate - k >= (c.cor === 'amarelo' ? 2 : 5) && c.ate - k <= (c.cor === 'amarelo' ? 4 : 7))) || c.min < kParaPlacar(7) || !c.nome) console.log('   ⚠️', JSON.stringify(c)) }
  ok(am.length > 0 && vm.length >= 0 && cs.every(({ c }) => c.min >= kParaPlacar(7) && !!c.nome) && durOk,
    `🟨🟥 CARTÕES: ${am.length} amarelos (2 min fora) e ${vm.length} vermelhos (5 min fora) em ${jogos.length} jogos, todos depois do 7×7 e com o nome de quem saiu`)
}
// 📻 RÁDIO DA KINGS: fala MUITO de jogador (Diego 15/10: "não tô vendo quase nada falando dos jogadores")
{
  const r = jogos[0], m = ultimo!.managers
  const casa = m.find(x => x.id === r.homeId)!.squad, fora = m.find(x => x.id === r.awayId)!.squad
  let tot = 0, comNome = 0, cedo = 0
  const nomes = [...casa, ...fora].filter(c => !c.fake && c.club !== 'Várzea' && c.club !== 'Pickup').map(c => c.name)
  for (let sem = 0; sem < 40; sem++) for (const l of radioDoJogo(sem * 7919, [], 220_000, true)) {
    const txt = narraRadio(l, 'Casa FC', 'Fora FC', false, { casa, fora }, true)
    tot++; if (nomes.some(n => txt.includes(n))) comNome++
    if (l.min < kParaPlacar(7)) cedo++
  }
  ok(comNome / tot >= 0.6, `📻 RÁDIO DA KINGS cita jogador pelo nome em ${Math.round(comNome / tot * 100)}% das frases`)
  ok(cedo / 40 >= 5, `📻 RÁDIO DA KINGS fala no 1×1 até o 6×6: ${(cedo / 40).toFixed(1)} frases por jogo nessa fase`)
}
console.log(falhas ? `💥 ${falhas} falha(s)` : '🟢 todas as regras da Kings conferidas')
process.exit(falhas ? 1 : 0)
