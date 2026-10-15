import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {registerHooks} from 'node:module'
import * as THREE from 'three'
registerHooks({
  resolve(specifier,context,next){
    if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
      const candidate=fileURLToPath(new URL(specifier,context.parentURL))
      if(fs.existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}
    }
    return next(specifier,context)
  },
  load(url,context,next){
    if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true}
    return next(url,context)
  },
})
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio,PLANTA_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-model.ts')
const keys=['loja','hotel','chopp','praca','estacao','estac']
const samples=[[],...keys.map(key=>[key]),['asfalto'],[...keys,'asfalto']]
const down=new THREE.Vector3(0,-1,0),ray=new THREE.Raycaster(),summary=[]
const close=(a,b,epsilon=1e-5)=>assert(Math.abs(a-b)<epsilon,`${a} ≠ ${b}`)
const station=PLANTA_COMPLEXO.lots.estacao.footprint
const probes={
  loja:PLANTA_COMPLEXO.doors.loja.inside,
  hotel:PLANTA_COMPLEXO.lots.hotel.center,
  chopp:PLANTA_COMPLEXO.doors.chopp.inside,
  praca:PLANTA_COMPLEXO.lots.praca.center,
  estacao:{x:(station[0].x+station[1].x+station[2].x+station[3].x)/4,z:(station[0].z+station[1].z+station[2].z+station[3].z)/4},
}

for(const ext of samples){
  const save={inv:{},ext},before=JSON.stringify(save),state=complexoDoEstadio(save)
  const scene=new THREE.Scene(),unrelated=new THREE.Group();scene.add(unrelated)
  const environment=criarEntornoComplexo(scene,state)
  scene.updateMatrixWorld(true)
  const meshes=[],geometries=new Set(),materials=new Set(),textures=new Set()
  let triangles=0
  environment.root.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return
    meshes.push(object);geometries.add(object.geometry)
    triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3
    for(const attribute of Object.values(object.geometry.attributes))
      assert(attribute.array.every(Number.isFinite),'vértice/normal/UV não finito')
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      materials.add(material)
      assert(material.depthTest,'construção precisa respeitar profundidade real')
      // A vitrine translúcida pode omitir escrita no depth buffer para permitir
      // composição com o interior; o teste de profundidade continua obrigatório.
      if(!material.depthWrite)assert(material.name==='vadico-vidros'&&material.transparent&&material.opacity>0&&material.opacity<1,'só a vitrine translúcida pode omitir escrita de profundidade')
      for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value)
    }
  })
  assert(meshes.length<50,`${ext}: ${meshes.length} materiais excederam orçamento`)
  // The park extends the physical ground from 1040×1160 to 1800×2600 m for
  // portrait views. Distant trees use 32 faces each and share existing batches.
  assert(triangles<=300_000,`${ext}: ${triangles} triângulos excederam orçamento`)
  assert.deepEqual([...environment.establishments].sort(),keys.filter(key=>ext.includes(key)).sort())
  assert.equal(JSON.stringify(save),before,'visual não pode alterar compra/save')

  const below=(p,from=40,far=41)=>{
    ray.set(new THREE.Vector3(p.x,from,p.z),down);ray.near=0;ray.far=far
    return ray.intersectObjects(meshes,false)[0]
  }
  for(const [key,p] of Object.entries(probes)){
    const hit=below(p)
    assert(hit,`${key}: terreno ausente`)
    if(ext.includes(key))assert(hit.point.y>3,`${key}: comprado sem volume`)
    else assert(hit.point.y<.3,`${key}: construção apareceu antes da compra`)
  }

  // The pitch is reserved for the football renderer, with no roads or plots
  // accidentally projected through the playing surface.
  for(const x of [-50,-25,0,25,50])for(const z of [-32,0,32]){
    const hit=below({x,z},2,3)
    assert(hit&&hit.point.y<0,'objeto do entorno ocupou o campo')
  }
  // Include end caps: the full sole/wheels must not hang beyond a ribbon end.
  for(const id of ['roadOut','roadBack']){
    const route=PLANTA_COMPLEXO.routes[id]
    for(const p of route.points){
      const hit=below(p,.65,1)
      assert(hit,`${id}: falta piso`)
      assert(Math.abs(hit.point.y)<.075,`${id}: veículo pisaria em ${hit.point.y}`)
      assert.equal(hit.object.castShadow,false,'asfalto fino não pode virar shadow caster no batching')
    }
  }
  if(ext.includes('loja'))for(const p of PLANTA_COMPLEXO.routes.shop.points)close(below(p,.65,1).point.y,.16)

  for(const id of ['loja','hotel','chopp'])if(ext.includes(id)){
    const door=PLANTA_COMPLEXO.doors[id]
    for(const y of [.5,1.15,1.8]){
      const a=new THREE.Vector3(door.approach.x,.16+y,door.approach.z)
      const b=new THREE.Vector3(door.inside.x,.16+y,door.inside.z)
      const direction=b.sub(a)
      ray.set(a,direction.clone().normalize());ray.near=0;ray.far=direction.length()
      assert.equal(ray.intersectObjects(meshes,false).length,0,`${id}: porta não é um vão real a ${y}m`)
    }
    for(let i=0;i<=12;i++){
      const t=i/12,p={x:door.approach.x+(door.inside.x-door.approach.x)*t,z:door.approach.z+(door.inside.z-door.approach.z)*t}
      close(below(p,.65,1).point.y,.16)
    }
  }
  for(const solid of environment.solids){
    assert.equal(solid.footprint.length,4)
    assert(solid.top>solid.base&&solid.maxX>solid.minX&&solid.maxZ>solid.minZ)
    for(const p of solid.footprint){
      assert(p.x>=solid.minX-1e-4&&p.x<=solid.maxX+1e-4)
      assert(p.z>=solid.minZ-1e-4&&p.z<=solid.maxZ+1e-4)
    }
  }

  const disposed={geometries:new Map(),materials:new Map(),textures:new Map()}
  for(const [key,resources] of Object.entries({geometries,materials,textures}))
    for(const resource of resources)resource.addEventListener('dispose',()=>disposed[key].set(resource,(disposed[key].get(resource)??0)+1))
  environment.dispose();environment.dispose()
  assert.equal(environment.root.parent,null);assert.equal(environment.root.children.length,0)
  assert.deepEqual(scene.children,[unrelated])
  for(const [key,resources] of Object.entries({geometries,materials,textures})){
    assert.equal(disposed[key].size,resources.size,`dispose incompleto de ${key}`)
    for(const count of disposed[key].values())assert.equal(count,1)
  }
  summary.push({extras:ext.join('+')||'vazio',meshes:meshes.length,triangles})
}
console.log('PASS entorno3D: compras isoladas, portas/corredores abertos, contato e pontas das ruas, campo livre, colliders orientados, piso sem shadow acne, orçamento e dispose.',summary)
