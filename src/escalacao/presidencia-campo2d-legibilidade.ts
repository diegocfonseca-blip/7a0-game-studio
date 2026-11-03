import type {MarcadorCampo2D} from './campo2d-marcador'
export type RotuloCampo2D={key:string;x:number;y:number;halfWidth:number;halfHeight:number;priority:number}
/** Choose readable names only. Never adjusts a player's position. */
export function escolherRotulosCampo2D(candidates:readonly RotuloCampo2D[],previous:ReadonlySet<string>,limit=4,obstacles:readonly RotuloCampo2D[]=[]){
 const chosen:RotuloCampo2D[]=[]
 const sorted=[...candidates].sort((a,b)=>(a.priority-(previous.has(a.key)?5:0))-(b.priority-(previous.has(b.key)?5:0))||a.key.localeCompare(b.key))
 for(const p of sorted){
  if(![p.x,p.y,p.halfWidth,p.halfHeight,p.priority].every(Number.isFinite)||p.halfWidth<=0||p.halfHeight<.009)continue
  if(Math.abs(p.x)+p.halfWidth>.96||p.y+p.halfHeight>.60||p.y-p.halfHeight<-.86)continue
  if(obstacles.some(q=>q.key!==p.key&&Math.abs(p.x-q.x)<p.halfWidth+q.halfWidth+.008&&Math.abs(p.y-q.y)<p.halfHeight+q.halfHeight+.008))continue
  if(chosen.some(q=>Math.abs(p.x-q.x)<p.halfWidth+q.halfWidth+.018&&Math.abs(p.y-q.y)<p.halfHeight+q.halfHeight+.018))continue
  chosen.push(p);if(chosen.length>=limit)break
 }
 return new Set(chosen.map(p=>p.key))
}
const INK='#0C0C0C'
export function arteMarcadorMapa(m:MarcadorCampo2D){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128
 const g=canvas.getContext('2d')!,im=m.portrait,portrait=!!(im?.complete&&im.naturalWidth)
 g.save();g.beginPath();g.arc(64,64,54,0,Math.PI*2);g.clip();g.fillStyle=m.referee?'#FFC400':m.color;g.fillRect(0,0,128,128)
 if(portrait){g.fillStyle='#f4ecd6';g.fillRect(0,0,128,128);g.drawImage(im!,im!.naturalWidth*.29,im!.naturalHeight*.02,im!.naturalWidth*.42,im!.naturalWidth*.42,10,10,108,108)}
 else{
  const c=document.createElement('canvas').getContext('2d')!;c.fillStyle=m.color;c.fillRect(0,0,1,1);const rgb=c.getImageData(0,0,1,1).data
  g.fillStyle=m.referee||rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>160?INK:'#fff';g.textAlign='center';g.textBaseline='middle';g.font='800 58px Oswald, Arial, sans-serif';g.fillText(m.referee?'J':m.number,64,68)
 }
 g.restore();g.beginPath();g.arc(64,64,55,0,Math.PI*2);g.lineWidth=7;g.strokeStyle=INK;g.stroke()
 if(portrait){g.beginPath();g.arc(64,64,59,0,Math.PI*2);g.lineWidth=4;g.strokeStyle=m.color;g.stroke();g.beginPath();g.arc(64,64,62,0,Math.PI*2);g.lineWidth=2;g.strokeStyle='#fff';g.stroke()}
 return canvas
}
export function arteNomeMapa(name:string){
 const canvas=document.createElement('canvas'),g=canvas.getContext('2d')!,text=name.length>20?name.split(' ').slice(-2).join(' '):name
 g.font='700 36px Oswald, Arial, sans-serif';canvas.width=Math.min(512,Math.ceil(g.measureText(text).width+30));canvas.height=64
 g.font='700 36px Oswald, Arial, sans-serif';g.fillStyle='#0c0c0cdd';g.beginPath();g.roundRect(1,5,canvas.width-2,54,8);g.fill();g.fillStyle='#fffaf0';g.textAlign='center';g.textBaseline='middle';g.fillText(text,canvas.width/2,33,canvas.width-22)
 return canvas
}
