import assert from 'node:assert/strict'
import fs from 'node:fs'
import {registerHooks} from 'node:module'
import {fileURLToPath,pathToFileURL} from 'node:url'
import * as THREE from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=fileURLToPath(new URL(s,c.parentURL));if(fs.existsSync(p+'.ts'))return{url:pathToFileURL(p+'.ts').href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)}})
const {complexoDoEstadio,PLANTA_COMPLEXO,mapaParaMundo}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {gerarPlantaTransporte,PLANTAS_ESTACIONAMENTO_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const {ESTACIONAMENTO_VAGAS_POR_LOTE}=await import('../src/escalacao/presidencia-estacionamento.ts')
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const inside=(p,poly)=>{let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result}return result}
const distance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)}
const roads=[PLANTA_COMPLEXO.routes.roadOut.points,[[-65,269],[150,119],[295,48],[354,-65]].map(([x,y])=>mapaParaMundo({x,y}))]
const investments=[0,20,40,60,70],capacity=[0,9,16,46,79]
for(const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO){
  assert.equal(lot.slots.length,ESTACIONAMENTO_VAGAS_POR_LOTE[lot.id],'capacidade econômica deve corresponder às vagas reais')
  assert.equal(new Set(lot.slots.map(s=>s.id)).size,lot.slots.length)
  for(const slot of lot.slots){
    assert(slot.width>=2.7&&slot.length>=5.5)
    assert(slot.polygon.every(p=>inside(p,lot.polygon)),`${slot.id}: vaga não cabe no próprio lote`)
  }
  const roadDistance=Math.min(...roads.flatMap(road=>road.slice(1).map((b,i)=>distance(lot.access[0],road[i],b))))
  assert(roadDistance<.02,`${lot.id}: acesso começa fora da via pública (${roadDistance} m)`)
  assert(inside(lot.access.at(-1),lot.polygon),`${lot.id}: acesso não chega ao lote`)
}
const summary=[]
for(const [stage,investment] of investments.entries())for(const paved of [false,true]){
  const save={inv:{},ext:[...(stage===4?['estac']:[]),...(paved?['asfalto']:[])],...(stage?{estacionamentoInvestido:investment}:{})},before=JSON.stringify(save)
  const state=complexoDoEstadio(save),plan=gerarPlantaTransporte(state)
  assert.equal(plan.parking.stage,stage);assert.equal(plan.parking.capacity,capacity[stage])
  assert.equal(plan.services.filter(s=>s.kind==='car').length,stage?1:0)
  const active=plan.parkingPlants.filter(lot=>lot.stage<=stage)
  assert.equal(active.reduce((n,lot)=>n+lot.slots.length,0),capacity[stage])
  const access=plan.vehicleSurfaces.filter(s=>s.id.startsWith('estacionamento-ligacao-'))
  assert.equal(access.length,stage)
  assert.equal(JSON.stringify(save),before,'planta não pode escrever estado da carreira')
  if(![0,1,4].includes(stage)||paved)continue
  const scene=new THREE.Scene(),environment=criarEntornoComplexo(scene,state),meshes=[]
  environment.root.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o)});scene.updateMatrixWorld(true)
  assert.equal(environment.root.userData.transport.parkingCapacity,capacity[stage])
  assert.equal(environment.root.userData.transport.parkingLots.length,stage)
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0)
  for(const lot of plan.parkingPlants){
    const sample=lot.slots.at(-1).center
    ray.set(new THREE.Vector3(sample.x,.3,sample.z),down);ray.far=.8
    const hit=ray.intersectObjects(meshes,false)[0]
    assert(hit,`${lot.id}: solo ausente`)
    if(lot.stage<=stage)assert(Math.abs(hit.point.y-.035)<.03,`${lot.id}: lote comprado sem piso físico ${hit.point.y}`)
    else assert(hit.point.y<0,`${lot.id}: lote futuro apareceu antes da compra ${hit.point.y}`)
    if(lot.stage>stage)continue
    for(let i=1;i<lot.access.length;i++)for(const t of [0,.25,.5,.75,1]){
      const a=lot.access[i-1],b=lot.access[i],p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}
      ray.set(new THREE.Vector3(p.x,.3,p.z),down)
      const support=ray.intersectObjects(meshes,false)[0]
      assert(support&&Math.abs(support.point.y-.035)<.06,`${lot.id}: rua e lote desconectados em ${p.x},${p.z}; piso=${support?.point.y}`)
    }
  }
  summary.push({stage,capacity:capacity[stage],lots:active.map(l=>l.id)});environment.dispose()
}
console.log('PASS estacionamento 3D: 4 compras isoladas, 79 vagas reais, van dentro da etapa1, acesso de cada lote à rua, solo futuro reservado e save imutável.',summary)
