import assert from 'node:assert/strict';
import {defensiveContacts} from '../../../src/escalacao/futebol3d/chibi/defensive-contacts.mjs';
const actors=[{key:'h',name:'Alex',side:'home'},{key:'a',name:'Alex',side:'away'},{key:'v',name:'Beto',side:'away'}],event={tipo:'desarme',t:2,lado:0,a:'Alex',b:'Beto'};
const sample=(t,key)=>({owner:null,phase:'dominio',ball:{x:1,y:.11,z:0},player:key?{x:.5,z:0,speed:2}:undefined});
const original=JSON.stringify({actors,event}),loose=defensiveContacts([], [event], actors,sample);
assert.equal(loose.agenda.length,1);assert.equal(loose.agenda[0].key,'h','Match the actual side, not just the shared legend name');assert.equal(loose.agenda[0].victimKey,'v');assert.equal(loose.agenda[0].t,2);assert.equal(loose.agenda[0].kind,'toque');assert.equal(loose.planned[0].loose,true);assert.equal(sample(2).owner,null,'A poke is not an invented successful acquisition');
const cue={id:'receive',kind:'recebe',key:'h',t:2.02},input=JSON.stringify(cue),won=defensiveContacts([cue],[event],actors,(t,key)=>({...sample(t,key),owner:'h'}));
assert.equal(won.agenda.length,1,'The same tackle and its ownership edge must not create duplicate contacts');assert.equal(won.agenda[0].kind,'recebe');assert.equal(won.agenda[0].t,event.t);assert.equal(JSON.stringify(cue),input);assert.equal(JSON.stringify({actors,event}),original);
assert.equal(defensiveContacts([], [{...event,tipo:'chutao'}],actors,sample).agenda.length,0,'Do not invent a steal for a clearance or failed control');
assert.equal(defensiveContacts([], [event],actors,(t,k)=>({...sample(t,k),ball:{x:1,y:1.2,z:0}})).skipped.length,1,'No foot tackle on an airborne ball');
console.log('PASS source standing tackles have physical contacts, loose stays loose, duplicate reception merged, side identity/source immutable');

const duplicate=[...actors,{key:'h2',name:'Alex',side:'home'}];
assert.equal(defensiveContacts([], [event],duplicate,sample).skipped[0].reason,'actor-unresolved','Never assign a loose tackle to an arbitrary same-name player');
assert.equal(defensiveContacts([], [event],duplicate,(t,k)=>({...sample(t,k),owner:'h2'})).planned[0].key,'h2','Resolve duplicate names through the actual source owner');
