const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
/** Metric, non-looping motion with acceleration/braking. One presentation clock;
 * callers decide when a new visit begins, never the match or career clock. */
export function activityRoute(points,speed=1.15,ramp=.65){
 if(points.length<2||points.some(p=>![p.x,p.y,p.z].every(Number.isFinite))||!(speed>0))throw Error('Invalid city route');
 const nodes=[{...points[0],at:0}];let length=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);if(d<1e-7)continue;length+=d;nodes.push({...b,at:length})}
 if(length<1e-5)throw Error('Empty city route');
 ramp=Math.min(ramp,Math.sqrt(length/speed));const duration=length/speed+ramp;
 const headings=nodes.map((p,i)=>{const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];return Math.atan2(b.x-a.x,b.z-a.z)});
 function at(seconds){const t=clamp(seconds,0,duration);let distance,velocity;
  if(t<ramp){distance=speed*t*t/(2*ramp);velocity=speed*t/ramp}
  else if(t>duration-ramp){const left=duration-t;distance=length-speed*left*left/(2*ramp);velocity=speed*left/ramp}
  else{distance=speed*(t-ramp/2);velocity=speed}
  let index=nodes.findIndex((p,i)=>i&&distance<=p.at);if(index<1)index=nodes.length-1;
  const a=nodes[index-1],b=nodes[index],u=clamp((distance-a.at)/(b.at-a.at),0,1);
  const heading=headings[index-1]+angle(headings[index]-headings[index-1])*u;
  return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,heading,speed:velocity,distance,done:seconds>=duration};
 }
 return{length,duration,points,at};
}
/** A customer remains physically inside during the visit, then exits along the
 * same doorway. No disappearance at the shop threshold or jump at cycle end. */
export function customerJourney(points,{speed=1.1,stay=22,wait=6,turnAtExit=false}={}){
 const inbound=activityRoute(points,speed),outbound=activityRoute([...points].reverse(),speed),turn=1.4;
 const period=wait+inbound.duration+turn+stay+outbound.duration;
 function at(seconds){const t=Math.max(0,seconds)%period;
  if(t<wait){const u=clamp(t/Math.min(turn,wait),0,1);return{...inbound.at(0),heading:inbound.at(0).heading+Math.PI*(1-u*u*(3-2*u)),phase:'waiting'}};
  if(t<wait+inbound.duration)return{...inbound.at(t-wait),phase:'entering'};
  const local=t-wait-inbound.duration,pose=inbound.at(inbound.duration);
  if(local<turn+stay){const u=clamp((local-(turnAtExit?stay:0))/turn,0,1),heading=pose.heading+Math.PI*u*u*(3-2*u);return{...pose,heading,speed:0,phase:'visiting'}}
  return{...outbound.at(local-turn-stay),distance:inbound.length+outbound.at(local-turn-stay).distance,phase:'leaving'};
 }
 return{at,period,inbound,outbound};
}
