const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin=process.env.PRESIDENCIA_QA_ORIGIN||'http://127.0.0.1:4196',base='/7a0-game-studio/';
const output='test-results/avatar-original-20261016/timeout.json';
(async()=>{
 fs.mkdirSync('test-results/avatar-original-20261016',{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={cases:[],errors:[]};
 try{
  for(const mode of ['loaded-onload-queued','incomplete','wrong-dimensions']){
   const page=await browser.newPage({viewport:{width:1100,height:1600}});page.setDefaultTimeout(15000);
   page.on('pageerror',error=>report.errors.push(error.message));
   await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   let held;
   const pattern='**/presidente-v17/base-neutra-terno.webp';
   if(mode==='incomplete')await page.route(pattern,route=>{held=route;});
   if(mode==='wrong-dimensions')await page.route(pattern,route=>route.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync('public/presidente-v25/silver-stud.webp')}));
   await page.goto(origin+base+'qa-presidencia-avatar-original.html');await page.waitForFunction(()=>window.avatarQa);
   await page.evaluate(async base=>{
    const {comporPresidenteOriginal}=await import(base+'src/escalacao/presidente-textura-original.ts');
    const NativeImage=window.Image,nativeSetTimeout=window.setTimeout.bind(window),nativeClearTimeout=window.clearTimeout.bind(window);
    const images=[],timers=new Map(),queued=[];let next=-1000;
    // Real HTMLImageElements download/decode real files. Only dispatch of their
    // onload callback is delayed, reproducing a busy main thread's event queue.
    window.Image=function(...args){
     const image=new NativeImage(...args);let handler=null;
     Object.defineProperty(image,'onload',{configurable:true,get:()=>handler,set:value=>{handler=value;}});
     image.addEventListener('load',()=>{if(handler)queued.push(handler)});
     images.push(image);return image;
    };
    window.setTimeout=(callback,delay,...args)=>{
     if(delay===15000){const id=next--;timers.set(id,()=>callback(...args));return id;}
     return nativeSetTimeout(callback,delay,...args);
    };
    window.clearTimeout=id=>{if(timers.has(id))timers.delete(id);else nativeClearTimeout(id);};
    const p={version:5,name:'Presidente local',outfit:'terno',appearance:{version:22,hair:'none',beard:'none',skinTone:'medium',accessories:[]}};
    const state={status:'pending',resolutions:0};
    const promise=comporPresidenteOriginal(p,'standing').then(art=>{state.status='ready';state.resolutions++;state.dimensions=[art.canvas.width,art.canvas.height];art.canvas.width=0;art.canvas.height=0;return {...state};},error=>{state.status='error';state.resolutions++;state.error=error.message;return {...state};});
    window.timeoutQa={images,timers,queued,state,promise};
   },base);
   if(mode!=='incomplete')await page.waitForFunction(()=>window.timeoutQa.images.length===1&&window.timeoutQa.images[0].complete&&window.timeoutQa.images[0].naturalWidth>0&&window.timeoutQa.queued.length===1);
   else await page.waitForFunction(()=>window.timeoutQa.images.length===1&&window.timeoutQa.timers.size===1);
   const result=await page.evaluate(async()=>{
    const q=window.timeoutQa,before={status:q.state.status,complete:q.images[0].complete,width:q.images[0].naturalWidth,height:q.images[0].naturalHeight,timers:q.timers.size,queued:q.queued.length};
    for(const callback of [...q.timers.values()])callback();
    const outcome=await q.promise;
    for(const callback of q.queued)callback();
    await Promise.resolve();
    return {before,outcome,after:{status:q.state.status,resolutions:q.state.resolutions,timers:q.timers.size}};
   });
   assert.equal(result.before.status,'pending');assert.equal(result.before.timers,1);
   assert.equal(result.after.resolutions,1);assert.equal(result.after.timers,0);
   if(mode==='loaded-onload-queued'){
    assert.equal(result.before.complete,true);assert.equal(result.before.width,480);assert.equal(result.before.height,720);
    assert.equal(result.outcome.status,'ready');assert.deepEqual(result.outcome.dimensions,[1024,1536]);
   }else{
    assert.equal(result.outcome.status,'error');assert.match(result.outcome.error,mode==='incomplete'?/demorou demais/:/dimensões incompatíveis/);
   }
   report.cases.push({mode,...result});console.log('PASS '+mode+' '+result.outcome.status);
   if(held)await held.abort().catch(()=>{});
   await page.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(output,JSON.stringify(report,null,2));
 }catch(error){fs.writeFileSync(output,JSON.stringify({...report,failure:String(error)},null,2));throw error}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
