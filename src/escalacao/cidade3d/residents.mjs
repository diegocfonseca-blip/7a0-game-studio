import {isPlayerServiceArea} from './spectator-access.mjs';
import * as T from 'three';
import {createCivilian,CIVILIAN_VARIANTS} from './civilians.mjs';
import {residentVisibility} from './resident-visibility.mjs';
import {sidewalkRoute,residentWalk} from './resident-walk.mjs';
import {walkNetwork} from './walk-network.mjs';
import {customerJourney} from './activity-route.mjs';
import {residentGatherings,residentJob,companionGathering} from './resident-gatherings.mjs';
import {cityPopulation} from './population.mjs';
import {acelerarRaios} from '../presidencia-raio-rapido';

/** Reuse the built sidewalks. Never invent roads, buildings or fan tickets. */
export function createResidents(scene,environment,solids=[]){
 const started=performance.now();
 const root=new T.Group();root.name='city-residents';scene.add(root);
 const roads=environment.userData.roadNetwork?.streets??[],surfaces=[];
 environment.updateMatrixWorld(true);environment.traverse(n=>{if(n.isMesh&&!n.isInstancedMesh&&(Array.isArray(n.material)?n.material:[n.material]).some(m=>m.userData.civilianPavement))surfaces.push(n)});
 acelerarRaios(surfaces); // ⚡ 25/10: mesmo índice espacial da circulação (que reaproveita) — mesmos pontos de chão, só sem testar todo triângulo
 // Broad-phase buckets avoid testing every facade and every material batch
 // for each walking sample. The final test uses the real footprint, not the
 // axis-aligned bounding box of a rotated house.
 const buckets=new Map(),surfaceBuckets=new Map(),CELL=64;
 const put=(map,item,b)=>{for(let x=Math.floor(b.minX/CELL);x<=Math.floor(b.maxX/CELL);x++)for(let z=Math.floor(b.minZ/CELL);z<=Math.floor(b.maxZ/CELL);z++){const key=x+':'+z,list=map.get(key)??[];list.push(item);map.set(key,list)}};
 for(const s of [...solids,...(environment.userData.residentObstacles??[])])if(s.base<1.8&&s.top>.15)put(buckets,s,{minX:s.minX-.7,maxX:s.maxX+.7,minZ:s.minZ-.7,maxZ:s.maxZ+.7});
 for(const mesh of surfaces){mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);put(surfaceBuckets,mesh,{minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z})}
 const at=(map,p)=>map.get(Math.floor(p.x/CELL)+':'+Math.floor(p.z/CELL))??[];
 const inFootprint=(p,s,r)=>{if(p.x<s.minX-r||p.x>s.maxX+r||p.z<s.minZ-r||p.z>s.maxZ+r)return false;const poly=s.footprint;if(!poly?.length)return true;let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)<r)return true;if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside}return inside};
 const safe=(p,r=.25)=>!isPlayerServiceArea(p)&&!at(buckets,p).some(s=>inFootprint(p,s,r));
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),routes=[];
 const ground=p=>{ray.set(new T.Vector3(p.x,.6,p.z),down);ray.far=.65;const h=ray.intersectObjects(at(surfaceBuckets,p),false).find(h=>h.face?.normal.y>.9);return h&&Math.abs(h.point.y-.16)<.03?h.point.y:null};
 const valid=p=>safe(p,.68)&&Math.hypot(p.x,p.z)<760&&[[0,0],[.48,0],[-.48,0],[0,.48],[0,-.48]].every(([x,z])=>ground({x:p.x+x,z:p.z+z})!==null);
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
 // Build one physical graph, shared by every resident. The same limited actor
 // pool can reach houses in the outer neighbourhoods and actual shop doors.
 const paths=roads.filter(r=>r.walk>=1.4).flatMap(r=>[-1,1].map(side=>({points:r.points.map((p,i)=>{const a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1,o=side*(r.width/2+r.walk/2);return{x:p.x-(b.z-a.z)*o/n,y:.16,z:p.z+(b.x-a.x)*o/n}})})));
 for(const c of environment.userData.roadNetwork?.crossings??[])paths.push({points:c.points,crossing:true});
 for(const w of environment.userData.pedestrianNetwork?.walks??[])paths.push({points:w.points,crossing:false});
 const supportCache=new Map();
 const supported=(p,crossing=false)=>{const k=Math.round(p.x*20)+':'+Math.round(p.z*20)+':'+crossing;if(supportCache.has(k))return supportCache.get(k);const ok=safe(p)&&(crossing||ground(p)!==null);supportCache.set(k,ok);return ok};
 const clear=(a,b,crossing=false)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/1.2));for(let k=0;k<=n;k++){const t=k/n;if(!supported({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},crossing))return false}return true};
 const network=walkNetwork(paths,supported,clear),homes=(environment.userData.residentialDoors??[]).map(h=>({...h,node:network.nearest(h.curb,15)})).filter(h=>h.node>=0);
 const destinations=[...(environment.userData.parkEntrances??[]).flatMap((p,i)=>p.points.map((point,j)=>({id:'praca-'+i+'-'+j,purpose:'passeio',point}))),...(environment.userData.residentDestinations??[])].map(d=>({...d,node:network.nearest(d.point,20)})).filter(d=>d.node>=0);
 const neighbourDestinations=homes.map(h=>({id:h.id,purpose:'visita',point:h.curb,node:h.node,access:[h.curb,h.door,h.inside]}));
 const journeys=[],rejections={noDestination:0,noPath:0,blockedHome:0};
 for(let i=0;i<Math.min(400,homes.length)&&journeys.length<80;i++){
  const h=homes[Math.floor(i*homes.length/Math.min(400,homes.length))],nearby=d=>d.id!==h.id&&network.component[d.node]===network.component[h.node]&&Math.hypot(d.point.x-h.curb.x,d.point.z-h.curb.z)>25;const preferred=destinations.filter(nearby),goals=(preferred.length?preferred:neighbourDestinations).filter(d=>network.component[d.node]===network.component[h.node]&&Math.hypot(d.point.x-h.curb.x,d.point.z-h.curb.z)>25).sort((a,b)=>Math.hypot(a.point.x-h.curb.x,a.point.z-h.curb.z)-Math.hypot(b.point.x-h.curb.x,b.point.z-h.curb.z));
  const d=goals[i%Math.min(3,goals.length)];if(!d){rejections.noDestination++;continue}const walk=network.path(h.node,d.node);if(!walk||walk.length<3){rejections.noPath++;continue}
  // The house threshold is the only permitted end inside its own facade.
  const door={...h.door,y:.16},curb={...h.curb,y:.16};if(!clear(door,curb,true)||!clear(curb,walk[0],true)){rejections.blockedHome++;continue}
  const access=d.access&&clear(walk.at(-1),d.point,true)?d.access.map(p=>({...p,y:.16})):[];const points=[door,curb,...walk,...access];journeys.push({hideInside:access.length>0,id:h.id+'>'+d.id,home:h.id,destination:d.id,purpose:d.purpose,journey:customerJourney(points,{speed:1.05,wait:12+i%9*3,stay:18+i%7*5}),position:door});
 }
 const gatherings=residentGatherings(environment.userData.residentHotspots??[],valid);
 const companions=new Map(gatherings.map(job=>[job,companionGathering(job,valid)]));
 const buildMs=performance.now()-started;
 const actors=[];let configuration={enabled:false},seconds=0;
 function configure(value){configuration={...value};const count=routes.length?cityPopulation(value):0;
  while(actors.length>count){actors.pop().body.dispose()}
  while(actors.length<count){const i=actors.length,route=routes[i%routes.length],job=residentJob(i,gatherings,journeys),body=createCivilian(root,{id:'resident-'+i,variant:CIVILIAN_VARIANTS[i%CIVILIAN_VARIANTS.length].id,deferUntilVisible:true});actors.push({body,route,job,height:CIVILIAN_VARIANTS[i%CIVILIAN_VARIANTS.length].height,offset:job?(i*17.13)%job.journey.period:(.16+((i*.38196601125)%.68))*route.length/1.05,position:new T.Vector3(),heading:0,visible:false})}
  // Children accompany a known adult along the same safe journey.
  for(let i=0;i<actors.length;i++)if(i%8>=6){const parent=actors[i-2];actors[i].job=companions.get(parent.job)??parent.job;actors[i].route=parent.route;actors[i].offset=parent.offset-(parent.job?.publicWaiting?0:.9);actors[i].guardian=i-2}

 }
 function update(time,camera,viewportHeight=720){seconds=Number.isFinite(time)?Math.max(0,time):0;
  for(const [i,a]of actors.entries()){
   const speed=a.guardian!==undefined?1.05:i%8===2||i%8===3?.8:1.05,pose=a.job?a.job.journey.at(Math.max(0,seconds+a.offset)):residentWalk(a.route,seconds+a.offset,{speed});
   a.position.set(pose.x,pose.y,pose.z);a.heading=pose.heading;a.pose=pose;a.body.root.position.copy(a.position);a.body.root.rotation.y=pose.heading;
   const lod=residentVisibility(a.position,a.height,camera,viewportHeight);a.visible=lod.visible&&(!a.job||(a.job.publicWaiting||pose.phase!=='waiting')&&!(a.job.hideInside&&pose.phase==='visiting'));a.detail=lod.detail;
   a.body.update({seconds,distance:pose.distance,speed:pose.speed,visible:a.visible,detail:lod.detail});
  }
 }
 return{root,configure,update,count:()=>actors.length,inspect:()=>({source:'existing fanbase and purchased extras; decorative residents, not match attendance',seconds,count:actors.length,network:network.inspect(),buildMs,rejections,homes:homes.length,destinations:destinations.length,purposefulJourneys:journeys.length,gatherings:gatherings.map(j=>({id:j.id,destination:j.destination,points:j.points})),routes:routes.length,routeLengths:routes.map(r=>({id:r.id,length:r.length})),configuration,actors:actors.map(a=>({...a.body.inspect(),route:a.job?.id??a.route.id,purpose:a.job?.purpose??'passeio',home:a.job?.home,destination:a.job?.destination,guardian:a.guardian,speed:a.pose?.speed??0,walkDistance:a.pose?.distance??0,phase:a.pose?.phase,detail:a.detail,position:a.position.toArray(),heading:a.heading,visible:a.visible,supported:a.job?.publicWaiting?valid(a.position):undefined}))}),dispose(){actors.forEach(a=>a.body.dispose());root.removeFromParent()}};
}
