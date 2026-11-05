import assert from 'node:assert/strict';
import {arquiteturaDoEndereco} from '../../src/escalacao/presidencia-bairro-arquitetura.ts';
import {residentGatherings,residentJob,companionGathering} from '../../src/escalacao/cidade3d/resident-gatherings.mjs';

const types=new Set(),roofs=new Set(),colors=new Set();
for(let i=0;i<500;i++){
 const v=i%4,x=(i%20)*24,z=Math.floor(i/20)*26,design=arquiteturaDoEndereco(x,z,v);
 assert.deepEqual(design,arquiteturaDoEndereco(x,z,v));
 assert.ok(design.w>7&&design.w<11.2&&design.d<=12.1,'Preservar o espaço dos lotes existentes');
 assert.equal(design.floors,[1,2,4,6][v]);
 types.add(design.tipo);roofs.add(design.roof);colors.add(design.color);
 const distant=arquiteturaDoEndereco(x,z,v,true);assert.ok(!distant.comercial,'Preservar os comércios nos endereços existentes');
 if(!design.comercial){assert.equal(distant.frontWall,design.frontWall);assert.equal(distant.balcony,design.balcony,'Aproximar-se de um bairro afastado também precisa revelar sua fachada');}
}
assert.equal(types.size,5);assert.equal(roofs.size,3);assert.equal(colors.size,8);
const hubs=[0,30,60,90].map((z,i)=>({id:'local-'+i,purpose:i<2?'encontro':'transporte',frontage:[{x:0,z},{x:20,z}]}));
const valid=p=>p.x>=.5&&p.x<=19.5&&hubs.some(h=>Math.abs(p.z-h.frontage[0].z)<1.4)&&!(p.x>9&&p.x<10&&p.z>89);
const jobs=residentGatherings(hubs,valid);
assert.ok(jobs.length>=12);assert.equal(new Set(jobs.map(j=>j.destination)).size,4);
assert.deepEqual(residentGatherings(hubs,()=>false),[],'Não inventar caminho atravessando obstáculo');
for(const job of jobs){
 for(const route of [job,companionGathering(job,valid)]){
  for(let t=0;t<route.journey.period*2;t+=.05){const p=route.journey.at(t);assert.ok(valid(p),'Piso válido durante ida, espera, volta e reinício');assert.ok(Math.hypot(p.x-route.journey.at(t+.01).x,p.z-route.journey.at(t+.01).z)<.015,'Sem teleporte na mudança de fase');}
 }
}
const homes=Array.from({length:80},(_,i)=>({id:'casa-'+i}));
const mobile=Array.from({length:20},(_,i)=>residentJob(i,jobs,homes));
assert.ok(mobile.filter(j=>j.publicWaiting).length>=10,'Concentrar parte do mesmo orçamento nos encontros');
assert.ok(mobile.some(j=>!j.publicWaiting),'Preservar alguma circulação residencial');
const desktop=Array.from({length:48},(_,i)=>residentJob(i,jobs,homes));
assert.deepEqual(mobile,desktop.slice(0,20),'Qualidade/quantidade não muda o destino de um morador existente');
console.log(JSON.stringify({ok:true,types:[...types],roofs:[...roofs],validatedGatherings:jobs.length,mobileResidents:mobile.length,publicResidents:mobile.filter(j=>j.publicWaiting).length}));
