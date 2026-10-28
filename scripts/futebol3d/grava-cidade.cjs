const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-20261028',origin='http://127.0.0.1:5301';
(async()=>{const frames=path.join(out,'mapa-quadros');fs.mkdirSync(frames,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const p=await browser.newPage({viewport:{width:960,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());let index=0;
 for(const [from,to] of (process.env.CITY_WINDOWS?JSON.parse(process.env.CITY_WINDOWS):[[.4,3.6],[16.2,18.6]])){
  await p.goto(origin+'/scripts/futebol3d/audita-cidade.html');await p.waitForFunction(()=>window.cityAudit?.ready(),{},{timeout:120000});await p.evaluate(()=>cityAudit.camera('broadcast'));await p.waitForTimeout(1500);
  for(let t=Math.max(0,from-1.3);t<to;t+=1/24){await p.evaluate(t=>{cityAudit.seek(t);cityAudit.draw()},t);if(t>=from){await p.screenshot({path:path.join(frames,String(index++).padStart(5,'0')+'.jpg'),type:'jpeg',quality:85});if(index%24===0)console.log('mapa',index)}}
 }
 if(errors.length)throw Error(errors.join('\n'));execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','24','-i',frames+'/%05d.jpg','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'campo-dentro-do-mapa.mp4')]);console.log('Captura real da cidade completa',index,'quadros');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
