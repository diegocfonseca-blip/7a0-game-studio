import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
registerHooks({
 resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},
 load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)},
})
const {plantaPedestreComplexo}=await import('../src/escalacao/presidencia-complexo-pedestres.ts')
const {PLANTA_COMPLEXO,complexoDoEstadio,mapaParaMundo}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {gerarPlantaTransporte,PLANTAS_ESTACIONAMENTO_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const {STADIUM_EXTRAS,STADIUM_SECTORS}=await import('../src/escalacao/estadiodata.ts')
const {AJUSTES_RUAS_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-ruas.ts')
const inside=(p,polygon)=>{let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result}return result}
const distance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)}
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x)
const segmentDistance=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0?0:Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))
const routesDistance=(a,b)=>Math.min(...a.slice(1).flatMap((p,i)=>b.slice(1).map((q,j)=>segmentDistance(a[i],p,b[j],q))))
const polygonDistance=(polygon,path)=>path.some(p=>inside(p,polygon))?0:routesDistance([...polygon,polygon[0]],path)
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
// The hotel renderer extrudes a 33 m rectangle from edges 5→4. Its original
// navigation polygon alone understates that real building volume.
const hotel=PLANTA_COMPLEXO.footprints.hotel,ha=hotel[5],hb=hotel[4],hl=Math.hypot(hb.x-ha.x,hb.z-ha.z),hdx=(hb.x-ha.x)/hl,hdz=(hb.z-ha.z)/hl
const hotelVolume=[ha,hb,{x:hb.x+hdz*33,z:hb.z-hdx*33},{x:ha.x+hdz*33,z:ha.z-hdx*33}]
const hotelDoor=PLANTA_COMPLEXO.doors.hotel,hc=Math.cos(hotelDoor.heading),hs=Math.sin(hotelDoor.heading)
const hotelAnnex=[[-6,-9.6],[6,-9.6],[6,0],[-6,0]].map(([x,z])=>({x:hotelDoor.x+x*hc+z*hs,z:hotelDoor.z-x*hs+z*hc}))
const reservedBuildings={...PLANTA_COMPLEXO.footprints,'hotel-predio-fisico':hotelVolume,'hotel-anexo-fisico':hotelAnnex}
const mapped=p=>p.map(([x,y])=>mapaParaMundo({x,y}))
const roads=[
 {id:'via-leste',points:mapped([[1640,331],[1521,451],[1475,592],[1410,720]]),radius:5.5},
 {id:'via-oeste',points:mapped([[-65,269],[150,119],[295,48],[354,-65]]),radius:5.5},
 // Assert against the physical realignments: the former western tail ran
 // through the hotel and the former eastern bends occupied parking bays.
 ...['east','west','branch'].map(id=>({id:`interna-${id}`,points:AJUSTES_RUAS_COMPLEXO[id],radius:2.9})),
 ...['roadOut','roadBack'].map(id=>({id,points:PLANTA_COMPLEXO.routes[id].points,radius:Math.hypot(4.2,1.8)/2})),
]
const originalRoutes=JSON.stringify(PLANTA_COMPLEXO.routes),summary=[]
const scenarios=[['vazio',{inv:{},ext:[]}],['loja',{inv:{},ext:['loja']}],['estacao',{inv:{},ext:['estacao']}],['praca',{inv:{},ext:['praca']}],['hotel-terra',{inv:{},ext:['hotel']}],['hotel-asfalto',{inv:{},ext:['hotel','asfalto']}],['completo',full]]
for(const [stage,invested] of [0,20,40,60,70].entries())for(const paved of [false,true])
 scenarios.push([`estac-${stage}-${paved?'asfalto':'terra'}`,{inv:{},ext:[...(stage===4?['estac']:[]),...(paved?['asfalto']:[])],estacionamentoInvestido:invested}])
let reservationSnapshot,probes=0
for(const [name,save] of scenarios){
 const before=JSON.stringify(save),state=complexoDoEstadio(save),plan=plantaPedestreComplexo(state),transport=gerarPlantaTransporte(state)
 assert.equal(JSON.stringify(save),before,'planejamento não escreve no save')
 assert.equal(JSON.stringify(PLANTA_COMPLEXO.routes),originalRoutes,'caminhos e relógios dos atores existentes não podem mudar')
 assert.deepEqual(plantaPedestreComplexo(state),plan,'plano determinístico')
 assert.equal(plan.metadata.count,plan.walks.length)
 assert.equal(new Set(plan.walks.map(w=>w.id)).size,plan.walks.length)
 assert.equal(plan.walks.some(w=>w.id==='pedestre-loja-portao'),!!state.extras.loja)
 assert.equal(plan.walks.filter(w=>w.id.startsWith('pedestre-estacao-')).length,state.extras.estacao?2:0)
 assert.equal(plan.walks.filter(w=>w.id.startsWith('pedestre-praca-')).length,state.extras.praca?2:0)
 assert.equal(plan.walks.some(w=>w.id==='pedestre-hotel-retorno'),!!state.extras.hotel&&!!state.extras.asfalto)
 assert.equal(plan.walks.filter(w=>w.parkingLot).length,Math.max(0,state.parking.stage-1))
 assert(plan.walks.some(w=>w.id==='pedestre-segunda-parada'),'parada precisa de caminho mesmo semhotel/asfalto')
 if(reservationSnapshot)assert.deepEqual(plan.reservationPolygons,reservationSnapshot,'obras futuras mantêm faixa reservada em todas etapas')
 else reservationSnapshot=plan.reservationPolygons
 for(const walk of plan.walks){
  assert(walk.width>=1.6&&walk.width<=2.6);assert.equal(walk.polygon.length,walk.points.length*2)
  assert(walk.polygon.every(p=>[p.x,p.z].every(Number.isFinite)))
  for(let i=0;i<walk.points.length;i++){
   const p=walk.points[i];assert([p.x,p.y,p.z].every(Number.isFinite));assert(p.y>=.035&&p.y<=.16)
   if(!i)continue
   const a=walk.points[i-1],length=Math.hypot(p.x-a.x,p.z-a.z)
   assert(length>.01);assert(Math.abs(p.y-a.y)/length<=1/12,`${walk.id}: rampa excede 8,33%`)
  }
  for(const [id,polygon] of Object.entries(reservedBuildings)){
   if(walk.portalLot===id){
    assert(!inside(walk.points[0],polygon)&&inside(walk.points.at(-1),polygon),'a costura da porta deve partir do passeio e entrar no destino')
    assert(polygonDistance(polygon,[walk.points[1],walk.points[1]])<1e-6,'a porta coincide com a fachada')
    continue
   }
   const clearance=polygonDistance(polygon,walk.points)-walk.width/2
   assert(clearance>0,`${name}/${walk.id}: invade reserva ${id}; folga=${clearance}`);probes++
  }
  for(const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO){
   if(lot.id!==walk.parkingLot)assert(polygonDistance(lot.polygon,walk.points)>walk.width/2,`${walk.id}: invade outro estacionamento ${lot.id}`)
   for(const slot of lot.slots){assert(polygonDistance(slot.polygon,walk.points)>walk.width/2,`${walk.id}: invade vaga ${slot.id}`);probes++}
  }
  for(const road of roads){
   const clearance=routesDistance(walk.points,road.points)-walk.width/2-road.radius
   assert(clearance>0,`${name}/${walk.id}: atravessa faixa viária ${road.id}; folga=${clearance}`);probes++
  }
  for(const service of transport.services)for(const key of ['inbound','outbound']){
   if(service.kind==='metro')continue // O trem corre sobre a via elevada.
   // Near the second stop, the straight bus body is aligned with its route.
   // A ten-metre circumcircle would incorrectly fill the safe platform as well.
   const clearance=routesDistance(walk.points,service[key])-walk.width/2-service.width/2
   assert(clearance>0,`${walk.id}: corta transporte ${service.id}/${key}; folga=${clearance}`);probes++
  }
  if(walk.parkingLot){
   const own=PLANTAS_ESTACIONAMENTO_COMPLEXO.find(lot=>lot.id===walk.parkingLot)
   assert(inside(walk.points[0],own.polygon),`${walk.id}: acesso não começa no lote`)
   assert.equal(walk.points[0].y,.035);assert.equal(walk.points.at(-1).y,.16)
  }
  if(walk.id==='pedestre-hotel-retorno'){
   const turning=AJUSTES_RUAS_COMPLEXO.turning,first=walk.points[0],last=walk.points.at(-1)
   assert(Math.abs(Math.hypot(first.x-turning.center.x,first.z-turning.center.z)-turning.radius-turning.walk/2)<1e-6,'hotel começa no eixo do passeio do retorno')
   assert(Math.hypot(last.x-hotelDoor.approach.x,last.z-hotelDoor.approach.z)<1e-8,'hotel termina no acesso real da recepção')
   for(const p of walk.polygon)assert(Math.hypot(p.x-turning.center.x,p.z-turning.center.z)>turning.radius,'passeio do hotel não invade o disco de asfalto')
  }
 }
 const secondStop=plan.walks.find(w=>w.id==='pedestre-segunda-parada')
 assert(transport.bus.walk.some(p=>Math.hypot(p.x-secondStop.points.at(-1).x,p.z-secondStop.points.at(-1).z)<1e-8),'segunda parada deve alcançar o passeio efetivo')
 const east=plan.walks.find(w=>w.parkingLot==='leste')
 if(east){const service=transport.services.find(s=>s.kind==='car');assert(service.passengerRoute.some(p=>Math.hypot(p.x-east.points.at(-1).x,p.z-east.points.at(-1).z)<1e-8),'leste precisa conectar primeiro lote sem exigirpraca')}
 summary.push({name,walks:plan.walks.length,parking:state.parking.stage})
}
assert.deepEqual(plantaPedestreComplexo({...complexoDoEstadio(full),valid:false}).walks,[])
// A caller may consume/transform its own returned points without changing the
// registered scene or any subsequent plan.
const first=plantaPedestreComplexo(complexoDoEstadio(full)),again=JSON.stringify(first)
first.walks[0].points[0].x=1e9
assert.equal(JSON.stringify(plantaPedestreComplexo(complexoDoEstadio(full))),again)
console.log('PASS pedestres: 10 costuras físicas, 4 etapas de estacionamento, reservas/vagas e trânsito livres, rampas suaves e atores/save preservados.',{probes,summary})

if(process.argv.includes('--geometry')){
 const THREE=await import('three'),{criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
 const down=new THREE.Vector3(0,-1,0),ray=new THREE.Raycaster(),physical=[]
 for(const [name,save] of [['varzea',{inv:{},ext:[]}],['praca-isolada',{inv:{},ext:['praca']}],['hotel-asfalto',{inv:{},ext:['hotel','asfalto']}],['lotes-sem-asfalto',{inv:{},ext:['estac']}],['completo',full]]){
  const state=complexoDoEstadio(save),plan=plantaPedestreComplexo(state),scene=new THREE.Scene(),env=criarEntornoComplexo(scene,state),meshes=[]
  scene.updateMatrixWorld(true);env.root.traverse(o=>{if(o.isMesh)meshes.push(o)})
  assert.equal(env.root.userData.pedestrianNetwork.count,plan.walks.length)
  let floorSamples=0,bodySamples=0
  for(const walk of plan.walks)for(let i=1;i<walk.points.length;i++){
   const a=walk.points[i-1],b=walk.points[i],length=Math.hypot(b.x-a.x,b.z-a.z),nx=(b.z-a.z)/length,nz=-(b.x-a.x)/length
   for(const offset of [-.35,0,.35]){
    const steps=Math.ceil(length/.4)
    for(let j=0;j<=steps;j++){
     const t=j/steps,p={x:a.x+(b.x-a.x)*t+nx*offset,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t+nz*offset}
     ray.set(new THREE.Vector3(p.x,p.y+.3,p.z),down);ray.near=0;ray.far=.8
     const hit=ray.intersectObjects(meshes,false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.85)
     assert(hit&&Math.abs(hit.point.y-p.y)<.035,`${name}/${walk.id}: piso sem continuidade em ${p.x},${p.z}; y=${hit?.point.y}, esperado=${p.y}`);floorSamples++
    }
    for(const height of [.4,1,1.75]){
     const start=new THREE.Vector3(a.x+nx*offset,a.y+height,a.z+nz*offset),end=new THREE.Vector3(b.x+nx*offset,b.y+height,b.z+nz*offset)
     ray.set(start,end.clone().sub(start).normalize());ray.near=.01;ray.far=start.distanceTo(end)
     const hit=ray.intersectObjects(meshes,false)[0]
     assert(!hit,`${name}/${walk.id}: passagem obstruída em ${hit?.point.toArray()} por ${hit?.object.name}`);bodySamples++
    }
   }
  }
  env.dispose();physical.push({name,floorSamples,bodySamples})
 }
 console.log('PASS piso e passagem das ligações pedestres na geometria real.',physical)
}
