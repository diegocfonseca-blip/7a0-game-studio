const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
fs.mkdirSync('test-results',{recursive:true});
process.env.TEMP=process.env.TMP=require('node:path').resolve('test-results');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('bl_lang','pt');window.allowPresident=true});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>window.allowPresident===true;'}));
 const root='http://127.0.0.1:4196/7a0-game-studio/';
 await page.goto(root+'qa-presidencia-clube.html');
 await page.getByLabel('NOME DO PRESIDENTE',{exact:true}).fill('Diego');
 await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA',exact:true}).click();
 await page.getByRole('button',{name:'MOBÍLIAS',exact:true}).click();
 assert.equal(await page.locator('.gp-product').count(),13);
 await page.waitForFunction(()=>[...document.querySelectorAll('.gp-product img')].every(i=>i.complete&&i.naturalWidth>0));
 for(const name of ['Cadeira simples','Mesa simples']){
  const product=page.locator('.gp-product').filter({has:page.getByRole('heading',{name,exact:true})});
  await product.getByRole('button',{name:'COMPRAR',exact:true}).click();
  const before=await page.evaluate(()=>JSON.stringify(window.fixture));
  await page.getByRole('button',{name:'CANCELAR',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)),before);
  await product.getByRole('button',{name:'COMPRAR',exact:true}).click();
  await page.getByRole('button',{name:'CONFIRMAR',exact:true}).click();
 }
 assert.equal(await page.evaluate(()=>window.fixture.careerCoins[7]),108);
 await page.getByRole('button',{name:'VOLTAR',exact:true}).click();
 await page.getByRole('button',{name:'VER MONTAGEM DA SALA',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('.pr-scene img')].every(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await page.locator('[data-president-pose="seated"]').count(),1);
 assert.notEqual(await page.locator('.pr-president-seated').last().evaluate(e=>getComputedStyle(e).clipPath),'none');
 await page.screenshot({path:'test-results/lote2-sala-mobiliada.png',fullPage:true});
 await page.getByRole('button',{name:'VOLTAR',exact:true}).click();
 await page.getByRole('button',{name:'GARAGEM',exact:true}).click();
 assert.equal(await page.locator('.gp-product').count(),3);
 await page.getByRole('button',{name:'MOTOS E BIKES',exact:true}).click();
 assert.equal(await page.locator('.gp-product').count(),1);
 const checks=await page.evaluate(async()=>{
  const {reducer}=await import('/7a0-game-studio/src/escalacao/store.tsx');
  const {carteiraDaCarreira}=await import('/7a0-game-studio/src/escalacao/presidencia-carreira.ts');
  const {orcarPresidencia}=await import('/7a0-game-studio/src/escalacao/presidencia-economia.ts');
  const {STADIUM_SECTORS}=await import('/7a0-game-studio/src/escalacao/estadiodata.ts');
  const state=window.fixture,wallet=carteiraDaCarreira(state,7),q=orcarPresidencia(wallet,{kind:'buy',id:'fusca'}).value;
  const trade={type:'PRESIDENCY_TRADE',mgrId:7,quote:q,confirmed:true};
  const bought=reducer(state,trade);
  const unsupported=orcarPresidencia(wallet,{kind:'buy',id:'bike-usada'}).value;
  const full={...state,stadiums:{7:{inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:['cober','retratil']}}};
  const roof=reducer(full,{type:'PRESIDENCY_ROOF',mgrId:7,closed:true});
  const low={...full,stadiums:{7:{...full.stadiums[7],inv:{...full.stadiums[7].inv,camarote:149.99}}}};
  const result={paid:bought.careerCoins[7]===78,stale:reducer(bought,trade)===bought,
   forged:reducer(state,{...trade,quote:{...q,finalCash:999999}})===state,
   otherManager:reducer(state,{...trade,mgrId:8})===state,
   unavailable:reducer(state,{...trade,quote:unsupported})===state,
   roofWithoutShops:roof.stadiums[7].roofClosed===true,
   roofNoFee:JSON.stringify(roof.careerCoins)===JSON.stringify(full.careerCoins),
   incompleteRoof:reducer(low,{type:'PRESIDENCY_ROOF',mgrId:7,closed:true})===low};
  window.allowPresident=false;
  result.unauthorized= [trade,{type:'PRESIDENCY_DISPLAY',mgrId:7,display:[null,null]},{type:'PRESIDENCY_ROOF',mgrId:7,closed:true}].every(a=>reducer(full,a)===full);
  window.allowPresident=true;return result;
 });
 for(const [key,value] of Object.entries(checks))assert.equal(value,true,key);
 await page.goto(root+'qa-estadio-privado.html?private=1&roof=1');
 await page.getByRole('button',{name:'VISÃO AÉREA',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'FECHAR TETO',exact:true}).count(),0);
 await page.goto(root+'qa-estadio-privado.html?private=1&allWorks=1');
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-stadium-complete] img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.getByRole('button',{name:'VISÃO AÉREA',exact:true}).click();
 await page.getByRole('button',{name:'FECHAR TETO',exact:true}).click();
 await page.waitForFunction(()=>window.fixture.stadiums[7].roofClosed===true);
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-stadium-complete] img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'test-results/lote2-estadio-completo.png',fullPage:true});
 for(const width of [320,390,900]){await page.setViewportSize({width,height:900});assert.ok(await page.getByRole('dialog').evaluate(d=>d.scrollWidth<=d.clientWidth));}
 assert.deepEqual(errors,[]);
 console.log('PASS lote2: 13 furniture images, paid/cancelled purchases, seated pose clipped, 4 ready vehicles, stale/forged/unauthorized transactions denied, roof needs full structure not shops, completed aerial renders, mobile widths. Offline fixtures only.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
