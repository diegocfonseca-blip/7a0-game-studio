const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',output=path.resolve('test-results/complexo-3d');
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const fakeAuth=`let user={email:'outro@example.com'},listeners=[];window.qaSetUser=email=>{user=email?{email}:null;listeners.forEach(fn=>fn('SIGNED_IN',null))};export const supabase={auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}}}};`;
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),reports=[];
 try{for(const device of [{name:'desktop',viewport:{width:1400,height:1000},deviceScaleFactor:1},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
  const {name,...options}=device,context=await browser.newContext({...options,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  // Only the network client is stubbed. The production account hook, getUser
  // verification and sign-out subscription run unmodified against local data.
  await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:fakeAuth}));
  await page.goto(origin+'/7a0-game-studio/qa-presidencia-publicacao.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.qaSetUser&&!!window.qaCareer);await frame(page);
  assert.equal(await page.locator('[data-presidencia-complexo-carreira]').count(),0,'outra conta não recebe a tela 3D');
  const baseline=await page.evaluate(()=>JSON.stringify(window.qaCareer));
  await page.evaluate(()=>window.qaSetUser('diego.c.fonseca@gmail.com'));
  await page.waitForFunction(()=>!!window.qaPublishedApi);await frame(page);
  let state=await page.evaluate(()=>window.qaPublishedApi.inspect());
  assert.equal(state.journey.kickoffTime,'21:00');assert.equal(state.lighting.period,'night');assert.equal(state.match.players,22);
  assert.equal(state.crowd.mode,'career');assert.equal(state.state.parking.stage,4);
  await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();
  await page.locator('.pc3-review').screenshot({path:path.join(output,`${name}-publicacao-conta-privada.png`)});
  const identity=await page.evaluate(()=>{window.qaFirstApi=window.qaPublishedApi;return window.qaPublishedApi.inspect().camera});
  await page.evaluate(()=>window.qaSetRound(2));await frame(page);
  state=await page.evaluate(()=>window.qaPublishedApi.inspect());
  assert.equal(await page.evaluate(()=>window.qaFirstApi===window.qaPublishedApi),true,'nova rodada não remonta mapa');
  assert.deepEqual(state.camera,identity);assert.equal(state.journey.kickoffTime,'16:00');assert.equal(state.lighting.period,'day');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.qaCareer)),baseline,'apresentação não altera carreira');
  await page.evaluate(()=>window.qaEmpty());await page.waitForFunction(()=>window.qaPublishedApi&&window.qaPublishedApi!==window.qaFirstApi);
  state=await page.evaluate(()=>window.qaPublishedApi.inspect());assert.equal(state.architecture.roof,false);assert.equal(state.match.players,22,'mesmo jogo na várzea');
  await page.evaluate(()=>window.qaPublishedApi.view('field'));await frame(page);
  await page.locator('.pc3-review').screenshot({path:path.join(output,`${name}-publicacao-varzea-partida.png`)});
  await page.evaluate(()=>window.qaFinish());await frame(page);
  state=await page.evaluate(()=>window.qaPublishedApi.inspect());assert.equal(state.journey.phase,'departure');
  await page.evaluate(()=>window.qaSetUser(null));await page.waitForFunction(()=>!window.qaPublishedApi);
  assert.equal(await page.locator('[data-presidencia-complexo-carreira]').count(),0,'logout remove a prévia');
  assert.deepEqual(errors,[]);reports.push({device:name,passed:true,verifiedEmailGate:true,logout:true,sharedClock:true,calendar:true,parking:true,saveUnchanged:true});
  fs.writeFileSync(path.join(output,'publicacao-browser-report.json'),JSON.stringify(reports,null,2));
  console.log('PASS '+name+': tela da carreira, acesso exclusivo, calendário, 22 atletas, obras e logout');await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
