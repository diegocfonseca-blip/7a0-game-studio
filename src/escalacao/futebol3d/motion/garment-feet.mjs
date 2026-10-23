// Generated from scripts/animation-lab/garment-feet.mjs. Repackage after editing source.
import * as T from 'three';
// Collision queries use the visible skinned boots, not the covered body feet.
// No geometry/weights are edited. All changes are reversible on disposal.
export function attachGarmentFeet(actor,mesh,data){
 const faces={left:[],right:[]},used=new Set();
 for(let i=0;i<data.index.length;i+=3){const ids=data.index.slice(i,i+3);if(!ids.every(id=>data.part[id]===3))continue;
  const x=ids.reduce((v,id)=>v+data.position[id*3],0)/3;faces[x>0?'left':'right'].push(ids);ids.forEach(id=>used.add(id));
 }
 if(!faces.left.length||!faces.right.length)throw Error('Uniforme sem superfície das duas chuteiras');
 const originalTriangles=actor.footTriangles,originalGround=actor.ground;
 const point=id=>mesh.getVertexPosition(id,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
 actor.footTriangles=side=>{if(!faces[side])throw Error('Pé inválido');const points=new Map();return faces[side].map(ids=>new T.Triangle(...ids.map(id=>{if(!points.has(id))points.set(id,point(id));return points.get(id);})));};
 actor.ground=()=>{originalGround();mesh.updateMatrixWorld(true);const low=Math.min(...[...used].map(id=>point(id).y));if(low<0){actor.holder.position.y-=low;actor.holder.updateMatrixWorld(true);}};
 return {inspect:()=>({visibleBootSurface:true,triangles:{left:faces.left.length,right:faces.right.length},bodyChanged:false}),dispose(){actor.footTriangles=originalTriangles;actor.ground=originalGround;}};
}
