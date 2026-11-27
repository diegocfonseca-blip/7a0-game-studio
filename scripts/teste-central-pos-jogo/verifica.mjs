// Real career screen and reducer; only the finished-clock signal is injected in the local bench.
import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const {createServer}=await import('vite'),out=process.env.QA_OUT??'/workspace/shared/central-pos-jogo-20261126',port=Number(process.env.QA_PORT??5442),base=`http://127.0.0.1:${port}`;mkdirSync(out,{recursive:true})
const vite=await createServer({cacheDir:'/tmp/qa-central-pos-jogo-20261126',plugins:[{name:'post-game-bench',enforce:'pre',transform(code,id){if(!id.endsWith('/src/escalacao/pyramidseason.tsx'))return;return code.replace('const calBarra = (() => {',`if(import.meta.env.DEV)Object.assign(window,{qaConfirmarIntervalo:()=>{if(!myMatch||!mgrMe)return;const ini=myMatch.m2?liveInitialIds(myMatch.m2,mgrMe):{ids:myXI.map(c=>c.id),formation:mgrMe.formation};dispatch({type:'SET_HALFTIME',mgrId:youId,round:curMatchIdx,xi2:ini.ids,formation:ini.formation})},qaFinalizarRodada:()=>{setRevealed(round);setCalApitado({r:round,s:calSn})},qaFimAdmin:()=>{viu3d.current=true;setTab('estadio');setClubeSub('financas');setRevealed(round);setCalApitado({r:round,s:calSn})},qaFim3D:()=>{viu3d.current=true;setTab('estadio');setRevealed(round);setCalApitado({r:round,s:calSn})},qaCentral:{round,tab,calFase,calI,calFim,posJogoPendente,posJogoChave,copaPendente,copaMidOn,meNaFaseCopa,halfMode,halftimeDone,penMode,penaltyDone,coletivaOpen}});const calBarra = (() => {`)}}],server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await vite.listen()
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']}),result=[];let active
try{
 for(const cfg of [{width:390,mode:'Placar',tradicional:false},{width:1440,mode:'Campo 2D',tradicional:false},{width:390,mode:'Placar',tradicional:true},{width:1440,mode:'Campo 3D',tradicional:true},{width:390,mode:'Placar',tradicional:false,intervalo:true},{width:1440,mode:'Campo 3D',tradicional:true,admin:true}].filter(c=>(!process.env.QA_ONLY_3D||c.mode==='Campo 3D')&&(!process.env.QA_ONLY_ADMIN||c.admin))){
  const ctx=await b.newContext({viewport:{width:cfg.width,height:1000},locale:'pt-BR'});await ctx.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close());await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}})
  const p=active=await ctx.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});p.setDefaultTimeout(cfg.admin?30000:180000)
  console.log('START',JSON.stringify(cfg));await p.goto(`${base}/scripts/teste-central-pos-jogo/?round=4${cfg.tradicional?'&tradicional=1':''}${cfg.intervalo?'&intervalo=1':''}`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.qaCentral)
  await p.evaluate(()=>window.qaFinalizarRodada());
  if(cfg.intervalo){
   await p.waitForFunction(()=>window.qaCentral.halfMode);assert.equal(await p.evaluate(()=>window.qaCentral.posJogoPendente),false,'intervalo pendente não é fim de jogo')
   await p.evaluate(()=>window.qaConfirmarIntervalo());await p.waitForFunction(()=>window.qaCentral.halftimeDone,null,{timeout:10000})
  }
  const review=p.locator('[data-career-post-match]');await review.waitFor({timeout:30000})
  assert.equal(await p.evaluate(()=>window.qaState.round),4);assert.equal(await p.evaluate(()=>window.qaCentral.tab),'central')
  assert.equal(await review.getByRole('button',{name:/Campo 2D|Campo 3D|Placar rápido/i}).count(),0,'resumo não mostra seletor antes de avançar')
  const table=await review.locator('[data-post-match-table]').boundingBox(),agenda=await review.locator('.ll-c-agenda-pos-jogo').boundingBox();assert(table&&agenda&&agenda.y>=table.y+table.height-1,'agenda abaixo da classificação')
  await review.screenshot({path:`${out}/resumo-${cfg.tradicional?'tradicional':'oficial'}-${cfg.width}.png`})
  await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>window.qaState.round),4,'não joga outra rodada nem pula a revisão sozinho')
  await review.getByRole('button',{name:/tabela completa/i}).click();await p.waitForFunction(()=>window.qaCentral.tab==='jogos');await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.qaCentral.tab),'jogos','a aba original continua acessível')
  await p.getByRole('button',{name:'Central',exact:true}).last().click();await review.waitFor();await review.locator('[data-post-match-continue]').click()
  await review.waitFor({state:'detached'});const choice=p.locator('.ll-calp:visible');await choice.getByRole('button',{name:/Campo 3D/i}).waitFor();assert.equal(await p.evaluate(()=>window.qaState.round),4,'avançar na Central só prepara a escolha')
  await choice.screenshot({path:`${out}/escolha-${cfg.tradicional?'tradicional':'oficial'}-${cfg.width}.png`})
  await choice.getByRole('button',{name:new RegExp(cfg.mode,'i')}).click();assert.equal(await p.evaluate(()=>window.qaState.round),4,'escolher transmissão não começa outra partida sozinho')
  if(cfg.mode==='Campo 3D'){
   await p.waitForFunction(()=>window.qaCentral.tab==='estadio');await p.evaluate(()=>window.qaDispatch({type:'PLAY_ROUND'}));await p.waitForFunction(()=>window.qaState.round===5);await p.evaluate(admin=>admin?window.qaFimAdmin():window.qaFim3D(),!!cfg.admin);if(cfg.admin){await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>window.qaCentral.tab),'estadio','não retira o usuário de Finanças');await p.getByRole('button',{name:/Voltar ao mapa/i}).click();await p.locator('[data-voltar-central]:visible').first().click()}
  }else{
   await p.waitForFunction(()=>window.qaCentral.tab==='jogos');await p.getByRole('button',{name:/^▶ Começar o jogo$/i}).click();await p.waitForFunction(()=>window.qaState.round===5);assert.equal(await p.evaluate(()=>window.qaCentral.posJogoPendente),false);if(cfg.intervalo){await p.evaluate(()=>window.qaConfirmarIntervalo());await p.waitForFunction(()=>window.qaCentral.halftimeDone,null,{timeout:10000})}if(!cfg.tradicional&&cfg.width===390&&!cfg.intervalo){await review.waitFor({timeout:60000})}else await p.evaluate(()=>window.qaFinalizarRodada())
  }
  await review.waitFor();assert.equal(await p.evaluate(()=>window.qaCentral.tab),'central','o fim volta direto à Central');assert.equal(await p.evaluate(()=>window.qaState.round),5);assert.deepEqual(errors,[])
  result.push({...cfg,postGame:true,normalTab:true,agendaBelow:true,noAutoAdvance:true,choiceBeforeNextKickoff:true,returnsToHub:true,errors});console.log('PASS',JSON.stringify(cfg));await ctx.close()
 }
 writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2))
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:out+'/falha.png',fullPage:true}).catch(()=>{});writeFileSync(out+'/falha.txt',String(e)+'\n'+JSON.stringify(await active.evaluate(()=>window.qaCentral))+'\n'+await active.locator('body').innerText().catch(()=>''))}throw e}finally{await b.close();await vite.close()}
