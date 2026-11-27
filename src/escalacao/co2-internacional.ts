// 🌎🌍🌐 CARREIRA ONLINE — LIBERTADORES, CHAMPIONS E MUNDIAL ÚNICOS (27/11, Diego: *"tudo é único… não existe dois campeões"* e
// *"que temporada 40 o quê… desde o início já, tem que liberar"*). Valem desde a T1 na carreira online.
// Convite pela REGRA de sempre (a da carreira solo): o G8 da Série A + o campeão da Copa do Brasil, na ordem da prioridade
// (campeão da A = 1, campeão da Copa = 2, depois 2º–8º). Cada clube de gente recebe 2 convites do bloco da sua posição e aceita
// UM; quem está mais alto escolhe primeiro e o clube aceito SAI da lista dos de baixo (*"quem escolhe… o outro não pode mais"*).
// Quando todo convidado decidiu, a MESMA campanha (72 clubes, 14 noites) nasce em todo aparelho, com os amigos nos clubes deles.
// Puro (sem React, sem banco). Trava: `node scripts/carreira-online/testa-internacional.mjs`.
import type { Card } from './types'

/** O que cada clube de gente decidiu na temporada internacional (vai na gaveta). `club: null` = ficou sem clube pra convocar. */
export type Co2IntlEscolha = { season: number; club: string | null; xi?: Card[] }
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

const decidiu = (e: Co2IntlEscolha | undefined, season: number) => !!e && e.season === season

/** De quem é a vez (o mais alto que ainda não decidiu e não foi pulado pelo dono). `null` = todos decidiram. */
export function vezDaIntl(fila: readonly Co2IntlVaga[], escolhas: Readonly<Record<number, Co2IntlEscolha | undefined>>, pulados: readonly number[], season: number): number | null {
  for (const v of filaIntl(fila)) {
    if (pulados.includes(v.mgrId) || decidiu(escolhas[v.mgrId], season)) continue
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
