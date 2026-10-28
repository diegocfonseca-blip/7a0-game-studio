const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v6-20261028/entrega',fps=20;
const cases=[
 {seed:1,start:4.65,end:6.0,label:'Passe curto - 14,6 m',mode:'analysis'},
 {seed:1,start:51.15,end:53.45,label:'Passe longo rasteiro - 31,8 m',mode:'broadcast'},
 {seed:1,start:83.5,end:86.3,label:'Lancamento alto - 36,9 m',mode:'broadcast'},
 {seed:1,start:79.4,end:80.7,label:'Chute baixo - gol oficial',mode:'broadcast'},
 {seed:2,start:58.35,end:60.3,label:'Chute alto - para fora',mode:'broadcast'},
 {start:75.7,end:78.8,label:'Cruzamento com curva - cabeceio',mode:'broadcast'}
];
(async()=>{fs.mkdirSync(out,{recursive:true});const frames=path.join(out,'quadros');fs.mkdirSync(frames,{recursive:true});const b=await loadDependency('playwright').chromium.launch(browserOptions());const chapters=[],errors=[];let index=0;try{
 for(const c of cases){const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html'+(c.seed?'?seed='+c.seed:''));await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});const error=await p.evaluate(()=>window.mapAuditError);if(error)throw Error(error);await p.evaluate(()=>mapAudit.size(960,540));chapters.push({...c,second:index/fps});
  const first=Math.round(c.start*60);await p.evaluate(first=>{for(let i=first-120;i<first;i++)mapAudit.seek(i/60)},first);
  for(let i=first;i<c.end*60-1e-7;i+=3){const jpg=await p.evaluate(({i,first,mode})=>{for(let j=Math.max(first,i-2);j<=i;j++)mapAudit.seek(j/60);return mapAudit.capture(i/60,mode)},{i,first,mode:c.mode});fs.writeFileSync(path.join(frames,String(index++).padStart(5,'0')+'.jpg'),Buffer.from(jpg,'base64'));}
  console.log('captured',c.label,index);await p.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
 const captions=chapters.map((c,i)=>`drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${c.label}':x=18:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=8:enable='between(t,${c.second},${(chapters[i+1]?.second??index/fps)-.001})'`);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',frames+'/%05d.jpg','-vf',[...captions,'scale=in_range=full:out_range=tv','format=yuv420p'].join(','),'-c:v','libx264','-crf','24','-color_range','tv','-movflags','+faststart',out+'/fundamentos-normal.mp4']);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',out+'/fundamentos-normal.mp4','-vf','setpts=2*PTS','-c:v','libx264','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out+'/fundamentos-lento.mp4']);
 fs.writeFileSync(out+'/captura.json',JSON.stringify({fps,frames:index,chapter:chapters,errors,engine:'criarPartidaComplexo, 22 atletas, campo do mapa',note:'Captura real de WebGL em ensaios locais. Seeds 1 e 2 para regressao; nenhuma partida gravada na conta. FPS do arquivo, nao de celular fisico.'},null,2));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
