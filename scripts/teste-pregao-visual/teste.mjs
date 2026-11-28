import {createServer} from 'vite'
import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const out='/workspace/shared/pregao-publico-20261128';mkdirSync(out,{recursive:true})
process.env.DEPLOY_BASE='/'
const server=await createServer({cacheDir:'/tmp/vite-pa28-producao',optimizeDeps:{entries:['scripts/teste-pregao-visual/index.html']},server:{host:'127.0.0.1',port:5581,strictPort:true,hmr:false,watch:null}})
await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const results=[]
try{
const cases=[[432,936],[360,800],[320,720],[701,900],[1024,768],[1280,720],[1440,900]].filter(([w])=>!process.env.QA_WIDTH||w===Number(process.env.QA_WIDTH))
for(const[width,height]of cases) for(const duo of [false,true]) {
 const ctx=await browser.newContext({viewport:{width,height}})
 await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5581')?r.continue():r.abort())
 await ctx.routeWebSocket('**/*',w=>w.close())
 await ctx.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('esc-sound-muted','1');const animate=Element.prototype.animate;Element.prototype.animate=function(...args){const animation=animate.apply(this,args);if(this.classList.contains('pa28-flight')){window.qaFlights??=[];window.qaFlights.push('start');animation.finished.then(()=>window.qaFlights.push('landed')).catch(()=>{})}return animation}})
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.goto('http://127.0.0.1:5581/scripts/teste-pregao-visual/'+(duo?'?duas=1':''),{waitUntil:'networkidle'});await p.waitForFunction(()=>window.qaState?.pa);await p.evaluate(()=>document.fonts.ready)
 assert.equal(await p.locator('.pa28-mesa').count(),duo?2:1)
 assert.equal(await p.locator('.pa28-purchases').count(),1)
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}/${duo}`)
 assert(await p.locator('.pa28-pitch').isVisible())
 for(const info of await p.locator('.pa28-info').all()){assert(await info.evaluate(el=>{const r=el.getBoundingClientRect(),m=el.closest('.pa28-mesa').getBoundingClientRect();return r.width>60&&r.right<=m.right}),`informações cabem na mesa ${width}/${duo}`)}
 const initial=await p.evaluate(()=>window.qaState.managers[0].money)
 const mesa=p.locator('.pa28-mesa').first(),input=mesa.locator('input')
 await input.fill('99999');assert(await mesa.getByRole('button',{name:'DAR LANCE',exact:true}).isDisabled())
 await input.fill('18');await input.press('Enter');assert.equal(await p.evaluate(()=>window.qaState.pa.preco),18)
 assert(await mesa.locator('.pa28-quick button').first().isDisabled(),'não cobre seu próprio lance')
 // Mouse e teclado usam a identidade atual. A outra mesa continua independente.
 if(duo){await p.evaluate(()=>{const s=window.qaState;window.qaDispatch({type:'PREGAO_ABERTO_LANCE',mgrId:s.managers[1].id,valor:8,mesa:1,cardId:s.pa.m2.card.id})})}
 await p.waitForFunction(()=>window.qaState.pa.vendidos.some(v=>v.cardId==='qa-Neymar'),null,{timeout:12000})
 await p.waitForTimeout(850)
 assert.match(await mesa.locator('.pa28-stamp').innerText(),/Futpoint FC LEVOU/i)
 const geo=await mesa.evaluate(el=>{const stamp=el.querySelector('.pa28-stamp').getBoundingClientRect(),footer=el.querySelector('.pa28-front>div:first-child>div.relative:last-child').getBoundingClientRect();return{stampBottom:stamp.bottom,nameTop:footer.top}})
 assert(geo.stampBottom<=geo.nameTop,'carimbo preserva nome')
 const sale=await p.evaluate(()=>window.qaState.pa.vendidos.find(v=>v.cardId==='qa-Neymar'))
 assert.equal(sale.preco,18)
 assert.equal(await p.evaluate(()=>window.qaState.managers[0].money),initial-18)
 await p.screenshot({path:`${out}/${width}-${duo?'duas':'uma'}-revelacao.png`,fullPage:true})
 await p.waitForFunction(()=>window.qaState.currentCards[0]?.id!=='qa-Neymar'&&!(window.qaState.pa.viraAte>Date.now()))
 assert.equal(await p.locator('.pa-palco').count(),0)
 assert.deepEqual(errors,[])
 const geometry=await p.locator('.pa28-pitch').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom}})
 const flights=await p.evaluate(()=>window.qaFlights??[])
 if([432,1280,1440].includes(width))assert(flights.includes('landed'),`chegada da miniatura ${width} ${duo}`)
 results.push({width,height,duo,errors,geo,geometry,flights,automaticNext:true})
 console.log('OK',width,duo?'duas':'uma',geometry,flights)
 await ctx.close()
}
writeFileSync(out+'/conferencia'+(process.env.QA_WIDTH?'-'+process.env.QA_WIDTH:'')+'.json',JSON.stringify(results,null,2))
}finally{await browser.close();await server.close()}
