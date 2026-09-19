// 🧪 TRAVA DO MONTE — ninguém pode ficar preso na tela de sobras
//
// Nasceu do bug do Rei da Bola FC (19/09), que o Diego relatou assim: *"ele tava
// tentando pegar, pegar, pegar e não acontecia nada, ele tava travado na tela"*.
// Eram DUAS coisas, e as duas viraram checagem aqui:
//   ① a tela mostrava botão ACESO pra carta que o reducer recusava em silêncio
//      (contrato vencido do próprio clube, e caixa curto);
//   ② com buraco no XI, o botão PASSAR sumia se existisse "alguma carta" — e a conta
//      de "alguma" ignorava esses bloqueios. Sem PEGAR e sem PASSAR = tela morta.
//
// Rodar:  npx tsx scripts/testa-monte.mts
import { monteBloqueio, montePickable } from '../src/escalacao/store'
import type { EscState, Manager, Card } from '../src/escalacao/types'

let erros = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros++ }

const carta = (over: Partial<Card> = {}): Card => ({
  id: 'c1', name: 'Fulano', club: 'Santos', year: 2005, pos: 'ATA', fame: 3, lo: 70, hi: 80, ...over,
} as Card)

const tecnico = (over: Partial<Manager> = {}): Manager => ({
  id: 1, name: 'Você', teamName: 'Rei da Bola FC', isHuman: true, money: 10, squad: [],
  formation: '4-4-2', deepSquad: true, ...over,
} as Manager)

const estado = (m: Manager, over: Partial<EscState> = {}): EscState => ({
  careerOnline: true, onlineMode: 'solo', managers: [m], youIdx: 0, monteOrder: [m.id], monteIdx: 0,
  monte: [], ...over,
} as unknown as EscState)

console.log('1) o motivo de cada bloqueio')
{
  const m = tecnico()
  const s = estado(m)
  ok(monteBloqueio(s, m, carta()) === null, 'sobra de graça, com vaga → pode pegar')
  ok(monteBloqueio(s, m, carta({ paid: 99 } as Partial<Card>)) === 'caixa', 'piso acima do caixa → bloqueio de CAIXA (e a tela diz "sem caixa")')
  ok(monteBloqueio(s, m, carta({ paid: 5 } as Partial<Card>)) === null, 'piso que cabe no caixa → pode pagar')
}
{
  // 📝 a anti-malandragem: contrato vencido não volta de graça pro ex-dono
  const m = tecnico()
  const s = estado(m)
  const vencido = carta({ semContrato: true, seller: m.id } as Partial<Card>)
  ok(monteBloqueio(s, m, vencido) === 'semcontrato', 'contrato vencido do PRÓPRIO clube → bloqueio explicado, nunca botão mudo')
  ok(!montePickable(s, m, vencido), 'e o reducer recusa a mesma carta — tela e regra falam a mesma língua')
  const deOutro = carta({ semContrato: true, seller: 999 } as Partial<Card>)
  ok(monteBloqueio(s, m, deOutro) === null, 'contrato vencido de OUTRO clube continua liberado')
}
{
  // elenco cheio na posição → a carta nem aparece na lista
  const cheio = Array.from({ length: 12 }, (_, i) => carta({ id: `a${i}`, pos: 'ATA' })) as Card[]
  const m = tecnico({ squad: cheio as never })
  ok(monteBloqueio(estado(m), m, carta()) === 'vaga', 'sem vaga na posição → some da lista (bloqueio de VAGA)')
}

console.log('2) a regra do botão PASSAR (a que prendeu o Rei da Bola)')
{
  const m = tecnico()
  const s = estado(m)
  // a tela monta a lista assim: esconde vaga/reservado e olha se sobrou algo PEGÁVEL
  const monte = [carta({ id: 'x', semContrato: true, seller: m.id } as Partial<Card>)]
  const visiveis = monte.map(c => ({ c, bloq: monteBloqueio(s, m, c) })).filter(x => x.bloq !== 'vaga' && x.bloq !== 'reservado')
  ok(visiveis.length === 1, 'a carta travada APARECE (com o motivo), em vez de sumir sem explicação')
  ok(!visiveis.some(x => x.bloq === null), 'e nenhuma carta é pegável de verdade')
  ok(visiveis.every(x => x.bloq !== null) === true, '→ logo o botão PASSAR tem que estar liberado, mesmo com buraco no XI')
}
{
  const m = tecnico()
  const s = estado(m)
  const monte = [carta({ id: 'y' })]
  const visiveis = monte.map(c => ({ c, bloq: monteBloqueio(s, m, c) }))
  ok(visiveis.some(x => x.bloq === null), 'tendo sobra pegável de verdade, a exigência de fechar o XI continua valendo')
}

console.log(erros ? `\n❌ ${erros} checagem(ns) falhou` : '\n✅ tudo certo')
process.exit(erros ? 1 : 0)
