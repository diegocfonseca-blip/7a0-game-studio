import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {customerJourney,type CityPoint} from './cidade3d/activity-route.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {pregameFrame} from './cidade3d/pregame-plan.mjs'
import type {StadiumDayFrame} from './cidade3d/stadium-day.mjs'
import {PLANTA_COMPLEXO,type EstadoComplexo} from './presidencia-complexo-model'
import type {AcessoAssentoComplexo} from './presidencia-complexo-arquitetura'

/** Local pregame stage dressing. Uses the existing civilian Walk/Idle clips;
 * chores have no hand-action capture, so tools stay on the ground/stands.
 * No access to fixture generation, tickets, purchases or club inventory. */
export function criarPreparacaoEstadio(scene:THREE.Scene,state:EstadoComplexo,accesses:readonly AcessoAssentoComplexo[],onReady:()=>void){
 const root=new THREE.Group();root.name='stadium-pregame-preparation';root.visible=false;scene.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
 const mat=(color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.85});materials.add(m);return m}
 const dark=mat('#26343b'),yellow=mat('#e5ab35'),white=mat('#dedbcc'),green=mat('#47835d'),orange=mat('#d06e2b')
 const box=(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);geometries.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 const rod=(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r=.025,m:THREE.Material=dark)=>{const g=new THREE.CylinderGeometry(r,r,a.distanceTo(b),6);geometries.add(g);const o=new THREE.Mesh(g,m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());o.castShadow=true;parent.add(o);return o}
 const floors:THREE.Mesh[]=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica','complexo-campo'])scene.getObjectByName(name)?.traverse(o=>{if(o instanceof THREE.Mesh&&!(o instanceof THREE.SkinnedMesh)&&!(o instanceof THREE.InstancedMesh))floors.push(o)});scene.updateMatrixWorld(true)
 const ray=new THREE.Raycaster(),normal=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0),cache=new Map<string,number>()
 const floor=(x:number,z:number)=>{const key=x+':'+z;if(cache.has(key))return cache.get(key)!;ray.set(new THREE.Vector3(x,.6,z),down);ray.far=1;const hit=ray.intersectObjects(floors,false).find(h=>h.point.y<.27&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5);const y=hit?.point.y??-.02;cache.set(key,y);return y}
 const point=(x:number,z:number):CityPoint=>({x,y:floor(x,z)+.003,z})
 type Person={id:string;role:string;body:ReturnType<typeof createCivilian>;path:ReturnType<typeof customerJourney>;start:number;end:number;heading?:number;prop?:THREE.Group;flash?:THREE.Mesh;ready:boolean;visible:boolean;task:string}
 const people:Person[]=[]
 function person(id:string,role:string,points:CityPoint[],start:number,end:number,color:string,variant='adult-man',task=role,wait=2,stay=8){
  const body=createCivilian(root,{id:'pregame-'+id,variant,outfitColor:color,onReady}),p:Person={id,role,body,path:customerJourney(points,{speed:.8,wait,stay,turnAtExit:true}),start,end,ready:false,visible:false,task};body.ready.then(ok=>{p.ready=ok});people.push(p);return p
 }
 // Staff work on existing horizontal landings, never seat tops or invented stairs.
 for(const [i,side]of (['home','away'] as const).entries()){
  const access=accesses.find(a=>a.side===side&&a.seat.tier==='lower'&&a.seat.row>=5)
  const landing=access?.surfaces.filter(s=>s.y>1&&s.polygon.length>=4).find(s=>{const p=s.polygon;return Math.hypot(p[1].x-p[0].x,p[1].z-p[0].z)>.8})
  if(!landing)continue
  const c=landing.polygon.reduce((a,p)=>({x:a.x+p.x/landing.polygon.length,z:a.z+p.z/landing.polygon.length}),{x:0,z:0}),edge=landing.polygon[1],near=landing.polygon[0],dx=edge.x-near.x,dz=edge.z-near.z,len=Math.hypot(dx,dz),y=landing.y+.003
  const a={x:c.x-dx/len*.3,y,z:c.z-dz/len*.3},b={x:c.x+dx/len*.3,y,z:c.z+dz/len*.3};const cleaner=person('stand-'+side,'stands-cleaner',[a,b],0,18,'#529379',i?'adult-man':'adult-woman','Limpeza da arquibancada',.5,2)
  // Supply bin and broom rest on the measured landing; no fake sweeping clip.
  box(root,.24,.35,.24,c.x-dx/len*.55,y+.175,c.z-dz/len*.55,green)
  rod(root,new THREE.Vector3(c.x-dx/len*.5,y+.05,c.z-dz/len*.5),new THREE.Vector3(c.x-dx/len*.5,y+1.15,c.z-dz/len*.5),.018,yellow)
  box(root,.22,.06,.10,c.x-dx/len*.5,y+.03,c.z-dz/len*.5,dark)
  const paper=box(root,.14,.012,.10,b.x,y+.012,b.z,white);paper.userData.pregameCollectedAt=cleaner.path.inbound.duration+.5
 }
 person('surface','groundskeeper',[point(-18,-36),point(-18,-31)],0,60,'#658d47','adult-man',state.progress.grama>0?'Inspeção do gramado':'Inspeção do campo de terra',.5,3)
 person('equipment','equipment-check',[point(42,38.2),point(40.2,38.2)],1,60,'#3c708b','adult-woman','Conferência de equipamentos',1,9)
 if(state.floodlit)for(const [i,x]of [-72,72].entries())person('lights-'+i,'lighting-check',[point(x,-56),point(x,-53.6)],0,45,'#bd9d3c',i?'adult-woman':'older-man','Verificação de iluminação',1,10)
 if(state.extras.chopp){const door=PLANTA_COMPLEXO.doors.chopp,a=point(door.approach.x,door.approach.z),b=point(door.threshold.x,door.threshold.z);person('bar','bar-restock',[a,b],0,50,'#a47750','adult-man','Abastecimento do bar comprado',1,10);const supplies=new THREE.Group();supplies.name='pregame-bar-supplies';supplies.position.set(a.x,a.y,a.z);root.add(supplies);box(supplies,.65,.12,.5,0,.1,0,dark);for(let i=0;i<2;i++)box(supplies,.5,.28,.4,0,.3+i*.29,0,orange);rod(supplies,new THREE.Vector3(0,.2,-.25),new THREE.Vector3(0,1,-.25));}
 for(const [i,p]of [{x:-9,z:118},{x:126,z:22}].entries()){
  const officer=person('police-'+i,'street-police',[point(p.x,p.z),point(p.x+1.5,p.z)],18,Infinity,'#334b6b',i?'adult-woman':'adult-man','Organização da circulação',2,20);officer.heading=i?-Math.PI/2:Math.PI
  for(const dx of [-1,3]){const g=new THREE.ConeGeometry(.16,.5,8);geometries.add(g);const cone=new THREE.Mesh(g,orange);cone.position.set(p.x+dx,floor(p.x+dx,p.z)+.25,p.z+1.5);root.add(cone)}
 }
 // Press and onlookers remain OUTSIDE the west service corridor, behind its cordon.
 for(let i=0;i<2;i++){
  const p=person('press-'+i,'photographer',[point(-102-i*2,3.5),point(-102-i*2,4.4)],75,Infinity,'#575b65',i?'adult-woman':'adult-man','Registro da chegada das delegações',.5,86400)
  const tripod=new THREE.Group();tripod.name='arrival-tripod-'+i;root.add(tripod);p.prop=tripod
  for(let leg=0;leg<3;leg++){const a=leg*Math.PI*2/3;rod(tripod,new THREE.Vector3(Math.sin(a)*.33,0,Math.cos(a)*.33),new THREE.Vector3(0,1.12,0),.018)}
  box(tripod,.24,.19,.3,0,1.25,0,dark);box(tripod,.12,.12,.1,0,1.25,.19,dark);p.flash=box(tripod,.1,.06,.03,0,1.43,.16,white);p.flash.visible=false
 }
 for(let i=0;i<3;i++){const p=person('idol-fan-'+i,'idol-onlooker',[point(-106-i*.9,17),point(-103-i*1.4,8+i*1.6)],65,Infinity,i%2?'#b83630':'#d9dfdb',i===1?'adult-woman':i===2?'child-boy':'adult-man','Torcedor observando atrás do isolamento',.5,86400);p.heading=Math.PI/2}
 const watering=new THREE.Group();watering.name='temporary-ground-watering';root.add(watering)
 const waterMaterial=new THREE.MeshBasicMaterial({color:'#a9d9ee',transparent:true,opacity:.55,depthWrite:false});materials.add(waterMaterial)
 const waterGeometry=new THREE.SphereGeometry(.022,4,3);geometries.add(waterGeometry)
 const water=new THREE.InstancedMesh(waterGeometry,waterMaterial,24),droplet=new THREE.Object3D();water.frustumCulled=false;watering.add(water)
 const nozzle=point(-18,-32);watering.position.set(nozzle.x,nozzle.y,nozzle.z)
 rod(watering,new THREE.Vector3(0,.02,-4),new THREE.Vector3(0,.02,0),.023,dark);rod(watering,new THREE.Vector3(0,0,0),new THREE.Vector3(0,.18,0),.035,green)
 let lastElapsed=-1
 let day:StadiumDayFrame|undefined,mobile=false,supporters=0,coachVisible=false,coachDoor=false,focus=new THREE.Vector3(-94,1.5,-14),flashCount=0,lastFlash=-1,key=''
 function configure(input:{day?:StadiumDayFrame;mobile:boolean;supporters:number;coaches:{visible:boolean;position:number[];doorOpening:number}[]}){day=input.day;mobile=input.mobile;supporters=input.supporters;const coach=input.coaches.find(c=>c.visible);coachVisible=!!coach;coachDoor=!!coach&&coach.doorOpening>.5;if(coach)focus.set(coach.position[0],1.5,coach.position[2]);if(day?.key!==key){key=day?.key??'';flashCount=0;lastFlash=-1}}
 function update(seconds:number,camera?:THREE.Camera,height=720){
  const frame=pregameFrame(day);root.visible=frame.active;if(!frame.active)return;if(frame.elapsed<lastElapsed){flashCount=0;lastFlash=-1}lastElapsed=frame.elapsed
  for(const [index,p]of people.entries()){
   const t=frame.elapsed-p.start,cycle=p.path.period,local=t<0?0:Math.min(t,cycle),pose=p.path.at(local===cycle?cycle-1e-5:local)
   const watch=p.role==='photographer'||p.role==='idol-onlooker',work=p.role!=='street-police'&&!watch
   p.visible=t>=0&&frame.elapsed<p.end&&(!work||frame.operations)&&(!mobile||!['stand-away','lights-1','press-1','idol-fan-2'].includes(p.id))&&(p.role!=='idol-onlooker'||supporters>0)
   // Onlookers wait for the first coach; photographers continue documenting both.
   if(watch&&t>p.path.inbound.duration+.5&&pose.speed===0)pose.heading=Math.atan2(focus.x-pose.x,focus.z-pose.z)
   else if(p.heading!==undefined&&pose.speed===0)pose.heading=p.heading
   p.body.root.position.set(pose.x,pose.y,pose.z);p.body.root.rotation.y=pose.heading
   const lod=residentVisibility(p.body.root.position,1.76,camera,height);p.body.update({seconds,distance:pose.distance,speed:pose.speed,visible:p.visible&&lod.visible,detail:lod.detail})
   if(p.prop){p.prop.visible=p.visible&&lod.visible;p.prop.position.set(pose.x+.45,pose.y,pose.z+.55);p.prop.rotation.y=Math.atan2(focus.x-p.prop.position.x,focus.z-p.prop.position.z);if(p.flash){const tick=Math.floor(frame.elapsed*8),flashing=coachVisible&&coachDoor&&(tick+index*7)%29===0;p.flash.visible=flashing;if(flashing&&tick!==lastFlash){flashCount++;lastFlash=tick}}}
  }
  watering.visible=frame.operations&&state.progress.grama>0&&frame.elapsed>2&&frame.elapsed<18
  if(watering.visible)for(let i=0;i<24;i++){const u=(seconds*1.2+i/24)%1;droplet.position.set(u*3.2,.18+1.8*u*(1-u),u*2.4);droplet.scale.setScalar(.6+u*.6);droplet.updateMatrix();water.setMatrixAt(i,droplet.matrix)}water.instanceMatrix.needsUpdate=true
  // Nonhuman equipment is removed with the operations phase, not left on pitch.
  for(const o of root.children)if(o instanceof THREE.Mesh)o.visible=(frame.operations||o.geometry instanceof THREE.ConeGeometry&&frame.streets)&&(o.userData.pregameCollectedAt===undefined||frame.elapsed<o.userData.pregameCollectedAt)
  const supplies=root.getObjectByName('pregame-bar-supplies');if(supplies)supplies.visible=frame.operations
 }
 return{root,configure,update,inspect:()=>({stage:pregameFrame(day),paidBar:state.extras.chopp,lightingPurchased:state.floodlit,field:state.progress.grama>0?'grass':'dirt',watering:watering.visible,flashes:flashCount,people:people.map(p=>({id:p.id,role:p.role,task:p.task,ready:p.ready,visible:p.visible,rendered:p.body.root.visible,position:p.body.root.position.toArray(),entrance:p.role==='idol-onlooker'?'outside-cordon':'staff',clips:['Walk','Idle']})),provisional:['No sweeping, supply-handling or handheld-camera capture available; authored walking/idle and stationary equipment only.'],officialStateWrites:0}),dispose(){people.forEach(p=>p.body.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent()}}
}
