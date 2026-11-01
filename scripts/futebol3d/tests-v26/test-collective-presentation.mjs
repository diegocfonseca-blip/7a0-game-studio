import assert from 'node:assert/strict';
import {collectivePresentation} from '../../../src/escalacao/futebol3d/chibi/collective-presentation.mjs';
const owner = {key:'owner',side:'home',mx:0,mz:0};
const defender = {key:'defender',side:'away',mx:5,mz:0,tacticalRole:'pressiona'};
function run({shown=3,defenderX=5,ballX=shown,role='pressiona',markingTarget,side='away',keeper=false,phase='jogo',dt=0,previous=new Map()}={}) {
 const frame={owner:'owner',phase,ball:{x:ballX,z:0},players:[owner,{...defender,tacticalRole:role,markingTarget,side,keeper}]};
 const world=new Map([['owner',{x:shown,z:0}],['defender',{x:defenderX,z:0}]]);
 const before=JSON.stringify([frame,[...world],[...previous]]);
 const result=collectivePresentation(frame,world,previous,dt);
 assert.equal(JSON.stringify([frame,[...world],[...previous]]),before,'Never mutate official input or previous frame');
 return result;
}
assert(run().offsets.get('defender').x<0,'Pressure approaches the visible carrier');
assert(run({shown:4.5}).offsets.get('defender').x>0,'Too-close carrier requires stand-off, not translation into him');
assert.equal(run({shown:0}).offsets.get('defender').x,0,'No visual discrepancy means no new tactical movement');
assert.equal(run({role:'marca'}).offsets.get('defender').x,0,'Missing marking target must not invent one');
assert(run({role:'marca',markingTarget:'owner'}).offsets.get('defender').x<0);
assert(run({role:'opcao',side:'home'}).offsets.get('defender').x>0,'Support follows the displayed carrier partially');
assert.equal(run({role:'marca',markingTarget:'owner',side:'home'}).offsets.get('defender').x,0,'Never mark a teammate');
assert.equal(run({keeper:true}).offsets.get('defender').x,0,'Do not override goalkeeper positioning');
assert.equal(run({phase:'falta'}).offsets.get('defender').x,0,'No correction of set-piece arrangement');
assert.equal(run({shown:0,ballX:3}).diagnostics.looseBallPressure,1,'Distant possession follows loose ball, not assigned owner');
let previous=new Map();for(let i=0;i<100;i++){
 const result=run({dt:1/60,previous}),next=result.offsets.get('defender'),old=previous.get('defender')??{x:0,z:0};
 assert(Math.hypot(next.x-old.x,next.z-old.z)<=2/60+1e-10,'No correction faster than 2m/s');
 assert(Math.hypot(next.x,next.z)<=.8+1e-10,'Remain inside presentation budget');previous=result.offsets;
}
for(let i=0;i<120;i++)previous=run({dt:1/60,previous,role:'forma'}).offsets;
assert(Math.abs(previous.get('defender').x)<.001,'Return smoothly to canonical formation after role loss');
console.log('PASS: target-relative pressure, stand-off, explicit marking, loose balls, dead balls, bounded smoothing and read-only inputs');
