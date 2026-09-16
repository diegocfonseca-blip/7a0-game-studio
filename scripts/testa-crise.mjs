// 🚨 CRISE FINANCEIRA — teste das regras (16/09)
//
// Nasceu do print do Diego: o dono do **Divizeiro** (temporada 240, Série B) via a
// faixa *"não jogo em time duro assim, não — com o caixa no vermelho desse jeito"*
// com **+3.870 🪙 no caixa**. Palavras dele: *"esse usuário está C grana pow olha o
// caixa... se deu C eles deu em outros Tb"*.
//
// A causa, conferida no save dele no banco: a crise disparou CERTO lá atrás (a
// barreira gravada é -500, e o motor só grava isso quando o caixa esteve entre -1 e
// -500), mas o aviso **não expirava**. Ele seguiu jogando, recuperou o caixa, e a
// ameaça continuou pendurada na tela dizendo que o clube estava quebrado.
//
// O que este teste PROVA:
//   1. caixa positivo NUNCA abre crise (a regra do Diego é só a partir de -500);
//   2. a escada dele: -500 abre a primeira · -1000 abre OUTRO jogador · voltar a
//      -500 não abre nada de novo;
//   3. 🆕 caixa fora do vermelho CANCELA a crise pendente — o jogador FICA;
//   4. 🆕 o cancelamento NÃO mexe na barreira: a escada continua valendo depois;
//   5. o cancelamento não tira ninguém do elenco (quem some é só via RESOLVE).
//
//   node scripts/testa-crise.mjs
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { reducer } = await server.ssrLoadModule('/src/escalacao/store.tsx')

let falhas = 0
const ok = (c, t) => { console.log(`${c ? '✅' : '❌'} ${t}`); if (!c) falhas++ }

// um save de carreira solo minúsculo, só com o que a crise olha
const base = (coins, extra = {}) => ({
  careerOnline: true, onlineMode: 'cpu', seasonNo: 240, youIdx: 0,
  managers: [{ id: 0, teamName: 'Divizeiro', isHuman: true, squad: [
    { id: 'LAT-7', name: 'Carlos Alberto Torres', pos: 'LAT', fame: 5, hi: 92 },
    { id: 'MEI-2', name: 'Zé da Esquina', pos: 'MEI', fame: 1, hi: 60 },
  ] }],
  careerCoins: { 0: coins }, marketLog: [], ...extra,
})
// o mesmo cálculo que a tela faz antes de mandar o START
const barreiraDe = caixa => (caixa < 0 ? Math.ceil(caixa / 500) * 500 : 0)
const abre = (st, caixa) => {
  const ag = barreiraDe(caixa), last = st.careerDebtBarrier?.[0]
  if (last === undefined || ag >= last) return st // a tela nem dispara
  const alvo = [...st.managers[0].squad].sort((a, b) => (b.fame - a.fame) || (b.hi - a.hi))[0]
  return reducer(st, { type: 'START_CAREER_CRISE', mgrId: 0, barrier: ag, playerId: alvo.id, playerName: alvo.name, pos: alvo.pos })
}
const criseDe = st => st.careerCrise?.[0]

console.log('\n🚨 1) caixa positivo nunca abre crise')
{
  let st = base(3870)
  st = reducer(st, { type: 'SEED_DEBT_BARRIER', mgrId: 0, barrier: barreiraDe(3870) })
  ok(st.careerDebtBarrier[0] === 0, `barreira inicial com caixa +3870 = ${st.careerDebtBarrier[0]} (esperado 0)`)
  st = abre(st, 3870)
  ok(!criseDe(st), 'nenhuma crise com o caixa positivo')
  st = abre(st, -1)
  ok(!criseDe(st), 'nenhuma crise a -1 (só vale a partir de -500)')
  st = abre(st, -499)
  ok(!criseDe(st), 'nenhuma crise a -499')
}

console.log('\n🪜 2) a escada do Diego: -500 · -1000 · e voltar não repete')
{
  let st = reducer(base(100), { type: 'SEED_DEBT_BARRIER', mgrId: 0, barrier: 0 })
  st = abre(st, -500)
  ok(criseDe(st)?.playerName === 'Carlos Alberto Torres', `a -500 sai o melhor do elenco: ${criseDe(st)?.playerName}`)
  ok(st.careerDebtBarrier[0] === -500, `barreira virou ${st.careerDebtBarrier[0]}`)
  // resolvido (ele saiu), agora o clube afunda mais
  st = reducer(st, { type: 'RESOLVE_CAREER_CRISE', mgrId: 0, choice: 'base' })
  ok(!criseDe(st), 'resolveu → aviso saiu da tela')
  ok(!st.managers[0].squad.some(c => c.id === 'LAT-7'), 'e o jogador saiu mesmo do elenco')
  st = abre(st, -1000)
  ok(!!criseDe(st), 'a -1000 abre OUTRA crise (outro jogador)')
  const quem = criseDe(st)?.playerName
  st = reducer(st, { type: 'RESOLVE_CAREER_CRISE', mgrId: 0, choice: 'base' })
  st = abre(st, -600)
  ok(!criseDe(st), `voltar pra -600 não abre de novo (a escada já passou de ${quem})`)
}

console.log('\n💚 3) o conserto: fora do vermelho, o aviso EXPIRA e o jogador fica')
{
  let st = reducer(base(100), { type: 'SEED_DEBT_BARRIER', mgrId: 0, barrier: 0 })
  st = abre(st, -500)
  ok(!!criseDe(st), 'crise aberta com o caixa a -500')
  // é exatamente o estado que estava no save do Divizeiro: crise pendente + caixa cheio
  st = { ...st, careerCoins: { 0: 3870 } }
  st = reducer(st, { type: 'CANCEL_CAREER_CRISE', mgrId: 0 })
  ok(!criseDe(st), 'caixa em +3870 → o aviso some sozinho')
  ok(st.managers[0].squad.some(c => c.id === 'LAT-7'), 'e o Carlos Alberto Torres CONTINUA no elenco')
  ok(st.managers[0].squad.length === 2, `elenco intacto (${st.managers[0].squad.length} jogadores)`)
  ok(st.marketLog.some(l => l.includes('FICOU')), 'ficou anotado no mercado que ele voltou atrás')
  ok(st.careerDebtBarrier[0] === -500, `a barreira NÃO foi mexida (${st.careerDebtBarrier[0]}) — a escada continua valendo`)
  // e a escada realmente segue valendo depois do cancelamento
  st = abre(st, -1000)
  ok(!!criseDe(st), 'afundou pra -1000 depois de recuperar → nova crise, como manda a regra')
}

console.log('\n🔒 4) o cancelamento não inventa nada')
{
  let st = reducer(base(3870), { type: 'CANCEL_CAREER_CRISE', mgrId: 0 })
  ok(!st.careerCrise?.[0] && (st.marketLog?.length ?? 0) === 0, 'cancelar sem crise pendente não faz nada')
  let on = reducer({ ...base(3870), onlineMode: 'online', careerCrise: { 0: { playerId: 'x', playerName: 'y', pos: 'MEI' } } }, { type: 'CANCEL_CAREER_CRISE', mgrId: 0 })
  ok(!!on.careerCrise?.[0], 'no ONLINE o motor não mexe (a crise é só da carreira solo)')
}

await server.close()
console.log(falhas === 0 ? '\n🎉 tudo certo' : `\n💥 ${falhas} falha(s)`)
process.exit(falhas === 0 ? 0 : 1)
