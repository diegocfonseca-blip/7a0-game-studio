import {activityRoute} from './activity-route.mjs';
import {roundCoachRoute} from './coach-access.mjs';
export const VENDOR_VAN={width:1.78,length:4.28,height:2.13,wheelRadius:.32};
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
/** A booth travels by van; cooler sellers deliberately have no vehicle.
 * All times are local presentation times, never fixture/economy time. */
export function vendorDelivery(spec,index=0,floor=()=>0){
 if(spec.kind==='cooler')return null;
 const side=spec.x<0?-1:1,x=spec.x+side*5,z=108.5,point=(x,z,y=floor(x,z))=>({x,y,z}),measure=points=>points.map(p=>({...p,y:floor(p.x,p.z)}));
 const measuredWalk=points=>{const dense=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.3));for(let j=i===1?0:1;j<=n;j++){const u=j/n;dense.push(point(a.x+(b.x-a.x)*u,a.z+(b.z-a.z)*u))}}return dense};
 // 🚐 04/11: a Kombi chega pela PISTA PARALELA — parada na vaga de carga, entra pelo portão de serviço (x≈30) e desce até a barraca.
 // Os números são os da pista (presidencia-complexo-transporte-model.ts, naPista): meio-fio em z≈199,6 · pista em z≈199,3.
 const incoming=activityRoute(measure(roundCoachRoute([point(23.4,199.5),point(30.2,199.1),point(30,165),point(30,120),point(x,120),point(x,z)],3.2)),3.2,1.2);
 const circle=Array.from({length:49},(_,i)=>{const a=side>0?Math.PI+i*Math.PI/48:-i*Math.PI/48;return point(x+side*4+Math.cos(a)*4,109+Math.sin(a)*4)});
 const exitX=x+side*8,saida=[point(30,199.3),point(43.2,199.5),point(49.8,198.7),point(61.8,196.2),point(77.2,200.4),point(86,198),point(103,190),point(123,179)],leaving=roundCoachRoute(exitX===30?[point(30,109),point(30,165),...saida]:[point(exitX,109),point(exitX,120),point(30,120),point(30,165),...saida],4.4);
 const backing=activityRoute([point(x,z),point(x,109)],.8,.5),outgoing=activityRoute(measure([...circle,...leaving.slice(1)]),2.6,1.2);
 const rear=point(x,z+3.2),destination=point(spec.x,spec.z-1.1);
 const cargo=activityRoute(measuredWalk([rear,point(x-side*2.5,z+3.2),point(x-side*2.5,destination.z),destination]),1.05,.5),returnCargo=activityRoute([...cargo.points].reverse(),1.05,.5);
 const exitDriver=activityRoute([point(x+.45,z-1.3,floor(x,z)+.55),point(x+1.25,z-1.3,floor(x,z)+.55),point(x+1.45,z-1.3),...measuredWalk([point(x+1.45,z-1.3),point(x+1.45,z+3.2),rear]).slice(1)],1,.35),enterDriver=activityRoute([...exitDriver.points].reverse(),1,.35);
 const start=18+index*4,park=start+incoming.duration,unload=park+.8+exitDriver.duration,carry=unload+3,assemble=carry+cargo.duration,ready=assemble+12;
 const returnAt=178+index*2,loadAt=returnAt+returnCargo.duration,boardAt=loadAt+3,departAt=boardAt+enterDriver.duration+.8,end=departAt+backing.duration+outgoing.duration;
 const stopped={...point(x,z),heading:Math.PI,speed:0,distance:incoming.length,done:true};
 const driverAt=pose=>({...pose,x:pose.x-.45*Math.cos(pose.heading)+1.3*Math.sin(pose.heading),y:pose.y+.55,z:pose.z+.45*Math.sin(pose.heading)+1.3*Math.cos(pose.heading),speed:0,seated:1,done:false});
 const rearPose={...cargo.at(0),heading:Math.PI,speed:0,seated:0},stand={...cargo.at(cargo.duration),heading:0,speed:0,seated:0};
 function at(day){
  const departure=day?.phase==='departure',late=day?.joinedLate||day?.phase!=='arrival',t=departure?day.phaseElapsed:day?.elapsed??0;
  let vehicle=stopped,person=stand,phase='trading',hatch=0,driverDoor=0,setup=1,visible=true,cartVisible=false,cartPose=stand,load=1;
  if(departure){
   setup=1-smooth((t-150)/28);phase=t<150?'trading':t<returnAt?'packing':'returning-cargo';
   if(t>=returnAt&&t<loadAt){person={...returnCargo.at(t-returnAt),seated:0};cartVisible=true;cartPose=person;load=1;hatch=smooth(t-loadAt+1)}
   else if(t>=loadAt&&t<boardAt){person=rearPose;cartPose=rearPose;cartVisible=true;hatch=1;load=1-smooth((t-loadAt)/3);phase='loading'}
   else if(t>=boardAt&&t<departAt){const local=t-boardAt;person={...enterDriver.at(local),seated:clamp((local-enterDriver.duration+1.5)/.8)};driverDoor=smooth((local-enterDriver.duration+2.2)/.6)*(1-smooth((local-enterDriver.duration)/.8));phase='boarding';load=0}
   else if(t>=departAt){const local=t-departAt;vehicle=local<backing.duration?{...backing.at(local),heading:Math.PI,distance:incoming.length-backing.at(local).distance}:{...outgoing.at(local-backing.duration),distance:incoming.length-backing.length+outgoing.at(local-backing.duration).distance};person=driverAt(vehicle);visible=t<end;phase=visible?'leaving':'gone';load=0}
  }else if(!late){
   if(t<park){vehicle=incoming.at(t-start);person=driverAt(vehicle);visible=t>=start;setup=0;phase=visible?'arriving':'waiting';load=0}
   else if(t<unload){const local=t-park-.8;person={...exitDriver.at(local),seated:clamp(1-(local-.7)/.8)};driverDoor=smooth((t-park)/.8)*(1-smooth((t-park-2.2)/.8));setup=0;phase='alighting';load=0}
   else if(t<carry){person=rearPose;hatch=smooth((t-unload)/.8);cartVisible=true;cartPose=rearPose;load=smooth((t-unload)/3);setup=0;phase='unloading'}
   else if(t<assemble){person={...cargo.at(t-carry),seated:0};cartVisible=true;cartPose=person;load=1;setup=0;hatch=1-smooth((t-carry)/1.5);phase='carrying'}
   else{setup=smooth((t-assemble)/12);person={...stand,heading:0};phase=setup<1?'assembling':'trading'}
  }
  return{phase,visible,vehicle,person:{...person,seated:person.seated??0},hatch,driverDoor,setup,stallVisible:setup>0,cartVisible,cartPose,load,packed:departure&&t>=returnAt,done:departure&&t>=end};
 }
 return{id:spec.id,parking:{x,y:floor(x,z),z,heading:Math.PI},incoming,outgoing,backing,cargo,returnCargo,exitDriver,enterDriver,timing:{start,park,unload,carry,assemble,ready,returnAt,loadAt,boardAt,departAt,end},at};
}
