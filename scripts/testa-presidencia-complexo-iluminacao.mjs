import assert from 'node:assert/strict'
import fs from 'node:fs'
import {registerHooks} from 'node:module'
import {fileURLToPath,pathToFileURL} from 'node:url'
import * as THREE from 'three'
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const candidate=fileURLToPath(new URL(specifier,context.parentURL));if(fs.existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}}return next(specifier,context)},load(url,context,next){if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return next(url,context)}})
const {criarIluminacaoComplexo}=await import('../src/escalacao/presidencia-complexo-iluminacao.ts')
const {criarArquiteturaComplexo}=await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const fullInv=Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost]))
const cases=[
 {name:'varzea',save:{inv:{},ext:[]},floodlights:0},
 {name:'sem-grama',save:{inv:{geral:fullInv.geral},ext:['refl']},floodlights:0},
 {name:'torres',save:{inv:{grama:fullInv.grama,geral:fullInv.geral},ext:['refl']},floodlights:4},
 {name:'completo',save:{inv:fullInv,ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']},floodlights:4},
 {name:'teto-fechado',save:{inv:fullInv,ext:STADIUM_EXTRAS.map(s=>s.k),roofClosed:true},floodlights:4},
]
const report=[]
for(const sample of cases){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2cd');scene.fog=new THREE.Fog('#cbd2cd',1100,2200);scene.environmentIntensity=.35
 const sun=new THREE.DirectionalLight('#ffdda5',3.1),hemisphere=new THREE.HemisphereLight('#c9dcf0','#8c7d61',.85);sun.shadow.bias=-.00012;scene.add(sun,hemisphere)
 const state=complexoDoEstadio(sample.save),copy=structuredClone(sample.save),architecture=criarArquiteturaComplexo(scene,state)
 const surround=['varzea','completo'].includes(sample.name)?criarEntornoComplexo(scene,state):undefined
 const lighting=criarIluminacaoComplexo({scene,state,sun,hemisphere}),camera=new THREE.PerspectiveCamera(38,1,.12,4000);camera.position.set(30,35,70)
 const target=new THREE.Vector3(),cameraBefore=camera.position.toArray(),rootChildren=scene.children.length
 lighting.setPeriod('night');lighting.update(camera,target)
 const night=lighting.inspect();assert.equal(night.activeStadium.length,sample.floodlights,sample.name)
 assert(night.activeLocal.length<=4);assert.equal(sun.shadow.bias,-.00012,'solar acne correction is preserved')
 assert.equal(night.activeStadium.every(id=>id.startsWith(state.roofBuilt?'cobertura':'torre')),true)
 assert.deepEqual(camera.position.toArray(),cameraBefore);assert.deepEqual(sample.save,copy,'lighting cannot grant a purchase')
 if(surround){
  assert(surround.root.userData.streetLighting.posts>30,'city street lamps exist at the first stage too')
  const anchors=surround.root.userData.complexoLights
  assert.equal(anchors.some(a=>a.kind==='station'),sample.name==='completo','station sources obey the purchase')
  assert(anchors.filter(a=>a.kind==='bus-stop').length===2)
  // A pole cannot float: independently probe actual merged paving around its
  // base, away from the base itself. No planner metadata supplies the height.
  scene.updateMatrixWorld(true)
  const surfaces=[];surround.root.traverse(o=>{if(o instanceof THREE.Mesh)surfaces.push(o)})
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0)
  for(const p of surround.root.userData.streetLighting.positions){
   let supported=0
   for(const [dx,dz] of [[.15,0],[-.15,0],[0,.15],[0,-.15]]){
    ray.set(new THREE.Vector3(p.x+dx,.3,p.z+dz),down);ray.near=0;ray.far=.16
    if(ray.intersectObjects(surfaces,false).some(hit=>hit.face?.normal.y>.9&&Math.abs(hit.point.y-.16)<.015))supported++
   }
   assert(supported>=3,`${sample.name}: pole lacks sidewalk support at ${JSON.stringify(p)}`)
  }
 }
 const materials=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.complexoNightEmission&&!materials.includes(m))materials.push(m)})
 assert(materials.every(m=>Number.isFinite(m.emissiveIntensity)))
 lighting.setPeriod('day');lighting.update(camera,target)
 assert.equal(sun.intensity,3.1);assert.equal(hemisphere.intensity,.85);assert.equal(scene.environmentIntensity,.35)
 assert.equal(scene.background.getHexString(),'cbd2cd');assert.equal(lighting.inspect().activeStadium.length,0)
 scene.getObjectByName('complexo-iluminacao').traverse(o=>{if(o instanceof THREE.Light)assert.equal(o.visible,false,'inactive night lights must not render shadow passes')})
 lighting.setPeriod('night');lighting.update(camera,target);assert.deepEqual(lighting.inspect(),night,'day/night switching does not multiply sources')
 assert.equal(scene.children.length,rootChildren)
 report.push({stage:sample.name,...night,streetPosts:surround?.root.userData.streetLighting.posts})
 lighting.dispose();lighting.dispose();assert.equal(scene.getObjectByName('complexo-iluminacao'),undefined)
 architecture.dispose();surround?.dispose()
}
// Moving anchors remain attached to a rotated vehicle and disappear with it.
{
 const scene=new THREE.Scene(),sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight(),vehicle=new THREE.Group()
 scene.add(sun,hemisphere,vehicle);vehicle.position.set(25,.16,40);vehicle.rotation.y=Math.PI/2
 vehicle.userData.complexoLights=[{id:'moving-headlight',kind:'headlight',position:[.5,.7,2],target:[.5,0,15],color:'#ffffff',intensity:50,distance:25,angle:.3}]
 const lighting=criarIluminacaoComplexo({scene,state:complexoDoEstadio(),sun,hemisphere}),camera=new THREE.PerspectiveCamera();camera.position.set(25,4,45)
 lighting.setPeriod('night');lighting.update(camera,new THREE.Vector3(25,0,40))
 const lamp=scene.getObjectByName('luz-local-1');assert.deepEqual(lamp.position.toArray(),[27,.86,39.5])
 vehicle.visible=false;lighting.update(camera,new THREE.Vector3());assert.equal(lamp.visible,false)
 vehicle.visible=true;vehicle.userData.complexoLights[0].enabled=false;lighting.update(camera,new THREE.Vector3());assert.equal(lamp.visible,false)
 vehicle.removeFromParent();lighting.refreshSources();assert.equal(lighting.inspect().sources,0)
 lighting.dispose()
}
console.log('PASS lighting: purchase gates, open/closed roof sources, real sidewalk support, bounded lights, actor transforms, day restoration, lifecycle',JSON.stringify(report,null,2))
