import {activityRoute} from './activity-route.mjs';
export const STADIUM_DAY={gatesOpen:18,coaches:75,returnCoaches:120,cleanup:150,close:205};
const clamp=v=>Math.max(0,Math.min(1,v));
/** A local presentation clock follows official phases, never advances them.
 * Entering midmatch skips preparation. Repeated frames do not restart a phase. */
export function stadiumDayClock(){
 let key='',phase='idle',origin=0,phaseOrigin=0,last=0,joinedLate=false;
 function update(journey,time){
  time=Number.isFinite(time)?Math.max(0,time):last;
  if(journey?.hosting&&journey.phase!=='idle'){
   if(key!==journey.key||time<last){key=journey.key;phase=journey.phase;origin=phaseOrigin=time;joinedLate=phase!=='arrival'}
   else if(phase!==journey.phase){phase=journey.phase;phaseOrigin=time}
  }else if(phase!=='idle'&&phase!=='departure'){phase='departure';phaseOrigin=time}
  last=time;
  const elapsed=time-origin,phaseElapsed=time-phaseOrigin,departure=phase==='departure',interval=phase==='interval';
  const preparation=phase==='arrival'&&!joinedLate;
  const standFill=departure?1-clamp(phaseElapsed/100):preparation?clamp((elapsed-STADIUM_DAY.gatesOpen)/55):phase==='idle'?0:1;
  const setup=preparation?clamp(elapsed/18):1,pack=departure?clamp((phaseElapsed-STADIUM_DAY.cleanup)/28):0;
  return{key,phase,elapsed,phaseElapsed,phaseOrigin,joinedLate,active:phase!=='idle'&&(!departure||phaseElapsed<STADIUM_DAY.close),gatesOpen:!preparation||elapsed>=STADIUM_DAY.gatesOpen,setup,pack,standFill,trade:phase==='playing'?'quiet':interval?'interval':departure?'leaving':preparation?'pregame':'off',stage:departure?(pack>=1?'closing':pack>0?'packing':'departure'):interval?'interval':phase==='playing'?'playing':setup<1?'preparation':elapsed<STADIUM_DAY.coaches?'gates-open':'teams-arrival'};
 }
 return{update};
}

/** One coach slot includes travel, all eleven bodies clearing its doorway and
 * closing time. No departure while a boarding player is still outside. */
export function coachReturnSchedule({inbound,outbound,boarding,spacing=1.45}){
 const open=inbound+1.4,lastBoard=open+10*spacing+boarding,close=lastBoard+2,depart=close+1.4;
 return{open,lastBoard,close,depart,slot:depart+outbound+6,end:depart+outbound};
}

/** Light pregame jogging in independent lanes outside the touchline. Captured
 * walk/run clips supply the pose; only ground travel and turns are scheduled. */
export function warmupLane(origin){
 const target={...origin,z:35.6},out=activityRoute([origin,target],1.8),back=activityRoute([target,origin],1.8),turn=1.2,rest=2.5,period=out.duration+back.duration+2*turn+rest;
 return{period,at(time){const cycles=Math.floor(Math.max(0,time)/period),t=Math.max(0,time)%period,base=cycles*(out.length+back.length),smooth=u=>{u=clamp(u);return u*u*(3-2*u)};
  if(t<out.duration)return{...out.at(t),distance:base+out.at(t).distance,done:false};
  if(t<out.duration+turn)return{...out.at(out.duration),heading:Math.PI+Math.PI*smooth((t-out.duration)/turn),distance:base+out.length,speed:0,done:false};
  const local=t-out.duration-turn;if(local<back.duration)return{...back.at(local),distance:base+out.length+back.at(local).distance,done:false};
  return{...origin,heading:Math.PI*smooth((local-back.duration-rest)/turn),speed:0,distance:base+out.length+back.length,done:false};
 }};
}
