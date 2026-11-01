const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
/** Looking back to read a pass is not a command to run back toward the passer.
 * Use the official travel tangent at a running reception, independently of the
 * calibrated contact-facing pose. Never invent movement for a still receiver. */
export function receptionTravelVelocity(cue,{controlled=false}={}){
 if(controlled)return null;
 if(cue.kind!=='recebe'&&!cue.verifiedGroundTouch||cue.hands||cue.goleiro||cue.pickup||!/^controle_corrida/.test(cue.nome??''))return null;
 const speed=cue.rec?.speed,heading=cue.rec?.heading;
 if(!Number.isFinite(speed)||!Number.isFinite(heading))return null;
 const v=Math.max(0,Math.min(9,speed));if(!v)return{x:0,z:0};return{x:Math.sin(heading)*v,z:Math.cos(heading)*v};
}
/** Existing reception capture with an open body for a runner. Keep a nearby
 * scheduled release's established orientation. Slow/chest/hand contacts retain
 * their existing pose; no head/rig edits and no changes to the official pass. */
export function runningReceptionFacing(cue,next){
 if(next&&next.t>=cue.t&&next.t-cue.t<.8)return{heading:next.mira,reason:'nearby-release'};
 if(next&&next.t>=cue.t&&next.t-cue.t<=1.9)return{heading:cue.mira,reason:'existing-two-contact-control'};
 const speed=cue.rec?.speed,travel=cue.rec?.heading;
 if(cue.hands||cue.goleiro||cue.pickup||cue.bola?.y>.3||!(speed>2.5)||!Number.isFinite(travel)||!Number.isFinite(cue.mira))return{heading:cue.mira,reason:'existing-contact-pose'};
 return{heading:travel+Math.max(-.65,Math.min(.65,angle(cue.mira-travel))),reason:'open-running-reception'};
}
