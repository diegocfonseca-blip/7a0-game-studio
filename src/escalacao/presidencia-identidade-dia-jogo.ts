import * as THREE from 'three'

export type IdentidadeDiaJogo={name:string;color:string;secondaryColor?:string;crest?:string}
/** Bounded to the two current clubs. No account, network API or ownership writes.
 * A missing image leaves the real name/colours visible and never blocks arrivals. */
export function criarArteDiaJogo(info:IdentidadeDiaJogo,kind:'coach'|'flag'|'roof',onChange:()=>void=()=>{}){
 const canvas=document.createElement('canvas');canvas.width=kind==='coach'?1024:512;canvas.height=kind==='coach'?160:kind==='roof'?512:256
 const ctx=canvas.getContext('2d')!,color=new THREE.Color(info.color)
 const ink=color.r*.2126+color.g*.7152+color.b*.0722>.4?'#14201c':'#f4ecd6'
 let disposed=false,crest:HTMLImageElement|undefined,status='loading',image:HTMLImageElement|undefined
 const paint=()=>{
  const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle=info.color;ctx.fillRect(0,0,w,h)
  ctx.fillStyle=info.secondaryColor??ink;ctx.fillRect(0,h*.85,w,h*.075)
  const square=kind==='roof'?h*.70:kind==='flag'?h*.65:h*.78,x=kind==='roof'?(w-square)/2:20,y=kind==='roof'?30:(h-square)/2
  if(crest){ctx.fillStyle='#f4ecd6';ctx.beginPath();ctx.roundRect(x,y,square,square,square*.1);ctx.fill();const fit=Math.min(square*.86/crest.naturalWidth,square*.86/crest.naturalHeight);ctx.drawImage(crest,x+(square-crest.naturalWidth*fit)/2,y+(square-crest.naturalHeight*fit)/2,crest.naturalWidth*fit,crest.naturalHeight*fit)}
  ctx.fillStyle=ink;ctx.textBaseline='middle';ctx.textAlign=kind==='roof'?'center':'left'
  ctx.font=`bold ${kind==='roof'?34:kind==='flag'?32:60}px sans-serif`
  const textX=kind==='roof'?w/2:crest?x+square+22:24,textY=kind==='roof'?h*.86:h*.47
  ctx.fillText(info.name,textX,textY,kind==='roof'?w-28:w-textX-24)
  texture.needsUpdate=true;onChange()
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2
 paint()
 const ready=(async()=>{
  try{
   const url=info.crest??(await import('./presidencia-sala-identidade-assets')).arteEscudoClube(info.name)
   if(disposed)return
   if(!url){status='name-only';return}
   image=new Image();image.crossOrigin='anonymous'
   const loaded=await new Promise<boolean>(resolve=>{image!.onload=()=>resolve(true);image!.onerror=()=>resolve(false);image!.src=url})
   if(disposed)return
   status=loaded?'crest-ready':'crest-unavailable';if(loaded){crest=image;paint()}
  }catch{if(!disposed)status='crest-unavailable'}
 })()
 return{texture,ready,inspect:()=>({name:info.name,color:info.color,status}),dispose(){disposed=true;texture.dispose();if(image){image.onload=image.onerror=null}}}
}
