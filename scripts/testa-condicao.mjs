// 🧪 CONDIÇÃO / GÁS — confere as regras fechadas com o Diego (12/09) contra o
// módulo puro `src/escalacao/condicao.ts`. Rodar: npx tsx scripts/testa-condicao.mjs
// (sai com código 1 se algo quebrar — serve pra rodar antes de commitar).
import { gasDoElenco, jogosDoElenco, modsDoElenco, modVolta, sugerirRodizio, estadoGas, modGas, condicaoAtiva, GAS_JOGO, GAS_BANCO } from '../src/escalacao/condicao.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

const squad = []
for (const pos of ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']) squad.push({ id: `t${squad.length}`, pos, lo: 80, hi: 90 })
const xi = squad.map(c => c.id)
for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) squad.push({ id: `r${squad.length}`, pos, lo: 70, hi: 80 })
const banco = squad.filter(c => !xi.includes(c.id))

console.log('1) estados e modificadores')
ok(estadoGas(100) === 'ok' && estadoGas(60) === 'ok', '≥60 = inteiro')
ok(estadoGas(59) === 'cansado' && estadoGas(30) === 'cansado', '30–59 = cansado')
ok(estadoGas(29) === 'limite' && estadoGas(0) === 'limite', '<30 = no limite')
ok(modGas(100) === 0 && modGas(45) === -1 && modGas(10) === -2, 'mods 0 / −1 / −2')

console.log('2) gás derivado da escalação congelada')
const byRound = {}
for (let r = 0; r < 5; r++) byRound[r] = xi // 5 jogos seguidos com o mesmo time
let g = gasDoElenco(byRound, 0, squad)
ok(Object.values(g).every(v => v === 100), 'rodada 0: todo mundo 100')
g = gasDoElenco(byRound, 5, squad)
ok(g.t0 === 100 - 5 * GAS_JOGO, `5 jogos seguidos como titular → ${100 - 5 * GAS_JOGO} (${estadoGas(g.t0)})`)
ok(banco.every(c => g[c.id] === 100), 'banco fica no teto (100), nunca passa')
// 100 − 12×3 = 64 (inteiro) · 100 − 12×4 = 52 (cansado): aguenta 4 jogos seguidos
// inteiro e entra no 5º já 😓; no limite (< 30) a partir do 7º (100 − 12×6 = 28).
ok(estadoGas(gasDoElenco(byRound, 3, squad).t0) === 'ok' && estadoGas(gasDoElenco(byRound, 4, squad).t0) === 'cansado', '4 jogos seguidos inteiro; no 5º já está 😓')
ok(estadoGas(gasDoElenco({ ...byRound, 5: xi }, 6, squad).t0) === 'limite', 'no 7º jogo seguido está 🥵 (28)')
// descansa 2 rodadas: entra o reserva r11 (GOL) no lugar do t0
byRound[5] = xi.map(id => (id === 't0' ? 'r11' : id)); byRound[6] = byRound[5]
g = gasDoElenco(byRound, 7, squad)
ok(g.t0 === Math.min(100, 100 - 5 * GAS_JOGO + 2 * GAS_BANCO), `2 rodadas no banco → +${2 * GAS_BANCO} (${g.t0})`)
ok(g.r11 === 100 - 2 * GAS_JOGO, 'o reserva que entrou gastou 2 jogos')
const j = jogosDoElenco(byRound, 7, squad)
ok(j.t0 === 5 && j.r11 === 2 && j.t1 === 7, 'contagem de jogos bate (5 · 2 · 7)')
ok(gasDoElenco(undefined, 10, squad).t0 === 100, 'sem escalação gravada = ninguém cansa')
// passado imutável: o gás da rodada 3 não muda por causa do que veio depois
const g3a = gasDoElenco(byRound, 3, squad).t0
byRound[9] = xi
ok(gasDoElenco(byRound, 3, squad).t0 === g3a, 'gás de rodada passada não muda quando rodadas futuras mudam')

console.log('3) lesão volta aos poucos')
const ev = { tipo: 'lesao', season: 4, status: 'banco', volta: 12, cardId: 't5' }
ok(modVolta(ev, 4, 11, 't5') === 0 && modVolta(ev, 4, 12, 't5') === -2 && modVolta(ev, 4, 13, 't5') === -1 && modVolta(ev, 4, 14, 't5') === 0, '−2 na volta · −1 na seguinte · 0 depois')
ok(modVolta(ev, 5, 12, 't5') === 0, 'lesão de outra temporada não vale')
ok(modVolta({ ...ev, tipo: 'expulsao' }, 4, 12, 't5') === 0, 'expulsão/noitada não têm volta gradual')
ok(modVolta(ev, 4, 12, 't6') === 0, 'só o lesionado')

console.log('4) mods por rodada pra simulação')
const mods = modsDoElenco(byRound, 9, squad, r => byRound[r] ?? xi, ev, 4)
ok(!mods[0] && !mods[3], 'rodadas 0–3: ninguém cansado → sem mod (simulação idêntica)')
ok(mods[4] && mods[4].t0 === -1, 'rodada 4 (5º jogo): t0 com −1')
ok(!(mods[6] ?? {}).t0, 'rodada 6: t0 estava no banco → sem mod')

console.log('5) sugestão do preparador (nunca aplica sozinho)')
const gas = Object.fromEntries(squad.map(c => [c.id, 100]))
gas.t0 = 20; gas.t8 = 50; gas.t1 = 40 // GOL no limite, ATA cansado, LAT cansado
let s = sugerirRodizio(xi, squad, gas)
ok(s && s.trocas.length === 3, `3 trocas sugeridas (${s?.trocas.map(t => `${t.entra.id}→${t.sai.id}`).join(', ')})`)
ok(s.ids.length === 11 && new Set(s.ids).size === 11, 'continua com 11 distintos')
ok(s.ids.indexOf('r11') === xi.indexOf('t0'), 'o reserva entra na MESMA vaga (campinho não embaralha)')
ok(s.trocas[0].sai.id === 't0', 'o pior (no limite) sai primeiro')
gas.r11 = 40
s = sugerirRodizio(xi, squad, gas)
ok(s && !s.trocas.some(t => t.sai.id === 't0'), 'reserva cansado NÃO entra — o goleiro fica (e joga cansado, nada trava)')
s = sugerirRodizio(xi, squad, gas, new Set(['r12']))
ok(s && !s.trocas.some(t => t.entra.id === 'r12'), 'suspenso não entra')
ok(sugerirRodizio(xi, squad, Object.fromEntries(squad.map(c => [c.id, 100]))) === null, 'todo mundo inteiro → null (nada a sugerir)')
ok(sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas) === null || sugerirRodizio(xi, squad.filter(c => xi.includes(c.id)), gas).trocas.length === 0, 'só 11 no elenco → nenhuma troca (ninguém falso entra)')

console.log('6) trava de ativação')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true }), 'sem condicaoDesde = desligado')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 4 }), 'antes da temporada da Série C = desligado')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 5 }), 'na temporada em que chegou na C = ligado')
ok(condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: true, condicaoDesde: 5, seasonNo: 9 }), 'e continua ligado depois (mesmo caindo pra D/Várzea)')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'online', agenciaOn: true, condicaoDesde: 5, seasonNo: 9 }), 'online: nunca')
ok(!condicaoAtiva({ careerOnline: true, onlineMode: 'solo', agenciaOn: false, condicaoDesde: 5, seasonNo: 9 }), 'carreira antiga (sem agenciaOn): nunca')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
