const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
// Local review only: no account, save writes or external requests.
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1400,height:1000}},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const page=await browser.newPage({...device,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(m.text()))errors.push(m.text())});
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
    for(const view of ['original','region','entrance','away-entrance','office','stands','loja']){
     await page.evaluate(view=>window.complexo3D.view(view),view);
     const state=await page.evaluate(()=>window.complexo3D.inspect());
     assert.equal(state.view,view);assert.deepEqual(state.circulation.problems,[]);
     assert(state.drawCalls>0);assert(state.viewport[1]>=500);
     assert(state.crowd.total>0,'QA explícito deve permitir conferir a torcida sentada');
     assert.equal(state.architecture.presidentialDriveway,false);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     await viewport.screenshot({path:path.join(out,`${device.name}-acabamento-${view}.png`)});
     report.push({device:device.name,view,state});
    }
    const light=await page.evaluate(()=>window.complexo3D.checkLighting());assert.equal(light.invalidSamples,0);
    await page.evaluate(()=>{window.previousComplexo=window.complexo3D;window.setComplexoStage('empty')});
    await page.waitForFunction(()=>!!window.complexo3D&&window.complexo3D!==window.previousComplexo);
    await page.evaluate(()=>window.complexo3D.view('original'));
    const bare=await page.evaluate(()=>window.complexo3D.inspect());
    assert.deepEqual(bare.establishments,[]);assert.deepEqual(bare.circulation.problems,[]);
    assert.equal(bare.crowd.total,0,'sem arquibancadas não há torcida sentada');
    assert.equal(bare.architecture.roof,false);assert.equal(bare.architecture.presidentBox,false);
    await viewport.screenshot({path:path.join(out,`${device.name}-acabamento-varzea.png`)});
    assert.deepEqual(errors,[]);report.push({device:device.name,bare,light});
    console.log(`PASS ${device.name}: mapa/região, portões, camarote, arquibancada e loja; várzea sem compras/público sentados; shaders e viewport.`);
   }finally{await page.close()}
  }
  fs.writeFileSync(path.join(out,'acabamento-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
