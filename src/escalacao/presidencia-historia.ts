export type CronicaPresidencia={careerCronica?:Record<string,{t:number;div:string;campeao?:1;copa?:1;sup?:1}[]>}
/** Somente temporadas encerradas registradas pelo jogo. Saves antigos podem
 * não conter o passado: não inventar fundação, acessos ou datas dos títulos. */
export function historiaDaPresidencia(state:CronicaPresidencia,mgrId:number,english=false){
 const rows=state.careerCronica?.[`m${mgrId}`]
 const timeline:{id:string;label:string}[]=[]
 if(!Array.isArray(rows))return timeline
 const seen=new Set<number>()
 for(const row of [...rows].sort((a,b)=>(a?.t??0)-(b?.t??0))){
  if(!row||!Number.isSafeInteger(row.t)||row.t<1||!['V','D','C','B','A'].includes(row.div)||seen.has(row.t))continue
  seen.add(row.t)
  const division=row.div==='V'?(english?'Amateur league':'Várzea'):`${english?'Division':'Série'} ${row.div}`
  const events=[division]
  if(row.campeao===1)events.push(english?'League champion':'Campeão da liga')
  if(row.copa===1)events.push(english?'National Cup':'Copa Nacional')
  if(row.sup===1)events.push(english?'Legends Supercup':'Supercopa Legends')
  timeline.push({id:`temporada-${row.t}`,label:`T${row.t} · ${events.join(' · ')}`})
 }
 return timeline
}
