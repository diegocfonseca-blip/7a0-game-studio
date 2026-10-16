const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selector = '[data-complexo-3d]';
const inspect = page => page.evaluate(() => window.complexo3D.inspect());
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const summary = state => ({view:state.view, following:state.following, camera:state.camera, target:state.target,
  viewport:state.viewport, canvas:state.canvas, match:state.match, visitTier:state.visitTier, visitRow:state.visitRow,
  visits:state.visits.map(({stages,...visit})=>visit), reservations:state.crowd.reservations,
  reserved:state.crowd.reserved, pedestrians:state.circulation.pedestrians.map(({stages,...person})=>person)});
function coherent(state, seconds) {
  assert.equal(state.visitTier, 'upper'); assert.equal(state.visitRow, 0);
  assert.equal(state.architecture.accessibleSeats.length, 8);
  assert.deepEqual(state.visits.map(v=>v.side).sort(), ['away','home']);
  assert.deepEqual(state.crowd.reserved, {home:1,away:1});
  assert.equal(state.crowd.total + state.visits.length <= state.crowd.sampleLimit, true);
  assert.deepEqual(state.crowd.reservations.slice().sort(), state.visits.map(v=>v.seatId).sort());
  assert.deepEqual(state.circulation.problems, []);
  for (const visit of state.visits) {
    assert.deepEqual(visit.problems, []);
    assert(state.architecture.accessibleSeats.some(a=>a.tier==='upper'&&a.row===0&&a.side===visit.side&&a.seatId===visit.seatId));
    assert(!state.crowd.seats.some(s=>s.id===visit.seatId));
    assert(!state.circulation.fans.some(f=>f.side===visit.side));
    if(seconds!==undefined) assert.equal(visit.seconds,seconds);
  }
  assert.deepEqual(state.circulation.pedestrians.map(p=>p.destination).sort(), ['chopp','hotel','loja']);
  if(seconds!==undefined) assert.equal(state.circulation.seconds, seconds);
  assert.equal(state.match.time,14,'movimentação decorativa não muda relógio oficial');
  assert.equal(state.match.players,22);
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await loadDependency('playwright').chromium.launch(browserOptions());
  const report=[];
  try {
    for(const device of [
      {name:'desktop',side:'home',viewport:{width:1280,height:960},deviceScaleFactor:1},
      {name:'mobile',side:'away',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    ]) {
      const {name,side,...options}=device;
      const context=await browser.newContext({...options,locale:'pt-BR',reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];page.setDefaultTimeout(120_000);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(origin)&&!response.url().endsWith('/favicon.ico'))errors.push(`${response.status()} ${response.url()}`);});
      await page.route('**/*',route=>route.request().url().startsWith(`${origin}/`)?route.continue():route.abort());
      try {
        await page.goto(`${origin}/7a0-game-studio/qa-presidencia-complexo-3d.html`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>!!window.complexo3D);
        await page.getByRole('button',{name:'Pausar passeio',exact:true}).click();
        await page.evaluate(()=>{
          const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
          window.upperMatch={context:{id:'upper-local',home:team('h'),away:team('a'),speed:1},minute:20,
            homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f',
            visualClock:{seconds:14,sampledAt:performance.now(),running:false,rate:1}};
          window.setComplexoMatch(window.upperMatch);
          window.setComplexoVisitDestination({tier:'upper',row:0});
          window.upperOriginalApi=window.complexo3D;
          window.upperOriginalCanvas=document.querySelector('[data-complexo-3d] canvas');
        });
        await frames(page);await page.emulateMedia({reducedMotion:'no-preference'});await frames(page);
        const initial=await inspect(page);coherent(initial);
        assert(initial.viewport[1]>=500);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.deepEqual(await page.getByLabel('Destino da visita local').locator('option').evaluateAll(nodes=>nodes.map(n=>n.value).sort()),['lower:0','lower:10','lower:5','upper:0']);
        const captures=[];
        for(const actorSide of ['home','away']) {
          const actor=initial.visits.find(v=>v.side===actorSide);
          const climbs=actor.stages.filter(s=>s.phase==='climbing'&&s.floorFrom>=5.7);
          assert(climbs.length>=15, 'dois lances físicos chegam ao segundo andar');
          const landing=actor.stages.find(s=>['walking','turning'].includes(s.phase)&&s.floorFrom>6&&s.floorTo<9);
          assert(landing,'patamar tem percurso próprio');
          const steps=[['climbing',climbs[Math.floor(climbs.length/2)]],['landing',landing],
            ['seated',actor.stages.find(s=>s.phase==='seated')],['descending',actor.stages.find(s=>s.phase==='descending'&&s.floorFrom>=8.8)]];
          for(const [phase,stage] of steps) {
            assert(stage,phase);const seconds=stage.at+stage.duration*.5;
            const current=await page.evaluate(({seconds,actorSide})=>{window.complexo3D.seekCirculation(seconds);window.complexo3D.view(`follow-${actorSide}`);return window.complexo3D.inspect();},{seconds,actorSide});
            coherent(current,seconds);
            const person=current.visits.find(v=>v.side===actorSide);
            assert.equal(person.rigId,actor.rigId);assert.equal(current.following,actorSide);
            for(const [i,axis] of ['x','y','z'].entries())assert(Math.abs(current.target[i]-person.pose.hip[axis]-(axis==='y'?.26:0))<1e-7);
            if(phase==='seated') {
              assert.equal(person.pose.seated,1);
              assert(person.pose.feet.every(f=>f.supported&&Math.abs(f.position.y-9.1)<1e-5));
              assert(current.seatDetail.selected.includes(person.seatId));
            }
            if(actorSide===side&&['climbing','seated'].includes(phase)) {
              await page.locator(selector).scrollIntoViewIfNeeded();
              await page.locator(selector).screenshot({path:path.join(output,`${name}-superior-${side}-${phase}.png`)});
            }
            captures.push({phase,side:actorSide,state:summary(current)});
          }
        }
        console.log(`${name}: escadas, patamar e assentos superiores conferidos`);
        for(const destination of ['loja','hotel','chopp']) {
          const actor=initial.circulation.pedestrians.find(p=>p.destination===destination);
          for(const phase of ['entering','inside','leaving']) {
            const stage=actor.stages.find(s=>s.phase===phase);assert(stage);
            const seconds=stage.at+stage.duration*.5;
            const current=await page.evaluate(({seconds,destination})=>{window.complexo3D.seekCirculation(seconds);window.complexo3D.view(destination);return window.complexo3D.inspect();},{seconds,destination});
            coherent(current,seconds);
            const person=current.circulation.pedestrians.find(p=>p.id===actor.id);
            assert.equal(person.pose.phase,phase);assert.equal(person.pose.visible,true);assert.equal(person.source,'qa-sample');
            assert([person.pose.x,person.pose.y,person.pose.z].every(Number.isFinite));
            assert(person.pose.y>=0&&person.pose.y<=.25,'corpo continua na altura dos pisos construídos');
            if(phase==='entering'&&destination!=='loja') {
              await page.locator(selector).screenshot({path:path.join(output,`${name}-${destination}-entrada.png`)});
            }
            captures.push({destination,phase,state:summary(current)});
          }
        }
        const paused=await inspect(page);await frames(page);const frozen=await inspect(page);
        assert.deepEqual(frozen.visits,paused.visits);assert.deepEqual(frozen.circulation,paused.circulation);
        assert(await page.evaluate(()=>window.upperOriginalApi===window.complexo3D&&window.upperOriginalCanvas===document.querySelector('[data-complexo-3d] canvas')));
        assert.equal(await page.locator(`${selector} canvas`).count(),1);
        await page.evaluate(()=>{window.upperPreviousApi=window.complexo3D;window.setComplexoStage('lower');});
        await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.upperPreviousApi);await frames(page);
        const lower=await inspect(page);
        assert.equal(lower.visitTier,'lower');assert(lower.architecture.accessibleSeats.every(a=>a.tier==='lower'));
        assert.equal(await page.getByLabel('Destino da visita local').locator('option[value="upper:0"]').count(),0);
        assert.deepEqual(lower.circulation.pedestrians,[],'sem compra não há entrada em prédio inexistente');
        await page.evaluate(()=>{window.upperPreviousApi=window.complexo3D;window.setComplexoStage('empty');});
        await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.upperPreviousApi);await frames(page);
        const empty=await inspect(page);
        assert.deepEqual(empty.visits,[]);assert.deepEqual(empty.architecture.accessibleSeats,[]);assert.equal(empty.crowd.total,0);
        assert.equal(empty.match.time,14);assert.equal(empty.match.players,22);
        assert.equal(await page.getByLabel('Destino da visita local').isDisabled(),true);
        assert.deepEqual(errors,[]);
        report.push({device:name,captures,empty:{match:empty.match,visits:empty.visits}});
        fs.writeFileSync(path.join(output,'superior-destinos-report.json'),JSON.stringify(report,null,2));
        console.log(`PASS ${name}: segundo andar, três estabelecimentos, pausa, mesmo canvas e relógio oficial; obras parciais e várzea sem acessos inventados.`);
      } finally {await context.close();}
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
