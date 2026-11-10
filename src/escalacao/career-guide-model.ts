import type {EscState} from './types'
import {condicaoAtiva} from './condicao'

export type CareerGuideUnlock='condicao'|'guia-moral'|'guia-mercado-livre'|'guia-lendas'
/** Same release conditions as the game. No writes, timing changes or made-up division unlocks. */
export function nextCareerGuideUnlock(state:EscState):CareerGuideUnlock|null{
 if(!state.careerOnline||state.onlineMode==='online'||state.sport==='basquete'||state.co2)return null
 const me=state.managers[state.youIdx],division=state.careerPlacements?.[`m${me?.id}`]??state.careerDivision
 const moral=state.careerColetiva?.[me?.id]?.efeitos?.some(e=>e.tipo==='moral'&&e.t===(state.seasonNo??1)&&e.r>=state.round)
 const candidates:CareerGuideUnlock[]=[]
 if(condicaoAtiva(state))candidates.push('condicao')
 if(moral)candidates.push('guia-moral')
 if(state.escadaLivre)candidates.push('guia-mercado-livre')
 else if(state.escadaOn&&division==='A')candidates.push('guia-lendas')
 return candidates.find(k=>!state.careerSeen?.[k])??null
}
