import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname } from 'node:path'
import * as THREE from 'three'
const sourceRoot=new URL('../src/escalacao/',import.meta.url).href
const hooks=registerHooks({
 resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith(sourceRoot)&&!extname(specifier)){const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return next(url.href,context)}return next(specifier,context)},
 load(url,context,next){const result=next(url,context);if(url.startsWith(sourceRoot)&&result.source!=null)return{...result,source:Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")};return result},
})
const close=(a,b,why,epsilon=.012)=>assert(Math.abs(a-b)<=epsilon,`${why}: ${a}/${b}`)
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
try{
 const{complexoDoEstadio,PLANTA_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-model.ts')
 const{poligonoRuaComplexo}=await import('../src/escalacao/presidencia-complexo-ruas.ts')
 const{STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
 const{gerarPlantaTransporte}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
 const{criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
 const{criarArquiteturaComplexo}=await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
 const{roteiroPasseioComplexo,criarCorpoVisitaComplexo}=await import('../src/escalacao/presidencia-complexo-visita.ts')
 const{segmentoLivre}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
 const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
 let footProbes=0,bodyProbes=0,routeProbes=0,poseProbes=0
 for(const[name,save]of[['varzea',{inv:{},ext:['estacao']}],['completo-sem-asfalto',{...full,ext:full.ext.filter(id=>id!=='asfalto')}],['completo',full]]){
  const state=complexoDoEstadio(save),away=gerarPlantaTransporte(state),home=gerarPlantaTransporte(state,{metroSide:'home'})
  assert.deepEqual(home.surfaces,away.surfaces,'escolher torcida não altera pisos/árvores/geometria')
  assert.equal(home.services.filter(s=>s.kind==='metro').length,1,'um único trem, nunca serviços coincidentes')
  const service=home.services.find(s=>s.kind==='metro'),legacy=away.services.find(s=>s.kind==='metro')
  assert.equal(service.id,legacy.id,'identidade física do trem permanece ao trocar torcida')
  assert.equal(service.side,'home');assert.equal(legacy.side,'away')
  for(const key of['stop','inbound','outbound','door','width','length'])assert.deepEqual(service[key],legacy[key],`trem/porta não mudam: ${key}`)
  assert.deepEqual(service.passengerRoute.slice(0,5),legacy.passengerRoute.slice(0,5),'mesma soleira e plataforma do trem existente')
  assert.deepEqual(service.passengerReturnRoute,[...service.passengerRoute].reverse(),'mandante volta pela mesma passarela oeste sem salto entre caminhos')
  assert.deepEqual(service.passengerRoute.at(-1),{x:-4.55,y:.16,z:76},'mandante chega dentro do portão frontal')
  assert.equal(home.station.accesses.length,2,'ambas passarelas existentes preservadas')
  const walk=home.station.homeWalk
  for(let i=1;i<walk.length;i++)for(const[id,footprint]of Object.entries(PLANTA_COMPLEXO.footprints)){
   if(id==='arena'||id==='estacao')continue
   assert(segmentoLivre({x:walk[i-1].x,y:walk[i-1].z},{x:walk[i].x,y:walk[i].z},[{id,polygon:footprint.map(p=>({x:p.x,y:p.z}))}],.35),`${name}: passeio corta lote ${id}`);routeProbes++
  }
  const scene=new THREE.Scene(),environment=criarEntornoComplexo(scene,state),architecture=criarArquiteturaComplexo(scene,state)
  const blockers=[
   ...environment.solids.filter(solid=>solid.top>.74&&solid.base<1.96).map(solid=>({id:solid.id,polygon:solid.footprint.map(p=>({x:p.x,y:p.z}))})),
   ...environment.root.userData.roadNetwork.streets.map(road=>({id:road.id,polygon:poligonoRuaComplexo(road).map(p=>({x:p.x,y:p.z}))})),
  ]
  for(let i=1;i<walk.length;i++)for(const blocker of blockers){
   assert(segmentoLivre({x:walk[i-1].x,y:walk[i-1].z},{x:walk[i].x,y:walk[i].z},[blocker],.35),`${name}: corpo/passeio corta ${blocker.id} no segmento ${i}`);routeProbes++
  }
  if(process.argv.includes('--routes')){environment.dispose();architecture.dispose();continue}
  // Door crossing belongs to the unchanged transport suite; start on the
  // physical platform, then probe both directions through bridge/stair/map.
  const inbound=[...service.passengerRoute.slice(2),...(state.lowerComplete?[{...PLANTA_COMPLEXO.gates.home.inside,y:.16}]:[])],timeline=roteiroPasseioComplexo({inbound,staySeconds:2})
  assert.deepEqual(timeline.problems,[],`${name}: caminhada física válida`)
  const body=criarCorpoVisitaComplexo(scene,{id:`metro-mandantes-${name}`,side:'home'}),statics=[]
  for(const root of[environment.root,architecture.root])root.traverse(object=>{if(object instanceof THREE.Mesh)statics.push(object)})
  scene.updateMatrixWorld(true)
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),geometry=statics.map(mesh=>({mesh,box:new THREE.Box3().setFromObject(mesh,true)}))
  const samples=new Set([0,timeline.arrivalAt,timeline.returnAt,timeline.period-1e-5])
  const stages=timeline.inspect().stages
  for(const[index,stage]of stages.entries())if(stage.phase!=='walking'||index%20===0)for(const t of[.02,.5,.98])samples.add(stage.at+stage.duration*t)
  let previous
  for(const seconds of[...samples].sort((a,b)=>a-b)){
   const pose=timeline.at(seconds);body.updatePose(pose);scene.updateMatrixWorld(true)
   assert(body.root.visible&&pose.feet.some(foot=>foot.supported),'mesmo corpo visível e apoiado durante percurso')
   if(previous)assert(distance(pose.hip,previous.pose.hip)<12*(seconds-previous.seconds)+.005,'quadril contínuo entre amostras')
   previous={pose,seconds};poseProbes++
   for(const[index,sole]of body.feet.entries()){
    sole.geometry.computeBoundingBox();const bounds=sole.geometry.boundingBox
    for(const x of[bounds.min.x,bounds.max.x])for(const z of[bounds.min.z,bounds.max.z]){
     const p=new THREE.Vector3(x,bounds.min.y,z).applyMatrix4(sole.matrixWorld)
     const nearby=geometry.filter(({box})=>p.x>=box.min.x&&p.x<=box.max.x&&p.z>=box.min.z&&p.z<=box.max.z&&box.min.y<=p.y+.4&&box.max.y>=p.y-.8).map(({mesh})=>mesh)
     ray.set(new THREE.Vector3(p.x,p.y+.4,p.z),down);ray.near=0;ray.far=1.2
     const hit=ray.intersectObjects(nearby,false).find(hit=>hit.face&&hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y>.9)
     assert(hit,`${name}: sola sem chão físico em ${seconds}: ${p.toArray()}`)
     assert(p.y>=hit.point.y-.012,`${name}: sola dentro do piso em ${seconds}: ${p.toArray()} / ${hit.point.toArray()}`)
     if(pose.feet[index].supported)close(p.y,hit.point.y,`${name}: pé apoiado flutua em ${seconds}: ${p.toArray()}`)
     footProbes++
    }
   }
   const floor=Math.min(...pose.feet.map(foot=>foot.position.y))
   for(const solid of environment.solids){
    if(solid.top<=pose.hip.y-.12||solid.base>=floor+1.8)continue
    assert(segmentoLivre({x:pose.hip.x,y:pose.hip.z},{x:pose.hip.x,y:pose.hip.z},[{id:solid.id,polygon:solid.footprint.map(p=>({x:p.x,y:p.z}))}],.30),`${name}: corpo atravessa ${solid.id} em ${seconds}: ${JSON.stringify(pose.hip)}`);bodyProbes++
   }
   // The portal belongs to the actual architecture rather than its conservative
   // 2D arena blocker. Rays check torso/head clearance against that geometry.
   if(pose.hip.z>65&&Math.abs(pose.hip.x)<8){
    if(pose.hip.z<76.5)assert(Math.hypot(pose.hip.x+3.6,pose.hip.z-74)>.7,`${name}: ligação ao assento cruza espera do ônibus`)
    const meshes=geometry.filter(({mesh,box})=>mesh.parent===architecture.root&&box.min.x<=pose.hip.x+.35&&box.max.x>=pose.hip.x-.35&&box.min.z<=pose.hip.z+.35&&box.max.z>=pose.hip.z-.35).map(({mesh})=>mesh)
    for(const height of[.6,1.1,1.55])for(let direction=0;direction<8;direction++){
     const angle=direction*Math.PI/4;ray.set(new THREE.Vector3(pose.hip.x,floor+height,pose.hip.z),new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)));ray.near=0;ray.far=.30
     assert.equal(ray.intersectObjects(meshes,false).length,0,`${name}: corpo toca parede do portão frontal em ${seconds}`);bodyProbes++
    }
   }
  }
  body.dispose();environment.dispose();architecture.dispose()
  console.log(JSON.stringify({stage:name,status:'PASS',poseProbes,footProbes}))
 }
 console.log(JSON.stringify({status:'PASS',mode:process.argv.includes('--routes')?'routes':'physical',stages:3,footProbes,bodyProbes,routeProbes,poseProbes}))
}finally{hooks.deregister()}
