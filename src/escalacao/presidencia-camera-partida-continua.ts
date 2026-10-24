import {MathUtils,Vector3,type PerspectiveCamera} from 'three'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {enquadramentoFutebol,type AlvoCameraFutebol} from './presidencia-enquadramento-futebol'
export type CameraPartidaContinua='free'|'broadcast'|'tactical'
/** One camera in one world. This controller never receives the match engine. */
export function criarCameraPartidaContinua(camera:PerspectiveCamera,controls:OrbitControls,onMode:(mode:CameraPartidaContinua)=>void){
 let mode:CameraPartidaContinua='free',returning=false,last:number|undefined,moving=false
 let saved:{position:Vector3;target:Vector3}|undefined,framing:{x:number;y:number;visible:boolean}|undefined
 const enterFree=(restore=true)=>{mode='free';returning=restore&&!!saved;moving=returning;last=undefined;onMode(mode)}
 return {
  setMode(next:CameraPartidaContinua){if(next===mode)return;if(next!=='free'){if(mode==='free'&&!returning)saved={position:camera.position.clone(),target:controls.target.clone()};mode=next;returning=false;moving=true;last=undefined;onMode(mode)}else enterFree()},
  explore(){enterFree(false)},
  update(ball:{x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}},now:number,subjects:readonly AlvoCameraFutebol[]=[]){
   ball=ball.presentation??ball
   const dt=last===undefined?1/60:MathUtils.clamp((now-last)/1000,0,.1);last=now
   if(mode==='free'&&!returning){moving=false;return}
   const fit=mode!=='free'?enquadramentoFutebol(camera,ball,subjects,mode==='tactical'):null
   const target=fit?.target??saved!.target,position=fit?.position??saved!.position
   moving=camera.position.distanceToSquared(position)>.0001||controls.target.distanceToSquared(target)>.0001
   const amount=1-Math.exp(-dt/.25);camera.position.lerp(position,amount);controls.target.lerp(target,amount)
   camera.lookAt(controls.target);camera.updateMatrixWorld(true)
   const point=new Vector3(ball.x,ball.y,ball.z).project(camera);framing={x:point.x,y:point.y,visible:point.z>-1&&point.z<1&&Math.abs(point.x)<.96&&Math.abs(point.y)<.94}
   if(returning&&camera.position.distanceToSquared(position)<.0001&&controls.target.distanceToSquared(target)<.0001){camera.position.copy(position);controls.target.copy(target);returning=false;moving=false}
  },
  get transitioning(){return returning||moving},
  inspect:()=>({mode,returning,moving,framing,savedFreePosition:saved?.position.toArray(),sameCamera:true,worldScaleUnchanged:true}),
 }
}
