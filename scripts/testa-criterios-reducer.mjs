// Transições reais com dados sintéticos; não carrega conta/save de jogador.
import assert from 'node:assert/strict'
import {createServer} from 'vite'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'})
try {
  const S=await server.ssrLoadModule('/src/escalacao/store.tsx')
  const C=await server.ssrLoadModule('/src/escalacao/condicao.ts')
  const pos=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA']
  const squad=pos.map((p,i)=>({id:'test-'+i,name:'Teste '+i,pos:p,club:'Clube teste',year:2026,lo:70,hi:80,fame:3,paid:10,contratoAte:30}))
  const make=()=>({...structuredClone(S.INITIAL),screen:'season',careerOnline:true,onlineMode:'cpu',agenciaOn:true,seasonNo:10,booksSeason:10,round:38,seed:12345,youIdx:0,managers:[{...structuredClone(S.INITIAL.managers[0]),id:0,isHuman:true,teamName:'Teste FC',squad,formation:'4-3-3'}],careerPlacements:{m0:'D'},careerCoins:{0:1000},condicaoCarry:Object.fromEntries(squad.map(c=>[C.chaveCarry(c),{g:0,j:20,gl:5,as:2}]))})
  const advance=s=>S.reducer(s,{type:'OPEN_RESERVE_LIST',placements:{m0:'D'},rewards:{},clubRewards:{},champions:{}})
  const hist=make(),card={id:'historic',name:'Júlio César',club:'Inter',year:2010,pos:'GOL',fame:4,lo:71,hi:77,gasMod:-3}
  hist.managers[0].squad[0]={...card}
  hist.m2Res={fixture:[0,0,[],10,'criterios-carreira-1',{seed:123,casa:[{...card}],fora:[],tatica:[0,0],bots:[false,true],clima:'sol',partidaId:'history',preservarGuardado:true}]}
  const snapshot=JSON.stringify(hist.m2Res)
  const load=S.__sincronizaNiveis(hist)
  assert.equal(JSON.stringify(load.m2Res),snapshot,'catálogo alterou fotografia oficial')
  assert.notEqual(load.managers[0].squad[0].lo,71,'ficha atual deixou de acompanhar catálogo')
  const st=make(),next=advance(st)
  assert.equal(next.seasonNo,11);assert.equal(next.criteriosCarreiraDesde,11)
  assert(Object.values(next.condicaoCarry).every(v=>v.g===100),'desgaste indevido antes da Série C')
  assert(Object.values(next.condicaoCarry).every(v=>v.j>=20&&v.gl===5&&v.as===2),'histórico esportivo perdeu dados')
  const once=advance(next);assert.equal(once.seasonNo,11,'duplo clique pulou temporada')
  const old=make();old.condicaoDesde=2
  const down=advance(old);assert.equal(down.condicaoDesde,2,'rebaixamento apagou desbloqueio')
  const half=make();half.round=1
  const changed=S.reducer(half,{type:'SET_HALFTIME',mgrId:0,round:0,xi2:squad.map(c=>c.id),formation:'4-3-3',tactic:'ataque'})
  assert.equal(changed.careerHalftime[0][0].revisao,1)
  const again=S.reducer(changed,{type:'SET_HALFTIME',mgrId:0,round:0,xi2:squad.map(c=>c.id),formation:'4-3-3',tactic:'retranca'})
  assert.equal(again.careerHalftime[0][0].revisao,2)
  const invalid=S.reducer(again,{type:'SET_HALFTIME',mgrId:0,round:0,xi2:squad.slice(0,10).map(c=>c.id)})
  assert.deepEqual(invalid.careerHalftime,again.careerHalftime)
  const draft=S.reducer({...make(),co2:{enabled:true}},{type:'OPEN_RESERVE_LIST',placements:{m0:'D'},rewards:{},clubRewards:{},champions:{}})
  assert.equal(draft.seasonNo,10)
  console.log('PASS: virada futura, gás sem desgaste oculto, estatísticas, duplo clique, desbloqueio persistente e revisões válidas do intervalo')
} finally {await server.close()}
