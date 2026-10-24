import {RAIO_BOLA_FUTEBOL_3D as R,type PontoRotacaoBola} from './presidencia-bola-rotacao'
export type ImpactoRede3D={sign:number;time:number;y:number;z:number;strength:number}
type Gol={t:number}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
/** Presentation AFTER an official goal only. Never changes source XYZ/events.
 * Fit the confirmed goal to the real net, rebound, gravity and a short bounce. */
export class GolApresentacao3D{
 private previous:PontoRotacaoBola|undefined
 private previousTime=0
 private finish:{goal:number;start:number;sign:number;point:PontoRotacaoBola;speed:number;vy:number;vz:number;delay:number;travel:number}|undefined
 sample(point:PontoRotacaoBola,time:number,goal:Gol|undefined,commit=false){
  let f=goal&&this.finish?.goal===goal.t?this.finish:undefined
  if(goal&&!f){const dt=time-this.previousTime,p=this.previous,sign=point.x<0?-1:1,speed=clamp(p&&dt>0?(point.x-p.x)*sign/dt:10,4,28),vy=clamp(p&&dt>0?(point.y-p.y)/dt:0,-8,1),delay=point.y>2.30?.075:0;
   const entryX=delay?Math.min(Math.abs(point.x),52.34):Math.abs(point.x)
   const vz=p&&dt>0?(point.z-p.z)/dt:0
   f={goal:goal.t,start:time,sign,point:{...point},speed,vy,vz,delay,travel:clamp((54.5-R-entryX)/speed,.08,.65)}
  }
  if(commit){this.finish=f;this.previous={...point};this.previousTime=time}
  if(!f)return{position:point,impact:undefined}
  const elapsed=Math.max(0,time-f.start),entryX=f.delay?Math.min(Math.abs(f.point.x),52.34):Math.abs(f.point.x),entryY=Math.min(f.point.y,2.30),z=clamp(f.point.z+f.vz*(Math.min(elapsed,f.delay+f.travel)+.15*(1-Math.exp(-3*Math.max(0,elapsed-f.delay-f.travel)))),-3.50,3.50),smooth=(u:number)=>u*u*(3-2*u)
  let x:number,y:number
  const height=(t:number)=>{const fall=(f.vy+Math.sqrt(f.vy*f.vy+19.62*Math.max(0,entryY-R)))/9.81;if(t<=fall)return Math.max(R,entryY+f.vy*t-4.905*t*t);const v=Math.abs(f.vy-9.81*fall)*.22,s=t-fall;return s<2*v/9.81?R+v*s-4.905*s*s:R}
  if(elapsed<f.delay){const u=smooth(elapsed/f.delay);x=Math.abs(f.point.x)+(entryX-Math.abs(f.point.x))*u;y=f.point.y+(entryY-f.point.y)*u}
  else{const t=elapsed-f.delay;if(t<=f.travel){x=entryX+(54.5-R-entryX)*t/f.travel}else{x=54.5-R-Math.min(.68,Math.max(.5,f.speed*.12)*(t-f.travel))}y=height(t)}
  return{position:{x:f.sign*x,y:Math.max(R,y),z,held:false},impact:{sign:f.sign,time:f.start+f.delay+f.travel,y:height(f.travel),z:clamp(f.point.z+f.vz*(f.delay+f.travel),-3.50,3.50),strength:clamp(f.speed/22,.25,1)} satisfies ImpactoRede3D}
 }
}
