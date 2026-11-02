import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {customerJourney} from './cidade3d/activity-route.mjs'
import type {StadiumDayFrame} from './cidade3d/stadium-day.mjs'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import type {BotecoBairro} from './presidencia-boteco-bairro'
const clamp=(v:number)=>Math.max(0,Math.min(1,v))
export function criarVidaBotecos(scene:THREE.Scene,pubs:readonly BotecoBairro[],onReady:()=>void){
 const root=new THREE.Group();root.name='neighbourhood-pub-life';scene.add(root)
 const actors=pubs.flatMap((pub,pubIndex)=>pub.tables.map((seat,index)=>{const start={x:pub.root.position.x+(index-2.5)*.8,y:.16,z:pub.root.position.z+13.3},path=[start,{x:pub.root.position.x,y:.16,z:start.z},{x:pub.root.position.x,y:.16,z:seat.z},{x:seat.x,y:seat.y,z:seat.z}],wait=index*3+1,stay=55+index*4,journey=customerJourney(path,{wait,stay,speed:.85,turnAtExit:true}),body=createCivilian(root,{deferUntilVisible:true,id:pub.id+'-patron-'+index,variant:index%2?'adult-woman':'adult-man',outfitColor:pubIndex?'#bd5948':'#d8d3c0',onReady});return{pub:pub.id,body,journey,seat,index,wait,stay,origin:0,retire:Infinity,active:false}}))
 const staff=pubs.map((pub,i)=>({pub,body:createCivilian(root,{deferUntilVisible:true,id:pub.id+'-barman',variant:i?'adult-woman':'older-man',outfitColor:'#d8d1b7',onReady})}))
 let desired=0,stage='everyday',last=0,enabled=false
 function configure(input:{day?:StadiumDayFrame;journey?:JornadaComplexo;mobile:boolean;supporters:number;enabled:boolean}){enabled=input.enabled;const d=input.day;stage=d?.active?d.phase==='arrival'?'pregame':d.phase==='departure'?'postgame':d.phase==='interval'?'interval':'playing':'everyday';desired=stage==='pregame'||stage==='postgame'?input.mobile?3:6:stage==='interval'?input.mobile?2:4:1;if(stage==='postgame'&&(d?.phaseElapsed??0)>150)desired=0;if(input.supporters<=0&&stage!=='everyday')desired=Math.min(desired,1);const j=input.journey,text=j?.calendarKnown?`${j.weekday==='domingo'?'DOMINGO':'QUARTA'} ${j.kickoffTime?.replace(':','H')??''}`:'FUTEBOL NO BAIRRO';pubs.forEach(pub=>pub.setFixture(text))}
 function update(time:number,camera?:THREE.Camera,height=720){if(time<last)actors.forEach(a=>{a.active=false;a.retire=Infinity});last=time;root.visible=enabled;if(!enabled)return
  for(const s of staff){s.body.root.position.set(s.pub.root.position.x,.16,s.pub.root.position.z-3.65);const lod=residentVisibility(s.body.root.position,1.76,camera,height);s.body.update({seconds:time,distance:0,speed:0,visible:lod.visible,detail:lod.detail})}
  for(const a of actors){if(a.index<desired){if(!a.active){a.origin=time;a.active=true}a.retire=Infinity}else if(a.active&&a.retire===Infinity)a.retire=a.origin+(Math.floor((time-a.origin)/a.journey.period)+1)*a.journey.period;if(time>=a.retire)a.active=false;const local=Math.max(0,time-a.origin),pose=a.journey.at(local),cycle=local%a.journey.period,arrive=a.wait+a.journey.inbound.duration,seated=pose.phase==='visiting'?clamp((cycle-arrive)/1.4)*clamp((arrive+a.stay-cycle)/1.4):0;
   a.body.root.position.set(pose.x,pose.y,pose.z);a.body.root.rotation.y=seated>.01?a.seat.heading:pose.heading;const lod=residentVisibility(a.body.root.position,1.76,camera,height);a.body.update({seconds:time,distance:pose.distance,speed:pose.speed,seated,transition:cycle>arrive+a.stay-1.4?'standing':undefined,visible:a.active&&lod.visible,detail:lod.detail})
  }
 }
 return{root,configure,update,inspect:()=>({stage,desiredPerPub:desired,source:'neighbourhood businesses; no club purchases, tickets or income',calendarDaysBeforeKnown:false,staff:staff.map(s=>({pub:s.pub.id,ready:s.body.inspect().ready})),pubs:pubs.map(p=>({id:p.id,name:p.name,position:p.root.position.toArray(),tables:p.tables.length})),people:actors.map(a=>({pub:a.pub,index:a.index,active:a.active,visible:a.body.root.visible,ready:a.body.inspect().ready,position:a.body.root.position.toArray()}))}),dispose(){staff.forEach(s=>s.body.dispose());actors.forEach(a=>a.body.dispose());root.removeFromParent()}}
}
