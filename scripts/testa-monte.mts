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
import { monteBloqueio, montePickable, montePush, takeFromMonte } from '../src/escalacao/store'
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

console.log('1a) 🔁 VOLTA COMO SAIU (Diego 20/09): a própria carta recuperada no monte não vem pela metade')
{
  // a artimanha: pagou 1000, listou, ninguém cobriu, caiu no monte pela metade,
  // repescou de graça — e saía com salário/renovação/teto pela metade sem vender nada.
  const eu = tecnico({ id: 1, money: 0, squad: [] })
  const outro = tecnico({ id: 2, name: 'Rival', teamName: 'Outro FC', money: 5000 })
  const listado = carta({ id: 'pele', name: 'Pelé', paid: 1000, seller: 1, contratoAte: 12 } as Partial<Card>)
  const s = estado(eu, { managers: [eu, outro], monteOrder: [1, 2], monteIdx: 0, seasonNo: 10, marketValues: {}, contratosOn: true } as Partial<EscState>)
  montePush(s, [listado])
  const noMonte = s.monte[0] as Card & { paid?: number; paidAntes?: number }
  ok(noMonte.paid === 500, 'no monte a carta vale a METADE (500) — pros outros nada mudou')
  ok(noMonte.paidAntes === 1000, 'e guarda o valor de antes (1000) pra devolver ao dono')
  takeFromMonte(s, 'pele')
  const voltou = eu.squad[0] as Card & { paid?: number; paidAntes?: number; contratoAte?: number }
  ok(voltou.paid === 1000, 'o DONO recupera e ela volta valendo 1000, como saiu (salário, renovação e teto seguem o 1000)')
  ok(voltou.contratoAte === 12, 'e com o MESMO contrato de quando saiu — não ganha 5-10 anos novos de graça')
  ok(voltou.paidAntes === undefined, 'o campo de bastidor não vaza pro elenco')
  ok(eu.money === 0, 'continua de graça: o dono não paga a si mesmo')
  ok(s.marketValues?.['Pelé|Santos'] === 1000 || Object.values(s.marketValues ?? {})[0] === 1000, 'o livro de preços volta a dizer 1000 — venda nenhuma aconteceu')
}
{
  // e pra OUTRO clube a regra é a de sempre: paga a metade e o contrato zera
  const eu = tecnico({ id: 1, money: 0, squad: [] })
  const outro = tecnico({ id: 2, name: 'Rival', teamName: 'Outro FC', money: 5000 })
  const listado = carta({ id: 'pele', name: 'Pelé', paid: 1000, seller: 1, contratoAte: 12 } as Partial<Card>)
  const s = estado(eu, { managers: [eu, outro], monteOrder: [2], monteIdx: 0, seasonNo: 10, marketValues: {}, contratosOn: true } as Partial<EscState>)
  montePush(s, [listado])
  takeFromMonte(s, 'pele')
  const levou = outro.squad[0] as Card & { paid?: number; paidAntes?: number; contratoAte?: number }
  ok(levou.paid === 500, 'outro clube leva pela METADE (500), como sempre')
  ok(outro.money === 4500 && eu.money === 500, 'ele paga 500 e o dono recebe 500')
  ok(levou.contratoAte === undefined && levou.paidAntes === undefined, 'contrato zera e o campo de bastidor não vaza')
}

console.log('1b) LISTAR não é abandonar (Garrincha do Rei da Bola · Maradona do Raiva Cajuri)')
{
  const m = tecnico()
  const s = estado(m)
  // quem o dono LISTOU volta pra ele: o selo do teto não bloqueia a recuperação
  const listado = carta({ seller: m.id, paid: 5, tetoOficial: true } as Partial<Card>)
  ok(monteBloqueio(s, m, listado) === null, 'carta LISTADA pelo dono pode ser recuperada, mesmo com teto de venda')
  ok(montePickable(s, m, listado), 'e o reducer aceita — é o mesmo juiz')
  // quem saiu por contrato encerrado continua barrado
  const abandonado = carta({ seller: m.id, semContrato: true } as Partial<Card>)
  ok(monteBloqueio(s, m, abandonado) === 'semcontrato', 'quem saiu por CONTRATO VENCIDO segue barrado — a regra do Diego não mudou')
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
