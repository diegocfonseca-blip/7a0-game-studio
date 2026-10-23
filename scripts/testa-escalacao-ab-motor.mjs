// 💾 ESCALAÇÃO A/B NO MOTOR (23/10): salvar → mexer no elenco → usar. Tudo ou nada, nunca com 10.
//   node scripts/testa-escalacao-ab-motor.mjs   (roda junto do `npm run escalacao-ab`)
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { reducer, INITIAL } = await server.ssrLoadModule('/src/escalacao/store.tsx')
const E = await server.ssrLoadModule('/src/escalacao/escalacao-salva.ts')
let erros = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }
const carta = (id, pos, n, lv = 70) => ({ id, name: `${pos}${n}`, club: 'Clube', year: 2000, pos, fame: 2, lo: lv - 5, hi: lv + 5, paid: 1, buyPrice: 1 })
const elenco = [carta('g1', 'GOL', 1), carta('g2', 'GOL', 2, 60),
  carta('l1', 'LAT', 1), carta('l2', 'LAT', 2), carta('l3', 'LAT', 3, 60),
  carta('z1', 'ZAG', 1), carta('z2', 'ZAG', 2), carta('z3', 'ZAG', 3, 60),
  carta('m1', 'MEI', 1), carta('m2', 'MEI', 2), carta('m3', 'MEI', 3), carta('m4', 'MEI', 4, 60),
  carta('a1', 'ATA', 1), carta('a2', 'ATA', 2), carta('a3', 'ATA', 3), carta('a4', 'ATA', 4, 60)]
const eu = { ...INITIAL.managers[0], id: 1, name: 'Eu', teamName: 'Meu FC', isHuman: true, formation: '4-3-3', money: 500, squad: elenco }
let s = { ...INITIAL, screen: 'season', careerOnline: true, onlineMode: 'solo', seasonNo: 3, round: 5, seed: 99, youIdx: 0, managers: [eu], careerLineup: {} }
const xiA = ['g1', 'l1', 'l2', 'z1', 'z2', 'm1', 'm2', 'm3', 'a1', 'a2', 'a3']
s = reducer(s, { type: 'SALVA_ESCALACAO', mgrId: 1, qual: 'A', ids: xiA, formation: '4-3-3' })
ok(s.careerEscalacoes?.[1]?.A?.keys.length === 11, 'salvou o Time A')
const antes = reducer(s, { type: 'SALVA_ESCALACAO', mgrId: 1, qual: 'B', ids: xiA.slice(0, 10), formation: '4-3-3' })
ok(!antes.careerEscalacoes?.[1]?.B, 'não salva com 10')
const errado = reducer(s, { type: 'SALVA_ESCALACAO', mgrId: 1, qual: 'B', ids: xiA, formation: '4-4-2' })
ok(!errado.careerEscalacoes?.[1]?.B, 'não salva 11 que não fecham a formação dita')
// vende o a2 e chega um "Pelé"
s = { ...s, managers: [{ ...s.managers[0], squad: [...s.managers[0].squad.filter(c => c.id !== 'a2'), carta('pele', 'ATA', 99, 99)] }] }
const m = s.managers[0]
const r = E.aplicaEscalacao({ esc: s.careerEscalacoes[1].A, squad: m.squad, fora: new Set(['m1']), formacaoAtual: m.formation, formacaoLiberada: () => true })
ok(r.ok && !r.ids.includes('a2') && !r.ids.includes('m1') && !r.ids.includes('pele'), 'monta sem o vendido, sem o suspenso e sem o novo')
const s2 = reducer(s, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: r.f, view: r.v, ids: r.ids })
const gravado = s2.careerLineup?.[1]?.[s2.round]
ok(gravado && gravado.join() === r.ids.join(), 'o motor gravou os 11 da próxima rodada')
// tudo ou nada: ids inválidos não mexem em nada
const s3 = reducer(s, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: '4-3-3', ids: r.ids.slice(0, 10) })
ok(JSON.stringify(s3.careerLineup) === JSON.stringify(s.careerLineup), 'com 10 nada muda (nunca segue faltando jogador)')
const s4 = reducer(s, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: '4-4-2', ids: r.ids })
ok(JSON.stringify(s4.careerLineup) === JSON.stringify(s.careerLineup) && s4.managers[0].formation === '4-3-3', '11 que não fecham a formação: nada muda')
// suspenso não entra nem pela porta do A/B
const sSusp = { ...s, eventoTemporada: { season: 3, round: 4, mgrId: 1, tipo: 'lesao', cardId: 'm1', nome: 'MEI1', pos: 'MEI', rodadas: 3, status: 'banco', volta: 9 } }
const idsComSusp = ['g1', 'l1', 'l2', 'z1', 'z2', 'm1', 'm2', 'm3', 'a1', 'pele', 'a3']
const s5 = reducer(sSusp, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: '4-3-3', ids: idsComSusp })
ok(JSON.stringify(s5.careerLineup) === JSON.stringify(sSusp.careerLineup), 'suspenso não entra pelo A/B (trava do motor)')
// troca de formação junto (4-4-2 com 4 meias)
const idsB = ['g1', 'l1', 'l2', 'z1', 'z2', 'm1', 'm2', 'm3', 'm4', 'a1', 'a3']
const semTec = reducer(s, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: '4-4-2', ids: idsB })
ok(semTec.managers[0].formation === '4-3-3' && JSON.stringify(semTec.careerLineup) === JSON.stringify(s.careerLineup), 'SEM técnico não troca de formação nem pelo A/B (regra de 28/08)')
const T = await server.ssrLoadModule('/src/escalacao/tecnicos.ts')
const tec = T.TECNICOS.find(t => T.fichaDoTecnico(t).formacoes.includes('4-4-2'))
const sTec = { ...s, careerTecnicos: { 'Meu FC': tec.nome } }
const s6 = reducer(sTec, { type: 'APLICA_ESCALACAO', mgrId: 1, formation: '4-4-2', ids: idsB })
ok(s6.managers[0].formation === '4-4-2' && s6.careerLineup?.[1]?.[s6.round]?.join() === idsB.join(), `com técnico que usa 4-4-2 (${tec.nome}): formação + 11 trocam juntos`)
// primeira temporada: não tem A/B (sem banco)
const s7 = reducer({ ...s, seasonNo: 1 }, { type: 'SALVA_ESCALACAO', mgrId: 1, qual: 'B', ids: xiA.map(x => x === 'a2' ? 'pele' : x), formation: '4-3-3' })
ok(!s7.careerEscalacoes?.[1]?.B, 'na 1ª temporada não existe (igual a troca)')
await server.close()
if (erros) { console.log(`\n❌ ${erros} falha(s)`); process.exit(1) }
console.log('\n✅ motor da escalação A/B seguro')
