const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',base=origin+'/7a0-game-studio/',out='test-results/auditoria-relogio';
// Real LiveScoreCard timers, production planner/motor, shared state and viewing
// provider. Only account verification and expensive WebGL presentation are
// substituted; the substituted renderer samples no clock and changes no state.
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={cases:[],errors:[]};let page;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'pt-BR'});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.qaAllow!==false;export const presidentPreviewEnabled=()=>window.qaAllow!==false;export const presidentWritesEnabled=()=>window.qaAllow!==false;export const presidentPreviewEmail=()=>window.qaAllow!==false;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  await context.route('**/src/escalacao/presidencia-futebol-3d.tsx*',r=>r.fulfill({contentType:'text/javascript',body:'export default function ClockOnlyRenderer(){return null}'}));
  const open=async(props,{allowed=true}={})=>{
   if(page)await page.close();page=await context.newPage();await page.routeWebSocket('**',socket=>socket.onMessage(()=>{}));page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(base+'qa-presidencia-relogio-real.html');await page.waitForFunction(()=>typeof window.mountRealScore==='function');
   await page.evaluate(v=>{window.qaAllow=v},allowed);
   await page.clock.install({time:new Date('2026-10-18T11:59:59Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));
   await page.evaluate(({props,allowed})=>window.mountRealScore(props,1,allowed),{props,allowed});await page.clock.runFor(64);
  };
  const read=()=>page.evaluate(()=>window.qaClockRead());
  const advance=async(ms=500)=>{await page.clock.runFor(ms);return read()};
  const watch=async()=>{await page.evaluate(()=>document.querySelector('.pe-live summary').click());await page.clock.runFor(64);return read()};
  const propsFor=(key,goals=[])=>({roundKey:key,goals,stadiumMatch:{id:'clock-real-'+key}});
  let current,iterations;
  if(!process.argv.includes('--halftime-only')){
  // Open the actual stadium details at kickoff. This must choose the slowest
  // supported rate, but physical play must last longer than the old9.02s.
  await open(propsFor(18001));current=await watch();assert.equal(current.speed,.25);
  const phases=new Set(),firstHalf=new Set();iterations=0;let previous=current,accelerated=false;
  while(!current.finished&&iterations++<2400){
   current=await advance(500);assert.ok(current.minute>=previous.minute,'minute never rewinds when watching');
   phases.add(current.frame.phase);if(current.minute<45)firstHalf.add(current.frame.phase);
   assert.equal(current.frame.players.length,22);previous=current;if(!accelerated&&firstHalf.has('passe')&&current.minute>=3){await page.evaluate(()=>window.qaClockSetSpeed(4));accelerated=true;console.log('PASS ritmo escolhido4× após observar passes em0,25×');}if(iterations%200===0)console.log('Progresso sem gols: '+current.minute+'min, '+current.frame.phase+', '+current.frame.time.toFixed(1)+'s físicos');
  }
  assert.ok(current.finished,'a goalless fixture reaches full time');assert.equal(current.minute,93);assert.equal(current.ready,true);
  assert.ok(phases.has('passe')&&phases.has('dominio'),'the real-duration fixture contains passes and ball control');
  assert.ok(firstHalf.has('passe'),'a pass happens before halftime, not merely after93');
  assert.ok(current.frame.time>9.9,'slow viewing provides more actual football than the old9.02 physical seconds');
  report.cases.push({name:'relógio real sem gols e abertura inicial',durationMs:current.now,physicalSeconds:current.frame.time,phases:[...phases],firstHalf:[...firstHalf],last:current});console.log('PASS relógio real: início lento, circulação,22atletas e fim comum');
  // Keep the scoreboard running with details shut, then open during the first
  // half. Opening is a camera action and must not reset minute, score or motor.
  await open(propsFor(18002,[{min:35,home:true,name:'h10',id:'h10',assist:'h6',assistId:'h6'},{min:89,home:false,name:'a10',id:'a10'}]));
  await advance(520);const before=await read();assert.ok(before.minute>0&&before.minute<35);
  current=await watch();assert.ok(current.minute>=before.minute,'opening late must preserve the current minute');assert.equal(current.homeScore,before.homeScore);assert.ok(current.frame.time>=before.frame.time,'opening late must not reset physical play');assert.equal(current.speed,.25);await page.evaluate(()=>window.qaClockSetSpeed(4));current=await advance(64);
  const shots=new Map(),impacts=[];let oldScore=current.homeScore+current.awayScore,heldSamples=0;iterations=0;
  while(!current.finished&&iterations++<3000){
   const previous=current;current=await advance(current.event?.goal?40:250);
   assert.ok(current.minute>=previous.minute,'minute does not rewind around an incident');
   if(current.event?.goal&&current.event.phase==='shot'&&current.event.impactMs){
    assert.equal(current.ready,false,'final-ready cannot precede a pending goal');
    const shot=shots.get(current.event.id);if(!shot){shots.set(current.event.id,{minute:current.minute,score:current.homeScore+current.awayScore,slowAt:current.now,accelerated:false});await page.evaluate(()=>window.qaClockSetSpeed(.25));}
    else if(current.event.elapsedMs<current.event.impactMs){assert.ok(current.minute<=shot.minute+1,'match minute waits for the physical shot');assert.equal(current.homeScore+current.awayScore,shot.score,'score cannot precede ball impact');heldSamples++;if(!shot.accelerated&&current.now-shot.slowAt>=2000){await page.evaluate(()=>window.qaClockSetSpeed(4));shot.accelerated=true;}}
   }
   const score=current.homeScore+current.awayScore;
   if(score!==oldScore){assert.equal(score,oldScore+1,'each official goal confirms exactly once');assert.ok(current.event?.goal&&current.event.phase==='confirmed','score changes with the confirmed physical goal');assert.ok(current.event.elapsedMs>=current.event.impactMs,'confirmation uses the same impact clock');assert.ok(Math.abs(current.frame.ball.x)>=52.5,'the whole visible scoring ball reaches the goal');impacts.push(current);oldScore=score;}
   if(current.ready)assert.ok(current.finished,'ready must match the closed presentation');if(iterations%200===0)console.log('Progresso com gols: '+current.minute+'min, '+current.homeScore+'×'+current.awayScore+', '+current.frame.phase);
  }
  assert.equal(current.finished,true);assert.equal(current.ready,true);assert.equal(current.homeScore,1);assert.equal(current.awayScore,1);assert.equal(shots.size,2);assert.equal(impacts.length,2);assert.ok(heldSamples>2);
  const history=await page.evaluate(()=>window.qaClockNotifications);const firstReady=history.find(x=>x.minute>=93);assert.ok(firstReady.at>=impacts.at(-1).now-500,'parent final signal follows the last goal');
  report.cases.push({name:'abertura tardia e dois gols oficiais',before,shots:[...shots],heldSamples,impacts,firstReady,last:current});console.log('PASS abertura tardia, minuto retido, gols no impacto e sinal final após último gol');
  // An ordinary account keeps the original duration and receives no private
  // publication even though the same optional match context was supplied.
  await open(propsFor(18003),{allowed:false});await page.clock.runFor(10000);
  assert.equal(await read(),null);assert.equal(await page.locator('.pe-live').count(),0);assert.equal(await page.evaluate(()=>window.qaClockReady),true);assert.equal(await page.evaluate(()=>window.qaClockSpeed),1);
  report.cases.push({name:'conta pública',originalDuration:true,privatePublication:false,speed:1});console.log('PASS conta pública preservada');
  }
  // A goal scheduled exactly at45' must hit the net before halftime pauses
  // the source clock. Resuming keeps the same match and authoritative score.
  await open({...propsFor(18004,[{min:45,home:true,name:'h10',id:'h10'}]),pauseAtHalf:true});await watch();
  await page.evaluate(()=>window.qaClockSetSpeed(4));current=await advance(64);iterations=0;
  while(!current.paused&&iterations++<500){current=await advance(80);if(current.event?.goal&&current.event.minute===45){assert.equal(current.period,1,'45th-minute goal belongs to the first half');assert.ok(current.frame.players.find(p=>p.key==='home:h0').x<0,'45th-minute goal must not swap sides before the shot');}}
  assert.equal(current.paused,true,'halftime is reached after the45th-minute goal');assert.equal(current.minute,45);assert.equal(current.homeScore,1);assert.equal(current.ready,false);
  current=await advance(80);assert.equal(await page.evaluate(()=>window.qaClockHalftimes.length),1,'halftime callback fires once');
  const halftime=current,pausedLater=await advance(2000);assert.deepEqual(pausedLater.frame,halftime.frame,'ball, players and field time freeze during halftime');
  await page.evaluate(()=>window.qaClockSetExtra({resumeHalf:true}));current=await advance(64);assert.equal(current.paused,false);assert.equal(current.period,2,'resuming halftime explicitly starts the second period');assert.equal(current.homeScore,1);assert.ok(current.minute>=45);
  iterations=0;while(!current.finished&&iterations++<500)current=await advance(250);
  assert.equal(current.finished,true);assert.equal(current.homeScore,1);assert.equal(current.awayScore,0);assert.equal(current.ready,true);
  report.cases.push({name:'gol45 e intervalo real',halftime,last:current});console.log('PASS gol45 antes do intervalo, pausa física e retomada sem reinício');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(out+(process.argv.includes('--halftime-only')?'/relogio-real-intervalo-browser.json':'/relogio-real-browser.json'),JSON.stringify(report,null,2));await context.close();
 }catch(error){report.failure={message:error.message,stack:error.stack,last:page?await page.evaluate(()=>window.qaClockRead?.()).catch(()=>null):null};fs.writeFileSync(out+(process.argv.includes('--halftime-only')?'/relogio-real-intervalo-browser.json':'/relogio-real-browser.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
