import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as THREE from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {culturaDoBairro,posePipa}=await import('../src/escalacao/bairro-cultura.ts')
const {quadroPeladaGecg}=await import('../src/escalacao/gecg-pelada.ts')
const {LOTES_PATROCINADORES_CIDADE:{gecg:g}}=await import('../src/escalacao/presidencia-patrocinadores-planta.ts')
const weekend=Date.UTC(2027,5,12),weekday=Date.UTC(2027,5,14)
assert.equal(culturaDoBairro({dia:weekend,hora:21}).pagode,true)
assert.equal(culturaDoBairro({dia:weekday,hora:21}).pagode,false)
assert.equal(culturaDoBairro({dia:weekend,hora:9}).pagode,false)
assert.equal(culturaDoBairro({dia:weekend,hora:14}).pipas,true)
assert.equal(culturaDoBairro({dia:weekend,hora:21}).pipas,false)
for(let month=0;month<12;month++)for(const hora of[9,14,21])assert.equal(culturaDoBairro({dia:Date.UTC(2027,month,12),hora}).junina,month===5&&hora>=12)
assert.equal(culturaDoBairro({hora:21}).junina,false,'Não inventa junho sem calendário')
assert.deepEqual(culturaDoBairro({dia:weekend,hora:14}),culturaDoBairro({dia:weekend,hora:14}),'Mesma carreira, mesma agenda')
let samples=0
for(const[light,mobile,count]of[[true,true,4],[false,true,6],[false,false,8]]){
 let previous
 for(let t=0;t<108;t+=.1){
  const f=quadroPeladaGecg(t,light,mobile,{dia:weekday,hora:14})
  assert.equal(f.players.length,count);assert.equal(f.players.filter(p=>p.keeper).length,2)
  assert(f.players.every(p=>Math.abs(p.x-g.x)<=25.1&&Math.abs(p.z-g.z)<16&&Number.isFinite(p.heading)),'Atletas dentro do campo')
  assert(Math.abs(f.ball.x-g.x)<28&&Math.abs(f.ball.z-g.z)<17&&f.ball.y>=.19,'Bola dentro do campo e acima do piso')
  if(previous)assert(Math.hypot(f.ball.x-previous.x,f.ball.z-previous.z)<3.5,'Bola sem teletransporte '+JSON.stringify({light,mobile,t,ball:f.ball,previous}))
  previous=f.ball;samples++
 }
 assert.equal(quadroPeladaGecg(0,light,mobile,{hora:9}).mode,'escolinha')
}
for(let t=0;t<100;t+=.25)for(const i of[0,1]){const p=posePipa(t,i,{x:0,z:0});assert(p.y>9&&p.y<15);assert(Math.abs(p.x)<6&&Math.abs(p.z)<3)}
// As rotinas comerciais continuam inicializando e liberando recursos nos dois níveis.
const {criarRotinasPatrocinadores}=await import('../src/escalacao/patrocinadores-rotinas-3d.ts')
for(const light of[false,true]){
 const scene=new THREE.Scene(),env=new THREE.Group(),point={x:0,z:0},doors=Object.fromEntries(['tidex','oittolabs','dsouza'].map(id=>[id,{approach:point,threshold:point,inside:point}]))
 const life=criarRotinasPatrocinadores(scene,env,doors,[],{enabled:true,mobile:true,light,onReady(){}}),camera=new THREE.PerspectiveCamera(38,1,.1,5000)
 camera.position.set(2000,2000,2000);camera.lookAt(0,0,0);camera.updateMatrixWorld();life.update(80,camera,720,'day',{dia:weekday,hora:14})
 assert.equal(life.inspect().training.error,'');assert.equal(life.inspect().training.near,false)
 if(light)assert.equal(life.inspect().budget.trucks,0,'Modo Leve não carrega as entregas junto do futebol')
 life.dispose();assert.equal(scene.children.length,0,'Rotinas sem raízes abandonadas')
}
console.log('PASS bairro vivo:',samples,'quadros; agendas, 2 goleiros, limites e continuidade da bola; pipas sem relógio real')
