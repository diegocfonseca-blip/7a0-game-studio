// 🧪 CONDIÇÃO / GÁS — confere as regras fechadas com o Diego (12/09) contra o
// módulo puro `src/escalacao/condicao.ts`. Rodar: npx tsx scripts/testa-condicao.mjs
// (sai com código 1 se algo quebrar — serve pra rodar antes de commitar).
import { gasDoElenco, jogosDoElenco, modsDoElenco, modVolta, sugerirRodizio, estadoGas, modGas, pesoLesao, condicaoAtiva, sorteiaLesaoDesgaste, GAS_JOGO, GAS_BANCO, LESAO_LIMITE_PCT, LESAO_ESGOTADO_PCT } from '../src/escalacao/condicao.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

const squad = []
for (const pos of ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']) squad.push({ id: `t${squad.length}`, pos, lo: 80, hi: 90 })
const xi = squad.map(c => c.id)
for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) squad.push({ id: `r${squad.length}`, pos, lo: 70, hi: 80 })
const banco = squad.filter(c => !xi.includes(c.id))

console.log('1) estados e modificadores')
ok(estadoGas(100) === 'ok' && estadoGas(35) === 'ok', '≥35 = inteiro')
ok(estadoGas(34) === 'cansado' && estadoGas(25) === 'cansado', '25–34 = cansado')
ok(estadoGas(24) === 'limite' && estadoGas(20) === 'limite', '20–24 = no limite')
ok(estadoGas(19) === 'esgotado' && estadoGas(0) === 'esgotado', '<20 = esgotado 🚑')
ok(modGas(100) === 0 && modGas(30) === -1 && modGas(22) === -2 && modGas(10) === -3, 'mods 0 / −1 / −2 / −3')
ok(pesoLesao(100) === 1 && pesoLesao(22) === 2 && pesoLesao(10) === 3, 'peso da lesão 1× / 2× / 3×')

console.log('2) gás derivado da escalação congelada')
const byRound = {}
for (let r = 0; r < 10; r++) byRound[r] = xi // 10 jogos seguidos com o mesmo time
let g = gasDoElenco(byRound, 0, squad)
ok(Object.values(g).every(v => v === 100), 'rodada 0: todo mundo 100')
g = gasDoElenco(byRound, 10, squad)
ok(g.t0 === 100 - 10 * GAS_JOGO, `10 jogos seguidos como titular → ${100 - 10 * GAS_JOGO} (${estadoGas(g.t0)})`)
ok(banco.every(c => g[c.id] === 100), 'banco fica no teto (100), nunca passa')
// a escada do Diego (2ª versão): "1 a 10 normal, dps 11, 12, 13 a 14 em diante"
const seguidos = n => { const b = {}; for (let r = 0; r < n - 1; r++) b[r] = xi; return estadoGas(gasDoElenco(b, n - 1, squad).t0) }
ok(seguidos(1) === 'ok' && seguidos(10) === 'ok', '1º ao 10º jogo seguido: inteiro 💪')
ok(seguidos(11) === 'cansado', '11º jogo seguido: 😓 cansado (−1)')
ok(seguidos(12) === 'limite', '12º jogo seguido: 🥵 no limite (−2, 2× lesão)')
ok(seguidos(13) === 'esgotado' && seguidos(14) === 'esgotado' && seguidos(20) === 'esgotado', '13º em diante: 🚑 esgotado (−3, 3× lesão)')
// descansa 2 rodadas: entra o reserva r11 (GOL) no lugar do t0
byRound[10] = xi.map(id => (id === 't0' ? 'r11' : id)); byRound[11] = byRound[10]
g = gasDoElenco(byRound, 12, squad)
ok(g.t0 === Math.min(100, 100 - 10 * GAS_JOGO + 2 * GAS_BANCO), `2 rodadas no banco → +${2 * GAS_BANCO} (${g.t0})`)
// 🪑 recuperação REAL (Diego): 😓 (30) precisa de 1 rodada fora; 🚑 (10) precisa de 2-3
ok(estadoGas(30 + GAS_BANCO) === 'ok', '😓 com 1 rodada no banco → inteiro')
ok(estadoGas(10 + GAS_BANCO) !== 'ok' && estadoGas(10 + 2 * GAS_BANCO) === 'ok', '🚑 com 1 rodada ainda não está inteiro; com 2 sim')
ok(g.r11 === 100 - 2 * GAS_JOGO, 'o reserva que entrou gastou 2 jogos')
const j = jogosDoElenco(byRound, 12, squad)
ok(j.t0 === 10 && j.r11 === 2 && j.t1 === 12, 'contagem de jogos bate (10 · 2 · 12)')
ok(gasDoElenco(undefined, 10, squad).t0 === 100, 'sem escalação gravada = ninguém cansa')
// passado imutável: o gás da rodada 3 não muda por causa do que veio depois
const g3a = gasDoElenco(byRound, 3, squad).t0
byRound[14] = xi
ok(gasDoElenco(byRound, 3, squad).t0 === g3a, 'gás de rodada passada não muda quando rodadas futuras mudam')

// 🆕 quem já estava em C/B/A quando a regra chegou: conta só a partir de desdeR
ok(gasDoElenco(byRound, 12, squad, 10).t0 === 100 && gasDoElenco(byRound, 12, squad, 10).t1 === 100 - 2 * GAS_JOGO, 'desdeR=10: rodadas antigas não contam (t0 100 · t1 2 jogos)')
ok(!modsDoElenco(byRound, 12, squad, r => byRound[r] ?? xi, null, 4, 10)[9], 'desdeR=10: nenhum mod em rodada anterior (placar antigo intocado)')

console.log('3) lesão volta aos poucos')
const ev = { tipo: 'lesao', season: 4, status: 'banco', volta: 12, cardId: 't5' }
ok(modVolta(ev, 4, 11, 't5') === 0 && modVolta(ev, 4, 12, 't5') === -2 && modVolta(ev, 4, 13, 't5') === -1 && modVolta(ev, 4, 14, 't5') === 0, '−2 na volta · −1 na seguinte · 0 depois')
ok(modVolta(ev, 5, 12, 't5') === 0, 'lesão de outra temporada não vale')
ok(modVolta({ ...ev, tipo: 'expulsao' }, 4, 12, 't5') === 0, 'expulsão/noitada não têm volta gradual')
ok(modVolta(ev, 4, 12, 't6') === 0, 'só o lesionado')

console.log('4) mods por rodada pra simulação')
const mods = modsDoElenco(byRound, 14, squad, r => byRound[r] ?? xi, ev, 4)
ok(!mods[0] && !mods[9], 'rodadas 0–9: ninguém cansado → sem mod (simulação idêntica)')
ok(mods[10] && mods[10].t1 === -1, 'rodada 10 (11º jogo do t1): −1')
ok(!(mods[10] ?? {}).t0, 'rodada 10: t0 foi pro banco → sem mod')

console.log('5) sugestão do preparador (nunca aplica sozinho)')
const gas = Object.fromEntries(squad.map(c => [c.id, 100]))
gas.t0 = 10; gas.t8 = 30; gas.t1 = 22 // GOL esgotado, ATA cansado, LAT no limite
let s = sugerirRodizio(xi, squad, gas)
ok(s && s.trocas.length === 3, `3 trocas sugeridas (${s?.trocas.map(t => `${t.entra.id}→${t.sai.id}`).join(', ')})`)
ok(s.ids.length === 11 && new Set(s.ids).size === 11, 'continua com 11 distintos')
ok(s.ids.indexOf('r11') === xi.indexOf('t0'), 'o reserva entra na MESMA vaga (campinho não embaralha)')
ok(s.trocas[0].sai.id === 't0', 'o pior (no limite) sai primeiro')
gas.r11 = 28
s = sugerirRodizio(xi, squad, gas)
ok(s && !s.trocas.some(t => t.sai.id === 't0'), 'reserva cansado NÃO entra — o goleiro fica (e joga cansado, nada trava)')
s = sugerirRodizio(xi, squad, gas, new Set(['r12']))
ok(s && !s.trocas.some(t => t.entra.id === 'r12'), 'suspenso não entra')
ok(sugerirRodizio(xi, squad, Object.fromEntries(squad.map(c => [c.id, 100]))) === null, 'todo mundo inteiro → null (nada a sugerir)')
ok(sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas) === null || sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas).trocas.length === 0, 'só 11 no elenco → nenhuma troca (ninguém falso entra)')

console.log('6) 🩹 lesão por desgaste')
const xiCards = squad.filter(c => xi.includes(c.id))
const gasOk = Object.fromEntries(squad.map(c => [c.id, 100]))
let hits = 0
for (let seed = 1; seed <= 2000; seed++) if (sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasOk })) hits++
ok(hits === 0, 'time inteiro: NUNCA se machuca de desgaste (2000 sorteios)')
const gasEsg = { ...gasOk, t8: 10 } // só o Romário 🚑
hits = 0; let rod = { 1: 0, 2: 0, 3: 0 }
for (let seed = 1; seed <= 4000; seed++) { const d = sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasEsg }); if (d) { hits++; rod[d.rodadas]++; if (d.card.id !== 't8') { hits = -1e9 } } }
ok(hits > 4000 * (LESAO_ESGOTADO_PCT - 0.03) && hits < 4000 * (LESAO_ESGOTADO_PCT + 0.03), `🚑 sozinho: ~${Math.round(LESAO_ESGOTADO_PCT * 100)}% por jogo (medido ${(hits / 40).toFixed(1)}%), sempre ELE`)
ok(rod[1] > 0 && rod[2] > 0 && rod[3] > 0 && Object.keys(rod).length === 3, 'dura 1, 2 ou 3 rodadas')
const gasLim = { ...gasOk, t8: 22 } // 🥵
hits = 0
for (let seed = 1; seed <= 4000; seed++) if (sorteiaLesaoDesgaste({ seed, seasonNo: 3, round: 10, xi: xiCards, gas: gasLim })) hits++
ok(hits > 4000 * (LESAO_LIMITE_PCT - 0.03) && hits < 4000 * (LESAO_LIMITE_PCT + 0.03), `🥵: ~${Math.round(LESAO_LIMITE_PCT * 100)}% por jogo (medido ${(hits / 40).toFixed(1)}%)`)
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

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
