/** Continuous planting in physical metres. Every investment moves the boundary;
 * alternating mowing stripes keep their positions as the stadium improves. */
export function faixasGramado3D(progress:number){
 const fraction=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0
 const boundary=-52.5+105*fraction
 const strips:{left:number;width:number;grass:boolean;stripe:number}[]=[]
 for(let i=0;i<20;i++){
  const left=-52.5+i*5.25,right=left+5.25,cut=Math.max(left,Math.min(right,boundary))
  if(cut>left)strips.push({left,width:cut-left,grass:true,stripe:i%2})
  if(cut<right)strips.push({left:cut,width:right-cut,grass:false,stripe:i%2})
 }
 return strips
}
