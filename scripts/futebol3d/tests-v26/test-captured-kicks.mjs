import assert from 'node:assert/strict';
import {selectMapKick} from '../../../src/escalacao/futebol3d/chibi/contextual-kick-selection.mjs';
import {planCapturedKickTiming,planMovingPickupTiming,capturedActionTime} from '../../../src/escalacao/futebol3d/chibi/captured-kick-timing.mjs';
const make=(tipo,d)=>({tipo,delivery:d});
const strong=make('chute',{family:'shot',technique:'bomba',powerBand:'strong',heightBand:'low',trajectory:'ground',horizontalSpeed:31});
const placed=make('chute',{...strong.delivery,technique:'colocado',powerBand:'firm',horizontalSpeed:23,curve:'source',curveRate:.6});
assert.equal(selectMapKick(strong,{moving:true,availablePreparation:.9}).clip,'chute_forte','Movement must not erase the loaded strike');
assert.equal(selectMapKick(strong,{quick:true,moving:true}).clip,'chute_corrida','A first-time running strike must not require a standing windup');
assert.equal(selectMapKick(placed,{moving:true,availablePreparation:.8}).clip,'passe_chapa','Use the existing inside-foot capture for a placed strike');
assert.equal(selectMapKick(placed).curveRate,.6);
assert.equal(selectMapKick({...strong,delivery:{...strong.delivery,heightBand:'high',trajectory:'air'}}).style,'high-shot');
assert.equal(selectMapKick({...strong,delivery:{...strong.delivery,technique:'cobertura'}}).clip,'cavadinha');
const long=make('inversao',{family:'switch',powerBand:'firm',distanceBand:'long',trajectory:'ground',horizontalSpeed:23});
assert.equal(selectMapKick(long).clip,'passe_chapa');
const loft=make('lancamento',{family:'long',trajectory:'air',verticalSpeed:11,horizontalSpeed:17,launchAngleDegrees:33,powerBand:'firm'});
assert.equal(selectMapKick(loft).clip,'cavadinha');
assert.equal(selectMapKick({...loft,delivery:{...loft.delivery,horizontalSpeed:29,launchAngleDegrees:22,powerBand:'strong'}}).clip,'chute_forte');
const before=JSON.stringify([strong,placed,long,loft]);
for(const cue of [strong,placed,long,loft])assert.deepEqual(selectMapKick({...cue,outcome:'goal'}),selectMapKick({...cue,outcome:'wide'}));
assert.equal(JSON.stringify([strong,placed,long,loft]),before,'Presentation cannot mutate official delivery');
for(const available of [.05,.15,.30,.65,1.5])for(const [name,raw,begin,end]of [['chute_forte',2.583333333,1.55,3.4],['passe_chapa',1.4167,.85,2.1],['chute_corrida',5/12,0,1.3]]){
 const cue={...strong,nome:name,t:5,variation:selectMapKick(strong)},plan=planCapturedKickTiming(cue,{raw,begin,end,earliestStart:5-available});
 const action={...plan,base:plan.clipStart,dur:plan.duration};
 assert(Math.abs(plan.start+plan.touch-5)<1e-10);
 assert(Math.abs(capturedActionTime(action,plan.touch)-raw)<1e-10,'Retiming must preserve the calibrated impact pose');
 assert(plan.start>=5-available-1e-10);
 let last=-Infinity;for(let i=0;i<=500;i++){const t=plan.duration*i/500,x=capturedActionTime(action,t);assert(x>=last-1e-9,'No backward animation time');last=x}
 const h=1e-7,left=(raw-capturedActionTime(action,plan.touch-h))/h,right=(capturedActionTime(action,plan.touch+h)-raw)/h;
 assert(Math.abs(left-right)<1e-4,'No animation-speed snap at impact');
 assert(Math.abs(capturedActionTime(action,plan.duration)-plan.clipEnd)<1e-10);
}
console.log('PASS: independent height/power/curve, moving power and placed strikes, first-time fallback, immutable official input, exact contact pose, continuous monotone timing');

assert.equal(selectMapKick({tipo:'passe',delivery:{family:'pass',distanceBand:'short',trajectory:'ground'}},{moving:true,availablePreparation:.516}).clip,'passe_movimento','A moving receiver uses the real side-foot pass without a stationary root');

const shortGround=make('passe',{family:'pass',trajectory:'ground',distanceBand:'short',powerBand:'soft',horizontalSpeed:13});
const sideFoot=selectMapKick(shortGround,{moving:true,availablePreparation:.5});
assert.equal(sideFoot.clip,'passe_movimento');assert.equal(sideFoot.locomotion,'continuous');
const shortTiming=planCapturedKickTiming({...shortGround,nome:sideFoot.clip,variation:sideFoot,t:2},{raw:1.4167,begin:.85,end:2.1});
assert(shortTiming.clipEnd-1.4167<.20,'A soft short pass must not play the long shot follow-through');
assert(1.4167-shortTiming.clipStart<.25,'A short pass has a compact backswing');
assert.equal(selectMapKick({...shortGround,tipo:'chute',delivery:{...shortGround.delivery,family:'shot'}}).clip,'chute','Do not erase shot variety');

assert.equal(selectMapKick(shortGround,{moving:true,availablePreparation:2,actorSpeed:2.2}).contactSpeed,2.2,'Retain a slower moving pass, rather than force a stationary wind-up');
assert.equal(selectMapKick(shortGround,{moving:true,availablePreparation:2}).clip,'passe_movimento');
assert.equal(selectMapKick({...long,delivery:{...long.delivery,powerBand:'strong'}},{moving:true,availablePreparation:2}).clip,'chute_forte','A prepared long driven pass can still use a full strike');

const pickup=planMovingPickupTiming({t:57.55},{raw:.75,end:1.5,earliestStart:55});
assert(Math.abs(capturedActionTime({...pickup,base:pickup.clipStart,dur:pickup.duration},pickup.touch)-.75)<1e-10);
assert.equal(pickup.touch,.36,'A moving retrieval does not plant the runner for the original idle lead-in');
