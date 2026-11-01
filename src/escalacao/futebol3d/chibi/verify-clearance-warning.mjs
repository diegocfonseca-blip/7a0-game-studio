import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
function headIntersection(a,b){
 const geometries=[a,b].map(actor=>{const triangles=actor.surface.triangles('head'),values=new Float32Array(triangles.length*9);let i=0;for(const t of triangles)for(const p of[t.a,t.b,t.c]){values[i++]=p.x;values[i++]=p.y;values[i++]=p.z}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(values,3));return g});
 const tree=new MeshBVH(geometries[0]);geometries[1].boundsTree=new MeshBVH(geometries[1]);const intersects=tree.intersectsGeometry(geometries[1],new T.Matrix4());
 geometries.forEach(g=>g.dispose());return{intersects};
}
export const headSurfacesIntersect=(a,b)=>headIntersection(a,b).intersects;
/** A recovery envelope reserves arm-swing room; overlap alone is not a body
 * penetration. Preserve the warning and verify the actual animated head mesh.
 * This routine does not move either athlete or change collision tolerances. */
export function verifyClearanceWarnings(actors,diagnostics){
 const final=diagnostics?.final;if(!final?.unresolved?.length)return;
 const boxes=new Map(),box=a=>{if(!boxes.has(a.key)){const b=new T.Box3();for(const t of a.surface.triangles('head'))b.expandByPoint(t.a).expandByPoint(t.b).expandByPoint(t.c);boxes.set(a.key,b)}return boxes.get(a.key)};
 const unresolved=[],clearanceWarnings=[];
 for(const warning of final.unresolved){const a=actors.find(p=>p.key===warning.a),b=actors.find(p=>p.key===warning.b);if(!a||!b){unresolved.push(warning);continue}
  const rootDistance=Math.hypot(a.holder.position.x-b.holder.position.x,a.holder.position.z-b.holder.position.z),aa=box(a),bb=box(b);
  if(rootDistance>=.37&&!aa.isEmpty()&&!bb.isEmpty()){
   const disjoint=!aa.intersectsBox(bb),mesh=disjoint?null:headIntersection(a,b);
   if(disjoint||!mesh.intersects){clearanceWarnings.push({...warning,rootDistance,headBoundsDisjoint:disjoint,headTrianglesDisjoint:!!mesh&&!mesh.intersects,headMeshDistance:mesh?.distance,verification:mesh?'animated-head-triangle-bvh-and-body-distance':'animated-head-bounds-and-body-distance'});continue}
  }
  unresolved.push(warning);
 }
 final.proxyUnresolved=final.unresolved;final.clearanceWarnings=clearanceWarnings;final.unresolved=unresolved;final.actualMeshVerification=true;
}
