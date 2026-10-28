/** Render cadence must not skip a football impact. These are presentation-only
 * substeps, sampled from the already prepared official trajectory. They never
 * advance the result engine or delay the visible match clock. */
export function contactSteps(agenda,from,to){
 if(from===null||to<=from||to-from>.25)return[];
 return [...new Set(agenda.filter(a=>!a.disabled&&!(a.firstTime&&a.kind==='recebe')&&a.t>from+1e-7&&a.t<to-1e-7).map(a=>a.t))].sort((a,b)=>a-b);
}
export function contactFrame(frame,time,timeline){
 const sample=timeline.sample(time),b=sample.ball;
 return{...frame,time,owner:sample.owner,phase:sample.phase,placementReset:sample.placementReset,
  restart:sample.phase===frame.phase?frame.restart:undefined,
  officialAction:frame.officialAction?.startedAt<=time+1e-7?frame.officialAction:undefined,
  official:frame.official?{...frame.official,finished:sample.phase==='fim',events:frame.official.events.filter(e=>e.t<=time+1e-7)}:undefined,
  ball:{...frame.ball,x:b.x,y:b.y,z:b.z,curl:b.curl,presentation:undefined,heldBy:sample.heldBy,velocity:{x:b.vx,y:b.vy,z:b.vz}},
  players:frame.players.map(p=>{const q=timeline.sample(time,p.key).player;if(!q)return p;return{...p,mx:q.x,mz:q.z,sourceAnchor:{x:q.x,z:q.z},heading:q.heading,speed:q.speed,visible:q.visible,mergulho:q.mergulho}})};
}
