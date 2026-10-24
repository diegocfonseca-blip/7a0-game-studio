import assert from 'node:assert/strict';
import * as T from 'three';
import {createBallControl} from '../../src/escalacao/futebol3d/motion/ball-control.mjs';
import {FootballActionController} from '../../src/escalacao/futebol3d/football-action-controller.mjs';

function actor(){const holder=new T.Group(),bones=new Map();for(const name of ['thigh_l','calf_l','foot_l','thigh_r','calf_r','foot_r']){const bone=new T.Bone();holder.add(bone);bones.set(name,bone)}return{holder,bones,footTriangles(side){const x=side==='left'?-.05:.05,base=holder.position;return[new T.Triangle(new T.Vector3(x,.002,0).add(base),new T.Vector3(x+.01,.002,.05).add(base),new T.Vector3(x-.01,.002,.05).add(base))]}}}
const p={key:'receiver',mx:0,mz:0,speed:3,keeper:false},frame={time:0,owner:p.key,phase:'dominio',ball:{x:0,y:.11,z:.75},officialAction:{receiver:p.key}},before=JSON.stringify(frame),a=actor(),control=createBallControl(a);
control.apply(frame,p);a.holder.position.set(0,0,0);const owned=control.apply({...frame,time:.1},p);
assert.equal(owned.kind,'carrying');assert.equal(owned.bodyLead,.45,'after arrival, ownership must use carrying reach, not the smaller anticipation limit');assert.equal(JSON.stringify(frame),before);
const stale=createBallControl(actor());assert.equal(stale.apply({...frame,owner:'interceptor'},p),null,'old receiver must not follow an opponent-controlled ball');
const incomingActor=actor(),incoming=createBallControl(incomingActor);incoming.apply({...frame,phase:'passe',owner:'passer'},p);incomingActor.holder.position.set(0,0,0);assert.equal(incoming.apply({...frame,time:.1,phase:'passe',owner:'passer'},p).bodyLead,.25);
for(const phase of ['lancamento','cruzamento']){const a=actor(),c=createBallControl(a);c.apply({...frame,phase,owner:'passer'},p);a.holder.position.set(0,0,0);assert.equal(c.apply({...frame,time:.1,phase,owner:'passer'},p).bodyLead,.25,'The real receiver also anticipates low arriving long balls');const high=createBallControl(actor());assert.equal(high.apply({...frame,phase,owner:'passer',ball:{...frame.ball,y:1.2}},p),null,'No foot control of an unreachable high ball');}
const plan={key:'receiver',time:1,start:.4,end:1.7,direction:[0,0,-1],entrySeconds:.5,exitSeconds:.5},controller=new FootballActionController([plan]);
assert.equal(controller.prepare({},p.key,.3,0,7),0,'forward run must not face backwards before captured entry');assert.ok(Math.abs(controller.prepare({},p.key,.41,0,7))<.02);assert.equal(Math.abs(controller.prepare({},p.key,1,0,7)),Math.PI,'contact retains the required pass orientation');assert.equal(controller.prepare({},p.key,1.7,0,7),0);
console.log('PASS reception→carrying reach, stale receiver excluded, real incoming anticipation retained, gait facing before entry and full pass orientation at contact; source unchanged.');
