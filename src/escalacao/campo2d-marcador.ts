export type MarcadorCampo2D={name:string;color:string;number:string;portrait:HTMLImageElement|null;owned:boolean;step?:number;referee?:boolean}
const INK='#0C0C0C',font=(px:number,weight=700)=>`${weight} ${Math.round(px)}px Oswald, "Arial Narrow", Arial, sans-serif`
/** The same inexpensive 2D artwork on the existing canvas and on map markers. */
export function desenharMarcadorCampo2D(cx:CanvasRenderingContext2D,X:number,Y:number,R:number,m:MarcadorCampo2D){
 const camisa=m.color,n=parseInt((camisa||'#888888').replace('#','').slice(0,6).padEnd(6,'8'),16),tinta=((n>>16)&255)*.299+((n>>8)&255)*.587+(n&255)*.114>160?INK:'#fff',im=m.portrait,temRosto=!!(im?.complete&&im.naturalWidth),passo=m.step??0
 cx.beginPath();cx.ellipse(X,Y+R-2,R*.9,3.5,0,0,7);cx.fillStyle='rgba(0,0,0,.25)';cx.fill()
 cx.fillStyle=INK;cx.beginPath();cx.ellipse(X-R*.4,Y+R-1+passo*1.5,R*.3,R*.18,0,0,7);cx.fill();cx.beginPath();cx.ellipse(X+R*.4,Y+R-1-passo*1.5,R*.3,R*.18,0,0,7);cx.fill()
 cx.save();cx.beginPath();cx.arc(X,Y,R,0,7);cx.closePath();cx.fillStyle=camisa;cx.fill();cx.clip()
 if(temRosto){cx.fillStyle='#fff';cx.fillRect(X-R,Y-R,R*2,R*2);cx.drawImage(im!,im!.naturalWidth*.29,im!.naturalHeight*.02,im!.naturalWidth*.42,im!.naturalWidth*.42,X-R,Y-R,R*2,R*2)}
 else{cx.fillStyle='rgba(0,0,0,.22)';cx.fillRect(X-R,Y-R,R*2,R*.48);cx.fillStyle=m.referee?'#FFE600':tinta;cx.font=font(R*1.05,800);cx.textAlign='center';cx.fillText(m.number,X,Y+R*.42)}
 cx.restore();cx.beginPath();cx.arc(X,Y,R,0,7);cx.lineWidth=temRosto?3.5:2;cx.strokeStyle=m.referee?'#FFE600':temRosto?camisa:INK;cx.stroke()
 if(temRosto){cx.beginPath();cx.arc(X,Y,R+2.2,0,7);cx.lineWidth=1.5;cx.strokeStyle='#fff';cx.stroke()}
 if(m.owned){cx.beginPath();cx.arc(X,Y,R+3.5,0,7);cx.lineWidth=2;cx.strokeStyle='rgba(255,255,255,.95)';cx.setLineDash([4,3]);cx.stroke();cx.setLineDash([]);cx.fillStyle='#fff';cx.beginPath();cx.moveTo(X,Y-R-7);cx.lineTo(X-5,Y-R-14);cx.lineTo(X+5,Y-R-14);cx.closePath();cx.fill()}
 if(m.name)desenharNomeCampo2D(cx,X,Y,R,m.name)
}
/** A faixinha do nome embaixo do boneco. Separada pra poder ser desenhada DEPOIS de todos os bonecos (aí ninguém tampa o nome). */
export function desenharNomeCampo2D(cx:CanvasRenderingContext2D,X:number,Y:number,R:number,name:string){
 const nm=name.length>13?name.split(' ').slice(-1)[0]:name;cx.font=font(Math.max(8,R*.72));const w=cx.measureText(nm).width+6;cx.fillStyle='rgba(0,0,0,.6)';cx.fillRect(X-w/2,Y+R+1,w,R*.95);cx.fillStyle='#fff';cx.textAlign='center';cx.fillText(nm,X,Y+R+R*.78)
}
