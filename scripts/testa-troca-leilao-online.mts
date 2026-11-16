// Regressão VPSMF8: sair de Envelope Único e abrir outro leilão no mesmo aparelho.
// Só o reducer real; sem montar Provider, conectar canais ou usar contas/salas reais.
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {reducer,INITIAL} from '../src/escalacao/store'
import {SECTORS,FORMATIONS} from '../src/escalacao/types'
import type {EscState} from '../src/escalacao/types'

const before=process.argv.includes('--antes')
const out=process.env.QA_OUT??'/workspace/shared/chelsao-leilao-20261116'
mkdirSync(out,{recursive:true})
const report:{before:boolean;checks:unknown[];success?:boolean}={before,checks:[]}
let clock=1800000000000
const realNow=Date.now
Date.now=()=>clock
const start={type:'START_ONLINE' as const,roomId:'sala-local',roomCode:'LOCAL1',isHost:true,playerIndex:0,
 playerNames:['Dono local','Amigo A','Amigo B'],seatUids:['local-0','local-1','local-2'],youUid:'local-0',
 formation:'4-3-3' as const,deck:'todos' as const,clubes:true,copaMode:'liga' as const}
const act=(s:EscState,a:Parameters<typeof reducer>[1])=>reducer(s,a)
const snapshot=(s:EscState)=>({screen:s.screen,phase:s.phase,sector:s.sectorIdx,envUnico:s.envUnico,
 euAberto:s.euAberto,euRevelando:s.euRevelando,euRodada:s.euRodada,positions:[...new Set(s.currentCards.map(c=>c.pos))]})
function force(s:EscState){clock=Math.max(clock+5000,(s.phaseDeadline??clock)+5000);return act(s,{type:'FORCE_SEAL'})}
function bid(s:EscState){
 const ids=s.managers.filter(m=>m.isHuman).map(m=>m.id)
 for(let i=0;i<ids.length&&s.screen==='auction'&&['envelope','resq_envelope'].includes(s.phase);i++){
  const card=s.currentCards[i]
  s=act(s,{type:'SUBMIT_ENVELOPE',mgrId:ids[i],bids:card?[{cardId:card.id,amount:3+i}]:[]})
 }
 return s.screen==='auction'&&['envelope','resq_envelope'].includes(s.phase)?force(s):s
}
function untilConvocation(s:EscState){
 const seen=new Set<string>()
 for(let n=0;n<150&&s.screen!=='convocacao';n++){
  if(s.screen==='auction'&&['envelope','resq_envelope'].includes(s.phase)){
   s.currentCards.forEach(c=>seen.add(c.pos));s=bid(s)
  }else if(s.screen==='auction'&&['reveal','resq_reveal'].includes(s.phase))s=act(s,{type:'ADVANCE_REVEAL'})
  else if(s.screen==='monte'){
   const mgrId=s.monteOrder[s.monteIdx],m=s.managers.find(m=>m.id===mgrId)!
   const card=s.monte.find(c=>!m.squad.some(x=>x.pos===c.pos))
   assert(card,'o Monte deve ter uma escolha válida')
   s=act(s,{type:'MONTE_PICK',mgrId,cardId:card.id})
  }else throw new Error(`fase inesperada: ${s.screen}/${s.phase}`)
 }
 assert.equal(s.screen,'convocacao','a convocação deve ser alcançada')
 return {s,seen:[...seen]}
}
try {
 const initial=structuredClone(INITIAL) as EscState
 const unique=act(initial,{...start,envUnico:true})
 assert.equal(unique.euAberto,true)
 assert.equal(new Set(unique.currentCards.map(c=>c.pos)).size,5)
 const oldPhoto=JSON.stringify(unique)
 const normal=act(unique,{...start,roomId:'nova-local',roomCode:'LOCAL2',envUnico:false})
 assert.equal(JSON.stringify(unique),oldPhoto,'criar outra sala não deve modificar o estado anterior')
 assert.equal(normal.envUnico,false)
 assert.equal(!!normal.euAberto,before)
 const {s:convocation,seen}=untilConvocation(normal)
 const packages=convocation.managers.filter(m=>m.isHuman).map(m=>({id:m.id,positions:m.squad.filter(c=>c.pacote).map(c=>c.pos)}))
 if(before)assert(packages.every(m=>m.positions.length===1&&m.positions[0]==='GOL'))
 else{
  assert.deepEqual(seen,[...SECTORS])
  for(const m of packages)assert.deepEqual([...m.positions].sort(),[...SECTORS].sort())
 }
 let final=convocation
 for(const m of convocation.managers.filter(m=>m.isHuman)){
  const cartas=m.squad.flatMap(c=>c.pacote?.cartas.slice(0,FORMATIONS[m.formation][c.pos]).map(x=>x.id)??[])
  final=act(final,{type:'CONVOCAR_CLUBES',mgrId:m.id,cartas})
 }
 assert.equal(final.screen,'cerimonia')
 const free=final.managers.filter(m=>m.isHuman).map(m=>m.squad.filter(c=>c.via==='monte'&&c.paid===0).length)
 assert.deepEqual(free,before?[10,10,10]:[0,0,0])
 for(const m of final.managers.filter(m=>m.isHuman)){
  assert.equal(m.squad.length,11)
  assert.equal(m.money,100-(before?1:5)*(3+m.id))
 }
 assert.equal(final.youUid,'local-0');assert.equal(final.youIdx,0);assert.equal(final.isHost,true)
 report.checks.push({unfinishedUniqueToRegular:{old:snapshot(unique),new:snapshot(normal),visitedPositions:seen,packages,freePlayersPerHuman:free}})
 if(!before){
  // Estados reais da 1ª revelação e da 2ª lista, além do envelope ainda aberto.
  const reveal=bid(structuredClone(unique))
  assert.equal(reveal.euRevelando,true)
  let second=structuredClone(reveal)
  for(let n=0;n<30&&!second.euAberto;n++)second=act(second,{type:'ADVANCE_REVEAL'})
  assert.equal(second.euRodada,2);assert.equal(second.euAberto,true)
  for(const [label,prior] of [['aberto',unique],['revelando',reveal],['segunda-lista',second]] as const){
   for(const [name,options] of [
    ['normal',{clubes:false}],['clubes',{clubes:true}],['selecoes',{clubes:true,selecao:true}],
    ['decadas',{clubes:true,decada:true}],['liga-copa',{clubes:true,copaMode:'liga_copa'}],
    ['tocaia',{clubes:true,holandes:true}],['pregao-aberto',{clubes:true,pregaoAberto:true}],
    ['envelope-unico',{clubes:true,envUnico:true}]
   ] as const){
    const s=act(prior,{...start,roomId:`local-${label}-${name}`,...options})
    if(name==='envelope-unico'){
     assert.equal(s.euAberto,true);assert.equal(s.euRodada,1);assert.equal(s.euRevelando,false)
     assert.equal(new Set(s.currentCards.map(c=>c.pos)).size,5)
    }else{
     assert.equal(s.euAberto,false,`${label}/${name}`)
     assert.equal(s.euRevelando,false,`${label}/${name}`)
     assert.equal(s.euRodada,undefined,`${label}/${name}`)
     assert.equal(s.euSobras,undefined,`${label}/${name}`)
    }
    assert.equal(s.youUid,'local-0');assert.equal(s.youIdx,0);assert.equal(s.isHost,true)
    assert.deepEqual(s.seatUids,start.seatUids)
    report.checks.push({transition:`${label} -> ${name}`,state:snapshot(s)})
   }
  }
 }
 report.success=true
 console.log(JSON.stringify(report,null,2))
}finally{
 Date.now=realNow
 writeFileSync(`${out}/${before?'troca-antes':'troca-depois'}.json`,JSON.stringify(report,null,2)+'\n')
}
// Igual às outras bancadas do reducer: encerrar antes dos callbacks de Auth do
// módulo do aplicativo (import.meta.env só existe no Vite). Nenhum Provider é montado.
process.exit(0)
