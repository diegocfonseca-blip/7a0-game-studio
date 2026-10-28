const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v2-20261028/entrega',origin='http://127.0.0.1:5301',fps=20;
const windows=[[5.1,6.1,'Lateral: recolher e lançar'],[7.5,8.6,'Bola alta: esperar a descida'],[16,18.5,'Domínio, passe e finalização'],[34.1,35.8,'Goleiro: pegar e repor'],[49.9,51.7,'Condução e passe'],[76.9,77.9,'Cruzamento e cabeceio']];
(async()=>{fs.mkdirSync(out,{recursive:true});const frames=path.join(out,'quadros');fs.mkdirSync(frames,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
 await p.goto(origin+'/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});await p.evaluate(()=>mapAudit.size(960,540));let index=0,chapter=[],lastChapter=-1;
 for(let i=0;i<=78*60;i++){const t=i/60,wi=windows.findIndex(([a,b])=>t>=a-1e-8&&t<b-1e-8),capture=wi>=0&&i%3===0;
  const jpg=await p.evaluate(({t,capture})=>{mapAudit.seek(t);return capture?mapAudit.capture(t,'close'):null},{t,capture});
  if(jpg){if(lastChapter!==wi){chapter.push({second:index/fps,matchTime:t,label:windows[wi][2]});lastChapter=wi}const bytes=Buffer.from(jpg,'base64');fs.writeFileSync(path.join(frames,String(index++).padStart(5,'0')+'.jpg'),bytes);if(index%20===0)console.log('capturados',index,'tempo',t)}
 }
 if(errors.length)throw Error(errors.join('\n'));
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',frames+'/%05d.jpg','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'fundamentos-normal.mp4')]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(out,'fundamentos-normal.mp4'),'-vf','setpts=2*PTS','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'fundamentos-lento.mp4')]);
 fs.writeFileSync(path.join(out,'captura.json'),JSON.stringify({fps,chapter,windows,frames:index,errors,engine:'criarPartidaComplexo — mesmo campo do mapa, 22 atletas',note:'Captura real de WebGL. FPS do arquivo; não é medição em celular físico. Entrada salva, ensaio local, sem publicar.'},null,2));console.log('concluído',index);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
