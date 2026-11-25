const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/shared/central-chegada-integrada-20261125',base=process.env.CHEGADA_URL||'http://127.0.0.1:5387/scripts/teste-cenas-carreira/';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});
 const cases=[];
 try{
  for(const cfg of (process.env.CHEGADA_CASO?[]:[{name:'oficial-romario-mobile',width:390,actor:'romario',trad:false},{name:'tradicional-zico-desktop',width:1440,actor:'zico',trad:true}])){
   const context=await browser.newContext({viewport:{width:cfg.width,height:960},locale:'pt-BR',reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   const url=base+`?round=10&speed=.25&gratis=1&chegada=${cfg.actor}${cfg.trad?'&tradicional=1':''}`;
   try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.qaState,null,{timeout:120000});
    console.log('READY',cfg.name);
    await page.getByRole('button',{name:'Central',exact:true}).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-central-signing-canvas]')].some(c=>c.getClientRects().length),null,{timeout:60000});
    const card=page.locator('.ll-c-sede:visible').first();
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-neighborhood-preview]')].some(c=>c.getClientRects().length&&c.dataset.phase==='playing'),null,{timeout:30000});
    assert.equal(await card.getByRole('button',{name:/Ver no mapa/}).count(),0);
    assert.equal(await page.locator('.pc3-stage canvas').count(),0,'new presentation must not mount the map');
    const before=await page.evaluate(()=>({round:window.qaState.round,coins:window.qaState.careerCoins,squads:window.qaState.managers.map(m=>m.squad.map(c=>[c.id,c.lo,c.hi,c.paid]))}));
    await page.waitForTimeout(4500);await card.screenshot({path:`${out}/${cfg.name}-caminhada.png`});
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-neighborhood-preview]')].some(c=>c.getClientRects().length&&c.dataset.phase==='ended'),null,{timeout:25000});
    await card.screenshot({path:`${out}/${cfg.name}-apresentacao.png`});
    await page.waitForFunction(()=>Object.values(window.qaState.careerNeighborhood??{}).some(d=>d.seen.length===1));
    assert.deepEqual(await page.evaluate(()=>({round:window.qaState.round,coins:window.qaState.careerCoins,squads:window.qaState.managers.map(m=>m.squad.map(c=>[c.id,c.lo,c.hi,c.paid]))})),before);
    await card.getByRole('button',{name:/Ver novamente/}).click();
    await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='playing');
    if(mode==='retry'){
     await page.evaluate(()=>{CanvasRenderingContext2D.prototype.roundRect=()=>{throw new Error('falha de desenho da bancada')}});
     await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='unavailable');
    }
    await card.getByRole('button',{name:'Ver elenco',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('[data-central-signing-canvas]'));
    await page.getByRole('button',{name:'Central',exact:true}).click();
    assert.equal(await page.locator('[data-central-signing-canvas]').count(),0,'seen signing must not repeat after returning');
    await page.getByRole('button',{name:/Rever momentos/}).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-neighborhood-preview]')].some(c=>c.getClientRects().length&&c.dataset.phase==='playing'));
    await page.getByRole('button',{name:/Pular ›/}).first().click();
    assert.equal(await page.locator('[data-central-signing-canvas]').count(),0);
    await page.evaluate(()=>sessionStorage.setItem('qa-ciclo-carreira',JSON.stringify(window.qaState)));
    await page.goto(url+'&retomar=1');await page.waitForFunction(()=>window.qaState,null,{timeout:120000});
    await page.getByRole('button',{name:'Central',exact:true}).click();
    assert.equal(await page.locator('[data-central-signing-canvas]').count(),0,'save preserves seen event');
    assert.deepEqual(errors,[]);
    cases.push({...cfg,noMap:true,replay:true,skip:true,squadLink:true,noRepeat:true,saveResume:true,moneyRatingsAndRoundUnchanged:true,errors});
    console.log('PASS',cfg.name);
   }catch(e){console.log('DEBUG',await page.locator('body').innerText());await page.screenshot({path:out+'/'+cfg.name+'-failure.png',fullPage:true});throw e}
   finally{await context.close()}
  }
  for(const mode of (process.env.CHEGADA_CASO?[process.env.CHEGADA_CASO]:['reduced','retry','portrait'])){
   const context=await browser.newContext({viewport:{width:390,height:844},locale:'pt-BR',reducedMotion:mode==='reduced'?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
   let fail=mode==='retry';page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>{
    const request=r.request(),url=request.url();
    if(new URL(url).hostname!=='127.0.0.1')return r.abort();
    if(request.resourceType()==='image'&&(fail&&url.includes('central-chegada-cenario')||mode==='portrait'&&url.includes('/avatars/')))return r.abort();
    return r.continue();
   });
   try{
    await page.goto(base+`?round=10&speed=.25&gratis=1&chegada=${mode==='visual'?'zico':'barcelona'}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.qaState,null,{timeout:120000});
    await page.getByRole('button',{name:'Central',exact:true}).click();
    const card=page.locator('.ll-c-sede:visible').first();
    if(mode==='reduced'){
     await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='paused');
     assert.equal(await page.evaluate(()=>Object.values(window.qaState.careerNeighborhood??{}).reduce((n,d)=>n+d.seen.length,0)),0);
     await card.getByRole('button',{name:/Reproduzir/}).click();
    }
    if(mode==='retry'){
     await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='unavailable');
     assert.match(await card.innerText(),/Você pode seguir/);fail=false;
     await card.getByRole('button',{name:/Reproduzir/}).click();
    }
    await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='playing');
    if(mode==='portrait'||mode==='visual'){
     await page.waitForFunction(()=>document.querySelector('[data-neighborhood-preview]')?.dataset.phase==='ended',null,{timeout:25000});
     await card.screenshot({path:out+(mode==='visual'?'/enquadramento-mobile.png':'/sem-avatar-mobile.png')});
    }
    await card.getByRole('button',{name:/Pular ›|Seguir ›/}).click();
    assert.equal(await page.locator('[data-central-signing-canvas]').count(),0);assert.equal(await page.locator('.pc3-stage canvas').count(),0);assert.deepEqual(errors,[]);
    cases.push({mode,manualReducedMotion:mode==='reduced',retryAfterImageFailure:mode==='retry',missingPortraitDoesNotBorrowAnotherPlayer:mode==='portrait',skip:true,noMap:true,errors});
    console.log('PASS',mode);
   }finally{await context.close()}
  }
  fs.writeFileSync(out+(process.env.CHEGADA_CASO?'/carreira-runtime-'+process.env.CHEGADA_CASO+'.json':'/carreira-runtime.json'),JSON.stringify({cases},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
