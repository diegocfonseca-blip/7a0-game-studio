// 🎙️ trava da COLETIVA DE IMPRENSA (19/10, mockup `scripts/mockups/coletiva.png`). Confere o motor puro:
//   · todo banco tem PT e EN com a MESMA contagem; cada situação tem 3+ perguntas e 3+ frases por estilo; 2+ manchetes
//   · nada de "undefined"/placeholder solto depois de preencher · nenhuma frase fala de pênalti como lance de jogo
//   · a coletiva só acorda com assunto, respeita a espera por prioridade e NÃO repete frase na mesma temporada
//   · sorteio preso na semente (mesma entrada → mesma coletiva) · promessa feita volta cobrada no fim · fama muda
//   · arquirrival: um só, escolhido com critério, e o h2h soma cada jogo uma vez
//   npm run coletiva
import assert from 'node:assert/strict'
import { SITUACOES, REPORTERES, ESTILOS, montaColetiva, respondeColetiva, preenche, famaDoPresidente, fechaPromessas, melhoresFrases, escolheArquirrival, somaH2H, modsDaColetiva, COLETIVA_VAZIA, coletivaSana, type Ctx } from '../src/escalacao/coletiva'

// 1) o banco
let textos = 0
for (const s of SITUACOES) {
  assert.ok(s.perguntas.length >= 3, `${s.id}: 3+ perguntas`)
  for (const e of ESTILOS) { assert.ok(s.respostas[e].length >= 3, `${s.id}/${e}: 3+ respostas`); assert.ok(s.manchete[e].length >= 2, `${s.id}/${e}: 2+ manchetes`) }
  for (const p of s.perguntas) { assert.ok(p[0] && p[1], `${s.id}: pergunta PT e EN`); textos++ }
  for (const e of ESTILOS) for (const r of s.respostas[e]) { assert.ok(r.txt[0] && r.txt[1], `${s.id}: resposta PT e EN`); assert.ok(!/p[êe]nalti|penalty/i.test(r.txt[0] + r.txt[1]) || s.id === 'goleiro_penalti', `${s.id}: sem lance de pênalti`); textos++ }
  for (const e of ESTILOS) for (const m of s.manchete[e]) { assert.ok(m[0] && m[1]); textos++ }
  for (const rep of s.rep) assert.ok(REPORTERES[rep], `${s.id}: repórter ${rep} existe`)
}
assert.ok(SITUACOES.length >= 35, `35+ situações (${SITUACOES.length})`)
assert.ok(textos >= 600, `600+ textos PT/EN no banco (${textos})`)
console.log(`📚 ${SITUACOES.length} situações · ${textos} textos (cada um em PT e EN)`)

// 2) contexto de teste
const ctxBase = (over: Partial<Ctx> = {}): Ctx => ({
  rodada: 10, totalRodadas: 38, temporada: 3, div: 'B', clube: 'Testador FC', semVencer: 0, vitoriasSeguidas: 1, pos: 6, total: 20,
  zonaSubir: false, zonaCair: false, lider: false, caixa: 120, caixaAlto: false, caixaBaixo: false, pulosSeguidos: 0, rival: 'Rival FC', ...over,
})
// sem assunto → sem coletiva
assert.equal(montaColetiva(ctxBase({ placar: { gf: 1, ga: 0, adv: 'Qualquer', casa: true, virada: false, arquirrival: false } }), COLETIVA_VAZIA(), 7), null, 'vitória simples não acorda ninguém')
// clássico ganho acorda (prioridade 3)
const ctxClassico = ctxBase({ placar: { gf: 3, ga: 1, adv: 'Rival FC', casa: true, virada: false, arquirrival: true } })
const c1 = montaColetiva(ctxClassico, COLETIVA_VAZIA(), 7)
assert.ok(c1 && c1.sit === 'vitoria_rival', 'clássico ganho → vitoria_rival')
assert.deepEqual(montaColetiva(ctxClassico, COLETIVA_VAZIA(), 7), c1, 'presa na semente')
assert.ok(c1!.opcoes.length === 3 && new Set(c1!.opcoes.map(o => o.estilo)).size === 3, 'uma opção por estilo')
for (const o of c1!.opcoes) { const txt = preenche(o.frase, c1!.vars, 'pt'); assert.ok(!/\{\w+\}|undefined|NaN/.test(txt), `frase preenchida: ${txt}`) }
assert.ok(preenche(c1!.pergunta, c1!.vars, 'pt').includes('Rival FC'), 'a pergunta cita o rival')

// 3) responder: efeito, manchete, promessa, contagem, sem repetir
let save = COLETIVA_VAZIA()
const r1 = respondeColetiva(save, c1!, 'provoca', ctxClassico, 7, { proximo: 10, classico: 20 })
save = r1.save
assert.equal(r1.efeito?.tipo, 'rival_motivado'); assert.ok(r1.manchete && r1.manchete[0].includes('Testador FC'), 'manchete com o clube')
assert.deepEqual(modsDaColetiva(save, 3), { 20: -3 }, 'rival motivado vira −3 no clássico')
assert.equal(save.contagem.provoca, 1); assert.equal(save.feitas.length, 1); assert.ok(save.feitas[0].frase?.[0])
// mesma situação de novo na mesma temporada (REPETE) → outra pergunta/frase
const c2 = montaColetiva({ ...ctxClassico, rodada: 14 }, save, 7)
assert.ok(c2 && c2.sit === 'vitoria_rival', 'clássico pode repetir na temporada')
assert.notEqual(c2!.qi, c1!.qi, 'pergunta diferente da já usada')
const r2 = respondeColetiva(save, c2!, 'diplomata', { ...ctxClassico, rodada: 14 }, 7, { proximo: 14, classico: null })
save = r2.save
assert.deepEqual(modsDaColetiva(save, 3), { 20: -3 }, 'diplomata no clássico = renda, não mexe na força')
// esperas: seca (prio 3) acorda logo; artilheiro (prio 1) espera 4 rodadas
assert.ok(montaColetiva(ctxBase({ rodada: 15, semVencer: 5 }), save, 7)?.sit === 'seca')
assert.equal(montaColetiva(ctxBase({ rodada: 15, artilheiro: { nome: 'Fulano', gols: 12 }, placar: { gf: 2, ga: 0, adv: 'X', casa: true, virada: false, arquirrival: false } }), save, 7), null, 'prioridade 1 espera 4 rodadas')
// assunto que NÃO repete na temporada
const sv2 = respondeColetiva(save, montaColetiva(ctxBase({ rodada: 15, semVencer: 5 }), save, 7)!, 'desconversa', ctxBase({ rodada: 15, semVencer: 5 }), 7).save
assert.equal(montaColetiva(ctxBase({ rodada: 20, semVencer: 6 }), sv2, 7), null, 'seca já respondida nesta temporada não volta')
assert.ok(montaColetiva(ctxBase({ rodada: 2, temporada: 4, semVencer: 6 }), sv2, 7)?.sit === 'seca', 'na temporada seguinte volta')
// pular conta e acorda a "fuga"
let sp = COLETIVA_VAZIA()
for (let i = 0; i < 3; i++) { const c = montaColetiva(ctxBase({ rodada: 1 + i * 5, semVencer: 5 + i, temporada: 10 + i }), sp, 3)!; sp = respondeColetiva(sp, c, null, ctxBase({ rodada: 1 + i * 5, temporada: 10 + i }), 3).save }
assert.equal(sp.pulosSeguidos, 3); assert.ok(montaColetiva(ctxBase({ rodada: 20, temporada: 12, pulosSeguidos: 3 }), sp, 3)?.sit === 'fuga', '3 pulos → Rogério cobra')
// véspera manda
assert.ok(montaColetiva(ctxBase({ vespera: 'final', copa: 'final' }), COLETIVA_VAZIA(), 1)?.sit === 'vespera_final')
assert.ok(montaColetiva(ctxBase({ vespera: 'classico', proximoClassico: true }), COLETIVA_VAZIA(), 1)?.sit === 'vespera_classico')

// 4) variedade: 60 temporadas de clássico ganho com sementes diferentes → muitas frases distintas
const vistas = new Set<string>()
for (let sd = 1; sd <= 60; sd++) { const c = montaColetiva({ ...ctxClassico, temporada: sd }, COLETIVA_VAZIA(), sd)!; vistas.add(`${c.qi}|${c.opcoes.map(o => o.ri).join(',')}|${c.rep.id}`) }
assert.ok(vistas.size >= 12, `combinações variadas (${vistas.size})`)

// 5) promessas e fama
let sp2 = COLETIVA_VAZIA()
const ctxLider = ctxBase({ rodada: 25, lider: true, pos: 1 })
const cl = montaColetiva(ctxLider, sp2, 5)!
assert.equal(cl.sit, 'lider')
const opProm = cl.opcoes.find(o => o.estilo === 'provoca')!
sp2 = respondeColetiva(sp2, cl, 'provoca', ctxLider, 5).save
if (opProm.promessa) {
  assert.equal(sp2.promessas.length, 1)
  const fx = fechaPromessas(sp2, 3, { campeao: false, subiu: false, caiu: false, copaCampeao: false, ganhouClassicos: false })
  assert.equal(fx.manchetes.length, 1); assert.ok(fx.manchetes[0][0].includes('faixa') || fx.manchetes[0][0].length > 10)
  assert.equal(fx.save.promessas[0].cumprida, false)
  assert.equal(fechaPromessas(fx.save, 3, { campeao: true, subiu: false, caiu: false, copaCampeao: false, ganhouClassicos: false }).manchetes.length, 0, 'não cobra duas vezes')
}
assert.equal(famaDoPresidente(COLETIVA_VAZIA()), 'novato')
const famaP = { ...COLETIVA_VAZIA(), contagem: { provoca: 5, diplomata: 1, desconversa: 0, pulou: 0 } }
assert.equal(famaDoPresidente(famaP), 'polemista')
assert.equal(famaDoPresidente({ ...COLETIVA_VAZIA(), contagem: { provoca: 1, diplomata: 1, desconversa: 0, pulou: 6 } }), 'mudo')
assert.equal(famaDoPresidente({ ...COLETIVA_VAZIA(), contagem: { provoca: 1, diplomata: 2, desconversa: 3, pulou: 0 }, dinheiroDesconversa: 3 }), 'paoduro')
assert.ok(melhoresFrases(save, 3).length === 2 && melhoresFrases(save, 3)[0].estilo === 'provoca', 'provocação vem primeiro')

// 6) arquirrival e h2h
assert.equal(escolheArquirrival([], 'B', null), null)
assert.equal(escolheArquirrival([{ team: 'A', division: 'C', h2h: [0, 0, 0], lastPos: null }, { team: 'B', division: 'B', h2h: [0, 0, 0], lastPos: null }], 'B', null), 'B', 'mesma divisão pesa')
assert.equal(escolheArquirrival([{ team: 'A', division: 'B', h2h: [3, 2, 3], lastPos: null }, { team: 'B', division: 'B', h2h: [0, 0, 1], lastPos: null }], 'B', null), 'A', 'quem mais enfrentou pesa')
let h = somaH2H(COLETIVA_VAZIA(), 'A', '3:10', 'V'); h = somaH2H(h, 'A', '3:10', 'V'); h = somaH2H(h, 'A', '3:29', 'D')
assert.deepEqual(h.h2hPor.A, [1, 0, 1], 'cada jogo conta uma vez')
assert.deepEqual(coletivaSana({ contagem: { provoca: 2 } as never }).contagem, { provoca: 2, diplomata: 0, desconversa: 0, pulou: 0 }, 'save velho é completado')
console.log('✅ coletiva ok')
