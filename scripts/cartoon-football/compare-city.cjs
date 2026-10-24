const fs=require('node:fs/promises'),assert=require('node:assert/strict'),{chromium}=require('../presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{
 const out=process.env.CAMERA_COMPARE_OUT??'test-results/cartoon-football/consolidado-cameras',input=JSON.parse(await fs.readFile('test-results/animation-library/neymarzetti-current/football-input.json')).input;
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const previous=process.env.CONTINUITY_ONLY?JSON.parse(await fs.readFile(out+'/comparison.json')):null;
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],samples=previous?.samples??[];page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});
  await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4197'?r.continue():r.abort());
  await page.goto('http://127.0.0.1:4197/7a0-game-studio/qa-presidencia-complexo-3d.html');await page.waitForFunction(()=>window.complexo3D,{},{timeout:180000});
  await page.evaluate(({input})=>{setComplexoPopulation({qaPopulation:false});const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos,fake:p.fake}));window.cameraFixture={officialInput:input,officialTeams:['Rei da Bola FC','Neymarzetti'],context:{id:'camera-same-play',home:roster(input.casa),away:roster(input.fora)},minute:14.1/(90/93),homeScore:0,awayScore:1,paused:true,finished:false,homeColor:'#d4121f',awayColor:'#f0efef'};setComplexoMatch(cameraFixture)},{input});
  await page.waitForFunction(()=>complexo3D.inspect().match.detail,{},{timeout:180000}).catch(async e=>{console.log('Loader bloqueado',await page.evaluate(()=>complexo3D.inspect().match));await page.screenshot({path:out+'/loader.png'});throw e});
  console.log('Modelos prontos',await page.evaluate(()=>complexo3D.inspect().match));
  const settle=async()=>page.waitForFunction(()=>{const x=complexo3D.inspect().matchCamera;return !x.moving&&!!x.framing?.visible},{},{timeout:180000});
  for(const [device,width,height]of (previous?[]:[['desktop',1100,850],['portrait',390,844],['landscape',844,390]])){
   await page.setViewportSize({width,height});
   for(const view of ['tactical','broadcast','map-close']){
    if(view!=='map-close'){await page.evaluate(view=>complexo3D.setMatchCamera(view),view);await settle().catch(async e=>{console.log('Camera bloqueada',await page.evaluate(()=>({camera:complexo3D.inspect().camera,controller:complexo3D.inspect().matchCamera})));throw e})}else for(let i=0;i<5;i++)await page.evaluate(()=>complexo3D.zoom(1));
    await page.locator('[data-complexo-3d]').screenshot({path:out+'/'+device+'-'+view+'.png',timeout:180000});
    const s=await page.evaluate(()=>complexo3D.inspect());samples.push({device,view,camera:s.camera,target:s.target,match:s.match,drawCalls:s.drawCalls,triangles:s.triangles,memory:s.memory,viewport:s.viewport,framing:s.matchCamera});console.log(device,view,s.match.detail.style,s.match.time,s.match.official.score);
   }
  }
  assert.ok(samples.every(s=>s.match.players===22&&s.match.detail.style==='civil-cartoon'));assert.ok(samples.every(s=>Math.abs(s.match.time-14.1)<1e-5));assert.ok(samples.every(s=>JSON.stringify(s.match.official)===JSON.stringify(samples[0].match.official)));
  // Seek the same official context through pass, reception and finish. Camera does not own clock.
  const sequence=previous?.sequence??[];await page.setViewportSize({width:1100,height:850});
  for(const [label,time]of (previous?[]:[['passe',11.3],['dominio',12.3],['finalizacao',14.1]])){
   await page.evaluate(time=>{setComplexoMatch({...cameraFixture,minute:time/(90/93)});complexo3D.setMatchCamera('broadcast')},time);await settle();for(let i=0;i<5;i++)await page.evaluate(()=>complexo3D.zoom(1));
   await page.locator('[data-complexo-3d]').screenshot({path:out+'/sequence-'+label+'.png',timeout:180000});const s=await page.evaluate(()=>complexo3D.inspect());assert.ok(Math.abs(s.match.time-time)<1e-5);sequence.push({label,time,match:s.match});
  }
  // Let the official clock run while viewing the city; approaching again must not restart it.
  await page.evaluate(()=>{const origin=performance.now();window.cameraClock=setInterval(()=>{const tick=Math.floor((performance.now()-origin)/1000);setComplexoMatch({...cameraFixture,minute:20+tick,paused:false,visualClock:{sampledAt:origin+tick*1000,running:true},officialMinuteMs:1000})},100);complexo3D.view('original')});
  await page.waitForFunction(()=>complexo3D.inspect().match.time>=20*(90/93),{},{timeout:180000});const start=await page.evaluate(()=>complexo3D.inspect().match);
  await page.waitForFunction(t=>complexo3D.inspect().match.time>t+.5,start.time,{timeout:180000});await page.evaluate(()=>complexo3D.setMatchCamera('broadcast'));
  await page.waitForFunction(t=>complexo3D.inspect().match.time>t+1,start.time,{timeout:180000});const finish=await page.evaluate(()=>complexo3D.inspect().match);await page.evaluate(()=>clearInterval(cameraClock));
  assert.equal(start.matchId,finish.matchId);assert.ok(finish.time>start.time+1);assert.equal(finish.players,22);assert.deepEqual(finish.official.events.slice(0,start.official.events.length),start.official.events);

  assert.deepEqual(errors,[]);await fs.writeFile(out+'/comparison.json',JSON.stringify({samples,sequence,continuity:{start,finish},errors,stadium:'Existing complete QA stadium; not account purchases',samePlay:true,databaseWritten:false,published:false,hardware:'Chromium SwiftShader; viewport emulation, not physical phone performance'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
