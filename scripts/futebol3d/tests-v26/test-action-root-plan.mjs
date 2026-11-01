import assert from 'node:assert/strict';import{prepareActionRootPath}from'../../../src/escalacao/futebol3d/chibi/action-root-plan.mjs';
// Regression: consecutive moving captures must not insert contradictory roots
// three milliseconds apart at the boundary between follow-through/preparation.
const t1=27.866666666666667,t2=28.45000000000027,p1={x:-3.5735,z:-11.4875},p2={x:-4.9662,z:-9.2094};
const source=t=>({x:p1.x+(p2.x-p1.x)*(t-t1)/(t2-t1),z:p1.z+(p2.z-p1.z)*(t-t1)/(t2-t1)});
const e=(t,start,nome)=>({t,start,nome,kind:'toque',mira:-1.425});const plan=prepareActionRootPath(source,[e(t1,27.626,'controle_corrida'),e(t2,28.17,'chute_corrida')]);
for(const t of[t1,t2]){const a=source(t),b=plan.sample(t);assert(Math.hypot(a.x-b.x,a.z-b.z)<1e-7)}
let previous=plan.sample(27.7),maximum=0;for(let t=27.701;t<28.6;t+=.001){const q=plan.sample(t),speed=Math.hypot(q.x-previous.x,q.z-previous.z)/.001;assert(Number.isFinite(speed));maximum=Math.max(maximum,speed);previous=q}assert(maximum<13,'No trajectory jump between captures');
const stopped=prepareActionRootPath(t=>({x:t,z:0}),[{t:2,start:1.7,nome:'passe',kind:'toque',mira:0}]);const a=stopped.sample(1.9),b=stopped.sample(2.04);assert(Math.hypot(a.x-b.x,a.z-b.z)<1e-7,'Standing capture stays planted');
const chase=t=>({x:t,z:t>2&&t<3?Math.sin((t-2)*Math.PI):0});
const loose=prepareActionRootPath(chase,[{t:1.5,start:1.2,nome:'controle_corrida',kind:'recebe',mira:0}],{controls:[{start:2,end:3,loose:true,recovery:.3}]});
assert(Math.abs(loose.sample(2.48).z-chase(2.48).z)<.01,'Do not erase the existing loose-ball chase between contacts');
console.log('PASS: contact anchors, trajectory continuity and standing support');

// A carrier turns between reception and the next pass. Sparse contact fitting
// must not replace that four-second curve with a chord that leaves him behind.
const carrying=t=>({x:8-2*t,z:-10+Math.sin(t*2)*1.8});
const dribble=prepareActionRootPath(carrying,[{t:1,start:.76,nome:'controle_corrida',kind:'recebe',mira:-1},{t:5,start:4.5,nome:'passe_chapa',kind:'toque',mira:1}]);
for(let t=1.5;t<3.9;t+=.02){const p=dribble.sample(t),q=carrying(t);assert(Math.hypot(p.x-q.x,p.z-q.z)<.01,'Preserve the carrier route between the actual preparation windows')}
console.log('PASS: preserve a curved dribbling path between reception and pass');

// A half-time reset moves the source from the corner to midfield. Do not draw
// a 50-metre recovery run through live play after the next kick-off.
const resetSource=t=>({x:t<2?50+t:t-2,z:0});
const restart=prepareActionRootPath(resetSource,[{t:1.95,start:1.55,nome:'chute',kind:'toque',mira:0}],{breaks:[{before:1.99,after:2}]});
assert(Math.abs(restart.sample(2.1).x-resetSource(2.1).x)<.5,'New placement starts on its own side of the discontinuity');
assert(restart.sample(1.98).x>50,'Never anticipate the new midfield placement while still at the corner');
assert.deepEqual(restart.sample(1.95),resetSource(1.95),'Restart isolation keeps the preceding exact impact');
console.log('PASS: no interpolated recovery across an authoritative placement reset');

const movingPass=prepareActionRootPath(t=>({x:0,z:t*3.4}),[{t:2,start:1.7,nome:'passe_movimento',kind:'toque',mira:0,variation:{locomotion:'continuous'}}]);
const p0=movingPass.sample(1.99),p1m=movingPass.sample(2.01);assert(Math.hypot(p1m.x-p0.x,p1m.z-p0.z)/.02>3,'Using a pass capture does not force a stop');

const takeAndThrow=prepareActionRootPath(t=>({x:0,z:(t-2)*2}),[{t:2,start:1.64,nome:'gk_recolhe',kind:'recebe',hands:true,pickup:true,movingPickup:true,mira:0},{t:2.4,start:2.04,nome:'lateral',kind:'toque',hands:true,mira:Math.PI}]);
assert.deepEqual(takeAndThrow.sample(2),{x:0,z:0});assert(Math.abs(takeAndThrow.sample(2.4).z-.8)<1e-9,'The collector may step behind the touchline before releasing; do not force the two hand contacts to the same root');

const aerialSource=t=>({x:5*t,z:0}),headers=prepareActionRootPath(aerialSource,[{t:5,start:3.87,nome:'cabeca',kind:'toque',cab:true,mira:0},{t:5.55,start:5.1,nome:'cabeca',kind:'toque',cab:true,mira:Math.PI}]);
for(const t of [5,5.55])assert.deepEqual(headers.sample(t),aerialSource(t),'Keep both exact header contacts');
for(let t=4.9;t<=5.7;t+=.002){const a=headers.sample(t),b=headers.sample(t+.002);assert(Math.hypot(b.x-a.x,b.z-a.z)/.002<5.01,'Consecutive headers must not force a stop and a superhuman rush between contacts')}
assert(headers.contacts.every(c=>c.headerFlow));
const noAerialBridge=prepareActionRootPath(aerialSource,[{t:2,start:.87,nome:'cabeca',kind:'toque',cab:true,mira:0},{t:2.55,start:2.1,nome:'cabeca',kind:'toque',cab:true,mira:0}],{breaks:[{before:2.2,after:2.22}]});
assert(noAerialBridge.contacts.every(c=>!c.headerFlow),'Never connect aerial contacts across a placement');

const receivedAt=43.7,strikeAt=44.15,from={x:-28.63998,z:26.78224},to={x:-30.68209,z:27.71348},travel=t=>({x:from.x+(to.x-from.x)*(t-receivedAt)/(strikeAt-receivedAt),z:from.z+(to.z-from.z)*(t-receivedAt)/(strikeAt-receivedAt)});
const receiveThenCross=prepareActionRootPath(travel,[{t:receivedAt,start:43.46,nome:'controle_corrida',kind:'recebe',mira:-3.075,rec:{speed:8.146,heading:-.8696}},{t:strikeAt,start:43.8,nome:'chute',kind:'toque',mira:-3.075}]);
let rush=0;for(let t=receivedAt;t<strikeAt;t+=.001){const a=receiveThenCross.sample(t),b=receiveThenCross.sample(t+.001);rush=Math.max(rush,Math.hypot(b.x-a.x,b.z-a.z)/.001)}
assert(rush<10,'A receiver retains his incoming run before planting for a cross, instead of moving toward the outgoing ball direction');
for(const t of [receivedAt,strikeAt])assert(Math.hypot(receiveThenCross.sample(t).x-travel(t).x,receiveThenCross.sample(t).z-travel(t).z)<1e-9);

// A defender bends his run to press before a later touch. The old sparse
// fit shortcut the bend and inserted an unnecessary sprint on the return.
const press=t=>({x:7*t,z:2*Math.sin(t*2)}),freeApproach=prepareActionRootPath(press,[{t:5,start:4.6,nome:'passe_movimento',kind:'toque',mira:Math.atan2(7,4*Math.cos(10)),variation:{locomotion:'continuous',contactSpeed:Math.hypot(7,4*Math.cos(10))}}]);
for(let t=2.1;t<3.9;t+=.013){
 const p=freeApproach.sample(t),q=press(t),next=freeApproach.sample(t+.001);
 assert(Math.hypot(p.x-q.x,p.z-q.z)<.01,'Keep the off-ball pressure route outside captured action windows');
 assert(Math.hypot(next.x-p.x,next.z-p.z)/.001<8.2,'A future planted impact must not create an off-ball sprint');
}
assert.deepEqual(freeApproach.sample(5),press(5),'Preserve the exact scheduled contact');
console.log('PASS: retain curved off-ball runs without a shortcut to a future action');

const earlyRoute=t=>({x:t,z:t>1?Math.sin(Math.min(.4,t-1)*5)*.4:0}),earlyReceive={t:1,start:.76,nome:'controle_corrida',kind:'recebe',mira:Math.PI,bola:{y:.11}};
const recoverControl=prepareActionRootPath(earlyRoute,[earlyReceive]);
assert.deepEqual(recoverControl.sample(1),earlyRoute(1),'Keep the physical first touch');
for(let t=1.12;t<1.36;t+=.02){const p=recoverControl.sample(t),q=earlyRoute(t);assert(Math.hypot(p.x-q.x,p.z-q.z)<.015,'Do not erase early post-reception pursuit with a sparse action chord')}
console.log('PASS: preserve the early control-recovery route after the protected impact');
const fittedReceive={t:1,start:.76,nome:'controle_corrida',kind:'recebe',mira:0,rec:{speed:8,heading:Math.PI}},fittedPass={t:2.15,start:1.8,nome:'passe_movimento',kind:'toque',mira:0,variation:{locomotion:'continuous',contactSpeed:3.4}};
const fittedPath=prepareActionRootPath(t=>({x:0,z:t*3.4}),[fittedReceive,fittedPass],{controls:[{start:1,end:2.15,from:{x:0,z:3.4},to:{x:0,z:7.31}}]});
assert.deepEqual(fittedPath.contacts[0].v,{x:0,z:3.4},'Keep the tangent of an already fitted two-contact control');

const pushRoute=t=>({x:t*4,z:t>1.5?Math.sin((t-1.5)*5)*.45:0});
const verifiedCarry={t:1.5,start:1.32,nome:'controle_corrida',kind:'carry',verifiedGroundTouch:{t:1.5},mira:0,bola:{y:.11},rec:{speed:4,heading:Math.PI/2}};
const pushPath=prepareActionRootPath(pushRoute,[{...earlyReceive,t:1,start:.76},verifiedCarry]);
assert.deepEqual(pushPath.sample(1.5),pushRoute(1.5),'Intermediate verified push remains an exact root contact');
for(let t=1.62;t<1.88;t+=.02){const p=pushPath.sample(t),q=pushRoute(t);assert(Math.hypot(p.x-q.x,p.z-q.z)<.015,'A new dribbling contact must not erase the subsequent pursuit/turn');}
console.log('PASS: verified intermediate pushes retain the following carrying path');
