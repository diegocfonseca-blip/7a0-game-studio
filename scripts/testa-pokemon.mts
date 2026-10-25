// ⚡ Trava do MODO POKÉMON (25/10): catálogo com os tipos oficiais, a tabela de vantagens e o motor da batalha.
//   npx tsx scripts/testa-pokemon.mts
import { POKEMONS, efetividade, faixaPoke, TIPOS_POKE, COM_ARTE } from '../src/escalacao/pokemon-dados.ts'
import { batalha, escolhaBot, rngPoke, ordenaPoke, anotaBatalha, type LutadorPoke, type LinhaPoke } from '../src/escalacao/pokemon-batalha.ts'
import { calendarioKings } from '../src/escalacao/kings.ts'

let erros = 0
const ok = (c: boolean, msg: string) => { if (!c) { erros++; console.log('❌', msg) } }

// 1) catálogo: a 1ª geração INTEIRA, sem repetido, tipos válidos
const nums = POKEMONS.map(p => p.n)
ok(new Set(nums).size === nums.length, 'pokémon repetido no catálogo')
ok(new Set(POKEMONS.map(p => p.nome)).size === POKEMONS.length, 'nome repetido')
for (let n = 1; n <= 151; n++) ok(nums.includes(n), `falta o nº ${n} da 1ª geração`)
for (const p of POKEMONS) {
  ok(p.tipos.length >= 1 && p.tipos.length <= 2 && p.tipos.every(t => TIPOS_POKE.includes(t)), `${p.nome}: tipo inválido`)
  const f = faixaPoke(p); ok(f.lo < f.hi, `${p.nome}: faixa lo<hi`)
}
ok(POKEMONS.find(p => p.nome === 'Pikachu')?.cat === 'lenda', 'Pikachu tem que ser Lenda (folclórico, ordem do Diego)')
ok(COM_ARTE.size === POKEMONS.filter(p => p.cat === 'lenda').length, 'só Lenda tem arte própria')

// 2) tabela oficial: casos que todo fã conhece
ok(efetividade('Água', ['Fogo']) === 2, 'Água × Fogo = 2')
ok(efetividade('Elétrico', ['Terra']) === 0, 'Elétrico × Terra = 0')
ok(efetividade('Elétrico', ['Água', 'Voador']) === 4, 'Elétrico × Gyarados = 4')
ok(efetividade('Normal', ['Fantasma']) === 0, 'Normal × Fantasma = 0')
ok(efetividade('Dragão', ['Fada']) === 0, 'Dragão × Fada = 0')
ok(efetividade('Gelo', ['Dragão', 'Voador']) === 4, 'Gelo × Dragonite = 4')
ok(efetividade('Fogo', ['Pedra', 'Terra']) === 0.5, 'Fogo × Geodude = ½')
ok(efetividade('Água', ['Pedra', 'Terra']) === 4, 'Água × Geodude = 4')

// 3) batalha: termina sempre, 3 nocautes do vencedor, mesma semente = mesmo resultado
const L = (nome: string): LutadorPoke => { const p = POKEMONS.find(x => x.nome === nome)!; const f = faixaPoke(p); return { id: nome, nome, tipos: p.tipos, ...f } }
const todos = POKEMONS.map(p => L(p.nome))
const r1 = rngPoke(7)
let vLenda = 0, n = 0
for (let i = 0; i < 2000; i++) {
  const pega = () => [0, 1, 2].map(() => todos[Math.floor(r1() * todos.length)])
  const a = { nome: 'A', time: pega(), tatica: 'equilibrio' as const }, b = { nome: 'B', time: pega(), tatica: 'equilibrio' as const }
  const r = batalha(a, b, i)
  const r2 = batalha(a, b, i)
  ok(r.vencedor === r2.vencedor && r.eventos.length === r2.eventos.length, 'mesma semente deu resultado diferente')
  ok((r.vencedor === 'a' ? r.nocA : r.nocB) === 3, `vencedor tem que derrubar os 3 (deu ${r.nocA}×${r.nocB})`)
  ok(r.eventos.length < 400, 'batalha longa demais')
}
// Lenda × Profissional: a Lenda ganha quase sempre, mas o tipo pesa
for (let i = 0; i < 500; i++) {
  const r = batalha({ nome: 'L', time: [L('Mewtwo'), L('Charizard'), L('Blastoise')], tatica: 'equilibrio' }, { nome: 'P', time: [L('Rattata'), L('Caterpie'), L('Magikarp')], tatica: 'equilibrio' }, i)
  n++; if (r.vencedor === 'a') vLenda++
}
ok(vLenda / n > 0.95, `lendas × profissionais deveria ganhar ~sempre (${vLenda}/${n})`)
// o tipo vira o jogo: Blastoise (água) × Charizard (fogo) — a água tem que ganhar a maioria
let agua = 0
for (let i = 0; i < 500; i++) if (batalha({ nome: 'A', time: [L('Blastoise')], tatica: 'equilibrio' }, { nome: 'F', time: [L('Charizard')], tatica: 'equilibrio' }, i).vencedor === 'a') agua++
ok(agua / 500 > 0.7, `Blastoise × Charizard: a água tem que levar a maioria (${agua}/500)`)

// 4) liga de 10: 9 rodadas, todo mundo 9 jogos, tabela fecha
const ids = Array.from({ length: 10 }, (_, i) => i)
const cal = calendarioKings(ids)
ok(cal.length === 9 && cal.every(r => r.length === 5), 'calendário: 9 rodadas de 5 batalhas')
const tab: LinhaPoke[] = ids.map(id => ({ id, nome: `T${id}`, j: 0, v: 0, d: 0, pts: 0, nocP: 0, nocC: 0 }))
const times = ids.map(i => todos.slice(i * 6, i * 6 + 6))
cal.forEach((rod, ri) => rod.forEach(([h, a], k) => {
  const eh = escolhaBot(times[h], times[a], rngPoke(ri * 10 + k)), ea = escolhaBot(times[a], times[h], rngPoke(ri * 10 + k + 5))
  ok(eh.ids.length === 3 && new Set(eh.ids).size === 3, 'bot tem que escalar 3 diferentes')
  const pick = (t: LutadorPoke[], is: string[]) => is.map(i => t.find(x => x.id === i)!)
  anotaBatalha(tab, h, a, batalha({ nome: '', time: pick(times[h], eh.ids), tatica: eh.tatica }, { nome: '', time: pick(times[a], ea.ids), tatica: ea.tatica }, ri * 100 + k))
}))
ok(tab.every(t => t.j === 9), 'todo mundo joga 9')
ok(ordenaPoke(tab).length === 10 && tab.reduce((s, t) => s + t.pts, 0) === 45 * 3, 'soma dos pontos = 45 batalhas × 3')

console.log(erros ? `\n❌ ${erros} erro(s)` : `✅ pokémon ok — ${POKEMONS.length} no catálogo · água×fogo ${agua}/500 · lendas×pro ${vLenda}/${n}`)
process.exit(erros ? 1 : 0)
