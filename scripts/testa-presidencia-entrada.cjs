const {chromium}=require('C:/Users/diego/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('node:assert/strict'),path=require('node:path');
process.env.TEMP=process.env.TMP=path.resolve('test-results');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-entrada.html',{waitUntil:'networkidle'});
 const input=page.getByRole('textbox',{name:'NOME DO PRESIDENTE'});
 try{await input.waitFor({timeout:10000})}catch(e){console.error(errors,await page.locator('body').innerText());throw e}assert.equal(await input.inputValue(),'Presidente antigo');assert.equal(await page.locator('[data-office]').count(),0);
 for(const width of [320,390,900]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve('test-results/presidencia-primeiro-acesso-390.png'),fullPage:true});
 await input.fill('   ');assert.ok(await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA'}).isDisabled());
 await input.fill('Diego');await page.getByRole('button',{name:'POLO AZUL'}).click();
 await page.getByRole('button',{name:'VOLTAR',exact:true}).click();assert.equal(await page.evaluate(()=>window.backs),1);
 await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA'}).click();await page.getByRole('alert').filter({hasText:'Não foi possível salvar'}).waitFor();
 assert.equal(await input.inputValue(),'Diego');assert.equal(await page.locator('[data-office]').count(),0);
 assert.ok(await page.evaluate(()=>JSON.stringify(window.fixture)===window.original));
 await page.evaluate(()=>window.fail=false);await page.getByRole('button',{name:'SALVAR E ENTRAR NA SALA'}).click();await page.locator('[data-office]').waitFor();
 const data=await page.evaluate(()=>({s:window.fixture,original:JSON.parse(window.original)}));
 assert.deepEqual(data.s.careerPresidentBase,{version:5,name:'Diego',outfit:'polo',sinceSeason:data.original.seasonNo});
 const {careerPresidentBase,...rest}=data.s;assert.deepEqual(rest,data.original);
 assert.equal(await page.getByRole('textbox',{name:'NOME DO PRESIDENTE'}).count(),0);
 await page.evaluate(()=>window.reopen());await page.locator('[data-office]').waitFor();assert.equal(await page.getByRole('textbox',{name:'NOME DO PRESIDENTE'}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: primeiro acesso exige presidente, legado só sugestão, nome obrigatório, voltar/falha preservam carreira, salvar entra na sala, 320/390/900 sem overflow.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
