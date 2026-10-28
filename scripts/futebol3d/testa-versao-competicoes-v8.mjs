import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'vite'
// Importação SSR das funções usadas pelas telas. Sem autenticação, serviços ou save real.
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'silent'})
try{
 const P=await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
 const B=await vite.ssrLoadModule('/src/escalacao/copa-brasil.ts')
 const C=await vite.ssrLoadModule('/src/escalacao/copa-mundo.tsx')
 const I=await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
 const M=await vite.ssrLoadModule('/src/escalacao/motor2/carreira.ts')
 const {VERSAO_RECEPCAO_M2:versao}=await vite.ssrLoadModule('/src/escalacao/motor2/versao.ts')
 const {transcreverPartidaOficial}=await vite.ssrLoadModule('/src/escalacao/partida-relato-oficial.ts')
 const {INITIAL,reducer}=await vite.ssrLoadModule('/src/escalacao/store.tsx')
 const {_bancadaApoio}=await vite.ssrLoadModule('/src/escalacao/apoio.tsx')
 const {CATALOG_BOTH}=await vite.ssrLoadModule('/src/escalacao/data.ts')
 const {input}=JSON.parse(readFileSync('test-results/animation-library/neymarzetti-current/football-input.json','utf8'))
 const xi=input.casa.map((c,i)=>({...c,id:'teste-'+i,paid:1,buyPrice:1})),stats={}
 const manager={...INITIAL.managers[0],id:1,name:'Teste local',teamName:'Clube de teste local',isHuman:true,formation:'4-3-3',money:500,squad:xi}
 const managers=Array.from({length:20},(_,i)=>({...manager,id:i+1,isHuman:i===0,name:'Técnico local '+i,teamName:'Clube local '+i,squad:xi.map(c=>({...c,id:c.id+'-'+i}))}))
 const base={...INITIAL,careerOnline:true,onlineMode:'solo',sport:'futebol',seasonNo:3,round:2,motor2Desde:{season:1,round:0},managers}
 _bancadaApoio('outra@conta.com','fundador')
 assert(!reducer(base,{type:'LIGA_RECEPCAO_M2'}).motor2RecepcaoDesde,'Reducer não pode ativar outra conta')
 _bancadaApoio('diego.c.fonseca@gmail.com','fundador')
 const activated=reducer(base,{type:'LIGA_RECEPCAO_M2'})
 assert.deepEqual(activated.motor2RecepcaoDesde,{season:3,round:2})
 assert.deepEqual(reducer(activated,{type:'LIGA_RECEPCAO_M2'}),activated,'Ativar novamente alterou o save')
 for(const patch of [{onlineMode:'online'},{co2:{room:'teste'}}])assert(!reducer({...base,...patch},{type:'LIGA_RECEPCAO_M2'}).motor2RecepcaoDesde)
 stats.reducer={authorizedOnly:true,idempotent:true,onlineUnaffected:true}
 const world=P.buildPyramid(managers,1,30001,'both'),simulate=round=>P.simulatePyramid(world,30002,round,{}, {},1.2,false,false,{}, {},{},undefined,{},undefined,0,2)
 const before=simulate(2),after=simulate(3),flatten=r=>Object.values(r.matches).flat().filter(m=>m.m2)
 assert(flatten(before).length>0&&flatten(before).every(m=>!m.m2.versao),'Rodadas anteriores devem continuar legadas')
 assert(flatten(after).length>0&&flatten(after).every(m=>m.m2.versao===versao),'A próxima rodada deve receber a versão')
 stats.liga={previousRoundPreserved:true,nextRoundVersioned:flatten(after).length}
 function check(e,score,label){
  assert.equal(e.versao,versao,label+': versão ausente')
  const restored=JSON.parse(JSON.stringify(e)),relato=transcreverPartidaOficial(restored)
  assert.deepEqual(relato.frames.at(-1).score,score,label+': resultado/replay divergentes')
  assert.equal(relato.frames.at(-1).finished,true)
 }
 for(const m of flatten(after))check(m.m2,[m.hg,m.ag],'Liga')
 // Times completos, sem alterar classificação de um save. Garante presença do
 // clube local nesta bancada de Copa Legends e Supercopa.
 const tables=structuredClone(world),home=Object.values(tables).flat().find(t=>t.you)
 for(const list of Object.values(tables))list.sort((a,b)=>Number(b.you)-Number(a.you))
 const cup=P.computeCopa(tables,30003,2,1.2,false,{},true,versao)
 const cupMatches=cup.rounds.flatMap(r=>r.ties).flatMap(t=>t.legM2??[]).filter(Boolean)
 assert(cupMatches.length>0);for(const e of cupMatches)check(e,M.resultadoM2(e).placar,'Copa Legends')
 const brasil=B.computeCopaBrasil(tables,30004,2,1.2,false,{},true,versao)
 const allEntries=value=>{const found=[];function visit(o){if(!o||typeof o!=='object')return;if(o.seed!==undefined&&o.casa&&o.fora&&o.tatica){found.push(o);return}for(const v of Object.values(o))visit(v)}visit(value);return found}
 const brasilMatches=allEntries(brasil);assert(brasilMatches.length>0);for(const e of brasilMatches)check(e,M.resultadoM2(e).placar,'Copa Brasil')
 const supercopa=B.computeSupercopa(tables,home,30005,2,1.2,false,{},true,versao),superMatches=allEntries(supercopa)
 assert(superMatches.length>0);for(const e of superMatches)check(e,M.resultadoM2(e).placar,'Supercopa')
 stats.copasNacionais={legends:cupMatches.length,brasil:brasilMatches.length,supercopa:superMatches.length}
 const xiIntl=Object.entries({GOL:1,LAT:2,ZAG:2,MEI:3,ATA:3}).flatMap(([pos,count])=>CATALOG_BOTH[pos].slice(0,count).map((c,i)=>({...c,pos,id:'intl-'+pos+'-'+i})))
 const campaign=I.makeInternationalCampaign({season:40,seed:30006,representedClub:'Flamengo',userTeam:manager.teamName,userId:1,priority:1,userXI:xiIntl,motor2:true,versaoM2:versao})
 const restored=JSON.parse(JSON.stringify(campaign)),international=restored.steps.flatMap(s=>[...(s.libertadores?.matches??[]),...(s.champions?.matches??[]),...(s.mundial?.matches??[])]).filter(m=>m.m2)
 assert(international.length>0)
 for(const match of international)check(I.entradaInternacionalM2(restored.teams,match),[match.hg,match.ag],'Internacional reaberta')
 stats.internacional={versioned:international.length,reopened:true}
 const {paisesDaCopa}=await vite.ssrLoadModule('/src/escalacao/copa-mundo-online.tsx')
 const entrants=paisesDaCopa().slice(0,32).map((pais,i)=>{const pool=C.countryPool(pais),form=C.formationFits(pool,'4-3-3')?'4-3-3':'4-4-2',xi=C.bestXI(pool,form);return{club:'Clube '+i,pais,you:i===5,form,xi,str:C.xiStrength(xi)}})
 const run=(ents,v)=>C.simulaCopaMundo(ents,30007,40,true,true,true,undefined,v)
 const cupWorld=run(entrants,versao),frozen=JSON.parse(JSON.stringify({versaoM2:versao,ents:entrants.map(C.congela)})),reopened=run(frozen.ents.map(C.descongela),frozen.versaoM2)
 assert.deepEqual(JSON.parse(JSON.stringify(reopened)),JSON.parse(JSON.stringify(cupWorld)),'Mundial reaberto mudou')
 const worldMatches=allEntries(cupWorld);assert(worldMatches.length>0);for(const e of worldMatches)check(e,M.resultadoM2(e).placar,'Copa Mundo')
 stats.copaMundo={versioned:worldMatches.length,reopened:true}
 mkdirSync('test-results/fundamentos-mapa/v8',{recursive:true});writeFileSync('test-results/fundamentos-mapa/v8/competicoes.json',JSON.stringify(stats,null,2))
 console.log('PASS: versão comum e replay consistente na liga e copas',JSON.stringify(stats))
}finally{await vite.close()}
