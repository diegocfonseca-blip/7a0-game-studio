const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
// Serial local capture after the functional suite. No account, save or network.
(async()=>{
 const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
 fs.mkdirSync(out,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 const report=[];
 try{
  for(const device of [
   {name:'desktop',side:'home',viewport:{width:1280,height:960},deviceScaleFactor:1},
   {name:'mobile',side:'away',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
  ]){
   const {name,side,...options}=device,context=await browser.newContext({...options,reducedMotion:'reduce',locale:'pt-BR'});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(m.text()))errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin)&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    await page.getByRole('button',{name:'Pausar passeio',exact:true}).click();
    const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
    await viewport.screenshot({path:path.join(out,`${name}-acabamento-superior-original.png`)});
    await page.evaluate(()=>window.setComplexoVisitDestination({tier:'upper',row:0}));
    await page.waitForFunction(()=>window.complexo3D.inspect().visitTier==='upper'&&window.complexo3D.inspect().visits.every(v=>v.seatId.includes(':upper:')));
    const first=await page.evaluate(()=>window.complexo3D.inspect()),actor=first.visits.find(v=>v.side===side);
    assert(actor);assert.equal(first.visits.length,2);assert.deepEqual(first.crowd.reserved,{home:1,away:1});
    const climbs=actor.stages.filter(s=>s.phase==='climbing'&&s.floorFrom>=5.7);
    const stages=[['climbing',climbs[Math.floor(climbs.length/2)]],['seated',actor.stages.find(s=>s.phase==='seated')]];
    for(const [phase,stage] of stages){
     assert(stage);const seconds=stage.at+stage.duration*.5;
     const state=await page.evaluate(({side,seconds})=>{window.complexo3D.seekCirculation(seconds);window.complexo3D.view(`follow-${side}`);return window.complexo3D.inspect();},{side,seconds});
     const current=state.visits.find(v=>v.side===side);
     assert.equal(current.rigId,actor.rigId);assert.equal(current.pose.phase,phase);
     assert.deepEqual(current.problems,[]);assert.deepEqual(state.circulation.problems,[]);
     await viewport.screenshot({path:path.join(out,`${name}-acabamento-superior-${phase}.png`)});
     report.push({device:name,phase,pose:current.pose,camera:state.camera,target:state.target,viewport:state.viewport,canvas:state.canvas,architecture:state.architecture});
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    const lighting=await page.evaluate(()=>window.complexo3D.checkLighting());assert.equal(lighting.invalidSamples,0);
    assert.deepEqual(errors,[]);report.push({device:name,lighting,errors});
    console.log(`PASS ${name}: mapa completo e concreto em subida/assento, rig e apoio preservados, sem erros JS/WebGL.`);
   }finally{await context.close();}
  }
  fs.writeFileSync(path.join(out,'acabamento-superior-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
