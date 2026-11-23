import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/copas-piloto-20261123';fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const errors=[],checks=[],main='6b5cf422-d4ad-4c69-a7e6-da1125c85844',guest='eb02f1d6-de80-4304-ab49-512342f3c7b7'
const check=(name,value)=>{assert(value,name);checks.push(name)}
async function open(width,{kind='world',field=false,guestUser=false,step=1,minute=10,running=true,pen=false,account,duration=16000,leagueCompetition}={}){
 if(field&&!leagueCompetition)duration=43902
 const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage(),uid=guestUser?guest:main
 const clock={revision:1,step,running,manual:true,speed:1,started_at:new Date(Date.now()-minute/93*duration*.82).toISOString(),updated_at:new Date().toISOString(),duration_ms:duration,extra_ms:40000,vel2d:1}
 let rows=[],seq=0,closing=false
 const payload=()=>({rev:clock.revision,step:clock.step,running:clock.running,linhas:[],planos:rows,planos_ativos:true})
 const setClock=patch=>{Object.assign(clock,patch);clock.revision++}
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
    const p=route.request().postDataJSON(),minute=Math.round((Date.now()-Date.parse(clock.started_at))/(clock.duration_ms*.82)*93)
    const from=p.p_live?Math.ceil(minute+4500/(clock.duration_ms*.82)*93):0
    rows=[...rows,{id:p.p_id,uid,seq:++seq,step:clock.step+(p.p_live?0:1),from,plan:p.p_plan}];clock.revision++
    response={ok:true,from,state:payload()}
   }
   if(url.pathname==='/rest/v1/esc_anuncios_fixos')response=[{texto:'Patrocinador da bancada',link:'https://example.com/'}]
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)})
  }
  if(url.pathname==='/src/escalacao/online-preview.ts'){
   try{const r=await route.fetch();return route.fulfill({response:r,body:(await r.text())+`\nstarted=true;enabled=false;verifiedEmail=${JSON.stringify(account??(guestUser?'gfpicolo13@gmail.com':'diego.c.fonseca@gmail.com'))};`})}catch(e){if(!closing)errors.push(e.message);return route.abort().catch(()=>{})}
  }
  return route.continue()
 })
 const query=new URLSearchParams({kind,...(field?{field:'1'}:{}),...(guestUser?{guest:'1'}:{}),...(pen?{pen:'1'}:{})})
 const target=leagueCompetition?`http://127.0.0.1:5178/scripts/teste-football-full/?competition=${leagueCompetition}${field?'&field=1':''}${guestUser?'&guest=futpoint':''}`:`http://127.0.0.1:5178/scripts/teste-copas-piloto/?${query}`
 await page.goto(target,{waitUntil:'networkidle'})
 return{page,clock,setClock,getRows:()=>rows,close:async()=>{closing=true;await context.close()}}
}
const tabs=['Partida','Copa e jogos','Estatísticas','Elenco','Rivalidades']
async function verifyTabs(page,label,quick=false){
 await page.waitForSelector(quick?'.fp-match-primary':'.fp-cup-layout',{timeout:20000})
 const native=await page.locator('.ov3-native').first().elementHandle(),canvas=await page.locator('.ov3-native canvas').first().elementHandle().catch(()=>null)
 for(const name of tabs){
  await page.getByRole('button',{name,exact:true}).first().evaluate(b=>b.click())
  check(`${label}: ${name} mantém transmissão`,await native.evaluate(el=>el===document.querySelector('.ov3-native')&&el.getBoundingClientRect().height>50))
  if(canvas)check(`${label}: ${name} mantém canvas`,await canvas.evaluate(el=>el===document.querySelector('.ov3-native canvas')))
  check(`${label}: ${name} mantém telão único`,await page.locator('.fp-match-ad-board:visible').count()===1)
  if(!quick){const labels={'Partida':'Partida da Copa','Copa e jogos':'Copa e jogos','Estatísticas':'Estatísticas da Copa','Elenco':'Elencos da Copa','Rivalidades':'Rivalidades da Copa'};check(`${label}: conteúdo próprio de ${name}`,await page.locator(`.fp-cup-panel[aria-label="${labels[name]}"]`).isVisible())}
 }
 await page.getByRole('button',{name:'Partida',exact:true}).first().evaluate(b=>b.click())
 check(`${label}: sem excesso horizontal`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
}
try{
 for(const width of (process.env.QA_FOCUS?[]:[390,1440]))for(const kind of ['world','euro','america','regional','liberta']){
  const test=await open(width,{kind,guestUser:width===1440})
  console.log('OPEN',width,kind)
  await verifyTabs(test.page,`${width}:${kind}`)
  if(width===1440)check(`${kind}: chat na lateral`,await test.page.locator('.fp-chat-docked').isVisible())
  await test.page.screenshot({path:`${out}/${width}-${kind}.png`,fullPage:true})
  await test.close()
 }
 for(const kind of ['world','regional','liberta']){
  const t=await open(390,{kind,minute:0,duration:60000}),page=t.page
  await page.waitForSelector('.fp-cup-plan')
  console.log('PLANS',kind,await page.locator('.fp-advanced-tactics').evaluateAll(nodes=>nodes.map(el=>({kind:el.className,parent:el.parentElement?.className}))));
  await page.locator('.fp-cup-plan').getByRole('button',{name:'Pressão alta',exact:true}).click()
  await page.locator('.fp-cup-plan').getByRole('button',{name:'Rápido',exact:true}).click()
  await page.waitForFunction(()=>!document.body.innerText.includes('Salvando plano…'))
  check(`${kind}: todas as escolhas confirmadas no envio`,t.getRows().at(-1).plan.pressure==='high'&&t.getRows().at(-1).plan.pace==='fast')
  await page.getByRole('button',{name:'Enviar ordens',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.fp-cup-plan')?.textContent.includes('ENTRA AOS'))
  check(`${kind}: ordem ao vivo confirmada`,t.getRows().some(r=>r.from>0&&r.step===1))
  await page.getByRole('button',{name:'Elenco',exact:true}).first().evaluate(b=>b.click())
  t.setClock({step:2,running:true,started_at:new Date().toISOString()})
  await page.waitForFunction(()=>document.querySelector('.fp-cup-heading')?.textContent.includes('2/'),{timeout:15000})
  await page.getByRole('button',{name:'Partida',exact:true}).first().evaluate(b=>b.click())
  check(`${kind}: pressão continua na próxima partida`,await page.locator('.fp-cup-plan').getByRole('button',{name:'Pressão alta',exact:true}).getAttribute('aria-pressed')==='true')
  check(`${kind}: ritmo continua na próxima partida`,await page.locator('.fp-cup-plan').getByRole('button',{name:'Rápido',exact:true}).getAttribute('aria-pressed')==='true')
  await t.close()
 }
 for(const field of [false,true]){
  const t=await open(390,{kind:'euro',step:8,minute:93,pen:true,field}),page=t.page
  await page.waitForSelector('.fp-cup-penalties')
  if(field)check('final de seleções: canvas 2D verdadeiro',await page.locator('.ov3-native canvas').count()>0)
  check(`${field?'2D':'cinema'}: disputa dentro da transmissão`,await page.locator('.ov3-native .fp-cup-penalties').count()===1)
  const pen=await page.locator('.fp-cup-penalties').boundingBox(),ad=await page.locator('.fp-match-ad-board').boundingBox()
  check(`${field?'2D':'cinema'}: disputa antes de anúncio e controles`,pen.y+pen.height<=ad.y+1)
  await verifyTabs(page,`${field?'2D':'cinema'}: final`)
  await page.screenshot({path:`${out}/390-final-${field?'2d':'cinema'}.png`,fullPage:true})
  await t.close()
 }
 const t=await open(390,{kind:'euro',step:3,minute:93,running:false}),page=t.page
 await page.waitForSelector('.fp-cup-layout')
 await page.getByRole('button',{name:'Elenco',exact:true}).first().evaluate(b=>b.click())
 t.setClock({step:4,running:false,manual:false,updated_at:new Date().toISOString()})
 await page.waitForSelector('.fp-broadcast-transition',{timeout:15000})
 check('transição aparece com outra aba selecionada',await page.locator('.fp-broadcast-transition').isVisible())
 check('transição fica no lugar do jogo',await page.locator('.ov3-native .fp-broadcast-transition').count()===1)
 check('resumo mantém classificados e eliminados',/PASSARAM|CAÍRAM|FASE DE GRUPOS ENCERRADA/i.test(await page.locator('.fp-broadcast-transition').innerText()))
 await page.screenshot({path:`${out}/390-transicao-elenco.png`,fullPage:true});await t.close()
 for(const field of [false,true]){
  const t=await open(390,{field,leagueCompetition:'cup-final-pen'}),page=t.page
  await page.waitForSelector('.ov3-native .fp-cup-penalties',{timeout:60000})
  check(`Copa dos 8 ${field?'2D':'cinema'}: disputa colada ao jogo`,await page.locator('.ov3-native .fp-cup-penalties').count()===1)
  const pen=await page.locator('.ov3-native .fp-cup-penalties').boundingBox(),ad=await page.locator('.fp-match-ad-board').boundingBox()
  check(`Copa dos 8 ${field?'2D':'cinema'}: disputa antes do telão`,pen.y+pen.height<=ad.y+1)
  await verifyTabs(page,`Copa dos 8 ${field?'2D':'cinema'}`,true)
  await page.locator('.ov3-native .fp-cup-penalties').screenshot({path:`${out}/390-copa8-${field?'2d':'cinema'}-penaltis.png`});await t.close()
 }
 const intro=await open(390,{leagueCompetition:'cup-opening'}),introPage=intro.page
 await introPage.waitForSelector('.ov3-native .fp-broadcast-transition')
 await introPage.getByRole('button',{name:'Elenco',exact:true}).first().evaluate(b=>b.click())
 check('Copa dos 8: abertura no palco durante outra aba',await introPage.locator('.ov3-native .fp-broadcast-transition').isVisible())
 await intro.close()
 const publicUser=await open(390,{account:'outro@example.com'})
 check('outra conta não recebe o piloto',await publicUser.page.locator('.fp-cup-layout').count()===0);await publicUser.close()
 check('sem exceções JavaScript',errors.length===0)
 fs.writeFileSync(`${out}/resultado.json`,JSON.stringify({checks,errors},null,2));console.log(`PASS: ${checks.length} verificações das copas`)
}catch(e){console.error(e);fs.writeFileSync(`${out}/falha.json`,JSON.stringify({checks,errors,error:String(e)},null,2));throw e}finally{await browser.close()}
