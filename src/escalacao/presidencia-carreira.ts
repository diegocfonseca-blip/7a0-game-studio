import {roupaModularValida,type RoupaModular} from './presidente-vestuario-modular'
import {podeVestirModular} from './presidente-vestuario-acesso'
import type {PresidenteRoupaTier} from './presidente-roupas'
import {carteiraPresidenciaValida,confirmarPresidencia,type PresidenciaBem,type PresidenciaOrcamento,type PresidenciaCarteira} from './presidencia-economia'
import {duplaDaGaragem,duplaGaragemValida,type DuplaGaragem} from './presidencia-garagem'
import {aparenciaValida,copiarAparencia,type PresidenteAparencia} from './presidente-aparencia'

export type BensPresidencia={revision:number;owned:PresidenciaBem[];display?:DuplaGaragem}
export type PresidenteBaseSave={version:5;name:string;outfit:RoupaModular;appearance?:PresidenteAparencia;sinceSeason?:number}
export type CarreiraPresidencia={
 careerOnline?:boolean;onlineMode?:string;sport?:string;youIdx:number;seasonNo?:number;
 managers:readonly {id:number;isHuman?:boolean}[];
 careerCoins?:Record<number,number>;careerPresidency?:Record<number,BensPresidencia>;
 careerPresidentBase?:PresidenteBaseSave;
}
export function presidenteBaseValido(v:unknown):v is PresidenteBaseSave{
 if(!v||typeof v!=='object')return false
 const p=v as PresidenteBaseSave
 return p.version===5&&typeof p.name==='string'&&p.name.length<=40&&roupaModularValida(p.outfit)&&(p.appearance===undefined||aparenciaValida(p.appearance))&&(p.sinceSeason===undefined||(Number.isSafeInteger(p.sinceSeason)&&p.sinceSeason>0))
}
export function podeAlterarPresidencia(s:CarreiraPresidencia,mgrId:number){
 const you=s.managers[s.youIdx]
 return !!s.careerOnline&&s.onlineMode==='cpu'&&s.sport!=='basquete'&&!!you?.isHuman&&you.id===mgrId
}
export function salvarPresidenteNaCarreira<T extends CarreiraPresidencia>(state:T,mgrId:number,value:PresidenteBaseSave,tier:PresidenteRoupaTier|null=null){
 if(!podeAlterarPresidencia(state,mgrId)||!presidenteBaseValido(value)||!value.name.trim()||!podeVestirModular(value.outfit,tier))return {ok:false as const,error:'invalid-state' as const}
 // Posse vem da carreira, nunca do editor. Editar não reinicia nem reescreve
 // mandato; save antigo sem data continua desconhecido, sem retroagir.
 const existing=presidenteBaseValido(state.careerPresidentBase)&&!!state.careerPresidentBase.name.trim()
 const sinceSeason=existing?state.careerPresidentBase?.sinceSeason:
  Number.isSafeInteger(state.seasonNo)&&state.seasonNo!>0?state.seasonNo:undefined
 return {ok:true as const,value:{...state,careerPresidentBase:{version:5 as const,name:value.name.trim(),outfit:value.outfit,...(value.appearance?{appearance:copiarAparencia(value.appearance)}:{}),...(sinceSeason!==undefined?{sinceSeason}:{})}}}
}
/** Fonte única: caixa de moedas da carreira. Não lê nenhum rascunho de QA. */
export function carteiraDaCarreira(s:CarreiraPresidencia,mgrId:number):PresidenciaCarteira|null{
 if(!podeAlterarPresidencia(s,mgrId))return null
 const owned=s.careerPresidency?.[mgrId]
 if(owned!==undefined&&(!owned||typeof owned!=='object'))return null
 const wallet=owned===undefined?{cash:s.careerCoins?.[mgrId]??0,revision:0,owned:[]}:{cash:s.careerCoins?.[mgrId]??0,revision:owned.revision,owned:owned.owned}
 return carteiraPresidenciaValida(wallet)?{...wallet,owned:wallet.owned.map(b=>({...b}))}:null
}
export function negociarNaCarreira<T extends CarreiraPresidencia>(state:T,mgrId:number,quote:PresidenciaOrcamento,confirmed:boolean){
 const wallet=carteiraDaCarreira(state,mgrId)
 if(!wallet)return {ok:false as const,error:'invalid-state' as const}
 const result=confirmarPresidencia(wallet,quote,confirmed)
 if(!result.ok)return result
 const {cash,revision,owned}=result.value
 const previous=state.careerPresidency?.[mgrId]?.display
 const display=previous===undefined?undefined:duplaDaGaragem(owned,previous)
 return {ok:true as const,value:{...state,careerCoins:{...state.careerCoins,[mgrId]:cash},careerPresidency:{...state.careerPresidency,[mgrId]:{revision,owned,...(display?{display}:{})}}}}
}
export function exibirDuplaNaCarreira<T extends CarreiraPresidencia>(state:T,mgrId:number,display:DuplaGaragem){
 const wallet=carteiraDaCarreira(state,mgrId)
 if(!wallet||!duplaGaragemValida(display,wallet.owned))return {ok:false as const,error:'invalid-state' as const}
 // Exposição não muda caixa/revisão econômica nem invalida orçamento de compra.
 return {ok:true as const,value:{...state,careerPresidency:{...state.careerPresidency,[mgrId]:{revision:wallet.revision,owned:wallet.owned,display:[...display] as DuplaGaragem}}}}
}
/** Alterações visuais/bens também precisam disparar o autosave, sem rodada. */
export function assinaturaPresidencia(s:Pick<CarreiraPresidencia,'careerPresidency'|'careerPresidentBase'>){
 return s.careerPresidency||s.careerPresidentBase?JSON.stringify([s.careerPresidency??null,s.careerPresidentBase??null]):''
}
