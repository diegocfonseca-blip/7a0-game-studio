const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),reports=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1400,height:1000}},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const page=await browser.newPage({...device,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(90000);
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Boolean(window.complexo3D));
    const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
    const lighting=await page.evaluate(()=>window.complexo3D.checkLighting());assert.equal(lighting.invalidSamples,0);assert(lighting.litSamples>0);
    for(const view of ['original','field','entrance']){
     await page.evaluate(value=>window.complexo3D.view(value),view);
     await viewport.screenshot({path:path.join(out,`${device.name}-refino-${view}.png`)});
    }
    await page.evaluate(()=>window.complexo3D.view('field'));
    // Read the camera pose and verify both goal mouths, independently of fit().
    const field=await page.evaluate(async()=>{
     const THREE=await import('/7a0-game-studio/node_modules/three/build/three.module.js');
     const state=window.complexo3D.inspect(),node=document.querySelector('[data-complexo-3d]');
     const camera=new THREE.PerspectiveCamera(38,node.clientWidth/node.clientHeight,.12,4000);
     camera.position.fromArray(state.camera);camera.lookAt(new THREE.Vector3(...state.target));camera.updateMatrixWorld();
     const goals=[-54.5,54.5].flatMap(x=>[-3.66,3.66].flatMap(z=>[0,2.44].map(y=>new THREE.Vector3(x,y,z).project(camera).toArray())));
     return {goals,state,width:node.clientWidth,height:node.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert(field.goals.every(([x,y,z])=>Math.abs(x)<1&&Math.abs(y)<1&&z>=-1&&z<=1),`${device.name}: gol cortado em Ver campo`);
    assert(!field.overflow);assert(field.height>=460);
    assert.deepEqual(field.state.circulation.problems,[],'amostra precisa de piso/rotas válidos');
    assert(field.state.circulation.pedestrian&&field.state.circulation.cars.some(Boolean));
    await page.evaluate(()=>{window.beforeClosed=window.complexo3D;window.setComplexoStage('closed')});
    await page.waitForFunction(()=>Boolean(window.complexo3D&&window.complexo3D!==window.beforeClosed));
    await page.evaluate(()=>window.complexo3D.view('field'));
    const closed=await page.evaluate(()=>window.complexo3D.inspect());assert(closed.camera[1]<18,'câmera do campo deve entrar sob o teto fechado');
    await viewport.screenshot({path:path.join(out,`${device.name}-refino-dentro-teto.png`)});
    assert.deepEqual(errors,[]);
    reports.push({device:device.name,lighting,field,closedCamera:closed.camera});
    console.log(`PASS ${device.name}: dois gols enquadrados, campo sob teto fechado, ${field.width}×${field.height}, circulação ativa e shaders finitos.`);
   }finally{await page.close()}
  }
  fs.writeFileSync(path.join(out,'enquadramento-report.json'),JSON.stringify(reports,null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
