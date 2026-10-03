import {agruparTrofeus,type TrofeuPresidencia} from './presidencia-trofeus'

export type ConquistasCarreira={
 careerHonors?:Record<string,{A:number;B:number;C:number;D:number;V?:number}>;
 careerCopaHonors?:Record<string,number>;
 careerSupercopaHonors?:Record<string,number>;
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
 return agruparTrofeus(raw)
}
