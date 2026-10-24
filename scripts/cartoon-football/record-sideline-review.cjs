const fs=require('node:fs/promises'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{chromium}=require('../presidencia-runtime.cjs').loadDependency('playwright');
const out='test-results/cartoon-football/apoio-partida/video',fps=30;
const scenes=[['CONSTRUCAO E MOVIMENTACAO','match',21.8,3,null],['JUIZ NO MESMO ESTILO','referee',22.2,1.6,null],['AREA TECNICA - SAVE SEM SUPLENTES','sideline',22.2,1.6,null],['DOMINIO E PASSE - TRANSICAO CORRIGIDA','close',60.2,1.3,'Paolo Montero'],['PREPARACAO E FINALIZACAO','close',13.6,1.65,'Souza']];
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
  await page.goto('http://127.0.0.1:4197/7a0-game-studio/scripts/cartoon-football/mechanics-audit.html');await page.waitForFunction(()=>window.mechanicsAudit);
  await page.evaluate(async()=>{await mechanicsAudit.prepared();mechanicsAudit.seek(0);mechanicsAudit.capture(0,null,{width:960,height:540})});let index=0;const timeline=[];
  for(const[label,camera,start,duration,name]of scenes){
   const first=index;await page.evaluate(({camera,start,name})=>{mechanicsAudit.seek(start-.8);mechanicsAudit.focus(name?[mechanicsAudit.seek(start-.8).frame.players.find(p=>p.name===name).key]:[]);mechanicsAudit.camera(camera);for(let t=start-.8;t<start;t+=1/60)mechanicsAudit.seek(t,{audit:false})},{camera,start,name});
   for(let i=0;i<Math.round(duration*fps);i++){const data=await page.evaluate(t=>mechanicsAudit.captureWithScore(t),start+i/fps);await fs.writeFile(out+'/'+String(index++).padStart(5,'0')+'.jpg',Buffer.from(data,'base64'));if(i===Math.round(fps*.5))await fs.writeFile(out+'/scene-'+timeline.length+'.jpg',Buffer.from(data,'base64'));}
   timeline.push({label,start,duration,first,last:index});console.log(label);
  }
  const final=await page.evaluate(()=>mechanicsAudit.seek(94).frame.official);assert.deepEqual(final.score,[1,1]);assert.equal(final.events.length,82);assert.deepEqual(errors,[]);
  for(const[suffix,rate]of [['normal',fps],['lenta',fps/2]]){
   const filter=timeline.map(s=>`drawtext=text='${s.label}':x=16:y=h-32:fontsize=19:fontcolor=white:box=1:boxcolor=black@0.75:enable='between(t,${s.first/rate},${s.last/rate})'`).join(',');
   const result=spawnSync('ffmpeg',['-y','-framerate',String(rate),'-i',out+'/%05d.jpg','-vf',filter+',format=yuv420p','-c:v','libx264','-profile:v','baseline','-level','3.1','-crf','24','-movflags','+faststart',out+'/revisao-'+suffix+'.mp4'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  }
  await fs.writeFile(out+'/review.json',JSON.stringify({sourceReplay:true,fps,timeline,score:final.score,events:final.events.length,errors,careerAdvanced:false,databaseWritten:false},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
