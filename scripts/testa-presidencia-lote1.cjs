const assert=require('node:assert/strict');
const path=require('node:path');
process.env.TEMP=process.env.TMP=path.resolve('test-results');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage();
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
  await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>window.allowPresident===true;'}));
  await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-entrada.html');
  const result=await page.evaluate(async()=>{
   const {reducer}=await import('/7a0-game-studio/src/escalacao/store.tsx');
   const flags=await import('/7a0-game-studio/src/escalacao/presidencia-lotes.ts');
   const state={careerOnline:true,onlineMode:'cpu',sport:'futebol',youIdx:0,managers:[{id:7,isHuman:true},{id:8,isHuman:false}],careerCoins:{7:100,8:999}};
   const before=JSON.stringify(state);
   window.allowPresident=true;
   const saved=reducer(state,{type:'PRESIDENCY_SAVE_BASE',mgrId:7,value:{version:5,name:'Diego',outfit:'terno'}});
   const blocked=['PRESIDENCY_TRADE','PRESIDENCY_DISPLAY','PRESIDENCY_ROOF'].every(type=>reducer(state,{type,mgrId:7,closed:true})===state);
   window.allowPresident=false;
   const unauthorized=reducer(state,{type:'PRESIDENCY_SAVE_BASE',mgrId:7,value:{version:5,name:'Diego',outfit:'terno'}})===state;
   return {economy:flags.PRESIDENCY_ECONOMY_RELEASED,roof:flags.PRESIDENCY_ROOF_RELEASED,name:saved.careerPresidentBase?.name,blocked,unauthorized,unchanged:JSON.stringify(state)===before,coins:saved.careerCoins};
  });
  assert.deepEqual(result,{economy:false,roof:false,name:'Diego',blocked:true,unauthorized:true,unchanged:true,coins:{7:100,8:999}});
  console.log('PASS lote 1: profile allowed with mocked private gate; economy/roof rejected by actual reducer; unauthorized save blocked; wallets unchanged. Offline test, not production authentication.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
