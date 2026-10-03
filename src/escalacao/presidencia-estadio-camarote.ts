import {STADIUM_SECTORS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'

/** Etapa exata da arte: cinco setores pagos, sem melhorias não representadas. */
export function camaroteExatoParaArte(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return false
 const included=['grama','geral','cadeiras','visitante','camarote']
 const paid=(key:string)=>{
  const cost=STADIUM_SECTORS.find(sector=>sector.k===key)?.cost
  return cost!==undefined&&Number.isFinite(st.inv[key])&&st.inv[key]>=cost
 }
 return (st.ext.includes('grama')||paid('grama'))&&included.slice(1).every(paid)&&
  Object.entries(st.inv).every(([key,value])=>included.includes(key)||value===0)&&
  st.ext.every(key=>key==='grama'||key==='medico')
}
