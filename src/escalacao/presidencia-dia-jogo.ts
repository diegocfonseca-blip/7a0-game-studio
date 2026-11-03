import {vendorDelivery} from './cidade3d/vendor-delivery.mjs'
import {acelerarRaios} from './presidencia-raio-rapido'
import {criarPeruasAmbulantes} from './presidencia-perua-ambulante'
import {pregameFrame,PREGAME} from './cidade3d/pregame-plan.mjs'
import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {activityRoute,customerJourney,type CityPoint} from './cidade3d/activity-route.mjs'
import {stadiumDayClock,STADIUM_DAY,type StadiumDayFrame} from './cidade3d/stadium-day.mjs'
import {MATCHDAY_COACH_DELAY,matchdayFanPoints,matchdayStage,stadiumExteriorVisible} from './cidade3d/matchday-plan.mjs'
import {criarPropsDiaJogo} from './presidencia-dia-jogo-props'
import {criarBandeirasDiaJogo} from './presidencia-dia-jogo-bandeiras'
import {criarEnfeitesRuaDiaJogo} from './presidencia-dia-jogo-ruas'
import type {AssentoComplexo} from './presidencia-complexo-arquitetura'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import {PLANTA_COMPLEXO,caminhosTorcidaComplexo,type EstadoComplexo} from './presidencia-complexo-model'
import type {IdentidadeDiaJogo} from './presidencia-identidade-dia-jogo'

export type DadosDiaJogo={journey?:JornadaComplexo;teams:IdentidadeDiaJogo[];supporters:number;mobile:boolean}
/** Decorative city attendance sample, separate from official seat tickets and
 * revenue. Exterior bodies are hidden after crossing the real gate, standing
 * for the trip to the stands. Their routes continue for an ordered departure;
 * this never creates extra seats or changes the official crowd allocation. */
export function criarDiaDeJogo(scene:THREE.Scene,state:EstadoComplexo,seats:readonly AssentoComplexo[],onReady:()=>void=()=>{}){
 const root=new THREE.Group();root.name='stadium-matchday';root.visible=false;scene.add(root)
 const meshes:THREE.Mesh[]=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica'])scene.getObjectByName(name)?.traverse(n=>{if(n instanceof THREE.Mesh&&!(n instanceof THREE.SkinnedMesh)&&!(n instanceof THREE.InstancedMesh))meshes.push(n)})
 scene.updateMatrixWorld(true);acelerarRaios(meshes);const ray=new THREE.Raycaster(),normal=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0),cache=new Map<string,number>()
 const ground=(x:number,z:number)=>{const key=x.toFixed(3)+':'+z.toFixed(3);if(cache.has(key))return cache.get(key)!;ray.set(new THREE.Vector3(x,.6,z),down);ray.far=1;const hit=ray.intersectObjects(meshes,false).find(h=>h.point.y<.27&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5);const y=hit?.point.y??0;cache.set(key,y);return y}
 const measured=(points:readonly CityPoint[])=>{const out:CityPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.7));for(let j=i===1?0:1;j<=n;j++){const u=j/n,x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u;out.push({x,z,y:ground(x,z)})}}return out}
 const props=criarPropsDiaJogo(root,ground),flags=criarBandeirasDiaJogo(root,seats,onReady),streets=criarEnfeitesRuaDiaJogo(root,scene,ground,onReady)
 type Civilian=ReturnType<typeof createCivilian>
 type Person={body:Civilian;pose:ReturnType<ReturnType<typeof activityRoute>['at']>|null;loaded:boolean}
 const person=(id:string,outfitColor?:string,variant?:string):Person=>{const p={body:createCivilian(root,{id,outfitColor,variant}),pose:null,loaded:false};p.body.ready.then(ok=>{p.loaded=ok});return p}
 const vendors=props.stalls.map((s,i)=>({id:s.id,side:s.side,delivery:vendorDelivery(s,i,ground),vanIndex:s.kind==='cooler'?-1:props.stalls.slice(0,i).filter(p=>p.kind!=='cooler').length,person:person('matchday-vendor-'+s.id,s.color,i%2?'adult-woman':'adult-man'),position:s.vendor,inbound:activityRoute(measured(s.side==='away'?[{x:s.vendor.x+8,y:0,z:s.vendor.z+8},s.vendor]:[{x:s.vendor.x-6,y:0,z:s.vendor.z+13},s.vendor]),1.05),outbound:activityRoute(measured(s.side==='away'?[s.vendor,{x:s.vendor.x+8,y:0,z:s.vendor.z+8}]:[s.vendor,{x:s.vendor.x-6,y:0,z:s.vendor.z+13}]),1.0)}))
 const vans=criarPeruasAmbulantes(root,props.stalls.filter(s=>s.kind!=='cooler').map(s=>s.color))

 const customers=props.stalls.map((s,i)=>{
  const side=s.side==='away',end=s.service,points=side?[{x:end.x+4,y:end.y,z:end.z+2},{x:end.x+2.4,y:end.y,z:end.z},end]:[{x:end.x-2,y:end.y,z:end.z+5},{x:end.x,y:end.y,z:end.z+3},end]
  const path=measured(points)
  return{id:s.id,person:person('matchday-customer-'+s.id,undefined,i%2?'adult-man':'adult-woman'),journey:customerJourney(path,{stay:11+i*3,wait:2+i*3,speed:1.05,turnAtExit:true}),pose:null as ReturnType<ReturnType<typeof customerJourney>['at']>|null,exit:undefined as ReturnType<typeof activityRoute>|undefined}
 })
 const guards=([{x:-6.5,z:94,heading:0},{x:108,z:10,heading:Math.PI/2}]).map((p,i)=>({person:person('matchday-steward-'+i,'#b4a331',i%2?'adult-woman':'adult-man'),position:{...p,y:ground(p.x,p.z)}}))
 const fans=(['home','away'] as const).flatMap(side=>Array.from({length:4},(_,index)=>{
  const points=measured(matchdayFanPoints(side,index)),inbound=activityRoute(points,1.20),outbound=activityRoute([...points].reverse(),1.15)
  return{side,index,person:person(`matchday-fan-${side}-${index}`,side==='home'?'#eeeeee':'#b83228',index%2?'adult-woman':'adult-man'),inbound,outbound,phase:'waiting',exteriorVisible:true,pose:null as ReturnType<typeof inbound.at>|null,exitStart:null as ReturnType<typeof inbound.at>|null,exit:undefined as ReturnType<typeof activityRoute>|undefined}
 }))
 const dayClock=stadiumDayClock();let dayFrame:StadiumDayFrame|undefined,serviceTime=0,serviceLast=0
 let requested:DadosDiaJogo|undefined,current:DadosDiaJogo|undefined,key='',lastTime=0,origin=0,offset=0,elapsed=0,departureAt:number|undefined,active=false,readyForCoaches=false,stage='idle',fanLimit=0,hasPresentedEvent=false
 const colorPerson=(p:Person,color:string)=>p.body.root.traverse(n=>{if(n instanceof THREE.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof THREE.MeshStandardMaterial&&['Shirt','Clothes'].includes(m.name))m.color.set(color)})
 const begin=(input:DadosDiaJogo,time:number)=>{current={...input,journey:input.journey?{...input.journey}:undefined,teams:input.teams.map(t=>({...t}))};key=input.journey!.key;origin=time;offset=!hasPresentedEvent&&['playing','interval','departure'].includes(input.journey!.phase)?180:0;hasPresentedEvent=true;elapsed=offset;departureAt=undefined;fanLimit=Math.min(input.mobile?3:4,Math.max(2,1+Math.floor(Math.log2(1+input.supporters/10000))));serviceTime=0;serviceLast=time;customers.forEach(c=>{c.exit=undefined});flags.configure(input.teams);streets.configure(input.teams[0],input.mobile);props.setClubColors(input.teams.map(t=>t.color));fans.forEach(f=>{f.exitStart=null;f.exit=undefined;f.pose=f.inbound.at(elapsed-f.index*2.9)});fans.forEach(f=>colorPerson(f.person,input.teams[f.side==='home'?0:1]?.color??(f.side==='home'?'#eeeeee':'#b83228')))}
 const leave=()=>{if(departureAt!==undefined)return;departureAt=elapsed;for(const f of fans){const pose=f.pose??f.inbound.at(elapsed-f.index*2.9);f.exitStart={...pose};let run=0;const prefix:CityPoint[]=[f.inbound.points[0]];for(let i=1;i<f.inbound.points.length;i++){const a=f.inbound.points[i-1],b=f.inbound.points[i],d=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);if(run+d>=pose.distance-1e-7)break;prefix.push(b);run+=d}const publicRoute=caminhosTorcidaComplexo(state)[f.side].filter(p=>f.side==='home'?p.z>=115:p.x>=120).reverse();const extension=measured(publicRoute.map(p=>({...p,y:0})));f.exit=pose.distance>.02?activityRoute([{x:pose.x,y:pose.y,z:pose.z},...prefix.reverse(),...extension],1.15):undefined}}
 fans.forEach(f=>f.person.body.ready.then(()=>{if(current)colorPerson(f.person,current.teams[f.side==='home'?0:1]?.color??'#eeeeee')}))
 function configure(input:DadosDiaJogo,time:number){
  requested=input
  const valid=state.valid&&!!input.journey?.hosting&&input.journey.phase!=='idle'&&input.teams.length===2
  if(!current&&valid){begin(input,time);if(input.journey?.phase==='departure')leave()}
  if(current&&input.journey?.key===key){current.journey={...input.journey};if(['departure','idle'].includes(input.journey.phase))leave()}
  else if(current)leave()
  if(!valid&&!current){active=false;root.visible=false}
 }
 function apply(p:Person,pose:ReturnType<ReturnType<typeof activityRoute>['at']>,time:number,camera?:THREE.Camera,height=720,visible=true,seated=0){p.pose=pose;p.body.root.position.set(pose.x,pose.y,pose.z);p.body.root.rotation.y=pose.heading;const lod=residentVisibility(p.body.root.position,1.76,camera,height);p.body.update({seconds:time,distance:pose.distance,speed:pose.speed,seated,visible:visible&&lod.visible,detail:lod.detail})}
 function update(time:number,camera?:THREE.Camera,height=720){
  if(!current){lastTime=time;return}
  if(time<lastTime&&current.journey?.phase==='arrival'){origin=Math.min(origin,time);offset=0;departureAt=undefined}
  lastTime=time;elapsed=Math.max(0,time-origin)+offset;dayFrame=dayClock.update(current.journey,time);active=dayFrame.active||dayFrame.phase==='departure'&&dayFrame.phaseElapsed<Math.max(...vendors.map(v=>v.delivery?.timing.end??0));root.visible=active
  if((requested?.journey?.key!==key||requested?.journey?.phase==='idle')&&departureAt!==undefined&&elapsed-departureAt>Math.max(STADIUM_DAY.close,...vendors.map(v=>v.delivery?.timing.end??0),...fans.filter(f=>f.index<fanLimit&&(f.side==='home'||state.progress.visitante>0)).map(f=>(fanLimit-1-f.index)*2.9+1.2+(f.exit?.duration??0)))+.05){const next=requested?.journey?.hosting&&requested.journey.phase!=='idle'&&requested.teams.length===2?requested:undefined;if(next){begin(next,time)}else{current=undefined;active=false;root.visible=false;readyForCoaches=false;return}}
  const leaving=departureAt!==undefined,exitTime=leaving?elapsed-departureAt!:0
  for(const fan of fans){const enabled=fan.index<fanLimit&&(fan.side==='home'||state.progress.visitante>0),delay=(leaving?fanLimit-1-fan.index:fan.index)*2.9;
   const start=fan.exitStart??fan.inbound.at(fan.inbound.duration),out=fan.exit??fan.outbound;
   let pose=leaving?out.at(exitTime-delay-1.2):fan.inbound.at(elapsed-STADIUM_DAY.gatesOpen-delay)
   if(leaving&&exitTime<delay+1.2){const u=Math.max(0,Math.min(1,(exitTime-delay)/1.2)),heading=start.heading+Math.atan2(Math.sin(out.at(0).heading-start.heading),Math.cos(out.at(0).heading-start.heading))*u*u*(3-2*u);pose={...start,heading,speed:0}}
   if(leaving&&!fan.exit&&fan.exitStart&&fan.exitStart.distance<=.02)pose={...fan.exitStart,speed:0,done:true}

   fan.pose=pose;fan.phase=!enabled?'off':leaving?(exitTime<delay+1.2?'inside':pose.done?'outside':'leaving'):elapsed<STADIUM_DAY.gatesOpen+delay?'queued':pose.done?'inside':'entering'
   fan.exteriorVisible=stadiumExteriorVisible(pose,PLANTA_COMPLEXO.gates[fan.side],fan.exteriorVisible)
   apply(fan.person,pose,time,camera,height,enabled&&fan.exteriorVisible&&(!leaving||!pose.done))
  }
  const stallWork=new Map<string,{setup:number;visible:boolean}>()
  for(const [i,vendor]of vendors.entries()){
   if(vendor.delivery){const f=vendor.delivery.at(dayFrame);vans.set(vendor.vanIndex,f);stallWork.set(vendor.id,{setup:f.setup,visible:f.stallVisible});apply(vendor.person,f.person,time,camera,height,f.visible,f.person.seated);continue}
   const p=vendor.position,leavingNow=leaving&&exitTime>STADIUM_DAY.cleanup+28+i*1.5,enterTime=elapsed-PREGAME.streets-i*1.5;const pose=leavingNow?vendor.outbound.at(exitTime-STADIUM_DAY.cleanup-28-i*1.5):!dayFrame.joinedLate&&current.journey?.phase==='arrival'&&enterTime<vendor.inbound.duration?vendor.inbound.at(enterTime):{...p,heading:vendor.side==='away'?Math.PI/2:0,speed:0,distance:vendor.inbound.length,done:true};apply(vendor.person,pose,time,camera,height,!leavingNow||!pose.done)
  }

  for(const guard of guards){const p=guard.position;apply(guard.person,{...p,speed:0,distance:0,done:true},time,camera,height)}
  const dt=Math.max(0,time-serviceLast);if(time<serviceLast)serviceTime=0;serviceLast=time;serviceTime+=dt*(dayFrame.trade==='quiet'?.30:1)
  for(const c of customers){
   if(leaving&&!c.exit){const start=c.pose??c.journey.at(serviceTime),path=c.journey.inbound.points;let index=0,near=Infinity;path.forEach((p,i)=>{const d=Math.hypot(p.x-start.x,p.z-start.z);if(d<near){near=d;index=i}});const points=[{x:start.x,y:start.y,z:start.z},...path.slice(0,index+1).reverse()];if(points.length>1&&Math.hypot(points[0].x-points.at(-1)!.x,points[0].z-points.at(-1)!.z)>.02)c.exit=activityRoute(points,1.05)
   }
   c.pose=leaving&&c.exit?{...c.exit.at(exitTime),phase:'leaving'}:c.journey.at(serviceTime);apply(c.person,c.pose,time,camera,height,(stallWork.has(c.id)?stallWork.get(c.id)!.setup>.95:dayFrame.phase!=='arrival'||pregameFrame(dayFrame).setup>.9)&&(!leaving||!!c.exit&&!c.pose.done))
  }
  props.root.visible=dayFrame.joinedLate||dayFrame.phase!=='arrival'||elapsed>=PREGAME.streets;props.update(time,{...dayFrame,setup:dayFrame.phase==='arrival'?pregameFrame(dayFrame).setup:dayFrame.setup},stallWork);flags.update(time)

  const entered=fans.filter(f=>f.index===0&&f.phase!=='off').every(f=>f.phase==='inside')
  stage=dayFrame.stage==='playing'?'match':dayFrame.stage==='gates-open'?matchdayStage(elapsed,current.journey?.phase??'idle',entered):dayFrame.stage
  readyForCoaches=!leaving&&current.journey?.phase==='arrival'&&elapsed>=MATCHDAY_COACH_DELAY&&entered&&vendors.every(v=>v.person.loaded&&(!v.delivery||v.delivery.at(dayFrame).setup>=1))
 }
 return{root,configure,update,day:()=>dayFrame,coachesAllowed:()=>readyForCoaches,coachStart:()=>origin+Math.max(0,MATCHDAY_COACH_DELAY-offset),key:()=>key,inspect:()=>({active,key,requestedKey:requested?.journey?.key,elapsed,stage,cycle:dayFrame,coachesAllowed:readyForCoaches,coachEarliest:MATCHDAY_COACH_DELAY,fanLimit,source:'decorative match-day city sample; no tickets, attendance revenue or economy writes',fans:fans.map(f=>({side:f.side,index:f.index,phase:f.phase,pose:f.pose,exteriorVisible:f.exteriorVisible,visible:f.person.body.root.visible,ready:f.person.loaded})),vendors:vendors.map(v=>({id:v.id,position:v.position,ready:v.person.loaded,transport:v.delivery?'van':'on-foot',pose:v.person.pose,delivery:v.delivery?{parking:v.delivery.parking,timing:v.delivery.timing,frame:v.delivery.at(dayFrame),routes:{in:v.delivery.incoming.points,out:v.delivery.outgoing.points,cargo:v.delivery.cargo.points,driver:v.delivery.exitDriver.points}}:null})),vans:vans.inspect(),customers:customers.map(c=>({id:c.id,pose:c.pose,route:c.journey.inbound.points})),flags:flags.inspect(),streets:streets.inspect(),routes:fans.map(f=>({side:f.side,index:f.index,points:f.inbound.points}))}),dispose(){[...fans.map(f=>f.person),...vendors.map(v=>v.person),...customers.map(c=>c.person),...guards.map(g=>g.person)].forEach(p=>p.body.dispose());vans.dispose();props.dispose();flags.dispose();streets.dispose();root.removeFromParent()}}
}
