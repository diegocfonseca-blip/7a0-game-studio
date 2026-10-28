const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const {installReceptionCutover}=require('./recepcao-experimento.cjs');
const out='/workspace/shared/recepcao-unificada-v8-20261028',fps=20;
(async()=>{
 fs.mkdirSync(out,{recursive:true});const frames=path.join(out,'quadros');fs.mkdirSync(frames,{recursive:true});
 const b=await loadDependency('playwright').chromium.launch(browserOptions());let index=0;const shots=[],rows=[];
 try{
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await installReceptionCutover(p,0);
  await p.goto('http://127.0.0.1:5309/scripts/futebol3d/audita-mapa.html?seed=3');
  await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});
  const error=await p.evaluate(()=>window.mapAuditError);if(error)throw Error(error);await p.evaluate(()=>mapAudit.size(960,540));
  for(const c of [{mode:'broadcast',start:54.4,end:57.8,label:'TESTE LOCAL - lancamento e dominio'},{mode:'analysis-front',start:55.9,end:57.0,label:'MESMA JOGADA - contato de perto'}]){
   shots.push({...c,second:index/fps});const start=Math.round(c.start*60);await p.evaluate(t=>{for(let i=t-90;i<t;i++)mapAudit.seek(i/60)},start);
   for(let tick=start;tick<c.end*60-1e-7;tick+=3){
    const r=await p.evaluate(({tick,start,mode})=>{const measurements=[];for(let i=Math.max(start,tick-2);i<=tick;i++){const s=mapAudit.seek(i/60);measurements.push({t:i/60,score:s.official.score,events:s.official.events,authority:s.authority.official.events,contacts:s.detail.football.contacts.filter(c=>c.key?.includes('Oséas')&&c.t>54)})}return{measurements,jpg:mapAudit.capture(tick/60,mode)}},{tick,start,mode:c.mode});
    rows.push(...r.measurements);fs.writeFileSync(path.join(frames,String(index++).padStart(5,'0')+'.jpg'),Buffer.from(r.jpg,'base64'));
   }
   console.log('captura',c.mode);
  }
  const received=rows.flatMap(r=>r.contacts).find(c=>c.kind==='recebe');
  fs.writeFileSync(out+'/contatos.json',JSON.stringify({errors,received,rows},null,2));
  assert.deepEqual(errors,[]);for(const r of rows)assert.deepEqual(r.events,r.authority);
  assert(received?.confirmed,'Domínio sem contato confirmado');
  assert(!rows.flatMap(r=>r.contacts).some(c=>c.contactType==='head'),'Não cabecear automaticamente a inversão livre');
  const captions=shots.map((c,i)=>`drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${c.label}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=8:enable='between(t,${c.second},${(shots[i+1]?.second??index/fps)-.001})'`);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',frames+'/%05d.jpg','-vf',[...captions,'scale=in_range=full:out_range=tv','format=yuv420p'].join(','),'-c:v','libx264','-crf','23','-color_range','tv','-movflags','+faststart',out+'/lancamento-e-dominio.mp4']);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',out+'/lancamento-e-dominio.mp4','-vf','setpts=2*PTS','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out+'/lancamento-e-dominio-lenta.mp4']);
  fs.writeFileSync(out+'/captura.json',JSON.stringify({shots,fps,frames:index,seed:3,version:'recepcao-contextual-1',received,originalFixtureModified:false,published:false},null,2));
 }finally{await b.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
