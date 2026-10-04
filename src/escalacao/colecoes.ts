// 📚 COLEÇÕES DE CLUBES (04/10, regras fechadas com o Diego — mockup v2)
//
// · Coleção = 11 cartas DIFERENTES (nome+clube+ano) do mesmo clube. Só existe pra clube que tem
//   11+ cartas no baralho (BR + Europa + Mundo juntos, pelo nome do clube). Quando um clube chega a
//   11 cartas, a coleção NASCE sozinha — não tem lista escrita à mão.
// · Prêmio = metade da soma do valor de TODAS as cartas do clube no baralho:
//   👑 Lenda 5 · ⭐ Craque 3 · 💎 Promessa 2 · 🎯 Bom jogador 1 · 🪵 Foi profissional 0,5.
//   (Por dificuldade ele recusou — São Paulo em último; só por tamanho achou "muito pouco".)
// · Receber marca as 11 cartas como USADAS naquela carreira (banco: esc_cartas_usadas). Elas
//   continuam no álbum, mas não contam mais; fechar de novo pede 11 cartas livres (repetida vale).
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
export const CARTAS_POR_COLECAO = 11

export type Colecao = { clube: string; cartas: CartaBaralho[]; premio: number; contagem: Record<Categoria, number> }

/** as coleções que existem hoje (clube com 11+ cartas), da que mais paga pra que menos paga */
export function colecoesDoBaralho(baralho: CartaBaralho[] = BARALHO_TODO): Colecao[] {
  const porClube = new Map<string, CartaBaralho[]>()
  for (const c of baralho) { const l = porClube.get(c.club); if (l) l.push(c); else porClube.set(c.club, [c]) }
  const out: Colecao[] = []
  for (const [clube, cartas] of porClube) {
    if (cartas.length < CARTAS_POR_COLECAO) continue
    const contagem: Record<Categoria, number> = { lenda: 0, craque: 0, promessa: 0, bom: 0, prof: 0 }
    let soma = 0
    for (const c of cartas) { const k = categoriaDe(c); contagem[k]++; soma += VALOR_CATEGORIA[k] }
    out.push({ clube, cartas, premio: Math.max(1, Math.round(soma / 2)), contagem })
  }
  return out.sort((a, b) => b.premio - a.premio || a.clube.localeCompare(b.clube))
}
export const COLECOES: Colecao[] = colecoesDoBaralho()

/** uma carta do álbum da pessoa (uma LINHA de user_cards = uma cópia) */
export type MinhaCarta = { id: string; name: string; club: string; year: number; usadaEm?: string | null; presa?: boolean }

export type Progresso = {
  colecao: Colecao
  /** jogadores DIFERENTES do clube que a pessoa tem em cópia livre (não usada, não presa em troca) */
  livres: number
  /** quantas vezes já recebeu essa coleção (11 usadas = 1 vez) */
  recebidas: number
  pronta: boolean
}

export function progressoDas(minhas: MinhaCarta[], colecoes: Colecao[] = COLECOES): Progresso[] {
  const porClube = new Map<string, MinhaCarta[]>()
  for (const m of minhas) { const l = porClube.get(m.club); if (l) l.push(m); else porClube.set(m.club, [m]) }
  return colecoes.map(colecao => {
    const doClube = porClube.get(colecao.clube) ?? []
    const livres = new Set(doClube.filter(m => !m.usadaEm && !m.presa).map(chaveCarta)).size
    const usadas = doClube.filter(m => !!m.usadaEm).length
    return { colecao, livres: Math.min(livres, CARTAS_POR_COLECAO), recebidas: Math.floor(usadas / CARTAS_POR_COLECAO), pronta: livres >= CARTAS_POR_COLECAO }
  })
}

/** ordem da tela: prontas primeiro, depois quem está mais perto de fechar, depois quem paga mais */
export function ordenaProgresso(lista: Progresso[]): Progresso[] {
  return [...lista].sort((a, b) => Number(b.pronta) - Number(a.pronta) || b.livres - a.livres || b.colecao.premio - a.colecao.premio || a.colecao.clube.localeCompare(b.colecao.clube))
}

/** as 11 cópias que vão ser usadas: uma por jogador diferente. Prefere jogador de quem a pessoa tem
 *  MAIS cópias livres (a repetida vai primeiro) — assim sobra variedade pra fechar de novo. */
export function escolhe11(minhas: MinhaCarta[], clube: string): string[] | null {
  const porChave = new Map<string, MinhaCarta[]>()
  for (const m of minhas) {
    if (m.club !== clube || m.usadaEm || m.presa) continue
    const k = chaveCarta(m); const l = porChave.get(k); if (l) l.push(m); else porChave.set(k, [m])
  }
  if (porChave.size < CARTAS_POR_COLECAO) return null
  return [...porChave.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, CARTAS_POR_COLECAO)
    .map(([, copias]) => copias[0].id)
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
