import type {EstadoPartidaEstadio} from './presidencia-partida-model'

export type FaseJornadaComplexo='idle'|'arrival'|'playing'|'interval'|'departure'
export type PeriodoJornadaComplexo='day'|'night'
/** A position in the game's calendar, never a date on the user's device. */
export type AgendaJogoComplexo={
 fixtureId:string
 seasonKey:string
 competition:string
 /** One-based matchday. A return leg occupies another matchday. */
 ordinal:number
 homeClubId?:number
}
type IdentidadeAgenda=Omit<AgendaJogoComplexo,'ordinal'>
type PartidaJornada=Pick<EstadoPartidaEstadio,'context'|'minute'|'paused'|'finished'>
export type EntradaJornadaComplexo={
 agenda?:AgendaJogoComplexo
 match?:PartidaJornada|null
 /** Club whose physical stadium is currently being displayed. */
 stadiumClubId?:number
 /** Explicit preview phase when there is no active match snapshot.
  * A live/finished match takes priority over a stale preview. */
 phase?:FaseJornadaComplexo
}
export type JornadaComplexo={
 key:string
 variantSeed:number
 fixtureId?:string
 ordinal?:number
 weekday?:'quarta'|'domingo'
 /** Scheduled local time in the game's calendar, never device time. */
 kickoffTime?:'21:00'|'16:00'
 period?:PeriodoJornadaComplexo
 calendarKnown:boolean
 hosting:boolean
 phase:FaseJornadaComplexo
}
const nonnegative=(value:number)=>Number.isSafeInteger(value)&&value>=0
const nonempty=(value:string)=>typeof value==='string'&&value.trim().length>0
const validAgenda=(agenda:AgendaJogoComplexo|undefined):agenda is AgendaJogoComplexo=>!!agenda
 &&nonempty(agenda.fixtureId)&&nonempty(agenda.seasonKey)&&nonempty(agenda.competition)
 &&nonnegative(agenda.ordinal)&&agenda.ordinal>0
 &&(agenda.homeClubId===undefined||(nonnegative(agenda.homeClubId)))

/** A separate visual seed. Does not consume or reseed the match simulator. */
function seedOf(key:string){
 let seed=2166136261
 for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),16777619)
 return seed>>>0
}

/** Read-only atmosphere for one fixture. Unknown schedules remain unknown;
 * neither an opaque match id nor elapsed real time can invent a weekday. */
export function jornadaDoComplexo(input:EntradaJornadaComplexo={}):JornadaComplexo{
 const agenda=validAgenda(input.agenda)?input.agenda:undefined
 const match=input.match
 const matchAgrees=!match||!agenda||(match.context.id===agenda.fixtureId
  &&(match.context.homeClubId===undefined||agenda.homeClubId===undefined||match.context.homeClubId===agenda.homeClubId))
 const homeClubId=match&&matchAgrees?match.context.homeClubId??agenda?.homeClubId:agenda?.homeClubId
 const hostAgrees=input.stadiumClubId===undefined||homeClubId===input.stadiumClubId
 const hosting=hostAgrees&&matchAgrees&&!!(agenda||match)
 const fixtureId=agenda?.fixtureId??match?.context.id
 const key=agenda?JSON.stringify([agenda.seasonKey,agenda.competition,agenda.fixtureId]):fixtureId?JSON.stringify(['unplaced',fixtureId]):'idle'
 let phase:FaseJornadaComplexo='idle'
 if(hosting){
  if(match){
   if(match.finished)phase='departure'
   // The current match source marks the real interval with paused + 45.
   // Pausing a replay elsewhere must not manufacture a half-time break.
   else if(match.paused&&match.minute===45)phase='interval'
   else phase='playing'
  }else phase=input.phase??'idle'
 }
 return {key,variantSeed:seedOf(key),fixtureId,ordinal:agenda?.ordinal,
  // 🗓️ 25/10 (Diego: "domingo é 16h dia de jogo e quarta 21h à noite"): o dia sai da COMPETIÇÃO, igual ao calendário da carreira —
  // liga sempre domingo 16h (de dia); Copa sempre quarta 21h (refletor). Antes saía do número da rodada e metade da liga virava noite.
  weekday:agenda?(agenda.competition==='league'?'domingo':'quarta'):undefined,
  kickoffTime:agenda?(agenda.competition==='league'?'16:00':'21:00'):undefined,
  period:agenda?(agenda.competition==='league'?'day':'night'):undefined,
  calendarKnown:!!agenda,hosting,phase}
}

/** League's existing round is already one-based and must not be incremented. */
export function agendaLigaComplexo(input:Omit<IdentidadeAgenda,'competition'>&{round:number}):AgendaJogoComplexo|undefined{
 const {round,...identity}=input,agenda={...identity,competition:'league',ordinal:round}
 return validAgenda(agenda)?agenda:undefined
}

/** Each phase's slot count comes from its actual legs, not phaseIndex * 2.
 * Zero means a genuinely empty calendar phase, not a bye for one club. Keep
 * simultaneous competitions in the same slots. The caller supplies a known
 * offset (for example the 38 league matchdays before Copa Legends).
 * Future phases are not read, so unknown future progression leaks nothing. */
export function agendaFasesComplexo(input:IdentidadeAgenda&{
 previousMatchdays:number
 phaseMatchdays:readonly number[]
 phaseIndex:number
 legIndex:number
}):AgendaJogoComplexo|undefined{
 const {previousMatchdays,phaseMatchdays,phaseIndex,legIndex,...identity}=input
 if(!nonnegative(previousMatchdays)||!nonnegative(phaseIndex)||!nonnegative(legIndex)||phaseIndex>=phaseMatchdays.length)return undefined
 let ordinal=previousMatchdays
 for(let i=0;i<=phaseIndex;i++){
  const days=phaseMatchdays[i]
  if(!nonnegative(days))return undefined
  if(i===phaseIndex){if(legIndex>=days)return undefined;ordinal+=legIndex+1}
  else ordinal+=days
  if(!Number.isSafeInteger(ordinal))return undefined
 }
 const agenda={...identity,ordinal}
 return validAgenda(agenda)?agenda:undefined
}

/** Structural adapters only inspect calendar lengths; no scores, winners,
 * player selection, saved state, wall-clock time or random source are read. */
export function diasDasFasesCopaComplexo(rounds:readonly {ties:readonly {legs:readonly unknown[]}[]}[]):number[]{
 return rounds.map(round=>round.ties.reduce((max,tie)=>Math.max(max,tie.legs.length),0))
}
type FaseInternacionalAgenda={matches:readonly unknown[];ties?:readonly {matches:readonly unknown[]}[]}
export function diasDasFasesInternacionaisComplexo(steps:readonly {
 libertadores?:FaseInternacionalAgenda
 champions?:FaseInternacionalAgenda
 mundial?:FaseInternacionalAgenda
}[]):number[]{
 return steps.map(step=>[step.libertadores,step.champions,step.mundial].reduce((max,phase)=>{
  if(!phase||!phase.matches.length)return max
  const legs=phase.ties?.reduce((n,tie)=>Math.max(n,tie.matches.length),0)??1
  return Math.max(max,legs)
 },0))
}
