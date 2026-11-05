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
import type { Card, FormationKey, Manager, Sector, WonCard } from './types'
import { SECTORS, FORMATIONS } from './types'

export const DRAFT_ESCOLHA_MS = 60_000
// 📋🏆 MINHA LIGA DRAFT (01/11, Diego): 45 s por vez, e o relógio só corre depois que a pessoa aperta ✋ PRONTO
export const DRAFT_ESCOLHA_MINHA_MS = 45_000
// 🐢 02/11 (Diego: *"tô achando o suspense muito rápido… um pouco mais devagar, com mais suspense"*): 2 s → 3 s por pista
export const DRAFT_PISTA_MS = 3_000
// ⏱️ o anúncio: 4 tempos de pista (0 · 3 · 6 · 9 s), a carta vira aos 12 s e fica na tela até os 18 s
export const DRAFT_VIRA_MS = 4 * DRAFT_PISTA_MS
export const DRAFT_REVELA_MS = DRAFT_VIRA_MS + 6_000

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
  // 'aguarda' = Minha Liga Draft: esperando o ✋ pronto de quem está na vez · 'prontos' = ✋ todo mundo antes de uma etapa (o dono
  // decide quando segue) · 'leilao' = envelope dos sondados/à venda · 'igualar' = quem sondou decide se iguala · 'escala' = 45 s
  fase: 'escolha' | 'revela' | 'aguarda' | 'prontos' | 'leilao' | 'revelaLeilao' | 'igualar' | 'escala'
  revelaIdx?: number // 🔨🎬 05/11: o lote sendo revelado (a revelação do envelope, com suspense, igual à das salas)
  prazo: number // relógio do dono (ms): fim da escolha ou fim do anúncio
  inicioRevela?: number // quando o anúncio começou (as pistas contam a partir daqui)
  picks: DraftPick[]
  pulados?: number[] // 📋🏆 Minha Liga Draft: quem perdeu a vez (o dono pulou ou o tempo acabou) — fica sem jogador do draft
  // ── 📋🏆 MINHA LIGA DRAFT (fase 2, 01/11) ──
  proxima?: 'draft' | 'leilao' // na fase 'prontos': o que vem depois que o dono seguir
  prontos?: number[] // ✋ quem já disse "estou pronto" nesta etapa
  premios?: Record<number, number> // 💰 moedas pela colocação da temporada que acabou (já caíram no caixa)
  sondagens?: { por: number; dono: number; cardId: string; nome: string }[] // 🕵️ quem sondou quem (a vez de quem sondou acabou)
  aVenda?: Record<number, string> // 🏷️ técnico → a carta que ele pôs à venda (1 por técnico)
  lotes?: LoteDraft[] // 🔨 o leilão dos sondados + à venda
  lances?: Record<number, Record<number, number>> // lote → técnico → lance (envelope: ninguém vê o do outro)
  igualarIdx?: number // o lote que está esperando quem sondou decidir se iguala
  inicioEscala?: number // quando a escalação começou (o relógio de 45 s é só guia: quem começa a temporada é o dono)
  somaTemporada?: boolean // true = draft aberto no fim da temporada (a próxima soma +1); false = veio da sala de espera (o número já é o da próxima)
}

// 🔨 um lote do leilão da Minha Liga Draft: o jogador sondado (ou posto à venda) de um técnico
export interface LoteDraft {
  dono: number
  sondador?: number // ausente = o próprio dono pôs à venda
  carta: WonCard // retrato da carta (o id é o do elenco do dono)
  piso: number // lance mínimo = o que o dono pagou (igual à carreira)
  vencedor?: number // decidido no martelo (= dono quando ninguém deu lance ou quando ele segurou)
  valor?: number
  igualar?: boolean // esperando quem sondou decidir se iguala
  igualou?: boolean
}

// ── 📋🏆 MINHA LIGA DRAFT — regras puras (01/11, fechadas com o Diego) ─────────
export const MLD_ELENCO_MAX = 22
export const MLD_DRAFT_VALOR = 10 // 🪙 jogador do draft chega valendo 10
export const MLD_ESCALA_MS = 45_000
export const MLD_LEILAO_MS = 60_000
export const MLD_IGUALAR_MS = 15_000
/** 💰 moedas pela colocação (só técnico de gente; o bot não tem caixa que importe). Tabela antiga — fica de reserva. */
export function premioColocacao(pos: number): number {
  return [40, 32, 26, 20, 16, 14, 12, 10, 8][pos] ?? 6
}
/** 💰 05/11 (Diego, *"pode fazer"*): o PADRÃO pelo tamanho da liga — 10 times ou 20. O 1º continua 40 (não mexe na economia) e o
 *  último nunca sai zerado. O criador da liga pode EDITAR (`draftPremios`); sem edição vale esta. `pos` começa em 0. */
export const PREMIOS_DRAFT_10 = [40, 32, 26, 22, 18, 16, 14, 12, 10, 8] as const
export const PREMIOS_DRAFT_20 = [40, 34, 30, 26, 23, 20, 18, 16, 14, 12, 10, 10, 10, 10, 10, 8, 8, 8, 8, 8] as const
export function premiosPadraoDraft(nTimes: number): number[] { return [...(nTimes <= 10 ? PREMIOS_DRAFT_10 : PREMIOS_DRAFT_20)] }
/** o prêmio que vale: o editado pelo dono (se tiver número válido nessa posição) ou o padrão do tamanho da liga */
export function premioDaLiga(pos: number, nTimes: number, editado?: number[] | null): number {
  const v = editado?.[pos]
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.min(999, Math.floor(v))
  const pad = premiosPadraoDraft(nTimes)
  return pad[pos] ?? pad[pad.length - 1]
}

/** 📜 REGRAS DA TURMA no draft (05/11, Diego: *"não pode contratar no draft jogador de categoria craque pra cima, ou só pode
 *  contratar jogador de times brasileiros, ou somente jogadores que não são lendas"*). O criador marca na hora de criar (e pode
 *  mudar na sala de espera). Vale pra escolha do draft de TODO MUNDO — gente e bot. A tela e o motor leem ESTA função. */
export type RegrasDraft = { semLendas?: boolean; semCraques?: boolean; soBrasil?: boolean }
let chavesBR: Set<string> | null = null
export function cartaPermitidaDraft(c: { name: string; club: string; year: number; fame: number }, r?: RegrasDraft | null): boolean {
  if (!r) return true
  if (r.semCraques && c.fame >= 4) return false // craque pra cima (craque e lenda)
  if (r.semLendas && c.fame >= 5) return false
  if (r.soBrasil) { chavesBR ??= new Set(todasAsCartas('br').map(chaveCarta)); if (!chavesBR.has(chaveCarta(c))) return false }
  return true
}
export function temRegraDraft(r?: RegrasDraft | null): boolean { return !!r && !!(r.semLendas || r.semCraques || r.soBrasil) }
/** 👕 os titulares são os PRIMEIROS de cada posição na ordem do elenco (o mesmo que o campinho desenha) */
export function xiPorOrdem<T extends Card>(squad: T[], formation: FormationKey): T[] {
  const need = FORMATIONS[formation] ?? FORMATIONS['4-3-3']
  const out: T[] = []
  for (const pos of SECTORS) out.push(...squad.filter(c => c.pos === pos).slice(0, need[pos]))
  return out
}
/** o elenco fecha a formação? (nenhuma posição com menos gente que o esquema pede) */
export function fechaFormacao(squad: Card[], formation: FormationKey): boolean {
  const need = FORMATIONS[formation] ?? FORMATIONS['4-3-3']
  return SECTORS.every(p => squad.filter(c => c.pos === p).length >= need[p])
}
/** elenco cheio (22): quem pode sair pra `nova` entrar sem o time ficar faltando gente em alguma posição */
export function podemSairMinha(squad: WonCard[], nova: Card, formation: FormationKey): WonCard[] {
  return squad.filter(c => !c.emprestado && fechaFormacao([...squad.filter(x => x.id !== c.id), nova], formation))
}
/** o jogo tira sozinho: o RESERVA de menor valor (titular nunca), sem deixar posição faltando */
export function reservaMaisBarata(squad: WonCard[], nova: Card, formation: FormationKey): WonCard | undefined {
  const xi = new Set(xiPorOrdem(squad, formation).map(c => c.id))
  const ok = podemSairMinha(squad, nova, formation)
  const ord = (a: WonCard, b: WonCard) => (a.paid ?? 0) - (b.paid ?? 0) || forca(a) - forca(b)
  return ok.filter(c => !xi.has(c.id)).sort(ord)[0] ?? ok.sort(ord)[0]
}
// 🤖 SOBRA VAI PRO BOT (05/11, Diego): *"cada bot poderia pegar um jogador do leilão que ninguém quis de graça… o que o usuário
// remove pra entrar o do draft poderia ir pro bot… cada hora é a vez de um bot em sequência… bot também teria 22… sempre o
// melhor 11… o usuário não ganha dinheiro"*. Regra pura: QUEM recebe e o que sai do bot. Com vaga (menos de 22) o bot da vez
// recebe; todos cheios → o bot da vez troca pelo PIOR da MESMA posição se o novo for melhor (*"pode melhorar os reservas"*) e o
// pior volta a ficar livre; se não for melhor, o jogador fica livre (pode ser escolhido no draft). Ninguém passa de 22.
export function botDaSobra(bots: Manager[], vez: number, nova: Card): { bot: Manager; aceita: boolean; sai?: WonCard; proxVez: number } | null {
  const n = bots.length
  if (!n) return null
  const v0 = ((vez % n) + n) % n
  for (let k = 0; k < n; k++) {
    const i = (v0 + k) % n
    if (bots[i].squad.length < MLD_ELENCO_MAX) return { bot: bots[i], aceita: true, proxVez: (i + 1) % n }
  }
  const b = bots[v0]
  const pior = b.squad.filter(c => c.pos === nova.pos && !c.emprestado).sort((a, c) => forca(a) - forca(c))[0]
  const aceita = !!pior && forca(nova) > forca(pior)
  return { bot: b, aceita, ...(aceita ? { sai: pior } : {}), proxVez: (v0 + 1) % n }
}
/** o bot sempre escala os melhores: em cada posição, do mais forte pro mais fraco (o XI é o começo de cada posição) */
export function ordenaBotPelaForca<T extends Card>(squad: T[]): T[] {
  return [...squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos) || forca(b) - forca(a))
}

// 🔒 "CONTRATO" DA LIGA DRAFT (02/11, Diego: *"opção B e bote cadeado avisando tipo contrato"*): um jogador só pode ser SONDADO
// depois de 3 temporadas completas no time do amigo. Quem chegou na temporada S fica travado até o draft do fim da temporada S+2.
export const MLD_SONDAR_TEMPORADAS = 3
/** quantas temporadas a carta já jogou neste time, contando a que acabou de terminar */
export function temporadasNoTime(c: { mldDesde?: number }, temporadaQueAcabou: number): number {
  return Math.max(0, temporadaQueAcabou - (c.mldDesde ?? 1) + 1)
}
/** o draft (fim de qual temporada) em que ela fica livre pra sondar */
export function sondavelNoDraftDa(c: { mldDesde?: number }): number {
  return (c.mldDesde ?? 1) + MLD_SONDAR_TEMPORADAS - 1
}
export function podeSondarCarta(c: { mldDesde?: number }, temporadaQueAcabou: number): boolean {
  return temporadasNoTime(c, temporadaQueAcabou) >= MLD_SONDAR_TEMPORADAS
}
/** dá pra sondar/pôr à venda esta carta? (carta de verdade, do elenco, sem ser empréstimo) */
export function podeIrProLeilao(m: Manager | undefined, cardId: string): WonCard | undefined {
  const c = m?.squad.find(x => x.id === cardId)
  return c && !c.fake && !c.emprestado ? c : undefined
}
/** 🔨 o martelo de um lote: maior lance; empate → dono, depois quem sondou, depois o menor número de assento. */
export function martelo(lote: LoteDraft, lances: Record<number, number> | undefined, caixa: (id: number) => number): { vencedor: number; valor: number } {
  const validos = Object.entries(lances ?? {}).map(([k, v]) => ({ id: +k, v: Math.floor(v) }))
    .filter(x => x.v >= lote.piso && x.v <= caixa(x.id))
  if (!validos.length) return { vencedor: lote.dono, valor: 0 }
  const peso = (id: number) => id === lote.dono ? 0 : id === lote.sondador ? 1 : 2
  validos.sort((a, b) => b.v - a.v || peso(a.id) - peso(b.id) || a.id - b.id)
  return { vencedor: validos[0].id, valor: validos[0].v }
}

// 🧳 A LIGA DRAFT ATRAVESSA O DIA (a turma joga hoje, volta amanhã): o lobby lê a partida anterior gravada na sala e
// manda os elencos de volta. Só vale se TODO MUNDO de agora já tinha time (e ninguém saiu) — senão a liga recomeça
// com o leilão fraco, que é o caminho seguro.
export interface DraftCarry {
  squads: Record<number, WonCard[]> // id do técnico NOVO → elenco que ele tinha
  caixa?: Record<number, number> // 📋🏆 Minha Liga Draft: o dinheiro de cada técnico atravessa o dia junto
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

// 🌎 o baralho do draft é o jogo INTEIRO (Brasil + Europa + Mundo), sem repetir a mesma carta.
// 🇧🇷🌍 02/11 (Diego: "no liga draft não apareceu pra escolher só BR ou só Europa"): a Liga Draft pode ser de um baralho só —
// aí o draft também só oferece aquele baralho. Sem baralho (ou 'both'/'todos') = o jogo inteiro, como sempre.
export type BaralhoDraft = 'br' | 'eu' | 'both' | 'todos' | undefined
const TODAS: Record<string, Card[]> = {}
export function todasAsCartas(deck?: BaralhoDraft): Card[] {
  const k = deck === 'br' || deck === 'eu' ? deck : 'todos'
  if (TODAS[k]) return TODAS[k]
  const fonte = k === 'br' ? CATALOG : k === 'eu' ? CATALOG_EU : CATALOG_BOTH
  const out: Card[] = []
  const vistas = new Set<string>()
  for (const pos of SECTORS) {
    for (const c of fonte[pos] ?? []) {
      const k = chaveCarta(c)
      if (vistas.has(k)) continue
      vistas.add(k)
      out.push({ ...c, pos, id: `dr:${k}` } as Card)
    }
  }
  TODAS[k] = out
  return out
}
export function acharCarta(chave: string, deck?: BaralhoDraft): Card | undefined {
  return todasAsCartas(deck).find(c => chaveCarta(c) === chave)
}
export function cartasLivres(ocupados: Set<string>, deck?: BaralhoDraft): Card[] {
  return todasAsCartas(deck).filter(c => !ocupados.has(chaveNome(c.name)))
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
  fixtures?: unknown[]; round?: number; seasonNo?: number; draftFeito?: number; draft?: DraftEstado | null
}
export function montaCarry(prev: PartidaGravada | undefined, uidsNovos: string[]): DraftCarry | undefined {
  const mgrs = prev?.managers, seat = prev?.seatUids
  if (!prev || !Array.isArray(mgrs) || !mgrs.length || !Array.isArray(seat)) return undefined
  const squads: Record<number, WonCard[]> = {}
  const caixa: Record<number, number> = {}
  const novoDoVelho: Record<number, number> = {}
  uidsNovos.forEach((uid, i) => {
    const k = seat.indexOf(uid)
    const m = k >= 0 ? mgrs.find(x => x.id === k && x.isHuman) : undefined
    if (m) { squads[i] = m.squad; novoDoVelho[m.id] = i; caixa[i] = m.money }
  })
  const bots = mgrs.filter(m => !m.isHuman).sort((a, b) => a.id - b.id)
  const nRodadas = Array.isArray(prev.fixtures) ? prev.fixtures.length : 0
  const acabou = nRodadas > 0 && (prev.round ?? 0) >= nRodadas
  let ordem: number[] | undefined
  if (acabou && prev.draftFeito !== prev.seasonNo && Array.isArray(prev.league)) {
    // mesma ordem da tabela do jogo (pontos → vitórias → saldo → gols pró → nome)
    const tab = [...prev.league].sort((a, b) => b.pts - a.pts || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name))
    ordem = tab.map(t => novoDoVelho[t.id]).filter((x): x is number => x != null)
    // 📋🏆 (01/11) o dono saiu NO MEIO do draft: a fila continua de onde parou — quem já escolheu (ou perdeu a vez) não
    // escolhe de novo, e quem estava na vez ganha a vez inteira de novo (o elenco gravado já tem as escolhas feitas).
    const d = prev.draft
    if (d && d.temporada === prev.seasonNo && Array.isArray(d.ordem) && d.idx < d.ordem.length && ['escolha', 'revela', 'aguarda'].includes(d.fase)) {
      const jaFoi = d.fase === 'revela' ? d.idx + 1 : d.idx
      ordem = d.ordem.slice(jaFoi).map(id => novoDoVelho[id]).filter((x): x is number => x != null)
    } else if (d && d.temporada === prev.seasonNo && (d.proxima === 'leilao' || ['leilao', 'revelaLeilao', 'igualar', 'escala'].includes(d.fase))) {
      ordem = [] // a fila do draft já tinha acabado (estava no leilão/escalação): ninguém escolhe de novo — segue pra temporada
    }
  }
  return { squads, caixa, bots, draftFeito: prev.draftFeito, ordem, temporada: prev.seasonNo }
}
