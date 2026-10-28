const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v5-20261028/entrega',fps=20;
const cases=[
 {seed:2,start:7.6,end:9.4,label:'Defesa alta - bola espalmada',mode:'keeper-left-wide'},
 {seed:4,start:28.55,end:30.95,label:'Rebote - encaixe - reposicao',mode:'keeper-right-wide'},
 {seed:5,start:8.35,end:10.2,label:'Encaixe no peito - reposicao rapida',mode:'keeper-left-wide'},
 {start:33.2,end:36,label:'Bola na trave - recolhimento - lancamento',mode:'keeper-review'},
 {start:16,end:18.8,label:'Dominio - passe - finalizacao',mode:'analysis'}
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
 fs.writeFileSync(out+'/captura.json',JSON.stringify({fps,frames:index,chapter:chapters,errors,engine:'criarPartidaComplexo, 22 atletas, campo do mapa',note:'Captura real de WebGL em ensaios locais. Seeds 2, 4 e 5 para regressao; nenhuma partida gravada na conta. FPS do arquivo, nao de celular fisico.'},null,2));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
