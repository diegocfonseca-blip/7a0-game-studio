const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
/** Presentation of official stoppages, never permission to change the engine.
 * Authorization precedes the imported preparation and the fixed ball impact. */
export function prepareRefereeCues(agenda){
 return agenda.filter(a=>!a.disabled&&a.kind==='toque'&&['falta','penalti'].includes(a.restartOrigin?.type)).map(a=>{
  const r=a.restartOrigin,release=a.t,preparation=a.start??release-.2,duration=release-r.since;
  const authorize=Math.max(r.since,Math.min(preparation-.04,release-Math.min(.18,duration*.15)));
  return{id:r.id,since:r.since,authorize,release,preparation,taker:r.taker,side:r.side,point:{...r.point},direction:a.mira??a.dir??0};
 });
}
export function refereeCue(cues,time){
 const c=cues.find(c=>time>=c.since&&time<c.release+.45);if(!c)return null;
 const elapsed=time-c.since,remaining=c.release-time;
 const state=time>=c.release?'resume':time>=c.authorize?'authorize':elapsed<Math.min(.28,(c.authorize-c.since)*.4)?'whistle':'signal';
 const weight=smooth(elapsed/.08)*(1-smooth((time-c.release)/.4));
 return{...c,state,weight,whistle:state==='whistle'?weight:state==='authorize'?weight*(1-smooth((time-c.authorize)/.2)):0,pointing:state==='whistle'?0:weight,waiting:time<c.authorize,remaining};
}

/** No sound burst on load/seek, no duplicate at a paused frame, no extra
 * whistle during the automatic goal replay. A quick restart can share a tick. */
export function refereeWhistles(cues,from,to,replay=false){
 if(replay||from===null||to<=from||to-from>.3)return[];
 return[...new Set(cues.flatMap(c=>[c.since,c.authorize]).filter(t=>from<t&&to>=t&&to-t<.2))];
}
