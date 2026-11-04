// 🚌🎥 Câmera seguindo os ônibus (04/11): só no tempo morto, qualquer toque devolve, volta sozinha no fim.
import assert from 'node:assert/strict';
import {focoDoOnibus,enquadraOnibus,criarCameraOnibus,CALMA_S,VOLTA_S} from '../../src/escalacao/presidencia-onibus-camera.ts';

// 1) Ordem: mandante chegando → porta → visitante chegando → porta → fim
assert.deepEqual(focoDoOnibus(['arriving','waiting']),{lado:0,como:'chegando'});
assert.deepEqual(focoDoOnibus(['alighting','waiting']),{lado:0,como:'porta'});
assert.equal(focoDoOnibus(['departing','waiting']),'espera');
assert.deepEqual(focoDoOnibus(['gone','arriving']),{lado:1,como:'chegando'});
assert.deepEqual(focoDoOnibus(['gone','opening']),{lado:1,como:'porta'});
assert.equal(focoDoOnibus(['gone','departing']),'fim');
assert.equal(focoDoOnibus([]),null);
// 2) Enquadramento atrás do ônibus, olhando pra frente dele
const bus={x:0,y:0,z:0,heading:0,visible:true};
const p=enquadraOnibus(bus,'chegando',false);
assert(p.camera[2]<0&&p.target[2]>0,'câmera atrás, mira na frente');
assert(enquadraOnibus(bus,'chegando',true).camera[2]<p.camera[2],'celular em pé recua mais');
const baia={camera:[-114,8,-34],target:[-94,1.8,-14]},atual={camera:[0,200,200],target:[0,0,0]};
const entrada=(o)=>({key:'dia1',permitido:true,fases:['arriving','waiting'],onibus:[bus,{...bus,visible:false}],baia,atual,agora:10,desdeToque:99,retrato:false,...o});
// 3) Não começa com o dedo mexendo há pouco, nem sem permissão (jogo rolando, escritório…), nem sem ônibus chegando
{const c=criarCameraOnibus();assert.equal(c.quadro(entrada({desdeToque:CALMA_S-1})),null);assert.equal(c.quadro(entrada({permitido:false})),null);assert.equal(c.quadro(entrada({fases:['waiting','waiting']})),null)}
// 4) Começa, segue, e QUALQUER toque devolve na hora e não retoma nesta chegada
{const c=criarCameraOnibus();
 assert(c.quadro(entrada({agora:10})),'começou');
 const q=c.quadro(entrada({agora:10.5}));assert(q&&q.camera[1]<200,'aproxima do ônibus');
 c.tocou();assert.equal(c.quadro(entrada({agora:11})),null,'toque devolve');
 assert.equal(c.quadro(entrada({agora:20,fases:['gone','arriving']})),null,'não volta a seguir no mesmo dia');
 assert(c.quadro(entrada({key:'dia2',agora:30})),'dia seguinte pode de novo');}
// 5) Acabou a chegada sem toque → volta suave pra onde estava e solta
{const c=criarCameraOnibus();c.quadro(entrada({agora:10}));c.quadro(entrada({agora:11}));
 const v0=c.quadro(entrada({agora:12,fases:['gone','gone']}));assert(v0);
 const v1=c.quadro(entrada({agora:12+VOLTA_S+.1,fases:['gone','gone']}));assert.deepEqual(v1.camera,atual.camera,'voltou pro lugar');
 assert.equal(c.quadro(entrada({agora:20,fases:['gone','gone']})),null,'e solta a câmera');}
// 6) Jogo começou no meio (permitido=false) → volta também
{const c=criarCameraOnibus();c.quadro(entrada({agora:10}));assert(c.quadro(entrada({agora:10.4,permitido:false})),'volta suave');assert(c.inspect().voltando)}
console.log(JSON.stringify({status:'PASS',order:true,chase:true,touchReturnsControl:true,deadTimeOnly:true,returnsHome:true}));
