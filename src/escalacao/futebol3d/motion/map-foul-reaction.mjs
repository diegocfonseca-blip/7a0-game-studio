const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const FALL_CLIPS=['cai','cai_parado','cai_carrinho','levanta'];

/** A whistle is not another physical impact. Read the frozen official events
 * and fit a COMPLETE captured reaction before the next ball preparation.
 * Never delay a restart, move the ball, or change an official event. */
export function prepareFoulReactions({events,actors,agenda,world,durations}){
 const plans=[],skipped=[];
 for(const e of events){
  if(e.tipo!=='falta')continue;
  const victim=actors.find(a=>a.name===e.b&&(a.side==='home'?0:1)!==e.lado);
  const offender=actors.find(a=>a.name===e.a&&(a.side==='home'?0:1)===e.lado);
  const skip=reason=>skipped.push({t:e.t,reason,victim:victim?.key});
  if(!victim||!offender){skip('unidentified-contact');continue}
  // On advantage recall the engine repeats the foul at the whistle, up to
  // 2.5 s AFTER the contact. Do not knock the player over a second time.
  if(events.some(o=>o.tipo==='vantagem'&&o.a===e.a&&o.b===e.b&&o.lado!==e.lado&&o.t<e.t&&e.t-o.t<=2.55)){skip('advantage-recall');continue}
  const anchor=world(victim.key,e.t),other=world(offender.key,e.t-.05),before=world(victim.key,e.t-.05);
  if(!anchor||!other||!before||Math.hypot(before.x-other.x,before.z-other.z)>1.8){skip('no-nearby-contact');continue}
  const next=agenda.find(a=>a.key===victim.key&&!a.disabled&&!(a.firstTime&&a.kind==='recebe')&&a.t>e.t+.05);
  const available=Math.min(3.2,(next?.start??e.t+3.26)-e.t-.06);
  const tackle=events.some(o=>o.tipo==='carrinho'&&o.lado===e.lado&&o.a===e.a&&e.t>=o.t&&e.t-o.t<1.2);
  // These two captures ALREADY end standing. Only "cai" needs "levanta".
  const sequence=name=>name==='cai'?
   [{name,from:.25,to:durations.cai,at:0},{name:'levanta',from:0,to:durations.levanta,at:durations.cai-.25-.14}]:
   [{name,from:.1,to:durations[name],at:0}];
  const preferred=tackle?(before.speed>3?'cai_carrinho':'cai_parado'):'cai';
  let selected;
  for(const name of [...new Set([preferred,'cai_parado'])]){
   const clips=sequence(name);if(clips.some(c=>!Number.isFinite(c.to)))continue;
   const duration=Math.max(...clips.map(c=>c.at+c.to-c.from)),rate=Math.max(1,duration/available);
   if(available>0&&rate<=1.65){selected={clips,duration,rate};break}
  }
  if(!selected){skip('restart-too-soon');continue}
  const end=e.t+selected.duration/selected.rate;
  // A distant set-piece relocation is walking, not a body sliding on grass.
  let relocation=0;for(let t=e.t;t<=end+.001;t+=.1){const p=world(victim.key,t);relocation=Math.max(relocation,Math.hypot(p.x-anchor.x,p.z-anchor.z))}
  if(relocation>2.5){skip('restart-relocation');continue}
  if(plans.some(p=>p.key===victim.key&&p.end>e.t)){skip('reaction-already-active');continue}
  plans.push({id:'foul:'+e.lado+':'+e.t,key:victim.key,t:e.t,end,anchor,...selected});
 }
 return{plans,skipped};
}

/** Absolute time makes replay, pause and a slow frame sample the same pose. */
export function sampleFoulReaction(plans,key,time){
 const p=plans.find(p=>p.key===key&&time>=p.t&&time<p.end);if(!p)return null;
 const elapsed=time-p.t,t=elapsed*p.rate,total=p.end-p.t;
 const weight=Math.min(clamp(elapsed/.10),clamp((total-elapsed)/.14));
 const second=p.clips[1],blend=second?smooth((t-second.at)/.14):0;
 const clips=p.clips.map((c,i)=>({name:c.name,time:Math.min(c.to,c.from+Math.max(0,t-c.at)),weight:weight*(i?blend:1-blend)}));
 const lock=smooth(elapsed/.10)*(1-smooth((elapsed-(total-.32))/.32));
 return{...p,weight,lock,clips};
}

export function foulRoot(p,position){
 if(!p)return position;
 return{...position,x:position.x+(p.anchor.x-position.x)*p.lock,z:position.z+(p.anchor.z-position.z)*p.lock};
}
