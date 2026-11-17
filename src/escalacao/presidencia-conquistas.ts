import {agruparTrofeus,type TrofeuPresidencia} from './presidencia-trofeus'

export type ConquistasCarreira={
 managers?:readonly {id:number;teamName?:string}[];
 careerInternationalHistory?:readonly {season:number;userClubId?:number;userTeam:string;libertadores:number;champions:number;mundial:number}[];
 careerHonors?:Record<string,{A:number;B:number;C:number;D:number;V?:number}>;
 careerCopaHonors?:Record<string,number>;
 careerSupercopaHonors?:Record<string,number>;
 /** 🇧🇷 Brasil Oficial: Libertadores, Sul-Americana e Intercontinental REAIS gravam o campeão pelo NOME do clube */
 oficial?:unknown;
 oficialCampeoes?:readonly {liberta?:string;sula?:string;intercontinental?:string}[];
}
/** Lê somente contadores do clube selecionado. Repetições viram quantidade,
 * não novos modelos de troféu; jamais reconstrói títulos por temporada/divisão. */
export function conquistasDaCarreira(state:ConquistasCarreira,mgrId:number,english=false):TrofeuPresidencia[]{
 const key=`m${mgrId}`,league=state.careerHonors?.[key],raw:TrofeuPresidencia[]=[]
 for(const division of ['A','B','C','D','V'] as const){
  raw.push({id:`liga-${division}`,competition:`liga-${division}`,label:division==='V'?(english?'Amateur league':'Várzea'):`${english?'Division':'Série'} ${division}`,count:league?.[division]??0})
 }
 raw.push({id:'copa',competition:'copa',label:english?'National Cup':'Copa Nacional',count:state.careerCopaHonors?.[key]??0})
 raw.push({id:'supercopa',competition:'supercopa',label:english?'Legends Supercup':'Supercopa Legends',count:state.careerSupercopaHonors?.[key]??0})
 const club=state.managers?.find(m=>m.id===mgrId),unique=!!club?.teamName&&state.managers?.filter(m=>m.teamName===club.teamName).length===1
 const international=(state.careerInternationalHistory??[]).filter(h=>h.userClubId!==undefined?h.userClubId===mgrId:unique&&h.userTeam===club?.teamName)
 for(const [id,label]of [['libertadores','Libertadores'],['champions','Champions League'],['mundial',english?'Club World Cup':'Mundial de Clubes']]as const){
  const seasons=new Set<number>();let count=0
  for(const h of international){if(seasons.has(h.season))continue;seasons.add(h.season);if(Number.isSafeInteger(h[id])&&h[id]>0)count+=h[id]}
  // 🇧🇷 17/11: no Brasil Oficial a Libertadores e o Mundial (lá é a Copa Intercontinental) vêm do `oficialCampeoes`, pelo nome do clube
  if(state.oficial&&club?.teamName){const nome=club.teamName;count+=(state.oficialCampeoes??[]).filter(e=>(id==='libertadores'?e.liberta:id==='mundial'?e.intercontinental:undefined)===nome).length}
  raw.push({id,competition:id,label:state.oficial&&id==='mundial'?(english?'Intercontinental Cup':'Copa Intercontinental'):label,count})
 }
 if(state.oficial&&club?.teamName){const nome=club.teamName;raw.push({id:'sula',competition:'sula',label:english?'Copa Sudamericana':'Sul-Americana',count:(state.oficialCampeoes??[]).filter(e=>e.sula===nome).length})}
 return agruparTrofeus(raw)
}
