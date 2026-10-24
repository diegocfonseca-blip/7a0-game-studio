import * as T from 'three';
import {nearest} from './nearest.mjs';
import {solveLegContact} from './contact-ik.mjs';

// Presentation over the authored gait, never ball physics or a possession rule.
// No dedicated reception/dribble capture is available in the acquired library.
export function createBallControl(actor,{sourceLead=true}={}){
 const offset=new T.Vector3();let previousTime=null,side='right';
 // Advance the avatar's bounded approach before sampling locomotion. Its
 // extra travel must drive the imported walking/running clip, not slide an
 // idle pose toward a ball after the gait has already been evaluated.
 function advance(frame,p){
  if(!sourceLead)return null;
  const dt=previousTime===null?0:frame.time-previousTime;previousTime=frame.time;
  if(dt<0||dt>.5)offset.set(0,0,0);
  const ball=frame.ball,owned=frame.owner===p.key&&!p.keeper&&frame.phase==='dominio',receiving=!p.keeper&&['passe','lancamento','cruzamento'].includes(frame.phase)&&frame.owner!==p.key&&frame.officialAction?.receiver===p.key;
  const lead=new T.Vector3(ball.x-p.mx,0,ball.z-p.mz),distance=lead.length(),desired=new T.Vector3();
  if((owned||receiving)&&ball.y<.28&&distance>.30&&distance<(receiving?3:1.5))desired.copy(lead).setLength(Math.min(receiving?.25:.46,distance-.30));
  const nav=actor.navigationOffset,avoid=nav?new T.Vector3(nav.x,0,nav.z):new T.Vector3();if(avoid.lengthSq()>.0009){const strength=T.MathUtils.smoothstep(avoid.length(),.03,.15);avoid.normalize();desired.addScaledVector(avoid,-Math.min(0,desired.dot(avoid))*strength);}
  if(dt>0&&dt<=.5)offset.add(desired.sub(offset).multiplyScalar(1-Math.exp(-dt/((owned||receiving)?.1:.06))).clampLength(0,1.8*dt));
  if(offset.length()<1e-5)offset.set(0,0,0);
  return{x:p.mx+offset.x,z:p.mz+offset.z,offset:offset.length(),ballUnchanged:true};
 }
 return {reset(){offset.set(0,0,0);previousTime=null;},advance,apply(frame,p){
  const dt=previousTime===null?0:frame.time-previousTime;if(sourceLead)advance(frame,p);else previousTime=frame.time;
  if(dt<0||dt>.5)offset.set(0,0,0);
  const ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),owned=frame.owner===p.key&&!p.keeper&&frame.phase==='dominio',receiving=['passe','lancamento','cruzamento'].includes(frame.phase)&&frame.owner!==p.key&&frame.officialAction?.receiver===p.key&&!p.keeper&&Math.hypot(ball.x-p.mx,ball.z-p.mz)<3,engaged=owned||receiving,desired=new T.Vector3(),radius=.11;
  if(!engaged&&offset.lengthSq()===0)return null;
  if(engaged&&offset.lengthSq()===0&&(ball.y>.4||Math.hypot(ball.x-p.mx,ball.z-p.mz)>(receiving?3:1.5)))return null;
  const origin=actor.holder.position.clone(),legBones=['thigh_l','calf_l','foot_l','thigh_r','calf_r','foot_r'].map(n=>actor.bones.get(n)),original=legBones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
  // If the unshifted gait already crosses the ball, resetting the root cannot
  // solve it and causes a pop. Preserve the smooth root lead; the following
  // dedicated foot/ball clearance pass resolves that residual geometry.
  const commit=info=>{const clearance=()=>{const triangles=[...actor.footTriangles('left'),...actor.footTriangles('right')];return{gap:nearest(ball,triangles).distance-radius,floor:Math.min(...triangles.flatMap(t=>[t.a.y,t.b.y,t.c.y]))}},valid=c=>c.gap>=-.003&&c.floor>=-1e-5;if(valid(clearance()))return info;legBones.forEach((b,i)=>{b.position.copy(original[i].p);b.quaternion.copy(original[i].q)});const requested=offset.clone();let lo=0,hi=1;actor.holder.position.copy(origin);actor.holder.updateMatrixWorld(true);const baseClearance=clearance();if(!valid(baseClearance)&&baseClearance.floor>=-1e-5)lo=1;else if(valid(baseClearance))for(let i=0;i<7;i++){const mid=(lo+hi)/2;actor.holder.position.copy(origin).addScaledVector(requested,mid);actor.holder.updateMatrixWorld(true);if(valid(clearance()))lo=mid;else hi=mid;}offset.copy(requested).multiplyScalar(lo);actor.holder.position.copy(origin).add(offset);actor.holder.updateMatrixWorld(true);const c=clearance();return {...info,kind:'limited',gap:c.gap,offset:offset.length(),provisional:true,applied:false,contact:false,reason:'clearance-or-floor',ballUnchanged:true};};
  let left=nearest(ball,actor.footTriangles('left')),right=nearest(ball,actor.footTriangles('right'));
  if(side==='right'&&left.distance<right.distance-.03)side='left';else if(side==='left'&&right.distance<left.distance-.03)side='right';
  let hit=side==='left'?left:right,gap=hit.distance-radius;
  // An official owner can be assigned before the interpolated ball arrives.
  // Do not claim a touch or drag the avatar toward a distant/airborne ball.
  // The 2D anchor carries the ball 75 cm ahead. The approved short-legged
  // rig cannot cover that lead with an 8 cm residual foot correction. Keep
  // a stable body lead, rather than chasing the swinging nearest boot.
  const lead=ball.clone().sub(new T.Vector3(p.mx,0,p.mz)).setY(0),distance=lead.length();
  if(sourceLead){if(engaged&&ball.y<.28&&distance>.30)desired.copy(lead).setLength(Math.min(receiving?.25:.46,Math.max(0,distance-.30)));}else if(engaged&&(p.speed>1.2||receiving)&&ball.y<.28&&gap>.012&&gap<.4){desired.copy(ball).sub(hit.surface).setY(0);if(desired.lengthSq()>1e-10)desired.setLength(Math.min(receiving?.08:.18,gap-.012));}

  // Ball alignment must not cancel the lateral escape chosen by navigation.
  // If a foot is not reachable under both constraints, report the gap rather
  // than pulling the carrier back through the defender.
  const nav=actor.navigationOffset,avoid=nav?new T.Vector3(nav.x,0,nav.z):new T.Vector3();if(avoid.lengthSq()>.0009){const strength=T.MathUtils.smoothstep(avoid.length(),.03,.15);avoid.normalize();const opposed=Math.min(0,desired.dot(avoid));desired.addScaledVector(avoid,-opposed*strength);}
  if(!sourceLead){const alpha=dt>0&&dt<=.5?1-Math.exp(-dt/(engaged?.1:.06)):0;offset.lerp(desired,alpha);}if(offset.length()<1e-5)offset.set(0,0,0);
  actor.holder.position.add(offset);actor.holder.updateMatrixWorld(true);
  if(!engaged||ball.y>.28)return commit(offset.lengthSq()?{kind:'release',offset:offset.length(),provisional:true}:null);
  hit=nearest(ball,actor.footTriangles(side));gap=hit.distance-radius;
  let applied=false;
  if(gap>.001&&gap<=.08){
   const names=['thigh_','calf_','foot_'].map(n=>n+(side==='left'?'l':'r')),bones=names.map(n=>actor.bones.get(n)),saved=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),ankle=bones[2].getWorldPosition(new T.Vector3()),direction=ball.clone().sub(hit.surface).normalize();
   solveLegContact(actor,side,ankle.clone().addScaledVector(direction,Math.min(.075,gap-.001)),{maxCorrection:.08,maxAngle:.35});
   const triangles=actor.footTriangles(side),next=nearest(ball,triangles).distance-radius,floor=Math.min(...triangles.flatMap(t=>[t.a.y,t.b.y,t.c.y])),reach=bones[2].getWorldPosition(new T.Vector3()).distanceTo(ankle),angle=Math.max(...bones.map((b,i)=>b.quaternion.angleTo(saved[i].q)));
   if(next>=-1e-5&&next<gap&&floor>=-1e-5&&reach<=.080001&&angle<=.350001){gap=next;applied=true;}else{bones.forEach((b,i)=>{b.position.copy(saved[i].p);b.quaternion.copy(saved[i].q)});actor.holder.updateMatrixWorld(true);}
  }
  return commit({kind:receiving&&!owned?'anticipating':p.speed>1.2?'carrying':'receiving',side,gap,contact:Math.abs(gap)<=.015,applied,offset:offset.length(),bodyLead:desired.length(),provisional:true,ballUnchanged:true});
 }};
}
