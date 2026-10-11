import {PAVIMENTACAO_ESTADIO} from './presidencia-estadio-projeto'
import {STADIUM_SECTORS,STADIUM_EXTRAS,sectorPct,sectorNome,extraNome,type StadiumSave,type StadiumExtra} from './estadiodata'
import {estadioCompletoNaAerea} from './presidencia-estadio-completo'
import {etapaBaseEstadio} from './presidencia-vista-estadio'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {camadasEstadio,extrasSemArte} from './presidencia-estadio-camadas'
export type ObraVisualEstadio={id:string;name:string;kind:'sector'|'extra';progress:number;artReady:boolean}
/** Catálogo real, não lista independente: obras futuras entram automaticamente.
 * artReady indica arte integrada, não autorização nem posse. */
export function obrasVisuaisEstadio(st?:StadiumSave,extraCatalog:readonly StadiumExtra[]=[...STADIUM_EXTRAS,PAVIMENTACAO_ESTADIO]):ObraVisualEstadio[]{
 if(st!==undefined&&!estadioVisualValido(st))return []
 const complete=estadioCompletoNaAerea(st)
 const stage=etapaBaseEstadio(st)
 const represented=['grama','geral','cadeiras','visitante','camarote']
 const highest=stage?represented.indexOf(stage):0
 const layers=camadasEstadio(st,'aerial')
 const visible=new Set(layers.map(layer=>layer.id.split(':')[0]))
 const pending=new Set(extrasSemArte(st))
 const sectors=STADIUM_SECTORS.map(s=>({
  id:s.k,name:sectorNome(s),kind:'sector' as const,
  progress:sectorPct(st,s.k),artReady:complete||visible.has(s.k)||represented.indexOf(s.k)>=0&&represented.indexOf(s.k)<=highest,
 }))
 const extras=extraCatalog.map(e=>({
  id:e.k,name:extraNome(e),kind:'extra' as const,
  progress:st?.ext.includes(e.k)?100:0,artReady:(complete&&STADIUM_EXTRAS.some(known=>known.k===e.k))||!!st?.ext.includes(e.k)&&!pending.has(e.k),
 }))
 return [...sectors,...extras].filter(item=>Number.isFinite(item.progress)&&item.progress>0)
}
