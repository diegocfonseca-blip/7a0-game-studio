import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import assert from 'node:assert/strict'
const exports={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/reveal-presentation.ts','utf8'),{compilerOptions:{module:1,target:9}}).outputText,{exports})
const {revealOffers:sort,revealIdentityVisible:visible}=exports
const bids=[{mgr:0,amount:30},{mgr:1,amount:90},{mgr:2,amount:70},{mgr:3,amount:70}]
const before=JSON.stringify(bids)
assert.deepEqual(Array.from(sort(bids,[1],3,false),x=>x.mgr),[2,3,0,1])
assert.deepEqual(Array.from(sort(bids,[1],3,true),x=>x.mgr),[3,2,0,1])
assert.equal(JSON.stringify(bids),before)
assert.equal(sort([],[],null,true).length,0)
assert.equal(visible(false,false,false),true)
assert.equal(visible(true,false,true),false)
assert.equal(visible(true,true,false),false)
assert.equal(visible(true,true,true),true)
console.log('PASS valid offers, resolved winner first, no mutation, surprise and no-sale guards')

