import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
function module(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({})});return exports}
const {clockMinute,dueClockCommand}=module('src/escalacao/copa-clock-preview.ts')
const {copaStats}=module('src/escalacao/copa-stats.ts')
const row={step:1,running:true,manual:false,started_at:new Date(0).toISOString(),updated_at:new Date(0).toISOString(),duration_ms:14000,extra_ms:700}
assert.equal(clockMinute(row,5740),47);assert.equal(clockMinute(row,20000),93);assert.equal(clockMinute(row,-100),0)
assert.equal(dueClockCommand(row,14699),null);assert.equal(dueClockCommand(row,14700),'finish')
assert.equal(dueClockCommand({...row,running:false,manual:true},20000),null)
assert.equal(dueClockCommand({...row,running:false},20000),'next')
assert.equal(dueClockCommand({...row,running:false,step:12},20000),null)
const ev=[{home:true,min:20,name:'Atacante',assist:'Meia'}]
const world={groups:[{matches:[[{h:0,a:1,ev}]]}],qf:[{h:0,a:1,ev1:ev,ev2:ev}],sf:[],final:{h:0,a:1,ev}}
assert.equal(copaStats(world,1,false).assists.length,0)
assert.equal(copaStats(world,1,true).assists[0].total,1)
assert.equal(copaStats(world,7,false).assists[0].total,1)
assert.equal(copaStats(world,7,true).assists[0].total,2)
const secondLeg=copaStats(world,8,true).assists
assert.equal(secondLeg.find(r=>r.team===1).total,1,'return-leg home mapping')
assert.equal(copaStats(world,11,false).assists.find(r=>r.team===0).total,2)
assert.equal(copaStats(world,11,true).assists.find(r=>r.team===0).total,3)
console.log('PASS: clock bounds, deadline, manual/auto, final stop, actual assists, completed-only stats and return-leg home mapping.')
