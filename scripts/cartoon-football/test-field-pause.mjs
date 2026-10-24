import assert from 'node:assert/strict';
import {suspenderRelogioCampo,passoRelogioCampo,publicarTempoCampo2D,tempoCampo2D} from '../../src/escalacao/campo2d-relogio.ts';
const precise=32.617,r={min:32,em:0,ms:800};
for(const now of [1000,10000,600000]){
 const held=suspenderRelogioCampo(r,precise,now);
 assert.equal(held.min,32);assert.equal(held.ms,800);
 const resumed=passoRelogioCampo(precise,16,now+16,held,false,800);
 assert.ok(resumed>=precise&&resumed-precise<.03,'Resume cannot replay elapsed pause time');
 publicarTempoCampo2D('same-match',precise,now);
 assert.equal(tempoCampo2D('same-match',now),precise);assert.equal(tempoCampo2D('other-match',now),undefined);
}
publicarTempoCampo2D('other-match',null,600001);assert.equal(tempoCampo2D('same-match',600001),precise);
publicarTempoCampo2D('same-match',null,600001);assert.equal(tempoCampo2D('same-match',600001),undefined);
console.log('Precise field pause, long suspension, smooth resume and fixture-isolated clock passed');
