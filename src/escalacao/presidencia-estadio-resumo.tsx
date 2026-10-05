import {PresidenciaEstadioAerea} from './presidencia-estadio-aerea'
import {Btn} from './ui-primitives'
import {useT} from './lang'
import {estadioDaPresidencia,type CarreiraComEstadio} from './presidencia-estadio-integrado'
export function PresidenciaEstadioResumo({state,mgrId,onStadium,onRoof}:{state:CarreiraComEstadio;mgrId:number;onStadium?:()=>void;onRoof?:(closed:boolean)=>void}){
 const t=useT(),view=estadioDaPresidencia(state,mgrId)
 return <section aria-label={t('Estádio do clube','Club stadium')} style={{margin:'16px 0',padding:12,border:'3px solid #0c0c0c',borderRadius:12,background:'#f4ecd6',color:'#0c0c0c'}}>
  <h2 style={{fontFamily:'Oswald,sans-serif',margin:0}}>{t('ESTÁDIO','STADIUM')}</h2>
  <p>{t('Capacidade construída: ','Built capacity: ')}{view.capacity.now.toLocaleString()} / {view.capacity.max.toLocaleString()}</p>
  <p>{view.roof.built?(view.roof.closed?t('Teto fechado','Roof closed'):t('Teto aberto','Roof open')):t('Cobertura retrátil ainda não construída.','Retractable roof not built yet.')}</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:10}}><PresidenciaEstadioAerea stadium={state.stadiums?.[mgrId]} onRoof={view.roof.built?onRoof:undefined}/>{onStadium&&<Btn bg="#fff" onClick={onStadium}>{t('VER OBRAS DO ESTÁDIO','VIEW STADIUM CONSTRUCTION')}</Btn>}{view.roof.built&&onRoof&&<Btn onClick={()=>onRoof(!view.roof.closed)}>{view.roof.closed?t('ABRIR TETO','OPEN ROOF'):t('FECHAR TETO','CLOSE ROOF')}</Btn>}</div>
 </section>
}
