import * as T from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {customerJourney} from './cidade3d/activity-route.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {TERRENO_USUARIO as H} from './residencia-planta'
import {ARENA_ONLINE as A} from './arena-planta'
import {LOTE_AGENCIA_CLUBE as G} from './clube-mapa-destinos'
import {segmentoLivre} from './presidencia-estadio-navegacao'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** Exterior visits to existing addresses. No room entry, save, booking or purchase. */
export function criarVidaLocais(scene:T.Scene,environment:T.Object3D,solids:readonly SolidoEntorno[],enabled:boolean,onReady:()=>void,mesasEnabled=enabled){
 const root=new T.Group();root.name='visitas-locais-do-clube';scene.add(root)
 const meshes:T.Mesh[]=[];environment.updateMatrixWorld(true);environment.traverse(n=>{if(n instanceof T.Mesh)meshes.push(n)})
 const ray=new T.Raycaster(),ground=(x:number,z:number)=>{ray.set(new T.Vector3(x,.6,z),new T.Vector3(0,-1,0));ray.far=1;const h=ray.intersectObjects(meshes,false).find(h=>h.face&&h.face.normal.y>.8);return{x,z,y:(h?.point.y??0)+.003}}
 const specs=[
  {id:'agencia',variant:'older-woman',occupation:'office',points:G.visit.map(p=>[p.x,p.z]),stay:17},
  {id:'arena',variant:'adult-man',points:[[A.x-7,A.z+12],[A.x,A.z+12],[A.x,A.z+10.4]],stay:22},
  {id:'casa',variant:'adult-woman',points:[[H.garage.x,H.z+H.depth/2+1],[H.garage.x,H.z+8],[H.house.x,H.z+8],[H.house.x,H.house.z+H.house.depth/2+.8]],stay:12},
 ]
 const obstacles=solids.filter(s=>s.base<1.8&&s.top>.2).map(s=>({id:s.id,polygon:s.footprint.map(p=>({x:p.x,y:p.z}))})),issues:string[]=[]
 const people=enabled?specs.flatMap((spec,i)=>{
  if(spec.points.some((p,k)=>k&&!segmentoLivre({x:spec.points[k-1][0],y:spec.points[k-1][1]},{x:p[0],y:p[1]},obstacles,.26))){issues.push(spec.id);return[]}
  const journey=customerJourney(spec.points.map(([x,z])=>ground(x,z)),{speed:.95,wait:12+i*9,stay:spec.stay,turnAtExit:true}),body=createCivilian(root,{id:'visita-'+spec.id,variant:spec.variant,occupation:spec.occupation,deferUntilVisible:true,onReady});return[{spec,body,journey,phase:'waiting'}]
 }):[]
 // 🍔 08/11: gente sentada nas mesas do terraço da Praça de Alimentação (a vista "Praça" mostrava as mesas vazias).
 // Uma pessoa por mesa, alternando o lado do banco; ninguém anda, então nada atravessa guarda-sol ou quiosque. São só 10 e
 // sentadas: valem também no Leve (o celular abre no Leve e senão a praça continuava vazia nele).
 const todas=(environment.userData.pracaMesas??[]) as {x:number;z:number;y:number}[]
 const cx=todas.reduce((s,m)=>s+m.x,0)/Math.max(1,todas.length),cz=todas.reduce((s,m)=>s+m.z,0)/Math.max(1,todas.length)
 // as 10 mesas do meio do terraço, que é pra onde a vista da Praça olha
 const mesas=[...todas].sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz)).slice(0,10)
 const variants=['adult-man','adult-woman','older-man','child-girl','adult-woman','older-woman','adult-man','child-boy']
 const diners=mesasEnabled?mesas.map((m,i)=>{const side=i%2?1:-1;const body=createCivilian(root,{id:'praca-mesa-'+i,variant:variants[i%variants.length],deferUntilVisible:true,onReady})
  body.root.position.set(m.x+side*1.03,m.y,m.z);body.root.rotation.y=side<0?Math.PI/2:-Math.PI/2;return{body,offset:i*3.7}}):[]
 function update(seconds:number,camera:T.Camera,height:number,period='day'){
  for(const d of diners){const lod=residentVisibility(d.body.root.position,1.3,camera,height);d.body.update({seconds:seconds+d.offset,distance:0,speed:0,seated:1,visible:lod.visible&&period==='day',detail:lod.detail})}
  for(const p of people){const pose=p.journey.at(seconds);p.phase=pose.phase;p.body.root.position.set(pose.x,pose.y,pose.z);p.body.root.rotation.y=pose.heading;const lod=residentVisibility(p.body.root.position,1.7,camera,height);p.body.update({seconds,distance:pose.distance,speed:pose.speed,visible:lod.visible&&(period==='day'||p.spec.id==='arena'),detail:lod.detail})}
 }
 return{update,inspect:()=>({count:people.length,diners:diners.length,blocked:issues,people:people.map(p=>({place:p.spec.id,phase:p.phase,position:p.body.root.position.toArray(),visible:p.body.root.visible})),officialStateWrites:0}),dispose(){people.forEach(p=>p.body.dispose());diners.forEach(d=>d.body.dispose());root.removeFromParent()}}
}
