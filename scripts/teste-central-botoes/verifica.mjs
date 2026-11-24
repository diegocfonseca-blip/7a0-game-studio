// Regressão com a tela real. Só a bancada injeta o sinal de apito; não muda o motor publicado.
import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const {createServer}=await import('vite'),out=process.env.QA_OUT??'/workspace/shared/central-botoes-20261124';mkdirSync(out,{recursive:true})
const vite=await createServer({plugins:[{name:'diagnostico-somente-bancada',enforce:'pre',transform(code,id){if(!id.endsWith('/src/escalacao/pyramidseason.tsx'))return;return code.replace('const calBarra = (() => {',`if(import.meta.env.DEV)Object.assign(window,{qaFinalizarRodada:()=>{setRevealed(round);setCalApitado({r:round,s:calSn})},qaCentral:{round,tab,calFase,calI,calFim,copaPendente,copaMidOn,meNaFaseCopa,copaRound,copaDevidas}});const calBarra = (() => {`)}}],server:{host:'127.0.0.1',port:5326,strictPort:true,hmr:false,watch:null}});await vite.listen()
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});const result=[]
try{
 for(const scenario of [{width:390,gratis:true,continental:true},{width:1440,gratis:false,continental:true},{width:390,gratis:true,continental:false},{width:390,gratis:false,continental:true,round:9,ownCup:true}]){
  const c=await b.newContext({viewport:{width:scenario.width,height:1000},locale:'pt-BR'});await c.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5326/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());await c.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).includes('webgl'))return null;return original.call(this,type,...args)}})
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(60000)
  const round=scenario.round??4;await p.goto(`http://127.0.0.1:5326/scripts/teste-central-botoes/?round=${round}${scenario.gratis?'&gratis=1&semplano=1':''}${scenario.continental?'&continental=1':''}`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.qaCentral);await p.evaluate(()=>window.qaFinalizarRodada())
  const hero=p.locator('.ll-calp:visible');await hero.getByRole('button',{name:/Campo 3D/i}).waitFor();for(const name of [/Placar/i,/Campo 2D/i,/Campo 3D/i])assert.equal(await hero.getByRole('button',{name}).count(),1)
  const state=await p.evaluate(()=>window.qaCentral);assert.equal(state.round,round,'não joga outra rodada sozinho')
  if(scenario.ownCup){assert.equal(state.copaPendente,true);assert.equal(state.meNaFaseCopa,true);assert.equal(state.copaMidOn,false,'copa do usuário espera o toque');assert(state.copaRound<state.copaDevidas);}
  else{assert.equal(state.copaPendente,false,'processou todas as fases sem participação');if(scenario.continental)assert.equal(state.copaRound,state.copaDevidas);}
  await hero.screenshot({path:`${out}/depois-${scenario.width}-${scenario.gratis?'gratis':'pago'}${scenario.ownCup?'-copa':''}.png`})
  if(!scenario.ownCup){
   await p.getByRole('button',{name:'Elenco',exact:true}).last().click();await p.getByRole('button',{name:'Central',exact:true}).last().click();await hero.getByRole('button',{name:/Campo 3D/i}).waitFor()
   await hero.getByRole('button',{name:/Placar/i}).click();await p.waitForFunction(()=>window.qaCentral.tab==='jogos');assert.equal(await p.evaluate(()=>window.qaState.round),round,'escolher a transmissão ainda não dá o apito')
   await p.getByRole('button',{name:/^▶ Começar o jogo$/i}).click();await p.waitForFunction(r=>window.qaState.round===r+1,round)
   await p.getByRole('button',{name:'Central',exact:true}).last().click();await p.evaluate(()=>window.qaFinalizarRodada());await hero.getByRole('button',{name:/Campo 3D/i}).waitFor();assert.equal(await p.evaluate(()=>window.qaState.round),round+1,'retornar não salta outra rodada')
   await hero.getByRole('button',{name:/Campo 2D/i}).click();await p.waitForFunction(()=>window.qaCentral.tab==='jogos');assert.equal(await p.evaluate(()=>window.qaState.round),round+1)
  }
  assert.deepEqual(errors,[]);result.push({...scenario,state,errors});console.log('PASS',JSON.stringify(scenario),JSON.stringify(state));await c.close()
 }
 writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2))
}finally{await b.close();await vite.close()}
