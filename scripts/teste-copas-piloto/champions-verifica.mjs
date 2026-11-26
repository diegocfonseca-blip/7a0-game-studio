import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright-core')
const out=process.env.QA_OUTPUT||'/tmp/champions-layout-20261126';fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const errors=[],checks=[],main='6b5cf422-d4ad-4c69-a7e6-da1125c85844',guest='eb02f1d6-de80-4304-ab49-512342f3c7b7'
const check=(name,value)=>{assert(value,name);checks.push(name);console.log('OK',name)}
async function open(width,{kind='world',field=false,guestUser=false,step=1,minute=10,running=true,pen=false,account,duration=16000,leagueCompetition,rival=false,host=false,underlying=false,spectator=false}={}){
 if(field&&!leagueCompetition)duration=43902
 const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage(),uid=account==='outro@example.com'?'00000000-0000-4000-8000-000000000101':guestUser?guest:main
 const clock={revision:1,step,running,manual:true,speed:1,started_at:new Date(Date.now()-minute/93*duration*.82).toISOString(),updated_at:new Date().toISOString(),duration_ms:duration,extra_ms:40000,vel2d:1}
 let rows=[],seq=0,closing=false;const commands=[]
 const payload=()=>({rev:clock.revision,step:clock.step,running:clock.running,linhas:[],planos:rows,planos_ativos:true})
 const setClock=patch=>{Object.assign(clock,patch);clock.revision++}
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(url.hostname!=='127.0.0.1'){
   let response=rival&&url.pathname==='/rest/v1/esc_retrospecto'?[{a:uid,b:guest,vit_a:4,empates:2,vit_b:3,ultimos:'BBAEEABAA'}]:[]
   const rpc=url.pathname.split('/rpc/')[1]
   if(rpc==='esc_copa_preview_clock'||rpc==='esc_regional_clock'){
    const p=route.request().postDataJSON();if(!['init','read'].includes(p.p_command)){commands.push(p);if(p.p_command==='next')setClock({step:clock.step+1,running:true,started_at:new Date().toISOString()});if(p.p_command==='manual'||p.p_command==='auto')setClock({manual:p.p_command==='manual'})}
    response={server_ms:Date.now(),clock}
   }
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
 const query=new URLSearchParams({kind,...(host?{host:'1'}:{}),...(underlying?{underlying:'1'}:{}),...(spectator?{spectator:'1'}:{}),...(rival?{rival:'1'}:{}),...(account==='outro@example.com'?{public:'1'}:{}),...(field?{field:'1'}:{}),...(guestUser?{guest:'1'}:{}),...(pen?{pen:'1'}:{})})
 const target=leagueCompetition?`http://127.0.0.1:5187/scripts/teste-football-full/?competition=${leagueCompetition}${field?'&field=1':''}${guestUser?'&guest=futpoint':''}`:`http://127.0.0.1:5187/scripts/teste-copas-piloto/?${query}`
 await page.goto(target,{waitUntil:'networkidle'})
 return{page,clock,setClock,getRows:()=>rows,commands,close:async()=>{closing=true;await context.close()}}
}

async function tabs(p,label){
 const native=await p.locator('.fp-cup-layout .ov3-native').elementHandle()
 for(const [name,panel] of [['Partida','Partida da Copa'],['Copa e jogos','Copa e jogos'],['Estatísticas','Estatísticas da Copa'],['Elenco','Elencos da Copa'],['Rivalidades','Rivalidades da Copa']]){
  await p.locator('.fp-cup-layout').getByRole('button',{name,exact:true}).click()
  check(label+': '+name+' acessível',await p.locator(`.fp-cup-panel[aria-label="${panel}"]`).isVisible())
  check(label+': '+name+' mantém partida montada',await native.evaluate(el=>el.isConnected&&el.getBoundingClientRect().height>50))
 }
}
async function zones(p,width){
 await p.locator('.fp-cup-layout').getByRole('button',{name:'Copa e jogos',exact:true}).click()
 const table=p.locator(width>=1100?'.fp-cup-aside .fp-cup-table':'.fp-cup-panel[aria-label="Copa e jogos"] .fp-cup-table').first()
 check('36 clubes abertos',await table.locator('tbody tr').count()===36)
 for(const [zone,n] of [['qualified',8],['playoff',16],['out',12]])check(zone+': '+n,await table.locator(`tr[data-zone="${zone}"]`).count()===n)
 check('dois cortes 8/24',await table.locator('tr.zone-cut').count()===2)
 check('legenda três zonas',await table.locator('.fp-cup-zones li').count()===3)
}
try{
 for(const width of (process.env.QA_EXTRA||process.env.QA_CEREMONY?[]:[390,1440]))for(const role of ['host','guest','spectator']){
  const t=await open(width,{kind:'champions',host:role==='host',guestUser:role==='guest',spectator:role==='spectator',underlying:true,duration:600000}),p=t.page,label=width+':'+role
  await p.waitForSelector('.fp-cup-layout .fp-match-primary')
  if(role!=='spectator')await p.waitForSelector('.fp-cup-layout .fp-cup-plan')
  check(label+': host controla ritmo',await p.locator('.fp-cup-layout .fp-match-playback').count()===(role==='host'?1:0))
  check(label+': troca de visual só host',await p.locator('.fp-cup-layout .ov3-viewline select').count()===(role==='host'?1:0))
  check(label+': tática dentro da Champions',await p.locator('.fp-cup-layout .fp-cup-plan').count()===(role==='spectator'?0:1))
  if(width>=1100){check(label+': chat único na lateral',await p.locator('.fp-cup-aside .fp-chat-docked').count()===1&&await p.locator('.fp-chat-docked').count()===1)
   if(role!=='spectator'){const boxes=await p.locator('.fp-cup-plan .fp-order-group').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));check(label+': táticas 2 por 2',boxes.length===4&&Math.abs(boxes[0].y-boxes[1].y)<2&&Math.abs(boxes[2].y-boxes[3].y)<2&&boxes[2].y>boxes[0].y)}
  }else{
   check(label+': um botão de chat',await p.locator('.pc-launcher').count()===1)
   await p.locator('.pc-launcher').click();check(label+': chat abre',await p.locator('.pc-chat:visible').count()===1)
   await p.locator('.pc-close').click()
  }
  await tabs(p,label);await zones(p,width)
  check(label+': sem excesso horizontal',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  if(role==='guest'){
   await p.locator('.fp-cup-layout').getByRole('button',{name:'Partida',exact:true}).click()
   const plan=p.locator('.fp-cup-plan')
   
   await plan.getByRole('button',{name:'Pressão alta',exact:true}).click()
   await p.waitForFunction(()=>!document.body.innerText.includes('Salvando plano…'))
   check(label+': mudança confirmada',t.getRows().at(-1)?.plan.pressure==='high')
   await plan.getByRole('button',{name:'Enviar ordens',exact:true}).click()
   await p.waitForFunction(()=>document.querySelector('.fp-cup-plan')?.textContent.includes('Ordem confirmada'))
   check(label+': ordem ao vivo confirmada',t.getRows().some(r=>r.from>0))
  }
  if(width===1440&&role==='host'){
   await p.locator('.fp-cup-layout .ll31-back-room').click()
   check('fechar copa restaura chat da liga',await p.locator('.fp-cup-layout').count()===0&&await p.locator('.fp-chat-docked').count()===1)
   await p.getByRole('button',{name:'Reabrir Champions'}).click()
   await p.locator('.fp-cup-layout').getByRole('button',{name:'Partida',exact:true}).click()
   await p.waitForSelector('.fp-cup-layout .fp-cup-plan')
   check('reabrir mantém tática dentro da copa',await p.locator('.fp-cup-layout .fp-cup-plan').count()===1)
  }
  await p.screenshot({path:out+'/'+label.replace(':','-')+'.png',fullPage:true});await t.close()
 }
 for(const field of (process.env.QA_EXTRA||process.env.QA_CEREMONY?[]:[false,true])){
  const t=await open(390,{kind:'champions',field,host:true,underlying:true,step:0,running:false}),p=t.page
  await p.waitForSelector('.fp-cup-layout .fp-cup-plan')
  check('preparação não finge rodada 1',await p.locator('.fp-cup-heading').innerText().then(t=>t.includes('PREPARAÇÃO')))
  await p.locator('.fp-cup-layout .ov3-next').click()
  await p.waitForFunction(()=>document.querySelector('.fp-cup-heading')?.textContent.includes('1/8'))
  await p.waitForSelector('.fp-cup-layout .fp-cup-plan')
  check((field?'2D':'placar')+': botão inicia próximo passo',t.commands.some(c=>c.p_command==='next'))
  if(field)check('2D usa canvas',await p.locator('.fp-cup-layout .ov3-native canvas').count()>0)
  await t.close()
 }
 for(const skip of (process.env.QA_EXTRA?[]:[false,true])){
  const t=await open(390,{kind:'champions',step:18,running:true,underlying:true,duration:600000}),p=t.page
  await p.waitForSelector('.fp-cup-layout')
  await p.locator('.fp-cup-layout').getByRole('button',{name:'Copa e jogos',exact:true}).click()
  await p.locator('.fp-cup-stages').getByRole('button',{name:/Fase de liga/}).click()
  check('tabela escolhida antes da festa',await p.locator('.fp-cup-panel[aria-label="Copa e jogos"]').isVisible())
  t.setClock({step:19,running:false})
  await p.waitForSelector('.cc-cinema')
  if(skip)await p.getByRole('button',{name:'Pular ›',exact:true}).click()
  else{await p.waitForTimeout(6100);check('vídeo não é cortado pelo timer antigo de 5,6s',await p.locator('.cc-cinema').isVisible())}
  await p.waitForSelector('.cc-cinema',{state:'detached',timeout:12000})
  check('encerramento preserva aba da tabela',await p.locator('.fp-cup-panel[aria-label="Copa e jogos"]').isVisible())
  check('encerramento mantém Champions aberta',await p.locator('.fp-cup-layout').count()===1)
  await p.locator('.fp-cup-layout').getByRole('button',{name:'Copa e jogos',exact:true}).click()
  await p.locator('.fp-cup-stages').getByRole('button',{name:/Fase de liga/}).click()
  check('tabela acessível após vídeo',await p.locator('.fp-cup-panel[aria-label="Copa e jogos"] .fp-cup-table tbody tr').count()===36)
  check('campeão permanece identificado',await p.locator('.fp-cup-layout .ov3-champion').count()===1)
  await t.close()
 }
 if(process.env.QA_EXTRA){
  for(const kind of ['world','liberta','regional']){
   const t=await open(1440,{kind,underlying:true,duration:600000}),p=t.page
   await p.waitForSelector('.fp-cup-layout .fp-cup-plan')
   check(kind+': tática no modal isolado',await p.locator('.fp-cup-layout .fp-cup-plan').count()===1)
   check(kind+': chat único',await p.locator('.fp-cup-aside .fp-chat-docked').count()===1)
   await tabs(p,kind);await t.close()
  }
  const classic=await open(390,{kind:'champions',underlying:true,duration:600000}),cp=classic.page
  await cp.waitForSelector('.fp-cup-layout .fp-cup-plan')
  await cp.getByRole('button',{name:'Voltar ao visual anterior',exact:true}).last().click()
  await cp.waitForSelector('.fp-cup-layout',{state:'detached'})
  check('visual anterior mantém táticas da copa',await cp.locator('.ll31-world-online .ov3-tactics').count()===1)
  check('visual anterior mantém chat único',await cp.locator('.pc-launcher').count()===1)
  await cp.getByRole('button',{name:'Ativar novo visual',exact:true}).last().click()
  await cp.waitForSelector('.fp-cup-layout .fp-cup-plan')
  check('retorno ao novo visual mantém transmissão',await cp.locator('.fp-cup-layout .ov3-native').count()===1)
  await classic.close()
  const t=await open(390,{kind:'champions',step:8,minute:93,running:false,duration:600000}),p=t.page
  await p.waitForSelector('.fp-cup-layout')
  for(const step of [9,10,15,16,17,18]){
   t.setClock({step,running:step!==17,started_at:new Date().toISOString()})
   await p.waitForFunction(s=>document.querySelector('.fp-cup-heading h1')?.innerText.toLowerCase().includes(s),step<11?'playoff':step<17?'semifinais':'final')
   check('passo '+step+': transmissão ou transição acessível',await p.locator('.fp-cup-layout .ov3-native').count()===1)
  }
  await t.close()
 }
 check('sem erros JavaScript',errors.length===0)
 fs.writeFileSync(out+(process.env.QA_EXTRA?'/regressoes.json':'/resultado.json'),JSON.stringify({checks,errors},null,2))
 console.log(JSON.stringify({checks:checks.length,errors,out}))
}finally{await browser.close()}
