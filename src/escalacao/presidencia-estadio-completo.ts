import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
const ART_SECTORS=['grama','geral','cadeiras','visitante','camarote']
const ART_EXTRAS=['refl','telao','loja','estac','praca','chopp','estacao','cober','hotel','retratil']
/** Estrutura é independente de hotel, loja e demais negócios do entorno. */
export function estruturaEstadioCompleta(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return false
 return STADIUM_SECTORS.every(s=>(s.k==='grama'&&st.ext.includes('grama'))||(Number.isFinite(st.inv[s.k])&&st.inv[s.k]>=s.cost))
}
/** New catalog items must gain their own art before this full-scene asset can claim them. */
export function catalogoCobertoNaAerea(sectors:readonly {k:string}[]=STADIUM_SECTORS,extras:readonly {k:string}[]=STADIUM_EXTRAS){
 return ART_SECTORS.every(k=>sectors.some(s=>s.k===k))&&sectors.every(s=>ART_SECTORS.includes(s.k))&&
  ART_EXTRAS.every(k=>extras.some(e=>e.k===k))&&extras.every(e=>ART_EXTRAS.includes(e.k))
}
/** Full precinct raster includes every catalog work. Never use rounded sectorPct:
 * a displayed 100% can still be short of the actual purchase price. */
export function estadioCompletoNaAerea(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st)||!catalogoCobertoNaAerea())return false
 // A save from a newer version can contain purchases unknown to this build.
 // Do not silently hide them behind a supposedly complete older illustration.
 if(st.ext.some(key=>!ART_EXTRAS.includes(key)&&key!=='grama'&&key!=='medico'))return false
 if(Object.entries(st.inv).some(([key,value])=>!ART_SECTORS.includes(key)&&value!==0))return false
 return STADIUM_SECTORS.every(s=>{
  const paid=st.inv[s.k]
  return s.k==='grama'&&st.ext.includes('grama')||Number.isFinite(paid)&&paid>=s.cost
 })&&STADIUM_EXTRAS.every(e=>st.ext.includes(e.k))
}
