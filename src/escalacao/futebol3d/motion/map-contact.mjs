import * as T from 'three';

export const BALL_RADIUS=.11,BOOT_RADIUS=.065,CONTACT_MARGIN=.025;
const clamp=T.MathUtils.clamp;
/** A contact has to cross the visible boot volume. Ownership and clip phase
 * alone never prove contact. Sweeping prevents fast feet skipping a frame. */
export function bootContact(ball,feet,previous=null){
 let best={gap:Infinity,side:null,swept:false};
 for(let side=0;side<feet.length;side++){
  const foot=feet[side];if(!foot)continue;
  const r=new T.Vector3(ball.x-foot.x,ball.y-foot.y,ball.z-foot.z);
  let distance=r.length(),swept=false;
  if(previous?.feet[side]){
   const f=previous.feet[side],p=previous.ball;
   const start=new T.Vector3(p.x-f.x,p.y-f.y,p.z-f.z),travel=r.clone().sub(start);
   const u=clamp(-start.dot(travel)/(travel.lengthSq()||1),0,1);
   const d=start.addScaledVector(travel,u).length();if(d<distance){distance=d;swept=true;}
  }
  const gap=distance-BALL_RADIUS-BOOT_RADIUS;
  if(gap<best.gap)best={gap,side,swept};
 }
 return{...best,contact:best.gap<=CONTACT_MARGIN};
}

/** Bounded movement of the BODY over the official tactical anchor. Never
 * changes the ball, the official ownership, or a result. */
export function advanceApproach(current,target,dt,{limit=1.35,speed=2.4}={}){
 if(!(dt>0))return {...current};
 const n=Math.hypot(target.x,target.z),scale=n>limit?limit/n:1;
 const dx=target.x*scale-current.x,dz=target.z*scale-current.z,d=Math.hypot(dx,dz);
 const step=Math.min(d,speed*dt),k=d>1e-8?step/d:0;
 return{x:current.x+dx*k,z:current.z+dz*k};
}

/** Choose a reachable, fixed future ball point. Never continually bend a
 * flying pass toward a receiver. Clip contact offsets are measured on the rig. */
export function approachTarget(plan,contact,heading,now,lead=1.2){
 if(!plan?.bola||!plan.rec||!contact)return null;
 const remain=plan.t-now;if(remain<-.14||remain>lead)return null;
 const cs=Math.cos(heading),sn=Math.sin(heading),off=contact.off;
 const x=plan.bola.x-plan.rec.x-(off.x*cs+off.z*sn),z=plan.bola.z-plan.rec.z-(-off.x*sn+off.z*cs);
 const w=T.MathUtils.smoothstep(lead-remain,0,Math.max(.1,lead-.22));
 return{x:x*w,z:z*w};
}
