const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1400,height:1000}},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const page=await browser.newPage({...device,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
    for(const view of ['original','region']){
     await page.evaluate(v=>window.complexo3D.view(v),view);
     const state=await page.evaluate(()=>window.complexo3D.inspect());
     assert.equal(state.view,view);assert.deepEqual(state.circulation.problems,[]);
     assert(state.landscape.publicParks>0&&state.landscape.beltTrees>0&&state.landscape.clubTrees>0);
     assert(state.viewport[1]>=500,'mapa mantém área ampla no celular');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     await viewport.screenshot({path:path.join(out,`${device.name}-paisagismo-${view}.png`)});
     report.push({device:device.name,view,state});
    }
    const light=await page.evaluate(()=>window.complexo3D.checkLighting());assert.equal(light.invalidSamples,0);
    await page.evaluate(()=>{window.previousComplexo=window.complexo3D;window.setComplexoStage('empty')});
    await page.waitForFunction(()=>!!window.complexo3D&&window.complexo3D!==window.previousComplexo);
    await page.evaluate(()=>window.complexo3D.view('original'));
    const bare=await page.evaluate(()=>window.complexo3D.inspect());
    assert.deepEqual(bare.establishments,[]);assert.deepEqual(bare.circulation.problems,[]);
    assert.equal(bare.architecture.roof,false);assert.equal(bare.architecture.presidentBox,false);
    await viewport.screenshot({path:path.join(out,`${device.name}-paisagismo-varzea.png`)});
    assert.deepEqual(errors,[]);report.push({device:device.name,bare,light});
    console.log(`PASS ${device.name}: paisagismo no mapa/região, várzea sem compras concedidas, trajetos livres, viewport amplo, shaders válidos.`);
   }finally{await page.close()}
  }
  fs.writeFileSync(path.join(out,'paisagismo-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
