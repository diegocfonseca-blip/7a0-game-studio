// 🌐 CARREIRA ONLINE v2 (19/10) — as GAVETAS dos clubes.
// Regra do Diego: *"tem que ser igual a carreira que temos hoje em tudo. Menos ter segundo clube"* e *"é um modo
// independente"*. O jeito escolhido: cada aparelho roda a CARREIRA SOLO do próprio clube (por isso tudo que a solo tem
// funciona, sem mexer na solo), e os outros clubes de gente chegam pelas gavetas. Pra placar, tabela e artilharia saírem
// IGUAIS em todo aparelho, o motor (`simulatePyramid`) tem que receber as MESMAS entradas — e as entradas de cada clube
// (tática, escalação, intervalo, pênalti, força do dia, gás dos jogadores, técnico) só existem no aparelho do dono dele.
// Este arquivo é a ponte: tira as entradas do MEU clube pra gaveta e mistura as dos OUTROS nas entradas do motor.
// Puro (sem React, sem banco). Trava: `npm run carreira-online`.
import type { RoundTactics, RoundLineups, RoundMods, RoundCardMods, RoundHalftime, RoundPenalty, SimTecnicos } from './pyramidseason'
import type { Manager, EscState, WonCard, LedgerEntry, Card } from './types'
import { FORMATIONS } from './types'

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
  /** 🔄 26/11: o clube FECHOU a temporada (contratos decididos, caixa do fim). Só existe na virada. */
  fechamento?: Fechamento
  /** 🌍 27/11: a decisão dele na Copa do Mundo da temporada (seleção + XI, ou recusou) */
  copaMundo?: import('./co2-copa-mundo').Co2CopaEscolha
  /** 🌎 27/11: o clube que ele aceitou na Libertadores/Champions (e o XI), ou ficou sem clube */
  intl?: import('./co2-internacional').Co2IntlEscolha
  /** 🌍 27/11: o caixa (só pro desempate do ranking de clubes sair igual em todo aparelho) */
  caixa?: number
}

/**
 * 🔄 VIRADA (26/11): o que o aparelho de cada clube manda pro dono quando aperta "Fechar temporada". É o clube DEPOIS
 * das contas do fim (prêmios, bilheteria, folha, patrocínio — tudo calculado no aparelho dele, que é quem tem estádio,
 * Master, Agência) e das decisões da janela (renovar, deixar sair, pôr à venda). O dono põe isso no leilão de todos.
 */
export type Fechamento = {
  temporada: number
  caixa: number
  squad: WonCard[]
  listados: string[]
  soltar: string[]
  sondados: string[]
  /** 🕵️ 27/11: os ids dos TITULARES do clube (o sondar de amigo só pega reserva) */
  titulares?: string[]
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

/** 🔄 O fechamento do MEU clube (o aparelho manda junto com a gaveta). */
export function co2Fechamento(s: EscState): Fechamento | null {
  const me = s.managers[s.youIdx]
  if (!me || !s.co2) return null
  const minhas = new Set(me.squad.map(c => String(c.id)))
  return {
    titulares: [...titularesDoClube(me.squad, me.formation, s.careerLineup?.[me.id])],
    temporada: s.seasonNo ?? 1,
    caixa: s.careerCoins?.[me.id] ?? 0,
    squad: me.squad as WonCard[],
    listados: (s.reserveListed?.[me.id] ?? []).filter(id => minhas.has(String(id))),
    soltar: (s.contratoRelease ?? []).filter(id => minhas.has(String(id))),
    sondados: [...(s.aliciarJogadores ?? [])],
  }
}

/**
 * 🔄 O dono põe os fechamentos no estado dele ANTES de abrir o leilão de todos. Quem fechou entra com o elenco, o caixa,
 * a lista de venda e o "deixar sair" do aparelho dele. Quem NÃO fechou fica `fora`: não dá lance, não vende nada, e o
 * contrato vencido renova sozinho no leilão (regra do Diego: *"se não escolher, renova automático"*). Puro: devolve
 * os campos novos, quem chama aplica.
 */
export function aplicaFechamentos(s: EscState, fechamentos: Record<number, Fechamento | undefined>): Pick<EscState, 'managers' | 'careerCoins' | 'reserveListed' | 'contratoRelease' | 'aliciarJogadores'> & { fora: number[]; sondou: Record<string, number>; tit: Record<number, string[]> } {
  const meuId = s.managers[s.youIdx]?.id
  const temporada = s.seasonNo ?? 1
  const coins = { ...(s.careerCoins ?? {}) }
  const listed = { ...(s.reserveListed ?? {}) }
  const soltar = new Set(s.contratoRelease ?? [])
  const sondados = new Set(s.aliciarJogadores ?? [])
  const fora: number[] = []
  const sondou: Record<string, number> = {}
  const tit: Record<number, string[]> = {}
  if (meuId != null) {
    for (const id of s.aliciarJogadores ?? []) sondou[String(id)] = meuId
    const eu = s.managers.find(m => m.id === meuId)
    if (eu) tit[meuId] = [...titularesDoClube(eu.squad, eu.formation, s.careerLineup?.[meuId])]
  }
  const managers = s.managers.map(m => {
    if (!m.isHuman || m.id === meuId) return m
    const f = fechamentos[m.id]
    if (!f || f.temporada !== temporada || !Array.isArray(f.squad) || f.squad.length < 11) {
      fora.push(m.id)
      delete listed[m.id]
      for (const c of m.squad) soltar.delete(c.id)
      return m
    }
    const ids = new Set(f.squad.map(c => String(c.id)))
    coins[m.id] = Number.isFinite(f.caixa) ? f.caixa : (coins[m.id] ?? 0)
    listed[m.id] = (f.listados ?? []).filter(id => ids.has(String(id)))
    for (const id of f.soltar ?? []) if (ids.has(String(id))) soltar.add(id)
    for (const id of f.sondados ?? []) { sondados.add(id); if (sondou[String(id)] == null) sondou[String(id)] = m.id }
    tit[m.id] = f.titulares ?? [...titularesDoClube(f.squad, m.formation)]
    return { ...m, squad: f.squad.map(c => ({ ...c })) }
  })
  return { managers, careerCoins: coins, reserveListed: listed, contratoRelease: [...soltar], aliciarJogadores: [...sondados], fora, sondou, tit }
}

/**
 * 🔄 Campos que são de TODOS e vêm do leilão do dono. Todo o resto do meu estado (estádio, Agência, Master, Loja,
 * presidente, torcida, staff, cansaço, extrato, coleção…) fica como estava no MEU aparelho — o leilão não sabe nada
 * disso. A régua é "na dúvida, fica o meu": perder o estádio de alguém é pior que uma tela atrasada.
 */
const DO_LEILAO = [
  'cpuSquads', 'clubCash', 'marketValues', 'marketLog', 'marketSellers', 'careerMercado', 'careerTransferHistory', 'criaNews', 'criaNames',
  'reserveListed', 'reserveAuction', 'reserveListMesmo', 'contratoRelease', 'aliciarJogadores', 'aliciarFundo', 'careerTecnicos', 'tecLote',
  'screen', 'phase', 'deck', 'sectorIdx', 'surpriseId', 'mudoId', 'currentCards', 'revealQueue', 'resenha', 'revealIdx', 'stock', 'sectorCursor',
  'sectorUnsoldAccum', 'roundIdx', 'monte', 'monteOrder', 'monteIdx', 'submitted', 'pendingEnvelopes', 'tiebreaks', 'tiebreakIdx', 'tiebreakPending',
  'phaseDeadline', 'monteDeadline', 'cerimoniaDeadline', 'seasonNo', 'round', 'champion', 'simV',
] as const satisfies readonly (keyof EscState)[]

/**
 * 🔄 Junta o MEU estado de antes do leilão (`base`) com o estado do dono no fim do leilão (`cmd`). Do dono: os elencos
 * de todos, os bots, o mercado e a temporada. Do meu: tudo que é do meu clube. Caixa: o do dono pro meu clube (ele
 * partiu do caixa que o MEU aparelho fechou, e só somou o que eu comprei/vendi); extrato: o meu + as linhas do leilão
 * que o dono guardou pro meu clube.
 */
export function co2JuntaVirada(base: EscState, cmd: EscState, meuId: number, faltou = false): EscState {
  const out: EscState = { ...base }
  const o = out as unknown as Record<string, unknown>
  const c = cmd as unknown as Record<string, unknown>
  for (const k of DO_LEILAO) o[k] = c[k]
  const meuBase = base.managers.find(m => m.id === meuId)
  out.managers = cmd.managers.map(m => (m.id === meuId && meuBase ? { ...meuBase, squad: m.squad, money: m.money } : m))
  out.youIdx = Math.max(0, out.managers.findIndex(m => m.id === meuId))
  const linhas: LedgerEntry[] = cmd.careerLedgers?.[meuId] ?? []
  // quem FALTOU: o dono não tinha o caixa de fim de temporada dele — vale o caixa do próprio aparelho + o que o leilão
  // lançou pro clube (renovação automática). Quem fechou: o do dono, que já partiu do caixa que este aparelho mandou.
  const doLeilao = linhas.filter(e => e.season === (cmd.seasonNo ?? 1)).reduce((n, e) => n + e.amount, 0)
  const meuCaixa = faltou ? (base.careerCoins?.[meuId] ?? 0) + doLeilao : (cmd.careerCoins?.[meuId] ?? base.careerCoins?.[meuId] ?? 0)
  out.careerCoins = { ...(base.careerCoins ?? {}), [meuId]: meuCaixa }
  const ja = new Set((base.careerLedger ?? []).map(e => e.id))
  out.careerLedger = [...(base.careerLedger ?? []), ...linhas.filter(e => !ja.has(e.id))].slice(-250)
  out.careerLedgers = undefined
  out.isHost = true
  out.co2 = { ...(base.co2 ?? { sala: cmd.co2?.sala ?? '', gavetas: [] }), sala: cmd.co2?.sala ?? base.co2?.sala ?? '', assento: meuId, comanda: false, espelho: false, base: undefined, fora: undefined, gavetas: base.co2?.gavetas ?? [] }
  return out
}

/**
 * 🕵️ SONDAR DE AMIGO (Diego, 26/11: *"só reserva… titular protegido"*): os TITULARES de um clube de gente = a última escalação
 * que ele salvou (a mesma que vai na gaveta); sem escalação salva, os melhores da formação. A tela e o motor usam ESTA conta.
 */
export function titularesDoClube(squad: readonly Card[], formation: Manager['formation'] | undefined, xi?: Record<number, string[]>): Set<string> {
  let bestK = -1, ids: string[] | null = null
  for (const k in xi ?? {}) { const kn = +k; if (kn > bestK && Array.isArray(xi![kn])) { bestK = kn; ids = xi![kn] } }
  const tem = new Set(squad.map(c => String(c.id)))
  if (ids && ids.filter(id => tem.has(String(id))).length === 11) return new Set(ids.map(String))
  const need = FORMATIONS[formation ?? '4-3-3'] ?? FORMATIONS['4-3-3']
  const out = new Set<string>()
  for (const pos of Object.keys(need) as (keyof typeof need)[]) {
    const daPos = squad.filter(c => c.pos === pos && !c.fake).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
    for (const c of daPos.slice(0, need[pos])) out.add(String(c.id))
  }
  return out
}
