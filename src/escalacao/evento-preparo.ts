import {FORMATIONS,SECTORS,type EventoAtivo,type FormationKey,type WonCard} from './types'

/** Shared by the notice and reducer. Incoming loans belong to this squad and may play. */
export function reservasDoEvento(ev:Pick<EventoAtivo,'cardId'|'pos'>,xi:readonly string[],squad:readonly WonCard[]){
 const titulares=new Set(xi)
 return squad.filter(c=>c.id!==ev.cardId&&c.pos===ev.pos&&!titulares.has(c.id)&&!c.fake)
}
export function escalaIntegraPreparo(xi:readonly string[],squad:readonly WonCard[],formation:FormationKey){
 const cards=xi.map(id=>squad.find(c=>c.id===id)),need=FORMATIONS[formation]
 return !!need&&xi.length===11&&new Set(xi).size===11&&cards.every(c=>c&&!c.fake)
  &&SECTORS.every(pos=>cards.filter(c=>c?.pos===pos).length===need[pos])
}

export function escalaSemLesionado(ev:Pick<EventoAtivo,'cardId'>,xi:readonly string[],squad:readonly WonCard[],formation:FormationKey){return !xi.includes(ev.cardId)&&escalaIntegraPreparo(xi,squad,formation)}

/** A preparation injury cannot claim that an unplayed match already happened. */
export function historiaLesaoPreparo(nome:string,desgaste:boolean,en:boolean){
 return desgaste
  ? en?`${nome} felt muscle discomfort during preparation. Accumulated fatigue ruled him out before kickoff. Choose his replacement in Squad.`:`${nome} sentiu um desconforto muscular na preparação. O desgaste acumulado o tirou do próximo jogo antes do apito. Escolha o substituto no Elenco.`
  : en?`${nome} picked up an injury during preparation and is unavailable for the next match. Choose his replacement in Squad.`:`${nome} se machucou durante a preparação e está fora do próximo jogo. Escolha o substituto no Elenco.`
}
