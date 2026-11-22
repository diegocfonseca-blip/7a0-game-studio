import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const origin=process.env.PLANOS_ORIGIN??'http://127.0.0.1:4246',output=process.env.PLANOS_OUTPUT??'/workspace/shared/planos-historia-meta-20261120'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const reports=[]
try{for(const width of [390,1280,320]){
 const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR'}),page=await context.newPage(),errors=[];let goalRequests=0
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'))
 await page.route('**/*',async r=>{
  const url=r.request().url()
  if(new URL(url).pathname==='/rest/v1/rpc/esc_meta_mes_pct'){goalRequests++;return r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:'68'})}
  if(url.startsWith(origin+'/')||url.startsWith('data:'))return r.continue()
  return r.abort()
 })
 await page.goto(origin+'/7a0-game-studio/scripts/teste-planos-historia-meta/',{waitUntil:'domcontentloaded',timeout:90000})
 await page.getByRole('button',{name:'Abrir planos',exact:true}).click()
 const dialog=page.getByRole('dialog'),intro=dialog.locator('.ls1-support-intro')
 await intro.getByRole('progressbar').waitFor({state:'visible',timeout:30000})
 assert.equal(await dialog.locator('.ls1-category[aria-label="Planos"]').locator(':scope > :first-child').getAttribute('class'),'ls1-support-intro')
 assert.equal(await intro.locator('.ll-money-luca').count(),1,'Uma única história, sem o bloco duplicado')
 assert((await intro.innerText()).includes('De dia vendo carro com meu pai'))
 assert((await intro.innerText()).includes('o Luca, meu filho'))
 assert.equal(await intro.getByRole('progressbar').getAttribute('aria-valuenow'),'68')
 assert.equal(await intro.locator('details').count(),0,'História e meta abertas sem toque adicional')
 const checks=await intro.evaluate(el=>{
  const story=el.querySelector('.ll-money-luca'),goal=el.querySelector('.ll-money-meta'),costs=goal.nextElementSibling
  const heading=el.querySelector('h3'),text=story.querySelector('p')
  return{storyBeforeGoal:!!(story.compareDocumentPosition(goal)&Node.DOCUMENT_POSITION_FOLLOWING),goalBeforeCosts:costs.textContent.includes('COFRE'),headingColor:getComputedStyle(heading).color,textColor:getComputedStyle(text).color,overflow:el.scrollWidth>el.clientWidth+1}
 })
 assert(checks.storyBeforeGoal&&checks.goalBeforeCosts);assert.equal(checks.headingColor,'rgb(12, 12, 12)');assert.equal(checks.textColor,'rgb(58, 58, 50)');assert(!checks.overflow)
 await page.screenshot({path:`${output}/topo-${width}.png`})
 await page.setViewportSize({width,height:2400});await dialog.evaluate(el=>el.scrollTo({top:0}));
 await intro.screenshot({path:`${output}/historia-meta-${width}.png`})
 await dialog.getByRole('button',{name:'Seu clube',exact:true}).click();await dialog.getByRole('button',{name:'Planos',exact:true}).click()
 assert.equal(goalRequests,1,'Trocar de categoria não repete a consulta da meta')
 assert.deepEqual(errors,[]);reports.push({width,checks,goalRequests,errors});console.log(JSON.stringify({width,success:true,checks,goalRequests}))
 await context.close()
}writeFileSync(output+'/browser-report.json',JSON.stringify({success:true,previewGoal:68,reports},null,2))}finally{await browser.close()}
