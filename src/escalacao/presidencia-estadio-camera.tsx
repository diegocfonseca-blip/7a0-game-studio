import type {StadiumSave} from './estadiodata'
import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {PresidenciaEstadioAerea} from './presidencia-estadio-aerea'
/** Slot privado da aba existente: obras/compras permanecem no motor atual. */
export function PresidenciaEstadioCamera({stadium,onRoof}:{stadium?:StadiumSave;onRoof?:(closed:boolean)=>void}){
 return <section>
  <div style={{border:'3px solid #0c0c0c',borderRadius:12,overflow:'hidden',background:'#f4ecd6'}}>
   <PresidenciaEstadioImagem stadium={stadium} camera="aerial"/>
  </div>
  <div style={{margin:'12px 0'}}><PresidenciaEstadioAerea stadium={stadium} onRoof={onRoof}/></div>
 </section>
}
