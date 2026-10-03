const{chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>true;export const usePresidentPreview=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-setup-integrado.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.setupState?.screen==='setup');
 await page.evaluate(()=>window.setupDispatch({type:'START_CAREER_SOLO',intro:true,teamName:'Persistencia QA',formation:'4-3-3',rivals:3,presidentBase:{version:5,name:'Diego QA',outfit:'polo'}}));
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('esc-solo-career')||'{}').careerPresidentBase?.name==='Diego QA');
 for(const id of ['fusca','mesa-simples']){
  await page.evaluate(async id=>{const{carteiraDaCarreira}=await import('/7a0-game-studio/src/escalacao/presidencia-carreira.ts');const{orcarPresidencia}=await import('/7a0-game-studio/src/escalacao/presidencia-economia.ts');const s=window.setupState,mgrId=s.managers[s.youIdx].id,q=orcarPresidencia(carteiraDaCarreira(s,mgrId),{kind:'buy',id});if(!q.ok)throw Error(q.error);window.setupDispatch({type:'PRESIDENCY_TRADE',mgrId,quote:q.value,confirmed:true});},id);
  await page.waitForFunction(id=>Object.values(JSON.parse(localStorage.getItem('esc-solo-career')||'{}').careerPresidency||{}).some(v=>v.owned.some(b=>b.id===id)),id);
 }
 await page.evaluate(()=>{const s=window.setupState;window.setupDispatch({type:'PRESIDENCY_DISPLAY',mgrId:s.managers[s.youIdx].id,display:['fusca',null]})});
 await page.waitForFunction(()=>Object.values(JSON.parse(localStorage.getItem('esc-solo-career')).careerPresidency)[0].display?.[0]==='fusca');
 const before=await page.evaluate(()=>{const s=window.setupState;return{seed:s.seed,base:s.careerPresidentBase,assets:s.careerPresidency,cash:s.careerCoins,ledger:s.careerLedger}});
 assert.equal(Object.values(before.cash)[0],60);
 assert.equal(before.base.sinceSeason,1); // Nova carreira registra posse, sem herdar data do rascunho.
 assert.equal(before.ledger.reduce((total,entry)=>total+entry.amount,0),60);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.setupDispatch);
 const reopened=await page.evaluate(async()=>{const{readActiveCareer,stashActiveBeforeNew,readCareerArchive}=await import('/7a0-game-studio/src/escalacao/store.tsx');const s=readActiveCareer()?.save;if(!s)throw Error('Missing active career');stashActiveBeforeNew();const archive=readCareerArchive().find(x=>x.save.seed===s.seed)?.save;return{seed:s.seed,base:s.careerPresidentBase,assets:s.careerPresidency,cash:s.careerCoins,ledger:s.careerLedger,archived:archive?.careerPresidency,cleared:localStorage.getItem('esc-solo-career')===null};});
 assert.deepEqual(reopened,{...before,archived:before.assets,cleared:true});
 await page.evaluate(()=>window.setupDispatch({type:'START_CAREER_SOLO',intro:true,teamName:'Nova QA',formation:'4-3-3',rivals:3}));
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('esc-solo-career')||'{}').managers?.[0]?.teamName==='Nova QA');
 assert.equal(await page.evaluate(()=>window.setupState.careerPresidentBase),undefined);assert.equal(await page.evaluate(()=>window.setupState.careerPresidency),undefined);
 console.log('PASS v80: provider autosaves avatar, two paid purchases and display without navigation; 100->60; reload and archive preserve private data; new career inherits neither avatar nor assets. Local isolated browser only, not cloud.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
