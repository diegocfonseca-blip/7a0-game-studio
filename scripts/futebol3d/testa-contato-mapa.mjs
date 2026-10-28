import assert from 'node:assert/strict';
import * as T from 'three';
import {bootContact,advanceApproach,approachTarget} from '../../src/escalacao/futebol3d/motion/map-contact.mjs';
const feet=[new T.Vector3(0,.06,0),new T.Vector3(.3,.06,0)];
for(const d of [.5,.77,.91,1.38,3])assert.equal(bootContact({x:0,y:.11,z:d},feet).contact,false,'A distant ball cannot become a touch');
assert.equal(bootContact({x:0,y:.11,z:.17},feet).contact,true);
assert.equal(bootContact({x:0,y:1,z:.05},feet).contact,false,'Height is part of reach');
const sweep=bootContact({x:.4,y:.11,z:0},feet,{ball:{x:-.4,y:.11,z:0},feet});assert.equal(sweep.contact,true);assert.equal(sweep.swept,true,'A fast pass can cross the boot between frames');
let current={x:0,z:0};for(let i=0;i<120;i++){const next=advanceApproach(current,{x:4,z:3},1/60);assert(Math.hypot(next.x-current.x,next.z-current.z)<=2.4/60+1e-9);assert(Math.hypot(next.x,next.z)<=1.35+1e-9);current=next}
assert.deepEqual(advanceApproach(current,{x:0,z:0},0),current,'Pause cannot move a root');
const plan={t:2,bola:{x:4,y:.11,z:3},rec:{x:3.6,z:3}},contact={off:{x:0,y:.06,z:.4}},saved=structuredClone(plan);
const target=approachTarget(plan,contact,Math.PI/2,2);assert(Math.hypot(target.x,target.z)<1e-8);assert.deepEqual(plan,saved,'Planning must not change the official ball');
console.log('PASS: distant/airborne ball, swept contact, bounded approach, pause and immutable input');
