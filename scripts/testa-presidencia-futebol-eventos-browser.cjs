const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',base=origin+'/7a0-game-studio/',output='test-results/futebol-3d';
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
const rates=[.25,.5,1,2,4,8],forbidden=/cabe[çc]a|bicicleta|falta|cart[aã]o|impedimento|pedalada|caneta/i;
const preparing=/prepara a jogada|recebe e domina|toca para o companheiro|avança com a bola|finaliza em direção/i;
const verdict=/goleiro defendeu|chutou na trave|chutou no travessão|finalizou para fora|chutou por cima|finaliza e marca/i;
const elapsed=(clock,now)=>clock.elapsedMs+(clock.running?Math.max(0,now-clock.sampledAt)*clock.rate:0);
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const{chancesDoJogo,sementeDasChances}=await import('../src/escalacao/chances.ts');
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={calendar:[],chances:[],goals:[],errors:[]};
 let page;
 try{
  const context=await browser.newContext({viewport:{width:1000,height:950},locale:'pt-BR'});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.qaAllow!==false;export const presidentPreviewEnabled=()=>window.qaAllow!==false;export const presidentWritesEnabled=()=>window.qaAllow!==false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  // Observe the real calendar call at the module boundary. No production hook,
  // replacement schedule, mocked result or changed planner is used.
  await context.route('**/src/escalacao/chances.ts*',async route=>{
   const response=await route.fetch(),source=await response.text();
   assert.ok(source.includes('export function chancesDoJogo('),'Vite exposes the real chance generator');
   const body=source.replace('export function chancesDoJogo(','function qaOriginalChancesDoJogo(')+
    '\nexport function chancesDoJogo(...args){const result=qaOriginalChancesDoJogo(...args);(window.qaChanceCalls??=[]).push({args:structuredClone(args),result:structuredClone(result)});return result;}\n';
   await route.fulfill({response,body,contentType:'text/javascript'});
  });
  const open=async()=>{
   if(page)await page.close();page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(base+'qa-presidencia-revisao-motor-20261015.html');await page.waitForFunction(()=>!!window.renderReviewScore);
  };
  const propsFor=(roundKey,duration=60000)=>({homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey,roundMs:duration,displayMinute:0,goals:[],stadiumMatch:{id:'event-review-'+roundKey,speed:1,home:team('h'),away:team('a')}});
  const render=async props=>{await page.evaluate(p=>window.renderReviewScore(p),props);await page.waitForFunction(id=>window.qaReviewState?.context.id===id,props.stadiumMatch.id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const narration=()=>page.locator('.ll25-narration').innerText();
  const read=()=>page.evaluate(async()=>{
   const{quadroFutebol3D}=await import('/7a0-game-studio/src/escalacao/presidencia-futebol-motor.ts');const now=performance.now(),state=window.qaReviewState;
   return{now,state:structuredClone(state),frame:quadroFutebol3D(state,now),text:document.querySelector('.ll25-narration')?.textContent,radio:document.querySelector('.ll-radio')?.textContent,mini:document.querySelector('.ll32-bola')?.getAnimations().map(a=>a.currentTime)};
  });
  // Every rate starts with the same fixture at minute zero, then changes speed
  // before any chance is due. A slower/faster view must retain all incidents.
  for(const rate of rates){
   await open();const props=propsFor(101,30000),expected=chancesDoJogo(sementeDasChances(props.roundKey,props.homeName,props.awayName),[],30000);
   assert.ok(expected.length);await render(props);
   for(const speed of [rate,1,rate]){props.stadiumMatch.speed=speed;props.roundMs=30000/speed;await render(props);}
   const calls=await page.evaluate(()=>window.qaChanceCalls);assert.ok(calls.length);
   for(const call of calls){assert.equal(call.args[2],30000,'playback speed does not alter calendar duration');assert.deepEqual(call.result,expected);}
   props.displayMinute=expected[0].min;await render(props);await page.waitForFunction(()=>!!window.qaReviewState?.chance?.plan);
   const actual=await page.evaluate(()=>structuredClone(window.qaReviewState.chance));
   assert.deepEqual({min:actual.minute,home:actual.home,fim:actual.outcome},expected[0]);
   report.calendar.push({rate,duration:30000,schedule:expected,observed:{minute:actual.minute,home:actual.home,outcome:actual.outcome},calls:calls.length});
   console.log('PASS calendário estável e primeira chance em '+rate+'×');
  }
  // Check all four outcomes against the shared impact clock. The saved-shot
  // case also pauses at halftime, changes rate, then resumes without jumping.
  for(const outcome of ['defendeu','trave','fora','isolou']){
   let props,selected;
   for(let key=201;key<301&&!selected;key++){props=propsFor(key);selected=chancesDoJogo(sementeDasChances(key,props.homeName,props.awayName),[],60000).find(c=>c.fim===outcome&&c.min<43);}
   assert.ok(selected,'fixture with '+outcome);await open();await render(props);
   props.stadiumMatch.speed=.25;props.roundMs=240000;props.displayMinute=selected.min;await render(props);
   await page.waitForFunction(()=>!!window.qaReviewState?.chance?.plan);
   const before=await read();assert.match(before.text,preparing);assert.equal(before.state.chance.outcome,outcome);assert.ok(elapsed(before.state.chance.clock,before.now)<before.state.chance.plan.durationMs);assert.doesNotMatch(before.text,forbidden);assert.doesNotMatch(before.text,verdict);
   let pause;
   if(outcome==='defendeu'){
    props.pauseAtHalf=true;props.displayMinute=45;await render(props);await page.waitForFunction(()=>window.qaReviewState?.chance?.clock?.running===false);
    const a=await read();await page.waitForTimeout(220);const b=await read();assert.deepEqual(b.frame.ball,a.frame.ball);assert.deepEqual(b.frame.players,a.frame.players);assert.deepEqual(b.mini,a.mini);assert.equal(b.state.chance.clock.elapsedMs,a.state.chance.clock.elapsedMs);assert.match(b.text,preparing);assert.equal(b.text,a.text);
    pause={elapsed:a.state.chance.clock.elapsedMs,ball:a.frame.ball};props.resumeHalf=true;props.displayMinute=46;
   }
   props.stadiumMatch.speed=4;props.roundMs=15000;await render(props);
   await page.waitForFunction(()=>{const chance=window.qaReviewState?.chance,clock=chance?.clock;return clock&&clock.elapsedMs+(clock.running?Math.max(0,performance.now()-clock.sampledAt)*clock.rate:0)>=chance.plan.durationMs;});
   const expected={defendeu:/goleiro defendeu/i,trave:/na trave|no travessão/i,fora:/para fora/i,isolou:/por cima/i}[outcome];
   await page.waitForFunction(pattern=>new RegExp(pattern,'i').test(document.querySelector('.ll25-narration')?.textContent??''),expected.source);
   const after=await read();
   assert.match(after.text,expected);assert.doesNotMatch(after.text,forbidden);assert.ok(elapsed(after.state.chance.clock,after.now)>=after.state.chance.plan.durationMs,'result only appears at the shared impact');assert.equal(after.state.homeScore,0);assert.equal(after.state.awayScore,0);
   report.chances.push({outcome,before:{text:before.text,elapsed:elapsed(before.state.chance.clock,before.now),impact:before.state.chance.plan.durationMs},pause,after:{text:after.text,elapsed:elapsed(after.state.chance.clock,after.now),impact:after.state.chance.plan.durationMs},rateAfter:4});
   await page.screenshot({path:output+'/eventos-'+outcome+'.png'});console.log('PASS narração no impacto, placar preservado: '+outcome);
  }
  // Names intentionally collide: the scorer and passer must be selected by
  // their real roster IDs, and only a physically planned assist is narrated.
  for(const assisted of [true,false]){
   await open();const props=propsFor(assisted?401:402);props.stadiumMatch.home=team('h').map(p=>({...p,name:p.id==='h8'||p.id==='h10'?'Mesmo Nome':p.id==='h5'||p.id==='h6'?'Garçom':p.name}));
   props.goals=[{min:20,home:true,name:'Mesmo Nome',id:'h10',assist:assisted?'Garçom':'Ausente',assistId:assisted?'h6':'missing'}];await render(props);
   props.stadiumMatch.speed=.25;props.roundMs=240000;props.displayMinute=20;await render(props);await page.waitForFunction(()=>!!window.qaReviewState?.goal?.plan);
   const shot=await read();assert.equal(shot.state.goal.scorerId,'h10');assert.equal(shot.state.goal.assistId,assisted?'h6':'missing');assert.equal(shot.state.goal.plan.author.key,'home:h10');assert.equal(shot.state.goal.plan.assist?.key,assisted?'home:h6':undefined);assert.equal(shot.state.homeScore,0);
   props.stadiumMatch.speed=4;props.roundMs=15000;await render(props);await page.waitForFunction(()=>window.qaReviewState?.homeScore===1&&window.qaReviewState?.goal?.phase==='confirmed'&&document.querySelector('.ll25-narration')?.textContent.includes('Mesmo Nome'));
   const confirmed=await read();assert.match(confirmed.text,/Mesmo Nome/);assert.doesNotMatch(confirmed.text,forbidden);assert.ok(elapsed(confirmed.state.goal.clock,confirmed.now)>=confirmed.state.goal.plan.durationMs);
   if(assisted)assert.match(confirmed.text,/Garçom.*passa.*Mesmo Nome/i);else assert.doesNotMatch(confirmed.text,/Ausente|passa/i);
   const text=confirmed.text;await page.waitForFunction(()=>!window.qaReviewState?.goal);await page.waitForTimeout(1750);const retained=await narration();assert.doesNotMatch(retained,forbidden);if(assisted)assert.match(retained,/Garçom.*passa.*Mesmo Nome/i);else assert.doesNotMatch(retained,/Ausente|passa/i);
   report.goals.push({assisted,scorerId:shot.state.goal.scorerId,assistId:shot.state.goal.assistId,plannedAuthor:shot.state.goal.plan.author.key,plannedAssist:shot.state.goal.plan.assist?.key,text,retained});console.log('PASS IDs homônimos, impacto e assistência efetiva: '+assisted);
  }
  // A minute with radio coverage must not invent cards or football actions
  // that the shared field did not actually perform.
  await open();const props=propsFor(501);props.displayMinute=32;await render(props);const pageText=await page.locator('body').innerText();assert.match(pageText,/Ao vivo: Casa × Visitante\. Acompanhe a bola no estádio\./);assert.doesNotMatch(pageText,forbidden);
  report.radio={factual:true};assert.deepEqual(report.errors,[]);await context.close();
  fs.writeFileSync(output+'/eventos-browser-20261016.json',JSON.stringify(report,null,2));console.log('PASS eventos privados: seis velocidades, quatro desfechos, pausa, IDs, assistência e rádio factual.');
 }catch(error){report.failure={message:error.message,stack:error.stack};fs.writeFileSync(output+'/eventos-browser-20261016.json',JSON.stringify(report,null,2));if(page)await page.screenshot({path:output+'/eventos-falha.png'}).catch(()=>{});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
