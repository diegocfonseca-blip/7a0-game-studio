const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright'),assert=require('node:assert/strict');
process.env.TEMP=process.env.TMP=require('node:path').resolve('test-results');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>window.allowPresident===true;'}));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-clube.html',{waitUntil:'networkidle'});
 const name=page.getByRole('textbox',{name:'NOME DO PRESIDENTE'});await name.fill('Diego');
 await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA'}).click();await page.getByRole('alert').waitFor();
 assert.ok(await page.evaluate(()=>JSON.stringify(window.fixture)===window.original));
 await page.evaluate(()=>window.allowPresident=true);
 await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA'}).click();await page.getByRole('button',{name:'EDITAR VISUAL'}).waitFor();
 const result=await page.evaluate(()=>{const{careerPresidentBase,...rest}=window.fixture;return{name:careerPresidentBase.name,preserved:JSON.stringify(rest)===window.original}});
 assert.deepEqual(result,{name:'Diego',preserved:true});
 assert.equal(await page.getByRole('button',{name:'GARAGEM',exact:true}).count(),0);
 const beforeRoom=await page.evaluate(()=>JSON.stringify(window.fixture));
 await page.getByRole('button',{name:'VER MONTAGEM DA SALA',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('.pr-scene img')].every(img=>img.complete&&img.naturalWidth>0));
 await page.screenshot({path:'test-results/sala-acesso-estadio-lote1.png',fullPage:true});
 await page.getByRole('button',{name:'IR AO ESTÁDIO',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.stadiumClicks),1);
 assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)),beforeRoom);
 await page.getByRole('button',{name:'VOLTAR',exact:true}).click();
 for(const width of [320,390,900]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.getByRole('button',{name:'EDITAR VISUAL'}).click();assert.equal(await name.inputValue(),'Diego');assert.deepEqual(errors,[]);
 console.log('PASS v69: club entry + actual reducer, denied save unchanged, accepted save opens profile, edit reuses saved name, responsive widths. Auth simulated; no production account used.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
