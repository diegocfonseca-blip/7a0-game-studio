const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',base=origin+'/7a0-game-studio/',output='test-results/futebol-3d';
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
(async()=>{
 fs.mkdirSync(output,{recursive:true});const{chancesDoJogo,sementeDasChances}=await import('../src/escalacao/chances.ts');
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={cases:[],errors:[]};
 let page;
 try{
  const context=await browser.newContext({viewport:{width:1000,height:900},locale:'pt-BR'});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.qaAllow!==false;export const presidentPreviewEnabled=()=>window.qaAllow!==false;export const presidentWritesEnabled=()=>window.qaAllow!==false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  // The motor is already imported by the initial module graph. Delay only the
  // dynamic import promise used by LiveScoreCard, simulating a pending chunk.
  // The original generation guards and all production callbacks stay intact.
  await context.addInitScript(()=>{window.qaWaitPlanner=()=>{window.qaPendingPlanner=(window.qaPendingPlanner??0)+1;return new Promise(resolve=>(window.qaPlannerReleases??=[]).push(resolve))};});
  await context.route('**/src/escalacao/pyramidseason.tsx*',async route=>{
   const response=await route.fetch(),source=await response.text();let replacements=0;
   const body=source.replace(/import\((["'])([^"']*presidencia-futebol-motor(?:\.ts)?(?:\?[^"']*)?)\1\)/g,match=>{replacements++;return '(window.qaHoldPlanner?window.qaWaitPlanner().then(()=>'+match+'):'+match+')';});
   assert.ok(replacements>=2,'the real goal and chance planner imports are instrumented');await route.fulfill({response,body,contentType:'text/javascript'});
  });
  // Observe real private playback starts, impacts and cancellation without
  // substituting its clock or callbacks. Public timers remain untouched.
  await context.route('**/src/escalacao/presidencia-lance-apresentacao.ts*',async route=>{
   const response=await route.fetch(),source=await response.text();assert.ok(source.includes('export function acompanharLance('));
   const body=source.replace('export function acompanharLance(','function qaOriginalAcompanharLance(')+
    '\nexport function acompanharLance(options){const record={allowed:window.qaAllow!==false,started:performance.now(),impacts:[],ends:[],cancelled:false};(window.qaPlaybackCalls??=[]).push(record);const cancel=qaOriginalAcompanharLance({...options,onImpact:()=>{record.impacts.push({allowed:window.qaAllow!==false,at:performance.now()});options.onImpact?.()},onEnd:()=>{record.ends.push({allowed:window.qaAllow!==false,at:performance.now()});options.onEnd()}});return()=>{record.cancelled=true;cancel()};}\n';
   await route.fulfill({response,body,contentType:'text/javascript'});
  });
  const open=async()=>{if(page)await page.close();page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'qa-presidencia-revisao-motor-20261015.html');await page.waitForFunction(()=>!!window.renderReviewScore);};
  const propsFor=key=>({homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey:key,roundMs:240000,displayMinute:0,goals:[],stadiumMatch:{id:'gate-'+key,speed:.25,home:team('h'),away:team('a')}});
  const render=async(props,allowed=true)=>{await page.evaluate(async({props,allowed})=>{window.qaAllow=allowed;await window.renderReviewScore(props)}, {props,allowed});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const ready=props=>page.waitForFunction(id=>window.qaReviewState?.context.id===id,props.stadiumMatch.id);
  const score=()=>page.locator('.ll25-numbers strong').innerText();
  const calls=()=>page.evaluate(()=>structuredClone(window.qaPlaybackCalls??[]));
  const goalProps=key=>({...propsFor(key),goals:[{min:20,home:true,name:'h10',id:'h10',assist:'h6',assistId:'h6'}]});
  const expectPublic=async()=>{await page.waitForFunction(()=>window.qaReviewState===null);assert.equal(await page.locator('.pe-live').count(),0);};
  const expectOneGoal=async()=>{await page.waitForFunction(()=>document.querySelector('.ll25-numbers strong')?.textContent.replace(/\s/g,'')==='1×0');assert.equal(await score(),'1 × 0');};
  let props,played;
  if(!process.argv.includes('--pending-only')){
  // A private shot cancelled by losing access must complete in the normal
  // public presentation, with no surviving private confirmation callback.
  await open();props=goalProps(701);await render(props);await ready(props);props.displayMinute=20;await render(props);await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan);assert.equal(await score(),'0 × 0');
  await render(props,false);await expectPublic();await expectOneGoal();await page.waitForTimeout(1300);
  played=await calls();assert.ok(played.length);assert.ok(played.every(p=>p.cancelled&&p.impacts.length===0&&p.ends.length===0));assert.equal(await score(),'1 × 0');
  await render(props,true);await ready(props);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.qaReviewState.homeScore),1);assert.equal(await page.evaluate(()=>window.qaReviewState.goal),undefined);
  report.cases.push({name:'gol privado → público → retorno após confirmação',calls:played,score:await score()});console.log('PASS perda do gate durante gol: público conclui uma vez e retorno preserva placar');
  // Return while the replacement public shot is still flying. Its old timer
  // must be cancelled and only the new private clock may confirm the goal.
  await open();props=goalProps(702);await render(props);await ready(props);props.displayMinute=20;await render(props);await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan);
  await render(props,false);await expectPublic();await page.waitForTimeout(100);props.stadiumMatch.speed=4;props.roundMs=15000;await render(props,true);await ready(props);await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan);await expectOneGoal();await page.waitForFunction(()=>!window.qaReviewState?.goal);await page.waitForTimeout(1200);
  played=await calls();assert.ok(played.length>=2);assert.equal(played[0].impacts.length,0);assert.equal(played.reduce((sum,p)=>sum+p.impacts.length,0),1);assert.ok(played.every(p=>p.allowed&&p.impacts.every(i=>i.allowed)));assert.equal(await page.evaluate(()=>window.qaReviewState.homeScore),1);
  report.cases.push({name:'retorno ao privado antes do impacto público',calls:played,score:await score()});console.log('PASS retorno durante gol: relógio antigo cancelado e uma confirmação');
  // A cancelled chance may be dismissed by the gate transition; it must not
  // leave its private narration/clock alive or block the next real incident.
  await open();props=propsFor(703);const schedule=chancesDoJogo(sementeDasChances(703,'Casa','Visitante'),[],60000);assert.ok(schedule.length>=2);await render(props);await ready(props);props.displayMinute=schedule[0].min;await render(props);await page.waitForFunction(()=>!!window.qaReviewState?.chance?.plan);
  await render(props,false);await expectPublic();await page.waitForTimeout(100);props.stadiumMatch.speed=4;props.roundMs=15000;await render(props,true);await ready(props);await page.waitForFunction(()=>!window.qaReviewState?.chance);assert.equal((await calls())[0].impacts.length,0);
  props.displayMinute=schedule[1].min;await render(props);await page.waitForFunction(min=>window.qaReviewState?.chance?.minute===min&&!!window.qaReviewState.chance.plan,schedule[1].min);await page.waitForFunction(()=>!window.qaReviewState?.chance);
  played=await calls();assert.ok(played.every(p=>p.allowed&&p.impacts.every(i=>i.allowed)&&p.ends.every(i=>i.allowed)));assert.equal(await score(),'0 × 0');assert.doesNotMatch(await page.locator('.ll25-narration').innerText(),/prepara a jogada/);
  report.cases.push({name:'perda/retorno durante chance e próxima chance',calls:played,nextMinute:schedule[1].min,score:await score()});console.log('PASS chance cancelada não fica presa e próximo lance privado acontece');
  }
  // Hold the real dynamic import promise, revoke the gate, then release it.
  // The stale promise must fail its generation check before starting a clock.
  for(const kind of ['goal','chance']){
   await open();props=kind==='goal'?goalProps(704):propsFor(705);await render(props);await ready(props);
   await page.evaluate(()=>{window.qaHoldPlanner=true});
   props.displayMinute=kind==='goal'?20:chancesDoJogo(sementeDasChances(705,'Casa','Visitante'),[],60000)[0].min;
   await render(props);await page.waitForFunction(()=>window.qaPendingPlanner>0);assert.equal((await calls()).length,0);
   await render(props,false);await expectPublic();await page.evaluate(()=>{window.qaHoldPlanner=false;for(const release of window.qaPlannerReleases??[])release();window.qaPlannerReleases=[];});await page.waitForTimeout(2200);assert.deepEqual(await calls(),[],'stale import must not start private playback after access loss');
   if(kind==='goal')await expectOneGoal();else{assert.equal(await score(),'0 × 0');assert.doesNotMatch(await page.locator('.ll25-narration').innerText(),/prepara a jogada/);}
   await render(props,true);await ready(props);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.qaReviewState.homeScore),kind==='goal'?1:0);
   report.cases.push({name:'import pendente '+kind,stalePlaybackCancelled:true,score:await score()});console.log('PASS import pendente '+kind+': callback antigo não revive apresentação privada');
  }
  report.cup=await page.evaluate(async()=>{
   const{seedCpuSquads,buildPyramid,simulatePyramid,computeCopa}=await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx');
   const seeded=seedCpuSquads([],20250824,'br',true),squad=seeded[Object.keys(seeded)[0]].map(c=>({...c}));
   const managers=[{id:0,name:'Você',teamName:'Auditor FC',isHuman:true,auctionRival:false,formation:'4-4-2',money:100,squad}];
   const seed=987654321,world=buildPyramid(managers,0,seed,'br',{m0:'V'},undefined),live=simulatePyramid(world,seed,38,{},{},1.12,true,true),before=JSON.stringify(live.tables);
   const first=computeCopa(live.tables,seed,1,1.12,true,{}),second=computeCopa(live.tables,seed,1,1.12,true,{}),issues=[];let goals=0,assists=0;
   for(const round of first.rounds)for(const tie of round.ties)for(const leg of tie.legGoals)for(const goal of leg){goals++;if(!goal.assist)continue;assists++;const side=goal.home?tie.a:tie.b;if(!goal.assistId||!side.xi.some(p=>p.id===goal.assistId&&p.name===goal.assist)||goal.id===goal.assistId)issues.push({club:side.name,goal});}
   return{goals,assists,issues,deterministic:JSON.stringify(first)===JSON.stringify(second),sourceUnchanged:before===JSON.stringify(live.tables)};
  });
  assert.ok(report.cup.goals>0&&report.cup.assists>0);assert.deepEqual(report.cup.issues,[]);assert.equal(report.cup.deterministic,true);assert.equal(report.cup.sourceUnchanged,true);console.log('PASS computeCopa real: '+report.cup.assists+' assistências com IDs corretos, determinismo e fonte preservada');
  assert.deepEqual(report.errors,[]);const suffix=process.argv.includes('--pending-only')?'-pending':'';await page.screenshot({path:output+'/gate-browser'+suffix+'-20261016.png'});fs.writeFileSync(output+'/gate-browser'+suffix+'-20261016.json',JSON.stringify(report,null,2));await context.close();console.log('PASS transições do gate verificadas nesta execução e origem dos IDs da Copa.');
 }catch(error){report.failure={message:error.message,stack:error.stack};fs.writeFileSync(output+'/gate-browser-falha-20261016.json',JSON.stringify(report,null,2));if(page)await page.screenshot({path:output+'/gate-browser-falha.png'}).catch(()=>{});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
