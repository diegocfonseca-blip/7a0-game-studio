import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {existsSync} from 'node:fs'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {ARENA_ONLINE:a}=await import('../src/escalacao/arena-planta.ts')
const {LOTES_PATROCINADORES_CIDADE:l}=await import('../src/escalacao/presidencia-patrocinadores-planta.ts')
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const {criarVidaLocais}=await import('../src/escalacao/presidencia-locais-vida.ts')
const {criarRotinasPatrocinadores}=await import('../src/escalacao/patrocinadores-rotinas-3d.ts')
const save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']},before=JSON.stringify(save),scene=new T.Scene(),env=criarEntornoComplexo(scene,complexoDoEstadio(save),undefined,{name:'Teste',residence:true,arena:true,museum:true})
assert(a.pitch.length>env.root.userData.sponsors.field.length&&a.pitch.width>env.root.userData.sponsors.field.width,'Campo da arena maior nas duas dimensões')
assert(a.width*a.depth>l.gecg.width*l.gecg.depth,'Conjunto maior que o lote do Grêmio')
assert(a.z<0&&l.dsouza.z>200,'Arena e dSouza trocaram de setor')
const b=a.building,overlaps=env.solids.filter(s=>s.id!==a.id&&s.top>.4&&s.base<a.height&&s.minX<b.maxX&&s.maxX>b.minX&&s.minZ<b.maxZ&&s.maxZ>b.minZ)
assert.deepEqual(overlaps.map(s=>s.id),[],'Arena não atravessa outro imóvel ou colisor')
const arena=env.root.getObjectByName('arena-legends-online');assert(arena);assert(arena.children.length<=12,'Geometria agrupada em poucos desenhos')
for(const mesh of arena.children){const pos=mesh.geometry.getAttribute('position');for(let i=0;i<pos.count;i++)assert([pos.getX(i),pos.getY(i),pos.getZ(i)].every(Number.isFinite))}
const people=criarVidaLocais(scene,env.root,env.solids,true,()=>{});assert(!people.inspect().blocked.includes('arena'),'Visita da arena chega à nova entrada sem cruzar paredes')
const life=criarRotinasPatrocinadores(scene,env.root,env.doors,env.solids,{enabled:true,mobile:true,onReady(){}}),camera=new T.PerspectiveCamera(38,1,.1,5000);camera.position.set(l.dsouza.x,65,l.dsouza.z+100);camera.lookAt(l.dsouza.x,0,l.dsouza.z);camera.updateMatrixWorld();life.update(80,camera,720,'day',{dia:Date.UTC(2027,1,7),hora:14})
for(let i=0;i<1500&&life.inspect().delivery.preparingRoutes;i++)await new Promise(r=>setTimeout(r,16))
const delivery=life.inspect().delivery;assert(!delivery.error,delivery.error);assert(delivery.routes?.length>0,'Entregas da dSouza continuam com caminho de ida e volta')
assert.equal(JSON.stringify(save),before);console.log(JSON.stringify({arena:a,drawCalls:arena.children.length,deliveryRoutes:delivery.routes?.length,localVisits:people.inspect().blocked,roadProblems:env.root.userData.roadNetwork.diagnostics.unresolved},null,2));life.dispose();people.dispose();env.dispose();assert.equal(scene.children.length,0)
console.log('PASS arena: tamanho, lote, colisões, visita, entregas, save e liberação dos recursos')
