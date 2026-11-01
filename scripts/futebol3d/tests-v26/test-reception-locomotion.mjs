import assert from 'node:assert/strict';import{receptionTravelVelocity,runningReceptionFacing}from'../../../src/escalacao/futebol3d/chibi/reception-locomotion.mjs';
const cue={kind:'recebe',nome:'controle_corrida',t:2,mira:Math.PI,bola:{y:.11},rec:{speed:5,heading:0}};
const before=JSON.stringify(cue);assert.deepEqual(receptionTravelVelocity(cue),{x:0,z:5},'Facing the arriving pass must not reverse the official run');
assert.deepEqual(receptionTravelVelocity({...cue,rec:{speed:0,heading:2}}),{x:0,z:0},'A static control must not acquire a fictitious 3.4m/s root');
assert(Math.abs(runningReceptionFacing(cue).heading)<=.65,'A runner opens the body without an unexplained 180-degree turn');
assert.deepEqual(receptionTravelVelocity({...cue,rec:{speed:15,heading:0}}),{x:0,z:9});
assert.equal(runningReceptionFacing(cue,{t:2.5,mira:1.2}).heading,1.2,'Preserve the already planned quick-pass stance');
for(const flag of ['hands','goleiro','pickup']){assert.equal(receptionTravelVelocity({...cue,[flag]:true}),null);assert.equal(runningReceptionFacing({...cue,[flag]:true}).heading,Math.PI)}
assert.equal(runningReceptionFacing({...cue,bola:{y:1.5}}).heading,Math.PI,'Do not reuse a ground turn correction for a chest contact');
assert.equal(runningReceptionFacing({...cue,rec:{speed:1,heading:0}}).heading,Math.PI);
assert.equal(receptionTravelVelocity({...cue,rec:{speed:5,heading:NaN}}),null);
assert.equal(JSON.stringify(cue),before,'No mutation of the contact, source heading or official movement');
assert.equal(receptionTravelVelocity(cue,{controlled:true}),null,'An existing two-contact root curve keeps its fitted tangent');
assert.equal(runningReceptionFacing(cue,{t:3.2,mira:1}).heading,cue.mira,'Do not overwrite the working receiving pose of a longer two-contact control');
console.log('PASS: separate travel from contact facing, respect stationary/hand/aerial contacts and nearby release, bounded opening');
