import {vidaDoBairro,type ContextoBairro} from './presidencia-bairro-tradicoes'
/** Somente calendário e apresentação; nunca usa a data do aparelho. */
export function culturaDoBairro(contexto:ContextoBairro={}){
 const vida=vidaDoBairro(contexto),fimDeSemana=vida.dow===0||vida.dow===6
 const junho=Number.isFinite(contexto.dia)&&new Date(contexto.dia!).getUTCMonth()===5
 return{pipas:vida.periodo==='tarde',pagode:fimDeSemana&&vida.periodo==='noite',junina:junho&&vida.periodo!=='manha',periodo:vida.periodo}
}
export function posePipa(seconds:number,index:number,centro:{x:number;z:number}){
 const phase=seconds*.42+index*2.4
 return{x:centro.x-3+index*3.6+Math.sin(phase)*1.1,y:11+index*2+Math.sin(phase*.7)*.75,z:centro.z+1+Math.cos(phase)*1.2}
}
