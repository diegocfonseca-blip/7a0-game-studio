const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const mobileOnly=process.argv.includes('--mobile-only');
async function pinch(page,session,canvas,ratio){
 const box=await canvas.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const points=half=>[{id:0,x:x-half,y,radiusX:7,radiusY:7,force:1},{id:1,x:x+half,y,radiusX:7,radiusY:7,force:1}];
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(22)});
 try{for(const half of [22*Math.sqrt(ratio),22*ratio])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(half)})}
 finally{await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 await frame(page);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),reports=[];
 try{
  for(const device of [
   {name:'desktop',viewport:{width:1400,height:1000},deviceScaleFactor:1},
   {name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
  ].filter(device=>!mobileOnly||device.name==='mobile')){
   const {name,...options}=device,context=await browser.newContext({...options,reducedMotion:'reduce',locale:'pt-BR'}),page=await context.newPage(),errors=[];
   page.setDefaultTimeout(180000);
   page.on('pageerror',error=>errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error'&&/WebGL|THREE|shader|NaN/i.test(message.text()))errors.push(message.text())});
   await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   try{
    await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.complexo3D);
    await page.evaluate(()=>{
     const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
     window.setComplexoMatch({context:{id:'qualidade-local',home:team('h'),away:team('a'),speed:4},minute:21,homeScore:0,awayScore:0,paused:true,finished:false,
      homeColor:'#1b7a3d',awayColor:'#c2452f',visualClock:{seconds:17,sampledAt:performance.now(),running:false,rate:4}});
    });
    await page.waitForFunction(()=>window.complexo3D.inspect().match.players===22);
    const baseline=await page.evaluate(()=>({save:window.complexoParkingQA.snapshot(),match:window.complexo3D.inspect().match}));
    const shell=page.locator('.pc3-review');
    await shell.getByRole('button',{name:'Ampliar mapa',exact:true}).click();
    await shell.getByRole('button',{name:'Ver tudo',exact:true}).click();await frame(page);
    const map=await page.evaluate(()=>window.complexo3D.inspect());
    await shell.screenshot({path:path.join(out,`${name}-qualidade-final-mapa.png`)});
    console.log(name+': mapa com sombra ajustada capturado');
    await shell.getByRole('button',{name:'Ver campo',exact:true}).click();await frame(page);
    const before=await page.evaluate(()=>window.complexo3D.inspect()),distance=Math.hypot(...before.camera.map((p,i)=>p-before.target[i]));
    const canvas=page.locator('[data-complexo-3d] canvas'),box=await canvas.boundingBox();
    if(name==='mobile'){
     const session=await context.newCDPSession(page);
     try{
      let remaining=distance;
      for(let attempt=0;attempt<3&&remaining>48;attempt++){
       await pinch(page,session,canvas,Math.min(3.5,remaining/40));
       remaining=await page.evaluate(()=>window.complexo3D.inspect().navigation.distance);
      }
     }finally{await session.detach()}
    }else{
     await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
     await page.mouse.wheel(0,-Math.log(distance/40)/Math.log(1/.95)*100);await frame(page);
    }
    const field=await page.evaluate(()=>window.complexo3D.inspect());
    assert(Math.abs(field.navigation.distance-40)<.1,`close precisa estar a40m: ${field.navigation.distance}`);
    assert(Math.abs(field.target[0])<52.5&&Math.abs(field.target[2])<34,'pinça precisa manter o gramado em foco');
    assert.deepEqual(field.match,baseline.match,'zoom/sombra alterou partida');
    assert.deepEqual(await page.evaluate(()=>window.complexoParkingQA.snapshot()),baseline.save,'zoom/sombra alterou save');
    assert.equal(field.match.players,22);assert.equal(field.match.time,17);
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
    assert.deepEqual(errors,[]);
    await shell.screenshot({path:path.join(out,`${name}-qualidade-final-campo.png`)});
    const compact=state=>({camera:state.camera,target:state.target,quality:state.quality,canvas:state.canvas,viewport:state.viewport,navigation:state.navigation});
    reports.push({device:name,map:compact(map),field:compact(field),match:field.match,errors});
    fs.writeFileSync(path.join(out,mobileOnly?'qualidade-final-mobile-report.json':'qualidade-final-report.json'),JSON.stringify(reports,null,2));
    console.log('PASS '+name+': sombra final, aproximação40m,22atletas,17s,save preservado,sem erros');
   }finally{await context.close()}
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
