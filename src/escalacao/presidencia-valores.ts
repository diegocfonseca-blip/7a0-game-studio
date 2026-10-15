import {STADIUM_EXTRAS,type StadiumSave} from './estadiodata'
import {estacionamentoDoSave} from './presidencia-estacionamento'
const valido=(n:unknown):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0
/** Investimento registrado nos setores + valor atual das melhorias compradas.
 * Extras antigos não guardam recibo: isso é avaliação, não custo histórico. */
export function valorEstadioPresidencia(st?:StadiumSave):number|undefined{
 if(!st)return 0
 const parking=estacionamentoDoSave(st)
 if(!parking.valid)return undefined
 let total=parking.investment
 for(const paid of Object.values(st.inv)){if(!valido(paid))return undefined;total+=paid}
 for(const key of new Set(st.ext)){
  if(key==='estac')continue // já soma o que foi investido; legado vale os 70 pagos pela compra integral
  // Legado sem recibo não permite inventar o valor pago.
  if(key==='grama'){if(!(st.inv.grama>0))return undefined;continue}
  if(key==='medico')continue // removido do jogo, não é um bem atual
  const extra=STADIUM_EXTRAS.find(e=>e.k===key)
  if(!extra)return undefined
  total+=extra.cost
 }
 return valido(total)?total:undefined
}
/** Mesma base de aquisição usada pelo resumo da carreira, não preço de venda. */
export function valorElencoPresidencia(squad?:readonly {paid?:number}[]):number|undefined{
 if(!Array.isArray(squad))return undefined
 let total=0
 for(const card of squad){if(!card||!valido(card.paid))return undefined;total+=card.paid}
 return valido(total)?total:undefined
}
