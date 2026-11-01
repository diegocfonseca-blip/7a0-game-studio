import assert from 'node:assert/strict';import{secondaryFootballAction as select}from'../../../src/escalacao/futebol3d/chibi/secondary-football-action.mjs';
const event={tipo:'carrinho',t:35.45,a:'Armando Obispo'},snapshot=JSON.stringify(event);
assert.equal(select(event,{capture:{id:'receive',t:35.4666667}}).clip,null,'Never replace a reception at its exact ball contact');
assert.equal(select(event,{plannedAction:'receive'}).clip,null,'Protect a planned action across delayed event dispatch');
assert.equal(select(event).clip,'carrinho','Retain the existing tackle when it does not interrupt a contact');
assert.equal(select({tipo:'drible'}).clip,null);assert.equal(JSON.stringify(event),snapshot);
console.log('PASS: source tackles cannot steal a calibrated capture; unprotected existing tackles preserved');
