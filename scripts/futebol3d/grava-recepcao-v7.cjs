const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const {installReceptionCutover}=require('./recepcao-experimento.cjs');
const out='/workspace/shared/recepcao-aerea-v7-20261028/entrega',fps=20;
const cases=[
 {port:5301,start:83.4,end:87.1,mode:'broadcast',label:'ANTES - cabeca automatica'},
 {port:5309,start:83.4,end:88.1,mode:'broadcast',label:'PROPOSTA ISOLADA - domina e passa'},
 {port:5309,start:85.25,end:87.0,mode:'analysis',label:'PROPOSTA ISOLADA - recepcao de perto'}
];
(async()=>{fs.mkdirSync(out,{recursive:true});const frames=path.join(out,'quadros');fs.mkdirSync(frames,{recursive:true});const b=await loadDependency('playwright').chromium.launch(browserOptions());let index=0;const chapters=[],reports=[];try{
 for(const c of cases){const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));if(c.port===5309)await installReceptionCutover(p,83);else if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
  await p.goto('http://127.0.0.1:'+c.port+'/scripts/futebol3d/audita-mapa.html?seed=1');await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});const error=await p.evaluate(()=>window.mapAuditError);if(error)throw Error(error);await p.evaluate(()=>mapAudit.size(960,540));
  chapters.push({...c,second:index/fps});const first=Math.round(c.start*60),rows=[];await p.evaluate(first=>{for(let i=first-180;i<first;i++)mapAudit.seek(i/60)},first);
  for(let i=first;i<c.end*60-1e-7;i+=3){const r=await p.evaluate(({i,first,mode})=>{const rows=[];for(let j=Math.max(first,i-2);j<=i;j++){const s=mapAudit.seek(j/60);rows.push({t:j/60,ball:s.visibleBall,contacts:s.detail.football.contacts.filter(c=>c.nome&&c.t>83.4),sameEvents:JSON.stringify(s.official.events)===JSON.stringify(s.authority.official.events),plans:s.detail.football.actions.filter(a=>a.key.includes('Cuadrado')).map(a=>({clip:a.tiro.nome,kind:a.plan?.kind,t:a.plan?.t}))})}return{rows,jpg:mapAudit.capture(i/60,mode)}},{i,first,mode:c.mode});rows.push(...r.rows);fs.writeFileSync(path.join(frames,String(index++).padStart(5,'0')+'.jpg'),Buffer.from(r.jpg,'base64'));}
  reports.push({...c,rows,errors});await p.close();console.log('captured',c.label,index);
 }
 fs.writeFileSync(out+'/contatos.json',JSON.stringify(reports));
 for(const r of reports){assert.deepEqual(r.errors,[]);assert(r.rows.every(r=>r.sameEvents));}
 const after=reports[1].rows.flatMap(r=>r.contacts),receive=after.find(c=>c.key.includes('Cuadrado')&&c.kind==='recebe');assert(receive?.confirmed,'Measured foot contact at the new reception must pass');
 assert(!after.some(c=>c.key.includes('Cuadrado')&&c.contactType==='head'),'No automatic header after the reviewed launch');
 const captions=chapters.map((c,i)=>`drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${c.label}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=8:enable='between(t,${c.second},${(chapters[i+1]?.second??index/fps)-.001})'`);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',frames+'/%05d.jpg','-vf',[...captions,'scale=in_range=full:out_range=tv','format=yuv420p'].join(','),'-c:v','libx264','-crf','23','-color_range','tv','-movflags','+faststart',out+'/recepcao-antes-depois.mp4']);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',out+'/recepcao-antes-depois.mp4','-vf','setpts=2*PTS','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out+'/recepcao-lenta.mp4']);
 fs.writeFileSync(out+'/captura.json',JSON.stringify({fps,frames:index,chapters,receive,engine:'Mesmo Motor2 e campo 3D; proposta isolada ativada aos 83 s para repetir o lance do mesmo estado',published:false},null,2));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
