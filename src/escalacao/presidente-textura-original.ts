import type {PresidenteBaseSave} from './presidencia-carreira'
import {camadasDoPresidente} from './presidente-aparencia'
import {PRESIDENTE_RIG,montarPresidenteLayers,type PresidenteLayer} from './presidente-rig'
import {camadasNaPose,type PresidentePose} from './presidente-pose'
import {aplicarTomPele} from './presidente-pele'

export type LimitesPresidenteOriginal={left:number;top:number;right:number;bottom:number}
export type TexturaPresidenteOriginal={
 canvas:HTMLCanvasElement
 layers:readonly PresidenteLayer[]
 bounds:LimitesPresidenteOriginal
 baseBounds:LimitesPresidenteOriginal
}

/** The same catalogue, ordering and pose transforms used by PresidenteCamadas.
 * This does not select a replacement outfit or grant access to a saved item. */
export function planoPresidenteOriginal(president:PresidenteBaseSave,pose:PresidentePose):readonly PresidenteLayer[]{
 if(pose!=='standing'&&pose!=='seated')throw Error('Pose do presidente inválida.')
 const result=montarPresidenteLayers(camadasDoPresidente(president))
 if(!result.ok)throw Error('Não foi possível montar o visual original do presidente.')
 return camadasNaPose(result.layers,pose)
}

/** Exclusive right/bottom edges in rig pixels. Ignore faint alpha dust and
 * isolated pixels, without cropping or moving the catalogue's actual layers. */
export function limitesPresidenteOriginal(pixels:Uint8ClampedArray,width:number,height:number):LimitesPresidenteOriginal{
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||pixels.length!==width*height*4)throw Error('Imagem do presidente inválida.')
 const rows=new Uint32Array(height),columns=new Uint32Array(width)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=40){rows[y]++;columns[x]++}
 let left=width,top=height,right=0,bottom=0
 for(let x=0;x<width;x++)if(columns[x]>=3){left=Math.min(left,x);right=x+1}
 for(let y=0;y<height;y++)if(rows[y]>=3){top=Math.min(top,y);bottom=y+1}
 if(right<=left||bottom<=top)throw Error('A arte original do presidente está vazia.')
 return {left,top,right,bottom}
}

function verificarCancelamento(signal:AbortSignal){
 if(signal.aborted)throw signal.reason??new DOMException('Carregamento do presidente cancelado.','AbortError')
}

function carregarImagem(src:string,signal:AbortSignal):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(signal.reason??new DOMException('Carregamento do presidente cancelado.','AbortError'));return}
  const image=new Image()
  image.decoding='async'
  let settled=false,timeout:ReturnType<typeof setTimeout>|undefined
  const cleanup=()=>{if(timeout!==undefined)clearTimeout(timeout);timeout=undefined;image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort)}
  const succeed=()=>{if(settled)return;settled=true;cleanup();resolve(image)}
  const fail=(error:unknown)=>{if(settled)return;settled=true;cleanup();image.removeAttribute('src');reject(error)}
  const abort=()=>fail(signal.reason??new DOMException('Carregamento do presidente cancelado.','AbortError'))
  image.onload=succeed
  image.onerror=()=>fail(Error('Uma camada original do presidente não carregou.'))
  signal.addEventListener('abort',abort,{once:true})
  timeout=setTimeout(()=>{
   // A heavy scene can delay the already-loaded image's onload task behind
   // this timer. Check the real resource before reporting a failed download.
   // Exact catalogue dimensions are still validated before any composition.
   if(image.complete&&image.naturalWidth>0&&image.naturalHeight>0)succeed()
   else fail(Error('O visual original do presidente demorou demais para carregar.'))
  },15000)
  try{image.src=import.meta.env.BASE_URL+src}catch(error){fail(error)}
 })
}

function criarCanvas(width:number,height:number){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
 const context=canvas.getContext('2d',{willReadFrequently:true})
 if(!context)throw Error('Não foi possível preparar a arte original do presidente.')
 context.imageSmoothingEnabled=true
 return {canvas,context}
}

/** Compose the selected original artwork, including its native skin mask, into
 * one transparent texture. Downloads belong to this call: retries and another
 * president never inherit a rejected request or a cancelled shared promise. */
export async function comporPresidenteOriginal(president:PresidenteBaseSave,pose:PresidentePose,options:{signal?:AbortSignal}={}):Promise<TexturaPresidenteOriginal>{
 const controller=new AbortController(),signal=controller.signal
 const cancel=()=>controller.abort(options.signal?.reason??new DOMException('Carregamento do presidente cancelado.','AbortError'))
 if(options.signal?.aborted)cancel()
 else options.signal?.addEventListener('abort',cancel,{once:true})
 let finalCanvas:HTMLCanvasElement|undefined,baseCanvas:HTMLCanvasElement|undefined,complete=false
 try{
  verificarCancelamento(signal)
  const layers=planoPresidenteOriginal(president,pose)
  if(typeof document==='undefined'||typeof Image==='undefined')throw Error('A arte original do presidente precisa de um navegador.')
  const downloads=new Map<string,Promise<HTMLImageElement>>()
  const images=await Promise.all(layers.map(layer=>{
   if(!downloads.has(layer.src))downloads.set(layer.src,carregarImagem(layer.src,signal))
   return downloads.get(layer.src)!
  }))
  verificarCancelamento(signal)
  for(let i=0;i<layers.length;i++){
   const image=images[i],layer=layers[i]
   if(image.naturalWidth!==layer.raster.width||image.naturalHeight!==layer.raster.height)throw Error('Uma camada original do presidente tem dimensões incompatíveis.')
  }
  const final=criarCanvas(PRESIDENTE_RIG.width,PRESIDENTE_RIG.height)
  finalCanvas=final.canvas
  let baseBounds:LimitesPresidenteOriginal|undefined
  for(let i=0;i<layers.length;i++){
   verificarCancelamento(signal)
   const layer=layers[i],image=images[i],b=layer.bounds
   let source:CanvasImageSource=image,skinCanvas:HTMLCanvasElement|undefined
   try{
    if(layer.skinTone){
     if(!layer.outfit||layer.kind!=='base')throw Error('A camada de pele do presidente é incompatível.')
     const skin=criarCanvas(layer.raster.width,layer.raster.height);skinCanvas=skin.canvas
     skin.context.drawImage(image,0,0)
     const pixels=skin.context.getImageData(0,0,skin.canvas.width,skin.canvas.height)
     aplicarTomPele(pixels.data,skin.canvas.width,skin.canvas.height,layer.skinTone,layer.outfit,pose==='seated')
     skin.context.putImageData(pixels,0,0);source=skin.canvas
    }
    // Do not round fractional seated accessory coordinates or normalize each
    // piece independently: those positions are part of the approved rig.
    final.context.drawImage(source,b.x,b.y,b.width,b.height)
    if(layer.kind==='base'){
     const base=criarCanvas(PRESIDENTE_RIG.width,PRESIDENTE_RIG.height);baseCanvas=base.canvas
     base.context.drawImage(source,b.x,b.y,b.width,b.height)
     baseBounds=limitesPresidenteOriginal(base.context.getImageData(0,0,base.canvas.width,base.canvas.height).data,base.canvas.width,base.canvas.height)
    }
   }finally{if(skinCanvas){skinCanvas.width=0;skinCanvas.height=0}}
  }
  verificarCancelamento(signal)
  if(!baseBounds)throw Error('O visual original do presidente não tem uma base válida.')
  const bounds=limitesPresidenteOriginal(final.context.getImageData(0,0,final.canvas.width,final.canvas.height).data,final.canvas.width,final.canvas.height)
  complete=true
  return {canvas:final.canvas,layers,bounds,baseBounds}
 }catch(error){
  // Also stop sibling downloads when one source fails. The next invocation
  // starts clean, so an image becoming available can be retried normally.
  controller.abort(error)
  throw error
 }finally{
  options.signal?.removeEventListener('abort',cancel)
  if(baseCanvas){baseCanvas.width=0;baseCanvas.height=0}
  if(!complete&&finalCanvas){finalCanvas.width=0;finalCanvas.height=0}
 }
}
