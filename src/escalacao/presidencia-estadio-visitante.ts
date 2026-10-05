import {STADIUM_SECTORS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'

/** Imagem desta etapa contém somente Gramado, Geral, Cadeiras e Visitante completos. */
export function visitanteExatoParaArte(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return false
 const paid=(key:string)=>{
  const cost=STADIUM_SECTORS.find(sector=>sector.k===key)?.cost
  return cost!==undefined&&Number.isFinite(st.inv[key])&&st.inv[key]>=cost
 }
 return (st.ext.includes('grama')||paid('grama'))&&paid('geral')&&paid('cadeiras')&&paid('visitante')&&
  Object.entries(st.inv).every(([key,value])=>key==='grama'||key==='geral'||key==='cadeiras'||key==='visitante'||value===0)&&
  st.ext.every(key=>key==='grama'||key==='medico')
}
