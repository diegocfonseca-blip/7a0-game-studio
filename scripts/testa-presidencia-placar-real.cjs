const assert=require('node:assert/strict');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:900,height:1500}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 // Identidade simulada só no navegador deste teste. Gate de produção permanece intacto.
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.allowPresident!==false;export const presidentPreviewEnabled=()=>window.allowPresident!==false;export const presidentWritesEnabled=()=>window.allowPresident!==false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 await page.waitForFunction(()=>!!window.renderScoreFixture);
 const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
 const props={homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey:1,roundMs:60000,displayMinute:20,goals:[{min:21,home:true,name:'h10'},{min:21,home:false,name:'a10'}],stadiumMatch:{id:'real-1',stadium:{inv:{grama:30},ext:[]},home:team('h'),away:team('a')}};
 const render=()=>page.evaluate(p=>window.renderScoreFixture(p),props);
 const state=()=>page.locator('#score-probe').evaluate(n=>JSON.parse(n.textContent));
 await render();await page.waitForFunction(()=>document.querySelector('.pe-map-score'));
 assert.equal((await state()).homeScore,0);
 await page.evaluate(()=>{window.scoreFrames=[];new MutationObserver(()=>{const s=JSON.parse(document.querySelector('#score-probe')?.textContent??'null');if(s)window.scoreFrames.push({...s,_at:performance.now(),_mini:document.querySelector('#mini-score-fixture')?.textContent})}).observe(document.querySelector('#score-probe'),{childList:true,subtree:true,characterData:true})});
 // Read the state captured at publication, not a later frame after a slow GPU render.
 const frame=async criteria=>{const handle=await page.waitForFunction(({criteria,id})=>window.scoreFrames.find(s=>s.context.id===id&&Object.entries(criteria).every(([key,value])=>(key==='goalPhase'?s.goal?.phase:key==='goalName'?s.goal?.name:key==='chance'?!!s.chance:s[key])===value)),{criteria,id:props.stadiumMatch.id});const result=await handle.jsonValue();await handle.dispose();return result};
 props.displayMinute=21;await render();
 let s=await frame({goalPhase:'shot',goalName:'h10'});const firstShotAt=s.goal.startedAt;assert.equal(s.homeScore,0);assert.equal(s.awayScore,0);assert.equal(s.goal.name,'h10');assert.ok(s._mini.includes('0 × 0'),'Faixa pequena não antecipa o gol');
 s=await frame({homeScore:1,goalName:'a10',goalPhase:'shot'});assert.ok(s.goal.startedAt-firstShotAt>=850,'Segundo chute espera a primeira bola entrar');assert.equal(s.awayScore,0);
 await page.waitForFunction(()=>document.querySelector('.pe-map-score')?.textContent.includes('1 × 1'));
 s=await frame({goalPhase:'confirmed',goalName:'a10'});assert.equal(s.goal.phase,'confirmed');assert.equal(s.goal.name,'a10');assert.ok((await page.locator('#mini-score-fixture').textContent()).includes('1 × 1'));
 props.displayMinute=45;props.pauseAtHalf=true;await render();await page.waitForFunction(()=>JSON.parse(document.querySelector('#score-probe').textContent)?.paused);
 props.displayMinute=46;props.resumeHalf=true;await render();await page.waitForFunction(()=>!JSON.parse(document.querySelector('#score-probe').textContent)?.paused);
 props.roundKey=2;props.displayMinute=0;props.goals=[];props.stadiumMatch.id='real-2';await render();
 await page.waitForFunction(()=>document.querySelector('.pe-map-score')?.textContent.includes('0 × 0'));
 s=await state();assert.equal(s.goal,undefined);assert.equal(s.context.id,'real-2');
 await page.waitForTimeout(1000);assert.equal((await state()).homeScore,0);
 // Acréscimos: o apito final só chega depois da última bola da fila.
 props.goals=[{min:94,home:true,name:'h10'}];props.displayMinute=93;await render();
 s=await frame({goalPhase:'shot',goalName:'h10'});assert.equal(s.finished,false);assert.equal(s.homeScore,0);assert.ok(!s._mini.includes('FIM'),'Faixa espera o gol dos acréscimos antes do apito final');
 s=await frame({finished:true});assert.equal(s.homeScore,1);assert.equal(s.goal.phase,'confirmed');
 props.roundKey=3;props.stadiumMatch.id='real-3';props.displayMinute=0;props.goals=[];await render();
 const chance=await page.evaluate(async p=>{const m=await import('/7a0-game-studio/src/escalacao/chances.ts');return m.chancesDoJogo(m.sementeDasChances(p.roundKey,p.homeName,p.awayName),p.goals,p.roundMs)[0]},props);
 assert.ok(chance,'Rodada da fixture tem chance sem gol');props.displayMinute=chance.min;await render();
 s=await frame({chance:true});assert.equal(s.chance.outcome,chance.fim);assert.equal(s.chance.home,chance.home);assert.equal(s.chance.minute,chance.min);
 assert.equal(s.homeScore,0);assert.equal(s.awayScore,0);
 await page.waitForFunction(()=>!JSON.parse(document.querySelector('#score-probe').textContent)?.chance);
 assert.equal((await state()).homeScore,0,'Chance encerrada não cria gol');
 // Private 4x uses one duration for the score, stage and 3D shot.
 await page.evaluate(()=>{window.scoreTimers=[];const original=window.setTimeout.bind(window);window.setTimeout=(handler,delay,...args)=>{const entry={delay,scheduled:performance.now()};window.scoreTimers.push(entry);return original((...values)=>{entry.fired=performance.now();handler(...values)},delay,...args)}});
 props.roundKey=4;props.stadiumMatch.id='real-4';props.stadiumMatch.speed=4;props.displayMinute=0;props.goals=[{min:1,home:true,name:'h10'}];await render();
 // Wait for the new round's first WebGL frame before measuring the event timer.
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#score-probe')?.textContent??'null')?.context.id==='real-4'&&document.querySelector('.pe-map .pe-football-registered')?.dataset.time==='0'&&document.querySelector('.pe-map .pe-football-registered')?.dataset.players==='22');
 props.displayMinute=1;await render();
 s=await frame({goalPhase:'shot',goalName:'h10'});assert.equal(s.goal.speed,4);assert.equal(s.homeScore,0);
 const confirmed=await frame({homeScore:1});
 const elapsed=confirmed._at-s.goal.startedAt;
 const duration=s.goal.plan?.durationMs??900;
 assert.ok(elapsed>=duration/4-30,'4x preserves the planned travel time before score confirmation');
 const clock=confirmed.goal?.clock;
 assert.ok(clock&&clock.elapsedMs+(confirmed._at-clock.sampledAt)*clock.rate>=duration-30,'Published score and field use the same event clock');
 console.log('4x timing:',JSON.stringify({plannedMs:duration,expectedAt4x:duration/4,publishedMs:elapsed}));
 // Switching speed during the same round cannot rewind the simulation minute.
 props.roundKey=5;props.stadiumMatch.id='real-5';props.stadiumMatch.speed=1;delete props.displayMinute;props.goals=[];props.roundMs=10000;await render();
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#score-probe').textContent)?.minute>=5);
 const beforeSpeed=(await state()).minute;props.roundMs=2500;props.stadiumMatch.speed=4;await render();
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#score-probe').textContent)?.visualClock?.rate===4);
 assert.ok((await state()).minute>=beforeSpeed,'Speed change preserves elapsed minutes');
 for(const rate of [.5,.25]){
  const minuteBefore=(await state()).minute;
  props.stadiumMatch.speed=rate;props.roundMs=10000/rate;await render();
  await page.waitForFunction(rate=>JSON.parse(document.querySelector('#score-probe').textContent)?.visualClock?.rate===rate,rate);
  assert.ok((await state()).minute>=minuteBefore,'Slowing down preserves the minute');
 }
 await page.evaluate(()=>{window.allowPresident=false});await render();
 await page.waitForFunction(()=>!document.querySelector('.pe-live')&&!document.querySelector('.pe-map-score'));
 assert.equal(await page.locator('[data-athlete]').count(),0,'Revogar acesso desmonta a publicação privada e os atletas do mapa');
 assert.deepEqual(errors,[]);
 console.log('PASS: LiveScoreCard real → mapa/faixa: chute antes do placar, gols enfileirados, intervalo, rodada nova, apito final e chance sem gol. Identidade simulada, rede externa bloqueada.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
