import {criarPeladaGecg} from './gecg-pelada-3d'
import type {ContextoBairro} from './presidencia-bairro-tradicoes'
import * as T from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {activityRoute,customerJourney} from './cidade3d/activity-route.mjs'
import {LOTES_PATROCINADORES_CIDADE as LOTS} from './presidencia-patrocinadores-planta'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'
import {caminhoPelasRuas,arredondarCaminho,viagemVeiculo} from './veiculos-entrega-rota'
import type {RuaComplexo} from './presidencia-complexo-ruas'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import {segmentoLivre} from './presidencia-estadio-navegacao'
import {texturaLogoPatrocinador} from './presidencia-patrocinador-logo'
import {acelerarRaios} from './presidencia-raio-rapido'

const THREE_SMOOTH=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t)}
type Door={approach:{x:number;z:number};threshold:{x:number;z:number};inside:{x:number;z:number}}
type Home={id:string;door:{x:number;z:number};curb:{x:number;z:number};inside:{x:number;z:number}}
/** Decorative business activity only. No sales/orders/bookings, career money,
 * supporters, official fixtures or sponsor contracts are created here. */
export function criarRotinasPatrocinadores(scene:T.Scene,environment:T.Object3D,doors:Record<string,Door>,solids:readonly SolidoEntorno[],options:{enabled:boolean;mobile:boolean;light?:boolean;onReady:()=>void}){
 const root=new T.Group();root.name='rotinas-patrocinadores';scene.add(root);root.visible=options.enabled
 if(!options.enabled)return{root,update(_time:number,_camera:T.Camera,_height?:number,_period?:string,_contexto?:ContextoBairro){},active:()=>false,inspect:()=>({enabled:false}),dispose(){root.removeFromParent()}}
 const training=criarPeladaGecg(root,options)
 if(options.light)return{root,update(time:number,camera:T.Camera,height=720,_period='day',contexto:ContextoBairro={}){training.update(time,camera,height,contexto)},active:()=>training.active(),inspect:()=>({enabled:true,light:true,training:training.inspect(),delivery:{phase:'disabled'},budget:{officePeople:0,trucks:0}}),dispose(){training.dispose();root.removeFromParent()}}
 const floor=.19,point=(p:{x:number;z:number})=>({...p,y:floor}),staff:ReturnType<typeof createCivilian>[]=[]
 const offices=(['tidex','oittolabs'] as const).flatMap((id,k)=>Array.from({length:options.mobile?1:2},(_,i)=>{
  const d=doors[id],p=LOTS[id],body=createCivilian(root,{id:id+'-funcionario-'+i,variant:i?'older-woman':'older-man',outfitColor:k?'#383c45':'#203447',occupation:'office',deferUntilVisible:true,onReady:options.onReady});staff.push(body)
  const path=[point({x:p.x+(i?8:-8),z:p.frontWalkZ-3}),point({x:p.x,z:p.frontWalkZ-6}),point(d.approach),point(d.threshold),point(d.inside)]
  return{id,body,journey:customerJourney(path,{speed:1.25,wait:3+k*9+i*18,stay:42+i*23})}
 }))
 let disposed=false,seconds=0,truckPhase='waiting',framesLoaded=0
 const library=criarBibliotecaVeiculos(),truck=library.create('servico-dsouza')!;root.add(truck.root);truck.root.visible=false
 const logoMap=texturaLogoPatrocinador('dsouza',options.onReady),logoMat=new T.MeshBasicMaterial({map:logoMap,transparent:true,depthWrite:false,toneMapped:false}),logoGeo=new T.PlaneGeometry(1.5,1.23)
 for(const side of[-1,1]){const logo=new T.Mesh(logoGeo,logoMat);logo.position.set(side*(truck.profile.width/2+.015),1.4,-.55);logo.rotation.y=side*Math.PI/2;truck.root.add(logo)}
 const loadingBay={x:LOTS.dsouza.x-17,z:LOTS.dsouza.z+32},roads=(environment.userData.roadNetwork?.streets??[])as RuaComplexo[],homes=(environment.userData.residentialDoors??[])as Home[]
 const driver=createCivilian(root,{id:'dsouza-entregador',variant:'adult-man',outfitColor:'#3e6a49',deferUntilVisible:true,onReady:options.onReady});staff.push(driver)
 const parcel=new T.Group(),frameMat=new T.MeshStandardMaterial({color:'#976e46'}),printMat=new T.MeshStandardMaterial({color:'#e5dfc8'}),frameGeo=new T.BoxGeometry(.42,.58,.065),paperGeo=new T.BoxGeometry(.35,.5,.07);parcel.add(new T.Mesh(frameGeo,frameMat),new T.Mesh(paperGeo,printMat));parcel.visible=false
 let carryingHand:T.Object3D|undefined,receivingHand:T.Object3D|undefined;root.add(parcel)
 const receiver=createCivilian(root,{id:'dsouza-cliente',variant:'adult-woman',deferUntilVisible:true,onReady:options.onReady});staff.push(receiver)
 receiver.ready.then(ok=>{if(ok&&!disposed){receivingHand=receiver.root.getObjectByName('Fist.R')??receiver.root.getObjectByName('Hand.R');options.onReady()}})
 const cargo=[-1,1].map(side=>{const mesh=new T.Mesh(frameGeo,frameMat);mesh.position.set(side*.28,1.05,-.7);truck.root.add(mesh);return mesh})
 const receiverPoint=new T.Vector3();let handoff=0,receiving=false,officeOpen=true
 driver.ready.then(ok=>{if(!ok||disposed)return;carryingHand=driver.root.getObjectByName('Fist.R')??driver.root.getObjectByName('Hand.R');options.onReady()})
 const loadWalk=customerJourney([point(doors.dsouza.inside),point(doors.dsouza.threshold),point({x:loadingBay.x,z:loadingBay.z-truck.profile.length/2-.6})],{wait:1,stay:1.2,speed:1.15})
 const loadDuration=loadWalk.period*2+2
 const obstacles=solids.filter(s=>s.top>.4&&s.base<2.4).map(s=>({id:s.id,polygon:s.footprint.map(p=>({x:p.x,y:p.z}))}))
 let routes:{home:Home;trip:ReturnType<typeof viagemVeiculo>;back:ReturnType<typeof viagemVeiculo>;walk:ReturnType<typeof activityRoute>;stopDuration:number}[]|null=null,routeError='',routeTimer:ReturnType<typeof setTimeout>|undefined,routePending=false
 const turn=(p:{x:number;z:number},heading:number)=>{const curves=[[[0,0],[0,5],[2,8],[5,8]],[[5,8],[9,8],[9,0],[5,0]],[[5,0],[2,0],[0,4],[0,0]]],pts:{x:number;z:number}[]=[];for(const c of curves)for(let k=0;k<=16;k++){const t=k/16,a=1-t,x=a*a*a*c[0][0]+3*a*a*t*c[1][0]+3*a*t*t*c[2][0]+t*t*t*c[3][0],z=a*a*a*c[0][1]+3*a*a*t*c[1][1]+3*a*t*t*c[2][1]+t*t*t*c[3][1];pts.push({x:p.x+Math.cos(heading)*x+Math.sin(heading)*z,z:p.z-Math.sin(heading)*x+Math.cos(heading)*z})}return pts}
 const surfaces:T.Mesh[]=[],ray=new T.Raycaster();environment.updateMatrixWorld(true);environment.traverse(o=>{if(o instanceof T.Mesh)surfaces.push(o)})
 acelerarRaios(surfaces)
 const ground=(p:{x:number;z:number})=>{ray.set(new T.Vector3(p.x,2.4,p.z),new T.Vector3(0,-1,0));ray.far=4;const hit=ray.intersectObjects(surfaces,false).find(h=>h.face&&h.face.normal.y>.8&&h.point.y<.5);return{...p,y:hit?.point.y??0}}
 const clear=(p:{x:number;z:number}[])=>!p.some((b,i)=>i>0&&!segmentoLivre({x:p[i-1].x,y:p[i-1].z},{x:b.x,y:b.z},obstacles,1.12))
 // Route searches run one candidate per task, outside the render frame.
 function prepareRoutes(){if(routes)return;routes=[];routePending=true;const start={x:loadingBay.x,z:LOTS.dsouza.frontWalkZ},candidates=[...homes].sort((a,b)=>Math.hypot(a.curb.x-start.x,a.curb.z-start.z)-Math.hypot(b.curb.x-start.x,b.curb.z-start.z));let index=0;
  const step=()=>{routeTimer=undefined;if(disposed)return;
   const h=candidates[index++];if(!h||routes!.length>=3){routePending=false;if(!routes!.length)routeError='Nenhuma casa com acesso e manobra de retorno livres foi encontrada.';options.onReady();return}
   const dx=h.curb.x-h.door.x,dz=h.curb.z-h.door.z,n=Math.hypot(dx,dz),stop={x:h.door.x+dx/n*16,z:h.door.z+dz/n*16},path=n>0?caminhoPelasRuas(roads,start,stop,18):null;
   if(path){const smooth=arredondarCaminho([loadingBay,...path],3);if(clear(smooth)){const a=smooth[0],b=smooth[1],z=smooth.at(-1)!,y=smooth.at(-2)!,head=Math.atan2(b.x-a.x,b.z-a.z),tail=Math.atan2(z.x-y.x,z.z-y.z),back=[...turn(z,tail),...[...smooth].reverse().slice(1),...turn(a,head+Math.PI).slice(1)];if(clear(back)){
     const trip=viagemVeiculo(smooth.map(ground),6),end=trip.at(trip.duration),rear=point({x:end.x-Math.sin(end.heading)*(truck.profile.length/2+.6),z:end.z-Math.cos(end.heading)*(truck.profile.length/2+.6)}),walk=activityRoute([rear,point({x:h.door.x+dx/n*1.25,z:h.door.z+dz/n*1.25})],1.15);
     if(segmentoLivre({x:rear.x,y:rear.z},{x:h.door.x,y:h.door.z},obstacles.filter(o=>!o.id.startsWith(h.id)),.28))routes!.push({home:h,trip,back:viagemVeiculo(back.map(ground),5),walk,stopDuration:walk.duration*2+6})
   }}}
   routeTimer=setTimeout(step,16)
  };routeTimer=setTimeout(step,0)
 }
 const focusPoints=Object.values(LOTS).map(p=>new T.Vector3(p.x,1,p.z)),frustum=new T.Frustum(),matrix=new T.Matrix4();let near=false
 function update(time:number,camera:T.Camera,height=720,dayPeriod='day',contexto:ContextoBairro={}){
  training.update(time,camera,height,contexto)
  seconds=time;officeOpen=dayPeriod!=='night';if(!options.enabled)return;camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);near=focusPoints.some(p=>p.distanceTo(camera.position)<350&&frustum.containsPoint(p))||(truck.root.visible&&truck.root.position.distanceTo(camera.position)<110&&frustum.containsPoint(truck.root.position))
  for(const o of offices){const p=o.journey.at(seconds);o.body.root.position.set(p.x,p.y,p.z);o.body.root.rotation.y=p.heading;const lod=residentVisibility(o.body.root.position,1.76,camera,height);o.body.update({seconds,distance:p.distance,speed:p.speed,visible:officeOpen&&lod.visible&&p.phase!=='visiting',detail:lod.detail})}
  // Periodic merchandise run. These are visual deliveries, never game purchases.
  if(near)prepareRoutes();const periods=routes?.map(r=>loadDuration+r.trip.duration+r.stopDuration+r.back.duration+8)??[];let local=seconds%(periods.reduce((a,b)=>a+b,0)||360),route=routes?.[0];for(let i=0;i<periods.length;i++){if(local<periods[i]){route=routes![i];break}local-=periods[i]}
  truck.root.visible=!!route;driver.root.visible=!!route;parcel.visible=!!route;receiving=false;handoff=0;receiver.update({seconds,visible:false});
  if(route){const outward=route.trip.duration,stop=loadDuration+outward,returnAt=stop+route.stopDuration,returning=local>=returnAt,p=returning?route.back.at(local-returnAt):route.trip.at(local<loadDuration?0:Math.min(outward,local-loadDuration));truckPhase=local<loadDuration?'loading':local<stop?'delivering':local<returnAt?'unloading':!p.done?'returning':'waiting';framesLoaded=local<loadDuration?Math.min(2,Math.floor(local/loadWalk.period)):truckPhase==='unloading'?1:2;truck.root.position.set(p.x,p.y,p.z);truck.root.rotation.y=p.heading;truck.update((returning?route.trip.length:0)+p.distance);truck.setCargoOpening?.(truckPhase==='loading'||truckPhase==='unloading'?1:0)
   let walk;if(truckPhase==='loading'){walk=loadWalk.at(local);parcel.visible=walk.phase==='entering';driver.root.rotation.y=walk.heading}
   else if(truckPhase==='unloading'){const walkOut=route.walk,elapsed=local-stop,pause=4;walk=elapsed<walkOut.duration?walkOut.at(elapsed):elapsed<walkOut.duration+pause?{...walkOut.at(walkOut.duration),speed:0}:activityRoute([...walkOut.points].reverse(),1.15).at(elapsed-walkOut.duration-pause);parcel.visible=elapsed<walkOut.duration+pause;driver.root.rotation.y=walk.heading;
    const end=walkOut.at(walkOut.duration),inward={x:Math.sin(end.heading),z:Math.cos(end.heading)},appear=elapsed-walkOut.duration+1.6;
    if(appear>=0&&appear<pause+3.2){receiving=true;const exit=THREE_SMOOTH(Math.min(1,appear/1.6)),retreat=THREE_SMOOTH(Math.max(0,(appear-5.6)/1.6));const depth=1.9-1.2*exit+retreat*1.2;receiver.root.position.set(end.x+inward.x*depth,floor,end.z+inward.z*depth);receiver.root.rotation.y=end.heading+Math.PI;const lod=residentVisibility(receiver.root.position,1.67,camera,height);receiver.update({seconds,distance:exit*1.2,speed:appear<1.6?.75:0,activity:appear>=1.6?'carrying':undefined,visible:lod.visible,detail:lod.detail});handoff=T.MathUtils.smoothstep(elapsed-walkOut.duration,1.1,1.55);if(elapsed>=walkOut.duration+pause)parcel.visible=true}
    }
   if(walk){driver.root.position.set(walk.x,walk.y,walk.z);const lod=residentVisibility(driver.root.position,1.76,camera,height);driver.update({seconds,distance:walk.distance,speed:walk.speed,activity:parcel.visible&&handoff<1?'carrying':undefined,visible:lod.visible,detail:lod.detail})}else{parcel.visible=false;driver.update({seconds,visible:false})}
  }else driver.update({seconds,visible:false})
  cargo.forEach((mesh,i)=>mesh.visible=i<framesLoaded);parcel.visible=parcel.visible&&(driver.root.visible||receiver.root.visible)&&!!carryingHand
  if(parcel.visible&&carryingHand){carryingHand.getWorldPosition(parcel.position);root.worldToLocal(parcel.position);parcel.position.y-=.15;if(receiving&&receivingHand&&handoff>0){receivingHand.getWorldPosition(receiverPoint);root.worldToLocal(receiverPoint);receiverPoint.y-=.15;parcel.position.lerp(receiverPoint,handoff)}parcel.rotation.y=driver.root.rotation.y}
 }
 return{root,update,active:()=>near&&options.enabled,inspect:()=>({seconds,officeOpen,officeVisitors:offices.map(o=>({company:o.id,phase:o.journey.at(seconds).phase,position:o.body.root.position.toArray(),visible:o.body.root.visible,...o.body.inspect()})),training:training.inspect(),delivery:{phase:truckPhase,framesLoaded,recipientVisible:receiver.root.visible,handoff,preparingRoutes:routePending,loadDuration,routes:routes?.map(r=>({house:r.home.id,door:r.home.door,duration:r.trip.duration,returnDuration:r.back.duration,stopDuration:r.stopDuration})),error:routeError,position:truck.root.position.toArray()},budget:{officePeople:offices.length,footballPeople:training.inspect().players,trucks:1}}),dispose(){disposed=true;if(routeTimer!==undefined)clearTimeout(routeTimer);staff.forEach(b=>b.dispose());training.dispose();truck.dispose();library.dispose();logoMap.dispose();logoGeo.dispose();logoMat.dispose();frameGeo.dispose();paperGeo.dispose();frameMat.dispose();printMat.dispose();root.removeFromParent()}}
}
