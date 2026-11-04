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

type Door={approach:{x:number;z:number};threshold:{x:number;z:number};inside:{x:number;z:number}}
type Home={id:string;door:{x:number;z:number};curb:{x:number;z:number};inside:{x:number;z:number}}
/** Decorative business activity only. No sales/orders/bookings, career money,
 * supporters, official fixtures or sponsor contracts are created here. */
export function criarRotinasPatrocinadores(scene:T.Scene,environment:T.Object3D,doors:Record<string,Door>,solids:readonly SolidoEntorno[],options:{enabled:boolean;mobile:boolean;onReady:()=>void}){
 const root=new T.Group();root.name='rotinas-patrocinadores';scene.add(root);root.visible=options.enabled
 if(!options.enabled)return{root,update(_time:number,_camera:T.Camera,_height?:number){},active:()=>false,inspect:()=>({enabled:false}),dispose(){root.removeFromParent()}}
 const floor=.19,point=(p:{x:number;z:number})=>({...p,y:floor}),staff:ReturnType<typeof createCivilian>[]=[]
 const offices=(['tidex','oittolabs'] as const).flatMap((id,k)=>Array.from({length:options.mobile?1:2},(_,i)=>{
  const d=doors[id],p=LOTS[id],body=createCivilian(root,{id:id+'-funcionario-'+i,variant:i?'older-woman':'older-man',outfitColor:k?'#383c45':'#203447',deferUntilVisible:true,onReady:options.onReady});staff.push(body)
  const path=[point({x:p.x+(i?8:-8),z:-235}),point({x:p.x,z:-240}),point(d.approach),point(d.threshold),point(d.inside)]
  return{id,body,journey:customerJourney(path,{speed:1.25,wait:3+k*9+i*18,stay:42+i*23})}
 }))
 // Local society practice reuses the game's authored football clips and model.
 // Loading is deferred until the rental pitch is actually viewed nearby.
 let football:any[]=[],loading=false,disposed=false,footballError='',seconds=0,trainingPhase='waiting',framesLoaded=0,truckPhase='waiting'
 const sportsCount=options.mobile?2:4,positions=Array.from({length:sportsCount},(_,i)=>({x:LOTS.gecg.x+(i%2?9:-9),z:LOTS.gecg.z+(i<2?-5:5)})),g=LOTS.gecg
 const ballMaterial=new T.MeshStandardMaterial({color:'#ecebdc',roughness:.7}),ballGeometry=new T.IcosahedronGeometry(.11,2),ball=new T.Mesh(ballGeometry,ballMaterial);ball.visible=false;ball.castShadow=true;root.add(ball)
 const arrival=positions.map((p,i)=>activityRoute([point({x:-473-i*.5,z:g.z+40}),point({x:g.x-13,z:g.z+40}),point({x:g.x-13,z:g.z+19.5}),point({x:g.x-13,z:g.z+15}),point(p)],1.45))
 async function loadFootball(){if(loading||football.length||footballError)return;loading=true;try{
  const[{carregaJogadorNovo,criarJogadorNovo},{completa}]=await Promise.all([import('./futebol3d/jogador-novo.mjs'),import('./futebol3d/uniformes.mjs')]);const asset:any=await carregaJogadorNovo();if(disposed)return;
  const clips=new Map([...asset.clips].map(([name,source]:any)=>{const clip=source.clone();for(const t of clip.tracks)if(t.name.endsWith('.position')&&/Hips|Armature|Root/.test(t.name))for(let k=0;k<t.values.length;k+=3){t.values[k]=t.values[0];t.values[k+2]=t.values[2]}return[name,clip]}));const safe={...asset,clips};
  football=positions.map((p,i)=>{const actor:any=criarJogadorNovo(safe,completa({corpo:i%2?'#3a78ac':'#45a46e',detalhe:'#eeeece',calcao:'#283139',meiao:'#e7e5d3'}));root.add(actor.holder);const next=positions[(i+1)%positions.length];actor.holder.position.set(p.x,floor,p.z);actor.holder.rotation.y=Math.atan2(next.x-p.x,next.z-p.z);const name=asset.clips.has('passe_curto')?'passe_curto':'passe',pass=actor.acao(name),idle=actor.acao('idle'),walk=actor.acao('trote'),contact=asset.meta.clips[name]?.toque??pass.getClip().duration*.6;
   pass.play();pass.timeScale=0;pass.time=contact;pass.weight=1;idle.play();idle.timeScale=0;idle.weight=0;walk.play();walk.timeScale=0;walk.weight=0;actor.mixer.update(0);actor.holder.updateMatrixWorld(true);let foot:T.Object3D|undefined;actor.root.traverse((n:T.Object3D)=>{if(/RightToeBase/.test(n.name))foot=n});const touch=(foot??actor.holder).getWorldPosition(new T.Vector3());touch.y=floor+.11;pass.weight=0;idle.weight=1;
   return{actor,pass,idle,walk,contact,touch,heading:actor.holder.rotation.y,foot}
  });options.onReady()
 }catch(e){footballError=String(e)}finally{loading=false}}
 const library=criarBibliotecaVeiculos(),truck=library.create('servico-dsouza')!;root.add(truck.root);truck.root.visible=false
 const logoMap=texturaLogoPatrocinador('dsouza',options.onReady),logoMat=new T.MeshBasicMaterial({map:logoMap,transparent:true,depthWrite:false,toneMapped:false}),logoGeo=new T.PlaneGeometry(1.5,1.23)
 for(const side of[-1,1]){const logo=new T.Mesh(logoGeo,logoMat);logo.position.set(side*(truck.profile.width/2+.015),1.4,-.55);logo.rotation.y=side*Math.PI/2;truck.root.add(logo)}
 const loadingBay={x:LOTS.dsouza.x-17,z:LOTS.dsouza.z+32},roads=(environment.userData.roadNetwork?.streets??[])as RuaComplexo[],homes=(environment.userData.residentialDoors??[])as Home[]
 const driver=createCivilian(root,{id:'dsouza-entregador',variant:'adult-man',outfitColor:'#3e6a49',deferUntilVisible:true,onReady:options.onReady});staff.push(driver)
 const parcel=new T.Group(),frameMat=new T.MeshStandardMaterial({color:'#976e46'}),printMat=new T.MeshStandardMaterial({color:'#e5dfc8'}),frameGeo=new T.BoxGeometry(.42,.58,.065),paperGeo=new T.BoxGeometry(.35,.5,.07);parcel.add(new T.Mesh(frameGeo,frameMat),new T.Mesh(paperGeo,printMat));parcel.visible=false
 let carryingHand:T.Object3D|undefined;root.add(parcel)
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
 function prepareRoutes(){if(routes)return;routes=[];routePending=true;const start={x:loadingBay.x,z:-231.34},candidates=[...homes].sort((a,b)=>Math.hypot(a.curb.x-start.x,a.curb.z-start.z)-Math.hypot(b.curb.x-start.x,b.curb.z-start.z));let index=0;
  const step=()=>{routeTimer=undefined;if(disposed)return;
   const h=candidates[index++];if(!h||routes!.length>=3){routePending=false;if(!routes!.length)routeError='Nenhuma casa com acesso e manobra de retorno livres foi encontrada.';options.onReady();return}
   const dx=h.curb.x-h.door.x,dz=h.curb.z-h.door.z,n=Math.hypot(dx,dz),stop={x:h.door.x+dx/n*16,z:h.door.z+dz/n*16},path=n>0?caminhoPelasRuas(roads,start,stop,18):null;
   if(path){const smooth=arredondarCaminho([loadingBay,...path],3);if(clear(smooth)){const a=smooth[0],b=smooth[1],z=smooth.at(-1)!,y=smooth.at(-2)!,head=Math.atan2(b.x-a.x,b.z-a.z),tail=Math.atan2(z.x-y.x,z.z-y.z),back=[...turn(z,tail),...[...smooth].reverse().slice(1),...turn(a,head+Math.PI).slice(1)];if(clear(back)){
     const trip=viagemVeiculo(smooth.map(ground),6),end=trip.at(trip.duration),rear=point({x:end.x-Math.sin(end.heading)*(truck.profile.length/2+.6),z:end.z-Math.cos(end.heading)*(truck.profile.length/2+.6)}),walk=activityRoute([rear,point(h.door),point(h.inside)],1.15);
     if(segmentoLivre({x:rear.x,y:rear.z},{x:h.door.x,y:h.door.z},obstacles.filter(o=>!o.id.startsWith(h.id)),.28))routes!.push({home:h,trip,back:viagemVeiculo(back.map(ground),5),walk,stopDuration:walk.duration*2+5})
   }}}
   routeTimer=setTimeout(step,16)
  };routeTimer=setTimeout(step,0)
 }
 const focusPoints=Object.values(LOTS).map(p=>new T.Vector3(p.x,1,p.z)),frustum=new T.Frustum(),matrix=new T.Matrix4();let near=false
 function update(time:number,camera:T.Camera,height=720){
  seconds=time;if(!options.enabled)return;camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);near=focusPoints.some(p=>p.distanceTo(camera.position)<180&&frustum.containsPoint(p))||(truck.root.visible&&truck.root.position.distanceTo(camera.position)<110&&frustum.containsPoint(truck.root.position))
  for(const o of offices){const p=o.journey.at(seconds);o.body.root.position.set(p.x,p.y,p.z);o.body.root.rotation.y=p.heading;const lod=residentVisibility(o.body.root.position,1.76,camera,height);o.body.update({seconds,distance:p.distance,speed:p.speed,visible:lod.visible&&p.phase!=='visiting',detail:lod.detail})}
  const fieldNear=focusPoints[3].distanceTo(camera.position)<160&&frustum.containsPoint(focusPoints[3]);if(fieldNear)void loadFootball()
  const arrivalEnd=Math.max(...arrival.map(a=>a.duration))+sportsCount+2,period=200+arrivalEnd,t=seconds%period,playing=t>=arrivalEnd&&t<200;trainingPhase=t<arrivalEnd?'arriving':playing?'playing':'leaving';ball.visible=fieldNear&&playing&&football.length>0
  for(let i=0;i<football.length;i++){const f=football[i];f.actor.holder.visible=fieldNear;if(!fieldNear)continue;const p=t<arrivalEnd?arrival[i].at(Math.max(0,t-i)):t>=200?arrival[i].at(Math.max(0,arrival[i].duration-(t-200))):null;f.actor.holder.visible=fieldNear;
   if(p){f.actor.holder.position.set(p.x,p.y,p.z);f.actor.holder.rotation.y=p.heading+(t>=200?Math.PI:0);f.pass.weight=0;f.idle.weight=0;f.walk.weight=1;f.walk.time=p.distance/3%f.walk.getClip().duration}
   else{const p=positions[i];f.actor.holder.position.set(p.x,floor,p.z);f.actor.holder.rotation.y=f.heading;const q=(t-arrivalEnd)%8,index=Math.floor((t-arrivalEnd)/8)%football.length,kick=i===index,duration=f.pass.getClip().duration,weight=kick?Math.min(T.MathUtils.smoothstep(q,0,.18),1-T.MathUtils.smoothstep(q,duration-.25,duration)):0;f.walk.weight=0;f.pass.weight=weight;f.idle.weight=1-weight;f.pass.time=Math.min(q,duration);f.idle.time=seconds%f.idle.getClip().duration}
   f.actor.mixer.update(0)
  }
  if(ball.visible){const local=t-arrivalEnd,index=Math.floor(local/8)%football.length,a=football[index],b=football[(index+1)%football.length],q=local%8,u=T.MathUtils.clamp((q-a.contact)/1.8,0,1);ball.position.copy(a.touch).lerp(b.touch,u);ball.rotation.x=local*8}
  // Periodic merchandise run. These are visual deliveries, never game purchases.
  if(near)prepareRoutes();const periods=routes?.map(r=>loadDuration+r.trip.duration+r.stopDuration+r.back.duration+8)??[];let local=seconds%(periods.reduce((a,b)=>a+b,0)||360),route=routes?.[0];for(let i=0;i<periods.length;i++){if(local<periods[i]){route=routes![i];break}local-=periods[i]}
  truck.root.visible=!!route;driver.root.visible=!!route;parcel.visible=!!route;
  if(route){const outward=route.trip.duration,stop=loadDuration+outward,returnAt=stop+route.stopDuration,returning=local>=returnAt,p=returning?route.back.at(local-returnAt):route.trip.at(local<loadDuration?0:Math.min(outward,local-loadDuration));truckPhase=local<loadDuration?'loading':local<stop?'delivering':local<returnAt?'unloading':!p.done?'returning':'waiting';framesLoaded=local<loadDuration?Math.min(2,Math.floor(local/loadWalk.period)):truckPhase==='unloading'?1:2;truck.root.position.set(p.x,p.y,p.z);truck.root.rotation.y=p.heading;truck.update((returning?route.trip.length:0)+p.distance);truck.setCargoOpening?.(truckPhase==='loading'||truckPhase==='unloading'?1:0)
   let walk;if(truckPhase==='loading'){walk=loadWalk.at(local);parcel.visible=walk.phase==='entering';driver.root.rotation.y=walk.heading}
   else if(truckPhase==='unloading'){const walkOut=route.walk,elapsed=local-stop;walk=elapsed<walkOut.duration?walkOut.at(elapsed):elapsed<walkOut.duration+3?{...walkOut.at(walkOut.duration),speed:0}:activityRoute([...walkOut.points].reverse(),1.15).at(elapsed-walkOut.duration-3);parcel.visible=elapsed<walkOut.duration;driver.root.rotation.y=walk.heading}
   if(walk){driver.root.position.set(walk.x,walk.y,walk.z);const lod=residentVisibility(driver.root.position,1.76,camera,height);driver.update({seconds,distance:walk.distance,speed:walk.speed,visible:lod.visible&&!(truckPhase==='unloading'&&local-stop>=route.walk.duration&&local-stop<route.walk.duration+3),detail:lod.detail})}else{parcel.visible=false;driver.update({seconds,visible:false})}
  }else driver.update({seconds,visible:false})
  parcel.visible=parcel.visible&&driver.root.visible&&!!carryingHand
  if(parcel.visible&&carryingHand){carryingHand.getWorldPosition(parcel.position);root.worldToLocal(parcel.position);parcel.position.y-=.22;parcel.rotation.y=driver.root.rotation.y}
 }
 return{root,update,active:()=>near&&options.enabled,inspect:()=>({seconds,officeVisitors:offices.map(o=>({company:o.id,phase:o.journey.at(seconds).phase,position:o.body.root.position.toArray(),visible:o.body.root.visible,...o.body.inspect()})),training:{phase:trainingPhase,players:football.length,positions:football.map(f=>f.actor.holder.position.toArray()),source:'existing authored football clips; decorative rental practice, no match result',error:footballError},delivery:{phase:truckPhase,framesLoaded,preparingRoutes:routePending,loadDuration,routes:routes?.map(r=>({house:r.home.id,door:r.home.door,duration:r.trip.duration,returnDuration:r.back.duration,stopDuration:r.stopDuration})),error:routeError,position:truck.root.position.toArray()},budget:{officePeople:offices.length,footballPeople:sportsCount,trucks:1}}),dispose(){disposed=true;if(routeTimer!==undefined)clearTimeout(routeTimer);staff.forEach(b=>b.dispose());football.forEach(f=>f.actor.dispose());truck.dispose();library.dispose();logoMap.dispose();logoGeo.dispose();logoMat.dispose();ballGeometry.dispose();ballMaterial.dispose();frameGeo.dispose();paperGeo.dispose();frameMat.dispose();printMat.dispose();root.removeFromParent()}}
}
