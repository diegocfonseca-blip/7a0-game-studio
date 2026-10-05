import {STADIUM_SECTORS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
export const vistaJanelaDisponivel=(st?:StadiumSave)=>st===undefined||estadioVisualValido(st)
/** Etapa base realmente concluída. Compras extras não viram arte pronta por inferência. */
export function etapaBaseEstadio(st?:StadiumSave):'camarote'|'visitante'|'cadeiras'|'geral'|null{
 if(!estadioVisualValido(st))return null
 const paid=(key:string)=>{
  const cost=STADIUM_SECTORS.find(sector=>sector.k===key)?.cost
  return cost!==undefined&&Number.isFinite(st.inv[key])&&st.inv[key]>=cost
 }
 if(!(st.ext.includes('grama')||paid('grama')))return null
 if(!paid('geral'))return null
 if(!paid('cadeiras'))return 'geral'
 if(!paid('visitante'))return 'cadeiras'
 if(!paid('camarote'))return 'visitante'
 return 'camarote'
}
/** A janela e a garagem usam a mesma câmera inicial e a mesma obra de gramado.
 * Não substituir obras avançadas por arena pronta ou pela várzea. */
export function vistaInicialEstadio(st?:StadiumSave){
 if(st!==undefined&&!estadioVisualValido(st))return {supported:false,grass:0}
 // Departamento médico removido não deve apagar a vista de saves antigos.
 const supported=!st||(Object.entries(st.inv).every(([key,value])=>key==='grama'||value===0)&&st.ext.every(key=>key==='grama'||key==='medico'))
 // A etiqueta arredondada pode dizer 100% antes do pagamento completo.
 // A arte usa a fração real, sem NaN, negativo ou infinito no recorte CSS.
 const cost=STADIUM_SECTORS.find(s=>s.k==='grama')?.cost
 const paid=st?.inv.grama??0
 const grass=st?.ext.includes('grama')?1:cost&&cost>0&&Number.isFinite(paid)?Math.max(0,Math.min(1,paid/cost)):0
 return {supported,grass}
}
