// 🧪 TRAVA DA JANELA NOVA (21/11) — "pôr à venda" no Mercado e a virada que transforma a marca em lista do leilão
//
// O desenho (aprovado pelo Diego): sondar e vender moram no 🛒 Mercado, a temporada toda; apertar 🔨 Leilão confirma e vai direto
// pro pregão; contrato vencendo tem tela própria. O que esta trava segura é a parte que mexe no SAVE:
//   ① a regra de quem pode ir à venda é UMA SÓ (`motivoNaoListar`) — Mercado, janela e virada leem a mesma;
//   ② marcar no Mercado nunca tira ninguém do elenco, e só existe com a chave ligada na carreira solo;
//   ③ na virada as marcas viram `reserveListed` pela mesma regra, quem não pode mais é pulado calado e o campo some;
//   ④ o `TOGGLE_RESERVE_LIST` de sempre continua aceitando e recusando exatamente o que aceitava e recusava.
//
// Rodar:  npx tsx scripts/testa-janela-nova.mts
// (o store puxa imagens .webp, que só o Vite sabe carregar — por isso entra pelo `ssrLoadModule`, igual `testa-saf-lenda.mjs`)
import { createServer } from 'vite'
import type { EscState, Manager, WonCard } from '../src/escalacao/types'
const vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' })
const { motivoNaoListar, aplicaAVendaMercado, janelaNovaVale, reducer } = await vite.ssrLoadModule('/src/escalacao/store.tsx') as typeof import('../src/escalacao/store')
const { _forcaJanelaNovaParaTeste, janelaNovaLiberada, JANELA_NOVA_GERAL } = await vite.ssrLoadModule('/src/escalacao/sport.ts') as typeof import('../src/escalacao/sport')

let erros = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros++ }

const carta = (id: string, pos: string, over: Partial<WonCard> = {}): WonCard => ({ id, name: `Jogador ${id}`, club: 'Santos', year: 2005, pos, fame: 3, lo: 70, hi: 80, paid: 10, ...over } as WonCard)
// 4-4-2: 1 GOL · 2 LAT · 2 ZAG · 4 MEI · 2 ATA — elenco com 1 atacante e 1 meia de sobra
const elenco = (): WonCard[] => [
  carta('g1', 'GOL'), carta('l1', 'LAT'), carta('l2', 'LAT'), carta('z1', 'ZAG'), carta('z2', 'ZAG'),
  carta('m1', 'MEI'), carta('m2', 'MEI'), carta('m3', 'MEI'), carta('m4', 'MEI'), carta('m5', 'MEI'),
  carta('a1', 'ATA'), carta('a2', 'ATA'), carta('a3', 'ATA'),
]
const tecnico = (over: Partial<Manager> = {}): Manager => ({ id: 7, name: 'Você', teamName: 'Clube Teste', isHuman: true, money: 100, squad: elenco(), formation: '4-4-2', ...over } as Manager)
const estado = (m: Manager, over: Partial<EscState> = {}): EscState => ({ careerOnline: true, onlineMode: 'cpu', roomId: '', managers: [m], youIdx: 0, seasonNo: 5, contratosOn: true, screen: 'season', reserveListed: {}, ...over } as unknown as EscState)

console.log('0) a chave nasce DESLIGADA pra todo mundo')
ok(JANELA_NOVA_GERAL === false, 'JANELA_NOVA_GERAL = false (só a conta do Diego até ele mandar liberar)')
ok(janelaNovaLiberada() === false, 'sem login e sem forçar: desligada')
ok(janelaNovaVale(estado(tecnico())) === false, 'com a chave desligada a janela nova não vale em carreira nenhuma')

console.log('1) a regra única de quem pode ir à venda')
{
  const m = tecnico()
  ok(motivoNaoListar(true, m, 'a3', [], 5) === null, 'atacante de sobra → pode')
  ok(motivoNaoListar(true, m, 'a2', ['a3'], 5) === 'posicao', '2º atacante com o 1º já listado → faltaria gente na posição')
  ok(motivoNaoListar(true, m, 'g1', [], 5) === 'posicao', 'goleiro único → posição ficaria vazia')
  ok(motivoNaoListar(true, m, 'a3', [], 2) === 'cedo', 'janela da 2ª temporada → a venda ainda não liberou')
  ok(motivoNaoListar(true, m, 'zzz', [], 5) === 'sumiu', 'carta que não está no elenco')
  const cria = tecnico({ squad: [...elenco(), carta('c1', 'ATA', { cria: true } as Partial<WonCard>)] })
  ok(motivoNaoListar(true, cria, 'c1', [], 5) === 'cria', 'cria da base é invendável')
  const emp = tecnico({ squad: [...elenco(), carta('e1', 'ATA', { emprestado: true } as Partial<WonCard>)] })
  ok(motivoNaoListar(true, emp, 'e1', [], 5) === 'emprestado', 'emprestado não vai à venda')
  ok(motivoNaoListar(true, emp, 'a2', ['a3'], 5) === 'posicao', 'e o emprestado não serve de muleta pra vender abaixo da formação')
  const venc = tecnico({ squad: elenco().map(c => c.id === 'a3' ? { ...c, contratoAte: 4 } as WonCard : c) })
  ok(motivoNaoListar(true, venc, 'a3', [], 5) === 'vencido', 'contrato já vencido na janela → só sai pelo "Deixar ir" (listar ≠ deixar vencer)')
  ok(motivoNaoListar(false, venc, 'a3', [], 5) === null, 'carreira sem contratos: a trava de contrato não existe')
  ok(motivoNaoListar(true, venc, 'a3', [], 4) === null, 'e na temporada em que o contrato ainda vale, pode')
}

console.log('2) o TOGGLE_RESERVE_LIST de sempre continua igual')
{
  const s0 = estado(tecnico(), { screen: 'reserveList' } as Partial<EscState>)
  const s1 = reducer(s0, { type: 'TOGGLE_RESERVE_LIST', mgrId: 7, cardId: 'a3' })
  ok((s1.reserveListed?.[7] ?? []).join() === 'a3', 'lista o atacante de sobra')
  const s2 = reducer(s1, { type: 'TOGGLE_RESERVE_LIST', mgrId: 7, cardId: 'a2' })
  ok((s2.reserveListed?.[7] ?? []).join() === 'a3', 'recusa o 2º (deixaria a posição curta)')
  const s3 = reducer(s2, { type: 'TOGGLE_RESERVE_LIST', mgrId: 7, cardId: 'a3' })
  ok((s3.reserveListed?.[7] ?? []).length === 0, 'tocar de novo tira da lista')
  const cedo = reducer(estado(tecnico(), { seasonNo: 2 } as Partial<EscState>), { type: 'TOGGLE_RESERVE_LIST', mgrId: 7, cardId: 'a3' })
  ok((cedo.reserveListed?.[7] ?? []).length === 0, 'antes da 3ª temporada não lista ninguém')
}

console.log('3) marcar no Mercado: só com a chave, só carreira solo, nunca mexe no elenco')
{
  const desligada = reducer(estado(tecnico()), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok(desligada.aVendaMercado === undefined, 'chave desligada → a ação não faz nada (conta comum: zero mudança)')
  _forcaJanelaNovaParaTeste(true)
  ok(janelaNovaVale(estado(tecnico())) === true, 'chave ligada + carreira solo → vale')
  ok(janelaNovaVale(estado(tecnico(), { onlineMode: 'online' } as Partial<EscState>)) === false, 'sala online → não vale')
  ok(janelaNovaVale(estado(tecnico(), { roomId: 'abc' } as Partial<EscState>)) === false, 'carreira em sala (roomId) → não vale')
  ok(janelaNovaVale(estado(tecnico(), { co2: {} } as unknown as Partial<EscState>)) === false, 'carreira online v2 (co2) → não vale')
  ok(janelaNovaVale(estado(tecnico(), { careerOnline: false } as Partial<EscState>)) === false, 'fora da carreira → não vale')
  const s1 = reducer(estado(tecnico(), { seasonNo: 4 } as Partial<EscState>), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok((s1.aVendaMercado ?? []).join() === 'a3', 'marca o atacante de sobra')
  ok(s1.managers[0].squad.length === 13 && (s1.reserveListed?.[7] ?? []).length === 0, 'ele segue no elenco e nada entra na lista do leilão ainda')
  const s2 = reducer(s1, { type: 'A_VENDA_MERCADO', cardId: 'a2' })
  ok((s2.aVendaMercado ?? []).join() === 'a3', 'recusa quem deixaria a posição curta (mesma regra do listar)')
  const s3 = reducer(s2, { type: 'A_VENDA_MERCADO', cardId: 'm5' })
  ok((s3.aVendaMercado ?? []).join() === 'a3,m5', 'aceita o meia de sobra')
  const s4 = reducer(s3, { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok((s4.aVendaMercado ?? []).join() === 'm5', 'tocar de novo desmarca')
  const s5 = reducer(s4, { type: 'A_VENDA_MERCADO', cardId: 'm5' })
  ok(s5.aVendaMercado === undefined, 'sem marca nenhuma o campo some do save')
  const t1 = reducer(estado(tecnico(), { seasonNo: 1 } as Partial<EscState>), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok(t1.aVendaMercado === undefined, 'na 1ª temporada não marca (a próxima janela é a 2ª: só compra)')
  const t2 = reducer(estado(tecnico(), { seasonNo: 2 } as Partial<EscState>), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok((t2.aVendaMercado ?? []).join() === 'a3', 'na 2ª já marca (a próxima janela é a 3ª, quando a venda libera)')
  const fim = tecnico({ squad: elenco().map(c => c.id === 'a3' ? { ...c, contratoAte: 4 } as WonCard : c) })
  const v = reducer(estado(fim, { seasonNo: 4 } as Partial<EscState>), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok(v.aVendaMercado === undefined, 'contrato que acaba nesta temporada não é marcado (é assunto da tela de Contratos)')
  const online = reducer(estado(tecnico(), { onlineMode: 'online' } as Partial<EscState>), { type: 'A_VENDA_MERCADO', cardId: 'a3' })
  ok(online.aVendaMercado === undefined, 'sala online: a ação não faz nada')
}

console.log('4) a virada: marca → lista do leilão, pela mesma regra, e o campo some')
{
  const s = estado(tecnico(), { seasonNo: 5, aVendaMercado: ['a3', 'm5'] } as Partial<EscState>)
  aplicaAVendaMercado(s)
  ok((s.reserveListed?.[7] ?? []).join() === 'a3,m5', 'os dois marcados chegam listados')
  ok(s.aVendaMercado === undefined, 'o campo é consumido')
  ok(s.managers[0].squad.length === 13, 'ninguém sai do elenco aqui (quem tira é o leilão, como sempre)')
}
{
  // entre marcar e virar, o elenco mudou: um saiu, outro ficou com contrato vencido, outro deixaria a posição curta
  const sq = elenco().filter(c => c.id !== 'm5').map(c => c.id === 'a3' ? { ...c, contratoAte: 4 } as WonCard : c)
  const s = estado(tecnico({ squad: sq }), { seasonNo: 5, aVendaMercado: ['m5', 'a3', 'm4', 'g1'] } as Partial<EscState>)
  aplicaAVendaMercado(s)
  ok((s.reserveListed?.[7] ?? []).length === 0, 'quem não pode mais (saiu · contrato venceu · posição curta) é pulado calado')
  ok(s.aVendaMercado === undefined, 'e o campo some do mesmo jeito')
}
{
  const s = estado(tecnico(), { seasonNo: 5, aVendaMercado: ['a3', 'a2', 'a1'] } as Partial<EscState>)
  aplicaAVendaMercado(s)
  ok((s.reserveListed?.[7] ?? []).join() === 'a3', 'marcas velhas demais pra formação: entra só até onde a posição aguenta')
  const depois = s.managers[0].squad.filter(c => c.pos === 'ATA' && !(s.reserveListed?.[7] ?? []).includes(c.id)).length
  ok(depois >= 2, 'o XI continua fechando depois da venda (nunca abaixo da formação)')
}
{
  const s = estado(tecnico(), { seasonNo: 2, aVendaMercado: ['a3'] } as Partial<EscState>)
  aplicaAVendaMercado(s)
  ok((s.reserveListed?.[7] ?? []).length === 0 && s.aVendaMercado === undefined, 'janela da 2ª temporada: nada é listado e a marca some')
}
{
  const s = estado(tecnico(), { seasonNo: 5 } as Partial<EscState>)
  aplicaAVendaMercado(s)
  ok(Object.keys(s.reserveListed ?? {}).length === 0, 'save antigo, sem o campo: não muda nada')
}

_forcaJanelaNovaParaTeste(false)
await vite.close()
console.log(erros ? `\n❌ ${erros} erro(s)` : '\n✅ janela nova: tudo certo')
process.exit(erros ? 1 : 0)
