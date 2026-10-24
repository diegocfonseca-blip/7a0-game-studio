import assert from 'node:assert/strict';
import {strikeClock} from '../../src/escalacao/futebol3d/motion/strike-clock.mjs';
for(const rate of [1,1.5,2,3,9])for(const start of [.1,.8]){
 const p={marker:2.5,time:1,start,end:1.6,swingTiming:{rate,window:.24}};
 assert.equal(strikeClock(p,p.time).sample,p.marker);
 let old=-Infinity;
 for(let i=0;i<=2000;i++){const t=p.start+(p.end-p.start)*i/2000,c=strikeClock(p,t);assert.ok(c.sample>=old-1e-9);assert.ok(c.rate>0);old=c.sample;}
 for(const t of [p.start,p.time,p.end,p.time-Math.min(.24,p.time-p.start),p.time+.24]){
  const h=1e-7,before=strikeClock(p,t-h),after=strikeClock(p,t+h),at=strikeClock(p,t);
  assert.ok(Math.abs(after.sample-before.sample)<1e-5,'No capture-time jump');
  assert.ok(Math.abs((at.sample-before.sample)/h-(after.sample-at.sample)/h)<1e-4,'Continuous swing velocity');
 }
}
const legacy={marker:2,time:1};assert.deepEqual(strikeClock(legacy,1.2),{sample:2.2,rate:1});
console.log('Captura monotônica, contato fixo e velocidade contínua: OK');
