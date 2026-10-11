import type {StadiumSave} from './estadiodata'
import {primeiroAndarConcluido} from './presidencia-estadio-projeto'
export type PontoSolo={x:number;y:number}
export type ObstaculoSolo={id:string;polygon:readonly PontoSolo[]}
const poly=(pairs:readonly (readonly [number,number])[])=>pairs.map(([x,y])=>({x,y}))
/** Volumes no SOLO. Copas e travessas são oclusores, não paredes invisíveis. */
export function obstaculosDoEstadio(st?:StadiumSave):ObstaculoSolo[]{
 if(!st)return []
 const out:ObstaculoSolo[]=[],add=(id:string,pairs:readonly (readonly [number,number])[])=>out.push({id,polygon:poly(pairs)})
 if(primeiroAndarConcluido(st)||['geral','cadeiras','visitante','camarote'].some(k=>(st.inv[k]??0)>0))add('arena',[[388,376],[427,312],[1065,312],[1117,416],[1060,491],[930,565],[910,588],[586,588],[444,497]])
 if(st.ext.includes('hotel'))add('hotel',[[188,512],[320,590],[444,552],[451,569],[327,612],[185,538]])
 if(st.ext.includes('loja'))add('loja',[[1188,397],[1246,382],[1270,427],[1210,448]])
 if(st.ext.includes('chopp'))add('chopp',[[1053,298],[1138,284],[1198,304],[1192,327],[1090,321]])
 if(st.ext.includes('praca'))add('praca',[[986,556],[1120,505],[1241,493],[1289,468],[1284,517],[1183,584],[1095,615],[987,581]])
 if(st.ext.includes('estacao'))add('estacao',[[947,118],[1440,209],[1434,251],[1040,177],[925,231],[912,217]])
 if(st.ext.includes('asfalto')){
  add('fonte',[[695,631],[815,631],[815,671],[695,671]])
  add('canteiro-central',[[730,722],[771,722],[775,826],[729,826]])
  add('canteiro-direito',[[830,632],[853,632],[853,670],[830,670]])
  add('canteiro-esquerdo',[[661,628],[685,628],[685,671],[661,671]])
 }
 return out
}
export function dentroPoligono(p:PontoSolo,polygon:readonly PontoSolo[]):boolean{
 let inside=false
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j]
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside
 }
 return inside
}
function distanciaPontoSegmento(p:PontoSolo,a:PontoSolo,b:PontoSolo){
 const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy
 const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
function cruzam(a:PontoSolo,b:PontoSolo,c:PontoSolo,d:PontoSolo){
 const cross=(p:PontoSolo,q:PontoSolo,r:PontoSolo)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x)
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b)
 return x*y<0&&z*w<0
}
/** Testa o segmento inteiro e o raio do corpo: não pula obstáculos em alta velocidade. */
export function segmentoLivre(a:PontoSolo,b:PontoSolo,obstacles:readonly ObstaculoSolo[],radius=2):boolean{
 if(![a.x,a.y,b.x,b.y,radius].every(Number.isFinite)||radius<0)return false
 return obstacles.every(o=>{
  if(dentroPoligono(a,o.polygon)||dentroPoligono(b,o.polygon))return false
  return o.polygon.every((c,i)=>{
   const d=o.polygon[(i+1)%o.polygon.length]
   if(cruzam(a,b,c,d))return false
   return Math.min(distanciaPontoSegmento(a,c,d),distanciaPontoSegmento(b,c,d),distanciaPontoSegmento(c,a,b),distanciaPontoSegmento(d,a,b))>radius+1e-6
  })
 })
}
/** Recorta no primeiro bloqueio, conservando o caminho seguro. Sem teleporte
 * ou atalho através do edifício. Destino/obra alterados recalculam a rota. */
export function caminhoSeguro(points:readonly PontoSolo[],obstacles:readonly ObstaculoSolo[],radius=2):PontoSolo[]{
 if(!points.length||!segmentoLivre(points[0],points[0],obstacles,radius))return []
 const result=[{...points[0]}]
 for(const b of points.slice(1)){
  const a=result.at(-1)!
  if(segmentoLivre(a,b,obstacles,radius)){result.push({...b});continue}
  let lo=0,hi=1
  for(let n=0;n<40;n++){const t=(lo+hi)/2,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(segmentoLivre(a,p,obstacles,radius))lo=t;else hi=t}
  const t=Math.max(0,lo-1e-4),end={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}
  if(Math.hypot(end.x-a.x,end.y-a.y)>.5)result.push(end)
  break
 }
 return result.length>1?result:[]
}
