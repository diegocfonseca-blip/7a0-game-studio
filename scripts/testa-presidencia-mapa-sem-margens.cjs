const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const page=await b.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-etapas.html');
 await page.waitForSelector('[data-review-stage]');
 const cover=async()=>{const g=await page.locator('.pe-map-viewport').evaluate(el=>{const v=el.getBoundingClientRect(),w=el.querySelector('.pe-map-world').getBoundingClientRect();return {covered:w.left<=v.left+3&&w.top<=v.top+3&&w.right>=v.right-3&&w.bottom>=v.bottom-3,transform:el.querySelector('.pe-map-world').style.transform}});assert.ok(g.covered,'World covers viewport, including edges');assert.ok(!g.transform.includes('scale('),'Detail gets its actual layout size rather than a magnified compositor surface')};
 for(const width of [320,390,844,1440]){
 await page.setViewportSize({width,height:width===844?390:900});
 for(const stage of [0,9,22,46]){
 await page.getByLabel('Etapa do estádio',{exact:true}).selectOption(String(stage));
 await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();await page.waitForTimeout(100);await cover();
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Afastar mapa',exact:true}).evaluate(el=>el.click());await cover();
 await page.getByRole('button',{name:'Aproximar mapa',exact:true}).click();await cover();
 await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();
 }
 }
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Etapa do estádio',{exact:true}).selectOption('0');
 await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();await page.waitForSelector('[aria-busy="false"]');
 await page.waitForFunction(()=>[...document.querySelectorAll('img[data-map-detail]')].filter(i=>i.getBoundingClientRect().width>0).some(i=>i.complete&&i.naturalWidth>0));
 fs.mkdirSync('test-results/mapa-sem-margens',{recursive:true});await page.locator('.pe-map').screenshot({path:'test-results/mapa-sem-margens/varzea-390.png'});
 assert.deepEqual(errors,[]);console.log('PASS: no exposed background at minimum zoom, framing, resize or zoom; native layout detail, 4 stages × 4 viewports.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
