import {escudoDe,nomeLimpo} from './escudos'
import {kitDoTime} from './camisas-2d-dados'
import {camisaSalaoDe,RECORTE_CAMISA} from './salao-camisas'
import {uniformeApresentacao} from './cena-contratacao-uniformes'
import {pintarTecido} from './cena-contratacao-tecido'
import {arteEscudoClube} from './presidencia-sala-identidade-assets'
import {ESCUDOS_OFICIAIS} from './escudos-oficiais'

/** The buyer is separate from the historical card identity. Use the same public
 * crest, shop artwork and kit palette already used by this career's club. */
export function camisaApresentada(destino:string){
 const nome=nomeLimpo(destino),base=escudoDe(nome),cores=kitDoTime(nome,base.c1)
 const arquivo=camisaSalaoDe(nome)
 return {nome,uniforme:uniformeApresentacao(nome,[cores[0],cores[1]??base.c2]),
  arte:arquivo?import.meta.env.BASE_URL+'mantos-salao/'+arquivo:undefined,
  recorte:RECORTE_CAMISA[nome],escudo:!arquivo&&ESCUDOS_OFICIAIS[nome]?import.meta.env.BASE_URL+ESCUDOS_OFICIAIS[nome].src:arteEscudoClube(nome)}
}
export type CamisaApresentada=ReturnType<typeof camisaApresentada>

// Neutral held garment in the modular body artwork (original 1280 coordinates).
// The outline follows the fingers, leaving the hands and the player's own head
// outside the paint mask. Prepared ONCE, never pixel processing on the RAF loop.
function contorno(ctx:CanvasRenderingContext2D){
 ctx.beginPath();ctx.moveTo(490,365);ctx.lineTo(544,347);ctx.quadraticCurveTo(635,373,720,347);ctx.lineTo(778,365)
 ctx.bezierCurveTo(763,382,775,404,788,416);ctx.bezierCurveTo(786,437,812,452,836,458)
 ctx.lineTo(875,550);ctx.lineTo(943,644);ctx.quadraticCurveTo(906,676,854,698);ctx.lineTo(852,1087)
 ctx.quadraticCurveTo(620,1101,386,1087);ctx.lineTo(402,698);ctx.quadraticCurveTo(344,684,303,647)
 ctx.lineTo(350,536);ctx.lineTo(400,459);ctx.bezierCurveTo(432,466,451,438,458,417);ctx.quadraticCurveTo(485,404,490,365);ctx.closePath()
}
export function corpoApresentacao(body:HTMLImageElement,camisa:CamisaApresentada,art?:HTMLImageElement,crest?:HTMLImageElement,portrait?:HTMLImageElement){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=768
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível')
 ctx.scale(.6,.6);ctx.drawImage(body,0,0,1280,1280)
 // Neutral puppet hands follow THIS avatar's complexion. Only warm skin pixels
 // are tinted, before any club artwork is painted; hair/face/kit stay untouched.
 if(portrait){
  const sample=document.createElement('canvas');sample.width=sample.height=8
  const sc=sample.getContext('2d');if(sc){
   sc.drawImage(portrait,portrait.naturalWidth*.48,portrait.naturalHeight*.25,portrait.naturalWidth*.04,portrait.naturalHeight*.04,0,0,8,8)
   const target=sc.getImageData(4,4,1,1).data,source=ctx.getImageData(264,234,1,1).data
   if(target[3]>200&&target[0]>target[1]&&target[1]>target[2]&&source[3]>200){
    const pixels=ctx.getImageData(0,0,768,768),p=pixels.data
    for(let i=0;i<p.length;i+=4)if(p[i+3]>40&&p[i]>80&&p[i]>p[i+1]*1.15&&p[i+1]>p[i+2]*1.35){
     for(let c=0;c<3;c++)p[i+c]=Math.min(255,p[i+c]*target[c]/Math.max(1,source[c]))
    }
    ctx.putImageData(pixels,0,0)
   }
  }
 }
 const k=camisa.uniforme
 let fabricMask:HTMLCanvasElement|undefined
 if(art){
  // Keep approved custom club artwork on its existing path.
  ctx.save();contorno(ctx);ctx.clip();ctx.globalCompositeOperation='multiply';ctx.fillStyle=k.corpo;ctx.fillRect(290,340,670,750);ctx.globalCompositeOperation='source-over'
  const cut=camisa.recorte
  ctx.drawImage(art,0,0,art.naturalWidth,cut?art.naturalHeight*cut[2]/cut[1]:art.naturalHeight,303,347,640,730)
  ctx.restore()
 }else{
  fabricMask=pintarTecido(ctx,k)
  ctx.save();contorno(ctx);ctx.clip()
  ctx.strokeStyle=k.gola;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(544,352);ctx.quadraticCurveTo(635,463,720,352);ctx.stroke()
  if(crest){
   const badge=camisa.nome==='Flamengo'?monogramaFlamengo(crest):crest
   const h=85,w=h*(badge instanceof HTMLImageElement?badge.naturalWidth/badge.naturalHeight:badge.width/badge.height)
   ctx.drawImage(badge,744-w/2,478,w,h)
  }
  ctx.restore()
 }
 const garment=document.createElement('canvas');garment.width=garment.height=768
 const g=garment.getContext('2d');if(!g)throw Error('Canvas indisponível')
 if(fabricMask){g.drawImage(canvas,0,0);g.globalCompositeOperation='destination-in';g.drawImage(fabricMask,0,0)}
 else{g.scale(.6,.6);contorno(g);g.clip();g.drawImage(canvas,0,0,1280,1280)}
 return {body:canvas,garment}
}

/** The shirt uses the white CRF, taken from the same official shield asset.
 * Preserve its actual letterforms instead of drawing a replacement logo. */
function monogramaFlamengo(crest:HTMLImageElement){
 const c=document.createElement('canvas');c.width=c.height=128
 const x=c.getContext('2d');if(!x)return crest
 x.drawImage(crest,0,0,crest.naturalWidth*.5,crest.naturalHeight*.4,0,0,128,128)
 const pixels=x.getImageData(0,0,128,128),p=pixels.data
 for(let i=0;i<p.length;i+=4){
  const lo=Math.min(p[i],p[i+1],p[i+2]),hi=Math.max(p[i],p[i+1],p[i+2])
  p[i+3]=hi-lo<48?Math.round(p[i+3]*Math.max(0,Math.min(1,(lo-100)/120))):0
  p[i]=244;p[i+1]=241;p[i+2]=232
 }
 x.putImageData(pixels,0,0);return c
}
