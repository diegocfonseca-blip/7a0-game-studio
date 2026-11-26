// Two isolated browser contexts; RPC bridge is a fixture, external requests are blocked.
import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {writeFileSync,mkdirSync} from 'node:fs'
const out=process.env.SAVE_QA_OUTPUT??'/workspace/shared/saves-aparelhos-20261126';mkdirSync(out,{recursive:true})
const base=process.env.SAVE_QA_BASE??'http://127.0.0.1:5197',uid='qa-cross-device',seed=2642323,checks=[],check=(ok,label)=>{assert(ok,label);checks.push(label)}
let remote=null,revision=1,writes=0
const details=()=>({seed,revision,savedAt:'2026-11-26T16:00:00Z',seasonNo:2,round:remote.round,teamName:'Clube de teste',official:true,sport:'futebol',fingerprint:''})
const rpc=async(name,a)=>{
 if(name==='esc_carreiras_manifesto_v2')return {data:{protocol:2,rights:{paid:true,slots:4,versions:3},careers:[details()]},error:null}
 if(name==='esc_carreira_ler_v2')return {data:{status:'ok',save:remote,summary:details()},error:null}
 if(name==='esc_carreira_salvar_v2'){
  if(a.p_expected!==revision)return {data:{status:'conflict',current:details()},error:null}
  remote=structuredClone(a.p_save);revision++;writes++;return{data:{status:'saved',summary:details()},error:null}
 }
 throw Error('RPC inesperada: '+name)
}
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']})
const errors=[]
try{
 const pages=[]
 for(const width of [390,1440]){
  const c=await b.newContext({viewport:{width,height:844},locale:'pt-BR'});await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());const p=await c.newPage();p.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});await p.exposeFunction('qaCloudRpc',rpc);await p.goto(base+'/scripts/teste-salvamento/');await p.waitForFunction(()=>window.saveQA,{},{timeout:180000});await p.waitForTimeout(500)
  const st=await p.evaluate(async({uid,seed})=>{const {saves,supabase,INITIAL}=window.saveQA;supabase.rpc=(name,args)=>window.qaCloudRpc(name,args);await saves.changeAccount(uid);return {...INITIAL,seed,careerOnline:true,onlineMode:'cpu',screen:'pyramidSeason',seasonNo:2,round:9,careerDivision:'D',careerPlacements:{m0:'C'},youIdx:0,managers:[{id:0,name:'Você',teamName:'Clube de teste',squad:[]}] }},{uid,seed});remote??=st
  await p.evaluate(async seed=>{window.qaCurrent=await window.saveQA.saves.prepare(seed)},seed);pages.push(p)
 }
 const [phone,pc]=pages
 const advance=async(p,round)=>p.evaluate(async round=>{const{saves}=window.saveQA;const next={...window.qaCurrent,round};saves.bindNext(window.qaCurrent,next);window.qaCurrent=next;saves.schedule(next);await saves.flush(next.seed)},round)
 await advance(phone,23)
 check(await phone.evaluate(seed=>window.saveQA.saves.copies(seed).device.division,seed)==='C','resumo local usa a divisão atual após promoção')
 await phone.evaluate(seed=>window.saveQA.photo('copies',seed),seed);await phone.getByText(/Na nuvem|Cloud/).waitFor();await phone.screenshot({path:out+'/copias-390.png'});await phone.getByRole('button',{name:/Salvar|Save/}).click();check(await phone.evaluate(()=>window.saveQA.saveClicks)===1,'Salvar sem sair está acessível junto ao estado da nuvem')
 check(remote.round===9&&writes===0,'rodada 23 no draft do celular não vira envio automático à nuvem')
 check(await pc.evaluate(()=>window.qaCurrent.round)===9,'PC mantém a rodada 9 que existe na nuvem')
 await advance(pc,10)
 await pc.evaluate(seed=>window.saveQA.photo('copies',seed),seed);await pc.getByText(/Na nuvem|Cloud/).waitFor();await pc.screenshot({path:out+'/copias-1440.png'})
 check(await phone.evaluate(()=>window.saveQA.saves.save(window.qaCurrent))==='nuvem','Salvar no celular confirma envio')
 check(remote.round===23&&revision===2,'servidor recebe rodada 23 uma vez')
 await pc.evaluate(seed=>{window.qaPrepare=window.saveQA.saves.prepare(seed)},seed);await pc.waitForFunction(()=>window.saveQA.saves.conflictNotice())
 check(await pc.evaluate(()=>window.saveQA.saves.conflictNotice().cloud.round)===23,'PC busca a revisão mais recente antes de continuar')
 await pc.evaluate(()=>window.saveQA.saves.conflictNotice().choose('cancel'));await pc.evaluate(()=>window.qaPrepare)
 check(remote.round===23,'cancelar conflito não sobrescreve rodada 23')
 check(await pc.evaluate(async({uid,seed})=>(await window.saveQA.local.read(uid,seed)).round,{uid,seed})===10,'cancelar preserva avanço local da rodada 10')
 await pc.evaluate(seed=>{window.qaPrepare=window.saveQA.saves.prepare(seed)},seed);await pc.waitForFunction(()=>window.saveQA.saves.conflictNotice());await pc.evaluate(()=>window.saveQA.saves.conflictNotice().choose('cloud'));await pc.evaluate(async()=>{window.qaCurrent=await window.qaPrepare})
 check(await pc.evaluate(()=>window.qaCurrent.round)===23,'aceitar nuvem continua no PC na rodada 23')
 check(await pc.evaluate(async({uid,seed})=>(await window.saveQA.local.read(uid,seed,'recovery')).round,{uid,seed})===10,'escolher nuvem guarda cópia local divergente em recuperação')
 await advance(pc,24);check(await pc.evaluate(()=>window.saveQA.saves.save(window.qaCurrent))==='nuvem','PC consegue salvar rodada 24 após resolver conflito')
 check(await phone.evaluate(async seed=>(await window.saveQA.saves.prepare(seed)).round,seed)===24,'celular sem nova divergência recupera automaticamente revisão 24 ao reabrir')
 await phone.evaluate(async uid=>{await window.saveQA.saves.changeAccount(null);await window.saveQA.saves.changeAccount(uid)},uid)
 check(await phone.evaluate(()=>window.saveQA.saves.summaries()[0].slot.save.careerDivision)==='C','lista continua na Série C depois de reabrir, sem voltar ao resumo da Série D')
 check(errors.length===0,'nenhuma exceção nos dois contextos isolados')
 writeFileSync(out+'/dois-aparelhos.json',JSON.stringify({checks,errors,writes,finalRound:remote.round},null,2));console.log('PASS',checks.length,'verificações; rodada final',remote.round)
}finally{await b.close()}
