// 📚 COLEÇÕES DE CLUBES (04/10, regras fechadas com o Diego — mockup v2)
//
// · Só vira coleção o clube que tem 11+ cartas no baralho (BR + Europa + Mundo juntos, pelo nome do
//   clube) — e pra FECHAR precisa de TODAS as cartas dele (Diego, 04/10: *"entraria só time que tem
//   11, mas entrariam todos os jogadores do time"*). O Flamengo pede as 77. Quando um clube chega a
//   11 cartas, a coleção NASCE sozinha — não tem lista escrita à mão.
// · Prêmio = a soma do valor de TODAS as cartas do clube, arredondada pra CIMA (*"dobrado e
//   arredondado pra mais"*): 👑 Lenda 5 · ⭐ Craque 3 · 💎 Promessa 2 · 🎯 Bom jogador 1 · 🪵 Foi
//   profissional 0,5. Real Madrid 162 · Flamengo 142. (Recusados: por dificuldade, só por tamanho.)
// · Receber marca uma cópia de cada carta do clube como USADA naquela carreira (esc_cartas_usadas).
//   Elas continuam no álbum, mas não contam mais; fechar de novo pede o clube inteiro de novo.
// Tudo aqui é PURO (sem rede), pra tela e trava lerem a MESMA conta.
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'
import type { Sector } from './types'

export type CartaBaralho = { name: string; club: string; year: number; pos: Sector; fame: number; folk?: boolean; promessa?: boolean }
export const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`

/** 🎴 o baralho inteiro (os três), sem repetir a mesma carta (nome+clube+ano) */
export const BARALHO_TODO: CartaBaralho[] = (() => {
  const vistos = new Set<string>(); const out: CartaBaralho[] = []
  for (const cat of [CATALOG, CATALOG_EU, CATALOG_WORLD]) for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[]) for (const c of cat[pos]) {
    const k = chaveCarta(c); if (vistos.has(k)) continue; vistos.add(k)
    out.push({ name: c.name, club: c.club, year: c.year, pos, fame: c.fame, folk: c.folk, promessa: c.promessa })
  }
  return out
})()

export type Categoria = 'lenda' | 'craque' | 'promessa' | 'bom' | 'prof'
export const categoriaDe = (c: { fame: number; promessa?: boolean }): Categoria =>
  c.promessa ? 'promessa' : c.fame >= 5 ? 'lenda' : c.fame === 4 ? 'craque' : c.fame >= 2 ? 'bom' : 'prof'
export const VALOR_CATEGORIA: Record<Categoria, number> = { lenda: 5, craque: 3, promessa: 2, bom: 1, prof: 0.5 }
// 🎲 SORTEIO DA CARTA DO TÍTULO (04/10, Diego: *"antes não era raro aparecer lenda, agora tem que ser
// um pouco mais"*). Antes cada carta tinha a mesma chance → a lenda saía em ~9% dos títulos (194 de
// 2.107 cartas). Agora sorteia primeiro a CATEGORIA, com a lenda mais rara, e depois a carta dentro
// dela. Pode vir repetida. Quem já tem as cartas fica com elas — isto só vale pros pacotes novos.
export const CHANCE_CATEGORIA: Record<Categoria, number> = { lenda: 4, craque: 16, promessa: 4, bom: 58, prof: 18 }
export function sorteiaCarta<T extends { fame: number; promessa?: boolean }>(pool: T[], aleatorio: () => number = Math.random): T | undefined {
  if (!pool.length) return undefined
  const porCat = new Map<Categoria, T[]>()
  for (const c of pool) { const k = categoriaDe(c); const l = porCat.get(k); if (l) l.push(c); else porCat.set(k, [c]) }
  const cats = [...porCat.keys()]
  const total = cats.reduce((s, k) => s + CHANCE_CATEGORIA[k], 0)
  let r = aleatorio() * total
  let cat = cats[cats.length - 1]
  for (const k of cats) { r -= CHANCE_CATEGORIA[k]; if (r < 0) { cat = k; break } }
  const l = porCat.get(cat)!
  return l[Math.floor(aleatorio() * l.length)]
}

/** 🔗 o mesmo clube escrito de dois jeitos no baralho conta como UM só na coleção (a carta não muda de
 *  nome, porque nome|clube|ano é a chave dela no álbum). Mesmo mapa na função do banco esc_colecao_receber. */
export const CLUBE_MESMO: Record<string, string> = { 'Leicester City': 'Leicester' }
export const clubeColecao = (club: string) => CLUBE_MESMO[club] ?? club

/** mínimo de cartas no baralho pra um clube virar coleção */
export const MIN_CARTAS_CLUBE = 11

export type Colecao = { clube: string; cartas: CartaBaralho[]; premio: number; contagem: Record<Categoria, number>; especial?: boolean }

// 🌟 LENDAS AVULSAS (04/10, Diego: *"coloque alguma categoria pra eles… será 5 moedas pra cada, mas tem que
// completar todos eles juntos"*): as LENDAS de clube que ainda não é coleção (menos de 11 cartas) formam uma
// coleção especial. Cada uma vale 5 (o valor de lenda) e só paga com todas juntas. A lista se monta sozinha:
// quando o clube da lenda chegar a 11 cartas, ela sai daqui e vai pra coleção do clube. Nome escolhido pelo Diego (04/10); o bloco do resto virou "Cartas Avulsas".
export const NOME_LENDAS_AVULSAS = 'Lendas Avulsas'

/** as coleções que existem hoje (clube com 11+ cartas), da que mais paga pra que menos paga */
export function colecoesDoBaralho(baralho: CartaBaralho[] = BARALHO_TODO): Colecao[] {
  const porClube = new Map<string, CartaBaralho[]>()
  for (const c of baralho) { const k = clubeColecao(c.club); const l = porClube.get(k); if (l) l.push(c); else porClube.set(k, [c]) }
  const out: Colecao[] = []
  for (const [clube, cartas] of porClube) {
    if (cartas.length < MIN_CARTAS_CLUBE) continue
    const contagem: Record<Categoria, number> = { lenda: 0, craque: 0, promessa: 0, bom: 0, prof: 0 }
    let soma = 0
    for (const c of cartas) { const k = categoriaDe(c); contagem[k]++; soma += VALOR_CATEGORIA[k] }
    out.push({ clube, cartas, premio: Math.max(1, Math.ceil(soma)), contagem })
  }
  const clubesColecao = new Set(out.map(c => c.clube))
  const avulsas = baralho.filter(c => !clubesColecao.has(clubeColecao(c.club)) && categoriaDe(c) === 'lenda')
  if (avulsas.length >= 2) {
    out.push({ clube: NOME_LENDAS_AVULSAS, cartas: avulsas, premio: avulsas.length * VALOR_CATEGORIA.lenda, contagem: { lenda: avulsas.length, craque: 0, promessa: 0, bom: 0, prof: 0 }, especial: true })
  }
  return out.sort((a, b) => b.premio - a.premio || a.clube.localeCompare(b.clube))
}
export const COLECOES: Colecao[] = colecoesDoBaralho()

/** uma carta do álbum da pessoa (uma LINHA de user_cards = uma cópia) */
export type MinhaCarta = { id: string; name: string; club: string; year: number; usadaEm?: string | null; presa?: boolean }

export type Progresso = {
  colecao: Colecao
  /** cartas DIFERENTES do clube que a pessoa tem em cópia livre (não usada, não presa em troca) */
  livres: number
  /** quantas o clube pede (todas as cartas dele no baralho) */
  total: number
  /** quantas vezes já recebeu essa coleção */
  recebidas: number
  pronta: boolean
}

export function progressoDas(minhas: MinhaCarta[], colecoes: Colecao[] = COLECOES): Progresso[] {
  // casa pela CARTA (nome|clube|ano), não pelo clube: a coleção especial junta cartas de clubes diferentes
  const porChave = new Map<string, MinhaCarta[]>()
  for (const m of minhas) { const k = chaveCarta(m); const l = porChave.get(k); if (l) l.push(m); else porChave.set(k, [m]) }
  return colecoes.map(colecao => {
    const doBaralho = new Set(colecao.cartas.map(chaveCarta))
    const doClube = [...doBaralho].flatMap(k => porChave.get(k) ?? [])
    const livres = new Set(doClube.filter(m => !m.usadaEm && !m.presa).map(chaveCarta)).size
    const usadas = doClube.filter(m => !!m.usadaEm).length
    const total = doBaralho.size
    return { colecao, livres, total, recebidas: Math.floor(usadas / total), pronta: livres >= total }
  })
}

/** ordem da tela: prontas primeiro, depois quem está mais perto de fechar (em %), depois quem paga mais */
export function ordenaProgresso(lista: Progresso[]): Progresso[] {
  return [...lista].sort((a, b) => Number(b.pronta) - Number(a.pronta) || b.livres / b.total - a.livres / a.total || b.colecao.premio - a.colecao.premio || a.colecao.clube.localeCompare(b.colecao.clube))
}

/** as cópias que vão ser usadas: UMA de cada carta do clube. Se a pessoa tem repetida, vai a mais
 *  antiga na lista — tanto faz, todas as cópias da mesma carta são iguais. null = ainda não fecha. */
export function escolheCopias(minhas: MinhaCarta[], colecao: Colecao): string[] | null {
  const porChave = new Map<string, MinhaCarta>()
  for (const m of minhas) {
    if (m.usadaEm || m.presa) continue
    const k = chaveCarta(m); if (!porChave.has(k)) porChave.set(k, m)
  }
  const ids: string[] = []
  for (const c of colecao.cartas) { const m = porChave.get(chaveCarta(c)); if (!m) return null; ids.push(m.id) }
  return ids
}

/** 🆕 coleções que este aparelho ainda não tinha visto (clube que acabou de chegar a 11 cartas) */
const VISTAS_KEY = 'esc-colecoes-vistas'
export function colecoesNovas(colecoes: Colecao[] = COLECOES): Set<string> {
  let vistas: string[] | null = null
  try { const r = localStorage.getItem(VISTAS_KEY); vistas = r ? JSON.parse(r) as string[] : null } catch { /* ignora */ }
  const agora = colecoes.map(c => c.clube)
  try { localStorage.setItem(VISTAS_KEY, JSON.stringify(agora)) } catch { /* ignora */ }
  if (!vistas) return new Set() // 1ª vez neste aparelho: nada é "novo", é tudo
  const antes = new Set(vistas)
  return new Set(agora.filter(c => !antes.has(c)))
}
