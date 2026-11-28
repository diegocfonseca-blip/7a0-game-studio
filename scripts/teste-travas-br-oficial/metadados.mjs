import assert from 'node:assert/strict'
import {createServer} from 'vite'
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'silent'})
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o)}return o}
try{
 const {reducer,INITIAL}=await vite.ssrLoadModule('/src/escalacao/store.tsx'),{_forcaBrasilOficialParaTeste}=await vite.ssrLoadModule('/src/escalacao/sport.ts')
 // SSR não baixa JSON: a política de metadados é a mesma no estado real criado pelo reducer.
 _forcaBrasilOficialParaTeste(false)
 const origem=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Clube de teste',formation:'4-3-3',rivals:3})
 const s=freeze({...origem,oficial:{clube:'Flamengo',economiaDesde:1},seasonNo:6,careerManagementSince:1,m2Res:{antigo:[0,0,[],4],anterior:[1,0,[],5],atual:[2,1,[],6]}}),antes=JSON.stringify(s)
 const igual=(a,b)=>{for(const k of ['managers','cpuSquads','careerLineup','careerTactics','careerCoins','careerLedger','oficial'])assert.equal(a[k],b[k],`metadado preserva referência de ${k}`)}
 const out=reducer(s,{type:'GUARDA_M2',novos:{novo:[0,1,[],6],atual:[8,8,[],6]}})
 assert.deepEqual(out.m2Res,{anterior:[1,0,[],5],atual:[2,1,[],6],novo:[0,1,[],6]});igual(out,s);assert.equal(JSON.stringify(s),antes,'estado anterior imutável')
 assert.equal(reducer(out,{type:'GUARDA_M2',novos:{novo:[9,9,[],6]}}),out,'primeiro resultado confirmado prevalece e repetição não redesenha')
 assert.equal(reducer(out,{type:'GUARDA_M2',novos:{}}),out,'pacote vazio é inofensivo')
 let atual=out
 for(let n=0;n<100;n++)assert.equal(reducer(atual,{type:'GUARDA_M2',novos:{atual:[2,1,[],6]}}),atual)
 const cal={0:[0,2,4]},clubes={'Clube de teste':[0,2,4]}
 const c=reducer(out,{type:'OFICIAL_CALENDARIO_FISICO',season:6,cal,clubes});igual(c,out)
 assert.deepEqual(c.oficialFisica,{season:6,cal,clubes});assert.equal(reducer(c,{type:'OFICIAL_CALENDARIO_FISICO',season:6,cal:structuredClone(cal),clubes:structuredClone(clubes)}),c)
 const jogo={id:'copa:real',r:3,clubes:{'Clube de teste':s.managers[s.youIdx].squad.filter(c=>!c.fake).map(c=>`${c.name}|${c.club}|${c.year}`)}}
 const f=reducer(c,{type:'OFICIAL_COPA_FISICA',season:6,jogos:[jogo]});igual(f,c);assert.equal(f.oficialFisica.cal,c.oficialFisica.cal);assert.deepEqual(f.oficialFisica.copas[jogo.id],jogo)
 assert.equal(reducer(f,{type:'OFICIAL_COPA_FISICA',season:6,jogos:[{...jogo,r:12}]}),f,'não reaplica desgaste do jogo já registrado')
 assert.equal(reducer(f,{type:'OFICIAL_COPA_FISICA',season:5,jogos:[{...jogo,id:'velho'}]}),f);assert.equal(reducer(f,{type:'OFICIAL_CALENDARIO_FISICO',season:5,cal:{}}),f)
 const online={...f,onlineMode:'online'};assert.equal(reducer(online,{type:'GUARDA_M2',novos:{novo2:[1,1,[],6]}}),online,'sala online conserva sua própria autoridade')
 const {memoizaPorRodada}=await vite.ssrLoadModule('/src/escalacao/simulacao-por-rodada.ts');let chamadas=0
 const sim=memoizaPorRodada(r=>({rodada:r,n:++chamadas}),3),r1=sim(1),r2=sim(2)
 assert.equal(sim(1),r1);assert.equal(chamadas,2);sim(3);sim(4);assert.equal(sim(1),r1);assert.notEqual(sim(2),r2,'cache tem limite e descarta a menos usada')
 const outrasEntradas=memoizaPorRodada(r=>({rodada:r,n:++chamadas}));assert.notEqual(outrasEntradas(1),r1,'uma nova tática/temporada ganha cache próprio')
 console.log('✅ Metadados: histórico/primeiro resultado, duas temporadas, imutabilidade, repetição sem clone/re-render, calendário/copa sem recomputar elenco, nenhuma moeda/tática/nota alterada e guardas de temporada/online.')
}finally{await vite.close()}
