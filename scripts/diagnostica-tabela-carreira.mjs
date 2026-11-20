import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:4248',base=origin+'/7a0-game-studio/'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
try{
 const page=await browser.newPage()
 await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
 await page.goto(base+'scripts/teste-partida-oficial-3d/?round=9',{waitUntil:'domcontentloaded',timeout:90000})
 await page.waitForFunction(()=>window.qaState,null,{timeout:90000})
 const report=await page.evaluate(async()=>{
  const p=await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx'),l=await import('/7a0-game-studio/src/escalacao/libertadores-oficial.ts'),u=await import('/7a0-game-studio/src/escalacao/sul-americana-oficial.ts'),e=await import('/7a0-game-studio/src/escalacao/estaduais.ts'),table=await import('/7a0-game-studio/src/escalacao/classificacao-grupos.ts')
  const s=window.qaState,world=p.buildPyramid(s.managers,s.managers[s.youIdx].id,s.seed,'br',null,undefined,true),out=[]
  const check=(name,c)=>{if(!c){out.push({name,null:true});return}const bad=c.rounds.flatMap(r=>r.ties.flatMap((t,i)=>!t.a||!t.b?[{page:r.name,index:i,a:t.a?.name,b:t.b?.name}]:[]));const standings=table.classificacaoGruposAoVivo(c.rounds,c.rounds.length);out.push({name,rounds:c.rounds.length,bad,tableRows:standings.rows.length,tableIncomplete:standings.incompletos})}
  for(const estado of Object.keys(e.ESTADUAIS))check(estado,p.computeEstadualCarreira(estado,world,s.seed,1))
  for(const seed of [20261120,1,2,3,4,5,6,7,8,9]){
   const vagas=l.vagasLiberta(null),lib=p.computeLibertadoresCarreira(vagas,world,seed,1);check('Liberta '+seed,lib)
   if(lib){const vs=u.vagasSula(null,[...vagas.grupos,...vagas.fase1,...vagas.fase2]);check('Sula '+seed,p.computeSulaCarreira(vs,{grupos:lib.resultado.sulaGrupos,playoff:lib.resultado.sulaPlayoff},world,seed,1))}
  }
  const serieA=['Palmeiras','Flamengo','Cruzeiro','Mirassol','Fluminense','Botafogo','Bahia','São Paulo','Grêmio','Vasco','Corinthians','Atlético-MG','Santos','Bragantino','Internacional','Athletico-PR','Coritiba','Vitória','Chapecoense','Remo']
  const vagas=l.vagasLiberta({serieA,copa:'Vasco',copaVice:'Grêmio',liberta:'Alianza Lima'}),lib=p.computeLibertadoresCarreira(vagas,world,1,2)
  if(lib){const vs=u.vagasSula(serieA,[...vagas.grupos,...vagas.fase1,...vagas.fase2]);check('Sula ano 2 / campeão estrangeiro',p.computeSulaCarreira(vs,{grupos:lib.resultado.sulaGrupos,playoff:lib.resultado.sulaPlayoff},world,1,2))}
  return out
 })
 writeFileSync('/workspace/shared/carreira-tabela-queda-20261120/diagnostico-tabela-protegida.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await browser.close()}
