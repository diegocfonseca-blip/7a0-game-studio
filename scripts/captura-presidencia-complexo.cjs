const fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{const origin='http://127.0.0.1:4196',out=path.resolve('test-results/complexo-3d');fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1400,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log(m.text().slice(0,300))});
 await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.goto(origin+'/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.complexo3D));const viewport=page.locator('[data-complexo-3d]');await viewport.scrollIntoViewIfNeeded();await viewport.screenshot({path:path.join(out,'complete-original.png')});
 console.log(JSON.stringify(await page.evaluate(()=>({inspection:window.complexo3D.inspect(),lighting:window.complexo3D.checkLighting()}))));
 for(const view of ['field','entrance','loja','hotel']){await page.evaluate(v=>window.complexo3D.view(v),view);await viewport.screenshot({path:path.join(out,view+'.png')});}
 fs.writeFileSync(path.join(out,'capture-errors.json'),JSON.stringify(errors));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
