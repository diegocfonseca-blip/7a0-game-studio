import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
const base='http://127.0.0.1:5197',out='/workspace/shared/salvamento-seguro-20261124'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const report={checks:[],errors:[]}
try {
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'pt-BR'})
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort())
 await context.routeWebSocket('**/*',w=>w.close())
 const page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message))
 await page.goto(base+'/scripts/teste-salvamento/index.html')
 await page.waitForFunction(()=>!!window.saveQA)
 const result=await page.evaluate(async()=>{
  const {saves,local,encode,decode,supabase,reducer,INITIAL,nuvemAceita}=window.saveQA
  await new Promise(r=>setTimeout(r,500))
  const checks=[], check=(v,label)=>{if(!v)throw Error(label);checks.push(label)}
  check(!nuvemAceita({pago:false,seeds:[91]},91),'ter save antigo na nuvem não libera novos envios grátis')
  check(!nuvemAceita(null,91),'direito ainda desconhecido não autoriza nuvem')
  check(nuvemAceita({pago:true,seeds:[]},91),'planos mantêm envio à nuvem nos dois modos')
  const uidA='qa-a',uidB='qa-b'
  const fixture=(seed=91,round=1)=>({seed,careerOnline:true,onlineMode:'cpu',screen:'pyramidSeason',seasonNo:4,round,youIdx:0,managers:[{id:0,name:'Teste',teamName:'Clube de teste',squad:[]}],cpuSquads:{sample:Array.from({length:5000},(_,i)=>({name:'Jogador real '+i,overall:75,club:'Clube',history:'x'.repeat(60)}))}})
  const row=(st,revision)=>({seed:st.seed,revision,savedAt:'2026-11-24T17:00:00Z',seasonNo:st.seasonNo,round:st.round,teamName:st.managers[0].teamName,official:!!st.oficial,sport:'futebol'})
  const actual=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Clube de teste',formation:'4-3-3',rivals:3})
  const actualEncoded=await encode(actual),actualDecoded=await decode(actualEncoded)
  check(JSON.stringify(actualDecoded)===JSON.stringify(actual),'save completo do motor preservado após compressão')
  const resumed=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:actualDecoded})
  check(resumed.seed===actual.seed&&resumed.managers.length===actual.managers.length,'motor reabre save completo sem resumo de listagem')
  const source=fixture(), enc=await encode(source), decoded=await decode(enc)
  check(JSON.stringify(decoded)===JSON.stringify(source),'compressão preserva todos os campos')
  check(enc.blob.size<enc.rawBytes/3,'compressão reduz espaço sem cortar histórico')
  let server=null,rights={paid:true,slots:4,versions:3,trialUntil:null},calls=[],offline=false,lost=false,requests=new Map(),previous=[]
  supabase.rpc=async(name,args={})=>{
    calls.push(name);if(offline)return{data:null,error:{message:'offline'}}
    if(name==='esc_carreiras_manifesto_v2')return{data:{protocol:2,rights,careers:server?[row(server.st,server.revision)]:[]},error:null}
    if(name==='esc_carreira_ler_v2')return{data:server?{status:'ok',save:server.st,summary:row(server.st,server.revision)}:{status:'missing'},error:null}
    if(name==='esc_carreira_historico_v2')return{data:previous.map(v=>({...row(v.st,v.revision)})),error:null}
    if(name==='esc_carreira_salvar_v2'){
      if(requests.has(args.p_request))return{data:requests.get(args.p_request),error:null}
      if((server?.revision??0)!==args.p_expected)return{data:{status:'conflict',current:row(server.st,server.revision)},error:null}
      if(server)previous.unshift(server)
      server={st:args.p_save,revision:(server?.revision??0)+1}
      const data={status:'saved',summary:row(server.st,server.revision)};requests.set(args.p_request,data)
      if(lost){lost=false;return{data:null,error:{message:'resposta perdida'}}}
      return{data,error:null}
    }
    if(name==='esc_carreira_excluir_v2')return{data:{status:'conflict'},error:null}
    throw Error(name)
  }
  await saves.changeAccount(null)
  check(await saves.save(source)==='sem_conta','sem conta não salva')
  check((await local.metas(uidA)).length===0,'sem conta não criou cópia persistente')
  await saves.changeAccount(uidA);await saves.sync(true)
  lost=true
  check(await saves.save(saves.bind(source))==='nuvem','save exige confirmação e repete resposta perdida')
  check(server.revision===1,'tentativas usam mesmo pedido')
  const next=fixture(91,8);saves.bindNext(source,next);saves.schedule(next);await saves.flush()
  check(calls.filter(n=>n==='esc_carreira_salvar_v2').length===2,'recuperação automática não envia nuvem')
  check((await local.read(uidA,91)).round===8,'recuperação guarda rodada atual')
  check((await local.read(uidA,91,'checkpoint')).round===1,'recuperação não altera salvamento manual')
  check(await saves.rollback(91)==='voltou','sair sem salvar encontra checkpoint')
  check((await local.read(uidA,91)).round===1,'sair sem salvar restaura local')
  saves.schedule(next);await saves.flush();check((await local.read(uidA,91)).round===1,'saída sem salvar não é desfeita pelo relógio do jogo')
  await saves.prepare(91)
  const advance=fixture(91,10);saves.bindNext(source,advance);saves.schedule(advance);await saves.flush()
  server={st:fixture(91,30),revision:2}
  const action=saves.prepare(91)
  for(let i=0;i<200&&!saves.conflictNotice();i++)await new Promise(r=>setTimeout(r,10))
  check(!!saves.conflictNotice(),'avanços divergentes pedem escolha')
  saves.conflictNotice().choose('cloud');const chosen=await action
  check(chosen.round===30,'continuar nuvem abre rodada correta')
  check((await local.read(uidA,91,'recovery')).round===10,'cópia divergente preservada')
  check(server.revision===2,'escolher cópia não grava nuvem')
  offline=true
  const attempt=fixture(91,31);saves.bindNext(chosen,attempt)
  check(await saves.save(attempt)==='falhou','falha de rede nunca confirma nuvem')
  check((await local.read(uidA,91,'checkpoint')).round===30,'falha não avança checkpoint manual')
  offline=false
  await saves.changeAccount(uidB)
  check(saves.summaries().length===0,'troca de conta esvazia cache anterior')
  check(await saves.save(attempt)==='falhou','estado de outra conta não sobe')
  rights={paid:false,slots:1,versions:0,trialUntil:null};server=null
  const official={...fixture(92,1),oficial:{clube:'Portuguesa'}};saves.bind(official)
  check(await saves.save(official)==='aparelho','conta grátis Oficial confirma aparelho')
  const more={...official,round:5};saves.bindNext(official,more);saves.schedule(more);await saves.flush()
  check(await saves.rollback(92)==='voltou','Oficial sem plano também volta ao salvo manual')
  check((await local.read(uidB,92)).round===1,'checkpoint local independe de nuvem')
  // Tradicional segue exatamente a mesma política, inclusive com teste antigo vencido.
  rights.trialUntil='2020-01-01T00:00:00Z'
  const traditional=fixture(94,1);saves.bind(traditional)
  const uploadsBefore=calls.filter(n=>n==='esc_carreira_salvar_v2').length
  check(await saves.save(traditional)==='aparelho','tradicional grátis salva local mesmo com teste antigo vencido')
  const traditionalNext={...traditional,round:6};saves.bindNext(traditional,traditionalNext);saves.schedule(traditionalNext);await saves.flush()
  check((await local.read(uidB,94)).round===6,'tradicional grátis mantém recuperação automática sem teste')
  check(await saves.rollback(94)==='voltou','tradicional grátis pode sair sem salvar usando checkpoint local')
  check((await local.read(uidB,94)).round===1,'checkpoint manual tradicional restaurado sem nuvem')
  check(calls.filter(n=>n==='esc_carreira_salvar_v2').length===uploadsBefore,'ambos os modos grátis não enviam payload à nuvem')
  const grace=saves.inactivityDeadline(Date.now()-30*86400000)
  check(grace>Date.now()+4*86400000,'carreira antiga recebe carência antes de aplicar inatividade')
  const original=IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}
  check(await saves.save({...official,round:6})==='falhou_local','aparelho cheio não confirma save local')
  IDBObjectStore.prototype.put=original
  check((await local.read(uidB,92,'checkpoint')).round===1,'quota preserva checkpoint anterior')
  // Emula outra aba gravando entre a leitura e o próximo salvamento.
  await saves.prepare(92)
  const m=(await local.metas(uidB)).find(m=>m.seed===92)
  const other={...official,round:20},otherEnc=await encode(other)
  await local.put({...m,digest:otherEnc.digest,dirty:true,summary:{...m.summary,round:20}},otherEnc)
  const stale={...official,round:3};saves.bindNext(official,stale)
  const trying=saves.save(stale)
  for(let i=0;i<200&&!saves.conflictNotice();i++)await new Promise(r=>setTimeout(r,10))
  check(saves.conflictNotice()?.source==='device','duas abas detectam conflito local')
  check((await local.read(uidB,92)).round===20,'aba antiga não substitui avanço da outra')
  check((await local.read(uidB,92,'pending')).round===3,'tentativa da aba antiga também é preservada')
  saves.conflictNotice().choose('local');check(await trying==='conflito','escolher outra cópia exige novo toque em Salvar')
  check((await local.read(uidB,92,'recovery')).round===20,'escolha mantém a cópia da outra aba recuperável')
  // Nuvem confirmada é válida mesmo se o aparelho estiver cheio.
  await saves.changeAccount('qa-cloud-quota');rights={paid:true,slots:2,versions:1,trialUntil:null};server=null
  const onlyCloud=fixture(96,10);saves.bind(onlyCloud)
  IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}
  check(await saves.save(onlyCloud)==='nuvem','aparelho cheio permite confirmação verdadeira da nuvem')
  IDBObjectStore.prototype.put=original
  check(await saves.rollback(96)==='voltou','nuvem repõe checkpoint que não coube no aparelho')
  check((await local.read('qa-cloud-quota',96)).round===10,'recuperação do servidor gravada quando o espaço volta')
  // Migração com espaço cheio deixa a origem intacta.
  localStorage.setItem('esc-career-owner','qa-c');localStorage.setItem('esc-solo-career',JSON.stringify(fixture(95,12)))
  IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}
  await saves.changeAccount('qa-c')
  check(JSON.parse(localStorage.getItem('esc-solo-career')).round===12,'migração não apaga original quando falta espaço')
  IDBObjectStore.prototype.put=original
  // A troca usa só o ponteiro; não duplica os três saves grandes.
  localStorage.clear();localStorage.setItem('esc-career-owner','qa-multi')
  localStorage.setItem('esc-solo-career',JSON.stringify(fixture(378,38)))
  localStorage.setItem('esc-career-archive',JSON.stringify([{save:fixture(72,7),at:1},{save:fixture(92,9),at:2}]))
  server=null;await saves.changeAccount('qa-multi')
  check(saves.summaries().map(x=>x.slot.save.seed).sort((a,b)=>a-b).join(',')==='72,92,378','migração guarda todas as carreiras antigas')
  check((await saves.prepare(72)).seed===72,'abre uma carreira arquivada completa')
  IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}
  check((await saves.prepare(378)).seed===378,'troca com aparelho cheio não remove as outras carreiras')
  IDBObjectStore.prototype.put=original
  check((await local.metas('qa-multi')).length===3,'troca nunca apaga outra carreira do aparelho')
  return{checks,rawBytes:enc.rawBytes,gzipBytes:enc.blob.size,realGameRawBytes:actualEncoded.rawBytes,realGameGzipBytes:actualEncoded.blob.size}
 })
 report.checks.push(...result.checks);report.compression=result
 // Fotografias dos componentes reais com os mesmos dados de teste.
 await page.evaluate(async()=>{
   const {saves,supabase}=window.saveQA
   localStorage.clear();await saves.changeAccount('photo');
   const st={seed:91,careerOnline:true,onlineMode:'cpu',seasonNo:4,round:10,youIdx:0,managers:[{id:0,name:'Teste',teamName:'Portuguesa',squad:[]}]}
   saves.bind(st);saves.schedule(st);await saves.flush()
   supabase.rpc=async(name)=>({data:name==='esc_carreiras_manifesto_v2'?{protocol:2,rights:{paid:true,slots:4,versions:3},careers:[{seed:91,revision:2,savedAt:'2026-11-24T17:00:00Z',seasonNo:4,round:30,teamName:'Portuguesa'}]}:{status:'ok',save:{...st,round:30},summary:{seed:91,revision:2,savedAt:'2026-11-24T17:00:00Z',seasonNo:4,round:30,teamName:'Portuguesa'}},error:null})
   window.saveQA.photo('conflict');void saves.prepare(91)
 })
 await page.getByRole('alertdialog').waitFor();await page.evaluate(()=>document.fonts.ready)
 await page.screenshot({path:out+'/conflito-celular.png'})
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:out+'/conflito-desktop.png'})
 await page.evaluate(()=>{window.saveQA.saves.conflictNotice()?.choose('cancel');window.saveQA.supabase.rpc=async()=>({data:[{revision:4,savedAt:'2026-11-24T17:00:00Z',seasonNo:4,round:30},{revision:3,savedAt:'2026-11-23T21:00:00Z',seasonNo:4,round:18}],error:null});window.saveQA.photo('history')})
 await page.getByRole('dialog').waitFor();await page.getByText('rodada 30',{exact:false}).waitFor()
 await page.screenshot({path:out+'/historico-desktop.png'})
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/historico-celular.png'})
 assert.deepEqual(report.errors,[])
 console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,rawBytes:report.compression.rawBytes,gzipBytes:report.compression.gzipBytes,realGameRawBytes:report.compression.realGameRawBytes,realGameGzipBytes:report.compression.realGameGzipBytes},null,2))
} finally {writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
