import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {registerHooks} from 'node:module'
import * as THREE from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=fileURLToPath(new URL(s,c.parentURL));if(fs.existsSync(p+'.ts'))return{url:pathToFileURL(p+'.ts').href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)}})
const {criarColecaoSala}=await import('../src/escalacao/presidencia-sala-colecao-3d.ts')
const {criarMobiliaComplexo}=await import('../src/escalacao/presidencia-complexo-mobilia.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS}=await import('../src/escalacao/estadiodata.ts')
const full=complexoDoEstadio({inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[]})
const bare=complexoDoEstadio({inv:{},ext:[]}),wallet=ids=>({cash:1000,revision:1,owned:ids.map(id=>({id,paid:20}))})
const trophies=Array.from({length:11},(_,i)=>({id:'titulo-'+i,label:'Título '+i,count:i+1}))
const art={crest:'/crest.webp',shirt:'/shirt.webp',mascot:'/mascot.webp',color:'#1b7a3d'}
let scenarios=0
for(const basic of [true,false])for(const rug of [false,true]){
 const scene=new THREE.Scene(),w=wallet([basic?'mesa-simples':'mesa-madeira',basic?'estante-simples':'estante-madeira','quadro',...(rug?['tapete']:[])])
 const furniture=criarMobiliaComplexo(scene,full,w),collection=criarColecaoSala(scene,full,()=>{}),before=JSON.stringify([w,trophies,art])
 assert(collection.update(w,trophies,art));assert.equal(collection.update(w,trophies,art),false)
 assert.equal(collection.inspect().items.length,9);assert.deepEqual(collection.inspect().identity,{crest:true,shirt:true,mascot:true})
 scene.updateMatrixWorld(true)
 // A ray at each base must find the bought shelf directly beneath it, and no
 // furniture may cover the middle of the cup. This catches the lower cabinet
 // and central divider that previously hid earned trophies.
 const ray=new THREE.Raycaster(),bounds=new THREE.Box3()
 collection.root.traverse(n=>{
  if(!(n instanceof THREE.Mesh))return
  for(const attr of Object.values(n.geometry.attributes))for(const v of attr.array)assert(Number.isFinite(v))
  if(!n.name.startsWith('trofeu-base-')&&n.name!=='mascote-suporte')return
  bounds.setFromObject(n)
  ray.set(new THREE.Vector3(n.position.x,bounds.min.y+.005,n.position.z),new THREE.Vector3(0,-1,0));ray.far=.03
  const hit=ray.intersectObject(furniture.root,true)[0]
  assert(hit,n.name+': sem móvel de apoio');assert(Math.abs(hit.point.y-bounds.min.y)<2e-5,n.name+': flutua ou atravessa apoio')
  if(n.name.startsWith('trofeu-base-')){
   ray.set(new THREE.Vector3(n.position.x,bounds.min.y+.22,77.7),new THREE.Vector3(0,0,1));ray.far=n.position.z-77.7
   assert.equal(ray.intersectObject(furniture.root,true).length,0,n.name+': escondido por armário ou divisória')
  }
 })
 assert.equal(JSON.stringify([w,trophies,art]),before)
 collection.update(w,trophies,art,1);assert.deepEqual(collection.inspect().items.map(i=>i.id),['titulo-9','titulo-10'])
 collection.update(wallet([]),trophies,art);assert.equal(collection.inspect().items.length,0);assert.deepEqual(collection.inspect().identity,{crest:true,shirt:false,mascot:false})
 collection.update(w,[{id:'../invalido',count:1},{id:'negativo',count:-1},{id:'fracao',count:.5}],art);assert.equal(collection.inspect().items.length,0)
 const resources=new Map();collection.root.traverse(n=>{if(n instanceof THREE.Mesh)for(const r of [n.geometry,...(Array.isArray(n.material)?n.material:[n.material])])if(!resources.has(r)){resources.set(r,0);r.addEventListener('dispose',()=>resources.set(r,resources.get(r)+1))}})
 collection.dispose();collection.dispose();assert([...resources.values()].every(n=>n===1));assert.equal(collection.update(w,trophies,art),false)
 furniture.dispose();assert.equal(scene.children.length,0);scenarios++
}
for(const interior of [false,true]){
 const scene=new THREE.Scene(),collection=criarColecaoSala(scene,bare,()=>{},interior)
 collection.update(wallet(['estante-madeira']),trophies,art);assert.equal(collection.inspect().items.length,interior?9:0)
 collection.update({cash:-1,revision:1,owned:[]},trophies,art);assert.equal(collection.inspect().items.length,0);assert.deepEqual(collection.inspect().identity,{crest:false,shirt:false,mascot:false})
 collection.dispose();scenarios++
}
console.log(`PASS coleção: ${scenarios} cenários de apoio físico, divisórias, compras, títulos/páginas, identidade, sem mutação e descarte.`)
