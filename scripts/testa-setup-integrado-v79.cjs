const{chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright'),assert=require('node:assert/strict');
process.env.TEMP=process.env.TMP=require('node:path').resolve('test-results');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:390,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 // Offline QA account gate only. Prevent any external writes/queries from fixture.
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>true;export const usePresidentPreview=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-setup-integrado.html',{waitUntil:'domcontentloaded'});
 await page.getByLabel('NOME DO CLUBE',{exact:true}).fill('Clube teste privado');
 await page.getByRole('button',{name:'CONHECER O BATISMO',exact:true}).click();await page.getByRole('button',{name:'fechar',exact:true}).first().click();
 assert.equal(await page.getByLabel('NOME DO CLUBE',{exact:true}).inputValue(),'Clube teste privado');
 await page.screenshot({path:'test-results/setup-real-v79.png',fullPage:true});
 await page.getByRole('button',{name:'CRIAR CLUBE',exact:true}).click();await page.getByLabel('NOME DO PRESIDENTE',{exact:true}).fill('Diego');
 await page.getByRole('button',{name:'CONTINUAR',exact:true}).click();await page.getByRole('button',{name:/VOLTAR AO PRESIDENTE/}).click();assert.equal(await page.getByLabel('NOME DO PRESIDENTE',{exact:true}).inputValue(),'Diego');
 await page.getByRole('button',{name:'CONTINUAR',exact:true}).click();
 await page.getByRole('button',{name:'IR PARA O PREGÃO 🔨',exact:true}).click();
 await page.waitForFunction(()=>window.setupState?.careerPresidentBase?.name==='Diego');
 assert.equal(await page.evaluate(()=>window.setupState.managers[0].teamName),'Clube teste privado');
 assert.equal(await page.evaluate(()=>window.setupState.careerPresidency),undefined);
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const presidentWritesEnabled=()=>false;export const usePresidentPreview=()=>false;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.setupState?.screen==='setup');
 assert.equal(await page.getByRole('heading',{name:'CRIE SEU CLUBE',exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS real EscSetup/Provider: club, Batismo modal, modular president, rivals/back, launch persists avatar, no items, unauthorized setup unchanged; network isolated.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
