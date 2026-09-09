import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import assert from 'node:assert/strict';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/online-penalties.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const reachable=new Set();for(let mask=0;mask<1024;mask++){const s=[0,0],t=[0,0];for(let i=0;i<10;i++){const side=i%2;t[side]++;if(mask&(1<<i))s[side]++;if(s[0]>s[1]+5-t[1]||s[1]>s[0]+5-t[0])break;}if(s[0]!==s[1])reachable.add(s.join(':'));}
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)if(a!==b&&reachable.has(a+':'+b)){
 const r=exports.exactPenaltyRows([a,b],[[],[]]);assert.equal(r[0].filter(k=>k.ok).length,a);assert.equal(r[1].filter(k=>k.ok).length,b);
 const seq=r.flat().sort((a,b)=>a.at-b.at),score=[0,0],taken=[0,0];
 seq.forEach((k,i)=>{const side=i%2;taken[side]++;if(k.ok)score[side]++;const decided=score[0]>score[1]+5-taken[1]||score[1]>score[0]+5-taken[0];if(i<seq.length-1)assert.equal(decided,false,'cannot continue after decision')});
 assert.ok(seq.length<=10);
}
assert.equal(exports.exactPenaltyRows([5,2],[[],[]]).flat().length,0,'impossible historic total uses result-only fallback');
console.log('PASS: all '+reachable.size+' reachable totals, no extra kicks after decision, official score preserved; impossible historical total falls back to summary.');
