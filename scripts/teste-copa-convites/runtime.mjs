import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const port=Number(process.env.QA_PORT??5426),out=process.env.QA_OUTPUT??'/workspace/shared/copa-mundo-convites-20261126';mkdirSync(out,{recursive:true})
const server=await createServer({base:'/',cacheDir:'/tmp/qa-copa-convites-20261126',optimizeDeps:{entries:['scripts/teste-copa-convites/index.html']},plugins:[{name:'qa-copa',enforce:'pre',transform(code,id){if(id.endsWith('/src/escalacao/copa-mundo.tsx'))return code.replace('const [localLiveDone, setLiveDone]', 'Object.assign(window,{qaWorldStep:localStep});const [localLiveDone, setLiveDone]')}}],server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']}),report=[];let active
try{
 for(const mode of ['tradicional','oficial'])for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},locale:'pt-BR'});await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close());const p=active=await ctx.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});p.setDefaultTimeout(90000)
  const url=`http://127.0.0.1:${port}/scripts/teste-copa-convites/?mode=${mode}`
  await p.goto(url);await p.getByRole('button',{name:/VER CONVITE DA COPA DO MUNDO/}).click();const paises=await p.evaluate(()=>window.qaWorld.paises)
  if(mode==='tradicional'){
   await p.getByText('✉️ Convites de seleções',{exact:true}).waitFor()
   const choices=p.locator('button.ov3-surface');assert.equal(await choices.count(),32);assert(await choices.nth(0).isDisabled());assert(await choices.nth(3).isDisabled());assert(await choices.nth(4).isEnabled());assert(await choices.nth(31).isEnabled());await p.screenshot({path:`${out}/${mode}-convite-${width}.png`});await choices.nth(4).click()
  }else{await p.getByRole('button',{name:/Aceitar e convocar/}).waitFor();assert((await p.locator('body').innerText()).toLowerCase().includes(paises[4].toLowerCase()));await p.screenshot({path:`${out}/${mode}-convite-${width}.png`});await p.getByRole('button',{name:/Aceitar e convocar/}).click()}
  await p.locator('.cv-top').waitFor();assert((await p.locator('body').innerText()).toLowerCase().includes(paises[4].toLowerCase()));assert.equal(await p.evaluate(()=>window.qaWorld.prizes),0)
  await p.getByRole('button',{name:/trocar de seleção/i}).first().click()
  await p.getByRole('button',{name:mode==='tradicional'?'Recusar os convites desta Copa':'Recusar',exact:true}).click()
  assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('llcopa:'+window.qaWorld.seed)).played.includes(1)));assert.equal(await p.getByRole('button',{name:/VER CONVITE DA COPA DO MUNDO/}).count(),0);assert.equal(await p.evaluate(()=>window.qaWorld.prizes),0)
  await p.reload();await p.waitForFunction(()=>window.qaWorld);assert.equal(await p.getByRole('button',{name:/VER CONVITE DA COPA DO MUNDO/}).count(),0);assert((await p.locator('body').innerText()).includes('5'))
  assert.deepEqual(errors,[]);report.push({mode,width,seasonOneInvitation:true,ranking:true,acceptToCallUp:true,declineNoPrize:true,reloadNoRepeat:true,errors});console.log('PASS',mode,width)
  await ctx.close()
 }
 for(const cfg of [{name:'fora-do-ranking',season:1,pos:-1},{name:'entre-edicoes',season:2,pos:0},{name:'legado-114',season:114,pos:4,extra:'&legacy=1'},{name:'retomada-110',season:110,pos:4,extra:'&resume=1'}]){
  const ctx=await browser.newContext({viewport:{width:390,height:900},locale:'pt-BR'});await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close());const p=active=await ctx.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});p.setDefaultTimeout(90000)
  await p.goto(`http://127.0.0.1:${port}/scripts/teste-copa-convites/?season=${cfg.season}&pos=${cfg.pos}${cfg.extra??''}`);await p.waitForFunction(()=>window.qaWorld)
  const btn=p.getByRole('button',{name:/VER CONVITE DA COPA DO MUNDO/})
  if(!cfg.extra)assert.equal(await btn.count(),0)
  else if(cfg.name==='legado-114'){await btn.waitFor();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('llcopa:'+window.qaWorld.seed)).ciclo),4);assert((await p.locator('body').innerText()).includes('118'))}
  else{await btn.click();await p.waitForFunction(()=>window.qaWorldStep===3);const stamp=await p.evaluate(()=>JSON.parse(localStorage.getItem('llcopa:'+window.qaWorld.seed)).emAndamento),original=await p.evaluate(()=>window.qaOriginalStamp);assert.deepEqual(stamp,original);await p.screenshot({path:`${out}/retomada.png`})}
  assert.deepEqual(errors,[]);report.push({...cfg,errors});console.log('PASS',cfg.name);await ctx.close()
 }
 writeFileSync(out+'/interface.json',JSON.stringify(report,null,2))
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:out+'/falha.png',fullPage:true}).catch(()=>{});writeFileSync(out+'/falha.txt',String(e)+'\n'+await active.locator('body').innerText().catch(()=>''))}throw e}finally{await browser.close();await server.close()}
