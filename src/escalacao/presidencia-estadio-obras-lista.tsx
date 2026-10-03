import {obrasVisuaisEstadio} from './presidencia-estadio-obras'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
/** Inventário da vista em construção: não representa prédio por texto/ícone. */
export function PresidenciaEstadioObrasLista({stadium}:{stadium?:StadiumSave}){
 const t=useT(),works=obrasVisuaisEstadio(stadium)
 if(!works.length)return null
 return <section aria-label={t('Obras registradas neste estádio','Recorded construction in this stadium')}>
  <h3 style={{fontFamily:'Oswald,sans-serif',fontWeight:700}}>{t('SUAS OBRAS','YOUR CONSTRUCTION')}</h3>
  <ul style={{listStyle:'none',padding:0,display:'grid',gap:8}}>
   {works.map(work=><li key={work.kind+work.id} data-stadium-work={work.id} style={{border:'2px solid #0c0c0c',borderRadius:10,padding:8,background:'#fff'}}>
    <strong>{work.name}</strong> — {work.progress}%
    {!work.artReady&&<small style={{display:'block'}}>{t('Compra registrada; representação na arte ainda em preparação.','Purchase recorded; visual representation is still in preparation.')}</small>}
   </li>)}
  </ul>
 </section>
}
