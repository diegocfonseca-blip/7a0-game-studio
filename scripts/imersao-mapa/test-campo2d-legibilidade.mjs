import assert from 'node:assert/strict'
import {escolherRotulosCampo2D} from '../../src/escalacao/presidencia-campo2d-legibilidade.ts'
const label=(key,x,y,priority=0)=>({key,x,y,priority,halfWidth:.12,halfHeight:.025})
const source=[label('owner',0,0,-100),label('other',.1,0),label('legend',-.5,-.3,-25),label('offscreen',1.2,.2,-200),label('score',0,.65,-200)]
const frozen=JSON.stringify(source),picked=escolherRotulosCampo2D(source,new Set())
assert.deepEqual([...picked],['owner','legend']);assert.equal(JSON.stringify(source),frozen,'No player or input movement')
assert(!escolherRotulosCampo2D(source,new Set(),4,[label('ball',0,0)]).has('owner'),'A name cannot cover the ball')
assert(escolherRotulosCampo2D([label('owner',0,0)],new Set(),4,[label('owner',0,0)]).has('owner'),'An icon may label itself')
assert.equal(escolherRotulosCampo2D([label('old',.01,0,2),label('new',0,0,0)],new Set(['old'])).values().next().value,'old','Small priority changes must not flicker labels')
const many=Array.from({length:100},(_,i)=>label(String(i),-.8+(i%5)*.38,-.7+Math.floor(i/5)*.12,i))
assert(escolherRotulosCampo2D(many,new Set()).size<=4)
assert.equal(escolherRotulosCampo2D([{...label('invalid',0,0),x:NaN}],new Set()).size,0)
console.log('PASS score/edge bounds, overlap, ball clearance, owner priority, stable labels and no position mutation')
