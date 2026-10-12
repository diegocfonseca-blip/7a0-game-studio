export type Janela3D={left:number;top:number;width:number;height:number}
export const JANELA_3D_INTEIRA:Janela3D={left:0,top:0,width:1,height:1}
/** Visible fraction of the shared world after its CSS pan/zoom transform. */
export function janelaVisivel3D(view:{zoom:number;x:number;y:number},viewport:{width:number;height:number},world:{width:number;height:number}):Janela3D{
 const width=world.width*view.zoom,height=world.height*view.zoom
 if(width<=0||height<=0)return JANELA_3D_INTEIRA
 const x=viewport.width/2+view.x-width/2,y=viewport.height/2+view.y-height/2
 const left=Math.max(0,Math.min(1,-x/width)),top=Math.max(0,Math.min(1,-y/height))
 const right=Math.max(left,Math.min(1,(viewport.width-x)/width)),bottom=Math.max(top,Math.min(1,(viewport.height-y)/height))
 return {left,top,width:Math.max(1e-6,right-left),height:Math.max(1e-6,bottom-top)}
}
/** NDC transform applied AFTER the registered stadium projection. */
export function matrizRecorte3D(crop:Janela3D){
 const {left:l,top:t,width:w,height:h}=crop
 return [1/w,0,0,(1-2*l-w)/w,0,1/h,0,(2*t+h-1)/h,0,0,1,0,0,0,0,1]
}
