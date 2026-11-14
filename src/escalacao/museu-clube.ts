import {hasExtra,type StadiumSave} from './estadiodata'

export const MUSEU_CUSTO=80
export const MUSEU_ETAPA=20
export const MUSEU_ETAPAS=4
export type MuseuClubeSave={version:1;etapas:0|1|2|3|4;inicio?:number;inauguracao?:number}
export type CarreiraMuseu={
 careerOnline?:boolean;onlineMode?:string;co2?:unknown;sport?:string;seasonNo?:number;youIdx:number;
 managers:readonly {id:number;isHuman?:boolean}[];
 careerCoins?:Record<number,number>;stadiums?:Record<number,StadiumSave>;
 careerMuseums?:Record<number,MuseuClubeSave>;
}
/** Only a valid versioned record represents construction. No legacy title or
 * stadium completion ever grants a museum. No fees or revenues are scheduled. */
export function etapasMuseu(value:MuseuClubeSave|undefined):number{
 return value?.version===1&&Number.isInteger(value.etapas)&&value.etapas>=0&&value.etapas<=MUSEU_ETAPAS?value.etapas:0
}
export function orcamentoMuseu(state:CarreiraMuseu,id:number,expectedStage=etapasMuseu(state.careerMuseums?.[id])){
 const saved=state.careerMuseums?.[id],stage=etapasMuseu(saved),coins=state.careerCoins?.[id]??0
 const reason=!state.careerOnline||state.onlineMode==='online'||state.co2||state.sport==='basquete'||state.managers[state.youIdx]?.id!==id||!state.managers[state.youIdx]?.isHuman?'modo':
  saved!==undefined&&(!saved||saved.version!==1||saved.etapas!==stage)?'progresso':stage>=MUSEU_ETAPAS?'concluido':expectedStage!==stage?'etapa':!hasExtra(state.stadiums?.[id],'loja')?'loja':!Number.isFinite(coins)||coins<MUSEU_ETAPA?'saldo':null
 return {ok:reason===null,reason,stage,cost:MUSEU_ETAPA,total:MUSEU_CUSTO,coins}
}
/** Pure, atomic purchase. A stale/double click carries the previous stage and
 * cannot charge again. Returns only the two balances that may change. */
export function investirMuseu(state:CarreiraMuseu,id:number,expectedStage:number){
 if(!Number.isInteger(expectedStage)||expectedStage<0||expectedStage>=MUSEU_ETAPAS)return null
 const quote=orcamentoMuseu(state,id,expectedStage)
 if(!quote.ok)return null
 const old=state.careerMuseums?.[id],etapas=(quote.stage+1) as MuseuClubeSave['etapas']
 return {coins:quote.coins-MUSEU_ETAPA,museum:{version:1 as const,etapas,
  ...(old?.inicio!==undefined?{inicio:old.inicio}:{inicio:state.seasonNo??1}),
  ...(etapas===4?{inauguracao:state.seasonNo??1}:{})}}
}
