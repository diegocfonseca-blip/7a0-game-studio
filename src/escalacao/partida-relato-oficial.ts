import {novoMotor2,type EntradaM2} from './motor2/carreira'
import {DT,SEG_POR_MIN} from './motor2/motor'
import type {Evento} from './motor2/tipos'

export type GolRelato={home:boolean;name:string;min:number;assist?:string}
export type QuadroRelato={time:number;score:readonly number[];goalCount:number;eventCount:number;narration:string;narrationMinute:number;finished:boolean}
export type RelatoOficial={frames:readonly QuadroRelato[];events:readonly Evento[];goals:readonly GolRelato[];endMinute:number}
export const textoNarracaoOficial=(html:string)=>html.replace(/<\/?b>/g,'')
/** Read-only transcription of the SAME deterministic source used by Campo2D.
 * No independent chances, commentary RNG, decisions or persisted results. */
export function transcreverPartidaOficial(input:EntradaM2,en=false):RelatoOficial{
 const game=novoMotor2(structuredClone(input),en),frames:QuadroRelato[]=[]
 let narration='',narrationMinute=0,goalCount=0,eventCount=0
 const record=()=>{
  if(game.narra!==narration){narration=game.narra;narrationMinute=Math.min(93,Math.floor(game.t/SEG_POR_MIN)+1)}
  for(const ev of game.eventos.slice(eventCount))if(ev.tipo==='gol')goalCount++
  eventCount=game.eventos.length
  const old=frames.at(-1),text=textoNarracaoOficial(narration)
  if(!old||old.eventCount!==eventCount||old.narration!==text||old.finished!==game.fim)frames.push(Object.freeze({time:game.t,score:Object.freeze([...game.placar]),goalCount,eventCount,narration:text,narrationMinute,finished:game.fim}))
 }
 record()
 while(!game.fim&&game.t<120*SEG_POR_MIN){game.avancaAte((game.t+DT+1e-8)/SEG_POR_MIN);record()}
 const events=game.eventos.map(e=>Object.freeze({...e})),goals=events.filter(e=>e.tipo==='gol').map(e=>Object.freeze({home:e.lado===0,name:(e.a??'').replace(/ \(own goal\)$/,' (contra)'),min:Math.min(93,Math.floor(e.t/SEG_POR_MIN)+1),assist:e.b||undefined}))
 return Object.freeze({frames:Object.freeze(frames),events:Object.freeze(events),goals:Object.freeze(goals),endMinute:(events.find(e=>e.tipo==='fim')?.t??game.t)/SEG_POR_MIN})
}
/** Seeking/view changes only read an already transcribed event timeline. */
export function lerRelatoOficial(relato:RelatoOficial,minute:number):QuadroRelato{
 const time=Math.max(0,Number.isFinite(minute)?minute:0)*SEG_POR_MIN,frames=relato.frames
 let lo=0,hi=frames.length
 while(lo+1<hi){const mid=(lo+hi)>>1;if(frames[mid].time<=time)lo=mid;else hi=mid}
 return frames[lo]
}
