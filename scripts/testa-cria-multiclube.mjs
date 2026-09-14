// 🌱🏛️ Cria da Base no 2º CLUBE (Multiclubes) — erro que o gfpicolo1313 mostrou em
// 14/09: *"o segundo clube dele não está conseguindo colocar os jogadores da base
// no elenco do segundo clube"*.
// O que este teste confere, do jeito que o jogo faz:
//   1. com o clube PRINCIPAL no comando, subir da base funciona;
//   2. troca o comando pro 2º clube (SWITCH_MULTICLUBE);
//   3. com o 2º clube no comando, subir da base tem que funcionar IGUAL;
//   4. e a caixa da tela (vagaCheio) tem que enxergar vaga nos dois.
//   node scripts/testa-cria-multiclube.mjs
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const store = await server.ssrLoadModule('/src/escalacao/store.tsx')
const { reducer, INITIAL, vagaCheio } = store

const carta = (id, pos, n) => ({ id, name: `${pos}${n}`, club: 'Clube', year: 2000, pos, fame: 2, lo: 60, hi: 70, paid: 1, buyPrice: 1 })
// elenco de 11 (4-3-3): 1 GOL, 2 LAT, 2 ZAG, 3 MEI, 3 ATA — sobra vaga em tudo
const onze = (pref) => [
  carta(`${pref}g1`, 'GOL', 1),
  carta(`${pref}l1`, 'LAT', 1), carta(`${pref}l2`, 'LAT', 2),
  carta(`${pref}z1`, 'ZAG', 1), carta(`${pref}z2`, 'ZAG', 2),
  carta(`${pref}m1`, 'MEI', 1), carta(`${pref}m2`, 'MEI', 2), carta(`${pref}m3`, 'MEI', 3),
  carta(`${pref}a1`, 'ATA', 1), carta(`${pref}a2`, 'ATA', 2), carta(`${pref}a3`, 'ATA', 3),
]
const tecnico = (id, nome, dormindo) => ({
  ...INITIAL.managers[0], id, name: nome, teamName: nome, isHuman: true, dormindo,
  formation: '4-3-3', money: 500, squad: onze(`c${id}`),
})

let s = {
  ...INITIAL,
  screen: 'season', careerOnline: true, onlineMode: 'solo', seasonNo: 5, seed: 12345,
  youIdx: 0,
  managers: [tecnico(1, 'Leão da Estradinha', false), tecnico(2, 'Segundo Clube', true)],
  multiClube: { team: 'Segundo Clube', id: 2, since: 3 },
  multiClubeAtivo: false,
  careerCoins: { 1: 300, 2: 300 },
  criaNames: [],
}

let falhas = 0
const ok = (cond, txt) => { console.log(`${cond ? '✅' : '❌'} ${txt}`); if (!cond) falhas++ }
const ativo = (st) => st.managers[st.youIdx]
const criasDe = (st, id) => (st.managers.find(m => m.id === id)?.squad ?? []).filter(c => c.cria)

// ── 1. clube PRINCIPAL no comando
console.log('\n1) clube PRINCIPAL no comando')
ok(ativo(s).id === 1, 'o ativo é o principal')
ok(vagaCheio(ativo(s), 'MEI') > 0, `a tela vê vaga de meia (${vagaCheio(ativo(s), 'MEI')})`)
s = reducer(s, { type: 'SUBIR_CRIA', mgrId: ativo(s).id, pos: 'MEI', nome: 'Foguinho', historia: 0 })
ok(criasDe(s, 1).length === 1, `o principal subiu 1 cria (subiu ${criasDe(s, 1).length})`)

// ── 2. troca o comando pro 2º clube
console.log('\n2) troca de comando pro 2º clube')
s = reducer(s, { type: 'SWITCH_MULTICLUBE' })
ok(ativo(s).id === 2, `o ativo virou o 2º clube (é o id ${ativo(s).id})`)
ok(ativo(s).dormindo !== true, 'o 2º clube acordou (dormindo = false)')
ok(s.managers.find(m => m.id === 1)?.dormindo === true, 'o principal foi dormir')

// ── 3. subir da base NO 2º CLUBE
console.log('\n3) Cria da Base no 2º clube')
ok(vagaCheio(ativo(s), 'MEI') > 0, `a tela vê vaga de meia no 2º clube (${vagaCheio(ativo(s), 'MEI')})`)
const antes2 = criasDe(s, 2).length
s = reducer(s, { type: 'SUBIR_CRIA', mgrId: ativo(s).id, pos: 'MEI', nome: 'Pezão', historia: 1 })
const depois2 = criasDe(s, 2).length
ok(depois2 === antes2 + 1, `o 2º clube subiu 1 cria (antes ${antes2}, depois ${depois2})`)
ok(criasDe(s, 1).length === 1, 'o cria do principal continua no principal (nada vazou de clube)')

// ── 4. o nome não pode repetir na carreira inteira
console.log('\n4) trava de nome repetido (vale pros dois clubes)')
const antesRep = criasDe(s, 2).length
s = reducer(s, { type: 'SUBIR_CRIA', mgrId: ativo(s).id, pos: 'ATA', nome: 'Foguinho', historia: 2 })
ok(criasDe(s, 2).length === antesRep, 'nome já usado pelo outro clube foi recusado')

// ── 5. volta pro principal e confere que ele ainda sobe
console.log('\n5) volta pro principal')
s = reducer(s, { type: 'SWITCH_MULTICLUBE' })
ok(ativo(s).id === 1, 'o ativo voltou a ser o principal')
const antes1 = criasDe(s, 1).length
s = reducer(s, { type: 'SUBIR_CRIA', mgrId: ativo(s).id, pos: 'ATA', nome: 'Miudinho', historia: 3 })
ok(criasDe(s, 1).length === antes1 + 1, 'o principal continua subindo da base')

// ── 6. POTE DE NOMES SECO — o caso real do gfpicolo13 (72 crias, pote de 30)
// Os DOIS clubes dividem a mesma lista de nomes, então numa carreira longa o pote
// acaba. Antes, a tela voltava a oferecer nome JÁ USADO e o CONFIRMAR não fazia
// nada (o reducer recusa repetido, calado). Tem que continuar subindo sempre.
console.log('\n6) pote de nomes SECO (carreira longa / multiclube)')
const { previewCriaNomes } = store
const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
// carreira longa: TODOS os nomes do pote já foram usados (o gfpicolo13 tinha 72 usados
// pra um pote de 30, porque os dois clubes dividem a mesma lista)
const { CRIA_NOMES } = await server.ssrLoadModule('/src/escalacao/data.ts')
const secos = [...CRIA_NOMES]
console.log(`   (pote tem ${CRIA_NOMES.length} nomes — todos gastos neste teste)`)
const ops = previewCriaNomes(secos, mulberry(7), 3)
ok(ops.length === 3, `a tela ainda oferece 3 nomes (ofereceu ${ops.length})`)
ok(ops.every(nm => !secos.includes(nm)), `nenhum nome oferecido já estava usado (${ops.join(', ')})`)
ok(new Set(ops).size === 3, 'os 3 nomes são diferentes entre si')

// e o botão tem que FUNCIONAR com o pote seco, no 2º clube
let s2 = { ...s, criaNames: [...secos], youIdx: 0 }
s2 = reducer(s2, { type: 'SWITCH_MULTICLUBE' })
const alvo = ativo(s2)
const ops2 = previewCriaNomes(s2.criaNames, mulberry(99), 3)
const antesSeco = criasDe(s2, alvo.id).length
s2 = reducer(s2, { type: 'SUBIR_CRIA', mgrId: alvo.id, pos: 'MEI', nome: ops2[0], historia: 0 })
ok(criasDe(s2, alvo.id).length === antesSeco + 1, `com o pote seco o CONFIRMAR ainda sobe o guri ("${ops2[0]}")`)

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
await server.close()
process.exit(falhas ? 1 : 0)
