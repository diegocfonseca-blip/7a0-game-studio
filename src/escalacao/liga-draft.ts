// 📋 LIGA DRAFT (19/10, ideia do Diego — lembrança do PES 19 com os amigos na pandemia: *"não tinha dois Neymar, tinha só
// um Neymar pra todo mundo… o primeiro escolhia primeiro"*). Mockups aprovados: `scripts/mockups/draft.png`,
// `draft-anuncio.png`, `draft-criar.png`.
//
// As regras, todas DELE:
// · a 1ª temporada é o leilão de sempre, mas só com profissional e bom (todo mundo começa fraco);
// · entre uma temporada e outra, a NOITE DO DRAFT: cada técnico pega 1 jogador, de TODOS os jogadores do jogo;
// · a ordem é a da tabela — o CAMPEÃO escolhe primeiro;
// · cada jogador é ÚNICO na liga (um Neymar só, mesmo que ele tenha carta em dois clubes);
// · 60 s pra escolher (*"muito pouco tempo"* foram os 45 do 1º mockup);
// · o anúncio tem SUSPENSE (*"o suspense tem q ser grande"*): as pistas caem de 2 em 2 s e só no fim a carta vira —
//   e a carta é a REAL do jogo (*"igual lenda q tem avatar"*).
//
// Aqui só mora a regra pura (sem React, sem estado): quem decide é o reducer do dono (`store.tsx`, DRAFT_*), e a tela lê
// as MESMAS funções — regra de ouro contra botão mudo.
import { CATALOG, CATALOG_EU, CATALOG_BOTH, ehPromessa } from './data'
import { paisDe, type Baralho } from './paises'
import type { Card, Manager, Sector, WonCard } from './types'
import { SECTORS } from './types'

export const DRAFT_ESCOLHA_MS = 60_000
export const DRAFT_PISTA_MS = 2_000
// ⏱️ o anúncio: 4 tempos de pista (0 · 2 · 4 · 6 s), a carta vira aos 8 s e fica na tela até os 12 s
export const DRAFT_VIRA_MS = 4 * DRAFT_PISTA_MS
export const DRAFT_REVELA_MS = DRAFT_VIRA_MS + 4_000

export interface DraftPick {
  mgrId: number
  carta: Card
  saiu?: { id: string; name: string; club: string; year: number }
  auto?: boolean // o tempo acabou e o jogo escolheu
}
export interface DraftEstado {
  temporada: number // a temporada que ACABOU (o draft é a ponte pra próxima)
  ordem: number[] // ids dos técnicos humanos, campeão primeiro
  idx: number // de quem é a vez
  fase: 'escolha' | 'revela'
  prazo: number // relógio do dono (ms): fim da escolha ou fim do anúncio
  inicioRevela?: number // quando o anúncio começou (as pistas contam a partir daqui)
  picks: DraftPick[]
  somaTemporada?: boolean // true = draft aberto no fim da temporada (a próxima soma +1); false = veio da sala de espera (o número já é o da próxima)
}

// 🧳 A LIGA DRAFT ATRAVESSA O DIA (a turma joga hoje, volta amanhã): o lobby lê a partida anterior gravada na sala e
// manda os elencos de volta. Só vale se TODO MUNDO de agora já tinha time (e ninguém saiu) — senão a liga recomeça
// com o leilão fraco, que é o caminho seguro.
export interface DraftCarry {
  squads: Record<number, WonCard[]> // id do técnico NOVO → elenco que ele tinha
  bots: Manager[] // os bots da tabela, com os elencos deles (o jogador do bot também é único na liga)
  draftFeito?: number
  ordem?: number[] // draft pendente (a temporada acabou e o draft não rolou): ids novos, campeão primeiro
  temporada?: number
}

// ☝️ "um Neymar só": a régua é o NOME da pessoa, sem acento e sem caixa — a carta do Santos e a do Barça são o mesmo cara
export const chaveNome = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`

/** ordem da noite do draft: humanos na ordem da tabela final (campeão primeiro). */
export function ordemDoDraft(tabelaOrdenada: { id: number }[], humanos: number[]): number[] {
  const h = new Set(humanos)
  return tabelaOrdenada.map(t => t.id).filter(id => h.has(id))
}

/** todos os nomes que já têm dono na liga (humanos E bots — o bot também é dono do jogador dele). */
export function nomesOcupados(managers: { squad: Card[] }[]): Set<string> {
  const s = new Set<string>()
  for (const m of managers) for (const c of m.squad) if (!c.fake) s.add(chaveNome(c.name))
  return s
}

// 🌎 o baralho do draft é o jogo INTEIRO (Brasil + Europa + Mundo), sem repetir a mesma carta
let TODAS: Card[] | null = null
export function todasAsCartas(): Card[] {
  if (TODAS) return TODAS
  const out: Card[] = []
  const vistas = new Set<string>()
  for (const pos of SECTORS) {
    for (const c of CATALOG_BOTH[pos] ?? []) {
      const k = chaveCarta(c)
      if (vistas.has(k)) continue
      vistas.add(k)
      out.push({ ...c, pos, id: `dr:${k}` } as Card)
    }
  }
  TODAS = out
  return out
}
export function acharCarta(chave: string): Card | undefined {
  return todasAsCartas().find(c => chaveCarta(c) === chave)
}
export function cartasLivres(ocupados: Set<string>): Card[] {
  return todasAsCartas().filter(c => !ocupados.has(chaveNome(c.name)))
}

/** quem pode sair pra ele entrar: só alguém da MESMA posição (o time tem vaga fixa). */
export function podemSair(squad: Card[], pos: Sector): Card[] {
  return squad.filter(c => c.pos === pos && !(c as WonCard).emprestado)
}

// força de uma carta pra ordenar (categoria primeiro, depois o teto do nível)
const forca = (c: Card) => (c.fake ? -1 : c.fame) * 1000 + (c.hi ?? 0) * 2 + (c.lo ?? 0)
/** o mais fraco da posição sai primeiro (o incógnito, se houver, antes de todo mundo) */
export function maisFracoDa(squad: Card[], pos: Sector): Card | undefined {
  return [...podemSair(squad, pos)].sort((a, b) => forca(a) - forca(b))[0]
}
/** o tempo acabou: o jogo pega o MELHOR jogador livre e tira o mais fraco daquela posição. */
export function escolhaAutomatica(livres: Card[], squad: Card[]): { carta: Card; sai: Card } | null {
  const ord = [...livres].sort((a, b) => forca(b) - forca(a))
  for (const carta of ord) {
    const sai = maisFracoDa(squad, carta.pos)
    if (sai) return { carta, sai }
  }
  return null
}

// ── as pistas do anúncio ──────────────────────────────────────────────────────
export type Categoria = { pt: string; en: string; emoji: string; brilho: string }
export function categoriaDa(c: { name: string; club?: string; year?: number; fame: number; promessa?: boolean }): Categoria {
  if (ehPromessa(c)) return { pt: 'PROMESSA', en: 'PROSPECT', emoji: '💎', brilho: '#8B5CF6' }
  if (c.fame >= 5) return { pt: 'LENDA', en: 'LEGEND', emoji: '👑', brilho: '#FFC400' }
  if (c.fame === 4) return { pt: 'CRAQUE', en: 'STAR', emoji: '⭐', brilho: '#CBD4DE' }
  if (c.fame >= 2) return { pt: 'BOM JOGADOR', en: 'GOOD PLAYER', emoji: '🎯', brilho: '#2E9E5B' }
  return { pt: 'FOI PROFISSIONAL', en: 'EX-PRO', emoji: '🪵', brilho: '#CBBF9E' }
}
export function decadaDe(year: number): { pt: string; en: string } {
  const d = Math.floor(year / 10) * 10
  if (d >= 2000) return { pt: `anos ${d}`, en: `the ${d}s` }
  return { pt: `anos ${String(d).slice(2)}`, en: `the '${String(d).slice(2)}s` }
}
let BR_KEYS: Set<string> | null = null
let EU_KEYS: Set<string> | null = null
function baralhoDa(c: { name: string; club: string; year: number }): Baralho {
  if (!BR_KEYS) BR_KEYS = new Set(SECTORS.flatMap(p => (CATALOG[p] ?? []).map(chaveCarta)))
  if (!EU_KEYS) EU_KEYS = new Set(SECTORS.flatMap(p => (CATALOG_EU[p] ?? []).map(chaveCarta)))
  const k = chaveCarta(c)
  return BR_KEYS.has(k) ? 'BR' : EU_KEYS.has(k) ? 'EU' : 'WORLD'
}
export function paisDaCarta(c: { name: string; club: string; year: number }): string {
  return paisDe(c.name, baralhoDa(c), c.club, c.year)
}

// 🧳 a partida anterior (gravada na sala) → o que volta pra próxima largada. `uidsNovos[i]` é quem senta no assento i AGORA
// (a mesma lista que monta os técnicos no lobby). Assento antigo → conta pelo `seatUids` (índice = id do humano).
type PartidaGravada = {
  managers?: Manager[]; seatUids?: string[]; league?: { id: number; name: string; pts: number; w: number; gf: number; ga: number }[]
  fixtures?: unknown[]; round?: number; seasonNo?: number; draftFeito?: number
}
export function montaCarry(prev: PartidaGravada | undefined, uidsNovos: string[]): DraftCarry | undefined {
  const mgrs = prev?.managers, seat = prev?.seatUids
  if (!prev || !Array.isArray(mgrs) || !mgrs.length || !Array.isArray(seat)) return undefined
  const squads: Record<number, WonCard[]> = {}
  const novoDoVelho: Record<number, number> = {}
  uidsNovos.forEach((uid, i) => {
    const k = seat.indexOf(uid)
    const m = k >= 0 ? mgrs.find(x => x.id === k && x.isHuman) : undefined
    if (m) { squads[i] = m.squad; novoDoVelho[m.id] = i }
  })
  const bots = mgrs.filter(m => !m.isHuman).sort((a, b) => a.id - b.id)
  const nRodadas = Array.isArray(prev.fixtures) ? prev.fixtures.length : 0
  const acabou = nRodadas > 0 && (prev.round ?? 0) >= nRodadas
  let ordem: number[] | undefined
  if (acabou && prev.draftFeito !== prev.seasonNo && Array.isArray(prev.league)) {
    // mesma ordem da tabela do jogo (pontos → vitórias → saldo → gols pró → nome)
    const tab = [...prev.league].sort((a, b) => b.pts - a.pts || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name))
    ordem = tab.map(t => novoDoVelho[t.id]).filter((x): x is number => x != null)
  }
  return { squads, bots, draftFeito: prev.draftFeito, ordem, temporada: prev.seasonNo }
}
