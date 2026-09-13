// 🧪 EVENTO SEM RESERVA + CRIA (13/09, caso do São Luiz FC): o técnico trocou o
// lesionado na mão ANTES de confirmar o cria → a decisão tem que fechar do mesmo
// jeito (nunca mais "Confirmar" que não faz nada). Rodar: npx tsx scripts/testa-evento-cria.mjs
import { reducer, __ligaCondicaoSeCabe as ligaCondicao, __curaContratosVencidos as curaContratos, __descongelaContrato as descongela } from '../src/escalacao/store.tsx'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

const sq = []
for (const [id, pos] of [['GOL-2', 'GOL'], ['LAT-8', 'LAT'], ['LAT-7', 'LAT'], ['ZAG-7', 'ZAG'], ['ZAG-4', 'ZAG'], ['MEI-1', 'MEI'], ['MEI-2', 'MEI'], ['MEI-19', 'MEI'], ['ATA-1', 'ATA'], ['ATA-2', 'ATA'], ['ATA-3', 'ATA'], ['ZAG-128', 'ZAG']])
  sq.push({ id, name: id, club: 'X', year: 2000, pos, fame: 3, lo: 80, hi: 90, contratoAte: 550 })
const xiOriginal = sq.slice(0, 11).map(c => c.id)          // Domingos (ZAG-4) titular
const xiTrocado = xiOriginal.map(id => (id === 'ZAG-4' ? 'ZAG-128' : id)) // técnico botou o Bobby Moore

const base = () => ({
  careerOnline: true, onlineMode: 'cpu', agenciaOn: true, contratosOn: true, seed: 7, seasonNo: 545, round: 5, youIdx: 0,
  managers: [{ id: 0, isHuman: true, teamName: 'São Luiz FC', formation: '4-3-3', squad: sq.map(c => ({ ...c })) }],
  careerLineup: { 0: { 4: xiOriginal, 5: xiTrocado } },
  eventoTemporada: { pos: 'ZAG', nome: 'ZAG-4', tipo: 'lesao', mgrId: 0, round: 5, cardId: 'ZAG-4', season: 545, status: 'pendente', rodadas: 5, historia: 'x', criaOptions: ['Pipoquinha', 'Canelinha', 'Toquinho'] },
  careerPlacements: { m0: 'A' }, careerDivision: 'V', criaNames: [],
})

console.log('1) lesionado JÁ FORA do XI (o caso real) — a decisão tem que fechar')
let s = reducer(base(), { type: 'EVENTO_DECIDE_CRIA', nome: 'Pipoquinha', xi: xiTrocado })
ok(s.eventoTemporada.status === 'banco', `evento fechou: status = ${s.eventoTemporada.status} (era pendente e ficava pendente)`)
ok(s.eventoTemporada.volta === 10 && s.eventoTemporada.subNome === 'Pipoquinha', 'volta na rodada 10 · reserva registrado = Pipoquinha')
ok(s.managers[0].squad.some(c => c.cria && c.name === 'Pipoquinha' && c.pos === 'ZAG'), 'o Pipoquinha subiu (ZAG, cria)')
ok(JSON.stringify(s.careerLineup[0][5]) === JSON.stringify(xiTrocado), 'a escalação que o técnico fez na mão foi respeitada (Bobby Moore segue titular)')

console.log('2) lesionado ainda no XI (o caso normal) — cria entra na vaga dele')
s = reducer({ ...base(), careerLineup: { 0: { 4: xiOriginal } } }, { type: 'EVENTO_DECIDE_CRIA', nome: 'Toquinho', xi: xiOriginal })
const cria = s.managers[0].squad.find(c => c.cria)
ok(s.eventoTemporada.status === 'banco' && cria && s.careerLineup[0][5].includes(cria.id) && !s.careerLineup[0][5].includes('ZAG-4'), 'cria entrou no lugar do lesionado na rodada 5')
ok(JSON.stringify(s.careerLineup[0][10]) === JSON.stringify(xiOriginal), 'na volta (rodada 10) o lesionado retorna ao XI')

console.log('3) travas que continuam: nome fora das 3 opções / evento já decidido não mexem em nada')
const st0 = base()
ok(reducer(st0, { type: 'EVENTO_DECIDE_CRIA', nome: 'Fulano', xi: xiTrocado }).eventoTemporada.status === 'pendente', 'nome que não estava nas opções: ignora')
ok(reducer({ ...st0, eventoTemporada: { ...st0.eventoTemporada, status: 'banco' } }, { type: 'EVENTO_DECIDE_CRIA', nome: 'Pipoquinha', xi: xiTrocado }).managers[0].squad.every(c => !c.cria), 'evento já decidido: não sobe cria de novo')

console.log('4) gás liga ao abrir o save de quem já está em C/B/A (mesmo preso num banner)')
const g = base(); ligaCondicao(g)
ok(g.condicaoDesde === 545 && g.condicaoDesdeR === 5, `Série A, Agência, sem gás → liga: desde T${g.condicaoDesde}, rodada ${g.condicaoDesdeR}`)
const gv = { ...base(), careerPlacements: { m0: 'D' } }; ligaCondicao(gv)
ok(gv.condicaoDesde == null, 'Série D: continua desligado (só liga ao chegar na C)')
const go = { ...base(), onlineMode: 'online' }; ligaCondicao(go)
ok(go.condicaoDesde == null, 'online: não liga')

console.log('5) contrato que voltou do passado (Bobby Moore: até T481 na T545) → termina nesta temporada')
const c = base(); c.managers[0].squad.push({ id: 'BM', name: 'Bobby Moore', club: 'West Ham', year: 1966, pos: 'ZAG', fame: 5, lo: 88, hi: 93, contratoAte: 481 })
curaContratos(c)
const bm = c.managers[0].squad.find(x => x.id === 'BM')
ok(bm.contratoAte === 545, `Bobby Moore: contrato até ${bm.contratoAte} (a janela da virada decide: renova ou deixa ir)`)
ok(c.managers[0].squad.filter(x => x.id !== 'BM').every(x => x.contratoAte === 550), 'os outros contratos não foram tocados')

console.log('6) ❄️ empréstimo pra SAF CONGELA o contrato (regra do Diego 13/09)')
const L = { ...base(), careerFilial: { team: 'SAF Teste', loanOut: [], loanIn: [] }, cpuSquads: { 'SAF Teste': [] }, careerCoins: { 0: 100 } }
L.managers[0].squad.find(c => c.id === 'ZAG-128').contratoAte = 548 // faltam 3 além da T545
let e = reducer(L, { type: 'LOAN_TO_FILIAL', cardId: 'ZAG-128', mgrId: 0 })
const emprestado = e.careerFilial.loanOut[0]
ok(emprestado && emprestado.contratoRestante === 3 && !e.managers[0].squad.some(c => c.id === 'ZAG-128'), `emprestou na T545 com contrato até 548 → gravou restante = ${emprestado?.contratoRestante}`)
const volta545 = descongela({ ...emprestado }, 545)
ok(volta545.contratoAte === 548 && volta545.contratoRestante == null, 'voltou na MESMA temporada → contrato até 548 (igual saiu)')
const volta560 = descongela({ ...emprestado }, 560)
ok(volta560.contratoAte === 563, 'ficou 15 temporadas na SAF e voltou na T560 → contrato até 563 (mesmos 3 que tinha — o tempo lá não contou)')
e = reducer(e, { type: 'RETURN_FILIAL_LOAN', cardId: 'ZAG-128', mgrId: 0 })
const dv = e.managers[0].squad.find(c => c.id === 'ZAG-128')
ok(dv && dv.contratoAte === 548 && dv.contratoRestante == null && !dv.emprestado, 'RETURN_FILIAL_LOAN na mesma temporada: voltou com 548, sem o campo congelado')
const semCt = reducer({ ...L, managers: [{ ...L.managers[0], squad: L.managers[0].squad.map(c => (c.id === 'ZAG-128' ? { ...c, contratoAte: 545 } : c)) }] }, { type: 'LOAN_TO_FILIAL', cardId: 'ZAG-128', mgrId: 0 })
ok(semCt.careerFilial.loanOut.length === 0, 'contrato encerrando/encerrado (até 545 na T545) → NÃO deixa emprestar (travaContratoSaf, já existia)')
const legado = descongela({ id: 'x', contratoAte: 481 }, 545)
ok(legado.contratoAte === 545, 'empréstimo antigo (sem restante gravado, Bobby Moore): cura legada → termina nesta temporada')

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
