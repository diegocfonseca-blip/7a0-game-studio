import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/visuais-classico-20261123'
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const main='diego.c.fonseca@gmail.com',checks=[],errors=[]
const check=(name,value)=>{assert(value,name);checks.push(name)}
async function open(width,account,kind){
 const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage()
 await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'))
 const uid=account===main?'6b5cf422-d4ad-4c69-a7e6-da1125c85844':'00000000-0000-4000-8000-000000000101'
 const clock={revision:1,step:1,running:true,manual:true,speed:1,started_at:new Date().toISOString(),updated_at:new Date().toISOString(),duration_ms:600000,extra_ms:40000,vel2d:1}
 let rows=[],seq=0
 const payload=()=>({rev:clock.revision,step:clock.step,running:true,linhas:[],planos:rows,planos_ativos:true})
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(url.hostname!=='127.0.0.1'){
   let response=[]
   const rpc=url.pathname.split('/rpc/')[1]
   if(rpc==='esc_copa_preview_clock'||rpc==='esc_regional_clock')response={server_ms:Date.now(),clock}
   if(rpc==='esc_copa_taticas')response=payload()
   if(rpc==='esc_copa_plano_registrar')response={ok:true}
   if(rpc==='esc_copa_plano_set'){
    const p=route.request().postDataJSON()
    rows=[...rows,{id:p.p_id,uid,seq:++seq,step:clock.step+1,from:0,plan:p.p_plan}];clock.revision++
    response={ok:true,from:0,state:payload()}
   }
   if(url.pathname==='/rest/v1/esc_anuncios_fixos')response=[{texto:'Patrocinador da bancada',link:'https://example.com'}]
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)})
  }
  if(url.pathname==='/src/escalacao/online-preview.ts'){
   const r=await route.fetch()
   return route.fulfill({response:r,body:(await r.text())+`\nstarted=true;enabled=false;verifiedEmail=${JSON.stringify(account)};window.qaAccount=email=>{verifiedEmail=email;listeners.forEach(fn=>fn())};`})
  }
  return route.continue()
 })
 const target=kind?`teste-copas-piloto/?kind=${kind}${account===main?'':'&public=1'}`:`teste-football-full/?${account===main?'':'public=1'}`
 await page.goto(`http://127.0.0.1:5178/scripts/${target}`,{waitUntil:'networkidle'})
 await page.waitForFunction(()=>document.body.classList.contains('fp-match-available')).catch(async error=>{console.log('OPEN FAILED',target,await page.locator('body').evaluate(b=>({classes:b.className,text:b.innerText.slice(0,1600)})),errors);await page.screenshot({path:`${out}/falha-abertura.png`});throw error})
 return{page,close:()=>context.close(),getRows:()=>rows}
}
const style=node=>{const s=getComputedStyle(node);return{background:s.backgroundColor,image:s.backgroundImage,color:s.color,font:s.fontSize,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}}
try{
 for(const width of (process.env.QA_CUPS_ONLY?[]:[390,1440]))for(const [tag,account] of [['diego',main],['futpoint','gfpicolo13@gmail.com'],['secundaria','diego.c.fonseca2@gmail.com'],['publico','outro@example.com']]){
  const t=await open(width,account),{page}=t,label=`${width} ${tag}`,holo=account===main
  check(`${label}: brilho só na conta principal`,await page.locator('body').evaluate((b,holo)=>b.classList.contains('fp-match-holo')===holo,holo))
  check(`${label}: rodada com contraste`,await page.locator('.fp-round-badge').evaluate(node=>{const s=getComputedStyle(node);return s.backgroundColor==='rgb(244, 236, 214)'&&s.color==='rgb(12, 12, 12)'}))
  const selected=page.locator('.ov3-tabs-slot .ll25-tabs button[aria-pressed=true]')
  check(`${label}: degradê exclusivo`,(await selected.evaluate(style)).image.includes('linear-gradient')===holo)
  await page.evaluate(()=>{window.qaBefore=JSON.stringify(window.qaFull.state)})
  await page.getByRole('button',{name:'Voltar ao visual anterior',exact:true}).click()
  await page.waitForFunction(()=>!document.body.classList.contains('fp-match-pilot'))
  check(`${label}: troca de visual não altera a sala`,await page.evaluate(()=>window.qaBefore===JSON.stringify(window.qaFull.state)))
  const panel=page.locator('.fp-tactics-minimal')
  check(`${label}: anterior com quatro controles`,await panel.locator('.fp-order-group').count()===4)
  check(`${label}: anterior mantém fundo escuro e seleção creme`,await panel.evaluate(node=>getComputedStyle(node).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(node.querySelector('button[aria-pressed=true]')).backgroundColor==='rgb(244, 236, 214)'))
  check(`${label}: anterior sem título grande`,await panel.locator('h3').count()===0)
  for(const tab of ['Tabela','Estatísticas','Elenco','Rivalidades','Partida']){
   const button=page.locator('.ov3-tabs-slot .ll25-tabs').getByRole('button',{name:tab,exact:true})
   await button.evaluate(b=>b.click())
   check(`${label}: aba ${tab} marcada`,await button.getAttribute('aria-pressed')==='true')
   const s=await button.evaluate(style)
   check(`${label}: aba ${tab} roxa`,holo?s.image.includes('linear-gradient'):s.background==='rgb(105, 65, 181)'&&s.image==='none')
  }
  await panel.getByRole('button',{name:'Pressão alta',exact:true}).evaluate(b=>b.click())
  await panel.getByRole('button',{name:'Pontas',exact:true}).evaluate(b=>b.click())
  await panel.getByRole('button',{name:'Rápido',exact:true}).evaluate(b=>b.click())
  await page.waitForFunction(()=>{const s=window.qaFull.state,p=s.footballNextPlans?.[s.managers[s.youIdx].id];return p?.pressure==='high'&&p?.attack==='wings'&&p?.pace==='fast'})
  check(`${label}: plano salvo usando o reducer existente`,true)
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${tag}-${width}-anterior.png`,fullPage:false})
  if(tag==='publico'&&width===390){await panel.screenshot({path:`${out}/taticas-anterior.png`})}
  await page.getByRole('button',{name:'Ativar novo visual',exact:true}).click()
  await page.waitForFunction(()=>document.body.classList.contains('fp-match-pilot'))
  check(`${label}: novo visual conserva o plano`,await page.locator('.fp-advanced-tactics').getByRole('button',{name:'Pressão alta',exact:true}).getAttribute('aria-pressed')==='true')
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${tag}-${width}-novo.png`,fullPage:false})
  await page.reload({waitUntil:'networkidle'})
  check(`${label}: preferência pelo novo visual persiste`,await page.locator('body').evaluate(b=>b.classList.contains('fp-match-pilot')))
  if(holo){
   await page.evaluate(()=>window.qaAccount('gfpicolo13@gmail.com'))
   await page.waitForFunction(()=>!document.body.classList.contains('fp-match-holo'))
   check(`${label}: brilho removido ao trocar de conta`,true)
  }
  check(`${label}: sem rolagem horizontal da página`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await t.close()
 }
 for(const kind of ['euro','regional','liberta']){
  const t=await open(390,'outro@example.com',kind),{page}=t
  await page.waitForSelector('.fp-cup-plan')
  await page.getByRole('button',{name:'Voltar ao visual anterior',exact:true}).click()
  await page.waitForSelector('.fp-cup-plan.fp-tactics-minimal')
  const panel=page.locator('.fp-cup-plan.fp-tactics-minimal')
  check(`${kind}: anterior usa o controlador próprio da Copa`,await panel.locator('.fp-order-group').count()===4)
  await panel.getByRole('button',{name:'Pressão alta',exact:true}).evaluate(b=>b.click())
  await page.waitForFunction(()=>!document.querySelector('.fp-cup-plan .fp-plan-status').textContent.includes('Confirmando'))
  check(`${kind}: alteração usa a mesma confirmação da Copa`,t.getRows().at(-1)?.plan.pressure==='high')
  await page.getByRole('button',{name:'Ativar novo visual',exact:true}).click()
  await page.waitForSelector('.fp-cup-layout')
  check(`${kind}: retorno conserva o plano`,await page.locator('.fp-cup-plan').getByRole('button',{name:'Pressão alta',exact:true}).getAttribute('aria-pressed')==='true')
  await t.close()
 }
 check('sem exceções JavaScript',errors.length===0)
 fs.writeFileSync(`${out}/resultado.json`,JSON.stringify({checks:checks.length,names:checks,errors},null,2))
 console.log(`PASS: ${checks.length} visual/behaviour checks: classic and new, account-only sheen, navigation, remembered plans and cups.`)
}catch(error){fs.writeFileSync(`${out}/falha.json`,JSON.stringify({message:error.message,checks,errors},null,2));throw error}
finally{await browser.close()}
