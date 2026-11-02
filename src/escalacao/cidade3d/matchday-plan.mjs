/** Local presentation schedule only. Never starts, pauses or scores a match. */
export const MATCHDAY_COACH_DELAY=75;
export const MATCHDAY_STALLS=Object.freeze([
 {id:'churrasco',label:'CHURRASQUINHO',kind:'grill',x:-17,z:106,side:'home',color:'#a7422b'},
 {id:'cachorro',label:'CACHORRO-QUENTE',kind:'hotdog',x:17,z:106,side:'home',color:'#dfb736'},
 {id:'bebidas-casa',label:'ÁGUA · REFRI · CERVEJA',kind:'cooler',x:-11,z:111,side:'home',color:'#28776d'},
 {id:'camisas',label:'CAMISAS DO TIME',kind:'shirts',x:-36,z:106,side:'home',color:'#2d617e'},
 {id:'bones',label:'BONÉS DA TORCIDA',kind:'caps',x:36,z:106,side:'home',color:'#5e6e32'},
 {id:'bebidas-fora',label:'ÁGUA · REFRI · CERVEJA',kind:'cooler',x:121,z:16,side:'away',color:'#315c83'},
]);
export function matchdayFanPoints(side,index=0){
 // The first person walks to the farthest waiting position inside. Followers
 // never pass through an already stopped person. Outside lanes avoid the
 // central player route; the lateral visitor portal uses its actual turn.
 if(side==='home')return[{x:-3.3,y:.16,z:103+index*1.7},{x:-3.3,y:.16,z:84},{x:-3.3,y:.16,z:79+index*.5}];
 return[{x:124+index*1.7,y:.16,z:8.5},{x:105,y:.16,z:8.5},{x:102+index*.5,y:.16,z:8.5}];
}
export function matchdayStage(elapsed,phase,entered){
 if(phase==='departure')return 'departure';
 if(phase==='playing'||phase==='interval')return 'match';
 if(elapsed<18)return 'gates-open';
 if(elapsed<MATCHDAY_COACH_DELAY||!entered)return 'supporters-entering';
 return 'teams-arrival';
}

/** Hide an exterior spectator only after their body clears the actual gate.
 * Keep the previous visibility while straddling the doorway, so reversing or
 * pausing there cannot make the same person flicker. Departure reveals them
 * again on the exterior side; their route and identity remain unchanged. */
export function stadiumExteriorVisible(position,gate,previous=true,clearance=.4){
 const outside=(position.x-gate.threshold.x)*Math.sin(gate.heading)+(position.z-gate.threshold.z)*Math.cos(gate.heading);
 if(outside>=clearance)return true;
 if(outside<=-clearance)return false;
 return previous;
}
