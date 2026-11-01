import * as T from 'three';
import {solveLimbContact} from '../motion/contact-ik.mjs';
import {headSurfacesIntersect} from './verify-clearance-warning.mjs';
const box=a=>{const b=new T.Box3();for(const t of a.surface.triangles('head'))b.expandByPoint(t.a).expandByPoint(t.b).expandByPoint(t.c);return b};
function lean(actor,axis,angle){const bone=actor.bones.get('mixamorigSpine1');if(!bone)return;const q=bone.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromAxisAngle(axis,angle));bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));actor.holder.updateMatrixWorld(true)}
export function applyContactLean(actor,time){const c=actor.contactLean;if(!c)return;if(time<c.time||time-c.time>=.18||['head','hands','chest'].includes(actor.tiro?.pose?.region)){actor.contactLean=null;return}const u=(time-c.time)/.18,k=1-u*u*(3-2*u);lean(actor,c.axis,c.angle*k)}
/** Millimetre-scale residual separation when two protected contact roots meet.
 * Keep both ankles and boot orientation fixed using existing bounded IK. This
 * does not change source paths, the ball, animation clips or official events. */
export function separateContactBodies(actors,diagnostics,{maxShift=.03,time=0}={}){
 const final=diagnostics?.final;if(!final?.unresolved?.length)return[];
 const reports=[],remaining=[];
 for(const warning of final.unresolved){
  const a=actors.find(a=>a.key===warning.a),b=actors.find(a=>a.key===warning.b);
  if(!a||!b||a.keeper||b.keeper||[a,b].some(a=>a.reaction||['head','hands','chest'].includes(a.tiro?.pose?.region))){remaining.push({...warning,separationReason:'protected-non-foot-contact'});continue}
  const aa=box(a),bb=box(b),dx=b.holder.position.x-a.holder.position.x,dz=b.holder.position.z-a.holder.position.z,d=Math.hypot(dx,dz);
  if(!aa.intersectsBox(bb)||d<.37){remaining.push(warning);continue}
  const nx=dx/d,nz=dz/d,ox=Math.min(aa.max.x-bb.min.x,bb.max.x-aa.min.x),oz=Math.min(aa.max.z-bb.min.z,bb.max.z-aa.min.z);
  const boundsNeed=Math.min(Math.abs(nx)>1e-5?ox/Math.abs(nx):Infinity,Math.abs(nz)>1e-5?oz/Math.abs(nz):Infinity)+.002,need=Math.min(boundsNeed,2*maxShift);
  if(!(need>0)){remaining.push(warning);continue}
  const saved=[a,b].map(actor=>({actor,position:actor.holder.position.clone(),bones:[...actor.bones.values()].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone()})),feet:['Left','Right'].map(side=>({side,point:actor.bones.get('mixamorig'+side+'Foot').getWorldPosition(new T.Vector3())}))}));
  let maxFootDrift=0;
  for(let i=0;i<saved.length;i++){
   const s=saved[i],sign=i===0?-1:1;s.actor.holder.position.x+=nx*need*.5*sign;s.actor.holder.position.z+=nz*need*.5*sign;s.actor.holder.updateMatrixWorld(true);
   for(const foot of s.feet){const names=['UpLeg','Leg','Foot'].map(n=>'mixamorig'+foot.side+n);solveLimbContact(s.actor,names,foot.point,{maxCorrection:maxShift+.005,maxAngle:.18});maxFootDrift=Math.max(maxFootDrift,s.actor.bones.get(names[2]).getWorldPosition(new T.Vector3()).distanceTo(foot.point))}
  }
  const disjoint=!headSurfacesIntersect(a,b);
  if(!disjoint||maxFootDrift>.004){
   const restore=()=>{for(const s of saved){s.actor.holder.position.copy(s.position);for(const b of s.bones){b.b.position.copy(b.p);b.b.quaternion.copy(b.q)}s.actor.holder.updateMatrixWorld(true)}};
   let torsoSolved=false;
   // When a captured leg is fully extended, shifting the hips would drag the
   // boot. A bounded upper-body avoidance leaves both leg chains untouched.
   for(const angle of [.06,.12,.18,.22]){restore();const axes=saved.map((s,i)=>new T.Vector3(nz*(i===0?-1:1),0,-nx*(i===0?-1:1)));saved.forEach((s,i)=>lean(s.actor,axes[i],angle));const drift=Math.max(...saved.flatMap(s=>s.feet.map(f=>s.actor.bones.get('mixamorig'+f.side+'Foot').getWorldPosition(new T.Vector3()).distanceTo(f.point))));if(drift<.001&&!headSurfacesIntersect(a,b)){saved.forEach((s,i)=>s.actor.contactLean={axis:axes[i],angle,time});reports.push({...warning,rootShiftPerActor:0,maxFootDrift:drift,torsoRadians:angle,headTrianglesDisjoint:true});torsoSolved=true;break}}
   if(!torsoSolved){restore();remaining.push({...warning,separationReason:'foot-preservation-rollback',disjoint,maxFootDrift,requiredShiftPerActor:need*.5})}continue;
  }
  reports.push({...warning,rootShiftPerActor:need*.5,maxFootDrift,headTrianglesDisjoint:true});
 }
 final.beforeContactSeparation=final.unresolved;final.unresolved=remaining;final.contactPreservingSeparation=reports;return reports;
}
