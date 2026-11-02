/** Public attendance enters its own gate and is represented in the stands.
 * The ground service passage behind the gates belongs to athletes/staff;
 * seat-visit bookkeeping may continue there but never renders a public body.
 * No seat, ticket, trip schedule or match state changes here. */
export function publicGateDestination(gate,inset=2.5){
 return{x:gate.threshold.x-Math.sin(gate.heading)*inset,y:gate.floor??.16,z:gate.threshold.z-Math.cos(gate.heading)*inset};
}
/** Protected ground strip, player tunnel and warmup apron. Seats lie outside
 * these ground bounds; upper tiers may remain visible above them. */
export function isPlayerServiceArea(point){
 if(point.y!==undefined&&point.y>3)return false;
 return (point.x>=-104&&point.x<=-56&&Math.abs(point.z)<2)
  ||(point.x>=-94&&point.x<=-90.5&&point.z>=-21&&point.z<=2)
  ||(Math.abs(point.x)<54&&Math.abs(point.z)<39);

}
export function spectatorVisibleAt(point,side,gate){
 if(!point||![point.x,point.z].every(Number.isFinite)||isPlayerServiceArea(point))return false;
 const outside=(point.x-gate.threshold.x)*Math.sin(gate.heading)+(point.z-gate.threshold.z)*Math.cos(gate.heading);
 if(outside>=-.4)return true;
 // The gallery/stairs are separate from the central player tunnel and the
 // wall-side coach access. Spectators may reappear in their own stand only.
 return point.z<69&&point.z> -71&&(side==='home'?point.x< -6:point.x>8&&point.x<78.5);
}
export function intervalSpectatorPoints(side,gate){
 const inside=publicGateDestination(gate),lateral=side==='home'?2.7:2.5;
 const offset={x:Math.cos(gate.heading)*lateral,z:-Math.sin(gate.heading)*lateral};
 const at=d=>({x:gate.threshold.x+Math.sin(gate.heading)*d+offset.x,y:gate.floor??.16,z:gate.threshold.z+Math.cos(gate.heading)*d+offset.z});
 return[{...inside,x:inside.x+offset.x,z:inside.z+offset.z},at(1.2),at(12),at(1.2),{...inside,x:inside.x+offset.x,z:inside.z+offset.z}];
}
