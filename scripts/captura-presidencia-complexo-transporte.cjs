const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
const viewsOnly=process.argv.includes('--views-only');
async function overview(page,name,stage){
 await page.evaluate(()=>{
  const metro=window.complexo3D.inspect().transport.vehicles.find(v=>v.kind==='metro');
  window.complexo3D.seekCirculation(metro.markers.doorsOpen+1);window.complexo3D.view('original');
 });
 const framing=await page.evaluate(async()=>{
  const THREE=await import('/7a0-game-studio/node_modules/three/build/three.module.js');
  const {gerarPlantaTransporte}=await import('/7a0-game-studio/src/escalacao/presidencia-complexo-transporte-model.ts');
  const state=window.complexo3D.inspect(),plan=gerarPlantaTransporte(state.state),station=plan.station;
  const camera=new THREE.PerspectiveCamera(state.cameraFov,state.viewport[0]/state.viewport[1],.12,4000);
  camera.position.fromArray(state.camera);camera.lookAt(new THREE.Vector3(...state.target));camera.updateMatrixWorld();
  const vertices=[...[-station.length/2,station.length/2].flatMap(x=>[-9.75,9.75].flatMap(z=>[7.72,13.01].map(y=>station.point(x,z,y)))),
   ...station.accesses.flatMap(access=>access.surfaces.flatMap(s=>s.polygon.flatMap(p=>[{...p,y:s.y},{...p,y:s.y+(s.kind==='platform'?3.1:s.kind==='stair'?1.1:0)}])))];
  const projected=vertices.map(p=>new THREE.Vector3(p.x,p.y,p.z).project(camera).toArray());
  return {camera:state.camera,target:state.target,viewport:state.viewport,projected};
 });
 assert(framing.projected.every(([x,y,z])=>Math.abs(x)<.93&&Math.abs(y)<.90&&Math.abs(z)<1),`${name}: estação ou escadaria cortada na vista geral`);
 await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
 await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-estacionamento-etapa${stage}.png`)});
 return framing;
}
(async()=>{
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1280,height:960},deviceScaleFactor:1},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const {name,...options}=device,context=await browser.newContext({...options,locale:'pt-BR',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(m.text()))errors.push(m.text());});
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.complexo3D);
    const initial=await page.evaluate(()=>window.complexo3D.inspect()),initialMetro=initial.transport.vehicles.find(v=>v.kind==='metro');
    assert.equal(initialMetro.carriages,5,'composição completa desde a abertura do mapa');
    assert.equal(initialMetro.speed,0,'mapa abre com trem na plataforma');
    assert(Math.hypot(initialMetro.position.x-initialMetro.stop.position.x,initialMetro.position.z-initialMetro.stop.position.z)<.001);
    await page.evaluate(()=>{
     const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
     window.setComplexoMatch({context:{id:'metro-passarelas-local',home:team('h'),away:team('a'),speed:4},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,
      homeColor:'#1b7a3d',awayColor:'#c2452f',visualClock:{seconds:14,sampledAt:performance.now(),running:false,rate:4}});
    });
    await page.waitForFunction(()=>window.complexo3D.inspect().match.players===22);
    const owned=await page.evaluate(()=>window.complexoParkingQA.snapshot().save.ext.filter(k=>k!=='estac'));
    assert(owned.includes('estacao'));
    if(!viewsOnly){
     await page.evaluate(()=>{window.previousTransportApi=window.complexo3D;window.complexoParkingQA.reset()});
     await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.previousTransportApi);
    }
    const parkingStages=[],overviews=[];
    for(let stage=viewsOnly?4:0;stage<=4;stage++){
     if(stage&&!viewsOnly){
      await page.evaluate(()=>{window.previousTransportApi=window.complexo3D});
      await page.getByRole('button',{name:`Comprar etapa ${stage} · ${stage===4?10:20} moedas`,exact:true}).click();
      await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.previousTransportApi);
     }
     const check=await page.evaluate(()=>({state:window.complexo3D.inspect(),purchase:window.complexoParkingQA.snapshot()}));
     assert.equal(check.state.state.parking.stage,stage);
     assert.equal(check.state.state.parking.capacity,[0,9,16,46,79][stage]);
     if(!viewsOnly)assert.equal(check.purchase.cash,[70,50,30,10,0][stage]);
     assert.deepEqual(check.purchase.save.ext.filter(k=>k!=='estac'),owned,'compras preservam estação e demais melhorias');
     assert.equal(check.state.state.extras.estacao,true);
     assert(check.state.transport.vehicles.some(v=>v.kind==='metro'));
     assert.deepEqual(check.state.transport.problems,[]);
     parkingStages.push({stage,capacity:check.state.state.parking.capacity,cash:check.purchase.cash,station:true});
     if(stage===1||stage===4)overviews.push({stage,...await overview(page,name,stage)});
     console.log(`${name}: estacionamento ${stage}/4 preserva estação e demais melhorias`);
    }
    if(viewsOnly&&name==='mobile'){
     await page.setViewportSize({width:320,height:844});
     await page.waitForFunction(()=>window.complexo3D.inspect().viewport[0]===300);
     overviews.push({stage:4,...await overview(page,'mobile-320px',4)});
     await page.setViewportSize(options.viewport);
     await page.waitForFunction(()=>window.complexo3D.inspect().viewport[0]===370);
    }
    await page.evaluate(()=>window.complexo3D.view('estacao'));
    await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
    await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-metro-passarelas.png`)});
    const state=await page.evaluate(()=>{
     const metro=window.complexo3D.inspect().transport.vehicles.find(v=>v.kind==='metro');
     window.complexo3D.seekCirculation(metro.markers.doorsOpen+1);window.complexo3D.view('metro');
     return window.complexo3D.inspect();
    });
    const metro=state.transport.vehicles.find(v=>v.kind==='metro'),passenger=state.transport.passengers.find(p=>p.vehicleId===metro.id);
    assert.equal(state.match.time,14,'relógio decorativo do metrô não altera a partida oficial');assert.equal(state.match.players,22);
    assert.equal(state.view,'metro');assert.equal(metro.speed,0);assert.equal(metro.doorsOpen,1);assert.equal(passenger.phase,'alighting');assert(passenger.pose.visible);
    assert(Math.abs(state.camera[1]-(metro.stop.position.y+metro.floorHeight+1.7))<1e-6,'câmera à altura humana na plataforma');
    assert.equal(state.transport.problems.length,0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
    await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-transporte-metro-plataforma.png`)});
    assert.deepEqual(errors,[]);report.push({device:name,parkingStages,overviews,camera:state.camera,target:state.target,viewport:state.viewport,phase:passenger.phase,passenger:passenger.pose});
    fs.writeFileSync(path.join(out,viewsOnly?'transporte-enquadramento-report.json':'transporte-camera-report.json'),JSON.stringify(report,null,2));console.log(`PASS ${name}: estação inteira na vista geral; câmera do metrô na plataforma, corpo e porta para conferência visual.`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
