import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {existsSync} from 'node:fs'
import * as THREE from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {criarEntregasVeiculos}=await import('../src/escalacao/veiculos-entrega-3d.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const {PLANTAS_ESTACIONAMENTO_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const {TERRENO_USUARIO:HOME}=await import('../src/escalacao/residencia-planta.ts')
const {PRESIDENCIA_CATALOGO}=await import('../src/escalacao/presidencia-economia.ts')
const scene=new THREE.Scene(),save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']},world=criarEntornoComplexo(scene,complexoDoEstadio(save),undefined,{name:'Amostra',residence:true,arena:true,museum:true})
assert.ok(HOME.z-HOME.depth/2>350,'Casa fica além da avenida e fora do campus')
assert.ok(Math.hypot(HOME.x,HOME.z)>500,'Separação clara do estádio')
assert.ok(world.casaLuca&&world.casaLucaSul)
const wallet=ids=>({cash:80,revision:1,owned:ids.map(id=>({id,paid:PRESIDENCIA_CATALOGO.find(i=>i.id===id).price}))})
const cameraIndependent=[]
for(const [id,slot] of [['fusca',0],['civic',1],['escalade',0],['f40',1]]){
 const cars=slot?['chevette',id]:[id,'chevette'],w=wallet(cars),before=JSON.stringify([w,save]),control=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4})
 control.sync(w,cars)
 assert.equal(control.drive('aventador','stadium').ok,false,'Não cria carro que não foi comprado')
 assert.equal(control.drive(id,'home').ok,false,'Não volta do estádio antes de chegar')
 const go=control.drive(id,'stadium');assert.ok(go.ok,id+': ida '+JSON.stringify(go))
 assert.equal(control.drive(cars[1-slot],'stadium').ok,false,'Só um passeio por vez')
 const tickTo=(phase,start)=>{let t=start,steps=0;for(;steps<18000;steps++){control.update(t);t+=.1;if(control.commute()?.phase===phase||phase==='parked'&&!control.commute())return{t,steps}}throw Error(id+' não concluiu '+phase)}
 const outbound=tickTo('at-stadium',0),at=control.commute();assert.equal(at.id,id);assert.ok(Math.hypot(at.position[0]-PLANTAS_ESTACIONAMENTO_COMPLEXO[0].slots[5].center.x,at.position[2]-PLANTAS_ESTACIONAMENTO_COMPLEXO[0].slots[5].center.z)<.1,JSON.stringify(at))
 control.update(outbound.t+100);assert.equal(control.commute().phase,'at-stadium','Permanece na vaga aguardando ação')
 const back=control.drive(id,'home');assert.ok(back.ok,id+': volta '+JSON.stringify(back))
 const inbound=tickTo('parked',outbound.t+101),last=control.inspect().vehicles.find(c=>c.id===id)
 assert.ok(Math.hypot(last.position[0]-(HOME.garage.x+(slot?2.1:-2.1)),last.position[2]-HOME.garage.z)<.01)
 assert.equal(JSON.stringify([w,save]),before,'Passeio não muda posse, dinheiro ou estádio')
 cameraIndependent.push({id,slot,outbound:outbound.steps,inbound:inbound.steps});control.dispose()
}
// Retomada após recriar o renderer: o carro conserva o ponto do passeio.
let moving=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4})
const savedWallet=wallet(['fusca','chevette']);moving.sync(savedWallet);assert.ok(moving.drive('fusca','stadium').ok)
for(let i=0;i<500;i++)moving.update(i/10)
const snapshot=moving.snapshotTrip(),position=[...moving.commute().position]
moving.dispose();moving=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4});moving.sync(savedWallet)
assert.ok(moving.restoreTrip(snapshot));assert.ok(new THREE.Vector3(...moving.commute().position).distanceTo(new THREE.Vector3(...position))<.001)
const frozen=JSON.stringify(moving.commute());moving.sync(savedWallet,['chevette','fusca']);assert.equal(JSON.stringify(moving.commute()),frozen,'Troca de exposição não teleporta o carro na rua')
for(let i=0;i<4000&&moving.commute()?.phase!=='at-stadium';i++)moving.update(100+i/10)
assert.equal(moving.commute().phase,'at-stadium')
const parkedSnapshot=moving.snapshotTrip();moving.dispose();moving=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4});moving.sync(savedWallet);assert.ok(moving.restoreTrip(parkedSnapshot));assert.equal(moving.commute().phase,'at-stadium')
assert.ok(moving.drive('fusca','home').ok);for(let i=0;i<4000&&moving.commute();i++)moving.update(800+i/10)
assert.equal(moving.commute(),null);moving.dispose()
// Um obstáculo à frente faz o carro esperar; ao liberar a via, ele continua.
let block=true
const yielding=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4,blockers:()=>block?[{position:{x:HOME.garage.x-2.1,z:HOME.garage.z+3}}]:[]})
yielding.sync(wallet(['fusca']));assert.ok(yielding.drive('fusca','stadium').ok);yielding.update(0);const stopped=[...yielding.commute().position]
for(let i=1;i<30;i++)yielding.update(i/10)
assert.deepEqual(yielding.commute().position,stopped);block=false;for(let i=30;i<60;i++)yielding.update(i/10)
assert.notDeepEqual(yielding.commute().position,stopped);yielding.dispose()
const missing=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:0});missing.sync(wallet(['fusca']));assert.deepEqual(missing.drive('fusca','stadium'),{ok:false,error:'no-parking'});missing.dispose()
const bikes=criarEntregasVeiculos(scene,world.root,world.solids,true,{parkingStage:4});bikes.sync(wallet(['cg-titan']));assert.equal(bikes.drive('cg-titan','stadium').ok,false);bikes.dispose()
const noAccess=criarEntregasVeiculos(scene,world.root,world.solids,false,{parkingStage:4});assert.equal(noAccess.drive('fusca','stadium').ok,false);noAccess.dispose()
world.dispose();assert.equal(scene.children.length,0,'Recursos e corpos removidos ao sair')
console.log(JSON.stringify({status:'PASS',house:HOME,roundTrips:cameraIndependent,noPurchases:true,parkingRequired:true,sameCarReturns:true,resumeAfterRendererRebuild:true,garageSelectionNoTeleport:true,yieldsToTraffic:true}))
