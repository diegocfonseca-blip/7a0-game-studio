// Generated from scripts/animation-lab/foot-ball-clearance.mjs. Repackage after editing source.
import * as T from 'three';
import {nearest} from './nearest.mjs';
import {solveLegContact} from './contact-ik.mjs';

// Residual collision constraint over a sampled clip. No ball integration,
// skeletal animation cycle, root translation, or source-data write occurs here.
// Every candidate starts at the SAME imported pose: budgets never accumulate.
export function constrainFootBall(actor,side,ball,{radius=.11,maxCorrection=.08,maxAngle=.35,margin=.001}={}){
 if(!Number.isFinite(radius)||radius<=0||!Number.isFinite(maxCorrection)||maxCorrection<0||!Number.isFinite(maxAngle)||maxAngle<0||!Number.isFinite(margin)||margin<0||!ball.toArray().every(Number.isFinite))throw Error('Limites de colisão inválidos');
 const suffix=side==='left'?'l':side==='right'?'r':null;if(!suffix)throw Error('Pé desconhecido');
 const names=['thigh_','calf_','foot_'].map(n=>n+suffix),bones=names.map(n=>actor.bones.get(n));
 const originals=bones.map(b=>b.quaternion.clone()),originalPositions=bones.map(b=>b.position.clone()),ankle=bones[2].getWorldPosition(new T.Vector3());
 const triangles=()=>actor.footTriangles(side),floor=ts=>Math.min(...ts.flatMap(t=>[t.a.y,t.b.y,t.c.y]));
 const initial=triangles(),hit=nearest(ball,initial),initialFloor=floor(initial);
 const restore=()=>{bones.forEach((b,i)=>{b.quaternion.copy(originals[i]);b.position.copy(originalPositions[i])});actor.holder.updateMatrixWorld(true);};
 let best={gap:hit.distance-radius,correction:0,floor:initialFloor,jointAngle:0},bestPose=originals,bestPositions=originalPositions;
 // A sub-micrometre margin error is not a penetration and must not trigger
 // an 8 cm fallback IK correction at a valid contact marker.
 if(best.gap>=margin-1e-6||maxCorrection===0||maxAngle===0)return {...best,rawGap:best.gap,applied:false,limited:best.gap<-.003};
 // Keep the ankle height and captured ankle orientation. Horizontal candidates
 // avoid pushing the planted foot down to escape a sphere sitting on the turf.
 const away=hit.surface.clone().sub(ball);away.y=0;
 if(away.lengthSq()<1e-10){away.copy(ankle).sub(ball);away.y=0;}if(away.lengthSq()<1e-10)away.set(1,0,0);away.normalize();
 const penetration=Math.max(0,margin-best.gap);
 const directions=[0,.55,-.55,1.1,-1.1,Math.PI].map(turn=>away.clone().applyAxisAngle(new T.Vector3(0,1,0),turn));
 // Root-parented foot controls can also clear an approaching ball by lifting
 // the boot within the same 8 cm reach budget, while keeping the sole above
 // the turf. This is a residual correction, never an authored kick cycle.
 if(bones[2].parent!==bones[1])for(const rise of [.5,1,2])for(const turn of [0,.55,-.55,Math.PI])directions.push(away.clone().applyAxisAngle(new T.Vector3(0,1,0),turn).add(new T.Vector3(0,rise,0)).normalize());
 for(const direction of directions){
  for(const amount of new Set([Math.min(maxCorrection,penetration*1.15),maxCorrection])){
   restore();solveLegContact(actor,side,ankle.clone().addScaledVector(direction,amount),{maxCorrection,maxAngle});
   // Bound total LOCAL joint rotation against the captured pose, including
   // the ankle compensation used to retain its world orientation.
   bones.forEach((b,i)=>{if(b.quaternion.angleTo(originals[i])>maxAngle){const desired=b.quaternion.clone();b.quaternion.copy(originals[i]).rotateTowards(desired,maxAngle);}});
   actor.holder.updateMatrixWorld(true);
   const ts=triangles(),candidate={gap:nearest(ball,ts).distance-radius,floor:floor(ts),correction:bones[2].getWorldPosition(new T.Vector3()).distanceTo(ankle),jointAngle:Math.max(...bones.map((b,i)=>b.quaternion.angleTo(originals[i])))};
   // A larger gap is useful only if it preserves floor and reach constraints.
   if(candidate.floor>=Math.min(0,initialFloor)-1e-5&&candidate.correction<=maxCorrection+1e-5&&candidate.gap>best.gap+1e-6){best=candidate;bestPose=bones.map(b=>b.quaternion.clone());bestPositions=bones.map(b=>b.position.clone());}
   if(best.gap>=margin)break;
  }
  if(best.gap>=margin)break;
 }
 // If translation alone cannot clear the sphere, allow a small ankle
 // orientation correction. Every trial starts at one fixed pose and stays
 // inside the SAME captured-pose angle/reach/floor budgets.
 if(best.gap< -1e-5){
  const seedPose=bestPose.map(q=>q.clone()),seedPositions=bestPositions.map(p=>p.clone());
  orientations: for(const axis of [new T.Vector3(0,1,0),new T.Vector3(1,0,0),new T.Vector3(0,0,1)])for(const turn of [.03,-.03,.06,-.06,.12,-.12,.24,-.24]){
   bones.forEach((b,i)=>{b.quaternion.copy(seedPose[i]);b.position.copy(seedPositions[i])});actor.holder.updateMatrixWorld(true);
   const world=bones[2].getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromAxisAngle(axis,turn)),parent=bones[2].parent.getWorldQuaternion(new T.Quaternion());
   const desired=parent.invert().multiply(world).normalize();bones[2].quaternion.copy(originals[2]).rotateTowards(desired,maxAngle);actor.holder.updateMatrixWorld(true);
   const ts=triangles(),candidate={gap:nearest(ball,ts).distance-radius,floor:floor(ts),correction:bones[2].getWorldPosition(new T.Vector3()).distanceTo(ankle),jointAngle:Math.max(...bones.map((b,i)=>b.quaternion.angleTo(originals[i])))};
   if(candidate.floor>=Math.min(0,initialFloor)-1e-5&&candidate.correction<=maxCorrection+1e-5&&candidate.jointAngle<=maxAngle+1e-6&&candidate.gap>best.gap+1e-6){best=candidate;bestPose=bones.map(b=>b.quaternion.clone());bestPositions=bones.map(b=>b.position.clone());}
   if(best.gap>=margin)break orientations;
  }
 }
 // Last resort: bounded coordinate descent on the captured leg pose.
 // Analytic translation + ankle-only correction can get stuck when the ball
 // sits between the toe and instep. All joints are still checked against the
 // ORIGINAL capture, so iterations cannot accumulate beyond the IK budgets.
 if(best.gap< -1e-5){
  descent: for(const step of [.04,.02,.01,.005,.0025,.00125])for(let iteration=0;iteration<8;iteration++){
   const seedPose=bestPose.map(q=>q.clone()),seedPositions=bestPositions.map(p=>p.clone()),previousGap=best.gap;
   for(let joint=0;joint<bones.length;joint++)for(const axis of [new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1)])for(const turn of [step,-step]){
    bones.forEach((b,i)=>{b.quaternion.copy(seedPose[i]);b.position.copy(seedPositions[i])});bones[joint].quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis,turn)).normalize();
    if(bones[joint].quaternion.angleTo(originals[joint])>maxAngle+1e-7)continue;
    actor.holder.updateMatrixWorld(true);const correction=bones[2].getWorldPosition(new T.Vector3()).distanceTo(ankle);if(correction>maxCorrection+1e-7)continue;
    const ts=triangles(),lowest=floor(ts);if(lowest<Math.min(0,initialFloor)-1e-5)continue;
    const gap=nearest(ball,ts).distance-radius;if(gap>best.gap+1e-6){best={gap,floor:lowest,correction,jointAngle:Math.max(...bones.map((b,i)=>b.quaternion.angleTo(originals[i])))};bestPose=bones.map(b=>b.quaternion.clone());bestPositions=bones.map(b=>b.position.clone());}
   }
   if(best.gap>=margin)break descent;
   if(best.gap<=previousGap+1e-6)break;
  }
 }
 bones.forEach((b,i)=>{b.quaternion.copy(bestPose[i]);b.position.copy(bestPositions[i])});actor.holder.updateMatrixWorld(true);actor.root.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
 return {...best,rawGap:hit.distance-radius,applied:best.correction>1e-6||best.jointAngle>1e-6,limited:best.gap<-.003};
}
