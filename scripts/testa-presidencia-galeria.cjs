const assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-revisao.html',{waitUntil:'networkidle'});
 await page.locator('img').evaluateAll(ns=>ns.forEach(n=>n.loading='eager'));
 await page.waitForFunction(()=>document.images.length===24&&[...document.images].every(n=>n.complete&&n.naturalWidth>0));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/presidencia-revisao-mobile.png'});
 await page.getByRole('link',{name:'Abrir as 47 etapas e cenários: cada clique, compra e janela correspondente'}).click();
 await page.waitForSelector('[aria-busy="false"]');assert.equal(await page.locator('select option').count(),47);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(244, 236, 214)');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/futebol-3d/revisao-etapas-entrada.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 24 review images, 47-stage viewer link, mobile layout and cream background.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
