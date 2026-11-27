// 🌎🌍🌐 CARREIRA ONLINE — LIBERTADORES, CHAMPIONS E MUNDIAL ÚNICOS (27/11, Diego: *"tudo é único… não existe dois campeões"* e
// *"que temporada 40 o quê… desde o início já, tem que liberar"*). Valem desde a T1 na carreira online.
// Convite pela REGRA de sempre (a da carreira solo): o G8 da Série A + o campeão da Copa do Brasil, na ordem da prioridade
// (campeão da A = 1, campeão da Copa = 2, depois 2º–8º). Cada clube de gente recebe 2 convites do bloco da sua posição e aceita
// UM; quem está mais alto escolhe primeiro e o clube aceito SAI da lista dos de baixo (*"quem escolhe… o outro não pode mais"*).
// Quando todo convidado decidiu, a MESMA campanha (72 clubes, 14 noites) nasce em todo aparelho, com os amigos nos clubes deles.
// Puro (sem React, sem banco). Trava: `node scripts/carreira-online/testa-internacional.mjs`.
import type { Card } from './types'
import { INTERNATIONAL_CLUBS, internationalClubCards, internationalCardKey, validInternationalXI } from './career-international'

/** O que cada clube de gente decidiu na temporada internacional (vai na gaveta). `club: null` = ficou sem clube pra convocar.
 *  Clube SEM `xi` = aceitou o convite e está convocando (o clube já sai da lista dos outros). */
export type Co2IntlEscolha = { season: number; club: string | null; xi?: Card[] }
/** ⏱️ 27/11 (Diego): na ⚡ Dinâmica, 60 s pra escolher o clube e 90 s pra convocar. Passou: o jogo dá o PIOR clube da lista e
 *  escala os PIORES — igual às salas online. Na 🧭 Livre não tem relógio; o "Pular" do dono faz o mesmo. */
export const INTL_PRAZO_ESCOLHA_S = 60
export const INTL_PRAZO_CONVOCA_S = 90
/** Um convidado (clube de gente no G8/Copa), na ordem da prioridade. */
export type Co2IntlVaga = { mgrId: number; priority: number; name: string }
/** O amigo como a campanha precisa dele. */
export type Co2IntlAmigo = { club: string; userTeam: string; userId: number; xi: Card[] }
/** Quem levou cada título (pro ranking de clubes sair igual em todo aparelho). `mgrId` só quando era clube de gente. */
export type Co2IntlTitulo = { club: string; mgrId: number | null }
export type Co2IntlHist = { season: number; lib: Co2IntlTitulo; champ: Co2IntlTitulo; mun: Co2IntlTitulo }

/** Os convidados de gente, na ordem de escolha (a prioridade da regra). */
export function filaIntl(vagas: readonly Co2IntlVaga[]): Co2IntlVaga[] {
  return [...vagas].sort((a, b) => a.priority - b.priority || a.mgrId - b.mgrId)
}

/** decidiu de vez: sem clube, ou clube + XI convocado */
export const decidiuIntl = (e: Co2IntlEscolha | undefined, season: number) => !!e && e.season === season && (e.club === null || e.xi?.length === 11)
const decidiu = decidiuIntl

/** De quem é a vez (o mais alto que ainda não decidiu e não foi pulado pelo dono). `null` = todos decidiram. */
export function vezDaIntl(fila: readonly Co2IntlVaga[], escolhas: Readonly<Record<number, Co2IntlEscolha | undefined>>, pulados: readonly number[], season: number): number | null {
  for (const v of filaIntl(fila)) {
    if (pulados.includes(v.mgrId) || decidiu(escolhas[v.mgrId], season)) continue // (pulado = quem o dono dava fora; desde 27/11 o dono/relógio dá o pior, que já vem como escolha)
    return v.mgrId
  }
  return null
}

/** Os clubes que outros clubes de gente já aceitaram nesta temporada. */
export function clubesTomados(escolhas: Readonly<Record<number, Co2IntlEscolha | undefined>>, season: number, menos?: number | null): string[] {
  const out = new Set<string>()
  for (const [id, e] of Object.entries(escolhas)) if (e && e.season === season && e.club && Number(id) !== menos) out.add(e.club)
  return [...out].sort()
}

/** Os amigos que vão pra campanha (todos que aceitaram, menos eu), na ordem do id — igual em todo aparelho. */
export function amigosDaIntl(escolhas: Readonly<Record<number, Co2IntlEscolha | undefined>>, season: number, meuId: number | null, nomeDe: (id: number) => string, pulados: readonly number[] = []): Co2IntlAmigo[] {
  const out: Co2IntlAmigo[] = []
  const vistos = new Set<string>()
  for (const id of Object.keys(escolhas).map(Number).sort((a, b) => a - b)) {
    const e = escolhas[id]
    if (id === meuId || pulados.includes(id) || !e || e.season !== season || !e.club || e.xi?.length !== 11 || vistos.has(e.club)) continue
    vistos.add(e.club)
    out.push({ club: e.club, userTeam: nomeDe(id), userId: id, xi: e.xi })
  }
  return out
}

/** Os títulos da campanha (o dono carimba no mundo). */
export function titulosDaIntl(c: { season: number; libertadoresChampion: string; championsChampion: string; mundialChampion: string; teams: readonly { id: string; teamId: number; humano?: boolean; you: boolean }[] }): Co2IntlHist {
  const quem = (club: string): Co2IntlTitulo => {
    const t = c.teams.find(x => x.id === club)
    return { club, mgrId: t && (t.humano || t.you) && t.teamId >= 0 ? t.teamId : null }
  }
  return { season: c.season, lib: quem(c.libertadoresChampion), champ: quem(c.championsChampion), mun: quem(c.mundialChampion) }
}

/** Títulos de um clube de gente, só das temporadas JÁ fechadas (a Copa do Mundo desta temporada usa o ranking sem mexer no meio). */
export function contaTitulosIntl(hist: readonly Co2IntlHist[] | undefined, mgrId: number, antesDe: number): { mundial_titles: number; libertadores_titles: number; champions_titles: number } {
  const out = { mundial_titles: 0, libertadores_titles: 0, champions_titles: 0 }
  const vistas = new Set<number>()
  for (const h of hist ?? []) {
    if (h.season >= antesDe || vistas.has(h.season)) continue
    vistas.add(h.season)
    if (h.lib.mgrId === mgrId) out.libertadores_titles++
    if (h.champ.mgrId === mgrId) out.champions_titles++
    if (h.mun.mgrId === mgrId) out.mundial_titles++
  }
  return out
}

const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const
const NEEDS: Record<'4-3-3' | '4-4-2', Record<typeof POS[number], number>> = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 } }
const media = (c: { lo: number; hi: number }) => (c.lo + c.hi) / 2
/** o XI do clube por formação: os MELHORES (`melhor`) ou os PIORES; `null` se o baralho não fecha a formação */
function xiDoClube(club: string, form: '4-3-3' | '4-4-2', melhor: boolean): Card[] | null {
  const cs = internationalClubCards(club)
  const out: Card[] = []
  for (const pos of POS) {
    const daPos = [...new Map(cs.filter(c => c.pos === pos).map(c => [internationalCardKey(c), c])).values()]
      .sort((a, b) => (melhor ? media(b) - media(a) : media(a) - media(b)) || internationalCardKey(a).localeCompare(internationalCardKey(b)))
    if (daPos.length < NEEDS[form][pos]) return null
    out.push(...(daPos.slice(0, NEEDS[form][pos]) as unknown as Card[]))
  }
  return validInternationalXI(out) ? out : null
}
/** ⭐ a força do clube (média do melhor time de lendas) — só pra ORDENAR; o número não aparece na tela */
export function forcaIntl(club: string): number {
  const xi = xiDoClube(club, '4-3-3', true) ?? xiDoClube(club, '4-4-2', true)
  return xi ? Math.round(xi.reduce((n, c) => n + media(c), 0) / xi.length) : 0
}
/** 🥴 os PIORES 11 do clube (o jogo escala quando a pessoa não convocou a tempo) */
export function piorXIIntl(club: string): Card[] | null {
  return xiDoClube(club, '4-3-3', false) ?? xiDoClube(club, '4-4-2', false)
}
/** 🥴 o PIOR clube da lista (Libertadores, livre, que fecha time) — o que a pessoa ganha quando não escolheu a tempo */
export function piorClubeLivre(tomados: readonly string[]): string | null {
  const livres = INTERNATIONAL_CLUBS.filter(c => c.competition === 'libertadores' && !tomados.includes(c.name) && piorXIIntl(c.name))
  livres.sort((a, b) => forcaIntl(a.name) - forcaIntl(b.name) || a.name.localeCompare(b.name))
  return livres[0]?.name ?? null
}
/** a escolha automática (relógio esgotado ou "Pular" do dono): o clube que ele reservou, ou o pior livre; e os piores 11 */
export function escolhaAutomatica(season: number, reservado: string | null | undefined, tomadosPorOutros: readonly string[]): Co2IntlEscolha {
  const club = reservado && piorXIIntl(reservado) ? reservado : piorClubeLivre(tomadosPorOutros)
  const xi = club ? piorXIIntl(club) : null
  return club && xi ? { season, club, xi } : { season, club: null }
}
