// 🧪 CONDIÇÃO / GÁS — confere as regras fechadas com o Diego (12/09) contra o
// módulo puro `src/escalacao/condicao.ts`. Rodar: npx tsx scripts/testa-condicao.mjs
// (sai com código 1 se algo quebrar — serve pra rodar antes de commitar).
import { gasDoElenco, jogosDoElenco, modsDoElenco, modVolta, sugerirRodizio, estadoGas, modGas, pesoLesao, condicaoAtiva, sorteiaLesaoDesgaste, pctBarra, corBarra, corGas, GAS_JOGO, GAS_BANCO, LESAO_LIMITE_PCT, LESAO_ESGOTADO_PCT } from '../src/escalacao/condicao.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }
const perto = (a, b) => Math.abs(a - b) < 0.05 // o gás é float (−1,4 por jogo)

const squad = []
for (const pos of ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']) squad.push({ id: `t${squad.length}`, pos, lo: 80, hi: 90 })
const xi = squad.map(c => c.id)
for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) squad.push({ id: `r${squad.length}`, pos, lo: 70, hi: 80 })
const banco = squad.filter(c => !xi.includes(c.id))

console.log('1) estados e modificadores')
ok(estadoGas(100) === 'ok' && estadoGas(25) === 'ok', '≥25 = inteiro')
ok(estadoGas(24) === 'cansado' && estadoGas(18) === 'cansado', '18–24 = cansado')
ok(estadoGas(17) === 'limite' && estadoGas(11) === 'limite', '11–17 = no limite')
ok(estadoGas(10) === 'esgotado' && estadoGas(0) === 'esgotado', '<11 = esgotado 🚑')
ok(modGas(100) === 0 && modGas(24) === -1 && modGas(15) === -2 && modGas(5) === -3, 'mods 0 / −1 / −2 / −3')
ok(pesoLesao(100) === 1 && pesoLesao(15) === 2 && pesoLesao(5) === 3, 'peso da lesão 1× / 2× / 3×')

console.log('2) gás derivado da escalação congelada')
const byRound = {}
for (let r = 0; r < 10; r++) byRound[r] = xi // 10 jogos seguidos com o mesmo time
let g = gasDoElenco(byRound, 0, squad)
ok(Object.values(g).every(v => v === 100), 'rodada 0: todo mundo 100')
g = gasDoElenco(byRound, 10, squad)
ok(perto(g.t0, 100 - 10 * GAS_JOGO), `10 jogos seguidos como titular → ${100 - 10 * GAS_JOGO} (${estadoGas(g.t0)})`)
ok(banco.every(c => g[c.id] === 100), 'banco fica no teto (100), nunca passa')
// 🆕 a escada de 13/09: o cansaço ATRAVESSA temporadas — "1 a 50, dps 55, 60, 65 e
// 70 em diante". Em jogos SOMADOS: 1º–54º inteiro · 55º 😓 · 60º 🥵 · 65º+ 🚑.
const seguidos = n => { const b = {}; for (let r = 0; r < n - 1; r++) b[r] = xi; return estadoGas(gasDoElenco(b, n - 1, squad).t0) }
ok(seguidos(1) === 'ok' && seguidos(50) === 'ok' && seguidos(54) === 'ok', '1º ao 54º jogo: inteiro 💪 (o "1 a 50" dele)')
ok(seguidos(55) === 'cansado' && seguidos(59) === 'cansado', '55º ao 59º: 😓 cansado (−1)')
ok(seguidos(60) === 'limite' && seguidos(64) === 'limite', '60º ao 64º: 🥵 no limite (−2, 2× lesão)')
ok(seguidos(65) === 'esgotado' && seguidos(70) === 'esgotado' && seguidos(90) === 'esgotado', '65º em diante: 🚑 esgotado (−3, 3× lesão)')
// 🔁 e o cansaço atravessa a virada: quem começa a temporada já gasto continua gasto
ok(estadoGas(gasDoElenco({}, 0, squad, 0, { t0: 24 }).t0) === 'cansado', 'começou a temporada com 24 de gás → continua 😓 (não zera na virada)')
ok(gasDoElenco(undefined, 5, squad, 0, { t0: 30 }).t0 === 30, 'sem escalação, o gás guardado é o ponto de partida')
ok(jogosDoElenco({ 0: xi, 1: xi }, 2, squad, 0, { t0: 40 }).t0 === 42, 'os jogos também somam da carreira (40 + 2)')
// descansa 2 rodadas: entra o reserva r11 (GOL) no lugar do t0
byRound[10] = xi.map(id => (id === 't0' ? 'r11' : id)); byRound[11] = byRound[10]
g = gasDoElenco(byRound, 12, squad)
ok(perto(g.t0, Math.min(100, 100 - 10 * GAS_JOGO + 2 * GAS_BANCO)), `2 rodadas no banco → +${2 * GAS_BANCO} (${g.t0})`)
// 🪑 recuperação REAL (Diego): 😓 (30) precisa de 1 rodada fora; 🚑 (10) precisa de 2-3
ok(estadoGas(24 + 2 * GAS_BANCO) === 'ok', '😓 volta a inteiro com 2 rodadas no banco')
ok(estadoGas(5 + GAS_BANCO) !== 'ok' && estadoGas(5 + 5 * GAS_BANCO) === 'ok', '🚑 precisa de várias rodadas no banco pra voltar inteiro')
ok(perto(g.r11, 100 - 2 * GAS_JOGO), 'o reserva que entrou gastou 2 jogos')
const j = jogosDoElenco(byRound, 12, squad)
ok(j.t0 === 10 && j.r11 === 2 && j.t1 === 12, 'contagem de jogos bate (10 · 2 · 12)')
ok(gasDoElenco(undefined, 10, squad).t0 === 100, 'sem escalação gravada = ninguém cansa')
// passado imutável: o gás da rodada 3 não muda por causa do que veio depois
const g3a = gasDoElenco(byRound, 3, squad).t0
byRound[14] = xi
ok(gasDoElenco(byRound, 3, squad).t0 === g3a, 'gás de rodada passada não muda quando rodadas futuras mudam')

// 🆕 quem já estava em C/B/A quando a regra chegou: conta só a partir de desdeR
ok(gasDoElenco(byRound, 12, squad, 10).t0 === 100 && perto(gasDoElenco(byRound, 12, squad, 10).t1, 100 - 2 * GAS_JOGO), 'desdeR=10: rodadas antigas não contam (t0 100 · t1 2 jogos)')
ok(!modsDoElenco(byRound, 12, squad, r => byRound[r] ?? xi, null, 4, 10)[9], 'desdeR=10: nenhum mod em rodada anterior (placar antigo intocado)')

console.log('3) lesão volta aos poucos')
const ev = { tipo: 'lesao', season: 4, status: 'banco', volta: 12, cardId: 't5' }
ok(modVolta(ev, 4, 11, 't5') === 0 && modVolta(ev, 4, 12, 't5') === -2 && modVolta(ev, 4, 13, 't5') === -1 && modVolta(ev, 4, 14, 't5') === 0, '−2 na volta · −1 na seguinte · 0 depois')
ok(modVolta(ev, 5, 12, 't5') === 0, 'lesão de outra temporada não vale')
ok(modVolta({ ...ev, tipo: 'expulsao' }, 4, 12, 't5') === 0, 'expulsão/noitada não têm volta gradual')
ok(modVolta(ev, 4, 12, 't6') === 0, 'só o lesionado')

console.log('4) mods por rodada pra simulação')
const mods = modsDoElenco(byRound, 14, squad, r => byRound[r] ?? xi, ev, 4)
ok(!mods[0] && !mods[9] && !mods[10], 'rodadas 0–10: ninguém cansado ainda (a escada nova só morde lá pelo 55º) → sem mod')
// com o gás guardado da temporada passada, o mesmo time JÁ entra cansado
const modsCarry = modsDoElenco(byRound, 2, squad, r => byRound[r] ?? xi, null, 4, 0, { t1: 24 })
ok(modsCarry[0] && modsCarry[0].t1 === -1, 'quem virou a temporada cansado já entra com −1 na 1ª rodada')

console.log('5) sugestão do preparador (nunca aplica sozinho)')
const gas = Object.fromEntries(squad.map(c => [c.id, 100]))
gas.t0 = 5; gas.t8 = 24; gas.t1 = 15 // GOL esgotado, ATA cansado, LAT no limite
let s = sugerirRodizio(xi, squad, gas)
ok(s && s.trocas.length === 3, `3 trocas sugeridas (${s?.trocas.map(t => `${t.entra.id}→${t.sai.id}`).join(', ')})`)
ok(s.ids.length === 11 && new Set(s.ids).size === 11, 'continua com 11 distintos')
ok(s.ids.indexOf('r11') === xi.indexOf('t0'), 'o reserva entra na MESMA vaga (campinho não embaralha)')
ok(s.trocas[0].sai.id === 't0', 'o pior (no limite) sai primeiro')
gas.r11 = 20
s = sugerirRodizio(xi, squad, gas)
ok(s && !s.trocas.some(t => t.sai.id === 't0'), 'reserva cansado NÃO entra — o goleiro fica (e joga cansado, nada trava)')
s = sugerirRodizio(xi, squad, gas, new Set(['r12']))
ok(s && !s.trocas.some(t => t.entra.id === 'r12'), 'suspenso não entra')
ok(sugerirRodizio(xi, squad, Object.fromEntries(squad.map(c => [c.id, 100]))) === null, 'todo mundo inteiro → null (nada a sugerir)')
// 🔋 19/09: entra o MAIS CHEIO, não o mais forte (Diego: "tem que pôr o cheio")
{
  const sq = [...squad, { id: 'r20', pos: squad.find(c => c.id === 't8').pos, lo: 60, hi: 70 }]
  const g2 = Object.fromEntries(sq.map(c => [c.id, 100])); g2.t8 = 20
  const r8 = sq.filter(c => c.pos === sq.find(x => x.id === 't8').pos && !xi.includes(c.id) && c.id !== 'r20')
  for (const c of r8) g2[c.id] = 60 // os reservas fortes estão pela metade; o r20 (mais fraco) está cheio
  const s2 = sugerirRodizio(xi, sq, g2)
  ok(s2 && s2.trocas.some(t => t.sai.id === 't8' && t.entra.id === 'r20'), 'entra o reserva MAIS CHEIO, mesmo sendo mais fraco')
  g2.r20 = 60
  const s3 = sugerirRodizio(xi, sq, g2)
  const forte = r8.sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]
  ok(s3 && s3.trocas.some(t => t.sai.id === 't8' && t.entra.id === forte.id), 'gás igual → desempata pelo nível (o mais forte)')
  // 🌱 cria só entra sem reserva de verdade
  const sq3 = [...squad.filter(c => !(c.pos === forte.pos && !xi.includes(c.id))), { id: 'cria1', pos: forte.pos, lo: 48, hi: 58, cria: true }]
  const g3 = Object.fromEntries(sq3.map(c => [c.id, 100])); g3.t8 = 20
  const s4 = sugerirRodizio(xi, sq3, g3)
  ok(s4 && s4.trocas.some(t => t.sai.id === 't8' && t.entra.id === 'cria1'), 'banco SÓ de cria → o cria entra')
  const sq4 = [...sq3, { id: 'r30', pos: forte.pos, lo: 70, hi: 80 }]
  const g4 = { ...g3, r30: 30 } // reserva de verdade inteiro (30 ≥ 25), cria cheio
  const s5 = sugerirRodizio(xi, sq4, g4)
  ok(s5 && s5.trocas.some(t => t.sai.id === 't8' && t.entra.id === 'r30'), 'reserva de verdade inteiro ganha do cria, mesmo o cria mais cheio')
}
ok(sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas) === null || sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas).trocas.length === 0, 'só 11 no elenco → nenhuma troca (ninguém falso entra)')

console.log('6) 🩹 lesão por desgaste')
const xiCards = squad.filter(c => xi.includes(c.id))
const gasOk = Object.fromEntries(squad.map(c => [c.id, 100]))
let hits = 0
for (let seed = 1; seed <= 2000; seed++) if (sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasOk })) hits++
ok(hits === 0, 'time inteiro: NUNCA se machuca de desgaste (2000 sorteios)')
const gasEsg = { ...gasOk, t8: 5 } // só o Romário 🚑
hits = 0; let rod = { 1: 0, 2: 0, 3: 0 }
for (let seed = 1; seed <= 4000; seed++) { const d = sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasEsg }); if (d) { hits++; rod[d.rodadas]++; if (d.card.id !== 't8') { hits = -1e9 } } }
ok(hits > 4000 * (LESAO_ESGOTADO_PCT - 0.03) && hits < 4000 * (LESAO_ESGOTADO_PCT + 0.03), `🚑 sozinho: ~${Math.round(LESAO_ESGOTADO_PCT * 100)}% por jogo (medido ${(hits / 40).toFixed(1)}%), sempre ELE`)
ok(rod[1] > 0 && rod[2] > 0 && rod[3] > 0 && Object.keys(rod).length === 3, 'dura 1, 2 ou 3 rodadas')
const gasLim = { ...gasOk, t8: 15 } // 🥵
hits = 0
for (let seed = 1; seed <= 4000; seed++) if (sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasLim })) hits++
ok(hits > 4000 * (LESAO_LIMITE_PCT - 0.03) && hits < 4000 * (LESAO_LIMITE_PCT + 0.03), `🥵: ~${Math.round(LESAO_LIMITE_PCT * 100)}% por jogo (medido ${(hits / 40).toFixed(1)}%)`)
// 🚨 O TETO (15/09): time INTEIRO acabado não pode virar loteria. Antes o dado era
// jogado pra cada cansado — 9 🚑 davam 61% por rodada. Agora é UM dado por rodada.
const gasMorto = Object.fromEntries(squad.map(c => [c.id, 5])) // TODO mundo 🚑
hits = 0; let semprePior = true
for (let seed = 1; seed <= 4000; seed++) { const d = sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasMorto }); if (d) { hits++; if ((gasMorto[d.card.id] ?? 100) !== 5) semprePior = false } }
ok(hits < 4000 * (LESAO_ESGOTADO_PCT + 0.03), `time TODO 🚑: continua no teto de ~${Math.round(LESAO_ESGOTADO_PCT * 100)}% por rodada (medido ${(hits / 40).toFixed(1)}%) — um dado por rodada, não um por jogador`)
ok(semprePior, 'e quem cai é sempre o de PIOR gás')
// mistura: um 🚑 e vários 🥵 → o dado é o do 🚑 (o pior), não a soma de todos
const gasMix = { ...gasOk, t8: 5, t7: 15, t6: 16, t5: 17, t4: 14 }
hits = 0
for (let seed = 1; seed <= 4000; seed++) { const d = sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasMix }); if (d) { hits++; if (d.card.id !== 't8') hits = -1e9 } }
ok(hits > 4000 * (LESAO_ESGOTADO_PCT - 0.03) && hits < 4000 * (LESAO_ESGOTADO_PCT + 0.03), `1 🚑 + 4 🥵: ~${Math.round(LESAO_ESGOTADO_PCT * 100)}% (medido ${(hits / 40).toFixed(1)}%), e sempre o 🚑`)
const d1 = sorteiaLesaoDesgaste({ seed: 77, seasonNo: 3, round: 10, xi: xiCards, gas: gasEsg }), d2 = sorteiaLesaoDesgaste({ seed: 77, seasonNo: 3, round: 10, xi: xiCards, gas: gasEsg })
ok(JSON.stringify(d1) === JSON.stringify(d2), 'determinístico: reload não re-sorteia')

console.log('7) trava de ativação')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true }), 'sem condicaoDesde = desligado')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 4 }), 'antes da temporada em que ligou = desligado')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 5 }), 'na temporada em que chegou na C = ligado')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 9 }), 'e continua ligado depois (mesmo caindo pra D/Várzea)')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'online', agenciaOn: true, condicaoDesde: 5, seasonNo: 9 }), 'online: nunca')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: false, condicaoDesde: 5, seasonNo: 9 }), 'carreira antiga (sem agenciaOn): nunca')
// 🧹 cura da ~1h de deploy errado (12/09): ligou no MEIO da temporada estando em D/Várzea → desligado
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 9, condicaoDesdeR: 8, seasonNo: 9, careerDivision: 'V' }), 'cura: ligou no meio da temporada na Várzea = desligado')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 9, condicaoDesdeR: 8, seasonNo: 9, careerDivision: 'D' }), 'cura: idem na Série D')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 9, condicaoDesdeR: 8, seasonNo: 9, careerDivision: 'C' }), 'já estava na C quando a regra chegou: ligado (legítimo)')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 9, seasonNo: 9, careerDivision: 'C' }), 'chegou na C na virada: ligado')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, condicaoDesdeR: 8, seasonNo: 9, careerDivision: 'D' }), 'ligou na C temporadas atrás e caiu pra D: continua ligado (cura não toca)')

console.log('8) 📊 a barrinha (só tela — Diego 13/09: "está diminuindo muito rápido")')
const gasJogo = n => Math.round((100 - GAS_JOGO * (n - 1)) * 10) / 10 // gás antes do jogo N
ok(pctBarra(100) === 100 && pctBarra(0) === 0, 'extremos: 100 → 100% · 0 → 0%')
ok(pctBarra(gasJogo(50)) >= 50 && pctBarra(gasJogo(51)) === 49, `50º jogo ainda ≥ 50% (${pctBarra(gasJogo(50))}%) · 51º cai pra 49%`)
ok(pctBarra(gasJogo(13)) === 88, `13º jogo: 88% na barra (era ${Math.round(gasJogo(13))}% cru)`)
ok(pctBarra(gasJogo(55)) === 40 && pctBarra(gasJogo(60)) === 33 && pctBarra(gasJogo(65)) === 25 && pctBarra(gasJogo(70)) === 10, '55º = 40% · 60º = 33% · 65º = 25% · 70º = 10% (final espaçado, 2ª rodada do Diego)')
ok(pctBarra(gasJogo(73)) === 0 && pctBarra(gasJogo(90)) === 0, '73º em diante: 0% (o motor zera o gás)')
let mono = true; for (let g = 1; g <= 1000; g++) if (pctBarra(g / 10) < pctBarra((g - 1) / 10)) mono = false
ok(mono, 'nunca sobe quando o gás cai (monótona)')
// 🟡 15/09: a COR voltou a seguir o motor. O Diego escolheu juntar cor e ação no 55º
// (*"podemos fazer isso no 55"*) — o amarelo de 13/09, que começava no 51º, saiu porque
// deixava 4 jogos de alerta aceso com o preparador parado. NÃO é regressão: é a escolha
// dele depois de ver a tabela dos dois jeitos. Ver o comentário de `corBarra`.
ok(corBarra(gasJogo(54)) === corGas('ok') && corBarra(gasJogo(51)) === corGas('ok'), 'verde até o 54º — o 51º já NÃO amarela mais (Diego 15/09)')
ok(corBarra(gasJogo(55)) === corGas('cansado'), 'amarela no 55º, junto com o 😓 — cor e ação no mesmo ponto')
ok(corBarra(gasJogo(55)) === corGas('cansado') && corBarra(gasJogo(60)) === corGas('limite') && corBarra(gasJogo(65)) === corGas('esgotado'), '😓 amarela · 🥵 vermelha · 🚑 escura — como antes')
ok(estadoGas(gasJogo(54)) === 'ok' && estadoGas(gasJogo(55)) === 'cansado', 'o MOTOR não mudou: inteiro até o 54º, 😓 no 55º')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
