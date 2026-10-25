import { STADIUM_SECTORS, type StadiumSave } from './estadiodata'
import { carteiraDaCarreira, podeAlterarPresidencia, type PresidenteBaseSave } from './presidencia-carreira'
import type { CarreiraComEstadio } from './presidencia-estadio-integrado'
import { conquistasDaCarreira, type ConquistasCarreira } from './presidencia-conquistas'
import type { PresidenciaCarteira } from './presidencia-economia'
import type { IdentidadePresidencia } from './presidencia-identidade-conta'
import type { EstadoPartidaEstadio } from './presidencia-partida-model'
import type { DiaEstadio } from './presidencia-estadio-publico'
import { estadioVisualValido } from './presidencia-estadio-validacao'
import { presidenteCadastrado } from './presidencia-entrada-model'
import { camadasDoPresidente, copiarAparencia } from './presidente-aparencia'
import { podeSentarPresidente, type PresidentePose } from './presidente-pose'
import { jornadaDoComplexo, type AgendaJogoComplexo, type FaseJornadaComplexo, type JornadaComplexo } from './presidencia-complexo-jornada'

/** Actual career values supplied by the existing screen. An absent day does
 * not become a sample fanbase. Match phase comes from the shared match only. */
export type DiaCarreiraComplexo = { division: string; support: number; rain?: boolean }
export type EntradaCarreiraComplexo = {
  /** The existing caller's gate. This boolean never authenticates an account. */
  enabled: boolean
  state: CarreiraComEstadio & ConquistasCarreira
  mgrId: number
  day?: DiaCarreiraComplexo
  match?: EstadoPartidaEstadio | null
  /** Optional calendar position supplied by the competition, never inferred
   * from a save's season/round, device date or opaque match id. */
  agenda?: AgendaJogoComplexo
  /** Explicit local pregame/postgame phase when no match snapshot exists. */
  journeyPhase?: FaseJornadaComplexo
  /** Supplied by identidadeDaConta in the existing account caller, not a save. */
  identity?: IdentidadePresidencia
  /** The competition caller must identify the opponent explicitly. The current
   * match context has no awayClubId; names and colours cannot establish one. */
  away?: { matchId: string; mgrId: number; day: DiaCarreiraComplexo }
  english?: boolean
}
export type PropsComplexoCarreira = {
  stadium?: StadiumSave
  presidency: PresidenciaCarteira | null
  match?: EstadoPartidaEstadio
  day?: DiaEstadio
  awayStadium?: StadiumSave
  awayDay?: DiaEstadio
  journey?: JornadaComplexo
  /** 🚌 jogo FORA de casa: o estádio é o do adversário e a cidade fica mais vazia */
  fora?: boolean
  circulation: boolean
  qaPopulation: false
}
export type SalaComplexoCarreira = {
  status: 'missing' | 'invalid' | 'ready'
  president?: PresidenteBaseSave
  layerIds: string[]
  pose: PresidentePose
  identity?: IdentidadePresidencia
  trophies: ReturnType<typeof conquistasDaCarreira>
  hasShelf: boolean
  hasDesk: boolean
  hasFrame: boolean
  /** Existing layered portrait remains intact; no generic 3D replacement. */
  physicalPresident: false
}

function diaConferido(day: DiaCarreiraComplexo | undefined, match?: EstadoPartidaEstadio): DiaEstadio | undefined {
  if (!day || !['V', 'D', 'C', 'B', 'A'].includes(day.division)
    || !Number.isFinite(day.support) || day.support < 0 || day.support > 100
    || (day.rain !== undefined && typeof day.rain !== 'boolean')) return undefined
  return { division: day.division, support: day.support,
    ...(day.rain === undefined ? {} : { rain: day.rain }),
    // Same classification as DiaDoEstadio; camera and furniture never start a clock.
    match: match ? match.paused && match.minute >= 45 ? 'interval' : 'playing' : 'idle' }
}

/** Read-only bridge, exercised by a local fixture before any career UI switch.
 * It preserves the existing gate, economy, layered president and shared match.
 * It neither imports Auth nor fetches, dispatches, persists or grants anything. */
export function adaptarCarreiraAoComplexo(input: EntradaCarreiraComplexo): { complexo: PropsComplexoCarreira; sala: SalaComplexoCarreira } | null {
  if (!input || input.enabled !== true || !input.state || !Array.isArray(input.state.managers)
    || !Number.isSafeInteger(input.mgrId) || input.mgrId < 0 || !podeAlterarPresidencia(input.state, input.mgrId)) return null
  const { state, mgrId } = input
  const stadium = state.stadiums?.[mgrId]
  const wallet = carteiraDaCarreira(state, mgrId), owned = new Set(wallet?.owned.map(item => item.id) ?? [])
  // Do not copy a new clock or infer a match from the club's name/colour.
  const incoming = input.match
  // 🚌 25/10 (Diego: "não consigo ver o jogo pelo mapa"): o jogo FORA de casa também roda no campo do mapa
  const match = (incoming?.context?.homeClubId === mgrId || incoming?.context?.awayClubId === mgrId) && !incoming.finished
    && typeof incoming.context.id === 'string' && incoming.context.id.length > 0
    && Number.isFinite(incoming.minute) ? incoming : undefined
  const day = diaConferido(input.day, match)
  const incomingIdentified = !!incoming?.context && typeof incoming.context.id === 'string' && incoming.context.id.length > 0
    && Number.isSafeInteger(incoming.context.homeClubId) && incoming.context.homeClubId! >= 0 && Number.isFinite(incoming.minute)
  const scheduled = input.agenda ? jornadaDoComplexo({agenda: input.agenda,
    match: incomingIdentified ? incoming : undefined,
    stadiumClubId: mgrId, phase: incoming && !incomingIdentified ? 'idle' : input.journeyPhase}) : undefined
  const journey = scheduled?.calendarKnown ? scheduled : undefined
  // Keep the legacy bridge's shape when no calendar was supplied. A confirmed
  // calendar can distinguish a true interval from pausing later in the match.
  if (day && journey) day.match = journey.phase === 'playing' || journey.phase === 'interval' ? journey.phase : 'idle'
  const complexo: PropsComplexoCarreira = {
    ...(stadium === undefined ? {} : { stadium: structuredClone(stadium) }),
    presidency: wallet, ...(match ? { match } : {}), ...(day ? { day } : {}),
    ...(journey ? {journey} : {}),
    circulation: !!day && (stadium === undefined || estadioVisualValido(stadium)), qaPopulation: false,
  }
  const away = input.away
  // A confirmed final whistle stops the field presentation, but does not erase
  // the identified visiting supporters halfway through their journey home.
  const crowdMatch = match ?? (journey?.hosting && journey.phase === 'departure' && incomingIdentified ? incoming : undefined)
  const crowdFixtureId = crowdMatch?.context.id ?? (journey?.hosting && journey.phase === 'arrival' ? journey.fixtureId : undefined)
  if (day && crowdFixtureId && away && away.matchId === crowdFixtureId
    && Number.isSafeInteger(away.mgrId) && away.mgrId >= 0 && away.mgrId !== mgrId
    && state.managers.some(manager => manager.id === away.mgrId)) {
    const awayStadium = state.stadiums?.[away.mgrId], awayDay = diaConferido(away.day, crowdMatch)
    if (awayDay && journey) awayDay.match = day.match
    if (awayDay && estadioVisualValido(awayStadium)) {
      complexo.awayStadium = structuredClone(awayStadium); complexo.awayDay = awayDay
    }
  }
  // 🚌 25/10 (Diego: "jogo fora de casa deixe o estádio como o estádio do jogo e minha torcida menor… mas mantenha o mapa da cidade
  // o mesmo… dia de fora de casa vai tá tudo mais vazio"): a cidade continua a sua; no lugar do seu estádio entra o do DONO DA CASA
  // (o save dele se for clube de gente; bot não tem estádio, então entra o estádio padrão da divisão); a arquibancada é da torcida
  // dele e a SUA vem num canto, menor, pela sua torcida de verdade (`day.support`); e as ruas ficam mais vazias.
  const hostId = match?.context.homeClubId
  if (match && hostId !== undefined && hostId !== mgrId && input.day) {
    const own = estadioVisualValido(stadium) ? stadium : estadioPadraoDaDivisao(input.day.division)
    const hostSave = state.stadiums?.[hostId]
    const fase = match.paused && match.minute >= 45 ? 'interval' as const : 'playing' as const
    complexo.stadium = structuredClone(estadioVisualValido(hostSave) ? hostSave : estadioPadraoDaDivisao(input.day.division))
    complexo.day = { division: input.day.division, support: 62, ...(input.day.rain === undefined ? {} : { rain: input.day.rain }), match: fase }
    complexo.awayStadium = structuredClone(own)
    complexo.awayDay = { division: input.day.division, support: Math.round(input.day.support * 0.45), ...(input.day.rain === undefined ? {} : { rain: input.day.rain }), match: fase }
    complexo.journey = jornadaDoComplexo({ agenda: match.context.agenda, match, stadiumClubId: hostId })
    complexo.circulation = true
    complexo.fora = true
  }
  const saved = state.careerPresidentBase
  const president: PresidenteBaseSave | undefined = presidenteCadastrado(saved)
    ? { ...saved, ...(saved.appearance ? { appearance: copiarAparencia(saved.appearance) } : {}) } : undefined
  const sala: SalaComplexoCarreira = {
    status: president ? 'ready' : saved === undefined ? 'missing' : 'invalid',
    ...(president ? { president } : {}), layerIds: president ? camadasDoPresidente(president) : [],
    pose: president && podeSentarPresidente(president.outfit, wallet?.owned ?? []) ? 'seated' : 'standing',
    ...(input.identity ? { identity: { ...input.identity } } : {}),
    trophies: conquistasDaCarreira(state, mgrId, !!input.english),
    hasShelf: owned.has('estante-simples') || owned.has('estante-madeira'),
    hasDesk: owned.has('mesa-simples') || owned.has('mesa-madeira'), hasFrame: owned.has('quadro'), physicalPresident: false,
  }
  return { complexo, sala }
}

/** 🏟️ Estádio do clube SEM save (bot): o padrão da divisão — Várzea com meia geral, e cada série sobe um degrau até a A
 * completa. Todo estádio tem o setor VISITANTE (é onde a sua torcida senta no jogo fora). */
export function estadioPadraoDaDivisao(division: string): StadiumSave {
  const nivel = ({ V: 0, D: 1, C: 2, B: 3, A: 4 } as Record<string, number>)[division] ?? 1
  const cheio = (k: string, pct = 1) => [k, Math.round((STADIUM_SECTORS.find(s => s.k === k)?.cost ?? 0) * pct)] as const
  const inv = Object.fromEntries([cheio('grama'), cheio('geral', nivel ? 1 : .5), ...(nivel >= 2 ? [cheio('cadeiras')] : []), cheio('visitante', [.3, .6, 1, 1, 1][nivel]), ...(nivel >= 4 ? [cheio('camarote')] : [])])
  const ext = [...(nivel >= 1 ? ['refl'] : []), ...(nivel >= 2 ? ['telao', 'loja'] : []), ...(nivel >= 3 ? ['estac', 'praca'] : []), ...(nivel >= 4 ? ['cober', 'estacao'] : [])]
  return { inv, ext }
}
