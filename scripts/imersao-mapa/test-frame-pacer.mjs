import assert from 'node:assert/strict';
import {framePacer} from '../../src/escalacao/cidade3d/frame-pacer.mjs';
for(const refresh of[30,60,120]){
 const p=framePacer();let count=0,lastDraw=null,presentationSeconds=0,officialSeconds=0;
 for(let i=0;i<=refresh*10;i++){
  const now=i*1000/refresh;officialSeconds=now/1000;
  if(!p.take(now,30))continue;
  if(lastDraw!==null)presentationSeconds+=(now-lastDraw)/1000;
  lastDraw=now;count++;
 }
 assert(count>=295&&count<=305,`${refresh}Hz presentation bounded near 30fps: ${count}`);
 assert(Math.abs(presentationSeconds-officialSeconds)<1/30,'Skipped callbacks preserve elapsed presentation time; official time advances independently');
}
const p=framePacer();assert(p.take(100,30));assert(!p.take(110,30));assert(!p.take(NaN));assert(p.take(150,30));assert(p.take(0,30),'rewind starts a new presentation period');p.reset();assert(p.take(1,30),'resume must draw immediately');
console.log('PASS: presentation-only pacing at 30/60/120Hz, elapsed clocks, invalid timestamps, rewind and resume.');
