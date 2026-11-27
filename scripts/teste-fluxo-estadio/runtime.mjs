import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const port=5493,base=`http://127.0.0.1:${port}`,out=process.env.QA_OUT??'/tmp/fluxo-estadio-20261127'
mkdirSync(out,{recursive:true});process.env.DEPLOY_BASE='/'
const server=await createServer({base:'/',cacheDir:'/tmp/fluxo-estadio-vite',plugins:[{name:'fluxo-estadio-bancada',enforce:'pre',transform(code,id){
 if(!id.endsWith('/src/escalacao/pyramidseason.tsx'))return
 return code.replace('const penMode = soloCareer',"const penMode = (new URLSearchParams(location.search).has('penalti')&&round===5)||soloCareer").replace('const calBarra = (() => {',`Object.assign(window,{qaAba:escolheAba,qaApito:()=>{setRevealed(round);setCalApitado({r:round,s:calSn})},qaIntervalo:()=>setHalftimeOpen(true),qaFluxo:{tab,round,pend3d,giroOk,viu3d:viu3d.current,jogo3d,halfMode,halftimeDone,halftimeOpen,penMode,penaltyDone,copaPlaying,copaPendente,copaMidOn,copaSegura,chaveCopa,calFase,calI,calFim,meNaFaseCopa,posJogoPendente,criseTrava,evento:!!eventoPendente,myXI:myXI.map(c=>c.id),copaSemanas,cupMyWeeks:copa?.rounds.map((f,i)=>({name:f.name,week:copaSemanas[i],mine:f.ties.some(t=>t.a.you||t.b.you)})).filter(f=>f.mine&&f.week)}});const calBarra = (() => {`)
}}],server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}})
await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']})
const checks=[],errors=[];let active
const ok=(value,name)=>{assert(value,name);checks.push(name);console.log('PASS',name)}
async function context(traditional,width,extra='',round=4){
 const ctx=await browser.newContext({viewport:{width,height:950},locale:'pt-BR'})
 await ctx.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close())
 // This tests navigation, not rendering speed. Only the stadium-opening completion signal is simulated.
 await ctx.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('esc-sim-manual','1');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:get.call(this,t,...a)}})
 const p=active=await ctx.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)})
 await p.goto(`${base}/scripts/teste-fluxo-estadio/?round=${round}${traditional?'&tradicional=1':''}${extra}`,{waitUntil:'domcontentloaded'})
 await p.waitForFunction(()=>!!window.qaFluxo)
 return {ctx,p}
}
async function next(p){
 await p.evaluate(()=>qaApito());const review=p.locator('[data-career-post-match]');await review.waitFor();await review.locator('[data-post-match-continue]').click()
 await p.getByRole('button',{name:/Campo 3D/i}).first().waitFor()
}
async function choose3d(p){
 for(let i=0;i<8&&!await p.getByRole('button',{name:/Campo 3D/i}).count();i++){const skip=p.getByRole('button',{name:/^Pular\s*[›>]?$/i});if(!await skip.count())break;await skip.first().click();await p.waitForTimeout(100)}
 await p.getByRole('button',{name:/Campo 3D/i}).first().click()
 await p.waitForFunction(()=>qaFluxo.tab==='estadio'&&!!qaFluxo.pend3d)
 await p.evaluate(()=>qaGiro(qaFluxo.pend3d.giro))
 await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).waitFor()
}
try{
 for(const traditional of (process.env.QA_SCENARIO==='advanced'?[]:[false,true]))for(const width of [390,1440]){
  const label=`${traditional?'tradicional':'oficial'}-${width}`
  const {ctx,p}=await context(traditional,width)
  console.log('START',label,await p.evaluate(()=>qaFluxo))
  await next(p);await choose3d(p)
  await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click()
  await p.waitForFunction(()=>qaState.round===5)
  await p.waitForTimeout(250)
  ok(await p.evaluate(()=>qaFluxo.tab==='estadio'&&qaFluxo.viu3d),label+': início efetivo permanece no estádio')
  await p.screenshot({path:`${out}/${label}-inicio.png`})
  // A legacy preference must not reintroduce mandatory half-time after its retirement.
  if(process.env.QA_RETIRED!=='0'){
   await p.evaluate(()=>qaPatch({careerSubMode:'intervalo',careerSubModeDesde:undefined}))
   await p.waitForTimeout(150)
   ok(await p.evaluate(()=>!qaFluxo.halfMode),label+': save antigo não rearma pausa obrigatória')
   await p.evaluate(()=>qaAba('elenco'))
   ok(!await p.getByRole('button',{name:/Só no intervalo|Dinâmico/}).count(),label+': seletor antigo removido')
  }
  await ctx.close()
 }
 // Decision timing is controlled only in the fixture; the route effect is production code.
 {const {ctx,p}=await context(false,390,'&penalti=1');await next(p);await choose3d(p);await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click();await p.waitForFunction(()=>qaFluxo.round===5&&qaFluxo.penMode);await p.waitForTimeout(150);ok(await p.evaluate(()=>qaFluxo.tab==='estadio'&&qaFluxo.viu3d),'pênalti decisivo não tira do 3D no início');await ctx.close()}
 for(const traditional of [false,true]){
  const probe=await context(traditional,390);const mine=await probe.p.evaluate(()=>qaFluxo.cupMyWeeks);console.log('CUP MY WEEKS',traditional,mine);await probe.ctx.close();assert(mine?.length,'bancada precisa de inscrição real na copa');const round=mine[0].week,{ctx,p}=await context(traditional,390,'',round)
  await next(p);await choose3d(p)
  ok(await p.evaluate(()=>qaFluxo.pend3d.chave.endsWith(':c')),'copa de quarta: escolha pertence à copa '+(traditional?'tradicional':'oficial'))
  await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click()
  await p.waitForFunction(()=>qaFluxo.copaPlaying&&qaFluxo.copaMidOn)
  await p.waitForTimeout(150)
  ok(await p.evaluate(()=>qaFluxo.tab==='estadio'&&qaFluxo.viu3d),'copa de quarta continua no estádio '+(traditional?'tradicional':'oficial'))
  ok(await p.evaluate(()=>qaState.round)===round,'iniciar copa não joga outra rodada da liga')
  await ctx.close()
 }
 for(const tipo of ['lesao','noitada','crise']){
  const {ctx,p}=await context(false,390);await next(p);await choose3d(p)
  await p.evaluate(tipo=>{const s=qaState,m=s.managers[s.youIdx],c=m.squad.find(c=>qaFluxo.myXI.includes(c.id)&&c.pos==='ATA');if(tipo==='crise'){qaPatch({careerCoins:{...s.careerCoins,[m.id]:-500},careerDebtBarrier:{...s.careerDebtBarrier,[m.id]:-500},careerCrise:{...s.careerCrise,[m.id]:{playerId:c.id,playerName:c.name,pos:c.pos}}})}else qaPatch({agenciaOn:true,eventoTemporada:{season:s.seasonNo,round:s.round,mgrId:m.id,tipo,status:'pendente',cardId:c.id,club:c.club,year:c.year,nome:c.name,pos:c.pos,rodadas:2,historia:'Cenário isolado de preparação.',momento:'preparacao'}})},tipo)
  // A pending decision may already be in the existing global notice. Never click through its modal.
  await p.waitForTimeout(100)
  ok(await p.evaluate(()=>qaState.round)===4,tipo+': bloqueio não gasta partida')
  if(tipo==='crise'){
   await p.getByRole('button',{name:/Nunca gostei dele mesmo/}).click();await p.getByRole('button',{name:'Confirmar',exact:true}).click()
   await p.waitForFunction(()=>!qaFluxo.criseTrava);await p.evaluate(()=>qaAba('central'))
  }else{
   await p.getByRole('button',{name:tipo==='lesao'?/Confirmar a troca/:/Banco por 1 jogo/}).click()
   await p.waitForFunction(()=>qaState.eventoTemporada.status==='banco')
   const resolved=p.getByRole('button',{name:/Preparação resolvida/});if(await resolved.count())await resolved.click();else await p.locator('[data-voltar-central]').click()
  }
  await choose3d(p);await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click()
  await p.waitForFunction(()=>qaState.round===5)
  ok(await p.evaluate(()=>qaFluxo.tab==='estadio'&&qaFluxo.viu3d),tipo+': resolver e escolher 3D recupera o início')
  await ctx.close()
 }
 // Existing interval migration, checked before changing production code.
 if(process.env.QA_RETIRED==='0'){
  const {ctx,p}=await context(false,390)
  await p.evaluate(()=>qaApito());await p.locator('[data-career-post-match]').waitFor()
  await p.evaluate(()=>qaDispatch({type:'SET_SUBMODE',mode:'intervalo'}))
  ok(await p.evaluate(()=>!qaFluxo.halfMode),'preferência entre jogos já vale só no próximo: não bloqueia semana anterior')
  await p.locator('[data-post-match-continue]').click();await choose3d(p);await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click()
  await p.waitForFunction(()=>qaFluxo.round===5&&qaFluxo.halfMode)
  await p.evaluate(()=>qaIntervalo());await p.getByRole('dialog',{name:'Intervalo',exact:true}).waitFor()
  console.log('HALFTIME BUTTONS',await p.getByRole('dialog',{name:'Intervalo',exact:true}).getByRole('button').allTextContents())
  await p.getByRole('dialog',{name:'Intervalo',exact:true}).getByRole('button',{name:/Confirmar|segundo tempo|2º tempo/i}).last().click()
  await p.waitForFunction(()=>qaFluxo.halftimeDone)
  ok(await p.evaluate(()=>qaFluxo.tab==='estadio'&&qaFluxo.viu3d),'intervalo já retorna ao 3D após confirmar')
  await ctx.close()
 }
 ok(errors.length===0,'nenhum erro JavaScript nos fluxos testados')
 writeFileSync(out+'/resultado.json',JSON.stringify({checks,errors,webgl:false,physicalPhone:false},null,2))
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:out+'/falha.png',fullPage:true}).catch(()=>{});writeFileSync(out+'/falha.txt',String(e)+'\n'+JSON.stringify(await active.evaluate(()=>window.qaFluxo))+'\n'+await active.locator('body').innerText().catch(()=>''))}throw e}
finally{await browser.close();await server.close()}
