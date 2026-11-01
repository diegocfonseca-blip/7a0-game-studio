import {lerRelatoOficial} from './partida-relato-oficial'
import {getLang} from './lang'
import {useEffect,useRef,useState} from 'react'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {prepararReplayOficial} from './presidencia-replay-oficial'
import {periodoReplayCampo,minutoReplayCampo,reancorarReplayCampo,type AncoraReplayCampo} from './presidencia-replay-clock'
export type FonteReplay3D={state:EstadoPartidaEstadio;goals:readonly {home:boolean;name:string;min:number}[];minuteMs:number}
/** Local presentation clock. No dispatch, save writes or career progression. */
export function useReplay3D(source:FonteReplay3D|undefined,enabled:boolean){
 const [control,setControl]=useState<(AncoraReplayCampo&{session:number})|null>(null)
 const [frame,setFrame]=useState<EstadoPartidaEstadio|null>(null),[error,setError]=useState(false)
 const session=useRef(0),sourceRef=useRef(source);sourceRef.current=source
 const key=source?JSON.stringify([source.state.context.id,source.state.officialInput,source.goals]):''
 const minuteMs=source?periodoReplayCampo(source.minuteMs,source.state.context.speed??1):1000
 useEffect(()=>{setControl(null);setFrame(null);setError(false)},[key,enabled])
 useEffect(()=>{setControl(c=>c?reancorarReplayCampo(c,performance.now(),minuteMs):c)},[minuteMs])
 useEffect(()=>{
  const replay=sourceRef.current
  if(!enabled||!control||!replay?.state.officialInput||!Number.isFinite(replay.minuteMs)||replay.minuteMs<=0){setFrame(null);return}
  const proof=prepararReplayOficial(replay.state.officialInput,replay.goals,getLang()==='en')
  if(!proof.valid){setFrame(null);setError(true);return}
  let timer:ReturnType<typeof setInterval>|undefined
  const update=()=>{
   const now=performance.now(),minute=Math.min(proof.endMinute,minutoReplayCampo(control,now)),finished=minute>=proof.endMinute,elapsed=minute*control.minuteMs
   setFrame({...replay.state,officialNarration:lerRelatoOficial(proof.relato,minute).narration,context:{...replay.state.context,id:replay.state.context.id+':review:'+control.session},minute,homeScore:proof.goals.filter(g=>g.home&&g.minute<=minute).length,awayScore:proof.goals.filter(g=>!g.home&&g.minute<=minute).length,officialMinuteMs:control.minuteMs,paused:control.paused||finished,finished,visualClock:{seconds:elapsed/1000,sampledAt:now,running:!control.paused&&!finished,rate:1}})
   if(finished&&timer!==undefined)clearInterval(timer)
   return finished
  }
  if(!update()&&!control.paused)timer=setInterval(update,250)
  return()=>{if(timer!==undefined)clearInterval(timer)}
 },[control,key,enabled])
 function start(){
  const replay=sourceRef.current;if(!enabled||!replay)return
  if(!replay.state.officialInput||!Number.isFinite(replay.minuteMs)||replay.minuteMs<=0||!prepararReplayOficial(replay.state.officialInput,replay.goals,getLang()==='en').valid){setError(true);return}
  setError(false);setControl({session:++session.current,startedAt:performance.now(),offset:0,paused:false,minuteMs})
 }
 function pause(){if(frame?.finished)return;setControl(c=>c?{...reancorarReplayCampo(c,performance.now()),paused:!c.paused}:null)}
 function stop(){setControl(null);setFrame(null)}
 return {frame:enabled?frame:null,active:enabled&&!!control,paused:!!control?.paused,error,start,pause,stop}
}
