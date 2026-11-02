import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {MATCHDAY_STALLS} from './cidade3d/matchday-plan.mjs'

/** Temporary match-day furniture. Shared materials, no cloth physics, shops,
 * purchases or construction granted to the club. */
export function criarPropsDiaJogo(parent:THREE.Object3D,floor:(x:number,z:number)=>number){
 const root=new THREE.Group();root.name='matchday-street-stalls';parent.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
 const mat=(color:string,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.5:.88});materials.add(m);return m}
 const merchMaterials:THREE.MeshStandardMaterial[]=[]
 const steel=mat('#6c7370',.65),dark=mat('#252c29'),white=mat('#e8e8dd'),wood=mat('#90613c'),bread=mat('#d3a75e'),meat=mat('#763f27'),red=mat('#a72d23'),ice=mat('#c9e4e4'),amber=mat('#8c742e')
 const geo=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g}
 const box=(g:THREE.Group,m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{const o=new THREE.Mesh(geo(new THREE.BoxGeometry(w,h,d)),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o}
 const rod=(g:THREE.Group,m:THREE.Material,x:number,y:number,z:number,r:number,h:number)=>{const o=new THREE.Mesh(geo(new THREE.CylinderGeometry(r,r,h,8)),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o}
 const sign=(g:THREE.Group,text:string,color:string,y:number,width:number,animated=false)=>{
  const cv=document.createElement('canvas');cv.width=1024;cv.height=192;const ctx=cv.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,1024,192);ctx.fillStyle='#fff9e9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 96px sans-serif';ctx.fillText(text,512,98,980)
  const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);const material=new THREE.MeshStandardMaterial({map:texture,roughness:.9,side:THREE.DoubleSide});materials.add(material)
  const o=new THREE.Mesh(geo(new THREE.PlaneGeometry(width,width*192/1024)),material);o.position.set(0,y,.83);o.userData.matchdayAnimated=animated;g.add(o);return o
 }
 const smoke:THREE.InstancedMesh[]=[],covers:{id:string;roof:THREE.Mesh;poles:THREE.Mesh[];sign:THREE.Mesh}[]=[],lids:THREE.Mesh[]=[]
 const stalls=MATCHDAY_STALLS.map(spec=>{
  const group=new THREE.Group();group.name='matchday-stall-'+spec.id;group.position.set(spec.x,floor(spec.x,spec.z),spec.z);if(spec.side==='away')group.rotation.y=Math.PI/2;root.add(group)
  const paint=mat(spec.color)
  if(spec.kind==='cooler'){
   box(group,white,0,.43,0,.92,.7,.65);box(group,steel,0,.10,0,.95,.06,.67)
   const lid=box(group,white,0,.89,-.24,.94,.08,.68);lid.rotation.x=-.95;lids.push(lid);lid.userData.matchdayAnimated=true
   box(group,ice,0,.78,0,.72,.025,.5)
   for(let i=0;i<6;i++){const x=(i%3-1)*.21,z=(Math.floor(i/3)-.5)*.24;rod(group,i<2?ice:i<4?red:amber,x,.87,z,.06,.22);rod(group,white,x,1.0,z,.035,.035)}
   sign(group,spec.label,spec.color,1.4,2.6)
  }else{
   box(group,paint,0,.68,0,1.9,.64,.94);box(group,steel,0,1.04,0,2.1,.11,1.05)
   for(const side of [-1,1]){const wheel=new THREE.Mesh(geo(new THREE.CylinderGeometry(.22,.22,.12,12)),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.94,.23,0);group.add(wheel);wheel.castShadow=true}
   const poles:THREE.Mesh[]=[];for(const x of [-1.08,1.08])for(const z of [-.65,.65]){const pole=rod(group,wood,x,1.5,z,.035,2.7);pole.userData.matchdayAnimated=true;poles.push(pole)}
   // A simple pitched, slightly uneven tarpaulin on the temporary stand.
   const v=[-1.4,2.5,-.95,1.4,2.54,-.95,-1.4,2.85,0,1.4,2.82,0,-1.4,2.5,.95,1.4,2.52,.95];const roof=geo(new THREE.BufferGeometry());roof.setAttribute('position',new THREE.Float32BufferAttribute(v,3));roof.setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);roof.computeVertexNormals();paint.side=THREE.DoubleSide;const tarp=new THREE.Mesh(roof,paint);tarp.castShadow=true;tarp.userData.matchdayAnimated=true;group.add(tarp)
   const board=sign(group,spec.label,spec.color,2.35,2.55,true);covers.push({id:spec.id,roof:tarp,poles,sign:board})
   if(spec.kind==='shirts'||spec.kind==='caps'){
    const colors=['#ededdf','#b8382b','#e5ba31'];const clothing=colors.map(c=>{const m=mat(c);merchMaterials.push(m);return m})
    if(spec.kind==='shirts'){
     const shape=new THREE.Shape();for(const [i,p]of [[-.28,.45],[-.60,.22],[-.46,.02],[-.30,.14],[-.30,-.45],[.30,-.45],[.30,.14],[.46,.02],[.60,.22],[.28,.45],[.12,.37],[-.12,.37]].entries()){if(i===0)shape.moveTo(p[0],p[1]);else shape.lineTo(p[0],p[1])}shape.closePath();const geometry=geo(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}));const bar=rod(group,steel,0,2.17,-.15,.022,1.95);bar.rotation.z=Math.PI/2
     for(let i=0;i<3;i++){const jersey=new THREE.Mesh(geometry,clothing[i]);jersey.position.set((i-1)*.67,1.78,-.15);jersey.scale.setScalar(.55);jersey.castShadow=true;group.add(jersey)}
    }else for(let i=0;i<6;i++){const x=(i%3-1)*.53,z=(Math.floor(i/3)-.5)*.35;const cap=new THREE.Mesh(geo(new THREE.SphereGeometry(.18,10,6,0,Math.PI*2,0,Math.PI/2)),clothing[i%3]);cap.position.set(x,1.10,z);group.add(cap);const bill=new THREE.Mesh(geo(new THREE.SphereGeometry(1,10,4)),clothing[i%3]);bill.scale.set(.18,.02,.16);bill.position.set(x,1.11,z+.18);group.add(bill)}
   }else if(spec.kind==='grill'){
    box(group,dark,0,1.17,0,1.5,.18,.65)
    for(let i=0;i<9;i++)rod(group,red,(i%5-2)*.20,1.27,(Math.floor(i/5)-.5)*.22,.065,.035)
    for(let i=0;i<9;i++){const bar=rod(group,steel,(i-4)*.16,1.31,0,.009,.66);bar.rotation.x=Math.PI/2}
    for(let i=0;i<5;i++){const skewer=rod(group,wood,(i-2)*.24,1.36,.12,.009,.88);skewer.rotation.x=Math.PI/2;for(let j=0;j<3;j++)box(group,meat,(i-2)*.24,1.37,(j-1)*.15,.12,.11,.12)}
    const material=new THREE.MeshBasicMaterial({color:'#dedbd2',transparent:true,opacity:.13,depthWrite:false});materials.add(material);const cloud=new THREE.InstancedMesh(geo(new THREE.SphereGeometry(.12,6,4)),material,10);cloud.frustumCulled=false;group.add(cloud);cloud.userData.stallId=spec.id;smoke.push(cloud)
   }else{
    box(group,steel,-.43,1.22,0,.68,.28,.62);const tray=box(group,ice,.48,1.27,0,.68,.38,.62);(tray.material as THREE.MeshStandardMaterial).transparent=true;(tray.material as THREE.MeshStandardMaterial).opacity=.52
    for(let i=0;i<4;i++){const bun=new THREE.Mesh(geo(new THREE.CapsuleGeometry(.065,.20,2,8)),bread);bun.rotation.x=Math.PI/2;bun.position.set(.48,1.12,(i-1.5)*.13);group.add(bun)}
   }
   group.userData.complexoLights=[{id:spec.id+'-balcao',kind:'entrance',position:[0,2.22,.6],target:[0,1,0],color:'#ffe2ab',intensity:24,distance:5,angle:1.0}]
   box(group,white,0,2.2,.1,.48,.045,.18).material=mat('#e9d3a3')
  }
  // A bin outside the service position keeps entrances and queues clear.
  rod(group,dark,1.7,.3,-.45,.22,.6)
  const service=group.localToWorld(new THREE.Vector3(0,0,1.25)),vendor=group.localToWorld(new THREE.Vector3(0,0,-1.1));return{...spec,group,service:{x:service.x,y:service.y,z:service.z},vendor:{x:vendor.x,y:vendor.y,z:vendor.z}}
 })
 for(const spec of [{x:-8,z:104,heading:0,text:'MANDANTES · ENTRADA',color:'#215942'},{x:113,z:14,heading:Math.PI/2,text:'VISITANTES · LATERAL',color:'#8d382d'}]){const g=new THREE.Group();g.position.set(spec.x,floor(spec.x,spec.z),spec.z);g.rotation.y=spec.heading;root.add(g);for(const x of [-1.35,1.35])rod(g,steel,x,1.2,0,.035,2.4);sign(g,spec.text,spec.color,2.22,3.5)}
 const barrier=new THREE.Group();root.add(barrier)
 const rail=(a:THREE.Vector3,b:THREE.Vector3)=>{const length=a.distanceTo(b),mesh=new THREE.Mesh(geo(new THREE.CylinderGeometry(.018,.018,length,6)),steel);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());barrier.add(mesh)}
 for(const x of [-5.2,5.2]){for(const z of [90,94,98,102])rod(barrier,steel,x,floor(x,z)+.50,z,.035,1);rail(new THREE.Vector3(x,floor(x,90)+.88,90),new THREE.Vector3(x,floor(x,102)+.88,102))}
 // Merge fixed stand parts by material, independently per property. No shared
 // geometry/material is destroyed until this controller is disposed.
 for(const stall of stalls){const groups=new Map<THREE.Material,THREE.BufferGeometry[]>();stall.group.updateMatrix();for(const child of [...stall.group.children]){if(!(child instanceof THREE.Mesh)||child instanceof THREE.InstancedMesh||child.userData.matchdayAnimated||Array.isArray(child.material))continue;child.updateMatrix();const g=child.geometry.clone().applyMatrix4(child.matrix);if(!g.getAttribute('uv'))g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));const list=groups.get(child.material)??[];list.push(g);groups.set(child.material,list);child.removeFromParent()}for(const [material,pieces]of groups){const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(geometry){geometries.add(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;stall.group.add(mesh)}}}
 const dummy=new THREE.Object3D()
 return{root,stalls,setClubColors(colors:readonly string[]){merchMaterials.forEach((m,i)=>m.color.set(colors[i%Math.max(1,colors.length)]??'#e5e2d4'))},update(seconds:number,work?:{setup:number;pack:number},deliveries?:ReadonlyMap<string,{setup:number;visible:boolean}>){const deployment=work?Math.max(0,Math.min(1,work.setup*(1-work.pack))):1;for(const stall of stalls){const f=deliveries?.get(stall.id);stall.group.visible=f?.visible??true}for(const c of covers){const deployment=deliveries?.get(c.id)?.setup??(work?Math.max(0,Math.min(1,work.setup*(1-work.pack))):1);c.roof.position.y=-1.35*(1-deployment);c.sign.position.y=2.35-1.35*(1-deployment);for(const p of c.poles){const h=1.35+1.35*deployment;p.scale.y=h/2.7;p.position.y=.15+h/2}}for(const l of lids)l.rotation.x=-.95*deployment;for(const c of smoke)c.visible=(deliveries?.get(c.userData.stallId)?.setup??deployment)>.95;for(const cloud of smoke)for(let i=0;i<10;i++){const t=(seconds*.32+i*.107)%1;dummy.position.set(Math.sin(seconds*.4+i)*t*.32,1.55+t*1.8,Math.cos(i+seconds*.25)*t*.28);dummy.scale.setScalar(.5+t*1.4);dummy.updateMatrix();cloud.setMatrixAt(i,dummy.matrix);cloud.instanceMatrix.needsUpdate=true}},
  dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
}
