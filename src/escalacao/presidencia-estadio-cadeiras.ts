import {STADIUM_SECTORS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'

/** Estado exato que a futura arte Cadeiras poderá representar nas duas câmeras.
 * Ainda não selecionar raster: a sala precisa crescer junto com esta etapa. */
export function cadeirasExatasParaArte(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return false
 const paid=(key:string)=>{
  const cost=STADIUM_SECTORS.find(sector=>sector.k===key)?.cost
  return cost!==undefined&&Number.isFinite(st.inv[key])&&st.inv[key]>=cost
 }
 return (st.ext.includes('grama')||paid('grama'))&&paid('geral')&&paid('cadeiras')&&
  Object.entries(st.inv).every(([key,value])=>key==='grama'||key==='geral'||key==='cadeiras'||value===0)&&
  st.ext.every(key=>key==='grama'||key==='medico')
}
