const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const stages=JSON.parse(fs.readFileSync('docs/presidencia-etapas-revisao.json','utf8'));
 const page=await browser.newPage({viewport:{width:900,height:1000},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-etapas.html');
 await page.waitForSelector('[data-review-stage]');
 assert.equal(await page.locator('select option').count(),47);
 fs.mkdirSync('test-results/futebol-3d',{recursive:true});
 for(const width of [900,390]){
  await page.setViewportSize({width,height:1000});
  for(const [i,stage] of stages.entries()){
   await page.getByLabel('Etapa do estádio',{exact:true}).selectOption(String(i));
   await page.waitForFunction(i=>document.querySelector('[data-review-stage]')?.dataset.reviewStage===String(i),i);
   for(const mode of ['Mapa e circulação','Janela da Presidência']){
    await page.getByRole('button',{name:mode,exact:true}).click();
    await page.waitForSelector('[aria-busy="false"]');
    assert.equal(await page.locator('[role="alert"]').count(),0,stage.name+' '+mode);
    assert.ok(await page.evaluate(()=>[...document.images].filter(n=>!n.hasAttribute('data-map-detail')).every(n=>n.complete&&n.naturalWidth>0)),stage.name+' images');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),stage.name+' overflow');
    if(mode==='Mapa e circulação'){
     const complete=['geral','cadeiras','visitante','camarote','grama'].every(k=>(stage.stadium.inv[k]??0)>={geral:40,cadeiras:90,visitante:120,camarote:150,grama:30}[k]);
     assert.equal(await page.locator('[data-world-layer="cober"]').count(),complete&&stage.stadium.ext.includes('cober')?1:0,stage.name+' roof');
     for(const key of ['loja','hotel','estac','praca','chopp','estacao'])assert.equal(await page.locator(`[data-world-layer="${key}:${key}"]`).count(),stage.stadium.ext.includes(key)?1:0,stage.name+' '+key);
    }
   }
  }
  await page.getByLabel('Etapa do estádio',{exact:true}).selectOption('0');await page.waitForSelector('[aria-busy="false"]');
  assert.equal(await page.getByRole('button',{name:'Anterior',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Próxima',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-review-stage]').dataset.reviewStage==='1');
  await page.getByRole('button',{name:'Anterior',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-review-stage]').dataset.reviewStage==='0');
  await page.getByLabel('Etapa do estádio',{exact:true}).selectOption('46');await page.waitForSelector('[aria-busy="false"]');
  assert.equal(await page.getByRole('button',{name:'Próxima',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Mapa e circulação',exact:true}).click();await page.waitForSelector('[aria-busy="false"]');
  await page.getByRole('button',{name:'VER TUDO',exact:true}).click();
  await page.screenshot({path:`test-results/futebol-3d/revisao-etapas-${width}.png`});
  console.log(`PASS: 47 stages × map/window at ${width}px, purchased layers, roofs, images, navigation and no overflow`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
