import {segmentoLivre,type PontoSolo,type ObstaculoSolo} from './presidencia-estadio-navegacao'
export type PortaEstadio={id:string;approach:PontoSolo;threshold:PontoSolo;inside:PontoSolo;stay:number}
/** Ground coordinates registered on complete-2304-768.webp (2× world scale).
 * Shop, hotel and bar have registered doorways. Other destinations remain outdoor visits.
 * The building collider remains intact; this narrow portal is not a shortcut.
 */
export const PORTA_LOJA:PortaEstadio={id:'loja',approach:{x:1222,y:448},threshold:{x:1230,y:441},inside:{x:1230,y:436},stay:24}
/** Hotel's open doorway, registered on complete-768-1024.webp at 2× scale. */
export const PORTA_HOTEL:PortaEstadio={id:'hotel',approach:{x:428,y:544},threshold:{x:421,y:535},inside:{x:416,y:527},stay:45}
/** Front glazed entrance of the bar, complete-2304-512.webp at 2× scale. */
export const PORTA_BAR:PortaEstadio={id:'chopp',approach:{x:1166,y:331},threshold:{x:1166,y:302},inside:{x:1166,y:296},stay:35}
/** A clipped route cannot jump to a door. Only the destination's own wall
 * permits passage; gardens, construction and neighbouring buildings still block it. */
export function portaAcessivel(portal:PortaEstadio,end:PontoSolo,obstacles:readonly ObstaculoSolo[],radius:number){
 if(Math.hypot(end.x-portal.approach.x,end.y-portal.approach.y)>1e-6)return false
 const others=obstacles.filter(o=>o.id!==portal.id)
 return segmentoLivre(portal.approach,portal.threshold,others,radius)&&segmentoLivre(portal.threshold,portal.inside,others,radius)
}
export function visitaNaPorta(portal:PortaEstadio,elapsed:number,speed:number){
 const length=Math.hypot(portal.threshold.x-portal.approach.x,portal.threshold.y-portal.approach.y),depth=Math.hypot(portal.inside.x-portal.threshold.x,portal.inside.y-portal.threshold.y)
 const trip=(length+depth)/speed,total=2*trip+portal.stay
 const exiting=elapsed>trip+portal.stay
 const distance=elapsed<trip?elapsed*speed:exiting?(total-elapsed)*speed:length+depth
 const d=Math.max(0,Math.min(length+depth,distance)),inside=d>length
 const a=inside?portal.threshold:portal.approach,b=inside?portal.inside:portal.threshold,q=inside?(d-length)/depth:d/length
 return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q,angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+(exiting?180:0),walking:elapsed<trip||exiting,hiddenFraction:inside?q:0,visit:elapsed>=trip&&!exiting?'inside':exiting?'leaving':'entering',total}
}
