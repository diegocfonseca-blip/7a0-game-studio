// 🪑 Copa do Mundo/regional da sala com DUPLAS (20/10, sala ZESM9K do Futpoint): quem escolhe e convoca por cada time
// sai do ESTADO da partida (seatUids + duplas), não do número velho do banco.   npx tsx scripts/testa-dupla-copa-estado.mts
import { quemAgePorAssento, quemAgePeloEstado, minhaDuplaPeloEstado, duplaDoAssentoPeloEstado } from '../src/escalacao/dupla-copa'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
// a sala como estava: 6 times; o Bonança é o time 3 no jogo, mas no banco ficou com o número 5 (dupla cruzada)
const assentos = ['futpoint', 'nicodemos', 'estourador', 'bonanca', 'agsl', 'ramon']
const duplas = {
  0: { ownerUid: 'futpoint', ownerName: 'Futpoint FC 👑', partnerUid: 'guimaraes', partnerName: 'Guimarães SCI', cats: { CONV: 'guimaraes' } },
  1: { ownerUid: 'nicodemos', ownerName: 'Nicodemos' },
  2: { ownerUid: 'estourador', ownerName: 'Estourador', partnerUid: 'cativeiro', partnerName: 'Cativeiro fc', cats: { CONV: 'cativeiro' } },
  3: { ownerUid: 'bonanca', ownerName: 'Bonança SSFC', partnerUid: 'portuguesa', partnerName: 'Portuguesa Saf' },
  4: { ownerUid: 'agsl', ownerName: 'Agsl' },
  5: { ownerUid: 'ramon', ownerName: 'Ramon' },
}
const linhas = [
  { user_id: 'futpoint', player_index: 0 }, { user_id: 'guimaraes', player_index: 1, dupla_partner_of: 'futpoint' },
  { user_id: 'nicodemos', player_index: 1 }, { user_id: 'estourador', player_index: 2 }, { user_id: 'cativeiro', player_index: 3, dupla_partner_of: 'estourador' },
  { user_id: 'bonanca', player_index: 5, dupla_partner_of: 'portuguesa' }, { user_id: 'portuguesa', player_index: 3, dupla_partner_of: 'bonanca' },
  { user_id: 'agsl', player_index: 6 }, { user_id: 'ramon', player_index: 4 },
]
const pelosNumeros = quemAgePorAssento(linhas)
ok(pelosNumeros.get(3) !== 'bonanca' && pelosNumeros.get(3) !== 'portuguesa', `pelo número do banco o time 3 (Bonança) ia pra pessoa errada (${pelosNumeros.get(3)}) — é o bug`)
const m = quemAgePeloEstado(assentos, duplas)!
ok(m.get(0) === 'guimaraes', 'time 0: quem a dupla marcou pra convocar (Guimarães)')
ok(m.get(2) === 'cativeiro', 'time 2: Cativeiro convoca pela dupla do Estourador')
ok(m.get(3) === 'bonanca', 'time 3: o Bonança (dono, ninguém marcado) — nunca o número velho do banco')
ok(m.get(4) === 'agsl' && m.get(5) === 'ramon' && m.get(1) === 'nicodemos', 'times de uma pessoa: cada um no seu')
ok(new Set(m.values()).size === 6, 'ninguém age por dois times')
const d = minhaDuplaPeloEstado(assentos, duplas, 'portuguesa')
ok(d?.age === 'bonanca' && d.outro === 'portuguesa', 'a Portuguesa vê que o Bonança convoca e ela assiste')
ok(minhaDuplaPeloEstado(assentos, duplas, 'agsl') === null, 'quem joga sozinho não tem dupla')
ok(duplaDoAssentoPeloEstado(assentos, duplas, 0)?.nomeAge === 'Guimarães SCI', 'a fila mostra quem escolhe pela dupla')
const solo = quemAgePeloEstado(assentos, { ...duplas, 2: { ...duplas[2], soloUid: 'estourador' } })!
ok(solo.get(2) === 'estourador', 'se um da dupla saiu de verdade, quem ficou convoca (mesma régua do leilão)')
ok(quemAgePeloEstado(undefined, duplas) === null, 'estado sem o mapa (versão velha) → cai na regra antiga')
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ copa com duplas: assento pelo estado da partida')
process.exit(falhas ? 1 : 0)
