import * as T from 'three'
import {LOGOS_PATROCINADORES_CIDADE,type PatrocinadorCidadeId} from './presidencia-patrocinadores-planta'

/** Existing official art, preserving alpha and aspect. Keep GPU dimensions
 * fixed while loading: immutable WebGL storage cannot grow from 1px to a logo. */
export function texturaLogoPatrocinador(id:PatrocinadorCidadeId,onReady?:()=>void){
 const art=LOGOS_PATROCINADORES_CIDADE[id],color=new T.Color(art.background).convertLinearToSRGB(),rgba=new Uint8Array([Math.round(color.r*255),Math.round(color.g*255),Math.round(color.b*255),255])
 if(typeof document==='undefined'){const map=new T.DataTexture(rgba,1,1);map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;map.userData.officialLogo=art.src;return map}
 const canvas=document.createElement('canvas');canvas.width=art.width;canvas.height=art.height
 const g=canvas.getContext('2d')!;g.fillStyle=art.background;g.fillRect(0,0,canvas.width,canvas.height)
 const map=new T.CanvasTexture(canvas)
 let disposed=false
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.userData.officialLogo=art.src
 map.addEventListener('dispose',()=>{disposed=true})
 new T.ImageLoader().load(art.src,image=>{
  if(disposed)return
  g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(image,0,0,canvas.width,canvas.height)
  map.userData.loaded=true;map.needsUpdate=true;onReady?.()
 },undefined,()=>{if(!disposed){map.userData.loadFailed=true;onReady?.()}})
 return map
}
