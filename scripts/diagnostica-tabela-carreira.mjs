import assert from 'node:assert/strict'
import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
const origin=process.env.QA_ORIGIN??'http://127.0.0.1:4248',base=origin+'/7a0-game-studio/'
const artifact='/workspace/shared/carreira-tabela-queda-20261120'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[]
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE_ERROR',e.message)})
 await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
 await page.goto(base+'scripts/teste-inscricoes-conmebol/',{waitUntil:'domcontentloaded',timeout:90000})
 await page.waitForFunction(()=>window.qaReady,null,{timeout:90000})
 const report=await page.evaluate(async()=>{
  const [p,l,u,e,table,c,r,store,deck]=await Promise.all([
   import('/7a0-game-studio/src/escalacao/pyramidseason.tsx'),import('/7a0-game-studio/src/escalacao/libertadores-oficial.ts'),
   import('/7a0-game-studio/src/escalacao/sul-americana-oficial.ts'),import('/7a0-game-studio/src/escalacao/estaduais.ts'),
   import('/7a0-game-studio/src/escalacao/classificacao-grupos.ts'),import('/7a0-game-studio/src/escalacao/conmebol-temporada.ts'),
   import('/7a0-game-studio/src/escalacao/conmebol-reservas.ts'),import('/7a0-game-studio/src/escalacao/store.tsx'),
   import('/7a0-game-studio/src/escalacao/baralho-oficial-carga.ts')])
  const ok=(value,message)=>{if(!value)throw new Error(message)}
  const s=window.qaState,world=p.buildPyramid(s.managers,s.managers[s.youIdx].id,s.seed,s.deckLeague,s.careerPlacements,p.seedCpuSquadsOficial(s),true),out=[]
  const catalogue=()=>JSON.stringify([store.catalogTodos(),deck.baralhoOficial()]),before=catalogue()
  const factory=p.fabricaTimesOficiais(world,s.seed,2)
  const rosters=r.RESERVAS_CONMEBOL.map(({nome})=>{
   const t=factory(nome)?.t;ok(t&&t.xi.length===11,`${nome}: XI incompleto`)
   ok(t.xi.every(c=>c.name&&!store.ehFake(c)),`${nome}: jogador inventado`)
   ok(new Set(t.xi.map(c=>c.id)).size===11,`${nome}: ids repetidos`)
   ok(new Set(t.squad.map(c=>`${c.name}|${c.club}|${c.year}`)).size===t.squad.length,`${nome}: carta repetida`)
   for(const [pos,n] of Object.entries({GOL:1,LAT:2,ZAG:2,MEI:3,ATA:3}))ok(t.xi.filter(c=>c.pos===pos).length===n,`${nome}: falta ${pos}`)
   return {nome,jogadores:t.xi.map(c=>c.name)}
  })
  const check=(name,c,continental=false)=>{
   ok(c,`${name}: competição ausente`)
   for(const round of c.rounds)for(const t of round.ties){ok(t.a?.name&&t.b?.name,`${name}: confronto sem adversário`);ok(t.a.xi.length===11&&t.b.xi.length===11,`${name}: elenco incompleto`)}
   const standings=table.classificacaoGruposAoVivo(c.rounds,c.rounds.length)
   ok(standings.incompletos===0,`${name}: tabela incompleta`)
   if(continental)ok(standings.rows.length===32,`${name}: grupos não têm 32 clubes`)
   out.push({name,rounds:c.rounds.length,tableRows:standings.rows.length})
  }
  for(const estado of Object.keys(e.ESTADUAIS))check(estado,p.computeEstadualCarreira(estado,world,s.seed,1))
  const serieA=['Palmeiras','Flamengo','Cruzeiro','Mirassol','Fluminense','Botafogo','Bahia','São Paulo','Grêmio','Vasco','Corinthians','Atlético-MG','Santos','Bragantino','Internacional','Athletico-PR','Coritiba','Vitória','Chapecoense','Remo']
  let anterior=null,lastSula
  for(let year=1;year<=10;year++){
   const v=c.inscricoesConmebolDaTemporada(anterior,year,1),seed=20261120+year
   const lib=p.computeLibertadoresCarreira(v.liberta,world,seed,year,1.2,false,false,undefined,year);check(`Libertadores T${year}`,lib,true)
   const sul=p.computeSulaCarreira(v.sula,{grupos:lib.resultado.sulaGrupos,playoff:lib.resultado.sulaPlayoff},world,seed,year,1.2,false,false,undefined,year);check(`Sul-Americana T${year}`,sul,true)
   anterior={serieA,copa:'Vasco',copaVice:'Grêmio',liberta:lib.resultado.campeao,sula:sul.resultado.campeao};lastSula=sul
  }
  // Caso do erro: campeão estrangeiro anteriormente deixava uma vaga faltando.
  const v=c.inscricoesConmebolDaTemporada({serieA,copa:'Vasco',copaVice:'Grêmio',liberta:'Alianza Lima',sula:'Lanús'},2)
  ok(v.modo==='reparada','edição defeituosa não reparada')
  const lib=p.computeLibertadoresCarreira(v.liberta,world,1,2);check('Libertadores reparada',lib,true)
  const sul=p.computeSulaCarreira(v.sula,{grupos:lib.resultado.sulaGrupos,playoff:lib.resultado.sulaPlayoff},world,1,2);check('Sul-Americana reparada',sul,true)
  ok(catalogue()===before,'elencos de cobertura alteraram catálogo comprável')
  ok(s.oficial.vagasDesde===1,'carreira nova sem versão das vagas')
  const old=structuredClone(s);old.seasonNo=2;old.screen='season';delete old.oficial.vagasDesde
  old.oficialCampeoes=[{temporada:1,serieATop:serieA,copa:'Vasco',copaVice:'Grêmio',liberta:'Flamengo',sula:'Lanús'}]
  const history=JSON.stringify(old.oficialCampeoes),saved=JSON.stringify(old)
  const resumed=window.qaReducer(structuredClone(store.INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(saved)})
  ok(resumed.oficial.vagasDesde==null,'retomar ativou regra no meio de edição válida')
  const placements=resumed.careerPlacements??{},next=window.qaReducer(resumed,{type:'OPEN_RESERVE_LIST',placements,mesmo:true})
  ok(next.seasonNo===3&&next.oficial.vagasDesde===3,'virada não gravou versão na próxima edição')
  ok(JSON.stringify(next.oficialCampeoes)===history,'virada alterou campeões históricos')
  const reloaded=window.qaReducer(structuredClone(store.INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(JSON.stringify(next))})
  ok(reloaded.oficial.vagasDesde===3,'versão perdida ao salvar/retomar')
  const normal=structuredClone(old);normal.oficial=undefined
  const classic=window.qaReducer(normal,{type:'OPEN_RESERVE_LIST',placements,mesmo:true})
  ok(!classic.oficial,'carreira clássica recebeu configuração oficial')
  const grupos=sul.resultado.fases[1].tabelas.map(g=>({nome:g.nome,times:g.tabela.map(x=>x.time)}))
  const ate=sul.rounds.findIndex(r=>/ · rodada \d+\/\d+$/.test(r.name))+1
  const malformed=structuredClone(sul.rounds);malformed.at(-1).ties[0].b=undefined
  window.qaRenderTable({pages:malformed,ate,nome:'Sul-Americana',grupos})
  return {rosters,competicoes:out,temporadas:10,migracao:'nova / retomar / virada / salvar / retomar / clássica: OK',catalogo:'inalterado',tabelaDOM:{times:32,finalIncompletaIgnorada:true}}
 })
 await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===32,null,{timeout:10000})
 assert.equal(await page.locator('table').count(),8)
 assert.deepEqual(errors,[])
 await page.screenshot({path:artifact+'/sul-americana-tabela-390.png',fullPage:true})
 await page.setViewportSize({width:1280,height:900})
 await page.screenshot({path:artifact+'/sul-americana-tabela-1280.png',fullPage:true})
 report.errosJavaScript=errors
 writeFileSync(artifact+'/diagnostico-final.json',JSON.stringify(report,null,2))
 console.log(JSON.stringify({pass:true,elencos:report.rosters.length,competicoes:report.competicoes.length,temporadas:report.temporadas,migracao:report.migracao,tabelaDOM:report.tabelaDOM,errosJavaScript:errors}))
}finally{await browser.close()}
