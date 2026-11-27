// 🌍 CARREIRA ONLINE — A COPA DO MUNDO É UMA SÓ (27/11, regra principal do Diego: *"tudo é único… não existe dois campeões
// diferentes"*). Convite pela REGRA: o ranking de clubes (o mesmo em todo aparelho) dá a ordem; quem está mais alto escolhe
// primeiro, da SUA posição pra baixo; a seleção escolhida sai da lista dos de baixo (*"quem escolhe… o outro não pode mais"*).
// As 32 seleções e os jogos saem IGUAIS em todo aparelho: cada clube de gente com a seleção e o XI que ELE escolheu
// (vindo da gaveta), e os bots pegam o que sobrou, na ordem do ranking — igual à Copa da carreira solo.
// Puro (sem React, sem banco). Trava: `node scripts/carreira-online/testa-copa-mundo.mjs`.
import { countryPool, bestXI, formationFits, xiStrength, type Entrant, type Formation, type PoolCard } from './copa-mundo'

/** O que cada clube de gente decidiu na Copa da temporada (vai na gaveta pública). `pais: null` = recusou o convite. */
export type Co2CopaEscolha = { season: number; pais: string | null; xiKeys?: string[]; form?: Formation }

/** Uma vaga do top 32 do ranking (na ordem). `mgrId` só pra clube de gente. */
export type Co2CopaVaga = { name: string; mgrId: number | null }

const cardKey = (c: PoolCard) => `${c.name}|${c.club}|${c.year}`

/** Os clubes de gente que estão no top 32, na ordem do ranking (é a ordem de escolha). */
export function ordemDeEscolha(top: readonly Co2CopaVaga[]): number[] {
  return top.filter(v => v.mgrId != null).map(v => v.mgrId as number)
}

/**
 * De quem é a vez. Só escolhe quem está mais alto e ainda não decidiu; os de baixo esperam. Quem o DONO pulou (sumiu, não
 * respondeu) conta como "recusou". Devolve `null` quando todo mundo já decidiu — aí a Copa pode começar.
 */
export function vezDaCopa(top: readonly Co2CopaVaga[], escolhas: Readonly<Record<number, Co2CopaEscolha | undefined>>, pulados: readonly number[], season: number): number | null {
  for (const id of ordemDeEscolha(top)) {
    const e = escolhas[id]
    if (pulados.includes(id) || (e && e.season === season)) continue
    return id
  }
  return null
}

/** As seleções já levadas por clubes de gente nesta temporada. */
export function selecoesTomadas(escolhas: Readonly<Record<number, Co2CopaEscolha | undefined>>, season: number, menos?: number): Set<string> {
  const out = new Set<string>()
  for (const [id, e] of Object.entries(escolhas)) if (e && e.season === season && e.pais && Number(id) !== menos) out.add(e.pais)
  return out
}

/** Os convites do clube `mgrId`: TODAS as seleções que nenhum amigo levou (Diego 27/11: *"todos esses times te querem"* — quem está
 *  mais alto no ranking escolhe primeiro, e a escolhida sai da lista dos de baixo). */
export function convitesDaCopa(top: readonly Co2CopaVaga[], paises: readonly string[], mgrId: number, escolhas: Readonly<Record<number, Co2CopaEscolha | undefined>>, season: number): string[] {
  if (!top.some(v => v.mgrId === mgrId)) return []
  const tomadas = selecoesTomadas(escolhas, season, mgrId)
  return paises.filter(p => !tomadas.has(p))
}

/** Remonta o XI escolhido (pelas chaves nome|clube|ano) no elenco do país; buraco = o melhor livre da posição. */
export function xiDaEscolha(pais: string, keys: readonly string[] | undefined, form: Formation): PoolCard[] {
  const pool = countryPool(pais)
  if (!keys?.length) return bestXI(pool, formationFits(pool, form) ? form : '4-4-2')
  const all = Object.values(pool).flat()
  const porChave = new Map(all.map(c => [cardKey(c), c]))
  const xi = keys.map(k => porChave.get(k)).filter((c): c is PoolCard => !!c)
  if (xi.length === 11) return xi
  const usados = new Set(xi.map(cardKey))
  for (const c of [...all].sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi) || cardKey(a).localeCompare(cardKey(b)))) {
    if (xi.length >= 11) break
    if (!usados.has(cardKey(c))) { xi.push(c); usados.add(cardKey(c)) }
  }
  return xi
}

/**
 * As 32 seleções da Copa, IGUAIS em todo aparelho. Clube de gente que aceitou leva a seleção dele (marcado `humano`, e `you`
 * só no aparelho dele — o `you` é só desenho); quem recusou/foi pulado entra como os bots (pega o que sobrou). Os bots
 * escolhem na ordem do ranking, da posição deles pra baixo, sem repetir nenhuma seleção.
 */
export function entrantsDaCopa(top: readonly Co2CopaVaga[], paises: readonly string[], escolhas: Readonly<Record<number, Co2CopaEscolha | undefined>>, season: number, meuId: number | null, n = 32): Entrant[] {
  const vagas = top.slice(0, n)
  const tomadas = selecoesTomadas(escolhas, season)
  const taken = new Set<string>(tomadas)
  const list: Entrant[] = []
  vagas.forEach((v, i) => {
    const e = v.mgrId != null ? escolhas[v.mgrId] : undefined
    if (v.mgrId != null && e && e.season === season && e.pais) {
      const form = e.form ?? '4-3-3'
      const xi = xiDaEscolha(e.pais, e.xiKeys, form)
      list.push({ club: v.name, you: v.mgrId === meuId, humano: true, pais: e.pais, xi, str: xiStrength(xi), form })
      return
    }
    let pais = paises.slice(i).find(p => !taken.has(p)) ?? paises.find(p => !taken.has(p))
    if (!pais) pais = paises[i] ?? paises[0] ?? 'Brasil'
    taken.add(pais)
    const pool = countryPool(pais)
    const f: Formation = formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'
    const xi = bestXI(pool, f)
    list.push({ club: v.name, you: false, pais, xi, str: xiStrength(xi), form: f })
  })
  return list
}
