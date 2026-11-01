import assert from 'node:assert/strict';
import {prepareGroundControlTrack} from '../../../src/escalacao/futebol3d/chibi/ground-control-track.mjs';
import {prepareActionRootPath} from '../../../src/escalacao/futebol3d/chibi/action-root-plan.mjs';
const ballAt=t=>({x:0,y:.11,z:1.2*t}),events=[{t:0,kind:'recebe',mira:0,bola:ballAt(0)},{t:1,kind:'toque',mira:0,bola:ballAt(1)}];
const sample=t=>({x:-.5-1.2*Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**2,z:1.2*t});
const path={sample,diagnostics:{}},controls=[{start:0,end:1}],options={ballAt,ownedAt:()=>true};
const before=JSON.stringify({events,controls}),p=prepareGroundControlTrack(path,events,controls,options);
assert(p.diagnostics.groundControlTracks.some(d=>d.applied),'A detached middle must be repaired');
assert.deepEqual(p.sample(0),sample(0));assert.deepEqual(p.sample(1),sample(1));
for(let i=0;i<=120;i++){const t=i/120,b=ballAt(t),r=p.sample(t);assert(Math.hypot(r.x-b.x,r.z-b.z)<=.85+.001);assert(r.x<-.15,'Do not cross through the ball');assert.deepEqual(ballAt(t),b)}
const velocity=(fn,t,h)=>{const a=fn(t-h),b=fn(t+h);return{x:(b.x-a.x)/(2*h),z:(b.z-a.z)/(2*h)}};
for(const t of [0,.5,1]){const h=1e-5,a=p.sample(t-h),b=p.sample(t),c=p.sample(t+h);assert(Math.hypot((b.x-a.x)/h-(c.x-b.x)/h,(b.z-a.z)/h-(c.z-b.z)/h)<.03,'C1 at impact, midpoint and release')}
assert.equal(JSON.stringify({events,controls}),before);
for(const overrides of [{ownedAt:t=>t<.4},{ballAt:t=>({...ballAt(t),y:1})},{breaks:[{before:.4,after:.42}]}]){const q=prepareGroundControlTrack(path,events,controls,{...options,...overrides});assert.deepEqual(q.sample(.5),sample(.5),'Do not invent a touch through loss, flight or placement')}
const input=[{kind:'recebe',nome:'controle_corrida',t:1,start:.76,mira:0,rec:{speed:8,heading:0},bola:ballAt(1)}];
const root=t=>({x:0,z:1.2*t-.5});
const adjusted=prepareActionRootPath(root,input,{ballAt,ownedAt:()=>true});
assert.equal(adjusted.diagnostics.receptionTangents.length,1);assert(Math.abs(adjusted.contacts[0].v.z-1.2)<1e-6,'Use post-touch ball speed instead of incoming 8m/s run');
assert.deepEqual(adjusted.sample(1),root(1),'Exact physical contact preserved');
assert.equal(prepareActionRootPath(root,input,{ballAt,ownedAt:()=>false}).diagnostics.receptionTangents.length,0);
console.log('PASS contact-constrained control, continuous velocity, no magnetic ball or fabricated ownership');
const {preparePossessionBodyPath}=await import('../../../src/escalacao/futebol3d/chibi/possession-body-path.mjs');
const running=t=>({x:0,z:8*t}),slowing=t=>({x:0,y:.11,z:8.45+3.5*(t-1)}),receive={kind:'recebe',t:1,bola:slowing(1),contact:{fitted:true}};
const owned=t=>({owner:t<1.5?'runner':'opponent',phase:'dominio',ball:slowing(t)});
const kept=preparePossessionBodyPath(running,owned,'runner',[receive],{duration:3,ballAt:slowing});
assert.deepEqual(kept.sample(1),running(1));
for(let t=1.12;t<1.4;t+=.01)assert(kept.sample(t).z<slowing(t).z-.12,'Receiver must not overtake the slowing ball');
const beforeLoss=kept.sample(1.49).z-running(1.49).z,afterLoss=kept.sample(1.51).z-running(1.51).z;
assert(Math.abs(afterLoss-beforeLoss)<.15,'Do not snap back to a tactical anchor on opponent acquisition');
assert(kept.sample(1.8).z-running(1.8).z<-.1,'Rejoin gradually after ownership changes');
assert.equal(owned(1.8).owner,'opponent');assert.deepEqual(slowing(1.8),{x:0,y:.11,z:11.25});
console.log('PASS slowing first touch keeps receiver on the same side; opponent ownership preserved with smooth recovery');

for(const decision of p.diagnostics.groundControlTracks.filter(d=>d.applied))assert(decision.after.behindSeconds<=decision.before.behindSeconds+.015,'Closing the gap must not increase running past the ball');

const fastSource=t=>({x:8*t,z:0}),fastBall=t=>({x:8.45+11*(t-1),y:.11,z:0}),fastFrame=t=>({owner:'runner',phase:'dominio',ball:fastBall(t)});
const chase=preparePossessionBodyPath(fastSource,fastFrame,'runner',[{kind:'recebe',t:1,bola:fastBall(1),contact:{fitted:true}}],{duration:3,ballAt:fastBall});
assert.deepEqual(chase.sample(1),fastSource(1),'Pursuit cannot move the impact root');
for(let i=67;i<120;i++){const a=chase.sample((i-1)/60),b=chase.sample(i/60);assert(Math.hypot(b.x-a.x,b.z-a.z)*60<=9.501,'Do not add an extra sprint to the source run')}
console.log('PASS bounded pursuit after contact, original impact root retained');

const resetChase=preparePossessionBodyPath(fastSource,t=>({...fastFrame(t),placementReset:Math.abs(t-1.5)<1e-7}),'runner',[{kind:'recebe',t:1,bola:fastBall(1),contact:{fitted:true}}],{duration:3,ballAt:fastBall});
assert.deepEqual(resetChase.sample(1.5),fastSource(1.5),'An official placement resets pursuit exactly, even while the source owner remains assigned');
