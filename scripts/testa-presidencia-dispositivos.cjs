const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const reports=[];
 for(const device of [{width:320,height:568,dpr:2},{width:390,height:844,dpr:3},{width:844,height:390,dpr:3},{width:768,height:1024,dpr:2}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:device.dpr,isMobile:true,hasTouch:true,locale:'pt-BR'});
  try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
   await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
   const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
   const state={context:{id:'device',speed:4,stadium:{inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']},home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
   const render=()=>page.evaluate(s=>window.renderScene(s.context.stadium,s),state);
   await render();await page.locator('.pe-live>summary').tap();await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
   await page.evaluate(()=>{window.frameSamples=[];window.frameObserver=new MutationObserver(()=>window.frameSamples.push({at:performance.now(),time:Number(document.querySelector('.pe-football-registered').dataset.time)}));window.frameObserver.observe(document.querySelector('.pe-football-registered'),{attributes:true,attributeFilter:['data-time']})});
   await page.waitForFunction(()=>window.frameSamples.length>=12,null,{timeout:60000});
   const samples=await page.evaluate(()=>{window.frameObserver.disconnect();return window.frameSamples});
   const elapsed=samples.at(-1).at-samples[0].at,seconds=samples.at(-1).time-samples[0].time;
   assert.ok(seconds>0,'The game continues at 4x');
   const ratio=seconds/(elapsed/1000);assert.ok(ratio>2&&ratio<6,'Shared 4x clock remains bounded even on a software renderer');
   state.paused=true;await render();await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.paused==='true');
   const ball=await page.locator('.pe-football-registered').getAttribute('data-ball');
   await page.getByRole('button',{name:'Aproximar campo',exact:true}).tap();
   await page.waitForTimeout(150);
   assert.equal(await page.locator('.pe-football-registered').getAttribute('data-ball'),ball);
   const pixels=await page.locator('.pe-football-registered canvas').evaluate(n=>({width:n.width,height:n.height,cssWidth:n.getBoundingClientRect().width}));
   assert.ok(pixels.width<=4096&&pixels.height<=4096);assert.ok(pixels.width>=pixels.cssWidth-.5,'Zoom keeps at least one rendered pixel per CSS pixel');
   state.context.id='bare-device';state.context.stadium={inv:{},ext:[]};await render();
   await page.waitForFunction(()=>document.querySelector('.pe-territory')&&document.querySelector('.pe-football-registered')?.dataset.players==='22');
   assert.equal(await page.locator('[data-world-layer="cober"]').count(),0);
   assert.deepEqual(errors,[]);
   const report={...device,observedFps:Math.round((samples.length-1)*1000/elapsed*10)/10,clockRatio:Math.round(ratio*100)/100,pixels};reports.push(report);console.log('PASS mobile emulation:',JSON.stringify(report));
  }finally{await context.close()}
 }
 fs.mkdirSync('test-results/futebol-3d',{recursive:true});fs.writeFileSync('test-results/futebol-3d/dispositivos.json',JSON.stringify({environment:'Chromium SwiftShader, mobile emulation; not physical devices',reports},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
