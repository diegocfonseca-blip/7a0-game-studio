const keys=['x','y','z'],vel=['vx','vy','vz'];
function curve(a,b,seconds,u){const u2=u*u,u3=u2*u;return Object.fromEntries(keys.map((k,i)=>[k,(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*seconds*a[vel[i]]+(-2*u3+3*u2)*b[k]+(u3-u2)*seconds*b[vel[i]]]))}
/** Join fixed official samples around a real deflection. The incoming and
 * outgoing arcs meet at the physical event position/time, without smoothing
 * across its velocity discontinuity or following live gloves/receivers. */
export function keeperFlight(cue,sample,agenda){
 const previous=agenda.findLast(a=>!a.disabled&&a.t<cue.t-.001),next=agenda.find(a=>!a.disabled&&a.t>cue.t+.001);
 const start=Math.max(cue.t-.25,(previous?.t??-Infinity)+.025),end=Math.min(cue.t+.22,(next?.t??Infinity)-.025);
 if(start>=cue.t-.01||end<=cue.t+.01)return null;
 const before=sample(start).ball,after=sample(end).ball,incoming=sample(cue.t-.06).ball;
 return{start,at:cue.t,end,before,after,impact:{...cue.bola},incoming:{...cue.bola,vx:incoming.vx,vy:incoming.vy,vz:incoming.vz}};
}
export function sampleKeeperFlight(f,time){if(!f||time<f.start||time>f.end)return null;const p=time<=f.at?curve(f.before,f.incoming,f.at-f.start,(time-f.start)/(f.at-f.start)):curve(f.impact,f.after,f.end-f.at,(time-f.at)/(f.end-f.at));p.y=Math.max(.11,p.y);return p}
