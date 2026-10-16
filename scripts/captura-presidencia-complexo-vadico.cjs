const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1280,height:960},deviceScaleFactor:1},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const {name,...options}=device,context=await browser.newContext({...options,locale:'pt-BR',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(m.text()))errors.push(m.text());});
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    const stages=[];
    for(const stage of ['complete','empty']){
     if(stage==='empty'){
      await page.evaluate(()=>{window.previousVadicoApi=window.complexo3D;window.setComplexoStage('empty')});
      await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.previousVadicoApi);
     }
     await page.getByRole('button',{name:'Vadico Veículos',exact:true}).click();
     const check=await page.evaluate(async()=>{
      const THREE=await import('/7a0-game-studio/node_modules/three/build/three.module.js');
      const {PLANTA_VADICO}=await import('/7a0-game-studio/src/escalacao/presidencia-complexo-concessionaria.ts');
      const state=window.complexo3D.inspect(),b=PLANTA_VADICO.bounds;
      const camera=new THREE.PerspectiveCamera(state.cameraFov,state.viewport[0]/state.viewport[1],.12,4000);
      camera.position.fromArray(state.camera);camera.lookAt(new THREE.Vector3(...state.target));camera.updateMatrixWorld();
      const projected=[b.minX,b.maxX].flatMap(x=>[b.minZ,b.maxZ].flatMap(z=>[0,8].map(y=>new THREE.Vector3(x,y,z).project(camera).toArray())));
      return{state,projected,visibility:window.complexo3D.checkDealershipView()};
     });
     assert.equal(check.state.view,'vadico');assert(check.state.dealership,'loja integrada ao cenário');
     assert.equal(check.state.dealership.stockCount,6);
     assert.equal(check.state.dealership.sign.text,'Vadico Veículos');
     assert.equal(check.state.dealership.sign.source,'canvas-text','letreiro deve ser gerado no navegador');
     assert.equal(check.visibility.length,7);
     assert(check.visibility.every(target=>target.visible),`${name}: fachada/estoque ocultos: ${JSON.stringify(check.visibility.filter(target=>!target.visible))}`);
     assert(check.projected.every(([x,y,z])=>Math.abs(x)<.93&&Math.abs(y)<.9&&Math.abs(z)<1),name+': lote cortado');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow horizontal');
     assert.deepEqual(check.state.transport?.problems??[],[]);
     await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
     await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-vadico-${stage}.png`)});
     stages.push({stage,camera:check.state.camera,viewport:check.state.viewport,dealership:check.state.dealership,visibility:check.visibility});
     if(stage==='complete'){
      await page.evaluate(()=>window.complexo3D.view('original'));
      await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-vadico-mapa.png`)});
     }
     console.log(`${name}: Vadico Veículos enquadrada no estágio ${stage}`);
    }
    assert.deepEqual(errors,[]);report.push({device:name,stages,errors});
    fs.writeFileSync(path.join(out,'vadico-browser-report.json'),JSON.stringify(report,null,2));
   }finally{await context.close();}
  }
 }finally{await browser.close();}
 console.log('PASS Vadico: loja no estádio completo e várzea, fachada/carros enquadrados, desktop e celular, sem erros JS/WebGL.');
})().catch(e=>{console.error(e);process.exitCode=1;});
