const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
const origin=process.env.PRESIDENCIA_QA_ORIGIN||'http://127.0.0.1:4196';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:430,height:900},locale:'pt-BR'}),errors=[];
  page.setDefaultTimeout(45000);
  page.on('pageerror',error=>errors.push(error.message));
  // Outros agentes editam o mesmo workspace; o HMR não deve reiniciar a
  // partida que este teste está acompanhando do primeiro ao último lance.
  await page.routeWebSocket('**/*',()=>{});
  await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await page.route('**/src/escalacao/presidente-acesso.ts*',route=>route.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>true;export const presidentPreviewEnabled=()=>true;export const presidentWritesEnabled=()=>false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  await page.goto(origin+'/7a0-game-studio/qa-presidencia-copa-sincronia.html');
  await page.waitForFunction(()=>!!window.renderCupClock);
  assert.deepEqual(await page.evaluate(()=>[window.positionCupClock(0,92,2),window.positionCupClock(0,93,2),window.positionCupClock(1,92,2),window.positionCupClock(1,93,2)]),[92*90/93,90,90+92*90/93,180]);
  const team=(teamId,prefix)=>({teamId,name:prefix,xi:['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:prefix+i,name:prefix+i,pos})),squad:[],you:teamId===7,human:true});
  const a=team(7,'casa'),b=team(8,'fora');a.squad=a.xi;b.squad=b.xi;
  const goals=[{min:92,home:true,name:'casa10',id:'casa10'}],returnGoals=[{min:92,home:false,name:'fora10',id:'fora10'}];
  const props={tie:{a,b,legGoals:[goals,returnGoals],goals,legs:[[1,0],[0,1]],aggA:1,aggB:1,pens:[4,3],win:'a'},phase:3,colors:{},myColor:'#1b7a3d',simSpeed:4,legMs:2400,stadiumContext:{id:'fixture:copa:relogio-unico',stadiums:{7:{inv:{},ext:[]},8:{inv:{},ext:[]}}}};
  await page.evaluate(props=>window.renderCupClock(props),props);
  await page.waitForFunction(()=>window.cupClockFrames.some(({state:s})=>s.context.id.includes(':leg:0:')&&s.goal?.phase==='shot'));
  let sample=await page.evaluate(()=>({pos:window.cupClockPos,state:JSON.parse(document.querySelector('#cup-clock-probe').textContent)}));
  assert.ok(sample.pos<90,'Ida deve continuar enquanto a última bola ainda está no ar');
  assert.equal(sample.state.finished,false);assert.equal(sample.state.homeScore,0);
  assert.equal(await page.getByText('agregado',{exact:true}).count(),0,'Agregado e pênaltis aguardam as duas pernas');
  assert.equal(await page.locator('.ll28-pens').count(),0);
  await page.evaluate(()=>window.setCupClockSpeed(.25));
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#cup-clock-probe').textContent)?.context.speed===.25);
  const before=await page.evaluate(()=>({pos:window.cupClockPos,minute:JSON.parse(document.querySelector('#cup-clock-probe').textContent).minute}));
  await page.evaluate(()=>window.setCupClockSpeed(8));
  await page.waitForFunction(()=>window.cupClockFrames.some(({state:s})=>s.context.id.includes(':leg:1:')&&s.goal?.phase==='shot'));
  sample=await page.evaluate(()=>({pos:window.cupClockPos,state:JSON.parse(document.querySelector('#cup-clock-probe').textContent)}));
  assert.ok(sample.pos>=90&&sample.pos<180,'Volta não pode encerrar com o chute pendente');
  assert.equal(sample.state.homeScore,0);assert.equal(sample.state.context.homeClubId,8);
  assert.equal(await page.locator('.ll28-pens').count(),0,'Não abre pênaltis enquanto o último gol está sendo jogado');
  await page.waitForFunction(()=>window.cupClockPos===180&&JSON.parse(document.querySelector('#cup-clock-probe').textContent)?.finished);
  assert.equal(await page.locator('.ll28-pens').count(),1);
  const report=await page.evaluate(()=>({frames:window.cupClockFrames,minutes:window.cupClockMinutes,pos:window.cupClockPos}));
  const firstEnd=report.minutes.find(value=>value.leg===0&&value.minute===93),secondStart=report.frames.find(({state:s})=>s.context.id.includes(':leg:1:'));
  assert.ok(firstEnd?.state?.finished&&secondStart?.time>=firstEnd.time,'O estado publicado já deve estar encerrado antes de autorizar o começo da volta');
  for(const leg of [0,1]){
   const frames=report.frames.filter(({state:s})=>s.context.id.includes(`:leg:${leg}:`));
   assert.ok(frames.some(({state:s})=>s.goal?.phase==='shot'&&s.homeScore===0&&!s.finished));
   assert.ok(frames.some(({state:s})=>s.goal?.phase==='confirmed'&&s.homeScore===1&&!s.finished));
   const last=report.minutes.find(value=>value.leg===leg&&value.minute===93)?.state;
   assert.ok(last);assert.equal(last.homeScore,1);assert.equal(last.awayScore,0);assert.equal(last.finished,true);assert.equal(last.goal,undefined);assert.equal(last.chance,undefined);
   const minutes=report.minutes.filter(value=>value.leg===leg).map(value=>value.minute);
   assert.ok(minutes.every((minute,index)=>index===0||minute>=minutes[index-1]),'Trocar velocidade não pode rebobinar o minuto');
   assert.equal(minutes.at(-1),93);
  }
  assert.ok(report.frames.some(({state:s})=>s.context.speed===.25&&s.minute>=before.minute));
  assert.deepEqual(errors,[]);
  fs.mkdirSync('test-results/complexo-3d',{recursive:true});
  fs.writeFileSync('test-results/complexo-3d/copa-relogio-unico-20261018.json',JSON.stringify({errors,pos:report.pos,minutes:report.minutes,firstEndAt:firstEnd.time,secondStartAt:secondStart.time,frameCount:report.frames.length},null,2));
  console.log('PASS Copa: ida e volta pelo relógio do campo, gol aos92 confirmado antes de mudar perna, velocidade sem retrocesso, resultado e pênaltis após o apito.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
