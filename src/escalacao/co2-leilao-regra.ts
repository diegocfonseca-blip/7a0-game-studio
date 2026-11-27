import type {EscState} from './types'
export const CO2_ACOES_REMOTAS = new Set(['SUBMIT_ENVELOPE','SUBMIT_TIEBREAK','MONTE_PICK','MONTE_PASS','HOLANDES_PEGAR','PREGAO_ABERTO_LANCE','TOGGLE_RESERVE_LIST','RENEW_CONTRACT','RELEASE_CONTRACT'])
/** Contexto do lote; não inclui os lances dos outros nem o relógio. */
export function etapaLeilaoCo2(s:EscState){return JSON.stringify([s.seasonNo,s.screen,s.phase,s.sectorIdx,s.round,s.currentCards.map(c=>c.id),s.monteIdx,s.tiebreakIdx])}
export function acaoLeilaoCo2(a:unknown,uid:string,s:EscState,ordem:readonly string[]){
 if(!a||typeof a!=='object')return false
 const x=a as Record<string,unknown>,id=Number(x.mgrId)
 if(!CO2_ACOES_REMOTAS.has(String(x.type))||!Number.isInteger(id)||ordem[id]!==uid||x._etapa!==etapaLeilaoCo2(s))return false
 if(x.type==='SUBMIT_ENVELOPE')return Array.isArray(x.bids)&&x.bids.length<=500&&x.bids.every((b:any)=>typeof b?.cardId==='string'&&Number.isFinite(b.amount)&&b.amount>=0)
 if(x.type==='SUBMIT_TIEBREAK')return Number.isFinite(x.amount)&&Number(x.amount)>=0
 if(x.type==='PREGAO_ABERTO_LANCE')return Number.isFinite(x.valor)&&Number(x.valor)>=0
 if(x.type==='HOLANDES_PEGAR')return typeof x.cardId==='string'&&Number.isFinite(x.preco)&&Number(x.preco)>=0
 if(x.type==='MONTE_PASS')return true
 return typeof x.cardId==='string'
}
