import {useEffect,useRef,useState} from 'react'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {prepararReplayOficial} from './presidencia-replay-oficial'
export type FonteReplay3D={state:EstadoPartidaEstadio;goals:readonly {home:boolean;name:string;min:number}[];minuteMs:number}
/** Local presentation clock. No dispatch, save writes or career progression. */
export function useReplay3D(source:FonteReplay3D|undefined,enabled:boolean){
 const [control,setControl]=useState<{session:number;startedAt:number;offset:number;paused:boolean}|null>(null)
 const [frame,setFrame]=useState<EstadoPartidaEstadio|null>(null),[error,setError]=useState(false)
 const session=useRef(0),sourceRef=useRef(source);sourceRef.current=source
 const key=source?JSON.stringify([source.state.context.id,source.state.officialInput,source.goals,source.minuteMs]):''
 useEffect(()=>{setControl(null);setFrame(null);setError(false)},[key,enabled])
 useEffect(()=>{
  const replay=sourceRef.current
  if(!enabled||!control||!replay?.state.officialInput||!Number.isFinite(replay.minuteMs)||replay.minuteMs<=0){setFrame(null);return}
  const proof=prepararReplayOficial(replay.state.officialInput,replay.goals)
  if(!proof.valid){setFrame(null);setError(true);return}
  let timer:ReturnType<typeof setInterval>|undefined
  const update=()=>{
   const now=performance.now(),elapsed=Math.min(proof.endMinute*replay.minuteMs,control.offset+(control.paused?0:now-control.startedAt)),minute=elapsed/replay.minuteMs,finished=minute>=proof.endMinute
   setFrame({...replay.state,context:{...replay.state.context,id:replay.state.context.id+':review:'+control.session},minute,homeScore:proof.goals.filter(g=>g.home&&g.minute<=minute).length,awayScore:proof.goals.filter(g=>!g.home&&g.minute<=minute).length,officialMinuteMs:replay.minuteMs,paused:control.paused||finished,finished,visualClock:{seconds:elapsed/1000,sampledAt:now,running:!control.paused&&!finished,rate:1}})
   if(finished&&timer!==undefined)clearInterval(timer)
   return finished
  }
  if(!update()&&!control.paused)timer=setInterval(update,250)
  return()=>{if(timer!==undefined)clearInterval(timer)}
 },[control,key,enabled])
 function start(){
  const replay=sourceRef.current;if(!enabled||!replay)return
  if(!replay.state.officialInput||!Number.isFinite(replay.minuteMs)||replay.minuteMs<=0||!prepararReplayOficial(replay.state.officialInput,replay.goals).valid){setError(true);return}
  setError(false);setControl({session:++session.current,startedAt:performance.now(),offset:0,paused:false})
 }
 function pause(){if(frame?.finished)return;setControl(c=>{if(!c)return null;const now=performance.now();return {...c,offset:c.offset+(c.paused?0:now-c.startedAt),startedAt:now,paused:!c.paused}})}
 function stop(){setControl(null);setFrame(null)}
 return {frame:enabled?frame:null,active:enabled&&!!control,paused:!!control?.paused,error,start,pause,stop}
}
