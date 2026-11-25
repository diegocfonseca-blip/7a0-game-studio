export type CareerDeal={name:string;pos:string;team:string;teamId:number;paid:number;via:'leilao'|'monte'|'desempate';season:number;round:number;from?:string;club?:string;year?:number}
export function dealDescription(d:CareerDeal,en=false){
 const method=en?({leilao:'auction',monte:'Final Pile',desempate:'auction tiebreak'}[d.via]):({leilao:'leilão',monte:'Monte Final',desempate:'desempate do leilão'}[d.via])
 return en?`Recorded signing: ${method}, season ${d.season}${d.round>0?`, round ${d.round}`:''}${d.from?`, from ${d.from}`:''}; ${d.team} paid ${d.paid} coins.`:`Contratação registrada: ${method}, temporada ${d.season}${d.round>0?`, rodada ${d.round}`:''}${d.from?`, vindo de ${d.from}`:''}; ${d.team} pagou ${d.paid} moedas.`
}
