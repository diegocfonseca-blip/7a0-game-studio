import type {Card,EventoAtivo} from './types'
/** One already-drawn injury, moved to the match. Never rolls a second clinical risk. */
export type LesaoPartida={season:number;round:number;mgrId:number;cardId:string;minute:number;rodadas:number;status:'programada'|'resolvida'|'encerrada';subId?:string;emergencyKeeper?:string;cancelada?:boolean}
export function faseDaLesao(seed:number,season:number,round:number){
 const n=(Math.imul(seed^Math.imul(season,104729)^Math.imul(round,7919)^0x51e50,0x45d9f3b)>>>0)
 return {durante:n%2===0,minute:55+(n>>>8)%24}
}
export function eventoDepoisDaLesao(l:LesaoPartida,card:Card,en=false):EventoAtivo{
 return {season:l.season,round:l.round+1,mgrId:l.mgrId,tipo:'lesao',cardId:card.id,club:card.club,year:card.year,nome:card.name,pos:card.pos,rodadas:l.rodadas,status:'pendente',momento:'partida',desgaste:true,
 historia:en?`${card.name} left the match injured. Sort out the squad before the next game.`:`${card.name} saiu machucado durante a partida. Organize o elenco antes do próximo jogo.`}
}
