import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/copas-piloto-20261123';fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const errors=[],checks=[],main='6b5cf422-d4ad-4c69-a7e6-da1125c85844',guest='eb02f1d6-de80-4304-ab49-512342f3c7b7'
const check=(name,value)=>{assert(value,name);checks.push(name)}
async function open(width,{kind='world',field=false,guestUser=false,step=1,minute=10,running=true,pen=false,account,duration=16000,leagueCompetition,rival=false}={}){
 if(field&&!leagueCompetition)duration=43902
 const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage(),uid=account==='outro@example.com'?'00000000-0000-4000-8000-000000000101':guestUser?guest:main
 const clock={revision:1,step,running,manual:true,speed:1,started_at:new Date(Date.now()-minute/93*duration*.82).toISOString(),updated_at:new Date().toISOString(),duration_ms:duration,extra_ms:40000,vel2d:1}
 let rows=[],seq=0,closing=false
 const payload=()=>({rev:clock.revision,step:clock.step,running:clock.running,linhas:[],planos:rows,planos_ativos:true})
 const setClock=patch=>{Object.assign(clock,patch);clock.revision++}
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(url.hostname!=='127.0.0.1'){
   let response=rival&&url.pathname==='/rest/v1/esc_retrospecto'?[{a:uid,b:guest,vit_a:4,empates:2,vit_b:3,ultimos:'BBAEEABAA'}]:[]
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
 const query=new URLSearchParams({kind,...(rival?{rival:'1'}:{}),...(account==='outro@example.com'?{public:'1'}:{}),...(field?{field:'1'}:{}),...(guestUser?{guest:'1'}:{}),...(pen?{pen:'1'}:{})})
 const target=leagueCompetition?`http://127.0.0.1:5178/scripts/teste-football-full/?competition=${leagueCompetition}${field?'&field=1':''}${guestUser?'&guest=futpoint':''}`:`http://127.0.0.1:5178/scripts/teste-copas-piloto/?${query}`
 await page.goto(target,{waitUntil:'networkidle'})
 return{page,clock,setClock,getRows:()=>rows,close:async()=>{closing=true;await context.close()}}
}
const tabs=['Partida','Copa e jogos','Estatísticas','Elenco','Rivalidades']
async function verifyTabs(page,label,quick=false){
 await page.waitForSelector(quick?'.fp-match-primary':'.fp-cup-layout',{timeout:20000})
 const native=await page.locator('.ov3-native').first().elementHandle(),canvas=await page.locator('.ov3-native canvas').first().elementHandle().catch(()=>null)
 const rival=page.locator('.ov3-next-rival-slot .ll-next-rivalry'),persistentRival=await rival.elementHandle()
 for(const name of tabs){
  await page.getByRole('button',{name,exact:true}).first().evaluate(b=>b.click())
  check(`${label}: ${name} mantém transmissão`,await native.evaluate(el=>el===document.querySelector('.ov3-native')&&el.getBoundingClientRect().height>50))
  if(canvas)check(`${label}: ${name} mantém canvas`,await canvas.evaluate(el=>el===document.querySelector('.ov3-native canvas')))
  check(`${label}: ${name} mantém telão único`,await page.locator('.fp-match-ad-board:visible').count()===1)
  check(`${label}: ${name} mantém retrospecto marrom`,await rival.isVisible())
  check(`${label}: ${name} conserva o cartão`,await persistentRival.evaluate(node=>node===document.querySelector('.ov3-next-rival-slot .ll-next-rivalry')))
  check(`${label}: ${name} não repete o cartão no corpo da Copa`,await page.locator('.fp-cup-main .ll-next-rivalry:visible').count()===1)
  if(!quick){const labels={'Partida':'Partida da Copa','Copa e jogos':'Copa e jogos','Estatísticas':'Estatísticas da Copa','Elenco':'Elencos da Copa','Rivalidades':'Rivalidades da Copa'};check(`${label}: conteúdo próprio de ${name}`,await page.locator(`.fp-cup-panel[aria-label="${labels[name]}"]`).isVisible())}
 }
 await page.getByRole('button',{name:'Partida',exact:true}).first().evaluate(b=>b.click())
 check(`${label}: sem excesso horizontal`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
}
try{
 const t=await open(1440,{kind:'euro',step:2,minute:35,duration:600000,account:'outro@example.com',rival:true}),page=t.page
 await page.waitForSelector('.fp-cup-aside .ll-next-rivalry')
 check('rivalidade pública na área permanente da partida',await page.locator('.ov3-next-rival-slot .ll-next-rivalry').isVisible())
 check('rivalidade pública na lateral',await page.locator('.fp-cup-aside .ll-next-rivalry').isVisible())
 await page.waitForFunction(()=>/4\s*×\s*3/.test(document.querySelector('.fp-cup-aside .ll-next-rivalry').textContent))
 check('histórico da bancada é exibido',true)
 const boxes=await page.locator('.fp-cup-plan .fp-order-group').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})))
 await page.locator('.fp-cup-plan').getByRole('button',{name:'Normal',exact:true}).first().click()
 await page.waitForTimeout(100)
 check('seleção atual da copa não gera escrita desnecessária',t.getRows().length===0)
 check('plano da copa em 2×2',boxes.length===4&&Math.abs(boxes[0].y-boxes[1].y)<2&&Math.abs(boxes[2].y-boxes[3].y)<2&&boxes[2].y>boxes[0].y)
 check('chat por último na copa',await page.locator('.fp-cup-aside').evaluate(el=>el.lastElementChild.classList.contains('fp-chat-target')))
 await verifyTabs(page,'copa pública com rival humano')
 await page.screenshot({path:`out/desktop-publico.png`.replace('out',out),fullPage:true})
 await t.close();check('sem erros JavaScript',errors.length===0)
 fs.writeFileSync(`${out}/resultado.json`,JSON.stringify({checks,errors},null,2));console.log(`PASS: ${checks.length} checagens da copa pública com rival humano`)
}finally{await browser.close()}
