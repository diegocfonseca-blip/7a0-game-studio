const assert=require('node:assert/strict');const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('bl_lang','pt'));await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());await p.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-velocidade.html');
assert.equal(await p.getByRole('button',{name:'0,5× · Lento',exact:true}).count(),0);
await p.getByRole('button',{name:'Abrir estádio'}).click();
for(const [name,speed] of [['0,5× · Lento','0.5'],['0,25× · Bem lento','0.25']]){await p.getByRole('button',{name,exact:true}).click();await p.waitForFunction(v=>document.querySelector('#speed').textContent===v,speed);assert.equal(await p.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true')}
await p.getByRole('button',{name:'Ritmo anterior'}).click();await p.waitForFunction(()=>document.querySelector('#speed').textContent==='4');
await p.getByRole('button',{name:'0,25× · Bem lento',exact:true}).click();await p.getByRole('button',{name:'Sair do estádio'}).click();await p.waitForFunction(()=>document.querySelector('#speed').textContent==='4');
assert.equal(await p.locator('fieldset').count(),0);
await p.getByRole('button',{name:'Abrir estádio'}).click();
await p.getByRole('button',{name:'0,5× · Lento',exact:true}).click();
await p.getByRole('button',{name:'Ritmo anterior'}).click();
await p.getByRole('button',{name:'Simulação 2×'}).click();
await p.getByRole('button',{name:'0,25× · Bem lento',exact:true}).click();
await p.getByRole('button',{name:'Sair do estádio'}).click();
await p.waitForFunction(()=>document.querySelector('#speed').textContent==='2');
assert.deepEqual(errors,[]);console.log('PASS: slow rates without tier/manual dependencies; latest previous speed restored and controls removed on exit.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
