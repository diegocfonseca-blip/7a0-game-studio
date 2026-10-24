import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {locomotionWeights,gaitCurve} from '../../src/escalacao/futebol3d/motion/locomotion-sampling.mjs';
let old;
for(let i=0;i<=1400;i++){const weights=locomotionWeights(i/100);assert.ok(Object.values(weights).every(v=>v>=0&&v<=1));assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)<1e-12);if(old)assert.ok(Math.max(...Object.keys(weights).map(k=>Math.abs(weights[k]-old[k])))<.025);old=weights;}
const {gait}=JSON.parse(await readFile('src/escalacao/futebol3d/cartoon/motion.json'));
for(const [name,cal]of Object.entries(gait)){const curve=gaitCurve(cal);assert.ok(curve.length>0);assert.ok(Math.abs(curve.phase(0)-cal.phaseOffset)<1e-9);assert.ok(Math.abs(curve.phase(1)-curve.phase(0))<1e-9);let previous=curve.phase(0),unwrapped=previous;for(let i=1;i<=3000;i++){const now=curve.phase(i/1000),delta=(now-previous+1)%1;assert.ok(delta>0&&delta<.01,'Continuous forward capture clock');unwrapped+=delta;previous=now;}assert.ok(Math.abs(unwrapped-curve.phase(0)-3)<1e-8);console.log(name,{measuredCycleDistance:curve.length,phaseOffset:curve.phase(0)})}
console.log('Blending contínuo e amostragem dos clipes por distância: OK');
