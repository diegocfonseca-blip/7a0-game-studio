import {groundDelivery,sampleGroundDelivery} from '../motion/map-ball-flight.mjs';
import {liveGroundInterval} from './live-ground-interval.mjs';

/** Between two recorded contacts, a grounded ball rolls with resistance.
 * A tactical ownership spring is not an extra physical touch. Replace only
 * small spring deviations; preserve both exact contacts and all source data.
 * A known intermediate impulse, restart, flight or large deviation rejects
 * this presentation fit rather than hiding a different football action. */
export function receptionRoll(from,to,sample,groundTouches=[]){
 const duration=to.t-from.t;
 if(!['recebe','carry'].includes(from.kind)||from.hands||from.goleiro||from.pickup||from.firstTime||to.hands||to.cab||from.bola.y>.13||to.bola.y>.13||duration<.18||duration>2.5)return null;
 if(groundTouches.some(e=>e.t>from.t+1e-5&&e.t<to.t-1e-5))return null;
 if(!liveGroundInterval(from.t,to.t,sample,{maxHeight:.13}))return null;
 const fit=groundDelivery(from.t,to.t,from.bola,to.bola);if(!fit||fit.length<.35||fit.speed>14)return null;
 let maxDeviation=0;
 const steps=Math.ceil(duration*60);
 for(let i=0;i<=steps;i++){
  const t=i===steps?to.t:from.t+duration*i/steps,source=sample(t).ball,point=sampleGroundDelivery(fit,t);
  maxDeviation=Math.max(maxDeviation,Math.hypot(point.x-source.x,point.z-source.z));
  if(maxDeviation>.45)return null;
 }
 return{...fit,receptionRoll:true,key:from.key,maxDeviation};
}
