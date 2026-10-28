import assert from 'node:assert/strict';
import {keeperCatchIntent} from '../../src/escalacao/futebol3d/motion/map-keeper-intent.mjs';
const side=key=>key==='keeper'?'away':'home';
for(const direction of [-Math.PI/2,Math.PI/2]){
 const shot={id:'shot',kind:'toque',tipo:'chute',key:'striker',t:3,dir:direction};
 const collection={key:'keeper',kind:'recebe',t:4.2,dir:direction}; // post rebound goes the other way
 const before=JSON.stringify([shot,collection]),intent=keeperCatchIntent(collection,[shot,collection],side);
 assert(Math.cos(intent.heading-direction)<-.99,'Face the incoming shot, not the future rebound velocity');
 assert.equal(intent.shot,'shot');assert.equal(JSON.stringify([shot,collection]),before);
}
const cue={key:'keeper',t:6,dir:.3};assert.equal(keeperCatchIntent(cue,[],side).heading,.3,'An unrelated loose ball keeps its actual approach');
console.log('PASS: both goal directions, rebound anticipation and immutable official actions');
