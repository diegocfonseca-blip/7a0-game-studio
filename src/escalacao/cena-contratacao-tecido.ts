import type {UniformeApresentacao} from './cena-contratacao-uniformes'
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
const frac=(n:number)=>n-Math.floor(n)
/** Material on the original illustrated fabric, prepared once per presentation.
 * Colours preserve the source folds, rather than multiplying flat rectangles
 * into near-black bands. Hands, polo, outline and transparent pixels stay intact. */
export function pintarTecido(ctx:CanvasRenderingContext2D,k:UniformeApresentacao){
 const w=ctx.canvas.width,h=ctx.canvas.height,pixels=ctx.getImageData(0,0,w,h),p=pixels.data
 const mask=document.createElement('canvas');mask.width=w;mask.height=h
 const mc=mask.getContext('2d');if(!mc)throw Error('Canvas indisponível')
 const silhouette=mc.createImageData(w,h),m=silhouette.data
 const primary=rgb(k.corpo),secondary=rgb(k.detalhe),sleeve=rgb(k.mangas),collar=rgb(k.gola),third=k.terceira?rgb(k.terceira):undefined
 const allowed=new Uint8Array(w*h),queue=new Int32Array(w*h)
 for(let py=Math.floor(h*340/1280);py<Math.min(h,Math.ceil(h*1110/1280));py++)for(let px=Math.floor(w*295/1280);px<Math.min(w,Math.ceil(w*970/1280));px++){
  const at=py*w+px,i=at*4,value=(p[i]+p[i+1]+p[i+2])/3
  if(p[i+3]>=32&&value>=92&&Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])<=48)allowed[at]=1
 }
 let count=0
 for(const [sx,sy] of [[625,650],[370,620],[892,620],[625,420],[625,1082]]){
  const at=Math.round(sy*h/1280)*w+Math.round(sx*w/1280)
  if(allowed[at]===1){allowed[at]=2;queue[count++]=at}
 }
 const visit=(next:number)=>{if(next>=0&&next<w*h&&allowed[next]===1){allowed[next]=2;queue[count++]=next}}
 for(let head=0;head<count;head++){
  const at=queue[head],x=at%w
  visit(at-w);visit(at+w);if(x>0)visit(at-1);if(x<w-1)visit(at+1)
 }
 for(let n=0;n<count;n++){
  const at=queue[n],px=at%w,py=Math.floor(at/w),i=at*4
  const value=(p[i]+p[i+1]+p[i+2])/3
  const x=px*1280/w,y=py*1280/h,light=value/238
  const fold=Math.sin((x-625)/85)*7*(y-350)/750
  const v=(y-350+fold)/745
  const u=(x-625+Math.sin(y/160)*5)/(440+(y-350)*.055)+.5
  let color=primary
  if(k.tipo==='listras_h'||k.tipo==='listras_v'){
   const band=frac((k.tipo==='listras_h'?v:u)*k.n)
   color=band<k.largura?secondary:primary
   if(third&&(band<.055||Math.abs(band-k.largura)<.04))color=third
  }else if(k.tipo==='faixa'){
   if(Math.abs(u-(1.12-v))<k.largura/2)color=secondary
  }else if(k.tipo==='central'){
   if(Math.abs(u-.5)<.19)color=secondary
   if(third&&Math.abs(Math.abs(u-.5)-.19)<.025)color=third
  }else if(k.tipo==='peito'||k.tipo==='peito_duplo'){
   if(v>.25&&v<.40)color=secondary
   if(k.tipo==='peito_duplo'&&v>=.40&&v<.55)color=third??secondary
  }else if(k.tipo==='metade'&&u>.5)color=secondary
  if(y<705&&(x<452-(y-500)*.075||x>814+(y-500)*.075))color=sleeve
  if(y<430&&x>520&&x<746)color=collar
  const diffuse=.35+.65*Math.min(1.08,light),shine=35*Math.pow(Math.max(0,light-.55),1.7)
  for(let c=0;c<3;c++)p[i+c]=Math.min(255,Math.round(color[c]*diffuse+shine))
  m[i]=m[i+1]=m[i+2]=255;m[i+3]=p[i+3]
 }
 ctx.putImageData(pixels,0,0);mc.putImageData(silhouette,0,0)
 return mask
}
