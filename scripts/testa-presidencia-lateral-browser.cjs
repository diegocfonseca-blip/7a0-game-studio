const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright');
const goalkeeper=process.argv.includes('--goleiro');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1100,height:1000},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidencia-futebol-motor.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.qaThrowMotor=MotorFutebol;'});});
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
 await page.evaluate(async goalkeeper=>{
  await import('/7a0-game-studio/src/escalacao/presidencia-futebol-3d.tsx');const MotorFutebol=window.qaThrowMotor;
  const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
  window.throwState={context:{id:'throw-review',stadium:{inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']},home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
  const motor=new MotorFutebol(window.throwState),taker=motor.players.find(p=>p.key==='home:h1');taker.mx=0;taker.mz=-34;motor.prepareRestart('lateral',{x:0,z:-34},'home');
  const original=MotorFutebol.prototype.sample;window.throwFrames={};let prepared=false;
  for(let i=0;i<300;i++){
   const f=original.call(motor,window.throwState,i/60,i*1000/60);
   if(motor.throwIn)prepared=true;
   if(prepared&&!window.throwFrames.recolhe&&f.players.find(p=>p.key===taker.key).throwPreparation>.25)window.throwFrames.recolhe=f;
   if(prepared&&!window.throwFrames.preparo&&f.players.find(p=>p.key===taker.key).throwPreparation>.45)window.throwFrames.preparo=f;
   if(prepared&&motor.flight){window.throwFrames.soltura=f;window.throwFrames.voo=original.call(motor,window.throwState,(i+12)/60,(i+12)*1000/60);break}
  }
  window.throwPoint={x:0,z:-34};
  if(goalkeeper){
   const m=new MotorFutebol(window.throwState),chance={id:'catch-2',home:true,minute:20,startedAt:0,outcome:'defendeu'};
   original.call(m,{...window.throwState,chance},0,0);original.call(m,{...window.throwState,chance},0,600);
   window.throwFrames={maos:original.call(m,window.throwState,0,601),solta:original.call(m,window.throwState,.25,851),queda:original.call(m,window.throwState,.45,1051),pes:original.call(m,window.throwState,.65,1251)};
   const keeper=window.throwFrames.maos.players.find(p=>p.key===window.throwFrames.maos.owner);window.throwPoint={x:keeper.mx,z:keeper.mz};
  }
  window.throwFrame=window.throwFrames[goalkeeper?'maos':'soltura'];
  // Only this local fixture supplies a fixed snapshot for close-up inspection.
  MotorFutebol.prototype.sample=function(s,...args){return s.context.id==='throw-review'?window.throwFrame:original.call(this,s,...args)};
  window.renderScene(null,window.throwState);
 },goalkeeper);
 await page.locator('.pe-live>summary').click();await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22');
 await page.getByRole('button',{name:'VER CAMPO',exact:true}).click();
 const pixel=await page.evaluate(async()=>{const{matrizCameraRegistrada}=await import('/7a0-game-studio/src/escalacao/presidencia-camera-registrada.ts');const m=matrizCameraRegistrada([[220,400],[1290,400],[108,818],[1415,818]]),p=[window.throwPoint.x,0,window.throwPoint.z,1],v=[0,1,2,3].map(r=>p.reduce((s,n,c)=>s+n*m[r*4+c],0));return{x:(v[0]/v[3]+1)/2,y:(1-v[1]/v[3])/2}});
 const world=await page.locator('.pe-live-world').boundingBox(),view=await page.locator('.pe-live-viewport').boundingBox(),x=world.x+pixel.x*world.width,y=world.y+pixel.y*world.height;
 await page.mouse.move(x,y);await page.keyboard.down('Control');await page.mouse.wheel(0,-600);await page.keyboard.up('Control');
 await page.waitForFunction(()=>Number(document.querySelector('[data-field-zoom]').dataset.fieldZoom)>5);
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(view.x+view.width/2,view.y+view.height/2,{steps:8});await page.mouse.up();
 fs.mkdirSync('test-results/futebol-3d',{recursive:true});
 for(const name of (goalkeeper?['maos','solta','queda','pes']:['recolhe','preparo','soltura','voo'])){
  const ball=await page.evaluate(name=>{window.throwFrame=window.throwFrames[name];window.renderScene(null,{...window.throwState});return JSON.stringify(window.throwFrame.ball)},name);
  await page.waitForFunction(ball=>document.querySelector('.pe-football-registered')?.dataset.ball===ball,ball).catch(async e=>{console.log({name,expected:ball,actual:await page.locator('.pe-football-registered').getAttribute('data-ball'),errors});throw e});
  await page.locator('.pe-live-viewport').screenshot({path:`test-results/futebol-3d/${goalkeeper?'goleiro-distribuicao':'lateral'}-${name}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: real 3D renderer shows '+(goalkeeper?'catch, lowering, drop and foot control':'pickup, throw preparation, hand release and flight')+' in the registered stadium camera. Local fixed snapshots.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
