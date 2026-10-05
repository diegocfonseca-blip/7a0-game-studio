import {STADIUM_SECTORS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
/** Esta cena contém somente gramado completo e Geral completa. Nunca esconde
 * uma obra adicional nem antecipa conclusão por arredondamento do percentual. */
export function geralNaAerea(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return false
 const paid=(key:string)=>{const cost=STADIUM_SECTORS.find(s=>s.k===key)?.cost;return cost!==undefined&&Number.isFinite(st.inv[key])&&st.inv[key]>=cost}
 return (st.ext.includes('grama')||paid('grama'))&&paid('geral')&&
  Object.entries(st.inv).every(([key,value])=>key==='grama'||key==='geral'||value===0)&&
  st.ext.every(key=>key==='grama'||key==='medico')
}
