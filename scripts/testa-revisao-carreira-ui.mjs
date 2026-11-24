import {chromium} from 'playwright-core'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
const pasta='/workspace/shared/carreira-revisao-validada-20261123/telas'
mkdirSync(pasta,{recursive:true})
const fixture=JSON.parse(readFileSync('/tmp/carreira-fixture-publica.json','utf8'))
const servidor=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5199','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/'},stdio:['ignore','pipe','pipe']})
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('servidor local não iniciou')),30000);servidor.stdout.on('data',d=>{if(String(d).includes('Local:')){clearTimeout(t);resolve()}});servidor.on('exit',code=>{clearTimeout(t);reject(Error('servidor saiu: '+code))})})
const browser=await chromium.launch({executablePath:process.env.PW_CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
try{
 const resultados=[]
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},locale:'pt-BR'})
  await ctx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort())
  await ctx.addInitScript(s=>{localStorage.setItem('esc-solo-inprogress-v1',JSON.stringify(s));localStorage.setItem('esc-lang','pt');localStorage.setItem('esc-tema','claro')},fixture)
  const p=await ctx.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message))
  await p.goto('http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'})
  const jogo=p.getByText('LEILÃO LEGENDS 38',{exact:true});if(await jogo.count())await jogo.click()
  await p.waitForFunction(()=>window.__escState?.screen==='season',null,{timeout:60000})
  await p.waitForTimeout(1800)
  assert(!/Ops, algo deu errado/.test(await p.locator('body').innerText()))
  await p.screenshot({path:`${pasta}/central-${width}.png`,fullPage:false})
  const elenco=p.getByRole('button',{name:/^elenco$/i}).last()
  if(await elenco.count())await elenco.click()
  else await p.getByText('ELENCO',{exact:true}).last().click()
  await p.waitForTimeout(1200)
  const txt=await p.locator('body').innerText()
  await p.screenshot({path:`${pasta}/elenco-${width}.png`,fullPage:true})
  assert(!/Ops, algo deu errado/.test(txt));assert.equal(erros.length,0,erros.join('\n'))
  const cal=await p.evaluate(()=>({season:window.__escState.oficialFisica?.season,n:Object.keys(window.__escState.oficialFisica?.clubes??{}).length,screen:window.__escState.screen}))
  assert.equal(cal.season,4);assert(cal.n>0,'calendário físico persistido no navegador')
  resultados.push({width,erros,cal,folha:txt.includes('SALÁRIO')||txt.includes('Salário')||txt.includes('salário')})
  await ctx.close()
 }
 for(const width of [390,1440]){
  const renovacao=structuredClone(fixture);renovacao.screen='reserveList';renovacao.reserveListMesmo=true;renovacao.contratosOn=true
  const m=renovacao.managers[0],need={GOL:1,LAT:2,ZAG:2,MEI:3,ATA:3}
  m.formation='4-3-3';m.squad=Object.entries(need).flatMap(([pos,n])=>m.squad.filter(c=>c.pos===pos).slice(0,n)).map(c=>({...c,contratoAte:renovacao.seasonNo-1}))
  const ctx=await browser.newContext({viewport:{width,height:900},locale:'pt-BR'})
  await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
  await ctx.addInitScript(s=>{localStorage.setItem('esc-solo-career',JSON.stringify(s));localStorage.setItem('esc-solo-career-at',String(Date.now()))},renovacao)
  const p=await ctx.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message))
  await p.goto('http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'})
  const jogo=p.getByText('LEILÃO LEGENDS 38',{exact:true});if(await jogo.count())await jogo.click()
  await p.getByRole('button',{name:/continuar/i}).first().click({timeout:12000})
  await p.waitForFunction(()=>window.__escState?.screen==='reserveList',null,{timeout:15000})
  await p.waitForTimeout(1000)
  assert.match(await p.locator('body').innerText(),/reposição|replacement/)
  assert(await p.getByRole('button',{name:/Contrate uma reposição|Deixar ir/}).first().isDisabled())
  assert.equal(erros.length,0,erros.join('\n'))
  await p.screenshot({path:`${pasta}/renovacao-${width}.png`,fullPage:true})
  resultados.push({width,tela:'renovacao',erros,travaMinimo:true});await ctx.close()
 }
 writeFileSync(pasta+'/resultado.json',JSON.stringify(resultados,null,2));console.log('PASS navegador: central e elenco, 390/1440, calendário estável, sem exceções')
}finally{await browser.close();servidor.kill('SIGTERM')}
