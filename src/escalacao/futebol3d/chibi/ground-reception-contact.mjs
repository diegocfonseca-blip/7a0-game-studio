import {liveGroundInterval,isLiveFootballFrame} from './live-ground-interval.mjs';

/** Logical acquisition can precede the rendered ball reaching the runner.
 * For an otherwise unplanned reception, wait for the arriving ball's first
 * deceleration near the native body. Keep official ownership/events intact.
 * Existing two-touch plans, first-time releases and verified pushes win. */
export function groundReceptionContact(cue,sample,{nextRelease,nextDribble,maxDelay=.3}={}){
 if(cue.kind!=='recebe'||cue.disabled||cue.firstTime||cue.hands||cue.goleiro||cue.pickup||cue.assignedAt!==undefined||cue.bola?.y>.23||!cue.rec)return null;
 if(nextRelease&&nextRelease.t-cue.t<=1.9||nextDribble&&nextDribble.t-cue.t<=.85)return null;
 if(Math.hypot(cue.rec.x-cue.bola.x,cue.rec.z-cue.bola.z)<=1.25)return null;
 const before=sample(cue.t-.06).ball,dx=cue.bola.x-before.x,dz=cue.bola.z-before.z,d=Math.hypot(dx,dz),speed=d/.06;
 if(speed<3)return null;
 let best=null;
 for(let delay=.08;delay<=maxDelay+1e-7;delay+=1/60){
  const t=cue.t+delay,frame=sample(t,cue.key),body=frame.player,ball=frame.ball;
  if(!body||Math.hypot(body.x-ball.x,body.z-ball.z)>1.1||!liveGroundInterval(cue.t,t+.12,sample))continue;
  let owned=true;for(let s=cue.t;s<t+.12;s+=1/60)if(sample(s).owner!==cue.key){owned=false;break}if(!owned)continue;
  const a=sample(t-1/60).ball,b=sample(t+1/60).ball,vx=(b.x-a.x)*30,vz=(b.z-a.z)*30,v=Math.hypot(vx,vz),forward=(vx*dx+vz*dz)/d;
  if(forward>speed*.25||v>speed*.8)continue;
  const gap=Math.hypot(body.x-ball.x,body.z-ball.z),cost=v+gap*2+delay*.8;
  if(!best||cost<best.cost){const out=sample(t+.08).ball,ox=out.x-ball.x,oz=out.z-ball.z;best={t,ball,body,heading:Math.hypot(ox,oz)>.06?Math.atan2(ox,oz):body.heading,delay,cost,nativeGap:gap}}
 }
 return best;
}

/** Preserve a lofted pass's complete airborne arc. Once it has landed, its
 * last ground roll may end at the selected physical reception instead of
 * showing the source settling spring turn the ball before any foot reaches it.
 * Both endpoints are frozen source points; this is never a live foot target. */
export function groundArrivalTail(cue,sample,{startLimit=0,maxTail=.65}={}){
 if(!cue.receptionDelay)return null;
 let start=cue.assignedAt;
 for(let t=start-1/60;t>=Math.max(startLimit,cue.assignedAt-maxTail);t-=1/60){const f=sample(t);if(!isLiveFootballFrame(f)||f.ball.y>.15)break;start=t}
 if(cue.t-start<.12||!liveGroundInterval(start,cue.t,sample,{maxHeight:.15}))return null;
 return{start,end:cue.t,from:sample(start).ball,to:cue.bola,key:cue.key};
}
