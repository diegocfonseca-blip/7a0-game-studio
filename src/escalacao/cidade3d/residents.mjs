import * as T from 'three';
import {createCivilian,CIVILIAN_VARIANTS} from './civilians.mjs';
import {residentVisibility} from './resident-visibility.mjs';
import {sidewalkRoute,residentWalk} from './resident-walk.mjs';
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
 // Validate the swept walking lane, including shoulders and the small
 // U-turn arc, against existing pavement and building footprints.
 const valid=p=>{
  if(Math.hypot(p.x,p.z)>280||solids.some(s=>s.base<1.8&&s.top>.15&&p.x>s.minX-.68&&p.x<s.maxX+.68&&p.z>s.minZ-.68&&p.z<s.maxZ+.68))return false;
  return [[0,0],[.48,0],[-.48,0],[0,.48],[0,-.48]].every(([x,z])=>ground({x:p.x+x,z:p.z+z})!==null);
 };
 for(const road of roads){
  if(routes.length>=32)break;
  if(!road.walk||road.walk<1.6)continue;
  for(const side of [-1,1]){
   const points=road.points.map((p,i)=>{const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1,offset=side*(road.width/2+road.walk/2);return{x:p.x-(b.z-a.z)/length*offset,y:.16,z:p.z+(b.x-a.x)/length*offset}});
   let run=[],part=0;
   const finish=()=>{
    // Keep end turns away from an intersection edge/obstruction. Long safe
    // stretches stay connected, rather than turning every thirty metres.
    if(run.length>6&&routes.length<32){const route=sidewalkRoute(run.slice(2,-2),valid);if(route)routes.push({...route,id:road.id+'-'+side+'-'+part++})}
    run=[];
   };
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(length/1.25);
    for(let j=i===1?0:1;j<=n;j++){const u=j/n,p={x:a.x+(b.x-a.x)*u,y:.16,z:a.z+(b.z-a.z)*u};if(valid(p))run.push(p);else finish()}
   }
   finish();
  }
 }
 const actors=[];let configuration={enabled:false},seconds=0;
 function configure(value){configuration={...value};const count=routes.length?cityPopulation(value):0;
  while(actors.length>count){actors.pop().body.dispose()}
  while(actors.length<count){const i=actors.length,route=routes[i%routes.length],body=createCivilian(root,{id:'resident-'+i,variant:CIVILIAN_VARIANTS[i%CIVILIAN_VARIANTS.length].id});actors.push({body,route,height:CIVILIAN_VARIANTS[i%CIVILIAN_VARIANTS.length].height,offset:i*5.3,position:new T.Vector3(),heading:0,visible:false})}
 }
 function update(time,camera,viewportHeight=720){seconds=Number.isFinite(time)?Math.max(0,time):0;
  for(const [i,a]of actors.entries()){
   const speed=i%8>=6?.85:i%8===2||i%8===3?.8:1.05,pose=residentWalk(a.route,seconds+a.offset,{speed});
   a.position.set(pose.x,pose.y,pose.z);a.heading=pose.heading;a.pose=pose;a.body.root.position.copy(a.position);a.body.root.rotation.y=pose.heading;
   const lod=residentVisibility(a.position,a.height,camera,viewportHeight);a.visible=lod.visible;a.detail=lod.detail;
   a.body.update({seconds,distance:pose.distance,speed:pose.speed,visible:a.visible,detail:lod.detail});
  }
 }
 return{root,configure,update,count:()=>actors.length,inspect:()=>({source:'existing fanbase and purchased extras; decorative residents, not match attendance',seconds,count:actors.length,routes:routes.length,routeLengths:routes.map(r=>({id:r.id,length:r.length})),configuration,actors:actors.map(a=>({...a.body.inspect(),route:a.route.id,speed:a.pose?.speed??0,walkDistance:a.pose?.distance??0,phase:a.pose?.phase,detail:a.detail,position:a.position.toArray(),heading:a.heading,visible:a.visible}))}),dispose(){actors.forEach(a=>a.body.dispose());root.removeFromParent()}};
}
