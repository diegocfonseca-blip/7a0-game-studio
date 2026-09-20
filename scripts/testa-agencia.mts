// 🧪 COMISSÃO DA AGÊNCIA — quem paga, quanto e pra quem
//
// Regra ditada pelo Diego em 20/09: *"o usuário tem q ganhar 1 moeda na temporada se
// o jogador for artilheiro de qlqr competição ou mais uma se for bola de ouro também.
// Desses ativos logicamente"*. Ou seja, as três travas que este arquivo guarda:
//   ① artilheiro de QUALQUER competição paga 1 🪙 (aqui a da Copa do Mundo, que é a
//      única paga na hora — as outras ficam pendentes e caem na virada);
//   ② quem está ESPERANDO A VEZ não paga nada (não é cliente na ativa);
//   ③ e ninguém paga duas vezes (reabrir o jogo não dobra a comissão).
//
// Rodar:  npx tsx scripts/testa-agencia.mts
import { reducer } from '../src/escalacao/store'
import type { EscState, Manager, AgCard } from '../src/escalacao/types'

let erros = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros++ }

// 🔓 a Agência 2.0 já está liberada geral (`AGENCIA_GERAL = true` em sport.ts),
// então a bancada não precisa destravar nada — se um dia voltar pro teste fechado,
// é aqui que a trava vai aparecer.

const cliente = (name: string): AgCard => ({ name, club: 'Santos', year: 2005, pos: 'ATA', fame: 4 } as AgCard)
const tecnico = (): Manager => ({ id: 1, name: 'Você', teamName: 'Rei da Bola FC', isHuman: true, money: 0, squad: [], formation: '4-4-2' } as unknown as Manager)

const estado = (agenciados: AgCard[]): EscState => ({
  careerOnline: true, onlineMode: 'solo', agenciaOn: true, seasonNo: 7,
  managers: [tecnico()], youIdx: 0, agenciados, careerCoins: { 1: 50 }, careerLedger: [],
} as unknown as EscState)

const caixa = (s: EscState) => (s.managers[0]?.money ?? 0) + (s.careerCoins?.[1] ?? 0)

console.log('1) artilheiro da Copa do Mundo paga 1 🪙 pro agente')
{
  const s0 = estado([cliente('Romário')])
  const antes = caixa(s0)
  const s1 = reducer(s0, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Romário', gols: 7, season: 7 })
  ok(caixa(s1) - antes === 1, 'cliente NA ATIVA artilheiro do mundo → +1 🪙')
  ok((s1.agenciaFatura?.rows ?? []).some(r => r.nome === 'Romário'), 'e a comissão aparece na fatura (Cerimônia e aba da Agência)')
  ok((s1.agenciaHist?.['Romário|Santos|2005'] ?? 0) === 1, 'e entra no "já te rendeu" da carta')
}

console.log('2) quem está ESPERANDO A VEZ não paga nada')
{
  const s0 = estado([cliente('Romário')])           // o Jairzinho está FORA da ativa
  const antes = caixa(s0)
  const s1 = reducer(s0, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Jairzinho', gols: 9, season: 7 })
  ok(caixa(s1) === antes, 'artilheiro que NÃO está na ativa → 0 🪙 (regra do Diego: só dos ativos)')
  ok((s1.agenciaFatura?.rows ?? []).length === 0, 'e nada é escrito na fatura')
}

console.log('3) ninguém paga duas vezes (reabrir o jogo não dobra)')
{
  const s0 = estado([cliente('Romário')])
  const antes = caixa(s0)
  const s1 = reducer(s0, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Romário', gols: 7, season: 7 })
  const s2 = reducer(s1, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Romário', gols: 7, season: 7 })
  ok(caixa(s2) - antes === 1, 'a mesma Copa não paga de novo (trava por nome+temporada)')
  const s3 = reducer(s2, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Romário', gols: 5, season: 17 })
  ok(caixa(s3) - antes === 2, 'mas a Copa da temporada SEGUINTE paga normal')
}

console.log('4) carreira ANTIGA (sem Agência 2.0) não recebe nada')
{
  const s0 = { ...estado([cliente('Romário')]), agenciaOn: false } as EscState
  const antes = caixa(s0)
  const s1 = reducer(s0, { type: 'AGENCIA_COMISSAO_MUNDO', nome: 'Romário', gols: 7, season: 7 })
  ok(caixa(s1) === antes, 'save velho segue igualzinho — regra nova não mexe em carreira antiga')
}

console.log(erros ? `\n❌ ${erros} checagem(ns) falhou` : '\n✅ tudo certo')
process.exit(erros ? 1 : 0)
