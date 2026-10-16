import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import * as THREE from 'three'
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL))
      if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
    return next(url, context)
  },
})

const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {criarArquiteturaComplexo}=await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const {criarCirculacaoComplexo}=await import('../src/escalacao/presidencia-complexo-circulacao.ts')
const {complexoDoEstadio,PLANTA_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const inv=Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost]))
const full={inv,ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']}
const reports=[]
for(const [name,save]of Object.entries({bare:{inv:{},ext:[]},partial:{inv:{grama:30,geral:20,visitante:50},ext:[]},lower:{inv:{...inv,camarote:0},ext:[]},boxPartial:{inv:{...inv,camarote:20},ext:[]},complete:full})){
 const scene=new THREE.Scene(),state=complexoDoEstadio(save),surround=criarEntornoComplexo(scene,state),architecture=criarArquiteturaComplexo(scene,state)
 const walk=criarCirculacaoComplexo(scene,state,surround.solids,{homeFans:3,awayFans:2,pedestrians:0,cars:0})
 assert.deepEqual(walk.inspect().problems,[],name)
 assert.equal(walk.inspect().fans.length,5,name+': os dois caminhos precisam funcionar')
 const ray=new THREE.Raycaster(),up=new THREE.Vector3(0,1,0),down=up.clone().negate(),allMeshes=[]
 scene.updateMatrixWorld(true)
 for(const group of [surround.root,architecture.root])group.traverse(o=>{if(o instanceof THREE.Mesh)allMeshes.push(o)})
 const previous=new Map(),phases=new Map(),bounds=new THREE.Box3();let soles=0
 for(let frame=0;frame<=1500;frame++){
  walk.update(frame/5);const fans=walk.inspect().fans
  for(const [i,fan]of fans.entries()){
   const p=fan.pose;assert(p&&p.visible,'torcedor não desaparece ao entrar')
   const visited=phases.get(fan.id)||new Set();visited.add(p.phase);phases.set(fan.id,visited)
   const old=previous.get(fan.id)
   if(old)assert(Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z)<.235,name+': teleporte')
   previous.set(fan.id,p)
   assert(Math.abs(p.x)>54||Math.abs(p.z)>38,'torcedor invadiu o jogo')
   for(const other of fans.slice(i+1))assert(Math.hypot(p.x-other.pose.x,p.z-other.pose.z)>.7,`${name} ${frame/5}s ${fan.id}/${other.id}: torcedores atravessaram um ao outro ${JSON.stringify([p,other.pose])}`)
   if(frame%300===0){
    scene.updateMatrixWorld(true);let supported=0;const supports=[]
    for(const sole of walk.fanFeet[i]){
     bounds.setFromObject(sole,true);const center=bounds.getCenter(new THREE.Vector3())
     ray.set(new THREE.Vector3(center.x,.66,center.z),down);ray.near=0;ray.far=1
     const floor=ray.intersectObjects(allMeshes,false).find(h=>h.face?.normal.y>.9)
     assert(floor,'torcedor sem piso')
     assert(bounds.min.y>=floor.point.y-.012,'sola afundou')
     if(Math.abs(bounds.min.y-floor.point.y)<.012)supported++
     supports.push({bottom:bounds.min.y,floor:floor.point.y,center:center.toArray()});soles++
    }
    assert(supported>=1,`${name} ${frame/5}s ${fan.id}: torcedor flutuando sem pé apoiado ${JSON.stringify({p,supports})}`)
   }
  }
 }
 for(const visited of phases.values())for(const phase of ['entering','inside','leaving'])assert(visited.has(phase),name+': falta '+phase)
 if(state.lowerComplete){
  const glass=architecture.root.getObjectByName('fachada-vidros')
  // Real curved facade positions at four oblique angles reject the old rectangle.
  for(const theta of [8.5,24.5,40.5,56.5].map(module=>module/64*Math.PI*2)){
   const p=new THREE.Vector3(105*Math.sin(theta),6,6-76*Math.cos(theta))
   const normal=new THREE.Vector3(Math.sin(theta)/105,0,-Math.cos(theta)/76).normalize()
   ray.set(p.clone().addScaledVector(normal,5),normal.clone().negate());ray.near=0;ray.far=6
   assert(ray.intersectObject(glass,false).length,name+': fachada não segue a planta oval')
  }
  // The removed presidential ramps must not remain above the pedestrian court.
  ray.set(new THREE.Vector3(48,4,99),down);ray.far=4
  const floor=ray.intersectObjects(allMeshes,false)[0]
  assert(floor&&floor.point.y<=.17,name+': rampa externa ainda existe')
 }
 if(architecture.counts.presidentBox){
  const box=PLANTA_COMPLEXO.presidentBox,opaque=[]
  architecture.root.traverse(o=>{if(o instanceof THREE.Mesh&&!o.material.transparent)opaque.push(o)})
  const camera=new THREE.Vector3(...box.camera),target=new THREE.Vector3(...box.target),direction=target.clone().sub(camera)
  ray.set(camera,direction.clone().normalize());ray.near=.01;ray.far=direction.length()-1
  assert.equal(ray.intersectObjects(opaque,false).length,0,'arquibancada atravessando a vista do camarote')
 }
 // A real wall introduced across a gate must stop that fan route, without
 // suppressing the other club or permitting a shortcut through the arena.
 if(name==='complete'){
  const obstruction=new THREE.Mesh(new THREE.BoxGeometry(9,3,.4),new THREE.MeshBasicMaterial())
  obstruction.position.set(0,1.66,83);architecture.root.add(obstruction);scene.updateMatrixWorld(true)
  const blocked=criarCirculacaoComplexo(scene,state,surround.solids,{pedestrians:0,cars:0})
  assert(!blocked.inspect().fans.some(f=>f.side==='home'))
  assert(blocked.inspect().fans.some(f=>f.side==='away'))
  assert(blocked.inspect().problems.some(p=>p.reason==='porta-obstruida-na-geometria'))
  blocked.dispose();obstruction.removeFromParent();obstruction.geometry.dispose();obstruction.material.dispose()
  const real=criarCirculacaoComplexo(scene,state,surround.solids,{pedestrians:0,cars:0,stadium:full,day:{division:'A',support:100,match:'playing'}})
  assert.equal(real.inspect().mode,'career');assert(real.inspect().fans.every(f=>f.side==='home'&&f.source==='career'),'não inventar público real visitante sem dados')
  real.dispose()
 }
 reports.push({name,fanCount:walk.inspect().fans.length,soles,box:architecture.counts.presidentBox})
 walk.dispose();architecture.dispose();surround.dispose();assert.equal(scene.children.length,0)
}
console.log('PASS oval/camarote/torcidas: etapas, 5min por estado, dois sentidos, separação, piso, portões físicos e obstrução negativa.',reports)
