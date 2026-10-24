const fs=require('node:fs/promises'),assert=require('node:assert/strict'),{chromium}=require('../presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{
 await fs.mkdir('test-results/cartoon-football/apoio-partida',{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
  await page.goto('http://127.0.0.1:4197/7a0-game-studio/scripts/cartoon-football/mechanics-audit.html');await page.waitForFunction(()=>window.mechanicsAudit);await page.evaluate(()=>mechanicsAudit.prepared());await page.evaluate(()=>mechanicsAudit.seek(0));
  let min=Infinity,last=null;const bad=[],largeSteps=[];
  for(let first=0;first<1881;first+=120){
   const rows=await page.evaluate(first=>{const rows=[];for(let i=first;i<Math.min(first+120,1881);i++){const s=mechanicsAudit.seek(i/20,{audit:false}),r=mechanicsAudit.inspect().sidelines.people.find(p=>p.role==='referee');rows.push({time:i/20,gap:r.minAthleteHeadGap,position:r.position,phase:s.frame.phase})}return rows},first);
   for(const r of rows){if(Number.isFinite(r.gap))min=Math.min(min,r.gap);if(r.gap<-.003)bad.push(r);if(last){const step=Math.hypot(r.position[0]-last.position[0],r.position[2]-last.position[2]);if(step>.65)largeSteps.push({time:r.time,step,phase:r.phase})}last=r;}
  }
  const official=await page.evaluate(()=>mechanicsAudit.seek(94).frame.official);assert.deepEqual(official.score,[1,1]);assert.equal(official.events.length,82);assert.deepEqual(errors,[]);
  const result={hz:20,samples:1881,min,bad,largeSteps,errors,score:official.score,events:official.events.length,databaseWritten:false};await fs.writeFile('test-results/cartoon-football/apoio-partida/ref-clearance-final.json',JSON.stringify(result,null,2));
  assert.equal(bad.length,0,'Referee head must not cross an athlete');assert.equal(largeSteps.length,0,'Report abrupt corrections instead of hiding overlaps');console.log({min,bad:bad.length,largeSteps:largeSteps.length,samples:result.samples});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
