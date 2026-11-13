import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {criarEntornoComplexo}=await import('../../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts')
const {LOTES_PATROCINADORES_CIDADE:lots}=await import('../../src/escalacao/presidencia-patrocinadores-planta.ts')
// Geometry only: no account, save mutation, backend or match simulation.
const scene=new T.Scene(),world=criarEntornoComplexo(scene,complexoDoEstadio({inv:{},ext:[]}))
try{
 const roads=world.root.userData.roadNetwork
 assert.equal(roads.diagnostics.afterComponents,1,'A disconnected public street was introduced')
 assert.deepEqual(roads.diagnostics.unresolved,[])
 assert.equal(roads.streets.filter(r=>r.id==='acesso-gecg').length,1)
 assert.equal(roads.streets.filter(r=>r.id==='avenida-parceiros').length,1)
 const overlaps=(s,p,w,d)=>s.minX<p.x+w/2&&s.maxX>p.x-w/2&&s.minZ<p.z+d/2&&s.maxZ>p.z-d/2
 for(const s of world.solids)for(const p of Object.values(lots)){
  if(s.id.startsWith(p.id))continue
  assert(!overlaps(s,p,p.buildingWidth,p.buildingDepth),`${s.id} crosses the ${p.id} building/pitch`)
  if(/casa|arvore|predio|cidade-casa/.test(s.id))assert(!overlaps(s,p,p.width,p.depth),`${s.id} was not cleared from ${p.id}`)
 }
 assert.equal(world.root.userData.dealership.stockCount,6)
 assert.equal(world.root.userData.sponsors.brands.length,4)
 assert.equal(world.root.userData.sponsors.static,true)
 scene.updateMatrixWorld(true)
 // The official crest must be visible from the actual aerial/angled city
 // directions, without another sponsor, house or tree covering the artwork.
 const p=lots.gecg,target=new T.Vector3(p.x+24,.26,p.z+28)
 for(const offset of[new T.Vector3(0,150,0),new T.Vector3(0,120,120),new T.Vector3(60,150,80)]){
  const origin=target.clone().add(offset),ray=new T.Raycaster(origin,target.clone().sub(origin).normalize())
  const first=ray.intersectObject(world.root,true)[0]
  assert.equal(first?.object.material.name,'logo-oficial-gecg','The society sponsor is obscured from the city camera')
 }
 console.log(JSON.stringify({status:'PASS',publicRoadComponents:roads.diagnostics.afterComponents,newSocietyAccess:true,buildingsAndPitchFreeOfExistingSolids:true,vadicoCars:6}))
}finally{world.dispose();assert.equal(scene.children.length,0)}
