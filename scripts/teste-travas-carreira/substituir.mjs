import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const {createServer}=await import('vite'),out='/workspace/shared/travas-carreira-20261124'
const vite=await createServer({plugins:[{name:'substituicao-local',enforce:'pre',transform(code,id){if(id.endsWith('/src/escalacao/campo2d.tsx'))return code.replace('// 🔁 23/11: troca com o jogo rolando',`;(window as any).qaMotor=jogo;
  // 🔁 23/11: troca com o jogo rolando`);if(!id.endsWith('/src/escalacao/pyramidseason.tsx'))return;return code.replace('const calBarra = (() => {',`Object.assign(window,{qaAba:escolheAba,qaSub:{round,tab,subAberto,subPossivel,minutoJogo,dadosSub,roundReady,goals:myMatch?.goals,hasM2:!!myMatch?.m2}});const calBarra = (() => {`)}}],server:{host:'127.0.0.1',port:5342,strictPort:true,hmr:false,watch:null}});await vite.listen()
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});const results=[]
try{
 for(const mode of ['quick','2d','legado']){
 const c=await b.newContext({viewport:{width:390,height:844},locale:'pt-BR'});await c.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5342/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());await c.addInitScript(()=>{addEventListener('DOMContentLoaded',()=>document.documentElement.classList.add('noturno'));const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:old.call(this,t,...a)}})
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR',mode,e.message)});p.setDefaultTimeout(60000)
 await p.goto(`http://127.0.0.1:5342/scripts/teste-travas-carreira/?round=10&speed=.25&mode=${mode}${mode==='quick'?'&gratis=1&semplano=1':''}${mode==='legado'?'&legado=1':''}`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.qaSub);await p.evaluate(()=>window.qaAba('jogos'));await p.waitForFunction(()=>window.qaSub.minutoJogo>1)
 if(mode==='legado'){assert.equal(await p.locator('[data-fonte-campo2d-mapa]').count(),1,'legado preserva fonte montada para alternar vistas');assert.equal(await p.getByRole('button',{name:/Substituir.*0\/3/}).count(),0,'não inventa troca ao vivo sem motor oficial');assert.equal(await p.locator('[data-fonte-campo2d-mapa][data-simulacao-suspensa="false"]').count(),0);await p.evaluate(()=>window.qaDispatch({type:'SET_SIM_SPEED',speed:4}));await p.waitForFunction(()=>window.qaSub.minutoJogo>=93,null,{timeout:15000});results.push({mode,finished:true,errors});console.log('PASS legado até apito',JSON.stringify(await p.evaluate(()=>({round:window.qaSub.round,minute:window.qaSub.minutoJogo,ready:window.qaSub.roundReady})))); await c.close();continue}
 const button=p.getByRole('button',{name:/Substituir.*0\/3/});assert.equal(await button.count(),1);await button.click();await p.waitForFunction(()=>window.qaSub.subAberto)
 const close=p.getByRole('button',{name:'Fechar',exact:true});if(await close.first().isVisible())await close.first().click()
 await p.waitForTimeout(400);const paused=await p.evaluate(()=>window.qaSub.minutoJogo);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>window.qaSub.minutoJogo),paused,'painel pausa o relógio')
 const before=await p.evaluate(()=>({state:window.qaState,sub:window.qaSub})),data=before.sub.dadosSub
 const sai=data.emCampo.find(c=>data.reservas.some(r=>r.pos===c.pos)),entra=data.reservas.find(r=>r.pos===sai.pos);assert(sai&&entra)
 const exactName=name=>new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))
 await p.getByRole('button',{name:exactName(sai.name)}).click();await p.getByRole('button',{name:exactName(entra.name)}).click();await p.waitForFunction(()=>window.qaSub.dadosSub.feitas.length===1)
 await p.getByRole('button',{name:/^🔥 Ataque$/}).click();await p.waitForFunction(()=>window.qaSub.dadosSub.tatica==='ataque')
 const after=await p.evaluate(()=>({state:window.qaState,sub:window.qaSub})),id=after.state.managers[after.state.youIdx].id,events=after.state.careerHalftime[id][9].aoVivo
 assert(events.some(e=>e.sai===sai.id&&e.entra===entra.id));assert(events.some(e=>e.tactic==='ataque'));assert.deepEqual(after.state.careerLineup,before.state.careerLineup,'XI fixo preservado');assert.deepEqual(after.sub.goals.filter(g=>g.min<=paused),before.sub.goals.filter(g=>g.min<=paused),'gols anteriores preservados')
 await p.screenshot({path:`${out}/painel-substituir-${mode}.png`});await p.getByRole('button',{name:/Voltar ao jogo/i}).click();await p.waitForFunction(n=>!window.qaSub.subAberto&&window.qaSub.minutoJogo>n,paused);assert.equal(await p.getByRole('button',{name:/Substituir.*1\/3/}).count(),1)
 if(mode==='2d'){
  await p.evaluate(()=>window.qaModo2D(false));await p.waitForFunction(()=>document.querySelector('[data-simulacao-suspensa="true"]'));
  await p.getByRole('button',{name:/Substituir.*1\/3/}).click();await p.waitForFunction(()=>window.qaSub.subAberto);
  const d=await p.evaluate(()=>window.qaSub.dadosSub),sa=d.emCampo.find(c=>c.pos!=='GOL'&&d.reservas.some(r=>r.pos===c.pos)),en=d.reservas.find(r=>r.pos===sa.pos);
  await p.getByRole('button',{name:exactName(sa.name)}).click();await p.getByRole('button',{name:exactName(en.name)}).click();await p.waitForFunction(()=>window.qaSub.dadosSub.feitas.length===2);
  await p.getByRole('button',{name:/Voltar ao jogo/i}).click();await p.evaluate(()=>window.qaModo2D(true));await p.waitForFunction(name=>window.qaMotor.atl.some(a=>a.nome===name),en.name);assert(!await p.evaluate(name=>window.qaMotor.atl.some(a=>a.nome===name),sa.name),'motor retomado respeita a troca feita no placar');
 }
 if(mode==='quick'){
  assert.equal(await p.locator('[data-fonte-campo2d-mapa][data-simulacao-suspensa="false"]').count(),0,'placar oficial suspende o campo oculto');
  await p.evaluate(()=>{window.__qaSim=[];window.qaVista3D(true)});await p.waitForFunction(()=>document.querySelector('[data-fonte-campo2d-mapa][data-simulacao-suspensa="false"]'));await p.waitForTimeout(500);assert((await p.evaluate(()=>window.__qaSim.length))>0,'observador 3D continua recebendo simulação');await p.evaluate(()=>window.qaVista3D(false));await p.waitForFunction(()=>!document.querySelector('[data-fonte-campo2d-mapa][data-simulacao-suspensa="false"]'));
  if(process.env.LL_CAREER_PREVIEW_CSS){await p.getByRole('button',{name:/Substituir.*1\/3/}).click();await p.waitForFunction(()=>window.qaSub.subAberto);await p.getByRole('button',{name:/Voltar ao jogo/i}).click();await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:out+'/atual-controles-mobile.png'});await p.addStyleTag({content:readFileSync(process.env.LL_CAREER_PREVIEW_CSS,'utf8')});await p.screenshot({path:out+'/proposta-controles-mobile.png'});}
 }
 assert.deepEqual(errors,[]);results.push({mode,paused,sai:sai.name,entra:entra.name,events,errors});console.log('PASS',mode,JSON.stringify(results.at(-1)));await c.close()
 }
 writeFileSync(out+'/substituicoes.json',JSON.stringify(results,null,2))
}finally{await b.close();await vite.close()}
