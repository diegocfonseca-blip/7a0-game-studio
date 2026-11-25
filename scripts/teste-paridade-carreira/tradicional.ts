import {INITIAL,reducer} from '../../src/escalacao/store'
/** Native traditional career and native first auction; never converts an Official Brazil save. */
export function carreiraTradicionalBancada(teamName='Flamengo'){
 const random=Math.random;let value=20261125
 Math.random=()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return (value>>>0)/4294967296}
 try{
  let s=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName,formation:'4-3-3',rivals:3,league:'todos'})
  for(let i=0;i<2000&&s.screen!=='season';i++){
   if(s.screen==='auction'){
    if(s.phase==='envelope'||s.phase==='resq_envelope'){
     const m=s.managers[s.youIdx]
     if(!s.submitted.includes(m.id))s=reducer(s,{type:'SUBMIT_ENVELOPE',mgrId:m.id,bids:s.currentCards.slice(0,2).map(c=>({cardId:c.id,amount:4}))})
     if(s.phase==='envelope'||s.phase==='resq_envelope')s=reducer(s,{type:'FORCE_SEAL'})
    }else if(s.phase==='tiebreak'){
     s=reducer({...s,phaseDeadline:1},{type:'FORCE_TIEBREAK'})
    }else s=reducer(s,{type:'ADVANCE_REVEAL'})
   }else if(s.screen==='monte'){
    const id=s.monteOrder[s.monteIdx],m=s.managers.find(m=>m.id===id)
    if(m?.isHuman){
     const before=s.monteIdx
     for(const c of s.monte){s=reducer(s,{type:'MONTE_PICK',mgrId:id,cardId:c.id});if(s.monteIdx!==before||s.screen!=='monte')break}
     if(s.screen==='monte'&&s.monteIdx===before)s=reducer(s,{type:'MONTE_PASS',mgrId:id})
     if(s.screen==='monte'&&s.monteIdx===before)s=reducer({...s,monteDeadline:1},{type:'MONTE_TIMEOUT'})
    }else s=reducer({...s,monteDeadline:1},{type:'MONTE_TIMEOUT'})
   }else if(s.screen==='cerimonia')s=reducer(s,{type:'FINISH_CEREMONY'})
   else s=reducer(s,{type:'FORCE_SEAL'})
  }
  if(s.oficial||s.screen!=='season'||s.managers[s.youIdx].squad.length<11)throw Error(`Carreira tradicional inválida: ${s.screen}/${s.phase}`)
  return s
 }finally{Math.random=random}
}

import {CATALOG} from '../../src/escalacao/data'
import type {buildPyramid,Div} from '../../src/escalacao/pyramidseason'
import type {EscState,Sector,WonCard} from '../../src/escalacao/types'
/** Explicit UI-only bench for exercising three substitutions. Not a product roster or market transaction. */
export function reservasBancada(s:EscState){
 const m=s.managers[s.youIdx],used=new Set(m.squad.map(c=>c.name)),extra:WonCard[]=[]
 for(const pos of ['GOL','LAT','ZAG','MEI','ATA'] as Sector[])for(const card of CATALOG[pos]){
  if(used.has(card.name))continue
  extra.push({...card,pos,id:`qa-trad-${pos}-${extra.length}`,paid:4,contratoAte:9});used.add(card.name)
  if(extra.filter(c=>c.pos===pos).length>=2)break
 }
 return {...s,managers:s.managers.map(x=>x.id===m.id?{...x,squad:[...x.squad,...extra]}:x)}
}
/** Move the fixture, swapping one opponent back so the native league sizes stay intact. */
export function divisaoBancada(s:EscState,div:Div,worldFactory:typeof buildPyramid){
 const m=s.managers[s.youIdx],world=worldFactory(s.managers,m.id,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads),old=Object.values(world).flat().find(t=>t.teamId===m.id),other=world[div].find(t=>!t.human)
 if(!old||old.div===div)return s
 return {...s,careerDivision:div,careerPlacements:{...s.careerPlacements,[`m${m.id}`]:div,...(other?{[s.managers.some(m=>m.id===other.teamId)?`m${other.teamId}`:other.name]:old.div}:{})}}
}
