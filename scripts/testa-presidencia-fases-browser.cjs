const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',base=origin+'/7a0-game-studio/',output='test-results/futebol-3d';
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={phases:[],errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:1000,height:950},locale:'pt-BR'}),page=await context.newPage();
  page.setDefaultTimeout(60000);page.on('pageerror',e=>report.errors.push(e.message));
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>true;export const presidentPreviewEnabled=()=>true;export const presidentWritesEnabled=()=>false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  await page.goto(base+'qa-presidencia-revisao-motor-20261015.html');await page.waitForFunction(()=>!!window.renderReviewScore);
  const props={homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey:916,roundMs:240000,displayMinute:0,goals:[],stadiumMatch:{id:'phase-review',speed:.25,home:team('h'),away:team('a')}};
  const render=async()=>{await page.evaluate(p=>window.renderReviewScore(p),props);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  await render();await page.waitForFunction(()=>!!window.qaReviewState);
  props.goals=[{min:20,home:true,name:'h10',id:'h10',assist:'h6',assistId:'h6'}];props.displayMinute=20;await render();
  await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan?.sequence);
  props.pauseAtHalf=true;props.displayMinute=45;await render();await page.waitForFunction(()=>window.qaReviewState?.goal?.clock?.running===false);
  const plan=await page.evaluate(()=>{const p=window.qaReviewState.goal.plan;return{durationMs:p.durationMs,shotStartMs:p.sequence.shotStartMs,boundaries:p.sequence.boundaries,author:p.author.key,assist:p.assist?.key};});
  assert.ok(plan.shotStartMs>0&&plan.shotStartMs<plan.durationMs);assert.equal(plan.author,'home:h10');assert.equal(plan.assist,'home:h6');
  const textFor={prepare:/prepara a jogada/,receive:/recebe e domina/,pass:/toca para o companheiro/,carry:/avança com a bola/,shoot:/finaliza em direção/};
  // Step only the real shared clock while paused. This makes each phase
  // inspectable without replacing planner, renderer, narration or miniatures.
  for(const b of plan.boundaries.filter(b=>b.kind!=='impact')){
   const at=(b.startMs+b.endMs)/2;
   await page.evaluate(at=>{const clock=window.qaReviewState.goal.clock;clock.elapsedMs=at;clock.sampledAt=performance.now();},at);
   await page.waitForFunction(pattern=>new RegExp(pattern).test(document.querySelector('.ll25-narration')?.textContent??''),textFor[b.kind].source);
   const sample=await page.evaluate(async()=>{
    const {quadroFutebol3D}=await import('/7a0-game-studio/src/escalacao/presidencia-futebol-motor.ts');const s=window.qaReviewState;
    const frame=quadroFutebol3D(s,performance.now());return{text:document.querySelector('.ll25-narration').textContent,score:s.homeScore,ball:frame.ball,players:frame.players.map(p=>({key:p.key,x:p.mx,z:p.mz,speed:p.speed})),mini:document.querySelector('.ll32-bola').getAnimations().map(a=>Number(a.currentTime))};
   });
   assert.equal(sample.score,0,'phase narration cannot confirm the goal');assert.doesNotMatch(sample.text,/marca|gol!|defendeu|fora|travessão/);
   assert.ok(sample.mini.length,'the real miniature is animated');
   if(at<plan.shotStartMs)assert.ok(sample.mini.every(t=>Math.abs(t)<1),'miniature waits for the actual shot');
   else assert.ok(sample.mini.some(t=>t>0&&t<900),'miniature advances only through the shot');
   report.phases.push({kind:b.kind,at,...sample});
  }
  for(const kind of ['receive','pass','carry','shoot'])assert.ok(report.phases.some(p=>p.kind===kind),'assisted sequence includes '+kind);
  for(const key of [plan.author,plan.assist]){
   const positions=report.phases.map(p=>p.players.find(a=>a.key===key));
   const span=Math.max(...positions.map(a=>Math.hypot(a.x-positions[0].x,a.z-positions[0].z)));
   assert.ok(span>.3,key+' moves through the same plan');
  }
  await page.evaluate(()=>{const g=window.qaReviewState.goal;g.clock.elapsedMs=g.plan.durationMs;g.clock.sampledAt=performance.now();});
  await page.waitForFunction(()=>window.qaReviewState?.homeScore===1&&window.qaReviewState?.goal?.phase==='confirmed');
  const confirmed=await page.locator('.ll25-narration').innerText();assert.match(confirmed,/h6.*passa.*h10/i);
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.qaReviewState.homeScore),1);
  report.plan=plan;report.confirmed=confirmed;report.privateFixture=true;report.clockSteppedWhilePaused=true;
  assert.deepEqual(report.errors,[]);await page.screenshot({path:output+'/fases-browser-20261016.png'});await context.close();
  fs.writeFileSync(output+'/fases-browser-20261016.json',JSON.stringify(report,null,2));
  console.log('PASS fases reais, movimentos, narração, miniatura aguardando o chute e confirmação única no impacto.');
 }catch(error){report.failure={message:error.message,stack:error.stack};fs.writeFileSync(output+'/fases-browser-20261016.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
