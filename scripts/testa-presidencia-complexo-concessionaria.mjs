import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as THREE from 'three'

registerHooks({
  resolve(specifier,context,next){
    if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
      const candidate=new URL(specifier+'.ts',context.parentURL)
      if(existsSync(candidate))return{url:candidate.href,shortCircuit:true}
    }
    return next(specifier,context)
  },
  load(url,context,next){
    if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true}
    return next(url,context)
  },
})
const {PLANTA_VADICO}=await import('../src/escalacao/presidencia-complexo-concessionaria.ts')
const {complexoDoEstadio,PLANTA_COMPLEXO,caminhosTorcidaComplexo,deslocarCaminhoComplexo}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {gerarPlantaTransporte,PLANTAS_ESTACIONAMENTO_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const close=(a,b,why,epsilon=1e-5)=>assert(Math.abs(a-b)<=epsilon,`${why}: ${a} ≠ ${b}`)
const inside=(p,polygon)=>{
  let result=false
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j]
    if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result
  }
  return result
}
const distance=(p,a,b)=>{
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)))
  return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)
}
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x)
const segmentDistance=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0?0:
  Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))
const polygonRouteDistance=(polygon,points)=>{
  if(points.some(p=>inside(p,polygon)))return 0
  return Math.min(...points.slice(1).flatMap((b,index)=>polygon.map((d,i)=>segmentDistance(points[index],b,polygon[(i+polygon.length-1)%polygon.length],d))))
}
const polygonDistance=(a,b)=>a.some(p=>inside(p,b))||b.some(p=>inside(p,a))?0:polygonRouteDistance(a,[...b,b[0]])
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
const fullState=complexoDoEstadio(full),transport=gerarPlantaTransporte(fullState)
const protectedRoutes=Object.values(PLANTA_COMPLEXO.routes).map(route=>({
  id:route.id,points:route.loop?[...route.points,route.points[0]]:route.points,
  radius:route.id.startsWith('road')?Math.hypot(4.2,1.8)/2:.35,
}))
for(const state of [complexoDoEstadio({inv:{},ext:[]}),fullState])
  for(const [side,points] of Object.entries(caminhosTorcidaComplexo(state)))for(const offset of [-.72,.72])
    protectedRoutes.push({id:`torcida-${side}-${offset}`,points:deslocarCaminhoComplexo(points,offset),radius:.35})
for(const [id,route] of Object.entries({loja:'shop',hotel:'hotel',chopp:'beer'})){
  const door=PLANTA_COMPLEXO.doors[id]
  protectedRoutes.push({id:`porta-${id}`,points:[...PLANTA_COMPLEXO.routes[route].points,door.approach,door.threshold,door.inside],radius:.35})
}
for(const service of transport.services){
  for(const key of ['inbound','outbound'])protectedRoutes.push({id:`${service.id}-${key}`,points:service[key],radius:Math.hypot(service.width,service.length)/2})
  for(const key of ['passengerRoute','passengerReturnRoute'])if(service[key])protectedRoutes.push({id:`${service.id}-${key}`,points:service[key],radius:.35})
}
for(const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO)protectedRoutes.push({id:`acesso-${lot.id}`,points:lot.access,radius:2.8})
let minimumRouteClearance=Infinity
for(const route of protectedRoutes){
  const clearance=polygonRouteDistance(PLANTA_VADICO.footprint,route.points)-route.radius
  assert(clearance>0,`Vadico invade rota ${route.id}: folga ${clearance} m`)
  minimumRouteClearance=Math.min(minimumRouteClearance,clearance)
}
const futurePlots=[...Object.entries(PLANTA_COMPLEXO.footprints),...PLANTAS_ESTACIONAMENTO_COMPLEXO.map(lot=>[`estacionamento-${lot.id}`,lot.polygon])]
for(const [id,polygon] of futurePlots)for(const reservation of PLANTA_VADICO.reservationPolygons)
  assert(polygonDistance(reservation,polygon)>0,`reserva Vadico invade obra/objeto ${id}`)
const sidewalk=PLANTA_COMPLEXO.routes.sidewalk.points
assert(Math.min(...sidewalk.slice(1).map((p,i)=>distance(PLANTA_VADICO.access.pedestrian[0],sidewalk[i],p)))<.01,'acesso deve partir da calçada pública real')

const ray=new THREE.Raycaster(),up=new THREE.Vector3(0,1,0),down=new THREE.Vector3(0,-1,0),summary=[]
for(const [stage,save] of [['varzea',{inv:{},ext:[]}],['completo',full]]){
  const before=JSON.stringify(save),scene=new THREE.Scene(),unrelated=new THREE.Group();scene.add(unrelated)
  const environment=criarEntornoComplexo(scene,complexoDoEstadio(save));scene.updateMatrixWorld(true)
  const shop=environment.root.getObjectByName('complexo-concessionaria-vadico'),metadata=shop?.userData.dealership
  assert(shop&&metadata,`${stage}: patrocinador ausente`)
  assert.equal(metadata.label,'Vadico Veículos');assert.equal(metadata.sign.color,'#c31e2b')
  assert.equal(metadata.stockCount,6);assert.equal(metadata.cars.length,6);assert.equal(metadata.wheels.length,24)
  assert.equal(new Set(metadata.wheels.map(w=>w.id)).size,24)
  assert.equal(metadata.permanent,true);assert.equal(metadata.purchasable,false)
  assert.equal(environment.establishments.has('vadico'),false,'cenário não pode consumir compra de clube')
  const meshes=[],resources=new Set();let triangles=0
  environment.root.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return
    meshes.push(object);resources.add(object.geometry)
    triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3
    for(const attribute of Object.values(object.geometry.attributes))assert(attribute.array.every(Number.isFinite),'geometria não finita')
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      resources.add(material)
      for(const value of Object.values(material))if(value instanceof THREE.Texture)resources.add(value)
    }
  })
  assert(meshes.length<50,`${stage}: ${meshes.length} meshes excedem orçamento do entorno`)
  assert(triangles<=300_000,`${stage}: ${triangles} triângulos excedem orçamento do entorno`)
  const floor=(p,from=p.y+.3)=>{
    ray.set(new THREE.Vector3(p.x,from,p.z),down);ray.near=0;ray.far=.8
    return ray.intersectObjects(meshes,false).find(hit=>hit.face&&hit.face.normal.clone().transformDirection(hit.object.matrixWorld).dot(up)>.85)
  }
  // Wheel tracks are sampled between navigation vertices as well: a new ramp
  // must not lift passing traffic even when both ends of its road still pass.
  let roadProbes=0
  for(const id of ['roadOut','roadBack']){
    const points=PLANTA_COMPLEXO.routes[id].points
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(length/.4)
      for(let j=0;j<=steps;j++){
        const t=j/steps,p={x:a.x+(b.x-a.x)*t,y:0,z:a.z+(b.z-a.z)*t}
        if(Math.min(...PLANTA_VADICO.access.driveway.slice(1).map((d,k)=>distance(p,PLANTA_VADICO.access.driveway[k],d)))>8)continue
        for(const offset of [-.9,.9]){
          const wheel={x:p.x+(b.z-a.z)/length*offset,y:0,z:p.z-(b.x-a.x)/length*offset},hit=floor(wheel)
          assert(hit&&Math.abs(hit.point.y)<.075,`${stage}/${id}: entrada Vadico eleva roda do tráfego em ${wheel.x},${wheel.z}; piso=${hit?.point.y}`)
          roadProbes++
        }
      }
    }
  }
  assert(roadProbes>20,'amostragem deve alcançar os dois sentidos da via junto à entrada')
  const tyreMesh=shop.getObjectByName('vadico-borracha')
  assert(tyreMesh instanceof THREE.Mesh,'pneus físicos precisam existir')
  const vertices=tyreMesh.geometry.getAttribute('position'),point=new THREE.Vector3()
  for(const car of metadata.cars){
    const wheels=metadata.wheels.filter(w=>w.carId===car.id);assert.equal(wheels.length,4)
    const body=environment.solids.find(s=>s.id===car.id);assert(body,`${car.id}: collider ausente`)
    assert(body.footprint.every(p=>inside(p,PLANTA_VADICO.footprint)),`${car.id}: estoque fora do lote`)
    assert(body.minZ>PLANTA_VADICO.front.z,`${car.id}: estoque precisa ficar diante da loja`)
    assert(polygonRouteDistance(body.footprint,PLANTA_VADICO.access.pedestrian)>.35,`${car.id}: carro bloqueia pedestre`)
    for(const other of metadata.cars)if(other.id>car.id){
      const peer=environment.solids.find(s=>s.id===other.id)
      assert(polygonDistance(body.footprint,peer.footprint)>0,`${car.id}: estoque sobreposto`)
    }
    for(const wheel of wheels){
      let minimum=Infinity,count=0
      for(let i=0;i<vertices.count;i++){
        point.fromBufferAttribute(vertices,i).applyMatrix4(tyreMesh.matrixWorld)
        if(Math.abs(point.x-wheel.position.x)<.2&&Math.abs(point.z-wheel.position.z)<=wheel.radius+.00001){minimum=Math.min(minimum,point.y);count++}
      }
      assert(count>0,`${wheel.id}: roda dos metadados sem geometria`)
      close(minimum,wheel.contact.y,`${wheel.id}: pneu renderizado não toca o solo`)
      close(wheel.position.y-wheel.radius,wheel.contact.y,`${wheel.id}: raio inconsistente`)
      const hit=floor(wheel.contact,wheel.contact.y+.02)
      assert(hit,`${wheel.id}: falta piso físico`);close(hit.point.y,wheel.contact.y,`${wheel.id}: piso sob roda`,.012)
    }
  }
  let floorProbes=0,bodyProbes=0
  for(const [kind,path] of Object.entries(PLANTA_VADICO.access).filter(([,value])=>Array.isArray(value))){
    const pedestrian=kind==='pedestrian',offsets=pedestrian?[-.35,0,.35]:[-.95,0,.95]
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.z-a.z),normal={x:(b.z-a.z)/length,z:-(b.x-a.x)/length}
      for(const offset of offsets){
        let previous
        const steps=Math.ceil(length/.4)
        for(let j=0;j<=steps;j++){
          const t=j/steps,p={x:a.x+(b.x-a.x)*t+normal.x*offset,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t+normal.z*offset},hit=floor(p)
          assert(hit,`${stage}/${kind}: piso ausente em ${p.x},${p.z}`)
          close(hit.point.y,p.y,`${stage}/${kind}: piso diverge da rampa/calçada em ${p.x},${p.z}`,pedestrian?.015:.045)
          if(previous!==undefined)assert(Math.abs(hit.point.y-previous)<.07,`${stage}/${kind}: degrau bloqueia acesso`)
          previous=hit.point.y;floorProbes++
        }
        for(const height of pedestrian?[.3,1.0,1.75]:[.35,1.0,1.45]){
          const start=new THREE.Vector3(a.x+normal.x*offset,a.y+height,a.z+normal.z*offset)
          const end=new THREE.Vector3(b.x+normal.x*offset,b.y+height,b.z+normal.z*offset),delta=end.clone().sub(start)
          ray.set(start,delta.normalize());ray.near=.001;ray.far=start.distanceTo(end)
          const hit=ray.intersectObjects(meshes,false)[0]
          assert(!hit,`${stage}/${kind}: acesso bloqueado por ${hit?.object.name} em ${hit?.point.toArray()}`);bodyProbes++
        }
      }
    }
  }
  assert.equal(JSON.stringify(save),before,'visual não pode escrever no save')
  const disposed=new Map([...resources].map(resource=>[resource,0]))
  for(const resource of resources)resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1))
  environment.dispose();environment.dispose()
  assert(scene.children.includes(unrelated),'descarte removeu objeto alheio')
  assert(!scene.children.includes(environment.root));assert.equal(environment.root.children.length,0)
  for(const count of disposed.values())assert.equal(count,1,'cada recurso deve ser descartado exatamente uma vez')
  summary.push({stage,meshes:meshes.length,triangles,wheels:metadata.wheels.length,roadProbes,floorProbes,bodyProbes})
}
console.log('PASS Vadico: seis carros, 24 pneus no chão, acesso/porta/rampa livres, rotas e obras futuras preservadas, save imutável e descarte idempotente.',{routes:protectedRoutes.length,futurePlots:futurePlots.length,minimumRouteClearance,summary})
