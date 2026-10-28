const fs=require('node:fs'),assert=require('node:assert/strict'),{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v5-20261028/entrega',origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:5307';
(async()=>{const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[],reports=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/revisao.html');await p.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Portrait overflow');await p.getByRole('button',{name:'½ velocidade',exact:true}).click();await p.waitForFunction(()=>document.querySelector('video').currentTime>.2);
 await p.evaluate(()=>document.querySelector('video').pause());await p.screenshot({path:out+'/revisao-celular.png'});
 reports.push(await p.evaluate(()=>{const v=document.querySelector('video');return{file:'revisao.html',width:innerWidth,duration:v.duration,time:v.currentTime,rate:v.playbackRate,error:v.error?.message??null}}));
 for(const file of ['fundamentos-normal.mp4','fundamentos-lento.mp4']){await p.goto(origin+'/'+file);await p.waitForFunction(()=>document.querySelector('video')?.readyState>=2);await p.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return v.play()});await p.waitForFunction(()=>document.querySelector('video').currentTime>.3);reports.push(await p.evaluate(file=>{const v=document.querySelector('video');v.pause();return{file,duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,error:v.error?.message??null}},file));}
 assert.deepEqual(errors,[]);assert(reports.every(r=>!r.error));fs.writeFileSync(out+'/reproducao.json',JSON.stringify({errors,reports},null,2));console.log(reports);
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
