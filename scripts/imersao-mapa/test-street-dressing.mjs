import assert from 'node:assert/strict';
import {streetDressingPlan,STREET_DRESSING} from '../../src/escalacao/cidade3d/street-dressing.mjs';
// Postes de mentira numa grade (rua a cada 30 m, como a cidade desenha), com o braço apontando pra rua.
const posts=[];
for(let x=-300;x<=300;x+=30)for(const z of [70,110,150,260])posts.push({x,z,armX:0,armZ:z>100?-1:1});
const desk=streetDressingPlan(posts),mobile=streetDressingPlan(posts,{mobile:true});
assert.equal(desk.flags.length,STREET_DRESSING.flags.desktop,'bandeiras no limite do computador');
assert.equal(mobile.flags.length,STREET_DRESSING.flags.mobile,'celular leva menos bandeiras');
assert(desk.strings.length<=STREET_DRESSING.strings.desktop&&mobile.strings.length<=STREET_DRESSING.strings.mobile,'varais limitados');
assert(desk.strings.length>0,'postes vizinhos ganham varal');
for(const f of desk.flags){
 assert(Math.hypot(f.x-STREET_DRESSING.focus.x,f.z-STREET_DRESSING.focus.z)<=STREET_DRESSING.maxDistance,'só perto do estádio');
 assert(Math.abs(Math.hypot(f.dirX,f.dirZ)-1)<1e-9,'direção do braço normalizada');
}
for(const s of desk.strings)assert(s.length>=STREET_DRESSING.stringMin&&s.length<=STREET_DRESSING.stringMax,'varal só entre postes vizinhos');
// Varal nunca desce até a altura de ônibus (3,8 m).
for(const p of desk.pennants)assert(STREET_DRESSING.stringHeight-p.sag-.38>3.9,'bandeirola acima dos ônibus');
assert(STREET_DRESSING.flagBottom>3.9,'bandeira do poste acima dos ônibus');
// Cada poste entra em no máximo um varal (sem emaranhado).
const ends=desk.strings.flatMap(s=>[s.a,s.b].map(p=>p.x+':'+p.z));assert.equal(new Set(ends).size,ends.length);
// Determinístico e sem postes = nada.
assert.deepEqual(streetDressingPlan(posts),desk);
assert.deepEqual(streetDressingPlan(undefined),{flags:[],strings:[],pennants:[]});
assert.deepEqual(streetDressingPlan([{x:NaN,z:0}]).flags,[]);
// Poste sem braço conhecido vira pro estádio.
const lone=streetDressingPlan([{x:0,z:200}]).flags[0];assert(lone.dirZ<0);
const pieces=desk.flags.length*2+desk.pennants.length;
console.log(JSON.stringify({status:'PASS',flags:desk.flags.length,strings:desk.strings.length,pennants:desk.pennants.length,instancedPieces:pieces,drawCalls:4,mobileFlags:mobile.flags.length}));
