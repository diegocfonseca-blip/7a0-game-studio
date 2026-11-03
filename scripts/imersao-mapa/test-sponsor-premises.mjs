import assert from 'node:assert/strict'
import {existsSync,statSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)}})
const {LOGOS_PATROCINADORES_CIDADE:logos,LOTES_PATROCINADORES_CIDADE:lots,RESERVAS_PATROCINADORES_CIDADE:reserved,ACESSO_GECG_CIDADE:road}=await import('../../src/escalacao/presidencia-patrocinadores-planta.ts')
const {criarPatrocinadoresCidade}=await import('../../src/escalacao/presidencia-patrocinadores-cidade.ts')
assert.deepEqual(Object.keys(logos).sort(),['dsouza','gecg','oittolabs','tidex','vadico'])
let logoBytes=0
for(const art of Object.values(logos)){assert(existsSync(new URL(art.src)));logoBytes+=statSync(new URL(art.src)).size}
assert(logoBytes<160000,'Reuse the existing small assets, without new heavy art')
const parcels=Object.values(lots)
for(const a of parcels)for(const b of parcels)if(a!==b)assert(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.z-b.z)>=(a.depth+b.depth)/2,'Parcels overlap')
for(const p of parcels)assert(p.id==='gecg'?p.x+p.width/2<-350:p.z+p.depth/2<=-242,'Parcel is in the stadium approach/avenue')
assert.equal(reserved.length,6)
assert(Math.abs(lots.tidex.x-lots.oittolabs.x)<50,'Keep the offices together')
assert(Math.hypot(lots.gecg.x-lots.tidex.x,lots.gecg.z-lots.tidex.z)>200,'The pitch remains behind the office towers')
assert(Math.hypot(lots.dsouza.x-lots.gecg.x,lots.dsouza.z-lots.gecg.z)>150,'Warehouse and society pitch need separate blocks')
// Public access stays outside the warehouse, office lots and society pitch.
for(const id of['dsouza','tidex','oittolabs']){const p=lots[id];assert(Math.abs(road.points[0].x-p.x)>p.width/2+road.width/2+road.walk)}
const scene=new T.Scene(),site=criarPatrocinadoresCidade(scene)
assert.equal(site.metadata.brands.length,4);assert.equal(site.metadata.static,true)
assert.deepEqual(site.metadata.field,{length:55,width:35,goalWidth:5,goalHeight:2,owner:'gecg',rental:true,independentOfOfficialMatch:true})
assert(site.metadata.meshes<=32,`Too many added draw objects: ${site.metadata.meshes}`)
assert(site.metadata.triangles<10000)
assert(site.metadata.textureCount<=14)
const textures=new Set(),geometries=new Set(),materials=new Set()
site.root.traverse(o=>{if(o.geometry){geometries.add(o.geometry);assert(o.geometry.boundingSphere||o.isLineSegments)}if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map)}}})
for(const tex of textures){assert(tex.image?.width>0&&tex.image?.height>0,'Valid loading fallback');assert.equal(tex.colorSpace,T.SRGBColorSpace)}
const contains=(s,p)=>p.x>s.minX&&p.x<s.maxX&&p.z>s.minZ&&p.z<s.maxZ
for(const door of Object.values(site.doors))for(const key of['approach','threshold','inside'])assert(!site.solids.some(s=>contains(s,door[key])),`Door ${door.id} ${key} is blocked`)
assert(!site.solids.some(s=>contains(s,{x:lots.gecg.x-13,z:lots.gecg.z+19.5})),'Society gate must be open')
scene.updateMatrixWorld(true)
const crest=new T.Vector3(lots.gecg.x+24,.26,lots.gecg.z+28),ray=new T.Raycaster(new T.Vector3(crest.x,100,crest.z),new T.Vector3(0,-1,0))
assert.equal(ray.intersectObject(site.root,true)[0]?.object.material.name,'logo-oficial-gecg','Official aerial crest is absent or obstructed')
const disposed={textures:0,geometries:0,materials:0}
for(const [key,set]of Object.entries({textures,geometries,materials}))for(const resource of set)resource.addEventListener('dispose',()=>disposed[key]++)
const metrics={...site.metadata,logoBytes}
site.dispose();site.dispose();assert.equal(scene.children.length,0)
assert.deepEqual(disposed,{textures:textures.size,geometries:geometries.size,materials:materials.size})
console.log(JSON.stringify({status:'PASS',meshes:metrics.meshes,triangles:metrics.triangles,textures:metrics.textureCount,logoBytes,parcels:parcels.length,doors:Object.keys(site.doors).length,disposed}))
