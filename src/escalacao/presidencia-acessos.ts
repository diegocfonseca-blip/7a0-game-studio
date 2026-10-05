import type {DivisaoPresidencia} from './presidencia-divisao'
/** Total somente quando todas as temporadas do clube estão documentadas.
 * A crônica antiga é limitada a200 linhas; lacunas não significam zero acessos. */
export function acessosDaPresidencia(state:DivisaoPresidencia & {seasonNo?:number},mgrId:number):number|undefined{
 const season=state.seasonNo,order=['V','D','C','B','A'],key=`m${mgrId}`
 if(!Number.isSafeInteger(season)||!season||season<1)return undefined
 const current=state.careerPlacements?.[key]
 if(!current||!order.includes(current))return undefined
 const rows=state.careerCronica?.[key]??[]
 if(!Array.isArray(rows))return undefined
 const divisions=new Map<number,string>()
 for(const row of rows){
  if(!row||!Number.isSafeInteger(row.t)||row.t<1||row.t>season||!order.includes(row.div))return undefined
  if(divisions.has(row.t)&&divisions.get(row.t)!==row.div)return undefined
  divisions.set(row.t,row.div)
 }
 // Uma crônica da temporada atual ainda não representa um acesso futuro.
 if(divisions.has(season)&&divisions.get(season)!==current)return undefined
 divisions.set(season,current)
 if(divisions.size!==season)return undefined
 let total=0
 for(let t=2;t<=season;t++){
  const previous=divisions.get(t-1),next=divisions.get(t)
  if(!previous||!next)return undefined
  const delta=order.indexOf(next)-order.indexOf(previous)
  // Mudança administrativa/salto não é prova de promoção normal.
  if(Math.abs(delta)>1)return undefined
  if(delta===1)total++
 }
 return total
}
