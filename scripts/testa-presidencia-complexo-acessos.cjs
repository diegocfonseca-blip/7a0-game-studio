const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1400,height:1000}},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const page=await browser.newPage({...device,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(90000);
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
    const first=await page.evaluate(()=>window.complexo3D.inspect());
    assert.equal(first.architecture.plant,'reference-inferred-oval');
    assert.equal(first.architecture.presidentialDriveway,false);
    assert.equal(first.architecture.presidentBox,true);
    assert.deepEqual(first.circulation.problems,[]);
    assert.deepEqual(first.circulation.fans.map(f=>f.side),['home','away']);
    for(const view of ['original','entrance','away-entrance','office']){
     await page.evaluate(view=>{
      const api=window.complexo3D;
      if(view==='entrance'||view==='away-entrance'){
       const side=view==='entrance'?'home':'away',fan=api.inspect().circulation.fans.find(f=>f.side===side);
       api.seekCirculation(fan.period*.43);
      }
      api.view(view);
     },view);
     const state=await page.evaluate(()=>window.complexo3D.inspect());
     assert.equal(state.view,view);assert(state.drawCalls>0);
     if(view==='office'){
      const box=state.architecture.box;
      assert(state.camera[0]>box.minX&&state.camera[0]<box.maxX);
      assert(state.camera[1]>box.floor&&state.camera[1]<box.ceiling);
      assert(state.camera[2]>box.minZ&&state.camera[2]<box.maxZ);
      assert.equal(state.target[2],0,'janela voltada ao campo');
     }
     await viewport.screenshot({path:path.join(out,`${device.name}-oval-${view}.png`)});
    }
    const projections=await page.evaluate(async()=>{
     const T=await import('/7a0-game-studio/node_modules/three/build/three.module.js'),api=window.complexo3D;
     const result=[];
     for(const [view,side]of [['entrance','home'],['away-entrance','away']]){
      api.view(view);const s=api.inspect(),g=s.architecture.portals[side],c=new T.PerspectiveCamera(s.cameraFov,s.viewport[0]/s.viewport[1],.12,4000);
      c.position.fromArray(s.camera);c.lookAt(new T.Vector3(...s.target));c.updateMatrixWorld();
      result.push(new T.Vector3(g.threshold.x,1.7,g.threshold.z).project(c).toArray());
     }
     return result;
    });
    assert(projections.every(([x,y,z])=>Math.abs(x)<.95&&Math.abs(y)<.95&&z>=-1&&z<=1),'portões enquadrados');
    const light=await page.evaluate(()=>window.complexo3D.checkLighting());assert.equal(light.invalidSamples,0);
    await page.evaluate(()=>{window.previousComplexo=window.complexo3D;window.setComplexoStage('empty')});
    await page.waitForFunction(()=>!!window.complexo3D&&window.complexo3D!==window.previousComplexo&&window.complexo3D.inspect().state.progress.camarote===0);
    const bare=await page.evaluate(()=>window.complexo3D.inspect());
    assert.equal(bare.architecture.presidentBox,false);assert.equal(bare.architecture.roof,false);
    assert.deepEqual(bare.circulation.problems,[]);assert.equal(bare.circulation.fans.length,2);
    assert.equal(await page.getByRole('button',{name:'Camarote da Presidência',exact:true}).count(),0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.deepEqual(errors,[]);report.push({device:device.name,first,bare,projections,light});
    console.log(`PASS ${device.name}: oval, camarote dentro da estrutura, torcidas separadas, portões enquadrados e várzea sem obras concedidas.`);
   }finally{await page.close()}
  }
  fs.writeFileSync(path.join(out,'acessos-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
