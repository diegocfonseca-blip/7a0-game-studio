import type {StadiumSave} from './estadiodata'
import {PresidenciaEstadioMapa} from './presidencia-estadio-mapa'
import {PresidenciaEstadioAerea} from './presidencia-estadio-aerea'
/** Slot privado da aba existente: obras/compras permanecem no motor atual. */
export function PresidenciaEstadioCamera({stadium,onRoof}:{stadium?:StadiumSave;onRoof?:(closed:boolean)=>void}){
 return <section>
  <PresidenciaEstadioMapa stadium={stadium}/>
  <div style={{margin:'12px 0'}}><PresidenciaEstadioAerea stadium={stadium} onRoof={onRoof}/></div>
 </section>
}
