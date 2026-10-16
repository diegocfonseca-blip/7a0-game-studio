const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const output='test-results/futebol-3d',origin='http://127.0.0.1:4196';
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
 const context=await browser.newContext({viewport:{width:1000,height:950}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.qaAllow!==false;export const presidentPreviewEnabled=()=>window.qaAllow!==false;export const presidentWritesEnabled=()=>window.qaAllow!==false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.goto(origin+'/7a0-game-studio/qa-presidencia-revisao-motor-20261015.html');await page.waitForFunction(()=>!!window.renderReviewScore);
 if(!process.argv.includes('--window-only')){
 const props={homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey:1,roundMs:60000,displayMinute:20,goals:[],stadiumMatch:{id:'review-live-1',speed:.25,home:team('h'),away:team('a')}};
 const render=()=>page.evaluate(p=>window.renderReviewScore(p),props);
 await render();await page.waitForFunction(()=>!!window.qaReviewState);
 await page.evaluate(()=>{window.qaReviewFrames=[];new MutationObserver(()=>{const s=window.qaReviewState;if(s)window.qaReviewFrames.push(structuredClone({...s,at:performance.now()}))}).observe(document.getElementById('review-score'),{childList:true,characterData:true,subtree:true})});
 props.displayMinute=21;props.goals=[{min:21,home:true,name:'h10',assist:'h2'},{min:21,home:true,name:'h9',assist:'h5'}];await render();
 await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan);
 const start=await page.evaluate(()=>structuredClone(window.qaReviewState));assert.equal(start.homeScore,0);assert.ok(start.goal.plan.durationMs>900);
 props.displayMinute=45;props.pauseAtHalf=true;await render();
 await page.waitForFunction(()=>window.qaReviewState?.goal?.clock?.running===false);
 const read=()=>page.evaluate(async()=>{const{quadroFutebol3D}=await import('/7a0-game-studio/src/escalacao/presidencia-futebol-motor.ts');const s=window.qaReviewState;return{frame:quadroFutebol3D(s,performance.now()),score:s.homeScore,mini:document.querySelector('.ll32-bola')?.getAnimations().map(a=>a.currentTime)}});
 const paused=await read();await page.waitForTimeout(300);const stopped=await read();assert.deepEqual(stopped.frame.ball,paused.frame.ball);assert.deepEqual(stopped.mini,paused.mini);assert.equal(stopped.score,0);
 props.displayMinute=46;props.resumeHalf=true;props.stadiumMatch.speed=4;await render();
 await page.waitForFunction(()=>window.qaReviewState?.homeScore===2);
 const frames=await page.evaluate(()=>window.qaReviewFrames);
 for(const index of [0,1]){
  const confirmed=frames.find(s=>s.goal?.id===`review-live-1:${index}`&&s.goal.phase==='confirmed');
  assert.ok(confirmed,`gol ${index} confirmado uma única vez na fila`);
  const c=confirmed.goal.clock,elapsed=c.elapsedMs+(c.running?(confirmed.at-c.sampledAt)*c.rate:0);
  assert.ok(elapsed+20>=confirmed.goal.plan.durationMs,'placar não antecipa a bola');
 }
 assert.equal(new Set(frames.filter(s=>s.goal).map(s=>s.goal.id)).size,2,'dois gols do mesmo lado no mesmo minuto preservam identidade');
 await page.screenshot({path:output+'/revisao-placar.png'});
 report.push({partida:true,distances:true,pause:true,rateChange:true,sameMinuteGoals:true});
 props.roundKey=2;props.stadiumMatch.id='review-live-2';props.displayMinute=0;props.goals=[];props.pauseAtHalf=false;props.resumeHalf=false;await render();
 await page.waitForFunction(()=>window.qaReviewState?.context.id==='review-live-2'&&window.qaReviewState.homeScore===0&&!window.qaReviewState.goal);
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.qaReviewState.homeScore),0);
 // Final whistle must wait for the real last goal, even with a longer flight.
 props.displayMinute=93;props.goals=[{min:93,home:false,name:'a10',assist:'a2'}];await render();
 await page.waitForFunction(()=>window.qaReviewState?.goal?.phase==='shot');assert.equal(await page.evaluate(()=>window.qaReviewState.finished),false);
 await page.waitForFunction(()=>window.qaReviewState?.finished&&window.qaReviewState.awayScore===1);
 report.push({newRound:true,finalWhistle:true});
 console.log('PASS placar real: distância, pausa, miniatura, troca .25×→4×, dois gols no mesmo minuto, nova rodada e apito final.');
 }
 // The real office retains its art and furniture; only the window uses the world.
 if(!process.argv.includes('--score-only'))for(const viewport of [{width:1100,height:850},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  const indices=process.argv.includes('--final')?[5]:viewport.width>500?[0,1,2,3,4,5]:[0,5];let previous='';
  for(const index of indices){
   await page.evaluate(i=>{window.qaPreviousCanvas=document.querySelector('.pr-window canvas');window.qaExpectNewCanvas=window.qaReviewRoomIndex!==i},index);
   await page.evaluate(i=>window.renderReviewRoom(i),index);
   await page.waitForFunction(()=>document.querySelector('.pr-window [data-presentation="window"] [aria-busy="false"] canvas')&&(!window.qaExpectNewCanvas||document.querySelector('.pr-window canvas')!==window.qaPreviousCanvas));
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   assert.equal(await page.locator('.pr-window button').count(),0,'janela fixa não cria controles sobre os móveis');
   const pixel=require('node:crypto').createHash('sha256').update(await page.locator('.pr-window').screenshot()).digest('hex');
   assert.notEqual(pixel,previous,'a compra altera a vista da janela');previous=pixel;
   const name=await page.evaluate(i=>window.qaReviewStages[i].name,index);
   await page.locator('.pr-scene').screenshot({path:`${output}/janela-${viewport.width}-${name}.png`});
   report.push({window:name,width:viewport.width});console.log('PASS janela '+viewport.width+' '+name);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(output+(process.argv.includes('--final')?'/revisao-browser-final.json':'/revisao-browser.json'),JSON.stringify(report,null,2));await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
