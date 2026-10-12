const assert=require('node:assert/strict');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch(require('./presidencia-runtime.cjs').browserOptions());try{
 const page=await browser.newPage({viewport:{width:1000,height:500}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderWindowReview);
 const st={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['refl','telao','cober','retratil']};
 for(const closed of [false,true]){
  st.roofClosed=closed;await page.evaluate(st=>window.renderWindowReview(st),st);
  await page.waitForFunction(()=>!!document.querySelector('[aria-busy="false"]'));
  assert.ok(await page.locator('[data-stadium-complete="true"] img').getAttribute('src').then(s=>s.endsWith((closed?'fechado':'aberto')+'-janela.webp')));
  assert.equal(await page.locator('[data-stadium-layer]').count(),0);
  await page.locator('main').screenshot({path:'test-results/futebol-3d/janela-'+(closed?'fechada':'aberta')+'-sem-negocios.png'});
 }
 st.inv.camarote=149.99;await page.evaluate(st=>window.renderWindowReview(st),st);await page.waitForFunction(()=>!!document.querySelector('[aria-busy="false"]'));
 assert.equal(await page.locator('[data-stadium-complete="true"]').count(),0);assert.equal(await page.locator('[data-stadium-layer^="retratil"]').count(),0);
 st.inv.camarote=150;await page.evaluate(st=>window.renderScene(st),st);await page.waitForFunction(()=>!!document.querySelector('[aria-busy="false"]'));
 for(const key of ['hotel','loja','chopp','praca','estacao','estac'])assert.equal(await page.locator('[data-world-layer="'+key+':'+key+'"]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: office open/closed roof independently of businesses, no duplicate roof, incomplete stands cannot close, aerial does not gain unowned buildings.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
