import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/diego-abas-placar-permanente-20261122';fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const errors=[],checks=[]
const identity=`\nstarted=true;enabled=false;verifiedEmail=new URLSearchParams(location.search).get('account')||'diego.c.fonseca@gmail.com';window.qaAccount=value=>{verifiedEmail=value;listeners.forEach(fn=>fn())};`
async function open(width,query=''){
 const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage()
 let closing=false
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(url.hostname!=='127.0.0.1'){
   if(url.pathname==='/rest/v1/esc_anuncios_fixos')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{texto:'Marca A · Oferta de teste A',link:'https://example.com/anuncio-a'},{texto:'Marca B · Oferta de teste B',link:'https://example.com/anuncio-b'}])})
   const sample=new URLSearchParams(query.replace(/^\?/,'' )).get('retro')
   const rows={fregues:[5,2,1],rival:[1,2,5],equilibrado:[3,4,3],zero:[0,0,0]}
   const values=url.pathname==='/rest/v1/esc_retrospecto'?rows[sample]:null
   const body=values?JSON.stringify([{a:'6b5cf422-d4ad-4c69-a7e6-da1125c85844',b:'eb02f1d6-de80-4304-ab49-512342f3c7b7',vit_a:values[0],empates:values[1],vit_b:values[2],ultimos:''}]):'[]'
   return route.fulfill({status:200,contentType:'application/json',body})
  }
  if(url.pathname==='/src/escalacao/online-preview.ts'){
   try{const response=await route.fetch({maxRetries:2});return await route.fulfill({response,body:(await response.text())+identity})}catch(error){if(!closing&&!page.isClosed())errors.push(`Falha na identidade da bancada: ${error.message}`);return route.abort().catch(()=>{})}
  }
  return route.continue()
 })
 await page.goto('http://127.0.0.1:5178/scripts/teste-football-full/'+query,{waitUntil:'networkidle'})
 console.log('OPEN',query,await page.evaluate(()=>({screen:window.qaFull?.state.screen,mode:window.qaFull?.state.copaMode,online:window.qaFull?.state.onlineMode,youUid:window.qaFull?.state.youUid,url:location.href,qa:typeof window.qaAccount})))
 const post=new URLSearchParams(query.replace(/^\?/,'' )).get('competition')?.startsWith('post-')
 await page.waitForSelector(post?'.ov3-primary-active .fp-match-ad-board':'.fp-match-primary',{timeout:20000}).catch(async e=>{console.log(errors,await page.locator('body').innerText());await page.screenshot({path:`out/falha.png`.replace('out',out),fullPage:true});throw e})
 if(!post)await page.waitForFunction(()=>document.body.classList.contains('fp-match-pilot'))
 await checkMatchAd(page,`${width}: ${query||'liga'}`)
 return{context:{close:async()=>{closing=true;await context.close()}},page}
}
const check=(name,value)=>{assert(value,name);checks.push(name)}
async function checkMatchAd(page,label){
 const primary=page.locator('.ov3-primary-active'),native=primary.locator(':scope > .ov3-native'),ad=primary.locator(':scope > .ov3-ad-slot .fp-match-ad-board')
 await ad.waitFor()
 check(`${label}: um único telão na transmissão`,await page.locator('.fp-match-ad-board:visible').count()===1&&await primary.locator('.placa-led:visible').count()===1)
 const gap=await primary.evaluate(node=>{const field=node.querySelector(':scope > .ov3-native').getBoundingClientRect(),board=node.querySelector(':scope > .ov3-ad-slot .fp-match-ad-board').getBoundingClientRect();return board.top-field.bottom})
 check(`${label}: telão imediatamente abaixo do jogo (intervalo ${gap}px)`,gap>=-1&&gap<=25)
 check(`${label}: telão sem moldura bege`,await ad.evaluate(node=>{const style=getComputedStyle(node);return style.backgroundColor==='rgb(12, 12, 12)'&&style.borderTopWidth==='0px'&&style.paddingTop==='0px'&&style.boxShadow==='none'}))
}
async function checkPersistentFrame(page,label,field=false){
 const native=await page.locator('.ov3-native').first().elementHandle(),tabs=await page.locator('.fp-page-tabs').elementHandle()
 const ad=await page.locator('.fp-match-ad-board').elementHandle()
 const canvas=field?await page.locator('.ov3-native canvas').first().elementHandle():null
 const width=(await page.locator('.ov3-native').first().boundingBox()).width
 const timing=await page.evaluate(()=>({round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm?.at,speed:window.qaFull.state.simSpeed}))
 for(const [name,key] of [['Tabela e jogos','table'],['Estatísticas','stats'],['Elenco','squad'],['Rivalidades','rivals'],['Partida','match']]){
  await page.evaluate(()=>window.scrollTo(0,80))
  const scroll=await page.evaluate(()=>scrollY),top=(await page.locator('.fp-page-tabs').boundingBox()).y
  await page.getByRole('button',{name,exact:true}).first().evaluate(button=>button.click())
  await page.waitForFunction(key=>document.body.dataset.fpPage===key,key)
  check(`${label}: ${name} conserva placar visível`,await page.locator('.ov3-native').first().isVisible())
  check(`${label}: ${name} conserva o mesmo placar`,await native.evaluate(node=>node===document.querySelector('.ov3-native')))
  check(`${label}: ${name} conserva as mesmas abas`,await tabs.evaluate(node=>node===document.querySelector('.fp-page-tabs')))
  check(`${label}: ${name} não força salto ao início`,Math.abs(await page.evaluate(()=>scrollY)-scroll)<2)
  check(`${label}: ${name} mantém a posição das abas`,Math.abs((await page.locator('.fp-page-tabs').boundingBox()).y-top)<2)
  check(`${label}: ${name} mantém largura do jogo`,Math.abs((await page.locator('.ov3-native').first().boundingBox()).width-width)<2)
  check(`${label}: ${name} mantém controles`,await page.locator('.fp-match-playback').isVisible())
  check(`${label}: ${name} mantém o mesmo telão visível`,await page.locator('.fp-match-ad-board').isVisible()&&await ad.evaluate(node=>node===document.querySelector('.fp-match-ad-board')))
  await checkMatchAd(page,`${label}: ${name}`)
  if(canvas)check(`${label}: ${name} conserva o mesmo canvas 2D`,await canvas.evaluate(node=>node===document.querySelector('.ov3-native canvas')))
  if(key==='rivals')check(`${label}: rivalidades ficam abaixo do placar`,(await page.locator('.ov3-rivalries').boundingBox()).y>=(await page.locator('.ov3-native').first().boundingBox()).y+(await page.locator('.ov3-native').first().boundingBox()).height)
  if(key==='table')check(`${label}: jogos ficam abaixo do placar`,(await page.locator('#ll26-round-games').boundingBox()).y>=(await page.locator('.ov3-native').first().boundingBox()).y+(await page.locator('.ov3-native').first().boundingBox()).height)
 }
 check(`${label}: rodada, início e velocidade preservados`,JSON.stringify(timing)===JSON.stringify(await page.evaluate(()=>({round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm?.at,speed:window.qaFull.state.simSpeed}))))
}
try{
 for(const width of [390,1440]){
  const {page,context}=await open(width,'?account=outro%40example.com&public=1&competition=next-rival&retro=fregues')
  check(`${width}: UID público e cadeira própria`,await page.evaluate(()=>window.qaFull.state.youUid==='00000000-0000-4000-8000-000000000101'&&window.qaFull.state.youIdx===0))
  const identity=await page.evaluate(()=>({uid:window.qaFull.state.youUid,idx:window.qaFull.state.youIdx,round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm?.at}))
  await page.locator('.fp-advanced-tactics').getByRole('button',{name:'Equilíbrio',exact:true}).click()
  check(`${width}: clicar na escolha atual não cria salvamento`,await page.evaluate(()=>!window.qaFull.state.footballNextPlans))
  await page.locator('.fp-advanced-tactics').getByRole('button',{name:'Pressão alta',exact:true}).click()
  await page.locator('.fp-advanced-tactics').getByRole('button',{name:'Rápido',exact:true}).click()
  await page.waitForFunction(()=>{const s=window.qaFull.state,p=s.footballNextPlans?.[s.managers[s.youIdx].id];return p?.pressure==='high'&&p?.pace==='fast'})
  check(`${width}: plano público salvo pelo reducer`,true)
  check(`${width}: rodada e identidade intactas`,JSON.stringify(identity)===JSON.stringify(await page.evaluate(()=>({uid:window.qaFull.state.youUid,idx:window.qaFull.state.youIdx,round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm?.at}))))
  if(width===1440){
   const boxes=await page.locator('.fp-advanced-tactics .fp-order-group').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})))
   check('desktop: plano da liga em 2×2',boxes.length===4&&Math.abs(boxes[0].y-boxes[1].y)<2&&Math.abs(boxes[2].y-boxes[3].y)<2&&boxes[2].y>boxes[0].y&&boxes[1].x>boxes[0].x)
   check('desktop: chat encerra a lateral da liga',await page.locator('.ll-dir').evaluate(el=>el.lastElementChild.classList.contains('fp-chat-target')))
  }
  await checkPersistentFrame(page,`${width}: participante público`)
  await page.getByRole('button',{name:'Voltar ao visual anterior',exact:true}).click();await page.waitForFunction(()=>!document.body.classList.contains('fp-match-pilot'))
  check(`${width}: participante público pode reverter o visual`,true)
  check(`${width}: reverter não apaga o plano`,await page.evaluate(()=>window.qaFull.state.footballNextPlans?.[window.qaFull.state.managers[0].id]?.pressure==='high'))
  await page.getByRole('button',{name:'Ativar novo visual',exact:true}).click();await page.waitForFunction(()=>document.body.classList.contains('fp-match-pilot'))
  check(`${width}: retorno mantém escolha salva`,await page.locator('.fp-advanced-tactics').getByRole('button',{name:'Pressão alta',exact:true}).getAttribute('aria-pressed')==='true')
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/publico-${width}.png`,fullPage:true});await context.close()
 }
 check('nenhum erro JavaScript',errors.length===0)
 fs.writeFileSync(`${out}/resultado.json`,JSON.stringify({checks,errors},null,2));console.log(`PASS: ${checks.length} checagens da liberação pública`)
}finally{await browser.close()}
