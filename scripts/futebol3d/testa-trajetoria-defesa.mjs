import assert from 'node:assert/strict';
import {keeperFlight,sampleKeeperFlight} from '../../src/escalacao/futebol3d/motion/map-keeper-flight.mjs';
const cue={t:1,bola:{x:10,y:1,z:0,vx:-4,vy:2,vz:3}},agenda=[{t:.1},cue,{t:2}],sample=t=>({ball:{x:t<1?10+(t-1)*20:10-(t-1)*4,y:1,z:t<1?0:(t-1)*3,vx:t<1?20:-4,vy:0,vz:t<1?0:3}}),copy=JSON.stringify(cue);
const f=keeperFlight(cue,sample,agenda);
for(const [t,p] of [[f.start,f.before],[1,cue.bola],[f.end,f.after]])for(const k of ['x','y','z'])assert(Math.abs(sampleKeeperFlight(f,t)[k]-p[k])<1e-9,'Fixed endpoint changed');
const epsilon=1e-6,at=sampleKeeperFlight(f,1),before=sampleKeeperFlight(f,1-epsilon),after=sampleKeeperFlight(f,1+epsilon);
assert(Math.abs((at.x-before.x)/epsilon-20)<.001,'Incoming velocity changed before contact');assert(Math.abs((after.x-at.x)/epsilon+4)<.001,'Deflection did not occur on the impact frame');
assert.equal(sampleKeeperFlight(f,f.start-.1),null);assert.equal(sampleKeeperFlight(f,f.end+.1),null);assert.equal(JSON.stringify(cue),copy);
console.log('PASS: fixed official endpoints, continuous position, impulse on contact, no mutation or live target');
