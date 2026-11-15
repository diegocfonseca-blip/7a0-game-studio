import {planejarPasseioCarro,type TrechoPasseio,type SentidoPasseio} from './veiculos-passeio-planta'
import * as T from 'three'
import {criarBibliotecaVeiculos,type Veiculo3D} from './veiculos-modelos-3d'
import {modeloVeiculo} from './veiculos-modelos'
import {ENTREGA_VADICO_URBANA} from './presidencia-implantacao-urbana'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {carteiraPresidenciaValida,type PresidenciaCarteira} from './presidencia-economia'
import type {RuaComplexo} from './presidencia-complexo-ruas'
import {segmentoLivre} from './presidencia-estadio-navegacao'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import {caminhoPelasRuas,arredondarCaminho,viagemVeiculo,type PontoEntrega} from './veiculos-entrega-rota'
import {createCivilian} from './cidade3d/civilians.mjs'
import {activityRoute} from './cidade3d/activity-route.mjs'
import {acelerarRaios} from './presidencia-raio-rapido'

export type EstadoPasseioCarro={id:string;phase:'going-stadium'|'at-stadium'|'going-home';leg:number;time:number;slot:number}
type Car={id:string;body:Veiculo3D;phase:'delivery'|'parked'|'blocked'|'going-stadium'|'at-stadium'|'going-home';legs?:TrechoPasseio[];leg?:number;distanceBefore?:number;trip?:ReturnType<typeof viagemVeiculo>;time:number;heading:number;slot:number;rider?:ReturnType<typeof createCivilian>;riderWalk?:ReturnType<typeof activityRoute>;arrival:number}
/** Presentation reacts ONLY to already-confirmed ownership changes. Never dispatches,
 * charges, changes the save schema, grants cars or repeats arrivals on save load. */
export function criarEntregasVeiculos(scene:T.Scene,environment:T.Object3D,solids:readonly SolidoEntorno[],enabled:boolean,options:{parkingStage?:number;blockers?:()=>readonly {position:{x:number;z:number}}[]}={}){
 const root=new T.Group();root.name='veiculos-do-usuario';scene.add(root)
 type DriveResult={ok:true}|{ok:false;error:string}
 const noDrive=(_id:string,_direction:SentidoPasseio):DriveResult=>({ok:false,error:'unavailable'})
 const noCommute=()=>null as {id:string;phase:string;position:[number,number,number];heading:number;moving:boolean}|null
 if(!enabled)return{root,drive:noDrive,commute:noCommute,snapshotTrip:()=>null as EstadoPasseioCarro|null,restoreTrip:(_snapshot:EstadoPasseioCarro)=>false,sync(_wallet?:PresidenciaCarteira|null,_display?:readonly(string|null)[]){return false},update(_seconds:number){},active:()=>false,inspect:()=>({enabled:false}),dispose(){root.removeFromParent()}}
 const library=criarBibliotecaVeiculos(),cars=new Map<string,Car>(),issues:{id:string;reason:string}[]=[]
 let initialized=false,last:number|undefined,revision=-1,latestWallet:PresidenciaCarteira|undefined,latestDisplay:readonly(string|null)[]|undefined
 const roads=(environment.userData.roadNetwork?.streets??[]) as RuaComplexo[],surface:T.Mesh[]=[];environment.updateMatrixWorld(true);environment.traverse(o=>{if(o instanceof T.Mesh)surface.push(o)})
 acelerarRaios(surface)
 const ray=new T.Raycaster(),ground=(p:{x:number;z:number}):PontoEntrega=>{ray.set(new T.Vector3(p.x,2.4,p.z),new T.Vector3(0,-1,0));ray.far=4;const h=ray.intersectObjects(surface,false).find(h=>h.face&&h.face.normal.y>.8&&h.point.y<.5);return{...p,y:h?.point.y??0}}
 const parked=(c:Car)=>({x:HOME.garage.x+(c.slot%2===0?-2.1:2.1),z:HOME.garage.z+(c.slot>=2?9:0),heading:Math.PI})
 function path(c:Car){
  const end=parked(c),drive=ENTREGA_VADICO_URBANA.driveway,exit=drive[0],approach={x:HOME.garage.x,z:HOME.z+HOME.depth/2+9},street=caminhoPelasRuas(roads,exit,approach,80);if(!street){issues.push({id:c.id,reason:'Não há conexão viária comprovada entre a Vadico e a entrada da casa.'});return}
  const front=HOME.z+HOME.depth/2,side=HOME.garage.x+7.5
  const yard=[approach,{x:HOME.garage.x,z:front+1},{x:side,z:front-2},{x:side,z:end.z+4},{x:end.x,z:end.z+3},end]
  const start=ENTREGA_VADICO_URBANA.start,points=arredondarCaminho([start,...[...drive].reverse(),...street.slice(1),...yard.slice(1)],3)
  const obstacles=solids.filter(s=>s.top>.35&&s.base<2).map(s=>({id:s.id,polygon:s.footprint.map(p=>({x:p.x,y:p.z}))}))
  for(let i=1;i<points.length;i++)if(!segmentoLivre({x:points[i-1].x,y:points[i-1].z},{x:points[i].x,y:points[i].z},obstacles,c.body.profile.width/2+.08)){issues.push({id:c.id,reason:`Rota bloqueada no trecho ${i}; o veículo permanece na área de entrega.`});return}
  const sampled=points.flatMap((p,i)=>{if(!i)return[p];const a=points[i-1],n=Math.ceil(Math.hypot(p.x-a.x,p.z-a.z));return Array.from({length:n},(_,k)=>({x:a.x+(p.x-a.x)*(k+1)/n,z:a.z+(p.z-a.z)*(k+1)/n}))});return viagemVeiculo(sampled.map(ground),7)
 }
 function position(c:Car){const p=parked(c),g=ground(p);c.body.root.position.set(g.x,g.y,g.z);c.body.root.rotation.y=p.heading;c.heading=p.heading;c.body.update(0)}
 function sync(wallet?:PresidenciaCarteira|null,display?:readonly(string|null)[]){
  if(!enabled||!carteiraPresidenciaValida(wallet)){latestWallet=undefined;return false}
  latestWallet=wallet;latestDisplay=display
  const tripActive=!!commute()
  const owned=wallet.owned.filter(b=>modeloVeiculo(b.id)),ids=new Set(owned.map(b=>b.id));let changed=false
  for(const[id,c]of cars)if(!ids.has(id as typeof owned[number]['id'])){c.rider?.dispose();c.body.dispose();cars.delete(id);changed=true}
  let extraSlot=2,queue=0;const pair=display??owned.slice(0,2).map(b=>b.id)
  for(const b of owned){const p=modeloVeiculo(b.id)!,selected=pair.indexOf(b.id),slot=selected>=0?selected:extraSlot++;const existing=cars.get(b.id);if(existing){if(existing.slot!==slot&&!tripActive&&['parked','blocked'].includes(existing.phase)){existing.slot=slot;if(existing.phase==='parked')position(existing);changed=true}continue}const assigned=tripActive&&slot<2&&[...cars.values()].some(c=>c.slot===slot)?extraSlot++:slot;const body=library.create(b.id)!;root.add(body.root);const c:Car={id:b.id,body,phase:initialized?'delivery':'parked',time:-queue*2,heading:0,slot:assigned,arrival:0};cars.set(b.id,c);queue++;changed=true
   if(initialized){c.trip=path(c);if(c.trip){const first=c.trip.at(0);body.root.position.set(first.x,first.y,first.z);body.root.rotation.y=first.heading;c.heading=first.heading;if(p.kind==='bike'){c.rider=createCivilian(body.root,{id:'entrega-'+b.id,variant:'adult-man'});c.rider.root.scale.setScalar(.88);c.rider.root.position.y=.28}}else{c.phase='blocked';const d=ENTREGA_VADICO_URBANA.start;body.root.position.set(d.x,.16,d.z)}}else position(c)
  }
  initialized=true;revision=wallet.revision;return changed
 }
 function drive(id:string,direction:SentidoPasseio):DriveResult{
  const c=cars.get(id)
  if(!latestWallet||!latestWallet.owned.some(b=>b.id===id)||!c||c.body.profile.kind!=='car'||c.slot>=2)return{ok:false,error:'not-owned'}
  if([...cars.values()].some(o=>o!==c&&['going-stadium','at-stadium','going-home'].includes(o.phase)))return{ok:false,error:'busy'}
  if(direction==='stadium'?c.phase!=='parked':c.phase!=='at-stadium')return{ok:false,error:'busy'}
  const route=planejarPasseioCarro({car:c.body.profile,slot:c.slot,roads,solids,parkingStage:options.parkingStage??0,direction,ground})
  if(!route.ok)return route
  c.legs=route.legs;c.leg=0;c.distanceBefore=0;c.trip=route.legs[0].trip;c.time=0;c.phase=direction==='stadium'?'going-stadium':'going-home';last=undefined
  return{ok:true}
 }
 function commute(){const c=[...cars.values()].find(c=>['going-stadium','at-stadium','going-home'].includes(c.phase));return c?{id:c.id,phase:c.phase,position:c.body.root.position.toArray() as [number,number,number],heading:c.heading,moving:c.phase!=='at-stadium'}:null}
 function snapshotTrip():EstadoPasseioCarro|null{const c=[...cars.values()].find(c=>['going-stadium','at-stadium','going-home'].includes(c.phase));return c?{id:c.id,phase:c.phase as EstadoPasseioCarro['phase'],leg:c.leg??0,time:c.time,slot:c.slot}:null}
 function restoreTrip(snapshot:EstadoPasseioCarro){
  const c=cars.get(snapshot.id);if(!c||c.slot!==snapshot.slot||!drive(c.id,'stadium').ok)return false
  if(snapshot.phase!=='going-stadium'){
   const end=c.legs!.at(-1)!.trip.at(Infinity);c.body.root.position.set(end.x,end.y,end.z);c.heading=end.heading;c.body.root.rotation.y=end.heading;c.phase='at-stadium';c.legs=undefined;c.trip=undefined
   if(snapshot.phase==='at-stadium')return true
   if(!drive(c.id,'home').ok)return false
  }
  c.leg=Math.max(0,Math.min(c.legs!.length-1,Math.floor(snapshot.leg)));c.trip=c.legs![c.leg].trip;c.time=Math.max(0,Math.min(c.trip.duration,snapshot.time));c.distanceBefore=c.leg>0?-c.legs![0].trip.length:0
  const pose=c.trip.at(c.time);c.body.root.position.set(pose.x,pose.y,pose.z);c.heading=pose.heading+(c.legs![c.leg].reverse?Math.PI:0);c.body.root.rotation.y=c.heading;last=undefined;return true
 }
 function update(seconds:number){
  const dt=last===undefined?0:Math.max(0,Math.min(.1,seconds-last));last=seconds
  let returnedHome=false
  const traffic=scene.getObjectByName('complexo-circulacao')?.children.filter(o=>o.name.startsWith('complexo-carro-')&&o.visible)??[]
  for(const c of cars.values()){
   c.body.root.visible=c.phase==='delivery'?c.time>=0:c.slot<2
   if(['delivery','going-stadium','going-home'].includes(c.phase)&&c.trip){const pose=c.trip.at(Math.max(0,c.time)),next=c.trip.at(Math.max(0,c.time+dt)),obstructed=[...traffic,...(options.blockers?.()??[]),...[...cars.values()].filter(o=>o!==c&&o.phase==='delivery'&&o.time>=0).map(o=>o.body.root)].some(o=>{const dx=o.position.x-pose.x,dz=o.position.z-pose.z,front=dx*Math.sin(pose.heading)+dz*Math.cos(pose.heading),side=Math.abs(dx*Math.cos(pose.heading)-dz*Math.sin(pose.heading));return front>0&&front<9&&side<2.3});if(!obstructed)c.time+=dt
    const p=obstructed?pose:next;c.body.root.position.set(p.x,p.y,p.z);const reversing=c.legs?.[c.leg??0]?.reverse??false,heading=p.heading+(reversing?Math.PI:0),delta=Math.atan2(Math.sin(heading-c.heading),Math.cos(heading-c.heading)),steer=Math.atan(delta*c.body.profile.wheelbase/.8);c.heading=heading;c.body.root.rotation.y=heading;c.body.update((c.distanceBefore??0)+p.distance*(reversing?-1:1),steer);c.rider?.update({seconds,speed:0,distance:0,seated:1,visible:true,detail:'near'})
    if(p.done){
     if(c.legs&&(c.leg??0)+1<c.legs.length){c.distanceBefore=(c.distanceBefore??0)-c.trip.length;c.leg=(c.leg??0)+1;c.trip=c.legs[c.leg].trip;c.time=0}
     else{if(c.phase==='going-home')returnedHome=true;c.phase=c.phase==='going-stadium'?'at-stadium':'parked';c.arrival=seconds;c.legs=undefined;c.leg=undefined;c.distanceBefore=0}
    }
   }else if(c.phase==='parked'&&c.rider){const t=seconds-c.arrival,u=T.MathUtils.clamp(t/1.7,0,1);
    if(t<1.7){c.rider.root.position.set(.9*u,.28*(1-u),0);c.rider.update({seconds,speed:0,distance:0,seated:1-u,transition:'standing',visible:true,detail:'full'})}
    else{if(!c.riderWalk){c.rider.root.position.set(.9,0,0);root.attach(c.rider.root);const p=c.rider.root.position;c.riderWalk=activityRoute([{x:p.x,y:p.y,z:p.z},ground({x:p.x,z:HOME.garage.z+6.5}),ground({x:HOME.house.x-.9,z:HOME.garage.z+6.5}),{x:HOME.house.x-.9,y:.16,z:HOME.house.z+HOME.house.depth/2+.15}],1.15)}const p=c.riderWalk.at(t-1.7);c.rider.root.position.set(p.x,p.y,p.z);c.rider.root.rotation.y=p.heading;c.rider.update({seconds,speed:p.speed,distance:p.distance,visible:!p.done,detail:'full'});if(p.done){c.rider.dispose();c.rider=undefined}}
   }
  }
  if(returnedHome&&latestWallet)sync(latestWallet,latestDisplay)
 }
 return{root,sync,update,drive,commute,snapshotTrip,restoreTrip,active:()=>[...cars.values()].some(c=>['delivery','going-stadium','going-home'].includes(c.phase)||!!c.rider),inspect:()=>({source:'confirmed ownership only; read-only presentation',revision,active:[...cars.values()].filter(c=>c.phase==='delivery').length,issues:[...issues],vehicles:[...cars.values()].map(c=>({id:c.id,phase:c.phase,time:c.time,leg:c.leg,duration:c.trip?.duration,position:c.body.root.position.toArray(),distance:c.trip?.at(c.time).distance,wheelRotation:c.body.root.children[1]?.children[0]?.rotation.x,route:c.trip?.points})),geometry:library.inspect()}),dispose(){for(const c of cars.values()){c.rider?.dispose();c.body.dispose()}cars.clear();library.dispose();root.removeFromParent()}}
}
