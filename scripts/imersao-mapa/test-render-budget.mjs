import assert from 'node:assert/strict';import {renderBudget} from '../../src/escalacao/cidade3d/render-budget.mjs';
function feed(b,start,step,duration,ratio){let t=start,changes=[];for(;t<start+duration;t+=step){const v=b.observe(t,ratio);if(v!==null)changes.push({at:t,scale:v})}return{t,changes}}
let b=renderBudget();assert.equal(feed(b,0,1000/30,25000,2.5).changes.length,0,'Native 30Hz must retain full quality');
b=renderBudget();const slow=feed(b,0,70,15000,2.5);assert(slow.changes.length>0);assert.equal(b.scale(),.5,'Mobile floor must retain 1.25 physical pixels per CSS pixel');
const held=b.scale();assert.equal(b.observe(slow.t+20000,2.5),null,'Hidden tab interval cannot downgrade');assert.equal(b.scale(),held);
const recovery=feed(b,slow.t+20000+16,16,18000,2.5);assert(recovery.changes.length>0&&b.scale()>held&&b.scale()<1,'Recovery must be slow');
b=renderBudget();feed(b,0,16,7000,2.5);const current=b.scale();b.observe(7600,2.5);assert.equal(b.scale(),current,'One stall cannot change quality');
b=renderBudget();feed(b,0,90,20000,1);assert.equal(b.scale(),1,'Never reduce a native 1x buffer');
assert.equal(b.observe(NaN,2),null);console.log('PASS: sustained-load response, 30Hz stability, hidden-tab reset, slow recovery and native-resolution floor.');
// Mobile can trade resolution for responsiveness instead of remaining stuck
// at 1.25x. Intentional wide-map cadence is not an overloaded 60Hz renderer.
b=renderBudget({minPixelRatio:.8});for(let t=0;t<20000;t+=90)b.observe(t,1.5,20);assert(Math.abs(b.scale()*1.5-.8)<1e-8);
b=renderBudget({minPixelRatio:.8});for(let t=0;t<25000;t+=50)b.observe(t,1.5,20);assert.equal(b.scale(),1,'An intentional 20Hz map must keep its quality');
console.log('PASS mobile floor and cadence-aware graphics budget');
