import {actionStillVisible} from './resilient-contact-clock.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};

/** Describe how to show an EXISTING official dribble. Never select a result,
 * create a touch, move the ball or substitute a feint for a running burst. */
export function selectDribblePresentation(event,{busy=false,owned=false,distance=Infinity,footGap=Infinity,height=Infinity,bodyPlan=false}={}){
 if(event.golpe==='arrancada')return{mode:'locomotion',clip:null,reason:'captured-running-burst'};
 if(busy)return{mode:'locomotion',clip:null,reason:'protected-foot-action'};
 if(!owned||height>.4)return{mode:'locomotion',clip:null,reason:'not-controlled-ground-ball'};
 if(event.golpe==='corpo')return bodyPlan?{mode:'body-feint',clip:null,reason:'captured-torso-over-locomotion'}:{mode:'locomotion',clip:null,reason:'no-free-body-window'};
 if(['giro','roleta','cruyff'].includes(event.golpe)){
  if(distance>.9||footGap>.12)return{mode:'locomotion',clip:null,reason:'ball-outside-captured-foot-reach'};
  return{mode:'captured-spin',clip:'giro',reason:'near-ground-ball'};
 }
 return{mode:'locomotion',clip:null,reason:'dedicated-technique-not-validated'};
}

export function prepareBodyFeints(events,actors,agenda){
 const plans=[],skipped=[];
 for(const e of events.filter(e=>e.tipo==='drible'&&e.golpe==='corpo')){
  const actor=actors.find(a=>a.side===(e.lado===0?'home':'away')&&JSON.parse(a.key)[1]===e.a);
  if(!actor)continue;
  const start=Math.max(0,e.t-.24),end=e.t+.30;
  const conflict=agenda.find(c=>c.key===actor.key&&!c.disabled&&!(c.firstTime&&c.kind==='recebe')&&c.start<=end&&actionStillVisible(c,Math.max(start,c.start)));
  const plan={key:actor.key,t:e.t,start,end,id:`body-feint:${actor.key}:${e.t}`};
  if(conflict)skipped.push({...plan,reason:'protected-foot-action',conflict:conflict.id});else plans.push(plan);
 }
 return{plans,skipped};
}

export function sampleBodyFeint(plans,key,time,{owned,distance,height,blocked=false}={}){
 const p=plans.find(p=>p.key===key&&time>=p.start&&time<=p.end);
 if(!p||blocked||!owned||height>.4)return null;
 const proximity=1-smooth((distance-1.2)/.5);
 const progress=time<=p.t?(time-p.start)/(p.t-p.start):1+(time-p.t)/(p.end-p.t);
 const weight=.65*proximity*(progress<=1?smooth(progress):1-smooth(progress-1));
 return weight>1e-6?{...p,weight,progress}:null;
}
