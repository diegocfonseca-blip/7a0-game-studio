const fs=require('node:fs/promises'),assert=require('node:assert/strict'),{chromium}=require('../presidencia-runtime.cjs').loadDependency('playwright');
const out='test-results/cartoon-football/apoio-partida',base='http://127.0.0.1:4197/7a0-game-studio/';
(async()=>{
 // Derived local fixtures only. Never place fictional reserves in a save.
 const fixture=JSON.parse(await fs.readFile('test-results/animation-library/neymarzetti-current/football-input.json'));
 const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos,fake:p.fake})),home=roster(fixture.input.casa),away=roster(fixture.input.fora);
 const context={home,away,homeBench:[...home.slice(0,2),...home.slice(0,7).map((p,i)=>({...p,id:'qa-home-reserve-'+i,name:'Reserva QA '+(i+1)}))],awayBench:[...away.slice(0,2),...away.slice(0,7).map((p,i)=>({...p,id:'qa-away-reserve-'+i,name:'Reserva QA '+(i+1)}))]};
 const variants={'sideline-qa':{...fixture,context,president:{version:5,name:'Presidente QA',outfit:'mestre-envelopes',appearance:{version:22,hair:'none',beard:'none',accessories:[],skinTone:'brown'}},syntheticBench:true},'red-qa':{...fixture,input:{...fixture.input,seed:fixture.input.seed+4},seedOffset:4}};
 for(const[id,data]of Object.entries(variants)){const path='test-results/animation-library/'+id;await fs.mkdir(path,{recursive:true});await fs.writeFile(path+'/football-input.json',JSON.stringify({...data,localFixture:true,userAccountData:false}));}
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const reports=[];
  for(const dataset of ['neymarzetti-current','sideline-qa','red-qa']){
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
   await page.goto(base+'scripts/cartoon-football/world-review.html?dataset='+dataset);await page.waitForFunction(()=>window.worldReviewError||window.worldReview?.ready(),{},{timeout:120000});assert.equal(await page.evaluate(()=>window.worldReviewError),undefined);
   const initial=await page.evaluate(()=>({snapshot:worldReview.seek(0),legacy:worldReview.legacyVisible()})),support=initial.snapshot.detail.sidelines;
   assert.equal(support.referees,1);assert.equal(support.coaches,2);assert.ok(support.people.every(p=>p.rigBones===23&&Math.abs(p.footFloor)<.003));assert.ok(initial.legacy.every(x=>x.visible===false),'No duplicate legacy people');
   assert.equal(support.reserves.length,dataset==='sideline-qa'?14:0);assert.equal(new Set(support.reserves.map(p=>p.id)).size,support.reserves.length);
   if(dataset==='sideline-qa'){assert.equal(support.people.filter(p=>p.president).length,1);assert.equal(support.people.find(p=>p.president).side,'away');}
   const samples=await page.evaluate(()=>[10,30,33,60,96].map(minute=>{const s=worldReview.seek(minute);return{minute,players:s.players,official:s.official,hidden:s.detail.hidden,visibleAvatars:s.visibleAvatars,avatarPool:s.avatarPool,support:s.detail.sidelines}}));
   assert.ok(samples.every(s=>s.players===(dataset==='red-qa'&&s.minute>=33?21:22)&&s.support.referees===1));
   if(dataset==='red-qa'){assert.equal(samples.at(-1).visibleAvatars,21);assert.deepEqual(samples.at(-1).avatarPool,initial.snapshot.avatarPool,'A red card must not recreate the avatar pool');assert.deepEqual(samples.at(-1).official.score,[5,0]);assert.ok(samples.at(-1).official.events.some(e=>e.tipo==='vermelho'&&e.a==='Cuadrado'));assert.ok(samples.every(s=>!s.support.reserves.some(p=>p.name==='Cuadrado')));}
   else assert.deepEqual(samples.at(-1).official.score,[1,1]);
   const paused=await page.evaluate(()=>{const a=worldReview.seek(60);const b=worldReview.seek(60);return JSON.stringify(a)===JSON.stringify(b)});assert.ok(paused,'Camera redraw cannot advance or alter the match');assert.deepEqual(errors,[]);
   const result={dataset,syntheticBench:dataset==='sideline-qa',localSeedVariant:dataset==='red-qa',initial,samples,paused,errors,databaseWritten:false};reports.push(result);await page.evaluate(()=>worldReview.dispose());await page.close();console.log({dataset,referees:support.referees,coaches:support.coaches,reserves:support.reserves.length,final:samples.at(-1).official.score,hidden:samples.at(-1).hidden});
  }
  await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/world-tests.json',JSON.stringify(reports,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
