import * as T from 'three'
import {criarBibliotecaVeiculos,type Veiculo3D} from './veiculos-modelos-3d'
import {modeloVeiculo} from './veiculos-modelos'
import {PLANTA_VADICO} from './presidencia-complexo-concessionaria'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {carteiraPresidenciaValida,type PresidenciaCarteira} from './presidencia-economia'
import type {RuaComplexo} from './presidencia-complexo-ruas'
import {segmentoLivre} from './presidencia-estadio-navegacao'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import {caminhoPelasRuas,arredondarCaminho,viagemVeiculo,type PontoEntrega} from './veiculos-entrega-rota'
import {createCivilian} from './cidade3d/civilians.mjs'
import {activityRoute} from './cidade3d/activity-route.mjs'
import {acelerarRaios} from './presidencia-raio-rapido'

type Car={id:string;body:Veiculo3D;phase:'delivery'|'parked'|'blocked';trip?:ReturnType<typeof viagemVeiculo>;time:number;heading:number;slot:number;rider?:ReturnType<typeof createCivilian>;riderWalk?:ReturnType<typeof activityRoute>;arrival:number}
/** Presentation reacts ONLY to already-confirmed ownership changes. Never dispatches,
 * charges, changes the save schema, grants cars or repeats arrivals on save load. */
export function criarEntregasVeiculos(scene:T.Scene,environment:T.Object3D,solids:readonly SolidoEntorno[],enabled:boolean){
 const root=new T.Group();root.name='veiculos-do-usuario';scene.add(root)
 if(!enabled)return{root,sync(_wallet?:PresidenciaCarteira|null){return false},update(_seconds:number){},active:()=>false,inspect:()=>({enabled:false}),dispose(){root.removeFromParent()}}
 const library=criarBibliotecaVeiculos(),cars=new Map<string,Car>(),issues:{id:string;reason:string}[]=[]
 let initialized=false,last:number|undefined,revision=-1
 const roads=(environment.userData.roadNetwork?.streets??[]) as RuaComplexo[],surface:T.Mesh[]=[];environment.updateMatrixWorld(true);environment.traverse(o=>{if(o instanceof T.Mesh)surface.push(o)})
 acelerarRaios(surface)
 const ray=new T.Raycaster(),ground=(p:{x:number;z:number}):PontoEntrega=>{ray.set(new T.Vector3(p.x,2.4,p.z),new T.Vector3(0,-1,0));ray.far=4;const h=ray.intersectObjects(surface,false).find(h=>h.face&&h.face.normal.y>.8&&h.point.y<.5);return{...p,y:h?.point.y??0}}
 const parked=(c:Car)=>c.body.profile.kind==='car'?{x:HOME.garage.x-2.5+c.slot*3.2,z:HOME.garage.z,heading:Math.PI}:{x:HOME.garage.x+3.3,z:HOME.garage.z-2.4+c.slot*3.9,heading:-Math.PI/2}
 function path(c:Car){
  const end=parked(c),drive=PLANTA_VADICO.access.driveway,exit=drive[0],approach={x:HOME.x-18,z:HOME.z+34},street=caminhoPelasRuas(roads,exit,approach,80);if(!street){issues.push({id:c.id,reason:'Não há conexão viária comprovada entre a Vadico e a entrada da casa.'});return}
  const yard=[approach,{x:HOME.x-18,z:HOME.z+24},{x:HOME.x-18,z:HOME.z+11},{x:HOME.x-3,z:HOME.z+10},...(c.body.profile.kind==='car'?[{x:end.x,z:HOME.z+7}]:[{x:HOME.garage.x+8,z:HOME.z+7},{x:HOME.garage.x+8,z:end.z}]),end]
  const start={x:drive.at(-1)!.x-5,z:drive.at(-1)!.z-5.5},points=arredondarCaminho([start,...[...drive].reverse(),...street.slice(1),...yard.slice(1)],3)
  const obstacles=solids.filter(s=>s.top>.35&&s.base<2).map(s=>({id:s.id,polygon:s.footprint.map(p=>({x:p.x,y:p.z}))}))
  for(let i=1;i<points.length;i++)if(!segmentoLivre({x:points[i-1].x,y:points[i-1].z},{x:points[i].x,y:points[i].z},obstacles,c.body.profile.width/2+.08)){issues.push({id:c.id,reason:`Rota bloqueada no trecho ${i}; o veículo permanece na área de entrega.`});return}
  const sampled=points.flatMap((p,i)=>{if(!i)return[p];const a=points[i-1],n=Math.ceil(Math.hypot(p.x-a.x,p.z-a.z));return Array.from({length:n},(_,k)=>({x:a.x+(p.x-a.x)*(k+1)/n,z:a.z+(p.z-a.z)*(k+1)/n}))});return viagemVeiculo(sampled.map(ground),7)
 }
 function position(c:Car){const p=parked(c),g=ground(p);c.body.root.position.set(g.x,g.y,g.z);c.body.root.rotation.y=p.heading;c.heading=p.heading;c.body.update(0)}
 function sync(wallet?:PresidenciaCarteira|null){
  if(!enabled||!carteiraPresidenciaValida(wallet))return false
  const owned=wallet.owned.filter(b=>modeloVeiculo(b.id)),ids=new Set(owned.map(b=>b.id));let changed=false
  for(const[id,c]of cars)if(!ids.has(id as typeof owned[number]['id'])){c.rider?.dispose();c.body.dispose();cars.delete(id);changed=true}
  let carSlot=0,bikeSlot=0,queue=0
  for(const b of owned){const p=modeloVeiculo(b.id)!,slot=p.kind==='car'?carSlot++:bikeSlot++;const existing=cars.get(b.id);if(existing){existing.slot=slot;if(existing.phase==='parked')position(existing);continue}const body=library.create(b.id)!;root.add(body.root);const c:Car={id:b.id,body,phase:initialized?'delivery':'parked',time:-queue*2,heading:0,slot,arrival:0};cars.set(b.id,c);queue++;changed=true
   if(initialized){c.trip=path(c);if(c.trip){const first=c.trip.at(0);body.root.position.set(first.x,first.y,first.z);body.root.rotation.y=first.heading;c.heading=first.heading;if(p.kind==='bike'){c.rider=createCivilian(body.root,{id:'entrega-'+b.id,variant:'adult-man'});c.rider.root.scale.setScalar(.88);c.rider.root.position.y=.28}}else{c.phase='blocked';const d=PLANTA_VADICO.access.driveway.at(-1)!;body.root.position.set(d.x-5,d.y,d.z-5.5)}}else position(c)
  }
  initialized=true;revision=wallet.revision;return changed
 }
 function update(seconds:number){
  const dt=last===undefined?0:Math.max(0,Math.min(.1,seconds-last));last=seconds
  const traffic=scene.getObjectByName('complexo-circulacao')?.children.filter(o=>o.name.startsWith('complexo-carro-')&&o.visible)??[]
  for(const c of cars.values()){
   if(c.phase==='delivery'&&c.trip){const pose=c.trip.at(Math.max(0,c.time)),next=c.trip.at(Math.max(0,c.time+dt)),obstructed=[...traffic,...[...cars.values()].filter(o=>o!==c&&o.phase==='delivery'&&o.time>=0).map(o=>o.body.root)].some(o=>{const dx=o.position.x-pose.x,dz=o.position.z-pose.z,front=dx*Math.sin(pose.heading)+dz*Math.cos(pose.heading),side=Math.abs(dx*Math.cos(pose.heading)-dz*Math.sin(pose.heading));return front>0&&front<5.5&&side<1.5});if(!obstructed)c.time+=dt
    const p=obstructed?pose:next;c.body.root.position.set(p.x,p.y,p.z);const delta=Math.atan2(Math.sin(p.heading-c.heading),Math.cos(p.heading-c.heading)),steer=Math.atan(delta*c.body.profile.wheelbase/.8);c.heading=p.heading;c.body.root.rotation.y=p.heading;c.body.update(p.distance,steer);c.rider?.update({seconds,speed:0,distance:0,seated:1,visible:true,detail:'near'})
    if(p.done){c.phase='parked';c.arrival=seconds}
   }else if(c.phase==='parked'&&c.rider){const t=seconds-c.arrival,u=T.MathUtils.clamp(t/1.7,0,1);
    if(t<1.7){c.rider.root.position.set(.9*u,.28*(1-u),0);c.rider.update({seconds,speed:0,distance:0,seated:1-u,transition:'standing',visible:true,detail:'full'})}
    else{if(!c.riderWalk){c.rider.root.position.set(.9,0,0);root.attach(c.rider.root);const p=c.rider.root.position;c.riderWalk=activityRoute([{x:p.x,y:p.y,z:p.z},ground({x:p.x,z:HOME.garage.z+6.5}),ground({x:HOME.house.x-.9,z:HOME.garage.z+6.5}),{x:HOME.house.x-.9,y:.16,z:HOME.house.z+HOME.house.depth/2+.15}],1.15)}const p=c.riderWalk.at(t-1.7);c.rider.root.position.set(p.x,p.y,p.z);c.rider.root.rotation.y=p.heading;c.rider.update({seconds,speed:p.speed,distance:p.distance,visible:!p.done,detail:'full'});if(p.done){c.rider.dispose();c.rider=undefined}}
   }
  }
 }
 return{root,sync,update,active:()=>[...cars.values()].some(c=>c.phase==='delivery'||!!c.rider),inspect:()=>({source:'confirmed ownership only; read-only presentation',revision,active:[...cars.values()].filter(c=>c.phase==='delivery').length,issues:[...issues],vehicles:[...cars.values()].map(c=>({id:c.id,phase:c.phase,time:c.time,duration:c.trip?.duration,position:c.body.root.position.toArray(),distance:c.trip?.at(c.time).distance,wheelRotation:c.body.root.children[1]?.children[0]?.rotation.x,route:c.trip?.points})),geometry:library.inspect()}),dispose(){for(const c of cars.values()){c.rider?.dispose();c.body.dispose()}cars.clear();library.dispose();root.removeFromParent()}}
}
