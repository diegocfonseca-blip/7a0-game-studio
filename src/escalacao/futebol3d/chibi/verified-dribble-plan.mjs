/** The first touch sends a ground ball along the already determined next
 * verified contact. Plan intent from these fixed points, never a live foot. */
export function receivingRollIntent(receive,next,sample){
 if(receive.kind!=='recebe'||receive.hands||receive.goleiro||receive.pickup||receive.firstTime||!next?.verifiedGroundTouch||next.key!==receive.key)return null;
 const dt=next.t-receive.t;if(dt<.22||dt>.85||receive.bola.y>.23||next.bola.y>.23)return null;
 for(let t=receive.t+.04;t<next.t-.015;t+=.05)if(sample(t).owner!==receive.key||sample(t).ball.y>.25)return null;
 const dx=next.bola.x-receive.bola.x,dz=next.bola.z-receive.bola.z;if(Math.hypot(dx,dz)<.35)return null;
 return{heading:Math.atan2(dx,dz),reason:'verified-first-touch-roll',nextContact:next.t};
}

/** A brief fragment of the existing dribbling capture around its push, rather
 * than repeatedly playing its whole running cycle as a special kick. */
export function verifiedControlTiming(cue,{raw,end,earliestStart=0}){
 const touch=Math.max(.04,Math.min(.18,cue.t-earliestStart)),preRate=1,followRate=1,clipStart=Math.max(0,raw-touch),clipEnd=Math.min(end,raw+.16);
 return{start:cue.t-touch,clipStart,clipEnd,captureTouch:raw,preRate,followRate,touch,duration:touch+clipEnd-raw};
}

/** Match the ordinary captured dribbling loop to the push while its weight is
 * hidden by the full contact pose. Blending back then retains the same leg. */
export function gaitPhaseAtContact(gait,raw){
 const phase=gait.cycles*(raw/gait.duration-gait.phase);
 return((phase%2)+2)%2;
}

/** The 20Hz source may push on consecutive steps while the same foot would
 * still be on the ball. Group this sustained contact; do not demand a new
 * captured swing every 50ms. A push immediately before a pass belongs to that
 * pass's continuous preparation, whose calibrated strike retains priority. */
export function planVerifiedDribbles(agenda){
 const decisions=[];
 for(const key of new Set(agenda.filter(e=>e.verifiedGroundTouch).map(e=>e.key))){
  const touches=agenda.filter(e=>e.key===key&&e.verifiedGroundTouch).sort((a,b)=>a.t-b.t),groups=[];
  for(const cue of touches){const group=groups.at(-1);if(group&&cue.t-group.at(-1).t<=.18+1e-7)group.push(cue);else groups.push([cue])}
  for(const group of groups){const first=group[0],last=group.at(-1),release=agenda.find(e=>e.key===key&&e.kind==='toque'&&e.t>=first.t),covered=release&&release.t-last.t<.45;
   for(const cue of group)decisions.push({id:cue.id,key,t:cue.t,capture:!covered&&cue===first,reason:covered?'part-of-immediate-release':cue===first?'verified-captured-push':'same-sustained-foot-contact',clusterStart:first.t,clusterEnd:last.t,sourceImpulses:group.length});
  }
 }
 return decisions;
}
