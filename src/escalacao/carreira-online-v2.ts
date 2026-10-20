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

/**
 * 🧊 O MEU clube também é CONGELADO na hora em que a rodada começa. Quem não apertou PRONTO a tempo pode ter mexido no
 * time depois da última gaveta subir — e os outros aparelhos só conhecem a gaveta. Então, pras rodadas até `ate`
 * (índice do jogo que começou), o meu aparelho usa a MINHA gaveta como ela estava no banco naquela hora; o que eu mexer
 * pra frente (chave > ate) continua valendo daqui. Assim os 20 aparelhos simulam com os MESMOS números.
 */
export function congelaMeu(base: EntradasMundo, minha: GavetaPublica | null | undefined, meuId: number, ate: number): EntradasMundo {
  if (!minha) return base
  const e = minha.entradas ?? {}
  const junta = <T,>(local: Record<number, T> | undefined, banco: Record<number, T> | undefined): Record<number, T> | undefined => {
    const out: Record<number, T> = {}
    for (const [k, v] of Object.entries(banco ?? {})) if (+k <= ate) out[+k] = v
    for (const [k, v] of Object.entries(local ?? {})) if (+k > ate) out[+k] = v
    return Object.keys(out).length ? out : undefined
  }
  const poe = <T,>(mapa: Record<number, Record<number, T>>, v: Record<number, T> | undefined): Record<number, Record<number, T>> => {
    const out = { ...mapa }
    if (v) out[meuId] = v; else delete out[meuId]
    return out
  }
  return {
    tactics: poe(base.tactics, junta(base.tactics[meuId], e.tac)),
    lineups: poe(base.lineups, junta(base.lineups[meuId], e.xi)),
    halftime: poe(base.halftime, junta(base.halftime[meuId], e.ht)),
    penalty: poe(base.penalty, junta(base.penalty[meuId], e.pen)),
    mods: poe(base.mods, junta(base.mods[meuId], e.mods)),
    cardMods: poe(base.cardMods, junta(base.cardMods[meuId], e.card)),
    tecs: (() => {
      const t = { ...(base.tecs ?? {}) }
      if (e.tec) t[minha.nome] = e.tec; else delete t[minha.nome]
      return Object.keys(t).length ? t : undefined
    })(),
  }
}
