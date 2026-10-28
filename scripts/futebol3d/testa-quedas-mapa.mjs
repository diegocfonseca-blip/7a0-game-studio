import assert from 'node:assert/strict';
import {prepareFoulReactions,sampleFoulReaction,foulRoot} from '../../src/escalacao/futebol3d/motion/map-foul-reaction.mjs';
const actors=[{key:'home',name:'Atleta',side:'home'},{key:'away',name:'Atleta',side:'away'}];
const foul={tipo:'falta',t:5,lado:1,a:'Atleta',b:'Atleta'};
const durations={cai:1.6,levanta:1.667,cai_parado:2.3,cai_carrinho:2.733};
const world=(key,t)=>({x:key==='home'?0:.7,z:0,heading:0,speed:3});
const input={events:[foul],actors,agenda:[],durations,world};
const unchanged=JSON.stringify(input),prepared=prepareFoulReactions(input);
assert.equal(prepared.plans.length,1);assert.equal(prepared.plans[0].key,'home','A repeated legend name must identify the victim by TEAM');
const plan=prepared.plans[0];
assert.deepEqual(plan.clips.map(c=>c.name),['cai','levanta']);
// In the entire grounded transition the pose must stay fully captured:
// no fade to idle between the last fallen frame and the first getting-up frame.
for(let t=plan.t+.12;t<plan.end-.15;t+=1/120){const p=sampleFoulReaction(prepared.plans,'home',t);assert(Math.abs(p.clips.reduce((s,c)=>s+c.weight,0)-1)<1e-9)}
assert.equal(sampleFoulReaction(prepared.plans,'home',plan.end),null);
assert.equal(sampleFoulReaction(prepared.plans,'away',6),null);
const paused=sampleFoulReaction(prepared.plans,'home',6);assert.deepEqual(sampleFoulReaction(prepared.plans,'home',6),paused);
assert.deepEqual(foulRoot(paused,{x:1.5,z:0}),{x:0,z:0},'A grounded victim cannot slide to a restart position');
const quick=prepareFoulReactions({...input,agenda:[{key:'home',t:7.1,start:6.6}]});
assert.equal(quick.plans.length,1);assert.deepEqual(quick.plans[0].clips.map(c=>c.name),['cai_parado'],'An already self-recovering capture must not fall into a second get-up');
assert(quick.plans[0].end<6.6,'Finish standing before the next ball preparation');
const tackle=prepareFoulReactions({...input,events:[{tipo:'carrinho',t:4.9,lado:1,a:'Atleta'},foul],world:(k,t)=>({...world(k,t),speed:5})});
assert.deepEqual(tackle.plans[0].clips.map(c=>c.name),['cai_carrinho']);
assert.equal(prepareFoulReactions({...input,agenda:[{key:'home',t:5.8,start:5.6}]}).skipped[0].reason,'restart-too-soon');
assert.equal(prepareFoulReactions({...input,events:[{tipo:'vantagem',t:3,lado:0,a:'Atleta',b:'Atleta'},foul]}).skipped[0].reason,'advantage-recall');
assert.equal(prepareFoulReactions({...input,world:(k,t)=>({...world(k,t),x:k==='away'?5:0})}).skipped[0].reason,'no-nearby-contact');
assert.equal(prepareFoulReactions({...input,world:(k,t)=>({...world(k,t),x:(t-5)*9+(k==='away'?.7:0)})}).skipped[0].reason,'restart-relocation');
assert.equal(JSON.stringify(input),unchanged,'Presentation cannot modify the official input');
console.log('PASS: one complete fall/recovery, no idle pop, same-name opponents, contact distance, grounded root, pause/seek, advantage recall, restart deadline and immutable events');
