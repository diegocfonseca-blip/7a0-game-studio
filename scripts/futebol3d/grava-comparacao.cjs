const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-20261028';
const windows=[[.35,3.9],[15.8,18.8],[26.5,30.5],[60,64.5]],fps=24;
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 for(const [label,port]of (process.env.ONLY_AFTER?[['depois',5301]]:[['antes',5302],['depois',5301]])){
  const p=await browser.newPage(),origin='http://127.0.0.1:'+port,frames=path.join(out,label+'-quadros');fs.mkdirSync(frames,{recursive:true});let index=0;
  await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
  for(const [from,to]of windows){await p.goto(origin+'/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});await p.evaluate(()=>{window.lastAuditTime=0;mapAudit.size(960,540)});
   for(let t=from;t<to;t+=1/fps){const jpg=await p.evaluate(t=>{for(let x=lastAuditTime+1/60;x<t-1e-7;x+=1/60)mapAudit.seek(x);lastAuditTime=t;return mapAudit.capture(t,'close')},t);fs.writeFileSync(path.join(frames,String(index++).padStart(5,'0')+'.jpg'),Buffer.from(jpg,'base64'));if(index%48===0)console.log(label,index);}
  }
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',frames+'/%05d.jpg','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,label+'.mp4')]);await p.close();
 }
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(out,'depois.mp4'),'-vf','setpts=2*PTS','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'depois-lento.mp4')]);
 fs.writeFileSync(path.join(out,'captura.json'),JSON.stringify({fps,windows,fixture:'Rei da Bola FC × Neymarzetti; entrada salva, código de 28/10',engine:'criarPartidaComplexo (mesmo módulo do mapa)',kind:'Captura real do WebGL local, com todos os 22 atletas. FPS do arquivo, não medição de um celular.',published:false},null,2));console.log('Vídeos gravados em',out);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
