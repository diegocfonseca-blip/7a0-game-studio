import * as T from 'three';
import {nearest} from './nearest.mjs';
import {solveLimbContact} from './contact-ik.mjs';

const layouts=new WeakMap();
const regions={right:/Right(Foot|Toe)/,left:/Left(Foot|Toe)/,head:/Head/,rightHand:/RightHand/,leftHand:/LeftHand/};
/** Surface probes use the supplied skinned mesh. No topology, weight, bind pose
 * or skeleton change. Indices are shared by the 22 clones. */
export function createMapRigSurface(actor){
 const mesh=actor.mesh,g=mesh.geometry;let layout=layouts.get(g);
 if(!layout){layout={};const idx=g.index,joints=g.attributes.skinIndex,weights=g.attributes.skinWeight;
  for(const [region,pattern]of Object.entries(regions)){const allowed=new Set(mesh.skeleton.bones.flatMap((b,i)=>pattern.test(b.name)?[i]:[]));
   const eligible=i=>{let w=0;for(let k=0;k<4;k++)if(allowed.has(joints.getComponent(i,k)))w+=weights.getComponent(i,k);return w>.65};
   const triangles=[];for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);if(eligible(a)&&eligible(b)&&eligible(c))triangles.push([a,b,c])}
   const indices=[...new Set(triangles.flat())],extrema=new Set();for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1]){if(!x&&!y&&!z)continue;let best=-Infinity,index=indices[0];for(const i of indices){const p=g.attributes.position,d=p.getX(i)*x+p.getY(i)*y+p.getZ(i)*z;if(d>best){best=d;index=i}}if(index!==undefined)extrema.add(index)}
   layout[region]={triangles,indices,extrema:[...extrema]};
  }layouts.set(g,layout);
 }
 function triangles(region){if(region==='feet')return [...triangles('right'),...triangles('left')];if(region==='hands')return [...triangles('rightHand'),...triangles('leftHand')];actor.holder.updateMatrixWorld(true);mesh.skeleton.update();const vertices=new Map(),vertex=i=>{let v=vertices.get(i);if(!v){v=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);vertices.set(i,v)}return v};return layout[region].triangles.map(ids=>new T.Triangle(...ids.map(vertex)))}
 function footBounds(exact=false){actor.holder.updateMatrixWorld(true);mesh.skeleton.update();const p=new T.Vector3(),result={};for(const region of ['left','right']){let floor=Infinity,top=-Infinity;for(const i of exact?layout[region].indices:layout[region].extrema){mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);floor=Math.min(floor,p.y);top=Math.max(top,p.y)}result[region]={floor,top}}return result}
 function floor(exact=false){const feet=footBounds(exact);return Math.min(feet.left.floor,feet.right.floor)}
 function probe(point,region){const ts=triangles(region),hit=nearest(point,ts);return{...hit,gap:hit.distance-.11,floor:Math.min(...ts.flatMap(t=>[t.a.y,t.b.y,t.c.y]))}}
 function anchor(region,origin,direction,{height=.11,radius=.11}={}){
  const ts=triangles(region),dir=direction.clone().setY(0).normalize(),point=origin.clone();let outer=.7,inner=null;
  const at=s=>{point.copy(origin).addScaledVector(dir,s);point.y=height;return nearest(point,ts).distance-radius};
  for(let s=.7;s>=-.45;s-=.025){if(at(s)<=0){inner=s;break}outer=s}
  if(inner===null)return{point:origin.clone().addScaledVector(dir,.17).setY(height),fitted:false};
  for(let i=0;i<15;i++){const mid=(inner+outer)/2;if(at(mid)>0)outer=mid;else inner=mid}at(outer);
  return{point:point.clone(),fitted:true};
 }
 function clearBall(ball,side,{maxCorrection=.10,maxAngle=.35}={}){
  const suffix=side==='left'?'Left':'Right',names=['UpLeg','Leg','Foot'].map(n=>'mixamorig'+suffix+n),bones=names.map(n=>actor.bones.get(n));
  const saved=bones.map(b=>b.quaternion.clone()),start=bones[2].getWorldPosition(new T.Vector3()),original=probe(ball,side);
  if(original.gap>=-.002)return{gap:original.gap,correction:0};
  let best=original.gap,bestPose=saved,amount=0;const away=start.clone().sub(ball).setY(0).normalize();
  for(const turn of [0,.55,-.55,1.1,-1.1]){
   bones.forEach((b,i)=>b.quaternion.copy(saved[i]));actor.holder.updateMatrixWorld(true);
   const d=away.clone().applyAxisAngle(new T.Vector3(0,1,0),turn).multiplyScalar(Math.min(maxCorrection,-original.gap+.008));
   solveLimbContact(actor,names,start.clone().add(d),{maxCorrection,maxAngle});const p=probe(ball,side),shift=bones[2].getWorldPosition(new T.Vector3()).distanceTo(start);
   if(p.gap>best&&p.floor>=Math.min(0,original.floor)-.001&&shift<=maxCorrection+.0001){best=p.gap;bestPose=bones.map(b=>b.quaternion.clone());amount=shift}if(best>=-.002)break;
  }
  bones.forEach((b,i)=>b.quaternion.copy(bestPose[i]));actor.holder.updateMatrixWorld(true);return{gap:best,rawGap:original.gap,correction:amount};
 }
 function clearHand(ball,side,{maxCorrection=.10,maxAngle=.35}={}){
  const suffix=side==='left'?'Left':'Right',region=side+'Hand',names=['Arm','ForeArm','Hand'].map(n=>'mixamorig'+suffix+n),bones=names.map(n=>actor.bones.get(n));
  const original=probe(ball,region);if(original.gap>=-.002)return{gap:original.gap,correction:0};
  const saved=bones.map(b=>b.quaternion.clone()),start=bones[2].getWorldPosition(new T.Vector3());
  // A finger can cross the centre of the sphere during a blend. In that case
  // the closest triangle normal can point into the palm, so test both the
  // surface and wrist directions and retain only an improving bounded pose.
  const normal=original.surface.clone().sub(ball).normalize(),wrist=start.clone().sub(ball).normalize();
  let best=original.gap,bestPose=saved,correction=0;
  for(const away of [normal,wrist,normal.clone().negate(),new T.Vector3(0,1,0)]){
   bones.forEach((b,i)=>b.quaternion.copy(saved[i]));actor.holder.updateMatrixWorld(true);
   const target=start.clone().addScaledVector(away,Math.min(maxCorrection,-original.gap+.004));
   solveLimbContact(actor,names,target,{maxCorrection,maxAngle});
   const result=probe(ball,region),shift=bones[2].getWorldPosition(new T.Vector3()).distanceTo(start);
   if(result.gap>best&&shift<=maxCorrection+.0001){best=result.gap;bestPose=bones.map(b=>b.quaternion.clone());correction=shift}if(best>=-.002)break;
  }
  bones.forEach((b,i)=>b.quaternion.copy(bestPose[i]));actor.holder.updateMatrixWorld(true);return{gap:best,correction};
 }
 return{triangles,probe,anchor,clearBall,clearHand,floor,footBounds};
}
