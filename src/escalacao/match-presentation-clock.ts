import {createContext,useRef} from 'react'

/** Local presentation only: never changes results, RNG, seats or room state. */
export type MatchPresentationClock={key:string;duration:number;initialDuration:number;at:number;elapsed:number}
const durationOf=(value:number)=>Number.isFinite(value)?Math.max(400,value):400
export function createMatchPresentationClock(key:string,duration:number,at:number):MatchPresentationClock{
 const ms=durationOf(duration)
 return{key,duration:ms,initialDuration:ms,at,elapsed:0}
}
export function matchPresentationElapsed(clock:MatchPresentationClock,now=Date.now()){
 return Math.max(0,clock.elapsed+Math.max(0,now-clock.at))
}
export function retimeMatchPresentation(clock:MatchPresentationClock,duration:number,now=Date.now()){
 const next=durationOf(duration)
 if(next===clock.duration)return
 const elapsed=matchPresentationElapsed(clock,now),fraction=Math.min(1,elapsed/clock.duration)
 // Penalties/reading after the base period use wall time, not the new rate.
 clock.elapsed=fraction*next+Math.max(0,elapsed-clock.duration)
 clock.at=now;clock.duration=next
}
export function matchPresentationMinute(clock:MatchPresentationClock,now=Date.now()){
 return Math.min(93,Math.max(0,matchPresentationElapsed(clock,now)/(clock.duration*.82)*93))
}
export function matchPresentationRemaining(clock:MatchPresentationClock,fraction=1,extraMs=0,now=Date.now()){
 return Math.max(0,clock.duration*fraction+extraMs-matchPresentationElapsed(clock,now))
}
export const MatchPresentationClockContext=createContext<MatchPresentationClock|null>(null)
export function useMatchPresentationClock(key:string,duration:number,startedAt:number,enabled:boolean){
 const ref=useRef<MatchPresentationClock|null>(null)
 if(!ref.current||ref.current.key!==key)ref.current=createMatchPresentationClock(key,duration,startedAt)
 else retimeMatchPresentation(ref.current,duration)
 return enabled?ref.current:null
}
