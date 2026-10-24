import {useEffect,useRef,useState} from 'react'
import {RelogioCampo3D} from './presidencia-futebol-relogio'
import {lerRelatoOficial,type RelatoOficial,type QuadroRelato} from './partida-relato-oficial'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
/** Cinema reads the official timeline on the field clock, including the
 * precise time published by Campo2D when that view is mounted. */
export function useRelatoPartidaOficial(relato:RelatoOficial|null,options:{id:string;minute:number;minuteMs:number;paused:boolean;finished:boolean}){
 const current=useRef(options);current.current=options
 const [view,setView]=useState<{id:string;source:RelatoOficial;frame:QuadroRelato}|null>(null)
 useEffect(()=>{
  if(!relato){setView(null);return}
  const clock=new RelogioCampo3D();let anchorMinute=-1,anchorAt=performance.now(),last:QuadroRelato|undefined
  const update=()=>{
   const o=current.current,now=performance.now();if(o.minute!==anchorMinute){anchorMinute=o.minute;anchorAt=now}
   const state:EstadoPartidaEstadio={context:{id:o.id,home:[],away:[]},minute:o.minute,officialMinuteMs:o.minuteMs,paused:o.paused,finished:o.finished,homeScore:0,awayScore:0,homeColor:'',awayColor:'',visualClock:{seconds:0,sampledAt:anchorAt,running:!o.paused&&!o.finished}}
   const minute=o.finished&&o.minute>=93?Math.max(clock.sample(state,now),o.minute):clock.sample(state,now)
   const frame=lerRelatoOficial(relato,minute)
   if(frame!==last){last=frame;setView({id:o.id,source:relato,frame})}
  }
  update();const timer=setInterval(update,40);return()=>clearInterval(timer)
 },[relato,options.id])
 return relato?(view?.source===relato&&view.id===options.id?view.frame:lerRelatoOficial(relato,options.minute)):null
}
