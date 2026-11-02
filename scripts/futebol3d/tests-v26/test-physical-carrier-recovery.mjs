import assert from 'node:assert/strict';
import {preparePossessionBodyPath} from '../../../src/escalacao/futebol3d/chibi/possession-body-path.mjs';
const source=t=>({x:t<1.3?2*t:2.6+8*(t-1.3),z:0});
const ball=t=>({x:2.45+2*(t-1),y:.11,z:0});
const sample=t=>({owner:t<1.3?'runner':t<1.9?null:'opponent',phase:'dominio',ball:ball(t)});
const receive={key:'runner',kind:'recebe',t:1,bola:ball(1),contact:{fitted:true}},opponent={key:'opponent',kind:'recebe',t:2.1,bola:ball(2.1)};
const options={duration:4,ballAt:ball,physicalContacts:[receive,opponent],looseBudget:6};
const before=JSON.stringify([receive,opponent,Array.from({length:241},(_,i)=>sample(i/60))]);
const path=preparePossessionBodyPath(source,sample,'runner',[receive],options);
assert.deepEqual(path.sample(1),source(1),'The measured reception stays fixed');
assert(path.recoveryAt(2),'An anticipated opponent owner must not cancel loose-ball pursuit');
assert.equal(path.recoveryAt(2.1),undefined,'Stop pursuit at the actual opponent contact');
assert.equal(path.pursuits[0].reason,'physical-contact');
for(let i=96;i<125;i++){
 const t=i/60,p=path.sample(t),b=ball(t);assert(b.x>=p.x-.05,'A tactical anchor must not drag the runner past his loose ball');assert(Math.hypot(p.x-b.x,p.z-b.z)<.9,'Stay with the actually rolling ball');
}
for(let i=80;i<150;i++){const a=path.sample((i-1)/60),b=path.sample(i/60);assert(Math.hypot(b.x-a.x,b.z-a.z)*60<=9.501,'No recovery/return teleport or added sprint')}
assert.equal(JSON.stringify([receive,opponent,Array.from({length:241},(_,i)=>sample(i/60))]),before,'Do not mutate ball, events or official owner');
const restarted=preparePossessionBodyPath(source,t=>({...sample(t),phase:t>=1.5?'falta':'dominio'}),'runner',[receive],options);assert.equal(restarted.recoveryAt(1.6),undefined);
const released=preparePossessionBodyPath(source,sample,'runner',[receive,{key:'runner',kind:'toque',t:1.2,bola:ball(1.2)}],options);assert.equal(released.pursuits.length,0,'A pass must not become a loose-ball chase');
const missed=preparePossessionBodyPath(source,t=>({...sample(t),owner:'opponent'}),'runner',[receive],options);assert.equal(missed.pursuits.length,0,'No invented acquisition on a missed pass');
console.log('PASS actual-contact recovery, world-space pursuit, bounded return, unchanged official possession and restart/release/missed-pass guards');

const ignored=preparePossessionBodyPath(source,sample,'runner',[receive],{...options,physicalContacts:[receive,{...opponent,t:1.6,disabled:true},opponent]});assert(ignored.recoveryAt(2),'A rejected contact cannot transfer responsibility');
console.log('PASS ignored unexecuted opponent contacts');
const lateOpponent={...opponent,t:2.8},late=preparePossessionBodyPath(source,sample,'runner',[receive],{...options,physicalContacts:[receive,lateOpponent],looseBudget:10});
assert(late.recoveryAt(2.65),'The old 1.25s timeout must not make a carrier abandon a ball before its recorded next contact');
assert.equal(late.recoveryAt(2.8),undefined);
console.log('PASS recovery continues to the recorded contact rather than expiring on a fixed timer');
