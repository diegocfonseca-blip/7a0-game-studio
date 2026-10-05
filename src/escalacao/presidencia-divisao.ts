import type {CronicaPresidencia} from './presidencia-historia'
import type {ConquistasCarreira} from './presidencia-conquistas'
export type DivisaoPresidencia=CronicaPresidencia & ConquistasCarreira & {careerPlacements?:Record<string,string>|null}
/** Só evidências do clube escolhido. A divisão de fundação (careerDivision)
 * não é a divisão atual da pirâmide. Histórico ausente permanece desconhecido. */
export function melhorDivisaoRegistrada(state:DivisaoPresidencia,mgrId:number,english=false):string|undefined{
 const key=`m${mgrId}`,known=new Set<string>(),order=['A','B','C','D','V']
 const current=state.careerPlacements?.[key]
 if(current&&order.includes(current))known.add(current)
 const rows=state.careerCronica?.[key]
 if(Array.isArray(rows))for(const row of rows){
  if(row&&Number.isSafeInteger(row.t)&&row.t>0&&order.includes(row.div))known.add(row.div)
 }
 const titles=state.careerHonors?.[key]
 if(titles)for(const div of ['A','B','C','D','V'] as const){
  const count=titles[div]
  if(Number.isSafeInteger(count)&&count!>0)known.add(div)
 }
 const best=order.find(div=>known.has(div))
 return best===undefined?undefined:best==='V'?(english?'Amateur league':'Várzea'):`${english?'Division':'Série'} ${best}`
}
