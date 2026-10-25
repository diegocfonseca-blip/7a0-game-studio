// ⚡ MODO POKÉMON — a "chave" do modo e o baralho do leilão (25/10, só a conta do Diego, em teste).
// O leilão é o DE SEMPRE (regra do Diego: modo novo nunca inventa pregão). Pra isso o pokémon vira uma carta comum do
// motor: nome · região (no lugar do clube) · ano de estreia · categoria (fame) · faixa lo–hi. A formação 'pokemon' tem
// 6 vagas espalhadas nos 5 setores do motor, que aqui viram LOTES misturados (Lote 1…5; o 5º leva 2).
// Quem está no modo: `ehPokemon(state)` (pela formação, igual à Kings) — a tela consulta `pokeModo()`, que o provider
// mantém em dia a cada render. Nada disso existe fora do modo: o futebol nunca passa por aqui.
import { SECTORS, type Sector } from './types'
import { POKEMONS, faixaPoke, regiaoDe, FAME_POKE, type Pokemon } from './pokemon-dados'

let ATIVO = false
export function setPokeModo(v: boolean): void { ATIVO = v }
export function pokeModo(): boolean { return ATIVO }

const POR_NOME = new Map(POKEMONS.map(p => [p.nome, p]))
/** o pokémon por trás de uma carta — só dentro do modo (fora dele, nome nenhum vira pokémon) */
export function pokeDe(nome: string): Pokemon | undefined { return ATIVO ? POR_NOME.get(nome) : undefined }

/** 🔨 as 6 vagas do time nos 5 setores do motor: 1 · 1 · 1 · 1 · 2 */
export const FORMACAO_POKEMON: Record<Sector, number> = { GOL: 1, LAT: 1, ZAG: 1, MEI: 1, ATA: 2 }
/** rótulo do lote no topo do pregão */
export function nomeDoLote(s: Sector, en: boolean): string { const i = SECTORS.indexOf(s) + 1; return en ? `Lot ${i}` : `Lote ${i}` }

const ANO_GERACAO: Record<number, number> = { 1: 1996, 2: 1999, 3: 2002, 4: 2006, 5: 2010, 6: 2013, 7: 2016 }
type CartaCat = { name: string; club: string; year: number; fame: 1 | 2 | 4 | 5; lo: number; hi: number; folk?: boolean }
export function cartaDoPokemon(p: Pokemon): CartaCat {
  const { regiao, geracao } = regiaoDe(p.n)
  return { name: p.nome, club: regiao, year: ANO_GERACAO[geracao] ?? 1996, fame: FAME_POKE[p.cat], ...faixaPoke(p), ...(p.folk ? { folk: true } : {}) }
}

/** 🎲 o baralho da partida: os 200 espalhados nos 5 lotes, cada lote com Lendas, Craques, Bons e Profissionais
 *  misturados de todos os tipos (o 5º lote é o dobro, porque vale 2 vagas). Muda a cada partida (semente). */
export function baralhoPokemon(rng: () => number): Record<Sector, CartaCat[]> {
  const out = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] } as Record<Sector, CartaCat[]>
  // roda de lotes com o peso das vagas (o ATA aparece 2×): cada categoria é distribuída nessa roda, em ordem sorteada
  const roda: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA', 'ATA']
  for (const cat of ['lenda', 'craque', 'bom', 'pro'] as const) {
    const lista = POKEMONS.filter(p => p.cat === cat).map(p => ({ p, k: rng() })).sort((a, b) => a.k - b.k).map(x => x.p)
    const giro = Math.floor(rng() * roda.length)
    lista.forEach((p, i) => out[roda[(i + giro) % roda.length]].push(cartaDoPokemon(p)))
  }
  return out
}
