export type RotuloProjetado={id:string;x:number;y:number;z:number;distance:number;label:string}
/** Screen-space labels stay readable without competing with the map controls.
 * This only arranges presentation; it never moves a building or a camera. */
export function distribuirRotulosMapa(points:readonly RotuloProjetado[],width:number,height:number){
 const mobile=width<600,used:{x:number;y:number;w:number;h:number}[]=[],result:{id:string;left:number;top:number}[]=[]
 for(const p of points){
  if(![p.x,p.y,p.z,p.distance].every(Number.isFinite)||p.z < -1||p.z>1||p.distance<95)continue
  const w=Math.min(mobile?124:150,Math.max(74,p.label.length*7+20)),h=44,x=(p.x+1)*width/2,y=(1-p.y)*height/2
  if(x-w/2<8||x+w/2>width-8||y-h/2<96||y+h/2>height-64)continue
  if(x+w/2>width-90&&y+h/2>height-320)continue
  if(used.some(b=>Math.abs(x-b.x)<(w+b.w)/2+8&&Math.abs(y-b.y)<(h+b.h)/2+6))continue
  used.push({x,y,w,h});result.push({id:p.id,left:Math.round(x),top:Math.round(y)})
  if(result.length>=(mobile?4:7))break
 }
 return result
}
