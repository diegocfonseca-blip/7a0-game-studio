const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',output='test-results/futebol-continuo-20261016',fixture='qa-presidencia-futebol-continuo-20261016.html';
(async()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(output,'visual.json'),'utf8')),hashes=()=>Object.fromEntries(Object.keys(baseline.sourceHashes).map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 assert.deepEqual(hashes(),baseline.sourceHashes,'Mesmo produto e fixture da rodada completa');
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),errors=[],samples=[];let overrides=0;
 try{
  const context=await browser.newContext({viewport:{width:390,height:850},locale:'pt-BR'}),page=await context.newPage();page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();
   if(!url.includes(fixture))return route.continue();
   const response=await route.fetch(),body=await response.text(),pattern=/addScaledVector\(side,\s*-2\.8\)/g;
   const changed=body.replace(pattern,()=>{overrides++;return 'addScaledVector(side,2.8)'});
   return route.fulfill({response,body:changed});
  });
  await page.goto(`${origin}/7a0-game-studio/${fixture}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.qaFootball?.ready()&&window.qaFootball.assets().pending===0);
  for(const stage of ['bare','full']){
   await page.evaluate(stage=>window.qaFootball.configure({stage,play:'assist',outcome:'goal'}),stage);
   await page.waitForFunction(()=>window.qaFootball.assets().pending===0);
   const sample=await page.evaluate(()=>window.qaFootball.phase('pass-contact','feet'));
   assert.equal(sample.players.length,22);assert(sample.renderMatchesFrame&&sample.renderedPlayersMatch);assert(Math.abs(sample.ballToBootSurface-.11)<.025);assert(sample.ball.surfaceRadii.every(r=>Math.abs(r-.11)<1e-7));
   const name=`${stage}-390-assist-pass-contact`;
   await page.locator('.stage').screenshot({path:path.join(output,name+'.png'),timeout:60000});samples.push({name,...sample});console.log('PASS close do passe '+stage);
  }
  assert.equal(overrides,1,'Somente sinal lateral da câmera diagnóstica mudou');assert.deepEqual(errors,[]);assert.deepEqual(hashes(),baseline.sourceHashes);
  fs.writeFileSync(path.join(output,'passe-close.json'),JSON.stringify({sourceHashes:hashes(),fixtureCameraOverride:'Câmera do close no lado oposto (side +2.8m). Alteração só na resposta local do fixture; fontes do produto e do fixture intactas.',samples,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
