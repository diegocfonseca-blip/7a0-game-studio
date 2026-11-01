import {isLiveFootballFrame} from './live-ground-interval.mjs';

/** Possession continuing after the first touch describes a dribble, even if
 * the next contact belongs to another player. Do not replace that entire run
 * with a fabricated straight loose-ball roll between the two receptions.
 * A genuinely immediate loss can still use the existing loose-touch path.
 */
export function isImmediateLooseContinuation(receive,next,sample){
 const interrupted=f=>f.phase?!isLiveFootballFrame(f):!!f.placementReset||!!f.heldBy;
 if(interrupted(sample(receive.t))||interrupted(sample(next.t)))return false;
 const end=Math.min(receive.t+.35,next.t-.015);
 if(end<=receive.t+.05)return true;
 let lost=false;
 for(let t=receive.t+.05;t<=end+1e-7;t+=.05){const frame=sample(t);if(frame.phase&&!isLiveFootballFrame(frame))return false;if(frame.owner!==receive.key)lost=true}
 return lost;
}
