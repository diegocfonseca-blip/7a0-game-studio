import * as T from 'three';
/** One instanced draw for subtle sole shadows. Shared texture/material per
 * match; no light, stadium or body material is changed. */
export function groundContactShadows(scene,count){
 const size=32,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;data.set([255,255,255,Math.round(255*Math.pow(Math.max(0,1-r),1.5))],i)}
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.needsUpdate=true;texture.magFilter=texture.minFilter=T.LinearFilter;
 const geometry=new T.PlaneGeometry(1,1),material=new T.MeshBasicMaterial({color:0xffffff,map:texture,transparent:true,opacity:.20,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vColor.r; diffuseColor.rgb = vec3(0.045,0.07,0.035);')};material.customProgramCacheKey=()=> 'football-sole-contact-v1';
 const mesh=new T.InstancedMesh(geometry,material,count*2),matrix=new T.Matrix4(),rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),position=new T.Vector3(),scale=new T.Vector3(.36,.24,1),color=new T.Color();mesh.name='football-soft-sole-shadows';mesh.frustumCulled=false;mesh.renderOrder=1;
 for(let i=0;i<count*2;i++){matrix.makeScale(0,0,0);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.setScalar(0))}scene.add(mesh);
 return{update(actors){actors.forEach((a,i)=>{for(const [j,side]of ['left','right'].entries()){const bone=a.bones.get(side==='left'?'foot_l':'foot_r'),floor=a.groundingReport?.contacts.find(c=>c.side===side)?.floor??.2,opacity=a.holder.visible?T.MathUtils.clamp(1-Math.max(0,floor-.006)/.14,0,1):0;bone.getWorldPosition(position);position.y=.007;matrix.compose(position,rotation,scale);mesh.setMatrixAt(i*2+j,matrix);mesh.setColorAt(i*2+j,color.setScalar(opacity))}});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;},dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();texture.dispose();mesh.dispose();}};
}
