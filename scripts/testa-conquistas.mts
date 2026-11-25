// 🏅 Trava do Leilão de Conquistas (25/11): `npm run conquistas`
// Confere: todo pacote tem o tamanho certo · nenhuma pessoa repete no pacote nem entre pacotes · mesma semente = mesmos pacotes ·
// salas de 2 a 20 pessoas fecham pessoas+1 pacotes em toda posição (4-3-3 e 4-4-2) · tema de lista só com quem está na lista.
import { pacotesConquistas, cartasDoTema, pessoaDe, TEMAS_CONQUISTA } from '../src/escalacao/conquistas'
import type { Sector } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('  ❌ ' + msg) } }
const rngDe = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
const VAGAS: Record<string, Record<Sector, number>> = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 } }
function partida(seed: number, pessoas: number, f: string) {
  const rng = rngDe(seed), usadas = new Set<object>(), out: Record<string, ReturnType<typeof pacotesConquistas>> = {}
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[]) {
    const need = VAGAS[f][pos]
    const pk = pacotesConquistas(pos, pessoas + 1, need + 1, need, rng, c => usadas.has(c))
    for (const p of pk) for (const c of p.cartas) usadas.add(c)
    out[pos] = pk
  }
  return out
}
for (const f of Object.keys(VAGAS)) for (const pessoas of [2, 5, 8, 12, 16, 20]) for (const seed of [1, 7, 99]) {
  const P = partida(seed, pessoas, f)
  const vistas = new Set<object>()
  for (const [pos, pk] of Object.entries(P)) {
    const need = VAGAS[f][pos as Sector]
    ok(pk.length >= pessoas, `${f} · ${pessoas} pessoas · ${pos}: só ${pk.length} pacotes (precisa ${pessoas})`)
    for (const p of pk) {
      ok(p.cartas.length >= need && p.cartas.length <= need + 1, `${pos} ${p.tema.id}: ${p.cartas.length} cartas`)
      for (const c of p.cartas) { ok(!vistas.has(c), `carta repetida entre pacotes: ${c.name}`); vistas.add(c) }
    }
  }
  const P2 = partida(seed, pessoas, f)
  ok(JSON.stringify(P) === JSON.stringify(P2), `semente ${seed} não repete os mesmos pacotes`)
}
// a mesma PESSOA nunca vem duas vezes no mesmo pacote (Ronaldo do Cruzeiro + Ronaldo Fenômeno)
for (const seed of [3, 4, 5, 6]) for (const pk of Object.values(partida(seed, 10, '4-3-3'))) for (const p of pk) {
  const pes = p.cartas.map(c => pessoaDe({ carta: c, pais: (cartasDoTema(p.tema.id, 'ATA').concat(cartasDoTema(p.tema.id, 'MEI'), cartasDoTema(p.tema.id, 'ZAG'), cartasDoTema(p.tema.id, 'LAT'), cartasDoTema(p.tema.id, 'GOL')).find(i => i.carta === c)?.pais ?? '') }))
  ok(new Set(pes).size === pes.length, `pessoa repetida no pacote ${p.tema.id}: ${pes.join(', ')}`)
}
// listas fechadas: o tema só pega quem está nela
ok(cartasDoTema('bola-ouro', 'ATA').every(i => i.carta.name !== 'Luis Suárez'), 'Luis Suárez (uruguaio) não ganhou Bola de Ouro')
ok(cartasDoTema('copa-mundo', 'MEI').every(i => !(i.carta.name === 'Jorginho' && i.pais !== 'Brasil')), 'Jorginho da Itália não é campeão do mundo')
ok(cartasDoTema('kings', 'LAT').length === 0, 'Kings não tem lateral')
ok(cartasDoTema('kings', 'ATA').length > 10, 'Kings ATA sumiu')
for (const t of TEMAS_CONQUISTA) ok(['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].some(p => cartasDoTema(t.id, p as Sector).length >= 2), `tema ${t.id} sem cartas em posição nenhuma`)
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '✅ Leilão de Conquistas: pacotes do tamanho certo, sem repetir pessoa, salas de 2 a 20 fecham')
process.exit(falhas ? 1 : 0)
