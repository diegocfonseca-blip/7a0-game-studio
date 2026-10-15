import {faixaTransporteComplexo} from './presidencia-complexo-transporte-model'
import type {PontoComplexo} from './presidencia-complexo-model'
import type {RuaComplexo} from './presidencia-complexo-ruas'

type Passeio={id:string;polygon:readonly PontoComplexo[]}
export type TravessiaComplexo={id:string;roadId:string;pedestrianIds:string[];width:number;points:(PontoComplexo&{y:number})[];polygon:PontoComplexo[]}
const inside=(p:PontoComplexo,poly:readonly PontoComplexo[])=>{
 let result=false
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j]
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result
 }
 return result
}
const intersection=(a:PontoComplexo,b:PontoComplexo,c:PontoComplexo,d:PontoComplexo)=>{
 const rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z,den=rx*sz-rz*sx
 if(Math.abs(den)<1e-8)return undefined
 const t=((c.x-a.x)*sz-(c.z-a.z)*sx)/den,u=((c.x-a.x)*rz-(c.z-a.z)*rx)/den
 return t>=0&&t<=1&&u>=0&&u<=1?{x:a.x+t*rx,z:a.z+t*rz}:undefined
}

/** Raised pedestrian tables are confined to internal/access roads. The public
 * animated lanes remain at zero; existing walking routes keep their 16 cm floor.
 * Two 2.2 m asphalt ramps reach the table without introducing a vertical kerb. */
export function planejarTravessiasComplexo(roads:readonly RuaComplexo[],walks:readonly Passeio[]){
 const crossings:TravessiaComplexo[]=[]
 for(const road of roads){
  if(!road.id.startsWith('rua-interna-')&&!road.id.startsWith('ligacao-viaria-'))continue
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z)
   if(length<.01)continue
   const dx=(b.x-a.x)/length,dz=(b.z-a.z)/length
   const footprint=faixaTransporteComplexo([a,b],road.width)
   const intervals:{from:number;to:number;ids:string[]}[]=[]
   for(const walk of walks){
    const vertices=[...footprint.filter(p=>inside(p,walk.polygon)),...walk.polygon.filter(p=>inside(p,footprint))]
    footprint.forEach((p,j)=>walk.polygon.forEach((q,k)=>{
     const cross=intersection(p,footprint[(j+1)%footprint.length],q,walk.polygon[(k+1)%walk.polygon.length]);if(cross)vertices.push(cross)
    }))
    if(vertices.length<3)continue
    const positions=vertices.map(p=>(p.x-a.x)*dx+(p.z-a.z)*dz)
    intervals.push({from:Math.max(0,Math.min(...positions)-.08),to:Math.min(length,Math.max(...positions)+.08),ids:[walk.id]})
   }
   intervals.sort((x,y)=>x.from-y.from)
   const merged:typeof intervals=[]
   for(const item of intervals){
    const previous=merged.at(-1)
    if(previous&&item.from-previous.to<4.4){previous.to=Math.max(previous.to,item.to);previous.ids.push(...item.ids)}else merged.push({...item})
   }
   for(const span of merged){
    // A table may continue over the end of a segment. Its ramp still has the
    // full length; validation checks it against the actual adjoining surfaces.
    const points=[{d:span.from-2.2,y:0},{d:span.from,y:.16},{d:span.to,y:.16},{d:span.to+2.2,y:0}].map(({d,y})=>({x:a.x+dx*d,z:a.z+dz*d,y}))
    crossings.push({id:`travessia-${crossings.length+1}`,roadId:road.id,pedestrianIds:[...new Set(span.ids)],width:road.width,points,polygon:faixaTransporteComplexo(points,road.width)})
   }
  }
 }
 return crossings
}
