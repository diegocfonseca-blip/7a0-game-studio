import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {activityRoute,customerJourney,type CityPoint} from './cidade3d/activity-route.mjs'
import {PLANTA_VADICO,pontoVadico} from './presidencia-complexo-concessionaria'
import {criarAtoresBairro} from './presidencia-bairro-atores-3d'

/** Customers are decorative city residents, not seats/fans, purchases or income. */
export function criarComercioCidade(scene:THREE.Scene){
 const root=new THREE.Group();root.name='city-dealership-customers';scene.add(root)
 const floor=PLANTA_VADICO.floor,point=(x:number,z:number):CityPoint=>pontoVadico({x,z,y:floor})
 // The centre aisle between the real stock cars leads through the actual open
 // door. Separate inbound/outbound lanes fit inside its 3.2 m clear width.
 const paths=[[-.85,0],[.85,1]].map(([lane])=>[...PLANTA_VADICO.access.pedestrian.map(p=>({...p,x:p.x+lane})),point(-154.5+lane,23),point(-158+lane,21)])
 const walkers=paths.map((points,i)=>({body:createCivilian(root,{id:`vadico-customer-${i}`,variant:i?'adult-woman':'adult-man'}),journey:customerJourney(points,{wait:i*12+2,stay:24+i*5}),pose:null as ReturnType<ReturnType<typeof customerJourney>['at']>|null}))
 const vehiclePoints=[...PLANTA_VADICO.access.driveway,point(-140,45),point(-139,47)]
 const drive=activityRoute(vehiclePoints,2.4,1.5),reverse=activityRoute([...vehiclePoints].reverse(),2.4,1.5)
 const vehicle=criarAtoresBairro(scene,{id:'vadico-driver-rig'})
 root.add(vehicle.carro,vehicle.pedestre);vehicle.pedestre.visible=false
 const passenger=createCivilian(root,{id:'vadico-driver',variant:'older-man'})
 const visit=customerJourney([point(-139,45.5),point(-139,44),point(-154.5,44),point(-154.5,31),point(-154.5,26),point(-150,23)],{wait:1.5,stay:25,speed:1.1})
 const parkingTime=visit.period+2,cycle=drive.duration+parkingTime+reverse.duration+12
 let enabled=false,seconds=0,carPose=drive.at(0),carPhase='off',passengerPose:ReturnType<typeof visit.at>|null=null
 function configure(value:{enabled:boolean}){enabled=value.enabled;root.visible=enabled}
 function update(time:number,camera?:THREE.Camera,height=720){
  seconds=time;if(!enabled)return
  for(const w of walkers){w.pose=w.journey.at(seconds);w.body.root.position.set(w.pose.x,w.pose.y,w.pose.z);w.body.root.rotation.y=w.pose.heading;const lod=residentVisibility(w.body.root.position,1.76,camera,height);w.body.update({seconds,distance:w.pose.distance,speed:w.pose.speed,visible:lod.visible,detail:lod.detail})}
  const t=Math.max(0,seconds)%cycle,arrival=drive.duration,departure=arrival+parkingTime;
  carPhase=t<arrival?'arriving':t<departure?'parked':t<departure+reverse.duration?'reversing':'waiting';
  carPose=t<arrival?drive.at(t):t<departure?drive.at(arrival):t<departure+reverse.duration?reverse.at(t-departure):reverse.at(reverse.duration);
  // A real reversing manoeuvre, not an instantaneous 180° rotation at a bay.
  const facing=t>=departure?carPose.heading+Math.PI:carPose.heading;
  const hiddenPedestrian={x:0,y:0,z:0,heading:0,distance:0,speed:0,phase:'waiting' as const,visible:false};vehicle.update({seconds,pedestre:hiddenPedestrian,carro:{...carPose,heading:facing,distance:t<departure?carPose.distance:drive.length-carPose.distance}});vehicle.pedestre.visible=false;
  const alighted=t>=arrival&&t<arrival+visit.period;
  passengerPose=alighted?visit.at(t-arrival):null;
  if(passengerPose){passenger.root.position.set(passengerPose.x,passengerPose.y,passengerPose.z);passenger.root.rotation.y=passengerPose.heading}
  const lod=residentVisibility(passenger.root.position,1.72,camera,height);passenger.update({seconds,distance:passengerPose?.distance??0,speed:passengerPose?.speed??0,visible:alighted&&lod.visible,detail:lod.detail});
 }
 return{root,configure,update,inspect:()=>({enabled,seconds,source:'decorative customers; no purchase or attendance writes',customers:walkers.map(w=>({...w.body.inspect(),pose:w.pose})),driver:{...passenger.inspect(),pose:passengerPose},car:{phase:carPhase,pose:carPose,cycle},routes:{walk:paths,drive:vehiclePoints,driver:visit.inbound.points}}),dispose(){walkers.forEach(w=>w.body.dispose());passenger.dispose();vehicle.dispose();root.removeFromParent()}}
}
