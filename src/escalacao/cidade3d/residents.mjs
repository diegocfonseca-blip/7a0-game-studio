import * as T from 'three';
import {createCivilian,CIVILIAN_VARIANTS} from './civilians.mjs';
import {cityPopulation} from './population.mjs';
import {acelerarRaios} from '../presidencia-raio-rapido';

/** Reuse the built sidewalks. Never invent roads, buildings or fan tickets. */
export function createResidents(scene,environment,solids=[]){
 const root=new T.Group();root.name='city-residents';scene.add(root);
 const roads=environment.userData.roadNetwork?.streets??[],surfaces=[];
 environment.updateMatrixWorld(true);environment.traverse(n=>{if(n.isMesh&&!n.isInstancedMesh&&(Array.isArray(n.material)?n.material:[n.material]).some(m=>m.userData.civilianPavement))surfaces.push(n)});
 acelerarRaios(surfaces); // ⚡ 25/10: mesmo índice espacial da circulação (que reaproveita) — mesmos pontos de chão, só sem testar todo triângulo
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),routes=[];
 const ground=p=>{ray.set(new T.Vector3(p.x,.6,p.z),down);ray.far=.65;const h=ray.intersectObjects(surfaces,false).find(h=>h.face?.normal.y>.9);return h&&Math.abs(h.point.y-.16)<.03?h.point.y:null};
 for(const road of roads){
  if(routes.length>=32)break; // (mais calçadas: com mais gente, cada um no seu trecho)
  if(!road.walk||road.walk<1.6)continue;
  for(const side of [-1,1]){
   const points=road.points.map((p,i)=>{const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1,offset=side*(road.width/2+road.walk/2);return{x:p.x-(b.z-a.z)/length*offset,z:p.z+(b.x-a.x)/length*offset}});
   for(let i=1;i<points.length;i++){
    const a=new T.Vector3(points[i-1].x,0,points[i-1].z),b=new T.Vector3(points[i].x,0,points[i].z),length=a.distanceTo(b);if(length<12||Math.hypot((a.x+b.x)/2,(a.z+b.z)/2)>280)continue;
    const direction=b.clone().sub(a).normalize();a.addScaledVector(direction,2);b.copy(a).addScaledVector(direction,Math.min(30,length-4));
    const samples=Math.ceil(a.distanceTo(b)/2);let valid=true,y=0;
    for(let n=0;n<=samples;n++){const p=a.clone().lerp(b,n/samples),floor=ground(p);if(floor===null||solids.some(s=>s.base<1.8&&s.top>.15&&p.x>s.minX-.4&&p.x<s.maxX+.4&&p.z>s.minZ-.4&&p.z<s.maxZ+.4)){valid=false;break}y=floor}
    if(valid){a.y=b.y=y;routes.push({id:road.id+'-'+side+'-'+i,a,b,length:a.distanceTo(b),heading:Math.atan2(direction.x,direction.z)})}
   }
  }
 }
 const actors=[];let configuration={enabled:false},seconds=0;
 function configure(value){configuration={...value};const count=routes.length?cityPopulation(value):0;
  while(actors.length>count){actors.pop().body.dispose()}
  while(actors.length<count){const i=actors.length,route=routes[(i*7)%routes.length],body=createCivilian(root,{id:'resident-'+i,variant:CIVILIAN_VARIANTS[i%CIVILIAN_VARIANTS.length].id});actors.push({body,route,offset:i*5.3,position:new T.Vector3(),heading:0,visible:false})}
 }
 function update(time,camera){seconds=Number.isFinite(time)?Math.max(0,time):0;
  for(const [i,a]of actors.entries()){
   const speed=i%8>=6?.85:i%8===2||i%8===3?.8:1.05,travel=a.route.length/speed,turn=.9,period=2*(travel+turn),phase=(seconds+a.offset)%period;
   let distance,heading,moving;
   if(phase<travel){distance=phase*speed;heading=a.route.heading;moving=speed}
   else if(phase<travel+turn){distance=a.route.length;const q=(phase-travel)/turn;heading=a.route.heading+Math.PI*q*q*(3-2*q);moving=0}
   else if(phase<2*travel+turn){distance=a.route.length-(phase-travel-turn)*speed;heading=a.route.heading+Math.PI;moving=speed}
   else{distance=0;const q=(phase-2*travel-turn)/turn;heading=a.route.heading+Math.PI+Math.PI*q*q*(3-2*q);moving=0}
   a.position.copy(a.route.a).lerp(a.route.b,distance/a.route.length);
   // Parallel lanes prevent opposing walkers sharing the same centre line.
   const lane=(i%2===0?1:-1)*.32;a.position.x+=Math.cos(a.route.heading)*lane;a.position.z-=Math.sin(a.route.heading)*lane;
   a.heading=heading;a.body.root.position.copy(a.position);a.body.root.rotation.y=heading;
   const near=camera?camera.position.distanceTo(a.position):0,projected=camera?a.position.clone().add(new T.Vector3(0,.9,0)).project(camera):null;a.visible=near<150&&(!projected||Math.abs(projected.x)<1.4&&Math.abs(projected.y)<1.5&&projected.z>=-1&&projected.z<=1);
   a.body.update({seconds,distance:seconds*speed,speed:moving,visible:a.visible,detail:near>60?'intermediate':'full'});
  }
 }
 return{root,configure,update,count:()=>actors.length,inspect:()=>({source:'existing fanbase and purchased extras; decorative residents, not match attendance',seconds,count:actors.length,routes:routes.length,configuration,actors:actors.map(a=>({...a.body.inspect(),position:a.position.toArray(),heading:a.heading,visible:a.visible}))}),dispose(){actors.forEach(a=>a.body.dispose());root.removeFromParent()}};
}
