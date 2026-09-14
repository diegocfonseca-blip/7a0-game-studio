#!/usr/bin/env node
// 💸 TRAVA DA VENDA DO 2º CLUBE (multiclubes).
//
// Pedido do Diego (14/09): *"gostaria de dar opção pra quem comprou o segundo clube
// poder vender… aí quando vender some também as coisas de trocar, hibernar e etc e
// mantém tudo como era antes"*, com o valor *"perdendo um cadinho"* → *"desconta 1000
// e diga q foi tudo de luxo gasto na festa"*, e a regra dura: *"quero deixar claro q
// somente o segundo clube que pode ser vendido... o primeiro oficial q aparece no
// rank global e etc não pode ser vendido nunca"*.
//
// Esta trava existe por causa de UMA pegadinha que quase passou: `multiClube.id` é
// sempre o clube que DORME — e quando o 2º clube está no comando, quem dorme é o
// PRINCIPAL. Se a trava da venda fosse "vende quem está dormindo", daria pra vender o
// clube oficial. Aqui isso é testado explicitamente (caso 2).
//
// uso: node scripts/testa-vender-2o-clube.mjs     (sai com código 1 se reprovar)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const { reducer } = S

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

const carta = (id, pos = 'MEI', extra = {}) => ({ id, name: `Jogador ${id}`, club: 'X', year: 2020, pos, fame: 2, lo: 60, hi: 80, ...extra })
const tec = (id, teamName, extra = {}) => ({ id, name: teamName, teamName, isHuman: false, formation: '4-3-3', money: 0, squad: [], aggression: .5, starHunger: .5, ...extra })

// monta um save de carreira SOLO com 2 clubes: o principal (id 0) e o comprado (id 7)
const base = ({ ativo2 = false } = {}) => ({
  onlineMode: 'solo', careerOnline: true, seasonNo: 3, youIdx: 0, screen: 'estadio', phase: 'idle',
  managers: [
    tec(0, 'Meia na Canela', { isHuman: true, squad: [carta('p1'), carta('p2')] }),
    tec(3, 'Bot Qualquer'),
    tec(7, 'Adão Esporte', { isHuman: true, mine: true, dormindo: !ativo2, squad: [carta('s1'), carta('s2')] }),
  ],
  careerCoins: { 0: 500, 7: 990 },
  careerPlacements: { m0: 'C', m3: 'D', m7: 'D' },
  clubCash: { m7: 140 },
  careerHonors: { m7: { A: 0, B: 0, C: 0, D: 1, V: 0 } },
  multiClube: { team: ativo2 ? 'Meia na Canela' : 'Adão Esporte', id: ativo2 ? 0 : 7, since: 2 },
  multiClubeAtivo: ativo2,
  multiClubePendingCards: { 7: [{ season: 2 }] },
  agenciaClubeId: 7, agenciaDividir: true,
  careerLedger: [], cpuSquads: {},
})
// se o 2º está no comando, o assento ativo é o dele
const comSegundoNoComando = () => { const s = base({ ativo2: true }); s.youIdx = 2; s.managers[0].dormindo = true; return s }

console.log('\n1️⃣ VENDA NORMAL (principal no comando, 2º dormindo)')
{
  const s = reducer(base(), { type: 'SELL_MULTICLUBE' })
  ok(s.careerCoins[0] === 500 + 4000 - 1000, `moedas: 500 + 4.000 − 1.000 (festa) = 3.500 · deu ${s.careerCoins[0]}`)
  ok(s.careerCoins[7] === undefined, 'a moeda de carreira do 2º clube vai embora com ele')
  ok(s.multiClube === null && s.multiClubeAtivo === false, 'o registro do 2º clube sumiu (a UI de trocar/dormir some junto)')
  const v = s.managers.find(m => m.id === 7)
  ok(!!v, 'o clube CONTINUA na pirâmide (não some do jogo)')
  ok(v && !v.mine && !v.isHuman && !v.dormindo, 'e voltou a ser um time da máquina')
  ok(s.careerPlacements.m7 === 'D', 'segue na mesma divisão (a contagem da pirâmide não muda)')
  ok(s.clubCash.m7 === 140 && s.careerHonors.m7.D === 1, 'fica com o caixa e os títulos dele')
  ok(!s.multiClubePendingCards?.[7], 'pacote guardado do 2º clube foi limpo')
  ok(s.agenciaClubeId === 0 && s.agenciaDividir === false, 'a renda da agência volta pro clube único')
  const ext = (s.careerLedger ?? []).map(e => e.amount)
  ok(ext.includes(4000) && ext.includes(-1000), `o extrato mostra os DOIS lançamentos separados (+4.000 e −1.000) · achei ${JSON.stringify(ext)}`)
}

console.log('\n2️⃣ 🚫 O CLUBE OFICIAL NUNCA SE VENDE (2º clube no comando → quem dorme é o principal)')
{
  const antes = comSegundoNoComando()
  const s = reducer(antes, { type: 'SELL_MULTICLUBE' })
  ok(!!s.multiClube, 'a venda foi RECUSADA — o clube que dormia era o principal')
  ok(s.managers.find(m => m.id === 0)?.isHuman === true, 'o clube oficial continua sendo seu')
  ok((s.careerCoins?.[0] ?? 0) === 500 && (s.careerCoins?.[2] ?? s.careerCoins?.[7]) === 990, 'nenhuma moeda mudou de mão')
}

console.log('\n3️⃣ 🤝 EMPRÉSTIMOS se acertam antes da venda')
{
  const s0 = base()
  // o 2º clube (7) tinha emprestado o 's1' pra SAF, e pegou emprestado o 'p2' (que é do principal)
  s0.careerFilial = {
    team: 'SAF do Zé',
    loanOut: [{ ...carta('s1'), emprestado: 'dono', byClub: 7 }, { ...carta('p2'), emprestado: 'dono', byClub: 0 }],
    loanIn: [{ ...carta('p2'), emprestado: 'saf', byClub: 7 }],
  }
  s0.cpuSquads = { 'SAF do Zé': [{ ...carta('s1'), emprestado: 'dono', byClub: 7 }] }
  s0.managers[2].squad = [carta('s2'), { ...carta('p2'), emprestado: 'saf', byClub: 7 }]
  s0.managers[0].squad = [carta('p1')]
  const s = reducer(s0, { type: 'SELL_MULTICLUBE' })
  const vend = s.managers.find(m => m.id === 7)
  const prin = s.managers.find(m => m.id === 0)
  ok(vend.squad.some(c => c.id === 's1'), 'quem o 2º clube tinha emprestado VOLTOU pra ele (e sai junto)')
  ok(prin.squad.some(c => c.id === 'p2'), 'o jogador do clube PRINCIPAL que estava lá voltou pra casa')
  ok(!vend.squad.some(c => c.id === 'p2'), 'e não saiu junto com o clube vendido')
  ok(!(s.careerFilial.loanIn ?? []).length, 'o empréstimo do clube vendido saiu da lista da SAF')
  ok(!(s.careerFilial.loanOut ?? []).some(c => c.byClub === 7), 'e o que ele tinha emprestado também')
}

console.log('\n4️⃣ 🔒 Travas gerais')
{
  // (o reducer clona o estado antes do switch, então comparo o CONTEÚDO e não a identidade)
  const semMulti = { ...base(), multiClube: null }
  const r1 = reducer(semMulti, { type: 'SELL_MULTICLUBE' })
  ok(r1.careerCoins[0] === 500 && r1.managers.find(m => m.id === 7)?.mine === true, 'sem 2º clube, a venda não faz nada')
  const online = { ...base(), onlineMode: 'online' }
  const r2 = reducer(online, { type: 'SELL_MULTICLUBE' })
  ok(r2.careerCoins[0] === 500 && !!r2.multiClube, 'no ONLINE a venda não existe (multiclube é só solo)')
  // assento que dorme mas NÃO é comprado (save torto): não pode vender
  const torto = base(); torto.managers[2].mine = false
  ok(!!reducer(torto, { type: 'SELL_MULTICLUBE' }).multiClube, 'assento sem a marca de comprado não se vende')
}

await vite.close()
console.log(falhas ? `\n❌ ${falhas} reprova(ções)\n` : '\n✅ tudo certo na venda do 2º clube\n')
process.exit(falhas ? 1 : 0)
