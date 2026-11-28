import {createServer} from 'vite'
import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
process.env.DEPLOY_BASE='/'
const out='/workspace/shared/pregao-publico-20261128';mkdirSync(out,{recursive:true})
const server=await createServer({cacheDir:'/tmp/vite-pa28-producao',optimizeDeps:{entries:['scripts/teste-pregao-visual/index.html']},server:{host:'127.0.0.1',port:5582,strictPort:true,hmr:false,watch:null}});await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const result=[]
async function page(query='',options={}){
 const ctx=await browser.newContext({viewport:{width:1440,height:900},...options})
 await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5582')?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close())
 await ctx.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('esc-sound-muted','1');window.qaFlights=[];const original=Element.prototype.animate;Element.prototype.animate=function(...args){const a=original.apply(this,args);if(this.classList.contains('pa28-flight')){window.qaFlights.push('start');a.finished.then(()=>window.qaFlights.push('landed')).catch(()=>{})}return a}})
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5582/scripts/teste-pregao-visual/?'+query,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.qaState?.pa);return {ctx,p,errors}
}
try{
 // Atalhos reais, campo numérico sem interceptação e identidade atual do convidado.
 {
 const {ctx,p,errors}=await page('duas=1');await p.keyboard.press('2');assert.equal(await p.evaluate(()=>window.qaState.pa.preco),5)
 const input=p.locator('.pa28-mesa').nth(1).locator('input');await input.fill('');await input.press('8');assert.equal(await input.inputValue(),'8');assert.equal(await p.evaluate(()=>window.qaState.pa.m2.preco),0)
 await p.evaluate(()=>{const s=structuredClone(window.qaState);s.youIdx=1;window.qaReplace(s)})
 await input.blur();await p.keyboard.press('8');assert.equal(await p.evaluate(()=>window.qaState.pa.m2.lider),await p.evaluate(()=>window.qaState.managers[1].id))
 await p.evaluate(()=>{const s=structuredClone(window.qaState),you=s.managers[s.youIdx];you.money=8;s.pa.m2.preco=8;s.pa.m2.lider=you.id;s.pa.lider=null;s.pa.preco=0;window.qaReplace(s)})
 assert(await p.locator('.pa28-mesa').first().locator('.pa28-quick button').first().isDisabled(),'dinheiro preso na outra mesa')
 assert.match(await p.locator('.pa28-mesa').first().locator('.pa28-controls>p').innerText(),/caixa livre/)
 assert.deepEqual(errors,[]);await ctx.close();result.push('teclado/input/identidade/caixa compartilhado')
 }
 {
 const {ctx,p,errors}=await page('online=1&vazio=1')
 assert.equal(await p.locator('.pa28-purchase').count(),0)
 await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>window.qaActions?.filter(a=>a.type==='PREGAO_ABERTO_TICK').length??0),0,'convidado não avança o motor')
 const input=p.locator('.pa28-mesa input').first();await input.fill('12');await input.press('Enter')
 const action=await p.evaluate(()=>window.qaActions.at(-1));assert.equal(action.type,'PREGAO_ABERTO_LANCE');assert.equal(action.by,'qa-user');assert.equal(action.cardId,'qa-Neymar');assert.equal(action.valor,12)
 assert.match(await p.locator('.pa28-controls>p').first().innerText(),/Enviando/)
 await p.waitForTimeout(5100);assert.match(await p.getByRole('alert').innerText(),/não chegou ao dono/)
 await input.fill('13');await input.press('Enter')
 await p.evaluate(()=>{const s=structuredClone(window.qaState);s.pa.lider=s.managers[0].id;s.pa.preco=13;window.qaReplace(s)})
 await p.waitForTimeout(100);assert.match(await p.locator('.pa28-controls>p').first().innerText(),/Você lidera/)
 assert.deepEqual(errors,[]);await ctx.close();result.push('convidado sem tick/envio autenticado/timeout/eco do host/histórico vazio')
 }
 {
 const {ctx,p,errors}=await page('',{reducedMotion:'reduce'})
 await p.locator('.pa28-quick button').first().click();await p.waitForFunction(()=>window.qaState.pa.vendidos.some(v=>v.cardId==='qa-Neymar'));await p.waitForTimeout(1450)
 assert.deepEqual(await p.evaluate(()=>window.qaFlights),[]);assert.equal(await p.locator('.pa28-flight').count(),0)
 await p.evaluate(()=>window.qaMount(false));await p.evaluate(()=>window.qaMount(true));await p.waitForTimeout(800)
 assert.deepEqual(await p.evaluate(()=>window.qaFlights),[]);assert.deepEqual(errors,[]);await ctx.close();result.push('movimento reduzido/retomada sem animar compras antigas')
 }
 {
 const {ctx,p,errors}=await page();await p.locator('.pa28-quick button').first().click();await p.waitForFunction(()=>window.qaState.pa.vendidos.some(v=>v.cardId==='qa-Neymar'));await p.waitForTimeout(720)
 assert(await p.locator('.pa28-flight').count()>0);await p.evaluate(()=>window.qaMount(false));await p.waitForTimeout(800);assert.equal(await p.locator('.pa28-flight').count(),0);assert.deepEqual(errors,[]);await ctx.close();result.push('desmontar durante voo limpa animação e timers')
 }
 {
 const {ctx,p,errors}=await page();await p.setViewportSize({width:432,height:936});assert.equal(await p.locator('.pa28-purchases').count(),1);await p.setViewportSize({width:1280,height:720});assert.equal(await p.locator('.pa28-purchases').count(),1);assert.deepEqual(errors,[]);await ctx.close();result.push('redimensionar mantém uma faixa e um conjunto de controles')
 }
 writeFileSync(out+'/interacoes.json',JSON.stringify(result,null,2));console.log('OK',result)
}finally{await browser.close();await server.close()}
