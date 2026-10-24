const fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require('../presidencia-runtime.cjs').loadDependency('playwright');
const origin='http://127.0.0.1:4197',base=origin+'/7a0-game-studio/',out='test-results/cartoon-football/generalizacao';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const reports=[];
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
   await page.goto(base+'scripts/cartoon-football/mechanics-audit.html?dataset=neymarzetti-current');await page.waitForFunction(()=>window.mechanicsAudit);
   const data=await page.evaluate(async()=>{
    const prepared=await mechanicsAudit.prepared();mechanicsAudit.seek(0);mechanicsAudit.capture(0,null,{width:innerWidth,height:innerHeight});const frames=[];
    for(const time of [5.5,14.1,23.7,39.85,59.3]){mechanicsAudit.capture(time);const s=mechanicsAudit.seek(time);frames.push({time,players:s.frame.players.length,coverage:s.audit.captureCoverage,render:mechanicsAudit.inspect().render});}
    return{plans:prepared.plans.length,frames};
   });
   assert.equal(data.plans,52);assert.ok(data.frames.every(f=>f.players===22&&f.coverage.runtime));assert.deepEqual(errors,[]);
   await page.screenshot({path:out+'/viewport-'+viewport.width+'.png'});reports.push({viewport,emulationOnly:true,errors,...data});await page.close();
  }
  const page=await browser.newPage();await page.goto(base);const videos=[];
  for(const file of ['depois-save-close-normal.mp4','depois-save-close-lenta.mp4']){
   await page.setContent('<video muted playsinline src="'+base+out+'/videos/'+file+'"></video>');await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
   await page.evaluate(()=>document.querySelector('video').play());await page.waitForFunction(()=>document.querySelector('video').currentTime>.3);
   const data=await page.evaluate(()=>{const v=document.querySelector('video');return{width:v.videoWidth,height:v.videoHeight,duration:v.duration,error:v.error?.message??null}});assert.equal(data.error,null);videos.push({file,...data});
  }
  await page.close();await fs.writeFile(out+'/viewports.json',JSON.stringify({viewports:reports,videos},null,2));console.log({viewports:reports.map(r=>r.viewport),videos});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
