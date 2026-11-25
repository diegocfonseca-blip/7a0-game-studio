import {FORMATIONS,SECTORS,type Card,type EscState,type FormationKey,type Manager,type Tactic} from './types'
import {FORMACOES15,formacaoAtual} from './formacoes'
import {fichaDoTecnico,tecnicoPorNome} from './tecnicos'
import {formacaoNoCardapio} from './cardapio-formacoes'
import type {EntradaM2} from './motor2/carreira'

export type CareerLiveDecision={t:number;injury?:boolean;emergencyKeeper?:string;sai?:string;entra?:string;tactic?:Tactic;formation?:FormationKey}
export type CareerCupLive={season:number;managerId:number;initial:EntradaM2;commands:CareerLiveDecision[];revision:number;finished?:boolean}
export const cardIdentity=(c:{name:string;club?:string;year?:number})=>`${c.name}|${c.club??''}|${c.year??''}`
export function coachFormationOptions(s:Pick<EscState,'careerTecnicos'|'careerFormacaoExtra'>,m:Manager,current=m.formation,quinze=true){
 const tecnico=tecnicoPorNome(s.careerTecnicos?.[m.teamName]??''),ficha=tecnico?fichaDoTecnico(tecnico):null
 const atual=formacaoAtual({...m,formation:current,formationView:current===m.formation?m.formationView:undefined}),monta=(motor:FormationKey)=>SECTORS.every(pos=>m.squad.filter(c=>c.pos===pos&&!c.fake&&!c.emprestado).length>=FORMATIONS[motor][pos])
 const options=FORMACOES15.filter(f=>formacaoNoCardapio({quinze,temTecnico:!!tecnico,doTecnico:ficha?.formacoes??[],daCasa:s.careerFormacaoExtra?.[m.teamName]??null,atualRotulo:atual.rotulo,atualMonta:monta(current),rotulo:f.rotulo,monta:monta(f.motor)})).map(f=>({motor:f.motor,label:f.rotulo,available:monta(f.motor)}))
 if(!options.some(f=>f.motor===current))options.unshift({motor:current,label:atual.rotulo,available:monta(current)})
 return options
}
export function liveFormations(s:Pick<EscState,'careerTecnicos'|'careerFormacaoExtra'>,m:Manager,current=m.formation,quinze=true){
 const options=coachFormationOptions(s,m,current,quinze)
 return options.filter((f,i)=>options.findIndex(x=>x.motor===f.motor)===i)
}
export function validateLivePlan(p:{squad:readonly Card[];initial:string[];formation:FormationKey;commands:readonly CareerLiveDecision[];existing?:readonly CareerLiveDecision[];allowed:readonly FormationKey[];blocked?:ReadonlySet<string>;usedBefore?:number;halftime?:{t:number;ids:string[];formation:FormationKey};throughTime?:number}){
 const byId=new Map(p.squad.map(c=>[c.id,c])),ids=[...p.initial],left=new Set<string>(),entered=new Set<string>()
 let form=p.formation,used=p.usedBefore??0,last=-1,halfApplied=false
 const changes:{sai:string;entra:string}[]=[],injured=new Set<string>()
 const half=()=>{
  const h=p.halftime;if(!h||halfApplied)return true
  halfApplied=true
  const out=ids.filter(id=>!h.ids.includes(id)),incoming=h.ids.filter(id=>!ids.includes(id))
  if(h.ids.length!==11||new Set(h.ids).size!==11||out.length!==incoming.length||used+out.length>3||h.ids.some(id=>!byId.has(id)||left.has(id)||p.blocked?.has(id)))return false
  used+=out.length;out.forEach((id,i)=>{left.add(id);entered.add(incoming[i]);changes.push({sai:id,entra:incoming[i]})})
  ids.splice(0,ids.length,...h.ids);form=h.formation
  if(!FORMATIONS[form]||!p.allowed.includes(form))return false
  return SECTORS.every(pos=>ids.filter(id=>byId.get(id)?.pos===pos).length===FORMATIONS[form][pos])
 }
 if(!FORMATIONS[form]||ids.length!==11||new Set(ids).size!==11||ids.some(id=>!byId.has(id)))return null
 const prior=p.existing??[]
 if(p.commands.length<prior.length||prior.some((x,i)=>JSON.stringify(x)!==JSON.stringify(p.commands[i])))return null
 for(const [index,x]of p.commands.entries()){
  if(x.emergencyKeeper&&!x.injury||x.injury&&!x.sai)return null
  if(!Number.isFinite(x.t)||x.t<last||x.t<=0||x.t>200||x.tactic!=null&&!['retranca','equilibrio','ataque'].includes(x.tactic))return null
  if(p.halftime&&x.t>=p.halftime.t&&!half())return null
  last=x.t
  if(x.sai||x.entra){
   const i=ids.indexOf(x.sai??''),sa=byId.get(x.sai??''),en=byId.get(x.entra??'')
   if(x.injury){
    if(i<0||!sa||injured.size||x.formation||x.tactic||x.emergencyKeeper&&(!ids.includes(x.emergencyKeeper)||x.emergencyKeeper===sa.id))return null
    injured.add(sa.id);left.add(sa.id)
    if(!en){ids.splice(i,1);if(sa.pos==='GOL'&&!x.emergencyKeeper)return null;continue}
   }
   if(i<0||!sa||!en||en.fake||sa.id===en.id||ids.includes(en.id)||left.has(en.id)||entered.has(en.id)||p.blocked?.has(en.id)||++used>3)return null
   if(sa.pos!==en.pos&&!x.formation)return null
   ids[i]=en.id;left.add(sa.id);entered.add(en.id);changes.push({sai:sa.id,entra:en.id})
  }
  if(x.formation){if(!p.allowed.includes(x.formation)||!FORMATIONS[x.formation])return null;form=x.formation}
  const cards=ids.map(id=>byId.get(id)!)
  const grouped=p.commands[index+1]?.t===x.t
  if(!grouped&&SECTORS.some(pos=>cards.filter(c=>c.pos===pos).length!==FORMATIONS[form][pos]-[...injured].filter(id=>!changes.some(c=>c.sai===id)&&byId.get(id)?.pos===pos).length))return null
 }
 if(p.halftime&&(p.throughTime??last)>=p.halftime.t&&!half())return null
 return {ids,formation:form,used,left,changes}
}
export function cupLiveEntry(base:EntradaM2,record:CareerCupLive|undefined,squad:readonly Card[]){
 if(!record||record.initial.partidaId!==base.partidaId||!record.commands.length)return base
 const identities=new Set(squad.map(cardIdentity)),own=record.initial.casa.every(c=>identities.has(cardIdentity(c)))?0:1,byId=new Map(squad.map(c=>[c.id,c]))
 const aoVivo=record.commands.map(x=>({t:x.t,lado:own as 0|1,sai:x.sai?byId.get(x.sai)?.name:undefined,entra:x.entra?byId.get(x.entra):undefined,tatica:x.tactic==='retranca'?-1:x.tactic==='ataque'?1:x.tactic==='equilibrio'?0:undefined,formacao:x.formation,...(x.injury?{lesao:true}:{}),...(x.emergencyKeeper?{goleiroEmergencia:byId.get(x.emergencyKeeper)?.name}:{})}))
 return {...record.initial,aoVivo,intervaloRevisao:record.revision,atualizarIntervalo:true,somenteConsulta:true,preservarGuardado:true}
}

export function liveInitialIds(e:EntradaM2,m:Manager){
 const identities=new Set(m.squad.map(cardIdentity)),own=e.casa.every(c=>identities.has(cardIdentity(c)))?0:1,cs=own?e.fora:e.casa,byIdentity=new Map(m.squad.map(c=>[cardIdentity(c),c.id]))
 const ids=cs.map(c=>byIdentity.get(cardIdentity(c))??'')
 const second=own?e.fora2:e.casa2
 return {own,ids,formation:(own?e.fFora:e.fCasa)as FormationKey,
  halftime:second?.length?{t:45*(90/93),ids:second.map(c=>byIdentity.get(cardIdentity(c))??''),formation:((own?e.fFora2:e.fCasa2)??(own?e.fFora:e.fCasa))as FormationKey}:undefined}
}

/** Cup phase progress is measured in motor seconds, while the public clock uses 93 minutes. */
export const cupMatchMinute=(progress:number,leg:number)=>Math.max(0,progress-leg*90)*93/90
