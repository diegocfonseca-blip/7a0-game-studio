import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'

export type CopaClockRow={revision:number;step:number;running:boolean;manual:boolean;speed:number;started_at:string;updated_at:string;duration_ms:number;extra_ms:number}
export type CopaClockCommand='next'|'skip'|'finish'|'manual'|'auto'|'speed'
export type CopaClockController={row:CopaClockRow|null;now:number;isHost:boolean;busy:boolean;error:string;command:(cmd:CopaClockCommand,speed?:number)=>Promise<void>}

/** O banco carimba o início; leitura não avança a Copa nem recalcula resultados. */
export function clockMinute(row:CopaClockRow,now:number){
 return row.running?Math.max(0,Math.min(93,Math.round((now-Date.parse(row.started_at))/(row.duration_ms*.82)*93))):93
}
export function dueClockCommand(row:CopaClockRow,now:number):'finish'|'next'|null{
 if(row.running)return now>=Date.parse(row.started_at)+row.duration_ms+row.extra_ms?'finish':null
 return !row.manual&&row.step<12&&now>=Date.parse(row.updated_at)+(row.step===0?500:1600)?'next':null
}

export function useCopaClockPreview(enabled:boolean,roomId:string,edicao:number,seed:number,isHost:boolean,extraForStep:(step:number)=>number):CopaClockController|undefined{
 const [row,setRow]=useState<CopaClockRow|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now())
 const current=useRef<CopaClockRow|null>(null),offset=useRef(0),inFlight=useRef(false),generation=useRef(0),extra=useRef(extraForStep)
 extra.current=extraForStep
 const rpc=useCallback(async(cmd:'read'|'init'|CopaClockCommand,speed=1)=>{
  if(!enabled||inFlight.current)return
  if(cmd!=='read'&&!isHost)return
  const gen=generation.current
  inFlight.current=true
  if(cmd!=='read')setBusy(true)
  const sent=Date.now()
  try{
   const {data,error:failure}=await supabase.rpc('esc_copa_preview_clock',{p_room:roomId,p_edicao:edicao,p_seed:seed,p_command:cmd,p_revision:current.current?.revision??-1,p_speed:speed,p_extra:cmd==='next'?extra.current((current.current?.step??0)+1):0})
   if(gen!==generation.current)return
   if(failure)throw failure
   offset.current=Number(data.server_ms)-(sent+Date.now())/2
   const incoming=data.clock as CopaClockRow|null
   if(incoming&&(!current.current||incoming.revision>=current.current.revision)){current.current=incoming;setRow(incoming)}
   setNow(Date.now()+offset.current);setLoading(false);setError('')
  }catch{if(gen===generation.current)setError('Sem conexão com o relógio da sala. Aguardando reconectar…')}
  finally{if(gen===generation.current){inFlight.current=false;setBusy(false)}}
 },[enabled,roomId,edicao,seed,isHost])
 useEffect(()=>{
  generation.current++;current.current=null;setRow(null);setLoading(true);inFlight.current=false;setError('')
  if(!enabled)return
  void rpc(isHost?'init':'read')
  const poll=setInterval(()=>{void rpc(isHost&&!current.current?'init':'read')},2000)
  const refresh=()=>{void rpc('read')}
  window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh)
  return()=>{generation.current++;clearInterval(poll);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[enabled,rpc,isHost])
 useEffect(()=>{
  if(!enabled)return
  const timer=setInterval(()=>{
   const stamp=Date.now()+offset.current;setNow(stamp)
   const r=current.current
   if(!isHost||!r)return
   const cmd=dueClockCommand(r,stamp)
   if(cmd)void rpc(cmd)
  },250)
  return()=>clearInterval(timer)
 },[enabled,isHost,rpc])
 // Convidado de host público conserva o comportamento público (não há linha privada).
 if(!enabled||(!isHost&&!loading&&!row))return undefined
 return{row,now,isHost,busy,error,command:rpc}
}
