import assert from 'node:assert/strict';
import {liveGroundInterval} from '../../../src/escalacao/futebol3d/chibi/live-ground-interval.mjs';
import {isImmediateLooseContinuation} from '../../../src/escalacao/futebol3d/chibi/ground-continuation-kind.mjs';
const sample=t=>({phase:t<1.4?'passe':'dominio',owner:t<1.4?undefined:'a',ball:{x:t*8,y:.11,z:0}});
assert(liveGroundInterval(1,2,sample));
for(const phase of ['tiro-de-meta','falta','lateral','escanteio','saida','gol','fim','penalti']){
 const dead=t=>({...sample(t),phase:t>1.2&&t<1.3?phase:sample(t).phase});
 assert(!liveGroundInterval(1,2,dead),'Do not bridge '+phase+' between otherwise valid contacts');
 const lost=t=>({...sample(t),owner:undefined,phase:t>1.2?phase:'dominio'});
 assert(!isImmediateLooseContinuation({t:1,key:'a'},{t:2,key:'b'},lost),'A '+phase+' is not a spilled control');
}
assert(!liveGroundInterval(1,2,t=>({...sample(t),heldBy:t>1.2&&t<1.3?'gk':undefined})));
assert(!liveGroundInterval(1,2,t=>({...sample(t),placementReset:t>1.2&&t<1.3})));
assert(!liveGroundInterval(1,2,t=>({...sample(t),ball:{x:t<1.5?0:15,y:.11,z:0}})));
assert(!liveGroundInterval(1,2,t=>({...sample(t),ball:{...sample(t).ball,y:t>1.2&&t<1.3?1:.11}})));
assert(!liveGroundInterval(1,2,t=>({...sample(t),phase:t===2?'falta':'dominio'})),'Check the endpoint too');
assert(!isImmediateLooseContinuation({t:1,key:'a'},{t:1.02,key:'b'},()=>({phase:'falta',owner:undefined})),'Even an immediate loss at a restart is not a live spill');
console.log('PASS: uninterrupted ground play, all restart boundaries, hand capture, placements, discontinuities and both endpoints');
