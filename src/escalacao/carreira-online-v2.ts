// 🌐 CARREIRA ONLINE v2 (19/10) — as GAVETAS dos clubes.
// Regra do Diego: *"tem que ser igual a carreira que temos hoje em tudo. Menos ter segundo clube"* e *"é um modo
// independente"*. O jeito escolhido: cada aparelho roda a CARREIRA SOLO do próprio clube (por isso tudo que a solo tem
// funciona, sem mexer na solo), e os outros clubes de gente chegam pelas gavetas. Pra placar, tabela e artilharia saírem
// IGUAIS em todo aparelho, o motor (`simulatePyramid`) tem que receber as MESMAS entradas — e as entradas de cada clube
// (tática, escalação, intervalo, pênalti, força do dia, gás dos jogadores, técnico) só existem no aparelho do dono dele.
// Este arquivo é a ponte: tira as entradas do MEU clube pra gaveta e mistura as dos OUTROS nas entradas do motor.
// Puro (sem React, sem banco). Trava: `npm run carreira-online`.
import type { RoundTactics, RoundLineups, RoundMods, RoundCardMods, RoundHalftime, RoundPenalty, SimTecnicos } from './pyramidseason'
import type { Manager } from './types'

/** Tudo que o motor precisa de UM clube de gente, rodada a rodada. Chaves = número da rodada (como na solo). */
export type EntradasSim = {
  tac?: RoundTactics[number]
  xi?: RoundLineups[number]
  ht?: RoundHalftime[number]
  pen?: RoundPenalty[number]
  mods?: RoundMods[number]
  card?: RoundCardMods[number]
  tec?: SimTecnicos[string]
}

/** A parte PÚBLICA da gaveta: o que os outros aparelhos precisam pra desenhar e simular o clube. */
export type GavetaPublica = {
  mgrId: number
  nome: string
  formation?: Manager['formation']
  formationView?: string
  squad: Manager['squad']
  entradas: EntradasSim
}

/** O que o aparelho já monta pra solo (os mesmos mapas que vão pro `simulatePyramid`). */
export type EntradasMundo = {
  tactics: RoundTactics
  lineups: RoundLineups
  halftime: RoundHalftime
  penalty: RoundPenalty
  mods: RoundMods
  cardMods: RoundCardMods
  tecs?: SimTecnicos
}

const temAlgo = (o: object | undefined): boolean => !!o && Object.keys(o).length > 0

/** Tira as entradas do MEU clube dos mapas da solo (o que vai pra minha gaveta). */
export function entradasDoClube(e: EntradasMundo, mgrId: number, nome: string): EntradasSim {
  const out: EntradasSim = {}
  if (temAlgo(e.tactics[mgrId])) out.tac = e.tactics[mgrId]
  if (temAlgo(e.lineups[mgrId])) out.xi = e.lineups[mgrId]
  if (temAlgo(e.halftime[mgrId])) out.ht = e.halftime[mgrId]
  if (temAlgo(e.penalty[mgrId])) out.pen = e.penalty[mgrId]
  if (temAlgo(e.mods[mgrId])) out.mods = e.mods[mgrId]
  if (temAlgo(e.cardMods[mgrId])) out.card = e.cardMods[mgrId]
  if (e.tecs?.[nome]) out.tec = e.tecs[nome]
  return out
}

/**
 * Mistura as entradas dos OUTROS clubes de gente nos mapas do motor. O MEU clube nunca é tocado (quem manda nele é o
 * meu aparelho). Clube remoto SEM uma entrada perde a que estiver no mapa local (o local não sabe nada dele: o que vale
 * é a gaveta). Devolve mapas NOVOS — os de entrada não mudam (vão de dependência de useMemo).
 */
export function mesclaEntradas(base: EntradasMundo, gavetas: readonly GavetaPublica[], meuId: number): EntradasMundo {
  const out: EntradasMundo = {
    tactics: { ...base.tactics }, lineups: { ...base.lineups }, halftime: { ...base.halftime }, penalty: { ...base.penalty },
    mods: { ...base.mods }, cardMods: { ...base.cardMods }, tecs: base.tecs ? { ...base.tecs } : undefined,
  }
  for (const g of gavetas) {
    if (g.mgrId === meuId) continue
    const e = g.entradas ?? {}
    const poe = <T,>(mapa: Record<number, T>, v: T | undefined) => { if (v && temAlgo(v as object)) mapa[g.mgrId] = v; else delete mapa[g.mgrId] }
    poe(out.tactics, e.tac); poe(out.lineups, e.xi); poe(out.halftime, e.ht); poe(out.penalty, e.pen); poe(out.mods, e.mods); poe(out.cardMods, e.card)
    if (e.tec) out.tecs = { ...(out.tecs ?? {}), [g.nome]: e.tec }
    else if (out.tecs && g.nome in out.tecs) { const t = { ...out.tecs }; delete t[g.nome]; out.tecs = Object.keys(t).length ? t : undefined }
  }
  return out
}

/**
 * Põe os clubes dos outros (elenco, formação, nome) dentro da lista de técnicos do MEU aparelho, na mesma ordem de
 * assento em todo aparelho. O meu clube fica como está (é o meu estado que manda nele).
 */
export function mesclaClubes(managers: readonly Manager[], gavetas: readonly GavetaPublica[], meuId: number): Manager[] {
  const porId = new Map(gavetas.map(g => [g.mgrId, g]))
  return managers.map(m => {
    if (m.id === meuId || !m.isHuman) return m
    const g = porId.get(m.id)
    if (!g) return m
    return { ...m, teamName: g.nome, squad: g.squad, formation: g.formation ?? m.formation, formationView: g.formationView }
  })
}

/** Gaveta pública do MEU clube, pronta pra subir. */
export function minhaGaveta(me: Manager, e: EntradasMundo): GavetaPublica {
  return { mgrId: me.id, nome: me.teamName, formation: me.formation, formationView: me.formationView, squad: me.squad, entradas: entradasDoClube(e, me.id, me.teamName) }
}
