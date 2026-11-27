import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'silent'})
try {
 const P=await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx'),D=await vite.ssrLoadModule('/src/escalacao/data.ts'),M=await vite.ssrLoadModule('/src/escalacao/co2-jogo-model.ts'),E=await vite.ssrLoadModule('/src/escalacao/motor2/carreira.ts')
 const managers=[0,1].map(id=>({id,isHuman:true,teamName:`Clube ${id}`,name:`T${id}`,formation:'4-3-3',money:100,squad:['GOL','LAT','ZAG','MEI','ATA'].flatMap((pos,k)=>D.CATALOG_BOTH[pos].slice(id*12,id*12+[2,4,4,6,6][k]).map((c,n)=>({...c,id:`${id}-${pos}-${n}`,pos,paid:10})))}))
 const real=P.buildPyramid(managers,0,777,'both',{m0:'A',m1:'A'}),world={A:real.A.filter(t=>t.human),B:[],C:[],D:[],V:[]},seed=778
 const sim=(w=world,online)=>{const teams=w.A.map(t=>({...t,pts:0,w:0,d:0,l:0,gf:0,ga:0})),ms=[];P.simDivTo(teams,'A',seed,1,new Map(),{}, {},ms,1.12,true,true,{}, {},{},new Map(),undefined,{},undefined,0,undefined,{disputadas:1,intervaloAberto:true,online},[[[0,1]]]);return{tables:{A:teams},matches:{A:ms}}}
 E.carregaGuardados(undefined,1,'co2-model-base')
 const initial=sim(),match=initial.matches.A[0];assert(match.m2)
 const state={managers,youIdx:0,round:1,seasonNo:1}
 const before=JSON.stringify(managers), payload=M.fotoJogoCo2(state,[match],{}, {0:['4-3-3'],1:['4-3-3']})
 const game={sala:'x',temporada:1,rodada:0,...payload,comandos:{},revisao:0,elapsed_ms:0,inicio_em:new Date(0).toISOString(),velocidade:1,pausado:false,encerrado:false}
 const foto=M.leFotoCo2(game);assert(foto)
 const commands={}
 for(const m of managers){const slot=foto.clubes[m.id],byId=new Map(m.squad.map(c=>[c.id,c])),initialIds=new Set(slot.xi);commands[m.id]=['GOL','MEI','ATA'].map((pos,k)=>({t:20+k*10,sai:slot.xi.find(id=>byId.get(id).pos===pos),entra:m.squad.find(c=>c.pos===pos&&!initialIds.has(c.id)).id}));commands[m.id].push({t:55,tactic:m.id===0?'ataque':'retranca'})}
 game.comandos=commands;game.revisao=2
 const entries=M.entradasJogoCo2([game]),entry=entries[match.m2.partidaId].initial
 assert.equal(entry.aoVivo.length,8);assert.equal(new Set(entry.aoVivo.map(x=>x.lado)).size,2,'decisões dos dois humanos entram')
 const motor=E.novoMotor2(entry);motor.avancaAte(120)
 assert.equal(motor.subs.filter(x=>x.lado===0).length,3);assert.equal(motor.subs.filter(x=>x.lado===1).length,3,'visitante também substitui')
 const result=sim(world,entries),copy=structuredClone(world);copy.A.reverse();copy.A.forEach(t=>{t.you=!t.you})
 // ordem da tabela/you não altera a partida oficial; comparar outra perspectiva com a mesma ordem de calendário.
 const perspective=structuredClone(world);perspective.A.forEach(t=>{t.you=!t.you})
 const other=sim(perspective,JSON.parse(JSON.stringify(entries)))
 const table=s=>s.tables.A.map(t=>[t.name,t.pts,t.gf,t.ga]);assert.deepEqual(table(result),table(other),'placar e tabela iguais nas duas perspectivas')
 assert.deepEqual(result.matches.A[0].goals,other.matches.A[0].goals,'autores, assistências e minutos iguais')
 assert.deepEqual(result.matches.A[0].goals.filter(g=>g.min<19),initial.matches.A[0].goals.filter(g=>g.min<19),'troca não reescreve gols anteriores')
 assert.equal(JSON.stringify(managers),before,'nenhuma nota, XI fixo ou elenco é alterado')
 E.carregaGuardados(undefined,1,'solo-depois')
 assert.deepEqual(sim().matches.A,initial.matches.A,'solo sem fotografia permanece igual')
 assert.equal(M.minutoJogoCo2(game,30_000),31)
 assert.equal(M.minutoJogoCo2({...game,duration_ms:45000},30000),62)
 assert.equal(M.minutoJogoCo2({...game,pausado:true,elapsed_ms:45_000},999_000),46.5)
 assert.equal(M.minutoJogoCo2({...game,encerrado:true},0),93)
 assert.equal(M.leFotoCo2({...game,z:'corrompido'}),null)
 // Copa: as duas decisões chegam à mesma partida e não reescrevem gols já mostrados.
 const H=world.A[0],A=world.A[1],cup=P.jogoCopaM2(seed,1,'teste-copa',0,H,A,'equilibrio','equilibrio')
 const cg={...game,...M.fotoJogoCo2({...state,careerMatchInjury:undefined},[{hId:H.teamId,aId:A.teamId,m2:cup.e}],{},{}),chave:'copa:ida',comandos:{},revisao:0}
 const cf=M.leFotoCo2(cg)
 for(const [id,c]of Object.entries(cf.clubes)){const byId=new Map(c.squad.map(x=>[x.id,x])),sai=c.xi.find(x=>byId.get(x).pos==='MEI'),entra=c.squad.find(x=>x.pos==='MEI'&&!c.xi.includes(x.id));cg.comandos[id]=[{t:30,sai,entra:entra.id}]}
 const ce=M.entradasJogoCo2([cg]),c1=P.jogoCopaM2(seed,1,'teste-copa',0,{...H,cupOnline:ce},{...A,cupOnline:ce},'equilibrio','equilibrio'),c2=P.jogoCopaM2(seed,1,'teste-copa',0,{...H,you:!H.you,cupOnline:ce},{...A,you:!A.you,cupOnline:ce},'equilibrio','equilibrio')
 assert.deepEqual([c1.hg,c1.ag,c1.h,c1.a],[c2.hg,c2.ag,c2.h,c2.a]);assert.equal(c1.e.aoVivo.length,2)
 const injuryId=foto.clubes[0].xi.find(id=>managers[0].squad.find(c=>c.id===id).pos==='MEI')
 const clinical={...game,comandos:{0:[],1:[]},meta:{...payload.meta,0:{...payload.meta[0],lesao:{cardId:injuryId,minute:60}}},lesoes:{}}
 assert.equal(M.minutoJogoCo2(clinical,999999),60,'relógio não pula a lesão quando o navegador fica suspenso')
 clinical.comandos[0]=[{t:60,sai:injuryId,injury:true}];clinical.lesoes={0:{}}
 const shortEntry=M.entradasJogoCo2([clinical])[match.m2.partidaId].initial,shortMotor=E.novoMotor2(shortEntry);shortMotor.avancaAte(80)
 assert.equal(shortMotor.atl.filter(a=>a.lado===0).length,10,'retirada sem reserva deixa dez jogadores reais em campo')
 console.log(`✅ Modelo: três trocas por lado, dois humanos, passado intacto, placar/tabela/autoria iguais, XI/notas preservados e relógio compartilhado. Fotografia comprimida: ${payload.z.length} bytes.`)
}finally{await vite.close()}
