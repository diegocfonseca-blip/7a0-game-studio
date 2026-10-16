const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
const inspect=page=>page.evaluate(()=>window.complexo3D.inspect());
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
function check(state,seconds){
 assert.deepEqual(state.transport.problems,[]);assert.deepEqual(state.circulation.problems,[]);
 assert.equal(state.match.players,22);assert.equal(state.match.time,14);
 if(seconds!==undefined){assert.equal(state.transport.seconds,seconds);assert.equal(state.circulation.seconds,seconds);}
 for(const side of ['home','away','cars'])assert(state.flow.used[side]<=state.flow.budget[side]+state.flow.draining[side]);
 assert.equal(state.flow.used.home,state.visits.filter(v=>v.side==='home').length+state.circulation.pedestrians.length+state.circulation.fans.filter(v=>v.side==='home').length+state.transport.passengers.filter(v=>v.side==='home').length);
 assert.equal(state.flow.used.away,state.visits.filter(v=>v.side==='away').length+state.circulation.fans.filter(v=>v.side==='away').length+state.transport.passengers.filter(v=>v.side==='away').length);
}
const slim=state=>({flow:state.flow,view:state.view,camera:state.camera,target:state.target,viewport:state.viewport,
 transport:{...state.transport,vehicles:state.transport.vehicles.map(({route,stages,...v})=>v),passengers:state.transport.passengers.map(({route,stages,...v})=>v)},parking:state.state.parking,match:state.match});
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());const report=[];
 try{
  for(const device of [{name:'desktop',viewport:{width:1280,height:960},deviceScaleFactor:1},
   {name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
   const {name,...options}=device,context=await browser.newContext({...options,locale:'pt-BR',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(m.text()))errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin)&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.complexo3D);
    await page.getByRole('button',{name:'Pausar passeio',exact:true}).click();
    await page.evaluate(()=>{
     const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
     window.setComplexoMatch({context:{id:'transporte-local',home:team('h'),away:team('a'),speed:4},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,
      homeColor:'#1b7a3d',awayColor:'#c2452f',visualClock:{seconds:14,sampledAt:performance.now(),running:false,rate:4}});
     window.transportOriginalApi=window.complexo3D;window.transportOriginalCanvas=document.querySelector('[data-complexo-3d] canvas');
    });
    await frames(page);await page.emulateMedia({reducedMotion:'no-preference'});await frames(page);
    const initial=await inspect(page);check(initial);
    assert.equal(initial.transport.vehicles.length,3);assert.equal(initial.transport.passengers.length,3);
    assert(initial.viewport[1]>=500);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const identities=new Map(initial.transport.passengers.map(p=>[p.id,p.rigId]));const captures=[];
    for(const kind of ['metro','bus','car']){
     const vehicle=initial.transport.vehicles.find(v=>v.kind===kind),passenger=initial.transport.passengers.find(p=>p.vehicleId===vehicle.id);
     assert(vehicle&&passenger&&passenger.rigId);
     const view=kind==='metro'?'metro':kind==='bus'?'onibus':'estacionamento';
     for(const [phase,seconds] of [['alighting',vehicle.markers.doorsOpen+1],['walking',vehicle.markers.exitClear+2],['at-gate',vehicle.markers.atGate+1],['boarding',vehicle.markers.boarding+1]]){
      const state=await page.evaluate(({seconds,view})=>{window.complexo3D.seekCirculation(seconds);window.complexo3D.view(view);return window.complexo3D.inspect();},{seconds,view:phase==='at-gate'?(kind==='metro'?'away-entrance':'entrance'):view});check(state,seconds);
      const actor=state.transport.passengers.find(p=>p.id===passenger.id),current=state.transport.vehicles.find(v=>v.id===vehicle.id);
      assert.equal(actor.rigId,identities.get(actor.id));assert.equal(actor.phase,phase);assert(actor.pose.visible);
      if(['alighting','boarding'].includes(phase)){assert.equal(current.speed,0);assert.equal(current.doorsOpen,1);}
      if(phase==='walking'&&kind==='car')assert.equal(current.speed,0,'van aguarda dentro da vaga');
      if(phase==='alighting'){
       await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
       await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-transporte-${kind}-desembarque.png`)});
      }
      captures.push({kind,phase,state:slim(state)});
     }
    }
    const paused=await inspect(page);await frames(page);const frozen=await inspect(page);assert.deepEqual(frozen.transport,paused.transport);
    assert(await page.evaluate(()=>window.transportOriginalApi===window.complexo3D&&window.transportOriginalCanvas===document.querySelector('[data-complexo-3d] canvas')));
    await page.evaluate(()=>window.setComplexoPopulation({qaPopulation:false}));await frames(page);
    const absent=await inspect(page);assert.equal(absent.transport,undefined);assert.equal(absent.visits.length,0);assert.equal(absent.crowd.total,0);
    await page.evaluate(()=>window.setComplexoPopulation({qaPopulation:false,day:{division:'A',support:76,rain:false,match:'playing'}}));await frames(page);
    const career=await inspect(page);check(career);
    assert(career.transport.passengers.every(p=>p.source==='career'&&p.side==='home'),'sem dados adversários não inventa visitantes no metrô');
    assert.equal(career.flow.budget.home,career.circulation.attendance.outside);assert.equal(career.flow.budget.away,0);
    assert(await page.evaluate(()=>window.transportOriginalApi===window.complexo3D&&window.transportOriginalCanvas===document.querySelector('[data-complexo-3d] canvas')));
    await page.evaluate(()=>window.setComplexoPopulation({qaPopulation:false,day:{division:'V',support:10,rain:false,match:'idle'}}));await frames(page);
    await page.evaluate(()=>window.complexo3D.seekCirculation(180));await frames(page);
    const idleTransport=await inspect(page);check(idleTransport,180);
    await page.evaluate(()=>window.setComplexoPopulation({qaPopulation:false,day:{division:'V',support:10,rain:false,match:'playing'}}));await frames(page);
    const playingTransport=await inspect(page);check(playingTransport,180);
    for(const vehicle of idleTransport.transport.vehicles){
     const current=playingTransport.transport.vehicles.find(v=>v.id===vehicle.id);
     assert(current);assert.equal(current.rigId,vehicle.rigId);assert.deepEqual(current.position,vehicle.position);assert.equal(current.heading,vehicle.heading);
    }
    for(const passenger of idleTransport.transport.passengers){
     const current=playingTransport.transport.passengers.find(p=>p.id===passenger.id);
     assert(current);assert.equal(current.rigId,passenger.rigId);assert.deepEqual(current.pose,passenger.pose);
    }
    assert(await page.evaluate(()=>window.transportOriginalApi===window.complexo3D&&window.transportOriginalCanvas===document.querySelector('[data-complexo-3d] canvas')));
    await page.evaluate(()=>window.setComplexoPopulation({qaPopulation:true}));await frames(page);
    console.log(`${name}: três chegadas, desembarques, portões e embarques; orçamento e relógios conferidos`);
    // Real transaction function applied only to this isolated QA save.
    await page.evaluate(()=>{window.previousTransportApi=window.complexo3D;window.complexoParkingQA.reset();});
    await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.previousTransportApi);await frames(page);
    const resetState=await inspect(page);assert.equal(resetState.state.parking.stage,0);
    assert.equal(resetState.state.extras.estacao,true,'reiniciar estacionamento preserva estação já comprada');
    const parkingStages=[];
    for(const [i,capacity] of [9,16,46,79].entries()){
     if(name==='mobile'&&i>0)break;
     const before=await page.evaluate(()=>window.complexoParkingQA.snapshot());
     await page.evaluate(()=>{window.previousTransportApi=window.complexo3D;});
     await page.getByRole('button',{name:`Comprar etapa ${i+1} · ${i===3?10:20} moedas`,exact:true}).click();
     await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.previousTransportApi);await frames(page);
     const state=await inspect(page);check(state);assert.equal(state.state.parking.stage,i+1);assert.equal(state.state.parking.capacity,capacity);
     const purchase=await page.evaluate(()=>window.complexoParkingQA.snapshot());
     assert.equal(before.cash-purchase.cash,i===3?10:20);assert.equal(purchase.save.ext.includes('estac'),i===3);
     assert.equal(state.transport.vehicles.some(v=>v.kind==='car'),true);assert.equal(state.transport.vehicles.some(v=>v.kind==='metro'),true,'expandir estacionamento preserva estação já comprada');
     const stale=await page.evaluate(stage=>window.complexoParkingQA.buy(stage),i);assert.equal(stale.ok,false);assert.equal(stale.error,'stale-stage');
     assert.deepEqual(await page.evaluate(()=>window.complexoParkingQA.snapshot()),purchase);
     if(i===0||i===3){
      await page.evaluate(()=>{const metro=window.complexo3D.inspect().transport.vehicles.find(v=>v.kind==='metro');window.complexo3D.seekCirculation(metro.markers.doorsOpen+1);window.complexo3D.view('original')});await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
      await page.locator('[data-complexo-3d]').screenshot({path:path.join(out,`${name}-estacionamento-etapa${i+1}.png`)});
     }
     parkingStages.push({parking:state.state.parking,cash:purchase.cash});
     console.log(`${name}: estacionamento etapa ${i+1}, ${capacity} vagas`);
    }
    assert.equal(await page.locator('[data-complexo-3d] canvas').count(),1);assert.deepEqual(errors,[]);
    report.push({device:name,captures,parkingStages});fs.writeFileSync(path.join(out,'transporte-browser-report.json'),JSON.stringify(report,null,2));
    console.log(`PASS ${name}: transporte sincronizado e compras progressivas locais, sem erros JS/WebGL.`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
