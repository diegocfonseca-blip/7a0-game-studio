import {ajustarRelogioLance,tempoLance,type RelogioLance} from './presidencia-lance-tempo'

/** Both the renderer and score read `clock`. Only this callback confirms the
 * already-existing goal; zoom, camera visibility and FPS cannot confirm it. */
export function acompanharLance({clock,impactMs,tailMs=1000,settings,onProgress,onImpact,onEnd}:{
 clock:RelogioLance;impactMs:number;tailMs?:number;settings:()=>{rate:number;running:boolean};onProgress?:(elapsedMs:number)=>void;onImpact?:()=>void;onEnd:()=>void
}){
 let frame=0,cancelled=false,confirmed=false
 const tick=(now:number)=>{
  if(cancelled)return
  const current=settings()
  if(clock.rate!==current.rate||clock.running!==current.running)ajustarRelogioLance(clock,now,current.rate,current.running)
  const elapsed=tempoLance(clock,now)
  onProgress?.(elapsed)
  if(!confirmed&&elapsed>=impactMs){confirmed=true;onImpact?.()}
  if(elapsed>=impactMs+tailMs){onEnd();return}
  if(!cancelled)frame=requestAnimationFrame(tick)
 }
 frame=requestAnimationFrame(tick)
 return ()=>{cancelled=true;cancelAnimationFrame(frame)}
}
