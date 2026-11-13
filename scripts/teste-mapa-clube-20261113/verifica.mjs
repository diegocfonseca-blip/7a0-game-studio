import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const out='/workspace/shared/mapa-clube-20261113',base='http://127.0.0.1:4197/7a0-game-studio/scripts/teste-mapa-clube-20261113/index.html'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),report={checks:[],screens:[],errors:[]}
async function open(width=1440,mode='museum',other=false){
 const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',locale:'pt-BR'});await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());const p=await c.newPage();p.on('pageerror',e=>{report.errors.push(e.message);console.error(e.message)});await p.goto(base+`?mode=${mode}${other?'&other=1':''}`,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>!!window.mapModules&&!!window.mapState);await p.waitForFunction(other?()=>!window.mapAllowed:()=>window.mapAllowed);return{p,c}
}
const shot=async(p,name)=>{await p.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:'disabled',timeout:90000});report.screens.push(name)}
try{
 const {p,c}=await open();report.checks.push(...await p.evaluate(()=>{
  const M=window.mapModules,S=structuredClone(window.mapState),checks=[],ok=(c,label)=>{if(!c)throw Error(label);checks.push(label)};S.careerCoins[0]=80;delete S.careerMuseums;let s=S
  for(let stage=0;stage<4;stage++){
   const before=JSON.stringify([s.managers,s.stadiums,s.careerHonors,s.careerInternationalHistory]),next=M.reducer(s,{type:'MUSEU_INVEST',mgrId:0,expectedStage:stage})
   ok(next.careerCoins[0]===80-(stage+1)*20,`Débito exato etapa ${stage+1}`);ok(next.careerMuseums[0].etapas===stage+1,`Etapa ${stage+1} guardada`);ok(before===JSON.stringify([next.managers,next.stadiums,next.careerHonors,next.careerInternationalHistory]),`Elencos, títulos e estádio preservados ${stage+1}`)
   ok(JSON.stringify(M.reducer(next,{type:'MUSEU_INVEST',mgrId:0,expectedStage:stage}))===JSON.stringify(next),`Clique repetido bloqueado ${stage+1}`);s=next
  }
  ok(s.careerMuseums[0].inauguracao===5,'Data da inauguração vem da temporada')
  for(const patch of[{careerCoins:{0:19}},{careerCoins:{0:NaN}},{stadiums:{0:{inv:{},ext:[]}}},{onlineMode:'online'},{co2:{}},{sport:'basquete'},{careerOnline:false},{careerMuseums:{0:{version:2,etapas:3}}}]){
   const invalid={...S,...patch},before=JSON.stringify(invalid);ok(JSON.stringify(M.reducer(invalid,{type:'MUSEU_INVEST',mgrId:0,expectedStage:0}))===before,'Estado não elegível preservado')
  }
  ok(M.sanitize(s).careerMuseums===undefined,'Museu privado não viaja no rádio das salas')
  const restored=M.reducer(M.INITIAL,{type:'RESUME_CAREER_SOLO',saved:JSON.parse(JSON.stringify(s))});ok(restored.careerMuseums[0].etapas===4&&restored.careerCoins[0]===0,'Salvar e reabrir preserva obra e saldo')
  const moved=M.organizarMoveisNaCasa(S,0,['sofa']);ok(moved.ok,'Móvel possuído pode mudar de exposição');ok(moved.value.careerCoins[0]===S.careerCoins[0]&&moved.value.careerPresidency[0].revision===S.careerPresidency[0].revision,'Organizar móveis não cobra nem altera revisão econômica')
  ok(!M.organizarMoveisNaCasa(S,0,['lustre']).ok,'Móvel não possuído é recusado');ok(!M.organizarMoveisNaCasa(S,0,['sofa','sofa']).ok,'Móvel não pode ser duplicado')
  const w=M.carteiraDaCarreira(moved.value,0),display=M.exibirDuplaNaCarreira(moved.value,0,[null,null]);ok(display.ok&&display.value.careerPresidency[0].homeFurniture[0]==='sofa','Troca da garagem conserva exposição dos móveis')
  const lot=M.LOTE_MUSEU_CLUBE.building,footprint=[{x:lot.minX,z:lot.minZ},{x:lot.maxX,z:lot.minZ},{x:lot.maxX,z:lot.maxZ},{x:lot.minX,z:lot.maxZ}];ok(M.interfereLoteMuseu({base:0,top:2,footprint}),'Sobreposição do museu é detectada');ok(!M.interfereLoteMuseu({base:9,top:12,footprint}),'Linha elevada não é confundida com prédio no solo')
  for(const width of[320,390,1440]){const marks=Array.from({length:20},(_,i)=>({id:String(i),x:(i%5-2)*.18,y:(Math.floor(i/5)-2)*.16,z:0,distance:300,label:'Meu destino'})),layout=M.distribuirRotulosMapa(marks,width,800);ok(layout.length<=(width<600?4:7),'Quantidade de marcadores limitada por viewport');ok(layout.every(p=>p.left>=40&&p.left<=width-40&&p.top>=96&&p.top<=736),'Marcadores preservam bordas e barra superior');for(const a of layout)for(const b of layout)if(a.id!==b.id)ok(Math.abs(a.left-b.left)>=102||Math.abs(a.top-b.top)>=50,'Marcadores não se sobrepõem')}
  ok(JSON.stringify(M.conquistasDaCarreira(s,0))===JSON.stringify(M.conquistasDaCarreira(S,0)),'Construir museu não entrega taças de novo')
  return checks
 }));await c.close();console.log('Regras:',report.checks.length)
 const denied=await open(390,'museum',true);const original=await denied.p.evaluate(()=>JSON.stringify(window.mapState));await denied.p.evaluate(()=>window.mapDispatch({type:'MUSEU_INVEST',mgrId:0,expectedStage:0}));await denied.p.waitForTimeout(100);assert.equal(await denied.p.evaluate(()=>JSON.stringify(window.mapState)),original);report.checks.push('Outra conta não pode executar a compra privada');await denied.c.close()
 for(const width of[320,390,1440]){
  const {p,c}=await open(width,'museum');await shot(p,`${width}-museu-antes`);for(let stage=1;stage<=4;stage++)await p.getByRole('button',{name:`Construir etapa ${stage} · 20 🪙`,exact:true}).click();await p.getByRole('button',{name:'Entrar no museu →',exact:true}).click();await p.locator('.mc-room canvas').waitFor({timeout:60000});await shot(p,`${width}-museu-sala`);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await c.close()
 }
 for(const width of[390,1440]){
  const {p,c}=await open(width,'mapa');await p.waitForFunction(()=>!!window.mapApi,{},{timeout:120000});await p.getByRole('button',{name:'Locais',exact:false}).click();await shot(p,`${width}-locais`);await p.locator('summary').filter({hasText:'Meu clube'}).click();await p.getByRole('button',{name:'Gestão · finanças e contratos',exact:true}).click();await p.getByRole('button',{name:'Finanças do clube',exact:true}).click();await p.getByRole('dialog').waitFor();const frame=await p.evaluate(()=>window.mapApi.inspect().frameStats.frames);await p.waitForTimeout(250);assert.ok(await p.evaluate(()=>window.mapApi.inspect().frameStats.frames)-frame<=2);await p.getByRole('button',{name:'← Voltar ao mapa',exact:true}).click();await p.waitForFunction(()=>!document.body.classList.contains('clube-mapa-gestao-aberta'));report.checks.push(`Mapa suspende desenho sob painel e retoma em ${width}`)
  await p.evaluate(()=>window.mapApi.view('shopping'));await p.getByRole('button',{name:'Explorar shopping',exact:true}).click();assert.equal(await p.locator('.pc3-shopping-lojas').isVisible(),true);await shot(p,`${width}-shopping-expandido`)
  await p.evaluate(()=>window.mapApi.view('museu-clube'));await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.getByRole('dialog').waitFor();await p.getByRole('button',{name:'Construir etapa 1 · 20 🪙',exact:true}).click();await p.getByRole('button',{name:'← Voltar ao mapa',exact:true}).click();assert.equal(await p.evaluate(()=>window.mapState.careerMuseums[0].etapas),1);await shot(p,`${width}-museu-no-mapa`)
  await p.evaluate(()=>window.mapApi.view('original'));await shot(p,`${width}-mapa-geral`);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await c.close()
 }
 const home=await open(390,'home');await home.p.locator('.cr3-interior[data-ready=true]').waitFor({timeout:60000});await shot(home.p,'390-casa-interior');await home.p.getByRole('button',{name:'Garagem',exact:true}).click();await home.p.locator('.cr3-interior[data-ready=true]').waitFor();await shot(home.p,'390-garagem-interior');await home.c.close()
 assert.deepEqual(report.errors,[]);console.log('PASS regras e navegação do mapa; capturas:',report.screens.length)
}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
