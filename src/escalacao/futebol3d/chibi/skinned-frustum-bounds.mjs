import * as T from 'three';
const cache=new WeakMap();
/** Every weighted vertex is a convex combination of points inside its bones'
 * influence spheres. Their union AABB therefore bounds all skinned vertices,
 * including poses not sampled during import. Pose/physics continue off camera. */
export function prepareSkinBounds(mesh){
 let radii=cache.get(mesh.geometry);
 if(!radii){radii=new Float32Array(mesh.skeleton.bones.length);const g=mesh.geometry,p=new T.Vector3();for(let i=0;i<g.attributes.position.count;i++)for(let k=0;k<4;k++){if(g.attributes.skinWeight.getComponent(i,k)<=0)continue;const j=g.attributes.skinIndex.getComponent(i,k);p.fromBufferAttribute(g.attributes.position,i).applyMatrix4(mesh.bindMatrix).applyMatrix4(mesh.skeleton.boneInverses[j]);radii[j]=Math.max(radii[j],p.length()+1e-5)}cache.set(g,radii)}
 const box=new T.Box3(),center=new T.Vector3(),extent=new T.Vector3(),inverse=new T.Matrix4();mesh.boundingSphere=new T.Sphere();mesh.frustumCulled=true;
 return()=>{box.makeEmpty();for(let i=0;i<radii.length;i++){if(!radii[i])continue;const matrix=mesh.skeleton.bones[i].matrixWorld,radius=radii[i]*matrix.getMaxScaleOnAxis();center.setFromMatrixPosition(matrix);extent.setScalar(radius);box.expandByPoint(center.clone().sub(extent));box.expandByPoint(center.clone().add(extent))}box.getBoundingSphere(mesh.boundingSphere);mesh.boundingSphere.radius+=.002;mesh.boundingSphere.applyMatrix4(inverse.copy(mesh.matrixWorld).invert());return mesh.boundingSphere};
}
