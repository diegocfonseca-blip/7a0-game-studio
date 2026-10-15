const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{
 const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');
 const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 try{for(const device of [{name:'desktop',viewport:{width:1400,height:1000}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]){
  const page=await browser.newPage({...device,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.complexo3D);
  await page.evaluate(()=>{window.oldAPI=window.complexo3D;window.setComplexoStage('closed')});
  await page.waitForFunction(()=>window.complexo3D&&window.complexo3D!==window.oldAPI&&window.complexo3D.inspect().state.roofClosed);
  await page.evaluate(()=>window.complexo3D.view('field'));
  const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();
  const png=await viewport.screenshot({path:out+'/'+device.name+'-gramado-teto-fechado.png'});
  const coords=await page.evaluate(async()=>{const T=await import('/7a0-game-studio/node_modules/three/build/three.module.js'),s=window.complexo3D.inspect(),c=new T.PerspectiveCamera(s.cameraFov,s.viewport[0]/s.viewport[1],.12,4000);c.position.fromArray(s.camera);c.lookAt(new T.Vector3(...s.target));c.updateMatrixWorld();return [-25,5,25].flatMap(x=>[-20,-5,15].map(z=>({x,z,projected:new T.Vector3(x,.002,z).project(c).toArray()}))).filter(p=>Math.abs(p.projected[0])<.95&&Math.abs(p.projected[1])<.95)});
  const image=await loadDependency('sharp')(png).raw().toBuffer({resolveWithObject:true});
  const colors=coords.map(p=>{const [x,y]=p.projected,ix=Math.round((x+1)*image.info.width/2),iy=Math.round((1-y)*image.info.height/2),offset=(iy*image.info.width+ix)*image.info.channels;return {...p,rgb:[...image.data.subarray(offset,offset+3)]}});
  assert(colors.length>=2);assert(colors.every(p=>p.rgb[1]>p.rgb[0]+3),device.name+': terra ocultando gramado '+JSON.stringify(colors));
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+device.name+'-gramado-report.json',JSON.stringify(colors,null,2));console.log('PASS '+device.name+': gramado visível sob teto fechado, '+colors.length+' amostras sem terra sobreposta.');await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
