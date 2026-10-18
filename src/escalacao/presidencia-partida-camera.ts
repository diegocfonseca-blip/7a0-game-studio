import {CAMPO_INTERNO,CAMPO_MAPA} from './presidencia-partida-geometria'
import {limitarVistaMapa,type DimensoesVista,type VistaMapa} from './presidencia-estadio-mapa-model'

type CantosCampo=typeof CAMPO_INTERNO|typeof CAMPO_MAPA
/** Keep even unusually tall viewports within the aerial artwork's fit range. */
export const alturaMaximaCampoPartida=(width:number)=>width*2.4
/** Fill the viewport with the existing artwork. A wide artwork must never
 * become a little strip with blank bands above/below on a portrait phone. */
export function dimensoesCameraPartida(width:number,height:number):DimensoesVista{
 const worldWidth=Math.max(width,height*1.5)
 return {width,height,world:{width:worldWidth,height:worldWidth/1.5},minZoom:1}
}
/** Fit the registered pitch, not the whole map. Leave room for both nets and
 * the touchlines; the surrounding stadium remains part of the same world. */
export function enquadrarCampoPartida(corners:CantosCampo,dimensions:DimensoesVista):VistaMapa{
 const {width,height,world}=dimensions
 if(!width||!height||!world.width||!world.height)return {zoom:1,x:0,y:0}
 const xs=corners.map(point=>point[0]),ys=corners.map(point=>point[1])
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys)
 const pitchWidth=(right-left)/1536*world.width,pitchHeight=(bottom-top)/1024*world.height
 const zoom=Math.max(1,Math.min(6,width/(pitchWidth*1.14),height/(pitchHeight*1.18)))
 const x=-(left/2+right/2-768)/1536*world.width*zoom
 const y=-(top/2+bottom/2-512)/1024*world.height*zoom
 return limitarVistaMapa({zoom,x,y},width,height,6,world,1)
}
/** The internal camera's landscape artwork cannot show both goals and cover a
 * tall phone at once. Use its registered aerial pitch there, with the exact
 * same stadium and match. Extremely short viewports need that camera too. */
export function cameraInternaDaPartida(internalAvailable:boolean,dimensions:DimensoesVista){
 if(!internalAvailable||dimensions.width<dimensions.height)return false
 const {width,height,world}=dimensions
 const xs=CAMPO_INTERNO.map(point=>point[0]),ys=CAMPO_INTERNO.map(point=>point[1])
 const pitchWidth=(Math.max(...xs)-Math.min(...xs))/1536*world.width,pitchHeight=(Math.max(...ys)-Math.min(...ys))/1024*world.height
 return pitchWidth*1.14<=width&&pitchHeight*1.18<=height
}
