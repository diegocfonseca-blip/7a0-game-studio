const assert=require('node:assert/strict');
const {loadDependency}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright'),sharp=loadDependency('sharp');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const results=[];
 for(const automatic of [true,false]){
  const page=await browser.newPage({viewport:{width:800,height:900},locale:'pt-BR'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.drawCalls=0;for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){window.drawCalls++;return original.apply(this,args)}}});
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
  if(automatic)await page.route('**/src/escalacao/presidencia-futebol-3d.tsx*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('renderer.shadowMap.autoUpdate = false','renderer.shadowMap.autoUpdate = true')})});
  await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
  await page.evaluate(()=>{const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));window.renderScene(null,{context:{id:'shadows',stadium:{inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']},home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'})});
  await page.locator('.pe-live>summary').click();await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.waitForTimeout(300);
  await page.evaluate(()=>window.drawCalls=0);
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Aproximar campo',exact:true}).click();await page.waitForTimeout(150)}
  const calls=await page.evaluate(()=>window.drawCalls);
  const canvas=await page.locator('.pe-football-registered canvas').screenshot();
  results.push({calls,pixels:await sharp(canvas).ensureAlpha().raw().toBuffer()});
  assert.deepEqual(errors,[]);await page.close();
 }
 assert.equal(results[0].pixels.length,results[1].pixels.length);
 let changed=0;for(let i=0;i<results[0].pixels.length;i++)if(Math.abs(results[0].pixels[i]-results[1].pixels[i])>3)changed++;
 assert.ok(changed/results[0].pixels.length<.0001,'Cached shadows preserve the paused zoom image');
 assert.ok(results[1].calls<results[0].calls,'Paused zoom avoids redundant shadow draw calls');
 console.log('PASS: paused zoom shadow cache',JSON.stringify({automaticCalls:results[0].calls,cachedCalls:results[1].calls,changedChannels:changed}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
